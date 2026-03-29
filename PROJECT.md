# 10in10 - Gemeinsam abnehmen

## Vision
Eine mobile-first Progressive Web App (PWA), mit der Nutzer allein oder im Team ein Gewichtsziel erreichen. Konfigurierbar auf beliebige Zeitraeume und Kilogramm-Ziele (z.B. 10 kg in 10 Wochen). Automatische Integration von Trainingsdaten via Strava.

---

## 1. Nutzer & Authentifizierung

### Registrierung
- Nur **Name** und **PIN** erforderlich (kein E-Mail, kein Passwort-Komplexitaet)
- PIN wird mit **bcrypt** gehasht gespeichert
- PIN-Laenge ist frei waehlbar
- Optional: Koerpergroesse (fuer BMI-Berechnung)

### Login
- Name + PIN
- Session via HTTP-only Cookie (JWT)
- Kein "Passwort vergessen" (einfaches System - Admin/Team-Mitglied kann PIN zuruecksetzen)

### Profil
- Name, Groesse, Startgewicht, Zielgewicht, Zeitraum
- Strava-Verbindung (OAuth)
- Datenschutz-Einstellungen (was wird geteilt)
- Taegliche Wiege-Erinnerung (Uhrzeit einstellbar)

---

## 2. Gewichts-Tracking

### Eingabe
- **Scroll-Picker** (wie iOS-Datumsrad) fuer schnelle Eingabe
- **Letztes Gewicht ist vorausgewaehlt** - nur kleine Anpassungen noetig
- Schrittweite: 0.1 kg
- Datum wird automatisch gesetzt (heute), kann aber manuell geaendert werden

### Mehrfach-Messungen pro Tag
- Nutzer kann **beliebig oft am Tag** wiegen
- Fuer die Tagesauswertung zaehlt der **niedrigste Wert** (motivierender, reflektiert echtes Gewicht ohne Nahrung/Wasser)
- Alle Messungen werden gespeichert und sind einsehbar
- In der Historie wird angezeigt: "86.5 kg (3x)" mit Anzahl der Messungen
- Der niedrigste Wert ist visuell hervorgehoben ("Tageswert"-Badge)

### Historie
- Chronologische Liste aller Tage
- Aenderung zum Vortag (gruen/rot)
- 7-Tage-Durchschnitt (glaettet natuerliche Schwankungen)

---

## 3. Soll/Ist Kurs-Tracker (Kernfeature)

### Berechnung
- System berechnet automatisch **Wochenziele** basierend auf:
  - Startgewicht
  - Zielgewicht
  - Zeitraum (Wochen)
  - Linearer Verlust: (Zielgewicht - Startgewicht) / Wochen = Soll pro Woche
- Beispiel: 90 kg -> 80 kg in 10 Wochen = -1.0 kg/Woche Soll

### Anzeige auf Dashboard
- **Status-Badge:** "Auf Kurs" (gruen) / "Leicht hinter Plan" (gelb) / "Hinter Plan" (rot) / "Voraus!" (tuerkis)
- **Soll vs. Ist Zusammenfassung:**
  - Soll-Verlust bis jetzt (kumuliert)
  - Ist-Verlust bis jetzt
  - Differenz
- **Wochen-Balken:** Jede Woche als Balken mit Soll (gestrichelt) und Ist (farbig)
  - Gruen: Ist >= Soll
  - Gelb: Ist knapp unter Soll (bis 80%)
  - Rot: Ist deutlich unter Soll (unter 80%)
  - Grau: Zukuenftige Wochen

### Wochenplan
- **Wochenziel:** Wie viel diese Woche noch abzunehmen
- **Empfohlenes taegliches Kaloriendefizit** (basierend auf verbleibendem Wochenziel)
- **Empfohlene Trainings** (basierend auf bisherigem Durchschnitt)
- Dynamische Anpassung: Wenn man in Woche 3 weniger verliert, wird Woche 4+ angepasst

### Prognose
- Basierend auf den letzten 7 Tagen wird der Trend extrapoliert
- "Wenn du so weitermachst, erreichst du dein Ziel am [Datum]"
- Prognose-Linie in allen Charts

---

## 4. Strava-Integration

