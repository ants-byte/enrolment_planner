# Semester Configuration Update Form

This document is a human-readable update form for `semester-config.json`.

`semester-config.json` is the authoritative configuration used by the website. You can edit 
that file directly instead of using this .md file, however you may find using this file easier.
Complete or amend this Markdown file, then ask Codex/Grok/Gemini or any other genAI coding extensioin 
to transfer the confirmed changes into the JSON and validate the site.

The values below reflect the configuration as at 18 July 2026.

## Recommended workflow

1.  Make a backup or Git commit before starting.
2.  Edit the relevant tables in this document.
3.  Leave a field blank when it is unchanged.
4.  Use `TBA` for an unknown value and `REMOVE` when an existing entry must be deleted.
5.  In Markdown tables, spaces on either side of each `|` are optional. 
    Keep the `|` separators and the same number of columns in each row.
6.  Where you see 'Notes' below, this is asking you for comments you think might assist
    the AI in creating the JSON code.  Normally you would leave Notes blank.
7.  Supply supporting Word documents, PDFs or spreadsheets when helpful.
8.  Record any conflicts between sources. Do not ask Codex to guess which source is correct.
9.  Give this document and the supporting files to Codex using the request near the end.
10. Review Codex's reported changes and complete the testing checklist before publishing.

It is usually safer for a replacement teacher to update this form than to edit JSON directly. A confident JSON editor may update `semester-config.json` directly, but should still ask Codex to validate it.

## Conventions

- Use four-digit years, such as `2027`.
- Use `S1`, `S2` or `SS` for the semester.
- Write dates as `DD/MM/YYYY`.
- Write subject codes in uppercase, such as `BIT105`.
- Use `AM` and `PM` for timetable slots.
- Use short, unique, uppercase staff IDs, such as `PE`.
- Use `NS`, `BA` and `SD` for Network Security, Business Analytics and Software Development.
- Separate multiple subject codes with commas.
- Keep each subject definition on one line when Codex writes the JSON.
- Do not put comments into JSON. The `_instructions` entries provide its human-readable notes.

## Update summary

Known uncertainties or conflicting information:

## 1. Semester details

| Setting | Current value | New value | Notes or source |
|---|---|---|---|
| Year | 2026 | | Four digits |
| Semester | S2 | | S1, S2 or SS |
| Semester start date | 20/07/2026 | | DD/MM/YYYY |
| End of second week | 31/07/2026 | | DD/MM/YYYY |
| Census date | 14/08/2026 | | DD/MM/YYYY |
| International price per unit | $2,360.00 | | Include currency |
| CSP price per unit | $1,192.00 | | Include currency |

## 2. File naming

The Triage workbook pattern is:

```text
Triage {YYYY} {SEMESTER}.xlsx
```

The site replaces `{YYYY}` and `{SEMESTER}` automatically. Do not change this pattern unless the naming convention itself changes.

Required change:

Notes:

## 3. Staff

Add new rows for new staff. Write `REMOVE` in Notes only when an ID should no longer be accepted.

| Staff ID | Current display name | Team? | New value | Notes |
|---|---|---:|---|---|
| AD | Antony Di Serio | No | | |
| AO | Anthony Overmars | No | | |
| CT | Tony, Sita, TBA | Yes | | |
| DM | Dominic Mammone | No | | |
| DR | David Robinson | No | | |
| MK | Md Sarwar Kamal | No | | |
| NQ | Nidha Qazi | No | | |
| NW | Nikki Wan | No | | |
| PE | Promise Enwereonye | No | | |
| RA | Russul Al-Anni | No | | |
| SH | Sarang Hashemi | No | | |
| SN | Shzaa Niazi | No | | |
| XW | Xiaodong Wang (Tony) | No | | |
| YW | Ye Wei (Silva) | No | | |
| | | No | | New staff |

## 4. Time slots

