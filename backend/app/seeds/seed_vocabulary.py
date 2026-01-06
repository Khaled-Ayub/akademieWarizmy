"""
Seed-Skript für Vokabellisten
Lädt die vordefinierten Vokabeln aus vocabulary_data.json in die Datenbank
"""

import json
import os
import asyncio
import re
import unicodedata
from pathlib import Path
from datetime import datetime

# Pfad zur aktuellen Datei
CURRENT_DIR = Path(__file__).parent
DATA_FILE = CURRENT_DIR / "vocabulary_data.json"


def generate_slug(text: str) -> str:
    """Generiert einen URL-freundlichen Slug"""
    # Umlaute ersetzen
    replacements = {
        'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
        'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue'
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # Unicode normalisieren und nicht-ASCII entfernen
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # Kleinbuchstaben und Sonderzeichen durch Bindestriche ersetzen
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    
    return text


async def seed_vocabulary():
    """Lädt alle Vokabellisten in die Datenbank"""
    
    # Imports hier, um Circular-Imports zu vermeiden
    from app.db.session import AsyncSessionLocal
    from app.models.vocabulary.vocabulary import (
        VocabularyList, VocabularyItem, 
        WordType, NounCategory, VocabularyLevel
    )
    from sqlalchemy import select, delete
    
    # JSON-Daten laden
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    async with AsyncSessionLocal() as session:
        try:
            # Alte Daten löschen (optional - auskommentieren wenn nicht gewünscht)
            # await session.execute(delete(VocabularyItem))
            # await session.execute(delete(VocabularyList))
            # await session.commit()
            
            lists_created = 0
            items_created = 0
            
            # ========================================
            # 1. Nomen-Listen nach Kategorien erstellen
            # ========================================
            category_mapping = {
                "family": ("Familie", "العائلة", NounCategory.FAMILY),
                "social": ("Soziale Kontakte", "العلاقات الاجتماعية", NounCategory.GENERAL),
                "adjectives": ("Adjektive", "الصفات", NounCategory.GENERAL),
                "school": ("Schule & Universität", "المدرسة والجامعة", NounCategory.SCHOOL),
                "colors": ("Farben", "الألوان", NounCategory.COLORS),
                "astronomy": ("Astronomie & Natur", "الفلك والطبيعة", NounCategory.NATURE),
                "environment": ("Umfeld & Bildung", "البيئة والتعليم", NounCategory.GENERAL),
                "time": ("Zeit & Tageszeiten", "الوقت وأوقات اليوم", NounCategory.TIME),
                "grammar": ("Grammatik-Fachbegriffe", "مصطلحات النحو", NounCategory.GENERAL),
            }
            
            for cat_key, nouns in data.get("nouns", {}).items():
                if cat_key in category_mapping:
                    title, title_ar, noun_cat = category_mapping[cat_key]
                    slug = generate_slug(title)
                    
                    # Prüfen ob Liste bereits existiert
                    existing = await session.execute(
                        select(VocabularyList).where(VocabularyList.slug == slug)
                    )
                    if existing.scalar_one_or_none():
                        print(f"  ⏭️  Liste '{title}' existiert bereits, überspringe...")
                        continue
                    
                    # Neue Liste erstellen
                    vocab_list = VocabularyList(
                        title=title,
                        title_arabic=title_ar,
                        slug=slug,
                        description=f"Arabische Vokabeln zum Thema {title}",
                        word_type=WordType.NOUN,
                        noun_category=noun_cat,
                        level=VocabularyLevel.A1,
                        is_published=True,
                        item_count=len(nouns),
                        tags=[cat_key, "nomen", "grundwortschatz"],
                    )
                    session.add(vocab_list)
                    await session.flush()
                    
                    # Vokabeln hinzufügen
                    for idx, noun in enumerate(nouns):
                        item = VocabularyItem(
                            vocabulary_list_id=vocab_list.id,
                            arabic=noun["arabic"],
                            arabic_voweled=noun["arabic"],
                            german=noun["german"],
                            word_type=WordType.NOUN,
                            order=idx + 1,
                            difficulty=1,
                            is_verified=True,
                        )
                        session.add(item)
                        items_created += 1
                    
                    lists_created += 1
                    print(f"  ✅ Liste '{title}' mit {len(nouns)} Vokabeln erstellt")
            
            # ========================================
            # 2. Verben-Liste erstellen
            # ========================================
            verbs = data.get("verbs", [])
            if verbs:
                slug = "arabische-verben-grundwortschatz"
                
                existing = await session.execute(
                    select(VocabularyList).where(VocabularyList.slug == slug)
                )
                if not existing.scalar_one_or_none():
                    verb_list = VocabularyList(
                        title="Arabische Verben - Grundwortschatz",
                        title_arabic="الأفعال العربية",
                        slug=slug,
                        description="Wichtige arabische Verben mit Vergangenheit und Gegenwart",
                        word_type=WordType.VERB,
                        level=VocabularyLevel.A1,
                        is_published=True,
                        item_count=len(verbs),
                        tags=["verben", "grundwortschatz", "konjugation"],
                    )
                    session.add(verb_list)
                    await session.flush()
                    
                    for idx, verb in enumerate(verbs):
                        # Verb-Format: "past – present"
                        arabic_parts = verb["arabic"].split(" – ")
                        past_tense = arabic_parts[0] if len(arabic_parts) > 0 else verb["arabic"]
                        present_tense = arabic_parts[1] if len(arabic_parts) > 1 else ""
                        
                        item = VocabularyItem(
                            vocabulary_list_id=verb_list.id,
                            arabic=verb["arabic"],
                            arabic_voweled=verb["arabic"],
                            german=verb["german"],
                            word_type=WordType.VERB,
                            past_tense=past_tense,
                            present_tense=present_tense,
                            verb_form=verb.get("pattern", ""),
                            order=idx + 1,
                            difficulty=2,
                            is_verified=True,
                        )
                        session.add(item)
                        items_created += 1
                    
                    lists_created += 1
                    print(f"  ✅ Verben-Liste mit {len(verbs)} Verben erstellt")
                else:
                    print("  ⏭️  Verben-Liste existiert bereits, überspringe...")
            
            # ========================================
            # 3. Partikel-Listen erstellen
            # ========================================
            particles = data.get("particles", {})
            particle_categories = {
                "genitive": ("Präpositionen (Genitiv)", "حروف الجر"),
                "conjunction": ("Konjunktionen", "حروف العطف"),
                "interrogative": ("Fragewörter", "أدوات الاستفهام"),
                "negation": ("Negationspartikel", "أدوات النفي"),
                "demonstrative": ("Demonstrativpronomen", "أسماء الإشارة"),
            }
            
            for part_key, items in particles.items():
                if part_key in particle_categories:
                    title, title_ar = particle_categories[part_key]
                    slug = generate_slug(title)
                    
                    existing = await session.execute(
                        select(VocabularyList).where(VocabularyList.slug == slug)
                    )
                    if existing.scalar_one_or_none():
                        print(f"  ⏭️  Liste '{title}' existiert bereits, überspringe...")
                        continue
                    
                    part_list = VocabularyList(
                        title=title,
                        title_arabic=title_ar,
                        slug=slug,
                        description=f"Arabische {title}",
                        word_type=WordType.PARTICLE,
                        level=VocabularyLevel.A1,
                        is_published=True,
                        item_count=len(items),
                        tags=["partikel", part_key, "grammatik"],
                    )
                    session.add(part_list)
                    await session.flush()
                    
                    for idx, item_data in enumerate(items):
                        item = VocabularyItem(
                            vocabulary_list_id=part_list.id,
                            arabic=item_data["arabic"],
                            arabic_voweled=item_data["arabic"],
                            german=item_data["german"],
                            word_type=WordType.PARTICLE,
                            order=idx + 1,
                            difficulty=1,
                            is_verified=True,
                        )
                        session.add(item)
                        items_created += 1
                    
                    lists_created += 1
                    print(f"  ✅ Liste '{title}' mit {len(items)} Partikeln erstellt")
            
            # ========================================
            # 4. Antonyme-Liste erstellen
            # ========================================
            antonyms = data.get("antonyms", [])
            if antonyms:
                slug = "antonyme-gegenteile"
                
                existing = await session.execute(
                    select(VocabularyList).where(VocabularyList.slug == slug)
                )
                if not existing.scalar_one_or_none():
                    antonym_list = VocabularyList(
                        title="Antonyme (Gegenteile)",
                        title_arabic="الأضداد",
                        slug=slug,
                        description="Arabische Wortpaare mit gegensätzlicher Bedeutung",
                        word_type=WordType.NOUN,
                        level=VocabularyLevel.A2,
                        is_published=True,
                        item_count=len(antonyms) * 2,
                        tags=["antonyme", "gegenteile", "adjektive"],
                    )
                    session.add(antonym_list)
                    await session.flush()
                    
                    for idx, ant in enumerate(antonyms):
                        # Erstes Wort
                        item1 = VocabularyItem(
                            vocabulary_list_id=antonym_list.id,
                            arabic=ant["arabic"],
                            arabic_voweled=ant["arabic"],
                            german=ant["german"],
                            word_type=WordType.NOUN,
                            notes=f"Gegenteil: {ant['opposite']} ({ant['oppositeGerman']})",
                            order=idx * 2 + 1,
                            difficulty=2,
                            is_verified=True,
                        )
                        session.add(item1)
                        
                        # Gegenteil
                        item2 = VocabularyItem(
                            vocabulary_list_id=antonym_list.id,
                            arabic=ant["opposite"],
                            arabic_voweled=ant["opposite"],
                            german=ant["oppositeGerman"],
                            word_type=WordType.NOUN,
                            notes=f"Gegenteil: {ant['arabic']} ({ant['german']})",
                            order=idx * 2 + 2,
                            difficulty=2,
                            is_verified=True,
                        )
                        session.add(item2)
                        items_created += 2
                    
                    lists_created += 1
                    print(f"  ✅ Antonyme-Liste mit {len(antonyms) * 2} Wörtern erstellt")
                else:
                    print("  ⏭️  Antonyme-Liste existiert bereits, überspringe...")
            
            await session.commit()
            
            print("\n" + "=" * 50)
            print(f"✅ Seed abgeschlossen!")
            print(f"   📚 {lists_created} Listen erstellt")
            print(f"   📝 {items_created} Vokabeln erstellt")
            print("=" * 50)
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Fehler beim Seeding: {e}")
            raise


def run_seed():
    """Führt das Seeding aus"""
    print("\n🌱 Starte Vokabel-Seeding...")
    print("=" * 50)
    asyncio.run(seed_vocabulary())


if __name__ == "__main__":
    # Füge das übergeordnete Verzeichnis zum Python-Pfad hinzu
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    
    run_seed()

