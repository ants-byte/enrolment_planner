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
    BIT235: ['BIT245'],
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
    BIT362: { day: 'Wednesday', slot: 'Afternoon', room: 'PE327', teacher: 'Nikki Wan' },
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

  const semester1OnlyIds = new Set(['BIT351', 'BIT358', 'BIT357', 'BIT355']);
  const semester2OnlyIds = new Set(['BIT246', 'BIT363', 'BIT356', 'BIT364']);
  const currentSemesterKey = 'S1';
  const getOppositeSemester = (semester) => (semester === 'S1' ? 'S2' : 'S1');
  const getSemesterKeyForOffset = (offset) =>
    offset % 2 === 0 ? currentSemesterKey : getOppositeSemester(currentSemesterKey);
  const getSemesterAvailability = (id) => {
    if (semester1OnlyIds.has(id)) return 'S1';
    if (semester2OnlyIds.has(id)) return 'S2';
    return 'Any';
  };
  const isSemesterRestricted = (id) => getSemesterAvailability(id) !== 'Any';
  const isRunningThisSemester = (id) => {
    const availability = getSemesterAvailability(id);
    return availability === 'Any' || availability === currentSemesterKey;
  };
  const isRunningNextSemester = (id) => {
    const availability = getSemesterAvailability(id);
    if (availability === 'Any') return true;
    return availability === getOppositeSemester(currentSemesterKey);
  };
  const getNotRunningIds = () =>
    new Set(
      [...semester1OnlyIds, ...semester2OnlyIds].filter((id) => !isRunningThisSemester(id))
    );
  const getSemesterLabel = (semesterKey) => (semesterKey === 'S1' ? 'Semester 1' : 'Semester 2');
  const alignDistanceToAvailability = (id, distance) => {
    if (!Number.isFinite(distance) || distance <= 0) return distance;
    const availability = getSemesterAvailability(id);
    if (availability === 'Any') return distance;
    const offset = Math.max(0, distance - 1);
    const semesterAtOffset = getSemesterKeyForOffset(offset);
    if (semesterAtOffset === availability) return distance;
    return distance + 1;
  };

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
    const passForEnrolmentsToggle = document.getElementById('pass-for-enrolments');
  const showTimetableButton = document.getElementById('show-timetable');
  const showCourseTimetableButton = document.getElementById('show-semester-timetable');
  const courseTimetableIconButton = document.getElementById('open-semester-timetable-icon');
  const varyLoadButton = document.getElementById('vary-load');
  const errorButton = document.getElementById('btn-error');
  const warningButton = document.getElementById('btn-warning');
  const infoButton = document.getElementById('btn-info');
  const subjectCountsEl = document.getElementById('subject-counts');
  const titleAlerts = document.getElementById('title-alerts');

  const updateAlertBoxVisibility = () => {
    if (!titleAlerts) return;
    const hasVisible = [errorButton, warningButton, infoButton].some((btn) => btn && !btn.classList.contains('hidden'));
    titleAlerts.classList.toggle('is-collapsed', !hasVisible);
  };

  const hideAllAlertButtons = () => {
    [errorButton, warningButton, infoButton].forEach((btn) => {
      if (btn) btn.classList.add('hidden');
    });
    updateAlertBoxVisibility();
  };
  hideAllAlertButtons();
  const dropZone = document.getElementById('drop-zone');
  const dropSidebar = document.getElementById('drop-sidebar');
  const dropZoneTextEl = dropZone?.querySelector('.drop-zone-text');
  const dropZoneDefaultText = dropZoneTextEl?.textContent || 'Drop students workbook here';
    const dropZoneSpinner = dropZone
    ? (() => {
        const spinner = document.createElement('div');
        spinner.className = 'drop-zone-spinner hidden-initial';
        dropZone.appendChild(spinner);
        return spinner;
      })()
    : null;
    const setDropZoneSpinnerVisible = (visible) => {
      if (!dropZoneSpinner) return;
      dropZoneSpinner.classList.toggle('hidden-initial', !visible);
    };
    let lastDroppedFileInfo = null;
    const formatFileDateInfo = (file) => {
      if (!file || !Number.isFinite(file.lastModified)) return '';
      const modified = new Date(file.lastModified);
      const dateLabel = isNaN(modified.getTime()) ? '' : formatDisplayDate(modified);
      const daysAgo = Math.floor((Date.now() - file.lastModified) / (1000 * 60 * 60 * 24));
      const daysLabel = Number.isFinite(daysAgo) ? `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago` : '';
      const parts = [dateLabel ? `Last saved: ${dateLabel}` : '', daysLabel ? `(${daysLabel})` : '']
        .filter(Boolean)
        .join(' ');
      return parts || '';
    };
    const renderDropZoneStatus = (lines) => {
      if (!dropZoneTextEl) return;
      dropZoneTextEl.innerHTML = '';
      (lines || []).filter(Boolean).forEach((line) => {
        const span = document.createElement('span');
        span.className = 'drop-zone-line';
        span.textContent = line;
        dropZoneTextEl.appendChild(span);
      });
    };
  const studentIdSection = document.getElementById('student-id-section');
  const studentIdInput = document.getElementById('student-id-input');
  const studentSearchDropdown = document.getElementById('student-search-dropdown');
  const studentDataPreview = document.getElementById('student-data-preview');
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
      'EndOfWeekTwoDate',
      'Countries_facing_troubles',
    ];
    const studentIdPattern = /(\d{7})/;
    let extractedStudentId = '';
    let studentRecords = [];
    let activeStudentId = '';
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
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
  const normalizeHeader = (value) =>
    String(value ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  const timetableModal = document.getElementById('timetable-modal');
  const closeTimetable = document.getElementById('close-timetable');
  const hideTimetable = document.getElementById('hide-timetable');
  const copyTimetable = document.getElementById('copy-timetable');
  const copyTimetableCodes = document.getElementById('copy-timetable-codes');
  const timetableTitleEl = document.getElementById('timetable-title');
  const timetableTable = document.getElementById('timetable-table');
  const courseTimetableModal = document.getElementById('semester-timetable-modal');
  const closeCourseTimetable = document.getElementById('close-semester-timetable');
  const closeCourseTimetableCta = document.getElementById('close-semester-timetable-cta');
  const courseTimetableContent = document.getElementById('semester-timetable-content');
  const courseTimetableNotRunningList = document.getElementById('semester-timetable-not-running-list');
  const courseTimetableListButton = document.getElementById('semester-timetable-list');
  const courseTimetableGridButton = document.getElementById('semester-timetable-grid');
  const courseTimetableColoursButton = document.getElementById('semester-timetable-colours');
  const copyCourseTimetableButton = document.getElementById('copy-semester-timetable');
  const courseTimetableTeacherCopyButton = document.getElementById('semester-timetable-teacher-copy');
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
  const sidebarSectionDescriptor = document.getElementById('sidebar-section-descriptor');
  const resetSection = document.getElementById('reset-section');
  const nextSemList = document.getElementById('next-sem-list');
  const historyButton = document.getElementById('open-history');
  const remainingButton = document.getElementById('open-remaining');
  const courseMapButton = document.getElementById('open-course-map');
  const nextSemesterButton = document.getElementById('open-next-semester');
  const historyModal = document.getElementById('history-modal');
  const historyTitleEl = document.getElementById('history-title');
  const historyTable = document.getElementById('history-table');
  const remainingModal = document.getElementById('remaining-modal');
  const remainingTitleEl = document.getElementById('remaining-title');
  const remainingSummary = document.getElementById('remaining-summary');
  const remainingTable = document.getElementById('remaining-table');
  const remainingElectivesSection = document.getElementById('remaining-electives-section');
  const remainingElectivesTable = document.getElementById('remaining-electives-table');
  const courseMapModal = document.getElementById('course-map-modal');
  const courseMapContent = document.getElementById('course-map-content');
  const courseMapKey = document.getElementById('course-map-key');
  const closeCourseMap = document.getElementById('close-course-map');
  const closeCourseMapCta = document.getElementById('close-course-map-cta');
  const copyCourseMapImageButton = document.getElementById('copy-course-map-image');
  const downloadCourseMapImageButton = document.getElementById('download-course-map-image');
  const currentEnrolmentsSection = document.getElementById('current-enrolments-section');
  const currentEnrolmentsList = document.getElementById('current-enrolments-list');
  const historySortButtons = Array.from(document.querySelectorAll('#history-table .subject-table-sort-button'));
  const closeHistory = document.getElementById('close-history');
  const closeHistoryCta = document.getElementById('close-history-cta');
  const copyHistory = document.getElementById('copy-history');
  const copyHistoryCodes = document.getElementById('copy-history-codes');
  const closeRemaining = document.getElementById('close-remaining');
  const closeRemainingCta = document.getElementById('close-remaining-cta');
  const copyRemaining = document.getElementById('copy-remaining');
  const copyRemainingCodes = document.getElementById('copy-remaining-codes');
  const nextSemesterModal = document.getElementById('next-semester-modal');
  const nextSemesterTitleEl = document.getElementById('next-semester-title');
  const nextSemesterTable = document.getElementById('next-semester-table');
  const closeNextSemester = document.getElementById('close-next-semester');
  const closeNextSemesterCta = document.getElementById('close-next-semester-cta');
  const copyNextSemester = document.getElementById('copy-next-semester');
  const copyNextSemesterCodes = document.getElementById('copy-next-semester-codes');
  const toggleSemCountsBtn = document.getElementById('toggle-sem-counts');
  const semCountsLabel = toggleSemCountsBtn?.closest('.toggle-row')?.querySelector('.switch-label');
  const electivesLabel = document.getElementById('electives-label');
  const clipboardBlockedTitle = 'Copy to clipboard requires HTTPS (or localhost).';
  const clipboardAvailable = window.isSecureContext && !!navigator.clipboard;
  const setClipboardButtonState = (button, enabled) => {
    if (!button) return;
    button.disabled = !enabled;
    button.classList.toggle('disabled', !enabled);
    button.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    if (!enabled) {
      if (!button.dataset.prevTitle) {
        button.dataset.prevTitle = button.getAttribute('title') || '';
      }
      button.setAttribute('title', clipboardBlockedTitle);
    } else if (button.dataset.prevTitle !== undefined) {
      const prev = button.dataset.prevTitle;
      if (prev) {
        button.setAttribute('title', prev);
      } else {
        button.removeAttribute('title');
      }
      delete button.dataset.prevTitle;
    }
  };
  const updateClipboardUI = () => {
    const enabled = clipboardAvailable;
    [
      copyTimetable,
      copyTimetableCodes,
      copyCourseTimetableButton,
      courseTimetableTeacherCopyButton,
      copyHistory,
      copyHistoryCodes,
      copyRemaining,
      copyRemainingCodes,
      copyNextSemester,
      copyNextSemesterCodes,
    ].forEach((button) => setClipboardButtonState(button, enabled));
  };
  updateClipboardUI();
  const flashCopyButton = (button) => {
    if (!button) return;
    button.classList.remove('copy-flash');
    void button.offsetWidth;
    button.classList.add('copy-flash');
  };
  let modalLocked = false;
  let modalPrevStyle = null;
  let courseTimetableView = 'grid';
  let courseTimetableColoursOn = true;
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
    BIT241: { name: 'Professional IT Practice & Ethics', note: 'Prerequisite: BIT105, BIT106', classes: ['core'] },
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
    const normalizeSubjectCode = (value) =>
      (value || '')
        .toString()
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    let staffWorkbookStudentRecord = null;
    let staffWorkbookCourseInfo = null;
    const staffWorkbookState = (() => {
      const workbookSubjects = new Map();
      return {
        setWorkbookSubjects(records = []) {
          workbookSubjects.clear();
          const entries = records instanceof Map ? Array.from(records.values()) : Array.isArray(records) ? records : Object.values(records || {});
          entries.forEach((record) => {
            if (!record) return;
            const rawCode =
              record.code || record.subject || record.subjectCode || record.id || '';
            const code = normalizeSubjectCode(rawCode);
            if (!code) return;
            workbookSubjects.set(code, { ...record, code });
          });
        },
        getSubjectRecord(code) {
          if (!code) return null;
          return workbookSubjects.get(normalizeSubjectCode(code)) || null;
        },
        getSubjectCodes() {
          return Array.from(workbookSubjects.keys());
        },
        setStudentRecord(record) {
          staffWorkbookStudentRecord = record || null;
        },
        getStudentRecord() {
          return staffWorkbookStudentRecord;
        },
        setCourseInfo(info) {
          staffWorkbookCourseInfo = info || null;
        },
        getCourseInfo() {
          return staffWorkbookCourseInfo;
        },
        reset() {
          workbookSubjects.clear();
          staffWorkbookStudentRecord = null;
          staffWorkbookCourseInfo = null;
        },
      };
    })();
    const getAllSubjectCodes = () => {
      const baseCodes = Object.keys(subjectMeta).map((code) => normalizeSubjectCode(code));
      const workbookCodes = staffWorkbookState.getSubjectCodes();
      return new Set([...baseCodes, ...workbookCodes]);
    };
    const validSubjectCodes = new Set();
    const refreshValidSubjectCodes = () => {
      validSubjectCodes.clear();
      getAllSubjectCodes().forEach((code) => validSubjectCodes.add(code));
    };
    refreshValidSubjectCodes();
    const passGrades = new Set(['CRT', 'PA', 'CR', 'D', 'HD', 'RPL', 'PS', 'SP', 'UP']);
  const failGrades = new Set(['W', 'WNA', 'N', 'WE', 'H', 'SC', 'SAH', 'CNI', 'WN']);
  const legacySubjectPairs = [
    ['BIT102', 'BIT121'],
    ['BIT103', 'BIT108'],
    ['BIT104', 'BIT111'],
    ['BIT123', 'USE201'],
    ['BIT201', 'BIT231'],
    ['BIT202', 'USE201'],
    ['BIT203', 'BIT241'],
    ['BIT204', 'BIT236'],
    ['BIT205', 'BIT245'],
    ['BIT206', 'BIT233'],
    ['BIT207', 'BIT213'],
    ['BIT208', 'BIT244'],
    ['BIT209', 'BIT235'],
    ['BIT210', 'BIT246'],
    ['BIT211', 'BIT231'],
    ['BIT212', 'BIT247'],
    ['BIT232', 'BIT230'],
    ['BIT211', 'BIT231'],
    ['BIT210', 'BIT246'],
    ['BIT201', 'BIT231'],
    ['BIT301', 'BIT230'],
    ['BIT302', 'BIT242'],
    ['BIT303', 'USE301'],
    ['BIT304', 'BIT355'],
    ['BIT305', 'BIT356'],
    ['BIT307', 'BIT353'],
    ['BIT308', 'BIT362'],
    ['BIT309', 'BIT314'],
    ['BIT310', 'BIT358'],
    ['BIT311', 'BIT245'],
    ['BIT312', 'BIT352'],
    ['BIT311', 'BIT245'],
    ['BIT310', 'BIT358'],
    ['BIT301', 'BIT230'],
    ['BIT111', 'BIT111'],
    ['BIT110', 'BIT112'],
    ['BIT102', 'BIT121'],
    ['BIT101', 'BIT106'],
    ['BIT100', 'BIT105'],
    ['BIT100', 'BIT105'],
    ['BIT234', 'BIT236'],
    ['BIT306', 'BIT363'],
    ['BIT247', 'BIT357'],
    ['BIT101', 'BIT106'],
    ['BIT207', 'BIT313'],
    ['BIT209', 'BIT235'],
    ['BIT210', 'BIT246'],
    ['BIT2I0', 'BIT246'],
    ['BIT305', 'BIT356'],
    ['BIT307', 'BIT313'],
    ['BIT308', 'BIT213'],
    ['BIT312', 'BIT352'],
    ['BITIOO', 'BIT100'],
    ['BIT361', 'BIT314'],
    ['BIT354', 'BIT313'],
    ['BIT243', 'BIT213'],
  ];
  const legacySubjectMap = new Map(legacySubjectPairs);
  const validUseCodes = new Set(['USE101', 'USE102', 'USE201', 'USE202', 'USE301']);
  const manualEntryAliases = new Map();
  const manualEntryMeta = new Map();
  const manualEntryCurrent = new Map();
  const workbookCurrent = new Map();
  const manualEntryUnknown = [];
    const manualCodeRegex = /\b(BIT[0-9A-Z]{3}|USE[0-9]{3})\b/;
  const manualCodeRegexGlobal = /\b(BIT[0-9A-Z]{3}|USE[0-9]{3})\b/g;
  const gradeHeadingRegex = /\b(grade|credit|score|outcome|result)\b/i;
  const dateHeadingRegex = /\b(year|date|session|semester|term)\b/i;
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
  const normalizeManualCode = (code) => (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const resolveLegacyCode = (rawCode) => {
    let current = normalizeManualCode(rawCode);
    const original = current;
    const seen = new Set();
    while (legacySubjectMap.has(current) && !seen.has(current)) {
      seen.add(current);
      current = legacySubjectMap.get(current);
      current = normalizeManualCode(current);
    }
    return { mapped: current, original };
  };
  const recordManualAlias = (mapped, original) => {
    if (!mapped || !original || mapped === original) return;
    const set = manualEntryAliases.get(mapped) || new Set();
    set.add(original);
    manualEntryAliases.set(mapped, set);
  };
  const recordCurrentEnrollment = (mapped, date = '') => {
    if (!mapped) return;
    manualEntryCurrent.set(mapped, { date: date || '' });
  };
  const addUnknownEntry = ({ code = '', result = '', date = '' } = {}) => {
    const formatted = formatHistoryResult(result);
    const displayCode = (code || '').toUpperCase();
    manualEntryUnknown.push({
      id: `unknown-${manualEntryUnknown.length + 1}`,
      displayCode: displayCode || '??',
      displayName: '',
      displayStream: '',
      result: formatted,
      date: date || '',
      isFail: isFailGradeToken(formatted),
      dayFull: '',
      dayShort: '',
      slot: '',
      data: {},
      cell: null,
    });
  };
  const formatHistoryCode = (id) => {
    if (id && id.startsWith('USE')) return `${id} Unspecified Elective (USE)`;
    const aliases = manualEntryAliases.get(id);
    if (!aliases || aliases.size === 0) return id;
    const aliasList = Array.from(aliases).sort();
    return `${id} (${aliasList.join(', ')})`;
  };
  const getGradeStatus = (line) => {
    const tokens = (line || '').toUpperCase().match(/[A-Z0-9/]+/g) || [];
    let hasPass = false;
    let hasFail = false;
    tokens.forEach((token) => {
      const cleaned = token.replace(/[^A-Z0-9/]/g, '');
      if (!cleaned) return;
      if (passGrades.has(cleaned)) {
        hasPass = true;
      } else if (failGrades.has(cleaned) || cleaned.startsWith('WN/')) {
        hasFail = true;
      }
    });
    if (hasPass) return 'pass';
    if (hasFail) return 'fail';
    return '';
  };
  const extractGradeToken = (value) => {
    const tokens = (value || '').toUpperCase().match(/[A-Z0-9/]+/g) || [];
    for (const token of tokens) {
      if (passGrades.has(token) || failGrades.has(token) || token.startsWith('WN/')) {
        return token;
      }
    }
    return '';
  };
  const normalizeGradeToken = (value) => {
    const raw = (value || '').trim().toUpperCase();
    if (!raw) return '';
    const token = extractGradeToken(raw);
    if (token) return token.replace(/^X/, '');
    return raw.replace(/^X/, '');
  };
  const isFailGradeToken = (value) => {
    const token = normalizeGradeToken(value);
    return !!token && (failGrades.has(token) || token.startsWith('WN/'));
  };
  const formatHistoryResult = (value) => {
    const token = normalizeGradeToken(value);
    if (!token) return '';
    return isFailGradeToken(token) ? `x${token}` : token;
  };
  const getHistoryDateSortValue = (value) => {
    const text = String(value || '').trim();
    if (!text) return Number.MAX_SAFE_INTEGER;
    const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);
      return year * 10000 + month * 100 + day;
    }
    const semMatch = text.match(/(\d{4})\s*Sem\s*([12])/i);
    if (semMatch) {
      const year = parseInt(semMatch[1], 10);
      const sem = parseInt(semMatch[2], 10);
      const month = sem === 1 ? 6 : 11;
      return year * 10000 + month * 100 + 15;
    }
    const ssMatch = text.match(/(\d{4})\s*SS/i);
    if (ssMatch) {
      const year = parseInt(ssMatch[1], 10);
      return year * 10000 + 3 * 100 + 15;
    }
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0], 10);
      return year * 10000 + 12 * 100 + 31;
    }
    return Number.MAX_SAFE_INTEGER;
  };
  const formatSemesterLabel = (year, month, day) => {
    if (!year || !month) return '';
    const safeDay = Number.isFinite(day) ? day : 15;
    let label = 'Sem 2';
    if (month >= 2 && month <= 5) {
      label = 'SS';
    } else if (month >= 6 && month <= 10) {
      label = 'Sem 1';
    } else {
      label = 'Sem 2';
    }
    return `${year} ${label}`;
  };
  const extractDateToken = (value) => {
    const text = (value || '').trim();
    if (!text) return '';
    const upper = text.toUpperCase();
    const yearMatch = upper.match(/\b(19|20)\d{2}\b/);
    const semLabelMatch = upper.match(/\bSEM\s*([12])\b/);
    if (yearMatch && semLabelMatch) {
      return `${yearMatch[0]} Sem ${semLabelMatch[1]}`;
    }
    const semTokenMatch = upper.match(/\bS[12]\b|\bSS\b/);
    if (yearMatch && semTokenMatch) {
      const token = semTokenMatch[0];
      if (token === 'SS') return `${yearMatch[0]} SS`;
      return `${yearMatch[0]} Sem ${token.slice(1)}`;
    }
    const dateMatch = upper.match(/\b(19|20)\d{2}[/-]\d{1,2}(?:[/-]\d{1,2})?\b/);
    if (dateMatch) {
      const parts = dateMatch[0].split(/[/-]/).map((part) => parseInt(part, 10));
      const [year, month, day] = parts;
      return formatSemesterLabel(year, month, day);
    }
    if (yearMatch) return yearMatch[0];
    if (semTokenMatch) return semTokenMatch[0];
    return '';
  };
  const splitManualColumns = (line) => {
    if (!line) return [''];
    if (line.includes('\t')) return line.split(/\t+/).map((cell) => cell.trim());
    if (/\s{2,}/.test(line)) return line.split(/\s{2,}/).map((cell) => cell.trim());
    return [line.trim()];
  };
  const findGradeColumnFromHeader = (lines) => {
    for (let i = 0; i < lines.length; i += 1) {
      const columns = splitManualColumns(lines[i]);
      const idx = columns.findIndex((cell) => gradeHeadingRegex.test(cell));
      if (idx !== -1) return { index: idx, startRow: i + 1 };
    }
    return { index: -1, startRow: 0 };
  };
  const findDateColumnFromHeader = (lines) => {
    for (let i = 0; i < lines.length; i += 1) {
      const columns = splitManualColumns(lines[i]);
      const idx = columns.findIndex((cell) => dateHeadingRegex.test(cell));
      if (idx !== -1) return { index: idx, startRow: i + 1 };
    }
    return { index: -1, startRow: 0 };
  };
  const detectGradeColumnByPattern = (rows) => {
    let maxCols = 0;
    rows.forEach((row) => {
      if (row.columns.length > maxCols) maxCols = row.columns.length;
    });
    let bestIndex = -1;
    let bestRatio = 0;
    let bestCount = 0;
    for (let i = 0; i < maxCols; i += 1) {
      let gradeCount = 0;
      let totalCount = 0;
      let codeCount = 0;
      rows.forEach((row) => {
        const cell = row.columns[i] || '';
        if (!cell) return;
        totalCount += 1;
        const upper = cell.toUpperCase();
        if (manualCodeRegex.test(upper)) codeCount += 1;
        if (getGradeStatus(cell)) gradeCount += 1;
      });
      if (totalCount < 2 || gradeCount < 2) continue;
      const ratio = gradeCount / totalCount;
      const codeRatio = codeCount / totalCount;
      if (ratio >= 0.6 && codeRatio < 0.4) {
        if (ratio > bestRatio || (ratio === bestRatio && gradeCount > bestCount)) {
          bestIndex = i;
          bestRatio = ratio;
          bestCount = gradeCount;
        }
      }
    }
    return bestIndex;
  };
  const detectDateColumnByPattern = (rows) => {
    let maxCols = 0;
    rows.forEach((row) => {
      if (row.columns.length > maxCols) maxCols = row.columns.length;
    });
    let bestIndex = -1;
    let bestRatio = 0;
    let bestCount = 0;
    for (let i = 0; i < maxCols; i += 1) {
      let dateCount = 0;
      let totalCount = 0;
      let codeCount = 0;
      rows.forEach((row) => {
        const cell = row.columns[i] || '';
        if (!cell) return;
        totalCount += 1;
        const upper = cell.toUpperCase();
        if (manualCodeRegex.test(upper)) codeCount += 1;
        if (extractDateToken(cell)) dateCount += 1;
      });
      if (totalCount < 2 || dateCount < 2) continue;
      const ratio = dateCount / totalCount;
      const codeRatio = codeCount / totalCount;
      if (ratio >= 0.6 && codeRatio < 0.4) {
        if (ratio > bestRatio || (ratio === bestRatio && dateCount > bestCount)) {
          bestIndex = i;
          bestRatio = ratio;
          bestCount = dateCount;
        }
      }
    }
    return bestIndex;
  };
  const sidebarTooltip = document.createElement('div');
  sidebarTooltip.className = 'hover-tooltip';
  document.body.appendChild(sidebarTooltip);
  let sidebarTooltipTimer = null;

  const courseMapTooltip = document.createElement('div');
  courseMapTooltip.className = 'course-map-tooltip';
  document.body.appendChild(courseMapTooltip);
  let courseMapTooltipTimer = null;
  let courseMapTooltipTarget = null;
  let courseMapTooltipPos = { x: 0, y: 0 };

  const getCourseMapPrereqText = (code) => {
    const prereqs = prerequisites[code] || [];
    const coreqs = corequisites[code] || [];
    const lines = [];
    if (prereqs.length) lines.push(`Prerequisites: ${prereqs.join(', ')}`);
    if (coreqs.length) lines.push(`Co-requisites: ${coreqs.join(', ')}`);
    return lines.length ? lines.join('\n') : 'No prerequisites.';
  };

  const positionCourseMapTooltip = () => {
    courseMapTooltip.style.left = `${courseMapTooltipPos.x + 12}px`;
    courseMapTooltip.style.top = `${courseMapTooltipPos.y + 12}px`;
  };

  const showCourseMapTooltip = (code) => {
    if (!code) return;
    courseMapTooltip.textContent = getCourseMapPrereqText(code);
    positionCourseMapTooltip();
    courseMapTooltip.style.display = 'block';
  };

  const hideCourseMapTooltip = () => {
    courseMapTooltip.style.display = 'none';
  };
    const isFileProtocol = location.protocol === 'file:';
    const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    const isLocalEnv = isFileProtocol || isLocalHost;
    const isSharePointHost = /sharepoint/i.test(location.hostname);
    const getQueryParam = (key) => {
      const search = location.search || '';
      if (typeof URLSearchParams !== 'undefined') {
        try {
          return new URLSearchParams(search).get(key);
        } catch (error) {
          // fall through to manual parsing if URLSearchParams is unavailable
        }
      }
      const pattern = new RegExp(`[?&]${key}=([^&]+)`, 'i');
      const match = pattern.exec(search);
      return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
    };
    const staffModeParam = (getQueryParam('mode') || '').trim().toLowerCase();
    const isStaffModeParam = staffModeParam === 'staff';
    const staffFacing = isLocalHost || isSharePointHost || isStaffModeParam;
    const shouldShowTeacherCopy = isSharePointHost || isStaffModeParam;
    const dropZoneEnabled = isLocalEnv || isSharePointHost || isStaffModeParam;

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
  const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));
  const enableModalDragResize = (modalEl) => {
    if (!modalEl || modalEl.dataset.dragResize === 'true') return;
    modalEl.dataset.dragResize = 'true';
    modalEl.classList.add('is-draggable');

    const header = modalEl.querySelector('.modal-header');
    const resizer = document.createElement('div');
    resizer.className = 'modal-resizer';
    modalEl.appendChild(resizer);

    const ensureFixed = () => {
      const rect = modalEl.getBoundingClientRect();
      modalEl.style.position = 'fixed';
      modalEl.style.left = `${rect.left}px`;
      modalEl.style.top = `${rect.top}px`;
      modalEl.style.margin = '0';
      modalEl.style.transform = 'none';
      modalEl.style.width = `${rect.width}px`;
      modalEl.style.height = `${rect.height}px`;
      modalEl.style.maxWidth = 'none';
      modalEl.style.maxHeight = 'none';
      return rect;
    };

    const startDrag = (event) => {
      if (event.button !== 0) return;
      if (event.target.closest('button, input, select, textarea, a')) return;
      event.preventDefault();
      const rect = ensureFixed();
      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = rect.left;
      const startTop = rect.top;
      const width = rect.width;
      const height = rect.height;
      const margin = 8;

      modalEl.classList.add('is-dragging');

      const onMove = (e) => {
        const nextLeft = clampValue(startLeft + (e.clientX - startX), margin, window.innerWidth - width - margin);
        const nextTop = clampValue(startTop + (e.clientY - startY), margin, window.innerHeight - height - margin);
        modalEl.style.left = `${nextLeft}px`;
        modalEl.style.top = `${nextTop}px`;
      };

      const onUp = () => {
        modalEl.classList.remove('is-dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    const startResize = (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const rect = ensureFixed();
      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = rect.width;
      const startHeight = rect.height;
      const minWidth = 280;
      const minHeight = 180;
      const margin = 8;

      modalEl.classList.add('is-resizing');

      const onMove = (e) => {
        const nextWidth = clampValue(startWidth + (e.clientX - startX), minWidth, window.innerWidth - margin * 2);
        const nextHeight = clampValue(startHeight + (e.clientY - startY), minHeight, window.innerHeight - margin * 2);
        modalEl.style.width = `${nextWidth}px`;
        modalEl.style.height = `${nextHeight}px`;
        const rectNow = modalEl.getBoundingClientRect();
        const nextLeft = clampValue(rectNow.left, margin, window.innerWidth - rectNow.width - margin);
        const nextTop = clampValue(rectNow.top, margin, window.innerHeight - rectNow.height - margin);
        modalEl.style.left = `${nextLeft}px`;
        modalEl.style.top = `${nextTop}px`;
      };

      const onUp = () => {
        modalEl.classList.remove('is-resizing');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        const table = modalEl.querySelector('table');
        if (table) syncSubjectTableActions(table);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    if (header) header.addEventListener('mousedown', startDrag);
    resizer.addEventListener('mousedown', startResize);
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
  const majorPickerSection = document.querySelector('.major-picker');
  const majorPickerSelectContainer =
    majorToggle?.closest('.major-picker__select') || majorToggle?.parentElement;
  const majorStreamInsightsEl = document.createElement('div');
  majorStreamInsightsEl.className = 'major-stream-insights hidden-initial';
  majorStreamInsightsEl.setAttribute('aria-live', 'polite');
  if (majorPickerSelectContainer?.parentElement) {
    majorPickerSelectContainer.insertAdjacentElement('afterend', majorStreamInsightsEl);
  } else if (majorPickerSection) {
    majorPickerSection.appendChild(majorStreamInsightsEl);
  }
  const majorStreamDefinitions = [
    { key: 'ns', shortLabel: 'NS', label: 'Network Security' },
    { key: 'ba', shortLabel: 'BA', label: 'Business Analytics' },
    { key: 'sd', shortLabel: 'SD', label: 'Software Development' },
  ];
  const MAJOR_STREAM_YEAR_THRESHOLD = 8;
  const creditWarningIds = new Set([
    'BIT313', 'BIT314', 'BIT351', 'BIT352', 'BIT353', 'BIT355', 'BIT356', 'BIT357', 'BIT358', 'BIT362', 'BIT363', 'BIT364', 'BIT371', 'BIT372', 'BIT241'
  ]);

  let completedMode = false;
  let overrideMode = false;
    let livePrereqUpdates = false;
    let livePrereqEnabled = false;
    let passForEnrolmentsEnabled = false;
  let fullLoadCap = 4;
  let studentType = 'international';
  let exceptionalLoadApproved = false;
  let remainingConfirmed = false;
    let electiveError = null;
    let prereqError = null;
    let chainDelayError = null;
    let aprAppError = null;
    let acceptedOfferedError = null;
    let intakeStartError = null;
    let infoNotes = null;
    let countryHittingTroubles = null;
    const passForEnrolmentsOverrides = new Set();
    const currentEnrolmentsPlannedOverrides = new Set();
  let loadedStudentSnapshot = null;
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

  const getMajorStreamCounts = () => {
    const counts = {};
    majorStreamDefinitions.forEach((stream) => {
      const codes = majorLayouts[stream.key] || [];
      counts[stream.key] = codes.reduce(
        (total, code) => total + (subjectState.get(code)?.completed ? 1 : 0),
        0
      );
    });
    return counts;
  };
  const getBestMajorSelection = () => {
    const streamCounts = getMajorStreamCounts();
    const map = [
      { key: 'ns', value: 'network' },
      { key: 'ba', value: 'ba' },
      { key: 'sd', value: 'sd' },
    ];
    const bestCount = Math.max(...map.map(({ key }) => streamCounts[key] || 0));
    if (!bestCount) return 'network';
    const bestEntry = map.find(({ key }) => (streamCounts[key] || 0) === bestCount);
    return bestEntry ? bestEntry.value : null;
  };
  const setMajorDropdownSelection = (value) => {
    if (!majorDropdown) return;
    majorDropdown.dataset.value = value;
    majorOptions.forEach((opt) => {
      opt.classList.toggle('selected', opt.dataset.value === value);
    });
    updateMajor();
    updateMajorStreamInsights();
  };

  const updateMajorStreamInsights = () => {
    if (!majorStreamInsightsEl) return;
    if (completedMode) {
      majorStreamInsightsEl.classList.add('hidden-initial');
      return;
    }
    const completed = getCompletedCount();
    if (completed < MAJOR_STREAM_YEAR_THRESHOLD) {
      majorStreamInsightsEl.classList.add('hidden-initial');
      return;
    }
    const streamCounts = getMajorStreamCounts();
    const summary = majorStreamDefinitions
      .map((stream) => `${stream.shortLabel} ${streamCounts[stream.key] || 0}`)
      .join('.  ');
    majorStreamInsightsEl.innerHTML = `<span class="major-stream-summary">${summary}</span>`;
    majorStreamInsightsEl.classList.remove('hidden-initial');
  };

  const getMajorDisplayName = () => {
    const val = majorDropdown?.dataset?.value || currentMajorValue || 'undecided';
    if (val === 'network') return 'Network Security';
    if (val === 'ba') return 'Business Analytics';
    if (val === 'sd') return 'Software Development';
    return 'Network Security';
  };

  const getMajorRequirementDistance = ({
    completedSet,
    plannedSet,
    treatPlannedComplete,
    lockCurrentSemester = treatPlannedComplete,
    useDelay = false,
  }) => {
    const majorKey = getMajorKeyFromUi();
    const majorCodes = majorConfig[majorKey]?.codes || [];
    if (!majorCodes.length) return 0;
    const requiredTotal = Math.min(5, majorCodes.length);
    const compute = useDelay ? computeSemesterDistance : computeSemesterDistanceNoDelay;
    const memo = new Map();
    const majorDistances = majorCodes
      .map((code) => {
        const isDone = completedSet.has(code) || (treatPlannedComplete && plannedSet.has(code));
        const dist = isDone
          ? 0
          : compute(code, completedSet, plannedSet, treatPlannedComplete, lockCurrentSemester, memo);
        return { code, dist };
      })
      .filter(({ dist }) => Number.isFinite(dist));
    if (majorDistances.length < requiredTotal) return Infinity;
    const maxDist = Math.max(...majorDistances.map(({ dist }) => dist));
    const maxSemester = Math.max(1, maxDist + 2);
    for (let semester = 1; semester <= maxSemester; semester += 1) {
      const semesterKey = getSemesterKeyForOffset(semester - 1);
      const completedBefore = new Set();
      const totalPossible = new Set();
      majorDistances.forEach(({ code, dist }) => {
        if (dist <= semester - 1) {
          completedBefore.add(code);
          totalPossible.add(code);
        }
        if (dist <= semester) {
          const availability = getSemesterAvailability(code);
          if (!useDelay || availability === 'Any' || availability === semesterKey) {
            totalPossible.add(code);
          }
        }
      });
      if (completedBefore.size >= 3 && totalPossible.size >= requiredTotal) {
        return semester - 1;
      }
    }
    return Infinity;
  };

  const computeSemesterDistance = (
    id,
    completedSet,
    plannedSet,
    treatPlannedComplete = false,
    lockCurrentSemester = false,
    memo = new Map(),
    stack = new Set()
  ) => {
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
      const base = lockCurrentSemester ? 2 : 1;
      const result = alignDistanceToAvailability(id, base);
      memo.set(id, result);
      stack.delete(id);
      return result;
    }
    let maxDepth = 0;
    for (const pre of prereqs) {
      const dist = computeSemesterDistance(
        pre,
        completedSet,
        plannedSet,
        treatPlannedComplete,
        lockCurrentSemester,
        memo,
        stack
      );
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
        lockCurrentSemester,
        useDelay: true,
      });
      if (!Number.isFinite(majorDistance)) {
        memo.set(id, Infinity);
        stack.delete(id);
        return Infinity;
      }
      maxDepth = Math.max(maxDepth, majorDistance);
    }
    let base = maxDepth + 1;
    if (lockCurrentSemester && base === 1) {
      base = 2;
    }
    const result = alignDistanceToAvailability(id, base);
    memo.set(id, result);
    stack.delete(id);
    return result;
  };
  const computeSemesterDistanceNoDelay = (
    id,
    completedSet,
    plannedSet,
    treatPlannedComplete = false,
    lockCurrentSemester = false,
    memo = new Map(),
    stack = new Set()
  ) => {
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
      const result = lockCurrentSemester ? 2 : 1;
      memo.set(id, result);
      stack.delete(id);
      return result;
    }
    let maxDepth = 0;
    for (const pre of prereqs) {
      const dist = computeSemesterDistanceNoDelay(
        pre,
        completedSet,
        plannedSet,
        treatPlannedComplete,
        lockCurrentSemester,
        memo,
        stack
      );
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
        lockCurrentSemester,
        useDelay: false,
      });
      if (!Number.isFinite(majorDistance)) {
        memo.set(id, Infinity);
        stack.delete(id);
        return Infinity;
      }
      maxDepth = Math.max(maxDepth, majorDistance);
    }
    let result = maxDepth + 1;
    if (lockCurrentSemester && result === 1) {
      result = 2;
    }
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
    const lockCurrentSemester = treatPlannedComplete;
    const adjustForLockedSemester = (value) => {
      if (!lockCurrentSemester) return value;
      if (!Number.isFinite(value) || value <= 0) return value;
      return Math.max(1, value - 1);
    };
    const plannedSetActual = new Set(
      Array.from(subjectState.entries())
        .filter(([, st]) => st?.toggled)
        .map(([code]) => code)
    );
    subjects.forEach((cell) => {
      const id = cell.dataset.subject;
      if (!id) {
        const existing = cell.querySelector('.sem-count');
        if (existing) existing.remove();
        return;
      }
      const existing = cell.querySelector('.sem-count');
      const el = existing || document.createElement('div');
      el.className = 'sem-count';
      const rawDist = computeSemesterDistance(
        id,
        completedSet,
        plannedSet,
        treatPlannedComplete,
        lockCurrentSemester,
        memo
      );
      const rawDistNoDelay = computeSemesterDistanceNoDelay(
        id,
        completedSet,
        plannedSet,
        treatPlannedComplete,
        lockCurrentSemester,
        memoNoDelay
      );
      const dist = adjustForLockedSemester(rawDist);
      const distNoDelay = adjustForLockedSemester(rawDistNoDelay);
      const label = dist === Infinity ? '?' : dist;
      el.textContent = label;
      const availability = getSemesterAvailability(id);
      const isRunningNow = isRunningThisSemester(id);
      const semesterLabel = availability !== 'Any' ? getSemesterLabel(availability) : '';
      el.dataset.reason =
        dist === 0
          ? 'Already completed.'
          : !isRunningNow && availability !== 'Any'
            ? `Runs in ${semesterLabel} only; earliest completion next semester.`
            : dist === 1
              ? lockCurrentSemester
                ? 'Prerequisites satisfied; can complete next semester.'
                : 'Prerequisites satisfied; can complete this semester.'
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
      const chainMemoWithDelay = new Map();
      const plannedSetForChain = plannedSetActual;
      const chainRemaining = getRemainingSubjectsCount();
      const chainOptimalSemesters = Math.max(1, Math.ceil(chainRemaining / Math.max(1, loadThreshold)));
      const fullLoadSelected = lockCurrentSemester;
      const chainTreatPlannedComplete = fullLoadSelected;
      const chainLockCurrentSemester = fullLoadSelected;
      subjects.forEach((cell) => {
        const id = cell.dataset.subject;
        if (!id) return;
        const rawDistNoDelay = computeSemesterDistanceNoDelay(
          id,
          completedSet,
          plannedSetForChain,
          chainTreatPlannedComplete,
          chainLockCurrentSemester,
          chainMemoNoDelay
        );
        distNoDelayMap.set(id, adjustForLockedSemester(rawDistNoDelay));
      });
      const getDistNoDelay = (code) => distNoDelayMap.get(code) ?? 0;
      const getDistWithDelay = (code) =>
        adjustForLockedSemester(
          computeSemesterDistance(
            code,
            completedSet,
            plannedSetForChain,
            chainTreatPlannedComplete,
            chainLockCurrentSemester,
            chainMemoWithDelay
          )
        );
      const chainDistanceMap = new Map();
      const getChainDistance = (code) => {
        if (chainDistanceMap.has(code)) return chainDistanceMap.get(code);
        const base = getDistWithDelay(code);
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
        const getElectiveDistance = (code) => getDistWithDelay(code);
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
        const chainDist = getChainDistance(id);
        if (!Number.isFinite(chainDist) || chainDist <= 0) return;
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
        !isRunningThisSemester(code) &&
        (prerequisites[code] || []).every(
          (pre) => completedSet.has(pre) || (chainTreatPlannedComplete && plannedSetForChain.has(pre))
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
      const severity = fullLoadSelected
        ? hasOverrun
          ? 'error'
          : hasEqual && allowChainWarning
            ? 'warning'
            : null
        : null;
      if (severity) {
        const formatChainSubject = (code) =>
          canTakeIfRunningNow(code) ? `${code} (not running this semester)` : code;
        const relevantPaths = hasOverrun ? filteredOverrun : filteredEqual;
        const hasAvailabilityDelay = relevantPaths.some((path) => {
          const head = path[0];
          const withDelay = getChainDistance(head);
          const withoutDelay = getDistNoDelay(head);
          return Number.isFinite(withDelay) && Number.isFinite(withoutDelay) && withDelay > withoutDelay;
        });
        const availabilityPrefix = hasAvailabilityDelay ? 'Alternating subject(s) \u2192 ' : '';
        const pathStrings = relevantPaths
          .map((path) => `${availabilityPrefix}${trimPathForDisplay(path).map(formatChainSubject).join(' \u2192 ')}`)
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
        const availabilityNote = hasAvailabilityDelay
          ? '<p class="alert-inline-text"><strong>Note</strong>: This delay is caused by subjects that run only <strong>once per year</strong>. They haven\'t been named in the chain list above, but they can add an extra semester if not taken when available.</p>'
          : '';
        chainDelayError = {
          title: chainTitle,
          severity,
          html: `<p><strong class="alert-inline-title ${chainOverrunsPlan ? 'alert-title-error' : 'alert-title-warning'}">${chainTitle}</strong> <span class="alert-inline-text">${chainIntro}</span></p>${body}${availabilityNote}`,
        };
      }
    } else {
      chainDelayError = null;
    }
    if (remaining > 8 && distanceData.length) {
      const maxDist = distanceData.reduce((max, d) => Math.max(max, d.dist), 0);
      const warningMaxDist = maxDist;
      if (maxDist > 0 && Number.isFinite(maxDist)) {
        const targets = distanceData.filter((d) => d.dist === maxDist);
        targets.forEach(({ el }) => el?.classList.add('final-sem-pill'));
        if ((targets.length > 4 || warningMaxDist >= 5) && !completedMode && plannedCount >= loadThreshold && !chainDelayError) {
          const completionSemesters = Math.max(1, Math.ceil(remaining / Math.max(1, loadThreshold)));
          const hasAvailabilityDelay = targets.some(
            ({ dist, distNoDelay }) =>
              Number.isFinite(distNoDelay) && Number.isFinite(dist) && distNoDelay > 0 && dist > distNoDelay
          );
          const availabilityNote = hasAvailabilityDelay
            ? ' Note: One or more subjects run only in Semester 1 or Semester 2, which can add an extra semester.'
            : '';
          const subjectList = targets
            .map(({ cell }) => cell?.dataset?.subject)
            .filter(Boolean);
          const formattedList =
            subjectList.length > 1
              ? `${subjectList.slice(0, -1).join(', ')} and ${subjectList.slice(-1)}`
              : subjectList.join(', ');
          const chainSemesters = warningMaxDist;
          finalSemWarning = {
            title: 'Tight prerequisite chain',
            html: `<p><strong class="alert-inline-title alert-title-warning">Tight prerequisite chain</strong> <span class="alert-inline-text">Take care with the subjects you choose lest your graduation is delayed by a semester. That is, your course is due for completion in <strong>${completionSemesters}</strong> semester${completionSemesters === 1 ? '' : 's'}, and these subjects are at the end of a ${chainSemesters} semester chain: <strong>${formattedList}</strong>.${availabilityNote}</span></p>`,
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
    getAllSubjectCodes().forEach((code) => {
      if (!code) return;
      subjectState.set(code, { completed: false, toggled: false });
    });
  };

  const applySubjectStateToCells = () => {
    subjects.forEach((cell) => {
      const id = cell.dataset.subject;
      if (!id || isPlaceholder(cell)) return;
      const st = subjectState.get(id);
      cell.classList.remove('completed', 'toggled', 'completed-pending');
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
    passForEnrolmentsOverrides.forEach((code) => {
      const cell = getCellByCode(code);
      if (cell && cell.classList.contains('completed')) {
        cell.classList.add('completed-pending');
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

  const getElectivePlaceholders = () => {
    const ordered = electivePlaceholderOrder
      .map((code) => document.querySelector(`[data-subject="${code}"]`))
      .filter(Boolean);
    return ordered.length ? ordered : electivePlaceholderCells;
  };

  const formatDate = (d) => formatDisplayDate(d);

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
      const appliedCode = (bitCode || useCode || '').toUpperCase();
      if (appliedCode) {
        cell.dataset.electiveCode = appliedCode;
      } else {
        cell.removeAttribute('data-elective-code');
      }
      const useText = useCode ? `${useCode} ${useDisplayNames[useCode] || 'Unspecified Elective'}` : '';
      const text = displayEntries[idx] || useText || '';
      const useMatch = text ? text.match(/^(USE\d{3})/i) : null;
      const isUseCredit = !!useCode && !bitCode;
      const isBitPlanned = !!(bitCode && bitState?.toggled);
      const isBitCompleted = !!(bitCode && bitState?.completed);
      const isBitPending = !!(bitCode && passForEnrolmentsOverrides.has(bitCode));
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
        cell.classList.toggle('completed-pending', isBitPending);
        cell.setAttribute('aria-pressed', isUseCredit || isBitCompleted || isBitPlanned ? 'true' : 'false');
      } else {
        // Only restore original label if clearing (no persisted state)
        if (titleEl && cell.dataset.originalTitle) titleEl.textContent = cell.dataset.originalTitle;
        if (noteEl && cell.dataset.originalNote) noteEl.textContent = cell.dataset.originalNote;
        cell.classList.remove('toggled', 'completed', 'filled-elective', 'use-credit', 'completed-pending');
        cell.setAttribute('aria-pressed', 'false');
      }
    });
    updatePlaceholderDisplayForMode();
    updateElectivesFullUI();
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
        cell.classList.remove('satisfied-tooltip');
        return;
      }
      const isNotThisSem = !isRunningThisSemester(id);
      cell.classList.toggle('satisfied', met);
      const canSelectNow = id === 'BIT371' ? met && !isNotThisSem : metNow && !isNotThisSem;
      cell.classList.toggle('can-select-now', canSelectNow);
      cell.classList.toggle('locked', !met);
      if (areElectivesFull() && isElectivesGridCell(cell)) {
        cell.classList.remove('satisfied', 'can-select-now');
        cell.classList.add('locked');
      }
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

    updateElectivesFullUI();
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

  const updateSubjectCounts = () => {
    if (!subjectCountsEl) return;
    const completed = getCompletedCount();
    const useCredits = getUseCreditsCount();
    const selected = getPlannedCount();
    const remaining = getRemainingSubjectsCount();
    const completedTotal = completed + useCredits;
    const hasAny = completedTotal > 0 || selected > 0;
    if (!hasAny) {
      subjectCountsEl.innerHTML = '';
      subjectCountsEl.classList.remove('is-visible');
      updateMajorStreamInsights();
      return;
    }
    const completedCodes = new Set();
    subjectState.forEach((st, code) => {
      if (st?.completed) completedCodes.add(code);
    });
    electivePlaceholderState.forEach((code) => {
      if (code && validSubjectCodes.has(code)) completedCodes.add(code);
    });
    const selectedCodes = Array.from(subjectState.entries())
      .filter(([, st]) => st?.toggled)
      .map(([code]) => code);
    const remainingCodes = new Set();
    getRemainingRows().forEach((row) => remainingCodes.add(row.id));
    getRemainingElectiveRows().forEach((row) => remainingCodes.add(row.id));

    const formatListHtml = (title, codes) => {
      if (!codes.length) {
        return `<div class="ui-tooltip-row ui-tooltip-title">${escapeHtml(title)}: none</div>`;
      }
      const lines = codes
        .map((code) => `${formatHistoryCode(code)} ${getSubjectName(code)}`.trim())
        .sort((a, b) => a.localeCompare(b));
      const rows = lines
        .map((line) => `<div class="ui-tooltip-row">${escapeHtml(line)}</div>`)
        .join('');
      return `<div class="ui-tooltip-row ui-tooltip-title">${escapeHtml(title)}</div>${rows}`;
    };

    const completedTooltip = formatListHtml('Completed', Array.from(completedCodes));
    const selectedTooltip = formatListHtml('Selected', selectedCodes);
    const remainingTooltip = formatListHtml('Remaining', Array.from(remainingCodes));

    subjectCountsEl.innerHTML =
      `<div class="subject-counts-line">` +
      `<span class="subject-counts-item" data-tooltip-html="${completedTooltip}">${completedTotal} subjects completed</span>, ` +
      `<span class="subject-counts-item" data-tooltip-html="${selectedTooltip}">${selected} selected</span>` +
      `</div>` +
      `<div class="subject-counts-line">` +
      `<span class="subject-counts-item" data-tooltip-html="${remainingTooltip}">${remaining} remaining</span>` +
      `</div>`;
    subjectCountsEl.classList.add('is-visible');
    initTooltips();
    updateMajorStreamInsights();
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
      updateSubjectCounts();
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
    updateSubjectCounts();
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
    const hasSelected = selectedCount >= threshold && threshold > 0;
    if (showTimetableButton) {
      // Ensure inline display overrides the hidden-initial class when we have selections.
      showTimetableButton.style.display = hasSelected ? 'block' : 'none';
      showTimetableButton.classList.toggle('hidden-initial', !hasSelected);
      if (livePrereqRow) {
        livePrereqRow.style.display = hasSelected ? 'flex' : 'none';
        livePrereqRow.classList.toggle('hidden-initial', !hasSelected);
      }
    }
    if (nextSemesterButton) {
      nextSemesterButton.style.display = hasSelected ? '' : 'none';
      nextSemesterButton.classList.toggle('hidden-initial', !hasSelected);
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
      const hasHistory = getHistoryRows().length > 0 || manualEntryCurrent.size > 0 || manualEntryUnknown.length > 0;
      historyButton.style.display = hasHistory ? '' : 'none';
    }
    if (remainingButton) {
      remainingButton.style.display = '';
      remainingButton.classList.remove('hidden-initial');
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
    updateSubjectCounts();
    updatePrereqErrors();
    updateNextSemWarning();
  };

  let completedModeStickyTop = null;
  const updateCompletedModeSticky = () => {
    if (!completedModeButton) return;
    if (!completedMode) {
      completedModeButton.classList.remove('completed-mode-stuck');
      return;
    }
    if (completedModeStickyTop === null) {
      const rect = completedModeButton.getBoundingClientRect();
      completedModeStickyTop = rect.top + window.scrollY;
    }
    const shouldStick = window.scrollY + 10 >= completedModeStickyTop;
    completedModeButton.classList.toggle('completed-mode-stuck', shouldStick);
  };

  const updateCompletedModeUI = () => {
    if (!completedModeButton) return;
    completedModeButton.textContent = completedMode ? 'Exit this history mode (start selecting subjects)' : 'Clicking mode';
    completedModeButton.setAttribute('aria-pressed', completedMode ? 'true' : 'false');
    completedModeButton.classList.toggle('completed-mode-wide', completedMode);
    if (!completedMode) {
      completedModeStickyTop = null;
      completedModeButton.classList.remove('completed-mode-stuck');
    } else {
      completedModeStickyTop = null;
      requestAnimationFrame(updateCompletedModeSticky);
    }
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

    const updateSemCountUI = () => {
      if (!toggleSemCountsBtn) return;
      toggleSemCountsBtn.checked = showSemCounts;
      toggleSemCountsBtn.setAttribute('aria-pressed', showSemCounts ? 'true' : 'false');
      if (semCountsLabel) {
        semCountsLabel.textContent = showSemCounts
          ? 'Show semesters remaining (active)'
          : 'Show semesters remaining';
        semCountsLabel.classList.toggle('active', showSemCounts);
      }
    };

    const updatePassForEnrolmentsIndicator = () => {
      const label = passForEnrolmentsToggle?.closest('.toggle-row')?.querySelector('.switch-label');
      if (!label) return;
      const highlight = passForEnrolmentsEnabled && passForEnrolmentsOverrides.size > 0;
      label.classList.toggle('pass-enrolments-highlight', highlight);
    };

    const applyPassForEnrolmentsState = () => {
      // Roll back any previous overrides first.
      passForEnrolmentsOverrides.forEach((code) => {
        const st = subjectState.get(code);
        if (st?.completed) {
          subjectState.set(code, { completed: false, toggled: st.toggled });
        }
      });
      passForEnrolmentsOverrides.clear();
      currentEnrolmentsPlannedOverrides.forEach((code) => {
        const st = subjectState.get(code);
        if (st?.toggled && !st?.completed) {
          subjectState.set(code, { completed: false, toggled: false });
        }
      });
      currentEnrolmentsPlannedOverrides.clear();

      const allCurrent = new Set([
        ...Array.from(workbookCurrent.keys()),
        ...Array.from(manualEntryCurrent.keys()),
      ]);
      if (passForEnrolmentsEnabled) {
        allCurrent.forEach((code) => {
          if (!validSubjectCodes.has(code)) return;
          const st = subjectState.get(code) || { completed: false, toggled: false };
          if (st.completed) return;
          subjectState.set(code, { completed: true, toggled: st.toggled });
          passForEnrolmentsOverrides.add(code);
        });
      } else {
        allCurrent.forEach((code) => {
          if (!validSubjectCodes.has(code)) return;
          const st = subjectState.get(code) || { completed: false, toggled: false };
          if (st.completed) return;
          subjectState.set(code, { completed: false, toggled: true });
          currentEnrolmentsPlannedOverrides.add(code);
        });
      }

      applySubjectStateToCells();
      rebuildElectiveBitStateFromState();
      setElectiveCredits(buildElectiveAssignments(), true);
      updateElectiveWarning();
      updateSelectedList();
      conditionalRecompute({ force: true, usePlanned: completedMode ? false : null });
      updateResetState();
      updatePassForEnrolmentsIndicator();
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

  const buildSemesterBadgeHtml = (availability) => {
    const semesterNumber = availability === 'S1' ? '1' : availability === 'S2' ? '2' : '';
    if (!semesterNumber) return '';
    return `<span class="alt-sem-line">Only runs in</span><span class="alt-sem-line">Semester <strong>${semesterNumber}</strong></span>`;
  };

  const ensureSemesterBadgeUI = (cell) => {
    if (!cell) return;
    const availability = getSemesterAvailability(cell.dataset.subject || '');
    if (availability === 'Any') return;
    const html = buildSemesterBadgeHtml(availability);
    if (!html) return;
    const existing = cell.querySelector('.alternate-semester-label');
    if (existing) {
      existing.innerHTML = html;
      return;
    }
    const label = document.createElement('div');
    label.className = 'alternate-semester-label';
    label.innerHTML = html;
    cell.appendChild(label);
  };

  const ensureNotThisSemUI = (cell) => {
    if (!cell) return;
    cell.classList.add('not-this-sem');
    cell.classList.remove('clickable');
    cell.tabIndex = 0;
    ensureSemesterBadgeUI(cell);
    if (!cell.querySelector('.not-running-tooltip')) {
      const tip = document.createElement('div');
      tip.className = 'not-running-tooltip';
      const availability = getSemesterAvailability(cell.dataset.subject || '');
      const semesterLabel = availability !== 'Any' ? getSemesterLabel(availability) : 'next semester';
      tip.textContent =
        availability !== 'Any'
          ? `This subject runs in ${semesterLabel} only. It will run next semester.`
          : 'This subject is not running this semester. It will run next semester';
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
      const isNotThisSem = !isRunningThisSemester(id);
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
      const isMouseEvent =
        !!event && (event.type.startsWith('mouse') || (typeof MouseEvent !== 'undefined' && event instanceof MouseEvent));
      const isTouchLike = isTouchDevice && !isMouseEvent;
      const clientX = event?.clientX ?? rect.left + rect.width / 2;
      const clientY = event?.clientY ?? rect.top + rect.height * 0.7;
      const offsetX = clientX - rect.left - tooltipWidth / 2;
      // On smaller screens allow the tooltip to overflow the card so content isn't cramped.
      const allowOverflow = window.innerWidth < 1300;
      const minX = allowOverflow ? -tooltipWidth * 0.35 : 0;
      const maxX = allowOverflow ? rect.width - tooltipWidth * 0.65 : rect.width - tooltipWidth;
      const clampedX = Math.max(minX, Math.min(offsetX, maxX));
      let offsetY = isTouchLike ? rect.height * 0.7 : clientY - rect.top + 27;
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
      const isMouseEvent =
        !!event && (event.type.startsWith('mouse') || (typeof MouseEvent !== 'undefined' && event instanceof MouseEvent));
      if (isTouchDevice && completedMode && isPlaceholderCell() && !isMouseEvent) {
        return;
      }
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
    const label = cell.querySelector('.alternate-semester-label');
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
    if (isSemesterRestricted(code)) ensureSemesterBadgeUI(cell);
    if (!isRunningThisSemester(code)) ensureNotThisSemUI(cell);

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
        cell.querySelectorAll('.sem-count, .electives-full-pill').forEach((n) => n.remove());
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
      if (isSemesterRestricted(code)) ensureSemesterBadgeUI(cell);
      if (!isRunningThisSemester(code)) ensureNotThisSemUI(cell);
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
    if (aprAppError) errorPayloads.push(aprAppError);
    if (acceptedOfferedError) errorPayloads.push(acceptedOfferedError);
    if (intakeStartError) errorPayloads.push(intakeStartError);
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
      if (dropSidebar) {
        dropSidebar.style.display = dropZoneEnabled ? 'flex' : 'none';
        dropSidebar.classList.toggle('is-active', dropZoneEnabled);
      }
      dropZone.style.display = dropZoneEnabled ? 'flex' : 'none';
      if (!dropZoneEnabled) return;
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
        if (dropSidebar) dropSidebar.classList.add('is-active');
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        lastDroppedFileInfo = {
          fileName: file.name,
          savedLine: formatFileDateInfo(file),
        };
        renderDropZoneStatus([lastDroppedFileInfo.fileName, lastDroppedFileInfo.savedLine]);
        if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(true);
        loadWorkbookFromFile(file);
      });
  };

  initDropZone();
  if (!studentRecords.length && window.location.protocol.startsWith('http')) {
    loadWorkbookFromUrl('../Source.xlsx');
  }
  if (studentIdInput) {
    studentIdInput.addEventListener('input', handleStudentIdInput);
    studentIdInput.addEventListener('keydown', (event) => {
      if (!studentSearchDropdown || studentSearchDropdown.hidden) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveStudentSearchActive(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveStudentSearchActive(-1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        selectActiveStudentSearch();
      }
    });
  }
  if (studentSearchDropdown) {
    studentSearchDropdown.addEventListener('click', (event) => {
      const option = event.target?.closest?.('.student-search-option');
      if (!option) return;
      const id = option.getAttribute('data-student-id') || '';
      const record = studentRecords.find((row) => normalizeStudentId(row.Student_IDs_Unique) === id);
      if (record) applyStudentSearchSelection(record);
    });
    studentSearchDropdown.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const option = event.target?.closest?.('.student-search-option');
      if (!option) return;
      event.preventDefault();
      const id = option.getAttribute('data-student-id') || '';
      const record = studentRecords.find((row) => normalizeStudentId(row.Student_IDs_Unique) === id);
      if (record) applyStudentSearchSelection(record);
    });
  }

  let uiTooltipEl = null;
  let uiTooltipTimer = null;
  let uiTooltipActiveTarget = null;
  let uiTooltipPoint = { x: 0, y: 0 };

  const initTooltips = () => {
    const tooltipTargets = Array.from(document.querySelectorAll('[data-tooltip]'));
    if (!tooltipTargets.length) return;
    if (!uiTooltipEl) {
      uiTooltipEl = document.createElement('div');
      uiTooltipEl.className = 'ui-tooltip';
      document.body.appendChild(uiTooltipEl);
    }

    const clearTooltipTimer = () => {
      if (uiTooltipTimer) {
        clearTimeout(uiTooltipTimer);
        uiTooltipTimer = null;
      }
    };

    const hideTooltip = () => {
      clearTooltipTimer();
      uiTooltipEl.style.display = 'none';
      uiTooltipEl.textContent = '';
      uiTooltipActiveTarget = null;
    };

    const positionTooltip = (x, y, alignRight = false) => {
      const offsetX = 15;
      const offsetY = 12;
      const tooltipRect = uiTooltipEl.getBoundingClientRect();
      const maxX = window.innerWidth - tooltipRect.width - 8;
      const maxY = window.innerHeight - tooltipRect.height - 8;
      const baseLeft = alignRight ? x - tooltipRect.width : x + offsetX;
      const baseTop = alignRight ? y : y + offsetY;
      const nextLeft = Math.min(maxX, Math.max(8, baseLeft));
      const nextTop = Math.min(maxY, Math.max(8, baseTop));
      uiTooltipEl.style.left = `${nextLeft}px`;
      uiTooltipEl.style.top = `${nextTop}px`;
    };

    const showTooltip = (target, x, y) => {
      const html = target?.getAttribute('data-tooltip-html');
      const text = target?.getAttribute('data-tooltip') || '';
      if (!text && !html) return;
      const isCounts = target.classList.contains('subject-counts-item');
      uiTooltipEl.classList.toggle('ui-tooltip-counts', isCounts);
      if (html) {
        uiTooltipEl.innerHTML = html;
      } else {
        uiTooltipEl.textContent = text;
      }
      uiTooltipEl.style.display = 'block';
      positionTooltip(x, y, isCounts);
    };

    const bindTarget = (target) => {
      if (target.dataset.tooltipBound === 'true') return;
      target.dataset.tooltipBound = 'true';
      target.addEventListener('mouseenter', (event) => {
        uiTooltipActiveTarget = target;
        uiTooltipPoint = { x: event.clientX, y: event.clientY };
        clearTooltipTimer();
        uiTooltipTimer = setTimeout(() => {
          if (uiTooltipActiveTarget === target) showTooltip(target, uiTooltipPoint.x, uiTooltipPoint.y);
        }, 250);
      });
      target.addEventListener('mousemove', (event) => {
        uiTooltipPoint = { x: event.clientX, y: event.clientY };
        if (uiTooltipEl.style.display === 'block') {
          positionTooltip(uiTooltipPoint.x, uiTooltipPoint.y);
        }
      });
      target.addEventListener('mouseleave', hideTooltip);
      target.addEventListener('focus', (event) => {
        const rect = event.target.getBoundingClientRect();
        uiTooltipPoint = { x: rect.right, y: rect.bottom };
        clearTooltipTimer();
        uiTooltipTimer = setTimeout(() => {
          if (uiTooltipActiveTarget === target || !uiTooltipActiveTarget) {
            uiTooltipActiveTarget = target;
            showTooltip(target, uiTooltipPoint.x, uiTooltipPoint.y);
          }
        }, 250);
      });
      target.addEventListener('blur', hideTooltip);
    };

    tooltipTargets.forEach((target) => bindTarget(target));
  };

  initTooltips();

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

  const captureStudentSnapshot = () => ({
    subjectState: new Map(
      Array.from(subjectState.entries()).map(([code, st]) => [
        code,
        { completed: !!st?.completed, toggled: !!st?.toggled },
      ])
    ),
    electivePlaceholderState: [...electivePlaceholderState],
    electiveBitState: [...electiveBitState],
    manualEntryAliases: new Map(
      Array.from(manualEntryAliases.entries()).map(([code, set]) => [code, new Set(set || [])])
    ),
    manualEntryMeta: new Map(
      Array.from(manualEntryMeta.entries()).map(([code, meta]) => [
        code,
        { result: meta?.result || '', date: meta?.date || '' },
      ])
    ),
    manualEntryCurrent: new Map(
      Array.from(manualEntryCurrent.entries()).map(([code, meta]) => [
        code,
        { date: meta?.date || '' },
      ])
    ),
    manualEntryUnknown: manualEntryUnknown.map((entry) => ({ ...entry })),
    passForEnrolmentsOverrides: new Set(passForEnrolmentsOverrides),
    currentEnrolmentsPlannedOverrides: new Set(currentEnrolmentsPlannedOverrides),
    workbookCurrent: new Map(
      Array.from(workbookCurrent.entries()).map(([code, meta]) => [code, { ...meta }])
    ),
    majorValue: majorDropdown?.dataset?.value || currentMajorValue || 'undecided',
  });

  const restoreStudentSnapshot = (snapshot) => {
    if (!snapshot) return false;
    electivePlaceholderState = [...snapshot.electivePlaceholderState];
    electiveBitState = [...snapshot.electiveBitState];
    manualEntryAliases.clear();
    snapshot.manualEntryAliases.forEach((set, code) =>
      manualEntryAliases.set(code, new Set(set || []))
    );
    manualEntryMeta.clear();
    snapshot.manualEntryMeta.forEach((meta, code) =>
      manualEntryMeta.set(code, { result: meta?.result || '', date: meta?.date || '' })
    );
    workbookCurrent.clear();
    if (snapshot.workbookCurrent) {
      snapshot.workbookCurrent.forEach((meta, code) =>
        workbookCurrent.set(code, { date: meta?.date || '' })
      );
    }
    workbookCurrent.clear();
    if (snapshot.workbookCurrent) {
      snapshot.workbookCurrent.forEach((meta, code) =>
        workbookCurrent.set(code, { date: meta?.date || '' })
      );
    }
    manualEntryCurrent.clear();
    snapshot.manualEntryCurrent.forEach((meta, code) =>
      manualEntryCurrent.set(code, { date: meta?.date || '' })
    );
    manualEntryUnknown.length = 0;
    snapshot.manualEntryUnknown.forEach((entry) => manualEntryUnknown.push({ ...entry }));
    passForEnrolmentsOverrides.clear();
    snapshot.passForEnrolmentsOverrides.forEach((code) => passForEnrolmentsOverrides.add(code));
    currentEnrolmentsPlannedOverrides.clear();
    snapshot.currentEnrolmentsPlannedOverrides.forEach((code) =>
      currentEnrolmentsPlannedOverrides.add(code)
    );
    subjectState.clear();
    snapshot.subjectState.forEach((st, code) => subjectState.set(code, { ...st }));
    if (snapshot.majorValue) setMajorDropdownSelection(snapshot.majorValue);

    clearPlanned();
    clearCompleted();
    applySubjectStateToCells();
    rebuildElectiveBitStateFromState();
    conditionalRecompute({ force: true, usePlanned: false });
    updateResetState();
    setElectiveCredits(buildElectiveAssignments(), true);
    updateElectiveWarning();
    updateSelectedList();
    updateWarnings();
    updatePassForEnrolmentsIndicator();
    return true;
  };

  const resetStudentSelections = () => {
    if (staffWorkbookState.getStudentRecord() && loadedStudentSnapshot) {
      if (restoreStudentSnapshot(loadedStudentSnapshot)) return;
    }
    // Reset in-memory state first so all downstream UI refreshes read from the new truth.
    electivePlaceholderState = ['', '', '', ''];
    electiveBitState = ['', '', '', ''];
    manualEntryAliases.clear();
    manualEntryMeta.clear();
    manualEntryCurrent.clear();
    workbookCurrent.clear();
    manualEntryUnknown.length = 0;
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
  };
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      if (clearButton.disabled) return;
      resetStudentSelections();
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
      if (!isRunningThisSemester(id)) return;
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
    list.className = 'semester-timetable-list';
    entries.forEach(({ id, data }) => {
      const item = document.createElement('li');
      item.className = 'semester-timetable-item';
      applyDisplayTypeClass(item, id);
      item.appendChild(buildCourseTimetableTooltip(id));
      const row = document.createElement('div');
      row.className = 'semester-timetable-item-row';
      const code = document.createElement('span');
      code.className = 'semester-timetable-code';
      code.textContent = id;
      const name = document.createElement('span');
      name.className = 'semester-timetable-name';
      name.textContent = getSubjectName(id);
      row.appendChild(code);
      row.appendChild(name);
      item.appendChild(row);
      const meta = document.createElement('div');
      meta.className = 'semester-timetable-meta';
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

  const updateCourseTimetableColoursButton = () => {
    if (!courseTimetableColoursButton || !courseTimetableModal) return;
    courseTimetableColoursButton.textContent = courseTimetableColoursOn ? 'Colours Off' : 'Colours On';
    courseTimetableColoursButton.setAttribute('aria-pressed', String(courseTimetableColoursOn));
    courseTimetableModal.classList.toggle('semester-timetable-colours-off', !courseTimetableColoursOn);
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
    courseTimetableContent.classList.toggle('semester-timetable-list-mode', isList);
    if (isList) {
      dayNames.forEach((day) => {
        slotNames.forEach((slot) => {
          const entries = grid.get(day)?.get(slot) || [];
          const section = document.createElement('section');
          section.className = 'semester-timetable-section';
          const heading = document.createElement('div');
          heading.className = 'semester-timetable-heading';
          const dayLabel = document.createElement('span');
          dayLabel.className = 'semester-timetable-day-label';
          dayLabel.textContent = day;
          const slotLabel = document.createElement('span');
          slotLabel.className = 'semester-timetable-slot-label';
          slotLabel.textContent = getSlotAbbreviation(slot);
          heading.appendChild(dayLabel);
          heading.appendChild(document.createTextNode(' '));
          heading.appendChild(slotLabel);
          const timeRange = formatTimeRange(timeSlots[slot] || '');
          if (timeRange) {
            const timeLabel = document.createElement('span');
            timeLabel.className = 'semester-timetable-time-range';
            timeLabel.textContent = `. ${timeRange}`;
            heading.appendChild(timeLabel);
          }
          section.appendChild(heading);
          const list = buildCourseTimetableItemList(entries);
          if (!list) {
            const empty = document.createElement('div');
            empty.className = 'semester-timetable-empty';
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
      table.className = 'semester-timetable-table';
      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      const corner = document.createElement('th');
      corner.className = 'semester-timetable-corner';
      corner.textContent = '';
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
        dayCell.className = 'semester-timetable-day';
        dayCell.textContent = day;
        row.appendChild(dayCell);
        slotNames.forEach((slot) => {
          const td = document.createElement('td');
          const entries = grid.get(day)?.get(slot) || [];
          const list = buildCourseTimetableItemList(entries);
          if (!list) {
            const empty = document.createElement('div');
            empty.className = 'semester-timetable-empty';
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
      const ids = Array.from(getNotRunningIds()).sort();
      if (!ids.length) {
        const item = document.createElement('li');
        item.textContent = 'None';
        courseTimetableNotRunningList.appendChild(item);
      } else {
        ids.forEach((id) => {
          const item = document.createElement('li');
          item.className = 'semester-timetable-not-running-item';
          applyDisplayTypeClass(item, id);
          const name = getSubjectName(id);
          const code = document.createElement('span');
          code.className = 'semester-timetable-code';
          code.textContent = id;
          item.appendChild(code);
          if (name) {
            const nameSpan = document.createElement('span');
            nameSpan.className = 'semester-timetable-name';
            nameSpan.textContent = name;
            item.appendChild(nameSpan);
          }
          item.appendChild(buildCourseTimetableTooltip(id));
          courseTimetableNotRunningList.appendChild(item);
        });
      }
    }
  };

  const copyCourseTimetableForWord = () => {
    if (!clipboardAvailable) return;
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const slotOrder = { Morning: 0, Afternoon: 1 };
    const noteValue = getSemesterNote();
    const rows = Object.entries(timetable)
      .filter(([id]) => isRunningThisSemester(id))
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
    table.style.fontFamily = 'Calibri, Arial, sans-serif';
    table.style.fontSize = '11pt';
    table.style.borderCollapse = 'collapse';
    table.style.border = '1px solid #ccc';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    header.forEach((label) => {
      const th = document.createElement('th');
      th.textContent = label;
      th.style.border = '1px solid #ccc';
      th.style.padding = '4px 6px';
      th.style.background = '#efefef';
      th.style.textAlign = 'left';
      th.style.fontFamily = 'Calibri, Arial, sans-serif';
      th.style.fontSize = '11pt';
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
        td.style.fontFamily = 'Calibri, Arial, sans-serif';
        td.style.fontSize = '11pt';
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
    if (!clipboardAvailable) return;
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
    table.style.fontFamily = 'Calibri, Arial, sans-serif';
    table.style.fontSize = '11pt';
    table.style.borderCollapse = 'collapse';
    table.style.border = '1px solid #ccc';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const corner = document.createElement('th');
    corner.textContent = 'Day';
    corner.style.border = '1px solid #ccc';
    corner.style.padding = '6px 8px';
    corner.style.textAlign = 'center';
    corner.style.background = '#f2f2f2';
    corner.style.fontFamily = 'Calibri, Arial, sans-serif';
    corner.style.fontSize = '11pt';
    headRow.appendChild(corner);
    slotNames.forEach((slot) => {
      const th = document.createElement('th');
      th.textContent = getSlotHeading(slot);
      th.style.border = '1px solid #ccc';
      th.style.padding = '6px 8px';
      th.style.textAlign = 'left';
      th.style.background = '#f2f2f2';
      th.style.fontFamily = 'Calibri, Arial, sans-serif';
      th.style.fontSize = '11pt';
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
      dayCell.style.fontFamily = 'Calibri, Arial, sans-serif';
      dayCell.style.fontSize = '11pt';
      row.appendChild(dayCell);
      slotNames.forEach((slot) => {
        const td = document.createElement('td');
        td.style.border = '1px solid #ccc';
        td.style.padding = '6px 8px';
        td.style.verticalAlign = 'top';
        td.style.fontFamily = 'Calibri, Arial, sans-serif';
        td.style.fontSize = '11pt';
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

  const copyCourseTimetableListToClipboard = () => {
    if (!clipboardAvailable) return;
    const { dayNames, slotNames, grid } = buildCourseTimetableGridData();
    const textRows = [];
    const sections = [];
    dayNames.forEach((day) => {
      slotNames.forEach((slot) => {
        const entries = grid.get(day)?.get(slot) || [];
        const timeRange = formatTimeRange(timeSlots[slot] || '');
        const heading = `${day} ${getSlotAbbreviation(slot)}${timeRange ? ` ${timeRange}` : ''}`;
        sections.push({ heading, entries });
        textRows.push(heading);
        if (!entries.length) {
          textRows.push('No subjects running.');
        } else {
          entries.forEach(({ id, data }) => {
            const name = getSubjectName(id);
            const room = data.room ? `Room: ${data.room}` : 'Room: TBA';
            const teacher = data.teacher ? `Lecturer: ${data.teacher}` : 'Lecturer: TBA';
            textRows.push(`${id} ${name} - ${room} \u00b7 ${teacher}`);
          });
        }
        textRows.push('');
      });
    });
    const text = textRows.join('\n').trim();

    const wrapper = document.createElement('div');
    wrapper.style.fontFamily = 'Calibri, Arial, sans-serif';
    wrapper.style.fontSize = '11pt';
    sections.forEach((section) => {
      const block = document.createElement('div');
      block.style.marginBottom = '10px';
      const heading = document.createElement('div');
      heading.textContent = section.heading;
      heading.style.fontWeight = '700';
      heading.style.marginBottom = '4px';
      block.appendChild(heading);
      if (!section.entries.length) {
        const empty = document.createElement('div');
        empty.textContent = 'No subjects running.';
        block.appendChild(empty);
      } else {
        section.entries.forEach(({ id, data }) => {
          const line = document.createElement('div');
          const name = getSubjectName(id);
          const room = data.room ? `Room: ${data.room}` : 'Room: TBA';
          const teacher = data.teacher ? `Lecturer: ${data.teacher}` : 'Lecturer: TBA';
          line.textContent = `${id} ${name} - ${room} \u00b7 ${teacher}`;
          block.appendChild(line);
        });
      }
      wrapper.appendChild(block);
    });
    const html = wrapper.innerHTML;

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
      courseTimetableTeacherCopyButton.hidden = !shouldShowTeacherCopy;
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
    updateCourseTimetableColoursButton();
  };

  const hideCourseTimetableModal = () => {
    if (!courseTimetableModal) return;
    courseTimetableModal.classList.remove('show');
    courseTimetableModal.setAttribute('aria-hidden', 'true');
    if (showCourseTimetableButton) showCourseTimetableButton.setAttribute('aria-expanded', 'false');
    if (showCourseTimetableButton) showCourseTimetableButton.focus();
  };

  const parseManualEntriesFromText = (raw) => {
    const safeRaw = (raw || '').toString();
    const lines = safeRaw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    let extractedEntries = [];
    let useTranscriptParsing = false;
    let canIdentifyCurrent = false;
    const resultListPattern = /([A-Z]{3,4}\d{3})\s+([A-Z0-9/]+)\s+(\d{4})\s+(\d{1,2})\s+(\d{1,2})/g;
    const resultListEntries = [];
    if (safeRaw.includes(',') && resultListPattern.test(safeRaw)) {
      resultListPattern.lastIndex = 0;
      let match = resultListPattern.exec(safeRaw);
      while (match) {
        const rawCode = match[1];
        const grade = match[2];
        const year = parseInt(match[3], 10);
        const month = parseInt(match[4], 10);
        const day = parseInt(match[5], 10);
        const dateToken = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const status = getGradeStatus(grade) || 'pass';
        resultListEntries.push({ rawCode, grade, date: dateToken, status });
        match = resultListPattern.exec(safeRaw);
      }
    }

    if (resultListEntries.length) {
      extractedEntries = resultListEntries;
      useTranscriptParsing = true;
    } else if (lines.length > 1) {
      const gradeHeader = findGradeColumnFromHeader(lines);
      const dateHeader = findDateColumnFromHeader(lines);
      let gradeColIndex = gradeHeader.index;
      let dateColIndex = dateHeader.index;
      let dataLines = lines;

      if (gradeColIndex !== -1 || dateColIndex !== -1) {
        const startRow = Math.max(gradeHeader.startRow, dateHeader.startRow);
        dataLines = lines.slice(startRow);
      }

      const rowData = dataLines
        .map((line) => {
          const upper = line.toUpperCase();
          if (!manualCodeRegex.test(upper)) return null;
          return { line, columns: splitManualColumns(line) };
        })
        .filter(Boolean);

      if (rowData.length >= 2) {
        if (gradeColIndex === -1) gradeColIndex = detectGradeColumnByPattern(rowData);
        if (dateColIndex === -1) dateColIndex = detectDateColumnByPattern(rowData);
      }

      useTranscriptParsing = gradeColIndex !== -1;

      if (useTranscriptParsing) {
        const hasResults = rowData.some(({ columns }) => getGradeStatus(columns[gradeColIndex] || ''));
        const hasDates =
          dateColIndex !== -1 && rowData.some(({ columns }) => extractDateToken(columns[dateColIndex] || ''));
        canIdentifyCurrent = hasResults;
        extractedEntries = rowData
          .map(({ line, columns }) => {
            const upper = line.toUpperCase();
            const match = upper.match(manualCodeRegex);
            if (!match) return null;
            const gradeCell = columns[gradeColIndex] || '';
            const status = getGradeStatus(gradeCell);
            const dateCell = dateColIndex !== -1 ? columns[dateColIndex] || '' : '';
            const dateToken = extractDateToken(dateCell);
            if (!status) {
              if (canIdentifyCurrent) {
                return { rawCode: match[0], grade: '', date: dateToken, status: 'current' };
              }
              return null;
            }
            return {
              rawCode: match[0],
              grade: extractGradeToken(gradeCell),
              date: dateToken,
              status,
            };
          })
          .filter(Boolean);
      }
    }

    if (!useTranscriptParsing) {
      const hasAnyGradeToken = lines.some((line) => !!getGradeStatus(line));
      extractedEntries = lines
        .map((line) => {
          const upper = line.toUpperCase();
          const match = upper.match(manualCodeRegex);
          if (!match) return null;
          const lineStatus = getGradeStatus(line);
          if (hasAnyGradeToken && !lineStatus) {
            return { rawCode: match[0], grade: '', date: '', status: 'current' };
          }
          return { rawCode: match[0], grade: '', date: '', status: 'pass' };
        })
        .filter(Boolean);
    }

    const resolvedSubjectCodes = [];
    const resolvedUseCodes = [];
    const seenSubjects = new Set();
    const seenUses = new Set();
    const metaEntries = new Map();
    const aliasEntries = new Map();
    const currentEntries = new Map();
    const unknownEntries = [];

    extractedEntries.forEach(({ rawCode, grade, date, status }) => {
      const { mapped, original } = resolveLegacyCode(rawCode);
      if (!mapped) return;
      const normalizedGrade = normalizeGradeToken(grade);
      if (status !== 'current' && normalizedGrade && !validUseCodes.has(mapped) && !validSubjectCodes.has(mapped)) {
        unknownEntries.push({ code: original || mapped, result: normalizedGrade, date });
        return;
      }
      if (status === 'current') {
        if (validSubjectCodes.has(mapped) && canIdentifyCurrent) {
          const aliasSet = aliasEntries.get(mapped) || new Set();
          if (original && mapped !== original) aliasSet.add(original);
          if (aliasSet.size) aliasEntries.set(mapped, aliasSet);
          currentEntries.set(mapped, { date: date || '' });
        }
        return;
      }
      if (validUseCodes.has(mapped)) {
        if (!seenUses.has(mapped)) {
          resolvedUseCodes.push(mapped);
          seenUses.add(mapped);
        }
        return;
      }
      if (!validSubjectCodes.has(mapped)) return;
      if (!seenSubjects.has(mapped)) {
        if ((status || 'pass') === 'pass') {
          resolvedSubjectCodes.push(mapped);
          seenSubjects.add(mapped);
        }
      }
      if (original && mapped !== original) {
        const aliasSet = aliasEntries.get(mapped) || new Set();
        aliasSet.add(original);
        aliasEntries.set(mapped, aliasSet);
      }
      if (normalizedGrade || date) {
        const existing = metaEntries.get(mapped) || {};
        metaEntries.set(mapped, {
          result: normalizedGrade || existing.result || '',
          date: date || existing.date || '',
        });
      }
    });

    return {
      resolvedSubjectCodes,
      resolvedUseCodes,
      metaEntries,
      aliasEntries,
      currentEntries,
      unknownEntries,
    };
  };

  const parseCurrentEntriesFromResults = (raw) => {
    const safeRaw = (raw || '').toString();
    const lines = safeRaw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return new Map();

    const gradeHeader = findGradeColumnFromHeader(lines);
    const dateHeader = findDateColumnFromHeader(lines);
    let gradeColIndex = gradeHeader.index;
    let dateColIndex = dateHeader.index;
    let dataLines = lines;
    if (gradeColIndex !== -1 || dateColIndex !== -1) {
      const startRow = Math.max(gradeHeader.startRow, dateHeader.startRow);
      dataLines = lines.slice(startRow);
    }

    const rowData = dataLines
      .map((line) => {
        const upper = line.toUpperCase();
        if (!manualCodeRegex.test(upper)) return null;
        return { line, columns: splitManualColumns(line) };
      })
      .filter(Boolean);

    if (rowData.length >= 2) {
      if (gradeColIndex === -1) gradeColIndex = detectGradeColumnByPattern(rowData);
      if (dateColIndex === -1) dateColIndex = detectDateColumnByPattern(rowData);
    }

    if (gradeColIndex === -1) return new Map();
    const hasResults = rowData.some(({ columns }) => getGradeStatus(columns[gradeColIndex] || ''));
    if (!hasResults) return new Map();

    const currentEntries = new Map();
    rowData.forEach(({ line, columns }) => {
      const upper = line.toUpperCase();
      const match = upper.match(manualCodeRegex);
      if (!match) return;
      const gradeCell = columns[gradeColIndex] || '';
      const status = getGradeStatus(gradeCell);
      if (status) return;
      const dateCell = dateColIndex !== -1 ? columns[dateColIndex] || '' : '';
      const dateToken = extractDateToken(dateCell);
      const { mapped } = resolveLegacyCode(match[0]);
      if (!mapped) return;
      currentEntries.set(mapped, { date: dateToken || '' });
    });
    return currentEntries;
  };

  const applyCodes = () => {
    if (!codeInput) return;
    const raw = codeInput.value || '';
    manualEntryCurrent.clear();
    workbookCurrent.clear();
    manualEntryUnknown.length = 0;
    const parsed = parseManualEntriesFromText(raw);
    parsed.aliasEntries.forEach((aliases, mapped) => {
      aliases.forEach((original) => recordManualAlias(mapped, original));
    });
    parsed.currentEntries.forEach((meta, mapped) => manualEntryCurrent.set(mapped, meta));
    parsed.unknownEntries.forEach((entry) => addUnknownEntry(entry));
    parsed.metaEntries.forEach((meta, mapped) => {
      const existing = manualEntryMeta.get(mapped) || {};
      manualEntryMeta.set(mapped, {
        result: meta.result || existing.result || '',
        date: meta.date || existing.date || '',
      });
    });

    const resolvedSubjectCodes = parsed.resolvedSubjectCodes;
    const resolvedUseCodes = parsed.resolvedUseCodes;

    const electivePlaceholders = getElectivePlaceholders();
    let electiveIndex = 0;

    resolvedUseCodes.forEach((code) => {
      if (electiveIndex < electivePlaceholders.length) {
        electivePlaceholderState[electiveIndex] = code;
        electiveIndex += 1;
      }
    });

    resolvedSubjectCodes.forEach((code) => {
      const cell = subjects.find((c) => c.dataset.subject === code);
      if (!cell) return;
      subjectState.set(code, { completed: true, toggled: false });
    });

    codeInput.value = '';
    hideCodeModal();
    electivePlaceholderState = electivePlaceholderState.map((val, idx) => resolvedUseCodes[idx] || '');
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
    const notThisSem = !isRunningThisSemester(id);
    if (!completedMode && notThisSem) return;
    if (areElectivesFull() && !placeholder && isElectivesGridCell(cell)) {
      const st = subjectState.get(id);
      if (!(st?.completed || st?.toggled)) return;
    }
    const placeholders = placeholder ? getElectivePlaceholders() : [];
    const placeholderIdx = placeholder ? placeholders.indexOf(cell) : -1;
    if (!completedMode && placeholder && placeholderIdx >= 0 && !electiveBitState[placeholderIdx]) {
      return;
    }
    if (placeholder && placeholderIdx >= 0) {
      const bitCode = electiveBitState[placeholderIdx];
      if (bitCode) {
        subjectState.set(bitCode, { completed: false, toggled: false });
        manualEntryMeta.delete(bitCode);
        manualEntryAliases.delete(bitCode);
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
      if (!nowCompleted) {
        manualEntryMeta.delete(id);
        manualEntryAliases.delete(id);
      }
      if (nowCompleted) {
        cell.classList.remove('satisfied');
        cell.classList.remove('can-select-now');
        cell.setAttribute('aria-pressed', 'false');
      }
    } else {
      // In selection mode, do not allow adding USE credits to empty placeholders.
      if (placeholder) return;
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
      cell.classList.remove('show-tooltip', 'hover-active');
      cell.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active) {
        cell.classList.remove('satisfied');
        cell.classList.remove('can-select-now');
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
    if (passForEnrolmentsToggle) {
      passForEnrolmentsToggle.addEventListener('change', () => {
        passForEnrolmentsEnabled = passForEnrolmentsToggle.checked;
        applyPassForEnrolmentsState();
      });
    }
    const triggerFlash = (el) => {
      if (!el) return;
      el.classList.remove('copy-flash');
      void el.offsetWidth;
      el.classList.add('copy-flash');
    };
    const buildStudentMailto = (emails, firstName) => {
      const list = (emails || []).map((email) => email.trim()).filter(Boolean);
      if (!list.length) return '';
      const subject = encodeURIComponent('Student Declaration');
      const body = encodeURIComponent(`Hello ${firstName || ''}`);
      return `mailto:${list.join(',')}?subject=${subject}&body=${body}`;
    };
    const openStudentEmail = (emails, firstName) => {
      const mailto = buildStudentMailto(emails, firstName);
      if (!mailto) return;
      window.location.href = mailto;
    };
    if (studentDataPreview) {
      studentDataPreview.addEventListener('dblclick', (event) => {
        const emailTarget = event.target?.closest?.('.student-email-link');
        if (emailTarget) {
          event.preventDefault();
          const email = emailTarget.getAttribute('data-email') || '';
          const firstName = emailTarget.getAttribute('data-first-name') || '';
          openStudentEmail([email], firstName);
          triggerFlash(emailTarget);
          return;
        }
        const target = event.target?.closest?.('.student-summary-id');
        if (!target) return;
        const text = target.getAttribute('data-copy') || '';
        if (!text || !clipboardAvailable) return;
        navigator.clipboard.writeText(text).then(() => {
          triggerFlash(target);
        }).catch(() => {});
      });
      studentDataPreview.addEventListener('click', (event) => {
        const emailTarget = event.target?.closest?.('.student-email-link');
        if (emailTarget) {
          event.preventDefault();
          return;
        }
        const emailAllTarget = event.target?.closest?.('.student-email-all');
        if (!emailAllTarget) return;
        event.preventDefault();
        const emails = (emailAllTarget.getAttribute('data-emails') || '')
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean);
        const firstName = emailAllTarget.getAttribute('data-first-name') || '';
        openStudentEmail(emails, firstName);
        triggerFlash(emailAllTarget);
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
    if (courseTimetableIconButton) courseTimetableIconButton.addEventListener('click', showCourseTimetableModal);
    if (closeCourseTimetable) closeCourseTimetable.addEventListener('click', hideCourseTimetableModal);
    if (closeCourseTimetableCta) closeCourseTimetableCta.addEventListener('click', hideCourseTimetableModal);
  if (courseTimetableListButton) {
    courseTimetableListButton.addEventListener('click', () => setCourseTimetableView('list'));
  }
  if (courseTimetableGridButton) {
    courseTimetableGridButton.addEventListener('click', () => setCourseTimetableView('grid'));
  }
  if (courseTimetableColoursButton) {
    courseTimetableColoursButton.addEventListener('click', () => {
      courseTimetableColoursOn = !courseTimetableColoursOn;
      updateCourseTimetableColoursButton();
    });
    updateCourseTimetableColoursButton();
  }
  if (copyCourseTimetableButton) {
    copyCourseTimetableButton.addEventListener('click', () => {
      flashCopyButton(copyCourseTimetableButton);
      if (courseTimetableView === 'list') {
        copyCourseTimetableListToClipboard();
      } else {
        copyCourseTimetableToClipboard();
      }
    });
  }
    if (courseTimetableTeacherCopyButton) {
      courseTimetableTeacherCopyButton.addEventListener('click', () => {
        flashCopyButton(courseTimetableTeacherCopyButton);
        copyCourseTimetableForWord();
      });
      courseTimetableTeacherCopyButton.hidden = !shouldShowTeacherCopy;
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

    if (id && isSemesterRestricted(id)) {
      ensureSemesterBadgeUI(cell);
    }
    if (id && !isRunningThisSemester(id)) {
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
  const historySortState = { key: 'date', direction: 'asc' };

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
    syncSubjectTableActions(timetableTable);
  };

  const syncSubjectTableActions = (tableEl) => {
    if (!tableEl) return;
    requestAnimationFrame(() => {
      const modal = tableEl.closest('.modal');
      if (!modal) return;
      const actions = modal.querySelector('.subject-table-actions');
      if (!actions) return;
      const headerRow = tableEl.querySelector('thead tr:last-child') || tableEl.querySelector('thead tr');
      const headerCell = headerRow ? headerRow.querySelector('th') : null;
      if (!headerCell) return;
      const width = headerCell.getBoundingClientRect().width;
      if (!width || width < 1) return;
      actions.style.setProperty('--code-col-width', `${Math.ceil(width)}px`);
    });
  };

  function renderStudentPreview(content, asJson = false) {
    if (!studentDataPreview) return;
    studentDataPreview.innerHTML = '';
    if (asJson) {
      const pre = document.createElement('pre');
      pre.textContent = content;
      studentDataPreview.appendChild(pre);
      return;
    }
    studentDataPreview.textContent = content;
  };

  const renderStudentPreviewHtml = (content) => {
    if (!studentDataPreview) return;
    studentDataPreview.innerHTML = content;
  };

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const getSharePointParentInfo = (value) => {
    const raw = (value || '').toString().trim();
    if (!raw) return null;
    const clean = raw.split('#')[0].split('?')[0].replace(/\/$/, '');
    const parts = clean.split('/');
    if (parts.length < 2) {
      return { parentName: raw, studentUrl: raw };
    }
    const parentName = parts[parts.length - 2] || raw;
    return { parentName, studentUrl: clean };
  };

  const getTroubleCountryMatch = (nationalityValue, courseInfo) => {
    const nationality = (nationalityValue || '').toString().trim();
    if (!nationality || !courseInfo?.Countries_facing_troubles) return null;
    const list = courseInfo.Countries_facing_troubles
      .toString()
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const match = list.find((country) => country.toLowerCase() === nationality.toLowerCase());
    return match || null;
  };

  const parseExcelSerialDate = (value) => {
    if (!Number.isFinite(value)) return null;
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
  };

  const toDateValue = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return parseExcelSerialDate(value);
    }
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && String(value).trim() !== '') {
      return parseExcelSerialDate(asNumber);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDisplayDate = (value) => {
    const date = toDateValue(value);
    if (!date) return String(value ?? '').trim();
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const parseIntakeMonth = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) {
      const date = parseExcelSerialDate(value);
      if (!date) return null;
      return date.getUTCMonth() + 1;
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.getMonth() + 1;
    const match = String(value).match(/(19|20)\d{2}[/-](\d{1,2})/);
    if (match) return parseInt(match[2], 10);
    return null;
  };

  const formatStudentSummary = (record) => {
    if (!record) return '';
    const lines = [];
    const studentId = (record.Student_IDs_Unique || '').toString().trim();
    const family = (record.Family_Name || '').toString().trim();
    const given = (record.Given_Name || '').toString().trim();
    const firstName = given.split(/\s+/).filter(Boolean)[0] || '';
    const mpEmail = (record.Institute_Email || '').toString().trim();
    const primaryEmail = (record.Primary_Email || '').toString().trim();
    const acceptedOffered = (record.Accepted_Offered || '').toString().trim();
    const notes = (record.International_Office_Notes || '').toString().trim();
    const intakeStart = (record.Intake_Start_Date || '').toString().trim();
    const nationality = (record.Nationality || '').toString().trim();
    const visaType = (record.Visa_Type || '').toString().trim();
    const suspended = (record.Suspended || '').toString().trim();
    const suspensionReason = (record.Suspended_Names || '').toString().trim();
    const aprApp = (record.APR_APP || '').toString().trim();
    const aprAppCondition = (record.APR_APP_Condition || '').toString().trim();
    const aprAppAttended = (record.APR_APP_Attended || '').toString().trim();
    const sharePoint = (record.SharePoint_StudentForms || '').toString().trim();
    const crtLocation = (record.CRT_Location || '').toString().trim();
    const suppsAndHolds = (record.SuppsAndHolds || '').toString().trim();
    const passedSubjects = (record.Passed_subjects || '').toString().trim();
    const resultsList = (record.Results_List || '').toString().trim();
    const hasHistory = !!(passedSubjects || resultsList);
    const isInternational = !!(
      record.In_AllInternationals ||
      record.In_InternationalsAccepted ||
      record.In_AllInternationals === 'Yes' ||
      record.In_InternationalsAccepted === 'Yes'
    );

    if (studentId || family || given) {
      const name = [family, given].filter(Boolean).join(', ');
      const display = [studentId, name].filter(Boolean).join(' ');
      lines.push(
        `<div class="student-summary-id" data-copy="${escapeHtml(display)}">${escapeHtml(display)}</div>`
      );
    }
    if (mpEmail || primaryEmail) {
      const emailList = [mpEmail, primaryEmail].filter(Boolean);
      const emailLinks = emailList
        .map(
          (email) =>
            `<a href="#" class="student-email-link" data-email="${escapeHtml(email)}" data-first-name="${escapeHtml(firstName)}">${escapeHtml(email)}</a>`
        )
        .join(' ');
      const allEmails = emailList.join(',');
      const multiIcon =
        emailList.length > 1
          ? `<button type="button" class="student-email-all" data-emails="${escapeHtml(allEmails)}" data-first-name="${escapeHtml(firstName)}" aria-label="Email student">@</button>`
          : '';
      lines.push(`<div class="student-email-row">${emailLinks}${multiIcon ? ` ${multiIcon}` : ''}</div>`);
    }
    if (acceptedOffered && !hasHistory) {
      const isOffered = acceptedOffered.toLowerCase() === 'offered';
      const text = isOffered ? `${acceptedOffered} only` : acceptedOffered;
      const line = isOffered
        ? `<span class="accepted-offered is-offered">${escapeHtml(text)}</span>`
        : escapeHtml(text);
      lines.push(line);
    }
    if (suppsAndHolds) lines.push('<strong>Hold on subject(s)</strong>');
    if (notes) lines.push(escapeHtml(notes));
    if (intakeStart && !hasHistory) {
      lines.push(`Intake Start: ${escapeHtml(formatDisplayDate(intakeStart))}`);
    }
    if (isInternational) {
      const details = [
        countryHittingTroubles && nationality ? `Nationality: ${nationality}` : '',
        visaType ? `Visa: ${visaType}` : '',
      ]
        .filter(Boolean)
        .join(', ');
      lines.push(escapeHtml(details ? `International - ${details}` : 'International'));
    } else {
      lines.push('Domestic');
    }
    if (countryHittingTroubles) {
      lines.push(`<span class="trouble-country">${escapeHtml(countryHittingTroubles)}</span>`);
    }
    if (suspended) {
      const cleanReason = suspensionReason.replace(/\u2014/g, '\u2013');
      const reason = cleanReason ? ` \u2013 ${cleanReason}` : '';
      lines.push(escapeHtml(`Suspended${reason}`));
    }
    if (aprApp) {
      const condition = aprAppCondition || '';
      const hasExcluded = /excluded/i.test(condition);
      const conditionHtml = hasExcluded
        ? `<span class="apr-excluded">${escapeHtml(condition)}</span>`
        : escapeHtml(condition);
      let attendanceLabel = '';
      if (aprAppAttended) {
        const attendedValue = aprAppAttended.toLowerCase();
        if (attendedValue.includes('no') || attendedValue.includes('not')) {
          attendanceLabel = "Didn't attend";
        } else {
          attendanceLabel = 'Did attend';
        }
      }
      const detailParts = [conditionHtml, attendanceLabel].filter(Boolean);
      const detailText = detailParts.join('. ');
      lines.push(detailText ? `${escapeHtml(aprApp)} - ${detailText}` : escapeHtml(aprApp));
    }
    const sharePointInfo = getSharePointParentInfo(sharePoint);
    if (sharePointInfo) {
      lines.push(
        `On SharePoint: <a href="${escapeHtml(sharePointInfo.studentUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
          sharePointInfo.parentName
        )}</a>`
      );
    }
    if (crtLocation) {
      lines.push(
        `<a href="${escapeHtml(crtLocation)}" target="_blank" rel="noopener noreferrer">CRT form</a>`
      );
    }
    return lines.filter(Boolean).map((line) => (line.startsWith('<div') ? line : `<div>${line}</div>`)).join('');
  };

  const setStudentLookupVisible = (visible) => {
    if (!studentIdSection) return;
    studentIdSection.style.display = visible ? '' : 'none';
    studentIdSection.classList.toggle('hidden-initial', !visible);
  };

  const setStudentPreviewVisible = (visible) => {
    if (!studentDataPreview) return;
    studentDataPreview.classList.toggle('is-visible', visible);
  };

  function applyStudentRecord(record) {
    if (!record) return;
    resetStudentSelections();
    staffWorkbookState.setStudentRecord(record);
    const courseInfo = staffWorkbookState.getCourseInfo();

    const passedRaw = record.Passed_subjects || '';
    const resultsRaw = record.Results_List || '';
    const passedParsed = parseManualEntriesFromText(passedRaw);
    const resultsParsed = parseManualEntriesFromText(resultsRaw);
    const resultsCurrent = parseCurrentEntriesFromResults(resultsRaw);

    resultsParsed.aliasEntries.forEach((aliases, mapped) => {
      aliases.forEach((original) => recordManualAlias(mapped, original));
    });
    workbookCurrent.clear();
    resultsCurrent.forEach((meta, mapped) => workbookCurrent.set(mapped, meta));
    resultsParsed.unknownEntries.forEach((entry) => addUnknownEntry(entry));
    resultsParsed.metaEntries.forEach((meta, mapped) => {
      manualEntryMeta.set(mapped, {
        result: meta.result || '',
        date: meta.date || '',
      });
    });
    resultsParsed.resolvedSubjectCodes.forEach((code) => {
      if (!manualEntryMeta.has(code)) {
        manualEntryMeta.set(code, { result: '', date: '' });
      }
    });

    const resolvedUseCodes = passedParsed.resolvedUseCodes;
    electivePlaceholderState = electivePlaceholderState.map((_, idx) => resolvedUseCodes[idx] || '');

    passedParsed.resolvedSubjectCodes.forEach((code) => {
      const cell = subjects.find((c) => c.dataset.subject === code);
      if (!cell) return;
      subjectState.set(code, { completed: true, toggled: false });
    });

    workbookCurrent.forEach((meta, code) => {
      if (!validSubjectCodes.has(code)) return;
      if (subjectState.get(code)?.completed) {
        subjectState.set(code, { completed: false, toggled: false });
      }
      if (!manualEntryMeta.has(code)) {
        manualEntryMeta.set(code, { result: '', date: meta?.date || '' });
      }
    });

    const acceptedOffered = (record.Accepted_Offered || '').toString().trim();
    const aprApp = (record.APR_APP || '').toString().trim();
    const aprAppCondition = (record.APR_APP_Condition || '').toString().trim();
    const aprAppAttended = (record.APR_APP_Attended || '').toString().trim();
    const intakeStart = (record.Intake_Start_Date || '').toString().trim();
    const intakeMonth = parseIntakeMonth(intakeStart);
    const notes = (record.International_Office_Notes || '').toString().trim();
    const nationality = (record.Nationality || '').toString().trim();
    const suppsAndHolds = (record.SuppsAndHolds || '').toString().trim();
    countryHittingTroubles = getTroubleCountryMatch(nationality, courseInfo);

    if (acceptedOffered) {
      const isOffered = acceptedOffered.toLowerCase() === 'offered';
      if (isOffered) {
        acceptedOfferedError = {
          title: 'Accepted/Offered',
          html: `<p><strong class="alert-inline-title alert-title-error">Accepted/Offered</strong> <span class="alert-inline-text">${escapeHtml(
            acceptedOffered
          )} only.</span></p>`,
        };
      } else {
        acceptedOfferedError = null;
      }
    } else {
      acceptedOfferedError = null;
    }

    if (intakeStart) {
      const intakeDate = toDateValue(intakeStart);
      const now = new Date();
      const threeMonthsAhead = new Date(now.getTime());
      threeMonthsAhead.setMonth(now.getMonth() + 3);
      if (intakeDate && intakeDate > threeMonthsAhead) {
        const displayIntake = formatDisplayDate(intakeStart) || intakeStart;
        intakeStartError = {
          title: 'Intake Start',
          html: `<p><strong class="alert-inline-title alert-title-error">Intake Start</strong> <span class="alert-inline-text">${escapeHtml(
            displayIntake
          )}</span></p>`,
        };
      } else {
        intakeStartError = null;
      }
    } else {
      intakeStartError = null;
    }

    if (aprApp) {
      const detailParts = [];
      if (aprAppCondition) detailParts.push(`Condition: ${escapeHtml(aprAppCondition)}`);
      if (aprAppAttended) detailParts.push(`Attended: ${escapeHtml(aprAppAttended)}`);
      const detailHtml = detailParts.length ? `<div class="tight-lead">${detailParts.join('<br>')}</div>` : '';
      aprAppError = {
        title: `APR/APP: ${aprApp}`,
        html: `<p><strong class="alert-inline-title alert-title-error">APR/APP: ${escapeHtml(
          aprApp
        )}</strong>${detailHtml}</p>`,
      };
    } else {
      aprAppError = null;
    }
    infoNotes = notes || null;
    const infoMessages = [];
    if (infoNotes) {
      infoMessages.push({
        title: 'International Office Notes',
        html: `<p><strong class="alert-inline-title alert-title-info">International Office Notes</strong> <span class="alert-inline-text">${escapeHtml(
          infoNotes
        )}</span></p>`,
      });
    }
    if (suppsAndHolds) {
      const items = suppsAndHolds
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => escapeHtml(entry))
        .join('<br>');
      infoMessages.push({
        title: 'Supps and/or Holds',
        html: `<p><strong class="alert-inline-title alert-title-info">Supps and/or Holds</strong> <span class="alert-inline-text">${items}</span></p>`,
      });
    }
    if (countryHittingTroubles) {
      infoMessages.push({
        title: 'Country Alert',
        html: `<p><strong class="alert-inline-title alert-title-info">Country Alert</strong> <span class="alert-inline-text">Student comes from ${escapeHtml(
          countryHittingTroubles
        )} - a country currently facing troubles.</span></p>`,
      });
    }
    setAlertMessages('info', infoMessages);

    const bestMajor = getBestMajorSelection();
    if (bestMajor) setMajorDropdownSelection(bestMajor);

    applyPassForEnrolmentsState();

    applySubjectStateToCells();
    rebuildElectiveBitStateFromState();
    conditionalRecompute({ force: true, usePlanned: false });
    updateResetState();
    const assignments = buildElectiveAssignments();
    setElectiveCredits(assignments, true);
    updateElectiveWarning();
    updateSelectedList();
    loadedStudentSnapshot = captureStudentSnapshot();
  };

  const toProperCase = (value) =>
    String(value || '')
      .toLowerCase()
      .split(/(\s|-|')/)
      .map((part) => (/[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part))
      .join('');

  const formatStudentSearchLabel = (record, includeEmail = false) => {
    if (!record) return '';
    const id = normalizeStudentId(record.Student_IDs_Unique || '');
    const given = toProperCase(record.Given_Name || '');
    const family = String(record.Family_Name || '').toUpperCase();
    const primaryEmail = String(record.Primary_Email || '').toLowerCase();
    const parts = [id, given, family].filter(Boolean);
    if (includeEmail && primaryEmail) parts.push(primaryEmail);
    return parts.join(' ');
  };

  const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const clearStudentSearchDropdown = () => {
    if (!studentSearchDropdown) return;
    studentSearchDropdown.innerHTML = '';
    studentSearchDropdown.hidden = true;
  };

  const renderStudentSearchDropdown = (records, includeEmail = false) => {
    if (!studentSearchDropdown) return;
    studentSearchDropdown.innerHTML = '';
    if (!records || !records.length) {
      studentSearchDropdown.hidden = true;
      return;
    }
    studentSearchDropdown.dataset.activeIndex = '0';
    records.forEach((record) => {
      const option = document.createElement('div');
      option.className = 'student-search-option';
      option.textContent = formatStudentSearchLabel(record, includeEmail);
      option.setAttribute('data-student-id', normalizeStudentId(record.Student_IDs_Unique || ''));
      option.tabIndex = 0;
      studentSearchDropdown.appendChild(option);
    });
    const firstOption = studentSearchDropdown.querySelector('.student-search-option');
    if (firstOption) firstOption.classList.add('is-active');
    studentSearchDropdown.hidden = false;
  };

  const moveStudentSearchActive = (direction) => {
    if (!studentSearchDropdown || studentSearchDropdown.hidden) return;
    const options = Array.from(studentSearchDropdown.querySelectorAll('.student-search-option'));
    if (!options.length) return;
    const currentIndex = Number(studentSearchDropdown.dataset.activeIndex || '0');
    const nextIndex = (currentIndex + direction + options.length) % options.length;
    options.forEach((option, idx) => option.classList.toggle('is-active', idx === nextIndex));
    studentSearchDropdown.dataset.activeIndex = String(nextIndex);
    options[nextIndex].scrollIntoView({ block: 'nearest' });
  };

  const selectActiveStudentSearch = () => {
    if (!studentSearchDropdown || studentSearchDropdown.hidden) return;
    const options = Array.from(studentSearchDropdown.querySelectorAll('.student-search-option'));
    if (!options.length) return;
    const currentIndex = Number(studentSearchDropdown.dataset.activeIndex || '0');
    const option = options[currentIndex] || options[0];
    const id = option.getAttribute('data-student-id') || '';
    const record = studentRecords.find((row) => normalizeStudentId(row.Student_IDs_Unique) === id);
    if (record) applyStudentSearchSelection(record);
  };
  const applyStudentSearchSelection = (record) => {
    if (!record) return;
    const id = normalizeStudentId(record.Student_IDs_Unique || '');
    extractedStudentId = id;
    if (studentIdInput && id) studentIdInput.value = id;
    clearStudentSearchDropdown();
    updateStudentPreview();
  };

  function updateStudentPreview() {
    if (!studentDataPreview) return;
    if (!studentRecords.length) {
      renderStudentPreview('');
      setStudentLookupVisible(false);
      setStudentPreviewVisible(false);
      if (studentIdInput) studentIdInput.classList.remove('student-match-found');
      clearStudentSearchDropdown();
      return;
    }
    setStudentLookupVisible(true);
    if (!extractedStudentId) {
      renderStudentPreview('');
      setStudentPreviewVisible(false);
      if (studentIdInput) studentIdInput.classList.remove('student-match-found');
      return;
    }
    const matchId = normalizeStudentId(extractedStudentId);
    const record = studentRecords.find((row) => normalizeStudentId(row.Student_IDs_Unique) === matchId);
    if (!record) {
      renderStudentPreview('');
      setStudentPreviewVisible(false);
      if (studentIdInput) studentIdInput.classList.remove('student-match-found');
      return;
    }
    setStudentPreviewVisible(true);
    if (activeStudentId !== matchId) {
      activeStudentId = matchId;
      applyStudentRecord(record);
    }
    if (studentIdInput) studentIdInput.classList.add('student-match-found');
    renderStudentPreviewHtml(formatStudentSummary(record));
  };

  function handleStudentIdInput() {
    if (!studentIdInput) return;
    studentIdInput.classList.remove('student-match-found');
    const rawValue = studentIdInput.value || '';
    const trimmedValue = rawValue.trim();
    const idMatch = studentIdPattern.exec(trimmedValue);
    if (idMatch) {
      extractedStudentId = idMatch[1];
      studentIdInput.value = idMatch[1];
      clearStudentSearchDropdown();
      updateStudentPreview();
      return;
    }

    extractedStudentId = '';
    const sPrefixMatch = trimmedValue.match(/^[sS](\d{1,7})$/);
    const numericQuery = sPrefixMatch ? sPrefixMatch[1] : trimmedValue.match(/^\d{1,7}$/)?.[0];
    if (numericQuery && studentRecords.length) {
      let matches = studentRecords.filter((record) =>
        normalizeStudentId(record.Student_IDs_Unique || '').startsWith(numericQuery)
      );
      if (!matches.length) {
        matches = studentRecords.filter((record) =>
          normalizeStudentId(record.Student_IDs_Unique || '').includes(numericQuery)
        );
      }
      if (matches.length === 1) {
        applyStudentSearchSelection(matches[0]);
        return;
      }
      renderStudentSearchDropdown(matches);
      updateStudentPreview();
      return;
    }

    const valueWithoutLeadingS = sPrefixMatch ? trimmedValue.replace(/^[sS]\s*/, '') : trimmedValue;
    const searchValue = valueWithoutLeadingS.trim();
    const hasEmailQuery = searchValue.includes('@');
    if ((searchValue.length < 2 && !hasEmailQuery) || !studentRecords.length) {
      clearStudentSearchDropdown();
      updateStudentPreview();
      return;
    }

    const isWordSearch = /[A-Za-z][\s.]$/.test(rawValue);
    const nameQuery = searchValue.replace(/[.\s]+$/g, '');
    const lowerQuery = nameQuery.toLowerCase();
    const emailQuery = searchValue.toLowerCase();
    const includeEmailInDropdown = hasEmailQuery;
    const seen = new Set();
    const results = [];
    const getNameWords = (value) =>
      String(value || '')
        .toLowerCase()
        .split(/[^a-z]+/g)
        .filter(Boolean);

    studentRecords.forEach((record) => {
      const id = normalizeStudentId(record.Student_IDs_Unique || '');
      if (!id || seen.has(id)) return;
      const given = String(record.Given_Name || '');
      const family = String(record.Family_Name || '');
      const fullName = String(record.Full_Name || '');
      const email = String(record.Primary_Email || '');
      const secondaryEmail = String(record.Secondary_Email || '');
      let matched = false;

      if (!isWordSearch || emailQuery.includes('@')) {
        const emailMatches = (val) =>
          val && val.toLowerCase().startsWith(emailQuery);
        if (emailMatches(email) || emailMatches(secondaryEmail)) {
          matched = true;
        }
      }
      if (!matched && nameQuery.length >= 2) {
        if (isWordSearch) {
          const words = [
            ...getNameWords(given),
            ...getNameWords(family),
            ...getNameWords(fullName),
          ];
          matched = words.includes(lowerQuery);
        } else {
          const fullLower = fullName.toLowerCase();
          matched =
            given.toLowerCase().startsWith(lowerQuery) ||
            family.toLowerCase().startsWith(lowerQuery) ||
            (fullLower && fullLower.startsWith(lowerQuery)) ||
            getNameWords(fullName).some((word) => word.startsWith(lowerQuery));
        }
      }

      if (matched) {
        seen.add(id);
        results.push(record);
      }
    });

    if (results.length === 1) {
      applyStudentSearchSelection(results[0]);
      return;
    }

    renderStudentSearchDropdown(results, includeEmailInDropdown);
    updateStudentPreview();
  };

  function stripRangeRef(ref) {
    return ref.replace(/\$|'/g, '');
  }

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
  };

  function buildStudentRecordsFromWorkbook(workbook) {
    if (!workbook) return [];
    const sheetName = 'Students';
    const sheet = workbook.Sheets?.[sheetName];
    if (!sheet) return [];
      const names = workbook.Workbook?.Names || [];
      let columnMap = {};
      names.forEach((nameEntry) => {
        if (!nameEntry?.Name || !STUDENT_COLUMNS.includes(nameEntry.Name) || !nameEntry.Ref) return;
        const cleanedRef = stripRangeRef(nameEntry.Ref);
        if (!cleanedRef.includes(`${sheetName}!`)) return;
        columnMap[nameEntry.Name] = getRangeValues(sheet, nameEntry.Ref, nameEntry.Name);
      });
      let rowCount = Math.max(0, ...Object.values(columnMap).map((values) => values.length), 0);
      if (rowCount <= 1) {
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        if (rows.length > 1) {
          const columnKeyMap = STUDENT_COLUMNS.reduce((acc, col) => {
            acc[normalizeHeader(col)] = col;
            return acc;
          }, {});
          let bestHeaderIndex = -1;
          let bestHeaderMatches = 0;
          const scanLimit = Math.min(rows.length, 5);
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
            const headerRow = rows[bestHeaderIndex] || [];
            const colIndexMap = {};
            headerRow.forEach((cell, idx) => {
              const key = columnKeyMap[normalizeHeader(cell)];
              if (key && colIndexMap[key] === undefined) colIndexMap[key] = idx;
            });
            columnMap = {};
            STUDENT_COLUMNS.forEach((columnName) => {
              columnMap[columnName] = [];
            });
            for (let rowIndex = bestHeaderIndex + 1; rowIndex < rows.length; rowIndex += 1) {
              const row = rows[rowIndex] || [];
              STUDENT_COLUMNS.forEach((columnName) => {
                const idx = colIndexMap[columnName];
                const cellValue = idx === undefined ? '' : row[idx];
                columnMap[columnName].push(
                  typeof cellValue === 'string' ? cellValue.trim() : cellValue ?? ''
                );
              });
            }
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
  };

  function buildCourseInfoFromWorkbook(workbook) {
    if (!workbook) return null;
    const sheetName = 'Info';
    const sheet = workbook.Sheets?.[sheetName];
    if (!sheet) return null;
    const names = workbook.Workbook?.Names || [];
    const info = {};
    names.forEach((nameEntry) => {
      if (!nameEntry?.Name || !COURSE_INFO_RANGES.includes(nameEntry.Name) || !nameEntry.Ref) return;
      const cleanedRef = stripRangeRef(nameEntry.Ref);
      if (!cleanedRef.includes(`${sheetName}!`)) return;
      const values = getRangeValues(sheet, nameEntry.Ref, nameEntry.Name);
      const value = values.find((val) => val !== '') ?? '';
      info[nameEntry.Name] = value;
    });
    return info;
  };

  function loadWorkbookFromFile(file) {
    if (!file) {
      if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(false);
      return;
    }
    if (typeof XLSX === 'undefined') {
      renderStudentPreview('Workbook library is not available in this environment.');
      if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(false);
      return;
    }
    if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(true);
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
          const workbook = XLSX.read(event.target.result, { type: 'array' });
          const records = buildStudentRecordsFromWorkbook(workbook);
          const courseInfo = buildCourseInfoFromWorkbook(workbook);
          studentRecords = records;
          activeStudentId = '';
          staffWorkbookState.setStudentRecord(null);
          staffWorkbookState.setCourseInfo(courseInfo);
          loadedStudentSnapshot = null;
          clearStudentSearchDropdown();
          const countLine = `${records.length} students listed`;
          if (lastDroppedFileInfo) {
            renderDropZoneStatus([
              lastDroppedFileInfo.fileName,
              lastDroppedFileInfo.savedLine,
              countLine,
            ]);
          } else if (dropZoneTextEl) {
            renderDropZoneStatus([countLine]);
          }
          updateStudentPreview();
          if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(false);
      } catch (error) {
        renderStudentPreview(`Workbook parse error: ${error.message}`);
        if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(false);
      }
    };
    reader.onerror = () => {
      renderStudentPreview('Failed to read the workbook file.');
      if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const renderSubjectTable = (tableEl, rows, emptyMessage = 'No subjects to show.') => {
    if (!tableEl) return;
    const tbody = tableEl.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const items = rows || [];
    const isHistoryTable = tableEl.id === 'history-table';
    const isRemainingTable = tableEl.id === 'remaining-table';
    const columns = isHistoryTable ? ['code', 'name', 'result', 'date', 'stream'] : isRemainingTable ? ['code', 'name', 'stream'] : ['code', 'name', 'stream'];
    if (!items.length) {
      const row = document.createElement('tr');
      const td = document.createElement('td');
      td.textContent = emptyMessage;
      td.colSpan = columns.length;
      row.appendChild(td);
      tbody.appendChild(row);
      syncSubjectTableActions(tableEl);
      return;
    }
    items.forEach(({ cell, id, result = '', date = '', isFail = false, displayCode, displayName, displayStream }) => {
      const row = document.createElement('tr');
      row.dataset.subject = id;
      applyDisplayTypeClass(row, cell || id);
      if (isHistoryTable && (isFail || isFailGradeToken(result))) {
        row.classList.add('history-fail');
      }
      const name = displayName ?? getSubjectName(id);
      const stream = displayStream ?? buildStreamLabel(id);
      const resolvedCode = isHistoryTable ? (displayCode || formatHistoryCode(id)) : id;
      const valueMap = {
        code: resolvedCode,
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
    syncSubjectTableActions(tableEl);
  };

  const getHistorySortValue = (row, key) => {
    const id = row?.id || '';
    if (key === 'code') return row?.sortCode || row?.displayCode || id;
    if (key === 'result') return row?.result || '';
    if (key === 'date') return getHistoryDateSortValue(row?.date || '');
    if (key === 'stream') return row?.displayStream || buildStreamLabel(id);
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
    renderCurrentEnrolments();
    updateHistorySortButtons();
  };

  const renderRemainingModal = () => {
    const rows = getRemainingRows();
    renderSubjectTable(remainingTable, rows, 'No remaining core or major subjects to show.');
    if (remainingSummary) {
      const majorName = getMajorDisplayName();
      const remainingElectives = getRemainingElectiveCount();
      remainingSummary.innerHTML = `<p>These are the Core and ${majorName} Major subjects that you have not yet completed.</p><p>You also have ${remainingElectives} Elective${remainingElectives === 1 ? '' : 's'} to complete.</p>`;
    }
    if (remainingElectivesSection && remainingElectivesTable) {
      const electiveRows = getRemainingElectiveRows();
      if (electiveRows.length) {
        renderSubjectTable(remainingElectivesTable, electiveRows, 'No elective subjects to show.');
        remainingElectivesSection.hidden = false;
      } else {
        remainingElectivesSection.hidden = true;
        if (remainingElectivesTable) {
          const tbody = remainingElectivesTable.querySelector('tbody');
          if (tbody) tbody.innerHTML = '';
        }
      }
    }
  };

  let courseMapBuilt = false;
  const courseMapCells = new Map();
  const courseMapSharedPlaceholders = [];
  const courseMapMajorPlaceholders = [];
  const courseMapElectivePlaceholders = [];
  let courseMapSharedRefs = null;

  const createCourseMapCell = ({ code, label, placeholder, empty }) => {
    const cell = document.createElement('div');
    cell.className = 'course-map-cell';
    if (placeholder) cell.classList.add('course-map-placeholder');
    if (empty) cell.classList.add('course-map-empty');
    if (code) {
      cell.dataset.subject = code;
      const codeEl = document.createElement('div');
      codeEl.className = 'course-map-code';
      codeEl.textContent = code;
      const nameEl = document.createElement('div');
      nameEl.className = 'course-map-name';
      nameEl.textContent = getSubjectName(code);
      cell.appendChild(codeEl);
      cell.appendChild(nameEl);
      courseMapCells.set(code, cell);
    } else if (label) {
      const labelEl = document.createElement('div');
      labelEl.className = 'course-map-name';
      labelEl.textContent = label;
      cell.appendChild(labelEl);
    }
    return cell;
  };

  const buildCourseMapGrid = (rows, cols, className = '') => {
    const grid = document.createElement('div');
    grid.className = `course-map-grid ${className}`.trim();
    grid.style.setProperty('--cols', String(cols));
    rows.forEach((row) => {
      row.forEach((entry) => {
        if (!entry) {
          grid.appendChild(createCourseMapCell({ empty: true }));
          return;
        }
        if (typeof entry === 'object') {
          const cell = createCourseMapCell({ placeholder: true });
          if (entry.placeholder) {
            cell.classList.add('course-map-shared-placeholder');
            cell.dataset.placeholder = entry.placeholder;
            cell.title =
              "BIT245 belongs to both BA and SD streams. If your major is NS, BIT245 is treated as a single elective. If your major is BA or SD, it's treated as one major subject.";
            courseMapSharedPlaceholders.push(cell);
          }
          grid.appendChild(cell);
          return;
        }
        const isMajorPlaceholder = entry.startsWith('Major Subject');
        const isElectivePlaceholder = entry.startsWith('Elective Subject');
        if (isMajorPlaceholder || isElectivePlaceholder) {
          const cell = createCourseMapCell({ label: entry, placeholder: true });
          if (isMajorPlaceholder) courseMapMajorPlaceholders.push(cell);
          if (isElectivePlaceholder) courseMapElectivePlaceholders.push(cell);
          grid.appendChild(cell);
          return;
        }
        grid.appendChild(createCourseMapCell({ code: entry }));
      });
    });
    return grid;
  };

  const buildCourseMapKey = () => {
    if (!courseMapKey) return;
    courseMapKey.innerHTML = '';
    const items = [
      { label: '(White background) Available to you this semseter', color: '#ffffff' },
      { label: 'Completed - passed or credit', color: '#c8efc0' },
      { label: 'Current enrolment in your student record', color: 'linear-gradient(135deg, #1b5e20, #c8efc0)', textColor: '#fff' },
      { label: 'Selected here today', color: '#1b5e20', textColor: '#fff' },
      { label: 'You can tick-off prerequisite requirements this semesterand study it next semester', color: '#cfcfcf' },
      { label: 'It will take at least 2 semesters to tick-off prerequisites', color: '#7d7d7d', textColor: '#fff' },
    ];
    items.forEach((item) => {
      const keyItem = document.createElement('div');
      keyItem.className = 'course-map-key-item';
      const swatch = document.createElement('span');
      swatch.className = 'course-map-key-swatch';
      swatch.style.background = item.color;
      if (item.textColor) swatch.style.borderColor = '#666';
      const label = document.createElement('span');
      label.textContent = item.label;
      keyItem.appendChild(swatch);
      keyItem.appendChild(label);
      courseMapKey.appendChild(keyItem);
    });
  };

  const buildCourseMapLayout = () => {
    if (!courseMapContent) return;
    courseMapContent.innerHTML = '';
    courseMapCells.clear();
    courseMapSharedPlaceholders.length = 0;
    courseMapMajorPlaceholders.length = 0;
    courseMapElectivePlaceholders.length = 0;

    const coreRows = [
      ['BIT105', 'BIT111', 'BIT112', 'BIT231', 'BIT241', 'BIT371', 'BIT372'],
      ['BIT106', 'BIT121', 'BIT108', 'BIT230', 'BIT242', 'BIT352', 'BIT314'],
    ];
    const majorRows = [
      ['Major Subject 1', 'Major Subject 3', 'Major Subject 5', 'Elective Subject 1', 'Elective Subject 3'],
      ['Major Subject 2', 'Major Subject 4', 'Major Subject 6', 'Elective Subject 2', 'Elective Subject 4'],
    ];
    const networkRows = [
      ['BIT233', 'BIT244', 'BIT313'],
      ['BIT213', 'BIT353', 'BIT362'],
    ];
    const baRows = [
      ['BIT236', 'BIT357', 'BIT356'],
      [{ placeholder: 'bit245-ba' }, 'BIT355', 'BIT363'],
    ];
    const sdRows = [
      [{ placeholder: 'bit245-sd' }, 'BIT246', 'BIT358'],
      ['BIT235', 'BIT351', 'BIT364'],
    ];

    const coreBlock = document.createElement('div');
    coreBlock.className = 'course-map-core-block';
    coreBlock.appendChild(buildCourseMapGrid(coreRows, 7, 'course-map-core-grid'));
    coreBlock.appendChild(buildCourseMapGrid(majorRows, 5, 'course-map-major-grid'));
    courseMapContent.appendChild(coreBlock);

    const streamsBlock = document.createElement('div');
    streamsBlock.className = 'course-map-streams-block';

    const nsSection = document.createElement('div');
    nsSection.className = 'course-map-stream ns';
    const nsLabel = document.createElement('div');
    nsLabel.className = 'course-map-stream-label';
    nsLabel.textContent = 'Network Security';
    nsSection.appendChild(nsLabel);
    nsSection.appendChild(buildCourseMapGrid(networkRows, 3, 'course-map-stream-grid'));
    streamsBlock.appendChild(nsSection);

    const baSection = document.createElement('div');
    baSection.className = 'course-map-stream ba';
    const baLabel = document.createElement('div');
    baLabel.className = 'course-map-stream-label';
    baLabel.textContent = 'Business Analytics';
    baSection.appendChild(baLabel);
    baSection.appendChild(buildCourseMapGrid(baRows, 3, 'course-map-stream-grid'));
    streamsBlock.appendChild(baSection);

    const shared = document.createElement('div');
    shared.className = 'course-map-shared';
    const sharedCell = createCourseMapCell({ code: 'BIT245' });
    sharedCell.classList.add('course-map-shared-cell');
    sharedCell.title =
      "BIT245 belongs to both the Business Analtyics (BA) and Software Development (SD) streams.\n  - If your major is Network Security, BIT245 is treated as a single elective.\n  - If your major is BA or SD, it's treated as a single major subject.";
    shared.appendChild(sharedCell);
    const arrowUp = document.createElement('div');
    arrowUp.className = 'course-map-arrow course-map-arrow-up';
    const arrowDown = document.createElement('div');
    arrowDown.className = 'course-map-arrow course-map-arrow-down';
    sharedCell.appendChild(arrowUp);
    sharedCell.appendChild(arrowDown);
    courseMapSharedRefs = { container: shared, cell: sharedCell, arrowUp, arrowDown };
    streamsBlock.appendChild(shared);

    const sdSection = document.createElement('div');
    sdSection.className = 'course-map-stream sd';
    const sdLabel = document.createElement('div');
    sdLabel.className = 'course-map-stream-label';
    sdLabel.textContent = 'Software Development';
    sdSection.appendChild(sdLabel);
    sdSection.appendChild(buildCourseMapGrid(sdRows, 3, 'course-map-stream-grid'));
    streamsBlock.appendChild(sdSection);

    courseMapContent.appendChild(streamsBlock);

    buildCourseMapKey();
  };

  const positionCourseMapArrows = () => {
    // Arrows are now positioned via CSS within the BIT245 cell.
  };

  const updateCourseMapStatuses = () => {
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
    const memo = new Map();
    const currentCodes = new Set([
      ...Array.from(workbookCurrent.keys()),
      ...Array.from(manualEntryCurrent.keys()),
    ]);
    courseMapSharedPlaceholders.forEach((cell) => {
      cell.classList.remove(
        'course-map-status-passed',
        'course-map-status-current',
        'course-map-status-selected',
        'course-map-status-next',
        'course-map-status-later'
      );
    });
    courseMapMajorPlaceholders.forEach((cell) => {
      cell.classList.remove(
        'course-map-status-passed',
        'course-map-status-current',
        'course-map-status-selected',
        'course-map-status-next',
        'course-map-status-later'
      );
    });
    courseMapElectivePlaceholders.forEach((cell) => {
      cell.classList.remove(
        'course-map-status-passed',
        'course-map-status-current',
        'course-map-status-selected',
        'course-map-status-next',
        'course-map-status-later'
      );
    });
    courseMapCells.forEach((cell, code) => {
      cell.classList.remove(
        'course-map-status-passed',
        'course-map-status-current',
        'course-map-status-selected',
        'course-map-status-next',
        'course-map-status-later'
      );
      const st = subjectState.get(code);
      if (!st) return;
      const isCurrent = currentCodes.has(code) || passForEnrolmentsOverrides.has(code);
      if (isCurrent) {
        cell.classList.add('course-map-status-current');
        return;
      }
      if (st.toggled) {
        cell.classList.add('course-map-status-selected');
        return;
      }
      if (st.completed) {
        cell.classList.add('course-map-status-passed');
        return;
      }
      const { prereqMetNow, coreqMetNow } = getRequisiteStatus({
        id: code,
        completedSet,
        plannedSet,
        usePlanned: false,
      });
      const hasCoreq = (corequisites[code] || []).length > 0;
      const meetsNow = hasCoreq ? prereqMetNow && coreqMetNow : prereqMetNow;
      if (!meetsNow) {
        const dist = computeSemesterDistance(code, completedSet, plannedSet, false, false, memo);
        if (Number.isFinite(dist) && dist <= 2) {
          cell.classList.add('course-map-status-next');
        } else {
          cell.classList.add('course-map-status-later');
        }
      }
    });

    const sharedCell = courseMapCells.get('BIT245');
    if (sharedCell && courseMapSharedPlaceholders.length) {
      const statusClass = [
        'course-map-status-passed',
        'course-map-status-current',
        'course-map-status-selected',
        'course-map-status-next',
        'course-map-status-later',
      ].find((cls) => sharedCell.classList.contains(cls));
      if (statusClass) {
        courseMapSharedPlaceholders.forEach((cell) => cell.classList.add(statusClass));
      }
    }

    const getStatusForCode = (code) => {
      const st = subjectState.get(code);
      if (!st) return '';
      const isCurrent = currentCodes.has(code) || passForEnrolmentsOverrides.has(code);
      if (isCurrent) return 'course-map-status-current';
      if (st.toggled) return 'course-map-status-selected';
      if (st.completed) return 'course-map-status-passed';
      return '';
    };

    const majorCodes = Array.from(subjectState.keys()).filter((code) => {
      if (code === 'BIT245') return false;
      const meta = subjectMeta[code];
      if (!meta?.classes) return false;
      const isCore = meta.classes.includes('core');
      const isElective = meta.classes.includes('elective') || code.startsWith('USE') || code.startsWith('ELECTIVE');
      return !isCore && !isElective;
    });
    const electiveCodes = Array.from(subjectState.keys()).filter((code) => {
      if (code === 'BIT245') return false;
      const meta = subjectMeta[code];
      return (meta?.classes || []).includes('elective') || code.startsWith('USE') || code.startsWith('ELECTIVE');
    });

    const buildStatusQueue = (codes) => {
      const buckets = {
        'course-map-status-current': [],
        'course-map-status-selected': [],
        'course-map-status-passed': [],
      };
      codes.forEach((code) => {
        const status = getStatusForCode(code);
        if (status) buckets[status].push(code);
      });
      return [
        ...buckets['course-map-status-current'],
        ...buckets['course-map-status-selected'],
        ...buckets['course-map-status-passed'],
      ].map((code) => getStatusForCode(code));
    };

    const applyPlaceholderStatuses = (cells, codes) => {
      const statuses = buildStatusQueue(codes);
      cells.forEach((cell, idx) => {
        const status = statuses[idx];
        if (status) cell.classList.add(status);
      });
    };

    applyPlaceholderStatuses(courseMapMajorPlaceholders, majorCodes);
    applyPlaceholderStatuses(courseMapElectivePlaceholders, electiveCodes);
  };

  const renderCourseMapModal = () => {
    if (!courseMapContent) return;
    if (!courseMapBuilt) {
      buildCourseMapLayout();
      courseMapBuilt = true;
    }
    updateCourseMapStatuses();
  };

  const getCourseMapCaptureTarget = () =>
    courseMapModal ? courseMapModal.querySelector('.modal-body') : null;

  const collectInlineStyles = () => {
    const chunks = [];
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        Array.from(sheet.cssRules || []).forEach((rule) => {
          if (!rule?.cssText) return;
          if (rule.type === CSSRule.FONT_FACE_RULE) return;
          const sanitized = rule.cssText.replace(/url\([^)]*\)/gi, 'none');
          chunks.push(sanitized);
        });
      } catch (err) {
        // ignore cross-origin stylesheets
      }
    });
    return chunks.join('\n');
  };

  const buildCourseMapSvgFromDom = (element) => {
    if (!element) return null;
    const containerRect = element.getBoundingClientRect();
    const width = Math.ceil(Math.max(containerRect.width, element.scrollWidth || 0));
    const height = Math.ceil(Math.max(containerRect.height, element.scrollHeight || 0));
    if (!width || !height) return null;

    const escapeXml = (value = '') =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/\'/g, '&#39;');

    const toNumber = (value) => {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const relativeRect = (el) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left + element.scrollLeft,
        y: rect.top - containerRect.top + element.scrollTop,
        width: rect.width,
        height: rect.height,
      };
    };

    const svgParts = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
      `<rect width="${width}" height="${height}" fill="#fff"/>`,
    ];

    const addRect = (rect, { fill, stroke, strokeWidth, rx = 0, ry = 0, dashArray } = {}) => {
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      const strokeAttr = stroke ? ` stroke="${stroke}"` : '';
      const strokeWidthAttr = strokeWidth ? ` stroke-width="${strokeWidth}"` : '';
      const dashAttr = dashArray ? ` stroke-dasharray="${dashArray}"` : '';
      svgParts.push(
        `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${rx}" ry="${ry}" fill="${fill || 'none'}"${strokeAttr}${strokeWidthAttr}${dashAttr}/>`
      );
    };

    const addText = (text, x, y, styles) => {
      if (!text) return;
      const attrs = [
        `x="${x}"`,
        `y="${y}"`,
        `fill="${styles.color || '#111'}"`,
        `font-size="${styles.fontSize || '12px'}"`,
        `font-weight="${styles.fontWeight || '400'}"`,
        `font-family="${styles.fontFamily || 'Arial, sans-serif'}"`,
        `dominant-baseline="hanging"`,
      ];
      svgParts.push(`<text ${attrs.join(' ')}>${escapeXml(text)}</text>`);
    };

    const drawBorderedGrids = (selector) => {
      element.querySelectorAll(selector).forEach((grid) => {
        const rect = relativeRect(grid);
        const style = window.getComputedStyle(grid);
        const stroke = style.borderColor;
        const strokeWidth = toNumber(style.borderWidth);
        addRect(rect, { fill: 'none', stroke, strokeWidth });
      });
    };

    drawBorderedGrids('.course-map-core-grid, .course-map-major-grid, .course-map-stream-grid');

    const bit245Cell = element.querySelector('.course-map-cell[data-subject="BIT245"]');
    if (bit245Cell) {
      const rect = relativeRect(bit245Cell);
      const baseX = rect.x + rect.width;
      const angles = [-20, 20];
      const offsets = [0.35, 0.65];
      const lineLength = 96;
      angles.forEach((deg, idx) => {
        const y = rect.y + rect.height * offsets[idx];
        const rad = (deg * Math.PI) / 180;
        const x2 = baseX + Math.cos(rad) * lineLength;
        const y2 = y + Math.sin(rad) * lineLength;
        const stroke = '#1a5c7a';
        const strokeWidth = 2;
        svgParts.push(
          `<line x1="${baseX}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" />`
        );
        const headLength = 8;
        const headWidth = 5;
        const perp = rad + Math.PI / 2;
        const hx = x2;
        const hy = y2;
        const p1x = hx - Math.cos(rad) * headLength;
        const p1y = hy - Math.sin(rad) * headLength;
        const p2x = p1x + Math.cos(perp) * headWidth;
        const p2y = p1y + Math.sin(perp) * headWidth;
        const p3x = p1x - Math.cos(perp) * headWidth;
        const p3y = p1y - Math.sin(perp) * headWidth;
        svgParts.push(
          `<polygon points="${hx},${hy} ${p2x},${p2y} ${p3x},${p3y}" fill="${stroke}" />`
        );
        svgParts.push(
          `<ellipse cx="${x2 + 7}" cy="${y2}" rx="7" ry="5" fill="none" stroke="#bdbdbd" stroke-width="1" />`
        );
      });
    }

    element.querySelectorAll('.course-map-cell').forEach((cell) => {
      const rect = relativeRect(cell);
      const style = window.getComputedStyle(cell);
      const fill = style.backgroundColor;
      const stroke = style.borderColor;
      const strokeWidth = toNumber(style.borderWidth);
      const dash = style.borderStyle === 'dashed' ? '4,3' : null;
      addRect(rect, { fill, stroke, strokeWidth, dashArray: dash });

      const padLeft = toNumber(style.paddingLeft);
      const padTop = toNumber(style.paddingTop);
      const codeEl = cell.querySelector('.course-map-code');
      const nameEl = cell.querySelector('.course-map-name');
      if (codeEl) {
        const codeStyle = window.getComputedStyle(codeEl);
        const fontSize = toNumber(codeStyle.fontSize);
        const lineHeight = toNumber(codeStyle.lineHeight) || fontSize * 1.2;
        addText(
          codeEl.textContent.trim(),
          rect.x + padLeft,
          rect.y + padTop,
          codeStyle
        );
        if (nameEl) {
          const nameStyle = window.getComputedStyle(nameEl);
          addText(
            nameEl.textContent.trim(),
            rect.x + padLeft,
            rect.y + padTop + lineHeight,
            nameStyle
          );
        }
      } else if (nameEl) {
        const nameStyle = window.getComputedStyle(nameEl);
        addText(
          nameEl.textContent.trim(),
          rect.x + padLeft,
          rect.y + padTop,
          nameStyle
        );
      }
    });

    element.querySelectorAll('.course-map-stream-label').forEach((label) => {
      const rect = relativeRect(label);
      const style = window.getComputedStyle(label);
      addText(label.textContent.trim(), rect.x, rect.y + 2, style);
    });

    element.querySelectorAll('.course-map-key-item').forEach((item) => {
      const itemRect = relativeRect(item);
      const style = window.getComputedStyle(item);
      const swatch = item.querySelector('.course-map-key-swatch');
      if (swatch) {
        const swatchRect = relativeRect(swatch);
        const swatchStyle = window.getComputedStyle(swatch);
        addRect(swatchRect, {
          fill: swatchStyle.backgroundColor,
          stroke: swatchStyle.borderColor,
          strokeWidth: toNumber(swatchStyle.borderWidth),
        });
        addText(
          item.textContent.trim(),
          swatchRect.x + swatchRect.width + 6,
          itemRect.y + 2,
          style
        );
      } else {
        addText(item.textContent.trim(), itemRect.x, itemRect.y + 2, style);
      }
    });

    svgParts.push('</svg>');
    return { svg: svgParts.join(''), width, height };
  };

  const buildElementSvg = (element) => buildCourseMapSvgFromDom(element);

  const renderElementToSvgBlob = (element) => {
    const built = buildCourseMapSvgFromDom(element) || buildElementSvg(element);
    if (!built) return null;
    return new Blob([built.svg], { type: 'image/svg+xml;charset=utf-8' });
  };

  const renderElementToPngBlob = (element) => {
    const built = buildElementSvg(element);
    if (!built) return Promise.resolve(null);
    const { svg, width, height } = built;
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.crossOrigin = 'anonymous';
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const finish = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            resolve(blob || null);
          }, 'image/png');
        } catch (err) {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };
      img.onload = () => finish();
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  };

  const copyCourseMapImage = async () => {
    if (!window.ClipboardItem || !navigator.clipboard?.write) return;
    const target = getCourseMapCaptureTarget();
    const blob = await renderElementToPngBlob(target);
    if (blob) {
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).catch(() => {});
      return;
    }
    const svgBlob = renderElementToSvgBlob(target);
    if (svgBlob) {
      navigator.clipboard.write([new ClipboardItem({ 'image/svg+xml': svgBlob })]).catch(() => {});
    }
  };

  const downloadCourseMapImage = async () => {
    const target = getCourseMapCaptureTarget();
    const blob = await renderElementToPngBlob(target);
    const finalBlob = blob || renderElementToSvgBlob(target);
    if (!finalBlob) return;
    const url = URL.createObjectURL(finalBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = blob ? 'course-map.png' : 'course-map.svg';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
    syncSubjectTableActions(timetableTable);
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
    syncSubjectTableActions(timetableTable);
    lockModalPosition();
    scheduleAdjustTimetable();
  };

  const showHistoryModal = () => {
    if (!historyModal) return;
    renderHistoryModal();
    historyModal.classList.add('show');
    historyModal.setAttribute('aria-hidden', 'false');
    syncSubjectTableActions(historyTable);
  };

  const hideHistoryModal = () => {
    if (!historyModal) return;
    historyModal.classList.remove('show');
    historyModal.setAttribute('aria-hidden', 'true');
  };

  const showRemainingModal = () => {
    if (!remainingModal) return;
    renderRemainingModal();
    remainingModal.classList.add('show');
    remainingModal.setAttribute('aria-hidden', 'false');
    syncSubjectTableActions(remainingTable);
    if (remainingElectivesTable && remainingElectivesSection && !remainingElectivesSection.hidden) {
      syncSubjectTableActions(remainingElectivesTable);
    }
  };

  const hideRemainingModal = () => {
    if (!remainingModal) return;
    remainingModal.classList.remove('show');
    remainingModal.setAttribute('aria-hidden', 'true');
  };

  const showCourseMapModal = () => {
    if (!courseMapModal) return;
    const doc = document.documentElement;
    const top = window.scrollY || doc.scrollTop || 0;
    courseMapModal.style.top = `${top}px`;
    courseMapModal.style.height = `${doc.scrollHeight - top}px`;
    renderCourseMapModal();
    courseMapModal.classList.add('show');
    courseMapModal.setAttribute('aria-hidden', 'false');
    if (closeCourseMapCta) closeCourseMapCta.focus();
    if (!courseMapResizeObserver) {
      courseMapResizeObserver = observeCourseMapResize();
    }
  };

  const hideCourseMapModal = () => {
    if (!courseMapModal) return;
    courseMapModal.classList.remove('show');
    courseMapModal.setAttribute('aria-hidden', 'true');
    courseMapModal.style.top = '';
    courseMapModal.style.height = '';
    if (courseMapButton) courseMapButton.focus();
    if (courseMapResizeObserver) {
      courseMapResizeObserver.disconnect();
      courseMapResizeObserver = null;
    }
  };

  const observeCourseMapResize = () => {
    if (!courseMapModal || typeof ResizeObserver === 'undefined') return null;
    const target = courseMapModal.querySelector('.course-map-modal') || courseMapModal;
    const observer = new ResizeObserver(() => {
      positionCourseMapArrows();
    });
    observer.observe(target);
    return observer;
  };

  let courseMapResizeObserver = observeCourseMapResize();

  const showNextSemesterModal = () => {
    if (!nextSemesterModal) return;
    const rows = getNextSemTableRows();
    renderSubjectTable(nextSemesterTable, rows, 'No subjects available next semester.');
    nextSemesterModal.classList.add('show');
    nextSemesterModal.setAttribute('aria-hidden', 'false');
    syncSubjectTableActions(nextSemesterTable);
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
    updateAlertBoxVisibility();
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
    if (!timetableTable || !clipboardAvailable) return;
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
          const baseStyle = 'border:1px solid #ccc;text-align:left;line-height:1;font-family:Calibri, Arial, sans-serif;font-size:11pt;';
          const headStyle = `${baseStyle}padding:6pt 8px;font-weight:700;`;
          const bodyStyle = `${baseStyle}padding:0 8px;font-weight:400;`;
          const style = tag === 'th' ? headStyle : bodyStyle;
          return `<${tag} style="${style}">${c.textContent.trim()}</${tag}>`;
        });
        return `<tr>${cells.join('')}</tr>`;
      })
      .join('');
    const headingHtml = includeHeading ? `<div style="margin-bottom:6px;font-family:Calibri, Arial, sans-serif;font-size:11pt;">${heading}</div>` : '';
    const html = `${headingHtml}<table style="border-collapse:collapse;border:1px solid #ccc;border-spacing:0;font-family:Calibri, Arial, sans-serif;font-size:11pt;">${htmlRows}</table>`;

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
    if (!tableEl || !clipboardAvailable) return;
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
          const baseStyle = 'border:1px solid #ccc;text-align:left;line-height:1;font-family:Calibri, Arial, sans-serif;font-size:11pt;';
          const headStyle = `${baseStyle}padding:6pt 8px;font-weight:700;`;
          const bodyStyle = `${baseStyle}padding:0 8px;font-weight:400;`;
          const style = tag === 'th' ? headStyle : bodyStyle;
          return `<${tag} style="${style}">${c.textContent.trim()}</${tag}>`;
        });
        return `<tr>${cells.join('')}</tr>`;
      })
      .join('');
    const headingHtml = heading ? `<div style="margin-bottom:6px;font-family:Calibri, Arial, sans-serif;font-size:11pt;">${heading}</div>` : '';
    const html = `${headingHtml}<table style="border-collapse:collapse;border:1px solid #ccc;border-spacing:0;font-family:Calibri, Arial, sans-serif;font-size:11pt;">${htmlRows}</table>`;

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

  const buildSimpleTableCopyData = (tableEl, headingText = '') => {
    if (!tableEl) return { text: '', html: '' };
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
          const baseStyle = 'border:1px solid #ccc;text-align:left;line-height:1;font-family:Calibri, Arial, sans-serif;font-size:11pt;';
          const headStyle = `${baseStyle}padding:6pt 8px;font-weight:700;`;
          const bodyStyle = `${baseStyle}padding:0 8px;font-weight:400;`;
          const style = tag === 'th' ? headStyle : bodyStyle;
          return `<${tag} style="${style}">${c.textContent.trim()}</${tag}>`;
        });
        return `<tr>${cells.join('')}</tr>`;
      })
      .join('');
    const headingHtml = heading ? `<div style="margin-bottom:6px;font-family:Calibri, Arial, sans-serif;font-size:11pt;">${heading}</div>` : '';
    const html = `${headingHtml}<table style="border-collapse:collapse;border:1px solid #ccc;border-spacing:0;font-family:Calibri, Arial, sans-serif;font-size:11pt;">${htmlRows}</table>`;
    return { text, html };
  };

  const copySimpleTablesToClipboard = (tables, headings = []) => {
    if (!clipboardAvailable) return;
    const parts = tables
      .map((tableEl, idx) => buildSimpleTableCopyData(tableEl, headings[idx] || ''))
      .filter((part) => part.text);
    if (!parts.length) return;
    const text = parts.map((part) => part.text).join('\n\n');
    const html = parts.map((part) => part.html).join('<br><br>');

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

  const copySubjectCodesFromTable = (tableEl) => {
    if (!tableEl || !clipboardAvailable) return;
    const rows = Array.from(tableEl.querySelectorAll('tbody tr'));
    const codes = [];
    rows.forEach((row) => {
      const dataCode = (row.dataset.subject || '').toUpperCase();
      if (/^(BIT[0-9A-Z]{3}|USE[0-9]{3})$/.test(dataCode)) {
        if (!codes.includes(dataCode)) codes.push(dataCode);
        return;
      }
      const firstCell = row.querySelector('td');
      if (!firstCell) return;
      const match = firstCell.textContent.toUpperCase().match(/\b(BIT[0-9A-Z]{3}|USE[0-9]{3})\b/);
      if (!match) return;
      const code = match[1];
      if (!codes.includes(code)) codes.push(code);
    });
    if (!codes.length) return;
    navigator.clipboard.writeText(codes.join('\n')).catch(() => { });
  };

  const copySubjectCodesFromTables = (tables) => {
    if (!clipboardAvailable) return;
    const codes = [];
    tables.forEach((tableEl) => {
      if (!tableEl) return;
      const rows = Array.from(tableEl.querySelectorAll('tbody tr'));
      rows.forEach((row) => {
        const dataCode = (row.dataset.subject || '').toUpperCase();
        if (/^(BIT[0-9A-Z]{3}|USE[0-9]{3})$/.test(dataCode)) {
          if (!codes.includes(dataCode)) codes.push(dataCode);
          return;
        }
        const firstCell = row.querySelector('td');
        if (!firstCell) return;
        const match = firstCell.textContent.toUpperCase().match(/\b(BIT[0-9A-Z]{3}|USE[0-9]{3})\b/);
        if (!match) return;
        const code = match[1];
        if (!codes.includes(code)) codes.push(code);
      });
    });
    if (!codes.length) return;
    navigator.clipboard.writeText(codes.join('\n')).catch(() => { });
  };
  const installModalCodeCopyButtons = () => {
    const configs = [
      { button: copyHistoryCodes, table: historyTable },
      { button: copyRemainingCodes, table: remainingTable },
      { button: copyNextSemesterCodes, table: nextSemesterTable },
      { button: copyTimetableCodes, table: timetableTable },
    ];
    configs.forEach(({ button, table }) => {
      if (!button) return;
      button.hidden = !staffFacing;
      if (!button.dataset.codesBound) {
        button.dataset.codesBound = 'true';
        button.addEventListener('click', () => {
          flashCopyButton(button);
          if (button === copyRemainingCodes) {
            const tables = [remainingTable];
            if (remainingElectivesSection && !remainingElectivesSection.hidden && remainingElectivesTable) {
              tables.push(remainingElectivesTable);
            }
            copySubjectCodesFromTables(tables);
            return;
          }
          copySubjectCodesFromTable(table);
        });
      }
      setClipboardButtonState(button, clipboardAvailable);
    });
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
    const completedCodes = new Set(
      Array.from(subjectState.entries())
        .filter(([, st]) => st?.completed)
        .map(([code]) => code)
    );
    electivePlaceholderState.forEach((code) => {
      if (code) completedCodes.add(code);
    });
    const allCodes = new Set([
      ...completedCodes,
      ...manualEntryMeta.keys(),
      ...workbookCurrent.keys(),
      ...manualEntryCurrent.keys(),
    ]);
    const historyRows = Array.from(allCodes)
      .filter((id) => validSubjectCodes.has(id) || validUseCodes.has(id))
      .map((id) => {
        const isUse = id.startsWith('USE');
        const data = isUse ? {} : timetable[id] || {};
        const dayFull = data.day || '';
        const dayShort = dayFull.slice(0, 3);
        const slot = data.slot || '';
        const cell = isUse ? null : getCellByCode(id);
        const meta = manualEntryMeta.get(id) || {};
        const result = formatHistoryResult(meta.result || '');
        const isFail = isFailGradeToken(result);
        const displayCode = isUse ? id : null;
        const displayName = isUse ? 'Unspecified Elective (USE)' : null;
        const displayStream = isUse ? 'Elective' : null;
        return {
          cell,
          id,
          data,
          dayFull,
          dayShort,
          slot,
          result,
          date: meta.date || '',
          isFail,
          displayCode,
          displayName,
          displayStream,
        };
      })
      .sort(compareByDaySlotThenCode);
    const unknownRows = manualEntryUnknown.map((entry) => ({
      ...entry,
      sortCode: entry.displayCode || '??',
    }));
    return [...historyRows, ...unknownRows].sort(compareByDaySlotThenCode);
  };

  const getRemainingRows = () => {
    const majorKey = getMajorKeyFromUi();
    const majorCodes = majorConfig[majorKey]?.codes || [];
    const coreCodes = Object.keys(subjectMeta).filter((code) => subjectMeta[code]?.classes?.includes('core'));
    const remainingCodes = new Set([...coreCodes, ...majorCodes]);
    return Array.from(remainingCodes)
      .filter((id) => validSubjectCodes.has(id))
      .filter((id) => !subjectState.get(id)?.completed)
      .map((id) => ({ id, cell: getCellByCode(id) }))
      .sort((a, b) => a.id.localeCompare(b.id));
  };

  const getRemainingElectiveRows = () => {
    if (areElectivesFull()) return [];
    const slotCodes = getElectiveSlotCodes(getMajorKeyFromUi()).filter(Boolean);
    const unique = Array.from(new Set(slotCodes));
    return unique
      .filter((id) => validSubjectCodes.has(id))
      .filter((id) => !subjectState.get(id)?.completed)
      .map((id) => ({ id, cell: getCellByCode(id) }))
      .sort((a, b) => a.id.localeCompare(b.id));
  };

  const renderCurrentEnrolments = () => {
    if (!currentEnrolmentsSection || !currentEnrolmentsList) return;
    currentEnrolmentsList.innerHTML = '';
    const rows = [
      ...Array.from(workbookCurrent.entries()),
      ...Array.from(manualEntryCurrent.entries()),
    ]
      .reduce((acc, [id, meta]) => {
        if (!acc.has(id)) acc.set(id, meta);
        return acc;
      }, new Map())
      ;
    const listRows = Array.from(rows.entries())
      .filter(([id]) => validSubjectCodes.has(id) && !subjectState.get(id)?.completed)
      .map(([id, meta]) => ({ id, date: meta?.date || '' }))
      .sort((a, b) => a.id.localeCompare(b.id));
    if (!listRows.length) {
      currentEnrolmentsSection.hidden = true;
      return;
    }
    listRows.forEach(({ id }) => {
      const li = document.createElement('li');
      const name = getSubjectName(id);
      const codeLabel = formatHistoryCode(id);
      li.textContent = `${codeLabel} - ${name}`;
      currentEnrolmentsList.appendChild(li);
    });
    currentEnrolmentsSection.hidden = false;
  };

  const loadWorkbookFromUrl = async (url) => {
    if (typeof XLSX === 'undefined') return;
    try {
      if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(true);
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const records = buildStudentRecordsFromWorkbook(workbook);
      const courseInfo = buildCourseInfoFromWorkbook(workbook);
      studentRecords = records;
      activeStudentId = '';
      staffWorkbookState.setStudentRecord(null);
      staffWorkbookState.setCourseInfo(courseInfo);
      loadedStudentSnapshot = null;
      clearStudentSearchDropdown();
      lastDroppedFileInfo = {
        fileName: url.split('/').pop() || 'Source.xlsx',
        savedLine: 'Auto-loaded',
      };
      renderDropZoneStatus([lastDroppedFileInfo.fileName, lastDroppedFileInfo.savedLine, `${records.length} students listed`]);
      updateStudentPreview();
    } catch (error) {
      // ignore auto-load failures; user can still drop the workbook manually
    } finally {
      if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(false);
    }
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
        if (!isRunningThisSemester(id)) return false;
        const st = subjectState.get(id);
        if (areElectivesFull() && isElectivesGridCell(cell)) return false;
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
        if (!isRunningNextSemester(id)) return false;
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
      .sort((a, b) => a.id.localeCompare(b.id));

  const updateSelectedList = () => {
    if (!selectedListSection || !selectedListEl) return;
    const available = getAvailableRows();
    if (sidebarSectionDescriptor) {
      const count = available.length;
      const subjectLabel = count === 1 ? 'subject' : 'subjects';
      sidebarSectionDescriptor.textContent =
        `Choose your subjects. Click among the ${count} ${subjectLabel} below or in grid to right, or use the 'Available now' popup.`;
    }
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
    updateSubjectCounts();
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
    if (copyTimetable) {
      copyTimetable.addEventListener('click', () => {
        flashCopyButton(copyTimetable);
        copyTimetableToClipboard();
      });
    }
    if (historyButton) historyButton.addEventListener('click', showHistoryModal);
    if (remainingButton) remainingButton.addEventListener('click', showRemainingModal);
    if (courseMapButton) courseMapButton.addEventListener('click', showCourseMapModal);
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
    if (copyHistory) {
      copyHistory.addEventListener('click', () => {
        flashCopyButton(copyHistory);
        copySimpleTableToClipboard(historyTable, historyTitleEl?.textContent || 'History');
      });
    }
    if (historyModal) {
      historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) hideHistoryModal();
      });
    }
    if (closeRemaining) closeRemaining.addEventListener('click', hideRemainingModal);
    if (closeRemainingCta) closeRemainingCta.addEventListener('click', hideRemainingModal);
    if (copyRemaining) {
      copyRemaining.addEventListener('click', () => {
        flashCopyButton(copyRemaining);
        const tables = [remainingTable];
        const headings = [remainingTitleEl?.textContent || 'Remaining'];
        if (remainingElectivesSection && !remainingElectivesSection.hidden && remainingElectivesTable) {
          tables.push(remainingElectivesTable);
          headings.push('Elective options');
        }
        copySimpleTablesToClipboard(tables, headings);
      });
    }
    if (remainingModal) {
      remainingModal.addEventListener('click', (e) => {
        if (e.target === remainingModal) hideRemainingModal();
      });
    }
    if (closeCourseMap) closeCourseMap.addEventListener('click', hideCourseMapModal);
    if (closeCourseMapCta) closeCourseMapCta.addEventListener('click', hideCourseMapModal);
    if (courseMapModal) {
      courseMapModal.addEventListener('click', (e) => {
        if (e.target === courseMapModal) hideCourseMapModal();
      });
    }
    if (copyCourseMapImageButton) {
      copyCourseMapImageButton.addEventListener('click', () => {
        flashCopyButton(copyCourseMapImageButton);
        copyCourseMapImage();
      });
    }
    if (downloadCourseMapImageButton) {
      downloadCourseMapImageButton.addEventListener('click', () => {
        flashCopyButton(downloadCourseMapImageButton);
        downloadCourseMapImage();
      });
    }
    if (closeNextSemester) closeNextSemester.addEventListener('click', hideNextSemesterModal);
    if (closeNextSemesterCta) closeNextSemesterCta.addEventListener('click', hideNextSemesterModal);
    if (copyNextSemester) {
      copyNextSemester.addEventListener('click', () => {
        flashCopyButton(copyNextSemester);
        copySimpleTableToClipboard(nextSemesterTable, nextSemesterTitleEl?.textContent || 'Available next semester');
      });
    }
    if (courseMapContent) {
      courseMapContent.addEventListener('mousemove', (event) => {
        courseMapTooltipPos = { x: event.clientX, y: event.clientY };
        if (courseMapTooltip.style.display === 'block') {
          positionCourseMapTooltip();
        }
      });
      courseMapContent.addEventListener('mouseover', (event) => {
        const cell = event.target?.closest?.('.course-map-cell');
        if (!cell || !courseMapContent.contains(cell)) return;
        const code = cell.dataset.subject;
        if (!code) return;
        if (courseMapTooltipTarget === cell) return;
        courseMapTooltipTarget = cell;
        if (courseMapTooltipTimer) clearTimeout(courseMapTooltipTimer);
        courseMapTooltipTimer = setTimeout(() => {
          showCourseMapTooltip(code);
        }, 300);
      });
      courseMapContent.addEventListener('mouseout', (event) => {
        const leaving = event.target?.closest?.('.course-map-cell');
        if (!leaving || leaving !== courseMapTooltipTarget) return;
        courseMapTooltipTarget = null;
        if (courseMapTooltipTimer) clearTimeout(courseMapTooltipTimer);
        hideCourseMapTooltip();
      });
      courseMapContent.addEventListener('mouseleave', () => {
        courseMapTooltipTarget = null;
        if (courseMapTooltipTimer) clearTimeout(courseMapTooltipTimer);
        hideCourseMapTooltip();
      });
    }
    window.addEventListener('scroll', () => {
      updateCompletedModeSticky();
      if (courseMapModal?.classList.contains('show')) {
        positionCourseMapArrows();
      }
    }, { passive: true });
    window.addEventListener('resize', () => {
      completedModeStickyTop = null;
      updateCompletedModeSticky();
    });
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
      majorLabel.textContent = 'Unsure (using Network Security)';
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
  const getCompletedElectiveCount = () => {
    const useCodes = electivePlaceholderState.filter(Boolean).map((code) => String(code).toUpperCase());
    const majorKey = getMajorKeyFromUi();
    const majorSet = new Set(majorLayouts[majorKey] || []);
    const slotCodes = getElectiveSlotCodes(majorKey);
    const completedBits = slotCodes
      .filter((code) => {
        if (!code || majorSet.has(code)) return false;
        const st = subjectState.get(code);
        return st?.completed;
      })
      .map((code) => String(code).toUpperCase());
    const unique = new Set([...useCodes, ...completedBits]);
    return Math.min(programRequirements.elective, unique.size);
  };
  const getRemainingElectiveCount = () =>
    Math.max(0, programRequirements.elective - getCompletedElectiveCount());
  const getFilledElectiveSlotCodes = () => {
    const placeholders = getElectivePlaceholders();
    return placeholders.map((cell, idx) => {
      const datasetCode = cell?.dataset?.electiveCode;
      if (datasetCode) return datasetCode.toUpperCase();
      const useCode = electivePlaceholderState[idx];
      if (useCode) return useCode.toUpperCase();
      const bitCode = electiveBitState[idx];
      if (bitCode) return bitCode.toUpperCase();
      const text = (cell?.textContent || '').toUpperCase();
      const match = text.match(/\b(BIT\d{3}|USE\d{3})\b/);
      if (match) return match[1];
      const filled =
        cell?.classList?.contains('filled-elective') ||
        cell?.classList?.contains('completed') ||
        cell?.classList?.contains('toggled');
      return filled ? 'FILLED' : '';
    });
  };
  const getElectiveFillCountFromDom = () => {
    const placeholders = getElectivePlaceholders();
    return placeholders.reduce((count, cell, idx) => {
      if (!cell) return count;
      const text = (cell.textContent || '').toUpperCase();
      const hasCodeInText = /\b(BIT\d{3}|USE\d{3})\b/.test(text);
      const hasUse = !!electivePlaceholderState[idx];
      const hasBit = !!electiveBitState[idx];
      const hasClass =
        cell.classList.contains('filled-elective') ||
        cell.classList.contains('completed') ||
        cell.classList.contains('toggled');
      return hasCodeInText || hasUse || hasBit || hasClass ? count + 1 : count;
    }, 0);
  };
  const getElectiveFilledSlotCount = () => {
    const placeholderCount = getFilledElectiveSlotCodes().filter(Boolean).length;
    const activeCount = new Set(getActiveElectiveCodes().map((code) => code.toUpperCase())).size;
    const domCount = getElectiveFillCountFromDom();
    return Math.max(placeholderCount, activeCount, domCount);
  };
  const areElectivesFull = () => getElectiveFilledSlotCount() >= programRequirements.elective;

  const updateElectivesFullUI = () => {
    const full = areElectivesFull();
    const electiveCells = subjects.filter((cell) => {
      const id = cell.dataset.subject || '';
      return id && !isPlaceholder(cell) && isElectivesGridCell(cell);
    });
    const filledBitCodes = new Set(
      [...getFilledElectiveSlotCodes(), ...getActiveElectiveCodes()]
        .filter((code) => typeof code === 'string' && code.toUpperCase().startsWith('BIT'))
        .map((code) => code.toUpperCase())
    );
    electiveCells.forEach((cell) => {
      const id = cell.dataset.subject;
      const shouldMark = full && !filledBitCodes.has(String(id).toUpperCase());
      cell.classList.toggle('electives-full', shouldMark);
      if (shouldMark) {
        cell.classList.remove('can-select-now', 'satisfied');
      }
      const existing = cell.querySelector('.electives-full-pill');
      if (shouldMark) {
        if (!existing) {
          const pill = document.createElement('div');
          pill.className = 'electives-full-pill';
          pill.textContent = "Can't select. All 4 Elective slots are full";
          cell.appendChild(pill);
        }
      } else if (existing) {
        existing.remove();
      }
    });
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
    updateElectivesFullUI();
    refreshErrorAlerts();
  };

  const debugApi = {
    areElectivesFull,
    getFilledElectiveSlotCodes,
    getActiveElectiveCodes,
    getElectiveFilledSlotCount,
  };
  if (typeof window !== 'undefined') {
    window.__plannerDebug = debugApi;
    window.plannerDebug = debugApi;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.__plannerDebug = debugApi;
    globalThis.plannerDebug = debugApi;
  }

  initSubjectStateFromData();
  applySubjectStateToCells();
  recomputeAvailability();
  updateCompletedModeUI();
  updateOverrideUI();
  updateLiveUI();
  updateSemCountUI();
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
  updateSubjectCounts();
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
  Array.from(document.querySelectorAll('.modal')).forEach((modalEl) => enableModalDragResize(modalEl));
  installModalCodeCopyButtons();
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
    toggleSemCountsBtn.addEventListener('change', () => {
      showSemCounts = toggleSemCountsBtn.checked;
      updateSemCountUI();
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
      hideRemainingModal();
      hideCourseMapModal();
      hideNextSemesterModal();
      hideLoadModal();
      hideInstructionsModal();
    } else if (e.key === 'Enter') {
      if (codeModal && codeModal.classList.contains('show')) {
        const activeEl = document.activeElement;
        if (activeEl && codeModal.contains(activeEl) && activeEl.matches('textarea, input')) {
          return;
        }
      }
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

  const shouldRegisterServiceWorker = () => {
    if (!window.isSecureContext || !("serviceWorker" in navigator)) return false;
    const host = window.location.hostname || '';
    const isLocal =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '[::1]';
    const params = new URLSearchParams(window.location.search);
    if (params.get('sw') === '0') return false;
    return !isLocal;
  };
  if (shouldRegisterServiceWorker()) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }})();


