// ===========================================
// WARIZMY EDUCATION - Islamischer Kalender (Hijri) & Tages-Empfehlungen
// ===========================================
// Ziel:
// - Hijri-Datum (islamischer Kalender) anzeigen
// - Wochentag anzeigen
// - Für den jeweiligen Tag eine kurze islamische Empfehlung ausgeben
//
// Technische Notiz:
// - Wir nutzen bewusst `Intl.DateTimeFormat` (ohne zusätzliche Dependencies).
// - Hijri-Parts (Tag/Monat/Jahr) lesen wir numerisch aus, um z.B. Ramadan (Monat 9) zu erkennen.

export type HijriDateParts = {
  day: number;
  month: number; // 1-12 (Ramadan = 9)
  year: number;
};

export type IslamicDailyInfo = {
  weekday: string; // z.B. "Montag"
  weekdayKey: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  hijriFormatted: string; // z.B. "20. Ramadan 1447 AH" (je nach Intl-Implementierung/Locale)
  hijri: HijriDateParts;
  isRamadan: boolean;
  guidance: string; // kurze Empfehlung (DE)
};

const DEFAULT_TIME_ZONE = 'Europe/Berlin';

// ===========================================
// Fallback: Hijri-Berechnung ohne Intl (Islamic Civil Calendar / tabellarisch)
// ===========================================
// Hintergrund:
// In manchen Umgebungen (z.B. bestimmte Docker/Alpine/ICU-Builds) kann `Intl` den islamischen
// Kalender (`-u-ca-islamic`) NICHT unterstützen. Dann wäre das Datum "unsichtbar".
//
// Lösung:
// - Wir versuchen zuerst `Intl` (wie geplant).
// - Falls das nicht klappt, berechnen wir Hijri tabellarisch (civil).
//
// Hinweis:
// - Der tabellarische Hijri-Kalender kann je nach Region/Sichtung um 0-1 Tage abweichen.
// - Für Umm-al-Qura (Saudi) bräuchte man eine spezielle Datenbasis/Lib.

type GregorianYMD = { year: number; month: number; day: number }; // month: 1-12

const GERMAN_WEEKDAYS = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
] as const;

const HIJRI_MONTHS_DE = [
  'Muharram',
  'Safar',
  'Rabīʿ al-awwal',
  'Rabīʿ ath-thānī',
  'Dschumādā al-ūlā',
  'Dschumādā ath-thāniya',
  'Radschab',
  'Schaʿbān',
  'Ramadan',
  'Schawwāl',
  'Dhū l-Qaʿda',
  'Dhū l-Hiddscha',
] as const;

function getGermanWeekdaySafe(date: Date, timeZone: string): string {
  try {
    // z.B. "Montag"
    return new Intl.DateTimeFormat('de-DE', { weekday: 'long', timeZone }).format(date);
  } catch {
    // Fallback: benutzt System-Zeitzone (Date#getDay)
    return GERMAN_WEEKDAYS[date.getDay()] || 'Sonntag';
  }
}

function getGregorianYmdInTimeZoneSafe(date: Date, timeZone: string): GregorianYMD {
  try {
    // Wir lesen explizit Y/M/D aus, um den "Tag" korrekt für die gewünschte Zeitzone zu bekommen.
    // `en-CA` liefert zuverlässig "YYYY-MM-DD" ähnliche Parts.
    const fmt = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone,
    });
    const parts = fmt.formatToParts(date);
    const year = safeParseInt(parts.find((p) => p.type === 'year')?.value) ?? date.getFullYear();
    const month = safeParseInt(parts.find((p) => p.type === 'month')?.value) ?? date.getMonth() + 1;
    const day = safeParseInt(parts.find((p) => p.type === 'day')?.value) ?? date.getDate();
    return { year, month, day };
  } catch {
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  }
}

