# Presencia — E2E Test Catalog

> Comprehensive end-to-end test plan for the course attendance tracker (Presencia).
> Use with **Playwright MCP** (`@playwright/mcp`) for live exploration and with `npx playwright test` for CI.
>
> **Priority legend:** P0 = smoke / release blocker · P1 = core flow · P2 = edge case · P3 = nice-to-have

---

## 0. Global / App Shell

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| G-001 | P0 | App loads at `/` and redirects to dashboard tab | Dashboard visible, tab bar present |
| G-002 | P0 | All four tabs are navigable (Dashboard, Log, History, Courses) | Each tab renders without console errors |
| G-003 | P1 | Deep link to `/tabs/log` works on cold load | Log tab active, content loads |
| G-004 | P1 | Deep link to `/config` works | Settings page renders outside tab bar |
| G-005 | P1 | Deep link to `/auth` works | Auth page renders |
| G-006 | P1 | Browser back/forward between tabs preserves state | Selected course persists |
| G-007 | P2 | Invalid route shows fallback (SPA redirect) | `index.html` served, app recovers |
| G-008 | P2 | Page reload on any tab restores localStorage data | Courses and records intact |
| G-009 | P2 | `localStorage` corruption (invalid JSON) → graceful empty state | No crash, empty courses |
| G-010 | P3 | PWA manifest is served (`manifest.webmanifest`) | Valid manifest fields |
| G-011 | P3 | Favicon loads | No 404 on icon |
| G-012 | P2 | Online indicator component visible when online mode enabled | Indicator reflects mode |
| G-013 | P2 | Tab bar hidden on `/config` and `/auth` | Full-screen overlay pages |
| G-014 | P1 | Selected course syncs across all tabs | Change on Log → reflected on Dashboard |
| G-015 | P2 | `dataChanged$` propagation: edit on Courses tab updates Dashboard without manual refresh | Stats update live |

---

## 1. First Launch & Empty State

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| E-001 | P0 | Fresh install with empty localStorage | Dashboard shows empty/zero state |
| E-002 | P0 | Log tab with no courses | "No courses" empty state + hint to create |
| E-003 | P0 | History tab with no courses | Empty state |
| E-004 | P0 | Courses tab with no courses | Empty list, FAB visible |
| E-005 | P1 | Dashboard with no courses | No crash, sensible defaults |
| E-006 | P2 | Month selector with no course | Falls back to current month |

---

## 2. Courses — Create (CRUD)

### 2.1 Happy path

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| C-001 | P0 | Tap FAB opens new course form | Inline form slides in, title "New course" |
| C-002 | P0 | Create course with all valid fields | Course appears in list, auto-selected |
| C-003 | P1 | First created course becomes selected course | `selected_course_id` set in localStorage |
| C-004 | P1 | Cancel form discards changes | Form closes, no new course |
| C-005 | P1 | Close (X) button cancels form | Same as cancel |
| C-006 | P1 | Course card shows name, date range, chips (hours, max absences, max tardiness) | All metadata visible |
| C-007 | P1 | Date range label respects locale (ES/EN) | Formatted per language setting |
| C-008 | P1 | `calcExitTime` preview updates when start time / hours change | Exit time = start + hoursPerDay |
| C-009 | P2 | Create course spanning multiple months | Months appear in Log/History selectors |
| C-010 | P2 | Create course with single-day range (start = end, weekday) | One working day in log |
| C-011 | P2 | Create course starting on Saturday | First working day is next Monday |

### 2.2 Validation — required fields

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| C-020 | P0 | Save with empty name | Inline error `NAME_REQUIRED`, form not saved |
| C-021 | P0 | Save with empty start date | Error `START_DATE_REQUIRED` |
| C-022 | P0 | Save with empty end date | Error `END_DATE_REQUIRED` |
| C-023 | P1 | Errors shown only after touch or save attempt | No errors on pristine form |
| C-024 | P1 | Errors appear after save attempt on invalid form | `formSubmitted` triggers display |

