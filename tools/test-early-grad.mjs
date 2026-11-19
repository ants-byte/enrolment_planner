import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(source.slice(source.indexOf('  const calculateEarlyGradPlans ='), source.indexOf('\n  let earlyGradCache')) + '\nthis.calculate = calculateEarlyGradPlans;', context);
const config = JSON.parse(fs.readFileSync(new URL('../semester-config.json', import.meta.url), 'utf8'));
const majors = { ns: [], ba: [], sd: [] };
for (const [code, subject] of Object.entries(config.subjects)) {
  for (const stream of subject.majorStreams || []) majors[stream.toLowerCase()].push(code);
}
const input = {
  subjects: Object.fromEntries(Object.entries(config.subjects).filter(([code]) => /^BIT\d{3}$/.test(code)).map(([code, subject]) => [code, {
    prerequisites: subject.prerequisites || [], corequisites: subject.corequisites || [],
    availability: config.subjectsRunning.semester1Only.includes(code) ? 'S1' : config.subjectsRunning.semester2Only.includes(code) ? 'S2' : 'Any',
    currentSummer: !!config.timetable[code], slot: config.timetable[code]?.day,
    futureSummer: !config.summerSchool.notOfferedSubjects.includes(code) &&
      !(subject.majorStreams || []).some(stream => config.summerSchool.notOfferedMajorStreams.includes(stream)),
  }])),
  majors, major: 'ns', core: Object.keys(config.subjects).filter(code => config.subjects[code].core),
  completed: ['BIT105', 'BIT106', 'BIT108', 'BIT111', 'BIT112', 'BIT121'], current: [],
  start: { year: 2026, semester: 'SS' }, electiveLimit: 4, useCredits: 0, civilUsed: false,
  capstone: { start: 'BIT371', end: 'BIT372', minimumCompleted: 3, minimumConcurrent: 5 },
};
const check = (result, fixture) => {
  assert.ok(result.baseline, 'a baseline must be found');
  const baselineTotal = result.baseline.plan.reduce((sum, term) => sum + term.codes.length, 0);
  for (const plan of result.options) {
    const done = new Set(fixture.completed);
    const required = new Set([...fixture.core, ...fixture.majors[plan.major]]);
    let overloaded = 0;
    let civil = 0;
    assert.ok(plan.finish < result.baseline.finish);
    assert.equal(plan.plan.reduce((sum, term) => sum + term.codes.length, 0), baselineTotal);
    for (const term of plan.plan) {
      assert.ok(term.codes.length <= (term.semester === 'SS' ? 2 : 5));
      const after = new Set([...done, ...term.codes]);
      for (const code of term.codes) {
        assert.ok(!done.has(code), 'no subject may be counted twice');
        civil += Number(code === 'USE:CIVIL');
        if (code.startsWith('USE:')) continue;
        const subject = fixture.subjects[code];
        assert.ok(subject.prerequisites.every(pre => done.has(pre)), code + ' prerequisites');
        assert.ok(subject.corequisites.every(pre => after.has(pre)), code + ' corequisites');
        if (term.semester !== 'SS') assert.ok(subject.availability === 'Any' || subject.availability === term.semester);
      }
      if (term.codes.length === 5) { overloaded++; assert.equal(term.year, plan.plan.at(-1).year); }
      term.codes.forEach(code => done.add(code));
    }
    assert.ok(overloaded <= 1);
    assert.ok(civil <= (fixture.civilUsed ? 0 : 1));
    assert.equal(fixture.useCredits + [...done].filter(code => code.startsWith('USE:') || !required.has(code)).length, fixture.electiveLimit);
    assert.ok([...required].every(code => done.has(code)));
  }
};

const result = context.calculate(input);
check(result, input);
assert.equal(result.baseline.plan.at(-1).year, 2029);
assert.ok(result.options.some(plan => plan.mode === 'civil'), 'Civil USE should produce an earlier conditional example');
const used = { ...input, civilUsed: true };
const usedResult = context.calculate(used);
check(usedResult, used);
assert.ok(usedResult.options.every(plan => !plan.done.has('USE:CIVIL')));
const full = { ...input, useCredits: 4 };
const fullResult = context.calculate(full);
check(fullResult, full);
assert.ok(fullResult.options.every(plan => plan.external === 0), 'no USE route with full elective slots');
const current = { ...input, completed: [...input.completed, 'BIT230', 'BIT241', 'BIT242'], current: ['BIT314', 'BIT352'] };
const currentResult = context.calculate(current);
check(currentResult, current);
assert.ok(currentResult.options.every(plan => plan.plan[0].codes.length === 2 && !plan.plan[0].codes.includes('USE:CIVIL')), 'two current BIT subjects leave no third Summer place');
const limited = {
  ...input, core: ['A', 'B', 'C', 'D', 'E'], majors: { ns: [] }, completed: ['A'], useCredits: 3,
  start: { year: 2027, semester: 'S1' },
  subjects: Object.fromEntries(['A', 'B', 'C', 'D', 'E', 'F'].map(code => [code, {
    prerequisites: code === 'E' ? ['B'] : [], corequisites: [],
    availability: code === 'E' ? 'S1' : 'Any', futureSummer: code === 'E', currentSummer: false,
  }])),
};
const limitedResult = context.calculate(limited);
check(limitedResult, limited);
assert.ok(limitedResult.options.length > 0);
assert.ok(limitedResult.options.every(plan => plan.external === 0), 'necessary regular-semester electives consume the last USE slot');

