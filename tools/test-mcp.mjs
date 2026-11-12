import assert from 'node:assert/strict';
import worker, { planSubjects } from '../mcp-worker.mjs';
import { getCourseInformation, searchEmailScripts, searchEnrolmentRules } from '../mcp-information.mjs';
import rules from '../enrolment-rules-reference.json' with { type: 'json' };

const call = async (method, params) => {
  const response = await worker.fetch(new Request('https://example.com/mcp', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  }), {});
  assert.equal(response.status, 200);
  return response.json();
};

assert.equal((await call('initialize', { protocolVersion: '2025-03-26' })).result.serverInfo.version, '1.2.0');
assert.deepEqual((await call('tools/list')).result.tools.map(tool => tool.name),
  ['plan_subjects', 'get_course_information', 'search_enrolment_rules', 'search_email_scripts']);

// User's summer scenario: a credit for BIT242 does not grant its prerequisites.
const plan = planSubjects({ completed: ['BIT242'], major: 'NS', semester: 'SS' });
assert.deepEqual(plan.eligibleOptions.map(subject => subject.code).sort(), ['BIT108', 'BIT352']);
assert.equal(plan.semesterStudyLoad.maximumSubjects, 2);
assert.equal(plan.progress.remainingSubjects, 23);
assert.equal(plan.progress.standardLoadSemesterLowerBound, 6);
const fullElectives = planSubjects({ completed: ['BIT213', 'BIT233'], major: 'SD', semester: 'S1', unspecifiedElectiveCredits: 4 });
assert.equal(fullElectives.progress.excessElectiveSubjects, 2);
assert.equal(fullElectives.progress.completedSubjectsCountingTowardAward, 4);
assert.equal(fullElectives.progress.remainingSubjects, 20);
assert.equal(fullElectives.electiveOptions.length, 0);
assert(fullElectives.planningWarnings.some(warning => warning.code === 'excess-electives'));
const useHistory = planSubjects({ completed: ['BIT106', 'BIT111', 'BIT230', 'BIT231', 'BIT245', 'USE101', 'USE102', 'USE201', 'BIT105', 'BIT112', 'BIT121', 'BIT235'], major: 'SD', proposed: ['BIT108', 'BIT352'] });
assert.equal(useHistory.unspecifiedElectiveCredits, 3);
assert(!useHistory.completed.some(code => code.startsWith('USE')));
assert.equal(useHistory.selectionImpact.projectedElectiveSubjects, 3);
assert.equal(useHistory.capstoneProgress.length, 2);
assert.deepEqual(useHistory.blockedOptions.find(subject => subject.code === 'BIT352').missingPrerequisites, ['BIT242']);
const extraElective = planSubjects({ completed: ['USE101', 'USE102', 'USE201', 'USE301'], major: 'SD', proposed: ['BIT213'] });
assert.equal(extraElective.selectionImpact.minimumTotalSubjectsIncludingProjectedExcess, 25);
assert(extraElective.majorComparisons.some(item => item.major === 'NS' && item.projectedExcessElectiveSubjects === 0));
assert(searchEnrolmentRules({ query: 'Moodle Student Portal Nandini' }).results.some(section => section.text.includes('NandiniBiskunda@')));
assert(searchEnrolmentRules({ query: 'SFIA' }).results.some(section => section.id.startsWith('guidance-')));
const alternating = planSubjects({ completed: ['BIT230', 'BIT236'], major: 'BA', semester: 'S1' });
assert.deepEqual(alternating.planningWarnings.find(warning => warning.code === 'alternating-major-subjects').subjects.sort(), ['BIT355', 'BIT357']);
assert(!plan.planningWarnings.some(warning => warning.code === 'alternating-major-subjects'));
assert.deepEqual(plan.eligibleOptions.find(subject => subject.code === 'BIT352').prerequisites, ['BIT242']);
assert.deepEqual(plan.eligibleOptions.find(subject => subject.code === 'BIT108').prerequisites, []);
assert(plan.remainingCore.some(subject => subject.code === 'BIT230'));
assert.equal(plan.eligibleOptions.find(subject => subject.code === 'BIT352').configuredSemesterTimetable.day, 'Thursday');
const info = getCourseInformation({ codes: ['bit352', 'BIT108'] });
assert.deepEqual(info.subjects[0].prerequisites, ['BIT242']);
assert.equal(info.subjects[1].core, true);
const classifications = getCourseInformation({ codes: ['BIT314', 'BIT214'] });
assert.equal(classifications.subjects[0].core, true);
assert.equal(classifications.subjects[1].core, false);
assert.deepEqual(classifications.subjects[1].majorStreams, ['NS']);
assert(!JSON.stringify(info).includes('_instructions'));
assert(info.subjects[0].descriptionReference[0].text.includes('subject'));
assert.throws(() => getCourseInformation({ codes: ['BAD'] }), /Unknown subject/);

