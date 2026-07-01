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

function getRangeValues(sheet, rangeRef, columnName) {
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
    const cell = sheet[cellAddress];
    values.push(cell ? cell.v : '');
  }
  const normalized = values.map((value) => (value ?? '').toString().trim());
  const headerMarker = columnName.replace(/_/g, ' ').split(' ')[0].toLowerCase();
  if (normalized.length && headerMarker && normalized[0].toLowerCase().includes(headerMarker)) {
    normalized.shift();
  }
  while (normalized.length && normalized[0] === '') {
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
  const columnMap = {};
  names.forEach((nameEntry) => {
    if (!nameEntry?.Name || !nameEntry.Ref) return;
    const nameKey = resolveNamedRangeKey(nameEntry.Name, STUDENT_COLUMNS);
    if (!nameKey) return;
    const cleanedRef = stripRangeRef(nameEntry.Ref);
    const refParts = cleanedRef.split('!');
    const refSheetName = refParts.length > 1 ? refParts[0] : '';
    if (refSheetName && refSheetName !== sheetName) return;
    columnMap[nameKey] = getRangeValues(sheet, nameEntry.Ref, nameKey);
  });
  let rowCount = Math.max(0, ...Object.values(columnMap).map((values) => values.length), 0);
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (rows.length > 1 && rowCount === 0) {
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
    if (headerIndex >= 0) {
      const headerRow = rows[headerIndex] || [];
      const colIndexMap = {};
      headerRow.forEach((cell, idx) => {
        const key = columnKeyMap[normalizeHeader(cell)];
        if (key && colIndexMap[key] === undefined) colIndexMap[key] = idx;
      });
      const rowsToRead = rows.slice(headerIndex + 1);
      const hasStudentId = colIndexMap.Student_IDs_Unique !== undefined;
      if (hasStudentId) {
        columnMap = {};
        STUDENT_COLUMNS.forEach((columnName) => {
          const idx = colIndexMap[columnName];
          if (idx === undefined) return;
          columnMap[columnName] = rowsToRead.map((row) => {
            const cellValue = row[idx];
            return typeof cellValue === 'string' ? cellValue.trim() : cellValue ?? '';
          });
        });
        rowCount = Math.max(0, ...Object.values(columnMap).map((values) => values.length), 0);
      }
    }
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
    const values = getRangeValues(refSheet, nameEntry.Ref, nameKey);
    const value = values.find((val) => val !== '') ?? '';
    info[nameKey] = value;
  });
  return info;
}

