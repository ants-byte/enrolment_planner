"""Scan synced Student Forms and optionally update the enrolment workbook.

Requires Python packages olefile, pypdf and pywin32, and desktop Excel.
Run with --apply to save; the default only writes a JSON review report.
"""
import argparse
from collections import defaultdict
import hashlib
from html import unescape
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
import unicodedata

EMAIL_PDF = re.compile(r"^(?:re|fw|fwd|reply|forward)(?=[\s_.:\-\[])", re.I)
EXCLUDED = re.compile(r"reduced[\s_-]*study[\s_-]*load|study[\s_-]*overload|\bRSL\b|\bCoE\b|transcript|passport|identity|birth[\s_-]*certificate", re.I)
MESSAGE_EXTENSIONS = {'.msg', '.pst', '.ost', '.tmp', '.dat', '.nk2', '.srs', '.asd', '.eml'}
COLUMN = 'SharePoint subject references'


def normal_name(value):
    text = unicodedata.normalize('NFKD', str(value or ''))
    return tuple(sorted(re.findall(r'[a-z]+', text.encode('ascii', 'ignore').decode().lower())))


def message_text(path):
    import olefile
    if not olefile.isOleFile(str(path)):
        raise ValueError('Not an Outlook MSG compound file; archive/metadata formats require a separate reader')
    with olefile.OleFileIO(str(path)) as ole:
        parts = []
        for prop in ['0037', '1000']:
            for suffix, encoding in [('001F', 'utf-16-le'), ('001E', 'cp1252')]:
                stream = '__substg1.0_' + prop + suffix
                if ole.exists(stream):
                    parts.append(ole.openstream(stream).read().decode(encoding, errors='replace'))
                    break
        if not parts or len(parts) < 2:
            raise ValueError('MSG has no readable plain-text body; review HTML/RTF-only message manually')
        return '\n'.join(parts)


def scan(folder, running):
    from email import policy
    from email.parser import BytesParser
    from pypdf import PdfReader
    entries, warnings = [], []
    for path in sorted(folder.rglob('*')):
        if not path.is_file() or EXCLUDED.search(path.stem):
            continue
        ext = path.suffix.lower()
        if ext not in MESSAGE_EXTENSIONS | {'.pdf'}:
            continue
        try:
            if ext == '.pdf':
                text = '\n'.join(page.extract_text() or '' for page in PdfReader(path).pages)
                header = text[:2000]
                if not EMAIL_PDF.match(path.name) and not all(re.search(r'\b' + field + r'\s*:', header, re.I) for field in ['From', 'To', 'Subject']):
                    continue
            elif ext == '.eml':
                message = BytesParser(policy=policy.default).parsebytes(path.read_bytes())
                body = message.get_body(preferencelist=('plain', 'html'))
                text = str(message.get('Subject', '')) + '\n' + (body.get_content() if body else '')
            else:
                text = message_text(path)
            text = unescape(re.sub(r'<[^>]+>', ' ', text))
            codes = sorted(set(re.findall(r'\bBIT\s*\d{3}\b', text.upper())))
            codes = sorted(set(re.sub(r'\s+', '', code) for code in codes) & set(running))
            if not codes:
                continue
            ancestors = list(reversed(path.relative_to(folder).parts[:-1]))
            identity = next((part for part in ancestors if re.match(r'^\d{7}(?:\D|$)', part)), ancestors[0] if ancestors else '')
            student_id = re.match(r'^(\d{7})(?:\D|$)', identity)
            entries.append({'student_id': student_id[1] if student_id else '', 'folder_name': identity,
                            'subjects': codes, 'file': str(path)})
        except Exception as exc:
            warnings.append({'file': str(path), 'error': str(exc)})
    return entries, warnings


