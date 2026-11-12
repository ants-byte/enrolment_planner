import config from './semester-config.json' with { type: 'json' };

const useCodes = new Set(['USE101', 'USE102', 'USE201', 'USE202', 'USE301']);
export function normalizeCompleted(codes, unspecifiedElectiveCredits = 0) {
  if (!Array.isArray(codes) || !Number.isInteger(unspecifiedElectiveCredits) || unspecifiedElectiveCredits < 0 || unspecifiedElectiveCredits > 5) throw new Error('Invalid completed history');
  const unique = [...new Set(codes.map(code => {
    if (typeof code !== 'string') throw new Error('Invalid subject code');
    return code.trim().toUpperCase();
  }))];
  if (unique.some(code => !useCodes.has(code) && !config.subjects[code])) throw new Error('Unknown subject code');
  return { completed: unique.filter(code => !useCodes.has(code)),
    // A count supplied alongside USE codes describes the same credits, not extra ones.
    unspecifiedElectiveCredits: Math.max(unspecifiedElectiveCredits, unique.filter(code => useCodes.has(code)).length) };
}

export function normalizeHistory(args) {
  const seen = new Set();
  for (const key of ['passed', 'credited', 'current', 'failed']) {
    if (!Array.isArray(args[key]) || args[key].length > 40) throw new Error('Invalid history');
    args[key] = args[key].map(code => typeof code === 'string' ? code.trim().toUpperCase() : code);
    for (const code of args[key]) {
      if (seen.has(code) || (!useCodes.has(code) && !config.subjects[code]) || (useCodes.has(code) && ['current', 'failed'].includes(key))) throw new Error('Invalid history');
      seen.add(code);
    }
  }
  const normalized = normalizeCompleted([...args.passed, ...args.credited], args.unspecifiedElectiveCredits);
  if (args.major && !['NS', 'BA', 'SD'].includes(args.major)) throw new Error('Invalid major');
  return { passed: args.passed.filter(code => !useCodes.has(code)), credited: args.credited.filter(code => !useCodes.has(code)),
    current: args.current, failed: args.failed, unspecifiedElectiveCredits: normalized.unspecifiedElectiveCredits,
    ...(args.major ? { major: args.major } : {}) };
}
