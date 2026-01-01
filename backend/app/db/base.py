# ===========================================
# WARIZMY EDUCATION - SQLAlchemy Base
# ===========================================
# Basis-Klasse für alle Datenbankmodelle

from sqlalchemy.orm import declarative_base

# =========================================
# Base für alle SQLAlchemy Models
# =========================================
# Alle Models erben von dieser Klasse:
#   from app.db.base import Base
#   class User(Base):
#       __tablename__ = "users"
#       ...

Base = declarative_base()

