import { plannerInstructions } from './planner-instructions.mjs';
import config from './semester-config.json' with { type: 'json' };
export { ChatUsage } from './chat-usage.mjs';
import { handleChat } from './planner-chat.mjs';
import { informationTools, describeSubject, getCourseInformation, searchEmailScripts, searchEnrolmentRules, studentSemesterDetails } from './mcp-information.mjs';

const subjects = Object.fromEntries(Object.entries(config.subjects).filter(([code]) => /^BIT\d+$/.test(code)));
const tool = {
  name: 'plan_subjects',
  description: 'Given passed or credited subjects and a Bachelor of IT major, return remaining requirements and options for a target semester. Default to the configured current semester. Do not ask for a major by default: if unknown, compare NS, BA and SD using separate calls and offer common eligible core options without assigning a major. Ask about a major only when stream-specific advice requires it. Does not access browser history or enrol students. Options are individual possibilities, not a clash-free or load-approved enrolment plan.',
  inputSchema: {
    type: 'object', additionalProperties: false,
    required: ['completed', 'major'],
    properties: {
      completed: { type: 'array', maxItems: 100, items: { type: 'string' }, description: 'Passed/credited BIT codes only; exclude failed, withdrawn and ungraded enrolments.' },
      major: { type: 'string', enum: ['NS', 'BA', 'SD'] },
      semester: { type: 'string', enum: ['S1', 'S2', 'SS'], description: 'Target semester; defaults to the configured current semester.' },
      unspecifiedElectiveCredits: { type: 'integer', minimum: 0, maximum: 4, description: 'Approved unspecified elective credits, excluding named subjects already in completed.' },
    },
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
};

export function planSubjects(args) {
  if (!args || !Array.isArray(args.completed) || args.completed.length > 100 ||
      args.completed.some(code => typeof code !== 'string') || !['NS', 'BA', 'SD'].includes(args.major) ||
      (args.semester !== undefined && !['S1', 'S2', 'SS'].includes(args.semester)) ||
      (args.unspecifiedElectiveCredits !== undefined && (!Number.isInteger(args.unspecifiedElectiveCredits) || args.unspecifiedElectiveCredits < 0 || args.unspecifiedElectiveCredits > 4)) ||
      Object.keys(args).some(key => !Object.hasOwn(tool.inputSchema.properties, key))) {
    throw new Error('Provide completed as an array of subject codes, major as NS/BA/SD, optional semester as S1/S2/SS, and optional unspecifiedElectiveCredits as 0–4.');
  }
  const completed = new Set(args.completed.map(code => code.trim().toUpperCase()));
  const unknown = [...completed].filter(code => !subjects[code]);
  if (unknown.length) throw new Error(`Unknown subject codes: ${unknown.join(', ')}. Use unspecifiedElectiveCredits for approved unnamed electives.`);
  const current = config.semesterDetails.semester_S1_S2_SS;
  const semester = args.semester || current;
  const isMajor = code => subjects[code].majorStreams?.includes(args.major);
  const majorCount = [...completed].filter(isMajor).length;
  const electiveCount = [...completed].filter(code => !subjects[code].core && !isMajor(code)).length + (args.unspecifiedElectiveCredits || 0);
  const electiveSlots = Math.max(0, config.programRequirements.elective - electiveCount);
  const remaining = Object.keys(subjects).filter(code => !completed.has(code));
  const describe = describeSubject;
  const required = remaining.filter(code => subjects[code].core || isMajor(code));
  const electiveOptions = electiveSlots ? remaining.filter(code => !subjects[code].core && !isMajor(code)) : [];
  const running = code => {
    if (semester === current) return Object.hasOwn(config.timetable, code);
    if (semester === 'SS') return false; // Future summer offerings are not published.
    if (config.subjectsRunning.semester1Only.includes(code)) return semester === 'S1';
    if (config.subjectsRunning.semester2Only.includes(code)) return semester === 'S2';
    return true;
  };
  const candidates = [...required, ...electiveOptions];
  // Resolve corequisite dependencies together; prerequisites must already be passed.
  let eligible = new Set(candidates.filter(code => running(code) &&
    (subjects[code].prerequisites || []).every(pre => completed.has(pre)) &&
    (!subjects[code].majorSubjectRequirement || majorCount >= subjects[code].majorSubjectRequirement.minimumCompletedMajorSubjects)));
  let changed;
  do {
    changed = false;
    for (const code of eligible) {
      const meta = subjects[code];
      const majorRequirement = meta.majorSubjectRequirement;
      const possibleMajorCount = majorCount + [...eligible].filter(isMajor).length;
      if (!(meta.corequisites || []).every(co => completed.has(co) || eligible.has(co)) ||
          (majorRequirement && possibleMajorCount < majorRequirement.minimumCompletedOrConcurrentMajorSubjects)) {
        eligible.delete(code);
        changed = true;
      }
    }
  } while (changed);
  const remainingSubjectCount = required.length + electiveSlots;
  const excessElectiveCount = Math.max(0, electiveCount - config.programRequirements.elective);
  const alternatingMajorOptions = [...eligible].filter(code => isMajor(code) &&
    (config.subjectsRunning.semester1Only.includes(code) || config.subjectsRunning.semester2Only.includes(code)));
  return {
    major: args.major, semester, configuredSemester: studentSemesterDetails(),
    completed: [...completed],
    semesterStudyLoad: semester === 'SS' ? { maximumSubjects: config.summerSchool.maximumSubjects } : { standardSubjects: config.planningGuidance.earlyCompletion.standardSemesterLoad },
    guidance: 'For explanatory advice, summer procedures, credit transfers and contacts, use search_enrolment_rules and its recorded source-precedence decisions. Full prerequisites and corequisites are included for every returned subject. Timetable details apply only to timetableAppliesTo, not automatically to the requested future semester.',
    remainingCore: required.filter(code => subjects[code].core).map(describe),
    remainingMajor: required.filter(isMajor).map(describe),
    electiveSlotsRemaining: electiveSlots, electiveOptions: electiveOptions.map(describe),
    progress: {
      completedSubjectsCountingTowardAward: config.programRequirements.total - remainingSubjectCount,
      completedMajorSubjects: majorCount,
      remainingSubjects: remainingSubjectCount,
      excessElectiveSubjects: excessElectiveCount,
      standardLoadSemesterLowerBound: Math.ceil(remainingSubjectCount / config.planningGuidance.earlyCompletion.standardSemesterLoad),
      estimateCaveat: 'Load-only lower bound, not a graduation forecast. Prerequisite chains, Capstone sequencing, alternating offerings and approvals can extend study; summer or approved overload may change the load calculation.',
    },
    planningWarnings: [
      ...(electiveSlots === 0 ? [{
        code: 'electives-full',
        message: 'All elective slots are filled. Further non-major stream subjects do not reduce remaining award requirements; discuss any extra study and fees with Enrolments.',
      }] : []),
      ...(excessElectiveCount ? [{
        code: 'excess-electives',
        message: `${excessElectiveCount} supplied elective subject(s)/credit(s) exceed the award elective slots for this major and do not reduce remaining requirements. Recheck credit allocation if changing major.`,
      }] : []),
      ...(alternatingMajorOptions.length ? [{
        code: 'alternating-major-subjects', subjects: alternatingMajorOptions,
        message: 'These eligible major subjects run in only one regular semester each year. Deferring them may mean waiting about 12 months and may delay completion. This is planning advice, not a requirement to select them all.',
      }] : []),
    ],
    eligibleOptions: [...eligible].map(code => ({
      ...describe(code), category: subjects[code].core ? 'core' : isMajor(code) ? 'major' : 'elective',
      mustTakeConcurrently: (subjects[code].corequisites || []).filter(co => !completed.has(co)),
      additionalConcurrentMajorSubjectsRequired: Math.max(0, (subjects[code].majorSubjectRequirement?.minimumCompletedOrConcurrentMajorSubjects || 0) - majorCount),
    })),
    blockedOptions: candidates.filter(code => !eligible.has(code)).map(code => ({
      ...describe(code), offered: running(code),
      missingPrerequisites: (subjects[code].prerequisites || []).filter(pre => !completed.has(pre)),
      missingCorequisites: (subjects[code].corequisites || []).filter(co => !completed.has(co)),
      majorRequirement: subjects[code].majorSubjectRequirement || null,
    })),
    notes: [
      'Uses passed/credited subjects supplied in this call; no student history is stored.',
      'Future S1/S2 offerings follow configured rotation. Future summer offerings are unknown; an empty list does not mean no subjects will run.',
      'Concurrent requirements must be selected together. Timetable clashes, study-load limits and enrolment approval are not assessed.',
    ],
  };
}

const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
const error = (id, code, message, status = 200) => json({ jsonrpc: '2.0', id, error: { code, message } }, status);

export default {
  async fetch(request, env, context) {
    if (new URL(request.url).pathname === '/chat') return handleChat(request, env, [tool, ...informationTools], {
      plan_subjects: planSubjects, get_course_information: getCourseInformation,
      search_enrolment_rules: searchEnrolmentRules, search_email_scripts: searchEmailScripts,
    }, context);
    if (new URL(request.url).pathname !== '/mcp') return env.ASSETS.fetch(request);
    // Stateless Streamable HTTP: no server-initiated event stream or sessions.
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    if (!request.headers.get('Content-Type')?.includes('application/json')) return error(null, -32600, 'Use application/json', 415);
    const body = await request.text();
    if (body.length > 16000) return error(null, -32600, 'Request too large', 413);
    let message;
    try { message = JSON.parse(body); } catch { return error(null, -32700, 'Invalid JSON', 400); }
    if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string' ||
        (message.id !== undefined && typeof message.id !== 'string' && typeof message.id !== 'number')) {
      return error(null, -32600, 'Invalid JSON-RPC request', 400);
    }
    if (message.id === undefined) return new Response(null, { status: 202 });
    const { id, method, params } = message;
    let result;
    switch (method) {
      case 'initialize':
        result = { protocolVersion: ['2024-11-05', '2025-03-26', '2025-06-18', '2025-11-25'].includes(params?.protocolVersion) ? params.protocolVersion : '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'bit-course-planner', version: '1.2.0' }, instructions: plannerInstructions };
        break;
      case 'ping': result = {}; break;
      case 'tools/list': result = { tools: [tool, ...informationTools] }; break;
      case 'tools/call':
        if (![tool.name, ...informationTools.map(item => item.name)].includes(params?.name)) return error(id, -32602, 'Unknown tool');
        try {
          const plan = params.name === tool.name ? planSubjects(params.arguments)
            : params.name === 'get_course_information' ? getCourseInformation(params.arguments)
            : params.name === 'search_enrolment_rules' ? searchEnrolmentRules(params.arguments)
            : searchEmailScripts(params.arguments);
          result = { content: [{ type: 'text', text: JSON.stringify(plan) }] };
        } catch (cause) {
          result = { isError: true, content: [{ type: 'text', text: cause.message }] };
        }
        break;
      default: return error(id, -32601, 'Method not found');
    }
    return json({ jsonrpc: '2.0', id, result });
  },
};