function gregorianToJulianDayNumber({ year, month, day }: GregorianYMD): number {
  // Integer JDN (Gregorian calendar) – robust und ohne Floating Point.
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function julianDayNumberToHijriCivil(jdn: number): HijriDateParts {
  // Algorithmus (Kuwaiti/civil) – liefert Hijri (tabellarisch).
  // Quelle/Variante: widely used conversion formula (civil Islamic calendar).
  let l = jdn - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

function formatHijriGermanFallback(hijri: HijriDateParts): string {
  const monthName = HIJRI_MONTHS_DE[hijri.month - 1] || `Monat ${hijri.month}`;
  return `${hijri.day}. ${monthName} ${hijri.year} AH`;
}

function safeParseInt(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function getHijriNumericParts(date: Date, timeZone: string): HijriDateParts | null {
  try {
    // `en-u-ca-islamic-nu-latn` sorgt i.d.R. für lateinische Ziffern + islamischen Kalender.
    // Mit month:'numeric' bekommen wir eine Zahl (1..12), das ist ideal für Ramadan-Erkennung.
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-nu-latn', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      timeZone,
    });

    const parts = fmt.formatToParts(date);
    const day = safeParseInt(parts.find((p) => p.type === 'day')?.value);
    const month = safeParseInt(parts.find((p) => p.type === 'month')?.value);
    const year = safeParseInt(parts.find((p) => p.type === 'year')?.value);

    if (day == null || month == null || year == null) return null;
    return { day, month, year };
  } catch {
    return null;
  }
}

function getGermanWeekday(date: Date, timeZone: string): string {
  // z.B. "Montag"
  return new Intl.DateTimeFormat('de-DE', { weekday: 'long', timeZone }).format(date);
}

function getHijriFormattedGerman(date: Date, timeZone: string): string {
  // z.B. "10. Ramadan 1447 AH" (abhängig von Intl-Implementierung)
  return new Intl.DateTimeFormat('de-DE-u-ca-islamic', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(date);
}

function isMonday(weekdayDe: string): boolean {
  return weekdayDe.trim().toLowerCase() === 'montag';
}

function isThursday(weekdayDe: string): boolean {
  return weekdayDe.trim().toLowerCase() === 'donnerstag';
}

function isFriday(weekdayDe: string): boolean {
  return weekdayDe.trim().toLowerCase() === 'freitag';
}

function weekdayKeyFromGerman(weekdayDe: string): IslamicDailyInfo['weekdayKey'] {
  const key = weekdayDe.trim().toLowerCase();
  switch (key) {
    case 'montag':
      return 'monday';
    case 'dienstag':
      return 'tuesday';
    case 'mittwoch':
      return 'wednesday';
    case 'donnerstag':
      return 'thursday';
    case 'freitag':
      return 'friday';
    case 'samstag':
      return 'saturday';
    // In de-DE ist es meist "Sonntag"
    case 'sonntag':
    default:
      return 'sunday';
  }
}

function buildGuidance(opts: { weekdayDe: string; isRamadan: boolean }): string {
  const { weekdayDe, isRamadan } = opts;

  const recommendations: string[] = [];

  // Ramadan hat Priorität (Fasten ist dann ohnehin zentral).
  if (isRamadan) {
    recommendations.push(
      'Ramadan: Fasten (wenn möglich), Qur’an rezitieren, Duʿāʾ machen und Tarāwīḥ/Nachtgebet pflegen.'
    );
  } else if (isMonday(weekdayDe) || isThursday(weekdayDe)) {
    recommendations.push('Sunnah-Fasten am Montag/Donnerstag (wenn möglich).');
  }

  if (isFriday(weekdayDe)) {
    recommendations.push(
      'Jumuʿah: Ghusl, früh zum Gebet, viele Segenswünsche (Ṣalawāt) und Sūrah al-Kahf lesen.'
    );
  }

  // Genereller Reminder (kurz & alltagstauglich)
  recommendations.push('Allgemein: Gebete pünktlich, Dhikr, Qur’an und gute Taten.');

  return recommendations.join(' ');
}

export function getIslamicDailyInfo(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE
): IslamicDailyInfo | null {
  const weekday = getGermanWeekdaySafe(date, timeZone);

  // 1) Hijri per Intl (wenn verfügbar)
  // 2) Fallback: tabellarische Berechnung
  const hijriFromIntl = getHijriNumericParts(date, timeZone);
  const hijri =
    hijriFromIntl ??
    julianDayNumberToHijriCivil(
      gregorianToJulianDayNumber(getGregorianYmdInTimeZoneSafe(date, timeZone))
    );

  const isRamadan = hijri.month === 9;
  const hijriFormatted = (() => {
    try {
      return getHijriFormattedGerman(date, timeZone);
    } catch {
      return formatHijriGermanFallback(hijri);
    }
  })();
  const guidance = buildGuidance({ weekdayDe: weekday, isRamadan });
  const weekdayKey = weekdayKeyFromGerman(weekday);

  return { weekday, weekdayKey, hijriFormatted, hijri, isRamadan, guidance };
}


