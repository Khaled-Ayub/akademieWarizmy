# ===========================================
# WARIZMY EDUCATION - Vocabulary Models
# ===========================================
# Modelle für Vokabellisten (Arabisch-Deutsch)
# Sortierung: Wortart (Nomen/Verben/Partikel) → Unterkategorie

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


# =========================================
# WORTARTEN (Hauptkategorien)
# =========================================
class WordType(str, enum.Enum):
    """Wortart - Hauptkategorie für Vokabeln"""
    NOUN = "noun"           # اسم - Nomen
    VERB = "verb"           # فعل - Verb
    PARTICLE = "particle"   # حرف - Partikel


# =========================================
# NOMEN-KATEGORIEN (اسماء)
# =========================================
class NounCategory(str, enum.Enum):
    """Kategorien für Nomen nach Themen"""
    GENERAL = "general"             # Allgemein
    FOOD = "food"                   # طعام وشراب - Essen & Trinken
    SCHOOL = "school"               # مدرسة - Schule & Bildung
    WORK = "work"                   # عمل ومهنة - Arbeit & Beruf
    FAMILY = "family"               # عائلة - Familie
    BODY = "body"                   # جسم - Körper
    CLOTHES = "clothes"             # ملابس - Kleidung
    HOUSE = "house"                 # بيت ومنزل - Haus & Wohnung
    NATURE = "nature"               # طبيعة - Natur
    ANIMALS = "animals"             # حيوانات - Tiere
    COLORS = "colors"               # ألوان - Farben
    NUMBERS = "numbers"             # أرقام - Zahlen
    TIME = "time"                   # وقت - Zeit & Datum
    WEATHER = "weather"             # طقس - Wetter
    TRAVEL = "travel"               # سفر - Reisen
    HEALTH = "health"               # صحة - Gesundheit
    RELIGION = "religion"           # دين - Religion & Islam
    QURAN = "quran"                 # قرآن - Quran-Vokabeln
    GREETINGS = "greetings"         # تحيات - Begrüßungen
    PLACES = "places"               # أماكن - Orte
    EMOTIONS = "emotions"           # مشاعر - Gefühle
    TECHNOLOGY = "technology"       # تكنولوجيا - Technologie


# =========================================
# VERBEN-KATEGORIEN (افعال)
# =========================================
class VerbCategory(str, enum.Enum):
    """Kategorien für Verben nach Stammform oder Thema"""
    # Nach Stammform
    THREE_LETTER = "three_letter"       # ثلاثي - Dreistämmig (فَعَلَ)
    FOUR_LETTER = "four_letter"         # رباعي - Vierstämmig
    DERIVED_II = "derived_ii"           # Form II - فَعَّلَ (Intensiv)
    DERIVED_III = "derived_iii"         # Form III - فَاعَلَ (Reziprok)
    DERIVED_IV = "derived_iv"           # Form IV - أَفْعَلَ (Kausativ)
    DERIVED_V = "derived_v"             # Form V - تَفَعَّلَ (Reflexiv II)
    DERIVED_VI = "derived_vi"           # Form VI - تَفَاعَلَ (Reziprok)
    DERIVED_VII = "derived_vii"         # Form VII - اِنْفَعَلَ (Passiv)
    DERIVED_VIII = "derived_viii"       # Form VIII - اِفْتَعَلَ (Reflexiv)
    DERIVED_X = "derived_x"             # Form X - اِسْتَفْعَلَ (Anforderung)
    
    # Nach Thema
    DAILY = "daily"                     # يومي - Alltag
    SCHOOL_VERBS = "school_verbs"       # مدرسة - Schule & Lernen
    WORK_VERBS = "work_verbs"           # عمل - Arbeit & Beruf
    MOVEMENT = "movement"               # حركة - Bewegung
    COMMUNICATION = "communication"     # تواصل - Kommunikation
    EMOTIONS_VERBS = "emotions_verbs"   # مشاعر - Gefühle
    COOKING = "cooking"                 # طبخ - Kochen
    WORSHIP = "worship"                 # عبادة - Gottesdienst
    GENERAL_VERBS = "general_verbs"     # عام - Allgemein


# =========================================
# PARTIKEL-KATEGORIEN (حروف)
# =========================================
class ParticleCategory(str, enum.Enum):
    """Kategorien für Partikel nach Art"""
    PREPOSITIONS = "prepositions"       # حروف الجر - Präpositionen (في، على، من، إلى)
    CONJUNCTIONS = "conjunctions"       # حروف العطف - Konjunktionen (و، أو، ثم، لكن)
    NEGATION = "negation"               # حروف النفي - Verneinungspartikel (لا، ما، لم، لن)
    INTERROGATIVE = "interrogative"     # أدوات الاستفهام - Fragepartikel (هل، ما، من، أين)
    CONDITIONAL = "conditional"         # أدوات الشرط - Konditionalpartikel (إذا، لو، إن)
    DEMONSTRATIVE = "demonstrative"     # أسماء الإشارة - Demonstrativpronomen (هذا، هذه، ذلك)
    RELATIVE = "relative"               # أسماء الموصولة - Relativpronomen (الذي، التي، ما)
    VOCATIVE = "vocative"               # أدوات النداء - Vokativ (يا)
    EXCEPTION = "exception"             # أدوات الاستثناء - Ausnahme (إلا، غير، سوى)
    EMPHASIS = "emphasis"               # أدوات التوكيد - Betonung (إن، أن، قد)
    FUTURE = "future"                   # أدوات المستقبل - Futurpartikel (سوف، س)
    GENERAL_PARTICLES = "general"       # عام - Allgemein