### Verbindung
- OAuth 2.0 Flow ueber Strava API
- Nutzer verbindet Strava-Account einmalig im Profil
- Token wird sicher gespeichert und automatisch erneuert

### Automatischer Sync
- **Strava Webhooks:** Neue Aktivitaeten werden automatisch gepusht
- Fallback: Manueller Sync-Button + taeglicher Cron-Job
- Gesyncte Daten pro Aktivitaet:
  - Aktivitaetstyp (Laufen, Radfahren, Schwimmen, etc.)
  - Name der Aktivitaet
  - Datum & Uhrzeit
  - Dauer
  - Distanz
  - Kalorien (von Strava berechnet)
  - Durchschnittspuls (wenn vorhanden)
  - Pace/Geschwindigkeit

### Manueller Eintrag
- Fuer Nutzer ohne Strava oder Aktivitaeten die nicht getrackt werden
- Felder: Typ, Name, Dauer, geschaetzte Kalorien
- Typ-Vorauswahl: Laufen, Radfahren, Schwimmen, Krafttraining, Yoga, Wandern, Sonstiges

---

## 5. Kalorienverbrauch

### Berechnung Gesamtverbrauch
- **Grundumsatz (BMR):** Mifflin-St Jeor Formel basierend auf Gewicht, Groesse, Alter (optional), Geschlecht (optional)
  - Maenner: BMR = 10 * Gewicht(kg) + 6.25 * Groesse(cm) - 5 * Alter - 161 + 166
  - Frauen: BMR = 10 * Gewicht(kg) + 6.25 * Groesse(cm) - 5 * Alter - 161
  - Fallback ohne Alter/Geschlecht: Vereinfachte Schaetzung basierend auf Gewicht
- **Alltagsaktivitaet:** Pauschaler Aufschlag (Aktivitaetslevel waehlbar: sitzend, leicht aktiv, aktiv)
- **Training:** Kalorien aus Strava oder manueller Eintrag
- **Gesamt = BMR + Alltag + Training**

### Empfohlene Kalorienaufnahme
- Basierend auf Gesamtverbrauch minus empfohlenes Defizit
- Defizit berechnet aus Wochenziel: -1 kg/Woche ≈ -1000 kcal/Tag Defizit (7700 kcal/kg)
- Maximum: Nicht unter BMR empfehlen (Gesundheitswarnung)

### Anzeige
- Tagesuebersicht mit Aufschluesselung (BMR, Alltag, Training)
- Wochenuebersicht als Balkendiagramm
- Kalorienring (wie Apple Watch Activity Rings)

---

## 6. Team-System

### Teams erstellen
- Jeder Nutzer kann Teams erstellen
- Team-Ersteller ist automatisch **Admin**
- Team-Einstellungen:
  - **Name** des Teams
  - **Gemeinsames Ziel** (z.B. "30 kg zusammen")
  - **Zeitraum** (Start- und Enddatum)
  - **Einladungscode** (6-stellig, automatisch generiert)

### Beitreten
- Ueber Einladungscode
- Kein Limit fuer Team-Groesse (praktisch sinnvoll: bis 20)

### Mehrere Teams
- Ein Nutzer kann in **mehreren Teams** gleichzeitig sein
- Team-Wechsel ueber Tab-Leiste auf der Team-Seite
- Jedes Team hat eigene Ziele und Zeitraeume

### Gemeinsames Dashboard
- **Team-Fortschritt:** Summierter Gewichtsverlust aller Mitglieder vs. Teamziel
- **Rangliste:** Sortiert nach prozentualem Fortschritt (fair fuer unterschiedliche Ausgangswerte)
- **Team-Kalorien:** Ring-Chart mit Team-Gesamtverbrauch
- **Aktivitaets-Feed:** Letzte Trainings der Teammitglieder (wenn freigegeben)

### Datenschutz-Steuerung (pro Nutzer)
Jeder Nutzer steuert individuell, was das Team sehen darf:
- **Gewicht sichtbar:** Andere sehen das aktuelle Gewicht und den Verlauf
- **Kalorien sichtbar:** Andere sehen den Kalorienverbrauch
- **Trainings sichtbar:** Andere sehen einzelne Aktivitaeten

