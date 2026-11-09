from pathlib import Path
import json
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / 'semester-config.json').read_text(encoding='utf-8'))
rules = json.loads((ROOT / 'enrolment-rules-reference.json').read_text(encoding='utf-8'))
doc = Document()
section = doc.sections[0]
section.page_width, section.page_height = Inches(8.5), Inches(11)
section.top_margin = section.bottom_margin = Inches(.65)
section.left_margin = section.right_margin = Inches(.75)
section.footer_distance = Inches(.28)
normal = doc.styles['Normal']
normal.font.name = 'Calibri'
normal.font.size = Pt(11)
normal.paragraph_format.space_after = Pt(7)
normal.paragraph_format.line_spacing = 1.07
for name, size in [('Title', 25), ('Heading 1', 18), ('Heading 2', 12)]:
    style = doc.styles[name]
    style.font.name = 'Calibri'; style.font.size = Pt(size)
    style.font.color.rgb = RGBColor(0, 0, 0)
    style.paragraph_format.space_before = Pt(12 if name == 'Heading 2' else 0)
    style.paragraph_format.space_after = Pt(8)
    style.paragraph_format.keep_with_next = True
    for border in list(style.element.iter(qn('w:pBdr'))):
        border.getparent().remove(border)
for name in ('List Bullet', 'List Number'):
    doc.styles[name].font.name = 'Calibri'; doc.styles[name].font.size = Pt(11)
    doc.styles[name].paragraph_format.space_after = Pt(5)
footer = section.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
run = footer.add_run('Enrolment and study planning  |  '); run.font.size = Pt(9)
field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); footer._p.append(field)
doc.core_properties.title = 'Enrolment and Study Planning Rules'
doc.core_properties.subject = 'Bachelor of Information Technology'
doc.core_properties.author = 'Melbourne Polytechnic Bachelor of IT'

def p(text, style=None): return doc.add_paragraph(text, style)
def h(text): doc.add_heading(text, 2)
def bullet(text): p(text, 'List Bullet')
def source(text):
    para = p('Sources: ' + text)
    para.paragraph_format.space_before = Pt(8)
    for run in para.runs: run.font.size = Pt(9); run.font.color.rgb = RGBColor.from_string('555555')
def page(title):
    heading = doc.add_heading(title, 1)
    heading.paragraph_format.page_break_before = True
def table(headers, rows, widths):
    t = doc.add_table(rows=1, cols=len(headers)); t.autofit = False
    for cell, width in zip(t.columns, widths): cell.width = Inches(width)
    for cell, text in zip(t.rows[0].cells, headers):
        cell.text = text
        sh = OxmlElement('w:shd'); sh.set(qn('w:fill'), 'E9EEF2'); cell._tc.get_or_add_tcPr().append(sh)
        for run in cell.paragraphs[0].runs: run.bold = True
    repeat = OxmlElement('w:tblHeader'); t.rows[0]._tr.get_or_add_trPr().append(repeat)
    for row in rows:
        cells = t.add_row().cells
        for c, text in zip(cells, row): c.text = text
        no_split = OxmlElement('w:cantSplit'); t.rows[-1]._tr.get_or_add_trPr().append(no_split)
    for row in t.rows:
        for cell, width in zip(row.cells, widths):
            cell.width = Inches(width)
            for para in cell.paragraphs:
                para.paragraph_format.space_after = Pt(5)
                for run in para.runs: run.font.size = Pt(10)
    p('')

