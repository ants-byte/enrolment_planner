# Local Subject Planner in ChatGPT

This separate developer connection reads the academic plan currently shared by
your local webpage. It does not change the Cloudflare app or send requests to the
paid OpenAI chat API. ChatGPT still receives the academic context through MCP.
Names, student IDs, contact details, fee/visa data and workbooks are excluded.

## Start the local website

From the VS Code PowerShell terminal in the project directory:

```powershell
node tools/local-planner-server.mjs
```

Open **http://127.0.0.1:8787/** instead of the Live Server address on port 5501.
Load a student as usual. Click **Share academic plan with ChatGPT** at the bottom
right. Only the listed academic fields are shared; no student records are written
to disk by the bridge. It retains one current snapshot in process memory.
Sharing updates every two seconds and expires after ten seconds without updates.
If multiple tabs share, the most recently updated tab wins: check the six-character
tab label in ChatGPT's tool result. Use one sharing tab at a time.
Click **Stop sharing with ChatGPT** when finished. Stop the server with Ctrl+C.
The existing website AI composer is not wired to this server: ask in ChatGPT.

## Connect the private server

Use OpenAI's official instructions:
https://developers.openai.com/api/docs/guides/secure-mcp-tunnels

1. In https://platform.openai.com/settings/organization/tunnels create a tunnel
   associated with the ChatGPT workspace where you want the plugin.
2. Install the supported `tunnel-client` from the download link there. Run
   `tunnel-client help quickstart` and follow its current HTTP-server setup.
3. The private MCP URL is **http://127.0.0.1:8787/mcp**. Use the tunnel ID from
   Platform settings and the HTTP option `--mcp-server-url`. The client needs a
   runtime key with Tunnels Read + Use; enter credentials locally using the
   client's supported secure setup, never in chat or committed files.
4. Run `tunnel-client doctor --profile <your-profile> --explain`, then
   `tunnel-client run --profile <your-profile>`. Keep both the planner server and
   tunnel client running. Do not use a public tunnel for student context.
5. In ChatGPT add a custom MCP server named **Subject Planner Local**. Choose
   **Tunnel**, select the associated tunnel, and select MCP authentication None
   for this private read-only server. Review the requested tools before connecting.
6. Confirm discovery lists five tools, including **get_current_student_plan**.
   The original Cloudflare connection still lists four tools.

If Tunnel or the relevant workspace is unavailable, stop at this step and check
account permissions/availability. Do not expose the academic context publicly as
a workaround.

## Test

Use a synthetic student first, enable sharing, start a new ChatGPT conversation
with only **Subject Planner Local** selected, and ask:

> Read the academic plan currently shared by my local planner. Summarise it,
> distinguish current subjects from confirmed passes, and suggest eligible subjects
> for the configured current semester. State any provisional planning assumptions.

Changing students does not erase old ChatGPT messages. Start a new ChatGPT chat
for each student; stop sharing before switching records. The bridge's privacy
filter does not remove information you manually type into ChatGPT. Context already
sent remains subject to ChatGPT's retention and your institution's requirements.