### 2.3 Validation — bounds & logic

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| C-030 | P0 | End date before start date | Error `END_BEFORE_START` |
| C-031 | P1 | `hoursPerDay` = 0 | Error `HOURS_MIN` |
| C-032 | P1 | `hoursPerDay` = 13 | Error `HOURS_MAX` |
| C-033 | P1 | `hoursPerDay` = 1 (min boundary) | Saves successfully |
| C-034 | P1 | `hoursPerDay` = 12 (max boundary) | Saves successfully |
| C-035 | P1 | `maxAbsences` = -1 | Error `MAX_ABSENCES_MIN` |
| C-036 | P1 | `maxAbsences` = 0 | Saves (zero absences allowed) |
| C-037 | P1 | `maxTardiness` = -1 | Error `MAX_TARDINESS_MIN` |
| C-038 | P1 | `minAttendancePercent` = 0 | Error `MIN_ATTENDANCE_MIN` |
| C-039 | P1 | `minAttendancePercent` = 101 | Error `MIN_ATTENDANCE_MAX` |
| C-040 | P1 | `minAttendancePercent` = 1 and 100 (boundaries) | Both save |
| C-041 | P2 | Name with only whitespace | Treated as empty after trim |
| C-042 | P2 | Very long course name (200+ chars) | Saves and displays (truncate UI if needed) |
| C-043 | P2 | Special characters in name (`<script>`, emoji, accents) | Stored safely, no XSS |
| C-044 | P2 | Start time midnight `00:00` | Valid, exit time computed |
| C-045 | P2 | Start time `23:00` with 2h/day | Exit time rolls to next day hour |

### 2.4 Edit

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| C-050 | P0 | Edit existing course via multi-select → Actions → Edit (1 selected) | Form pre-filled |
| C-051 | P1 | Save edit updates course in list | Name/dates reflect changes |
| C-052 | P1 | Edit preserves course `id` | Same ID in localStorage |
| C-053 | P1 | Edit date range shrinks → log only shows days in new range | Out-of-range days hidden |
| C-054 | P2 | Edit date range expands → previously hidden days appear as unlogged | New days visible |
| C-055 | P2 | Edit `hoursPerDay` recalculates dashboard stats | Hours bar updates |
| C-056 | P2 | Edit `minAttendancePercent` changes ring color threshold | Status may change |
| C-057 | P2 | Edit while another tab is open | Cross-tab sync |

### 2.5 Delete

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| C-060 | P0 | Swipe left → trash → confirm delete | Course removed |
| C-061 | P0 | Delete confirmation cancel | Course retained |
| C-062 | P1 | Delete selected course reassigns `selectedCourseId` to next course | No orphan selection |
| C-063 | P1 | Delete last course → `selectedCourseId` null | Empty states across tabs |
| C-064 | P1 | Delete course removes attendance records for that course | `attendance_v3` entry gone |
| C-065 | P1 | Bulk delete 2+ courses via multi-select | All removed after confirm |
| C-066 | P2 | Bulk delete confirmation shows count message | `DELETE_BULK_MSG` |
| C-067 | P2 | Delete course while viewing its log | Graceful fallback to another course |

### 2.6 Selection & multi-select

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| C-070 | P1 | Tap course card (normal mode) selects it | Becomes active course globally |
| C-071 | P1 | Enter multi-select mode via header checkmark | Selection UI appears |
| C-072 | P1 | Toggle selection of multiple courses | Count updates in Actions label |
| C-073 | P1 | Exit multi-select via Cancel | Mode cleared, selections cleared |
| C-074 | P1 | Actions button disabled when 0 selected | Cannot open action sheet |
| C-075 | P2 | Edit action only visible when exactly 1 selected | Hidden for 0 or 2+ |
| C-076 | P2 | Leaving page exits multi-select (`ionViewWillEnter`) | Clean state on return |

---