def update(workbook, entries, running, report):
    import win32com.client
    if len(running) != 4:
        raise RuntimeError('The current Stats subject block has four rows; review its layout for another semester')
    lock = workbook.with_name('~$' + workbook.name)
    if lock.exists():
        raise RuntimeError('Save and close the destination workbook in Excel before running --apply')
    original_hash = hashlib.sha256(workbook.read_bytes()).digest()
    output = Path(tempfile.mkdtemp(prefix='student-forms-'))
    copy = output / workbook.name
    shutil.copy2(workbook, copy)
    app = win32com.client.DispatchEx('Excel.Application')
    app.Visible = False
    app.DisplayAlerts = False
    app.AskToUpdateLinks = False
    app.AutomationSecurity = 3
    book = None
    try:
        book = app.Workbooks.Open(str(copy), UpdateLinks=0, ReadOnly=False)
        triage = book.Worksheets('Triage')
        table = triage.ListObjects('Day')
        headers = {str(table.ListColumns(i).Name): i for i in range(1, table.ListColumns.Count + 1)}
        if COLUMN not in headers:
            if headers.get('On SharePoint') != 24 or headers.get('New Domestic on Strata') != 25:
                raise RuntimeError('Expected columns X/Y have changed; review the insertion position')
            triage.Columns(25).Insert()
            table.ListColumns(25).Name = COLUMN
        headers = {str(table.ListColumns(i).Name): i for i in range(1, table.ListColumns.Count + 1)}
        rows = table.DataBodyRange.Value2
        by_id, by_name = defaultdict(list), defaultdict(list)
        for i, row in enumerate(rows):
            value = str(row[headers['Student ID'] - 1] or '').removesuffix('.0').strip().lstrip('sS')
            if re.fullmatch(r'\d{7}', value):
                by_id[value].append(i)
            name = normal_name(str(row[headers['Given Names'] - 1] or '') + ' ' + str(row[headers['Family Names'] - 1] or ''))
            if name:
                by_name[name].append(i)
        subjects_by_row = defaultdict(set)
        matched_students, unmatched = {}, []
        for entry in entries:
            matches = by_id.get(entry['student_id'], []) if entry['student_id'] else by_name.get(normal_name(entry['folder_name']), [])
            if entry['student_id'] and matches:
                # Repeated contact rows describe one student: populate only the first.
                matches = matches[:1]
            if len(matches) != 1:
                unmatched.append(entry)
                continue
            row = matches[0]
            subjects_by_row[row].update(entry['subjects'])
            matched_students.setdefault(str(row), {'student_id': entry['student_id'], 'folder_name': entry['folder_name']})
        # This column is scan-owned; clear stale references on every refresh.
        table.ListColumns(COLUMN).DataBodyRange.Value2 = tuple((' '.join(sorted(subjects_by_row.get(i, []))),) for i in range(len(rows)))
        triage.Columns(headers[COLUMN]).ColumnWidth = 27
        table.ListColumns(COLUMN).DataBodyRange.WrapText = True
        stats = book.Worksheets('Stats')
        formula = str(stats.Range('DY8').Formula2)
        if '[[#This Row],[StudentNum Extracted as String]]' in formula:
            stats.Range('DY8').Formula2 = formula.replace('[[#This Row],[StudentNum Extracted as String]]', '[StudentNum Extracted as String]')
        elif '[@[StudentNum Extracted as String]]' in formula:
            stats.Range('DY8').Formula2 = formula.replace('[@[StudentNum Extracted as String]]', '[StudentNum Extracted as String]')
        elif 'SharePoint[StudentNum Extracted as String]' not in formula:
            raise RuntimeError('Stats DY8 formula has changed; review it before patching')
        stats.Range('B13').Value2 = 'Forms awaiting Strata'
        stats.Range('B20').Value2 = 'Subject Enrolment'
        stats.Range('C21:E21').Value2 = (('Strata', 'SharePoint', 'Combined'),)
        # Replace the old two-column spill with four explicit subject rows.
        stats.Range('B22').ClearContents()
        stats.Range('B22:E25').ClearContents()
        for r, code in enumerate(running, 22):
            stats.Cells(r, 2).Value2 = code
            stats.Cells(r, 3).Formula2 = f'=IFERROR(ROWS(UNIQUE(FILTER(StrataEnrolments[Student ID],(StrataEnrolments[Module/UoC ID]=B{r})*(StrataEnrolments[Student ID]<>"")))),0)'
            stats.Cells(r, 4).Formula = f'=COUNTIF(Day[{COLUMN}],"*"&B{r}&"*")'
            stats.Cells(r, 5).Formula2 = f'=C{r}+D{r}-SUMPRODUCT(--ISNUMBER(SEARCH(B{r},Day[{COLUMN}])),--(COUNTIFS(StrataEnrolments[Student ID],Day[Student ID],StrataEnrolments[Module/UoC ID],B{r})>0))'
        stats.Range('C21').Copy(stats.Range('D21:E21'))
        stats.Range('C21:E21').Value2 = (('Strata', 'SharePoint', 'Combined'),)
        stats.Range('C21:E25').NumberFormat = '0'
        app.CalculateFull()
        report['summary'] = {'selected': stats.Range('B7').Value2, 'discussion': stats.Range('B8').Value2,
                             'subject_counts': stats.Range('B22:E25').Value2}
        report['matched_students'] = list(matched_students.values())
        report['unmatched'] = unmatched
        report['backup'] = str(output / ('before-' + workbook.name))
        for row in stats.Range('B22:E25').Value2:
            if any(not isinstance(v, (int, float)) or v < 0 for v in row[1:]):
                raise RuntimeError('Subject count calculation failed: ' + str(row))
        book.Save()
        book.Close(False)
        book = None
        if lock.exists() or hashlib.sha256(workbook.read_bytes()).digest() != original_hash:
            raise RuntimeError('The source workbook opened or changed during preparation; source was not replaced')
        shutil.copy2(workbook, output / ('before-' + workbook.name))
        staged = workbook.with_name('.student-forms-update.xlsx')
        try:
            shutil.copy2(copy, staged)
            if lock.exists() or hashlib.sha256(workbook.read_bytes()).digest() != original_hash:
                raise RuntimeError('The source workbook changed before replacement; nothing was saved')
            os.replace(staged, workbook)
        finally:
            staged.unlink(missing_ok=True)
    finally:
        if book is not None:
            book.Close(False)
        app.Quit()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workbook', type=Path)
    parser.add_argument('--forms', type=Path)
    parser.add_argument('--subjects', nargs='+', help='Override the running subjects from semester-config.json')
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if not args.subjects:
        config = json.loads((Path(__file__).resolve().parent.parent / 'semester-config.json').read_text(encoding='utf-8-sig'))
        args.subjects = sorted(config['timetable'])
    folder = args.forms or args.workbook.parent.parent / 'Student Forms'
    if not folder.is_dir():
        parser.error('Student Forms folder does not exist')
    entries, warnings = scan(folder, args.subjects)
    report = {'workbook': str(args.workbook), 'forms': str(folder), 'running_subjects': args.subjects,
              'matches': entries, 'warnings': warnings,
              'meaning': 'Subject references in saved emails; these do not themselves prove enrolment approval.'}
    students = defaultdict(set)
    for entry in entries:
        students[entry['student_id'] or entry['folder_name']].update(entry['subjects'])
    report['student_subjects'] = {student: sorted(codes) for student, codes in students.items()}
    report['sharepoint_subject_counts'] = {code: sum(code in codes for codes in students.values()) for code in args.subjects}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    if args.apply:
        if warnings:
            raise RuntimeError('Some candidate files could not be read. Run without --apply and review the report first.')
        update(args.workbook, entries, args.subjects, report)
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({key: report[key] for key in ['summary', 'backup', 'warnings', 'unmatched'] if key in report}, indent=2, ensure_ascii=True))
    print(f'Review report: {args.report}; matching files: {len(entries)}')


if __name__ == '__main__':
    main()
