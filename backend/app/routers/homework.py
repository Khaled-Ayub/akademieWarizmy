# ===========================================
# WARIZMY EDUCATION - Homework Router
# ===========================================
# API Endpunkte für Hausaufgaben

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from uuid import UUID
import os

from app.db.session import get_db
from app.models import (
    Homework,
    HomeworkSubmission,
    SubmissionStatus,
    Lesson,
    User,
    UserRole,
)
from app.schemas.homework import (
    HomeworkCreate, HomeworkUpdate, HomeworkResponse,
    HomeworkSubmissionCreate, HomeworkSubmissionUpdate, HomeworkSubmissionResponse,
    HomeworkGradeSchema, HomeworkWithSubmissions, SubmissionFileSchema
)
from app.routers.auth import get_current_user, require_role
from app.services.storage import upload_file, delete_file

router = APIRouter(tags=["homework"])


# =========================================
# Admin: Hausaufgaben verwalten
# =========================================

@router.post("/", response_model=HomeworkResponse, status_code=status.HTTP_201_CREATED)
async def create_homework(
    homework_data: HomeworkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER))
):
    """Neue Hausaufgabe erstellen (Admin)"""
    # Prüfen ob Lektion existiert
    result = await db.execute(select(Lesson).where(Lesson.id == homework_data.lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lektion nicht gefunden")
    
    homework = Homework(
        **homework_data.model_dump()
    )
    db.add(homework)
    await db.commit()
    await db.refresh(homework)
    
    return homework


@router.get("/lesson/{lesson_id}", response_model=List[HomeworkResponse])
async def get_homework_by_lesson(
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Alle Hausaufgaben einer Lektion abrufen"""
    result = await db.execute(
        select(Homework).where(
            Homework.lesson_id == lesson_id,
            Homework.is_active == True
        )
    )
    homework_list = result.scalars().all()
    
    # Submission count hinzufügen
    for hw in homework_list:
        count_result = await db.execute(
            select(func.count()).select_from(HomeworkSubmission).where(
                HomeworkSubmission.homework_id == hw.id
            )
        )
        hw.submission_count = count_result.scalar() or 0
    
    return homework_list


@router.get("/admin/lesson/{lesson_id}", response_model=List[HomeworkWithSubmissions])
async def get_homework_with_submissions(
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER))
):
    """Alle Hausaufgaben einer Lektion mit Abgaben (Admin)"""
    result = await db.execute(
        select(Homework).where(Homework.lesson_id == lesson_id)
    )
    homework_list = result.scalars().all()
    
    result = []
    for hw in homework_list:
        # Submissions mit Student-Info
        submissions_result = await db.execute(
            select(HomeworkSubmission).where(
                HomeworkSubmission.homework_id == hw.id
            )
        )
        submissions = submissions_result.scalars().all()
        
        submission_responses = []
        for sub in submissions:
            student_result = await db.execute(
                select(User).where(User.id == sub.student_id)
            )
            student = student_result.scalar_one_or_none()
            sub_dict = {
                **sub.__dict__,
                "student_name": f"{student.first_name} {student.last_name}" if student else None,
                "student_email": student.email if student else None
            }
            submission_responses.append(HomeworkSubmissionResponse(**sub_dict))
        
        hw_dict = {
            **hw.__dict__,
            "submission_count": len(submissions),
            "submissions": submission_responses
        }
        result.append(HomeworkWithSubmissions(**hw_dict))
    
    return result


@router.get("/{homework_id}", response_model=HomeworkResponse)
async def get_homework(
    homework_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Einzelne Hausaufgabe abrufen"""
    result = await db.execute(select(Homework).where(Homework.id == homework_id))
    homework = result.scalar_one_or_none()
    if not homework:
        raise HTTPException(status_code=404, detail="Hausaufgabe nicht gefunden")
    
    count_result = await db.execute(
        select(func.count()).select_from(HomeworkSubmission).where(
            HomeworkSubmission.homework_id == homework.id
        )
    )
    homework.submission_count = count_result.scalar() or 0
    
    return homework


@router.put("/{homework_id}", response_model=HomeworkResponse)
async def update_homework(
    homework_id: UUID,
    homework_data: HomeworkUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER))
):
    """Hausaufgabe aktualisieren (Admin)"""
    result = await db.execute(select(Homework).where(Homework.id == homework_id))
    homework = result.scalar_one_or_none()
    if not homework:
        raise HTTPException(status_code=404, detail="Hausaufgabe nicht gefunden")
    
    update_data = homework_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(homework, key, value)
    
    await db.commit()
    await db.refresh(homework)
    
    return homework


@router.delete("/{homework_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_homework(
    homework_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER))
):
    """Hausaufgabe löschen (Admin)"""
    result = await db.execute(select(Homework).where(Homework.id == homework_id))
    homework = result.scalar_one_or_none()
    if not homework:
        raise HTTPException(status_code=404, detail="Hausaufgabe nicht gefunden")
    
    await db.delete(homework)
    await db.commit()


