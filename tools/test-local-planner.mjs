import assert from 'node:assert/strict';
import { createLocalServer, academicOnly, currentPlanning } from './local-planner-server.mjs';
const common = currentPlanning(academicOnly({ major: 'undecided' }));
assert(common.eligibleOptions.every(option => option.category === 'core'));
const provisional = currentPlanning(academicOnly({ major: 'SD', current: ['BIT111'], currentTreatedAsPassed: ['BIT111', 'BIT242'] }));
assert.deepEqual(provisional.provisionalCurrentPasses, ['BIT111']);
assert.deepEqual(academicOnly({ name: 'Private Name', studentId: '123', email: 'private@example.com', passed: ['BIT108', 'Private Name'], major: 'SD' }).passed, ['BIT108']);
assert(!JSON.stringify(academicOnly({ name: 'Private Name', studentId: '123' })).includes('Private'));
const alerts = academicOnly({ studentKey: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', alerts: { error: [{ title: 'Prerequisites', details: 'BIT111 is required.', ignored: true }] } });
assert.equal(alerts.studentKey, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
assert.deepEqual(alerts.alerts, { error: [{ title: 'Prerequisites', details: 'BIT111 is required.' }], warning: [], info: [] });
assert.deepEqual(academicOnly({}).alerts, { error: [], warning: [], info: [] });
const mcpPort = 18787;
const plannerPort = 15501;
const { mcp, planner } = createLocalServer({ mcpPort, plannerPort });
const servers = [[mcp, mcpPort], [planner, plannerPort]];
await Promise.all(servers.map(([server, port]) => new Promise((resolve, reject) =>
  server.once('error', reject).listen(port, '127.0.0.1', resolve))));
const base = 'http://127.0.0.1:' + mcpPort;
const origin = 'http://127.0.0.1:' + plannerPort;
const accessCode = 'a'.repeat(32);
const session = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
let id = 0;
const rpcBody = (method, params) => ({
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }),
});
const rpc = async (method, params) => (await fetch(base + '/mcp', rpcBody(method, params))).json();
const call = async (name, args = { accessCode }) => (await rpc('tools/call', { name, arguments: args })).result;
const student = {
  id: '0123456', name: 'Synthetic Student', email: 'private@example.com', dateOfBirth: '2000-01-01',
  results: [
    { code: 'BIT108', result: 'N', date: '2025 Sem 1', notes: 'private' },
    { code: 'BIT108', result: 'CR', date: '2025-11-15' },
    { code: 'BIT111', result: 'W', date: '2026 Sem 1' },
    { code: 'USE101', result: 'CRT', date: '2026' },
  ],
  currentEnrolments: [{ code: 'BIT105', result: 'H' }],
};
const context = { passed: ['BIT108'], major: 'SD', name: student.name, studentId: student.id };
try {
  const html = await (await fetch(origin)).text();
  const token = html.match(/data-token="([a-f0-9]{64})"/)[1];
  assert(html.includes('window.localPlannerBridge = true'));
  assert.equal((await fetch(origin + '/local-planner-browser.js')).status, 200);
  assert.equal((await fetch(origin + '/tools/local-planner-server.mjs')).status, 404);
  assert.equal((await fetch(origin + '/Enrolment%20Officer%20LLM%20Reference.md')).status, 404);
  assert.equal((await fetch(base)).status, 404);
  assert.equal((await fetch(origin + '/mcp', rpcBody('tools/list'))).status, 403);
  const publish = (body, headers = {}, target = origin) => fetch(target + '/local-context', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Local-Planner-Token': token, Origin: origin, ...headers },
    body: JSON.stringify({ session, accessCode, context, student, ...body }),
  });
  assert.equal((await publish({}, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await publish({}, { 'X-Local-Planner-Token': 'wrong' })).status, 403);
  assert.equal((await publish({}, {}, base)).status, 403);
  const discovery = await rpc('tools/list');
  assert.deepEqual(discovery.result.tools.map(tool => tool.name), [
    'plan_subjects', 'get_course_information', 'search_enrolment_rules', 'search_email_scripts',
    'get_current_student_plan', 'search_officer_enrolment_guidance', 'get_selected_student', 'get_student_history',
  ]);
  assert((await call('get_student_history')).isError);
  assert.equal((await publish({ student: null })).status, 200);
  assert((await call('get_selected_student')).isError);
  assert.equal((await publish({ context: null })).status, 200);
  assert.equal((await publish({})).status, 200);
  assert((await call('get_student_history', {})).isError);
  assert((await call('get_selected_student', { accessCode: 'b'.repeat(32) })).isError);
  assert((await call('get_student_history', { accessCode, studentId: student.id })).isError);
  assert((await call('get_current_student_plan', {})).isError);
  assert.equal((await publish({ session: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' })).status, 409);

  const selected = JSON.parse((await call('get_selected_student')).content[0].text);
  assert.deepEqual(selected.student, { id: student.id, name: student.name });
  assert.equal(selected.results, undefined);
  const history = JSON.parse((await call('get_student_history')).content[0].text);
  assert.deepEqual(history.results, student.results.map(({ code, result, date }) => ({ code, result, date })));
  assert.deepEqual(history.currentEnrolments, [{ code: 'BIT105', result: 'H', date: null }]);
  assert(!JSON.stringify(history).includes('private'));
  assert(!JSON.stringify(history).includes(accessCode));
  const academic = JSON.parse((await call('get_current_student_plan')).content[0].text).academicPlan;
  assert.deepEqual(academic.passed, ['BIT108']);
  assert(!JSON.stringify(academic).includes(student.name));
  assert(!(await call('plan_subjects', { completed: [], major: 'SD' })).isError);

  assert.equal((await publish({ student: { ...student, id: '0123457' } })).status, 409);
  assert((await call('get_student_history')).isError);
  assert.equal((await publish({ accessCode: 'c'.repeat(32) })).status, 200);
  assert((await call('get_student_history')).isError);
  assert.equal((await publish({ context: null })).status, 200);
  assert((await call('get_student_history', { accessCode: 'c'.repeat(32) })).isError);
  assert.equal((await publish({})).status, 200);
  await new Promise(resolve => setTimeout(resolve, 10100));
  assert((await call('get_student_history')).isError);
  console.log('Passed local MCP discovery, student results and repeated attempts, access-code checks, tab isolation, revocation, expiry and existing planning tools.');
} finally {
  await Promise.all(servers.map(([server]) => new Promise(resolve => server.close(resolve))));
}