## 3. Courses — Import / Export

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| IE-001 | P0 | Export single course | JSON download with correct filename (slug) |
| IE-002 | P1 | Export multiple courses | Filename `presencia_cursos_N.json` |
| IE-003 | P1 | Exported JSON contains `version: 1`, `courses`, `records` | Valid schema |
| IE-004 | P0 | Import valid export file | Confirmation alert with count |
| IE-005 | P0 | Confirm import adds courses to list | Courses + records restored |
| IE-006 | P1 | Import overwrites course with same `id` | Existing course replaced |
| IE-007 | P1 | Cancel import | No data change |
| IE-008 | P1 | Import invalid JSON | Toast `FILE_JSON_ERROR` |
| IE-009 | P1 | Import non-JSON file (e.g. .txt) | Toast `FILE_JSON_ERROR` or read error |
| IE-010 | P1 | Import JSON missing `version` | Toast `FILE_FORMAT_ERROR` |
| IE-011 | P1 | Import JSON with wrong version | Toast `FILE_FORMAT_ERROR` |
| IE-012 | P1 | Import JSON missing `courses` array | Toast `FILE_FORMAT_ERROR` |
| IE-013 | P1 | Import JSON missing `records` object | Toast `FILE_FORMAT_ERROR` |
| IE-014 | P2 | Import empty courses array | Confirmation with 0 count / success edge |
| IE-015 | P2 | Import course with records for unknown course id in records | Orphan records ignored or handled |
| IE-016 | P2 | Import file with `late` records including times | Times preserved |
| IE-017 | P2 | Round-trip: export → delete → import | Identical data restored |
| IE-018 | P3 | Import very large file (100 courses) | Performance acceptable, no freeze |
| IE-019 | P2 | File picker cancel (no file) | No action |
| IE-020 | P2 | Import success toast (1 vs many) | Correct i18n message |

---

## 4. Attendance Log

### 4.1 Display

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| L-001 | P0 | Log shows Mon–Fri only within course date range | No weekends |
| L-002 | P0 | Today badge on current day | "TODAY" visible |
| L-003 | P1 | Future days shown at reduced opacity | `isFuture` styling |
| L-004 | P1 | Future days not tappable | Action sheet does not open |
| L-005 | P1 | Future days swipe disabled | `ion-item-sliding` disabled |
| L-006 | P1 | Status icons/colors: present=green, absent=red, late=yellow, cancelled=grey, unlogged=empty | Correct visual |
| L-007 | P1 | Month section label matches selected month | Locale-formatted |
| L-008 | P1 | Course selector lists all courses | Switching reloads days |
| L-009 | P1 | Month selector lists months in course range (newest first) | Correct months |
| L-010 | P2 | Course with no working days in month | "No working days" empty state |
| L-011 | P2 | Late day shows entry/exit times in card | Time details visible |
| L-012 | P2 | Late day without times shows late label only | No time subtext |

### 4.2 Status picker (action sheet)

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| L-020 | P0 | Tap day → set Present | Status green, saved to localStorage |
| L-021 | P0 | Tap day → set Absent | Status red, counts toward absences |
| L-022 | P0 | Tap day → set Late → enter times → Save | Late with entry/exit |
| L-023 | P1 | Tap day → set Late → "No schedule" | Late without times |
| L-024 | P1 | Tap day → set Cancelled | Grey, excluded from denominator |
| L-025 | P1 | Tap day → set Unlogged | Record removed from storage |
| L-026 | P1 | Cancel action sheet | No status change |
| L-027 | P1 | Change Present → Absent → Present | Each transition persists |
| L-028 | P2 | Late picker defaults entry to course `startTime` | Pre-filled 09:00 |
| L-029 | P2 | Late picker defaults exit to `calcDefaultExitTime` | start + hoursPerDay |
| L-030 | P2 | Late picker retains existing times on re-edit | Previous values shown |
| L-031 | P2 | Cancel late time alert | Status unchanged (still previous) |
| L-032 | P2 | Entry time after exit time | Hours = 0 or capped behavior |
| L-033 | P2 | Entry = exit time | 0 hours attended for late day |
| L-034 | P2 | Exit − entry > hoursPerDay | Capped at `hoursPerDay` |
| L-035 | P2 | Late with entry 30 min after startTime | `lostMinutes` = 30 on dashboard |

### 4.3 Swipe quick toggle

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| L-040 | P0 | Swipe right on unlogged day → Present | Quick present |
| L-041 | P0 | Swipe right on Present → Absent | Toggle to absent |
| L-042 | P0 | Swipe right on Absent → Present | Toggle to present |
| L-043 | P1 | Swipe on Late day → toggles to Present or Absent | Opposite of current if present/absent logic |
| L-044 | P2 | Swipe on Cancelled day | Toggles present/absent (per quickToggle logic) |
| L-045 | P2 | Swipe on future day | No effect |

