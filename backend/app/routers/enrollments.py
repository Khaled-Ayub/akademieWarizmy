# ===========================================
# WARIZMY EDUCATION - Enrollments Router
# ===========================================
# Einschreibungs- und Fortschritts-Endpunkte

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models import (
    User,
    Enrollment,
    LessonProgress,
    Lesson,
    EnrollmentType,
    EnrollmentStatus,
)
from app.routers.auth import get_current_user

router = APIRouter()


# =========================================
# Pydantic Schemas
# =========================================
class LessonProgressUpdate(BaseModel):
    """Schema für Fortschritts-Update"""
    watched_seconds: Optional[int] = None
    completed: Optional[bool] = None


class QuizSubmission(BaseModel):
    """Schema für Quiz-Abgabe"""
    answers: dict  # {question_id: answer_index}


class QuizResult(BaseModel):
    """Schema für Quiz-Ergebnis"""
    score: int
    passed: bool
    correct_answers: int
    total_questions: int


# =========================================
# API Endpunkte
# =========================================
@router.get("/{enrollment_id}")
async def get_enrollment(
    enrollment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Einschreibung Details abrufen.
    """
    result = await db.execute(
        select(Enrollment)
        .where(Enrollment.id == enrollment_id)
        .where(Enrollment.user_id == current_user.id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Einschreibung nicht gefunden"
        )
    
    return {
        "id": str(enrollment.id),
        "course_id": enrollment.course_id,
        "enrollment_type": enrollment.enrollment_type.value,
        "status": enrollment.status.value,
        "started_at": enrollment.started_at.isoformat(),
        "expires_at": enrollment.expires_at.isoformat() if enrollment.expires_at else None,
        "is_active": enrollment.is_active,
    }


@router.delete("/{enrollment_id}")
async def cancel_enrollment(
    enrollment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Einschreibung kündigen (nur für Abos).
    """
    result = await db.execute(
        select(Enrollment)
        .where(Enrollment.id == enrollment_id)
        .where(Enrollment.user_id == current_user.id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Einschreibung nicht gefunden"
        )
    
    if enrollment.enrollment_type != EnrollmentType.SUBSCRIPTION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nur Abonnements können gekündigt werden"
        )
    
    # Status auf gekündigt setzen
    enrollment.status = EnrollmentStatus.CANCELLED
    await db.commit()
    
    # TODO: Stripe/PayPal Abo kündigen
    
    return {"message": "Einschreibung gekündigt"}


@router.post("/progress/lesson/{lesson_id}")
async def update_lesson_progress(
    lesson_id: str,
    progress_data: LessonProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lektions-Fortschritt aktualisieren.
    """
    from uuid import UUID
    
    print(f"[Enrollments] Update lesson progress: user_id={current_user.id}, lesson_id={lesson_id}, data={progress_data}")
    
    # lesson_id in UUID umwandeln
    try:
        lesson_uuid = UUID(lesson_id)
    except ValueError:
        print(f"[Enrollments] Invalid lesson_id format: {lesson_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ungültige Lektions-ID"
        )
    
    # Existierenden Fortschritt suchen oder neuen erstellen
    result = await db.execute(
        select(LessonProgress)
        .where(LessonProgress.user_id == current_user.id)
        .where(LessonProgress.lesson_id == lesson_uuid)
    )
    progress = result.scalar_one_or_none()
    
    if not progress:
        # Überprüfe, ob die Lektion existiert
        lesson_result = await db.execute(
            select(Lesson)
            .where(Lesson.id == lesson_uuid)
        )
        lesson = lesson_result.scalar_one_or_none()
        if not lesson:
            print(f"[Enrollments] Lesson not found: {lesson_uuid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lektion nicht gefunden"
            )
        
        progress = LessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_uuid,
        )
        db.add(progress)
        print(f"[Enrollments] Created new progress entry for lesson {lesson_uuid}")
    
    # Fortschritt aktualisieren
    if progress_data.watched_seconds is not None:
        progress.watched_seconds = progress_data.watched_seconds
    
    if progress_data.completed is not None:
        progress.completed = progress_data.completed
        if progress_data.completed:
            progress.completed_at = datetime.utcnow()
            print(f"[Enrollments] Marked lesson {lesson_uuid} as completed for user {current_user.id}")
    
    await db.commit()
    await db.refresh(progress)
    
    print(f"[Enrollments] Updated progress: completed={progress.completed}, completed_at={progress.completed_at}")
    
    return {
        "lesson_id": str(progress.lesson_id),
        "watched_seconds": progress.watched_seconds,
        "completed": progress.completed,
        "completed_at": progress.completed_at.isoformat() if progress.completed_at else None,
    }


@router.post("/progress/quiz/{lesson_id}", response_model=QuizResult)
async def submit_quiz(
    lesson_id: str,
    submission: QuizSubmission,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Quiz-Antworten einreichen und bewerten.
    
    TODO: Quiz-Daten aus der Datenbank laden und auswerten.
    """
    from uuid import UUID
    
    # lesson_id in UUID umwandeln
    try:
        lesson_uuid = UUID(lesson_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ungültige Lektions-ID"
        )
    
    # TODO: Quiz aus Datenbank laden
    # quiz = await db.get_quiz(lesson_id)
    
    # Dummy-Bewertung für jetzt
    correct_answers = 7
    total_questions = 10
    score = int((correct_answers / total_questions) * 100)
    passed = score >= 70  # 70% zum Bestehen
    
    # Fortschritt aktualisieren
    result = await db.execute(
        select(LessonProgress)
        .where(LessonProgress.user_id == current_user.id)
        .where(LessonProgress.lesson_id == lesson_uuid)
    )
    progress = result.scalar_one_or_none()
    
    if not progress:
        progress = LessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_uuid,
        )
        db.add(progress)
    
    progress.quiz_score = score
    progress.quiz_passed = passed
    
    await db.commit()
    
    return QuizResult(
        score=score,
        passed=passed,
        correct_answers=correct_answers,
        total_questions=total_questions,
    )


@router.get("/progress/course/{course_id}")
async def get_course_progress(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Gesamtfortschritt für einen Kurs abrufen.
    """
    from uuid import UUID
    
    # course_id in UUID umwandeln
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ungültige Kurs-ID"
        )
    
    # LessonProgress über JOIN mit Lesson nach course_id filtern
    result = await db.execute(
        select(LessonProgress)
        .join(Lesson, LessonProgress.lesson_id == Lesson.id)
        .where(LessonProgress.user_id == current_user.id)
        .where(Lesson.course_id == course_uuid)
    )
    progress_list = result.scalars().all()
    
    # Statistiken berechnen
    total_lessons = len(progress_list)
    completed_lessons = sum(1 for p in progress_list if p.completed)
    quizzes_passed = sum(1 for p in progress_list if p.quiz_passed)
    
    return {
        "course_id": course_id,
        "total_lessons_started": total_lessons,
        "completed_lessons": completed_lessons,
        "quizzes_passed": quizzes_passed,
        "completion_percentage": int((completed_lessons / total_lessons * 100)) if total_lessons > 0 else 0,
        "lessons": [
            {
                "lesson_id": str(p.lesson_id),
                "watched_seconds": p.watched_seconds,
                "completed": p.completed,
                "quiz_score": p.quiz_score,
                "quiz_passed": p.quiz_passed,
            }
            for p in progress_list
        ]
    }

