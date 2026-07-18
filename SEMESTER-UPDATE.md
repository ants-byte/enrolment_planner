# Semester Configuration Update
These instructions assume you will have VS Code installed and the Codex exention.

Use this file to provide the information needed to update `semester-config.json`.

`semester-config.json` remains the authoritative configuration used by the website. This Markdown file is an easy-to-edit handover form. After updating this file, ask Codex to transfer the changes into the JSON and validate them.

## How to use this file

1. Make a backup or Git commit before starting.
2. Update the tables below.
3. Write `UNCHANGED` beside sections that do not need alteration.
4. Use `TBA` when a value is genuinely not known.
5. Attach source documents, spreadsheets or PDFs as supporting evidence where useful.
6. Do not ask Codex to guess when two sources disagree.
7. Give this file to Codex using the request near the end of this document.
8. Review and test the completed website before publishing it.

## Important conventions

- Use four-digit years, such as `2027`.
- Use `S1`, `S2` or `SS` for the semester.
- Write dates as `DD/MM/YYYY`.
- Use subject codes in uppercase, such as `BIT105`.
- Use `AM` and `PM` for timetable slots.
- You can use short, unique staff IDs containing uppercase letters e.g. SP, PE.
- You can use `NS`, `BA` and `SD` for Network Security, Business Analytics and Software Development.
- Separate multiple subject codes with commas.
- Keep each subject definition on one line in `semester-config.json`.

## Update summary

Prepared by:

Date prepared:

Semester being configured:

Summary of changes:

Supporting files supplied:

Known uncertainties or conflicting information:

## 1. Semester details

| Setting | New value | Notes or source |
|---|---|---|
| Year | 2026 | Four digits |
| Semester | S2 | S1, S2 or SS |
| Semester start date | 20/07/2026 | DD/MM/YYYY |
| End of second week | 31/07/2026 | DD/MM/YYYY |
| Census date | 14/08/2026 | DD/MM/YYYY |
| International price per unit | $2,360.00 | Include currency |
| CSP price per unit | $1,192.00 | Include currency |

## 2. File naming

The recommended Triage filename pattern is:

```text
Triage {YYYY} {SEMESTER}.xlsx
```

Required change, or `UNCHANGED`:

Notes:

## 3. Staff

Update names and team status below. Add new rows for new teachers. Write `REMOVE` in Notes only when an ID should no longer be accepted.

| Staff ID | Display name | Team? | Notes |
|---|---|---:|---|
| AD | Antony Di Serio | No | |
| AO | Anthony Overmars | No | |
| CT | Tony, Sita, TBA | Yes | |
| DM | Dominic Mammone | No | |
| DR | David Robinson | No | |
| MK | Md Sarwar Kamal | No | |
| NQ | Nidha Qazi | No | |
| NW | Nikki Wan | No | |
| PE | Promise Enwereonye | No | |
| RA | Russul Al-Anni | No | |
| SH | Sarang Hashemi | No | |
| SN | Shzaa Niazi | No | |
| XW | Xiaodong Wang (Tony) | No | |
| YW | Ye Wei (Silva) | No | |
|  |  | No | New staff |

## 4. Time slots

| Slot | Start | End | Notes |
|---|---|---|---|
| AM | 8:30 am | 12:30 pm | |
| PM | 1:00 pm | 5:00 pm | |

## 5. Timetable

Enter one row for every subject running in the configured semester. Staff IDs must exist in the Staff table. Use `TBA` for an unknown room or teacher.

Delete rows for subjects not running this semester and add rows for newly running subjects.

| Subject | Day | Time | Room | Staff ID | Notes |
|---|---|---|---|---|---|
| BIT121 | Monday | AM | PA113 | RA | |
| BIT372 | Monday | AM | PE110 | CT | |
| BIT112 | Monday | PM | PA113 | DM | |
| BIT371 | Monday | PM | PE110 | CT | |
| BIT105 | Tuesday | AM | PE227 | SN | |
| BIT313 | Tuesday | AM | PE226 | AO | |
| BIT230 | Tuesday | AM | TBA | SH | |
| BIT106 | Tuesday | PM | PA113 | SH | |
| BIT241 | Tuesday | PM | PA114 | DM | |
| BIT353 | Tuesday | PM | PE227 | AO | |
| BIT214 | Wednesday | AM | PE226 | RA | |
| BIT245 | Wednesday | AM | PA114 | PE | |
| BIT111 | Wednesday | PM | PA113 | PE | |
| BIT213 | Wednesday | PM | PE226 | XW | |
| BIT235 | Wednesday | PM | PA110 | MK | |
| BIT108 | Thursday | AM | PA113 | SN | |
| BIT231 | Thursday | AM | PE227 | NQ | |
| BIT233 | Thursday | AM | PE226 | NW | |
| BIT356 | Thursday | AM | PA114 | YW | |
| BIT246 | Thursday | AM | TBA | MK | |
| BIT242 | Thursday | PM | PE227 | DR | |
| BIT362 | Thursday | PM | PA114 | NW | |
| BIT363 | Thursday | PM | PA113 | YW | |
| BIT364 | Thursday | PM | PE226 | NQ | |
| BIT314 | Friday | AM | PA113 | DR | |
| BIT236 | Friday | PM | PE226 | YW | |
| BIT352 | Friday | PM | PA114 | DR | |

