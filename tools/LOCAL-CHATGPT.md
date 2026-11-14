# Local Subject Planner in ChatGPT

The private bridge serves the planner at `http://127.0.0.1:5501/` and the MCP
endpoint at `http://127.0.0.1:8787/mcp`. Both listeners bind to this PC. The
browser's workbook access and settings stay under the existing planner address.

1. Stop VS Code Live Server on port 5501 and stop Wrangler on port 8787 if it
   is running. From this checkout, run `node tools/local-planner-server.mjs`.
2. Reopen the planner at the same address. If the sharing button is missing,
   reload with Ctrl+Shift+R. If an old PWA service worker still supplies stale
   files, unregister that service worker in the browser developer tools and reload.
3. Start the OpenAI tunnel using the existing **SubjectPlannerLocalhost** profile
   that points to `http://127.0.0.1:8787/mcp`. In ChatGPT, refresh the connector's
   tools or reconnect. The existing tunnel target does not need to change.
4. Select a synthetic workbook student and click **Share with ChatGPT**. In the
   intended private ChatGPT chat, ask SubjectPlannerLocalhost for the student's
   history and supply the access code shown in the planner. Compare the result
   with the planner, then click **Stop sharing with ChatGPT**.

`get_selected_student` returns the selected workbook student's ID and name.
`get_student_history` also returns subject codes, results, dates where available,
and current enrolments. The tools read the student already selected in the
planner. They accept a temporary access code and have no student search or
update operation. The existing `get_current_student_plan` also requires the code.

Sharing starts off. The code is scoped to one sharing tab and expires after
five minutes. The bridge drops the in-memory copy after ten seconds without
updates. Changing or clearing the workbook student stops sharing. Use a new code
for the next student. Keep the code and any resulting ChatGPT conversation
private. Stopping sharing revokes future reads. Data already returned remains
in the chat under its retention settings.

The bridge keeps workbook files off the MCP listener and never writes a
snapshot to disk. Cloudflare continues to expose only the four course and rules
tools. The private `search_officer_enrolment_guidance` tool still reads the
officer reference from the operator's local Operations folder. Set
`LOCAL_PLANNER_OFFICER_REFERENCE` before starting the bridge to use a different
private source.

Run `node tools/test-local-planner.mjs` to check local discovery and synthetic
records, and `node tools/test-mcp.mjs` to check the public tool surface.

[OpenAI Secure MCP Tunnel setup](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)
