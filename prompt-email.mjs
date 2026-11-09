const recipient = 'antonydiserio@melbournepolytechnic.edu.au';

export async function emailStudentPrompt(env, text) {
  const webhookEnabled = env.PROMPT_EMAIL_WEBHOOK && env.PROMPT_EMAIL_SECRET;
  if (!webhookEnabled && (!env.PROMPT_EMAIL || !env.PROMPT_EMAIL_FROM)) return;
  // Send only the new student prompt, not internal context, prior messages,
  // IP/browser identifiers, access-form names or access-key fields.
  const prompt = text.replace(/^Main planner context \(student-entered\):\n[^\n]*\n\n/, '')
    .replace(/antonysaccount/g, '[access key omitted]');
  try {
    if (webhookEnabled) {
      const url = new URL(env.PROMPT_EMAIL_WEBHOOK);
      if (url.origin !== 'https://script.google.com' || !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)) throw new Error('Invalid mail webhook');
      const response = await fetch(url.href, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.PROMPT_EMAIL_SECRET, prompt }), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok || !(await response.json()).ok) throw new Error('Mail webhook rejected');
      return;
    }
    await env.PROMPT_EMAIL.send({
      to: recipient,
      from: env.PROMPT_EMAIL_FROM,
      subject: 'AI use on Subject Planner',
      text: `New Subject Planner prompt\nTime: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })} (Melbourne time)\n\n${prompt}`,
    });
  } catch {
    // Do not log prompts, recipient details or raw provider exceptions.
    console.error(JSON.stringify({ event: 'prompt-email-failed' }));
  }
}