doc.add_heading('Enrolment and Study Planning Rules', 0)
p('Bachelor of Information Technology | Melbourne Polytechnic')
p('Consolidated guidance for students and advising staff\nReview edition 8 November 2026')
h('How to use this handbook')
p('Use this handbook to explain study choices, course requirements and the steps needed to complete enrolment. It combines the student-accessible guidance used by Timetable Planner, with the course owner\'s corrections taking priority over older source wording.')
p('Advice and a proposed study plan do not constitute enrolment, an approved credit transfer, an overload approval or a visa determination. Formal decisions remain with the responsible course or administration team.')
h('Course structure')
p('The configured Bachelor of IT requires 24 subjects: 14 core subjects, all six subjects in one chosen major, and four electives. Each subject is normally worth 12 credit points. The usual course length is three years of full-time study, with two main semesters per year.')
table(['Major', 'Code'], [('Network Security', 'NS'), ('Business Analytics', 'BA'), ('Software Development', 'SD')], [5.8, 1.2])
p('Subjects from the other major streams can fill elective places. Approved unspecified elective credits can also fill those places. A subject shared by two streams is counted once, according to the student\'s chosen major.')
h('Confirmed subject classifications')
p('BIT314 Cybersecurity Management & Governance is core. BIT214 Cloud and IoT Emerging Technologies is a Network Security major subject. The course owner has confirmed these classifications; the 14-core, six-major and four-elective structure remains unchanged.')
source('Course configuration, Program Requirements and Subjects; course-owner corrections; Email Scripts, Credits - USE and major explained.')

page('Subject eligibility and Capstone')
h('Completed study and credits')
p('Count only subjects passed or formally credited as completed. Failed, withdrawn and ungraded current enrolments are not completed study. A credit for one subject does not automatically give credit for its prerequisite subjects.')
p('For example, a student with BIT242 credited and no other history has BIT242 completed. BIT230 and the earlier subjects in that chain remain outstanding unless separately passed or credited.')
h('Prerequisites and corequisites')
bullet('A prerequisite must be completed before the later subject can be studied.')
bullet('A corequisite can have been completed earlier or can be studied at the same time. Concurrent subjects must be selected together where required.')
bullet('Being eligible for one subject does not prove that a complete combination is free of timetable clashes, within the permitted load, or approved for enrolment.')
bullet('Special permission to study a prerequisite concurrently is an individual staff decision. Do not generalise a worked example into permission for every student.')
h('Capstone sequence')
p('BIT371 Capstone Experience 1 is followed by BIT372 Capstone Experience 2. Together they form a project across two main semesters. Students apply their major knowledge in a substantial project, often for an external business, with staff guidance.')
p('The configured entry rule for BIT371 is completion of BIT242 and at least three subjects in the chosen major. At least five major subjects must be completed or studied concurrently with BIT371. A student with three completed major subjects therefore needs two further major subjects concurrently; a student with four needs one.')
p('The configured prerequisite for BIT372 is BIT371. Older source wording also discusses five completed major subjects before BIT372; use the BIT371 progression requirements above and seek course advice if a student\'s history does not satisfy that sequence.')
h('BIT213 alongside BIT121')
p('BIT213 can be studied with BIT121 as its corequisite. Email Scripts recommends that students without introductory networking experience complete BIT121 first, because taking the two together can be difficult.')
source('Course configuration, Subjects; Email Scripts, Capstone Explained, Major subjects for Capstone, and BIT213 as co-requisite.')

page('Study loads and Summer Semester')
h('Normal study load')
p('The standard main-semester load is four subjects, usually 48 credit points. International students should plan to complete their course within the period recorded on their Confirmation of Enrolment. A reduced load may require approval and supporting documentation. Domestic students may study part time.')
h('Summer rules')
bullet('Summer is optional and intensive. The usual subject content is taught over a shorter period.')
bullet('Students may take a maximum of two summer subjects.')
bullet('Only the published summer offerings are available. Do not assume all core or major subjects will run.')
bullet('Summer subjects cost the normal subject price and require upfront payment of the full applicable fees. Do not quote a current amount from a historical example.')
bullet('Future summer offerings are not guaranteed. Do not build a guaranteed graduation date around an unpublished summer timetable.')
h('Configured Summer Semester 2026')
table(['Milestone', 'Date'], [('Enrolment opens', '13 November 2026'), ('Classes begin', '23 November 2026'), ('End of second week', '4 December 2026'), ('Census date', '11 December 2026'), ('Semester ends', '22 January 2027')], [4.2, 2.8])
p('The current configuration offers BIT108, BIT314, BIT352 and BIT355. This is the Summer Semester 2026 list, not a prediction of the next summer. The late-enrolment cut-off is separate from census and must be confirmed with Enrolments.')
h('Five-subject overload')
p('An overload may be considered when it allows the student to graduate within the same year, subject to approval and a CR average or above over the past year. CR is 70-79%, so the minimum average is 70%. A high average alone does not give automatic permission to take five subjects.')
source('Course-owner corrections; course configuration, Semester Details, Timetable and Summer School; Email Scripts, Completing The Course Early and Summer Semester Explained.')

