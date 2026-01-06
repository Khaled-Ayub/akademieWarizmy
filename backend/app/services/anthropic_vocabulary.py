# ===========================================
# WARIZMY EDUCATION - Anthropic Vocabulary Service
# ===========================================
# KI-gestützte Vokabel-Generierung und -Überprüfung
# Nutzt die Anthropic Claude API

import os
import json
import httpx
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.core.config import get_settings

settings = get_settings()


# =========================================
# Pydantic Schemas für KI-Antworten
# =========================================
class GeneratedVocabulary(BaseModel):
    """Einzelne generierte Vokabel"""
    arabic: str
    arabic_voweled: Optional[str] = None
    transliteration: Optional[str] = None
    german: str
    german_alternatives: Optional[List[str]] = None
    word_type: Optional[str] = None
    gender: Optional[str] = None
    plural: Optional[str] = None
    root: Optional[str] = None
    example_arabic: Optional[str] = None
    example_german: Optional[str] = None
    notes: Optional[str] = None
    difficulty: int = 1


class VocabularyVerification(BaseModel):
    """Ergebnis der Vokabel-Überprüfung"""
    is_correct: bool
    confidence: int  # 0-100
    corrections: Optional[Dict[str, str]] = None
    suggestions: Optional[List[str]] = None
    notes: Optional[str] = None


class VocabularyListSuggestion(BaseModel):
    """Vorschlag für eine Vokabelliste"""
    title: str
    description: str
    category: str
    level: str
    estimated_items: int