| Slot | Current start | Current end | New start | New end | Notes |
|---|---|---|---|---|---|
| AM | 8:30 am | 12:30 pm | | | |
| PM | 1:00 pm | 5:00 pm | | | |

Use lowercase `am` and `pm` when attached to a time.

## 5. Timetable

The timetable must contain exactly the subjects running in the configured semester. Delete rows for subjects not running and add rows for newly running subjects. Each staff ID must exist in the Staff table.

| Subject | Day | Slot | Room | Staff ID | Requested change or notes |
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
| | | | | | New running subject |

## 6. Subjects restricted to one semester

Subjects not listed here are treated as potentially running in either semester.

| Restriction | Current subject codes | New value |
|---|---|---|
| Semester 1 only | BIT351, BIT355, BIT357, BIT358 | |
| Semester 2 only | BIT246, BIT356, BIT363, BIT364 | |

Notes or source:

## 7. Program requirements

These counts should change only when the course rules change. Core + major + elective must equal total.

| Requirement | Current count | New count |
|---|---:|---:|
| Total subjects | 24 | |
| Core subjects | 14 | |
| Major subjects | 6 | |
| Elective subjects | 4 | |

The core count must equal the number of subject records whose `core` value is `true`.

## 8. Subject catalogue and academic rules

Update only confirmed changes. Use `—` where a field does not apply.

Classification values:

- `Core`
- `Major`
- `Elective`

Major subjects use one or more stream codes: `NS`, `BA` or `SD`. A subject in more than one stream is a shared-stream subject.

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
| BIT371 | Capstone Experience 1 | Core | — | BIT242 | — | At least 3 major subjects completed before starting; at least 5 major subjects completed or concurrent in total |
| BIT372 | Capstone Experience 2 | Core | — | BIT371 | — | |

### New subjects

| Code | Name | Classification | Major streams | Prerequisites | Corequisites | Notes |
|---|---|---|---|---|---|---|
| | | | | | | |

### Removed or replaced subjects

| Existing code | Action | Replacement code | Previous name | Notes |
|---|---|---|---|---|
| | Remove or replace | | | |

## 9. SAS certificates

Every current SAS certificate requires all these common subjects:

```text
BIT106, BIT112, BIT231
```

| Certificate key | Certificate name | Minimum additional subjects | Additional subject choices | Stream label | Badge URL |
|---|---|---:|---|---|---|
| itAnalytics | SAS Academic Certificate in IT Analytics | 1 | BIT355, BIT356 | Business Analytics stream | https://www.credly.com/org/sas/badge/sas-melbourne-polytechnic-academic-specialisation-i |
| softwareDevelopmentAnalytics | Academic Certificate in Software Development Analytics | 1 | BIT358 | Software Development stream | https://www.credly.com/org/sas/badge/sas-melbourne-polytechnic-academic-specialisation-i.1 |

Required change:

Source confirming the change:

## 10. Former subject codes

`oldCodes` converts former codes into current subject codes or `USE` elective codes.

| Old code | Current code or USE code | Requested change or notes |
|---|---|---|
| BIT100 | BIT105 | |
| BIT101 | BIT106 | |
| BIT102 | BIT121 | |
| BIT103 | BIT108 | |
| BIT104 | BIT111 | |
| BIT110 | BIT112 | |
| BIT123 | USE201 | |
| BIT201 | BIT231 | |
| BIT202 | USE201 | |
| BIT203 | BIT241 | |
| BIT204 | BIT236 | |
| BIT205 | BIT245 | |
| BIT206 | BIT233 | |
| BIT207 | BIT313 | |
| BIT208 | BIT214 | |
| BIT209 | BIT235 | |
| BIT210 | BIT246 | |
| BIT211 | BIT231 | |
| BIT212 | BIT357 | |
| BIT232 | BIT230 | |
| BIT234 | BIT236 | |
| BIT243 | BIT213 | |
| BIT244 | BIT214 | |
| BIT247 | BIT357 | |
| BIT301 | BIT230 | |
| BIT302 | BIT242 | |
| BIT303 | USE301 | |
| BIT304 | BIT355 | |
| BIT305 | BIT356 | |
| BIT306 | BIT363 | |
| BIT307 | BIT313 | |
| BIT308 | BIT213 | |
| BIT309 | BIT314 | |
| BIT310 | BIT358 | |
| BIT311 | BIT245 | |
| BIT312 | BIT352 | |
| BIT354 | BIT313 | |
| BIT361 | BIT314 | |
| | | New mapping |

