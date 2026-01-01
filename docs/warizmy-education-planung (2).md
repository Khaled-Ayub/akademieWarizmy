# WARIZMY EDUCATION – Technische Planung

## Projektübersicht

Eine Lernplattform für Arabisch und islamische Bildung mit Vor-Ort-Unterricht, Live-Streaming und Aufzeichnungen.

---

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HETZNER CLOUD                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         DOCKER COMPOSE                                │  │
│  │                                                                       │  │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │  │
│  │   │   NGINX     │    │   Next.js   │    │        Strapi           │  │  │
│  │   │   Reverse   │───▶│   Frontend  │    │     Headless CMS        │  │  │
│  │   │   Proxy     │    │   (PWA)     │    │   (Kursinhalte, Blog)   │  │  │
│  │   │   + SSL     │    │   :3000     │    │        :1337            │  │  │
│  │   └─────────────┘    └──────┬──────┘    └───────────┬─────────────┘  │  │
│  │         │                   │                       │                │  │
│  │         │                   │                       │                │  │
│  │         │            ┌──────▼───────────────────────▼──────┐         │  │
│  │         │            │                                     │         │  │
│  │         │            │           FastAPI Backend           │         │  │
│  │         └───────────▶│     (Zahlungen, Auth, Logik)        │         │  │
│  │                      │              :8000                  │         │  │
│  │                      │                                     │         │  │
│  │                      └──────────────────┬──────────────────┘         │  │
│  │                                         │                            │  │
│  │                      ┌──────────────────▼──────────────────┐         │  │
│  │                      │                                     │         │  │
│  │                      │         PostgreSQL 16               │         │  │
│  │                      │           :5432                     │         │  │
│  │                      │                                     │         │  │
│  │                      └─────────────────────────────────────┘         │  │
│  │                                                                       │  │
│  │                      ┌─────────────────────────────────────┐         │  │
│  │                      │            Redis                    │         │  │
│  │                      │     (Sessions, Cache, Queue)        │         │  │
│  │                      │           :6379                     │         │  │
│  │                      └─────────────────────────────────────┘         │  │
│  │                                                                       │  │
│  │                      ┌─────────────────────────────────────┐         │  │
│  │                      │         MinIO / S3                  │         │  │
│  │                      │   (Videos, PDFs, Zertifikate)       │         │  │
│  │                      │           :9000                     │         │  │
│  │                      └─────────────────────────────────────┘         │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech-Stack

### Frontend
| Komponente | Technologie | Zweck |
|------------|-------------|-------|
| Framework | Next.js 14+ (App Router) | SSR, SEO, Routing |
| Sprache | TypeScript | Typsicherheit |
| Styling | Tailwind CSS | Utility-First CSS |
| State | Zustand | Globaler State |
| Forms | React Hook Form + Zod | Formularvalidierung |
| PWA | next-pwa | Offline, Installierbar |
| Video Player | Vimeo Embed | Video-Streaming (extern gehostet) |
| Kalender | react-big-calendar | Terminbuchung |
| Icons | Lucide React | Icon-Bibliothek |

### Backend (FastAPI)
| Komponente | Technologie | Zweck |
|------------|-------------|-------|
| Framework | FastAPI | REST API |
| ORM | SQLAlchemy 2.0 | Datenbankzugriff |
| Migration | Alembic | Schema-Migration |
| Auth | JWT + OAuth2 | Authentifizierung |
| Validation | Pydantic v2 | Datenvalidierung |
| Background Jobs | Celery + Redis | Async Tasks |
| E-Mail | FastAPI-Mail | E-Mail-Versand |
| PDF | WeasyPrint | Rechnungen, Zertifikate |
| Zoom | Zoom API SDK | Integration |

### Headless CMS (Strapi)
| Komponente | Technologie | Zweck |
|------------|-------------|-------|
| CMS | Strapi v5 | Content-Verwaltung |
| Plugin | @strapi/plugin-upload | Media-Upload |
| Plugin | @strapi/plugin-i18n | Später: Mehrsprachigkeit |

### Infrastruktur
| Komponente | Technologie | Zweck |
|------------|-------------|-------|
| Container | Docker + Docker Compose | Deployment |
| Reverse Proxy | Nginx | SSL, Load Balancing |
| SSL | Let's Encrypt (Certbot) | HTTPS |
| Datenbank | PostgreSQL 16 | Primäre Datenbank |
| Cache | Redis | Sessions, Cache, Queue |
| Storage | MinIO (S3-kompatibel) | PDFs, Zertifikate, Materialien |
| Monitoring | Uptime Kuma | Health Checks |
| Logs | Loki + Grafana | Log-Aggregation |
| Backup | Restic + B2 | Automatische Backups |

### Externe Services
| Service | Zweck |
|---------|-------|
| Stripe | Kreditkarten, SEPA |
| PayPal | PayPal-Zahlungen |
| Vimeo | Video-Hosting & Streaming |
| Zoom API | Live-Unterricht, Anwesenheit |
| Resend oder Postmark | Transaktionale E-Mails |

