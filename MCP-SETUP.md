# ChatGPT course planner connection

The Cloudflare Worker adds a stateless, read-only `/mcp` endpoint. It uses
`semester-config.json`; update that file to update course rules and offerings.
No API key, database or student-history storage is required.

## Deploy

The website chat uses `/chat` and the Workers AI binding `AI`, configured in
`wrangler.jsonc`, with the Llama 3.3 70B fast model. Deploy the updated Worker and
assets together to enable the dialog. No external provider key is required.
`CHAT_LIMITER` allows ten requests per minute per IP per Cloudflare location;
this is an abuse throttle, not an account-wide spending cap. Each question is
limited to four AI rounds and four tool calls per round. Conversations stay in
tab memory and are sent to Cloudflare AI, not saved to a student database.
Editing the history starts a fresh conversation. No staff-only source is loaded.
Check with `node tools/test-chat.mjs`, then test real answers after deployment.

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
The planner also returns award-counting progress, excess-elective warnings and
eligible alternating-major-subject warnings. Its standard-load semester count is
a load-only lower bound, not a graduation forecast; prerequisite and Capstone
sequencing still need review. These results derive from the existing configuration,
without duplicating subject lists or interpreting email examples as approvals.

## Reference and follow-up tools

`get_course_information` returns full subject prerequisites/corequisites, current
timetable, dates, course structure, summer limits and other configured facts.
It does not require student history or a chosen major.

`search_email_scripts` searches the imported Email Scripts reference. Omit its
query to list all headings, or pass a returned `sectionId` for an exact section.
Results cite the source document and heading path and include review caveats.
This is reference retrieval, not an email-sending or enrolment-processing tool.

After deployment, refresh the ChatGPT connection's tools (or reconnect) so the
two new tools become available.

To update the checked-in reference snapshot after editing the source document:

```powershell
python tools/import-email-scripts.py "path/to/Email Scripts.htm"
```

Review `email-scripts-reference.json` before committing and deploying. Its source
hash identifies the imported version; changes to a local document do not update
the deployed tool automatically. Images/local attachments are omitted. Public
links and staff contact details in the source are retained; Outlook tracking
wrappers are removed. HTML references use headings rather than page numbers.

Templates contain dated and conflicting examples (including summer offerings,
study-load limits, overload grades, fees and Capstone wording). They are exposed
as reference with caveats, not silently installed as new eligibility rules.
First-person statements such as “I have entered your selections” describe a
template and must not be presented as a completed administrative action.

Focused local check: `node tools/test-mcp.mjs`.

## Student rules lookup

`search_enrolment_rules` searches Email Scripts and the two student-accessible
rules documents, including subject descriptions and glossary entries. Results
include document/heading/paragraph citations and recorded precedence decisions.
See `MCP-RULES-REVIEW.md` for conflicts and unresolved items.

The officer-only document is never deployed. There is no officer role parameter
or private-data endpoint. The importer reads it locally only to exclude duplicate
officer procedures from the shared document. Staff access would require a separate
authenticated service and must not be enabled by trusting a caller's role string.
Local staff review notes are kept in `private-staff/`, excluded from Git and
deployment assets, and are not imported by the public MCP. They are review
material, not a deployed staff lookup or verified operating procedure.

To re-import after reviewing source changes and updating source hashes/paragraph
decisions in `enrolment-rule-decisions.json`:

```powershell
python tools/import-enrolment-rules.py "directory containing the three DOCX files"
```

Only `Rules for Enrolment officers and Students.docx` and
`Rules for Students only.docx` can supply public rules. The snapshot deliberately
omits officer-only text, test-environment instructions, local attachments/images,
and copied website navigation. New lookup content is deployed on the next Git
push/build; refresh the ChatGPT tools to discover `search_enrolment_rules`.

Course-owner corrections override imported source guidance. CR is 70?79%; new
CSP places are unavailable until advised otherwise. Structured MCP responses
omit price fields, and public reference responses remove dollar amounts,
including historical examples. Fees can change each semester. English entry scores remain
unconfirmed. See MCP-RULES-REVIEW.md for the latest decisions.

The student-page review confirmed existing coverage of membership, scholarships,
pathways, delivery and assessments. Public Capstone descriptions now follow
Email Scripts: BIT371 then BIT372, rather than concurrent study. Entry criteria
and future intake claims carry specific confirmation caveats. Configured subject
classifications and prerequisites remain authoritative over the copied web table.
