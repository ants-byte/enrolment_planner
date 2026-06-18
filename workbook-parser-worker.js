/* global XLSX */

const STUDENT_COLUMNS = [
  'Student_IDs_Unique',
  'In_AllResults',
  'In_CurrentStudents',
  'In_Deferred',
  'In_StrataApplications',
  'In_InternationalsAccepted',
  'In_AllInternationals',
  'In_Diploma',
  'Full_Name',
  'Family_Name',
  'Given_Name',
  'Primary_Email',
  'Institute_Email',
  'Secondary_Email',
  'Mobile',
  'DOB',
  'Nationality',
  'Visa_Type',
  'Funding_Source',
  'Accepted_Offered',
  'Intake_Start_Date',
  'Application_Status',
  'Application_Type',
  'International_Office_Notes',
  'FMP',
  'Suspended',
  'Suspended_Names',
  'Allow_Enrol?',
  'Passed_subjects',
  'Results_List',
  'Failed_Count',
  'Credit_Points_Earned',
  'CRT_Location',
  'SharePoint_StudentForms',
  'SuppsAndHolds',
  'APR_APP',
  'APR_APP_Condition',
  'APR_APP_Attended',
  'Student_Flag',
];

const COURSE_INFO_RANGES = [
  'Semester_Start_Date',
  'Price_per_CSP_Unit',
  'Price_per_Unit',
  'CensusDate',
  'Credit_Points_Earned',
  'EndOfWeekTwoDate',
  'Countries_facing_troubles',
];
const TRIAGE_ROW_LIMIT = 350;
const TRIAGE_MAX_COL_SCAN = 120;
const TRIAGE_MAX_PREVIEW_COLS = 12;
const TRIAGE_READ_MAX_ROWS = 800;
const SOURCE_READ_MAX_ROWS = 4000;
const SOURCE_SHEET_NAMES = ['Students', 'STUDENTS', 'students'];
const TRIAGE_SHEET_NAMES = ['Triage', 'TRIAGE', 'triage'];

const normalizeHeader = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const normalizeHeadingText = (value) =>
  String(value || '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const normalizeStudentId = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value)).padStart(7, '0');
  }
  const raw = String(value).trim();
  const digits = (raw.match(/\d+/g) || []).join('');
  if (!digits) return '';
  if (digits.length >= 7) return digits.slice(-7);
  return digits.padStart(7, '0');
};

