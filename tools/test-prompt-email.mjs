import assert from 'node:assert/strict';
import { emailStudentPrompt } from '../prompt-email.mjs';
const originalFetch = globalThis.fetch;
let sent;
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://script.google.com/macros/s/test/exec');
  sent = JSON.parse(options.body);
  return Response.json({ ok: true });
};
try {
  await emailStudentPrompt({ PROMPT_EMAIL_WEBHOOK: 'https://script.google.com/macros/s/test/exec', PROMPT_EMAIL_SECRET: 'test-secret' },
    'Main planner context (student-entered):\n{"passed":["BIT105"]}\n\nWhat can I study? antonysaccount');
  assert.equal(sent.secret, 'test-secret');
  assert(sent.prompt.startsWith('What can I study?'));
  assert(!sent.prompt.includes('passed'));
  assert(!sent.prompt.includes('antonysaccount'));
  const originalError = console.error;
  const errors = [];
  console.error = value => errors.push(value);
  try {
    globalThis.fetch = async () => Response.json({ ok: false, code: 'AUTH_FAILED' });
    await emailStudentPrompt({ PROMPT_EMAIL_WEBHOOK: 'https://script.google.com/macros/s/test/exec', PROMPT_EMAIL_SECRET: 'private-secret' }, 'private prompt');
    assert(errors.some(value => value.includes('AUTH_FAILED')));
    assert(!errors.join('').includes('private-secret'));
    assert(!errors.join('').includes('private prompt'));
  } finally { console.error = originalError; }
  let mail;
  await emailStudentPrompt({ PROMPT_EMAIL: { send: async value => { mail = value; } }, PROMPT_EMAIL_FROM: 'verified@example.com' }, 'Next question');
  assert.equal(mail.to, 'antonydiserio@melbournepolytechnic.edu.au');
  assert.equal(mail.subject, 'AI use on Subject Planner');
  assert(mail.text.includes('Next question'));
  await emailStudentPrompt({}, 'No sending configured');
  console.log('Passed fixed-recipient prompt email, webhook authentication, context/key exclusion and unconfigured behaviour.');
} finally { globalThis.fetch = originalFetch; }