## 11. Accepted typing and OCR aliases

These are data-entry mistakes, not former subject codes, and must not appear in the Old Codes display.

| Mistyped or OCR code | Correct code | Requested change or reason |
|---|---|---|
| BIT2I0 | BIT246 | Existing alias |
| BITIOO | BIT105 | Existing alias |
| BIT1OO | BIT105 | Existing alias |
| | | New alias |

## 12. Old Codes display

Code conversion belongs in `oldCodes`. This section controls only how those conversions are presented.

Current important codes shown first:

```text
BIT100, BIT101, BIT234, BIT243, BIT244, BIT306, BIT354, BIT361
```

Current previous subject names:

| Old code | Previous subject name | New value |
|---|---|---|
| BIT243 | Network Security | |
| BIT244 | IT and Business Crime | |
| BIT354 | Network Vulnerability and Penetration Testing | |
| BIT361 | Security Management and Governance | |
| | | New previous name |

## 13. Credit and articulation presets

These lists fill the shortcut buttons in the Enter Subject Codes dialog. The FMP patterns are also used when recognising credit-entry patterns.

| Preset | Current subject codes | New value |
|---|---|---|
| FMP Associate Degree | BIT105, BIT106, BIT108, BIT111, BIT112, BIT121, BIT213, BIT230, BIT231, BIT233, BIT235, BIT241, BIT242, BIT214, BIT245, BIT358 | |
| FMP Diploma | BIT106, BIT111, BIT121, BIT230, BIT231, BIT233, BIT242, BIT245 | |
| Melbourne Polytechnic Diploma 2027 | BIT105, BIT106, BIT108, BIT111, BIT121, BIT233, BIT213, USE101 | |
| Melbourne Polytechnic Diploma—previous | BIT106, BIT111, BIT121, BIT230, BIT233, BIT242, BIT245, USE101 | |

Current Associate Degree exit-award structure:

| Requirement | Current count | New count |
|---|---:|---:|
| Total subjects | 16 | |
| Core subjects | 10 | |
| Major subjects | 3 | |
| Elective subjects | 3 | |

## 14. Summer School planning facts

These settings guide planning messages. A likely subject is not guaranteed to run.

| Setting | Current value | New value |
|---|---|---|
| Likely subjects | BIT241, BIT352 | |
| Duration | 7 weeks | |
| Maximum subjects per student | 2 | |
| Typical number of subjects offered | 2–4 | |
| Minimum student demand | 5 | |
| Major streams not offered | SD | |
| Subjects not offered | BIT371, BIT372 | |

Notes or source:

## 15. Planning guidance facts

This section stores facts and thresholds used inside explanatory prose. It should not contain whole paragraphs of website content.

### First-semester recommendations

| Setting | Current subject codes | New value |
|---|---|---|
| Network Security option | BIT121 | |
| General recommendations | BIT105, BIT111 | |
| Software Development option | BIT111 | |

### Major decision thresholds

| Setting | Current value | New value |
|---|---:|---:|
| Completed subjects before major-decision guidance | 8 | |
| Minimum major subjects by end of second year | 3 | |
| Preferred major subjects by end of second year | 5 | |

### Early-completion settings

