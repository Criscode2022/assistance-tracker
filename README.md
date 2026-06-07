# Presencia — Course Attendance Tracker

> A mobile-first Progressive Web App (PWA) to track daily attendance across multiple courses. Log presence, absences, and tardiness; view monthly stats; and sync to the cloud — all from your phone.

---

## Live Demo

Deploy your own instance in one click:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/criscode2022/assistance-tracker)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [Dashboard](#dashboard)
  - [Attendance Log](#attendance-log)
  - [History](#history)
  - [Courses](#courses)
  - [Settings](#settings)
- [Day Statuses](#day-statuses)
- [Attendance Calculation](#attendance-calculation)
- [PWA & Installation](#pwa--installation)
- [Cloud Sync](#cloud-sync)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Building & Deploying](#building--deploying)
- [Configuration Reference](#configuration-reference)
- [Browser Support](#browser-support)

---

## Overview

**Presencia** is a course attendance tracker built for students and professionals who need to keep a precise record of attendance across one or more courses. It works offline by default, stores data locally on the device, and optionally syncs everything to a personal cloud account.

Key design principles:

- **Offline-first** — all data lives in `localStorage`; the app functions without a network connection
- **Privacy-first** — no tracking, no analytics; cloud sync is opt-in and tied to a personal account
- **Mobile-first** — designed for phone use; installable as a standalone app on iOS and Android
- **Multilingual** — English and Spanish, with locale-aware date formatting

---

## Features

### Dashboard

The Dashboard is the first tab and gives an at-a-glance view of the selected course's current standing.

**Hero ring** — A large circular progress indicator showing the current attendance percentage. The ring color reflects course health:

| Color | Meaning |
|-------|---------|
| Green | On track (at or above the minimum attendance %) |
| Yellow | Attention — within 5 percentage points of the limit |
| Red | At risk — below the minimum attendance % |
| Grey | No data yet for this month |

Below the ring, a subtitle shows:
- The configured minimum attendance percentage
- Days elapsed vs. total working days in the course

**Metric cards** — Two side-by-side cards showing:
- **Absences** — count logged / maximum allowed, with a color badge
- **Tardiness** — count logged / maximum allowed, with a color badge

Badges turn yellow when approaching the limit and red when exceeded.

**Hours attended card** — Shows total hours attended to date with a progress bar. The bar is empty (grey) when no hours have been logged, and fills relative to the expected hours for the elapsed days. Lost minutes due to tardiness are shown as a negative chip below the bar.

**Course selector** — A tap on the gear icon (top-right header) opens Settings. The dashboard automatically syncs with the selected course shown in the Log tab.

---

### Attendance Log

The Log tab (`/tabs/log`) shows every working day in the selected course for the selected month.

**Filters** — Two selectors in the sub-toolbar:
- **Course selector** (left) — switches the active course; synced across tabs
- **Month selector** (right) — switches between available calendar months within the course date range

**Day cards** — Each working day (Mon–Fri within the course date range) is shown as a card with:
- Day number and abbreviated day name (left column)
- Status icon with color (center)
- Status label and optional time details (right)
- A "TODAY" badge on the current day
- A colored left border indicating status
- A chevron indicating the card is tappable

**Future days** are shown at reduced opacity and are not tappable.

**Tapping a card** opens an action sheet to set the status:
- Present
- Late / Impuntual (with optional entry and exit time)
- Absent
- Class cancelled
- Unlogged (clear the record)

When "Late" is selected, a secondary alert asks for entry and exit times — or a "No schedule" shortcut sets the day as late without recording times.

**Swipe right** on any past or present day to quickly toggle between Present and Absent without opening the full action sheet. The swipe button shows the opposite status icon and color.

---

### History

The History tab (`/tabs/history`) shows a month-by-month summary across all months in the selected course.

Each month card displays:
- Month and year label
- Attendance percentage with color coding
- Days present / working days ratio
- Hours attended

Months with no logged data are not shown.

---

### Courses

The Courses tab (`/tabs/courses`) is where you create and manage courses.

**Course list** — Each course is shown as a card with:
- Course name (large)
- Date range (formatted to locale)
- Chips: hours per day, max absences, max tardiness

**Creating a course** — Tap the `+` floating action button. The inline form slides in with fields:

| Field | Description |
|-------|-------------|
| Course name | Displayed throughout the app |
| Start date | First day of the course (inclusive) |
| End date | Last day of the course (inclusive) |
| Entry time | Default class start time (used as default for tardiness) |
| Hours per day | Duration of each class (1–12 h) |
| Max absences | Monthly absence limit |
| Max tardiness | Monthly tardiness limit |
| Min attendance % | Threshold for the attendance percentage alert (1–100) |

All fields are validated inline. The form shows errors after a field is touched or after a save attempt.

**Editing a course** — Tap a course card to select it, then use the action sheet, or enter multi-select mode and use "Actions → Edit" (when exactly one course is selected).

**Deleting a course** — Swipe a card left and tap the trash icon, or use multi-select → Actions → Delete. A confirmation alert is always shown.

**Multi-select mode** — Tap the checkmark icon in the top-right header to enter multi-select mode. Tap course cards to select them. The "Actions" button opens an action sheet with:
- Edit (only shown when exactly 1 course is selected)
- Export (downloads a JSON file)
- Delete (with confirmation)

**Exporting a course** — Exports one or more courses plus all their attendance records to a `.json` file. The filename is the course name (slug) for single exports, or `presencia_cursos_N.json` for bulk exports.

**Importing courses** — An "Import from JSON file" card at the top of the list opens a file picker. The file must be a Presencia export. If a course with the same ID already exists, it is overwritten. A confirmation alert shows the count before import.

---

### Settings

The Settings page (`/config`) is opened from the gear icon in the Dashboard header. It is a full-screen page outside the tab bar.

**Online mode** — Toggle to enable cloud sync. When enabled, you are guided through sign-up or sign-in. Once authenticated, courses and records sync automatically between devices.

**Dark theme** — Toggle between light and dark appearance. Preference is persisted.

**Language** — Segment control to switch between Español and English. The app reformats all dates to the selected locale immediately.

**Notifications** — Requires browser notification permission.
- Daily reminder (Mon–Fri) at a configurable time
- Weekly summary (Fridays at 5:00 PM)
- Absence limit alert — fires when you are one absence away from the limit
- Tardiness limit alert — fires when you are one tardiness away from the limit
- Low attendance alert — fires when attendance drops below the minimum

A "Send test notification" button lets you verify that notifications are working.

**Danger zone** — "Delete all data" permanently removes all courses, attendance records, and settings from the device. A confirmation alert is required.

---

## Day Statuses

| Status | Border color | Counted as absence | Counted in expected hours | Icon |
|--------|-------------|-------------------|--------------------------|------|
| Present | Green | No | Yes | Checkmark circle |
| Late | Yellow | No | Yes (partial, based on logged times) | Clock |
| Absent | Red | Yes | Yes | X circle |
| Cancelled | Grey (muted) | No | **No** | Ban |
| Unlogged | None | No | No | Empty circle |

**Cancelled** days are excluded from the attendance denominator entirely. If a class is cancelled, it does not count as an absence and does not contribute to the expected hours total — the attendance percentage is calculated as if that day did not exist.

---

## Attendance Calculation

```
effectiveWorkingDays = elapsedWorkingDays - cancelledDays

attendancePercent = totalHoursAttended / (effectiveWorkingDays × hoursPerDay) × 100
```

- `elapsedWorkingDays`: Mon–Fri days within the course date range, up to and including today
- `cancelledDays`: days within the elapsed period marked as "Cancelled"
- `totalHoursAttended`: sum of hours for Present days (full `hoursPerDay`) + Late days (hours between logged entry and exit times, or 0 if no schedule recorded)
- Hours for a Late day with times: `exitTime − entryTime` capped at `hoursPerDay`
- `lostMinutes` per late day: `hoursPerDay × 60 − minutesAttended`

The attendance percentage is compared against the course's `minAttendancePercent` field to determine the status shown on the Dashboard.

---

## PWA & Installation

Presencia is a Progressive Web App. No app store needed.

### iOS (Safari)
1. Open the app URL in Safari
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap the **three-dot menu**
3. Tap **Add to Home screen** or **Install app**
4. Tap **Install**

Once installed, the app opens in standalone mode (no browser chrome) and works fully offline. Icons are provided from 72 × 72 px to 512 × 512 px, including maskable variants.

---

## Cloud Sync

Online mode is powered by **Neon** serverless Postgres.

When you enable online mode:
1. Create a new account (name, email, password) — existing local data is uploaded automatically
2. Or sign in to an existing account — cloud data replaces local data on the current device

Once signed in, every change (course edit, attendance log) is synced to the cloud in real time. You can access the same data from any browser or installed instance by signing in.

To sign out, go to Settings → Sign out. Your local data is retained on the device after sign-out.

> **Note**: Email verification is required before signing in. Check your inbox after registration.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Ionic 8](https://ionicframework.com/) + [Angular 20](https://angular.dev/) |
| Language | TypeScript 5 |
| Forms | `@angular/forms/signals` (Angular Signals-based form validation) |
| Styling | SCSS + Ionic CSS variables |
| i18n | [ngx-translate](https://github.com/ngx-translate/core) — ES / EN |
| Storage | `localStorage` (offline-first) |
| Cloud | [Neon](https://neon.tech/) serverless Postgres |
| Auth | Custom email/password with Neon backend |
| PWA | Angular Service Worker + Web App Manifest |
| Notifications | Web Notifications API + Service Worker |
| Build | Angular CLI + `@angular-devkit/build-angular` |
| Deployment | [Netlify](https://netlify.com/) (SPA redirect rule) |

---

## Project Structure

```
src/
├── app/
│   ├── auth/               # Sign-in / sign-up page
│   ├── config/             # Settings page (outside tab bar)
│   ├── courses/            # Courses tab — CRUD, import/export
│   ├── dashboard/          # Dashboard tab — overview & stats
│   ├── history/            # History tab — monthly summary
│   ├── log/                # Log tab — daily attendance
│   ├── tabs/               # Tab bar shell
│   ├── models/
│   │   └── attendance.model.ts   # Course, DayRecord, DayEntry, MonthStats types
│   ├── services/
│   │   ├── attendance.service.ts # Core data layer (localStorage)
│   │   ├── language.service.ts   # Locale switching + date formatting
│   │   ├── notification.service.ts # Web Notifications scheduler
│   │   ├── theme.service.ts      # Dark / light theme persistence
│   │   ├── neon.service.ts       # Cloud sync API client
│   │   ├── app-mode.service.ts   # Online / offline mode state
│   │   └── auth-flow-navigation.service.ts
│   └── shared/             # Shared components (OnlineIndicator, etc.)
├── assets/
│   ├── i18n/
│   │   ├── en.json
│   │   └── es.json
│   └── icon/               # PWA icons (72–512 px)
└── theme/
    └── variables.scss      # Ionic theme overrides, custom tokens
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Ionic CLI: `npm install -g @ionic/cli`

### Install dependencies

```bash
git clone https://github.com/criscode2022/assistance-tracker.git
cd assistance-tracker
npm install
```

### Run in development

```bash
ionic serve
```

The app opens at `http://localhost:8100` with live reload.

### Environment variables (optional, for cloud sync)

Create a `.env` file at the project root:

```env
NEON_DATABASE_URL=postgres://user:password@host/dbname
```

Without this, the app runs in offline-only mode — all features except cloud sync are fully functional.

---

## Building & Deploying

### Production build

```bash
npm run build -- --configuration production
```

Output is in `www/`.

### Deploy to Netlify

The repository includes a `netlify.toml` that configures the build command and the SPA redirect rule:

```toml
[build]
  publish = "www"
  command = "npm run build -- --configuration production"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Push to a Netlify-connected repository or use the **Deploy to Netlify** button above. No additional configuration is required for offline mode.

For cloud sync, add the `NEON_DATABASE_URL` environment variable in Netlify → Site settings → Environment variables.

### Manual server deployment

Any static file server works. The only requirement is a catch-all redirect: all paths → `/index.html` with HTTP 200 (not 301/302). This is needed because Angular uses client-side routing.

---

## Configuration Reference

### Course fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Auto-generated UUID |
| `name` | `string` | Display name |
| `startDate` | `string` (YYYY-MM-DD) | Course start date |
| `endDate` | `string` (YYYY-MM-DD) | Course end date |
| `startTime` | `string` (HH:mm) | Default class start time |
| `hoursPerDay` | `number` | Class duration in hours (1–12) |
| `maxAbsences` | `number` | Monthly absence limit |
| `maxTardiness` | `number` | Monthly tardiness limit |
| `minAttendancePercent` | `number` | Minimum attendance % (1–100) |

### localStorage keys

| Key | Content |
|-----|---------|
| `courses_v1` | `Course[]` JSON array |
| `attendance_v3` | `Record<courseId, Record<date, DayRecord>>` |
| `selected_course_id` | Last selected course ID |
| `notification_settings_v1` | `NotificationSettings` JSON object |
| `app_mode` | `"online"` or `"offline"` |
| `theme` | `"dark"` or `"light"` |
| `lang` | `"es"` or `"en"` |

### Notification settings schema

```json
{
  "dailyReminder": true,
  "dailyReminderTime": "09:00",
  "weeklySummary": true,
  "absenceAlert": true,
  "tardinessAlert": true,
  "attendanceAlert": true
}
```

### Export file format

```json
{
  "version": 1,
  "exported": "2026-06-07T10:00:00.000Z",
  "courses": [ /* Course[] */ ],
  "records": {
    "<courseId>": {
      "<YYYY-MM-DD>": { "status": "present" },
      "<YYYY-MM-DD>": { "status": "late", "entryTime": "09:15", "exitTime": "14:00" }
    }
  }
}
```

---

## Browser Support

| Browser | Offline | Notifications | Install as app |
|---------|---------|--------------|---------------|
| Chrome (Android) | ✅ | ✅ | ✅ |
| Safari (iOS 16.4+) | ✅ | ✅ | ✅ |
| Firefox (Android) | ✅ | ✅ | ✅ |
| Chrome (desktop) | ✅ | ✅ | ✅ |
| Safari (desktop) | ✅ | ⚠️ Limited | ❌ |
| Firefox (desktop) | ✅ | ✅ | ❌ |

> iOS requires Safari specifically for PWA installation. Push notifications on iOS require iOS 16.4 or later and the app must be installed to the Home Screen.

---

## License

MIT — see [LICENSE](LICENSE) for details.