### 4.4 Cross-tab sync

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| L-050 | P1 | Log attendance → Dashboard stats update | Ring % changes |
| L-051 | P1 | Log attendance → History month card updates | Percentage changes |
| L-052 | P2 | Switch course on Log → Dashboard follows | Same course selected |

---

## 5. Dashboard

### 5.1 Hero ring & status

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| D-001 | P0 | Dashboard loads with selected course stats | Ring, metrics visible |
| D-002 | P0 | No data / all unlogged → grey ring | `overallStatus` ok but 0% or grey |
| D-003 | P1 | Attendance ≥ min% → green ring (`ok`) | Green gradient |
| D-004 | P1 | Attendance within 5 pts of min → yellow (`warning`) | Warning gradient |
| D-005 | P1 | Attendance < min% → red (`failed`) | Failed gradient |
| D-006 | P1 | Absences > max → failed status | Red ring |
| D-007 | P1 | Tardiness > max → failed status | Red ring |
| D-008 | P1 | 1 absence remaining → warning | Yellow badge on absences card |
| D-009 | P1 | ≤2 tardiness remaining → warning | Yellow badge on tardiness card |
| D-010 | P2 | Future month (no elapsed days) → 0% not 100% | Correct zero state |
| D-011 | P2 | All days cancelled → effective elapsed = 0 | No false failed state |
| D-012 | P2 | Subtitle shows min% and days elapsed / total working days | Correct counts |

### 5.2 Metric cards

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| D-020 | P1 | Absences card: count / max with color badge | Green/yellow/red thresholds |
| D-021 | P1 | Tardiness card: count / max with color badge | Same logic |
| D-022 | P1 | Hours attended card with progress bar | Bar fill proportional |
| D-023 | P1 | Lost minutes chip shown when late days have lost time | Negative chip visible |
| D-024 | P2 | `maxAbsences` = 0, 1 absence logged → danger immediately | Edge threshold |
| D-025 | P2 | `maxTardiness` = 0, 1 late → danger | Edge threshold |

### 5.3 Selectors & navigation

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| D-030 | P1 | Course selector changes stats | Stats for new course |
| D-031 | P1 | Month selector changes stats | Historical month data |
| D-032 | P0 | Gear icon opens Settings (`/config`) | Navigates to config |
| D-033 | P2 | No course selected → empty course name | Graceful empty |

### 5.4 Attendance calculation edge cases

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| D-040 | P1 | 5 present days × 5h = 100% (full hours) | 100% attendance |
| D-041 | P1 | 1 absent day reduces % (0 hours that day) | Lower % |
| D-042 | P1 | Cancelled day excluded from denominator | % as if day didn't exist |
| D-043 | P1 | Late full day (no times) = full hoursPerDay | Same as present hours |
| D-044 | P2 | Late partial day (09:15–14:00) | Partial hours |
| D-045 | P2 | Mix: present + absent + late + cancelled + unlogged | Correct composite % |
| D-046 | P2 | Course ending mid-month | Only days until endDate counted |
| D-047 | P2 | Course starting mid-month | Days before startDate excluded |
| D-048 | P2 | Today is last day of course | Elapsed includes today |
| D-049 | P3 | Leap year February | Correct working day count |
| D-050 | P3 | DST boundary (clock change day) | Date-based logic unaffected |

---

## 6. History

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| H-001 | P0 | History lists months with logged data only | Empty months hidden |
| H-002 | P1 | Each month card: label, %, present/working days, hours | All fields shown |
| H-003 | P1 | Status color/icon per month (ok/warning/failed) | Matches dashboard logic |
| H-004 | P1 | Course selector filters history | Stats per course |
| H-005 | P2 | Multi-month course shows multiple cards | Chronological order |
| H-006 | P2 | Month with only cancelled days | May be hidden (no logged data) |
| H-007 | P2 | Switch language → month labels update | Locale change |
| H-008 | P2 | New attendance on Log → History updates on navigate | Reactive refresh |

---

## 7. Settings (`/config`)

### 7.1 Navigation & layout

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| S-001 | P0 | Open from Dashboard gear | Config page loads |
| S-002 | P1 | Back button returns to Dashboard | `authFlowNav.exitToDashboard` |
| S-003 | P1 | Tab bar not visible on config | Full-screen page |