const getCellHyperlink = (cell, sheet = null, workbook = null) => {
  if (!cell) return '';
  const normalizeCandidate = (value) => {
    if (value === null || value === undefined) return '';
    let candidate = String(value).trim();
    if (!candidate) return '';
    candidate = candidate.replace(/&amp;/gi, '&').trim();
    if (
      (candidate.startsWith('"') && candidate.endsWith('"')) ||
      (candidate.startsWith("'") && candidate.endsWith("'"))
    ) {
      candidate = candidate.slice(1, -1).trim();
    }
    if (!candidate) return '';
    if (/^%2F/i.test(candidate)) {
      try {
        const decoded = decodeURIComponent(candidate);
        if (decoded) candidate = decoded;
      } catch {
        // keep original encoded value
      }
    }
    if (/^https?:\/\//i.test(candidate)) return candidate;
    if (/^file:\/\//i.test(candidate)) return candidate;
    if (/^\/\//.test(candidate)) return `https:${candidate}`;
    if (/^\/sites\//i.test(candidate)) return candidate;
    if (/^sites\//i.test(candidate)) return `/${candidate}`;
    if (/^\.\.?\//.test(candidate)) return candidate;
    if (/sharepoint\.com/i.test(candidate)) {
      return /^https?:\/\//i.test(candidate)
        ? candidate
        : `https://${candidate.replace(/^\/+/, '')}`;
    }
    return '';
  };
  const getCellAt = (targetSheet, address) => {
    if (!targetSheet || !address) return null;
    try {
      const decoded = XLSX?.utils?.decode_cell ? XLSX.utils.decode_cell(address) : null;
      if (decoded) {
        const denseRow = Array.isArray(targetSheet)
          ? targetSheet[decoded.r]
          : Array.isArray(targetSheet?.['!data'])
            ? targetSheet['!data'][decoded.r]
            : null;
        const denseCell = denseRow ? denseRow[decoded.c] : null;
        if (denseCell) return denseCell;
      }
    } catch {
      // fall back to sparse lookup
    }
    return targetSheet[address] || null;
  };
  const getFirstFormulaArg = (text) => {
    if (!text) return '';
    let depth = 0;
    let inQuotes = false;
    let arg = '';
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === '"') {
        if (inQuotes && text[i + 1] === '"') {
          arg += '""';
          i += 1;
          continue;
        }
        inQuotes = !inQuotes;
        arg += ch;
        continue;
      }
      if (!inQuotes) {
        if (ch === '(') depth += 1;
        else if (ch === ')' && depth > 0) depth -= 1;
        else if ((ch === ',' || ch === ';') && depth === 0) break;
      }
      arg += ch;
    }
    return arg.trim();
  };

  const directCandidates = [
    cell?.l?.Target,
    cell?.l?.target,
    cell?.l?.Href,
    cell?.l?.href,
    cell?.l?.Location,
    cell?.l?.location,
    cell?.Target,
    cell?.target,
    typeof cell?.v === 'object' ? cell.v?.Target : '',
    typeof cell?.v === 'object' ? cell.v?.target : '',
  ];
  for (const candidate of directCandidates) {
    const normalized = normalizeCandidate(candidate);
    if (normalized) return normalized;
  }

  const html = String(cell?.h || '');
  const htmlMatch = html.match(/href\s*=\s*["']([^"']+)["']/i);
  if (htmlMatch?.[1]) {
    const normalized = normalizeCandidate(htmlMatch[1]);
    if (normalized) return normalized;
  }

  const rawValue = normalizeCandidate(cell?.v);
  if (rawValue) return rawValue;

  const formula = String(cell?.f || '').trim();
  if (!formula) return '';
  const urlInFormula = formula.match(/https?:\/\/[^"'\\s)]+/i);
  if (urlInFormula?.[0]) {
    const normalized = normalizeCandidate(urlInFormula[0]);
    if (normalized) return normalized;
  }
  const hyperlinkCall = formula.match(/(?:_xlfn\.)?HYPERLINK\s*\(([\s\S]*)\)\s*$/i);
  if (!hyperlinkCall?.[1]) return '';

  const firstArg = getFirstFormulaArg(hyperlinkCall[1]);
  if (!firstArg) return '';
  const normalizedFirstArg = normalizeCandidate(firstArg);
  if (normalizedFirstArg) return normalizedFirstArg;

  const refToken = firstArg.replace(/\$/g, '').trim();
  if (!refToken || !sheet) return '';
  const token = refToken.startsWith("'") && refToken.endsWith("'")
    ? refToken.slice(1, -1).replace(/''/g, "'")
    : refToken;
  const refMatch = token.match(/^(?:(.+)!)?([A-Z]{1,3}\d+)$/i);
  if (!refMatch) return '';
  const targetSheetRaw = String(refMatch[1] || '').trim();
  const targetSheetName = targetSheetRaw
    ? targetSheetRaw.replace(/^'|'$/g, '').replace(/''/g, "'")
    : '';
  const refAddress = String(refMatch[2] || '').toUpperCase();
  const targetSheet =
    targetSheetName && workbook?.Sheets?.[targetSheetName]
      ? workbook.Sheets[targetSheetName]
      : sheet;
  const refCell = getCellAt(targetSheet, refAddress);
  if (!refCell) return '';
  const refCandidates = [
    refCell?.l?.Target,
    refCell?.l?.target,
    refCell?.w,
    refCell?.v,
  ];
  for (const candidate of refCandidates) {
    const normalized = normalizeCandidate(candidate);
    if (normalized) return normalized;
  }
  return '';
};

const stripRangeRef = (ref) => String(ref || '').replace(/\$|'/g, '');

const getNamedRangeKey = (name) => {
  if (!name) return '';
  const raw = String(name);
  const parts = raw.split('!');
  return parts[parts.length - 1];
};

const normalizeNamedRangeKey = (name) =>
  String(name || '')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

const resolveNamedRangeKey = (name, allowed) => {
  const rawKey = getNamedRangeKey(name);
  if (allowed.includes(rawKey)) return rawKey;
  const normalized = normalizeNamedRangeKey(rawKey).toLowerCase();
  const match = allowed.find((entry) => entry.toLowerCase() === normalized);
  return match || '';
};

function getRangeValues(sheet, rangeRef, columnName, workbook = null) {
  if (!sheet || !rangeRef) return [];
  const cleaned = stripRangeRef(rangeRef);
  const parts = cleaned.split('!');
  if (!parts.length) return [];
  const range = parts[parts.length - 1];
  const sheetRef = sheet['!ref'] || '';
  let decoded = null;
  try {
    decoded = XLSX.utils.decode_range(range);
  } catch {
    const hashMatch = range.match(/^([A-Z]+)(\d+)#$/i);
    if (hashMatch && sheetRef) {
      const sheetBounds = XLSX.utils.decode_range(sheetRef);
      const expandedRange = `${hashMatch[1]}${hashMatch[2]}:${hashMatch[1]}${sheetBounds.e.r}`;
      try {
        decoded = XLSX.utils.decode_range(expandedRange);
      } catch {
        return [];
      }
    } else {
      return [];
    }
  }
  if (
    decoded &&
    decoded.s.c === decoded.e.c &&
    decoded.s.r === decoded.e.r &&
    sheetRef
  ) {
    try {
      const sheetBounds = XLSX.utils.decode_range(sheetRef);
      decoded = XLSX.utils.decode_range(
        `${XLSX.utils.encode_col(decoded.s.c)}${decoded.s.r + 1}:${XLSX.utils.encode_col(decoded.e.c)}${sheetBounds.e.r + 1}`
      );
    } catch {
      return [];
    }
  }
  const values = [];
  for (let row = decoded.s.r; row <= decoded.e.r; row += 1) {
    const cellAddress = XLSX.utils.encode_cell({ c: decoded.s.c, r: row });
    const denseRow = Array.isArray(sheet)
      ? sheet[row]
      : Array.isArray(sheet?.['!data'])
        ? sheet['!data'][row]
        : null;
    const cell = denseRow ? denseRow[decoded.s.c] : sheet[cellAddress];
    if (!cell) {
      values.push('');
      continue;
    }
    if (columnName === 'SharePoint_StudentForms') {
      const link = getCellHyperlink(cell, sheet, workbook);
      if (link) {
        values.push(link);
        continue;
      }
    }
    values.push(cell.w ?? cell.v ?? '');
  }
  const normalized = values.map((value) => (value ?? '').toString().trim());
  const expectedHeader = normalizeHeader(columnName);
  const firstValueHeader = normalizeHeader(normalized[0] || '');
  if (normalized.length && firstValueHeader && firstValueHeader === expectedHeader) {
    normalized.shift();
  }
  return normalized;
}

function buildStudentRecordsFromWorkbook(workbook) {
  if (!workbook) return [];
  const sheetName = 'Students';
  const sheet = workbook.Sheets?.[sheetName];
  if (!sheet) return [];
  const names = workbook.Workbook?.Names || [];
  let columnMap = {};
  names.forEach((nameEntry) => {
    if (!nameEntry?.Name || !nameEntry.Ref) return;
    const nameKey = resolveNamedRangeKey(nameEntry.Name, STUDENT_COLUMNS);
    if (!nameKey) return;
    const cleanedRef = stripRangeRef(nameEntry.Ref);
    const refParts = cleanedRef.split('!');
    const refSheetName = refParts.length > 1 ? refParts[0] : '';
    if (refSheetName && refSheetName !== sheetName) return;
    columnMap[nameKey] = getRangeValues(sheet, nameEntry.Ref, nameKey, workbook);
  });
  const sharePointByStudentId = new Map();
  const collectSharePointByStudentId = () => {
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows.length) return;
    const columnKeyMap = STUDENT_COLUMNS.reduce((acc, col) => {
      acc[normalizeHeader(col)] = col;
      return acc;
    }, {});
    const scanLimit = Math.min(rows.length, 50);
    let headerIndex = -1;
    const studentIdHeaderKeys = new Set(
      [
        'Student_IDs_Unique',
        'Student IDs Unique',
        'Student ID',
        'StudentID',
        'Student_ID',
      ].map((label) => normalizeHeader(label))
    );
    for (let i = 0; i < scanLimit; i += 1) {
      const row = rows[i] || [];
      const hasStudentIdHeader = row.some(
        (cell) => studentIdHeaderKeys.has(normalizeHeader(cell))
      );
      if (hasStudentIdHeader) {
        headerIndex = i;
        break;
      }
    }
    if (headerIndex < 0) return;
    const headerRow = rows[headerIndex] || [];
    let idCol = -1;
    let shareCol = -1;
    headerRow.forEach((cell, idx) => {
      const key = columnKeyMap[normalizeHeader(cell)];
      if (key === 'Student_IDs_Unique' && idCol < 0) idCol = idx;
      if (key === 'SharePoint_StudentForms' && shareCol < 0) shareCol = idx;
    });
    if (idCol < 0 || shareCol < 0) return;
    for (let offset = 0; offset < rows.length - (headerIndex + 1); offset += 1) {
      const rowIndex = headerIndex + 1 + offset;
      const row = rows[rowIndex] || [];
      const studentId = normalizeStudentId(row[idCol]);
      if (!studentId) continue;
      const denseRow = Array.isArray(sheet)
        ? sheet[rowIndex]
        : Array.isArray(sheet?.['!data'])
          ? sheet['!data'][rowIndex]
          : null;
      const cellAddress = XLSX.utils.encode_cell({ c: shareCol, r: rowIndex });
      const cell = denseRow ? denseRow[shareCol] : sheet[cellAddress];
      const link = cell ? getCellHyperlink(cell, sheet, workbook) : '';
      const valueRaw = link || (cell?.w ?? cell?.v ?? row[shareCol] ?? '');
      const value = String(valueRaw || '').trim();
      if (!value) continue;
      if (!sharePointByStudentId.has(studentId)) {
        sharePointByStudentId.set(studentId, value);
      }
    }
  };
  collectSharePointByStudentId();
  let rowCount = Math.max(0, ...Object.values(columnMap).map((values) => values.length), 0);
  const buildColumnMapFromRows = () => {
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (rows.length <= 1) {
      return { columnMapFromRows: null, rowCountFromRows: 0 };
    }
    const columnKeyMap = STUDENT_COLUMNS.reduce((acc, col) => {
      acc[normalizeHeader(col)] = col;
      return acc;
    }, {});
    const scanLimit = Math.min(rows.length, 50);
    let headerIndex = -1;
    const studentIdHeaderKeys = new Set(
      [
        'Student_IDs_Unique',
        'Student IDs Unique',
        'Student ID',
        'StudentID',
        'Student_ID',
      ].map((label) => normalizeHeader(label))
    );
    for (let i = 0; i < scanLimit; i += 1) {
      const row = rows[i] || [];
      const hasStudentIdHeader = row.some(
        (cell) => studentIdHeaderKeys.has(normalizeHeader(cell))
      );
      if (hasStudentIdHeader) {
        headerIndex = i;
        break;
      }
    }
    if (headerIndex < 0) {
      let bestHeaderIndex = -1;
      let bestHeaderMatches = 0;
      for (let i = 0; i < scanLimit; i += 1) {
        const row = rows[i] || [];
        let matches = 0;
        row.forEach((cell) => {
          if (columnKeyMap[normalizeHeader(cell)]) matches += 1;
        });
        if (matches > bestHeaderMatches) {
          bestHeaderMatches = matches;
          bestHeaderIndex = i;
        }
      }
      if (bestHeaderIndex >= 0 && bestHeaderMatches > 0) {
        headerIndex = bestHeaderIndex;
      }
    }
    if (headerIndex < 0) return { columnMapFromRows: null, rowCountFromRows: 0 };
    const headerRow = rows[headerIndex] || [];
    const colIndexMap = {};
    headerRow.forEach((cell, idx) => {
      const key = columnKeyMap[normalizeHeader(cell)];
      if (key && colIndexMap[key] === undefined) colIndexMap[key] = idx;
    });
    const rowsToRead = rows.slice(headerIndex + 1);
    const hasStudentId = colIndexMap.Student_IDs_Unique !== undefined;
    if (!hasStudentId) return { columnMapFromRows: null, rowCountFromRows: 0 };
    const columnMapFromRows = {};
    STUDENT_COLUMNS.forEach((columnName) => {
      const idx = colIndexMap[columnName];
      if (idx === undefined) return;
      columnMapFromRows[columnName] = rowsToRead.map((row) => {
        const cellValue = row[idx];
        return typeof cellValue === 'string' ? cellValue.trim() : cellValue ?? '';
      });
    });
    const rowCountFromRows = Math.max(
      0,
      ...Object.values(columnMapFromRows).map((values) => values.length),
      0
    );
    return { columnMapFromRows, rowCountFromRows };
  };
  const rowMapResult = buildColumnMapFromRows();
  // Prefer explicit header-row parsing when available; named ranges can be offset per column.
  if (rowMapResult.columnMapFromRows && rowMapResult.rowCountFromRows > 0) {
    columnMap = rowMapResult.columnMapFromRows;
    rowCount = rowMapResult.rowCountFromRows;
  }
  const records = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const record = {};
    let hasValue = false;
    STUDENT_COLUMNS.forEach((columnName) => {
      const value = columnMap[columnName]?.[rowIndex] ?? '';
      if (value) hasValue = true;
      record[columnName] = value;
    });
    const studentId = normalizeStudentId(record.Student_IDs_Unique);
    if (!studentId || !hasValue) continue;
    record.Student_IDs_Unique = studentId;
    if (!String(record.SharePoint_StudentForms || '').trim() && sharePointByStudentId.has(studentId)) {
      record.SharePoint_StudentForms = sharePointByStudentId.get(studentId) || '';
    }
    records.push(record);
  }
  return records;
}

function buildCourseInfoFromWorkbook(workbook) {
  if (!workbook) return null;
  const defaultSheetName = 'Info';
  const defaultSheet = workbook.Sheets?.[defaultSheetName];
  const names = workbook.Workbook?.Names || [];
  const info = {};
  names.forEach((nameEntry) => {
    if (!nameEntry?.Name || !nameEntry.Ref) return;
    const nameKey = resolveNamedRangeKey(nameEntry.Name, COURSE_INFO_RANGES);
    if (!nameKey) return;
    const cleanedRef = stripRangeRef(nameEntry.Ref);
    const parts = cleanedRef.split('!');
    const refSheetName = parts.length > 1 ? parts[0] : '';
    const refSheet =
      (refSheetName && workbook.Sheets?.[refSheetName]) || defaultSheet;
    if (!refSheet) return;
    const values = getRangeValues(refSheet, nameEntry.Ref, nameKey, workbook);
    const value = values.find((val) => val !== '') ?? '';
    info[nameKey] = value;
  });
  return info;
}

const parseWorkbook = (buffer) => {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellStyles: false,
    cellText: true,
    cellFormula: true,
    cellHTML: true,
    cellNF: false,
    dense: false,
    sheetRows: SOURCE_READ_MAX_ROWS,
    sheets: SOURCE_SHEET_NAMES,
  });
  return {
    records: buildStudentRecordsFromWorkbook(workbook),
    courseInfo: buildCourseInfoFromWorkbook(workbook),
  };
};

const parseTriageWorkbookFromSheet = (sheet, ref, mode, workbook = null) => {
  const records = [];
  const previewRows = [];
  let parseInfo = { status: 'not parsed', headerFound: false, idIdx: null, total: 0, preview: 0 };
  if (!sheet || !ref) return { records, previewRows, parseInfo };
  const range = XLSX.utils.decode_range(ref);
  const maxScanCol =
    mode === 'full' ? range.e.c : Math.min(range.e.c, range.s.c + TRIAGE_MAX_COL_SCAN);
  const getCellObject = (r, c) => {
    const row = Array.isArray(sheet) ? sheet[r] : Array.isArray(sheet?.['!data']) ? sheet['!data'][r] : null;
    return row ? row[c] : sheet[XLSX.utils.encode_cell({ r, c })];
  };
  const getCellText = (r, c) => {
    const cell = getCellObject(r, c);
    if (!cell) return '';
    const value = cell.w ?? cell.v ?? '';
    return String(value).trim();
  };
  const headerTargets = [
    normalizeHeadingText('Student ID as String'),
    normalizeHeadingText('Student ID'),
    normalizeHeadingText('StudentID'),
    normalizeHeadingText('Student_ID'),
  ];
  const maxScanRow = Math.min(range.e.r, range.s.r + 200);
  let headerRowIndex = -1;
  let headerMap = null;
  let headerKeyByCol = {};
  for (let r = range.s.r; r <= maxScanRow; r += 1) {
    const normalized = [];
    for (let c = range.s.c; c <= maxScanCol; c += 1) {
      normalized.push(normalizeHeadingText(getCellText(r, c)));
    }
    let idIdx = normalized.findIndex((value) =>
      headerTargets.some((target) => value === target || value.includes(target))
    );
    if (idIdx >= 0) {
      headerRowIndex = r;
      const byKey = {};
      const byCol = {};
      normalized.forEach((key, idx) => {
        if (!key) return;
        const col = idx + range.s.c;
        byKey[key] = col;
        byCol[col] = key;
      });
      headerMap = byKey;
      headerKeyByCol = byCol;
      break;
    }
  }
  if (headerRowIndex < 0 || !headerMap) {
    parseInfo = { status: 'header not found', headerFound: false, idIdx: null, total: 0, preview: 0 };
    return { records, previewRows, parseInfo };
  }
  const getIdx = (label) => headerMap[normalizeHeadingText(label)];
  const getIdxAny = (...labels) => {
    for (const label of labels) {
      const idx = getIdx(label);
      if (idx !== undefined) return idx;
    }
    return undefined;
  };
  let idIdx = getIdx('Student ID as String');
  if (idIdx === undefined) idIdx = getIdx('Student ID');
  if (idIdx === undefined) {
    parseInfo = { status: 'id column not found', headerFound: true, idIdx: null, total: 0, preview: 0 };
    return { records, previewRows, parseInfo };
  }
  const fields = {
    friendlyName: getIdx('Friendly name'),
    handledBy: getIdx('Handled By'),
    statusLabel: getIdx('Int, Ongoing, FMP'),
    statusDetails: getIdx('Details - CRT, Ongoing, Domestic, etc.'),
    alteredStatus: getIdx('Altered Status'),
    onSharePoint: getIdx('On SharePoint'),
    inStrata: getIdx('In Strata (Enrolled) - subject list'),
    comments: getIdx('Comments'),
  };
  const sharePointPathIdx = getIdxAny('SharePoint Path', 'Sharepoint Path');
  const familyIdx = getIdx('Family Names');
  const givenIdx = getIdx('Given Names');
  const normalizeLinkCandidate = (value) => {
    if (value === null || value === undefined) return '';
    let candidate = String(value).trim();
    if (!candidate) return '';
    candidate = candidate.replace(/&amp;/gi, '&').trim();
    if (
      (candidate.startsWith('"') && candidate.endsWith('"')) ||
      (candidate.startsWith("'") && candidate.endsWith("'"))
    ) {
      candidate = candidate.slice(1, -1).trim();
    }
    if (!candidate) return '';
    if (/^%2F/i.test(candidate)) {
      try {
        const decoded = decodeURIComponent(candidate);
        if (decoded) candidate = decoded;
      } catch {
        // keep encoded value
      }
    }
    return candidate;
  };
  const isStudentFormsUrl = (value) =>
    /student(?:%20|\s)+forms/i.test(String(value || ''));
  const isCreditTransferUrl = (value) =>
    /credit(?:%20|\s)+(transfer|transfers)/i.test(String(value || ''));
  const isSharePointLikeUrl = (value) =>
    /sharepoint\.com/i.test(String(value || '')) || /^\/?sites\//i.test(String(value || ''));
  const pickTriageOnSharePointLink = (rowIndex, primaryLinks = []) => {
    const candidates = [];
    const seen = new Set();
    const pushCandidate = (rawUrl, colIndex, source) => {
      const url = normalizeLinkCandidate(rawUrl);
      if (!url) return;
      if (!isSharePointLikeUrl(url) && !/^https?:\/\//i.test(url) && !/^file:\/\//i.test(url)) {
        return;
      }
      const key = url.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      const headerKey = headerKeyByCol[colIndex] || '';
      const headerStudentForms = headerKey.includes('student') && headerKey.includes('forms');
      const headerOnSharePoint =
        headerKey.includes('onsharepoint') ||
        (headerKey.includes('sharepoint') && !headerKey.includes('credit'));
      const headerSharePointPath = headerKey.includes('sharepointpath');
      const headerCredit =
        headerKey.includes('credit') && (headerKey.includes('transfer') || headerKey.includes('crt'));
      let score = 0;
      if (isStudentFormsUrl(url)) score += 100;
      if (headerStudentForms) score += 35;
      if (headerOnSharePoint) score += 12;
      if (headerSharePointPath) score += 24;
      if (isSharePointLikeUrl(url)) score += 6;
      if (source === 'onSharePointCell') score += 4;
      if (source === 'sharePointPathCell') score += 10;
      if (source === 'sharePointPathText') score += 8;
      if (isCreditTransferUrl(url)) score -= 80;
      if (headerCredit) score -= 40;
      candidates.push({ url, score });
    };
    const onSharePointCol = fields.onSharePoint === undefined ? -1 : fields.onSharePoint;
    const primaryList = Array.isArray(primaryLinks) ? primaryLinks : [primaryLinks];
    primaryList.forEach((entry) => {
      if (entry && typeof entry === 'object') {
        const colIndex =
          Number.isInteger(entry.colIndex) && entry.colIndex >= 0
            ? entry.colIndex
            : onSharePointCol;
        pushCandidate(entry.url, colIndex, entry.source || 'primary');
      } else {
        pushCandidate(entry, onSharePointCol, 'onSharePointCell');
      }
    });
    for (let c = range.s.c; c <= maxScanCol; c += 1) {
      const cell = getCellObject(rowIndex, c);
      if (!cell) continue;
      pushCandidate(getCellHyperlink(cell, sheet, workbook), c, 'rowLink');
      const raw = String(cell.w ?? cell.v ?? '').trim();
      if (
        raw &&
        (/^(https?:\/\/|file:\/\/|\/sites\/|sites\/)/i.test(raw) ||
          /^%2Fsites%2F/i.test(raw) ||
          /sharepoint\.com/i.test(raw))
      ) {
        pushCandidate(raw, c, 'rowText');
      }
    }
    const studentFormsCandidates = candidates.filter((item) => isStudentFormsUrl(item.url));
    if (studentFormsCandidates.length) {
      studentFormsCandidates.sort((a, b) => b.score - a.score);
      return studentFormsCandidates[0].url;
    }
    const nonCreditCandidates = candidates.filter((item) => !isCreditTransferUrl(item.url));
    if (nonCreditCandidates.length) {
      nonCreditCandidates.sort((a, b) => b.score - a.score);
      return nonCreditCandidates[0].url;
    }
    return '';
  };

  const buildPreviewRow = (r) => {
    const idVal = idIdx !== undefined ? getCellText(r, idIdx) : '';
    const familyVal = familyIdx !== undefined ? getCellText(r, familyIdx) : '';
    const givenVal = givenIdx !== undefined ? getCellText(r, givenIdx) : '';
    const parts = [idVal, familyVal, givenVal].filter(Boolean);
    if (parts.length) return parts.join(' | ');
    const fallback = [];
    for (let c = range.s.c; c <= maxScanCol; c += 1) {
      const value = getCellText(r, c);
      if (value) fallback.push(value);
      if (fallback.length >= TRIAGE_MAX_PREVIEW_COLS) break;
    }
    return fallback.join(' | ');
  };

  const maxRow = Math.min(range.e.r, headerRowIndex + TRIAGE_ROW_LIMIT);
  for (let r = headerRowIndex + 1; r <= maxRow; r += 1) {
    if (previewRows.length < 10) {
      const preview = buildPreviewRow(r);
      if (preview) previewRows.push(preview);
    }
    const rawId = getCellText(r, idIdx);
    const normalizedId = normalizeStudentId(rawId);
    if (!normalizedId) continue;
    const result = {};
    Object.entries(fields).forEach(([key, idx]) => {
      if (idx === undefined) return;
      const value = getCellText(r, idx);
      if (!value) return;
      result[key] = value;
    });
    if (fields.onSharePoint !== undefined) {
      const cell = getCellObject(r, fields.onSharePoint);
      const display = cell?.w ? String(cell.w).trim() : '';
      if (display) {
        result.onSharePoint = display;
      }
      const sharePointPathCell =
        sharePointPathIdx !== undefined ? getCellObject(r, sharePointPathIdx) : null;
      const sharePointPathRaw =
        sharePointPathIdx !== undefined ? getCellText(r, sharePointPathIdx) : '';
      const link = pickTriageOnSharePointLink(
        r,
        [
          {
            url: getCellHyperlink(cell, sheet, workbook),
            colIndex: fields.onSharePoint,
            source: 'onSharePointCell',
          },
          {
            url: getCellHyperlink(sharePointPathCell, sheet, workbook),
            colIndex: sharePointPathIdx,
            source: 'sharePointPathCell',
          },
          {
            url: sharePointPathRaw,
            colIndex: sharePointPathIdx,
            source: 'sharePointPathText',
          },
        ]
      );
      if (link) {
        result.onSharePointLink = link;
      }
    }
    if (Object.keys(result).length) {
      const existingEntry = records.find((entry) => entry?.[0] === normalizedId);
      if (existingEntry) {
        const existing = existingEntry[1] || {};
        const merged = { ...existing, ...result };
        if (
          !result.onSharePointLink &&
          existing.onSharePointLink &&
          result.onSharePoint &&
          existing.onSharePoint &&
          result.onSharePoint !== existing.onSharePoint
        ) {
          delete merged.onSharePointLink;
        }
        existingEntry[1] = merged;
      } else {
        records.push([normalizedId, result]);
      }
    }
  }
  parseInfo = {
    status: 'ok',
    headerFound: true,
    idIdx,
    total: records.length,
    preview: previewRows.length,
  };
  return { records, previewRows, parseInfo };
};

const parseTriageWorkbookBuffer = (buffer, mode) => {
  const records = [];
  const previewRows = [];
  let parseInfo = { status: 'not parsed', headerFound: false, idIdx: null, total: 0, preview: 0 };
  if (!buffer) return { records, previewRows, parseInfo };
  const readAndParse = (options) => {
    const workbook = XLSX.read(buffer, options);
    const sheet =
      workbook.Sheets?.Triage ||
      workbook.Sheets?.TRIAGE ||
      workbook.Sheets?.triage ||
      null;
    const ref = sheet?.['!ref'];
    return parseTriageWorkbookFromSheet(sheet, ref, mode, workbook);
  };
  const fastResult = readAndParse({
    type: 'array',
    cellStyles: false,
    cellText: true,
    cellFormula: true,
    cellHTML: true,
    cellNF: false,
    dense: false,
    sheetRows: TRIAGE_READ_MAX_ROWS,
    sheets: TRIAGE_SHEET_NAMES,
  });
  if (fastResult?.parseInfo?.headerFound && fastResult?.parseInfo?.total === 0) {
    return readAndParse({
      type: 'array',
      cellStyles: false,
      cellText: true,
      cellNF: false,
      dense: false,
      sheetRows: TRIAGE_READ_MAX_ROWS,
      sheets: TRIAGE_SHEET_NAMES,
    });
  }
  return fastResult;
};

try {
  importScripts('vendor/xlsx.full.min.js');
} catch (error) {
  self.postMessage({
    type: 'workbookParsed',
    ok: false,
    error: error?.message || 'Worker failed to load workbook parser.',
  });
}

self.onmessage = (event) => {
  const data = event?.data || {};
  if (data.type === 'parseWorkbook') {
    try {
      const result = parseWorkbook(data.buffer);
      self.postMessage({
        type: 'workbookParsed',
        ok: true,
        records: result.records,
        courseInfo: result.courseInfo,
      });
    } catch (error) {
      self.postMessage({
        type: 'workbookParsed',
        ok: false,
        error: error?.message || 'Workbook parse failed.',
      });
    }
  }
  if (data.type === 'parseTriage') {
    try {
      const mode = data.mode === 'full' ? 'full' : 'fast';
      const result = parseTriageWorkbookBuffer(data.buffer, mode);
      self.postMessage({
        type: 'triageParsed',
        ok: true,
        records: result.records,
        previewRows: result.previewRows,
        parseInfo: result.parseInfo,
      });
    } catch (error) {
      self.postMessage({
        type: 'triageParsed',
        ok: false,
        error: error?.message || 'Triage parse failed.',
      });
    }
  }
};