**Bei "Privat":** Team sieht nur:
- Den Gesamtfortschritt in Prozent (z.B. "40% des Ziels erreicht")
- Keine absoluten Zahlen

---

## 7. Charts & Statistiken

### Gewichtsverlauf (Hauptchart)
- **Taegliche Punkte:** Einzelne Messungen als kleine Punkte
- **7-Tage-Durchschnitt:** Dicke Linie (glaettet Schwankungen)
- **Soll-Linie:** Gestrichelt, zeigt den geplanten Verlauf
- **Ziel-Linie:** Horizontal am Zielgewicht
- **Prognose-Linie:** Gestrichelt, extrapoliert den aktuellen Trend
- Zeitraum waehlbar: 4 Wochen, gesamter Zeitraum, alle Daten

### Kalorienverbrauch
- Balkendiagramm (taeglich)
- Aufgeteilt in Grundumsatz (lila) und aktiver Verbrauch (tuerkis)
- Wochenansicht und Monatsansicht

### Trainings
- Anzahl Trainings pro Woche (Balken)
- Kalorien pro Training (Scatter/Bubble)
- Verteilung nach Sportart (Donut-Chart)

### BMI-Verlauf
- Berechnet aus aktuellem Gewicht und Groesse
- Farbzonen: Untergewicht, Normal, Uebergewicht, Adipositas

### Foto-Tagebuch
- Woechentliches Fortschrittsfoto
- Grid-Ansicht mit Wochen-Labels
- Fotos werden lokal gespeichert (Base64 in DB oder Dateisystem)

---

## 8. Detailansichten (Drill-Down)

Jede Kachel auf dem Dashboard oeffnet bei Klick eine Detailansicht:

### Gewicht-Detail
- Startgewicht, aktuelles Gewicht, Zielgewicht
- Gesamtverlust, noch zu verlieren
- Durchschnitt pro Woche
- Benoetigter Verlust pro Woche (Soll, dynamisch angepasst)
- Prognose-Datum fuer Zielerreichung
- Alle Messungen des aktuellen Tages

### Kalorien-Detail
- Aufschluesselung: BMR, Alltag, Training
- Empfohlene Kalorienaufnahme
- Resultierendes Defizit
- Umrechnung in geschaetzten Gewichtsverlust

### Training-Detail
- Alle Trainings der aktuellen Woche
- Soll vs. Ist Einheiten
- Gesamtkalorien und Durchschnitt
- Noch ausstehende Einheiten

### Durchschnitt-Detail
- 7-Tage-Durchschnitt der letzten Wochen
- Trend-Entwicklung
- Soll vs. Ist Vergleich
- Erklaerung warum Durchschnitt sinnvoller ist als Einzelwerte

---

## 9. Motivation & Gamification

### Streak (Tage in Folge)
- Zaehlt aufeinanderfolgende Tage mit Gewichtseintrag
- Visuell hervorgehoben auf Dashboard
- Wochentags-Anzeige (Mo-So) mit Haken

### Meilensteine
- Erstes Kilogramm verloren
- Halbzeit erreicht
- 50% des Ziels geschafft
- Ziel erreicht!
- X Trainings absolviert

### Team-Motivation
- Rangliste motiviert zum Dabeibleiben
- Gemeinsames Ziel: "Wir schaffen das zusammen"
- Sichtbarkeit des Teamfortschritts

---

## 10. Technische Architektur

### Tech-Stack
- **Frontend:** Next.js 14+ (App Router) mit React 18+
- **Styling:** Tailwind CSS
- **Charts:** Recharts (React-native Charts, performant, anpassbar)
- **PWA:** next-pwa fuer Offline-Faehigkeit und "Add to Homescreen"
- **Backend:** Next.js API Routes (Route Handlers)
- **Datenbank:** SQLite via Prisma ORM
- **Auth:** bcrypt + JWT in HTTP-only Cookies
- **Strava:** OAuth 2.0 + Webhook-Empfaenger
- **Deployment:** Vercel (SQLite via Turso oder lokale DB)

### Datenbank-Schema (Prisma)

