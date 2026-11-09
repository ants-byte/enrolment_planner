// Paste into a Google Apps Script project owned by adiserio@gmail.com.
// Run initialisePromptEmail once, then deploy as a web app: execute as Me,
// access Anyone. Authentication is the private Script Property below.
function initialisePromptEmail() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('PROMPT_EMAIL_SECRET')) {
    properties.setProperty('PROMPT_EMAIL_SECRET', Utilities.getUuid() + Utilities.getUuid());
  }
  // Request only the sending permission, not access to read the mailbox.
  MailApp.getRemainingDailyQuota();
}

function doPost(event) {
  const reply = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  try {
    if (!event.postData || event.postData.contents.length > 16000) return reply({ ok: false });
    const data = JSON.parse(event.postData.contents);
    const expected = PropertiesService.getScriptProperties().getProperty('PROMPT_EMAIL_SECRET');
    if (!expected || data.secret !== expected || typeof data.prompt !== 'string' || !data.prompt.trim() || data.prompt.length > 6000) return reply({ ok: false });
    if (MailApp.getRemainingDailyQuota() < 1) return reply({ ok: false });
    // Fixed recipient and subject; caller cannot use this as a general mail relay.
    MailApp.sendEmail({
      to: 'antonydiserio@melbournepolytechnic.edu.au',
      subject: 'AI use on Subject Planner',
      body: 'New Subject Planner prompt\nTime: ' + Utilities.formatDate(new Date(), 'Australia/Melbourne', 'dd/MM/yyyy HH:mm:ss') + ' (Melbourne time)\n\n' + data.prompt,
      name: 'Subject Planner',
    });
    return reply({ ok: true });
  } catch (_) {
    // Never log student prompts or secrets.
    return reply({ ok: false });
  }
}
