const RETENTION = 90 * 24 * 60 * 60 * 1000;
const normalLimit = env => Math.max(1000, Number(env.CHAT_TOKEN_ALLOWANCE) || 62500);
const json = body => Response.json(body);

// Private Durable Object binding only. No public usage/name lookup endpoint.
export class ChatUsage {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch(request) {
    if (new URL(request.url).pathname.startsWith('/global')) return this.state.blockConcurrencyWhile(() => this.global(request));
    return this.state.blockConcurrencyWhile(async () => {
      const now = Date.now();
      let record = await this.state.storage.get('usage');
      if (record && record.expiresAt <= now) { await this.state.storage.deleteAll(); record = null; }
      record ||= { expiresAt: now + RETENTION, input: 0, output: 0, total: 0, grants: 0, names: [], blockedUntil: 0 };
      const action = new URL(request.url).pathname;
      const data = await request.json();
      if (action.startsWith('/ip')) record.isIp = true;
      if (record.isIp && /^[a-f0-9-]{36}$/i.test(data.browserId || '')) {
        record.browsers ||= {};
        if (record.browsers[data.browserId] || Object.keys(record.browsers).length < 2000) {
          record.browsers[data.browserId] = { exhausted: !!(record.browsers[data.browserId]?.exhausted || data.exhausted) };
        } else record.browserCountCapped = true;
      }
      const allowance = () => Math.floor(normalLimit(this.env) * (record.isIp ? 200 : 1) * (record.grants >= 1 ? 1.5 : 1));
      const status = () => ({ total: record.total, allowance: allowance(), grants: record.grants,
        restricted: record.total >= allowance(), blockedUntil: record.blockedUntil, scope: record.isIp ? 'network' : 'browser',
        ...(record.isIp ? {
          browserCount: Object.keys(record.browsers || {}).length,
          exhaustedBrowserCount: Object.values(record.browsers || {}).filter(item => item.exhausted).length,
          sharedConnection: Object.keys(record.browsers || {}).length >= 3,
          heavySharedUsage: Object.values(record.browsers || {}).filter(item => item.exhausted).length >= 10,
          browserCountCapped: !!record.browserCountCapped,
        } : {}) });
      let result;
      if (action === '/start') {
        if (record.blockedUntil > now) result = { allowed: false, ...status() };
        else if (record.total >= allowance()) result = { allowed: false, ...status() };
        else if (record.leaseUntil > now) result = { allowed: false, busy: true };
        else { record.lease = crypto.randomUUID(); record.leaseUntil = now + 120000; result = { allowed: true, lease: record.lease }; }
      } else if (action === '/finish') {
        if (record.lease !== data.lease) return json({ error: 'Invalid usage lease' });
        const input = Math.max(0, Math.floor(Number(data.input) || 0));
        const output = Math.max(0, Math.floor(Number(data.output) || 0));
        record.input += input; record.output += output; record.total += input + output;
        delete record.lease; delete record.leaseUntil;
        if (record.grants >= 1 && record.total >= allowance()) {
          // Erase previous usage/name data; retain only the 90-day block marker.
          record = { expiresAt: now + RETENTION, blockedUntil: now + RETENTION, input: 0, output: 0, total: 0, grants: 1, names: [], isIp: record.isIp };
        }
        result = status();
      } else if (action === '/unlock' || action === '/ipunlock') {
        if (record.blockedUntil > now) result = { allowed: false, ...status() };
        else if (record.total < allowance()) result = { allowed: false, notRestricted: true };
        else if (record.grants >= 1) result = { allowed: false, ...status() };
        else {
          record.unlockAttempts = (record.unlockAttempts || []).filter(time => now - time < 3600000);
          if (record.unlockAttempts.length >= 5) result = { allowed: false, attemptsLimited: true };
          else {
            record.unlockAttempts.push(now);
            if (data.key !== 'antonysaccount' || typeof data.name !== 'string' || !data.name.trim() || data.name.length > 120) result = { allowed: false, invalid: true };
            else {
              record.names.push({ name: data.name.trim(), at: now });
              record.grants++; record.unlockAttempts = [];
              result = { allowed: true, extraPercent: 50, ...status() };
            }
          }
        }
      } else if (action === '/ip') {
        record.input += Math.max(0, Number(data.input) || 0);
        record.output += Math.max(0, Number(data.output) || 0);
        record.total = record.input + record.output;
        if (record.grants >= 1 && record.total >= allowance()) {
          record = { expiresAt: now + RETENTION, blockedUntil: now + RETENTION, input: 0, output: 0, total: 0, grants: 1, names: [], isIp: true };
        }
        result = { recorded: true };
      } else if (action === '/status' || action === '/ipstatus') {
        result = status();
      } else return new Response(null, { status: 404 });
      await this.state.storage.put('usage', record);
      await this.state.storage.setAlarm(record.expiresAt);
      return json(result);
    });
  }
  async global(request) {
    const now = Date.now();
    const data = await request.json();
    const action = new URL(request.url).pathname;
    const record = await this.state.storage.get('global') || { input: 0, output: 0, total: 0, stopped: false, reservations: {} };
    const cap = Math.max(1, Number(this.env.CHAT_TOTAL_TOKEN_CAP) || 3000000);
    const end = Date.parse(this.env.CHAT_EXPERIMENT_END || '');
    // An unset date fails closed, without permanently stopping a not-yet-configured pilot.
    if (!Number.isFinite(end)) return json({ allowed: false, notConfigured: true });
    if (now >= end) { record.stopped = true; record.reason = 'semester-ended'; }
    for (const [id, reservation] of Object.entries(record.reservations)) {
      if (reservation.expiresAt <= now) {
        // No completion record: retain its full conservative reservation as usage.
        record.input += reservation.input; record.output += reservation.output;
        record.total += reservation.input + reservation.output;
        delete record.reservations[id];
      }
    }
    let result;
    if (action === '/global-finish') {
      const reservation = record.reservations[data.id];
      if (!reservation) return json({ error: 'Invalid global reservation' });
      delete record.reservations[data.id];
      const input = Math.max(0, Math.floor(Number(data.input) || 0));
      const output = Math.max(0, Math.floor(Number(data.output) || 0));
      record.input += input; record.output += output; record.total += input + output;
      result = { recorded: true };
    } else if (action === '/global-reserve') {
      const input = Math.max(0, Math.ceil(Number(data.input) || 0));
      const output = Math.max(0, Math.ceil(Number(data.output) || 0));
      const held = Object.values(record.reservations).reduce((sum, item) => sum + item.input + item.output, 0);
      if (record.total + input + output > cap) { record.stopped = true; record.reason = 'token-cap'; }
      if (record.stopped) result = { allowed: false, stopped: true, reason: record.reason };
      else if (record.total + held + input + output > cap) result = { allowed: false, busy: true };
      else {
        const id = crypto.randomUUID();
        record.reservations[id] = { input, output, expiresAt: now + 120000 };
        result = { allowed: true, id };
      }
    } else if (action === '/global-status') result = { allowed: !record.stopped, stopped: record.stopped, reason: record.reason };
    else return new Response(null, { status: 404 });
    if (record.total >= cap) { record.stopped = true; record.reason ||= 'token-cap'; }
    await this.state.storage.put('global', record);
    return json(result);
  }
  async alarm() {
    // Global aggregate counters and the permanent stop marker must never expire.
    if (!await this.state.storage.get('global')) await this.state.storage.deleteAll();
  }
}

export async function usageRequest(env, browserId, action, data = {}) {
  if (!env.CHAT_USAGE) throw new Error('Usage storage not configured');
  const stub = env.CHAT_USAGE.get(env.CHAT_USAGE.idFromName(browserId));
  const response = await stub.fetch(`https://usage.internal/${action}`, { method: 'POST', body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error('Usage storage unavailable');
  return result;
}

export function restrictionMessage(status) {
  const who = status.scope === 'network' ? 'This network' : 'This browser';
  if (status.busy) return { userMessage: 'Another question is already running in this browser. Please wait for it to finish.', code: 'USAGE-BUSY' };
  if (status.blockedUntil) return { userMessage: `${who} has used its normal allowance and its one extra allowance. AI access is blocked for 90 days. You can still use the main timetable planner.`, code: 'USAGE-BLOCKED', blockedUntil: status.blockedUntil };
  return { userMessage: `${who} has reached its AI token allowance. To request extra usage, enter your name and the access key below. Your name is stored for usage records, not checked as proof of identity.`, code: 'USAGE-RESTRICTED', unlockRequired: true };
}