page('Major choice and study sequencing')
h('Choose a major early enough to progress')
p('Students must complete the full set of subjects in one major. Choosing too many subjects from other streams can fill the four elective places while leaving major requirements outstanding. Changing major can change which credits are usable and may extend the course.')
p('FMP students should be encouraged to consider Network Security. Business Analytics and Software Development remain available if the student prefers. Recalculate usable credits, prerequisites, alternating offerings and Capstone timing for that choice; do not reuse a personalised FMP example as a universal sequence.')
h('Subjects worth prioritising')
bullet('BIT106 and BIT111 start the core chain leading through BIT230 and BIT242 to BIT371 and BIT372. Delaying this chain may delay graduation.')
bullet('For Network Security, prioritise BIT121 because it opens later networking subjects.')
bullet('For Business Analytics, progress through BIT106, BIT111, BIT231 and BIT230, then the relevant major subjects, including BIT236 and BIT245.')
bullet('For Software Development, complete BIT111 and work towards BIT231, BIT245 and BIT235 so that later major subjects become available.')
h('Alternating main-semester subjects')
table(['Stream', 'Semester 1 only', 'Semester 2 only'], [('Business Analytics', 'BIT355, BIT357', 'BIT356, BIT363'), ('Software Development', 'BIT351, BIT358', 'BIT246, BIT364')], [2.2, 2.4, 2.4])
p('Missing an alternating subject can mean waiting until the same semester the following year. Check availability before leaving one until later. These are configured rotations, not confirmed future class times or a promise that a class will run.')
h('Shared subject BIT245')
p('BIT245 belongs to both BA and SD. It counts as a major subject for a student taking either of those majors. For an NS student, it can count as an elective, provided an elective place remains.')
source('Course-owner corrections; course configuration, Subjects Running and Planning Guidance; Email Scripts, major-specific sequencing, alternating subjects and BIT245 is BA and SD.')

page('Credit transfers and recognition of prior learning')
h('Types of credit')
p('Specified credit recognises prior learning that maps to a named subject. Unspecified elective credit fills an elective place where prior study does not map closely enough to a named subject. Recognition of Prior Learning, or RPL, assesses relevant experience and other learning against subject outcomes.')
p('There are four elective places. Specified subjects outside the chosen major and unspecified elective credits share those places. More than four such credits do not remove the need to complete the core and the chosen major. They may leave some credits unusable towards the 24-subject award.')
h('Evidence and assessment')
bullet('Provide transcripts showing the course, subjects, dates and outcomes of prior study.')
bullet('Staff usually look up subject outlines or descriptions on the web themselves. They can ask for or require the student to supply them when assessing credit.')
bullet('Supply requested supporting evidence. An informal discussion, enrolment strategy or signed application is not itself a granted credit.')
bullet('RPL may require a CV, employer references, work examples and other evidence demonstrating current knowledge and skills.')
h('Limits and exceptions')
p('The shared guidance describes typical limits of up to eight subjects for diploma study and up to twelve for higher-level formal study, with possible additional RPL. These are assessment limits, not automatic entitlements. Articulation and nested awards may have specific arrangements, including FMP pathways.')
p('Sixteen subjects at 12 credit points each total 192 credit points. The source figure of 196 for twelve formal credits plus four RPL credits is an arithmetic error.')
p('The configured course normally restricts credit for third-year subjects and BIT241. Source documents also describe negotiated pathway exceptions. Refer such cases for formal assessment rather than rejecting or awarding credit automatically.')
h('Processing and follow-up')
p('Email Scripts describes credits usually appearing by mid-semester, or before the next semester for the summer workflow. These are context-specific expectations, not guaranteed deadlines. Check the student record and follow up with course administration if an approved credit is missing.')
source('Course-owner corrections; course configuration, Credit and Articulation; Email Scripts, Applying for Credit Transfer, Credit Transfer follow-ups and USE explanations; shared rules, Credit Transfers and RPL.')

