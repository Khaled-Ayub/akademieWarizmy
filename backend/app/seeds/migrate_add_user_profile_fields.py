# ===========================================
# WARIZMY EDUCATION - One-off DB Migration Helper
# ===========================================
# Adds onboarding/profile columns to `users` table for existing databases.
# This repo currently doesn't ship Alembic migrations; this script is an idempotent helper.
#
# Run locally:
#   cd backend
#   python -m app.seeds.migrate_add_user_profile_fields
#
# Run in Railway:
#   railway run python -m app.seeds.migrate_add_user_profile_fields

import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


SQL = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth date",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_opt_in boolean NOT NULL DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_channel_opt_in boolean NOT NULL DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false",
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
            await conn.execute(text(stmt))

    await engine.dispose()
    print("✅ Migration applied (if needed): added onboarding/profile fields to users table.")


if __name__ == "__main__":
    asyncio.run(run())


