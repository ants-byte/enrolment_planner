# ChatGPT course planner connection

The Cloudflare Worker adds a stateless, read-only `/mcp` endpoint. It uses
`semester-config.json`; update that file to update course rules and offerings.
No API key, database or student-history storage is required.

## Deploy

In the existing **Cloudflare Workers** project's Git build settings, use this
repository's root directory and deploy command `npx wrangler deploy`.
The Worker name in `wrangler.jsonc` must match your existing Worker name
(`timetableplanner` is taken from the site's canonical URL).
Remove any old deploy-command `--assets` override so Wrangler uses this config.
The assets allowlist keeps repository documents and local files out of the upload.
This configuration targets Workers, not Cloudflare Pages.

After committing/pushing and a successful Cloudflare deployment, create the
ChatGPT MCP connection using:

`https://timetableplanner.adiserio.workers.dev/mcp`

Choose **No authentication**. This endpoint only evaluates supplied subject codes
against public course rules. It cannot read browser history or enrol students.
Use your actual hostname if different.

Example chat: “Use the course planner. My major is NS and I have passed BIT105,
BIT106, BIT108, BIT111, BIT112 and BIT121. What remains and what can I take in S1?”

The tool accepts only passed/credited codes; pass approved unnamed elective
credits separately. It defaults to the semester after the configured semester,
not the date of the chat. Future summer offerings are unknown. Returned options
include concurrent-study conditions and are not a clash-checked enrolment plan.