```
User
  - id            String (UUID)
  - name          String (unique)
  - pinHash       String
  - height        Float? (cm)
  - age           Int?
  - gender        String? (male/female/other)
  - activityLevel String (sedentary/light/active)
  - createdAt     DateTime

Goal
  - id            String (UUID)
  - userId        String (FK -> User)
  - startWeight   Float
  - targetWeight  Float
  - startDate     DateTime
  - endDate       DateTime
  - weeks         Int
  - isActive      Boolean

WeightEntry
  - id            String (UUID)
  - userId        String (FK -> User)
  - weight        Float
  - date          DateTime (Tag)
  - time          DateTime (Uhrzeit)
  - isLowest      Boolean (niedrigster Wert des Tages)
  - createdAt     DateTime

Activity
  - id            String (UUID)
  - userId        String (FK -> User)
  - stravaId      String? (Strava Activity ID)
  - type          String (run/ride/swim/strength/yoga/hike/other)
  - name          String
  - date          DateTime
  - duration      Int (Sekunden)
  - distance      Float? (Meter)
  - calories      Int
  - avgHeartRate  Int?
  - pace          Float?
  - source        String (strava/manual)
  - createdAt     DateTime

Team
  - id            String (UUID)
  - name          String
  - inviteCode    String (unique, 6 Zeichen)
  - targetKg      Float (gemeinsames Ziel)
  - startDate     DateTime
  - endDate       DateTime
  - weeks         Int
  - createdById   String (FK -> User)
  - createdAt     DateTime

TeamMember
  - id            String (UUID)
  - teamId        String (FK -> Team)
  - userId        String (FK -> User)
  - role          String (admin/member)
  - joinedAt      DateTime

PrivacySettings
  - id            String (UUID)
  - userId        String (FK -> User)
  - weightVisible Boolean (default: true)
  - caloriesVisible Boolean (default: true)
  - activitiesVisible Boolean (default: false)

StravaConnection
  - id            String (UUID)
  - userId        String (FK -> User)
  - stravaUserId  String
  - accessToken   String
  - refreshToken  String
  - expiresAt     DateTime

ProgressPhoto
  - id            String (UUID)
  - userId        String (FK -> User)
  - weekNumber    Int
  - photoData     String (Base64 oder Dateipfad)
  - createdAt     DateTime

DailyCalories
  - id            String (UUID)
  - userId        String (FK -> User)
  - date          DateTime
  - bmr           Int
  - activityCalories Int
  - trainingCalories Int
  - totalCalories Int

UserPreferences
  - id            String (UUID)
  - userId        String (FK -> User, unique)
  - theme         String (default: "glass")
  - fontSet       String (default: "prometo")
  - locale        String (default: "de")
```

### API-Endpunkte

```
Auth:
  POST   /api/auth/register       - Registrierung
  POST   /api/auth/login          - Login
  POST   /api/auth/logout         - Logout
  GET    /api/auth/me             - Aktueller Nutzer

User:
  GET    /api/user/profile        - Profil laden
  PUT    /api/user/profile        - Profil aktualisieren
  PUT    /api/user/privacy        - Datenschutz-Einstellungen
  PUT    /api/user/pin            - PIN aendern

Weight:
  POST   /api/weight              - Gewicht eintragen
  GET    /api/weight              - Alle Eintraege (mit Filter)
  GET    /api/weight/today        - Heutige Eintraege
  GET    /api/weight/daily        - Tageswerte (niedrigster)
  GET    /api/weight/average      - 7-Tage-Durchschnitte
  DELETE /api/weight/:id          - Eintrag loeschen

Goals:
  POST   /api/goals               - Ziel erstellen
  GET    /api/goals/active        - Aktives Ziel
  PUT    /api/goals/:id           - Ziel bearbeiten
  GET    /api/goals/progress      - Soll/Ist Fortschritt

Activities:
  GET    /api/activities           - Alle Aktivitaeten
  POST   /api/activities           - Manuelle Aktivitaet
  GET    /api/activities/weekly    - Wochenuebersicht
  GET    /api/activities/calories  - Kalorienverbrauch

Teams:
  POST   /api/teams               - Team erstellen
  GET    /api/teams               - Meine Teams
  GET    /api/teams/:id           - Team-Details
  PUT    /api/teams/:id           - Team bearbeiten (Admin)
  POST   /api/teams/join          - Team beitreten (Code)
  DELETE /api/teams/:id/leave     - Team verlassen
  GET    /api/teams/:id/members   - Mitglieder & Rangliste
  GET    /api/teams/:id/progress  - Team-Gesamtfortschritt
  GET    /api/teams/:id/feed      - Aktivitaets-Feed

Strava:
  GET    /api/strava/connect      - OAuth Start
  GET    /api/strava/callback     - OAuth Callback
  POST   /api/strava/webhook      - Webhook-Empfaenger
  POST   /api/strava/sync         - Manueller Sync
  DELETE /api/strava/disconnect   - Verbindung trennen

Calories:
  GET    /api/calories/today      - Heutiger Verbrauch
  GET    /api/calories/weekly     - Wochenverlauf
  GET    /api/calories/recommendation - Empfohlene Aufnahme

Stats:
  GET    /api/stats/dashboard     - Dashboard-Daten (alle Kacheln)
  GET    /api/stats/charts        - Chart-Daten
  GET    /api/stats/streak        - Aktuelle Streak

Photos:
  POST   /api/photos              - Foto hochladen
  GET    /api/photos              - Alle Fotos
  DELETE /api/photos/:id          - Foto loeschen
```

