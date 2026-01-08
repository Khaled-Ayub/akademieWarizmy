# ===========================================
# WARIZMY EDUCATION - Migration: class_courses Table
# ===========================================
# Creates the many-to-many relationship table between classes and courses.
#
# Run locally:
#   cd backend
#   python -m app.seeds.migrate_add_class_courses
#
# Run in Railway:
#   Create migration.sql and pipe to railway connect postgres

import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


SQL = [
    """
    CREATE TABLE IF NOT EXISTS class_courses (
        class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        PRIMARY KEY (class_id, course_id)
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_class_courses_class_id ON class_courses(class_id)",
    "CREATE INDEX IF NOT EXISTS idx_class_courses_course_id ON class_courses(course_id)",
]


async def run():
    database_url = os.getenv("DATABASE_URL") or "postgresql://warizmy:password@localhost:5432/warizmy_app"

    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(database_url, echo=False)

    async with engine.begin() as conn:
        for stmt in SQL:
            try:
                await conn.execute(text(stmt))
                print(f"✅ Executed: {stmt[:60]}...")
            except Exception as e:
                print(f"⚠️  Statement skipped: {str(e)[:80]}")

    await engine.dispose()
    print("✅ Migration complete: class_courses table created.")


if __name__ == "__main__":
    asyncio.run(run())