page('Admission and completing enrolment')
h('Entry requirements')
p('Applicants may enter through secondary education, relevant vocational study, higher education, or relevant work and life experience, subject to the applicable admission criteria and assessment. Meeting minimum criteria does not guarantee admission. Interviews and evidence of prior study or experience may be requested.')
p('The English entry requirement is not confirmed. Do not give students a definitive score or select between conflicting source thresholds. Admissions must confirm the current requirement for the particular applicant and pathway.')
h('International applicants')
p('International students should work with the International Office on their offer, acceptance, payments and Confirmation of Enrolment, or CoE. Holding a student number is not proof that all of these steps are complete. A deferred or returning student may need an updated CoE.')
p('Current enrolment guidance is to finalise enrolment when the student is onshore and the required documentation is in order. Refer offshore or exceptional cases to the International Office; historical bypass instructions are not general permission to enrol.')
h('Unique Student Identifier')
p('Students need a USI for the enrolment process. If one already exists, use the government\'s recovery process rather than creating another. Follow official identity-matching instructions and obtain help from the USI service or Enrolments where records do not match. Students should provide identity documents and identifiers through the appropriate official process, not a public chat.')
h('Application and subject confirmation')
for text in [
    'Complete the course application and the online enrolment form. Check the inbox and junk folder for messages from the enrolment team.',
    'Establish approved credits and a complete study history, then choose subjects that satisfy course requirements.',
    'Send subject selections to the Bachelor of IT enrolment team and complete the required declaration or confirmation process.',
    'Complete any outstanding payment or administration steps and verify the final enrolment in the Student Portal.'
]: p(text, 'List Number')
p('Moodle access can appear later than the official enrolment record because teachers may hide their subject until the first class. Do not use Moodle visibility alone as proof that enrolment has or has not been processed.')
source('Email Scripts, introductory communications, online enrolment, student declarations and follow-ups; shared/student admission and USI guidance.')

page('Changes withdrawals and reduced loads')
h('Adding or replacing subjects')
p('Discuss proposed changes promptly with the course team. Adding a replacement and withdrawing from the original subject are separate administrative actions. Recheck prerequisites, timetable compatibility, course progression and the resulting study load.')
p('The sources use inconsistent week-one, week-two and week-three late-enrolment wording. Confirm the actual cut-off and whether an Application for Late Enrolment or other approval is required. Census is a separate withdrawal and fee-liability milestone; it must not be used as the last date to add a subject.')
h('Withdrawing from a subject or course')
p('Students should contact the course team or Student Hub before withdrawing so that course, fee and progression implications can be explained. Withdrawal after census normally leaves fee liability; special-circumstance processes may apply. Obtain the applicable current advice rather than promising a refund from an old template.')
p('International students must also discuss implications for their CoE and expected completion date with the International Office. A withdrawal that reduces the load may require a Reduced Study Load application.')
h('Reduced study load')
p('Possible grounds in the source guidance include a final semester with fewer required subjects remaining, an academic-progress intervention, or approved compassionate or compelling circumstances. Approval and documentation may be required. A student should not assume that choosing fewer subjects is automatically allowed under their visa conditions.')
p('An Academic Progress Panel or other improvement plan may limit the load for a particular semester. Check the actual plan, its period of application and any conditions before preparing selections.')
h('Deferral leave and return')
p('Discuss a deferral or leave of absence with the course team. Formal approval, return dates and international-student requirements must be checked. A returning student may need reactivation, a new application form or an updated CoE depending on the length and circumstances of the break.')
h('Extra subjects beyond the award')
p('Completing subjects beyond the 24 required for the degree is not the same as filling an outstanding degree requirement. The shared guidance treats additional single subjects as non-award study, with separate approval and fee implications. Ask the course team before adding them.')
source('Email Scripts, Enrolment cutoff dates, Reduced Study Load and Withdrawal; shared rules, Study Load, Leave of Absence and amendment procedures.')