# =========================================
# SPRACHNIVEAU
# =========================================
class VocabularyLevel(str, enum.Enum):
    """Schwierigkeitsgrad der Vokabeln"""
    A1 = "a1"           # Absolute Anfänger
    A2 = "a2"           # Anfänger
    B1 = "b1"           # Mittelstufe
    B2 = "b2"           # Fortgeschritten
    C1 = "c1"           # Sehr fortgeschritten
    C2 = "c2"           # Muttersprachenniveau


class VocabularyList(Base):
    """
    Vokabelliste.
    
    Sortiert nach Wortart (Nomen/Verben/Partikel) und dann nach Unterkategorie.
    Kann Kursen/Lektionen zugeordnet und als Hausaufgabe vergeben werden.
    """
    __tablename__ = "vocabulary_lists"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Vokabellisten-ID (UUID)"
    )
    
    # =========================================
    # Basis-Informationen
    # =========================================
    title = Column(
        String(255), 
        nullable=False,
        comment="Titel der Vokabelliste"
    )
    title_arabic = Column(
        String(255), 
        nullable=True,
        comment="Arabischer Titel der Vokabelliste"
    )
    slug = Column(
        String(255), 
        unique=True, 
        nullable=False, 
        index=True,
        comment="URL-Slug (eindeutig)"
    )
    description = Column(
        Text, 
        nullable=True,
        comment="Beschreibung der Vokabelliste"
    )
    
    # =========================================
    # Hauptkategorisierung: WORTART
    # =========================================
    word_type = Column(
        Enum(WordType, values_callable=lambda obj: [e.value for e in obj]), 
        default=WordType.NOUN,
        nullable=False,
        index=True,
        comment="Wortart: Nomen (اسم), Verb (فعل), Partikel (حرف)"
    )
    
    # =========================================
    # Unterkategorien (je nach Wortart)
    # =========================================
    noun_category = Column(
        Enum(NounCategory, values_callable=lambda obj: [e.value for e in obj]), 
        nullable=True,
        comment="Unterkategorie für Nomen (Themen)"
    )
    verb_category = Column(
        Enum(VerbCategory, values_callable=lambda obj: [e.value for e in obj]), 
        nullable=True,
        comment="Unterkategorie für Verben (Stammform/Themen)"
    )
    particle_category = Column(
        Enum(ParticleCategory, values_callable=lambda obj: [e.value for e in obj]), 
        nullable=True,
        comment="Unterkategorie für Partikel (Art)"
    )
    
    # =========================================
    # Sprachniveau
    # =========================================
    level = Column(
        Enum(VocabularyLevel, values_callable=lambda obj: [e.value for e in obj]), 
        default=VocabularyLevel.A1,
        nullable=False,
        comment="Schwierigkeitsgrad"
    )
    tags = Column(
        JSONB,
        nullable=True,
        default=list,
        comment="Zusätzliche Tags für Filterung"
    )
    
    # =========================================
    # Kurs-Zuordnung (optional)
    # =========================================
    course_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("courses.id", ondelete="SET NULL"), 
        nullable=True, 
        index=True,
        comment="Zugeordneter Kurs (optional)"
    )
    
    # =========================================
    # Einstellungen
    # =========================================
    order = Column(
        Integer, 
        default=0,
        comment="Sortierreihenfolge"
    )
    is_published = Column(
        Boolean, 
        default=False,
        comment="Veröffentlicht?"
    )
    is_ai_generated = Column(
        Boolean, 
        default=False,
        comment="Wurde von KI generiert?"
    )
    is_ai_verified = Column(
        Boolean, 
        default=False,
        comment="Wurde von KI überprüft?"
    )
    
    # =========================================
    # Statistiken
    # =========================================
    item_count = Column(
        Integer, 
        default=0,
        comment="Anzahl der Vokabeln (cached)"
    )
    
    # =========================================
    # Timestamps
    # =========================================
    created_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Erstellt am"
    )
    updated_at = Column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        comment="Zuletzt aktualisiert"
    )
    published_at = Column(
        DateTime, 
        nullable=True,
        comment="Veröffentlicht am"
    )
    
    # =========================================
    # Relationships
    # =========================================
    items = relationship(
        "VocabularyItem", 
        back_populates="vocabulary_list",
        cascade="all, delete-orphan",
        order_by="VocabularyItem.order"
    )
    
    course = relationship("Course", backref="vocabulary_lists")
    
    # Hausaufgaben, die diese Vokabelliste nutzen
    homework_assignments = relationship(
        "Homework",
        back_populates="vocabulary_list"
    )
    
    @property
    def subcategory(self) -> str | None:
        """Gibt die aktive Unterkategorie basierend auf word_type zurück"""
        if self.word_type == WordType.NOUN:
            return self.noun_category.value if self.noun_category else None
        elif self.word_type == WordType.VERB:
            return self.verb_category.value if self.verb_category else None
        elif self.word_type == WordType.PARTICLE:
            return self.particle_category.value if self.particle_category else None
        return None
    
    def __repr__(self) -> str:
        return f"<VocabularyList {self.title} ({self.word_type.value})>"


