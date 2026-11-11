(() => {
  const token = document.currentScript.dataset.token;
  const session = crypto.randomUUID();
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:2147483647;padding:10px;background:#263342;color:white;border-radius:8px;font:13px sans-serif';
  const button = document.createElement('button');
  const status = document.createElement('span');
  button.textContent = 'Share academic plan with ChatGPT';
  panel.append(button, status); document.body.append(panel);
  let sharing = false, busy = false;
  const publish = async () => {
    if (busy || !sharing) return;
    busy = true;
    try {
      if (!window.getLocalPlannerAcademicContext) throw new Error();
      const response = await fetch('/local-context', { method: 'POST', headers: {
        'Content-Type': 'application/json', 'X-Local-Planner-Token': token,
      }, body: JSON.stringify({ session, context: window.getLocalPlannerAcademicContext() }) });
      if (!response.ok) throw new Error();
      status.textContent = ` Sharing this tab (${session.slice(0, 6)}). Identifiers excluded.`;
    } catch { status.textContent = ' Connection unavailable. Context expires within 10 seconds.'; }
    finally { busy = false; }
  };
  button.onclick = async () => {
    sharing = !sharing;
    button.textContent = sharing ? 'Stop sharing with ChatGPT' : 'Share academic plan with ChatGPT';
    if (sharing) await publish();
    else {
      await fetch('/local-context', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Local-Planner-Token': token }, body: JSON.stringify({ session, context: null }) }).catch(() => {});
      status.textContent = ' Sharing off.';
    }
  };
  setInterval(publish, 2000);
})();