const parseWorkbook = (buffer) => {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellStyles: false,
    cellText: false,
    cellNF: false,
    dense: true,
    sheetRows: TRIAGE_READ_MAX_ROWS,
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
      const target = normalizeHeadingText(label);
      const match = Object.entries(headerMap).find(([key]) =>
        key === target || key.includes(target) || target.includes(key)
      );
      if (match) return match[1];
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
    statusLabel: getIdxAny('Int, Ongoing, FMP', 'Int Ongoing FMP', 'Int, Ongiong, FMP'),
    statusDetails: getIdx('Details - CRT, Ongoing, Domestic, etc.'),
    alteredStatus: getIdx('Altered Status'),
    onSharePoint: getIdx('On SharePoint'),
    inStrata: getIdx('In Strata (Enrolled) - subject list'),
    comments: getIdx('Comments'),
    familyName: getIdx('Family Names'),
    givenName: getIdx('Given Names'),
    primaryEmail: getIdxAny('Primary Email', 'Personal Email', 'Email'),
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
    commentsIdx: fields.comments ?? null,
    fieldIdx: fields,
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

const decodeUtf8 = (content) => new TextDecoder('utf-8').decode(content);
const encodeUtf8 = (text) => new TextEncoder().encode(text);
const escapeXmlText = (text) =>
  String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
const unescapeXmlText = (text) =>
  String(text || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
const getZipEntry = (cfb, path) =>
  XLSX.CFB.find(cfb, path) ||
  XLSX.CFB.find(cfb, `/${path}`) ||
  null;
const getZipEntryText = (cfb, path) => {
  const entry = getZipEntry(cfb, path);
  return entry?.content ? decodeUtf8(entry.content) : '';
};
const removeZipEntry = (cfb, path) => {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  const matches = (value) => String(value || '').replace(/^Root Entry\/?/, '').replace(/^\/+/, '') === cleanPath;
  if (
    Array.isArray(cfb?.FileIndex) &&
    Array.isArray(cfb?.FullPaths) &&
    cfb.FileIndex.length === cfb.FullPaths.length
  ) {
    const nextFileIndex = [];
    const nextFullPaths = [];
    cfb.FileIndex.forEach((entry, index) => {
      if (matches(cfb.FullPaths[index]) || matches(entry?.name)) return;
      nextFileIndex.push(entry);
      nextFullPaths.push(cfb.FullPaths[index]);
    });
    cfb.FileIndex = nextFileIndex;
    cfb.FullPaths = nextFullPaths;
  }
};
const removeCalcChainFromWorkbookPackage = (cfb) => {
  removeZipEntry(cfb, 'xl/calcChain.xml');
  const relsEntry = getZipEntry(cfb, 'xl/_rels/workbook.xml.rels');
  if (relsEntry?.content) {
    const xml = decodeUtf8(relsEntry.content).replace(
      /<Relationship\b[^>]*(?:Type="[^"]*\/calcChain"|Target="calcChain\.xml")[^>]*\/>/g,
      ''
    );
    relsEntry.content = encodeUtf8(xml);
    relsEntry.size = relsEntry.content.length;
  }
  const contentTypesEntry = getZipEntry(cfb, '[Content_Types].xml');
  if (contentTypesEntry?.content) {
    const xml = decodeUtf8(contentTypesEntry.content).replace(
      /<Override\b[^>]*PartName="\/xl\/calcChain\.xml"[^>]*\/>/g,
      ''
    );
    contentTypesEntry.content = encodeUtf8(xml);
    contentTypesEntry.size = contentTypesEntry.content.length;
  }
};
const resolveWorkbookTarget = (target) => {
  const clean = String(target || '').replace(/^\/+/, '');
  return clean.startsWith('xl/') ? clean : `xl/${clean}`;
};
const getXmlAttr = (xml, name) => {
  const match = String(xml || '').match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
  return match ? unescapeXmlText(match[1]) : '';
};
const colIndexFromCellRef = (ref) => {
  const letters = String(ref || '').match(/^[A-Z]+/i)?.[0] || '';
  let value = 0;
  for (let i = 0; i < letters.length; i += 1) {
    value = value * 26 + (letters.toUpperCase().charCodeAt(i) - 64);
  }
  return value - 1;
};
const readSharedStrings = (cfb) => {
  const xml = getZipEntryText(cfb, 'xl/sharedStrings.xml');
  if (!xml) return [];
  const strings = [];
  const siRegex = /<si\b[\s\S]*?<\/si>/g;
  let match = null;
  while ((match = siRegex.exec(xml))) {
    const parts = [];
    const tRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
    let tMatch = null;
    while ((tMatch = tRegex.exec(match[0]))) parts.push(unescapeXmlText(tMatch[1]));
    strings.push(parts.join(''));
  }
  return strings;
};
const getCellTextFromXml = (cellXml, sharedStrings) => {
  if (!cellXml) return '';
  const type = getXmlAttr(cellXml, 't');
  if (type === 'inlineStr') {
    const text = cellXml.match(/<is\b[\s\S]*?<t\b[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/)?.[1] || '';
    return unescapeXmlText(text);
  }
  const rawValue = cellXml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] || '';
  if (type === 's') return sharedStrings[Number(rawValue)] || '';
  return unescapeXmlText(rawValue);
};
const findTriageSheetPath = (cfb) => {
  const workbookXml = getZipEntryText(cfb, 'xl/workbook.xml');
  const relsXml = getZipEntryText(cfb, 'xl/_rels/workbook.xml.rels');
  if (!workbookXml || !relsXml) return '';
  const sheetRegex = /<sheet\b[^>]*>/g;
  let sheetMatch = null;
  let relId = '';
  while ((sheetMatch = sheetRegex.exec(workbookXml))) {
    const sheetTag = sheetMatch[0];
    const name = getXmlAttr(sheetTag, 'name');
    if (!TRIAGE_SHEET_NAMES.some((candidate) => candidate.toLowerCase() === name.toLowerCase())) continue;
    relId = getXmlAttr(sheetTag, 'r:id');
    break;
  }
  if (!relId) return '';
  const relRegex = /<Relationship\b[^>]*>/g;
  let relMatch = null;
  while ((relMatch = relRegex.exec(relsXml))) {
    const relTag = relMatch[0];
    if (getXmlAttr(relTag, 'Id') === relId) return resolveWorkbookTarget(getXmlAttr(relTag, 'Target'));
  }
  return '';
};
const updateCellInSheetXml = (sheetXml, cellRef, nextValue) => {
  const rowNumber = Number(String(cellRef).match(/\d+$/)?.[0] || 0);
  if (!rowNumber) return { ok: false, error: 'Target row was not found.' };
  const rowRegex = new RegExp(`<row\\b[^>]*\\br="${rowNumber}"[^>]*>[\\s\\S]*?<\\/row>`);
  const rowMatch = sheetXml.match(rowRegex);
  if (!rowMatch) return { ok: false, error: 'Target row XML was not found.' };
  const rowXml = rowMatch[0];
  const cellRegex = new RegExp(`<c\\b[^>]*\\br="${cellRef}"[^>]*>[\\s\\S]*?<\\/c>`);
  const cellMatch = rowXml.match(cellRegex);
  const styleAttr = cellMatch ? (cellMatch[0].match(/\bs="[^"]*"/)?.[0] || '') : '';
  const stylePart = styleAttr ? ` ${styleAttr}` : '';
  const newCell = `<c r="${cellRef}"${stylePart} t="inlineStr"><is><t xml:space="preserve">${escapeXmlText(nextValue)}</t></is></c>`;
  let nextRowXml = '';
  if (cellMatch) {
    nextRowXml = rowXml.replace(cellRegex, newCell);
  } else {
    const targetCol = colIndexFromCellRef(cellRef);
    const cells = Array.from(rowXml.matchAll(/<c\b[^>]*\br="([A-Z]+\d+)"[^>]*>[\s\S]*?<\/c>/g));
    const insertBefore = cells.find((cell) => colIndexFromCellRef(cell[1]) > targetCol);
    nextRowXml = insertBefore
      ? rowXml.replace(insertBefore[0], `${newCell}${insertBefore[0]}`)
      : rowXml.replace('</row>', `${newCell}</row>`);
  }
  return { ok: true, xml: sheetXml.replace(rowXml, nextRowXml) };
};

const getTriageEditableColumns = (sheetXml, sharedStrings, parseInfo, requestedKeys) => {
  let idCol = Number.isFinite(Number(parseInfo?.idIdx)) ? Number(parseInfo.idIdx) : null;
  const fieldCols = {
    friendlyName: Number.isFinite(Number(parseInfo?.fieldIdx?.friendlyName)) ? Number(parseInfo.fieldIdx.friendlyName) : null,
    handledBy: Number.isFinite(Number(parseInfo?.fieldIdx?.handledBy)) ? Number(parseInfo.fieldIdx.handledBy) : null,
    alteredStatus: Number.isFinite(Number(parseInfo?.fieldIdx?.alteredStatus)) ? Number(parseInfo.fieldIdx.alteredStatus) : null,
    statusDetails: Number.isFinite(Number(parseInfo?.fieldIdx?.statusDetails)) ? Number(parseInfo.fieldIdx.statusDetails) : null,
    comments: Number.isFinite(Number(parseInfo?.commentsIdx)) ? Number(parseInfo.commentsIdx) : null,
    familyName: Number.isFinite(Number(parseInfo?.fieldIdx?.familyName)) ? Number(parseInfo.fieldIdx.familyName) : null,
    givenName: Number.isFinite(Number(parseInfo?.fieldIdx?.givenName)) ? Number(parseInfo.fieldIdx.givenName) : null,
    primaryEmail: Number.isFinite(Number(parseInfo?.fieldIdx?.primaryEmail)) ? Number(parseInfo.fieldIdx.primaryEmail) : null,
  };
  if (idCol === null || requestedKeys.some((key) => fieldCols[key] === null)) {
    const headerRows = Array.from(sheetXml.matchAll(/<row\b[^>]*>[\s\S]*?<\/row>/g)).slice(0, 200);
    for (const rowMatch of headerRows) {
      const cells = Array.from(rowMatch[0].matchAll(/<c\b[^>]*\br="([A-Z]+\d+)"[^>]*>[\s\S]*?<\/c>/g));
      for (const cell of cells) {
        const c = colIndexFromCellRef(cell[1]);
        const value = normalizeHeadingText(getCellTextFromXml(cell[0], sharedStrings));
        if (!value) continue;
        if (idCol === null && ['studentidasstring', 'studentid', 'student_id'].includes(value)) idCol = c;
        if (fieldCols.friendlyName === null && value === 'friendlyname') fieldCols.friendlyName = c;
        if (fieldCols.handledBy === null && value === 'handledby') fieldCols.handledBy = c;
        if (fieldCols.alteredStatus === null && value === 'alteredstatus') fieldCols.alteredStatus = c;
        if (fieldCols.statusDetails === null && value === 'detailscrtongoingdomesticetc') fieldCols.statusDetails = c;
        if (fieldCols.comments === null && value === 'comments') fieldCols.comments = c;
        if (fieldCols.familyName === null && value === 'familynames') fieldCols.familyName = c;
        if (fieldCols.givenName === null && value === 'givennames') fieldCols.givenName = c;
        if (fieldCols.primaryEmail === null && ['primaryemail', 'personalemail', 'email'].includes(value)) fieldCols.primaryEmail = c;
      }
      if (idCol !== null && requestedKeys.every((key) => fieldCols[key] !== null)) break;
    }
  }
  return { idCol, fieldCols };
};

const getMaxUsedColInSheetXml = (sheetXml) => {
  let maxCol = 0;
  const cells = String(sheetXml || '').matchAll(/<c\b[^>]*\br="([A-Z]+\d+)"[^>]*>/g);
  for (const cell of cells) maxCol = Math.max(maxCol, colIndexFromCellRef(cell[1]));
  return maxCol;
};

const getRowValuesFromSheetXml = (sheetXml, rowNumber, sharedStrings, maxCol) => {
  const rowXml = String(sheetXml || '').match(new RegExp(`<row\\b[^>]*\\br="${rowNumber}"[^>]*>[\\s\\S]*?<\\/row>`))?.[0] || '';
  const values = Array.from({ length: Math.max(0, maxCol + 1) }, () => '');
  const cells = rowXml.matchAll(/<c\b[^>]*\br="([A-Z]+\d+)"[^>]*>[\s\S]*?<\/c>/g);
  for (const cell of cells) {
    const col = colIndexFromCellRef(cell[1]);
    if (col >= 0 && col < values.length) values[col] = getCellTextFromXml(cell[0], sharedStrings);
  }
  return values;
};

const getColumnHeadingKeyFromSheetXml = (sheetXml, sharedStrings, colIndex) => {
  const colName = XLSX.utils.encode_col(colIndex);
  const rows = Array.from(String(sheetXml || '').matchAll(/<row\b[^>]*>[\s\S]*?<\/row>/g)).slice(0, 200);
  for (const row of rows) {
    const rowNumber = row[0].match(/\br="(\d+)"/)?.[1];
    if (!rowNumber) continue;
    const cell = row[0].match(new RegExp(`<c\\b[^>]*\\br="${colName}${rowNumber}"[^>]*>[\\s\\S]*?<\\/c>`))?.[0] || '';
    const heading = normalizeHeader(getCellTextFromXml(cell, sharedStrings));
    if (heading) return heading;
  }
  return '';
};

const getProtectedTriageWriteColumns = (sheetXml, sharedStrings) => {
  const protectedColumns = new Set();
  const rows = Array.from(String(sheetXml || '').matchAll(/<row\b[^>]*>[\s\S]*?<\/row>/g)).slice(0, 200);
  for (const row of rows) {
    const cells = row[0].matchAll(/<c\b[^>]*\br="([A-Z]+\d+)"[^>]*>[\s\S]*?<\/c>/g);
    for (const cell of cells) {
      const heading = normalizeHeader(getCellTextFromXml(cell[0], sharedStrings));
      if (heading === 'fullname' || heading === 'email') {
        protectedColumns.add(colIndexFromCellRef(cell[1]));
      }
    }
  }
  return protectedColumns;
};

const getCellXmlFromSheetXml = (sheetXml, cellRef) =>
  String(sheetXml || '').match(new RegExp(`<c\\b[^>]*\\br="${cellRef}"[^>]*>[\\s\\S]*?<\\/c>`))?.[0] || '';

const prependTriageCommentToWorkbook = (buffer, studentId, comment, parseInfo = null) => {
  const values = updateTriageFieldValuesInWorkbook(buffer, studentId, { comments: comment }, parseInfo, {
    prependComment: true,
  });
  return values;
};

const updateTriageFieldValuesInWorkbook = (buffer, studentId, values = {}, parseInfo = null, options = {}) => {
  const cleanStudentId = normalizeStudentId(studentId);
  const cleanValues = {};
  ['friendlyName', 'handledBy', 'alteredStatus', 'statusDetails', 'comments', 'familyName', 'givenName', 'primaryEmail'].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      cleanValues[key] = String(values[key] ?? '').trim();
    }
  });
  console.info('[Triage save worker] start', {
    bufferBytes: buffer?.byteLength || null,
    studentId: cleanStudentId,
    commentLength: cleanValues.comments?.length || 0,
    parseInfo,
  });
  if (!buffer || !cleanStudentId) {
    return { ok: false, error: 'Missing student/comment data.' };
  }
  const packageBytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const cfb = XLSX.CFB.read(packageBytes, { type: 'buffer' });
  const sheetCount = (getZipEntryText(cfb, 'xl/workbook.xml').match(/<sheet\b/g) || []).length;
  const sheetPath = findTriageSheetPath(cfb);
  const sheetEntry = sheetPath ? getZipEntry(cfb, sheetPath) : null;
  if (!sheetPath || !sheetEntry?.content) return { ok: false, error: 'Triage sheet XML was not found.', sheetCount };
  let sheetXml = decodeUtf8(sheetEntry.content);
  const sharedStrings = readSharedStrings(cfb);
  console.info('[Triage save worker] package read', { sheetCount, sheetPath, sharedStringCount: sharedStrings.length });

  const requestedKeys = Object.keys(cleanValues);
  const { idCol, fieldCols } = getTriageEditableColumns(sheetXml, sharedStrings, parseInfo, requestedKeys);
  if (idCol === null || requestedKeys.some((key) => fieldCols[key] === null)) {
    return { ok: false, error: 'One or more editable Triage columns were not found.' };
  }
  console.info('[Triage save worker] columns found', { idCol, fieldCols });

  let targetRow = -1;
  const idColName = XLSX.utils.encode_col(5);
  const idCellRegex = new RegExp(`<c\\b[^>]*\\br="${idColName}(\\d+)"[^>]*>[\\s\\S]*?<\\/c>`, 'g');
  let idMatch = null;
  while ((idMatch = idCellRegex.exec(sheetXml))) {
    if (normalizeStudentId(getCellTextFromXml(idMatch[0], sharedStrings)) === cleanStudentId) {
      targetRow = Number(idMatch[1]);
      break;
    }
  }
  if (targetRow < 0) return { ok: false, error: 'This student was not found in Triage.' };
  console.info('[Triage save worker] row found', { targetRow });
  const maxCol = getMaxUsedColInSheetXml(sheetXml);
  const oldRow = getRowValuesFromSheetXml(sheetXml, targetRow, sharedStrings, maxCol);

  const nextValues = { ...cleanValues };
  if (options.prependComment) {
    const commentAddress = `${XLSX.utils.encode_col(fieldCols.comments)}${targetRow}`;
    const existingCell = sheetXml.match(new RegExp(`<c\\b[^>]*\\br="${commentAddress}"[^>]*>[\\s\\S]*?<\\/c>`))?.[0] || '';
    const existing = getCellTextFromXml(existingCell, sharedStrings).trim();
    nextValues.comments = existing ? `${cleanValues.comments}\n${existing}` : cleanValues.comments;
  }
  for (const [key, value] of Object.entries(nextValues)) {
    const col = fieldCols[key];
    const updated = updateCellInSheetXml(sheetXml, `${XLSX.utils.encode_col(col)}${targetRow}`, value);
    if (!updated.ok) return { ok: false, error: updated.error || 'Could not update Triage sheet XML.', sheetCount };
    sheetXml = updated.xml;
  }
  const newRow = getRowValuesFromSheetXml(sheetXml, targetRow, sharedStrings, maxCol);
  sheetEntry.content = encodeUtf8(sheetXml);
  sheetEntry.size = sheetEntry.content.length;
  removeCalcChainFromWorkbookPackage(cfb);
  const output = XLSX.CFB.write(cfb, { fileType: 'zip', type: 'array', compression: true });
  console.info('[Triage save worker] package written', { outputBytes: output?.byteLength || null, sheetCount });
  return { ok: true, output, next: nextValues.comments, values: nextValues, oldRow, newRow, sheetCount };
};

