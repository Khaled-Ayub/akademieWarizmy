# ===========================================
# WARIZMY EDUCATION - Schemas Package
# ===========================================

from app.schemas.homework import (
    HomeworkCreate,
    HomeworkUpdate,
    HomeworkResponse,
    HomeworkSubmissionCreate,
    HomeworkSubmissionUpdate,
    HomeworkSubmissionResponse,
    HomeworkGradeSchema,
    HomeworkWithSubmissions,
)

__all__ = [
    "HomeworkCreate",
    "HomeworkUpdate",
    "HomeworkResponse",
    "HomeworkSubmissionCreate",
    "HomeworkSubmissionUpdate",
    "HomeworkSubmissionResponse",
    "HomeworkGradeSchema",
    "HomeworkWithSubmissions",
]

