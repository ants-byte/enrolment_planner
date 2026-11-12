import assert from 'node:assert/strict';
import { ChatUsage } from '../chat-usage.mjs';
const actualNow = Date.now;
let now = 1000000000;
Date.now = () => now;
const values = new Map();
let alarmAt;
const state = { blockConcurrencyWhile: fn => fn(), storage: {
  get: async key => structuredClone(values.get(key)), put: async (key, value) => values.set(key, structuredClone(value)),
  deleteAll: async () => values.clear(), setAlarm: async time => { alarmAt = time; },
} };
const config = { CHAT_TOKEN_ALLOWANCE: '1000', CHAT_TOTAL_TOKEN_CAP: '1000', CHAT_EXPERIMENT_END: '2099-01-01T00:00:00Z' };
const ledger = new ChatUsage(state, config);
const call = async (path, data = {}) => (await ledger.fetch(new Request(`https://internal/${path}`, { method: 'POST', body: JSON.stringify(data) }))).json();
const consume = async tokens => {
  const permit = await call('start'); assert(permit.allowed);
  assert((await call('start')).busy);
  return call('finish', { lease: permit.lease, input: tokens - 10, output: 10 });
};
try {
  await consume(1000);
  assert((await call('start')).restricted);
  assert((await call('unlock', { name: 'Any Name', key: 'incorrect' })).invalid);
  assert.equal((await call('unlock', { name: 'Any Name', key: 'antonysaccount' })).extraPercent, 50);
  assert.equal(values.get('usage').names[0].name, 'Any Name');
  assert(!JSON.stringify(values.get('usage')).includes('antonysaccount'));
  const final = await consume(500);
  assert(final.blockedUntil > now);
  assert.equal(values.get('usage').names.length, 0);
  assert(!(await call('unlock', { name: 'Any', key: 'antonysaccount' })).allowed);
  assert.equal((await call('scope', { classification: 'BLOCK' })).offTopicCount, 1);
  assert.equal((await call('scope', { classification: 'ALLOW' })).offTopicCount, 0);
  await call('scope', { classification: 'BLOCK' });
  assert.equal((await call('scope', { classification: 'BLOCK' })).blockReason, 'off-topic');
  assert(!(await call('start')).allowed);
  config.CHAT_OWNER_KEY = 'test-owner-key-at-least-32-characters';
  assert((await call('unlock', { name: 'Owner', key: config.CHAT_OWNER_KEY })).owner);
  assert.equal((await call('scope', { classification: 'BLOCK' })).offTopicCount, 0);
  assert.equal((await call('scope', { classification: 'BLOCK' })).blockedUntil, 0);
  const ownerPermit = await call('start');
  assert(ownerPermit.allowed);
  await call('finish', { lease: ownerPermit.lease, input: 10000, output: 10000 });
  assert.equal((await call('status')).blockedUntil, 0);
  assert((await call('status')).owner);
  now = alarmAt + 1;
  assert.equal((await call('status')).total, 0);
  assert.equal((await call('status')).grants, 0);
  await ledger.alarm(); assert.equal(values.size, 0);
  await call('ip', { input: 199999, output: 1 });
  assert((await call('ipstatus')).restricted);
  const ipGrant = await call('ipunlock', { name: 'Network User', key: 'antonysaccount' });
  assert.equal(ipGrant.allowance, 300000);
  await ledger.alarm();
  for (let i = 0; i < 5; i++) {
    await call('ip', { input: i === 0 ? 200000 : 0, output: 0 });
    assert((await call('ipunlock', { name: 'Name', key: 'wrong' })).invalid);
  }
  assert((await call('ipunlock', { name: 'Name', key: 'antonysaccount' })).attemptsLimited);
  await ledger.alarm();
  const browserIds = Array.from({ length: 10 }, () => crypto.randomUUID());
  for (const browserId of browserIds) await call('ip', { browserId, exhausted: true, input: 1, output: 0 });
  await call('ip', { browserId: browserIds[0], exhausted: true, input: 1, output: 0 });
  const shared = await call('ipstatus');
  assert.equal(shared.browserCount, 10);
  assert.equal(shared.exhaustedBrowserCount, 10);
  assert(shared.sharedConnection && shared.heavySharedUsage);
  assert(!shared.restricted);
  await ledger.alarm();
  const reserved = await call('global-reserve', { input: 600, output: 100 });
  assert(reserved.allowed);
  assert((await call('global-reserve', { input: 300, output: 100 })).busy);
  await call('global-finish', { id: reserved.id, input: 600, output: 100 });
  assert.equal(values.get('global').total, 700);
  const stopped = await call('global-reserve', { input: 300, output: 100 });
  assert(stopped.stopped);
  config.CHAT_TOTAL_TOKEN_CAP = '999999';
  assert((await call('global-status')).stopped);
  await ledger.alarm();
  assert(values.get('global').stopped);
  values.clear();
  config.CHAT_EXPERIMENT_END = new Date(now - 1).toISOString();
  assert.equal((await call('global-status')).reason, 'semester-ended');
  config.CHAT_EXPERIMENT_END = '2099-01-01T00:00:00Z';
  assert((await call('global-reserve', { input: 1, output: 1 })).stopped);
  values.clear();
  config.CHAT_EXPERIMENT_END = '';
  assert((await call('global-status')).notConfigured);
  console.log('Passed token accounting, single extra grant, expiry/block, IP limits, concurrent global reservations, permanent cutoff and census shutdown.');
} finally { Date.now = actualNow; }