# =========================================
# Student: Abgaben verwalten
# =========================================

@router.post("/submit/{homework_id}", response_model=HomeworkSubmissionResponse)
async def submit_homework(
    homework_id: UUID,
    text_content: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Hausaufgabe abgeben (Student)"""
    result = await db.execute(select(Homework).where(Homework.id == homework_id))
    homework = result.scalar_one_or_none()
    if not homework:
        raise HTTPException(status_code=404, detail="Hausaufgabe nicht gefunden")
    
    if not homework.is_active:
        raise HTTPException(status_code=400, detail="Hausaufgabe ist nicht mehr aktiv")
    
    # Prüfen ob schon eine Abgabe existiert
    existing_result = await db.execute(
        select(HomeworkSubmission).where(
            HomeworkSubmission.homework_id == homework_id,
            HomeworkSubmission.student_id == current_user.id
        )
    )
    existing = existing_result.scalar_one_or_none()
    
    if existing and existing.status == SubmissionStatus.GRADED:
        raise HTTPException(status_code=400, detail="Diese Hausaufgabe wurde bereits bewertet")
    
    # Deadline prüfen
    is_late = False
    if homework.deadline and datetime.utcnow() > homework.deadline:
        if not homework.allow_late_submission:
            raise HTTPException(status_code=400, detail="Abgabefrist überschritten")
        is_late = True
    
    # Dateien hochladen
    uploaded_files = []
    if files:
        if len(files) > homework.max_files:
            raise HTTPException(
                status_code=400, 
                detail=f"Maximal {homework.max_files} Dateien erlaubt"
            )
        
        for file in files:
            # Dateityp prüfen
            ext = file.filename.split('.')[-1].lower() if file.filename else ''
            if ext not in homework.allowed_file_types:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Dateityp .{ext} nicht erlaubt"
                )
            
            # Datei hochladen
            file_url = await upload_file(
                file, 
                folder=f"homework/{homework_id}/{current_user.id}"
            )
            
            uploaded_files.append({
                "name": file.filename,
                "url": file_url,
                "size": file.size or 0,
                "uploaded_at": datetime.utcnow().isoformat()
            })
    
    if existing:
        # Update existing submission
        existing.text_content = text_content
        existing.files = uploaded_files if uploaded_files else existing.files
        existing.submitted_at = datetime.utcnow()
        existing.is_late = is_late
        existing.status = SubmissionStatus.LATE if is_late else SubmissionStatus.SUBMITTED
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        # Neue Abgabe erstellen
        submission = HomeworkSubmission(
            homework_id=homework_id,
            student_id=current_user.id,
            text_content=text_content,
            files=uploaded_files,
            submitted_at=datetime.utcnow(),
            is_late=is_late,
            status=SubmissionStatus.LATE if is_late else SubmissionStatus.SUBMITTED
        )
        db.add(submission)
        await db.commit()
        await db.refresh(submission)
        return submission


@router.get("/my-submissions", response_model=List[HomeworkSubmissionResponse])
async def get_my_submissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Alle eigenen Abgaben abrufen (Student)"""
    result = await db.execute(
        select(HomeworkSubmission)
        .where(HomeworkSubmission.student_id == current_user.id)
        .order_by(HomeworkSubmission.created_at.desc())
    )
    submissions = result.scalars().all()
    
    return submissions


@router.get("/my-submission/{homework_id}", response_model=HomeworkSubmissionResponse)
async def get_my_submission(
    homework_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eigene Abgabe für eine Hausaufgabe abrufen"""
    result = await db.execute(
        select(HomeworkSubmission).where(
            HomeworkSubmission.homework_id == homework_id,
            HomeworkSubmission.student_id == current_user.id
        )
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Keine Abgabe gefunden")
    
    return submission


# =========================================
# Admin: Bewertung
# =========================================

@router.put("/grade/{submission_id}", response_model=HomeworkSubmissionResponse)
async def grade_submission(
    submission_id: UUID,
    grade_data: HomeworkGradeSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER))
):
    """Abgabe bewerten (Admin/Lehrer)"""
    result = await db.execute(
        select(HomeworkSubmission).where(HomeworkSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Abgabe nicht gefunden")
    
    submission.points = grade_data.points
    submission.feedback = grade_data.feedback
    submission.status = grade_data.status
    submission.graded_at = datetime.utcnow()
    submission.graded_by = current_user.id
    
    await db.commit()
    await db.refresh(submission)
    
    return submission


# =========================================
# Datei-Upload für Hausaufgaben-Materialien (Admin)
# =========================================

@router.post("/upload-material")
async def upload_homework_material(
    file: UploadFile = File(...),
    homework_id: Optional[UUID] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER))
):
    """Material für Hausaufgabe hochladen (Admin)"""
    folder = f"homework-materials/{homework_id}" if homework_id else "homework-materials/temp"
    file_url = await upload_file(file, folder=folder)
    
    return {
        "name": file.filename,
        "url": file_url,
        "type": file.filename.split('.')[-1].lower() if file.filename else "unknown",
        "size": file.size
    }