---

## Datenbank-Empfehlung

### Option: Getrennte Datenbanken (Empfohlen)

```
┌─────────────────────┐     ┌─────────────────────┐
│   PostgreSQL        │     │   PostgreSQL        │
│   (FastAPI)         │     │   (Strapi)          │
│                     │     │                     │
│   - users           │     │   - courses         │
│   - enrollments     │     │   - lessons         │
│   - payments        │     │   - blog_posts      │
│   - attendance      │     │   - faqs            │
│   - exams           │     │   - testimonials    │
│   - certificates    │     │   - wiki (später)   │
│   - invoices        │     │                     │
└─────────────────────┘     └─────────────────────┘
```

**Vorteile:**
- Saubere Trennung: CMS-Inhalte vs. Anwendungslogik
- Unabhängige Backups und Skalierung
- Strapi kann aktualisiert werden ohne FastAPI zu beeinflussen
- Kein Risiko, dass sich Migrationen überschneiden

**Synchronisation:**
- Strapi-Kurs-IDs werden in FastAPI referenziert
- FastAPI ruft Kursdaten via Strapi REST API ab
- Webhook von Strapi zu FastAPI bei Content-Änderungen

---

## Datenbankschema (FastAPI)

```sql
-- Benutzer
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_zip VARCHAR(20),
    address_country VARCHAR(100) DEFAULT 'Deutschland',
    role VARCHAR(20) DEFAULT 'student', -- student, teacher, admin
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Klassen (Gruppe von Studenten für einen Kurs mit festen Terminen)
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strapi_course_id INTEGER NOT NULL, -- Referenz zu Strapi Kurs
    name VARCHAR(255) NOT NULL, -- z.B. "Arabisch A1 - Herbst 2026"
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    max_students INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Klassen-Lehrer (ein Kurs kann mehrere Lehrer haben)
CREATE TABLE class_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false, -- Hauptlehrer
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(class_id, teacher_id)
);

-- Wiederkehrende Termine für Klassen (Stundenplan)
CREATE TABLE class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Montag, 6=Sonntag
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255), -- Für Vor-Ort
    session_type VARCHAR(20) DEFAULT 'hybrid', -- online, onsite, hybrid
    zoom_meeting_id VARCHAR(100),
    zoom_join_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Unterrichtsfreie Zeiten (Ferien, Feiertage)
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL, -- z.B. "Winterferien", "Eid al-Fitr"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    applies_to_all BOOLEAN DEFAULT true, -- Gilt für alle Klassen
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE, -- Oder nur für bestimmte Klasse
    created_at TIMESTAMP DEFAULT NOW()
);

-- Klassen-Mitgliedschaft (Student in Klasse)
CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    enrollment_type VARCHAR(20) NOT NULL, -- 'one_time', 'subscription'
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired
    started_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, class_id)
);

-- Kurs-Einschreibungen (für Seminare ohne Klasse)
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strapi_course_id INTEGER NOT NULL, -- Referenz zu Strapi
    enrollment_type VARCHAR(20) NOT NULL, -- 'one_time', 'subscription'
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired
    started_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lektions-Fortschritt
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strapi_lesson_id INTEGER NOT NULL,
    strapi_course_id INTEGER NOT NULL,
    completed BOOLEAN DEFAULT false,
    quiz_score INTEGER, -- NULL wenn kein Quiz oder nicht absolviert
    quiz_passed BOOLEAN,
    watched_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, strapi_lesson_id)
);

-- Zahlungen
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_method VARCHAR(20) NOT NULL, -- stripe, paypal, bank_transfer
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
    stripe_payment_id VARCHAR(255),
    paypal_order_id VARCHAR(255),
    bank_transfer_reference VARCHAR(100),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Abonnements
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255),
    paypal_subscription_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, past_due
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rechnungen
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    pdf_path VARCHAR(500),
    issued_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Unterrichtstermine (Live-Sessions) - generiert aus class_schedules
CREATE TABLE live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    strapi_course_id INTEGER NOT NULL,
    strapi_lesson_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_type VARCHAR(20) DEFAULT 'online', -- online, onsite, hybrid
    location VARCHAR(255), -- Für Vor-Ort
    zoom_meeting_id VARCHAR(100),
    zoom_join_url VARCHAR(500),
    zoom_password VARCHAR(50),
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 90,
    vimeo_video_id VARCHAR(100), -- Vimeo ID nach Upload
    vimeo_video_url VARCHAR(500), -- Vimeo URL nach Upload
    is_cancelled BOOLEAN DEFAULT false,
    cancel_reason VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Teilnahmebestätigung (Student bestätigt vorher ob er kommt)
CREATE TABLE attendance_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
    will_attend BOOLEAN NOT NULL, -- Ja/Nein
    absence_reason TEXT, -- Optional, wenn Nein
    confirmed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, live_session_id)
);

-- Anwesenheit (tatsächliche Teilnahme)
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
    attendance_type VARCHAR(20) NOT NULL, -- online, onsite
    status VARCHAR(20) DEFAULT 'present', -- present, absent_excused, absent_unexcused
    checked_in_at TIMESTAMP,
    checked_in_by VARCHAR(20), -- 'zoom_auto', 'manual', 'self_confirmed'
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, live_session_id)
);

-- Prüfungstermine
CREATE TABLE exam_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    strapi_course_id INTEGER NOT NULL,
    examiner_id UUID REFERENCES users(id), -- Lehrer/Prüfer
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    zoom_meeting_id VARCHAR(100),
    zoom_join_url VARCHAR(500),
    is_booked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Prüfungsbuchungen mit Noten
CREATE TABLE exam_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exam_slot_id UUID REFERENCES exam_slots(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
    pvl_fulfilled BOOLEAN DEFAULT false, -- Prüfungsvorleistung erfüllt (80% Anwesenheit)
    result VARCHAR(20), -- passed, failed
    grade DECIMAL(2,1), -- Note z.B. 1.0, 2.3, 3.7
    examiner_notes TEXT,
    examined_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(exam_slot_id) -- Ein Slot kann nur einmal gebucht werden
);

-- PVL Berechnung View (Anwesenheit + Video-Fortschritt)
-- Wird als View erstellt für einfache Abfrage
-- CREATE VIEW student_pvl_status AS ...
-- (80% aus: Live-Sessions Anwesenheit + Video-Lektionen abgeschlossen)

-- Zertifikate
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strapi_course_id INTEGER NOT NULL,
    exam_booking_id UUID REFERENCES exam_bookings(id),
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issued_at TIMESTAMP DEFAULT NOW(),
    pdf_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- E-Mail-Log
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email_type VARCHAR(50) NOT NULL, -- welcome, purchase_confirmation, reminder, etc.
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent', -- sent, failed, bounced
    error_message TEXT
);

-- Indices für Performance
CREATE INDEX idx_classes_course ON classes(strapi_course_id);
CREATE INDEX idx_class_enrollments_user ON class_enrollments(user_id);
CREATE INDEX idx_class_enrollments_class ON class_enrollments(class_id);
CREATE INDEX idx_class_schedules_class ON class_schedules(class_id);
CREATE INDEX idx_attendance_confirmations_session ON attendance_confirmations(live_session_id);
CREATE INDEX idx_attendance_confirmations_user ON attendance_confirmations(user_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(strapi_course_id);
CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_attendance_session ON attendance(live_session_id);
CREATE INDEX idx_live_sessions_date ON live_sessions(scheduled_at);
CREATE INDEX idx_live_sessions_class ON live_sessions(class_id);
CREATE INDEX idx_exam_slots_date ON exam_slots(scheduled_at);
CREATE INDEX idx_exam_slots_class ON exam_slots(class_id);
CREATE INDEX idx_holidays_dates ON holidays(start_date, end_date);
```