# =========================================
# Anthropic API Client
# =========================================
class AnthropicVocabularyService:
    """
    Service für KI-gestützte Vokabel-Operationen.
    
    Funktionen:
    - Vokabellisten generieren
    - Vokabeln zu Themen erstellen
    - Übersetzungen überprüfen und korrigieren
    - Beispielsätze generieren
    """
    
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.model = "claude-sonnet-4-20250514"  # Oder claude-3-haiku-20240307 für günstigere Anfragen
        
    def _get_headers(self) -> Dict[str, str]:
        """API-Header erstellen"""
        return {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
        }
    
    async def _call_api(self, system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> str:
        """Anthropic API aufrufen"""
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY nicht konfiguriert")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.api_url,
                headers=self._get_headers(),
                json={
                    "model": self.model,
                    "max_tokens": max_tokens,
                    "system": system_prompt,
                    "messages": [
                        {"role": "user", "content": user_prompt}
                    ]
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Anthropic API Fehler: {response.status_code} - {response.text}")
            
            data = response.json()
            return data["content"][0]["text"]
    
    # =========================================
    # Vokabellisten generieren
    # =========================================
    async def generate_vocabulary_list(
        self,
        topic: str,
        category: str,
        level: str,
        count: int = 20,
        additional_context: Optional[str] = None
    ) -> List[GeneratedVocabulary]:
        """
        Generiert eine komplette Vokabelliste zu einem Thema.
        
        Args:
            topic: Das Thema (z.B. "Im Restaurant", "Religiöse Begriffe")
            category: Kategorie (z.B. "food", "religion")
            level: Sprachniveau (a1, a2, b1, b2, c1, c2)
            count: Anzahl der Vokabeln
            additional_context: Zusätzlicher Kontext
        
        Returns:
            Liste von GeneratedVocabulary Objekten
        """
        system_prompt = """Du bist ein Experte für Arabisch-Deutsch Übersetzungen und Sprachunterricht.
Du erstellst präzise, lehrreiche Vokabellisten für den Arabischunterricht.

WICHTIG:
- Arabische Wörter müssen korrekt sein
- Deutsche Übersetzungen müssen präzise sein
- Grammatische Informationen (Geschlecht, Plural, Wurzel) sind wichtig
- Beispielsätze sollten einfach und lehrreich sein
- Berücksichtige das angegebene Sprachniveau

Antworte IMMER mit einem validen JSON-Array."""

        user_prompt = f"""Erstelle eine Vokabelliste zum Thema "{topic}".

Kategorie: {category}
Sprachniveau: {level.upper()}
Anzahl Vokabeln: {count}
{f'Zusätzlicher Kontext: {additional_context}' if additional_context else ''}

Erstelle ein JSON-Array mit genau {count} Vokabeln. Jede Vokabel sollte folgende Felder haben:
- arabic: Arabisches Wort (ohne Vokalzeichen)
- arabic_voweled: Arabisches Wort MIT Vokalzeichen (Tashkil)
- transliteration: Lateinische Umschrift
- german: Deutsche Hauptübersetzung
- german_alternatives: Array alternativer Übersetzungen (kann leer sein)
- word_type: Wortart (Nomen, Verb, Adjektiv, Partikel, Phrase)
- gender: Bei Nomen: "m" oder "f" (sonst null)
- plural: Pluralform auf Arabisch (wenn zutreffend, sonst null)
- root: 3-Konsonanten-Wurzel (wenn zutreffend, z.B. "ك ت ب")
- example_arabic: Beispielsatz auf Arabisch
- example_german: Gleicher Satz auf Deutsch
- notes: Hilfreiche Anmerkungen (grammatisch oder kulturell)
- difficulty: Schwierigkeit 1-5 (1=sehr einfach, 5=sehr schwer)

Antworte NUR mit dem JSON-Array, keine weiteren Erklärungen."""

        try:
            response_text = await self._call_api(system_prompt, user_prompt)
            
            # JSON aus Antwort extrahieren
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            if json_start == -1 or json_end == 0:
                raise ValueError("Keine gültige JSON-Antwort erhalten")
            
            json_str = response_text[json_start:json_end]
            vocabulary_data = json.loads(json_str)
            
            return [GeneratedVocabulary(**item) for item in vocabulary_data]
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Ungültige JSON-Antwort von der KI: {e}")
    
    # =========================================
    # Vokabeln überprüfen
    # =========================================
    async def verify_vocabulary(
        self,
        arabic: str,
        german: str,
        context: Optional[str] = None
    ) -> VocabularyVerification:
        """
        Überprüft eine Vokabel auf Korrektheit.
        
        Args:
            arabic: Arabisches Wort
            german: Deutsche Übersetzung
            context: Optionaler Kontext
        
        Returns:
            VocabularyVerification mit Ergebnis
        """
        system_prompt = """Du bist ein Experte für Arabisch-Deutsch Übersetzungen.
Deine Aufgabe ist es, Vokabeln auf Korrektheit zu überprüfen.

Bewerte:
1. Ist die Übersetzung korrekt?
2. Gibt es bessere/genauere Übersetzungen?
3. Sind arabische Schreibweise korrekt?

Antworte IMMER mit einem validen JSON-Objekt."""

        user_prompt = f"""Überprüfe diese Vokabel:

Arabisch: {arabic}
Deutsch: {german}
{f'Kontext: {context}' if context else ''}

Antworte mit einem JSON-Objekt:
{{
    "is_correct": true/false,
    "confidence": 0-100 (wie sicher bist du?),
    "corrections": {{"field": "korrektur"}} oder null wenn alles korrekt,
    "suggestions": ["alternative Übersetzungen"] oder null,
    "notes": "Erklärungen oder Hinweise"
}}

Antworte NUR mit dem JSON-Objekt."""

        try:
            response_text = await self._call_api(system_prompt, user_prompt, max_tokens=1024)
            
            # JSON aus Antwort extrahieren
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start == -1 or json_end == 0:
                raise ValueError("Keine gültige JSON-Antwort erhalten")
            
            json_str = response_text[json_start:json_end]
            data = json.loads(json_str)
            
            return VocabularyVerification(**data)
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Ungültige JSON-Antwort von der KI: {e}")
    
    # =========================================
    # Batch-Überprüfung
    # =========================================
    async def verify_vocabulary_list(
        self,
        items: List[Dict[str, str]]
    ) -> List[VocabularyVerification]:
        """
        Überprüft mehrere Vokabeln auf einmal.
        
        Args:
            items: Liste von {"arabic": "...", "german": "..."} Dictionaries
        
        Returns:
            Liste von VocabularyVerification Objekten
        """
        system_prompt = """Du bist ein Experte für Arabisch-Deutsch Übersetzungen.
Überprüfe die folgenden Vokabeln auf Korrektheit.

Für jede Vokabel bewerte:
1. Korrektheit der Übersetzung
2. Korrektheit der arabischen Schreibweise
3. Mögliche Verbesserungen

Antworte IMMER mit einem validen JSON-Array."""

        items_text = "\n".join([f"{i+1}. {item['arabic']} = {item['german']}" for i, item in enumerate(items)])
        
        user_prompt = f"""Überprüfe diese Vokabeln:

{items_text}

Antworte mit einem JSON-Array mit {len(items)} Objekten (eines pro Vokabel):
[
    {{
        "is_correct": true/false,
        "confidence": 0-100,
        "corrections": {{"arabic": "...", "german": "..."}} oder null,
        "suggestions": ["..."] oder null,
        "notes": "..."
    }},
    ...
]

Antworte NUR mit dem JSON-Array."""

        try:
            response_text = await self._call_api(system_prompt, user_prompt)
            
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            if json_start == -1 or json_end == 0:
                raise ValueError("Keine gültige JSON-Antwort erhalten")
            
            json_str = response_text[json_start:json_end]
            data = json.loads(json_str)
            
            return [VocabularyVerification(**item) for item in data]
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Ungültige JSON-Antwort von der KI: {e}")
    
    # =========================================
    # Beispielsätze generieren
    # =========================================
    async def generate_example_sentences(
        self,
        arabic: str,
        german: str,
        level: str = "a1",
        count: int = 2
    ) -> List[Dict[str, str]]:
        """
        Generiert Beispielsätze für eine Vokabel.
        
        Args:
            arabic: Arabisches Wort
            german: Deutsche Übersetzung
            level: Sprachniveau
            count: Anzahl der Sätze
        
        Returns:
            Liste von {"arabic": "...", "german": "..."} Dictionaries
        """
        system_prompt = """Du bist ein Experte für Arabisch und erstellst Beispielsätze für Sprachschüler.

Die Sätze sollten:
- Dem angegebenen Sprachniveau entsprechen
- Natürlich und alltagstauglich sein
- Das Wort im korrekten Kontext zeigen"""

        user_prompt = f"""Erstelle {count} Beispielsätze für dieses Wort:

Arabisch: {arabic}
Deutsch: {german}
Niveau: {level.upper()}

Antworte mit einem JSON-Array:
[
    {{"arabic": "arabischer Satz", "german": "deutscher Satz"}},
    ...
]

Antworte NUR mit dem JSON-Array."""

        try:
            response_text = await self._call_api(system_prompt, user_prompt, max_tokens=1024)
            
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            if json_start == -1 or json_end == 0:
                raise ValueError("Keine gültige JSON-Antwort erhalten")
            
            json_str = response_text[json_start:json_end]
            return json.loads(json_str)
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Ungültige JSON-Antwort von der KI: {e}")
    
    # =========================================
    # Vokabellisten-Vorschläge
    # =========================================
    async def suggest_vocabulary_lists(
        self,
        course_topic: str,
        level: str,
        count: int = 5
    ) -> List[VocabularyListSuggestion]:
        """
        Schlägt passende Vokabellisten für einen Kurs vor.
        
        Args:
            course_topic: Thema des Kurses
            level: Sprachniveau
            count: Anzahl der Vorschläge
        
        Returns:
            Liste von VocabularyListSuggestion Objekten
        """
        system_prompt = """Du bist ein Experte für Arabisch-Sprachunterricht und Curriculum-Design.
Du schlägst passende Vokabellisten für Arabischkurse vor."""

        user_prompt = f"""Schlage {count} Vokabellisten für diesen Kurs vor:

Kursthema: {course_topic}
Niveau: {level.upper()}

Antworte mit einem JSON-Array:
[
    {{
        "title": "Titel der Liste",
        "description": "Kurze Beschreibung",
        "category": "general/greetings/numbers/colors/family/food/animals/body/clothes/house/nature/weather/time/travel/work/school/health/religion/quran/verbs/adjectives/prepositions/phrases",
        "level": "a1/a2/b1/b2/c1/c2",
        "estimated_items": Anzahl der erwarteten Vokabeln
    }},
    ...
]

Antworte NUR mit dem JSON-Array."""

        try:
            response_text = await self._call_api(system_prompt, user_prompt, max_tokens=2048)
            
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            if json_start == -1 or json_end == 0:
                raise ValueError("Keine gültige JSON-Antwort erhalten")
            
            json_str = response_text[json_start:json_end]
            data = json.loads(json_str)
            
            return [VocabularyListSuggestion(**item) for item in data]
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Ungültige JSON-Antwort von der KI: {e}")
    
    # =========================================
    # Arabische Vokalzeichen hinzufügen
    # =========================================
    async def add_tashkil(self, arabic_text: str) -> str:
        """
        Fügt Vokalzeichen (Tashkil) zu arabischem Text hinzu.
        
        Args:
            arabic_text: Arabischer Text ohne Vokalzeichen
        
        Returns:
            Arabischer Text mit Vokalzeichen
        """
        system_prompt = """Du bist ein Experte für arabische Grammatik und Phonetik.
Deine Aufgabe ist es, arabischen Text mit korrekten Vokalzeichen (Tashkil) zu versehen."""

        user_prompt = f"""Füge die korrekten Vokalzeichen (Fatha, Kasra, Damma, Sukun, Shadda, etc.) zu diesem Text hinzu:

{arabic_text}

Antworte NUR mit dem vokalisierten Text, keine Erklärungen."""

        try:
            response_text = await self._call_api(system_prompt, user_prompt, max_tokens=512)
            return response_text.strip()
        except Exception as e:
            raise ValueError(f"Fehler beim Hinzufügen von Tashkil: {e}")
    
    # =========================================
    # Transliteration generieren
    # =========================================
    async def generate_transliteration(self, arabic_text: str) -> str:
        """
        Generiert eine lateinische Umschrift für arabischen Text.
        
        Args:
            arabic_text: Arabischer Text
        
        Returns:
            Lateinische Umschrift
        """
        system_prompt = """Du bist ein Experte für arabische Phonetik und Transliteration.
Verwende das DMG-System (Deutsche Morgenländische Gesellschaft) für die Umschrift."""

        user_prompt = f"""Erstelle eine präzise Transliteration (lateinische Umschrift) für:

{arabic_text}

Verwende das DMG-Umschriftsystem. Antworte NUR mit der Transliteration."""

        try:
            response_text = await self._call_api(system_prompt, user_prompt, max_tokens=256)
            return response_text.strip()
        except Exception as e:
            raise ValueError(f"Fehler bei der Transliteration: {e}")


# Singleton-Instanz
anthropic_vocabulary_service = AnthropicVocabularyService()

