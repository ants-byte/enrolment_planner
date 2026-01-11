/*

Author: Antony Di Serio
Created: December 30, 2025

Behaviour: subject selection, completion mode, prerequisite gating, tooltips, timetable modal

*/
(() => {
  const subjects = Array.from(
    document.querySelectorAll('.main-grid .subject-card, .electives-grid .subject-card')
  ).filter((cell) => !cell.classList.contains('info-card'));
  const parseSlot = (slot = '') => {
    const match = /^r(\d+)c(\d+)$/i.exec(slot.trim());
    if (!match) return null;
    return { row: Number(match[1]), col: Number(match[2]) };
  };
  const compareSlotCells = (a, b) => {
    const aSlot = parseSlot(a?.dataset?.slot || '');
    const bSlot = parseSlot(b?.dataset?.slot || '');
    if (!aSlot && !bSlot) return 0;
    if (!aSlot) return 1;
    if (!bSlot) return -1;
    if (aSlot.row !== bSlot.row) return aSlot.row - bSlot.row;
    return aSlot.col - bSlot.col;
  };
  const applySlotPosition = (cell) => {
    const slot = parseSlot(cell?.dataset?.slot || '');
    if (!slot || !cell) return;
    cell.style.gridRow = `${slot.row}`;
    cell.style.gridColumn = `${slot.col}`;
  };
  const normalizeSlotCells = (container) => {
    if (!container) return [];
    const cells = Array.from(container.querySelectorAll('[data-slot]'));
    cells.sort(compareSlotCells);
    cells.forEach((cell) => {
      applySlotPosition(cell);
      container.appendChild(cell);
    });
    return cells;
  };
  const mainGrid = document.querySelector('.main-grid');
  const electivesGrid = document.querySelector('.electives-grid');
  const isElectivesGridCell = (cell) => !!(cell && electivesGrid && electivesGrid.contains(cell));
  const mainGridCells = normalizeSlotCells(mainGrid);
  const mainGridSlots = new Map(mainGridCells.map((cell) => [cell.dataset.slot, cell]));
  const electivePlaceholderOrder = ['ELECTIVE1', 'ELECTIVE2', 'ELECTIVE3', 'ELECTIVE4'];
  const electivePlaceholderCells = electivePlaceholderOrder
    .map((code) => subjects.find((cell) => cell.dataset.subject === code))
    .filter(Boolean);

  const prerequisites = {
    BIT105: [],
    BIT106: [],
    BIT108: [],
    BIT111: [],
    BIT112: [],
    BIT121: [],
    BIT230: ['BIT111', 'BIT106'],
    BIT231: ['BIT111'],
    BIT233: ['BIT121'],
    BIT236: ['BIT231', 'BIT106'],
    BIT235: ['BIT245', 'BIT111'],
    BIT241: ['BIT106', 'BIT105'],
    BIT242: ['BIT230'],
    BIT213: [],
    BIT244: ['BIT106'],
    BIT245: ['BIT111'],
    BIT246: ['BIT235'],
    BIT351: ['BIT235', 'BIT231'],
    BIT352: ['BIT242'],
    BIT353: ['BIT233'],
    BIT313: ['BIT213'],
    BIT355: ['BIT236', 'BIT230'],
    BIT356: ['BIT236', 'BIT230'],
    BIT357: ['BIT230'],
    BIT358: ['BIT231'],
    BIT314: ['BIT241'],
    BIT362: ['BIT213'],
    BIT363: ['BIT245', 'BIT230'],
    BIT364: ['BIT231'],
    BIT371: ['BIT242'],
    BIT372: ['BIT371'],
  };
  const corequisites = {
    BIT213: ['BIT121'],
  };
  const programRequirements = { total: 24, core: 14, major: 6, elective: 4 };
  let currentMajorKey = 'ns';
  let currentMajorValue = 'undecided';
  const majorConfig = {
    ns: {
      codes: ['BIT213', 'BIT233', 'BIT353', 'BIT244', 'BIT362', 'BIT313'],
      typeClass: 'network',
    },
    ba: {
      codes: ['BIT245', 'BIT236', 'BIT357', 'BIT356', 'BIT363', 'BIT355'],
      typeClass: 'ba',
    },
    sd: {
      codes: ['BIT245', 'BIT235', 'BIT246', 'BIT358', 'BIT364', 'BIT351'],
      typeClass: 'software',
    },
  };
  const mainGridLayout = [
    ['BIT121', 'MAJOR', 'MAJOR', 'MAJOR', 'INFO'],
    ['BIT106', 'BIT108', 'MAJOR', 'MAJOR', 'BIT314'],
    ['BIT112', 'BIT231', 'BIT241', 'MAJOR', 'BIT352'],
    ['BIT111', 'BIT230', 'BIT242', 'BIT371', 'BIT372'],
    ['BIT105', 'ELECTIVE1', 'ELECTIVE2', 'ELECTIVE3', 'ELECTIVE4'],
  ];
  const majorLayouts = {
    ns: ['BIT213', 'BIT233', 'BIT353', 'BIT244', 'BIT362', 'BIT313'],
    ba: ['BIT245', 'BIT236', 'BIT357', 'BIT356', 'BIT363', 'BIT355'],
    sd: ['BIT245', 'BIT235', 'BIT246', 'BIT358', 'BIT364', 'BIT351'],
  };
  const electiveGridLayouts = {
    ns: [
      ['BIT245', null, null, null, null],
      ['BIT236', 'BIT355', 'BIT356', 'BIT357', 'BIT363'],
      ['BIT235', 'BIT246', 'BIT358', 'BIT364', 'BIT351'],
    ],
    ba: [
      ['BIT235', 'BIT246', 'BIT358', 'BIT364', 'BIT351'],
      [null, 'BIT213', 'BIT233', 'BIT353', null],
      [null, 'BIT244', 'BIT313', 'BIT362', null],
    ],
    sd: [
      ['BIT236', 'BIT355', 'BIT356', 'BIT357', 'BIT363'],
      [null, 'BIT213', 'BIT233', 'BIT353', null],
      [null, 'BIT244', 'BIT313', 'BIT362', null],
    ],
  };

  const timeSlots = {
    Morning: '8:30am - 12:30pm',
    Afternoon: '1:00pm - 5:00pm',
  };

  const timetable = {
    BIT106: { day: 'Monday', slot: 'Morning', room: 'PE226', teacher: 'Sarang Hashemi' },
    BIT372: { day: 'Monday', slot: 'Morning', room: 'PE302', teacher: 'Sazia, Sita, Tony, TBA' },
    BIT121: { day: 'Monday', slot: 'Afternoon', room: 'PE226', teacher: 'Russul Al-Anni' },
    BIT371: { day: 'Monday', slot: 'Afternoon', room: 'PE302', teacher: 'Sazia, Sita, Tony, TBA' },
    BIT105: { day: 'Tuesday', slot: 'Morning', room: 'PA113', teacher: 'Shzaa Niazi' },
    BIT313: { day: 'Tuesday', slot: 'Morning', room: 'PE226', teacher: 'Anthony Overmars' },
    BIT351: { day: 'Tuesday', slot: 'Morning', room: 'PA114', teacher: 'Uchenna Enwereonye' },
    BIT111: { day: 'Tuesday', slot: 'Afternoon', room: 'PA114', teacher: 'Uchenna Enwereonye' },
    BIT230: { day: 'Tuesday', slot: 'Afternoon', room: 'PE226', teacher: 'Sarang Hashemi' },
    BIT245: { day: 'Tuesday', slot: 'Afternoon', room: 'PA113', teacher: 'Antony Di Serio' },
    BIT353: { day: 'Tuesday', slot: 'Afternoon', room: 'PF340', teacher: 'Anthony Overmars' },
    BIT112: { day: 'Wednesday', slot: 'Morning', room: 'PA114', teacher: 'Dominic Mammone' },
    BIT244: { day: 'Wednesday', slot: 'Morning', room: 'PE226', teacher: 'Russul Al-Anni' },
    BIT233: { day: 'Wednesday', slot: 'Afternoon', room: 'PA114', teacher: 'Yaona Zhao' },
    BIT235: { day: 'Wednesday', slot: 'Afternoon', room: 'PE226', teacher: 'Antony Di Serio' },
    BIT241: { day: 'Wednesday', slot: 'Afternoon', room: 'PF306', teacher: 'Dominic Mammone' },
    BIT362: { day: 'Wednesday', slot: 'Afternoon', room: 'BIT362', teacher: 'Nikki Wan' },
    BIT108: { day: 'Thursday', slot: 'Morning', room: 'PA114', teacher: 'Shzaa Niazi' },
    BIT231: { day: 'Thursday', slot: 'Morning', room: 'PA113', teacher: 'Nidha Qazi' },
    BIT357: { day: 'Thursday', slot: 'Morning', room: 'PE226', teacher: 'Ye Wei (Silva)' },
    BIT213: { day: 'Thursday', slot: 'Afternoon', room: 'PE226', teacher: 'Xiaodong Wang (Tony)' },
    BIT358: { day: 'Thursday', slot: 'Afternoon', room: 'PA113', teacher: 'Nidha Qazi' },
    BIT355: { day: 'Thursday', slot: 'Afternoon', room: 'PE303', teacher: 'Ye Wei (Silva)' },
    BIT242: { day: 'Friday', slot: 'Morning', room: 'PA114', teacher: 'Ye Wei (Silva)' },
    BIT352: { day: 'Friday', slot: 'Morning', room: 'PE226', teacher: 'David Robinson' },
    BIT314: { day: 'Friday', slot: 'Afternoon', room: 'PA113', teacher: 'David Robinson' },
    BIT236: { day: 'Friday', slot: 'Afternoon', room: 'PA114', teacher: 'Ye Wei (Silva)' },
  };

  const notRunningIds = new Set(['BIT246', 'BIT363', 'BIT356', 'BIT364']);

  const dependents = {};
  Object.keys(prerequisites).forEach((id) => { dependents[id] = []; });
  Object.entries(prerequisites).forEach(([course, prereqs]) => {
    prereqs.forEach((pre) => {
      if (!dependents[pre]) dependents[pre] = [];
      dependents[pre].push(course);
    });
  });

  const clearButton = document.getElementById('clear-selections');
  const completedModeButton = document.getElementById('toggle-completed-mode');
  const openInstructionsModal = document.getElementById('open-instructions-modal');
  const openCodeModal = document.getElementById('open-code-modal');
  const overrideToggle = document.getElementById('override-toggle');
  const overrideLabel = document.querySelector('.switch-label');
  const livePrereqToggle = document.getElementById('live-prereq-toggle');
  const livePrereqRow = document.getElementById('live-prereq-row');
  const showTimetableButton = document.getElementById('show-timetable');
  const showCourseTimetableButton = document.getElementById('show-course-timetable');
  const varyLoadButton = document.getElementById('vary-load');
  const errorButton = document.getElementById('btn-error');
  const warningButton = document.getElementById('btn-warning');
  const infoButton = document.getElementById('btn-info');
  const hideAllAlertButtons = () => {
    [errorButton, warningButton, infoButton].forEach((btn) => {
      if (btn) btn.classList.add('hidden');
    });
  };
  hideAllAlertButtons();
  const dropZone = document.getElementById('drop-zone');
  const timetableModal = document.getElementById('timetable-modal');
  const closeTimetable = document.getElementById('close-timetable');
  const hideTimetable = document.getElementById('hide-timetable');
  const copyTimetable = document.getElementById('copy-timetable');
  const timetableTitleEl = document.getElementById('timetable-title');
  const timetableTable = document.getElementById('timetable-table');
  const courseTimetableModal = document.getElementById('course-timetable-modal');
  const closeCourseTimetable = document.getElementById('close-course-timetable');
  const closeCourseTimetableCta = document.getElementById('close-course-timetable-cta');
  const courseTimetableContent = document.getElementById('course-timetable-content');
  const courseTimetableNotRunningList = document.getElementById('course-timetable-not-running-list');
  const courseTimetableListButton = document.getElementById('course-timetable-list');
  const courseTimetableGridButton = document.getElementById('course-timetable-grid');
  const copyCourseTimetableButton = document.getElementById('copy-course-timetable');
  const courseTimetableTeacherCopyButton = document.getElementById('course-timetable-teacher-copy');
  const instructionsModal = document.getElementById('instructions-modal');
  const closeInstructionsModal = document.getElementById('close-instructions-modal');
  const closeInstructionsCta = document.getElementById('close-instructions-cta');
  const codeModal = document.getElementById('code-modal');
  const closeCodeModal = document.getElementById('close-code-modal');
  const cancelCodeModal = document.getElementById('cancel-code-modal');
  const applyCodeModal = document.getElementById('apply-code-modal');
  const codeInput = document.getElementById('code-input');
  const loadModal = document.getElementById('load-modal');
  const closeLoadModal = document.getElementById('close-load-modal');
  const cancelLoadModal = document.getElementById('cancel-load-modal');
  const applyLoadModal = document.getElementById('apply-load-modal');
  const loadTypeDomestic = document.getElementById('load-type-domestic');
  const loadTypeInternational = document.getElementById('load-type-international');
  const loadExceptional = document.getElementById('load-exceptional');
  const loadValueInput = document.getElementById('load-value');
  const loadError = document.getElementById('load-error');
  const loadRemainingConfirm = document.getElementById('load-remaining-confirm');
  const loadLockMsg = document.getElementById('load-lock-msg');
  const alertModal = document.getElementById('alert-modal');
  const alertBody = document.getElementById('alert-body');
  const alertTitle = document.getElementById('alert-title');
  const closeAlert = document.getElementById('close-alert');
  const selectedListSection = document.getElementById('selected-list-section');
  const selectedListEl = document.getElementById('selected-list');
  const availableHeading = document.getElementById('available-heading');
  const resetSection = document.getElementById('reset-section');
  const nextSemList = document.getElementById('next-sem-list');
  const historyButton = document.getElementById('open-history');
  const nextSemesterButton = document.getElementById('open-next-semester');
  const historyModal = document.getElementById('history-modal');
  const historyTitleEl = document.getElementById('history-title');
  const historyTable = document.getElementById('history-table');
  const historySortButtons = Array.from(document.querySelectorAll('#history-table .subject-table-sort-button'));
  const closeHistory = document.getElementById('close-history');
  const closeHistoryCta = document.getElementById('close-history-cta');
  const copyHistory = document.getElementById('copy-history');
  const nextSemesterModal = document.getElementById('next-semester-modal');
  const nextSemesterTitleEl = document.getElementById('next-semester-title');
  const nextSemesterTable = document.getElementById('next-semester-table');
  const closeNextSemester = document.getElementById('close-next-semester');
  const closeNextSemesterCta = document.getElementById('close-next-semester-cta');
  const copyNextSemester = document.getElementById('copy-next-semester');
  const toggleSemCountsBtn = document.getElementById('toggle-sem-counts');
  if (toggleSemCountsBtn) toggleSemCountsBtn.textContent = 'Show semesters remaining';
  const electivesLabel = document.getElementById('electives-label');
  let modalLocked = false;
  let modalPrevStyle = null;
  let courseTimetableView = 'grid';
  const hoverTooltip = document.createElement('div');
  hoverTooltip.className = 'hover-tooltip';
  document.body.appendChild(hoverTooltip);
  let hoverTooltipTimer = null;
  const subjectMeta = {
    BIT105: { name: 'Business Enquiry & Communication', note: '', classes: ['core'] },
    BIT106: { name: 'Foundations of Software, Hardware & Cloud Computing', note: '', classes: ['core', 'sas'] },
    BIT108: { name: 'Foundations of Business', note: '', classes: ['core'] },
    BIT111: { name: 'Programming Concepts', note: '', classes: ['core'] },
    BIT112: { name: 'Mathematics for Information Technology', note: '', classes: ['core', 'sas'] },
    BIT121: { name: 'Network Communication Concepts', note: '', classes: ['core'] },
    BIT213: { name: 'Network & Cyber Security Essentials', note: 'Co-requisite: BIT121', classes: ['network'] },
    BIT230: { name: 'System Analysis & Design', note: 'Prerequisites: BIT106, BIT111', classes: ['core'] },
    BIT231: { name: 'Database Systems', note: 'Prerequisite: BIT111', classes: ['core', 'sas'] },
    BIT233: { name: 'Network Design', note: 'Prerequisite: BIT121', classes: ['network'] },
    BIT235: { name: 'Object Oriented Programming', note: 'Prerequisites: BIT245', classes: ['software'] },
    BIT236: { name: 'Enterprise Resources Planning', note: 'Prerequisite: BIT106, BIT231', classes: ['ba'] },
    BIT241: { name: 'Professional IT Practice & Ethics', note: 'Prerequisite: BIT121, BIT106', classes: ['core'] },
    BIT242: { name: 'IT Project Management', note: 'Prerequisite: BIT230', classes: ['core'] },
    BIT244: { name: 'IT & Business Crime', note: 'Prerequisite: BIT106', classes: ['network'] },
    BIT245: { name: 'Web Development', note: 'Prerequisites: BIT111', classes: ['dual-split'] },
    BIT246: { name: 'Object Oriented RAD', note: 'Prerequisites: BIT235', classes: ['software'] },
    BIT313: { name: 'Cyber Vulnerability & Hardening', note: 'Prerequisite: BIT213', classes: ['network'] },
    BIT314: { name: 'Cybersecurity Management & Governance', note: 'Prerequisite: BIT241', classes: ['core'] },
    BIT351: { name: 'Mobile Application Development', note: 'Prerequisites: BIT231, BIT235', classes: ['software'] },
    BIT352: { name: 'System Implementation & Service Management', note: 'Prerequisite: BIT242', classes: ['core'] },
    BIT353: { name: 'Network Architecture & Protocols', note: 'Prerequisite: BIT233', classes: ['network'] },
    BIT355: { name: 'Business Intelligence', note: 'Prerequisites: BIT230, BIT236', classes: ['ba', 'sas'] },
    BIT356: { name: 'Knowledge Management Systems', note: 'Prerequisites: BIT230, BIT236', classes: ['ba', 'sas'] },
    BIT357: { name: 'Business Analysis', note: 'Prerequisite: BIT230', classes: ['ba'] },
    BIT358: { name: 'Advanced Databases', note: 'Prerequisites: BIT231', classes: ['software', 'sas'] },
    BIT362: { name: 'Digital Forensics', note: 'Prerequisite: BIT213', classes: ['network'] },
    BIT363: { name: 'E-Business Systems', note: 'Prerequisites: BIT230, BIT245', classes: ['ba'] },
    BIT364: { name: 'Non-Relational Database Management', note: 'Prerequisites: BIT231', classes: ['software'] },
    BIT371: {
      name: 'Capstone Experience 1',
      note: 'Prerequisites: BIT242 & 5 major subjects (2 can be concurrent)',
      classes: ['core'],
    },
    BIT372: { name: 'Capstone Experience 2', note: 'Prerequisite: BIT371', classes: ['core'] },
  };
  const baseTypeClasses = ['network', 'ba', 'software', 'dual', 'dual-split', 'core', 'elective', 'dual-split', 'dual'];
  const displayTypeClasses = ['core', 'network', 'ba', 'software', 'dual', 'dual-split', 'elective'];
  const placeholderStyleClasses = ['network', 'ba', 'software', 'dual', 'dual-split', 'core', 'elective-stream'];
  const getDisplayTypeClass = (cellOrId) => {
    const id = typeof cellOrId === 'string' ? cellOrId : cellOrId?.dataset?.subject;
    const metaClasses = id ? subjectMeta[id]?.classes || [] : [];
    const fromCell = cellOrId?.classList
      ? displayTypeClasses.find((cls) => cellOrId.classList.contains(cls))
      : '';
    return fromCell || metaClasses.find((cls) => displayTypeClasses.includes(cls)) || '';
  };
  const applyDisplayTypeClass = (el, cellOrId) => {
    const typeClass = getDisplayTypeClass(cellOrId);
    if (typeClass) el.classList.add(typeClass);
  };
  const sidebarTooltip = document.createElement('div');
  sidebarTooltip.className = 'hover-tooltip';
  document.body.appendChild(sidebarTooltip);
  let sidebarTooltipTimer = null;
  const isFileProtocol = location.protocol === 'file:';
  const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const isLocalEnv = isFileProtocol || isLocalHost;
  const isSharePointHost = /sharepoint/i.test(location.hostname);

  const lockModalPosition = () => {
    if (modalLocked || !timetableModal) return;
    const modalEl = timetableModal.querySelector('.modal');
    if (!modalEl) return;
    const rect = modalEl.getBoundingClientRect();
    modalPrevStyle = {
      position: modalEl.style.position,
      left: modalEl.style.left,
      top: modalEl.style.top,
      transform: modalEl.style.transform,
      width: modalEl.style.width,
      maxWidth: modalEl.style.maxWidth,
    };
    modalEl.style.position = 'fixed';
    modalEl.style.left = `${rect.left}px`;
    modalEl.style.top = `${rect.top}px`;
    modalEl.style.transform = 'none';
    modalEl.style.width = `${rect.width}px`;
    modalEl.style.maxWidth = `${rect.width}px`;
    modalLocked = true;
  };

  const unlockModalPosition = () => {
    if (!modalLocked || !timetableModal || !modalPrevStyle) return;
    const modalEl = timetableModal.querySelector('.modal');
    if (!modalEl) return;
    modalEl.style.position = modalPrevStyle.position;
    modalEl.style.left = modalPrevStyle.left;
    modalEl.style.top = modalPrevStyle.top;
    modalEl.style.transform = modalPrevStyle.transform;
    modalEl.style.width = modalPrevStyle.width;
    modalEl.style.maxWidth = modalPrevStyle.maxWidth;
    modalLocked = false;
    modalPrevStyle = null;
  };
  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const slotOrder = { Morning: 0, Afternoon: 1 };
  const getDaySortIndex = (dayLabel = '') => {
    const short = dayLabel.slice(0, 3);
    const idx = dayOrder.indexOf(short);
    return idx === -1 ? 99 : idx;
  };

  const getSlotSortIndex = (slotLabel = '') => {
    if (!slotLabel) return 99;
    const normalized = slotLabel.charAt(0).toUpperCase() + slotLabel.slice(1).toLowerCase();
    return slotOrder[normalized] ?? 99;
  };

  const compareByDaySlotThenCode = (a, b) => {
    const dayDiff = getDaySortIndex(a.dayShort || a.dayFull) - getDaySortIndex(b.dayShort || b.dayFull);
    if (dayDiff !== 0) return dayDiff;
    const slotDiff = getSlotSortIndex(a.slot) - getSlotSortIndex(b.slot);
    if (slotDiff !== 0) return slotDiff;
    return a.id.localeCompare(b.id);
  };
  const majorDropdown = document.getElementById('major-select');
  const majorToggle = document.getElementById('major-toggle');
  const majorLabel = document.getElementById('major-current-label');
  const majorOptions = Array.from(document.querySelectorAll('.major-options li'));
  const majorHeading = document.getElementById('major-heading');
  const creditWarningIds = new Set([
    'BIT313', 'BIT314', 'BIT351', 'BIT352', 'BIT353', 'BIT355', 'BIT356', 'BIT357', 'BIT358', 'BIT362', 'BIT363', 'BIT364', 'BIT371', 'BIT372', 'BIT241'
  ]);

  let completedMode = false;
  let overrideMode = false;
  let livePrereqUpdates = false;
  let livePrereqEnabled = false;
  let fullLoadCap = 4;
  let studentType = 'international';
  let exceptionalLoadApproved = false;
  let remainingConfirmed = false;
  let electiveError = null;
  let prereqError = null;
  let chainDelayError = null;
  let nextSemWarning = null;
  let finalSemWarning = null;
  let warningPayloads = [];
  let showSemCounts = false;
  let initialLoad = true;

  const semTooltip = document.createElement('div');
  semTooltip.className = 'sem-tooltip';
  document.body.appendChild(semTooltip);
  let semTooltipTimer = null;
  const electivesGridCells = normalizeSlotCells(electivesGrid);

  const isPlaceholder = (cell) => cell.dataset.subject && cell.dataset.subject.startsWith('ELECTIVE');

  const getCurrentMajor = () => currentMajorValue || 'undecided';

  const getMajorCounts = () => {
    const major = getCurrentMajor();
    const isMajorCode = (code) => {
      const meta = subjectMeta[code] || {};
      const classes = meta.classes || [];
      const hasMajorTag =
        classes.includes('network') || classes.includes('ba') || classes.includes('software') || classes.includes('dual') || classes.includes('dual-split');
      if (!hasMajorTag) return false;
      if (major === 'undecided') return true;
      if (major === 'network') return classes.includes('network') || classes.includes('dual') || classes.includes('dual-split');
      if (major === 'ba') return classes.includes('ba') || classes.includes('dual') || classes.includes('dual-split');
      if (major === 'sd') return classes.includes('software') || classes.includes('dual') || classes.includes('dual-split');
      return false;
    };
    let completedMajorCount = 0;
    let plannedMajorCount = 0;
    subjectState.forEach((st, code) => {
      if (!isMajorCode(code)) return;
      if (st?.completed) completedMajorCount += 1;
      if (st?.toggled) plannedMajorCount += 1;
    });
    return { completedMajorCount, plannedMajorCount };
  };

  const getMajorRequirementDistance = ({
    completedSet,
    plannedSet,
    treatPlannedComplete,
    useDelay = false,
  }) => {
    const majorKey = getMajorKeyFromUi();
    const majorCodes = majorConfig[majorKey]?.codes || [];
    if (!majorCodes.length) return 0;
    const completedMajorSet = new Set(
      majorCodes.filter((code) => completedSet.has(code))
    );
    if (treatPlannedComplete) {
      majorCodes.forEach((code) => {
        if (plannedSet.has(code)) completedMajorSet.add(code);
      });
    }
    const remainingNeeded = Math.max(0, 3 - completedMajorSet.size);
    if (!remainingNeeded) return 0;
    const memo = new Map();
    const compute = useDelay ? computeSemesterDistance : computeSemesterDistanceNoDelay;
    const distances = majorCodes
      .filter((code) => !completedMajorSet.has(code))
      .map((code) => compute(code, completedSet, plannedSet, treatPlannedComplete, memo))
      .filter((dist) => Number.isFinite(dist) && dist > 0)
      .sort((a, b) => a - b);
    if (distances.length < remainingNeeded) return Infinity;
    return distances[remainingNeeded - 1];
  };

  const computeSemesterDistance = (id, completedSet, plannedSet, treatPlannedComplete = false, memo = new Map(), stack = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    if (stack.has(id)) return Infinity;
    const isDone = completedSet.has(id) || (treatPlannedComplete && plannedSet.has(id));
    if (isDone) {
      memo.set(id, 0);
      return 0;
    }
    stack.add(id);
    const prereqs = prerequisites[id] || [];
    const semDelay = notRunningIds.has(id) && !treatPlannedComplete ? 1 : 0;
    if (!prereqs.length) {
      memo.set(id, 1 + semDelay);
      stack.delete(id);
      return 1 + semDelay;
    }
    let maxDepth = 0;
    for (const pre of prereqs) {
      const dist = computeSemesterDistance(pre, completedSet, plannedSet, treatPlannedComplete, memo, stack);
      if (!Number.isFinite(dist)) {
        memo.set(id, Infinity);
        stack.delete(id);
        return Infinity;
      }
      maxDepth = Math.max(maxDepth, dist);
    }
    if (id === 'BIT371') {
      const majorDistance = getMajorRequirementDistance({
        completedSet,
        plannedSet,
        treatPlannedComplete,
        useDelay: true,
      });
      if (!Number.isFinite(majorDistance)) {
        memo.set(id, Infinity);
        stack.delete(id);
        return Infinity;
      }
      maxDepth = Math.max(maxDepth, majorDistance);
    }
    const result = maxDepth + 1 + semDelay;
    memo.set(id, result);
    stack.delete(id);
    return result;
  };
  const computeSemesterDistanceNoDelay = (id, completedSet, plannedSet, treatPlannedComplete = false, memo = new Map(), stack = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    if (stack.has(id)) return Infinity;
    const isDone = completedSet.has(id) || (treatPlannedComplete && plannedSet.has(id));
    if (isDone) {
      memo.set(id, 0);
      return 0;
    }
    stack.add(id);
    const prereqs = prerequisites[id] || [];
    if (!prereqs.length) {
      memo.set(id, 1);
      stack.delete(id);
      return 1;
    }
    let maxDepth = 0;
    for (const pre of prereqs) {
      const dist = computeSemesterDistanceNoDelay(pre, completedSet, plannedSet, treatPlannedComplete, memo, stack);
      if (!Number.isFinite(dist)) {
        memo.set(id, Infinity);
        stack.delete(id);
        return Infinity;
      }
      maxDepth = Math.max(maxDepth, dist);
    }
    if (id === 'BIT371') {
      const majorDistance = getMajorRequirementDistance({
        completedSet,
        plannedSet,
        treatPlannedComplete,
        useDelay: false,
      });
      if (!Number.isFinite(majorDistance)) {
        memo.set(id, Infinity);
        stack.delete(id);
        return Infinity;
      }
      maxDepth = Math.max(maxDepth, majorDistance);
    }
    const result = maxDepth + 1;
    memo.set(id, result);
    stack.delete(id);
    return result;
  };

  const updateSemesterCounts = (completedSet, plannedSet) => {
    subjects.forEach((cell) => {
      const pill = cell.querySelector('.sem-count');
      if (pill) pill.classList.remove('final-sem-pill');
      cell.classList.remove('chain-delay');
    });
    const distanceData = [];
    const memo = new Map();
    const memoNoDelay = new Map();
    const plannedCount = getPlannedCount();
    const loadThreshold = getLoadThreshold();
    const treatPlannedComplete = plannedCount >= loadThreshold;
    const plannedSetActual = new Set(
      Array.from(subjectState.entries())
        .filter(([, st]) => st?.toggled)
        .map(([code]) => code)
    );
    subjects.forEach((cell) => {
      const id = cell.dataset.subject;
      if (!id) return;
      const existing = cell.querySelector('.sem-count');
      const el = existing || document.createElement('div');
      el.className = 'sem-count';
      const dist = computeSemesterDistance(id, completedSet, plannedSet, treatPlannedComplete, memo);
      const distNoDelay = computeSemesterDistanceNoDelay(id, completedSet, plannedSet, treatPlannedComplete, memoNoDelay);
      const label = dist === Infinity ? '?' : dist;
      el.textContent = label;
      el.dataset.reason =
        dist === 0
          ? 'Already completed.'
          : dist === 1
            ? 'Prerequisites satisfied; can complete this semester.'
            : notRunningIds.has(id)
              ? 'Not running this semester; earliest completion next semester.'
              : `Requires at least ${dist} semesters based on prerequisites.`;
      if (!completedSet.has(id) && !isPlaceholder(cell) && Number.isFinite(dist) && dist > 0) {
        distanceData.push({ cell, dist, distNoDelay, el, id });
      }
      if (!existing) {
        const attachEvents = () => {
          el.addEventListener('mouseenter', (e) => {
            if (semTooltipTimer) clearTimeout(semTooltipTimer);
            semTooltipTimer = setTimeout(() => {
              el.classList.add('hovered');
              semTooltip.textContent = el.dataset.reason || '';
              semTooltip.style.display = 'block';
              semTooltip.style.left = `${e.clientX + 12}px`;
              semTooltip.style.top = `${e.clientY + 8}px`;
            }, 300);
          });
          el.addEventListener('mousemove', (e) => {
            if (semTooltip.style.display === 'block') {
              semTooltip.style.left = `${e.clientX + 12}px`;
              semTooltip.style.top = `${e.clientY + 8}px`;
            }
          });
          el.addEventListener('mouseleave', () => {
            if (semTooltipTimer) clearTimeout(semTooltipTimer);
            semTooltipTimer = null;
            el.classList.remove('hovered');
            semTooltip.style.display = 'none';
          });
        };
        attachEvents();
        cell.appendChild(el);
      }
      el.style.display = showSemCounts ? 'block' : 'none';
    });
    finalSemWarning = null;
    const remaining = getRemainingSubjectsCount();
    const applyDelayHighlight = !completedMode;
    const optimalSemesters = Math.max(1, Math.ceil(remaining / Math.max(1, loadThreshold)));
    chainDelayError = null;
    if (applyDelayHighlight && !initialLoad) {
      const chainSet = new Set();
      const distNoDelayMap = new Map();
      const chainMemoNoDelay = new Map();
      const plannedSetForChain = plannedSetActual;
      const chainRemaining = getRemainingSubjectsCount();
      const chainOptimalSemesters = Math.max(1, Math.ceil(chainRemaining / Math.max(1, loadThreshold)));
      const chainTreatPlannedComplete = plannedSetActual.size > 0;
      subjects.forEach((cell) => {
        const id = cell.dataset.subject;
        if (!id) return;
        const distNoDelay = computeSemesterDistanceNoDelay(
          id,
          completedSet,
          plannedSetForChain,
          chainTreatPlannedComplete,
          chainMemoNoDelay
        );
        distNoDelayMap.set(id, distNoDelay);
      });
      const getDistNoDelay = (code) => distNoDelayMap.get(code) ?? 0;
      const chainDistanceMap = new Map();
      const getChainDistance = (code) => {
        if (chainDistanceMap.has(code)) return chainDistanceMap.get(code);
        const base = getDistNoDelay(code);
        if (!Number.isFinite(base) || base <= 0) {
          chainDistanceMap.set(code, base);
          return base;
        }
        chainDistanceMap.set(code, base);
        return base;
      };
      const majorKeyForChain = getMajorKeyFromUi();
        const electiveSlotCodes = getElectiveSlotCodes(majorKeyForChain).filter(Boolean);
        const electiveSlotSet = new Set(electiveSlotCodes);
        const activeElectiveCount = Array.from(new Set(getActiveElectiveCodes().map((code) => code.toUpperCase()))).length;
        const electiveSlotsRemaining = Math.max(0, programRequirements.elective - activeElectiveCount);
        let electivesConstrain = false;
      if (electiveSlotsRemaining > 0) {
        const chainMemoWithDelay = new Map();
        const getElectiveDistance = (code) =>
          computeSemesterDistance(code, completedSet, plannedSetForChain, chainTreatPlannedComplete, chainMemoWithDelay);
        const remainingElectiveCodes = electiveSlotCodes.filter((code) => {
          const st = subjectState.get(code);
          return !(st?.completed || st?.toggled);
        });
        const electiveDistances = remainingElectiveCodes
          .map((code) => getElectiveDistance(code))
          .filter((dist) => Number.isFinite(dist) && dist > 0)
          .sort((a, b) => a - b);
        if (electiveDistances.length < electiveSlotsRemaining) {
          electivesConstrain = true;
        } else {
          const bottleneck = electiveDistances[electiveSlotsRemaining - 1];
          electivesConstrain = bottleneck > chainOptimalSemesters;
        }
      }
        const chainCandidates = [];
        let electiveChainOverrun = false;
        const planCandidateIds = mainGridCells
          .map((cell) => cell.dataset.subject)
          .filter((id) => id && subjectState.has(id));
      const electiveCandidateIds = electivesConstrain ? electiveSlotCodes : [];
      [...new Set([...planCandidateIds, ...electiveCandidateIds])].forEach((id) => {
        const st = subjectState.get(id);
        if (!st || st.completed) return;
        const distNoDelay = getDistNoDelay(id);
        if (!Number.isFinite(distNoDelay) || distNoDelay <= 0) return;
        chainCandidates.push(id);
      });
      const shouldHighlightChain = (code) => {
        const st = subjectState.get(code);
        if (!st || st.completed) return false;
        if (plannedSetForChain.has(code)) return false;
        return true;
      };
      const buildChainPaths = (startId) => {
        const paths = [];
        const walk = (current, path, seen) => {
          const pres = prerequisites[current] || [];
          if (!pres.length) {
            paths.push(path);
            return;
          }
          let best = -Infinity;
          pres.forEach((p) => {
            const d = getChainDistance(p);
            if (d > best) best = d;
          });
          const nextPres = pres.filter((p) => getChainDistance(p) === best);
          if (!nextPres.length) {
            paths.push(path);
            return;
          }
          nextPres.forEach((pre) => {
            if (seen.has(pre)) return;
            const nextSeen = new Set(seen);
            nextSeen.add(pre);
            walk(pre, [...path, pre], nextSeen);
          });
        };
        walk(startId, [startId], new Set([startId]));
        return paths;
      };
      const addChainPaths = (paths) => {
        paths.forEach((path) => {
          path.forEach((code) => {
            if (shouldHighlightChain(code)) chainSet.add(code);
          });
        });
      };
      const trimPathForDisplay = (path) => {
        const displayPath = [...path].reverse();
        while (displayPath.length > 1) {
          const code = displayPath[0];
          if (completedSet.has(code) || (chainTreatPlannedComplete && plannedSetForChain.has(code))) {
            displayPath.shift();
            continue;
          }
          break;
        }
        return displayPath;
      };
      const overrunPaths = [];
      const equalPaths = [];
      let longestChainDist = 0;
      const canTakeIfRunningNow = (code) =>
        !completedSet.has(code) &&
        notRunningIds.has(code) &&
        (prerequisites[code] || []).every(
          (pre) => completedSet.has(pre) || (treatPlannedComplete && plannedSet.has(pre))
        );
        chainCandidates.forEach((id) => {
          const chainDist = getChainDistance(id);
          longestChainDist = Math.max(longestChainDist, chainDist);
          if (chainDist > chainOptimalSemesters) {
            const paths = buildChainPaths(id);
            overrunPaths.push(...paths);
            if (electiveSlotSet.has(id)) electiveChainOverrun = true;
          } else if (chainDist === chainOptimalSemesters) {
            const paths = buildChainPaths(id);
            equalPaths.push(...paths);
          }
        });
        if (overrunPaths.length) {
          addChainPaths(overrunPaths);
        }
        const highlightElectivePlaceholders = electivesConstrain && electiveChainOverrun;
        if (highlightElectivePlaceholders) {
          electiveSlotCodes.forEach((code) => chainSet.delete(code));
        }
        mainGridCells.forEach((cell) => {
          if (chainSet.has(cell.dataset.subject)) cell.classList.add('chain-delay');
        });
        if (highlightElectivePlaceholders) {
          const placeholders = getElectivePlaceholders();
          placeholders.forEach((cell, idx) => {
            const isFilled = !!electivePlaceholderState[idx] || !!electiveBitState[idx];
            if (!isFilled) cell.classList.add('chain-delay');
          });
        }
      const filteredOverrun = overrunPaths.filter((path) => {
        const head = path[0];
        return getChainDistance(head) > chainOptimalSemesters;
      });
      const filteredEqual = equalPaths.filter((path) => {
        const head = path[0];
        return getChainDistance(head) === chainOptimalSemesters;
      });
        const hasOverrun = filteredOverrun.length > 0;
        const hasEqual = filteredEqual.length > 0;
        const allowChainWarning = chainRemaining > 8;
        const chainOverrunsPlan = hasOverrun;
        const severity = hasOverrun ? 'error' : hasEqual && allowChainWarning ? 'warning' : null;
      if (severity) {
        const formatChainSubject = (code) =>
          canTakeIfRunningNow(code) ? `${code} (not running this semester)` : code;
        const relevantPaths = hasOverrun ? filteredOverrun : filteredEqual;
        const pathStrings = relevantPaths
          .map((path) => trimPathForDisplay(path).map(formatChainSubject).join(' \u2192 '))
          .filter((s, idx, arr) => s && arr.indexOf(s) === idx);
        const chainLengths = relevantPaths
          .map((path) => getChainDistance(path[0]))
          .filter((val) => Number.isFinite(val) && val > 0);
        const longestChainSemesters = chainLengths.length
          ? Math.max(...chainLengths)
          : chainOptimalSemesters;
        const body =
          pathStrings.length <= 1
            ? pathStrings.length
              ? `<p>Longest chain: <strong>${pathStrings[0]}</strong></p>`
              : ''
            : `<p>Longest chain:<br><strong>${pathStrings.join('<br>')}</strong></p>`;
        const chainTitle = chainOverrunsPlan
          ? 'Prerequisite chain exceeds optimal timeline'
          : 'Prerequisite chain at optimal limit';
        const remainingLabel = chainRemaining === 1 ? 'subject' : 'subjects';
        const optimalLabel = chainOptimalSemesters === 1 ? 'semester' : 'semesters';
        const chainLabel = longestChainSemesters === 1 ? 'semester' : 'semesters';
        const chainIntro = chainOverrunsPlan
          ? `Normally, at full load you could expect to complete the remaining <strong>${chainRemaining}</strong> ${remainingLabel} in <strong>${chainOptimalSemesters}</strong> ${optimalLabel}. However there is a chain of subjects with prerequisites that runs for <strong>${longestChainSemesters}</strong> ${chainLabel}, so putting at risk your optimal graduation date:`
          : `Normally, at full load you could expect to complete the remaining <strong>${chainRemaining}</strong> ${remainingLabel} in <strong>${chainOptimalSemesters}</strong> ${optimalLabel}. Your longest prerequisite chain also runs for <strong>${longestChainSemesters}</strong> ${chainLabel}, so it is right at the limit for your optimal graduation date:`;
        chainDelayError = {
          title: chainTitle,
          severity,
          html: `<p><strong class="alert-inline-title ${chainOverrunsPlan ? 'alert-title-error' : 'alert-title-warning'}">${chainTitle}</strong> <span class="alert-inline-text">${chainIntro}</span></p>${body}`,
        };
      }
    } else {
      chainDelayError = null;
    }
      if (remaining > 8 && distanceData.length) {
      const maxDist = distanceData.reduce((max, d) => Math.max(max, d.dist), 0);
      if (maxDist > 0 && Number.isFinite(maxDist)) {
        const targets = distanceData.filter((d) => d.dist === maxDist);
        targets.forEach(({ el }) => el?.classList.add('final-sem-pill'));
        if ((targets.length > 4 || maxDist >= 5) && !completedMode && plannedCount >= loadThreshold && !chainDelayError) {
          const completionSemesters = Math.max(1, Math.ceil(remaining / Math.max(1, loadThreshold)));
          const subjectList = targets
            .map(({ cell }) => cell?.dataset?.subject)
            .filter(Boolean);
          const formattedList =
            subjectList.length > 1
              ? `${subjectList.slice(0, -1).join(', ')} and ${subjectList.slice(-1)}`
              : subjectList.join(', ');
          finalSemWarning = {
            title: 'Tight prerequisite chain',
            html: `<p><strong class="alert-inline-title alert-title-warning">Tight prerequisite chain</strong> <span class="alert-inline-text">Take care with the subjects you choose lest your graduation is delayed by a semester. That is, your course is due for completion in <strong>${completionSemesters}</strong> semester${completionSemesters === 1 ? '' : 's'}, and these subjects are at the end of a ${completionSemesters} semester chain: <strong>${formattedList}</strong>.</span></p>`,
          };
        }
      }
    }
    refreshErrorAlerts();
  };

  const getRequisiteStatus = ({ id, completedSet, plannedSet, usePlanned }) => {
    const prereqs = prerequisites[id] || [];
    const coreqs = corequisites[id] || [];
    const prereqMetNow = prereqs.every((code) => completedSet.has(code));
    const prereqMetPlanned = prereqs.every((code) => completedSet.has(code) || (usePlanned && plannedSet.has(code)));
    const coreqMetNow = coreqs.length > 0 ? coreqs.every((code) => completedSet.has(code)) : false;
    const coreqMetPlanned = coreqs.length > 0 ? coreqs.every((code) => completedSet.has(code) || plannedSet.has(code)) : false;
    return { prereqMetNow, prereqMetPlanned, coreqMetNow, coreqMetPlanned };
  };

  const getBit371Requirement = ({ completedSet, plannedSet, usePlanned, completedMajorCount, plannedMajorCount }) => {
    const baseMetNow = completedSet.has('BIT242');
    const baseMetPlanned = baseMetNow || (usePlanned && plannedSet.has('BIT242'));
    const majorCompletedEnough = completedMajorCount >= 3;
    const majorConcurrentOk =
      completedMajorCount >= 5 ||
      (majorCompletedEnough && completedMajorCount + plannedMajorCount >= 5);
    const majorMetNow = completedMajorCount >= 5;
    const metNow = baseMetNow && majorCompletedEnough;
    const metPlanned = baseMetNow && majorCompletedEnough;
    return {
      metNow,
      metPlanned,
      majorConcurrentOk,
      majorMetNow,
      majorCompletedEnough,
      baseMetPlanned,
    };
  };

  const updateVaryLoadLabel = () => {
    const loadLabel = document.getElementById('load-label');
    if (loadLabel) {
      loadLabel.textContent = `Your load = ${fullLoadCap || 4} subjects`;
    }
    if (varyLoadButton) {
      varyLoadButton.textContent = 'Change';
    }
  };

  const electiveCodeOrder = ['USE101', 'USE102', 'USE201', 'USE301'];
  const useDisplayNames = {
    USE101: 'Unspecified Elective Year 1',
    USE102: 'Unspecified Elective Year 1',
    USE201: 'Unspecified Elective Year 2',
    USE301: 'Unspecified Elective Year 3',
  };
  // Tracks USE assignment per placeholder slot (ELECTIVE1..4) by index
  let electivePlaceholderState = ['', '', '', ''];
  // Tracks BIT assignment per placeholder slot (ELECTIVE1..4) by index
  let electiveBitState = ['', '', '', ''];
  // Tracks toggled/completed state keyed by subject code
  const subjectState = new Map();

  const initSubjectStateFromData = () => {
    subjectState.clear();
    Object.keys(subjectMeta).forEach((code) => {
      subjectState.set(code, { completed: false, toggled: false });
    });
  };

  const applySubjectStateToCells = () => {
    subjects.forEach((cell) => {
      const id = cell.dataset.subject;
      if (!id || isPlaceholder(cell)) return;
      const st = subjectState.get(id);
      cell.classList.remove('completed', 'toggled');
      cell.setAttribute('aria-pressed', 'false');
      if (st?.completed) {
        cell.classList.add('completed');
        cell.setAttribute('aria-pressed', 'true');
      }
      if (st?.toggled) {
        cell.classList.add('toggled');
        cell.setAttribute('aria-pressed', 'true');
      }
    });
  };

  const resolveMajorKey = (majorVal) => (majorVal === 'ba' ? 'ba' : majorVal === 'sd' ? 'sd' : 'ns');
  const getMajorKeyFromUi = () =>
    resolveMajorKey(majorDropdown?.dataset?.value || currentMajorValue || 'undecided');
  const getElectiveSlotCodes = (majorKey = getMajorKeyFromUi()) => {
    const layout = computeElectiveList(majorKey);
    const slots = electivesGridCells
      .map((cell) => cell.dataset.slot || '')
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return slots.map((slot) => layout[slot] || '');
  };

  // Ensure electiveBitState mirrors the current subjectState for the active major layout
  const rebuildElectiveBitStateFromState = () => {
    const majorKey = getMajorKeyFromUi();
    const majorSet = new Set(majorLayouts[majorKey] || []);
    const slotCodes = getElectiveSlotCodes(majorKey);
    const active = [];
    slotCodes.forEach((code) => {
      if (!code || majorSet.has(code)) return;
      const st = subjectState.get(code);
      if (st?.completed || st?.toggled) active.push(code);
    });
    // Only track the first four electives in slot order, skipping slots already holding a USE
    const nextState = ['', '', '', ''];
    let activeIdx = 0;
    for (let i = 0; i < nextState.length; i += 1) {
      if (electivePlaceholderState[i]) continue;
      while (activeIdx < active.length && electivePlaceholderState[i]) activeIdx += 1;
      if (activeIdx >= active.length) break;
      nextState[i] = active[activeIdx];
      activeIdx += 1;
    }
    electiveBitState = nextState;
  };

  const normalizeUseCodes = () => {
    const filledSlots = electivePlaceholderState
      .map((code, idx) => ({ code, idx }))
      .filter(({ code }) => !!code)
      .map(({ idx }) => idx);
    filledSlots.forEach((slotIdx, useIdx) => {
      const nextCode = electiveCodeOrder[useIdx] || electiveCodeOrder[electiveCodeOrder.length - 1];
      electivePlaceholderState[slotIdx] = nextCode;
    });
  };

  const getNextAvailableUseSlotIndex = () => {
    const placeholders = getElectivePlaceholders();
    return placeholders.findIndex((_, idx) => {
      const hasUse = !!electivePlaceholderState[idx];
      const hasBit = !!electiveBitState[idx];
      return !hasUse && !hasBit;
    });
  };

  const updateBitStateAfterToggle = (cell) => {
    const id = cell?.dataset.subject;
    if (!id || !id.startsWith('BIT')) return;
    if (isPlaceholder(cell)) return;
    if (!isElectivesGridCell(cell)) return;
    const st = subjectState.get(id);
    const active = st?.toggled || st?.completed;
    const existingIdx = electiveBitState.findIndex((code) => code === id);
    if (active) {
      if (existingIdx >= 0) {
        electiveBitState[existingIdx] = id;
        return;
      }
      const idx = electiveBitState.findIndex((code, i) => !code && !electivePlaceholderState[i]);
      if (idx >= 0) electiveBitState[idx] = id;
    } else if (existingIdx >= 0) {
      electiveBitState[existingIdx] = '';
    }
  };

  const fillFirstFreeSlotFromOverflow = () => {
    const freeIdx = electiveBitState.findIndex((code, idx) => !code && !electivePlaceholderState[idx]);
    if (freeIdx < 0) return false;
    const slotCodes = getElectiveSlotCodes();
    const overflowBits = slotCodes.filter((code) => {
      if (!code || electiveBitState.includes(code)) return false;
      const st = subjectState.get(code);
      return st?.completed || st?.toggled;
    });
    if (!overflowBits.length) return false;
    electiveBitState[freeIdx] = overflowBits[0];
    return true;
  };

  const updatePlaceholderDisplayForMode = () => {
    const placeholders = getElectivePlaceholders();
    placeholders.forEach((cell, idx) => {
      const titleEl = cell.querySelector('.subject-note');
      const noteEl = cell.querySelector('.prerequsites-note');
      if (titleEl && !cell.dataset.originalTitle) cell.dataset.originalTitle = titleEl.textContent || '';
      if (noteEl && !cell.dataset.originalNote) cell.dataset.originalNote = noteEl.textContent || '';
      const hasUse = !!electivePlaceholderState[idx];
      const hasBit = !!electiveBitState[idx];
      const isEmpty = !hasUse && !hasBit;
      cell.classList.toggle('selecting-empty', !completedMode && isEmpty);
      cell.classList.remove('hide-tooltip');
      if (completedMode && isEmpty) {
        if (titleEl) titleEl.textContent = 'Click to set as a USE (Unspecified Elective)';
        if (noteEl) noteEl.textContent = '';
      } else if (isEmpty) {
        if (titleEl && cell.dataset.originalTitle) titleEl.textContent = cell.dataset.originalTitle;
        if (noteEl && cell.dataset.originalNote) noteEl.textContent = cell.dataset.originalNote;
      }
    });
    placeholders.forEach((cell) => attachTooltip(cell));
  };

  const getElectivePlaceholders = () => electivePlaceholderCells;

  const formatDate = (d) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const getTimetableLabel = (d) => {
    const m = d.getMonth(); // 0 = Jan
    if (m <= 1) return `${d.getFullYear()} Semester 1`; // Jan-Feb
    if (m >= 2 && m <= 5) return `${d.getFullYear()} Semester 1`; // Mar-Jun
    if (m >= 6 && m <= 7) return `${d.getFullYear()} Semester 2`; // Jul-Aug
    if (m >= 8 && m <= 10) return 'Summer Semester'; // Sep-Nov
    return `${d.getFullYear() + 1} Semester 1`; // Dec -> next year Sem 1
  };

  const getSubjectName = (code) => {
    const metaName = subjectMeta[code]?.name;
    return metaName || code;
  };

  let electiveAssignments = [];

  const setElectiveCredits = (entries = [], persist = true) => {
    const normalized = (entries || []).filter((text) => (text ?? '').toString().trim().length > 0);
    const placeholders = getElectivePlaceholders();
    normalizeUseCodes();
    // Build visual entries per placeholder: BIT in its slot if present; otherwise the USE assigned to that slot; otherwise empty.
    const displayEntries = placeholders.map((_, idx) => {
      const bitCode = electiveBitState[idx];
      if (bitCode) {
        const name = getSubjectName(bitCode);
        return `${bitCode} ${name}`;
      }
      const useCode = electivePlaceholderState[idx] || '';
      return useCode ? `${useCode} ${useDisplayNames[useCode] || 'Unspecified Elective'}` : '';
    });
    if (persist) electiveAssignments = [...normalized];
    placeholders.forEach((cell, idx) => {
      const titleEl = cell.querySelector('.subject-note');
      const noteEl = cell.querySelector('.prerequsites-note');
      if (titleEl && !cell.dataset.originalTitle) cell.dataset.originalTitle = titleEl.textContent || '';
      if (noteEl && !cell.dataset.originalNote) cell.dataset.originalNote = noteEl.textContent || '';

      // Always clear previously injected elective-credit elements before rendering fresh content
      cell.querySelectorAll('.elective-credit').forEach((n) => n.remove());

      const bitCode = electiveBitState[idx];
      const bitState = bitCode ? subjectState.get(bitCode) : null;
      const useCode = electivePlaceholderState[idx] || '';
      const useText = useCode ? `${useCode} ${useDisplayNames[useCode] || 'Unspecified Elective'}` : '';
      const text = displayEntries[idx] || useText || '';
      const useMatch = text ? text.match(/^(USE\d{3})/i) : null;
      const isUseCredit = !!useCode && !bitCode;
      const isBitPlanned = !!(bitCode && bitState?.toggled);
      const isBitCompleted = !!(bitCode && bitState?.completed);
      const isEmpty = !bitCode && !useCode;
      cell.classList.remove(...placeholderStyleClasses);
      if (bitCode) {
        applyDisplayTypeClass(cell, bitCode);
        cell.classList.add('elective-stream');
      }
      cell.classList.toggle('selecting-empty', !completedMode && isEmpty);

      // Only reach here if we have new text content
      if (text) {
        // Update placeholder label to reflect chosen USE code
        if (useMatch && titleEl && noteEl) {
          const codeText = useMatch[1].toUpperCase();
          const display = useDisplayNames[codeText] || 'Unspecified Elective';
          titleEl.textContent = `${codeText} ${display}`;
          noteEl.textContent = '';
        } else if (titleEl && noteEl) {
          // Specified elective: mirror into placeholder
          titleEl.textContent = text;
          noteEl.textContent = '';
        }
        cell.classList.add('filled-elective');
        cell.classList.remove('empty');
        cell.classList.toggle('use-credit', isUseCredit);
        cell.classList.toggle('completed', isUseCredit || isBitCompleted);
        cell.classList.toggle('toggled', isBitPlanned);
        cell.setAttribute('aria-pressed', isUseCredit || isBitCompleted || isBitPlanned ? 'true' : 'false');
      } else {
        // Only restore original label if clearing (no persisted state)
        if (titleEl && cell.dataset.originalTitle) titleEl.textContent = cell.dataset.originalTitle;
        if (noteEl && cell.dataset.originalNote) noteEl.textContent = cell.dataset.originalNote;
        cell.classList.remove('toggled', 'completed', 'filled-elective', 'use-credit');
        cell.setAttribute('aria-pressed', 'false');
      }
    });
    updatePlaceholderDisplayForMode();
  };

  const buildElectiveAssignments = () => {
    const entries = [];
    electivePlaceholderState.forEach((code) => {
      if (code) entries.push(`${code} Unspecified Elective`);
    });
    // Use the current BIT elective state (already filtered to four by slot order)
    electiveBitState.forEach((code) => {
      if (!code) return;
      const st = subjectState.get(code);
      if (!(st?.completed || st?.toggled)) return;
      const name = getSubjectName(code);
      entries.push(`${code} - ${name}`);
    });
    return entries;
  };

  const updateWarnings = () => {
    if (completedMode) {
      warningPayloads = [];
      refreshErrorAlerts();
      return;
    }
    const warnings = [];
    Object.entries(corequisites).forEach(([course, coList]) => {
      coList.forEach((co) => {
        const courseSelected = subjectState.get(course)?.toggled;
        const coSelected = subjectState.get(co)?.toggled;
        if (courseSelected && coSelected) {
          warnings.push({
            title: `Concurrent ${course} and ${co}`,
            html: `<strong class="alert-inline-title alert-title-warning">Concurrent ${course} and ${co}</strong> <span class="alert-inline-text">Students who take ${course} and ${co} together often struggle because ${course} relies on ${co} knowledge. Concurrent study is not advised unless necessary.</span>`,
          });
        }
      });
    });
    warningPayloads = warnings;
    refreshErrorAlerts();
  };

  const canSelectPlanned = () => {
    const plannedCount = Array.from(subjectState.values()).filter((st) => st?.toggled).length;
    const completedCount = getCompletedCount();
    const totalSubjects = getTotalSubjectsCount();
    const remaining = totalSubjects - completedCount;
    const baseCap = Math.min(getLoadThreshold(), remaining || getLoadThreshold());
    const finishCap = remaining <= 5 ? remaining : baseCap;
    const cap = Math.max(baseCap, finishCap);
    return plannedCount < cap;
  };

  const recomputeAvailability = (usePlanned = true) => {
    // Ensure DOM reflects subjectState for non-placeholder cells
    subjects.forEach((cell) => {
      const id = cell.dataset.subject;
      if (!id || isPlaceholder(cell)) return;
      const st = subjectState.get(id);
      cell.classList.toggle('completed', !!st?.completed);
      cell.classList.toggle('toggled', !!st?.toggled);
      cell.setAttribute('aria-pressed', st?.completed || st?.toggled ? 'true' : 'false');
    });
    const completed = new Set(
      Array.from(subjectState.entries())
        .filter(([, st]) => st?.completed)
        .map(([code]) => code)
    );
    const completedCount = completed.size;
    const selectedSubjects = new Set(
      Array.from(subjectState.entries())
        .filter(([, st]) => st?.toggled)
        .map(([code]) => code)
    );
    const plannedCount = getPlannedCount();
    const loadThreshold = getLoadThreshold();
    const availabilityOn = livePrereqUpdates || plannedCount >= loadThreshold;
    const planned = usePlanned ? selectedSubjects : new Set();
    const { completedMajorCount, plannedMajorCount } = getMajorCounts();

    const electivePlaceholders = subjects.filter(isPlaceholder);

    subjects.forEach((cell) => {
      const id = cell.dataset.subject;
      if (!id) return;
      const st = subjectState.get(id);
      // Leave elective placeholder cards untouched; their visuals are driven elsewhere.
      if (isPlaceholder(cell)) return;
      cell.classList.remove('satisfied');
      cell.classList.remove('can-select-now');
      cell.classList.remove('locked');
      cell.classList.remove('coreq-selectable');

      const { prereqMetNow, prereqMetPlanned, coreqMetNow, coreqMetPlanned } = getRequisiteStatus({
        id,
        completedSet: completed,
        plannedSet: planned,
        usePlanned,
      });
      const hasCoreq = (corequisites[id] || []).length > 0;
      const evalPlanned = usePlanned || id === 'BIT371';
      const coreqSatisfiedEval = evalPlanned ? coreqMetPlanned : coreqMetNow;
      let metNow = hasCoreq ? prereqMetNow && coreqMetNow : prereqMetNow;
      let met = evalPlanned ? (hasCoreq ? prereqMetPlanned && coreqSatisfiedEval : prereqMetPlanned) : metNow;
      const headingMet =
        hasCoreq && evalPlanned
          ? prereqMetPlanned && coreqMetPlanned
          : hasCoreq
            ? prereqMetNow && coreqMetNow
            : evalPlanned
              ? prereqMetPlanned
              : prereqMetNow;
      let capstoneMajorOkPlanned = false;
      let capstoneMajorOkNow = false;
      if (id === 'BIT371') {
        const bitReq = getBit371Requirement({
          completedSet: completed,
          plannedSet: planned,
          usePlanned: evalPlanned,
          completedMajorCount,
          plannedMajorCount,
        });
        metNow = bitReq.metNow;
        met = evalPlanned ? bitReq.metPlanned : bitReq.metNow;
        capstoneMajorOkPlanned = bitReq.majorConcurrentOk;
        capstoneMajorOkNow = bitReq.majorMetNow;
      }
      const noteEl = cell.querySelector('.prerequsites-note');
      if (noteEl) {
        if (!noteEl.dataset.originalText) {
          noteEl.dataset.originalText = noteEl.textContent || '';
        }
        const hasReqText = (prerequisites[id] || []).length > 0 || (corequisites[id] || []).length > 0;
        let noteMet = hasCoreq
          ? evalPlanned
            ? prereqMetPlanned && coreqMetPlanned
            : prereqMetNow && coreqMetNow
          : prereqMetPlanned;
        if (id === 'BIT371') {
          const bitReq = getBit371Requirement({
            completedSet: completed,
            plannedSet: selectedSubjects,
            usePlanned: true,
            completedMajorCount,
            plannedMajorCount,
          });
          noteMet = noteMet && bitReq.majorConcurrentOk;
        }
        noteEl.classList.toggle('reqs-met', hasReqText && noteMet);
        if (hasReqText && noteMet) {
          noteEl.textContent = 'Prerequisites satisfied';
        } else {
          noteEl.textContent = noteEl.dataset.originalText || '';
        }
      }

      if (st?.toggled || st?.completed) {
        cell.classList.remove('locked');
        cell.classList.toggle('satisfied-tooltip', headingMet && availabilityOn && plannedCount >= loadThreshold);
        return;
      }
      const isNotThisSem = notRunningIds.has(id);
      cell.classList.toggle('satisfied', met);
      const canSelectNow = id === 'BIT371' ? met && !isNotThisSem : metNow && !isNotThisSem;
      cell.classList.toggle('can-select-now', canSelectNow);
      cell.classList.toggle('locked', !met);
      cell.classList.toggle('satisfied-tooltip', headingMet && availabilityOn && plannedCount >= loadThreshold);
      if (coreqMetPlanned && !st?.completed) {
        cell.classList.remove('locked');
        cell.classList.add('coreq-selectable');
        // Only dim when relying on concurrent coreqs; keep bright if prereqs met from prior completion
        if (id !== 'BIT371' && (!hasCoreq || !coreqMetNow)) cell.classList.remove('satisfied', 'can-select-now');
      }
    });
    updateSemesterCounts(completed, planned);

    if (majorHeading) {
      if (completedCount >= 8) {
        majorHeading.textContent = 'You must choose your major in the sidebar.';
        majorHeading.classList.add('major-warning');
      } else {
        majorHeading.textContent = 'Choose your (likely) major';
        majorHeading.classList.remove('major-warning');
      }
    }

    const availableElectiveSubjects = subjects.filter((cell) => {
      const id = cell.dataset.subject;
      const inElectivesGrid = isElectivesGridCell(cell);
      const isElectiveSubject = id && id.startsWith('BIT') && !isPlaceholder(cell) && inElectivesGrid;
      if (!isElectiveSubject) return false;
      const st = subjectState.get(id);
      if (st?.toggled) return false;
      const { prereqMetPlanned, prereqMetNow, coreqMetPlanned, coreqMetNow } = getRequisiteStatus({
        id,
        completedSet: completed,
        plannedSet: planned,
        usePlanned: usePlanned,
      });
      const hasCoreq = (corequisites[id] || []).length > 0;
      const met = usePlanned ? (hasCoreq ? prereqMetPlanned && coreqMetPlanned : prereqMetPlanned) : prereqMetNow;
      return met;
    });

    const sortedPlaceholders = electivePlaceholders.sort((a, b) => {
      const getNum = (cell) => parseInt(cell.dataset.subject.replace('ELECTIVE', ''), 10) || 0;
      return getNum(a) - getNum(b);
    });

    sortedPlaceholders.forEach((cell, idx) => {
      const isFilled = !!electivePlaceholderState[idx] || !!electiveBitState[idx];
      const shouldShow = idx < availableElectiveSubjects.length && !isFilled;
      cell.classList.toggle('satisfied', shouldShow);
      cell.classList.toggle('can-select-now', false);
      cell.classList.toggle('locked', !shouldShow);
    });

    updateNextSemWarning();
  };

  const resetAvailabilityVisuals = () => recomputeAvailability(false);
  const getPlannedCount = () => Array.from(subjectState.values()).filter((st) => st?.toggled).length;
  const getCompletedCount = () => Array.from(subjectState.values()).filter((st) => st?.completed).length;
  const getUseCreditsCount = () => electivePlaceholderState.filter(Boolean).length;
  const getTotalSubjectsCount = () => programRequirements.total;
  const getRemainingSubjectsCount = () => {
    const total = getTotalSubjectsCount();
    const completed = getCompletedCount();
    const planned = getPlannedCount();
    const useCredits = getUseCreditsCount();
    return Math.max(0, total - completed - planned - useCredits);
  };
  const getLoadThreshold = () => Math.max(1, fullLoadCap || 4);

  const conditionalRecompute = ({ force = false, usePlanned = null } = {}) => {
    const plannedCount = getPlannedCount();
    const threshold = getLoadThreshold();
    if (force) {
      recomputeAvailability(usePlanned === null ? true : usePlanned);
      if (completedMode) {
        setElectiveCredits(buildElectiveAssignments(), false);
      }
      document.body.classList.toggle('show-availability', plannedCount >= threshold || livePrereqUpdates);
      updatePrereqErrors();
      return;
    }
    if (livePrereqUpdates || plannedCount >= threshold) {
      recomputeAvailability(usePlanned === null ? true : usePlanned);
      if (completedMode) {
        setElectiveCredits(buildElectiveAssignments(), false);
      }
      document.body.classList.toggle('show-availability', true);
    } else {
      resetAvailabilityVisuals();
      document.body.classList.remove('show-availability');
    }
    updatePrereqErrors();
  };

  const updateNextSemWarning = () => {
    subjects.forEach((cell) => cell.classList.remove('next-sem-warning'));
    nextSemWarning = null;
    if (completedMode) {
      refreshErrorAlerts();
      return;
    }

    const remaining = getRemainingSubjectsCount();
    const plannedCount = getPlannedCount();
    const loadThreshold = getLoadThreshold();

    const completedSet = new Set(
      Array.from(subjectState.entries())
        .filter(([, st]) => st?.completed)
        .map(([code]) => code)
    );
    const plannedSet = new Set(
      Array.from(subjectState.entries())
        .filter(([, st]) => st?.toggled)
        .map(([code]) => code)
    );

    const satisfiedCells = subjects.filter((cell) => {
      const id = cell.dataset.subject || '';
      if (!id || isPlaceholder(cell)) return false;
      if (completedSet.has(id) || plannedSet.has(id)) return false;
      const { prereqMetPlanned, coreqMetPlanned } = getRequisiteStatus({
        id,
        completedSet,
        plannedSet,
        usePlanned: true,
      });
      const hasCoreq = (corequisites[id] || []).length > 0;
      return hasCoreq ? prereqMetPlanned && coreqMetPlanned : prereqMetPlanned;
    });
    const satisfiedCount = satisfiedCells.length;

    if (remaining > 4 && satisfiedCount < 4 && plannedCount >= loadThreshold) {
      satisfiedCells.forEach((cell) => cell.classList.add('next-sem-warning'));
      const satisfiedSummary =
        satisfiedCount === 0
          ? 'No subjects currently have prerequisites satisfied'
          : `Only ${satisfiedCount} subject${satisfiedCount === 1 ? '' : 's'} currently have prerequisites satisfied`;
      nextSemWarning = {
        title: 'Limited availability next semester',
        html: `<p><strong class="alert-inline-title alert-title-warning">Not enough subjects available next semester</strong> <span class="alert-inline-text">${satisfiedSummary}, but you still have ${remaining} subjects remaining.</span></p><p class="alert-inline-text">For <strong>international students</strong>: where possible subject selection should be arranged to allow for the selection of a full load in the following semester.</p>`,
      };
    }
    refreshErrorAlerts();
  };

  const updateResetState = () => {
    if (!clearButton) return;
    const selectedCount = Array.from(subjectState.values()).filter((st) => st?.toggled).length;
    const hasAnyState = Array.from(subjectState.values()).some((st) => st?.toggled || st?.completed);
    const hasAnyUse = electivePlaceholderState.some(Boolean);
    const hasAnyBit = electiveBitState.some(Boolean);
    const hasAny = hasAnyState || hasAnyUse || hasAnyBit;
    clearButton.disabled = !hasAny;
    clearButton.classList.toggle('disabled', !hasAny);
    clearButton.style.display = hasAny ? '' : 'none';
    const threshold = getLoadThreshold();
    if (showTimetableButton) {
      const hasSelected = selectedCount >= threshold && threshold > 0;
      // Ensure inline display overrides the hidden-initial class when we have selections.
      showTimetableButton.style.display = hasSelected ? 'block' : 'none';
      showTimetableButton.classList.toggle('hidden-initial', !hasSelected);
      if (livePrereqRow) {
        livePrereqRow.style.display = hasSelected ? 'flex' : 'none';
        livePrereqRow.classList.toggle('hidden-initial', !hasSelected);
      }
    }
    if (varyLoadButton) {
      varyLoadButton.style.display = '';
    }
    if (resetSection) {
      resetSection.style.display = '';
      clearButton.style.display = '';
    }
    if (availableHeading) {
      availableHeading.style.display = '';
    }
    if (historyButton) {
      const hasHistory = getHistoryRows().length > 0;
      historyButton.style.display = hasHistory ? '' : 'none';
    }
    if (nextSemList) {
      const rows = getNextSemRows();
      nextSemList.innerHTML = '';
      const plannedCount = getPlannedCount();
      const threshold = getLoadThreshold();
      const showList = plannedCount >= threshold;
      if (!showList || !rows.length) {
        const li = document.createElement('li');
        li.textContent = 'Select this semester’s subjects first, and next semester’s options will be revealed.';
        nextSemList.appendChild(li);
      } else {
        rows.forEach((item) => {
          const li = document.createElement('li');
          const name = getSubjectName(item.id);
          li.textContent = `${item.id} - ${name}`;
          const { category, stream } = describeSubjectCategory(item.cell);
          if (category === 'Elective') {
            const streamLabel = stream && stream !== 'Elective' && stream !== 'Other' ? stream : 'Elective';
            li.title = `Elective (${streamLabel})`;
          } else if (category === 'Major') {
            const streamLabel = stream && stream !== 'Other' ? ` (${stream})` : '';
            li.title = `Major${streamLabel}`;
          } else {
            li.title = 'Core subject';
          }
          nextSemList.appendChild(li);
        });
      }
    }
    updatePrereqErrors();
    updateNextSemWarning();
  };

  const updateCompletedModeUI = () => {
    if (!completedModeButton) return;
    completedModeButton.textContent = completedMode ? 'Exit this history mode (start selecting subjects)' : 'By clicking';
    completedModeButton.setAttribute('aria-pressed', completedMode ? 'true' : 'false');
    completedModeButton.classList.toggle('completed-mode-wide', completedMode);
    document.body.classList.toggle('completed-mode', completedMode);
    updatePlaceholderDisplayForMode();

    const disableOthers = (btn, disabled) => {
      if (!btn) return;
      btn.classList.toggle('disabled', disabled);
      btn.disabled = disabled;
    };
    disableOthers(clearButton, completedMode);
    disableOthers(openCodeModal, completedMode);
  };

  const updateOverrideUI = () => {
    if (!overrideToggle) return;
    overrideToggle.checked = overrideMode;
    overrideToggle.setAttribute('aria-pressed', overrideMode ? 'true' : 'false');
    if (overrideLabel) {
      overrideLabel.textContent = overrideMode ? 'Override prerequisites (active)' : 'Override prerequisites';
      overrideLabel.classList.toggle('active', overrideMode);
    }
  };

  const updateLiveUI = () => {
    if (!livePrereqToggle) return;
    livePrereqToggle.checked = livePrereqUpdates && livePrereqEnabled;
    livePrereqToggle.disabled = !livePrereqEnabled;
    livePrereqToggle.setAttribute('aria-pressed', livePrereqUpdates ? 'true' : 'false');
    const label = livePrereqToggle.closest('.toggle-row')?.querySelector('.switch-label');
    if (label) {
      label.textContent = livePrereqUpdates ? 'Live prerequisite updates (active)' : 'Live prerequisite updates';
      label.classList.toggle('active', livePrereqUpdates);
      label.classList.toggle('disabled', !livePrereqEnabled);
    }
  };

  const setLivePrereqEnabled = (enabled) => {
    livePrereqEnabled = enabled;
    if (!enabled) livePrereqUpdates = false;
    updateLiveUI();
  };

  const buildLoadOptions = (type, exceptional, remaining, confirmRemaining) => {
    const canOfferFive = confirmRemaining || remaining <= 9;
    if (type === 'international' && !exceptional) {
      const opts = [4];
      if (canOfferFive) opts.push(5);
      return opts;
    }
    const opts = [1, 2, 3, 4];
    if (canOfferFive) opts.push(5);
    return opts;
  };

  const ensureNotThisSemUI = (cell) => {
    if (!cell) return;
    cell.classList.add('not-this-sem');
    cell.classList.remove('clickable');
    cell.tabIndex = 0;
    if (!cell.querySelector('.not-this-sem-label')) {
      const label = document.createElement('div');
      label.className = 'not-this-sem-label';
      label.textContent = 'Running next semester only';
      cell.appendChild(label);
    }
    if (!cell.querySelector('.not-running-tooltip')) {
      const tip = document.createElement('div');
      tip.className = 'not-running-tooltip';
      tip.textContent = 'This subject is not running this semester. It will run next semester';
      cell.appendChild(tip);
    }
  };
  const attachTooltip = (cell) => {
    if (!cell) return;
    const existingTooltip = cell.querySelector('.subject-tooltip');
    const existingHover = cell.querySelector('.hover-zone');
    if (existingTooltip) existingTooltip.remove();
    if (existingHover) existingHover.remove();
    const id = cell.dataset.subject || '';
    const tooltip = document.createElement('div');
    tooltip.className = 'subject-tooltip';
    const hoverZone = document.createElement('div');
    hoverZone.className = 'hover-zone';

    const isPlaceholderCell = () => {
      const currentId = cell.dataset.subject || '';
      return !currentId || isPlaceholder(cell);
    };
    const setPlaceholderTooltip = () => {
      const msg = completedMode
        ? '<div class="inline-electives-heading">Electives</div><br>You have <b>2 options</b> for marking these 4 Elective boxes as complete:<br><br><b>1.</b>&nbsp; Click on the subjects in the streams below to have them appear in these 4 Elective boxes.<br><b>2.</b>&nbsp; If you click on these 4 boxes when they are empty, they will be marked as completed as "Unspecified Electives (USE)"'
        : '<div class="inline-electives-heading">Electives</div><br>Fill these Elective boxes with the subjects from the below Electives section (or with any subject that you have completed at diploma level or higher.").';
      tooltip.innerHTML = msg;
    };

    if (isPlaceholderCell()) {
      setPlaceholderTooltip();
    } else {
      const data = timetable[id] || {};
      if (creditWarningIds.has(id)) {
        const creditNote = document.createElement('div');
        creditNote.className = 'credit-note';
        creditNote.dataset.creditOnly = 'true';
        creditNote.innerHTML =
          id === 'BIT371' || id === 'BIT372'
            ? 'Capstone cannot be credited.'
            : '3rd year subjects and BIT241 can normally not be credited.';
        creditNote.style.display = 'none';
        tooltip.appendChild(creditNote);
      }
      const name = getSubjectName(id);
      const titleBlock = document.createElement('div');
      titleBlock.innerHTML = `<div class="subject-code">${id}</div><div class="tooltip-name">${name}</div>`;
      tooltip.appendChild(titleBlock);
      const isNotThisSem = notRunningIds.has(id);
      if (isNotThisSem) {
        const nextSemHeading = document.createElement('div');
        nextSemHeading.className = 'next-sem-heading';
        nextSemHeading.textContent = 'Prerequisites satisfied for next semester';
        tooltip.appendChild(nextSemHeading);
      } else {
        const satisfiedHeading = document.createElement('div');
        satisfiedHeading.className = 'satisfied-heading';
        satisfiedHeading.textContent = "This subject's prerequisites satisfied for next semester";
        tooltip.appendChild(satisfiedHeading);
      }
      const prereqList = prerequisites[id] || [];
      const prereqHtml =
        prereqList.length === 0
          ? '<div class="pre-block"><span class="inline-strong">Prerequisites:</span> None</div>'
          : `<div class="pre-block"><span class="inline-strong">Prerequisites:</span> ${prereqList
            .map((code) => `<span class="inline-strong prereq-item">${code}</span>`)
            .join(', ')}</div>`;
      const slot = timeSlots[data.slot] || data.slot || '';
      const day = data.day || '';
      const timeHtml =
        slot || day
          ? `<div class="tooltip-day"><strong class="tooltip-day-text">${day || 'N/A'} ${slot || ''}</strong></div>`
          : '';
      const streamLabel = buildStreamLabel(id);
      const categoryInfo = describeSubjectCategory(id);
      const majorCoreText = categoryInfo.category === 'Core' ? 'Core' : categoryInfo.stream || 'Elective';
      const roomHtml = data.room ? `<div><span class="inline-strong">Room:</span> ${data.room}</div>` : '';
      const lecturerHtml = data.teacher ? `<div><span class="inline-strong">Lecturer:</span> ${data.teacher}</div>` : '';
      const depsList =
        dependents[id] && dependents[id].length
          ? dependents[id].filter((d) => !String(d).toUpperCase().startsWith('ELECTIVE'))
          : [];
      const depsRaw = depsList.length ? depsList.join(', ') : 'None';
      const neededHtml =
        depsRaw === 'None'
          ? '<div class="pre-block"><span class="inline-strong">Needed for:</span> None</div>'
          : `<div class="pre-block"><span class="inline-strong">Needed for:</span><br>${depsRaw}</div>`;
      const streamHtml =
        id === 'BIT245'
          ? `<div class="pre-block"><span class="inline-strong">Major/Core:</span> Both Business Analytics & Software Development</div>`
          : streamLabel === 'Elective'
            ? ''
            : `<div class="pre-block">${streamLabel}</div>`;
      tooltip.insertAdjacentHTML(
        'beforeend',
        `${timeHtml}${roomHtml}${lecturerHtml}<div class="tooltip-gap"></div>${id === 'BIT245'
          ? `${streamHtml}`
          : `<div class="pre-block"><span class="inline-strong">Major/Core:</span> ${majorCoreText}</div>`
        }<div class="tooltip-gap"></div>${prereqHtml}<div class="tooltip-gap"></div>${neededHtml}${id === 'BIT245' ? '' : streamHtml
        }`
      );
    }

    const positionTooltip = (event) => {
      const rect = cell.getBoundingClientRect();
      const tooltipWidth = tooltip.offsetWidth || rect.width * 0.9;
      const offsetX = event.clientX - rect.left - tooltipWidth / 2;
      // On smaller screens allow the tooltip to overflow the card so content isn't cramped.
      const allowOverflow = window.innerWidth < 1300;
      const minX = allowOverflow ? -tooltipWidth * 0.35 : 0;
      const maxX = allowOverflow ? rect.width - tooltipWidth * 0.65 : rect.width - tooltipWidth;
      const clampedX = Math.max(minX, Math.min(offsetX, maxX));
      let offsetY = event.clientY - rect.top + 27;
      const tooltipHeight = tooltip.offsetHeight || 0;
      const viewportPadding = 8;
      if (tooltipHeight) {
        const tooltipBottom = rect.top + offsetY + tooltipHeight;
        if (tooltipBottom > window.innerHeight - viewportPadding) {
          offsetY = event.clientY - rect.top - tooltipHeight - 12;
          const minY = viewportPadding - rect.top;
          offsetY = Math.max(minY, offsetY);
        }
      }
      tooltip.style.left = `${clampedX}px`;
      tooltip.style.top = `${offsetY}px`;
    };
    const showTooltip = (event) => {
      if (!cell.classList.contains('hide-tooltip')) {
        cell.classList.add('show-tooltip');
      }
      if (isPlaceholderCell()) setPlaceholderTooltip();
      const creditOnly = tooltip.querySelectorAll('[data-credit-only="true"]');
      creditOnly.forEach((el) => {
        el.style.display = completedMode ? 'block' : 'none';
      });
      cell.classList.add('hover-active');
      if (event) positionTooltip(event);
    };
    const hideTooltip = () => {
      cell.classList.remove('show-tooltip');
      cell.classList.remove('hover-active');
    };
    hoverZone.addEventListener('mouseenter', showTooltip);
    hoverZone.addEventListener('mouseleave', hideTooltip);
    hoverZone.addEventListener('mousemove', positionTooltip);
    cell.addEventListener('mouseenter', showTooltip);
    cell.addEventListener('mouseleave', hideTooltip);
    cell.addEventListener('mousemove', positionTooltip);
    cell.addEventListener('focus', showTooltip);
    cell.addEventListener('blur', hideTooltip);
    cell.appendChild(hoverZone);
    cell.appendChild(tooltip);
  };
  const clearNotThisSemUI = (cell) => {
    if (!cell) return;
    cell.classList.remove('not-this-sem');
    const label = cell.querySelector('.not-this-sem-label');
    const tip = cell.querySelector('.not-running-tooltip');
    if (label) label.remove();
    if (tip) tip.remove();
  };

  const renderSubjectInCell = (cell, code, typeClass) => {
    const meta = subjectMeta[code];
    if (!meta) return;
    clearNotThisSemUI(cell);
    cell.dataset.subject = code;
    cell.className = 'subject-card';
    cell.classList.add('clickable');
    cell.tabIndex = 0;
    cell.setAttribute('role', 'button');
    const base = typeClass || meta.classes.find((c) => baseTypeClasses.includes(c)) || '';
    cell.classList.add(base || 'elective');
    const inElectivesGrid = isElectivesGridCell(cell);
    const isPlaceholderCode = code.startsWith('ELECTIVE');
    if (isPlaceholderCode) cell.classList.add('placeholder-card');
    else if (inElectivesGrid) cell.classList.add('elective-stream');
    const hasSas = meta.classes.includes('sas');

    const st = subjectState.get(code);
    cell.classList.toggle('completed', !!st?.completed);
    cell.classList.toggle('toggled', !!st?.toggled);
    cell.setAttribute('aria-pressed', st?.completed || st?.toggled ? 'true' : 'false');
    if (notRunningIds.has(code)) ensureNotThisSemUI(cell);

    // Remove existing text nodes and rebuild display
    cell.querySelectorAll('.subject-code, .subject-note, .subject-title, .course, .prerequsites-note, .note, .sas').forEach((n) => n.remove());

    const codeEl = document.createElement('span');
    codeEl.className = 'subject-code';
    codeEl.textContent = code;

    const titleEl = document.createElement('span');
    titleEl.className = 'subject-note subject-title';
    const codePrefix = new RegExp(`^${code}\\s*`, 'i');
    const nameText = (meta.name || '').replace(codePrefix, '').trim() || meta.name || code;
    titleEl.textContent = nameText;

    const noteEl = document.createElement('span');
    noteEl.className = 'prerequsites-note';
    noteEl.textContent = meta.note || '\u00a0';

    cell.appendChild(codeEl);
    cell.appendChild(titleEl);
    cell.appendChild(noteEl);
    if (hasSas) {
      const sasEl = document.createElement('div');
      sasEl.className = 'sas';
      cell.appendChild(sasEl);
    }
  };

  function renderElectivePlaceholder(cell, code) {
    if (!cell) return;
    cell.dataset.subject = code;
    cell.className = 'subject-card elective placeholder-card clickable';
    cell.tabIndex = 0;
    cell.setAttribute('role', 'button');
    cell.classList.remove('filled-elective', 'use-credit', 'toggled', 'completed', 'locked');
    cell.setAttribute('aria-pressed', 'false');
    cell.querySelectorAll('.subject-code, .subject-note, .subject-title, .course, .prerequsites-note, .note, .sas').forEach((n) => n.remove());

    const labelIdx = Number(code.replace('ELECTIVE', '')) || '';
    const codeEl = document.createElement('span');
    codeEl.className = 'subject-code';
    codeEl.textContent = labelIdx ? `Elective ${labelIdx}` : 'Elective';

    const titleEl = document.createElement('span');
    titleEl.className = 'subject-note subject-title';
    titleEl.textContent = 'Choose from electives below';

    const noteEl = document.createElement('span');
    noteEl.className = 'prerequsites-note';
    noteEl.textContent = '\u00a0';

    cell.appendChild(codeEl);
    cell.appendChild(titleEl);
    cell.appendChild(noteEl);
  }

  function applyMainGridLayout(majorKey) {
    const resolvedMajor = majorKey === 'ba' ? 'ba' : majorKey === 'sd' ? 'sd' : 'ns';
    const majorCodes = majorLayouts[resolvedMajor] || majorLayouts.ns;
    let majorIdx = 0;

    mainGridLayout.forEach((row, rowIdx) => {
      row.forEach((entry, colIdx) => {
        const slot = `r${rowIdx + 1}c${colIdx + 1}`;
        const cell = mainGridSlots.get(slot);
        if (!cell) return;
        if (entry === 'INFO') return;
        if (entry === 'MAJOR') {
          const code = majorCodes[majorIdx];
          majorIdx += 1;
          if (!code) return;
          renderSubjectInCell(cell, code, majorConfig[resolvedMajor]?.typeClass);
          attachTooltip(cell);
          return;
        }
        if (typeof entry === 'string' && entry.startsWith('ELECTIVE')) {
          renderElectivePlaceholder(cell, entry);
          cell.classList.add('elective-placeholder');
          cell.classList.remove('clickable');
          attachTooltip(cell);
          return;
        }
        renderSubjectInCell(cell, entry, 'core');
        attachTooltip(cell);
      });
    });
  }

  const computeElectiveList = (major) => {
    const resolvedMajor = major === 'ba' ? 'ba' : major === 'sd' ? 'sd' : 'ns';
    const layout = electiveGridLayouts[resolvedMajor] || electiveGridLayouts.ns;
    const result = {};
    layout.forEach((row, rowIdx) => {
      row.forEach((code, colIdx) => {
        result[`r${rowIdx + 1}c${colIdx + 1}`] = code || null;
      });
    });
    return result;
  };

  const applyElectiveStyling = (cell, code, currentMajor) => {
    clearNotThisSemUI(cell);
    cell.classList.remove(
      'network',
      'ba',
      'software',
      'dual',
      'dual-split',
      'elective',
      'elective-placeholder',
      'elective-stream',
      'placeholder-card',
      'elective-spacer'
    );
    cell.classList.add('elective');
    cell.classList.add('elective-stream');
    const isNS = majorConfig.ns.codes.includes(code);
    const isBA = majorConfig.ba.codes.includes(code);
    const isSD = majorConfig.sd.codes.includes(code);
    if (isNS) cell.classList.add('network');
    else if (isBA) cell.classList.add('ba');
    else if (isSD) cell.classList.add('software', 'sd-elective');
    if (code === 'BIT245') {
      if (currentMajor === 'ns') cell.classList.add('dual-split');
    }
  };

  const applyMajorConfig = (majorVal) => {
    currentMajorValue = majorVal || 'undecided';
    const majorKey = majorVal === 'ba' ? 'ba' : majorVal === 'sd' ? 'sd' : 'ns';
    const activeElectiveCells = normalizeSlotCells(electivesGrid);
    currentMajorKey = majorKey;
    // map slots to new subjects in the main grid
    applyMainGridLayout(majorKey);
    // electives
    const electiveList = computeElectiveList(majorKey);
    activeElectiveCells.forEach((cell) => {
      clearNotThisSemUI(cell);
      const slot = cell.dataset.slot;
      const code = electiveList[slot];
      if (!code) {
        cell.dataset.subject = '';
        cell.querySelectorAll('.subject-code, .subject-note, .prerequsites-note, .course, .note, .sas').forEach((n) => n.remove());
        cell.className = 'subject-card elective-spacer placeholder-card empty';
        cell.removeAttribute('role');
        cell.removeAttribute('tabindex');
        cell.removeAttribute('aria-pressed');
        attachTooltip(cell);
        return;
      }
      renderSubjectInCell(cell, code, null);
      applyElectiveStyling(cell, code, majorKey);
      if (notRunningIds.has(code)) ensureNotThisSemUI(cell);
      attachTooltip(cell);
    });
    rebuildElectiveBitStateFromState();
    conditionalRecompute({ force: true, usePlanned: true });
    updateSelectedList();
    setElectiveCredits(buildElectiveAssignments(), true);
    updateElectiveWarning();
    updateResetState();
  };

  const populateLoadSelect = (options = [], desired = 4) => {
    if (!loadValueInput) return;
    loadValueInput.innerHTML = '';
    const choice = options.length ? (options.includes(desired) ? desired : options[options.length - 1]) : 4;
    options.forEach((val) => {
      const opt = document.createElement('option');
      opt.value = String(val);
      opt.textContent = `${val} subject${val === 1 ? '' : 's'}`;
      opt.selected = val === choice;
      loadValueInput.appendChild(opt);
    });
    loadValueInput.disabled = options.length === 0;
    loadLockMsg?.style.setProperty('display', 'none');
  };

  const isLoadLockedToFour = () => {
    if (!loadValueInput) return false;
    const opts = Array.from(loadValueInput.options || []);
    return opts.length === 1 && opts[0].value === '4';
  };

  const setLoadError = (msg = '') => {
    if (!loadError) return;
    loadError.textContent = msg;
    loadError.style.display = msg ? 'block' : 'none';
  };

  const refreshErrorAlerts = () => {
    const errorPayloads = [];
    const warningList = [...warningPayloads];
    if (electiveError) errorPayloads.push(electiveError);
    if (prereqError) errorPayloads.push(prereqError);
    if (chainDelayError) {
      const isWarning = chainDelayError.severity === 'warning';
      (isWarning ? warningList : errorPayloads).push(chainDelayError);
    }
    if (initialLoad) {
      const chainWarningOnly =
        warningList.length === 1 && warningList[0] === chainDelayError && chainDelayError?.severity === 'warning';
      if (chainWarningOnly) {
        warningList.length = 0;
      }
    }
    if (nextSemWarning) warningList.push(nextSemWarning);
    if (finalSemWarning) warningList.push(finalSemWarning);
    setAlertMessages('error', errorPayloads);
    setAlertMessages('warning', warningList);
    renderAlertButton('error');
    renderAlertButton('warning');
  };

  const updatePrereqErrors = () => {
    const completedSet = new Set(
      Array.from(subjectState.entries())
        .filter(([, st]) => st?.completed)
        .map(([code]) => code)
    );
    const plannedSet = new Set(
      Array.from(subjectState.entries())
        .filter(([, st]) => st?.toggled)
        .map(([code]) => code)
    );
    const plannedCount = getPlannedCount();
    const loadThreshold = getLoadThreshold();
    const issues = [];
    plannedSet.forEach((id) => {
      const prereqsList = prerequisites[id] || [];
      const missing = prereqsList.filter((code) => !completedSet.has(code));
      if (id === 'BIT371') {
        const { completedMajorCount, plannedMajorCount } = getMajorCounts();
        const bitReqPlanned = getBit371Requirement({
          completedSet,
          plannedSet: new Set(),
          usePlanned: true,
          completedMajorCount,
          plannedMajorCount,
        });
        const fullLoadSelected = plannedCount >= loadThreshold;
        if (!bitReqPlanned.majorCompletedEnough || (fullLoadSelected && !bitReqPlanned.majorConcurrentOk)) {
          missing.push('5 major subjects (at least 3 completed; remaining concurrent)');
        }
      }
      if (missing.length) {
        issues.push({ id, name: getSubjectName(id), missing });
      }
    });

    if (issues.length) {
      const detailList = issues
        .map((item) => {
          const concurrent = item.missing.filter((code) => plannedSet.has(code));
          const absent = item.missing.filter((code) => !plannedSet.has(code));
          const formatCode = (code) => {
            const codeLabel = `<strong>${code}</strong>`;
            return code.startsWith('BIT') ? `${codeLabel} - ${getSubjectName(code)}` : codeLabel;
          };
          const segments = [];
          if (concurrent.length) {
            segments.push(`Selected now, but should have been completed first: ${concurrent.map(formatCode).join('<br>')}`);
          }
          if (absent.length) {
            segments.push(`Missing: ${absent.map(formatCode).join('<br>')}`);
          }
          const detail = segments.join('<br>');
          return `<li><strong>${item.id}</strong> - ${item.name}<div class="tight-lead">${detail}</div></li>`;
        })
        .join('');
      prereqError = {
        title: 'Prerequisites not satisfied',
        html: `<p><strong class="alert-inline-title alert-title-error">Prerequisites not satisfied</strong> <span class="alert-inline-text">The following selected subjects have prerequisites not yet satisfied:</span></p><ul class="alert-inline-list">${detailList}</ul>`,
      };
    } else {
      prereqError = null;
    }
    refreshErrorAlerts();
  };

  const syncLoadFormState = () => {
    if (!loadModal) return;
    const isInternational = studentType === 'international';
    if (loadTypeDomestic) loadTypeDomestic.checked = !isInternational;
    if (loadTypeInternational) loadTypeInternational.checked = isInternational;
    if (loadExceptional) {
      loadExceptional.checked = exceptionalLoadApproved && isInternational;
      loadExceptional.disabled = !isInternational;
    }
    if (loadRemainingConfirm) {
      loadRemainingConfirm.checked = remainingConfirmed;
    }
    const remaining = getRemainingSubjectsCount();
    const opts = buildLoadOptions(studentType, exceptionalLoadApproved, remaining, remainingConfirmed);
    populateLoadSelect(opts, fullLoadCap);
    if (loadLockMsg) {
      loadLockMsg.style.display = 'none';
    }
    setLoadError('');
  };

  const showLoadModal = () => {
    if (!loadModal) return;
    syncLoadFormState();
    loadModal.classList.add('show');
    loadModal.setAttribute('aria-hidden', 'false');
    if (loadValueInput && !loadValueInput.disabled) loadValueInput.focus();
  };

  const hideLoadModal = () => {
    if (!loadModal) return;
    loadModal.classList.remove('show');
    loadModal.setAttribute('aria-hidden', 'true');
  };

  const applyLoadSettings = () => {
    if (!loadModal) return;
    const type = loadTypeInternational && loadTypeInternational.checked ? 'international' : 'domestic';
    const exceptional = !!(loadExceptional && loadExceptional.checked && type === 'international');
    const remaining = getRemainingSubjectsCount();
    remainingConfirmed = !!(loadRemainingConfirm && loadRemainingConfirm.checked);
    const opts = buildLoadOptions(type, exceptional, remaining, remainingConfirmed);
    let desired = parseInt(loadValueInput?.value || '4', 10);
    if (!opts.includes(desired)) {
      desired = opts.length ? opts[opts.length - 1] : 4;
    }

    setLoadError('');

    studentType = type;
    exceptionalLoadApproved = exceptional;
    fullLoadCap = desired;
    setLoadError('');
    hideLoadModal();
    conditionalRecompute({ force: true, usePlanned: false });
    updateResetState();
    updateSelectedList();
    syncLoadFormState();
    if (loadLockMsg) {
      const lockedToFour = isLoadLockedToFour();
      loadLockMsg.style.display = lockedToFour ? 'inline' : 'none';
    }
    updateVaryLoadLabel();
  };

  const initDropZone = () => {
    if (!dropZone) return;
    dropZone.style.display = isLocalEnv ? 'flex' : 'none';
    if (!isLocalEnv) return;
    const add = () => dropZone.classList.add('drag-over');
    const remove = () => dropZone.classList.remove('drag-over');
    ['dragenter', 'dragover'].forEach((evt) =>
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        add();
      })
    );
    ['dragleave', 'drop'].forEach((evt) =>
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        remove();
      })
    );
    dropZone.addEventListener('drop', (e) => {
      // Placeholder for future file handling
    });
  };

  initDropZone();

  subjects.forEach((cell) => {
    const id = cell.dataset.subject;
    if (!id) return;
    cell.classList.add('clickable');
    cell.classList.add('locked');
    cell.tabIndex = 0;
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-pressed', 'false');
  });

  const clearPlanned = () => {
    subjects.forEach((cell) => {
      cell.classList.remove('toggled');
      cell.classList.remove('satisfied');
      cell.classList.remove('can-select-now');
      cell.setAttribute('aria-pressed', 'false');
    });
  };
  const clearCompleted = () => {
    subjects.forEach((cell) => {
      cell.classList.remove('completed');
      cell.classList.remove('satisfied');
      cell.classList.remove('can-select-now');
    });
  };

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      if (clearButton.disabled) return;
      // Reset in-memory state first so all downstream UI refreshes read from the new truth.
      electivePlaceholderState = ['', '', '', ''];
      electiveBitState = ['', '', '', ''];
      subjectState.clear();
      subjects.forEach((cell) => {
        const code = cell.dataset.subject;
        if (!code || isPlaceholder(cell)) return;
        subjectState.set(code, { completed: false, toggled: false });
      });

      // Then wipe DOM classes and reapply from empty state.
      clearPlanned();
      clearCompleted();
      applySubjectStateToCells();
      setElectiveCredits([], true);

      setLivePrereqEnabled(true);
      conditionalRecompute({ force: true, usePlanned: false });
      updateResetState();
      updateElectiveWarning();
      updateSelectedList();
    });
  }

  const showInstructionsModal = () => {
    if (!instructionsModal) return;
    instructionsModal.classList.add('show');
    instructionsModal.setAttribute('aria-hidden', 'false');
    if (openInstructionsModal) openInstructionsModal.setAttribute('aria-expanded', 'true');
    if (closeInstructionsModal) closeInstructionsModal.focus();
  };

  const hideInstructionsModal = () => {
    if (!instructionsModal) return;
    instructionsModal.classList.remove('show');
    instructionsModal.setAttribute('aria-hidden', 'true');
    if (openInstructionsModal) openInstructionsModal.setAttribute('aria-expanded', 'false');
    if (openInstructionsModal) openInstructionsModal.focus();
  };

  const showCodeModal = () => {
    if (!codeModal) return;
    codeModal.classList.add('show');
    codeModal.setAttribute('aria-hidden', 'false');
    if (openCodeModal) openCodeModal.setAttribute('aria-expanded', 'true');
    if (codeInput) codeInput.focus();
  };

  const hideCodeModal = () => {
    if (!codeModal) return;
    codeModal.classList.remove('show');
    codeModal.setAttribute('aria-hidden', 'true');
    if (openCodeModal) openCodeModal.setAttribute('aria-expanded', 'false');
  };

  const getSlotAbbreviation = (slot = '') => {
    const normalized = slot.trim().toLowerCase();
    if (normalized === 'morning') return 'AM';
    if (normalized === 'afternoon') return 'PM';
    return slot;
  };

  const getSlotHeading = (slot = '') => {
    const normalized = slot.trim().toLowerCase();
    if (normalized === 'morning') return `Morning.  ${timeSlots.Morning}`;
    if (normalized === 'afternoon') return `Afternoon.  ${timeSlots.Afternoon}`;
    return slot;
  };

  const formatTimeValue = (value = '') =>
    value.replace(/(\d)(am|pm)/gi, '$1 $2').replace(/am|pm/gi, (match) => match.toUpperCase());

  const formatTimeRange = (range = '') => {
    if (!range) return '';
    return range
      .split('-')
      .map((part) => formatTimeValue(part.trim()))
      .join(' - ');
  };

  const getSemesterNote = (date = new Date()) => {
    const month = date.getMonth();
    if (month === 0 || month >= 10) return 'S1';
    if (month >= 1 && month < 6) return 'S2';
    if (month >= 6 && month < 10) return 'SS';
    return 'S1';
  };

  const getSlotHeadingWithTime = (slot = '') => {
    const abbrev = getSlotAbbreviation(slot);
    const range = formatTimeRange(timeSlots[slot] || '');
    if (!range) return abbrev;
    return `${abbrev}. ${range}`;
  };

  const getSlotStartEnd = (slot = '') => {
    const range = timeSlots[slot] || '';
    if (!range) return { start: 'TBA', end: 'TBA' };
    const [startRaw, endRaw] = range.split('-');
    return {
      start: startRaw ? formatTimeValue(startRaw.trim()) : 'TBA',
      end: endRaw ? formatTimeValue(endRaw.trim()) : 'TBA',
    };
  };

  const buildCourseTimetableGridData = () => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const slotNames = ['Morning', 'Afternoon'];
    const grid = new Map();
    dayNames.forEach((day) => {
      const slotMap = new Map();
      slotNames.forEach((slot) => slotMap.set(slot, []));
      grid.set(day, slotMap);
    });
    Object.entries(timetable).forEach(([id, data]) => {
      if (notRunningIds.has(id)) return;
      const day = data.day || '';
      const slot = data.slot || '';
      const dayMap = grid.get(day);
      if (!dayMap || !dayMap.has(slot)) return;
      dayMap.get(slot).push({ id, data });
    });
    grid.forEach((slotMap) => {
      slotMap.forEach((entries, slot) => {
        entries.sort((a, b) => a.id.localeCompare(b.id));
      });
    });
    return { dayNames, slotNames, grid };
  };

  const buildCourseTimetableTooltip = (id) => {
    const categoryInfo = describeSubjectCategory(id);
    const isCore = categoryInfo.category === 'Core';
    const categoryLabel = isCore ? 'Core subject' : 'Major/Elective subject';
    const streamLabel = !isCore ? (categoryInfo.stream || buildStreamLabel(id)) : '';
    const prereqList = prerequisites[id] || [];
    const coreqList = corequisites[id] || [];
    const depsList =
      dependents[id] && dependents[id].length
        ? dependents[id].filter((code) => !String(code).toUpperCase().startsWith('ELECTIVE'))
        : [];
    const lines = [
      { label: 'Category', value: categoryLabel },
      !isCore ? { label: 'Stream', value: streamLabel } : null,
      { label: 'Prerequisites', value: prereqList.length ? prereqList.join(', ') : 'None' },
      coreqList.length ? { label: 'Co-requisites', value: coreqList.join(', ') } : null,
      { label: 'Needed for', value: depsList.length ? depsList.join(', ') : 'None' },
    ].filter(Boolean);

    const tooltip = document.createElement('div');
    tooltip.className = 'course-tooltip';
    lines.forEach(({ label, value }) => {
      const line = document.createElement('div');
      line.className = 'course-tooltip-line';
      const labelEl = document.createElement('span');
      labelEl.className = 'course-tooltip-label';
      labelEl.textContent = `${label}:`;
      const valueEl = document.createElement('span');
      valueEl.className = 'course-tooltip-value';
      valueEl.textContent = ` ${value}`;
      line.appendChild(labelEl);
      line.appendChild(valueEl);
      tooltip.appendChild(line);
    });
    return tooltip;
  };

  const buildCourseTimetableItemList = (entries) => {
    if (!entries.length) return null;
    const list = document.createElement('ul');
    list.className = 'course-timetable-list';
    entries.forEach(({ id, data }) => {
      const item = document.createElement('li');
      item.className = 'course-timetable-item';
      item.appendChild(buildCourseTimetableTooltip(id));
      const row = document.createElement('div');
      row.className = 'course-timetable-item-row';
      const code = document.createElement('span');
      code.className = 'course-timetable-code';
      code.textContent = id;
      const name = document.createElement('span');
      name.className = 'course-timetable-name';
      name.textContent = getSubjectName(id);
      row.appendChild(code);
      row.appendChild(name);
      item.appendChild(row);
      const meta = document.createElement('div');
      meta.className = 'course-timetable-meta';
      const room = data.room ? `Room: ${data.room}` : 'Room: TBA';
      const teacher = data.teacher ? `Lecturer: ${data.teacher}` : 'Lecturer: TBA';
      meta.textContent = `${room} \u00b7 ${teacher}`;
      item.appendChild(meta);
      list.appendChild(item);
    });
    return list;
  };

  const updateCourseTimetableButtons = () => {
    const isList = courseTimetableView === 'list';
    if (courseTimetableGridButton) {
      courseTimetableGridButton.classList.toggle('is-inactive', !isList);
      courseTimetableGridButton.disabled = !isList;
      courseTimetableGridButton.setAttribute('aria-pressed', (!isList).toString());
    }
    if (courseTimetableListButton) {
      courseTimetableListButton.classList.toggle('is-inactive', isList);
      courseTimetableListButton.disabled = isList;
      courseTimetableListButton.setAttribute('aria-pressed', isList.toString());
    }
  };

  const setCourseTimetableView = (view) => {
    courseTimetableView = view;
    updateCourseTimetableButtons();
    if (courseTimetableModal && courseTimetableModal.classList.contains('show')) {
      renderCourseTimetableModal();
    }
  };

  const renderCourseTimetableModal = () => {
    if (!courseTimetableContent) return;
    courseTimetableContent.innerHTML = '';
    const { dayNames, slotNames, grid } = buildCourseTimetableGridData();
    const isList = courseTimetableView === 'list';
    courseTimetableContent.classList.toggle('course-timetable-list-mode', isList);
    if (isList) {
      dayNames.forEach((day) => {
        slotNames.forEach((slot) => {
          const entries = grid.get(day)?.get(slot) || [];
          const section = document.createElement('section');
          section.className = 'course-timetable-section';
          const heading = document.createElement('div');
          heading.className = 'course-timetable-heading';
          const dayLabel = document.createElement('span');
          dayLabel.className = 'course-timetable-day-label';
          dayLabel.textContent = day;
          const slotLabel = document.createElement('span');
          slotLabel.className = 'course-timetable-slot-label';
          slotLabel.textContent = getSlotAbbreviation(slot);
          heading.appendChild(dayLabel);
          heading.appendChild(document.createTextNode(' '));
          heading.appendChild(slotLabel);
          const timeRange = formatTimeRange(timeSlots[slot] || '');
          if (timeRange) {
            const timeLabel = document.createElement('span');
            timeLabel.className = 'course-timetable-time-range';
            timeLabel.textContent = `. ${timeRange}`;
            heading.appendChild(timeLabel);
          }
          section.appendChild(heading);
          const list = buildCourseTimetableItemList(entries);
          if (!list) {
            const empty = document.createElement('div');
            empty.className = 'course-timetable-empty';
            empty.textContent = 'No subjects running.';
            section.appendChild(empty);
          } else {
            section.appendChild(list);
          }
          courseTimetableContent.appendChild(section);
        });
      });
    } else {
      const table = document.createElement('table');
      table.className = 'course-timetable-table';
      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      const corner = document.createElement('th');
      corner.className = 'course-timetable-corner';
      corner.textContent = 'Day';
      headRow.appendChild(corner);
      slotNames.forEach((slot) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = getSlotHeading(slot);
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      dayNames.forEach((day) => {
        const row = document.createElement('tr');
        const dayCell = document.createElement('th');
        dayCell.scope = 'row';
        dayCell.className = 'course-timetable-day';
        dayCell.textContent = day;
        row.appendChild(dayCell);
        slotNames.forEach((slot) => {
          const td = document.createElement('td');
          const entries = grid.get(day)?.get(slot) || [];
          const list = buildCourseTimetableItemList(entries);
          if (!list) {
            const empty = document.createElement('div');
            empty.className = 'course-timetable-empty';
            empty.textContent = 'No subjects running.';
            td.appendChild(empty);
          } else {
            td.appendChild(list);
          }
          row.appendChild(td);
        });
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      courseTimetableContent.appendChild(table);
    }
    if (courseTimetableNotRunningList) {
      courseTimetableNotRunningList.innerHTML = '';
      const ids = Array.from(notRunningIds).sort();
      if (!ids.length) {
        const item = document.createElement('li');
        item.textContent = 'None';
        courseTimetableNotRunningList.appendChild(item);
      } else {
        ids.forEach((id) => {
          const item = document.createElement('li');
          const name = getSubjectName(id);
          item.textContent = name ? `${id} ${name}` : id;
          item.appendChild(buildCourseTimetableTooltip(id));
          courseTimetableNotRunningList.appendChild(item);
        });
      }
    }
  };

  const copyCourseTimetableForWord = () => {
    if (!navigator.clipboard) return;
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const slotOrder = { Morning: 0, Afternoon: 1 };
    const noteValue = getSemesterNote();
    const rows = Object.entries(timetable)
      .filter(([id]) => !notRunningIds.has(id))
      .map(([id, data]) => {
        const { start, end } = getSlotStartEnd(data.slot || '');
        return {
          code: id,
          name: getSubjectName(id),
          room: data.room || 'TBA',
          day: data.day || 'TBA',
          start,
          end,
          staff: data.teacher || 'TBA',
          note: noteValue,
          slot: data.slot || '',
        };
      })
      .sort((a, b) => {
        const dayA = dayOrder.indexOf(a.day);
        const dayB = dayOrder.indexOf(b.day);
        const dayIndexA = dayA === -1 ? 99 : dayA;
        const dayIndexB = dayB === -1 ? 99 : dayB;
        if (dayIndexA !== dayIndexB) return dayIndexA - dayIndexB;
        const slotIndexA = slotOrder[a.slot] ?? 99;
        const slotIndexB = slotOrder[b.slot] ?? 99;
        if (slotIndexA !== slotIndexB) return slotIndexA - slotIndexB;
        return a.code.localeCompare(b.code);
      });

    const header = ['Subject Code', 'Day', 'Rooms', 'Start', 'End', 'Staff', 'Note', 'Subject Name'];
    const textRows = [header];
    rows.forEach((row) => {
      textRows.push([row.code, row.day, row.room, row.start, row.end, row.staff, row.note, row.name]);
    });
    const text = textRows.map((row) => row.join('\t')).join('\n');

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.border = '1px solid #ccc';
    table.style.fontFamily = 'Calibri, Arial, sans-serif';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    header.forEach((label) => {
      const th = document.createElement('th');
      th.textContent = label;
      th.style.border = '1px solid #ccc';
      th.style.padding = '4px 6px';
      th.style.background = '#efefef';
      th.style.textAlign = 'left';
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      [row.code, row.day, row.room, row.start, row.end, row.staff, row.note, row.name].forEach((value) => {
        const td = document.createElement('td');
        td.textContent = value;
        td.style.border = '1px solid #ccc';
        td.style.padding = '4px 6px';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    const html = table.outerHTML;

    if (window.ClipboardItem) {
      const blobInput = {
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      };
      navigator.clipboard.write([new ClipboardItem(blobInput)]).catch(() => {
        navigator.clipboard.writeText(text).catch(() => { });
      });
    } else {
      navigator.clipboard.writeText(text).catch(() => { });
    }
  };

  const copyCourseTimetableToClipboard = () => {
    if (!navigator.clipboard) return;
    const { dayNames, slotNames, grid } = buildCourseTimetableGridData();
    const textRows = [];
    textRows.push(['Day', ...slotNames.map(getSlotHeading)].join('\t'));
    dayNames.forEach((day) => {
      const rowCells = [day];
      slotNames.forEach((slot) => {
        const entries = grid.get(day)?.get(slot) || [];
        const cellText = entries.length
          ? entries
            .map(({ id, data }) => {
              const name = getSubjectName(id);
              const room = data.room ? `Room: ${data.room}` : 'Room: TBA';
              const teacher = data.teacher ? `Lecturer: ${data.teacher}` : 'Lecturer: TBA';
              return `${id} ${name} (${room}; ${teacher})`;
            })
            .join('; ')
          : 'No subjects running.';
        rowCells.push(cellText);
      });
      textRows.push(rowCells.join('\t'));
    });
    const text = textRows.join('\n');

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.border = '1px solid #ccc';
    table.style.fontFamily = 'Calibri, Arial, sans-serif';
    table.style.fontSize = '12px';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const corner = document.createElement('th');
    corner.textContent = 'Day';
    corner.style.border = '1px solid #ccc';
    corner.style.padding = '6px 8px';
    corner.style.textAlign = 'center';
    corner.style.background = '#f2f2f2';
    headRow.appendChild(corner);
    slotNames.forEach((slot) => {
      const th = document.createElement('th');
      th.textContent = getSlotHeading(slot);
      th.style.border = '1px solid #ccc';
      th.style.padding = '6px 8px';
      th.style.textAlign = 'left';
      th.style.background = '#f2f2f2';
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    dayNames.forEach((day) => {
      const row = document.createElement('tr');
      const dayCell = document.createElement('th');
      dayCell.textContent = day;
      dayCell.style.border = '1px solid #ccc';
      dayCell.style.padding = '6px 8px';
      dayCell.style.textAlign = 'left';
      dayCell.style.background = '#f9f9f9';
      row.appendChild(dayCell);
      slotNames.forEach((slot) => {
        const td = document.createElement('td');
        td.style.border = '1px solid #ccc';
        td.style.padding = '6px 8px';
        td.style.verticalAlign = 'top';
        const entries = grid.get(day)?.get(slot) || [];
        if (!entries.length) {
          td.textContent = 'No subjects running.';
        } else {
          entries.forEach(({ id, data }) => {
            const line = document.createElement('div');
            const code = document.createElement('strong');
            code.textContent = `${id} `;
            const name = document.createElement('span');
            name.textContent = getSubjectName(id);
            const meta = document.createElement('div');
            meta.style.fontSize = '11px';
            meta.style.color = '#444';
            const room = data.room ? `Room: ${data.room}` : 'Room: TBA';
            const teacher = data.teacher ? `Lecturer: ${data.teacher}` : 'Lecturer: TBA';
            meta.textContent = `${room} \u00b7 ${teacher}`;
            line.appendChild(code);
            line.appendChild(name);
            td.appendChild(line);
            td.appendChild(meta);
          });
        }
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    const html = table.outerHTML;

    if (window.ClipboardItem) {
      const blobInput = {
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      };
      navigator.clipboard.write([new ClipboardItem(blobInput)]).catch(() => {
        navigator.clipboard.writeText(text).catch(() => { });
      });
    } else {
      navigator.clipboard.writeText(text).catch(() => { });
    }
  };

  const updateCourseTimetableTeacherCopyButton = () => {
    if (!courseTimetableTeacherCopyButton) return;
    courseTimetableTeacherCopyButton.hidden = !isSharePointHost;
  };

  const showCourseTimetableModal = () => {
    if (!courseTimetableModal) return;
    renderCourseTimetableModal();
    updateCourseTimetableTeacherCopyButton();
    courseTimetableModal.classList.add('show');
    courseTimetableModal.setAttribute('aria-hidden', 'false');
    if (showCourseTimetableButton) showCourseTimetableButton.setAttribute('aria-expanded', 'true');
    if (closeCourseTimetableCta) closeCourseTimetableCta.focus();
    updateCourseTimetableButtons();
  };

  const hideCourseTimetableModal = () => {
    if (!courseTimetableModal) return;
    courseTimetableModal.classList.remove('show');
    courseTimetableModal.setAttribute('aria-hidden', 'true');
    if (showCourseTimetableButton) showCourseTimetableButton.setAttribute('aria-expanded', 'false');
    if (showCourseTimetableButton) showCourseTimetableButton.focus();
  };

  const applyCodes = () => {
    if (!codeInput) return;
    const raw = codeInput.value || '';
    const matches = raw.toUpperCase().match(/(BIT\d{3}|USE101|USE102|USE201|USE202|USE301)/g) || [];
    const uniqueCodes = Array.from(new Set(matches));

    const electivePlaceholders = getElectivePlaceholders();

    const useCodes = uniqueCodes.filter((code) => code.startsWith('USE'));
    let electiveIndex = 0;

    uniqueCodes.forEach((code) => {
      if (code.startsWith('USE')) {
        if (electiveIndex < electivePlaceholders.length) {
          electivePlaceholderState[electiveIndex] = code;
          electiveIndex += 1;
        }
        return;
      }
      const cell = subjects.find((c) => c.dataset.subject === code);
      if (!cell) return;
      subjectState.set(code, { completed: true, toggled: false });
    });

    codeInput.value = '';
    hideCodeModal();
    electivePlaceholderState = electivePlaceholderState.map((val, idx) => useCodes[idx] || '');
    applySubjectStateToCells();
    rebuildElectiveBitStateFromState();
    conditionalRecompute({ force: true, usePlanned: false });
    updateResetState();
    // Important: Always call setElectiveCredits AFTER storing electivePlaceholderState, and before other updates
    // This ensures the pills are created/preserved with the latest data
    const assignments = buildElectiveAssignments();
    setElectiveCredits(assignments, true);
    updateElectiveWarning();
    updateSelectedList();
  };

  const handleToggle = (cell) => {
    const id = cell.dataset.subject;
    if (!id) return;
    const placeholder = isPlaceholder(cell);
    const notThisSem = notRunningIds.has(id);
    if (!completedMode && notThisSem) return;
    const placeholders = placeholder ? getElectivePlaceholders() : [];
    const placeholderIdx = placeholder ? placeholders.indexOf(cell) : -1;
    if (placeholder && placeholderIdx >= 0) {
      const bitCode = electiveBitState[placeholderIdx];
      if (bitCode) {
        subjectState.set(bitCode, { completed: false, toggled: false });
        electiveBitState[placeholderIdx] = '';
        cell.classList.remove('completed', 'filled-elective', 'use-credit', 'toggled');
        cell.setAttribute('aria-pressed', 'false');
        fillFirstFreeSlotFromOverflow();
        applySubjectStateToCells();
        setElectiveCredits(buildElectiveAssignments(), true);
        updateElectiveWarning();
        updateSelectedList();
        conditionalRecompute({ force: true, usePlanned: false });
        updateResetState();
        return;
      }
    }
    if (completedMode) {
      // Credits mode
      if (placeholder) {
        const placeholders = getElectivePlaceholders();
        const idx = placeholders.indexOf(cell);
        if (idx >= 0) {
          const currentCode = electivePlaceholderState[idx];
          if (currentCode) {
            // Toggle off always allowed; then compact leftwards
            electivePlaceholderState[idx] = '';
            cell.classList.remove('completed', 'filled-elective', 'use-credit');
            cell.setAttribute('aria-pressed', 'false');
            fillFirstFreeSlotFromOverflow();
          } else {
            const nextUse = electiveCodeOrder.find((code) => !electivePlaceholderState.includes(code));
            if (!nextUse) return;
            electivePlaceholderState[idx] = nextUse;
            cell.classList.add('completed');
            cell.classList.remove('toggled');
            cell.setAttribute('aria-pressed', 'false');
          }
          setElectiveCredits(buildElectiveAssignments(), true);
          updateElectiveWarning();
          updateSelectedList();
          conditionalRecompute({ force: true, usePlanned: false });
          updateResetState();
          return;
        }
      }

      const st = subjectState.get(id) || { completed: false, toggled: false };
      const nowCompleted = !st.completed;
      subjectState.set(id, { completed: nowCompleted, toggled: false });
      cell.classList.toggle('completed', nowCompleted);
      cell.classList.toggle('toggled', false);
      if (nowCompleted) {
        cell.classList.remove('satisfied');
        cell.classList.remove('can-select-now');
        cell.setAttribute('aria-pressed', 'false');
      }
    } else {
      if (placeholder) {
        const placeholders = getElectivePlaceholders();
        const idx = placeholders.indexOf(cell);
        if (idx >= 0) {
          const currentCode = electivePlaceholderState[idx];
          if (currentCode) {
            electivePlaceholderState[idx] = '';
            cell.classList.remove('completed', 'filled-elective', 'use-credit');
            cell.setAttribute('aria-pressed', 'false');
            fillFirstFreeSlotFromOverflow();
          } else {
            const nextUse = electiveCodeOrder.find((code) => !electivePlaceholderState.includes(code));
            if (!nextUse) return;
            electivePlaceholderState[idx] = nextUse;
            cell.classList.add('completed');
            cell.classList.remove('toggled');
            cell.setAttribute('aria-pressed', 'false');
          }
          setElectiveCredits(buildElectiveAssignments(), true);
          updateElectiveWarning();
          updateSelectedList();
          conditionalRecompute({ force: true, usePlanned: false });
          updateResetState();
          return;
        }
      }
      const st = subjectState.get(id) || { completed: false, toggled: false };
      if (st.completed) return;
      const already = !!st.toggled;
      if (!already) {
        if (!overrideMode) {
          const completed = new Set(
            Array.from(subjectState.entries())
              .filter(([, s]) => s?.completed)
              .map(([code]) => code)
          );
          const plannedSet = new Set(
            Array.from(subjectState.entries())
              .filter(([code, s]) => s?.toggled && code !== id)
              .map(([code]) => code)
          );
          const { prereqMetNow, coreqMetPlanned } = getRequisiteStatus({
            id,
            completedSet: completed,
            plannedSet,
            usePlanned: true,
          });
          const hasCoreq = (corequisites[id] || []).length > 0;
          if (!prereqMetNow) return;
          if (hasCoreq && !coreqMetPlanned) return;
          if (id === 'BIT371') {
            const { completedMajorCount, plannedMajorCount } = getMajorCounts();
            const bitReq = getBit371Requirement({
              completedSet: completed,
              plannedSet,
              usePlanned: true,
              completedMajorCount,
              plannedMajorCount,
            });
            if (!bitReq.metPlanned) return;
          }
        }
        if (!canSelectPlanned()) return;
      }
      const active = !already;
      subjectState.set(id, { completed: st.completed, toggled: active });
      cell.classList.toggle('toggled', active);
      cell.setAttribute('aria-pressed', active ? 'true' : 'false');
      cell.classList.toggle('hide-tooltip', active);
      if (active) {
        cell.classList.remove('satisfied');
        cell.classList.remove('can-select-now');
      } else {
        cell.classList.remove('hide-tooltip');
      }
    }
    // Sync BIT slot state after any toggle on elective grid cells
    if (!placeholder && id.startsWith('BIT') && isElectivesGridCell(cell)) {
      updateBitStateAfterToggle(cell);
    }
    conditionalRecompute({ force: completedMode, usePlanned: completedMode ? false : null });
    updateResetState();
    updateElectiveWarning();
    updateSelectedList();
    setElectiveCredits(buildElectiveAssignments());
    updateWarnings();
  };

  subjects.forEach((cell) => {
    cell.addEventListener('click', () => handleToggle(cell));
    cell.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle(cell);
      }
    });
  });

  if (completedModeButton) {
    completedModeButton.addEventListener('click', () => {
      const enteringCompleted = !completedMode;
      completedMode = !completedMode;
      if (enteringCompleted) {
        clearPlanned();
        conditionalRecompute({ force: true, usePlanned: false });
        updateSelectedList();
        updateElectiveWarning();
      }
      updateCompletedModeUI();
      updateResetState();
      if (!completedMode) {
        conditionalRecompute({ force: true, usePlanned: true });
      }
    });
  }

  if (overrideToggle) {
    overrideToggle.addEventListener('change', () => {
      overrideMode = overrideToggle.checked;
      updateOverrideUI();
    });
  }
  if (livePrereqToggle) {
    livePrereqToggle.addEventListener('change', () => {
      livePrereqUpdates = livePrereqToggle.checked;
      setLivePrereqEnabled(true);
    });
  }

  if (openInstructionsModal) openInstructionsModal.addEventListener('click', showInstructionsModal);
  if (closeInstructionsModal) closeInstructionsModal.addEventListener('click', hideInstructionsModal);
  if (closeInstructionsCta) closeInstructionsCta.addEventListener('click', hideInstructionsModal);
  if (openCodeModal) openCodeModal.addEventListener('click', () => {
    if (openCodeModal.disabled) return;
    showCodeModal();
  });
  if (closeCodeModal) closeCodeModal.addEventListener('click', hideCodeModal);
  if (cancelCodeModal) cancelCodeModal.addEventListener('click', hideCodeModal);
  if (applyCodeModal) applyCodeModal.addEventListener('click', applyCodes);
  if (showCourseTimetableButton) showCourseTimetableButton.addEventListener('click', showCourseTimetableModal);
  if (closeCourseTimetable) closeCourseTimetable.addEventListener('click', hideCourseTimetableModal);
  if (closeCourseTimetableCta) closeCourseTimetableCta.addEventListener('click', hideCourseTimetableModal);
  if (courseTimetableListButton) {
    courseTimetableListButton.addEventListener('click', () => setCourseTimetableView('list'));
  }
  if (courseTimetableGridButton) {
    courseTimetableGridButton.addEventListener('click', () => setCourseTimetableView('grid'));
  }
  if (copyCourseTimetableButton) {
    copyCourseTimetableButton.addEventListener('click', copyCourseTimetableToClipboard);
  }
  if (courseTimetableTeacherCopyButton) {
    courseTimetableTeacherCopyButton.addEventListener('click', copyCourseTimetableForWord);
    courseTimetableTeacherCopyButton.hidden = !isSharePointHost;
  }
  if (codeInput) {
    codeInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        applyCodes();
      }
    });
  }

  subjects.forEach((cell) => {
    const id = cell.dataset.subject;
    const data = timetable[id];

    if (id && id.startsWith('ELECTIVE')) {
      cell.classList.add('elective-placeholder');
      cell.classList.remove('clickable');
      cell.tabIndex = 0;
      cell.querySelectorAll('.not-running-tooltip').forEach((tip) => tip.remove());
      attachTooltip(cell);
      return;
    }

    if (notRunningIds.has(id)) {
      ensureNotThisSemUI(cell);
    }
    if (id === 'BIT371' || id === 'BIT372') {
      cell.classList.add('capstone');
    }

    attachTooltip(cell);
  });

  function buildStreamLabel(cellOrId) {
    const id = typeof cellOrId === 'string' ? cellOrId : cellOrId?.dataset?.subject;
    const metaClasses = id ? subjectMeta[id]?.classes || [] : [];
    const has = (cls) =>
      metaClasses.includes(cls) || (cellOrId?.classList && cellOrId.classList.contains(cls));
    if (has('core')) return 'Core';
    if (has('network')) return 'Network Security';
    if (has('software')) return 'Software Development';
    if (has('ba')) return 'Business Analytics';
    if (has('dual') || has('dual-split')) return 'Business Analytics & Software Development';
    if (id && (id.startsWith('ELECTIVE') || id.startsWith('USE'))) return 'Elective';
    if (has('elective')) return 'Elective';
    return 'Other';
  }

  function describeSubjectCategory(cellOrId) {
    const id = typeof cellOrId === 'string' ? cellOrId : cellOrId?.dataset?.subject;
    if (!id) return { category: 'Subject', stream: '' };
    const metaClasses = subjectMeta[id]?.classes || [];
    const isCore = metaClasses.includes('core');
    const isElective = metaClasses.includes('elective') || id.startsWith('ELECTIVE') || id.startsWith('USE');
    const stream = buildStreamLabel(cellOrId || id);
    if (isCore) return { category: 'Core', stream: '' };
    if (isElective) return { category: 'Elective', stream };
    return { category: 'Major', stream };
  }

  let currentTableMode = 'selected';
  const historySortState = { key: 'code', direction: 'asc' };

  const renderTimetableTable = (rowsOverride = null, highlightSelection = false) => {
    if (!timetableTable) return;
    const tbody = timetableTable.querySelector('tbody');
    tbody.innerHTML = '';
    const rows = rowsOverride || getSelectedRows();

    const toRender = rows.length ? rows : [{ id: 'N/A', data: {}, cell: null, dayShort: '', slot: '', placeholder: true }];

    toRender.forEach(({ cell, id, data, dayShort, slot, placeholder, isChosen }) => {
      const row = document.createElement('tr');
      if (placeholder) {
        const td = document.createElement('td');
        td.textContent = 'No subjects to show.';
        td.colSpan = 7;
        row.appendChild(td);
      } else {
        const name = getSubjectName(id);
        const day = dayShort || 'N/A';
        const time = data.slot ? (timeSlots[data.slot] || data.slot) : 'N/A';
        const room = data.room || 'N/A';
        const teacher = data.teacher || 'N/A';
        const stream = buildStreamLabel(id);
        row.dataset.subject = id;
        row.style.cursor = 'pointer';
        applyDisplayTypeClass(row, cell || id);
        if (highlightSelection && isChosen) {
          row.classList.add('chosen-row');
        }

        const updateTooltip = (e, showNow = false) => {
          const willRemove = !!subjectState.get(id)?.toggled;
          hoverTooltip.innerHTML = willRemove
            ? 'Click to <span class="remove">remove</span> this subject from the timetable'
            : 'Click to <span class="add">add</span> this subject to the timetable';
          hoverTooltip.style.left = `${(e?.clientX || 0) + 28}px`;
          hoverTooltip.style.top = `${(e?.clientY || 0) + 6}px`;
          if (showNow) hoverTooltip.style.display = 'block';
        };
        row.addEventListener('mouseenter', (e) => {
          row.style.fontWeight = '700';
          if (hoverTooltipTimer) clearTimeout(hoverTooltipTimer);
          updateTooltip(e, false);
          hoverTooltipTimer = setTimeout(() => updateTooltip(e, true), 4000);
        });
        row.addEventListener('mousemove', (e) => {
          const isVisible = hoverTooltip.style.display === 'block';
          updateTooltip(e, isVisible);
        });
        row.addEventListener('mouseleave', () => {
          row.style.fontWeight = '';
          if (hoverTooltipTimer) clearTimeout(hoverTooltipTimer);
          hoverTooltip.style.display = 'none';
        });

        row.addEventListener('click', () => {
          const targetCell = subjects.find((c) => c.dataset.subject === id);
          if (targetCell) targetCell.click();
          refreshTimetableModalState();
        });
        [id, name, day, time, room, teacher, stream].forEach((val) => {
          const td = document.createElement('td');
          td.textContent = val;
          row.appendChild(td);
        });
      }
      tbody.appendChild(row);
    });
  };

  const renderSubjectTable = (tableEl, rows, emptyMessage = 'No subjects to show.') => {
    if (!tableEl) return;
    const tbody = tableEl.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const items = rows || [];
    const columns =
      tableEl.id === 'history-table'
        ? ['code', 'name', 'result', 'date', 'stream']
        : ['code', 'name', 'stream'];
    if (!items.length) {
      const row = document.createElement('tr');
      const td = document.createElement('td');
      td.textContent = emptyMessage;
      td.colSpan = columns.length;
      row.appendChild(td);
      tbody.appendChild(row);
      return;
    }
    items.forEach(({ cell, id, result = '', date = '' }) => {
      const row = document.createElement('tr');
      row.dataset.subject = id;
      applyDisplayTypeClass(row, cell || id);
      const name = getSubjectName(id);
      const stream = buildStreamLabel(id);
      const valueMap = {
        code: id,
        name,
        result,
        date,
        stream,
      };
      columns.forEach((col) => {
        const td = document.createElement('td');
        td.textContent = valueMap[col] ?? '';
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
  };

  const getHistorySortValue = (row, key) => {
    const id = row?.id || '';
    if (key === 'code') return id;
    if (key === 'result') return row?.result || '';
    if (key === 'date') return row?.date || '';
    if (key === 'stream') return buildStreamLabel(id);
    return '';
  };

  const sortHistoryRows = (rows) => {
    const { key, direction } = historySortState;
    const dir = direction === 'desc' ? -1 : 1;
    return [...rows].sort((a, b) => {
      const aVal = getHistorySortValue(a, key);
      const bVal = getHistorySortValue(b, key);
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
      if (cmp !== 0) return cmp * dir;
      return String(a.id || '').localeCompare(String(b.id || ''), undefined, { numeric: true, sensitivity: 'base' }) * dir;
    });
  };

  const updateHistorySortButtons = () => {
    historySortButtons.forEach((btn) => {
      const key = btn.dataset.sort;
      const isActive = key === historySortState.key;
      const direction = historySortState.direction;
      btn.textContent = isActive && direction === 'desc' ? 'Z...A' : 'A...Z';
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.classList.toggle('is-active', isActive);
    });
  };

  const renderHistoryModal = () => {
    const rows = sortHistoryRows(getHistoryRows());
    renderSubjectTable(historyTable, rows, 'No completed subjects to show.');
    updateHistorySortButtons();
  };

  const adjustTableColumnWidths = () => {
    if (!timetableTable) return;
    // Skip if table isn't currently visible
    const tableVisible = timetableTable.offsetParent !== null;
    if (!tableVisible) return;

    const rows = Array.from(timetableTable.querySelectorAll('tr'));
    if (!rows.length) return;
    const columnCount = rows[0].children.length || 0;
    if (!columnCount) return;

    const modalEl = timetableModal?.querySelector('.modal');
    const overlay = timetableModal;

    const preservePosition = (fn) => {
      if (!modalEl || !overlay || !overlay.classList.contains('show')) {
        fn();
        return;
      }
      const rect = modalEl.getBoundingClientRect();
      const prev = {
        position: modalEl.style.position,
        left: modalEl.style.left,
        top: modalEl.style.top,
        transform: modalEl.style.transform,
        width: modalEl.style.width,
        maxWidth: modalEl.style.maxWidth,
      };
      modalEl.style.position = 'fixed';
      modalEl.style.left = `${rect.left}px`;
      modalEl.style.top = `${rect.top}px`;
      modalEl.style.transform = 'none';
      modalEl.style.width = `${rect.width}px`;
      modalEl.style.maxWidth = `${rect.width}px`;
      fn();
      requestAnimationFrame(() => {
        modalEl.style.position = prev.position;
        modalEl.style.left = prev.left;
        modalEl.style.top = prev.top;
        modalEl.style.transform = prev.transform;
        modalEl.style.width = prev.width;
        modalEl.style.maxWidth = prev.maxWidth;
      });
    };

    const measureBoldWidths = () => {
      const clone = timetableTable.cloneNode(true);
      clone.style.visibility = 'hidden';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '-9999px';
      clone.style.width = 'auto';
      clone.style.maxWidth = 'none';
      Array.from(clone.querySelectorAll('th,td')).forEach((cell) => {
        cell.style.fontWeight = '700';
        cell.style.width = '';
        cell.style.minWidth = '';
      });
      document.body.appendChild(clone);
      const widths = Array(columnCount).fill(0);
      Array.from(clone.querySelectorAll('tr')).forEach((row) => {
        Array.from(row.children).forEach((cell, idx) => {
          const w = cell.getBoundingClientRect().width;
          if (w > widths[idx]) widths[idx] = w;
        });
      });
      document.body.removeChild(clone);
      return widths;
    };

    preservePosition(() => {
      // Reset any inline sizing
      rows.forEach((row) =>
        Array.from(row.children).forEach((cell) => {
          cell.style.width = '';
          cell.style.minWidth = '';
        })
      );

      const widths = measureBoldWidths();

      widths.forEach((w, idx) => {
        const target = Math.max(0, Math.round(w * 1.05) + 1);
        rows.forEach((row) => {
          const cell = row.children[idx];
          if (cell) {
            cell.style.minWidth = `${target}px`;
            cell.style.width = `${target}px`;
          }
        });
      });
    });
  };

  const scheduleAdjustTimetable = () => {
    if (!timetableTable) return;
    requestAnimationFrame(adjustTableColumnWidths);
  };

  const setTimetableModalMode = (mode) => {
    if (!timetableModal) return;
    timetableModal.dataset.mode = mode;
    timetableModal.classList.toggle('mode-available', mode === 'available');
    timetableModal.classList.toggle('mode-selected', mode === 'selected');
  };

  const showTimetableModal = () => {
    if (!timetableModal) return;
    currentTableMode = 'selected';
    setTimetableModalMode(currentTableMode);
    if (timetableTitleEl) {
      const now = new Date();
      const label = getTimetableLabel(now);
      timetableTitleEl.textContent = `Timetable for ${label}. Prepared ${formatDate(now)}`;
    }
    renderTimetableTable();
    timetableModal.classList.add('show');
    timetableModal.setAttribute('aria-hidden', 'false');
    lockModalPosition();
    scheduleAdjustTimetable();
  };

  const showAvailableModal = () => {
    if (!timetableModal) return;
    const selectedCount = getSelectedRows().length;
    const threshold = getLoadThreshold();
    if (availableHeading) {
      availableHeading.style.display = '';
    }
    currentTableMode = selectedCount >= threshold ? 'selected' : 'available';
    setTimetableModalMode(currentTableMode);
    if (timetableTitleEl) {
      if (currentTableMode === 'available') {
        timetableTitleEl.textContent = 'Available subjects (click to add)';
      } else {
        const now = new Date();
        timetableTitleEl.textContent = `Timetable for ${getTimetableLabel(now)}. Prepared ${formatDate(now)}`;
      }
    }
    const rows = currentTableMode === 'available' ? getAvailableRows() : getSelectedRows();
    renderTimetableTable(rows, true);
    timetableModal.classList.add('show');
    timetableModal.setAttribute('aria-hidden', 'false');
    lockModalPosition();
    scheduleAdjustTimetable();
  };

  const showHistoryModal = () => {
    if (!historyModal) return;
    renderHistoryModal();
    historyModal.classList.add('show');
    historyModal.setAttribute('aria-hidden', 'false');
  };

  const hideHistoryModal = () => {
    if (!historyModal) return;
    historyModal.classList.remove('show');
    historyModal.setAttribute('aria-hidden', 'true');
  };

  const showNextSemesterModal = () => {
    if (!nextSemesterModal) return;
    const rows = getNextSemTableRows();
    renderSubjectTable(nextSemesterTable, rows, 'No subjects available next semester.');
    nextSemesterModal.classList.add('show');
    nextSemesterModal.setAttribute('aria-hidden', 'false');
  };

  const hideNextSemesterModal = () => {
    if (!nextSemesterModal) return;
    nextSemesterModal.classList.remove('show');
    nextSemesterModal.setAttribute('aria-hidden', 'true');
  };

  const refreshTimetableModalState = () => {
    if (!timetableModal || !timetableModal.classList.contains('show')) return;
    const selectedCount = getSelectedRows().length;
    const threshold = getLoadThreshold();
    let mode = currentTableMode;
    if (mode === 'available' && selectedCount >= threshold) mode = 'selected';
    if (mode === 'selected' && selectedCount < threshold) mode = 'available';
    currentTableMode = mode;
    setTimetableModalMode(currentTableMode);
    if (availableHeading) {
      availableHeading.style.display = '';
    }
    if (timetableTitleEl) {
      if (mode === 'available') {
        timetableTitleEl.textContent = 'Available subjects (click to add)';
      } else {
        const now = new Date();
        timetableTitleEl.textContent = `Timetable for ${getTimetableLabel(now)}. Prepared ${formatDate(now)}`;
      }
    }
    const rows = mode === 'available' ? getAvailableRows() : getSelectedRows();
    renderTimetableTable(rows, true);
    scheduleAdjustTimetable();
  };

  const hideTimetableModal = () => {
    if (!timetableModal) return;
    unlockModalPosition();
    timetableModal.classList.remove('show');
    timetableModal.setAttribute('aria-hidden', 'true');
  };

  const getCssVar = (name, fallback = '') => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return v && v.trim() ? v.trim() : fallback;
  };
  const isMobileDevice = () => {
    const ua = (navigator?.userAgent || '').toLowerCase();
    const touchHint = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const uaMobile = /mobi|android|iphone|ipad|ipod/.test(ua);
    const narrow = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
    return uaMobile || (touchHint && narrow) || narrow;
  };
  const alertContent = { error: [], warning: [], info: [] };
  const alertPrevCounts = { error: 0, warning: 0, info: 0 };
  const alertPrevSignatures = { error: '', warning: '', info: '' };
  const ALERT_COLORS = {
    error: getCssVar('--alert-error', '#d32f2f'),
    warning: getCssVar('--alert-caution', '#c25a00'),
    info: getCssVar('--alert-info', '#0b7fab'),
  };
  const alertState = {
    error: new Map(),
    warning: new Map(),
    info: new Map(),
  };
  const alertId = (msg) => `${msg?.title || ''}::${msg?.html || ''}`;
  const rebuildAlertContent = (type) => {
    const state = alertState[type];
    if (!state) return;
    const arr = Array.from(state.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(({ payload, seen }) => ({ ...payload, seen }));
    alertContent[type] = arr;
  };
  const getAlertButton = (type) => {
    if (type === 'error') return errorButton;
    if (type === 'warning') return warningButton;
    if (type === 'info') return infoButton;
    return null;
  };

  const hideAlertModal = () => {
    if (!alertModal) return;
    const type = alertModal.dataset.type;
    const btn = getAlertButton(type);
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (btn) btn.classList.remove('alert-open');
    alertModal.classList.remove('show');
    alertModal.setAttribute('aria-hidden', 'true');
    alertModal.removeAttribute('data-type');
  };

  const renderAlertButton = (type) => {
    const btn = getAlertButton(type);
    if (!btn) return;
    const labels = { error: 'Error', warning: 'Caution', info: 'Info' };
    const content = alertContent[type] || [];
    const count = content.length;
    const hasUnread = content.some((p) => !p.seen);
    const signature = content.map((p) => alertId(p)).join('|');
    const contentChanged = signature !== alertPrevSignatures[type];
    if (count > 0) {
      btn.classList.remove('hidden');
      btn.innerHTML = `<span class="alert-label">${labels[type] || type}</span><span class="alert-count">${count}</span>`;
      btn.classList.toggle('has-unread', hasUnread);
      btn.setAttribute('aria-expanded', 'false');
      const prev = alertPrevCounts[type] || 0;
      const delta = count - prev;
      const isOpen = alertModal && alertModal.classList.contains('show') && alertModal.dataset.type === type;
      if (isOpen) {
        btn.classList.remove('alert-pending', 'alert-flash');
        btn.classList.add('alert-open');
        btn.classList.remove('has-unread');
      } else {
        btn.classList.remove('alert-open');
        if (!hasUnread) {
          btn.classList.remove('has-unread');
        }
        if (delta > 0 || (contentChanged && hasUnread)) {
          const rect = btn.getBoundingClientRect();
          btn.style.setProperty('--alert-flash-x', `${rect.left + rect.width / 2}px`);
          btn.style.setProperty('--alert-flash-y', `${rect.top + rect.height / 2}px`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => {
            btn.classList.add('alert-pending', 'alert-flash');
            setTimeout(() => btn.classList.remove('alert-flash'), 500);
          }, 150);
        } else if (delta < 0) {
          btn.classList.remove('alert-pending', 'alert-flash');
        }
        if (delta === 0 && !hasUnread) {
          btn.classList.remove('alert-pending', 'alert-flash');
        }
      }
      alertPrevCounts[type] = count;
      alertPrevSignatures[type] = signature;
    } else {
      btn.classList.add('hidden');
      btn.classList.remove('has-unread');
      btn.textContent = labels[type] || type;
      btn.classList.remove('alert-pending', 'alert-flash', 'alert-open');
      alertPrevCounts[type] = 0;
      alertPrevSignatures[type] = '';
      if (alertModal && alertModal.dataset.type === type) {
        hideAlertModal();
      }
    }
  };

  const showAlertModal = (type) => {
    if (!alertModal || !alertBody || !alertTitle) return;
    rebuildAlertContent(type);
    const payloads = alertContent[type] || [];
    const btn = getAlertButton(type);
    if (!payloads.length) return;
    const modalEl = alertModal.querySelector('.modal');
    const sheet = document.querySelector('.sheet');
    if (modalEl) {
      if (sheet) {
        const sheetWidth = sheet.getBoundingClientRect().width;
        const targetWidth = Math.max(320, sheetWidth * 0.9);
        modalEl.style.width = `${targetWidth}px`;
        modalEl.style.maxWidth = `${sheetWidth}px`;
      } else {
        modalEl.style.width = '90vw';
        modalEl.style.maxWidth = '90vw';
      }
    }

    const combined = (alertContent[type] || [])
      .map(
        (p, idx) =>
          `<div class="alert-item alert-${type} ${p.seen ? 'alert-read' : 'alert-unread'}"><div class="alert-headline"><span class="alert-number">(${idx + 1})</span><div class="alert-body">${p.html}</div></div></div>`
      )
      .join('');
    alertBody.innerHTML = combined;
    alertTitle.textContent =
      type === 'warning' ? 'Cautions' : type === 'error' ? 'Errors' : payloads[0].title || 'Notice';
    alertTitle.style.display = 'block';
    alertTitle.style.fontWeight = '700';
    if (type === 'warning') {
      alertTitle.style.color = ALERT_COLORS.warning;
    } else if (type === 'error') {
      alertTitle.style.color = ALERT_COLORS.error;
    } else {
      alertTitle.style.color = ALERT_COLORS.info;
    }
    alertModal.dataset.type = type;
    alertModal.classList.add('show');
    alertModal.setAttribute('aria-hidden', 'false');
    if (btn) {
      btn.setAttribute('aria-expanded', 'true');
      btn.classList.remove('alert-pending', 'alert-flash');
      btn.classList.add('alert-open');
      alertPrevCounts[type] = alertContent[type]?.length || 0;
      btn.classList.remove('has-unread');
    }
    const state = alertState[type];
    if (state) {
      state.forEach((entry) => {
        entry.seen = true;
      });
      rebuildAlertContent(type);
      renderAlertButton(type);
    }
  };

  function setAlertMessages(type, messages = []) {
    const state = alertState[type];
    if (!state) return;
    const incomingIds = new Set();
    messages.forEach((msg) => {
      const id = alertId(msg);
      incomingIds.add(id);
      const existing = state.get(id);
      if (existing) {
        state.set(id, { ...existing, payload: msg, timestamp: existing.timestamp || Date.now(), seen: existing.seen });
      } else {
        state.set(id, { payload: msg, seen: false, timestamp: Date.now() });
      }
    });
    Array.from(state.keys()).forEach((id) => {
      if (!incomingIds.has(id)) state.delete(id);
    });
    rebuildAlertContent(type);
    renderAlertButton(type);
  }

  const copyTimetableToClipboard = () => {
    if (!timetableTable || !navigator.clipboard) return;
    const rows = Array.from(timetableTable.querySelectorAll('tr'));
    const now = new Date();
    const heading = timetableTitleEl
      ? timetableTitleEl.textContent
      : `Timetable for ${getTimetableLabel(now)}. Prepared ${formatDate(now)}`;
    const includeHeading = heading && !heading.toLowerCase().startsWith('available subjects');

    const textBody = rows
      .map((row) =>
        Array.from(row.querySelectorAll('th,td'))
          .map((c) => c.textContent.trim())
          .join('\t')
      )
      .join('\n');
    const text = includeHeading ? `${heading}\n${textBody}` : textBody;

    const htmlRows = rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll('th,td')).map((c) => {
          const tag = c.tagName.toLowerCase();
          const baseStyle = 'border:1px solid #ccc;text-align:left;font-size:12px;font-family:Calibri, Arial, sans-serif;line-height:1;';
          const headStyle = `${baseStyle}padding:6pt 8px;font-weight:700;`;
          const bodyStyle = `${baseStyle}padding:0 8px;font-weight:400;`;
          const style = tag === 'th' ? headStyle : bodyStyle;
          return `<${tag} style="${style}">${c.textContent.trim()}</${tag}>`;
        });
        return `<tr>${cells.join('')}</tr>`;
      })
      .join('');
    const headingHtml = includeHeading
      ? `<div style="font-family:Calibri, Arial, sans-serif;font-size:13px;margin-bottom:6px;">${heading}</div>`
      : '';
    const html = `${headingHtml}<table style="border-collapse:collapse;border:1px solid #ccc;font-family:Calibri, Arial, sans-serif;border-spacing:0;">${htmlRows}</table>`;

    if (window.ClipboardItem) {
      const blobInput = {
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      };
      navigator.clipboard.write([new ClipboardItem(blobInput)]).catch(() => {
        navigator.clipboard.writeText(text).catch(() => { });
      });
    } else {
      navigator.clipboard.writeText(text).catch(() => { });
    }
  };

  const copySimpleTableToClipboard = (tableEl, headingText = '') => {
    if (!tableEl || !navigator.clipboard) return;
    const rows = Array.from(tableEl.querySelectorAll('tr')).filter((row) => !row.dataset.skipCopy);
    const textBody = rows
      .map((row) =>
        Array.from(row.querySelectorAll('th,td'))
          .map((c) => c.textContent.trim())
          .join('\t')
      )
      .join('\n');
    const heading = headingText ? headingText.trim() : '';
    const text = heading ? `${heading}\n${textBody}` : textBody;

    const htmlRows = rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll('th,td')).map((c) => {
          const tag = c.tagName.toLowerCase();
          const baseStyle =
            'border:1px solid #ccc;text-align:left;font-size:12px;font-family:Calibri, Arial, sans-serif;line-height:1;';
          const headStyle = `${baseStyle}padding:6pt 8px;font-weight:700;`;
          const bodyStyle = `${baseStyle}padding:0 8px;font-weight:400;`;
          const style = tag === 'th' ? headStyle : bodyStyle;
          return `<${tag} style="${style}">${c.textContent.trim()}</${tag}>`;
        });
        return `<tr>${cells.join('')}</tr>`;
      })
      .join('');
    const headingHtml = heading
      ? `<div style="font-family:Calibri, Arial, sans-serif;font-size:13px;margin-bottom:6px;">${heading}</div>`
      : '';
    const html = `${headingHtml}<table style="border-collapse:collapse;border:1px solid #ccc;font-family:Calibri, Arial, sans-serif;border-spacing:0;">${htmlRows}</table>`;

    if (window.ClipboardItem) {
      const blobInput = {
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      };
      navigator.clipboard.write([new ClipboardItem(blobInput)]).catch(() => {
        navigator.clipboard.writeText(text).catch(() => { });
      });
    } else {
      navigator.clipboard.writeText(text).catch(() => { });
    }
  };

  const getCellByCode = (code) => subjects.find((c) => c.dataset.subject === code);

  const getSelectedRows = () => {
    const selectedCodes = Array.from(subjectState.entries())
      .filter(([, st]) => st?.toggled)
      .map(([code]) => code);
    return selectedCodes
      .map((id) => {
        const data = timetable[id] || {};
        const dayFull = data.day || '';
        const dayShort = dayFull.slice(0, 3);
        const slot = data.slot || '';
        const cell = getCellByCode(id);
      return { cell, id, data, dayFull, dayShort, slot, isChosen: true };
    })
    .sort(compareByDaySlotThenCode);
  };

  const getHistoryRows = () => {
    const completedCodes = Array.from(subjectState.entries())
      .filter(([, st]) => st?.completed)
      .map(([code]) => code);
    return completedCodes
      .map((id) => {
        const data = timetable[id] || {};
        const dayFull = data.day || '';
        const dayShort = dayFull.slice(0, 3);
        const slot = data.slot || '';
        const cell = getCellByCode(id);
        return { cell, id, data, dayFull, dayShort, slot };
      })
      .sort(compareByDaySlotThenCode);
  };

  const getAvailableRows = () => {
    const completedSet = new Set(
      Array.from(subjectState.entries())
        .filter(([, st]) => st?.completed)
        .map(([code]) => code)
    );
    const emptyPlannedSet = new Set();
    const { completedMajorCount, plannedMajorCount } = getMajorCounts();
    return subjects
      .filter((cell) => {
        const id = cell.dataset.subject || '';
        if (!id || isPlaceholder(cell)) return false;
        if (completedSet.has(id)) return false;
        if (notRunningIds.has(id)) return false;
        const st = subjectState.get(id);
        const isChosen = !!st?.toggled;
        if (isChosen) return true;
        const { prereqMetNow, coreqMetNow } = getRequisiteStatus({
          id,
          completedSet,
          plannedSet: emptyPlannedSet,
          usePlanned: false,
        });
        const hasCoreq = (corequisites[id] || []).length > 0;
        let canSelectNow = hasCoreq ? prereqMetNow && coreqMetNow : prereqMetNow;
        if (id === 'BIT371') {
          const bitReq = getBit371Requirement({
            completedSet,
            plannedSet: emptyPlannedSet,
            usePlanned: false,
            completedMajorCount,
            plannedMajorCount,
          });
          canSelectNow = bitReq.metNow;
        }
        return canSelectNow;
      })
      .map((cell) => {
        const id = cell.dataset.subject || '';
        const data = timetable[id] || {};
        const dayFull = data.day || '';
        const dayShort = dayFull.slice(0, 3);
        const slot = data.slot || '';
        const st = subjectState.get(id);
        const isChosen = !!st?.toggled;
        return { id, dayFull, dayShort, slot, isChosen, cell, data };
      })
      .sort(compareByDaySlotThenCode);
  };

  const getNextSemRows = () => {
    const completedSet = new Set(
      Array.from(subjectState.entries())
        .filter(([, st]) => st?.completed)
        .map(([code]) => code)
    );
    const plannedSet = new Set(
      Array.from(subjectState.entries())
        .filter(([, st]) => st?.toggled)
        .map(([code]) => code)
    );
    const { completedMajorCount, plannedMajorCount } = getMajorCounts();
    return subjects
      .filter((cell) => {
        const id = cell.dataset.subject || '';
        if (!id || isPlaceholder(cell)) return false;
        if (completedSet.has(id) || plannedSet.has(id)) return false;
        // Use requisite check to decide availability for next sem
        const { prereqMetPlanned, prereqMetNow, coreqMetPlanned, coreqMetNow } = getRequisiteStatus({
          id,
          completedSet,
          plannedSet: plannedSet,
          usePlanned: true,
        });
        const hasCoreq = (corequisites[id] || []).length > 0;
        let meets = hasCoreq ? prereqMetPlanned && coreqMetPlanned : prereqMetPlanned;
        if (id === 'BIT371') {
          const baseMetNext = completedSet.has('BIT242') || plannedSet.has('BIT242');
          const majorCompletedNext = completedMajorCount + plannedMajorCount >= 3;
          meets = baseMetNext && majorCompletedNext;
        }
        return meets;
      })
      .map((cell) => {
        const id = cell.dataset.subject || '';
        const data = timetable[id] || {};
        const dayFull = data.day || '';
        const dayShort = dayFull.slice(0, 3);
        const slot = data.slot || '';
        return { id, dayShort, slot, cell };
      })
        .sort((a, b) => a.id.localeCompare(b.id));
  };

  const getNextSemTableRows = () =>
    getNextSemRows()
      .map((row) => {
        const data = timetable[row.id] || {};
        const dayFull = data.day || '';
        const dayShort = row.dayShort || dayFull.slice(0, 3);
        const slot = row.slot || data.slot || '';
        return { ...row, data, dayFull, dayShort, slot };
      })
      .sort(compareByDaySlotThenCode);

  const updateSelectedList = () => {
    if (!selectedListSection || !selectedListEl) return;
    const available = getAvailableRows();
    selectedListEl.innerHTML = '';
    selectedListEl.setAttribute('role', 'list');
    if (!available.length) {
      const li = document.createElement('div');
      li.className = 'available-item';
      li.setAttribute('role', 'listitem');
      li.textContent = 'No subjects are available to select right now.';
      selectedListEl.appendChild(li);
    } else {
      available.forEach((item) => {
        const li = document.createElement('div');
        li.className = 'available-item';
        li.setAttribute('role', 'listitem');
        li.classList.toggle('chosen', item.isChosen);
        applyDisplayTypeClass(li, item.cell || item.id);
        const slotLabel =
          item.slot === 'Morning' ? 'morning' : item.slot === 'Afternoon' ? 'afternoon' : (item.slot || 'N/A').toLowerCase();
        li.innerHTML = `<span class="avail-code">${item.id}</span><span class="avail-slot">${item.dayShort || 'N/A'} ${slotLabel}</span>`;
        li.dataset.subject = item.id;
        li.tabIndex = 0;
        li.setAttribute('role', 'button');
        const activate = () => {
          const cell = subjects.find((c) => c.dataset.subject === item.id);
          if (cell) cell.click();
        };
        li.addEventListener('click', activate);
        li.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            activate();
          }
        });
        const showSidebarTooltip = (e) => {
          const willRemove = item.isChosen;
          sidebarTooltip.textContent = willRemove ? 'Remove from timetable.' : 'Add to timetable.';
          sidebarTooltip.style.left = `${(e?.clientX || 0) + 18}px`;
          sidebarTooltip.style.top = `${(e?.clientY || 0) + 6}px`;
          sidebarTooltip.style.display = 'block';
        };
        li.addEventListener('mouseenter', (e) => {
          if (sidebarTooltipTimer) clearTimeout(sidebarTooltipTimer);
          sidebarTooltipTimer = setTimeout(() => showSidebarTooltip(e), 50);
        });
        li.addEventListener('mousemove', (e) => {
          if (sidebarTooltip.style.display === 'block') {
            showSidebarTooltip(e);
          }
        });
        li.addEventListener('mouseleave', () => {
          if (sidebarTooltipTimer) clearTimeout(sidebarTooltipTimer);
          sidebarTooltip.style.display = 'none';
        });
        selectedListEl.appendChild(li);
      });
    }
    selectedListSection.style.display = '';
  };

  if (showTimetableButton) showTimetableButton.addEventListener('click', showTimetableModal);
    if (availableHeading) {
      const activateAvailable = () => showAvailableModal();
      availableHeading.addEventListener('click', activateAvailable);
      availableHeading.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateAvailable();
        }
      });
    }
    if (closeTimetable) closeTimetable.addEventListener('click', hideTimetableModal);
    if (hideTimetable) hideTimetable.addEventListener('click', hideTimetableModal);
    if (copyTimetable) copyTimetable.addEventListener('click', copyTimetableToClipboard);
    if (historyButton) historyButton.addEventListener('click', showHistoryModal);
    if (nextSemesterButton) nextSemesterButton.addEventListener('click', showNextSemesterModal);
    if (historySortButtons.length) {
      historySortButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const key = button.dataset.sort;
          if (!key) return;
          if (historySortState.key === key) {
            historySortState.direction = historySortState.direction === 'asc' ? 'desc' : 'asc';
          } else {
            historySortState.key = key;
            historySortState.direction = 'asc';
          }
          renderHistoryModal();
        });
      });
    }
    if (closeHistory) closeHistory.addEventListener('click', hideHistoryModal);
    if (closeHistoryCta) closeHistoryCta.addEventListener('click', hideHistoryModal);
    if (copyHistory) copyHistory.addEventListener('click', () => copySimpleTableToClipboard(historyTable, historyTitleEl?.textContent || 'History'));
    if (historyModal) {
      historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) hideHistoryModal();
      });
    }
    if (closeNextSemester) closeNextSemester.addEventListener('click', hideNextSemesterModal);
    if (closeNextSemesterCta) closeNextSemesterCta.addEventListener('click', hideNextSemesterModal);
    if (copyNextSemester) {
      copyNextSemester.addEventListener('click', () =>
        copySimpleTableToClipboard(nextSemesterTable, nextSemesterTitleEl?.textContent || 'Available next semester')
      );
    }
    if (nextSemesterModal) {
      nextSemesterModal.addEventListener('click', (e) => {
        if (e.target === nextSemesterModal) hideNextSemesterModal();
      });
    }
    if (varyLoadButton) varyLoadButton.addEventListener('click', showLoadModal);
  if (errorButton) errorButton.addEventListener('click', () => showAlertModal('error'));
  if (warningButton) warningButton.addEventListener('click', () => showAlertModal('warning'));
  if (infoButton) infoButton.addEventListener('click', () => showAlertModal('info'));
  if (closeAlert) closeAlert.addEventListener('click', hideAlertModal);
  if (alertModal) {
    alertModal.addEventListener('click', (e) => {
      if (e.target === alertModal) hideAlertModal();
    });
  }

  const getElectiveStreams = (majorKey) => {
    const key = majorKey === 'network' || majorKey === 'undecided' || majorKey === 'ns' ? 'network' : majorKey;
    if (key === 'ba') {
      return [
        { label: 'Network Security', className: 'stream-network' },
        { label: 'Software Development', className: 'stream-sd' },
      ];
    }
    if (key === 'sd') {
      return [
        { label: 'Network Security', className: 'stream-network' },
        { label: 'Business Analytics', className: 'stream-ba' },
      ];
    }
    return [
      { label: 'Business Analytics', className: 'stream-ba' },
      { label: 'Software Development', className: 'stream-sd' },
    ];
  };
  const updateElectivesLabel = (majorKey) => {
    const el = electivesLabel;
    if (!el) return;
    const streams = getElectiveStreams(majorKey);
    const streamText = streams
      .map((s) => `<span class="stream-label ${s.className}"><strong>${s.label}</strong></span>`)
      .join(' and ');
    el.innerHTML = `<span class="inline-electives-heading">Available Electives.</span> Fill the Elective boxes above with subjects from these ${streamText} streams`;
  };
  const updateMajor = () => {
    const sheet = document.querySelector('.sheet');
    const dualKey = document.querySelector('.key .dual');
    const dualRow = dualKey?.parentElement;
    if (!majorDropdown || !sheet) return;
    sheet.classList.remove('major-ba', 'major-sd');
    const val = majorDropdown.dataset.value || 'undecided';
    majorDropdown.classList.remove('major-network', 'major-ba', 'major-sd', 'major-undecided');
    if (val === 'network') {
      majorLabel.textContent = 'Network Security';
      majorDropdown.classList.add('major-network');
      if (dualRow) dualRow.style.display = '';
    } else if (val === 'ba') {
      majorLabel.textContent = 'Business Analytics';
      majorDropdown.classList.add('major-ba');
      sheet.classList.add('major-ba');
      if (dualRow) dualRow.style.display = 'none';
    } else if (val === 'sd') {
      majorLabel.textContent = 'Software Development';
      majorDropdown.classList.add('major-sd');
      sheet.classList.add('major-sd');
      if (dualRow) dualRow.style.display = 'none';
    } else {
      majorLabel.textContent = 'Undecided. Network Security used';
      majorDropdown.classList.add('major-undecided');
      if (dualRow) dualRow.style.display = '';
    }
    applyMajorConfig(val);
    updateElectivesLabel(val);
  };

  let electiveWarningEl = null;
  const ensureElectiveWarning = () => {
    if (electiveWarningEl) return electiveWarningEl;
    const sheet = document.querySelector('.sheet');
    if (!sheet) return null;
    electiveWarningEl = document.createElement('div');
    electiveWarningEl.className = 'elective-warning';
    electiveWarningEl.style.display = 'none';
    sheet.appendChild(electiveWarningEl);
    return electiveWarningEl;
  };

  const getActiveElectiveCodes = () => {
    const useCodes = electivePlaceholderState.filter(Boolean);
    const majorKey = getMajorKeyFromUi();
    const majorSet = new Set(majorLayouts[majorKey] || []);
    const slotCodes = getElectiveSlotCodes(majorKey);
    const activeBits = slotCodes.filter((code) => {
      if (!code || majorSet.has(code)) return false;
      const st = subjectState.get(code);
      return st?.completed || st?.toggled;
    });
    return [...useCodes, ...activeBits];
  };

  const updateElectiveWarning = () => {
    const placeholders = getElectivePlaceholders();
    // Always rebuild from current state so the count/message matches what is actually selected/completed
    electiveAssignments = buildElectiveAssignments();

    const uniqueCodes = Array.from(new Set(getActiveElectiveCodes().map((code) => code.toUpperCase())));
    const over = uniqueCodes.length > 4;
    placeholders.forEach((cell) => cell.classList.toggle('elective-overlimit', over));
    const el = ensureElectiveWarning();
    if (!el) return;
    if (over && placeholders.length) {
      el.textContent = `Too many Electives. Only 4 allowed. Your Electives: ${uniqueCodes.join(', ')}`;
      const sheet = document.querySelector('.sheet');
      const firstRect = placeholders[0].getBoundingClientRect();
      const lastRect = placeholders[placeholders.length - 1].getBoundingClientRect();
      const sheetRect = sheet.getBoundingClientRect();
      el.style.display = 'block';
      const left = firstRect.left - sheetRect.left + 4;
      const width = Math.max(0, lastRect.right - firstRect.left - 8);
      el.style.left = `${left}px`;
      el.style.width = `${width}px`;
      el.style.maxWidth = `${width}px`;
      requestAnimationFrame(() => {
        const top = firstRect.top - sheetRect.top + 6;
        el.style.top = `${top}px`;
      });
      const details = uniqueCodes.map((code) => {
        const isUse = code.startsWith('USE');
        const name = isUse ? useDisplayNames[code] || 'Unspecified Elective' : getSubjectName(code);
        return { code, name, isUse };
      });
      const useNote = details.some((d) => d.isUse)
        ? '<p><strong>What is a USE?</strong> USE101/102/201/301 are Unspecified Elective credits that fill an elective slot when no specific subject code applies.</p>'
        : '';
      const detailList = details
        .map((d) => `<li><strong>${d.code}</strong> - ${d.name}</li>`)
        .join('');
      const alertCount = uniqueCodes.length;
      const alertHtml = `<h4 class="inline-heading">Too many electives.</h4><span class="tight-lead"> You currently have ${alertCount} electives selected but only 4 are allowed.</span><ul>${detailList}</ul>${useNote}`;
      electiveError = { title: 'Too many electives', html: alertHtml };
    } else {
      electiveError = null;
      el.style.display = 'none';
    }
    refreshErrorAlerts();
  };

  initSubjectStateFromData();
  applySubjectStateToCells();
  recomputeAvailability();
  updateCompletedModeUI();
  updateOverrideUI();
  updateLiveUI();
  updateResetState();
  setLivePrereqEnabled(true);
  const MOBILE_NOTICE_KEY = 'mobile-notice-shown';
  const showMobileNotice = () => {
    if (!isMobileDevice()) return;
    try {
      if (sessionStorage.getItem(MOBILE_NOTICE_KEY)) return;
    } catch (e) {
      // ignore storage errors and continue to show once per session
    }
    const prior = document.getElementById('mobile-notice');
    if (prior) prior.remove();
    const notice = document.createElement('div');
    notice.id = 'mobile-notice';
    notice.className = 'mobile-notice';
    notice.innerHTML = `
      <div class="mobile-notice__title">Desktop recommended</div>
      <p>This page is designed for larger screens. For the best experience, please use a laptop or desktop computer.</p>
      <button type="button" class="mobile-notice__dismiss">OK</button>
    `;
    document.body.appendChild(notice);
    const dismiss = () => {
      if (notice && notice.parentElement) notice.parentElement.removeChild(notice);
      try {
        sessionStorage.setItem(MOBILE_NOTICE_KEY, '1');
      } catch (e) {
        // ignore storage errors
      }
    };
    const closeBtn = notice.querySelector('.mobile-notice__dismiss');
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    setTimeout(() => notice.classList.add('show'), 10);
  };
  setElectiveCredits(buildElectiveAssignments());
  updateElectiveWarning();
  updateSelectedList();
  updateMajor();
  const selectedCount = getSelectedRows().length;
  if (showTimetableButton) {
    const threshold = getLoadThreshold();
    showTimetableButton.textContent =
      selectedCount > 0 && selectedCount < threshold ? 'Timetable options' : 'Your semester plan';
  }
  updatePrereqErrors();
  updateWarnings();
  const completedSet = new Set(
    Array.from(subjectState.entries())
      .filter(([, st]) => st?.completed)
      .map(([code]) => code)
  );
  const plannedSet = new Set(
    Array.from(subjectState.entries())
      .filter(([, st]) => st?.toggled)
      .map(([code]) => code)
  );
  updateSemesterCounts(completedSet, plannedSet);
  // Ensure header alert buttons stay hidden until messages are provided
  refreshErrorAlerts();
  setAlertMessages('info', []);
  renderAlertButton('error');
  renderAlertButton('warning');
  renderAlertButton('info');
  showMobileNotice();
  setTimeout(() => {
    initialLoad = false;
  }, 0);

  const closeMajorDropdown = () => {
    if (majorDropdown) {
      majorDropdown.classList.remove('open');
      if (majorToggle) majorToggle.setAttribute('aria-expanded', 'false');
    }
  };

  if (majorToggle && majorDropdown) {
    majorToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = majorDropdown.classList.toggle('open');
      majorToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    majorOptions.forEach((opt) => {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const val = opt.dataset.value;
        majorDropdown.dataset.value = val;
        majorOptions.forEach((o) => o.classList.remove('selected'));
        opt.classList.add('selected');
        if (majorLabel) majorLabel.textContent = opt.textContent;
        updateMajor();
        closeMajorDropdown();
      };
      opt.addEventListener('click', handler);
    });
    document.addEventListener('click', (e) => {
      if (!majorDropdown.contains(e.target)) closeMajorDropdown();
    });
  }

  if (closeLoadModal) closeLoadModal.addEventListener('click', hideLoadModal);
  if (cancelLoadModal) cancelLoadModal.addEventListener('click', hideLoadModal);
  if (loadTypeDomestic)
    loadTypeDomestic.addEventListener('change', () => {
      if (!loadTypeDomestic.checked) return;
      studentType = 'domestic';
      exceptionalLoadApproved = false;
      syncLoadFormState();
    });
  if (loadTypeInternational)
    loadTypeInternational.addEventListener('change', () => {
      if (!loadTypeInternational.checked) return;
      studentType = 'international';
      syncLoadFormState();
    });
  if (loadExceptional)
    loadExceptional.addEventListener('change', () => {
      exceptionalLoadApproved = !!loadExceptional.checked;
      syncLoadFormState();
    });
  if (loadRemainingConfirm)
    loadRemainingConfirm.addEventListener('change', () => {
      remainingConfirmed = loadRemainingConfirm.checked;
      syncLoadFormState();
    });
  if (applyLoadModal) applyLoadModal.addEventListener('click', applyLoadSettings);
  if (loadValueInput)
    loadValueInput.addEventListener('click', () => {
      if (loadLockMsg) {
        loadLockMsg.style.display = isLoadLockedToFour() ? 'inline' : 'none';
      }
    });
  if (toggleSemCountsBtn)
    toggleSemCountsBtn.addEventListener('click', () => {
      showSemCounts = !showSemCounts;
      toggleSemCountsBtn.textContent = showSemCounts ? 'Hide semesters remaining' : 'Show semesters remaining';
      const completedSet = new Set(
        Array.from(subjectState.entries())
          .filter(([, st]) => st?.completed)
          .map(([code]) => code)
      );
      const plannedSet = new Set(
        Array.from(subjectState.entries())
          .filter(([, st]) => st?.toggled)
          .map(([code]) => code)
      );
      updateSemesterCounts(completedSet, plannedSet);
    });
  document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideAlertModal();
        hideCodeModal();
        hideCourseTimetableModal();
        hideTimetableModal();
        hideHistoryModal();
        hideNextSemesterModal();
        hideLoadModal();
        hideInstructionsModal();
    } else if (e.key === 'Enter') {
      if (loadModal && loadModal.classList.contains('show')) {
        e.preventDefault();
        applyLoadSettings();
      } else if (codeModal && codeModal.classList.contains('show')) {
        e.preventDefault();
        applyCodes();
      }
    }
  });
  // Initial sync of reset button state
  updateResetState();
  updateVaryLoadLabel();
})();