const catalogue = searchEmailScripts();
assert(catalogue.sections.length > 100);
const summer = searchEmailScripts({ query: 'summer semester', limit: 8 });
assert(summer.results.some(section => section.heading === 'Summer Semester Explained'));
const historical = summer.results.find(section => section.heading === 'Summer Semester is only a possibility');
assert(historical.reviewNotes.some(note => note.includes('conflicting summer')));
assert.deepEqual(searchEmailScripts({ sectionId: historical.id }).results[0], historical);
const contact = searchEmailScripts({ query: 'Student Hub' });
assert(contact.results.some(section => section.links.some(link => link.includes('student-hub'))));
assert(!JSON.stringify(contact).includes('safelinks.protection.outlook.com'));
assert.equal(searchEmailScripts({ query: 'zzzznothingmatches' }).results.length, 0);
assert.throws(() => searchEmailScripts({ limit: 50 }), /1–8/);
assert.throws(() => searchEmailScripts({ sectionId: 'unknown' }), /Unknown sectionId/);

const publicDocuments = ['Rules for Enrolment officers and Students.docx', 'Rules for Students only.docx'];
assert(rules.sections.every(section => section.audience === 'students' && publicDocuments.includes(section.document)));
assert(rules.sources.every(source => publicDocuments.includes(source.document)));
assert.equal(rules.decisions.length, 12);
assert.equal(rules.sections.filter(section => section.headingPath[0] === 'Subject descriptions').length, 31);
const payment = rules.sections.find(section => section.appliedDecisions.includes('summer-payment'));
assert(payment.text.includes('full applicable fees'));
assert(!payment.text.includes('half the normal cost'));
assert(rules.sections.some(section => section.appliedDecisions.includes('fmp-major') && section.text.includes('Suggest Network Security')));
assert(rules.decisions.find(decision => decision.id === 'overload-grade').status === 'owner-confirmed');
assert.equal(info.planningGuidance.earlyCompletion.minimumGrade.minimumPercent, 70);
assert.equal(info.planningGuidance.earlyCompletion.minimumGrade.maximumPercent, 79);
assert(!Object.keys(info.semesterDetails).some(key => key.startsWith('price_')));
assert(!Object.keys(plan.configuredSemester).some(key => key.startsWith('price_')));
for (const search of [searchEmailScripts, searchEnrolmentRules]) {
  const csp = search({ sectionId: 'email-33f9a2356a35' });
  assert(csp.results[0].text.includes('No new CSP places are available in 2026 or 2027'));
  assert(!csp.results[0].text.includes('We have a CSP place on offer'));
  assert(csp.results[0].text.includes('criteria come first, followed by first-come'));
  const fees = search({ sectionId: 'email-aad08514d84e' });
  assert(fees.feePolicy.includes('Fees may change each semester'));
}
for (const section of searchEmailScripts().sections) {
  const text = searchEmailScripts({ sectionId: section.id }).results[0].text;
  for (const match of text.matchAll(/\$\s*[\d,]+(?:\.\d+)?/g)) {
    assert.fail('Public references must omit dollar amounts');
  }
}
const ruleResult = searchEnrolmentRules({ sectionId: payment.id });
for (const id of ['rule-df3477b94341', 'rule-323b41afb157']) {
  const section = searchEnrolmentRules({ sectionId: id }).results[0];
  assert(!section.text.includes('can be taken concurrently or together'));
  assert(section.text.includes('BIT372 follows BIT371'));
}
assert(getCourseInformation({ codes: ['BIT371'] }).subjects[0].descriptionReference[0].text.includes('BIT372 follows BIT371'));
for (const { id } of searchEnrolmentRules().sections) {
  const section = searchEnrolmentRules({ sectionId: id }).results[0];
  assert(!/\$\s*[\d,]+/.test(JSON.stringify(section)));
}
assert.equal(ruleResult.results[0].document, publicDocuments[0]);
assert(ruleResult.results[0].paragraphStart > 0);
assert(searchEnrolmentRules({ query: 'summer fees' }).decisions.some(decision => decision.id === 'summer-payment'));
assert(searchEnrolmentRules().sections.some(section => section.id.startsWith('email-')));
assert(searchEnrolmentRules().sections.some(section => section.id.startsWith('rule-')));
assert.throws(() => searchEnrolmentRules({ audience: 'officer' }), /optional query/);
assert.throws(() => searchEnrolmentRules({ role: 'officer' }), /optional query/);
assert.throws(() => searchEnrolmentRules({ sectionId: 'officer-only' }), /Unknown sectionId/);
const serializedPublic = JSON.stringify(searchEnrolmentRules());
for (const privateText of ['Rules for Enrolment officers only.docx', 'Reset Officer Declaration', 'StrataTest', 'melbournepolytechnic.studiomoso.com.au']) {
  assert(!serializedPublic.includes(privateText));
  assert(!JSON.stringify(rules).includes(privateText));
}

for (const [name, args] of [
  ['plan_subjects', { completed: ['BIT242'], major: 'NS', semester: 'SS' }],
  ['get_course_information', { codes: ['BIT352'] }],
  ['search_email_scripts', { query: 'summer semester' }],
  ['search_enrolment_rules', { query: 'credit transfer' }],
]) {
  const result = (await call('tools/call', { name, arguments: args })).result;
  assert(!result.isError);
  assert(JSON.parse(result.content[0].text));
}
assert((await call('tools/call', { name: 'get_course_information', arguments: { codes: ['BAD'] } })).result.isError);
assert((await call('tools/call', { name: 'search_enrolment_rules', arguments: { role: 'officer' } })).result.isError);
console.log('Passed MCP discovery, all four tools, prerequisites, merged references, precedence, citations and student-only access.');
