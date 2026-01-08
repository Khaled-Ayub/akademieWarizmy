# ===========================================
# WARIZMY EDUCATION - One-off DB Migration Helper
# ===========================================
# Adds frequency and location_id columns to `class_schedules` table.
#
# Run locally:
#   cd backend
#   python -m app.seeds.migrate_add_class_schedule_fields
#
# Run in Railway:
#   railway run python -m app.seeds.migrate_add_class_schedule_fields

import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


SQL = [
    "ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS frequency integer NOT NULL DEFAULT 1",
    "ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS location_id uuid",
    "ALTER TABLE class_schedules ADD CONSTRAINT fk_class_schedules_location_id FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL",
]


async def run():
    # Prefer env var, fallback to the same default as backend Settings
    database_url = os.getenv("DATABASE_URL") or "postgresql://warizmy:password@localhost:5432/warizmy_app"

    # Convert sync URL to asyncpg URL for SQLAlchemy async engine
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(database_url, echo=False)

    async with engine.begin() as conn:
        for stmt in SQL:
            try:
                await conn.execute(text(stmt))
            except Exception as e:
                print(f"⚠️  Statement skipped (likely already exists): {stmt[:50]}...")

    await engine.dispose()
    print("✅ Migration applied (if needed): added frequency and location_id to class_schedules table.")


if __name__ == "__main__":
    asyncio.run(run())