page('Fees CSP and international study advice')
h('How to discuss fees')
p('Do not quote an amount to a student as a current fee. Amounts can change each semester. Direct the student to the applicable approved fee schedule or Enrolments for a current quote. If a historical amount is used as a worked example, identify it clearly as historical and explain that values may change.')
p('Summer subjects use the normal subject price, with full applicable fees paid upfront. An old pricing statement must not be used to imply a summer discount.')
h('Commonwealth Supported Places')
p('No new CSP places are available in 2026 or 2027, and this remains the ongoing position until the course advises a change. Existing CSP students may continue. An old email offering a place is not evidence of a current opening.')
p('When places are available, eligibility and priority criteria come first, followed by first-come allocation. This order does not imply that places are available now. The source guidance identifies under-represented groups as relevant to priority.')
h('HELP and payment arrangements')
p('The reference material distinguishes Commonwealth Supported Places and HECS-HELP from full-fee study and FEE-HELP. Availability of a place, eligibility for assistance, the applicable payment method and required forms must be established through the official enrolment process. Do not promise loan eligibility or a payment arrangement from a source example.')
h('Visa implications of course choices')
p('Credits, summer study, overloads, reduced loads, deferral and changes in completion date may affect a student\'s CoE or other arrangements. The course planner can explain the academic plan but cannot determine an individual\'s visa eligibility or post-study rights.')
p('Refer immigration and compliance questions to the International Office and the appropriate qualified adviser or official government information. In particular, do not promise a visa outcome based on a particular number of credits, a course duration, an internship or a historical rule copied into a document.')
source('Course-owner corrections; Email Scripts, CSP information, Summer payment, credit/visa cautions and contact guidance; shared rules, fees and study-load material.')

page('Student records support and communication')
h('Where to check records')
bullet('Use the Student Portal to check official subject enrolments, results and credits.')
bullet('For an official transcript or replacement qualification document, use the Student Hub or the applicable official request process. Historical fees and turnaround times are examples, not guaranteed current terms.')
bullet('Keep personal and contact details current through the official student administration process.')
bullet('Monitor the Melbourne Polytechnic student email account. It is a principal channel for enrolment and course communications.')
h('Where to ask for help')
table(['Issue', 'Starting point'], [
    ('Subject choices, course progression or missing enrolment actions', 'Bachelor of IT enrolment team: enrol_bit@melbournepolytechnic.edu.au'),
    ('General student enquiries, documents, campus services and referrals', 'Student Hub: 1300 635 276'),
    ('International admission, CoE or compliance questions', 'International Office: international@melbournepolytechnic.edu.au'),
    ('International payment questions', 'international-payments@melbournepolytechnic.edu.au'),
    ('Student Portal or student email login problems', 'studentloginhelp@melbournepolytechnic.edu.au'),
    ('Moodle login or access problems', 'moodlehelpdesk@melbournepolytechnic.edu.au')
], [3.1, 3.9])
p('These contacts are retained from the source documents. If a contact has changed, use the official Melbourne Polytechnic website or Student Hub to locate the current service.')
h('Student support')
p('The Student Hub can direct students to learning support, counselling, accommodation information, disability and equity services, scholarships, international-student support and other assistance. Request support early when personal circumstances or study difficulties may affect attendance or progress.')
h('Statements in email templates')
p('A template saying that selections have been entered, documents uploaded, payment received or approval given is not proof that the action occurred for this student. Confirm the actual action and record before using such a statement.')
source('Email Scripts, Student Hub, Who to contact for help, Technical problems, MP outlook email and transcript guidance.')