---

## Strapi Content-Types

### Course (Kurs)
```javascript
{
  "kind": "collectionType",
  "collectionName": "courses",
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title" },
    "description": { "type": "richtext" },
    "short_description": { "type": "text" },
    "thumbnail": { "type": "media", "allowedTypes": ["images"] },
    "preview_video_id": { "type": "string" }, // Vimeo Vorschau-Video
    "price": { "type": "decimal" },
    "price_type": { "type": "enumeration", "enum": ["one_time", "subscription", "both"] },
    "subscription_price": { "type": "decimal" },
    "course_type": { "type": "enumeration", "enum": ["course", "seminar"] }, // Kurs oder Seminar
    "is_published": { "type": "boolean", "default": false },
    "category": { "type": "enumeration", "enum": ["arabic", "islamic"] },
    "level": { "type": "enumeration", "enum": ["beginner", "intermediate", "advanced"] },
    "book_affiliate_link": { "type": "string" }, // Affiliate Link zum Buch kaufen
    "book_pdf": { "type": "media", "allowedTypes": ["files"] }, // Oder PDF Download
    "lessons": { "type": "relation", "relation": "oneToMany", "target": "api::lesson.lesson" },
    "teachers": { "type": "relation", "relation": "manyToMany", "target": "api::teacher.teacher" }
  }
}
```

### Lesson (Lektion)
```javascript
{
  "kind": "collectionType",
  "collectionName": "lessons",
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title" },
    "description": { "type": "richtext" },
    "order": { "type": "integer", "required": true },
    "vimeo_video_id": { "type": "string" }, // Vimeo Video ID für Embed
    "vimeo_video_url": { "type": "string" }, // Vollständige Vimeo URL
    "duration_minutes": { "type": "integer" },
    "materials": { "type": "media", "allowedTypes": ["files"], "multiple": true },
    "has_quiz": { "type": "boolean", "default": false },
    "quiz": { "type": "relation", "relation": "oneToOne", "target": "api::quiz.quiz" },
    "course": { "type": "relation", "relation": "manyToOne", "target": "api::course.course" }
  }
}
```