const alertContext = vm.createContext({
  getEarlyGradAnalysis: () => result, isOptionalSummerSemester: () => true,
  formatLongSemesterIdentity: term => `${term.year} ${term.semester}`,
  getMajorNameFromKey: key => key, escapeHtml: value => String(value), summerSchoolLikelySubjectCodes: [],
});
result.input = input;
const evidenceContext = vm.createContext({ getEarlyGradAnalysis: () => result });
const evidenceStart = source.indexOf('  const getEarlyGradChatContext =');
const evidenceEnd = source.indexOf('  const getSummerSchoolOpportunityAlert =', evidenceStart);
vm.runInContext(source.slice(evidenceStart, evidenceEnd) + '\nthis.evidence = getEarlyGradChatContext;', evidenceContext);
const evidence = evidenceContext.evidence();
assert.equal(evidence.conditional, true);
assert.equal(evidence.remainingCount, 18);
assert.equal(evidence.completedCount, 6);
assert.equal(evidence.civilPreviouslyCredited, null, 'unknown provenance must not become a confirmed unused Civil credit');
assert.ok(evidence.examples.some(plan => plan.source === 'civil'));
assert.ok(evidence.examples.length <= 4);
const alertStart = source.indexOf('  const getSummerSchoolOpportunityAlert =');
const alertEnd = source.indexOf('  const getCapstoneEarlyCompletionCautionAlert =', alertStart);
vm.runInContext(source.slice(alertStart, alertEnd) + '\nthis.alert = getSummerSchoolOpportunityAlert;', alertContext);
const html = alertContext.alert().html;
const text = html.replace(/<[^>]+>/g, '');
assert.match(text, /BET207 Engineering Management 1/);
assert.match(text, /Bachelor of Engineering Technology \(Civil\) was the only MP school/);
assert.match(text, /Bachelor of Information Technology \(BIT\)/);
assert.match(html, /<strong>5<\/strong>/);
assert.match(html, /<strong>five-subject option<\/strong>/);
assert.match(html, /<strong>Summer<\/strong>/);
assert.match(html, /<strong>USE<\/strong>/);
assert.match(html, /<strong>BET207<\/strong>/);
assert.match(text, /18 subjects remain; 6 subjects are completed/);
assert.match(html, /you <strong>may<\/strong> have options/);
assert.doesNotMatch(text, /Total:/);
assert.match(html, /might recur.*might not/);
assert.match(html, /extraordinary circumstances/);
assert.match(html, /almost zero chance/);
const other = {
  ...result.options[0], mode: 'other', external: 1, major: input.major,
  plan: [{ year: 2027, semester: 'S2', index: 0, codes: ['BIT105'] },
    { year: 2027, semester: 'SS', index: 1, codes: ['USE:OTHER1'] }],
};
const singleSummer = {
  input: { ...input, civilUsed: true }, options: [other],
  baseline: { ...other, plan: [...other.plan, { year: 2028, semester: 'S1', index: 2, codes: ['BIT108'] }] },
};
alertContext.getEarlyGradAnalysis = () => singleSummer;
alertContext.isOptionalSummerSemester = () => false;
const bracket = alertContext.alert().html;
assert.match(bracket.replace(/<[^>]+>/g, ''), /replying to this email from enrol_bit asking which MP schools are running Summer/);
assert.ok(bracket.replace(/<[^>]+>/g, '').endsWith('Summer.)'), 'provider note must be last');
alertContext.isOptionalSummerSemester = () => true;
singleSummer.options.push({ ...other, mode: 'bit', external: 0 });
assert.doesNotMatch(alertContext.alert().html, /external provider/, 'current BIT opportunities suppress the provider note');
console.log('EarlyGrad checks passed: feasible sequences, equal totals, Civil once only, elective limits, overload year and Summer loads.');