page('Points requiring confirmation and source guide')
h('Outstanding points')
table(['Point', 'What to tell the reader'], [
    ('English entry score', 'Unconfirmed. Refer the applicant to Admissions; do not give a definitive threshold.'),
    ('Late-enrolment cut-off', 'Confirm the applicable cut-off with Enrolments. Census and the deadline to add subjects are different milestones.'),
    ('Future offerings and class times', 'Use the published timetable for the target semester. Main-semester rotations are planning guidance; future summer subjects are unpublished.'),
    ('Individual approval or eligibility', 'Confirm credits, overloads, reduced loads, financial assistance and other approvals through the responsible team.')
], [2.4, 4.6])
h('How conflicting source advice is handled')
p('The course owner\'s corrections take priority. Otherwise, clear and applicable Email Scripts guidance is preferred over older source wording. Unresolved contradictions must be explained rather than silently resolved. Worked student cases are examples and must be recalculated for the student\'s actual history.')
h('Sources used')
bullet('Email Scripts, Summer Semester 2026 reference: explanations, student communications, enrolment processes and contacts.')
bullet('Rules for Enrolment officers and Students: shared credit, admissions, study-load and administration guidance, with officer-only duplicated procedures removed.')
bullet('Rules for Students only: public course and admission information, plus subject descriptions.')
bullet('Current Timetable Planner course configuration: subject names, prerequisites, corequisites, offerings, course requirements and dates.')
bullet('Course-owner corrections supplied during the rule review: summer price, CR range, CSP availability/priority, FMP advice, evidence handling and fee communication.')
p('Officer-only operating instructions are excluded from this handbook. The public references also omit test-environment instructions and local images or attachments. Historical government, immigration and financial material must not be treated as a current individual determination.')

# Subject reference: 31 entries, five or six per page. Keep each entry together.
subjects = [(code, meta) for code, meta in config['subjects'].items() if code.startswith('BIT')]
subjects.sort()
for start in range(0, 30, 5):
    page('Subject reference' if start == 0 else 'Subject reference continued')
    if start == 0:
        p('Prerequisites must be completed first. Corequisites may be completed earlier or concurrently. Categories follow the configured catalogue: BIT314 is core and BIT214 belongs to NS. Descriptions summarise the imported student reference.')
    for code, meta in subjects[start:(len(subjects) if start == 25 else start + 5)]:
        h(code + '  ' + meta['name'])
        doc.paragraphs[-1].paragraph_format.space_before = Pt(8)
        category = 'Core' if meta.get('core') else ' / '.join(meta.get('majorStreams', [])) + ' major stream'
        pre = ', '.join(meta.get('prerequisites', [])) or 'None'
        co = ', '.join(meta.get('corequisites', [])) or 'None'
        p(f'{category}\nPrerequisites: {pre}. Corequisites: {co}.')
        texts = [s['text'] for s in rules['sections'] if s['heading'].startswith(code + ' — ')]
        if texts:
            text = texts[0]
            # Keep a readable first sentence or two; complete rules are in the prerequisite line.
            sentences = text.split('. ')
            summary = sentences[0]
            if not summary.endswith('.'): summary += '.'
            p(summary)
        if meta.get('majorSubjectRequirement'):
            p('Also requires at least three completed major subjects, and five completed or concurrent major subjects when entering BIT371.')
        if code in config['subjectsRunning']['semester1Only']: p('Regular offering: Semester 1 only.')
        elif code in config['subjectsRunning']['semester2Only']: p('Regular offering: Semester 2 only.')
        if code == 'BIT213': p('Advice: students without introductory networking experience should normally finish BIT121 first.')
    source('Course configuration, Subjects and Subjects Running; Rules for Students only, Subject descriptions. Future summer availability must be confirmed.')

out = ROOT / 'outputs/documents/Enrolment and Study Planning Rules 8 November 2026.docx'
out.parent.mkdir(parents=True, exist_ok=True)
doc.save(out)
print(out)
