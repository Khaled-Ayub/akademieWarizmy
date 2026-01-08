# ===========================================
# WARIZMY EDUCATION - AI Service
# ===========================================
# Zentrale KI-Service für Text-Generierung
# Unterstützt OpenAI und Anthropic/Claude

import os
import httpx
from typing import Optional

# =========================================
# KI-Textgenerator
# =========================================
async def generate_announcement_text(prompt: str, language: str = "de") -> str:
    """
    Generiert Ankündigungstext mit KI
    Versucht zuerst OpenAI, fällt auf Claude zurück
    """
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    # Versuche OpenAI zuerst
    if openai_key:
        try:
            return await generate_with_openai(prompt, language, openai_key)
        except Exception as e:
            print(f"OpenAI Error: {e}")
    
    # Falle auf Anthropic/Claude zurück
    if anthropic_key:
        try:
            return await generate_with_anthropic(prompt, language, anthropic_key)
        except Exception as e:
            print(f"Anthropic Error: {e}")
    
    # Fallback: Vorlagen
    return await get_fallback_suggestion(prompt, language)

async def generate_with_openai(prompt: str, language: str, api_key: str) -> str:
    """
    Generiert Text mit OpenAI GPT-3.5
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    system_prompt = {
        "de": "Du bist ein hilfreicher Assistent für eine islamische Bildungsplattform. Formuliere professionell und freundlich. Schreibe kurz und verständlich.",
        "ar": "أنت مساعد مفيد لمنصة تعليمية إسلامية. اكتب باللغة العربية الفصحى والمهذبة."
    }
    
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {
                "role": "system",
                "content": system_prompt.get(language, system_prompt["de"])
            },
            {
                "role": "user",
                "content": f"Schreibe eine kurze, ansprechende Ankündigung für: {prompt}"
            }
        ],
        "temperature": 0.7,
        "max_tokens": 300
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30.0
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
        else:
            raise Exception(f"OpenAI API Error: {response.status_code}")

async def generate_with_anthropic(prompt: str, language: str, api_key: str) -> str:
    """
    Generiert Text mit Claude/Anthropic
    """
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
    }
    
    system_prompt = {
        "de": "Du bist ein hilfreicher Assistent für eine islamische Bildungsplattform. Formuliere professionell und freundlich. Schreibe kurz und verständlich.",
        "ar": "أنت مساعد مفيد لمنصة تعليمية إسلامية. اكتب باللغة العربية الفصحى والمهذبة."
    }
    
    payload = {
        "model": "claude-3-haiku-20240307",
        "max_tokens": 300,
        "system": system_prompt.get(language, system_prompt["de"]),
        "messages": [
            {
                "role": "user",
                "content": f"Schreibe eine kurze, ansprechende Ankündigung für: {prompt}"
            }
        ]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=payload,
            timeout=30.0
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["content"][0]["text"].strip()
        else:
            raise Exception(f"Anthropic API Error: {response.status_code}")

async def get_fallback_suggestion(prompt: str, language: str) -> str:
    """Fallback-Vorschläge wenn KI nicht verfügbar"""
    templates_de = {
        "maintenance": "⚠️ Wartungsarbeiten am Wochenende\n\nUnsere Plattform wird am [Datum] von [Uhrzeit] bis [Uhrzeit] wegen Wartungsarbeiten nicht erreichbar sein. Wir bitten um Ihr Verständnis.",
        "new_course": "🎓 Neuer Kurs verfügbar!\n\nWir freuen uns, unseren neuen Kurs '[Kursname]' anzukündigen. Startdatum: [Datum]. Jetzt anmelden!",
        "exam": "📝 Prüfungstermine veröffentlicht\n\nDie Prüfungstermine für den Kurs '[Kursname]' stehen fest. Bitte überprüfen Sie Ihren Bereich für Details.",
        "holiday": "🌙 Ramadan-Angebot\n\nWährend des Ramadan bieten wir spezielle Rabatte auf alle Kurse an. Nutzen Sie den Code RAMADAN2024 bis [Datum]."
    }
    
    templates_ar = {
        "maintenance": "⚠️ أعمال الصيانة في عطلة نهاية الأسبوع\n\nستكون منصتنا غير متاحة في [التاريخ] من [الوقت] حتى [الوقت] لأعمال الصيانة. نطلب منكم تفهمكم.",
        "new_course": "🎓 دورة جديدة متاحة!\n\nيسعدنا الإعلان عن دورتنا الجديدة '[اسم الدورة]'. تاريخ البدء: [التاريخ]. سجل الآن!",
        "exam": "📝 نُشرت مواعيد الامتحانات\n\nتم تحديد مواعيد امتحانات مادة '[اسم المادة]'. يرجى التحقق من قسمك للحصول على التفاصيل.",
        "holiday": "🌙 عرض رمضان\n\nخلال شهر رمضان، نقدم خصومات خاصة على جميع الدورات. استخدم الرمز RAMADAN2024 حتى [التاريخ]."
    }
    
    templates = templates_ar if language == "ar" else templates_de
    
    # Einfaches Matching
    prompt_lower = prompt.lower()
    if "wartung" in prompt_lower or "maintenance" in prompt_lower:
        return templates["maintenance"]
    elif "kurs" in prompt_lower or "course" in prompt_lower:
        return templates["new_course"]
    elif "prüfung" in prompt_lower or "exam" in prompt_lower:
        return templates["exam"]
    elif "ramadan" in prompt_lower or "عيد" in prompt_lower:
        return templates["holiday"]
    else:
        # Generischer Fallback
        return f"📢 {prompt}\n\n[Beschreibung hier ergänzen...]\n\nWeitere Informationen folgen."