### Projektstruktur

```
10Weeks10Kg/
├── prisma/
│   └── schema.prisma
├── public/
│   ├── manifest.json          (PWA Manifest)
│   ├── sw.js                  (Service Worker)
│   ├── icons/                 (App Icons)
│   ├── fonts/                 (Eigene Fonts: ZF Prometo etc.)
│   ├── themes/                (Theme CSS-Dateien)
│   │   ├── glass.css
│   │   ├── brutal.css
│   │   ├── luxury.css
│   │   └── ...
│   └── font-sets/             (Font-Set CSS-Dateien)
│       ├── prometo.css
│       ├── outfit.css
│       └── ...
├── src/
│   ├── app/
│   │   ├── layout.tsx         (Root Layout mit PWA)
│   │   ├── page.tsx           (Login/Landing)
│   │   ├── dashboard/
│   │   │   └── page.tsx       (Hauptseite)
│   │   ├── weight/
│   │   │   └── page.tsx       (Gewichts-Eingabe)
│   │   ├── team/
│   │   │   ├── page.tsx       (Team-Uebersicht)
│   │   │   └── [id]/page.tsx  (Team-Detail)
│   │   ├── activity/
│   │   │   └── page.tsx       (Aktivitaeten)
│   │   ├── charts/
│   │   │   └── page.tsx       (Statistiken)
│   │   ├── profile/
│   │   │   └── page.tsx       (Profil/Einstellungen)
│   │   └── api/
│   │       ├── auth/
│   │       ├── weight/
│   │       ├── goals/
│   │       ├── activities/
│   │       ├── teams/
│   │       ├── strava/
│   │       ├── calories/
│   │       ├── stats/
│   │       └── photos/
│   ├── components/
│   │   ├── ui/                (Basis-Komponenten)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── ScrollPicker.tsx
│   │   │   └── ...
│   │   ├── charts/            (Chart-Komponenten)
│   │   │   ├── WeightChart.tsx
│   │   │   ├── CalorieChart.tsx
│   │   │   ├── CalorieRing.tsx
│   │   │   ├── KursTracker.tsx
│   │   │   └── ...
│   │   ├── dashboard/         (Dashboard-spezifisch)
│   │   │   ├── GoalBanner.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── StreakCard.tsx
│   │   │   └── DetailOverlay.tsx
│   │   ├── team/              (Team-spezifisch)
│   │   │   ├── TeamSelector.tsx
│   │   │   ├── TeamGoalCard.tsx
│   │   │   ├── MemberCard.tsx
│   │   │   └── InviteBox.tsx
│   │   ├── weight/            (Gewichts-spezifisch)
│   │   │   ├── WeightPicker.tsx
│   │   │   └── WeightHistory.tsx
│   │   └── layout/            (Layout-Komponenten)
│   │       ├── TabBar.tsx
│   │       └── Header.tsx
│   ├── lib/
│   │   ├── db.ts              (Prisma Client)
│   │   ├── auth.ts            (JWT + bcrypt Helpers)
│   │   ├── strava.ts          (Strava API Client)
│   │   ├── calories.ts        (Kalorienberechnung)
│   │   ├── progress.ts        (Soll/Ist Berechnung)
│   │   └── utils.ts           (Hilfsfunktionen)
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWeight.ts
│   │   ├── useTeam.ts
│   │   └── useStrava.ts
│   └── types/
│       └── index.ts           (TypeScript Types)
├── mockup/
│   └── index.html             (Bestehendes Mockup)
├── PROJECT.md                 (Diese Datei)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── .env.example
```

