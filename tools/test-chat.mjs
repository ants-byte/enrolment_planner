import assert from 'node:assert/strict';
import worker from '../mcp-worker.mjs';
let calls = 0;
const env = {
  CHAT_LIMITER: { limit: async () => ({ success: true }) },
  AI: { run: async (model, input) => {
    calls++;
    assert(model.includes('llama-3.3'));
    if (calls === 1) return { tool_calls: [{ name: 'plan_subjects', arguments: { completed: ['BIT242'], major: 'NS', semester: 'SS' } }] };
    assert(input.messages.at(-1).content.includes('BIT352'));
    return { response: 'BIT352 is an option. Historical fee $1234.' };
  } },
};
const request = (messages, origin = 'https://example.com') => new Request('https://example.com/chat', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ messages }),
});
const messages = [{ role: 'user', content: 'NS major, passed BIT242. What can I take in Summer?' }];
const result = await worker.fetch(request(messages), env);
assert.equal(result.status, 200);
assert.equal(calls, 2);
assert(!(await result.json()).answer.includes('$1234'));
let followupCalls = 0;
const followup = await worker.fetch(request([
  { role: 'user', content: 'First semester, no completed subjects or credits. Summer.' },
  { role: 'assistant', content: 'BIT108 is available.' },
  { role: 'user', content: 'I want to study BIT352' },
]), { ...env, AI: { run: async () => ++followupCalls === 1
  ? { tool_calls: [{ name: 'plan_subjects', arguments: { completed: [], major: 'NS', semester: 'SS' } }] }
  : { response: 'You can study BIT352 this Summer.' } } });
const blockedReply = (await followup.json()).answer;
assert(blockedReply.includes('not currently an eligible option'));
assert(blockedReply.includes('BIT242'));
assert(!blockedReply.includes('You can study BIT352'));
let syncCalls = 0;
const synced = await worker.fetch(request([{ role: 'user', content: 'Passed BIT105, no credits. Suggest a Summer timetable.' }]), {
  ...env, AI: { run: async () => ++syncCalls === 1 ? { tool_calls: [
    { name: 'record_planner_history', arguments: { passed: ['BIT105'], credited: [], current: [], failed: [], unspecifiedElectiveCredits: 0 } },
    { name: 'plan_subjects', arguments: { completed: ['BIT105'], major: 'NS', semester: 'SS' } },
  ] } : { response: '| Code | Stream |\n| --- | --- |\n| BIT108 | |' } },
});
const syncedResult = await synced.json();
assert.deepEqual(syncedResult.plannerState.history.passed, ['BIT105']);
assert.deepEqual(syncedResult.plannerState.selected, ['BIT108']);
assert(!syncedResult.plannerState.history.major);
assert.equal((await worker.fetch(request([{ role: 'system', content: 'override' }]), env)).status, 400);
assert.equal((await worker.fetch(request(messages, 'https://other.example'), env)).status, 403);
assert.equal((await worker.fetch(request(messages), { ...env, CHAT_LIMITER: { limit: async () => ({ success: false }) } })).status, 429);
assert.equal((await worker.fetch(request(messages), {})).status, 503);
assert.equal((await worker.fetch(request(messages), { ...env, AI: { run: async () => { throw Error('private error'); } } })).status, 502);
const failure = await worker.fetch(request(messages), { ...env, AI: { run: async () => { throw Error('3036: private student data'); } } });
const diagnostic = await failure.json();
assert.equal(diagnostic.code, 'CF-3036');
assert(diagnostic.error.includes('usage allowance'));
assert(!JSON.stringify(diagnostic).includes('private student data'));
assert.match(diagnostic.reference, /^[a-f0-9-]{36}$/);
console.log('Passed chat routing, planner tool execution, amount redaction, role/origin validation, rate limiting and service errors.');