### 7.2 Theme

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| S-010 | P1 | Toggle dark theme on | `theme=dark` in localStorage, UI dark |
| S-011 | P1 | Toggle dark theme off | `theme=light`, UI light |
| S-012 | P2 | Theme persists across reload | Still dark/light |
| S-013 | P2 | Theme persists across tabs | Consistent |

### 7.3 Language

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| S-020 | P0 | Switch to English | All UI strings in EN |
| S-021 | P0 | Switch to Spanish | All UI strings in ES |
| S-022 | P1 | Date formats change with language | Short dates, month labels |
| S-023 | P2 | Language persists in localStorage (`lang`) | Survives reload |
| S-024 | P2 | Language change updates open pages without navigation | Live i18n refresh |

### 7.4 Notifications

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| S-030 | P1 | Notification section visible when supported | Settings toggles shown |
| S-031 | P1 | Request permission button when not granted | Triggers browser prompt (mock in CI) |
| S-032 | P1 | Toggle daily reminder on/off | Saved to `notification_settings_v1` |
| S-033 | P1 | Change daily reminder time | Persisted |
| S-034 | P1 | Toggle weekly summary | Persisted |
| S-035 | P1 | Toggle absence / tardiness / attendance alerts | Persisted |
| S-036 | P1 | Send test notification when permission granted | Test sent, `testSent` UI feedback |
| S-037 | P2 | Test notification without permission → requests first | Permission flow |
| S-038 | P2 | Permission denied state UI | Shows denied message |
| S-039 | P3 | Unsupported browser hides notification section | `notifSupported` false |

### 7.5 Danger zone

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| S-040 | P0 | Delete all data → confirm | All localStorage keys cleared |
| S-041 | P0 | Delete all data → cancel | Data retained |
| S-042 | P1 | After delete all → redirect to dashboard empty state | Fresh app state |
| S-043 | P2 | Delete all while in online mode | Local cleared; online session handling |

---

## 8. Authentication & Online Mode

### 8.1 Mode toggle

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| A-001 | P1 | Enable online mode without session → redirect to `/auth` | Auth page |
| A-002 | P1 | Enable online mode with existing session | Online enabled, toast |
| A-003 | P1 | Disable online mode → confirmation | Cancel restores toggle |
| A-004 | P1 | Confirm disable → sign out, offline mode | `app_mode=offline` |
| A-005 | P2 | `onlinePending` state when intent set but not authenticated | UI reflects pending |

### 8.2 Sign up

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| A-010 | P1 | Sign up with name, email, password | Account created (mock API) |
| A-011 | P1 | Sign up without name → uses email prefix | Display name fallback |
| A-012 | P1 | Sign up with existing local data → uploads to cloud | Toast with course/record counts |
| A-013 | P2 | Sign up upload failure → warning toast, still enables online | Partial success path |
| A-014 | P2 | Sign up API error → error toast | Stays on auth |
| A-015 | P2 | Empty email/password | Validation / API error |
| A-016 | P2 | Invalid email format | Error message |
| A-017 | P2 | Weak password | Error from Neon |
| A-018 | P2 | Duplicate email | Error message |

### 8.3 Sign in

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| A-020 | P1 | Sign in with valid credentials | Downloads cloud data, navigates home |
| A-021 | P1 | Sign in replaces local data with cloud data | `replaceAllData` |
| A-022 | P2 | Sign in sync failure → warning toast, still online | Partial path |
| A-023 | P2 | Wrong password | Error toast |
| A-024 | P2 | Unverified email | Error per `auth-error.mapper` |
| A-025 | P2 | Network error during sign in | Error handling |

### 8.4 Guards & session

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| A-030 | P0 | Offline mode: root accessible without auth | No redirect |
| A-031 | P0 | Online mode without session: root → `/auth` | `OnlineAuthGuard` |
| A-032 | P1 | Online mode with session: root accessible | Dashboard loads |
| A-033 | P1 | Authenticated user visiting `/auth` → redirect home | `GuestAuthGuard` |
| A-034 | P2 | Session expires while using app | Redirect to auth on next guarded navigation |
| A-035 | P2 | Sign out from settings | Session cleared, local data retained |