## 6. Subjects restricted to one semester

Subjects not listed here are treated as potentially running in either semester.

Semester 1 only:

```text
BIT351, BIT355, BIT357, BIT358
```

Semester 2 only:

```text
BIT246, BIT356, BIT363, BIT364
```

Notes or source:

## 7. Program requirements

These values should rarely change.

| Requirement | Count |
|---|---:|
| Total subjects | 24 |
| Core subjects | 14 |
| Major subjects | 6 |
| Elective subjects | 4 |

The core, major and elective counts must add up to the total.

Required change, or `UNCHANGED`:

## 8. Subject catalogue and rules

Update only confirmed changes. Leave empty fields as `—`.

Classification values:

- `Core`
- `Major`
- `Elective`

For major subjects, list one or more streams using `NS`, `BA` or `SD`.

| Code | Name | Classification | Major streams | Prerequisites | Corequisites | Special rule or notes |
|---|---|---|---|---|---|---|
| BIT105 | Business Enquiry and Communication | Core | — | — | — | |
| BIT106 | Foundations of Software, Hardware & Cloud Computing | Core | — | — | — | |
| BIT108 | Foundations of Business | Core | — | — | — | |
| BIT111 | Programming Concepts | Core | — | — | — | |
| BIT112 | Mathematics for Information Technology | Core | — | — | — | |
| BIT121 | Network Communication Concepts | Core | — | — | — | |
| BIT213 | Network & Cyber Security Essentials | Major | NS | — | BIT121 | |
| BIT214 | Cloud and IoT Emerging Technologies | Major | NS | BIT106 | — | |
| BIT230 | System Analysis & Design | Core | — | BIT106, BIT111 | — | |
| BIT231 | Database Systems | Core | — | BIT111 | — | |
| BIT233 | Network Design | Major | NS | BIT121 | — | |
| BIT235 | Object Oriented Programming | Major | SD | — | BIT245 | |
| BIT236 | Enterprise Resources Planning | Major | BA | BIT106, BIT231 | — | |
| BIT241 | Professional IT Practice & Ethics | Core | — | BIT105, BIT106 | — | |
| BIT242 | IT Project Management | Core | — | BIT230 | — | |
| BIT245 | Web Development | Major | BA, SD | BIT111 | — | Shared-stream subject |
| BIT246 | Object Oriented RAD | Major | SD | BIT235 | — | |
| BIT313 | Cyber Vulnerability & Hardening | Major | NS | BIT213 | — | |
| BIT314 | Cybersecurity Management & Governance | Core | — | BIT241 | — | |
| BIT351 | Mobile Application Development | Major | SD | BIT231, BIT235 | — | |
| BIT352 | System Implementation & Service Management | Core | — | BIT242 | — | |
| BIT353 | Network Architecture & Protocols | Major | NS | BIT233 | — | |
| BIT355 | Business Intelligence | Major | BA | BIT230, BIT236 | — | |
| BIT356 | Knowledge Management Systems | Major | BA | BIT230, BIT236 | — | |
| BIT357 | Business Analysis | Major | BA | BIT230 | — | |
| BIT358 | Advanced Databases | Major | SD | BIT231 | — | |
| BIT362 | Digital Forensics | Major | NS | BIT213 | — | |
| BIT363 | E-Business Systems | Major | BA | BIT230, BIT245 | — | |
| BIT364 | Non-Relational Database Management | Major | SD | BIT231 | — | |
| BIT371 | Capstone Experience 1 | Core | — | BIT242 | — | At least 2 completed major subjects and 5 completed-or-concurrent major subjects |
| BIT372 | Capstone Experience 2 | Core | — | BIT371 | — | |

### New subjects

Add confirmed new subjects here before asking Codex to update the JSON.

| Code | Name | Classification | Major streams | Prerequisites | Corequisites | Notes |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

### Removed or replaced subjects

| Existing code | Action | Replacement code | Previous name | Notes |
|---|---|---|---|---|
|  | Remove or replace |  |  |  |

## 9. SAS certificates

All SAS certificates currently require these common subjects:

