# ===========================================
# WARIZMY EDUCATION - Homework Router
# ===========================================
# Hausaufgaben-Endpunkte fuer Lektionen

from typing import List, Optional
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models import Homework, HomeworkSubmission, Lesson, User
from app.routers.auth import get_current_user, require_role
from app.models.user import UserRole

router = APIRouter()


# =========================================
# Pydantic Schemas
# =========================================
class HomeworkBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: datetime
    max_points: Optional[int] = None
    is_active: bool = True


class HomeworkCreate(HomeworkBase):
    lesson_id: UUID


class HomeworkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    max_points: Optional[int] = None
    is_active: Optional[bool] = None


class HomeworkResponse(HomeworkBase):
    id: UUID
    lesson_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HomeworkSubmissionCreate(BaseModel):
    file_url: str
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    notes: Optional[str] = None


class HomeworkSubmissionResponse(BaseModel):
    id: UUID
    homework_id: UUID
    student_id: UUID
    file_url: str
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    notes: Optional[str] = None
    submitted_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =========================================
# Admin/Teacher Endpunkte
# =========================================
@router.post("", response_model=HomeworkResponse, status_code=status.HTTP_201_CREATED)
async def create_homework(
    data: HomeworkCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db),
):
    """Neue Hausaufgabe erstellen."""
    lesson_result = await db.execute(select(Lesson).where(Lesson.id == data.lesson_id))
    lesson = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lektion nicht gefunden")

    homework = Homework(**data.model_dump())
    db.add(homework)
    await db.commit()
    await db.refresh(homework)
    return HomeworkResponse.model_validate(homework)


@router.get("/admin/lesson/{lesson_id}", response_model=List[HomeworkResponse])
async def list_homework_admin(
    lesson_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db),
):
    """Hausaufgaben einer Lektion abrufen (Admin)."""
    result = await db.execute(
        select(Homework)
        .where(Homework.lesson_id == lesson_id)
        .order_by(Homework.deadline.asc(), Homework.created_at.asc())
    )
    homeworks = result.scalars().all()
    return [HomeworkResponse.model_validate(hw) for hw in homeworks]


@router.put("/{homework_id}", response_model=HomeworkResponse)
async def update_homework(
    homework_id: UUID,
    data: HomeworkUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db),
):
    """Hausaufgabe aktualisieren."""
    result = await db.execute(select(Homework).where(Homework.id == homework_id))
    homework = result.scalar_one_or_none()
    if not homework:
        raise HTTPException(status_code=404, detail="Hausaufgabe nicht gefunden")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(homework, field, value)

    await db.commit()
    await db.refresh(homework)
    return HomeworkResponse.model_validate(homework)


@router.delete("/{homework_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_homework(
    homework_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db),
):
    """Hausaufgabe loeschen."""
    result = await db.execute(select(Homework).where(Homework.id == homework_id))
    homework = result.scalar_one_or_none()
    if not homework:
        raise HTTPException(status_code=404, detail="Hausaufgabe nicht gefunden")

    await db.delete(homework)
    await db.commit()


# =========================================
# Studenten Endpunkte
# =========================================
@router.get("/lesson/{lesson_id}", response_model=List[HomeworkResponse])
async def list_homework_for_lesson(
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aktive Hausaufgaben einer Lektion abrufen."""
    result = await db.execute(
        select(Homework)
        .where(Homework.lesson_id == lesson_id)
        .where(Homework.is_active == True)
        .order_by(Homework.deadline.asc(), Homework.created_at.asc())
    )
    homeworks = result.scalars().all()
    return [HomeworkResponse.model_validate(hw) for hw in homeworks]


@router.post("/submit/{homework_id}", response_model=HomeworkSubmissionResponse)
async def submit_homework(
    homework_id: UUID,
    submission_data: HomeworkSubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Hausaufgabe abgeben oder aktualisieren."""
    result = await db.execute(select(Homework).where(Homework.id == homework_id))
    homework = result.scalar_one_or_none()
    if not homework:
        raise HTTPException(status_code=404, detail="Hausaufgabe nicht gefunden")

    if not homework.is_active:
        raise HTTPException(status_code=400, detail="Hausaufgabe ist deaktiviert")

    if homework.deadline and homework.deadline < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Abgabefrist ist abgelaufen")

    result = await db.execute(
        select(HomeworkSubmission)
        .where(HomeworkSubmission.homework_id == homework_id)
        .where(HomeworkSubmission.student_id == current_user.id)
    )
    submission = result.scalar_one_or_none()

    if submission:
        submission.file_url = submission_data.file_url
        submission.file_name = submission_data.file_name
        submission.file_type = submission_data.file_type
        submission.file_size = submission_data.file_size
        submission.notes = submission_data.notes
        submission.submitted_at = datetime.utcnow()
    else:
        submission = HomeworkSubmission(
            homework_id=homework_id,
            student_id=current_user.id,
            **submission_data.model_dump()
        )
        db.add(submission)

    await db.commit()
    await db.refresh(submission)

    return HomeworkSubmissionResponse.model_validate(submission)


@router.get("/my-submission/{homework_id}", response_model=HomeworkSubmissionResponse)
async def get_my_submission(
    homework_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Eigene Abgabe fuer eine Hausaufgabe abrufen."""
    result = await db.execute(
        select(HomeworkSubmission)
        .where(HomeworkSubmission.homework_id == homework_id)
        .where(HomeworkSubmission.student_id == current_user.id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Keine Abgabe gefunden")
    return HomeworkSubmissionResponse.model_validate(submission)