### Quiz
```javascript
{
  "kind": "collectionType",
  "collectionName": "quizzes",
  "attributes": {
    "title": { "type": "string", "required": true },
    "passing_score": { "type": "integer", "default": 70 },
    "questions": { "type": "component", "repeatable": true, "component": "quiz.question" }
  }
}

// Component: quiz.question
{
  "collectionName": "components_quiz_questions",
  "attributes": {
    "question_text": { "type": "text", "required": true },
    "question_type": { "type": "enumeration", "enum": ["multiple_choice", "true_false"] },
    "options": { "type": "json" }, // ["Option A", "Option B", "Option C", "Option D"]
    "correct_answer": { "type": "integer" }, // Index der richtigen Antwort
    "explanation": { "type": "text" }
  }
}
```

### Teacher (Lehrer)
```javascript
{
  "kind": "collectionType",
  "collectionName": "teachers",
  "attributes": {
    "name": { "type": "string", "required": true },
    "bio": { "type": "richtext" },
    "photo": { "type": "media", "allowedTypes": ["images"] },
    "qualifications": { "type": "text" },
    "courses": { "type": "relation", "relation": "manyToMany", "target": "api::course.course" }
  }
}
```

### Testimonial (Bewertung)
```javascript
{
  "kind": "collectionType",
  "collectionName": "testimonials",
  "attributes": {
    "name": { "type": "string", "required": true },
    "content": { "type": "text", "required": true },
    "rating": { "type": "integer", "min": 1, "max": 5 },
    "photo": { "type": "media", "allowedTypes": ["images"] },
    "course": { "type": "relation", "relation": "manyToOne", "target": "api::course.course" },
    "is_featured": { "type": "boolean", "default": false }
  }
}
```

### FAQ
```javascript
{
  "kind": "collectionType",
  "collectionName": "faqs",
  "attributes": {
    "question": { "type": "string", "required": true },
    "answer": { "type": "richtext", "required": true },
    "order": { "type": "integer" },
    "category": { "type": "string" }
  }
}
```

### Page (Statische Seiten)
```javascript
{
  "kind": "collectionType",
  "collectionName": "pages",
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title" },
    "content": { "type": "richtext" },
    "seo_title": { "type": "string" },
    "seo_description": { "type": "text" }
  }
}
```

---

## API-Endpunkte (FastAPI)

### Authentifizierung
```
POST   /api/auth/register          # Registrierung
POST   /api/auth/login             # Login (JWT)
POST   /api/auth/logout            # Logout
POST   /api/auth/refresh           # Token erneuern
POST   /api/auth/forgot-password   # Passwort vergessen
POST   /api/auth/reset-password    # Passwort zurücksetzen
GET    /api/auth/verify-email      # E-Mail verifizieren
GET    /api/auth/me                # Aktueller Benutzer
```

### Benutzer
```
GET    /api/users/me               # Eigenes Profil
PUT    /api/users/me               # Profil aktualisieren
GET    /api/users/me/classes       # Meine Klassen
GET    /api/users/me/enrollments   # Meine Seminare (ohne Klasse)
GET    /api/users/me/progress      # Mein Fortschritt
GET    /api/users/me/pvl-status    # PVL Status pro Kurs (80% Anwesenheit)
GET    /api/users/me/certificates  # Meine Zertifikate
GET    /api/users/me/invoices      # Meine Rechnungen
GET    /api/users/me/grades        # Meine Noten

# Admin
GET    /api/admin/users            # Alle Benutzer
GET    /api/admin/users/{id}       # Benutzer Details
PUT    /api/admin/users/{id}       # Benutzer bearbeiten
PUT    /api/admin/users/{id}/role  # Rolle ändern (student/teacher/admin)
DELETE /api/admin/users/{id}       # Benutzer deaktivieren
```

### Klassen
```
GET    /api/classes                        # Alle Klassen (Admin)
GET    /api/classes/{id}                   # Klasse Details
GET    /api/classes/{id}/students          # Studenten der Klasse
GET    /api/classes/{id}/schedule          # Stundenplan der Klasse
GET    /api/classes/{id}/sessions          # Alle Sessions der Klasse
GET    /api/classes/{id}/attendance-report # Anwesenheitsbericht

# Admin
POST   /api/admin/classes                  # Klasse erstellen
PUT    /api/admin/classes/{id}             # Klasse bearbeiten
DELETE /api/admin/classes/{id}             # Klasse löschen
POST   /api/admin/classes/{id}/students    # Student zur Klasse hinzufügen
DELETE /api/admin/classes/{id}/students/{userId}  # Student entfernen
POST   /api/admin/classes/{id}/schedule    # Stundenplan erstellen/bearbeiten
```

### Einschreibungen & Fortschritt
```
POST   /api/enrollments                     # Seminar buchen (ohne Klasse)
GET    /api/enrollments/{id}                # Einschreibung Details
DELETE /api/enrollments/{id}                # Kurs kündigen (Abo)

POST   /api/progress/lesson/{lesson_id}     # Lektion als abgeschlossen markieren
POST   /api/progress/quiz/{lesson_id}       # Quiz absolvieren
GET    /api/progress/course/{course_id}     # Kursfortschritt
```