### Umgebungsvariablen

```env
# Datenbank
DATABASE_URL="file:./dev.db"

# Auth
JWT_SECRET="..."

# Strava
STRAVA_CLIENT_ID="..."
STRAVA_CLIENT_SECRET="..."
STRAVA_REDIRECT_URI="https://app.example.com/api/strava/callback"
STRAVA_WEBHOOK_VERIFY_TOKEN="..."

# App
NEXT_PUBLIC_APP_URL="https://app.example.com"
```

---

## 11. Design-System

### Theme-Architektur

Themes und Fonts sind **komplett getrennt und austauschbar**. Ein Theme definiert Farben + Geometrie, ein Font-Set definiert Schriften. Beides wird per CSS-Variablen gesteuert.

#### Theme-Verzeichnis: `/public/themes/`
Jedes Theme ist eine eigene CSS-Datei:
```
public/themes/
  glass.css          (Default - Glassmorphism)
  brutal.css         (Neubrutalism)
  luxury.css         (Schwarz + Gold)
  terminal.css       (Retro CRT)
  mesh.css           (Gradient Mesh, hell)
  neumorph.css       (Neumorphism)
  cyberpunk.css      (Neon, aggressive Kanten)
  nature.css         (Erdtoene, nordisch)
```

Neues Theme hinzufuegen = neue CSS-Datei mit ~25 Variablen. Kein Code aendern.

#### Theme-Variablen (pro Theme-Datei):
```css
[data-theme="glass"] {
  /* Farben */
  --primary: #818CF8;
  --primary-light: #A5B4FC;
  --accent: #34D399;
  --accent-light: #6EE7B7;
  --success: #34D399;
  --warning: #FBBF24;
  --danger: #FB7185;
  --bg: #0C0C1D;
  --bg-card: rgba(255,255,255,0.06);
  --text: #FFFFFF;
  --text-secondary: rgba(255,255,255,0.65);
  --text-muted: rgba(255,255,255,0.35);
  --border: rgba(255,255,255,0.08);

  /* Geometrie */
  --card-radius: 20px;
  --card-shadow: 0 8px 32px rgba(0,0,0,0.3);
  --card-blur: blur(20px);
  --card-border-width: 1px;

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #818CF8, #34D399);
  --gradient-accent: linear-gradient(135deg, #34D399, #818CF8);

  /* Glow-Effekte (optional, leer = kein Glow) */
  --glow-primary: 0 0 20px rgba(129,140,248,0.3);
  --glow-accent: 0 0 20px rgba(52,211,153,0.3);
}
```

### Font-Architektur

#### Font-Verzeichnis: `/public/fonts/`
Eigene Fonts (wie ZF Prometo) werden hier abgelegt.

#### Font-Set-Verzeichnis: `/public/font-sets/`
Jedes Font-Set ist eine eigene CSS-Datei:
```
public/font-sets/
  prometo.css        (Default - ZF Prometo solo)
  outfit.css
  space-grotesk.css
  syne-prometo.css   (Mix: Syne Headlines + Prometo Body)
  jakarta-mono.css   (Mix: Jakarta + JetBrains Mono Zahlen)
  ...
```

#### Font-Variablen (3 Kategorien, unabhaengig austauschbar):
```css
[data-font="prometo"] {
  /* Heading: Ueberschriften, Titel, Navigation */
  --font-heading: 'ZF Prometo', sans-serif;
  --font-heading-weight: 500;
  --font-heading-spacing: 0.5px;

  /* Body: Fliesstext, Labels, Beschreibungen */
  --font-body: 'ZF Prometo', sans-serif;
  --font-body-weight: 300;

  /* Numbers: Gewicht, Kalorien, Statistiken */
  --font-numbers: 'ZF Prometo', sans-serif;
  --font-numbers-weight: 500;
  --font-numbers-spacing: 0px;
}
```