### 8.5 Cloud sync (requires Neon backend / API mock)

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| A-040 | P1 | Log attendance while online → syncs to cloud | API called |
| A-041 | P1 | Edit course while online → syncs | API called |
| A-042 | P1 | Delete course while online → syncs | API called |
| A-043 | P2 | Offline → online reconnect syncs pending changes | Reconciliation |
| A-044 | P2 | Two devices: change on A appears on B after sign in | Data consistency |
| A-045 | P2 | Conflict: simultaneous edits | Last-write or merge policy |
| A-046 | P3 | Sync with empty cloud account | No data loss locally |

---

## 9. Data Persistence & Migration

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| P-001 | P0 | Course save persists in `courses_v1` | Survives reload |
| P-002 | P0 | Attendance save persists in `attendance_v3` | Survives reload |
| P-003 | P1 | Unlogged status removes date key from records | Key deleted not `{status:unlogged}` |
| P-004 | P1 | Migrate from `attendance_v2` string statuses | Upgraded to v3 objects |
| P-005 | P2 | `selected_course_id` points to deleted course → fallback first course | Auto-fix on load |
| P-006 | P2 | Invalid `selected_course_id` with empty courses → null | No crash |
| P-007 | P2 | Duplicate course IDs on import | Last import wins |

---

## 10. Responsive & Layout

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| R-001 | P1 | Mobile viewport (375×667): all tabs usable | No horizontal overflow |
| R-002 | P1 | Tablet viewport (768+): courses tablet layout | `tabletLayout` true |
| R-003 | P2 | Desktop wide: content centered/readable | Layout acceptable |
| R-004 | P2 | Landscape mobile: log list scrollable | Full list accessible |
| R-005 | P3 | iOS safe area / notch | Header not clipped |

---

## 11. Accessibility (a11y)

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| X-001 | P1 | Tab bar buttons have accessible names | axe / snapshot clean |
| X-002 | P1 | Form inputs have labels | Screen reader friendly |
| X-003 | P2 | Action sheets keyboard dismissible | Esc closes |
| X-004 | P2 | Focus management on alert open/close | Focus trapped appropriately |
| X-005 | P2 | Color contrast in dark mode | WCAG AA |
| X-006 | P3 | Reduced motion preference respected | If implemented |

---

## 12. Performance & Resilience

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| F-001 | P2 | 50 courses in list: scroll performance | < 100ms frame drops acceptable |
| F-002 | P2 | Course with 12 months × 22 days: log renders | < 3s load |
| F-003 | P2 | Rapid status toggles (10 in 2s) | No lost updates |
| F-004 | P2 | Network offline during usage | Full offline functionality |
| F-005 | P3 | Service worker caches app shell | Works offline after first visit |

---

## 13. Security

| ID | Priority | Test case | Expected result |
|----|----------|-----------|-----------------|
| SEC-001 | P2 | XSS in course name does not execute | Escaped in DOM |
| SEC-002 | P2 | Import JSON with script payloads | Sanitized / no execution |
| SEC-003 | P2 | Auth tokens not in localStorage plaintext | Session handling secure |
| SEC-004 | P3 | HTTPS redirect on production | Netlify TLS |

---

## Suggested Playwright MCP workflow

1. **Enable MCP:** Reload Cursor after adding `.cursor/mcp.json` → enable Playwright server.
2. **Explore:** `browser_navigate` → `http://localhost:8100`, `browser_snapshot` each tab.
3. **Generate locators:** `browser_generate_locator` for ion-button, ion-select, FAB.
4. **Verify flows:** Use `browser_click`, `browser_fill_form`, `browser_verify_text_visible`.
5. **Export tests:** `browser_run_code` to prototype → paste into `e2e/*.spec.ts`.
6. **Mock auth:** `browser_route` or Playwright `page.route()` for Neon API in CI.

---

## Test file mapping (implementation)

| Spec file | Covers IDs |
|-----------|------------|
| `e2e/smoke.spec.ts` | G-*, E-* |
| `e2e/courses.spec.ts` | C-*, IE-* |
| `e2e/log.spec.ts` | L-* |
| `e2e/dashboard.spec.ts` | D-* |
| `e2e/history.spec.ts` | H-* |
| `e2e/settings.spec.ts` | S-* |
| `e2e/auth.spec.ts` | A-* (mocked backend) |
| `e2e/persistence.spec.ts` | P-* |
| `e2e/responsive.spec.ts` | R-* |

**Total cataloged cases: 200+**