### Kalender & Stundenplan
```
GET    /api/calendar                        # Mein Kalender (alle Sessions)
GET    /api/calendar/day/{date}             # Tag-Ansicht
GET    /api/calendar/week/{date}            # Wochen-Ansicht
GET    /api/calendar/month/{year}/{month}   # Monats-Ansicht
GET    /api/calendar/year/{year}            # Jahres-Ansicht
GET    /api/holidays                        # Unterrichtsfreie Zeiten

# Admin
POST   /api/admin/holidays                  # Ferien/Feiertag erstellen
PUT    /api/admin/holidays/{id}             # Bearbeiten
DELETE /api/admin/holidays/{id}             # Löschen
```

### Live-Sessions & Anwesenheit
```
GET    /api/sessions                        # Meine kommenden Sessions
GET    /api/sessions/upcoming               # Sessions der nächsten 7 Tage (für "Aktuelles" Widget)
GET    /api/sessions/{id}                   # Session Details
POST   /api/sessions/{id}/join              # Zoom-Link erhalten

# Teilnahmebestätigung (Student)
POST   /api/sessions/{id}/confirm           # Teilnahme bestätigen (Ja/Nein + optionaler Grund)
GET    /api/sessions/{id}/my-confirmation   # Meine Bestätigung abrufen

# Admin/Lehrer
POST   /api/admin/sessions                  # Session erstellen
PUT    /api/admin/sessions/{id}             # Session bearbeiten
DELETE /api/admin/sessions/{id}             # Session löschen
POST   /api/admin/sessions/{id}/cancel      # Session absagen
GET    /api/admin/sessions/{id}/confirmations  # Alle Bestätigungen (wer kommt?)

# Anwesenheit (Admin/Lehrer)
POST   /api/admin/sessions/{id}/attendance      # Anwesenheit eintragen
GET    /api/admin/sessions/{id}/attendance      # Anwesenheitsliste
PUT    /api/admin/attendance/{id}               # Einzelne Anwesenheit bearbeiten

# Zoom Webhook
POST   /api/webhooks/zoom                   # Zoom Events (Auto-Anwesenheit)
```

### Zahlungen
```
POST   /api/payments/stripe/create-checkout     # Stripe Checkout Session
POST   /api/payments/stripe/webhook             # Stripe Webhooks
POST   /api/payments/paypal/create-order        # PayPal Order erstellen
POST   /api/payments/paypal/capture             # PayPal Zahlung abschließen
POST   /api/payments/bank-transfer/notify       # Überweisung melden
GET    /api/payments/{id}                       # Zahlung Details
GET    /api/payments/{id}/invoice               # Rechnung PDF

# Admin
GET    /api/admin/payments                      # Alle Zahlungen
PUT    /api/admin/payments/{id}/confirm         # Überweisung bestätigen
GET    /api/admin/payments/pending              # Ausstehende Zahlungen
GET    /api/admin/payments/stats                # Zahlungsstatistiken
```

### Prüfungen
```
GET    /api/exams/slots                         # Verfügbare Prüfungstermine
GET    /api/exams/my-pvl/{course_id}            # Mein PVL-Status für Kurs
POST   /api/exams/book                          # Termin buchen (nur wenn PVL erfüllt)
GET    /api/exams/my-bookings                   # Meine Prüfungstermine
GET    /api/exams/my-grades                     # Meine Noten
DELETE /api/exams/bookings/{id}                 # Termin stornieren

# Admin/Prüfer
GET    /api/admin/exams/slots                   # Alle Slots
POST   /api/admin/exams/slots                   # Slot erstellen
DELETE /api/admin/exams/slots/{id}              # Slot löschen
PUT    /api/admin/exams/bookings/{id}/result    # Ergebnis + Note eintragen
```

### Zertifikate
```
GET    /api/certificates                        # Meine Zertifikate
GET    /api/certificates/{id}/download          # PDF herunterladen
GET    /api/certificates/verify/{number}        # Zertifikat verifizieren (öffentlich)

# Admin
POST   /api/admin/certificates/issue            # Zertifikat ausstellen
```

---

## Seitenstruktur (Next.js)