class VocabularyItem(Base):
    """
    Einzelne Vokabel.
    
    Arabisches Wort mit deutscher Übersetzung und optionalen Zusatzinfos.
    """
    __tablename__ = "vocabulary_items"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Vokabel-ID (UUID)"
    )
    
    # =========================================
    # Fremdschlüssel
    # =========================================
    vocabulary_list_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("vocabulary_lists.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True,
        comment="Zugehörige Vokabelliste"
    )
    
    # =========================================
    # Arabisch (Quelle)
    # =========================================
    arabic = Column(
        String(500), 
        nullable=False,
        comment="Arabisches Wort/Ausdruck"
    )
    arabic_voweled = Column(
        String(500), 
        nullable=True,
        comment="Arabisch mit Vokalzeichen (Tashkil)"
    )
    transliteration = Column(
        String(500), 
        nullable=True,
        comment="Lateinische Umschrift (z.B. 'kitāb')"
    )
    
    # =========================================
    # Deutsch (Übersetzung)
    # =========================================
    german = Column(
        String(500), 
        nullable=False,
        comment="Deutsche Übersetzung"
    )
    german_alternatives = Column(
        JSONB,
        nullable=True,
        default=list,
        comment="Alternative Übersetzungen"
    )
    
    # =========================================
    # Grammatik-Infos (Allgemein)
    # =========================================
    word_type = Column(
        String(50), 
        nullable=True,
        comment="Wortart (اسم، فعل، حرف)"
    )
    
    # =========================================
    # Nomen-spezifisch
    # =========================================
    gender = Column(
        String(20), 
        nullable=True,
        comment="Grammatisches Geschlecht (مذكر/مؤنث)"
    )
    plural = Column(
        String(500), 
        nullable=True,
        comment="Pluralform (جمع)"
    )
    plural_type = Column(
        String(50), 
        nullable=True,
        comment="Pluraltyp: جمع مذكر سالم، جمع مؤنث سالم، جمع تكسير"
    )
    
    # =========================================
    # Verb-spezifisch
    # =========================================
    root = Column(
        String(50), 
        nullable=True,
        comment="Arabische Wurzel (جذر - 3 Konsonanten)"
    )
    verb_form = Column(
        String(20), 
        nullable=True,
        comment="Verbform: I, II, III, IV, V, VI, VII, VIII, X"
    )
    past_tense = Column(
        String(100), 
        nullable=True,
        comment="Vergangenheit (الماضي)"
    )
    present_tense = Column(
        String(100), 
        nullable=True,
        comment="Gegenwart (المضارع)"
    )
    imperative = Column(
        String(100), 
        nullable=True,
        comment="Imperativ (الأمر)"
    )
    masdar = Column(
        String(100), 
        nullable=True,
        comment="Verbalsubstantiv (المصدر)"
    )
    
    # =========================================
    # Beispielsätze
    # =========================================
    example_arabic = Column(
        Text, 
        nullable=True,
        comment="Beispielsatz auf Arabisch"
    )
    example_german = Column(
        Text, 
        nullable=True,
        comment="Beispielsatz auf Deutsch"
    )
    
    # =========================================
    # Medien
    # =========================================
    audio_url = Column(
        String(500), 
        nullable=True,
        comment="Audio-Aussprache URL"
    )
    image_url = Column(
        String(500), 
        nullable=True,
        comment="Bild zur Veranschaulichung"
    )
    
    # =========================================
    # Zusätzliche Infos
    # =========================================
    notes = Column(
        Text, 
        nullable=True,
        comment="Zusätzliche Anmerkungen"
    )
    difficulty = Column(
        Integer, 
        default=1,
        comment="Schwierigkeit (1-5)"
    )
    
    # =========================================
    # KI-Überprüfung
    # =========================================
    is_verified = Column(
        Boolean, 
        default=False,
        comment="Übersetzung überprüft?"
    )
    ai_confidence = Column(
        Integer, 
        nullable=True,
        comment="KI-Konfidenz (0-100)"
    )
    
    # =========================================
    # Sortierung
    # =========================================
    order = Column(
        Integer, 
        default=0,
        comment="Sortierreihenfolge"
    )
    
    # =========================================
    # Timestamps
    # =========================================
    created_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Erstellt am"
    )
    updated_at = Column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        comment="Zuletzt aktualisiert"
    )
    
    # =========================================
    # Relationships
    # =========================================
    vocabulary_list = relationship("VocabularyList", back_populates="items")
    
    def __repr__(self) -> str:
        return f"<VocabularyItem {self.arabic} = {self.german}>"