| Setting | Current value | New value |
|---|---|---|
| Semester 1 remaining-count triggers | 9, 10 | |
| Semester 2 remaining-count triggers | 5, 6, 9, 10 | |
| Notice remaining-count triggers | 9, 5 | |
| Capstone-restricted notice count | 5 | |
| Standard semester load | 4 | |
| Overload subject count | 5 | |
| Minimum grade label and range | CR, 60–69% | |

## 16. Optional Course Map alternative names

These are proposed names displayed only when the Course Map alternative-names option is enabled.

Current proposed stream names:

| Stream | Proposed name | New value |
|---|---|---|
| NS | Cyber Security | |
| BA | AI Data Analytics | |
| SD | Intelligent Software Development | |

Current proposed subject names:

| Current code | Proposed code | Proposed name | New value |
|---|---|---|---|
| BIT245 | BIT2XX | Web Application Development | |
| BIT246 | BIT2XX | Applied AI for Software Solutions | |
| BIT351 | BIT3XX | Mobile and Intelligent Application Development | |
| BIT358 | BIT3XX | Advanced Databases and Data Intelligence | |
| BIT364 | BIT3XX | Software Delivery Automation | |
| BIT236 | BIT2XX | AI-enabled Enterprise Big Data Visualisation | |
| BIT357 | BIT3XX | Business Process Automation | |
| BIT363 | BIT3XX | AI-powered e-Business | |

If this feature is discontinued, ask Codex to confirm that the JavaScript no longer reads this section before deleting it.

## 17. GUI layout

These settings are currently used by the site. Change them only when cards or placeholders genuinely need to move.

### Course Map layout

Each nested list is one visible row.

```text
Top row 1: BIT106, BIT111, BIT112, BIT231, BIT241, BIT314, BIT352
Top row 2: BIT121, BIT105, BIT108, BIT230, BIT242, BIT371, BIT372

Placeholder row 1: Major 1, Major 3, Major 5, Elective 1, Elective 3
Placeholder row 2: Major 2, Major 4, Major 6, Elective 2, Elective 4

NS row 1: BIT233, BIT214, BIT313
NS row 2: BIT213, BIT353, BIT362

BA row 1: BIT236, BIT357, BIT356
BA row 2: BIT245, BIT355, BIT363

SD row 1: BIT245, BIT246, BIT358
SD row 2: BIT235, BIT351, BIT364
```

Required change:

Reason or desired order:

### Main Page major-subject order

```text
NS: BIT213, BIT233, BIT353, BIT214, BIT362, BIT313
BA: BIT245, BIT236, BIT357, BIT356, BIT363, BIT355
SD: BIT245, BIT235, BIT246, BIT358, BIT364, BIT351
```

Required change:

### Main Page grid

```text
Year 1     | Year 2    | Year 3    | Year 4    | Year 5
BIT121     | MAJOR     | MAJOR     | MAJOR     | INFO
BIT106     | BIT108    | MAJOR     | MAJOR     | BIT314
BIT112     | BIT231    | BIT241    | MAJOR     | BIT352
BIT111     | BIT230    | BIT242    | BIT371    | BIT372
BIT105     | ELECTIVE1 | ELECTIVE2 | ELECTIVE3 | ELECTIVE4
```

Keep the special placeholders `MAJOR`, `INFO`, and `ELECTIVE1` through `ELECTIVE4` exactly as written.

Required change:

### Available Electives grid

Headings:

```text
Elective 1, Elective 2, Elective 3, Elective 4, Elective 5
```

Current sequence when Network Security is the major:

```text
BIT245 |        |        |        |
BIT236 | BIT355 | BIT356 | BIT357 | BIT363
BIT235 | BIT246 | BIT358 | BIT364 | BIT351
```

Current sequence when Business Analytics is the major:

```text
BIT235 | BIT246 | BIT358 | BIT364 | BIT351
       | BIT213 | BIT233 | BIT353 |
       | BIT214 | BIT313 | BIT362 |
```

Current sequence when Software Development is the major:

```text
BIT236 | BIT355 | BIT356 | BIT357 | BIT363
       | BIT213 | BIT233 | BIT353 |
       | BIT214 | BIT313 | BIT362 |
```

Required change:

## 18. Supporting evidence

| File | What it confirms | Authoritative? | Notes |
|---|---|---:|---|
| | | Yes or No | |

If supplied sources disagree, describe the conflict here:

## 19. Questions Codex must resolve before editing

List anything that must not be guessed:

1.
2.
3.

## Request to give Codex

After completing this form, send Codex:

> Update `semester-config.json` using `SEMESTER-CONFIG-UPDATE.md` and the supporting files I provide. Treat this Markdown file as the requested change set and the existing JSON as the website's current authoritative configuration. Preserve all unchanged values, the object-based structure, and one-line-per-subject formatting. Do not guess when information is missing or sources conflict. Validate JSON syntax and semantic references, including semester identity, dates, prices, filename expansion, staff IDs, timetable coverage, time slots, subject codes, classifications, stream membership, prerequisites, corequisites, prerequisite cycles, BIT371 thresholds, semester restrictions, SAS rules, former-code mappings, aliases, credit presets, Summer School settings, planning thresholds, alternative names and GUI layouts. Make the smallest necessary patch. Then report exactly what changed, any unresolved issues, and how to test the website.

## 20. Review checklist

### Configuration

- [ ] JSON loads without a configuration error.
- [ ] Correct year and semester appear throughout the site.
- [ ] Dates and fees are correct.
- [ ] The preferred Triage filename is correct.
- [ ] Every timetable staff ID resolves to the correct name.
- [ ] Every running subject has a day, time, room and lecturer.
- [ ] Subjects not running this semester are clearly identified.

### Subjects and rules

- [ ] Subject names are correct on cards, tables, searches and tooltips.
- [ ] Core, major and shared-stream classifications are correct.
- [ ] Prerequisites and corequisites display and behave correctly.
- [ ] BIT371 requires at least three completed major subjects before starting.
- [ ] BIT371 requires at least five completed-or-concurrent major subjects in total.
- [ ] BIT372 requires BIT371.
- [ ] SAS icons, tooltips and certificate messages are correct.

### Codes, credit and guidance

- [ ] Former subject codes convert correctly.
- [ ] The Codes dialog mentions only former codes present in the entered history.
- [ ] Typing and OCR aliases are accepted but do not appear as former codes.
- [ ] Credit-entry preset buttons enter the expected subjects.
- [ ] Credit warnings and capstone restrictions remain correct.
- [ ] Summer School messages use the configured facts.
- [ ] Requirement numbers in explanatory guidance match the JSON.

### Timetable and planning

- [ ] AM and PM expand to the correct lowercase `am` and `pm` times.
- [ ] Rooms and lecturer names display correctly.
- [ ] A full load opens the correct timetable.
- [ ] Move-to-next mode shows the correct future semester.
- [ ] Future timetable dialogs omit current-semester fees.
- [ ] The Timetable dialog copy action uses the correct heading.
- [ ] The Move to next semester button appears only in the intended modes.

### Alerts and interaction

- [ ] New Cautions block interaction until the Caution dialog is opened.
- [ ] New Alerts block interaction until their acknowledgement is selected.
- [ ] If read alerts appear below, the acknowledgement mentions them.
- [ ] If no read alerts appear below, it says: “I understand these alerts and am ready to proceed.”
- [ ] History-clicking updates do not activate the blocking overlay.

### Layout

- [ ] Main Page cards appear in the intended positions.
- [ ] Course Map cards appear in the intended positions.
- [ ] Available Electives appear in the intended order.
- [ ] Card colours, animation, stream labels and SAS markers remain correct.

### Finalisation

- [ ] The browser console contains no new errors.
- [ ] A hard refresh still loads the new configuration.
- [ ] The confirmed files are committed or backed up.
- [ ] The published site has been checked after deployment.
