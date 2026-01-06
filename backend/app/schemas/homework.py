# ===========================================
# WARIZMY EDUCATION - Homework Schemas
# ===========================================
# Pydantic Schemas für Hausaufgaben

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class SubmissionStatusEnum(str, Enum):
    """Status der Hausaufgaben-Abgabe"""
    PENDING = "pending"
    SUBMITTED = "submitted"
    GRADED = "graded"
    LATE = "late"
    RESUBMIT = "resubmit"


# =========================================
# Material Schema
# =========================================
class MaterialSchema(BaseModel):
    """Schema für Materialien (Upload-Dateien)"""
    name: str
    url: str
    type: str  # pdf, doc, docx, etc.
    size: Optional[int] = None
    uploaded_at: Optional[datetime] = None


# =========================================
# Homework Schemas
# =========================================
class HomeworkBase(BaseModel):
    """Basis-Schema für Hausaufgaben"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    allow_late_submission: bool = True
    max_file_size_mb: int = 10
    allowed_file_types: List[str] = ["pdf", "doc", "docx", "txt", "jpg", "png"]
    max_files: int = 5
    materials: List[MaterialSchema] = []
    max_points: Optional[int] = None
    is_active: bool = True


class HomeworkCreate(HomeworkBase):
    """Schema zum Erstellen einer Hausaufgabe"""
    lesson_id: UUID


class HomeworkUpdate(BaseModel):
    """Schema zum Aktualisieren einer Hausaufgabe"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    allow_late_submission: Optional[bool] = None
    max_file_size_mb: Optional[int] = None
    allowed_file_types: Optional[List[str]] = None
    max_files: Optional[int] = None
    materials: Optional[List[MaterialSchema]] = None
    max_points: Optional[int] = None
    is_active: Optional[bool] = None


class HomeworkResponse(HomeworkBase):
    """Schema für Hausaufgaben-Response"""
    id: UUID
    lesson_id: UUID
    created_at: datetime
    updated_at: datetime
    submission_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


# =========================================
# Homework Submission Schemas
# =========================================
class SubmissionFileSchema(BaseModel):
    """Schema für hochgeladene Dateien"""
    name: str
    url: str
    size: int
    uploaded_at: datetime


class HomeworkSubmissionBase(BaseModel):
    """Basis-Schema für Hausaufgaben-Abgabe"""
    text_content: Optional[str] = None
    files: List[SubmissionFileSchema] = []


class HomeworkSubmissionCreate(HomeworkSubmissionBase):
    """Schema zum Erstellen einer Abgabe"""
    homework_id: UUID


class HomeworkSubmissionUpdate(BaseModel):
    """Schema zum Aktualisieren einer Abgabe"""
    text_content: Optional[str] = None
    files: Optional[List[SubmissionFileSchema]] = None


class HomeworkGradeSchema(BaseModel):
    """Schema für Bewertung"""
    points: Optional[int] = None
    feedback: Optional[str] = None
    status: SubmissionStatusEnum = SubmissionStatusEnum.GRADED


class HomeworkSubmissionResponse(HomeworkSubmissionBase):
    """Schema für Abgabe-Response"""
    id: UUID
    homework_id: UUID
    student_id: UUID
    status: SubmissionStatusEnum
    submitted_at: Optional[datetime] = None
    is_late: bool = False
    points: Optional[int] = None
    feedback: Optional[str] = None
    graded_at: Optional[datetime] = None
    graded_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    # Zusätzliche Infos
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    
    class Config:
        from_attributes = True


# =========================================
# Homework mit Submissions (für Admin)
# =========================================
class HomeworkWithSubmissions(HomeworkResponse):
    """Hausaufgabe mit allen Abgaben"""
    submissions: List[HomeworkSubmissionResponse] = []