const addTriageRowToWorkbook = (buffer, studentId, values = {}, parseInfo = null) => {
  const cleanStudentId = normalizeStudentId(studentId || values.studentId);
  const cleanValues = {};
  ['friendlyName', 'handledBy', 'alteredStatus', 'statusDetails', 'comments', 'familyName', 'givenName'].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      cleanValues[key] = String(values[key] ?? '').trim();
    }
  });
  if (!buffer || !cleanStudentId) return { ok: false, error: 'Missing student data.' };
  const packageBytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const cfb = XLSX.CFB.read(packageBytes, { type: 'buffer' });
  const sheetCount = (getZipEntryText(cfb, 'xl/workbook.xml').match(/<sheet\b/g) || []).length;
  const sheetPath = findTriageSheetPath(cfb);
  const sheetEntry = sheetPath ? getZipEntry(cfb, sheetPath) : null;
  if (!sheetPath || !sheetEntry?.content) return { ok: false, error: 'Triage sheet XML was not found.', sheetCount };
  let sheetXml = decodeUtf8(sheetEntry.content);
  const sharedStrings = readSharedStrings(cfb);
  const requestedKeys = Object.keys(cleanValues);
  const { idCol, fieldCols } = getTriageEditableColumns(sheetXml, sharedStrings, parseInfo, requestedKeys);
  if (idCol === null || requestedKeys.some((key) => fieldCols[key] === null)) {
    return { ok: false, error: 'One or more editable Triage columns were not found.', sheetCount };
  }

  const idColName = XLSX.utils.encode_col(5);
  const idCellRegex = new RegExp(`<c\\b[^>]*\\br="${idColName}(\\d+)"[^>]*>[\\s\\S]*?<\\/c>`, 'g');
  let idMatch = null;
  while ((idMatch = idCellRegex.exec(sheetXml))) {
    if (normalizeStudentId(getCellTextFromXml(idMatch[0], sharedStrings)) === cleanStudentId) {
      return { ok: false, error: 'This student is already in Triage.', sheetCount };
    }
  }

  const freeColName = 'D';
  let targetRow = -1;
  const rows = Array.from(sheetXml.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>[\s\S]*?<\/row>/g));
  for (const rowMatch of rows) {
    const rowNumber = Number(rowMatch[1]);
    if (rowNumber <= 4) continue;
    const freeCell = rowMatch[0].match(new RegExp(`<c\\b[^>]*\\br="${freeColName}${rowNumber}"[^>]*>[\\s\\S]*?<\\/c>`))?.[0] || '';
    if (!getCellTextFromXml(freeCell, sharedStrings).trim()) {
      targetRow = rowNumber;
      break;
    }
  }
  if (targetRow < 0) {
    return { ok: false, error: 'No existing blank Triage row was found in column D below row 4.', sheetCount };
  }

  const familyName = cleanValues.familyName || '-';
  const givenName = cleanValues.givenName || '-';
  const rowValues = {
    ...cleanValues,
    familyName,
    givenName,
    studentId: cleanStudentId,
  };
  const columns = { ...fieldCols, studentId: 5 };
  const protectedColumns = getProtectedTriageWriteColumns(sheetXml, sharedStrings);
  const maxCol = getMaxUsedColInSheetXml(sheetXml);
  const oldRow = getRowValuesFromSheetXml(sheetXml, targetRow, sharedStrings, maxCol);
  for (const [key, value] of Object.entries(rowValues)) {
    const col = columns[key];
    if (col === null || col === undefined) continue;
    const cellRef = `${XLSX.utils.encode_col(col)}${targetRow}`;
    const existingCell = getCellXmlFromSheetXml(sheetXml, cellRef);
    if (protectedColumns.has(col) || /<f\b/i.test(existingCell)) continue;
    const updated = updateCellInSheetXml(sheetXml, cellRef, value);
    if (!updated.ok) return { ok: false, error: updated.error || 'Could not add Triage row.', sheetCount };
    sheetXml = updated.xml;
  }

  const newRow = getRowValuesFromSheetXml(sheetXml, targetRow, sharedStrings, maxCol);
  sheetEntry.content = encodeUtf8(sheetXml);
  sheetEntry.size = sheetEntry.content.length;
  removeCalcChainFromWorkbookPackage(cfb);
  const output = XLSX.CFB.write(cfb, { fileType: 'zip', type: 'array', compression: true });
  return { ok: true, output, values: rowValues, oldRow, newRow, targetRow, sheetCount };
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
  if (data.type === 'prependTriageComment') {
    try {
      const result = prependTriageCommentToWorkbook(data.buffer, data.studentId, data.comment, data.parseInfo);
      const transfer = result.output instanceof ArrayBuffer ? [result.output] : [];
      self.postMessage({
        type: 'triageCommentPrepended',
        ok: !!result.ok,
        output: result.output || null,
        next: result.next || '',
        oldRow: result.oldRow || null,
        newRow: result.newRow || null,
        error: result.error || '',
        sheetCount: result.sheetCount || null,
      }, transfer);
    } catch (error) {
      self.postMessage({
        type: 'triageCommentPrepended',
        ok: false,
        error: error?.message || 'Triage comment update failed.',
      });
    }
  }
  if (data.type === 'updateTriageFields') {
    try {
      const result = updateTriageFieldValuesInWorkbook(data.buffer, data.studentId, data.values || {}, data.parseInfo);
      const transfer = result.output instanceof ArrayBuffer ? [result.output] : [];
      self.postMessage({
        type: 'triageFieldsUpdated',
        ok: !!result.ok,
        output: result.output || null,
        values: result.values || null,
        oldRow: result.oldRow || null,
        newRow: result.newRow || null,
        error: result.error || '',
        sheetCount: result.sheetCount || null,
      }, transfer);
    } catch (error) {
      self.postMessage({
        type: 'triageFieldsUpdated',
        ok: false,
        error: error?.message || 'Triage field update failed.',
      });
    }
  }
  if (data.type === 'addTriageRow') {
    try {
      const result = addTriageRowToWorkbook(data.buffer, data.studentId, data.values || {}, data.parseInfo);
      const transfer = result.output instanceof ArrayBuffer ? [result.output] : [];
      self.postMessage({
        type: 'triageRowAdded',
        ok: !!result.ok,
        output: result.output || null,
        values: result.values || null,
        oldRow: result.oldRow || null,
        newRow: result.newRow || null,
        targetRow: result.targetRow || null,
        error: result.error || '',
        sheetCount: result.sheetCount || null,
      }, transfer);
    } catch (error) {
      self.postMessage({
        type: 'triageRowAdded',
        ok: false,
        error: error?.message || 'Triage row add failed.',
      });
    }
  }
};