```text
BIT106, BIT112, BIT231
```

| Certificate key | Certificate name | Minimum additional subjects | Additional subject choices | Stream label | Badge URL |
|---|---|---:|---|---|---|
| itAnalytics | SAS Academic Certificate in IT Analytics | 1 | BIT355, BIT356 | Business Analytics stream | https://www.credly.com/org/sas/badge/sas-melbourne-polytechnic-academic-specialisation-i |
| softwareDevelopmentAnalytics | Academic Certificate in Software Development Analytics | 1 | BIT358 | Software Development stream | https://www.credly.com/org/sas/badge/sas-melbourne-polytechnic-academic-specialisation-i.1 |

Required change, or `UNCHANGED`:

Source confirming the change:

## 10. Old subject codes

Use this section only when an old subject code should map to a current subject or an unspecified elective.

| Old code | Current code or USE code | Previous subject name | Show prominently? | Notes |
|---|---|---|---:|---|
|  |  |  | No | |

Do not use this table for typing or OCR mistakes.

## 11. Accepted typing and OCR aliases

Use this section only for common data-entry mistakes. These aliases must not appear as former subject codes.

| Mistyped or OCR code | Correct code | Reason |
|---|---|---|
| BIT2I0 | BIT246 | Existing alias |
| BITIOO | BIT105 | Existing alias |
| BIT1OO | BIT105 | Existing alias |
|  |  | New alias |

## 12. GUI layout changes

Write `UNCHANGED` unless subject cards genuinely need to move.

### Course Map

Required change:

Reason:

Desired subject order or sketch:

### Main Page grid

Required change:

Reason:

Desired subject order or sketch:

### Available Electives grid

Required change:

Reason:

Desired subject order or sketch:

When layouts change, every required subject must still appear in the appropriate layout, shared subjects must remain valid, and placeholders must retain their expected names.

## 13. Supporting evidence

List any files supplied with this update.

| File | What it confirms | Authoritative? | Notes |
|---|---|---:|---|
|  |  | Yes or No | |

If a PDF, Word document, email and spreadsheet disagree, describe the conflict here:

## 14. Questions Codex must resolve before editing

List anything that must not be guessed:

1.
2.
3.

## Request to give Codex

Copy and send the following request after completing this document:

> Update `semester-config.json` using `SEMESTER-UPDATE.md` and any supporting files I provide. Treat `SEMESTER-UPDATE.md` as the requested change set and `semester-config.json` as the website's current authoritative configuration. Preserve unchanged values, the existing object-based structure, and one-line-per-subject formatting. Do not guess when information is missing or sources conflict. Validate JSON syntax and all semantic references, including semester identity, dates, prices, filename expansion, staff IDs, timetable coverage, time slots, subject codes, classifications, major membership, prerequisites, corequisites, prerequisite cycles, BIT371 requirements, semester-only lists, SAS rules, old-code mappings, aliases and GUI layouts. Make the smallest necessary patch and then report exactly what changed, any unresolved issues and how to test the website.

## 15. Review checklist after Codex updates the JSON

### Configuration

- [ ] JSON loads without a configuration error.
- [ ] Correct year and semester appear throughout the site.
- [ ] Dates and fees are correct.
- [ ] Triage filename is correct.
- [ ] Every timetable staff ID resolves to the correct name.
- [ ] Every running subject has a day, time, room and lecturer.
- [ ] Subjects not running this semester are clearly identified.

### Subjects and rules

- [ ] Subject names are correct on cards, tables, searches and tooltips.
- [ ] Core and major classifications are correct.
- [ ] Shared-stream subjects display correctly.
- [ ] Prerequisites and corequisites display correctly.
- [ ] Subjects cannot be selected before prerequisites are satisfied.
- [ ] BIT371 and BIT372 behave correctly.
- [ ] SAS icons, tooltips and certificate messages are correct.

### Timetable and planning

- [ ] AM and PM times display correctly.
- [ ] Rooms and lecturer names display correctly.
- [ ] A full load opens the correct timetable.
- [ ] Move-to-next mode shows the correct future semester.
- [ ] Move-to-next mode does not display stale current-semester timetable details.
- [ ] The Timetable dialog copy action uses the correct heading.
- [ ] The sidebar Move button appears at the correct time.

### Layout

- [ ] Main Page cards appear in the intended positions.
- [ ] Course Map cards appear in the intended positions.
- [ ] Available Electives appear in the intended order.
- [ ] Card colours, stream labels and SAS markers remain correct.

### Finalisation

- [ ] Browser console contains no new errors.
- [ ] A hard refresh still loads the new configuration.
- [ ] The confirmed files are committed or backed up.
- [ ] The published site has been checked after deployment.