#### Default: ZF Prometo
- **Heading:** ZF Prometo Medium (500)
- **Body:** ZF Prometo Light (300)
- **Numbers:** ZF Prometo Medium (500)
- Font-Dateien: WOFF2 + WOFF (im `/public/fonts/` Verzeichnis)

### Icons: Lucide React
- Professionelle, schlanke SVG-Icons
- Paket: `lucide-react`
- Jedes Icon bekommt einen farbigen Hintergrund-Circle (10% der jeweiligen Farbe)
- Konsistente Groessen: 17-20px in Cards, 22px in Tab-Bar, 10-13px inline

### User-Einstellungen
- Theme und Font-Set werden in `UserPreferences` gespeichert
- Auswahl im Profil unter "Darstellung"
- Sofortiger Wechsel ohne Reload (CSS-Variablen live tauschen)

### Responsive
- Mobile-first: 390px Basis
- Tablet: Cards in 2-Spalten Grid
- Desktop: Max-Width 600px zentriert, optional Sidebar

---

## 12. PWA-Konfiguration

- **Offline-Faehigkeit:** Gewichtseingabe funktioniert offline, sync bei Verbindung
- **Add to Homescreen:** Manifest mit App-Name und Icons
- **Push-Benachrichtigungen:** Taegliche Wiege-Erinnerung (optional, spaeter)
- **App-Icon:** Waage-Emoji oder custom Icon

---

## 13. SQLite auf Vercel - Loesung

Da Vercel serverless ist und kein persistentes Dateisystem hat, verwenden wir **Turso** (LibSQL) als gehostete SQLite-Datenbank:
- Kompatibel mit Prisma
- Kostenloser Tier verfuegbar
- Globale Edge-Replikation
- SQLite-Syntax und -Verhalten

Alternative: **Vercel Postgres** (wenn SQLite Limitierungen auftreten)

---

## 14. Implementierungs-Reihenfolge

### Phase 1: Fundament (MVP)
1. Next.js Projekt setup mit Tailwind
2. Prisma + SQLite/Turso Schema
3. Auth (Register, Login, JWT)
4. Gewichts-Tracking (Eingabe, Historie, Tageswerte)
5. Basis-Dashboard mit Kacheln
6. PWA-Setup

### Phase 2: Tracking & Charts
7. Soll/Ist Kurs-Tracker
8. Gewichtsverlauf-Chart (mit Recharts)
9. Kalorienberechnung (BMR + Aktivitaet)
10. Detail-Ansichten fuer alle Kacheln
11. 7-Tage-Durchschnitt und Prognose

### Phase 3: Strava & Aktivitaeten
12. Strava OAuth-Flow
13. Strava Webhook + Sync
14. Aktivitaeten-Seite
15. Kalorienverbrauch-Charts
16. Manueller Aktivitaets-Eintrag

### Phase 4: Team-Features
17. Team erstellen & beitreten
18. Multi-Team Support
19. Team-Dashboard & Rangliste
20. Datenschutz-Steuerung
21. Team-Kalorien & Aktivitaets-Feed

### Phase 5: Polish
22. Streak & Motivation
23. Foto-Tagebuch
24. Wiege-Erinnerungen
25. Meilensteine
26. Performance-Optimierung
27. Responsive Desktop-Layout

---

## 15. Offene Punkte / Spaetere Erweiterungen

- [ ] Light Mode / Theme-Switcher
- [ ] Sprach-Umschaltung (DE/EN)
- [ ] Kalorienaufnahme tracken (Essen loggen)
- [ ] Integration mit Apple Health / Google Fit (nativ schwierig als PWA)
- [ ] Push-Benachrichtigungen
- [ ] Export als CSV/PDF
- [ ] Admin-Dashboard fuer Team-Verwaltung
- [ ] Koerpermasze tracken (Bauchumfang etc.)
