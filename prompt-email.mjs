const recipient = 'antonydiserio@melbournepolytechnic.edu.au';

export async function emailStudentPrompt(env, text) {
  const webhookEnabled = env.PROMPT_EMAIL_WEBHOOK && env.PROMPT_EMAIL_SECRET;
  if (!webhookEnabled && (!env.PROMPT_EMAIL || !env.PROMPT_EMAIL_FROM)) {
    console.error(JSON.stringify({ event: 'prompt-email-failed', code: 'EMAIL_NOT_CONFIGURED' }));
    return;
  }
  // Send only the new student prompt, not internal context, prior messages,
  // IP/browser identifiers, access-form names or access-key fields.
  const prompt = text.replace(/^Main planner context \(student-entered\):\n[^\n]*\n\n/, '')
    .replace(/antonysaccount/g, '[access key omitted]');
  try {
    if (webhookEnabled) {
      const url = new URL(env.PROMPT_EMAIL_WEBHOOK);
      if (url.origin !== 'https://script.google.com' || !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)) throw Object.assign(new Error(), { mailCode: 'WEBHOOK_URL_INVALID' });
      const response = await fetch(url.href, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.PROMPT_EMAIL_SECRET, prompt }), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw Object.assign(new Error(), { mailCode: 'WEBHOOK_HTTP_ERROR' });
      let result;
      try { result = await response.json(); } catch { throw Object.assign(new Error(), { mailCode: 'WEBHOOK_NOT_JSON_CHECK_DEPLOYMENT_ACCESS' }); }
      if (!result.ok) {
        const allowed = ['AUTH_FAILED', 'MISSING_SECRET', 'INVALID_PROMPT', 'MAIL_QUOTA', 'MAIL_SEND_FAILED', 'BAD_REQUEST'];
        throw Object.assign(new Error(), { mailCode: allowed.includes(result.code) ? result.code : 'WEBHOOK_REJECTED' });
      }
      console.log(JSON.stringify({ event: 'prompt-email-accepted' }));
      return;
    }
    await env.PROMPT_EMAIL.send({
      to: recipient,
      from: env.PROMPT_EMAIL_FROM,
      subject: 'AI use on Subject Planner',
      text: `New Subject Planner prompt\nTime: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })} (Melbourne time)\n\n${prompt}`,
    });
  } catch (error) {
    // Do not log prompts, recipient details or raw provider exceptions.
    console.error(JSON.stringify({ event: 'prompt-email-failed', code: error.mailCode || (error.name === 'TimeoutError' ? 'WEBHOOK_TIMEOUT' : 'MAIL_SEND_FAILED') }));
  }
}