```
app/
├── (public)/                    # Öffentliche Seiten
│   ├── page.tsx                 # Startseite
│   ├── kurse/
│   │   ├── page.tsx             # Kursübersicht
│   │   └── [slug]/
│   │       └── page.tsx         # Kursdetails
│   ├── ueber-uns/
│   │   └── page.tsx             # Über uns
│   ├── faq/
│   │   └── page.tsx             # FAQ
│   ├── kontakt/
│   │   └── page.tsx             # Kontakt
│   ├── impressum/
│   │   └── page.tsx             # Impressum
│   ├── datenschutz/
│   │   └── page.tsx             # Datenschutz
│   └── agb/
│       └── page.tsx             # AGB
│
├── (auth)/                      # Auth-Seiten
│   ├── login/
│   │   └── page.tsx             # Login
│   ├── registrieren/
│   │   └── page.tsx             # Registrierung
│   ├── passwort-vergessen/
│   │   └── page.tsx             # Passwort vergessen
│   └── passwort-zuruecksetzen/
│       └── page.tsx             # Passwort zurücksetzen
│
├── (student)/                   # Studentenportal (geschützt)
│   ├── layout.tsx               # Portal Layout
│   ├── dashboard/
│   │   └── page.tsx             # Dashboard mit "Aktuelles" Widget
│   │                            # - Heutige/kommende Sessions
│   │                            # - "Nimmst du teil?" Ja/Nein
│   │                            # - PVL-Status Anzeige
│   │                            # - Nächste Prüfung
│   ├── meine-kurse/
│   │   ├── page.tsx             # Meine Kurse/Klassen
│   │   └── [courseId]/
│   │       ├── page.tsx         # Kurs-Lernansicht
│   │       └── lektion/
│   │           └── [lessonId]/
│   │               └── page.tsx # Einzelne Lektion (Video + Quiz)
│   ├── kalender/
│   │   └── page.tsx             # Kalender (Tag/Woche/Monat/Jahr)
│   │                            # - Meine Sessions
│   │                            # - Unterrichtsfreie Zeiten
│   │                            # - Prüfungstermine
│   ├── anwesenheit/
│   │   └── page.tsx             # Meine Anwesenheit
│   │                            # - Übersicht pro Kurs
│   │                            # - PVL-Fortschritt (80%)
│   │                            # - Entschuldigt/Unentschuldigt
│   ├── pruefungen/
│   │   ├── page.tsx             # Meine Prüfungen
│   │   │                        # - PVL erfüllt? 
│   │   │                        # - Noten
│   │   └── buchen/
│   │       └── page.tsx         # Prüfung buchen
│   ├── zertifikate/
│   │   └── page.tsx             # Meine Zertifikate
│   ├── rechnungen/
│   │   └── page.tsx             # Meine Rechnungen
│   └── profil/
│       └── page.tsx             # Profil bearbeiten
│
├── (teacher)/                   # Lehrerportal (geschützt)
│   ├── layout.tsx               # Lehrer Layout
│   ├── dashboard/
│   │   └── page.tsx             # Lehrer Dashboard
│   │                            # - Heutige Sessions
│   │                            # - Anstehende Prüfungen
│   ├── meine-klassen/
│   │   ├── page.tsx             # Meine Klassen
│   │   └── [classId]/
│   │       ├── page.tsx         # Klassen-Details
│   │       └── studenten/
│   │           └── page.tsx     # Studentenliste der Klasse
│   ├── anwesenheit/
│   │   ├── page.tsx             # Anwesenheit eintragen
│   │   └── [sessionId]/
│   │       └── page.tsx         # Session Anwesenheit
│   ├── pruefungen/
│   │   ├── page.tsx             # Meine Prüfungen
│   │   └── [id]/
│   │       └── page.tsx         # Ergebnis & Note eintragen
│   └── kalender/
│       └── page.tsx             # Mein Stundenplan
│
├── (admin)/                     # Admin-Bereich (geschützt)
│   ├── layout.tsx               # Admin Layout
│   ├── admin/
│   │   ├── page.tsx             # Admin Dashboard
│   │   │                        # - Neue Anmeldungen
│   │   │                        # - Einnahmen
│   │   │                        # - Aktive Studenten
│   │   │                        # - Heutige Sessions
│   │   │
│   │   ├── benutzer/
│   │   │   ├── page.tsx         # Alle Benutzer
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # Benutzer Details
│   │   │   └── neu/
│   │   │       └── page.tsx     # Neuer Benutzer
│   │   │
│   │   ├── klassen/
│   │   │   ├── page.tsx         # Alle Klassen
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx     # Klasse Details
│   │   │   │   ├── studenten/
│   │   │   │   │   └── page.tsx # Studenten zuweisen
│   │   │   │   └── stundenplan/
│   │   │   │       └── page.tsx # Stundenplan bearbeiten
│   │   │   └── neu/
│   │   │       └── page.tsx     # Neue Klasse erstellen
│   │   │
│   │   ├── zahlungen/
│   │   │   ├── page.tsx         # Alle Zahlungen
│   │   │   ├── ausstehend/
│   │   │   │   └── page.tsx     # Ausstehende Zahlungen
│   │   │   └── statistiken/
│   │   │       └── page.tsx     # Umsatzstatistiken
│   │   │
│   │   ├── kalender/
│   │   │   ├── page.tsx         # Gesamtkalender (Tag/Woche/Monat/Jahr)
│   │   │   └── ferien/
│   │   │       └── page.tsx     # Unterrichtsfreie Zeiten verwalten
│   │   │
│   │   ├── anwesenheit/
│   │   │   ├── page.tsx         # Anwesenheit Übersicht
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx     # Anwesenheit eintragen
│   │   │
│   │   ├── pruefungen/
│   │   │   ├── page.tsx         # Alle Prüfungen
│   │   │   ├── termine/
│   │   │   │   └── page.tsx     # Termine verwalten
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Ergebnis eintragen
│   │   │
│   │   ├── zertifikate/
│   │   │   ├── page.tsx         # Alle Zertifikate
│   │   │   └── ausstellen/
│   │   │       └── page.tsx     # Neues Zertifikat
│   │   │
│   │   └── einstellungen/
│   │       └── page.tsx         # Systemeinstellungen
│
├── components/                  # Wiederverwendbare Komponenten
│   ├── ui/                      # Basis UI (Button, Input, Card, etc.)
│   ├── layout/                  # Header, Footer, Sidebar
│   ├── dashboard/
│   │   ├── AttendanceWidget.tsx # "Nimmst du teil?" Widget
│   │   ├── PVLProgress.tsx      # PVL Fortschrittsanzeige
│   │   └── UpcomingSessions.tsx # Kommende Sessions
│   ├── calendar/
│   │   ├── CalendarView.tsx     # Kalender (Tag/Woche/Monat/Jahr)
│   │   └── SessionCard.tsx      # Session im Kalender
│   ├── course/                  # Kurs-spezifische Komponenten
│   ├── video/                   # Vimeo Embed
│   ├── quiz/                    # Quiz Komponenten
│   └── forms/                   # Formular Komponenten
│
├── lib/                         # Utilities
│   ├── api.ts                   # API Client
│   ├── strapi.ts                # Strapi Client
│   ├── auth.ts                  # Auth Helpers
│   └── utils.ts                 # Allgemeine Utilities
│
├── hooks/                       # Custom Hooks
│   ├── useAuth.ts
│   ├── useCourse.ts
│   ├── useProgress.ts
│   ├── useAttendance.ts
│   └── useCalendar.ts
│
├── stores/                      # Zustand Stores
│   ├── authStore.ts
│   └── progressStore.ts
│
├── types/                       # TypeScript Types
│   ├── course.ts
│   ├── user.ts
│   ├── class.ts
│   ├── attendance.ts
│   └── api.ts
│
└── styles/
    └── globals.css              # Globale Styles
```

