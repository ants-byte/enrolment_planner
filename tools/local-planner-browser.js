(() => {
  if (!window.getLocalPlannerAcademicContext) return;
  const token = document.currentScript.dataset.token;
  const session = crypto.randomUUID();
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:2147483647;padding:10px;background:#263342;color:white;border-radius:8px;font:13px sans-serif';
  const button = document.createElement('button');
  const status = document.createElement('span');
  status.setAttribute('role', 'status');
  button.textContent = 'Share with ChatGPT';
  panel.append(button, status);
  document.body.append(panel);

  let accessCode = '';
  let busy = false;
  let stopTimer;
  let sharingDeadline;
  const send = (payload, keepalive = false) => fetch('/local-context', {
    method: 'POST', keepalive,
    headers: { 'Content-Type': 'application/json', 'X-Local-Planner-Token': token },
    body: JSON.stringify({ session, ...payload }),
  });

  const stopSharing = async (message = ' Sharing off.') => {
    if (!accessCode) return;
    accessCode = '';
    clearTimeout(stopTimer);
    button.textContent = 'Share with ChatGPT';
    button.disabled = true;
    status.textContent = message;
    try {
      await send({ context: null }, true);
    } catch {
      status.textContent = ' Sharing stopped. The last update expires within 10 seconds.';
    } finally {
      button.disabled = busy;
    }
  };
  window.stopLocalPlannerSharing = () => void stopSharing();
  window.addEventListener('pagehide', window.stopLocalPlannerSharing);

  const publish = async () => {
    if (busy || !accessCode) return;
    if (Date.now() >= sharingDeadline) {
      await stopSharing(' Sharing expired.');
      return;
    }
    const code = accessCode;
    busy = true;
    try {
      const response = await send({
        accessCode: code,
        context: window.getLocalPlannerAcademicContext(),
        student: window.getLocalPlannerStudentHistory(),
      });
      if (code !== accessCode) {
        await send({ context: null }, true);
      } else if (!response.ok) {
        await stopSharing(response.status === 409 ? ' Another planner tab is sharing.' : ' Sharing unavailable.');
      } else {
        status.textContent = ' Access code for ChatGPT: ' + code;
      }
    } catch {
      if (code === accessCode) await stopSharing(' Sharing unavailable.');
    } finally {
      busy = false;
      button.disabled = false;
    }
  };

  button.onclick = () => {
    if (accessCode) {
      void stopSharing();
      return;
    }
    accessCode = crypto.randomUUID().replaceAll('-', '');
    button.textContent = 'Stop sharing with ChatGPT';
    const sharingDuration = 5 * 60 * 1000;
    sharingDeadline = Date.now() + sharingDuration;
    stopTimer = setTimeout(() => void stopSharing(' Sharing expired.'), sharingDuration);
    void publish();
  };
  setInterval(publish, 2000);
})();
