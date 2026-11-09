"""Import Word-exported HTML as section-cited MCP reference text (stdlib only).

Usage: python tools/import-email-scripts.py "path/to/Email Scripts.htm"
Review the resulting JSON diff before publishing; this is a checked-in snapshot.
"""
import hashlib
import json
from pathlib import Path
import re
import sys
from html.parser import HTMLParser
from urllib.parse import parse_qs, urlencode, urlsplit, urlunsplit


def clean_link(href):
    parts = urlsplit(href)
    if parts.hostname and parts.hostname.endswith('.safelinks.protection.outlook.com'):
        href = parse_qs(parts.query).get('url', [''])[0]
        parts = urlsplit(href)
    if parts.scheme not in ('http', 'https', 'mailto'):
        return None  # Omit local document and image paths.
    query = [(k, v) for k, values in parse_qs(parts.query).items()
             if not k.startswith('utm_') for v in values]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


class Reader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_body = False
        self.skip = 0
        self.heading = None
        self.heading_level = 0
        self.text = []
        self.path = []
        self.current = None
        self.sections = []

    def flush(self):
        text = ' '.join(''.join(self.text).split())
        self.text = []
        if not text:
            return
        if self.heading:
            self.path = self.path[:self.heading_level - 1] + [text]
            key = ' / '.join(self.path)
            self.current = {
                'id': 'email-' + hashlib.sha256(key.encode()).hexdigest()[:12],
                'heading': text, 'headingPath': list(self.path),
                'paragraphs': [], 'links': [], 'reviewNotes': [],
            }
            self.sections.append(self.current)
        elif self.current:
            key = 'reviewNotes' if text.startswith('EDITORIAL CHECK') else 'paragraphs'
            self.current[key].append(text)

    def handle_starttag(self, tag, attrs):
        if tag == 'body':
            self.in_body = True
        if tag in ('style', 'script'):
            self.skip += 1
        if not self.in_body or self.skip:
            return
        if re.fullmatch(r'h[1-6]', tag):
            self.flush()
            self.heading, self.heading_level = tag, int(tag[1])
        elif tag in ('p', 'li', 'tr'):
            self.flush()
        elif tag == 'br':
            self.text.append(' ')
        elif tag == 'a' and self.current:
            href = clean_link(dict(attrs).get('href', ''))
            if href and href not in self.current['links']:
                self.current['links'].append(href)

    def handle_endtag(self, tag):
        if tag in ('style', 'script'):
            self.skip -= 1
        if not self.in_body or self.skip:
            return
        if re.fullmatch(r'h[1-6]', tag):
            self.flush()
            self.heading = None
        elif tag in ('p', 'li', 'tr'):
            self.flush()
        elif tag == 'body':
            self.flush()
            self.in_body = False

    def handle_data(self, text):
        if self.in_body and not self.skip:
            self.text.append(text)


def convert(source):
    raw = source.read_bytes()
    encoding = 'utf-16' if raw.startswith((b'\xff\xfe', b'\xfe\xff')) else 'utf-8-sig'
    reader = Reader()
    reader.feed(raw.decode(encoding))
    reader.flush()
    sections = [s for s in reader.sections if s['paragraphs'] and s['heading'] != 'How to use this document']
    for section in sections:
        text = '\n'.join(section.pop('paragraphs'))
        section['text'] = text
        notes = section['reviewNotes']
        if re.search(r'capstone|BIT37[12]', text, re.I):
            notes.append('Capstone wording varies across templates. Use the structured subject requirements; report unresolved differences rather than choosing a rule silently.')
        if re.search(r'70%|CR grade|CSP|\$|HECS|FEE.HELP', text, re.I):
            notes.append('Fees, CSP availability and overload thresholds may be historical or inconsistent. Compare with current course facts and obtain confirmation for financial eligibility.')
        if 'Summer Semester is only a possibility' in section['heading']:
            notes.append('Historical template contains conflicting summer subject limits and old offerings. Do not use those claims: consult current summer rules and timetable instead.')
        if re.search(r'visa|USI|refund|password|work.*hour', text, re.I):
            notes.append('Administrative, immigration, refund and account procedures are source guidance, not a current verified determination. Use linked official sources or the responsible student-support team for confirmation. Never request passwords or a USI in chat.')
        if re.search(r'you (?:have|will receive|already have)|your \d+ credits|your credit transfers|as discussed', text, re.I):
            notes.append('Contains a worked case or assumed student circumstances. Apply only after checking the actual student history; do not award credits from this example.')
        if re.search(r'\b(?:Monday|Tuesday|Wednesday|Thursday|Friday)\b|\b20\d\d\b|\b(?:AM|PM)\b', text):
            notes.append('Dates, class times and rooms in this template may be dated examples. Use the configured current semester timetable and dates for actual planning.')
    if not sections:
        raise ValueError('No headed reference sections found')
    return {
        'source': {'document': source.name, 'sha256': hashlib.sha256(raw).hexdigest(),
                   'context': 'Summer Semester 2026 email-script snapshot',
                   'citationMethod': 'Document heading path and stable section ID; HTML has no reliable page numbers.'},
        'limitations': [
            'Email templates explain processes; their first-person statements are not evidence that an enrolment, approval, payment, credit award or email action has occurred.',
            'Images and local attachments are not included. Do not claim to have read them or invent their contents.',
            'Source links and contacts are preserved, not live-verified. Outlook Safe Links wrappers and tracking parameters have been removed.',
            'Some templates contain inconsistent or outdated rules. Use structured course facts for planner calculations and explicitly flag any unresolved policy conflicts.',
        ],
        'sections': sections,
    }


if __name__ == '__main__':
    target = Path(__file__).resolve().parents[1] / 'email-scripts-reference.json'
    result = convert(Path(sys.argv[1]))
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Imported {len(result["sections"])} sections into {target.name}')