---

## Docker Compose

```yaml
version: '3.9'

services:
  # PostgreSQL für FastAPI
  postgres-app:
    image: postgres:16-alpine
    container_name: warizmy-postgres-app
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: warizmy_app
    volumes:
      - postgres_app_data:/var/lib/postgresql/data
    networks:
      - warizmy-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d warizmy_app"]
      interval: 10s
      timeout: 5s
      retries: 5

  # PostgreSQL für Strapi
  postgres-strapi:
    image: postgres:16-alpine
    container_name: warizmy-postgres-strapi
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: warizmy_strapi
    volumes:
      - postgres_strapi_data:/var/lib/postgresql/data
    networks:
      - warizmy-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d warizmy_strapi"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: warizmy-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - warizmy-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO (S3-kompatibler Speicher)
  minio:
    image: minio/minio:latest
    container_name: warizmy-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    networks:
      - warizmy-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # FastAPI Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: warizmy-backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres-app:5432/warizmy_app
      REDIS_URL: redis://redis:6379/0
      STRAPI_URL: http://strapi:1337
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      PAYPAL_CLIENT_ID: ${PAYPAL_CLIENT_ID}
      PAYPAL_CLIENT_SECRET: ${PAYPAL_CLIENT_SECRET}
      ZOOM_ACCOUNT_ID: ${ZOOM_ACCOUNT_ID}
      ZOOM_CLIENT_ID: ${ZOOM_CLIENT_ID}
      ZOOM_CLIENT_SECRET: ${ZOOM_CLIENT_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
    depends_on:
      postgres-app:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - warizmy-network

  # Celery Worker (Background Jobs)
  celery:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: warizmy-celery
    restart: unless-stopped
    command: celery -A app.celery worker --loglevel=info
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres-app:5432/warizmy_app
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - backend
      - redis
    networks:
      - warizmy-network

  # Strapi CMS
  strapi:
    build:
      context: ./strapi
      dockerfile: Dockerfile
    container_name: warizmy-strapi
    restart: unless-stopped
    environment:
      DATABASE_CLIENT: postgres
      DATABASE_HOST: postgres-strapi
      DATABASE_PORT: 5432
      DATABASE_NAME: warizmy_strapi
      DATABASE_USERNAME: ${DB_USER}
      DATABASE_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${STRAPI_JWT_SECRET}
      ADMIN_JWT_SECRET: ${STRAPI_ADMIN_JWT_SECRET}
      APP_KEYS: ${STRAPI_APP_KEYS}
      API_TOKEN_SALT: ${STRAPI_API_TOKEN_SALT}
    volumes:
      - strapi_uploads:/opt/app/public/uploads
    depends_on:
      postgres-strapi:
        condition: service_healthy
    networks:
      - warizmy-network

  # Next.js Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: warizmy-frontend
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
      NEXT_PUBLIC_STRAPI_URL: ${STRAPI_PUBLIC_URL}
      NEXT_PUBLIC_STRIPE_PUBLIC_KEY: ${STRIPE_PUBLIC_KEY}
    depends_on:
      - backend
      - strapi
    networks:
      - warizmy-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: warizmy-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot_webroot:/var/www/certbot:ro
      - certbot_certs:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend
      - strapi
    networks:
      - warizmy-network

  # Certbot für SSL
  certbot:
    image: certbot/certbot
    container_name: warizmy-certbot
    volumes:
      - certbot_webroot:/var/www/certbot
      - certbot_certs:/etc/letsencrypt
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  postgres_app_data:
  postgres_strapi_data:
  redis_data:
  minio_data:
  strapi_uploads:
  certbot_webroot:
  certbot_certs:

networks:
  warizmy-network:
    driver: bridge
```

---

## Nginx Konfiguration

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8000;
    }

    upstream strapi {
        server strapi:1337;
    }

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name ac.warizmy.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Main Server
    server {
        listen 443 ssl http2;
        server_name ac.warizmy.com;

        ssl_certificate /etc/letsencrypt/live/ac.warizmy.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/ac.warizmy.com/privkey.pem;

        # SSL Settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend API
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Webhooks (keine Rate Limits)
        location /api/webhooks/ {
            proxy_pass http://backend/api/webhooks/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Strapi Admin
        location /cms/ {
            proxy_pass http://strapi/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Strapi API
        location /cms-api/ {
            proxy_pass http://strapi/api/;
            proxy_set_header Host $host;
        }
    }
}
```

---

## Projektstruktur (Gesamt)

```
warizmy-education/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .env
├── README.md
│
├── frontend/                    # Next.js
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── app/
│       └── ...
│
├── backend/                     # FastAPI
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── celery.py
│       ├── models/
│       │   ├── user.py
│       │   ├── enrollment.py
│       │   ├── payment.py
│       │   └── ...
│       ├── schemas/
│       │   └── ...
│       ├── routers/
│       │   ├── auth.py
│       │   ├── users.py
│       │   ├── enrollments.py
│       │   ├── payments.py
│       │   ├── sessions.py
│       │   ├── exams.py
│       │   └── ...
│       ├── services/
│       │   ├── stripe_service.py
│       │   ├── paypal_service.py
│       │   ├── zoom_service.py
│       │   ├── email_service.py
│       │   ├── pdf_service.py
│       │   └── ...
│       ├── tasks/
│       │   ├── email_tasks.py
│       │   └── ...
│       └── utils/
│           └── ...
│
├── strapi/                      # Strapi CMS
│   ├── Dockerfile
│   ├── package.json
│   ├── config/
│   ├── src/
│   │   └── api/
│   │       ├── course/
│   │       ├── lesson/
│   │       ├── quiz/
│   │       └── ...
│   └── public/
│
├── nginx/
│   ├── nginx.conf
│   └── ssl/
│
└── scripts/
    ├── backup.sh
    ├── restore.sh
    └── deploy.sh
```

---

## Hetzner Server-Empfehlung

### Entwicklung / Staging
**CX31** (4 vCPU, 8 GB RAM, 80 GB SSD)
- ~€10/Monat
- Ausreichend für Entwicklung und Tests

### Produktion (Start)
**CX41** (8 vCPU, 16 GB RAM, 160 GB SSD)
- ~€20/Monat
- Gut für den Start mit bis zu ~500 aktive Nutzer

### Produktion (Skaliert)
**CCX33** (8 Dedicated vCPU, 32 GB RAM, 240 GB SSD)
- ~€70/Monat
- Für hohes Wachstum

### Zusätzlich empfohlen
- **Hetzner Storage Box BX11** (1 TB) – €3.81/Monat für Video-Backups
- **Hetzner Cloud Volumes** – Für PostgreSQL-Daten (persistenter Speicher)

---

## Nächste Schritte

1. **Projekt-Setup**
   - GitHub Repository erstellen
   - Grundstruktur anlegen
   - Docker Compose konfigurieren

2. **Backend (FastAPI)**
   - Authentifizierung implementieren
   - Datenbankmodelle erstellen
   - Basis-API-Endpunkte

3. **Strapi**
   - Content-Types erstellen
   - API-Tokens konfigurieren
   - Erste Testinhalte

4. **Frontend (Next.js)**
   - Projekt-Setup mit PWA
   - Layout und Basis-Komponenten
   - Authentifizierung UI

5. **Integration**
   - Frontend ↔ Backend ↔ Strapi verbinden
   - Stripe/PayPal Integration
   - Zoom Integration

6. **Deployment**
   - Hetzner Server einrichten
   - SSL-Zertifikate
   - CI/CD Pipeline

---

*Dokumentversion: 1.0*
*Erstellt: Januar 2026*
