/*

Author: Antony Di Serio
Created: December 30, 2025

Behaviour: subject selection, completion mode, prerequisite gating, tooltips, timetable modal

*/
(() => {
  const subjects = Array.from(
    document.querySelectorAll('.main-grid .subject-card, .electives-grid .subject-card')
  ).filter((cell) => !cell.classList.contains('info-card'));
  const DEBUG_TIMETABLE_MODAL = false;
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
  const courseMapStreamLayouts = {
    ns: [
      ['BIT233', 'BIT244', 'BIT313'],
      ['BIT213', 'BIT353', 'BIT362'],
    ],
    ba: [
      ['BIT236', 'BIT357', 'BIT356'],
      [{ placeholder: 'bit245-ba', code: 'BIT245' }, 'BIT355', 'BIT363'],
    ],
    sd: [
      [{ placeholder: 'bit245-sd', code: 'BIT245' }, 'BIT246', 'BIT358'],
      ['BIT235', 'BIT351', 'BIT364'],
    ],
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
    BIT106: { day: 'Thursday', slot: 'Afternoon', room: 'PK206', teacher: 'Sarang Hashemi' },
    BIT372: { day: 'Monday', slot: 'Morning', room: 'PE302', teacher: 'Sazia, Sita, Tony, TBA' },
    BIT121: { day: 'Monday', slot: 'Afternoon', room: 'PE226', teacher: 'Russul Al-Anni' },
    BIT371: { day: 'Monday', slot: 'Afternoon', room: 'PE302', teacher: 'Sazia, Sita, Tony, TBA' },
    BIT105: { day: 'Tuesday', slot: 'Morning', room: 'PA113', teacher: 'Shzaa Niazi' },
    BIT313: { day: 'Tuesday', slot: 'Morning', room: 'PE226', teacher: 'Anthony Overmars' },
    BIT351: { day: 'Tuesday', slot: 'Morning', room: 'PA114', teacher: 'Uchenna Enwereonye' },
    BIT111: { day: 'Tuesday', slot: 'Afternoon', room: 'PA114', teacher: 'Uchenna Enwereonye' },
    BIT230: { day: 'Tuesday', slot: 'Afternoon', room: 'PE226', teacher: 'Sarang Hashemi' },
    BIT245: { day: 'Tuesday', slot: 'Morning', room: 'PE328', teacher: 'Antony Di Serio' },
    BIT353: { day: 'Tuesday', slot: 'Afternoon', room: 'PF340', teacher: 'Anthony Overmars' },
    BIT112: { day: 'Wednesday', slot: 'Morning', room: 'PA114', teacher: 'Dominic Mammone' },
    BIT244: { day: 'Wednesday', slot: 'Morning', room: 'PE226', teacher: 'Russul Al-Anni' },
    BIT233: { day: 'Tuesday', slot: 'Morning', room: 'PF340', teacher: 'Yaona Zhao' },
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
  const dataErrorButton = document.getElementById('btn-data-error');
  const codesButton = document.getElementById('btn-codes');
  const subjectCountsEl = document.getElementById('subject-counts');
  const titleAlerts = document.getElementById('title-alerts');

  const updateAlertBoxVisibility = () => {
    if (!titleAlerts) return;
    const hasVisible = [errorButton, warningButton, infoButton, codesButton].some(
      (btn) => btn && !btn.classList.contains('hidden')
    );
    titleAlerts.classList.toggle('is-collapsed', !hasVisible);
  };

  const hideAllAlertButtons = () => {
    [errorButton, warningButton, infoButton, dataErrorButton, codesButton].forEach((btn) => {
      if (btn) btn.classList.add('hidden');
    });
    updateAlertBoxVisibility();
  };
  hideAllAlertButtons();
  const dropZone = document.getElementById('drop-zone');
  const dropSidebar = document.getElementById('drop-sidebar');
  const folderShortcutsPanel = document.getElementById('folder-shortcuts-panel');
  const folderShortcutSemesterButton = document.getElementById('folder-shortcut-semester');
  const folderShortcutStudentFormsButton = document.getElementById('folder-shortcut-student-forms');
  const folderShortcutTeacherButton = document.getElementById('folder-shortcut-teacher');
  const folderShortcutHelpButton = document.getElementById('folder-shortcut-help');
  const ENROL_PROTOCOL_INSTALL_COMMAND = 'powershell -NoProfile -ExecutionPolicy Bypass -File .\\install-enrol-protocol.ps1';
  const ENROL_PROTOCOL_ENABLED_KEY = 'subjectPlannerEnrolProtocolEnabled';
  const isEnrolProtocolEnabled = () => {
    try {
      return window.localStorage?.getItem(ENROL_PROTOCOL_ENABLED_KEY) === '1';
    } catch {
      return false;
    }
  };
  const setEnrolProtocolEnabled = (enabled) => {
    try {
      if (enabled) {
        window.localStorage?.setItem(ENROL_PROTOCOL_ENABLED_KEY, '1');
      } else {
        window.localStorage?.removeItem(ENROL_PROTOCOL_ENABLED_KEY);
      }
      folderShortcutProtocolUnavailableNotified = false;
    } catch {
      // ignore storage failures
    }
  };
  let folderShortcutProtocolUnavailableNotified = false;
  let folderHelpPopupOverlay = null;
  let folderHelpPopupStatus = null;
  let folderHelpPopupCopyButton = null;
  let folderHelpPopupEnableButton = null;
  let folderHelpPopupFallbackButton = null;
  let folderHelpPopupCloseButton = null;
  const hideFolderShortcutHelpPopup = () => {
    if (!folderHelpPopupOverlay) return;
    folderHelpPopupOverlay.classList.add('hidden-initial');
    folderHelpPopupOverlay.setAttribute('aria-hidden', 'true');
  };
  const showFolderShortcutHelpPopup = () => {
    if (!folderHelpPopupOverlay) {
      const overlay = document.createElement('div');
      overlay.className = 'folder-help-overlay hidden-initial';
      overlay.setAttribute('aria-hidden', 'true');

      const popup = document.createElement('div');
      popup.className = 'folder-help-popup';
      popup.setAttribute('role', 'dialog');
      popup.setAttribute('aria-modal', 'true');
      popup.setAttribute('aria-label', 'Folder helper setup');

      const title = document.createElement('div');
      title.className = 'folder-help-title';
      title.textContent = 'Windows only';

      const body = document.createElement('div');
      body.className = 'folder-help-body';
      body.textContent = 'Windows users: Open a Command window at the folder that holds this web site.  Then run this code:';

      const cmdRow = document.createElement('div');
      cmdRow.className = 'folder-help-command-row';

      const cmd = document.createElement('code');
      cmd.className = 'folder-help-command';
      cmd.textContent = ENROL_PROTOCOL_INSTALL_COMMAND;

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'clear-button secondary folder-help-copy';
      copyBtn.textContent = 'Copy';
      copyBtn.setAttribute('aria-label', 'Copy install command');
      setClipboardButtonState(copyBtn, clipboardAvailable);

      cmdRow.appendChild(cmd);
      cmdRow.appendChild(copyBtn);

      const status = document.createElement('div');
      status.className = 'folder-help-status';

      const actions = document.createElement('div');
      actions.className = 'folder-help-actions';

      const fallbackBtn = document.createElement('button');
      fallbackBtn.type = 'button';
      fallbackBtn.className = 'clear-button secondary folder-help-fallback';

      const enableBtn = document.createElement('button');
      enableBtn.type = 'button';
      enableBtn.className = 'clear-button folder-help-enable';

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'clear-button secondary folder-help-close';
      closeBtn.textContent = 'Close';

      actions.appendChild(fallbackBtn);
      actions.appendChild(enableBtn);
      actions.appendChild(closeBtn);

      popup.appendChild(title);
      popup.appendChild(body);
      popup.appendChild(cmdRow);
      popup.appendChild(status);
      popup.appendChild(actions);
      overlay.appendChild(popup);
      document.body.appendChild(overlay);

      folderHelpPopupOverlay = overlay;
      folderHelpPopupStatus = status;
      folderHelpPopupCopyButton = copyBtn;
      folderHelpPopupEnableButton = enableBtn;
      folderHelpPopupFallbackButton = fallbackBtn;
      folderHelpPopupCloseButton = closeBtn;

      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) hideFolderShortcutHelpPopup();
      });
      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (!folderHelpPopupOverlay || folderHelpPopupOverlay.classList.contains('hidden-initial')) return;
        hideFolderShortcutHelpPopup();
      });
      closeBtn.addEventListener('click', () => hideFolderShortcutHelpPopup());
      fallbackBtn.addEventListener('click', () => {
        setEnrolProtocolEnabled(false);
        hideFolderShortcutHelpPopup();
        scheduleFolderShortcutPanelRefresh();
      });
      enableBtn.addEventListener('click', () => {
        setEnrolProtocolEnabled(true);
        hideFolderShortcutHelpPopup();
        scheduleFolderShortcutPanelRefresh();
      });
      copyBtn.addEventListener('click', () => {
        void copyPlainText(ENROL_PROTOCOL_INSTALL_COMMAND).then((copied) => {
          if (copied) {
            triggerFlash(copyBtn);
          } else {
            window.alert('Could not copy command to clipboard.');
          }
        });
      });
    }
    const enabled = isEnrolProtocolEnabled();
    if (folderHelpPopupStatus) {
      folderHelpPopupStatus.textContent = enabled
        ? 'Helper currently enabled.'
        : 'Helper currently disabled (browser fallback mode).';
    }
    if (folderHelpPopupEnableButton) {
      folderHelpPopupEnableButton.textContent = enabled ? 'Keep enabled' : 'Enable helper';
    }
    if (folderHelpPopupFallbackButton) {
      folderHelpPopupFallbackButton.textContent = enabled ? 'Disable helper' : 'Use fallback';
    }
    folderHelpPopupOverlay.classList.remove('hidden-initial');
    folderHelpPopupOverlay.setAttribute('aria-hidden', 'false');
  };
  let scheduleFolderShortcutPanelRefresh = () => {};
  const dropZoneTextEl = dropZone?.querySelector('.drop-zone-text');
  const dropZoneDefaultText =
    dropZoneTextEl?.textContent ||
    'Drop Source.xlsx / Email Scripts.html (or .htm/.docx) here\nor click to pick files';
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
  let emailScriptsInfo = null;
  let triageFileInfo = null;
  let triageRecords = new Map();
  let triagePreviewRows = [];
  let triageParseInfo = { status: 'not parsed', headerFound: false, idIdx: null, total: 0, preview: 0 };
  const triageSharePointDebugLastLoggedAt = new Map();
  const TRIAGE_ROW_LIMIT = 350;
  const TRIAGE_MAX_COL_SCAN = 120;
  const TRIAGE_MAX_PREVIEW_COLS = 12;
  const TRIAGE_READ_MAX_ROWS = 800;
  const SOURCE_READ_MAX_ROWS = 4000;
  const WORKBOOK_PARSE_TIMEOUT_MS = 300000;
  const WORKER_PARSE_TIMEOUT_MS = 300000;
  const TRIAGE_WORKER_TIMEOUT_MS = 120000;
  const WORKBOOK_FALLBACK_MAX_BYTES = 50_000_000;
  const TRIAGE_FALLBACK_MAX_BYTES = 2_000_000;
  const SOURCE_WORKER_URL = (() => {
    try {
      return new URL('workbook-parser-worker.js', window.location.href).toString() + '?v=source-20260208-3';
    } catch {
      return 'workbook-parser-worker.js?v=source-20260208-3';
    }
  })();
  const TRIAGE_WORKER_URL = (() => {
    try {
      return new URL('triage-parser-worker.js', window.location.href).toString() + '?v=triage-20260208-3';
    } catch {
      return 'triage-parser-worker.js?v=triage-20260208-3';
    }
  })();
  let skipTriageParseOnLoad = false;
  let triageParseRunId = 0;
  // keep constant for compatibility (no toggle UI)
  const TRIAGE_PARSE_MODE_KEY = 'triageParseMode';
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
  const formatHttpDateInfo = (value) => {
    if (!value) return 'Last saved: Unknown';
    const modified = new Date(value);
    if (isNaN(modified.getTime())) return 'Last saved: Unknown';
    const dateLabel = formatDisplayDate(modified);
    const daysAgo = Math.floor((Date.now() - modified.getTime()) / (1000 * 60 * 60 * 24));
    const daysLabel = Number.isFinite(daysAgo) ? `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago` : '';
    const parts = [dateLabel ? `Last saved: ${dateLabel}` : '', daysLabel ? `(${daysLabel})` : '']
      .filter(Boolean)
      .join(' ');
    return parts || 'Last saved: Unknown';
  };
  const renderDropZoneStatus = (lines) => {
    if (!dropZoneTextEl) return;
    dropZoneTextEl.innerHTML = '';
    (lines || []).forEach((line) => {
      if (line === null || line === undefined) return;
      const payload = typeof line === 'string' ? { text: line } : line;
      if (!payload || (!payload.text && !payload.blank)) return;
      const span = document.createElement('span');
      span.className = 'drop-zone-line';
      if (payload.bold) span.classList.add('is-strong');
      if (payload.blank) {
        span.classList.add('is-blank');
        span.textContent = '\u00a0';
      } else {
        span.textContent = payload.text;
        if (/^0\s+students\s+listed\.?$/i.test(payload.text.trim())) {
          span.classList.add('is-zero');
        }
      }
      const lineActions = Array.isArray(payload.actions)
        ? payload.actions.filter(Boolean)
        : payload.action
          ? [payload.action]
          : [];
      if (lineActions.length) {
        span.style.paddingRight = `${12 + lineActions.length * 30}px`;
      }
      lineActions.forEach((action, idx) => {
        const { key, label, fileName, path, tooltip } = action || {};
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'drop-zone-action';
        if (key === 'email-actions') btn.classList.add('drop-zone-action-dots');
        btn.textContent = label || '';
        btn.dataset.action = key || '';
        btn.style.right = `${8 + idx * 30}px`;
        const safeName = fileName || 'file';
        const safePath = path || 'Unknown';
        btn.setAttribute('data-tooltip-html', tooltip || `Open ${safeName}. <br> <b>Path</b> ${safePath}`);
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!key) return;
          handleDropZoneActionClick(key);
        });
        btn.addEventListener('mousedown', (event) => {
          event.stopPropagation();
        });
        span.appendChild(btn);
      });
      if (payload.tooltip) {
        span.dataset.tooltip = payload.tooltip;
      }
      if (payload.debugBox) {
        const debug = document.createElement('div');
        debug.className = 'drop-zone-tooltip-debug';
        debug.style.marginTop = '6px';
        debug.style.padding = '6px 8px';
        debug.style.border = '1px dashed rgba(255,255,255,0.4)';
        debug.style.borderRadius = '6px';
        debug.style.background = 'rgba(0,0,0,0.35)';
        debug.style.whiteSpace = 'pre-line';
        debug.style.fontSize = '12px';
        debug.style.lineHeight = '1.3';
        debug.textContent = payload.debugText || payload.tooltip || '';
        span.appendChild(debug);
      }
      dropZoneTextEl.appendChild(span);
    });
    initTooltips();
    scheduleFolderShortcutPanelRefresh();
  };
  const studentIdSection = document.getElementById('student-id-section');
  const studentIdInput = document.getElementById('student-id-input');
  const studentSearchDropdown = document.getElementById('student-search-dropdown');
  const studentSearchEmpty = document.getElementById('student-search-empty');
  const studentDataPreview = document.getElementById('student-data-preview');
  const clearStudentButton = document.getElementById('clear-student');
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
  const normalizeHeader = (value) =>
    String(value ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  const hostName = window.location.hostname || '';
  const isStaffHost = hostName === 'localhost' || hostName === '127.0.0.1' || hostName.includes('sharepoint');
  const isStaffMode = window.location.protocol === 'file:' || isStaffHost;
  const isStudentMode = ['http:', 'https:'].includes(window.location.protocol) && !isStaffMode;
  const isWorkbookFlag = (value) => {
    const raw = String(value ?? '').trim().toLowerCase();
    return raw === 'y' || raw === 'yes' || raw === 'true' || raw === '1';
  };
  const timetableModal = document.getElementById('timetable-modal');
  const closeTimetable = document.getElementById('close-timetable');
  const hideTimetable = document.getElementById('hide-timetable');
  const copyTimetable = document.getElementById('copy-timetable');
  const copyTimetableCodes = document.getElementById('copy-timetable-codes');
  const timetableTitleEl = document.getElementById('timetable-title');
  const timetableTable = document.getElementById('timetable-table');
  const timetableFees = document.getElementById('timetable-fees');
  let timetablePreparedEl = null;
  const downloadTimetableImageButton = document.getElementById('download-timetable-image');
  const emailPrimaryButton = document.getElementById('email-primary');
  const emailInstituteButton = document.getElementById('email-institute');
  const emailBothButton = document.getElementById('email-both');
  const copyStudentDeclarationButton = document.getElementById('copy-student-declaration');
  const emailScriptsAccessModal = document.getElementById('email-scripts-access-modal');
  const closeEmailScriptsAccessModal = document.getElementById('close-email-scripts-access');
  const closeEmailScriptsAccessCta = document.getElementById('close-email-scripts-access-cta');
  const emailScriptsRowCopyButton = document.getElementById('email-scripts-copy-student-declaration');
  const emailScriptsRowOpenButton = document.getElementById('email-scripts-open-email-docx');
  const emailScriptsSupportsCopyButton = document.getElementById('email-scripts-copy-supports-at-risk');
  const emailScriptsSupportsEmailButton = document.getElementById('email-scripts-email-supports-at-risk');
  const emailScriptsExtraRowsHost = document.getElementById('email-scripts-extra-rows');
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
  const presetFmpAssoc = document.getElementById('preset-fmp-assoc');
  const presetFmpDip = document.getElementById('preset-fmp-dip');
  const presetMpDip = document.getElementById('preset-mp-dip');
  const presetMpDipOld = document.getElementById('preset-mp-dip-old');
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
  const historyColoursButton = document.getElementById('history-colours');
  const historyOnlyPassedButton = document.getElementById('history-only-passed');
  const remainingModal = document.getElementById('remaining-modal');
  const remainingTitleEl = document.getElementById('remaining-title');
  const remainingSummary = document.getElementById('remaining-summary');
  const remainingTable = document.getElementById('remaining-table');
  const remainingElectivesSection = document.getElementById('remaining-electives-section');
  const remainingElectivesTable = document.getElementById('remaining-electives-table');
  const remainingElectivesCount = document.getElementById('remaining-electives-count');
  const remainingColoursButton = document.getElementById('remaining-colours');
  const courseMapModal = document.getElementById('course-map-modal');
  const courseMapContent = document.getElementById('course-map-content');
  const courseMapKey = document.getElementById('course-map-key');
  let courseMapNotesEl = null;
  const closeCourseMap = document.getElementById('close-course-map');
  const closeCourseMapCta = document.getElementById('close-course-map-cta');
  const copyCourseMapImageButton = document.getElementById('copy-course-map-image');
  const toggleCourseMapPrereqButton = document.getElementById('toggle-course-map-prereq');
  const toggleCourseMapPrereqTextButton = document.getElementById('toggle-course-map-prereq-text');
  const toggleCourseMapIndicatorsButton = document.getElementById('toggle-course-map-indicators');
  const courseMapFontDecreaseButton = document.getElementById('course-map-font-decrease');
  const courseMapFontIncreaseButton = document.getElementById('course-map-font-increase');
  const downloadCourseMapImageButton = document.getElementById('download-course-map-image');
  const currentEnrolmentsSection = document.getElementById('current-enrolments-section');
  const currentEnrolmentsTable = document.getElementById('current-enrolments-table');
  const historyGradedHeading = document.getElementById('history-graded-heading');
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
  const getTriageParseMode = () => 'fast';
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
  const hideButtonsInStudentMode = () => {
    if (!isStudentMode) return;
    [
      copyTimetable,
      copyTimetableCodes,
      copyStudentDeclarationButton,
      emailPrimaryButton,
      emailInstituteButton,
      emailBothButton,
      copyHistory,
      copyHistoryCodes,
      copyRemaining,
      copyRemainingCodes,
      copyCourseTimetableButton,
      courseTimetableTeacherCopyButton,
    ].forEach((button) => {
      if (!button) return;
      button.hidden = true;
      button.style.display = 'none';
    });
  };
  hideButtonsInStudentMode();
  const flashCopyButton = (button) => {
    if (!button) return;
    button.classList.remove('copy-flash');
    void button.offsetWidth;
    button.classList.add('copy-flash');
  };
  let modalLocked = false;
  let modalPrevStyle = null;
  let suppressOutsideClickUntil = 0;
  let courseTimetableView = 'grid';
  let courseTimetableColoursOn = false;
  let remainingColoursOn = false;
  let historyOnlyPassed = false;
  let historyColoursOn = false;
  const manualFeeHidden = { domestic: false, international: false };
  let lastFullLoadSelected = false;
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
  let creditPointsEarned = '';
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
        creditPointsEarned = info?.Credit_Points_Earned ?? '';
      },
      getCourseInfo() {
        return staffWorkbookCourseInfo;
      },
      reset() {
        workbookSubjects.clear();
        staffWorkbookStudentRecord = null;
        staffWorkbookCourseInfo = null;
        creditPointsEarned = '';
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
  const creditGradeTokens = new Set(['CRT', 'RPL', 'CR']);
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
  const previousCodeByNew = {
    BIT213: 'BIT243 Network Security',
    BIT313: 'BIT354 Network Vulnerability and Penetration Testing',
    BIT314: 'BIT361 Security Management and Governance',
  };
  const legacySubjectMap = new Map(legacySubjectPairs);
  const validUseCodes = new Set(['USE101', 'USE102', 'USE201', 'USE202', 'USE301']);
  const manualEntryAliases = new Map();
  const manualEntryMeta = new Map();
  const manualEntryCurrent = new Map();
  const workbookCurrent = new Map();
  const currentEnrolmentStudentRecord = new Set();
  const withdrawnCurrentEnrolments = new Set();
  const manualEntryUnknown = [];
  let manualEntryResults = [];
  let emailScriptsDocxBuffer = null;
  let emailScriptsHtmlSource = '';
  let emailScriptsBaseHref = '';
  let emailScriptsFileName = '';
  let emailScriptsSourcePath = '';
  let emailScriptsCache = null;
  let sourceWorkbookFileObject = null;
  let emailScriptsFileObject = null;
  let triageWorkbookFileObject = null;
  let fileLocationsProfileOverride = '';
  let fileLocationsIntakeOverride = '';
  let triageWorkbookBuffer = null;
  let triageWorkbookFileName = '';
  let fileLocationsCache = null;
  let staffFolderHandle = null;
  let folderShortcutSearchFallbackNotified = false;
  let otherLoadedFilesInfo = [];
  let availableListSnapshot = null;
  let availableListSnapshotKey = '';
  let lastStudentCountLine = '';
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

  const medianGradeOrder = ['N', 'PA', 'CR', 'D', 'HD'];
  const getMedianGradeLabel = (entries = []) => {
    const bySubject = new Map();
    entries.forEach((entry) => {
      if (!entry?.id) return;
      const token = normalizeGradeToken(entry.result);
      if (!medianGradeOrder.includes(token)) return;
      const parsedDate = toDateValue(entry.date || '');
      const existing = bySubject.get(entry.id);
      if (!existing) {
        bySubject.set(entry.id, { token, date: parsedDate });
        return;
      }
      if (parsedDate && (!existing.date || parsedDate > existing.date)) {
        bySubject.set(entry.id, { token, date: parsedDate });
        return;
      }
      if (!existing.date && !parsedDate) {
        bySubject.set(entry.id, { token, date: null });
      }
    });
    const grades = Array.from(bySubject.values())
      .map((entry) => entry.token)
      .filter(Boolean)
      .sort((a, b) => medianGradeOrder.indexOf(a) - medianGradeOrder.indexOf(b));
    if (!grades.length) return 'N/A';
    const mid = Math.floor((grades.length - 1) / 2);
    return grades[mid];
  };
  const getMedianGradeLabelPastYear = (entries = []) => {
    const today = getDateOnly(new Date());
    const cutoff = today ? addDays(today, -365) : null;
    if (!cutoff) return getMedianGradeLabel(entries);
    const filtered = entries.filter((entry) => {
      const parsed = toDateValue(entry?.date || '');
      if (!parsed) return false;
      const day = getDateOnly(parsed);
      if (!day) return false;
      return day >= cutoff && day <= today;
    });
    if (!filtered.length) return 'N/A';
    return getMedianGradeLabel(filtered);
  };
  const isFailGradeToken = (value) => {
    const token = normalizeGradeToken(value);
    return !!token && (failGrades.has(token) || token.startsWith('WN/'));
  };
  const isWithdrawOrFailGrade = (value) => {
    const token = normalizeGradeToken(value);
    if (!token) return false;
    if (token === 'H') return false;
    if (token.startsWith('W') || token.startsWith('WN/')) return true;
    if (failGrades.has(token)) return true;
    return false;
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
    if (/\b1900[\/\-\s]+0?1[\/\-\s]+0?0\b/.test(upper)) return '';
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
  const isStudentModeParam = staffModeParam === 'student';
  const staffFacing = isLocalHost || isSharePointHost || isFileProtocol || isStaffModeParam;
  const shouldShowTeacherCopy = isSharePointHost || isStaffModeParam;
  const dropZoneEnabled = isLocalEnv || isSharePointHost || isStaffModeParam;
  if (timetableModal && staffFacing) timetableModal.classList.add('staff-mode');

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
        suppressOutsideClickUntil = Date.now() + 200;
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
        suppressOutsideClickUntil = Date.now() + 200;
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
  let feeStatus = '';
  let domesticLoad = true;
  let exceptionalLoadApproved = false;
  let remainingConfirmed = false;
  let electiveError = null;
  let prereqError = null;
  let chainDelayError = null;
  let aprAppError = null;
  let acceptedOfferedError = null;
  let overCompletionError = null;
  let overLoadError = null;
  let capstonePairError = null;
  let capstoneYearError = null;
  let intakeStartError = null;
  let availableNowError = null;
  let availableLoadError = null;
  let timetableClashError = null;
  let censusWarning = null;
  let censusError = null;
  let weekTwoWarning = null;
  let weekTwoError = null;
  let dateNoticeLines = [];
  let creditTransferWarning = null;
  let creditTransferWarningActive = false;
  let infoNotes = null;
  let countryHittingTroubles = null;
  let deferredInfo = null;
  const passForEnrolmentsOverrides = new Set();
  const currentEnrolmentsPlannedOverrides = new Set();
  let loadedStudentSnapshot = null;
  let nextSemWarning = null;
  let finalSemWarning = null;
  let warningPayloads = [];
  let showSemCounts = false;
  let initialLoad = true;
  let courseMapPrereqColoursOn = true;
  let courseMapPrereqTextOn = true;
  let courseMapIndicatorsOn = true;
  let courseMapFontScaleEm = 1;
  let remainingNoticeUnlocked = false;
  let majorPulseTimer = null;

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
  const getBestMajorStreamFromCounts = (counts) => {
    const order = ['ns', 'ba', 'sd'];
    let best = { key: order[0], count: 0 };
    order.forEach((key) => {
      const count = counts[key] || 0;
      if (count > best.count) best = { key, count };
    });
    return best;
  };
  const mapStreamKeyToDropdownValue = (key) => (key === 'ns' ? 'network' : key);
  const mapDropdownValueToStreamKey = (value) => (value === 'network' ? 'ns' : value);
  const getMajorNameFromKey = (key) =>
    key === 'ns' ? 'Network Security' : key === 'ba' ? 'Business Analytics' : 'Software Development';
  const triggerMajorPulse = () => {
    if (!majorDropdown) return;
    majorDropdown.classList.remove('major-pulse');
    void majorDropdown.offsetWidth;
    majorDropdown.classList.add('major-pulse');
    if (majorPulseTimer) clearTimeout(majorPulseTimer);
    majorPulseTimer = setTimeout(() => {
      majorDropdown.classList.remove('major-pulse');
    }, 2600);
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
      const severity = hasOverrun
        ? 'error'
        : hasEqual && allowChainWarning
          ? 'info'
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
          : 'Running tight on prerequisite chains';
        const remainingLabel = chainRemaining === 1 ? 'subject' : 'subjects';
        const optimalLabel = chainOptimalSemesters === 1 ? 'semester' : 'semesters';
        const chainLabel = longestChainSemesters === 1 ? 'semester' : 'semesters';
        const chainIntro = chainOverrunsPlan
          ? `Normally, at full load you could expect to complete the remaining <strong>${chainRemaining}</strong> ${remainingLabel} in <strong>${chainOptimalSemesters}</strong> ${optimalLabel}. However there is a chain of subjects with prerequisites that runs for <strong>${longestChainSemesters}</strong> ${chainLabel}, so putting at risk your optimal graduation date:`
          : `Normally, at full load you could expect to complete the remaining <strong>${chainRemaining}</strong> ${remainingLabel} in <strong>${chainOptimalSemesters}</strong> ${optimalLabel}. Your longest prerequisite chain also runs for <strong>${longestChainSemesters}</strong> ${chainLabel}, so it is right at the limit for your optimal graduation date:`;
        const majorKey = getMajorKeyFromUi();
        let alternatingNote = '';
        if (!chainOverrunsPlan && (majorKey === 'ba' || majorKey === 'sd')) {
          const alternatingIds =
            majorKey === 'ba'
              ? ['BIT355', 'BIT356', 'BIT357', 'BIT363']
              : ['BIT351', 'BIT358', 'BIT246', 'BIT364'];
          const remainingAlt = alternatingIds.filter((id) => !subjectState.get(id)?.completed);
          if (remainingAlt.length) {
            const list = remainingAlt
              .map(
                (id) =>
                  `${id} - ${getSubjectName(id)} (${semester1OnlyIds.has(id) ? 'Semester 1' : 'Semester 2'})`
              )
              .join('<br>');
            alternatingNote = `<p class="alert-inline-text"><strong>Alternating subjects still incomplete:</strong><br>${list}</p>`;
          }
        }
        const availabilityNote = hasAvailabilityDelay
          ? '<p class="alert-inline-text"><strong>Note</strong>: This delay is caused by subjects that run only <strong>once per year</strong>. They haven\'t been named in the chain list above, but they can add an extra semester if not taken when available.</p>'
          : '';
        chainDelayError = {
          title: chainTitle,
          severity,
          html: `<p><strong class="alert-inline-title ${chainOverrunsPlan ? 'alert-title-error' : 'alert-title-info'}">${chainTitle}</strong> <span class="alert-inline-text">${chainIntro}</span></p>${body}${availabilityNote}${alternatingNote}`,
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
      loadLabel.textContent = `Will study ${fullLoadCap || 4} subjects`;
    }
    if (varyLoadButton) {
      varyLoadButton.textContent = 'Change';
      varyLoadButton.disabled = !domesticLoad;
      varyLoadButton.classList.toggle('disabled', !domesticLoad);
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

  const refreshCurrentEnrolmentStudentRecord = () => {
    currentEnrolmentStudentRecord.clear();
    withdrawnCurrentEnrolments.clear();
    const sources = [...workbookCurrent.keys(), ...manualEntryCurrent.keys()];
    sources.forEach((code) => {
      if (validSubjectCodes.has(code)) currentEnrolmentStudentRecord.add(code);
    });
    updatePassForEnrolmentsAvailability();
  };

  const applySubjectStateToCells = () => {
    subjects.forEach((cell) => {
      const id = cell.dataset.subject;
      if (!id || isPlaceholder(cell)) return;
      const st = subjectState.get(id);
      cell.classList.remove('completed', 'toggled', 'completed-pending', 'current-enrolment', 'current-enrolment-withdrawn');
      cell.setAttribute('aria-pressed', 'false');
      if (st?.completed) {
        cell.classList.add('completed');
        cell.setAttribute('aria-pressed', 'true');
      }
      if (st?.toggled) {
        cell.classList.add('toggled');
        cell.setAttribute('aria-pressed', 'true');
      }
      if (!st?.completed && withdrawnCurrentEnrolments.has(id)) {
        cell.classList.add('current-enrolment-withdrawn');
      } else if (!st?.completed && st?.toggled && currentEnrolmentStudentRecord.has(id)) {
        cell.classList.add('current-enrolment');
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

  const formatShortDate = (value) => {
    const date = toDateValue(value);
    if (!date) return String(value ?? '').trim();
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(date);
  };

  const formatNumericDate = (value) => {
    const date = toDateValue(value);
    if (!date) return '';
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const isWithdrawGrade = (value) => {
    const token = normalizeGradeToken(value);
    if (!token) return false;
    return token.startsWith('W') || token.startsWith('WN/');
  };

  const getLatestDateFromResults = (entries = [], predicate = () => false) => {
    let latest = null;
    entries.forEach((entry) => {
      if (!entry || !predicate(entry)) return;
      const parsed = toDateValue(entry.date || '');
      if (!parsed) return;
      if (!latest || parsed > latest) latest = parsed;
    });
    return latest;
  };

  const getLatestDateFromDates = (dates = []) => {
    let latest = null;
    dates.forEach((dateValue) => {
      const parsed = toDateValue(dateValue || '');
      if (!parsed) return;
      if (!latest || parsed > latest) latest = parsed;
    });
    return latest;
  };

  const buildDeferredNoticeText = (info) => {
    if (!info) return '';
    const enrolmentText = info.lastEnrolmentText || 'unknown';
    return `Last result recorded ${enrolmentText}.`;
  };

  const getStudentFlagText = (record) => String(record?.Student_Flag || '').trim();

  const isSdSubjectCode = (code) => {
    const classes = subjectMeta[code]?.classes || [];
    return classes.includes('software') || classes.includes('dual') || classes.includes('dual-split');
  };

  const getSdMajorCautionMessage = () => {
    if (completedMode) return '';
    const majorVal = majorDropdown?.dataset?.value || currentMajorValue || 'undecided';
    if (majorVal !== 'sd') return '';
    const hasBit111Fail = manualEntryResults.some(
      (entry) => entry?.id === 'BIT111' && isFailGradeToken(entry.result)
    );
    const hasBit111Pass =
      subjectState.get('BIT111')?.completed ||
      manualEntryResults.some(
        (entry) => entry?.id === 'BIT111' && getGradeStatus(entry.result) === 'pass'
      );
    if (!hasBit111Fail || !hasBit111Pass) return '';
    return 'Students who fail BIT111 often have difficulty with the Software Development major. Student needs to be sure that programming is something that interests them';
  };

  const getRepeatFailCounts = () => {
    const failCounts = new Map();
    const passSeen = new Set();
    manualEntryResults.forEach((entry) => {
      if (!entry?.id || !validSubjectCodes.has(entry.id)) return;
      const status = getGradeStatus(entry.result);
      if (status === 'pass') passSeen.add(entry.id);
      if (status === 'fail' || isFailGradeToken(entry.result)) {
        failCounts.set(entry.id, (failCounts.get(entry.id) || 0) + 1);
      }
    });
    subjectState.forEach((st, code) => {
      if (st?.completed) passSeen.add(code);
    });
    const results = [];
    failCounts.forEach((count, code) => {
      if (count < 2) return;
      if (passSeen.has(code)) return;
      results.push({ code, count });
    });
    return results;
  };

  const buildRepeatFailNotices = () => {
    const warnings = [];
    const errors = [];
    const summary = [];
    const counts = getRepeatFailCounts();
    counts.forEach(({ code, count }) => {
      const label = `${code}`;
      if (count === 2) {
        warnings.push({
          title: `Fail Subject Twice: ${label}`,
          html: `<p><strong class="alert-inline-title alert-title-warning">Fail Subject Twice: ${label}</strong> <span class="alert-inline-text">Subject ${label} has been failed 2 times and not yet passed. On 3rd fail student will be asked to attend APR meeting to discuss options for continuing course. On 4th fail student will be excluded from the course.</span></p>`,
        });
        summary.push({ code, count, level: 'warning' });
        return;
      }
      if (count === 3) {
        errors.push({
          title: `Fail Subject 3 times: ${label}`,
          html: `<p><strong class="alert-inline-title alert-title-error">Fail Subject 3 times: ${label}</strong> <span class="alert-inline-text">Subject ${label} has been failed 3 times and not yet passed. On 3rd fail student is asked to attend APR meeting to discuss options for continuing course. On 4th fail student will be excluded from the course.</span></p>`,
        });
        summary.push({ code, count: 3, level: 'error' });
        return;
      }
      errors.push({
        title: `Fail Subject 4 times: ${label}`,
        html: `<p><strong class="alert-inline-title alert-title-error">Fail Subject 4 times: ${label}</strong> <span class="alert-inline-text">Subject ${label} has been failed 4 times and not yet passed. On 4th fail student will be excluded from the course.</span></p>`,
      });
      summary.push({ code, count: 4, level: 'error' });
    });
    return { warnings, errors, summary };
  };

  const formatSuppsAndHoldsItems = (value) => {
    const suppsAndHolds = (value || '').toString().trim();
    if (!suppsAndHolds) return '';
    return suppsAndHolds
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => escapeHtml(entry))
      .join('<br>');
  };

  const areCapstonesBothRemaining = () =>
    !subjectState.get('BIT371')?.completed && !subjectState.get('BIT372')?.completed;

  const shouldShowRemainingNotice = (remainingCount) => {
    if (!remainingNoticeUnlocked) return false;
    if (remainingCount !== 9 && remainingCount !== 5) return false;
    if (remainingCount === 5 && areCapstonesBothRemaining()) return false;
    return true;
  };

  const buildInfoMessages = (record, feeDetails) => {
    const infoMessages = [];
    const remainingCount = getRemainingSubjectsCount();
    if (shouldShowRemainingNotice(remainingCount)) {
      const medianGradePastYear = getMedianGradeLabelPastYear(manualEntryResults);
      infoMessages.push({
        title: 'Subjects remaining',
        html: `<p><strong class="alert-inline-title alert-title-info">${remainingCount} subjects remaining</strong> <span class="alert-inline-text">Median grade (past year, median): ${escapeHtml(
          medianGradePastYear
        )}.</span></p><p class="alert-inline-text">Students can study 5 subjects in 1 semester in their final year if it gives them the option of graduating that year. This option is open to those with a CR average (60 to 69%).</p>`,
      });
    }
    const majorKey = getMajorKeyFromUi();
    const hasCompleted = (code) => !!subjectState.get(code)?.completed;
    const hasSasCore = ['BIT106', 'BIT231', 'BIT112'].every(hasCompleted);
    const hasBaCert = hasSasCore && (hasCompleted('BIT355') || hasCompleted('BIT356'));
    const hasSdCert = hasSasCore && hasCompleted('BIT358');
    if (chainDelayError?.severity === 'info') {
      infoMessages.push({
        title: chainDelayError.title || 'Running tight on prerequisite chains',
        html: chainDelayError.html,
      });
    }
    const shouldShowSasNotice =
      remainingNoticeUnlocked &&
      remainingCount <= 9 &&
      hasSasCore &&
      !(hasBaCert && hasSdCert) &&
      ['ns', 'ba', 'sd'].includes(majorKey);
    if (shouldShowSasNotice) {
      infoMessages.push({
        title: 'SAS certificates',
        html: `<p><strong class="alert-inline-title alert-title-info">SAS enabled subjects.</strong> <span class="alert-inline-text">Two certificates available:</span></p><ul class="alert-inline-list"><li><strong>SAS Academic Specialisation in IT Analytics</strong> for completion of core subjects (BIT106, BIT231, BIT112) and 1 of the Business Analytics subjects BIT355 or BIT356.</li><li><strong>Academic Specialisation in Software Development Analytics</strong> for completion of core subjects (BIT106, BIT231, BIT112) and the Software Development subject BIT358.</li></ul>`,
      });
    }
    const studentFlag = getStudentFlagText(record);
    if (studentFlag) {
      infoMessages.push({
        title: 'Student Flag',
        html: `<p><strong class="alert-inline-title alert-title-warning">Student Flag</strong> <span class="alert-inline-text">${escapeHtml(
          studentFlag
        )}</span></p>`,
      });
    }
    if (hasCompletedAnyChangedCodeSubject()) {
      const completedChanged = new Set(getCompletedChangedCodeSubjects());
      const changedRows = [
        {
          newCode: 'BIT213',
          newLabel: 'BIT213 Network and Cyber Security Essentials',
          oldLabel: 'BIT243 Network Security',
        },
        {
          newCode: 'BIT313',
          newLabel: 'BIT313 Cyber Vulnerability and Hardening',
          oldLabel: 'BIT354 Network Vulnerability and Penetration Testing',
        },
        {
          newCode: 'BIT314',
          newLabel: 'BIT314 Cybersecurity Management and Governance',
          oldLabel: 'BIT361 Network Management and Governance',
        },
      ];
      const changedRowsHtml = changedRows
        .map(({ newCode, newLabel, oldLabel }) => {
          const oldPart = completedChanged.has(newCode)
            ? `<strong>${oldLabel}</strong>`
            : oldLabel;
          return `<li>${newLabel} was ${oldPart}</li>`;
        })
        .join('');
      infoMessages.push({
        title: 'Changed subject codes/names',
        html: `<p><strong class="alert-inline-title alert-title-info">Changed subject codes/names</strong></p><ul class="alert-inline-list changed-codes-list">${changedRowsHtml}</ul>`,
      });
    }
    const isFmp = String(record?.FMP || '').trim();
    const hasHistory = !!(
      (record?.Passed_subjects || '').toString().trim() ||
      (record?.Results_List || '').toString().trim()
    );
    if (isFmp && !hasHistory) {
      infoMessages.push({
        title: 'FMP student',
        html: `<p><strong class="alert-inline-title alert-title-info">Fuzhou Melbourne Polytechnic (FMP)</strong> <span class="alert-inline-text">Check if the student comes from a Diploma (8 credits) or Advanced Diploma (12 credits). Confirm if their course is C complete or E enrolled, and whether they have passed all subjects. An articulation agreement needs to be applied.</span></p>`,
      });
    }
    if (deferredInfo?.isDeferred) {
      const deferredMessage = buildDeferredNoticeText(deferredInfo);
      infoMessages.push({
        title: 'Returning student',
        html: `<p><strong class="alert-inline-title alert-title-warning">Returning student.</strong> <span class="alert-inline-text">${escapeHtml(
          deferredMessage
        )}</span></p>`,
      });
    }
    if (countryHittingTroubles) {
      infoMessages.push({
        title: 'Country Alert',
        html: `<p><strong class="alert-inline-title alert-title-info">Country Alert</strong> <span class="alert-inline-text">${escapeHtml(
          countryHittingTroubles
        )} is nominated by us in BIT as a country facing unusual or heightened struggles or concerns.</span></p>`,
      });
    }
    const visaUpper = String(record?.Visa_Type || '').toUpperCase();
    const visaNumbers = visaUpper.match(/\b\d{3}\b/g) || [];
    const isBridgingVisa = visaNumbers.includes('010') || visaNumbers.includes('020');
    if (isBridgingVisa) {
      infoMessages.push({
        title: 'Visa fee guide',
        html: getVisaGuideModalHtml(),
      });
    }
    const visaDetailHtml = getVisaDetailModalHtml(record?.Visa_Type || '', feeDetails);
    if (visaDetailHtml) {
      infoMessages.push({
        title: 'Visa details',
        html: visaDetailHtml,
      });
    }
    const domesticCaveatHtml = getDomesticVisaCaveatHtml(visaNumbers);
    if (domesticCaveatHtml) {
      infoMessages.push({
        title: 'Domestic visa caveats',
        html: domesticCaveatHtml,
      });
    }
    return infoMessages;
  };

  const splitInfoMessages = (messages = []) => {
    const codes = [];
    const info = [];
    messages.forEach((msg) => {
      const title = String(msg?.title || '').toLowerCase();
      const html = String(msg?.html || '').toLowerCase();
      if (title.includes('changed subject codes/names') || html.includes('changed-codes-list')) {
        codes.push(msg);
      } else {
        info.push(msg);
      }
    });
    return { codes, info };
  };

  const formatLongDate = (value) => {
    const date = toDateValue(value);
    if (!date) return '';
    const text = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
    return text.replace(', ', ' ');
  };

  const formatCurrency = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '';
    return `$ ${num.toLocaleString('en-AU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };
  const parseCreditPoints = (value) => {
    if (value === null || value === undefined) return null;
    const cleaned = String(value).replace(/[^0-9.-]/g, '').trim();
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  };

  const getActiveStudentRecord = () => {
    const id = activeStudentId || normalizeStudentId(studentIdInput?.value || '');
    if (!id) return staffWorkbookState.getStudentRecord();
    return (
      studentRecords.find((row) => normalizeStudentId(row.Student_IDs_Unique) === id) ||
      staffWorkbookState.getStudentRecord()
    );
  };

  const SPECIAL_VISA_TOKENS = ['HV', 'REF', 'PV', 'PPV', 'TPC', 'SHEV'];
  const INTERNATIONAL_VISA_NUMBERS = new Set(['417', '462', '600', '485', '482', '408']);
  const INTERNATIONAL_PART_TIME_VISA_NUMBERS = new Set(['417', '462', '600', '485', '482', '408']);
  const DOMESTIC_VISA_NUMBERS = new Set([
    '866',
    '785',
    '790',
    '189',
    '190',
    '491',
    '801',
    '820',
    '100',
    '309',
    '444',
  ]);
  const VISA_GUIDE = {
    international: [
      '417 = Working Holiday (Temporary Resident, study limited usually to 4 months)',
      '462 = Work and Holiday (Temporary Resident, study limited usually to 4 months)',
      '600 = Visitor visa',
      '485 = Temporary Graduate',
      '482 = Temporary Skill Shortage',
      '408 = Temporary Activity',
    ],
    domestic: [
      '866 Permanent Protection (CSP + HECS-HELP eligible)',
      '785 Temporary Protection Visa (TPV) – usually domestic for school fees; tertiary varies',
      '790 Safe Haven Enterprise Visa (SHEV) – usually domestic for school fees; tertiary varies',
      'Offshore refugee visas – domestic on arrival',
      '189 Skilled Independent (PR)',
      '190 Skilled Nominated (PR)',
      '491 (once permanent stage reached)',
      '801 / 820 Partner visas (once PR granted)',
      '100 / 309 Offshore partner visas',
      '444 New Zealand citizen (Special Category Visa – domestic for schooling; tertiary rules vary)',
      'refugee (word value in Visa_Type)',
    ],
    edge: [
      '010 = BVA Bridging Visa A (inherits previous visa fee status)',
      '020 = BV2 Bridging Visa 2 (inherits previous visa fee status)',
    ],
  };
  const VISA_DETAIL_MAP = {
    '417': 'Working Holiday (Temporary Resident, study limited usually to 4 months)',
    '462': 'Work and Holiday (Temporary Resident, study limited usually to 4 months)',
    '600': 'Visitor visa',
    '485': 'Temporary Graduate',
    '482': 'Temporary Skill Shortage',
    '408': 'Temporary Activity',
    '866': 'Permanent Protection (CSP + HECS-HELP eligible)',
    '785': 'Temporary Protection Visa (TPV) – usually domestic for school fees; tertiary varies',
    '790': 'Safe Haven Enterprise Visa (SHEV) – usually domestic for school fees; tertiary varies',
    '189': 'Skilled Independent (PR)',
    '190': 'Skilled Nominated (PR)',
    '491': 'Skilled Work Regional (provisional) – CSP/HELP may be restricted',
    '801': 'Partner visa (permanent)',
    '820': 'Partner visa (temporary)',
    '100': 'Offshore partner visa (permanent)',
    '309': 'Offshore partner visa (temporary)',
    '444': 'New Zealand Special Category Visa (domestic for schooling; tertiary rules vary)',
    refugee: 'Refugee (word value in Visa_Type)',
  };
  const getVisaShortLabel = (visaType) => {
    if (!visaType) return '';
    const upper = String(visaType).toUpperCase();
    const match = upper.match(/\b(\d{3})\s*([A-Z]{2,3})\b/);
    if (match) return `${match[1]} ${match[2]}`;
    const number = upper.match(/\b\d{3}\b/);
    if (number) return number[0];
    return String(visaType).trim();
  };
  const DOMESTIC_VISA_CAVEATS = {
    humanitarianTemporary: ['785', '790'],
    provisional: ['491'],
    partnerTemporary: ['820', '309'],
    nzSc: ['444'],
  };
  const getDomesticVisaCaveatHtml = (visaNumbers) => {
    const hits = new Set(visaNumbers || []);
    const lines = [];
    if (hits.has('866')) lines.push('866 – Permanent Protection: domestic fees + CSP/HELP eligible.');
    if (hits.has('785') || hits.has('790')) {
      lines.push('785/790 – Humanitarian temporary: domestic for school fees; tertiary treatment varies.');
    }
    if (hits.has('189') || hits.has('190')) lines.push('189/190 – PR: domestic.');
    if (hits.has('491')) {
      lines.push('491 – Provisional: often domestic for schooling, but CSP/HELP may be restricted.');
    }
    if (hits.has('801')) lines.push('801 – Partner (permanent): domestic.');
    if (hits.has('820')) {
      lines.push('820 – Partner (temporary): often domestic, but HECS/CSP can depend on stage.');
    }
    if (hits.has('100')) lines.push('100 – Offshore partner (permanent): domestic.');
    if (hits.has('309')) {
      lines.push('309 – Offshore partner (temporary): often domestic, but HECS/CSP can depend on stage.');
    }
    if (hits.has('444')) {
      lines.push('444 – NZ SCV: domestic for schooling; tertiary CSP/HELP depends on residency history.');
    }
    if (!lines.length) return '';
    return `<p><strong class="alert-inline-title alert-title-info">Domestic visa caveats</strong></p><ul class="alert-inline-list">${lines
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join('')}</ul>`;
  };
  const getDomesticVisaCaveatLine = (visaNumbers) => {
    const hits = new Set(visaNumbers || []);
    if (hits.has('491')) return 'Domestic visa caveat: 491 provisional – CSP/HELP may be restricted.';
    if (hits.has('820')) return 'Domestic visa caveat: 820 partner (temporary) – CSP/HELP may depend on stage.';
    if (hits.has('309')) return 'Domestic visa caveat: 309 offshore partner (temporary) – CSP/HELP may depend on stage.';
    if (hits.has('785')) return 'Domestic visa caveat: 785 humanitarian temporary – tertiary treatment varies.';
    if (hits.has('790')) return 'Domestic visa caveat: 790 humanitarian temporary – tertiary treatment varies.';
    if (hits.has('444')) return 'Domestic visa caveat: 444 NZ SCV – CSP/HELP depends on residency history.';
    return '';
  };
  const getVisaGuideModalHtml = () => {
    const buildList = (items) => `<ul class="alert-inline-list">${items.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`;
    return `
      <p><strong class="alert-inline-title alert-title-info">Visa fee guide (Visa_Type)</strong></p>
      <p class="alert-inline-text"><strong>International fees</strong></p>
      ${buildList(VISA_GUIDE.international)}
      <p class="alert-inline-text"><strong>Domestic-style access</strong></p>
      ${buildList(VISA_GUIDE.domestic)}
      <p class="alert-inline-text"><strong>Edge cases</strong></p>
      ${buildList(VISA_GUIDE.edge)}
    `;
  };
  const getVisaDetailModalHtml = (visaType, feeDetails) => {
    if (!visaType) return '';
    const upper = visaType.toUpperCase();
    const numbers = upper.match(/\b\d{3}\b/g) || [];
    const non500 = numbers.filter((code) => code !== '500');
    const isRefugee = upper.includes('REFUGEE');
    const picked = non500[0] || (isRefugee ? 'refugee' : '');
    if (!picked) return '';
    const description = VISA_DETAIL_MAP[picked] || `Visa type ${picked}`;
    const feeText =
      feeDetails?.feeLabel ||
      (feeDetails?.domesticFees ? 'Fee Type: Domestic rates' : 'Fee Type: International student rates');
    const loadText = feeDetails?.domesticLoad
      ? 'Study load: part-time may be permitted (domestic or special/part-time visa rules apply).'
      : 'Study load: full load required (international student rules).';
    return `<p><strong class="alert-inline-title alert-title-info">Visa details</strong> <span class="alert-inline-text">Visa: ${escapeHtml(
      visaType
    )} – ${escapeHtml(description)}.</span></p><p class="alert-inline-text">${escapeHtml(
      feeText
    )}</p><p class="alert-inline-text">${escapeHtml(loadText)}</p>`;
  };
  const getFeeStatusDetails = (record) => {
    if (!record) {
      return {
        feeStatus: '',
        domesticFees: true,
        domesticLoad: true,
        feeLabel: '',
        visaType: '',
        fundingSource: '',
      };
    }
    const visaType = String(record.Visa_Type || '').trim();
    const visaUpper = visaType.toUpperCase();
    const visaNumbers = (visaUpper.match(/\b\d{3}\b/g) || []);
    const hasRefugeeWord = visaUpper.includes('REFUGEE');
    const fundingSourceRaw = String(record.Funding_Source || '').trim();
    const fundingSourceUpper = fundingSourceRaw.toUpperCase();
    const fundingSourcePrefix = fundingSourceUpper.charAt(0);
    const applicationType = String(record.Application_Type || '').trim();
    const applicationTypeUpper = applicationType.toUpperCase();
    const applicationStatus = String(record.Application_Status || '').trim();
    const applicationStatusUpper = applicationStatus.toUpperCase();
    const isSpecialVisa =
      SPECIAL_VISA_TOKENS.some((token) => visaUpper.includes(token)) ||
      visaUpper.includes('NO LIMITATION') ||
      visaUpper.includes('REF');
    const allowsPartTime =
      visaNumbers.some((code) => INTERNATIONAL_PART_TIME_VISA_NUMBERS.has(code));
    const isBridgingVisa =
      visaNumbers.includes('010') ||
      visaNumbers.includes('020') ||
      visaUpper.includes('BRA') ||
      visaUpper.includes('BR2');
    let status = '';
    if (hasRefugeeWord || visaNumbers.some((code) => DOMESTIC_VISA_NUMBERS.has(code))) {
      status = 'international_special';
    } else if (visaNumbers.some((code) => INTERNATIONAL_VISA_NUMBERS.has(code))) {
      status = 'international_sv';
    } else if (isBridgingVisa) {
      if (fundingSourcePrefix === 'F') {
        status = 'international_sv';
      } else if (applicationTypeUpper.includes('OE INTERNATIONAL') || applicationStatusUpper.includes('INTERNATIONAL')) {
        status = 'international_sv';
      } else if (fundingSourceUpper === 'SHD') {
        status = 'domestic_normal';
      } else if (fundingSourceUpper === 'CSP') {
        status = 'domestic_csp';
      } else if (isSpecialVisa) {
        status = 'international_special';
      } else {
        status = 'international_sv';
      }
    } else if (isSpecialVisa) {
      status = 'international_special';
    } else if (fundingSourceUpper === 'SHD') {
      status = 'domestic_normal';
    } else if (fundingSourceUpper === 'CSP') {
      status = 'domestic_csp';
    } else if (applicationTypeUpper.includes('OE INTERNATIONAL')) {
      status = 'international_sv';
    } else {
      status = 'international_sv';
    }
    const domesticFees =
      status === 'domestic_normal' ||
      status === 'domestic_csp' ||
      status === 'international_special';
    const domesticLoadAllowed = domesticFees || allowsPartTime;
    const loadNote = allowsPartTime
      ? 'Part-time study permitted for this visa (work is the priority). Single units may be allowed and employers may cover fees.'
      : '';
    const feeLabel =
      status === 'domestic_normal'
        ? 'Fee Type: Domestic rates'
        : status === 'domestic_csp'
          ? 'Fee Type: Domestic student paying CSP rates'
          : status === 'international_special'
            ? `Fee Type: International student on ${visaType || 'special visa'} paying domestic fees`
            : 'Fee Type: International student rates';
    return {
      feeStatus: status,
      domesticFees,
      domesticLoad: domesticLoadAllowed,
      feeLabel,
      loadNote,
      visaType,
      visaShortLabel: getVisaShortLabel(visaType),
      isBridgingVisa,
      fundingSource: fundingSourceRaw,
      fundingSourcePrefix,
      applicationType,
      applicationStatus,
    };
  };
  const isInternationalStudent = (record) => {
    const details = getFeeStatusDetails(record);
    if (details.feeStatus) return !details.domesticFees;
    return !!(
      record &&
      (record.In_AllInternationals ||
        record.In_InternationalsAccepted ||
        record.In_AllInternationals === 'Yes' ||
        record.In_InternationalsAccepted === 'Yes')
    );
  };

  const getStudentDisplayName = (record) => {
    if (!record) return '';
    const given = toProperCase(record.Given_Name || '');
    const family = String(record.Family_Name || '').toUpperCase();
    return [given, family].filter(Boolean).join(' ').trim();
  };

  const getStudentFirstName = (record) => {
    const given = String(record?.Given_Name || '').trim();
    return given.split(/\s+/).filter(Boolean)[0] || '';
  };

  const setTimetableHeading = (mode) => {
    if (!timetableTitleEl) return;
    if (mode === 'available') {
      timetableTitleEl.textContent = 'Available subjects (click to add)';
      return;
    }
    const now = new Date();
    const label = getTimetableLabel(now);
    const prepared = formatDate(now);
    timetablePreparedEl = null;
    if (!staffFacing) {
      timetableTitleEl.textContent = '';
      timetableTitleEl.appendChild(document.createTextNode(`Timetable for ${label}. Prepared `));
      const dateSpan = document.createElement('span');
      dateSpan.className = 'timetable-date';
      dateSpan.textContent = prepared;
      timetablePreparedEl = dateSpan;
      timetableTitleEl.appendChild(dateSpan);
      applyTimetableDateHighlight();
      return;
    }
    const record = getActiveStudentRecord();
    const studentId = record ? normalizeStudentId(record.Student_IDs_Unique) : '';
    const name = record ? getStudentDisplayName(record) : '';
    const studentText = [studentId, name].filter(Boolean).join(' ').trim();
    const strongText = `Timetable for ${label}`;
    timetableTitleEl.textContent = '';
    const strongEl = document.createElement('span');
    strongEl.className = 'timetable-title-strong';
    strongEl.textContent = strongText;
    timetableTitleEl.appendChild(strongEl);
    timetableTitleEl.appendChild(document.createTextNode('. Prepared '));
    const dateSpan = document.createElement('span');
    dateSpan.className = 'timetable-date';
    dateSpan.textContent = prepared;
    timetablePreparedEl = dateSpan;
    timetableTitleEl.appendChild(dateSpan);
    if (studentText) {
      timetableTitleEl.appendChild(document.createTextNode(`, for ${studentText}`));
    }
    applyTimetableDateHighlight();
  };

  const updateTimetableFees = () => {
    if (!timetableFees) return;
    const applyFeesWidth = () => {
      if (!timetableTable || !timetableFees) return;
      const rect = timetableTable.getBoundingClientRect();
      if (!rect.width) return;
      timetableFees.style.maxWidth = `${Math.ceil(rect.width)}px`;
      timetableFees.style.width = '100%';
    };
    const bodySample =
      timetableTable?.querySelector('tbody td') || timetableTable?.querySelector('td,th');
    const bodyFontSize = bodySample
      ? parseFloat(window.getComputedStyle(bodySample).fontSize)
      : 14;
    const feeFontSize = Math.max(10, bodyFontSize - 2);
    timetableFees.style.fontSize = `${feeFontSize}px`;
    const selectedCount = getSelectedRows().length;
    const threshold = getLoadThreshold();
    const fullLoadSelected = selectedCount >= threshold && threshold > 0;
    if (currentTableMode !== 'selected' || !fullLoadSelected) {
      timetableFees.hidden = true;
      timetableFees.textContent = '';
      lastFullLoadSelected = false;
      return;
    }
    if (!lastFullLoadSelected && fullLoadSelected) {
      manualFeeHidden.domestic = false;
      manualFeeHidden.international = false;
    }
    const record = getActiveStudentRecord();
    const courseInfo = staffWorkbookState.getCourseInfo();
    updateDateAlerts(courseInfo);
    const census = formatShortDate(courseInfo?.CensusDate || '');
    const censusText = census || '20/03/26';
    const censusHtml = `<span class="timetable-date">${escapeHtml(censusText)}</span>`;
    const semesterStartText =
      record ? formatLongDate(courseInfo?.Semester_Start_Date || '') : '';
    const semesterLineText =
      record && semesterStartText
        ? `Semester start date: ${formatShortDate(semesterStartText)}`
        : '';
    const priceValue = parseCreditPoints(courseInfo?.Price_per_Unit || '');
    const price =
      (priceValue && priceValue > 0 ? formatCurrency(priceValue) : '') || '$ 2,360.00';
    const cspValue = parseCreditPoints(courseInfo?.Price_per_CSP_Unit || '');
    const cspPrice =
      (cspValue && cspValue > 0 ? formatCurrency(cspValue) : '') || '$ 2,360.00';

    if (record) {
      const feeDetails = getFeeStatusDetails(record);
      const visaLabel = feeDetails.visaShortLabel || feeDetails.visaType || 'visa';
      const cancellationLine = `Cancellation Date: Census Date is ${censusHtml}`;
      let feeLine = '';
      if (feeDetails.isBridgingVisa && feeDetails.feeStatus === 'international_sv') {
        feeLine = `Fees: International student on "${escapeHtml(visaLabel)}" visa. International fees.`;
      } else if (feeDetails.feeStatus === 'domestic_csp') {
        feeLine = `Fees: Domestic student with CSP. Cost remaining per subject after government payment is ${escapeHtml(
          cspPrice
        )}.`;
      } else if (feeDetails.feeStatus === 'international_special') {
        feeLine = `Fees: International student on ${escapeHtml(
          feeDetails.visaType || 'special visa'
        )} visa. Domestic fees.`;
      } else if (feeDetails.feeStatus === 'international_sv') {
        feeLine = `Fees: International student on "${escapeHtml(visaLabel)}" visa. International fees.`;
      } else {
        feeLine = `Fees: Domestic student. ${escapeHtml(price)} per subject for domestic students.`;
      }
      timetableFees.innerHTML = '';
      const feeLineEl = document.createElement('div');
      feeLineEl.className = 'timetable-fee-line';
      feeLineEl.innerHTML = feeLine;
      timetableFees.appendChild(feeLineEl);
      const cancelEl = document.createElement('div');
      cancelEl.className = 'timetable-fee-line';
      cancelEl.innerHTML = cancellationLine;
      timetableFees.appendChild(cancelEl);
      if (semesterLineText) {
        const note = document.createElement('div');
        note.className = 'timetable-fee-note';
        note.innerHTML = `<strong>Semester start date:</strong> ${escapeHtml(
          formatShortDate(semesterStartText)
        )}`;
        timetableFees.appendChild(note);
      }
      timetableFees.hidden = false;
      applyFeesWidth();
      applyTimetableDateHighlight();
      return;
    }

    timetableFees.innerHTML = '';
    const prefix = document.createElement('div');
    prefix.className = 'timetable-fee-prefix';
    const prefixLabel = document.createElement('span');
    prefixLabel.style.fontWeight = '700';
    prefixLabel.textContent = 'Cancellation Date';
    prefix.appendChild(prefixLabel);
    prefix.appendChild(document.createTextNode(' Census Date is '));
    const censusWrap = document.createElement('span');
    censusWrap.innerHTML = censusHtml;
    prefix.appendChild(censusWrap);
    prefix.appendChild(document.createTextNode(''));
    timetableFees.appendChild(prefix);

    const feeLines = [
      {
        type: 'international',
        text: 'Fees: International student on visa. International fees.',
      },
      {
        type: 'domestic',
        text: `Fees: Domestic student. ${price} per subject for domestic students.`,
      },
    ];
    feeLines.forEach(({ type, text }) => {
      const span = document.createElement('div');
      span.className = `timetable-fee-line fee-${type}`;
      span.dataset.feeType = type;
      const feeLabel = document.createElement('span');
      feeLabel.style.fontWeight = '800';
      feeLabel.textContent = 'Fees';
      span.appendChild(feeLabel);
      const remainder = text.replace(/^Fees\b\s*/i, '');
      span.appendChild(document.createTextNode(` ${remainder}`));
      if (manualFeeHidden[type]) span.classList.add('fee-hidden');
      span.addEventListener('click', () => {
        if (span.classList.contains('fee-hidden')) return;
        manualFeeHidden[type] = true;
        span.classList.add('fee-flash');
        setTimeout(() => {
          span.classList.add('fee-hidden');
          span.classList.remove('fee-flash');
        }, 280);
      });
      timetableFees.appendChild(span);
    });
    timetableFees.hidden = false;
    lastFullLoadSelected = fullLoadSelected;
    if (record && semesterLineText) {
      const note = document.createElement('div');
      note.className = 'timetable-fee-note';
      note.textContent = semesterLineText;
      timetableFees.appendChild(note);
    }
    applyFeesWidth();
    applyTimetableDateHighlight();
  };

  const getVisibleTimetableFeesText = () => {
    if (!timetableFees || timetableFees.hidden) return '';
    const feeLines = Array.from(timetableFees.querySelectorAll('.timetable-fee-line'))
      .filter((el) => !el.classList.contains('fee-hidden'))
      .map((el) => el.textContent.trim())
      .filter(Boolean);
    const prefix = timetableFees.querySelector('.timetable-fee-prefix');
    const prefixText = prefix ? prefix.textContent.trim() : '';
    if (feeLines.length) {
      return [prefixText, ...feeLines].filter(Boolean).join(' ');
    }
    return timetableFees.textContent.trim();
  };

  const updateTimetableEmailButtons = () => {
    const record = getActiveStudentRecord();
    const shouldShow = staffFacing && currentTableMode === 'selected' && !!record;
    const primary = String(record?.Primary_Email || '').trim();
    const institute = String(record?.Institute_Email || '').trim();
    if (emailPrimaryButton) {
      emailPrimaryButton.hidden = !shouldShow;
      emailPrimaryButton.disabled = false;
      emailPrimaryButton.setAttribute('title', primary || 'No primary email on record.');
    }
    if (emailInstituteButton) {
      emailInstituteButton.hidden = !shouldShow;
      emailInstituteButton.disabled = false;
      emailInstituteButton.setAttribute(
        'title',
        institute || 'No institute email on record.'
      );
    }
    if (emailBothButton) {
      const both = [primary, institute].filter(Boolean).join(', ');
      emailBothButton.hidden = !shouldShow;
      emailBothButton.disabled = false;
      emailBothButton.setAttribute(
        'title',
        both || 'Both email addresses required.'
      );
    }
  };

  const updateTimetableStaffContent = (mode) => {
    if (!staffFacing) return;
    setTimetableHeading(mode);
    updateTimetableFees();
    updateTimetableEmailButtons();
  };

  const updateHistoryOnlyPassedButton = () => {
    if (!historyOnlyPassedButton) return;
    let hasResultOrDate = false;
    if (historyTable) {
      const tableRows = Array.from(historyTable.querySelectorAll('tbody tr'));
      hasResultOrDate = tableRows.some((row) => {
        const cells = row.querySelectorAll('td');
        const resultText = cells[2]?.textContent?.trim() || '';
        const dateText = cells[3]?.textContent?.trim() || '';
        return resultText.length > 0 || dateText.length > 0;
      });
    } else {
      const rows = getHistoryRows();
      hasResultOrDate = rows.some((row) => {
        const result = String(row?.result || '').trim();
        const date = String(row?.date || '').trim();
        return result.length > 0 || date.length > 0;
      });
    }
    if (!hasResultOrDate) {
      historyOnlyPassed = false;
      historyOnlyPassedButton.disabled = true;
      historyOnlyPassedButton.classList.add('disabled');
      historyOnlyPassedButton.setAttribute('aria-disabled', 'true');
      historyOnlyPassedButton.setAttribute('aria-pressed', 'false');
      historyOnlyPassedButton.classList.remove('is-active');
      historyOnlyPassedButton.textContent = 'Hide W & N';
      return;
    }
    historyOnlyPassedButton.disabled = false;
    historyOnlyPassedButton.classList.remove('disabled');
    historyOnlyPassedButton.setAttribute('aria-disabled', 'false');
    historyOnlyPassedButton.setAttribute('aria-pressed', historyOnlyPassed ? 'true' : 'false');
    historyOnlyPassedButton.classList.toggle('is-active', historyOnlyPassed);
    historyOnlyPassedButton.textContent = historyOnlyPassed ? 'Show W & N' : 'Hide W & N';
  };

  const updateHistoryColoursButton = () => {
    if (!historyColoursButton || !historyModal) return;
    historyColoursButton.textContent = historyColoursOn ? 'Colours Off' : 'Colours On';
    historyColoursButton.setAttribute('aria-pressed', String(historyColoursOn));
    historyModal.classList.toggle('history-colours-off', !historyColoursOn);
  };

  const getSubjectName = (code) => {
    const metaName = subjectMeta[code]?.name;
    return metaName || code;
  };

  const getPresetSubjectName = (code) => {
    if (!code) return '';
    if (code.startsWith('USE')) return useDisplayNames[code] || 'Unspecified Elective';
    return getSubjectName(code);
  };

  const formatPresetLine = (code) => {
    const name = getPresetSubjectName(code);
    return name && name !== code ? `${code} ${name}` : code;
  };

  const codeModalPresets = {
    fmpAssoc: [
      'BIT105',
      'BIT106',
      'BIT108',
      'BIT111',
      'BIT112',
      'BIT121',
      'BIT213',
      'BIT230',
      'BIT231',
      'BIT233',
      'BIT235',
      'BIT241',
      'BIT242',
      'BIT244',
      'BIT245',
      'BIT358',
    ],
    fmpDip: ['BIT106', 'BIT111', 'BIT121', 'BIT230', 'BIT231', 'BIT233', 'BIT242', 'BIT245'],
    mpDip: ['BIT105', 'BIT106', 'BIT108', 'BIT111', 'BIT121', 'BIT233', 'BIT213', 'USE101'],
    mpDipOld: ['BIT106', 'BIT111', 'BIT121', 'BIT230', 'BIT231', 'BIT233', 'BIT242', 'BIT245'],
  };

  const fillCodeInputWithPreset = (codes = []) => {
    if (!codeInput) return;
    const lines = codes.map((code) => formatPresetLine(code)).filter(Boolean).join('\n');
    codeInput.value = lines;
    codeInput.focus();
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
    const sdCaution = getSdMajorCautionMessage();
    if (sdCaution) {
      warnings.push({
        title: 'Software Development caution',
        html: `<strong class="alert-inline-title alert-title-warning">Software Development caution</strong> <span class="alert-inline-text">${escapeHtml(
          sdCaution
        )}</span>`,
      });
    }
    if (remainingNoticeUnlocked && majorDropdown) {
      const currentValue = majorDropdown.dataset.value || 'undecided';
      if (currentValue !== 'undecided') {
        const counts = getMajorStreamCounts();
        const best = getBestMajorStreamFromCounts(counts);
        if (best.count > 0) {
          const currentKey = mapDropdownValueToStreamKey(currentValue);
          if (currentKey !== best.key) {
            const currentCount = counts[currentKey] || 0;
            const currentName = getMajorNameFromKey(currentKey);
            const bestName = getMajorNameFromKey(best.key);
            warnings.push({
              title: 'Major choice',
              html: `<strong class="alert-inline-title alert-title-warning">Major choice</strong> <span class="alert-inline-text">You have ${escapeHtml(
                currentName
              )} chosen as your major, but you have studied more ${escapeHtml(
                bestName
              )} subjects (${best.count}) than ${escapeHtml(
                currentName
              )} subjects (${currentCount}). Should the major dropdown be changed?</span>`,
            });
          }
        }
      }
    }
    warningPayloads = warnings;
    refreshErrorAlerts();
  };

  const updateLoadOverageError = () => {
    overLoadError = null;
    if (completedMode) return;
    const loadThreshold = getLoadThreshold();
    const plannedCodes = Array.from(subjectState.entries())
      .filter(([, st]) => st?.toggled)
      .map(([code]) => code);
    const currentCodes = Array.from(currentEnrolmentStudentRecord.values()).filter(
      (code) => !withdrawnCurrentEnrolments.has(code)
    );
    const combined = new Set([...plannedCodes, ...currentCodes]);
    if (combined.size > loadThreshold) {
      const listItems = Array.from(combined)
        .sort()
        .map((code) => {
          const label = `${formatHistoryCode(code)} ${getSubjectName(code)}`.trim();
          return `<li>${escapeHtml(label)}</li>`;
        })
        .join('');
      overLoadError = {
        title: 'Over full load',
        html: `<p><strong class="alert-inline-title alert-title-error">Over full load</strong> <span class="alert-inline-text">There are ${combined.size} subjects selected or currently enrolled, which is above the full load of ${loadThreshold}.</span></p>${listItems ? `<ul class="alert-inline-list">${listItems}</ul>` : ''}`,
      };
    }
  };

  const updateOverCompletionError = () => {
    overCompletionError = null;
    const reasons = [];
    const formatCodeLabel = (code) => {
      const upper = String(code || '').toUpperCase();
      if (!upper) return '';
      if (upper.startsWith('USE')) {
        const label = useDisplayNames[upper] || 'Unspecified Elective (USE)';
        return `${upper} - ${label}`;
      }
      return `${upper} - ${getSubjectName(upper)}`;
    };
    const formatCodeList = (codes) => {
      const unique = Array.from(new Set(codes.map((c) => String(c || '').toUpperCase()).filter(Boolean))).sort();
      const maxItems = 8;
      const shown = unique.slice(0, maxItems).map(formatCodeLabel);
      const extra = unique.length - shown.length;
      return shown.join(', ') + (extra > 0 ? `, +${extra} more` : '');
    };

    const majorKey = getMajorKeyFromUi();
    const majorSet = new Set(majorLayouts[majorKey] || []);
    const slotCodes = getElectiveSlotCodes(majorKey);
    const useCodes = electivePlaceholderState.filter(Boolean).map((code) => code.toUpperCase());
    const completedElectives = slotCodes
      .filter((code) => code && !majorSet.has(code))
      .filter((code) => subjectState.get(code)?.completed)
      .map((code) => code.toUpperCase());
    const uniqueElectives = new Set([...useCodes, ...completedElectives]);
    if (uniqueElectives.size > programRequirements.elective) {
      reasons.push(
        `<li><strong>More than 4 electives completed</strong> — ${uniqueElectives.size} electives counted: ${escapeHtml(
          formatCodeList(Array.from(uniqueElectives))
        )}</li>`
      );
    }

    const passCounts = new Map();
    const creditPassIds = new Set();
    const passNonCreditIds = new Set();
    manualEntryResults.forEach((entry) => {
      if (!entry?.id) return;
      const id = String(entry.id).toUpperCase();
      const status = getGradeStatus(entry.result);
      if (status !== 'pass') return;
      passCounts.set(id, (passCounts.get(id) || 0) + 1);
      const token = normalizeGradeToken(entry.result);
      if (creditGradeTokens.has(token)) {
        creditPassIds.add(id);
      } else if (token) {
        passNonCreditIds.add(id);
      }
    });
    const duplicatePasses = Array.from(passCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([id]) => id);
    if (duplicatePasses.length) {
      reasons.push(
        `<li><strong>Same subject passed twice</strong> — ${escapeHtml(
          formatCodeList(duplicatePasses)
        )}</li>`
      );
    }
    const creditedThenPassed = Array.from(creditPassIds).filter((id) => passNonCreditIds.has(id));
    if (creditedThenPassed.length) {
      reasons.push(
        `<li><strong>Passed a subject already credited</strong> — ${escapeHtml(
          formatCodeList(creditedThenPassed)
        )}</li>`
      );
    }

    if (reasons.length) {
      const reasonList = reasons.join('');
      overCompletionError = {
        title: 'More than 24 subjects required',
        html: `<p><strong class="alert-inline-title alert-title-error">More than 24 subjects required</strong> <span class="alert-inline-text">This student appears to exceed the 24-subject program cap. Likely reason(s):</span></p><ul class="alert-inline-list">${reasonList}</ul>`,
      };
    }
    refreshErrorAlerts();
  };

  const updateCreditTransferWarning = () => {
    creditTransferWarning = null;
    creditTransferWarningActive = false;
    const completedCodes = Array.from(subjectState.entries())
      .filter(([, st]) => st?.completed)
      .map(([code]) => code);
    if (!completedCodes.length) return;
    const attempted = new Set();
    completedCodes.forEach((code) => attempted.add(code));
    manualEntryMeta.forEach((_meta, code) => {
      if (code) attempted.add(code);
    });
    manualEntryResults.forEach((entry) => {
      if (entry?.id) attempted.add(entry.id);
    });
    workbookCurrent.forEach((_meta, code) => attempted.add(code));
    manualEntryCurrent.forEach((_meta, code) => attempted.add(code));

    const issues = [];
    completedCodes.forEach((code) => {
      const prereqsList = prerequisites[code] || [];
      if (!prereqsList.length) return;
      const missing = prereqsList.filter((pre) => !attempted.has(pre));
      if (missing.length) issues.push({ code, missing });
    });

    if (!issues.length) return;
    creditTransferWarningActive = true;
    const maxItems = 6;
    const items = issues.slice(0, maxItems);
    const extraCount = issues.length - items.length;
    const listHtml = items
      .map((item) => {
        const missingList = item.missing
          .map((code) => `${code} - ${getSubjectName(code)}`)
          .join(', ');
        return `<li><strong>${item.code}</strong> - ${getSubjectName(item.code)}. Missing completion of prerequisites: ${escapeHtml(
          missingList
        )}.</li>`;
      })
      .join('');
    const extraHtml = extraCount > 0 ? `<p class="alert-inline-text">Plus ${extraCount} more.</p>` : '';
    creditTransferWarning = {
      title: 'Possible missing credit transfers',
      html: `<p><strong class="alert-inline-title alert-title-warning">Possible missing credit transfers</strong> <span class="alert-inline-text">Some passed subjects have no enrolment history for all prerequisites. This may indicate missing credit transfers.</span></p><ul class="alert-inline-list">${listHtml}</ul>${extraHtml}<p class="alert-inline-text">Please check for CRT forms that have not been entered into student record yet.</p>`,
    };
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

  const getRemainingSubjectsNotPlanned = () => {
    const total = getTotalSubjectsCount();
    const completed = getCompletedCount();
    const useCredits = getUseCreditsCount();
    return Math.max(0, total - completed - useCredits);
  };

  const hasCompletedAnyChangedCodeSubject = () =>
    ['BIT213', 'BIT313', 'BIT314'].some((code) => !!subjectState.get(code)?.completed);
  const getCompletedChangedCodeSubjects = () =>
    ['BIT213', 'BIT313', 'BIT314'].filter((code) => !!subjectState.get(code)?.completed);

  const updateSubjectCounts = () => {
    if (!subjectCountsEl) return;
    const completed = getCompletedCount();
    const useCredits = getUseCreditsCount();
    const selected = getPlannedCount();
    const remaining = getRemainingSubjectsCount();
    const completedTotal = completed + useCredits;
    const activeRecord = getActiveStudentRecord();
    const creditPointsSource = activeRecord?.Credit_Points_Earned ?? creditPointsEarned;
    const creditPointsValue = parseCreditPoints(creditPointsSource);
    const creditSubjects =
      creditPointsValue === null ? null : parseFloat((creditPointsValue / 12).toFixed(2));
    const creditMismatch =
      creditSubjects !== null &&
      Number.isFinite(creditSubjects) &&
      Math.abs(creditSubjects - completedTotal) > 0.01;
    const formatCountValue = (value) =>
      Number.isInteger(value) ? value.toString() : value.toFixed(1);
    const hasAny = completedTotal > 0 || selected > 0;
    if (!hasAny) {
      subjectCountsEl.innerHTML = '';
      subjectCountsEl.classList.remove('is-visible');
      document.querySelectorAll('.student-summary-credit').forEach((el) => {
        el.classList.remove('counts-mismatch');
      });
      overCompletionError = null;
      overLoadError = null;
      refreshErrorAlerts();
      setAlertMessages('data', []);
      renderAlertButton('data');
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
    const remainingCoreMajorCodes = Array.from(
      new Set(getRemainingRows().map((row) => row.id))
    ).filter((code) => !selectedCodes.includes(code));
    const remainingElectiveCodes = Array.from(
      new Set(getRemainingElectiveRows().map((row) => row.id))
    );

    const formatListRows = (codes) =>
      codes
        .map((code) => `${formatHistoryCode(code)} ${getSubjectName(code)}`.trim())
        .sort((a, b) => a.localeCompare(b))
        .map((line) => `<div class="ui-tooltip-row">${escapeHtml(line)}</div>`)
        .join('');

    const formatListHtml = (title, codes) => {
      if (!codes.length) {
        return `<div class="ui-tooltip-row ui-tooltip-title">${escapeHtml(title)}: none</div>`;
      }
      return `<div class="ui-tooltip-row ui-tooltip-title">${escapeHtml(title)}</div>${formatListRows(
        codes
      )}`;
    };

    const completedTooltip = formatListHtml('Completed', Array.from(completedCodes));
    const selectedTooltip = formatListHtml('Selected', selectedCodes);
    const remainingTooltip = [
      formatListHtml('Core and Major remaining', remainingCoreMajorCodes),
      '<div class="ui-tooltip-separator"></div>',
      formatListHtml('Electives remaining', remainingElectiveCodes),
    ].join('');

    subjectCountsEl.innerHTML = '';
    const lineOne = document.createElement('div');
    lineOne.className = 'subject-counts-line';
    const completedSpan = document.createElement('span');
    completedSpan.className = 'subject-counts-item';
    completedSpan.textContent = `${completedTotal} subjects completed`;
    completedSpan.setAttribute('data-tooltip-html', completedTooltip);
    if (creditMismatch) {
      completedSpan.classList.add('counts-mismatch');
    }
    const selectedSpan = document.createElement('span');
    selectedSpan.className = 'subject-counts-item';
    selectedSpan.textContent = `${selected} selected`;
    selectedSpan.setAttribute('data-tooltip-html', selectedTooltip);
    lineOne.appendChild(completedSpan);
    lineOne.appendChild(document.createTextNode(', '));
    lineOne.appendChild(selectedSpan);

    const lineTwo = document.createElement('div');
    lineTwo.className = 'subject-counts-line';
    const remainingSpan = document.createElement('span');
    remainingSpan.className = 'subject-counts-item';
    remainingSpan.textContent = `${remaining} remaining`;
    remainingSpan.setAttribute('data-tooltip-html', remainingTooltip);
    lineTwo.appendChild(remainingSpan);

    subjectCountsEl.appendChild(lineOne);
    subjectCountsEl.appendChild(lineTwo);
    subjectCountsEl.classList.add('is-visible');
    initTooltips();
    updateMajorStreamInsights();
    document.querySelectorAll('.student-summary-credit').forEach((el) => {
      el.classList.toggle('counts-mismatch', creditMismatch);
    });
    const dataAlerts = [];
    if (creditMismatch) {
      const creditPointsLabel = formatCountValue(creditPointsValue ?? 0);
      const creditSubjectsLabel =
        creditSubjects === null ? '' : formatCountValue(creditSubjects);
      dataAlerts.push({
        title: 'Credit points mismatch',
        html: `<p><strong class="alert-inline-title alert-title-error">Credit points mismatch</strong> <span class="alert-inline-text">Credit points earned (${escapeHtml(
          creditPointsLabel
        )}) = ${escapeHtml(creditSubjectsLabel)} subject${creditSubjects === 1 ? '' : 's'}, but completed count is ${escapeHtml(
          completedTotal
        )}.</span></p>`,
      });
    }
    setAlertMessages('data', dataAlerts);
    renderAlertButton('data');
    updateCreditTransferWarning();
    updateLoadOverageError();
    updateOverCompletionError();
    if (activeRecord) {
      renderStudentPreviewHtml(formatStudentSummary(activeRecord));
    }
    const feeDetails = activeRecord ? getFeeStatusDetails(activeRecord) : {};
    {
      const { codes, info } = splitInfoMessages(buildInfoMessages(activeRecord || {}, feeDetails));
      setAlertMessages('info', info);
      setAlertMessages('codes', codes);
    }
    renderAlertButton('info');
    renderAlertButton('codes');
  };

  const getLoadThreshold = () => {
    const base = Math.max(1, fullLoadCap || 4);
    const remaining = getRemainingSubjectsNotPlanned();
    if (remaining > 0 && remaining < 4) return remaining;
    return base;
  };

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
    capstoneYearError = null;
    if (completedMode) {
      refreshErrorAlerts();
      return;
    }

    const remaining = getRemainingSubjectsCount();
    const remainingNotPlanned = getRemainingSubjectsNotPlanned();
    const plannedCount = getPlannedCount();
    const loadThreshold = getLoadThreshold();
    const bit371Remaining = !subjectState.get('BIT371')?.completed;
    const bit372Remaining = !subjectState.get('BIT372')?.completed;
    if (remainingNotPlanned > 0 && remainingNotPlanned < 4 && bit371Remaining && bit372Remaining) {
      capstoneYearError = {
        title: 'Capstone sequence spans two semesters',
        html: `<p><strong class="alert-inline-title alert-title-error">Capstone sequence spans two semesters</strong> <span class="alert-inline-text">Both BIT371 and BIT372 are still required. These capstone subjects run in sequence across two semesters, so they cannot be completed in a single semester even when fewer than 4 subjects remain.</span></p>`,
      };
    }

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
    updatePassForEnrolmentsAvailability();
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
      completedModeButton.style.position = '';
      completedModeButton.style.left = '';
      completedModeButton.style.top = '';
      completedModeButton.style.maxWidth = '';
      return;
    }
    if (completedModeStickyTop === null) {
      const rect = completedModeButton.getBoundingClientRect();
      completedModeStickyTop = rect.top + window.scrollY;
    }
    const shouldStick = window.scrollY + 10 >= completedModeStickyTop;
    completedModeButton.classList.toggle('completed-mode-stuck', shouldStick);
    completedModeButton.style.position = '';
    completedModeButton.style.left = '';
    completedModeButton.style.top = '';
    completedModeButton.style.maxWidth = '';
  };

  const updateCompletedModeUI = () => {
    if (!completedModeButton) return;
    completedModeButton.textContent = completedMode ? 'History mode' : 'Clicking mode';
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
        ? 'Show # semesters remaining (active)'
        : 'Show # semesters remaining';
      semCountsLabel.classList.toggle('active', showSemCounts);
    }
  };

  const updatePassForEnrolmentsIndicator = () => {
    const label = passForEnrolmentsToggle?.closest('.toggle-row')?.querySelector('.switch-label');
    if (!label) return;
    const highlight = passForEnrolmentsEnabled && passForEnrolmentsOverrides.size > 0;
    label.classList.toggle('pass-enrolments-highlight', highlight);
  };

  const updatePassForEnrolmentsAvailability = () => {
    if (!passForEnrolmentsToggle) return;
    const hasHistory =
      getHistoryRows().length > 0 || manualEntryCurrent.size > 0 || manualEntryUnknown.length > 0;
    const hasCurrent = currentEnrolmentStudentRecord.size > 0;
    const enabled = hasHistory && hasCurrent;
    passForEnrolmentsToggle.disabled = !enabled;
    const label = passForEnrolmentsToggle.closest('.toggle-row')?.querySelector('.switch-label');
    if (label) label.classList.toggle('disabled', !enabled);
    if (!enabled && passForEnrolmentsEnabled) {
      passForEnrolmentsEnabled = false;
      passForEnrolmentsToggle.checked = false;
      passForEnrolmentsToggle.setAttribute('aria-pressed', 'false');
      applyPassForEnrolmentsState();
      return;
    }
    passForEnrolmentsToggle.checked = passForEnrolmentsEnabled && enabled;
    passForEnrolmentsToggle.setAttribute('aria-pressed', passForEnrolmentsEnabled && enabled ? 'true' : 'false');
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

    const allCurrent = new Set(Array.from(currentEnrolmentStudentRecord.values()));
    if (passForEnrolmentsEnabled) {
      allCurrent.forEach((code) => {
        if (withdrawnCurrentEnrolments.has(code)) return;
        if (!validSubjectCodes.has(code)) return;
        const st = subjectState.get(code) || { completed: false, toggled: false };
        if (st.completed) return;
        subjectState.set(code, { completed: true, toggled: st.toggled });
        passForEnrolmentsOverrides.add(code);
      });
    } else {
      allCurrent.forEach((code) => {
        if (withdrawnCurrentEnrolments.has(code)) return;
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
    const effectiveType = domesticLoad ? type : 'international';
    const canOfferFive = confirmRemaining || remaining <= 9;
    if (effectiveType === 'international' && !exceptional) {
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
          ? `<div class="pre-block"><span class="inline-strong">Major/Core:</span> Both Business Analytics | Software Development</div>`
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
      if (previousCodeByNew[id]) {
        tooltip.insertAdjacentHTML(
          'beforeend',
          `<div class="tooltip-gap"></div><div class="pre-block"><span class="tooltip-prev-heading">Previously:</span> <span class="tooltip-prev-value">${previousCodeByNew[id]}</span></div>`
        );
      }
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
    const activeRecord = getActiveStudentRecord();
    const suppsItems = formatSuppsAndHoldsItems(activeRecord?.SuppsAndHolds);
    if (suppsItems) {
      warningList.push({
        title: 'Supps and/or Holds',
        html: `<p><strong class="alert-inline-title alert-title-warning">Supps and/or Holds</strong> <span class="alert-inline-text">${suppsItems}</span></p>`,
      });
    }
    if (electiveError) errorPayloads.push(electiveError);
    if (prereqError) errorPayloads.push(prereqError);
    if (aprAppError) errorPayloads.push(aprAppError);
    if (acceptedOfferedError) errorPayloads.push(acceptedOfferedError);
    if (capstonePairError) errorPayloads.push(capstonePairError);
    if (capstoneYearError) errorPayloads.push(capstoneYearError);
    if (overLoadError) errorPayloads.push(overLoadError);
    if (intakeStartError) errorPayloads.push(intakeStartError);
    if (overCompletionError) errorPayloads.push(overCompletionError);
    if (availableNowError) errorPayloads.push(availableNowError);
    if (availableLoadError) errorPayloads.push(availableLoadError);
    if (timetableClashError) errorPayloads.push(timetableClashError);
    if (censusError) errorPayloads.push(censusError);
    if (weekTwoError) errorPayloads.push(weekTwoError);
    if (chainDelayError) {
      const isWarning = chainDelayError.severity === 'warning';
      if (chainDelayError.severity === 'error') {
        errorPayloads.push(chainDelayError);
      } else if (isWarning) {
        warningList.push(chainDelayError);
      }
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
    if (censusWarning) warningList.push(censusWarning);
    if (weekTwoWarning) warningList.push(weekTwoWarning);
    if (creditTransferWarning) warningList.push(creditTransferWarning);
    const repeatFailNotices = buildRepeatFailNotices();
    repeatFailNotices.warnings.forEach((msg) => warningList.push(msg));
    repeatFailNotices.errors.forEach((msg) => errorPayloads.push(msg));
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
    if (!domesticLoad) {
      studentType = 'international';
    }
    const isInternational = studentType === 'international';
    if (loadTypeDomestic) loadTypeDomestic.checked = !isInternational;
    if (loadTypeInternational) loadTypeInternational.checked = isInternational;
    if (loadTypeDomestic) loadTypeDomestic.disabled = !domesticLoad;
    if (loadTypeInternational) loadTypeInternational.disabled = false;
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
    const type = !domesticLoad
      ? 'international'
      : loadTypeInternational && loadTypeInternational.checked
        ? 'international'
        : 'domestic';
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
    const dropZoneTooltip = document.createElement('div');
    dropZoneTooltip.className = 'drop-zone-tooltip';
    dropZoneTooltip.style.position = 'absolute';
    dropZoneTooltip.style.pointerEvents = 'none';
    dropZoneTooltip.style.background = 'rgba(0,0,0,0.85)';
    dropZoneTooltip.style.color = '#fff';
    dropZoneTooltip.style.fontSize = '12px';
    dropZoneTooltip.style.lineHeight = '1.3';
    dropZoneTooltip.style.padding = '8px 10px';
    dropZoneTooltip.style.borderRadius = '6px';
    dropZoneTooltip.style.whiteSpace = 'pre-line';
    dropZoneTooltip.style.maxWidth = '320px';
    dropZoneTooltip.style.zIndex = '5';
    dropZoneTooltip.style.display = 'none';
    dropZone.appendChild(dropZoneTooltip);
    let dropZoneTooltipTarget = null;
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
    dropZone.addEventListener('click', async () => {
      if (!window.location.protocol.startsWith('http') && !isFileProtocol) return;
      if (isStudentModeParam) return;
      if (dropSidebar) dropSidebar.classList.add('is-active');
      if (staffFacing) {
        if (hasDirectoryPicker()) {
          if (!staffFolderHandle) {
            try {
              staffFolderHandle = await staffHandleStore.getHandle(STAFF_HANDLE_KEY);
            } catch {
              staffFolderHandle = null;
            }
          }
          if (!staffFolderHandle) {
            const prompted = await promptForDirectoryHandle({ sourceOnly: false });
            if (prompted) return;
          } else {
            const loaded = await loadFromStoredDirectoryHandle({ sourceOnly: false });
            if (loaded) return;
          }
        }
        loadFileLocationsFromSite({ sourceOnly: false });
      } else {
        openSourceFilePicker();
      }
    });
    dropZone.addEventListener('dblclick', async () => {
      if (!window.location.protocol.startsWith('http') && !isFileProtocol) return;
      if (isStudentModeParam || !staffFacing) return;
      if (dropSidebar) dropSidebar.classList.add('is-active');
      if (hasDirectoryPicker()) {
        const loaded = await loadFromStoredDirectoryHandle({ sourceOnly: true });
        if (loaded) return;
        const prompted = await promptForDirectoryHandle({ sourceOnly: true });
        if (prompted) return;
      }
      loadFileLocationsFromSite({ sourceOnly: true });
    });
    dropZone.addEventListener('drop', (e) => {
      if (dropSidebar) dropSidebar.classList.add('is-active');
      const files = Array.from(e.dataTransfer?.files || []);
      if (!files.length) {
        renderDropZoneStatus(['No files detected in drop.']);
        return;
      }
      const locationsFile = files.find((file) => isFileLocationsName(file?.name || ''));
      if (locationsFile) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const text = String(event.target?.result || '');
          await loadFileLocationsFromText(text, { sourceOnly: false });
          const remaining = files.filter((file) => file !== locationsFile);
          if (remaining.length) handleSourceFilesSelection(remaining);
        };
        reader.readAsText(locationsFile);
        return;
      }
      handleSourceFilesSelection(files);
    });

    dropZone.addEventListener('mousemove', (e) => {
      if (dropZoneTooltip.style.display !== 'block') return;
      dropZoneTooltip.style.left = `${e.offsetX + 12}px`;
      dropZoneTooltip.style.top = `${e.offsetY + 12}px`;
    });
    dropZone.addEventListener('mouseover', (e) => {
      const target = e.target?.closest?.('.drop-zone-line');
      if (!target || !target.dataset.tooltip) return;
      dropZoneTooltipTarget = target;
      dropZoneTooltip.textContent = target.dataset.tooltip;
      dropZoneTooltip.style.display = 'block';
    });
    dropZone.addEventListener('mouseout', (e) => {
      const target = e.target?.closest?.('.drop-zone-line');
      if (!target || target !== dropZoneTooltipTarget) return;
      dropZoneTooltipTarget = null;
      dropZoneTooltip.style.display = 'none';
    });
  };

  initDropZone();
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
    const tooltipTargets = Array.from(
      document.querySelectorAll('[data-tooltip], [data-tooltip-html]')
    );
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
    manualEntryResults: manualEntryResults.map((entry) => ({ ...entry })),
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
    manualEntryResults = Array.isArray(snapshot.manualEntryResults)
      ? snapshot.manualEntryResults.map((entry) => ({ ...entry }))
      : [];
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
    resetAvailableListSnapshot();
    currentEnrolmentStudentRecord.clear();
    withdrawnCurrentEnrolments.clear();
    remainingNoticeUnlocked = false;
    clearAlertState();
    // Reset in-memory state first so all downstream UI refreshes read from the new truth.
    electivePlaceholderState = ['', '', '', ''];
    electiveBitState = ['', '', '', ''];
    manualEntryAliases.clear();
    manualEntryMeta.clear();
    manualEntryCurrent.clear();
    workbookCurrent.clear();
    manualEntryUnknown.length = 0;
    manualEntryResults = [];
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

  const showEmailScriptsAccessModal = () => {
    if (!emailScriptsAccessModal) return;
    emailScriptsAccessModal.classList.add('show');
    emailScriptsAccessModal.setAttribute('aria-hidden', 'false');
    const focusTarget = closeEmailScriptsAccessCta || closeEmailScriptsAccessModal;
    if (focusTarget) focusTarget.focus();
  };

  const hideEmailScriptsAccessModal = () => {
    if (!emailScriptsAccessModal) return;
    emailScriptsAccessModal.classList.remove('show');
    emailScriptsAccessModal.setAttribute('aria-hidden', 'true');
  };

  const EMAIL_SCRIPTS_EXTRA_ROWS = [
    { key: 'credit-transfer-sign-return', label: 'Credit Transfer - Please sign and return' },
    { key: 'credit-transfers-returned', label: 'Credit Transfers Returned' },
    { key: 'suspended-students', label: 'Suspended students', dividerAfter: true },
    { key: 'username-password-wifi-outlook-moodle-computers', label: 'Username and Password - W-Fi, Outlook, Moodle, computers' },
    { key: 'mp-outlook-email', label: 'MP outlook email' },
    { key: 'who-to-contact-for-help', label: 'Who to contact for help?' },
    { key: 'transcript-mid-course-student-request', label: 'Transcript - mid course. Student request' },
    { key: 'personal-details-change-your-details', label: 'Personal Details - change your details', dividerAfter: true },
    { key: 'new-students-1-of-3-general-information', label: '1. New Students 1 of 3 - General Information' },
    { key: 'new-students-2-of-3-non-fmp-choosing-subjects', label: '2. New Students 2 of 3 - Non-FMP - Choosing subjects' },
    { key: 'new-students-2-of-3-fmp-choosing-subjects', label: '3. New Students 2 of 3 - FMP - Choosing subjects' },
    { key: 'new-students-3-of-3-faqs', label: '4. New students 3 of 3 - FAQs' },
    { key: 'new-students-fyi-hold-onto-me', label: '5. New students - FYI. Hold onto me' },
    { key: 'mp-diploma-1-semesters-1-and-2', label: 'MP Diploma 1 - Semesters 1 and 2' },
    { key: 'mp-diploma-2-course-structure', label: 'MP Diploma 2 - Course Structure' },
    { key: 'mp-diploma-3-class-options-semesters-1-and-2', label: 'MP Diploma 3 - Class Options. Semesters 1 & 2' },
    { key: 'mp-diploma-4-revising-bit-course-structure', label: 'MP Diploma 4 - Revising the BIT course structure' },
    { key: 'deferred-and-returning-students', label: 'Deferred and returning students' },
    { key: 'not-in-oe-dashboard-enrolment-applications-image-free', label: 'Not in OE Dashboard but in Enrolment Applications - image free' },
  ];

  const EMAIL_SCRIPTS_SECTION_HEADINGS = {
    'supports-at-risk': [
      'Supports (at risk)',
      'Supports (at risk) - Counselling etc.',
      'Supports(at risk)',
    ],
    'credit-transfer-sign-return': ['Credit Transfer - Please sign and return'],
    'credit-transfers-returned': ['Credit Transfers Returned'],
    'transcript-mid-course-student-request': ['Transcript - mid course. Student request'],
    'personal-details-change-your-details': ['Personal Details'],
    'username-password-wifi-outlook-moodle-computers': [
      'Username and Password - W-Fi, Outlook, Moodle, computers',
      'Username and Password - Wi-Fi, Outlook, Moodle, computers',
    ],
    'mp-outlook-email': ['MP outlook email'],
    'who-to-contact-for-help': ['Who to contact for help?'],
    'not-in-oe-dashboard-enrolment-applications-image-free': [
      'Not in OE Dashboard but in Enrolment Applications - image free',
    ],
    'suspended-students': ['Suspended students'],
    'new-students-1-of-3-general-information': [
      'New Students 1 of 3 - General Information',
      '1. New Students 1 of 3 - General Information',
    ],
    'new-students-2-of-3-non-fmp-choosing-subjects': [
      'New Students 2 of 3 - Non-FMP - Choosing subjects',
      '2. New Students 2 of 3 - Non-FMP - Choosing subjects',
    ],
    'new-students-2-of-3-fmp-choosing-subjects': [
      'New Students 2 of 3 - FMP - Choosing subjects',
      '3. New Students 2 of 3 - FMP - Choosing subjects',
    ],
    'new-students-3-of-3-faqs': [
      'New students 3 of 3 - FAQs',
      '4. New students 3 of 3 - FAQs',
    ],
    'new-students-fyi-hold-onto-me': [
      'New students - FYI. Hold onto me',
      '5. New students - FYI. Hold onto me',
    ],
    'mp-diploma-1-semesters-1-and-2': ['MP Diploma 1 - Semesters 1 and 2'],
    'mp-diploma-2-course-structure': ['MP Diploma 2 - Course Structure'],
    'mp-diploma-3-class-options-semesters-1-and-2': ['MP Diploma 3 - Class Options. Semesters 1 & 2'],
    'mp-diploma-4-revising-bit-course-structure': ['MP Diploma 4 - Revising the BIT course structure'],
    'deferred-and-returning-students': ['Deferred and returning students'],
  };

  const createEmailScriptsActionIcon = (kind) => {
    const span = document.createElement('span');
    span.className = kind === 'copy' ? 'clipboard-icon' : 'email-icon';
    span.setAttribute('aria-hidden', 'true');
    if (kind === 'copy') {
      span.innerHTML = '<svg viewBox="0 0 24 24" role="img" focusable="false"><path d="M9 2h6a2 2 0 0 1 2 2h2a1 1 0 0 1 1 1v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1h2a2 2 0 0 1 2-2zm0 2a1 1 0 0 0-1 1v1h8V5a1 1 0 0 0-1-1H9z" fill="currentColor" /></svg>';
    } else {
      span.innerHTML = '<svg viewBox="0 0 24 24" role="img" focusable="false"><path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v.01L12 12l9-4.99V7H3zm18 10V9.25l-8.5 4.72a1 1 0 0 1-1 0L3 9.25V17h18z" fill="currentColor" /></svg>';
    }
    return span;
  };

  const renderEmailScriptsExtraRows = () => {
    if (!emailScriptsExtraRowsHost) return;
    emailScriptsExtraRowsHost.innerHTML = '';
    EMAIL_SCRIPTS_EXTRA_ROWS.forEach((rowConfig) => {
      const row = document.createElement('div');
      row.className = 'email-scripts-access-row';
      if (rowConfig.dividerAfter) row.classList.add('email-scripts-access-divider');
      row.setAttribute('role', 'listitem');

      const text = document.createElement('div');
      text.className = 'email-scripts-access-text';
      text.textContent = rowConfig.label;
      row.appendChild(text);

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'clear-button secondary email-scripts-access-icon email-scripts-section-copy';
      copyBtn.dataset.sectionKey = rowConfig.key;
      copyBtn.dataset.sectionLabel = rowConfig.label;
      copyBtn.setAttribute('aria-label', `Copy ${rowConfig.label} text to clipboard`);
      copyBtn.appendChild(createEmailScriptsActionIcon('copy'));
      row.appendChild(copyBtn);

      const emailBtn = document.createElement('button');
      emailBtn.type = 'button';
      emailBtn.className = 'clear-button secondary email-scripts-access-icon email-scripts-section-email';
      emailBtn.dataset.sectionKey = rowConfig.key;
      emailBtn.dataset.sectionLabel = rowConfig.label;
      emailBtn.setAttribute('aria-label', `Email ${rowConfig.label} text`);
      emailBtn.appendChild(createEmailScriptsActionIcon('email'));
      row.appendChild(emailBtn);

      emailScriptsExtraRowsHost.appendChild(row);
    });
  };
  renderEmailScriptsExtraRows();

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
  const updateRemainingColoursButton = () => {
    if (!remainingColoursButton || !remainingModal) return;
    remainingColoursButton.textContent = remainingColoursOn ? 'Colours Off' : 'Colours On';
    remainingColoursButton.setAttribute('aria-pressed', String(remainingColoursOn));
    remainingModal.classList.toggle('remaining-colours-off', !remainingColoursOn);
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
        const status = getGradeStatus(grade);
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
      extractedEntries = lines.flatMap((line) => {
        const codes = (line.toUpperCase().match(manualCodeRegexGlobal) || []);
        if (!codes.length) return [];
        const lineStatus = getGradeStatus(line);
        const status = hasAnyGradeToken && !lineStatus ? 'current' : (lineStatus || 'pass');
        return codes.map((code) => ({ rawCode: code, grade: '', date: '', status }));
      });
    }

    const resolvedSubjectCodes = [];
    const resolvedUseCodes = [];
    const seenSubjects = new Set();
    const seenUses = new Set();
    const metaEntries = new Map();
    const aliasEntries = new Map();
    const currentEntries = new Map();
    const failCountsN = new Map();
    const resultEntries = [];
    const unknownEntries = [];

    extractedEntries.forEach(({ rawCode, grade, date, status }) => {
      const { mapped, original } = resolveLegacyCode(rawCode);
      if (!mapped) return;
      const normalizedGrade = normalizeGradeToken(grade);
      if (status !== 'current' && validSubjectCodes.has(mapped)) {
        if (normalizedGrade === 'N') {
          failCountsN.set(mapped, (failCountsN.get(mapped) || 0) + 1);
        }
      }
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
        if (normalizedGrade || date) {
          const existing = metaEntries.get(mapped) || {};
          metaEntries.set(mapped, {
            result: normalizedGrade || existing.result || '',
            date: date || existing.date || '',
          });
        }
        if (normalizedGrade) {
          resultEntries.push({ id: mapped, result: normalizedGrade, date: date || '' });
        }
        return;
      }
      if (!validSubjectCodes.has(mapped)) return;
      if (!seenSubjects.has(mapped)) {
        if (status === 'pass') {
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
      if (normalizedGrade) {
        resultEntries.push({ id: mapped, result: normalizedGrade, date: date || '' });
      }
    });

    if (currentEntries.size && resultEntries.length) {
      const resultsByCode = new Set(resultEntries.map((entry) => entry.id));
      currentEntries.forEach((_meta, code) => {
        if (resultsByCode.has(code)) currentEntries.delete(code);
      });
    }

    return {
      resolvedSubjectCodes,
      resolvedUseCodes,
      metaEntries,
      aliasEntries,
      currentEntries,
      failCountsN,
      resultEntries,
      unknownEntries,
    };
  };

  const parseCurrentEntriesFromResults = (raw) => {
    const safeRaw = (raw || '').toString();
    if (!/\r?\n/.test(safeRaw) && safeRaw.includes(',')) {
      const segments = safeRaw
        .split(',')
        .map((segment) => segment.trim())
        .filter(Boolean);
      const hasAnyGradeToken = segments.some((segment) => !!getGradeStatus(segment));
      if (hasAnyGradeToken) {
        const currentEntries = new Map();
        segments.forEach((segment) => {
          if (getGradeStatus(segment)) return;
          const match = segment.toUpperCase().match(manualCodeRegex);
          if (!match) return;
          const { mapped } = resolveLegacyCode(match[0]);
          if (!mapped) return;
          const dateToken = extractDateToken(segment);
          currentEntries.set(mapped, { date: dateToken || '' });
        });
        if (currentEntries.size) return currentEntries;
      }
    }
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
    if (currentEntries.size) return currentEntries;

    // Fallback: if any grades exist in the text, treat code-only lines as current.
    const hasAnyGradeToken = lines.some((line) => !!getGradeStatus(line));
    if (!hasAnyGradeToken) return currentEntries;
    lines.forEach((line) => {
      const upper = line.toUpperCase();
      const match = upper.match(manualCodeRegex);
      if (!match) return;
      if (getGradeStatus(line)) return;
      const { mapped } = resolveLegacyCode(match[0]);
      if (!mapped) return;
      currentEntries.set(mapped, { date: '' });
    });
    return currentEntries;
  };

  const applyCodes = () => {
    if (!codeInput) return;
    resetAvailableListSnapshot();
    remainingNoticeUnlocked = false;
    const raw = codeInput.value || '';
    manualEntryCurrent.clear();
    workbookCurrent.clear();
    manualEntryUnknown.length = 0;
    const parsed = parseManualEntriesFromText(raw);
    parsed.aliasEntries.forEach((aliases, mapped) => {
      aliases.forEach((original) => recordManualAlias(mapped, original));
    });
    parsed.currentEntries.forEach((meta, mapped) => manualEntryCurrent.set(mapped, meta));
    refreshCurrentEnrolmentStudentRecord();
    parsed.unknownEntries.forEach((entry) => addUnknownEntry(entry));
    manualEntryResults = parsed.resultEntries ? [...parsed.resultEntries] : [];
    parsed.metaEntries.forEach((meta, mapped) => {
      const existing = manualEntryMeta.get(mapped) || {};
      manualEntryMeta.set(mapped, {
        result: meta.result || existing.result || '',
        date: meta.date || existing.date || '',
        failCountN: parsed.failCountsN?.get(mapped) || existing.failCountN || 0,
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
    const isCurrentRecord = currentEnrolmentStudentRecord.has(id);
    if (!completedMode && notThisSem) return;
    if (areElectivesFull() && !placeholder && isElectivesGridCell(cell)) {
      const st = subjectState.get(id);
      if (!(st?.completed || st?.toggled)) return;
    }
    const placeholders = placeholder ? getElectivePlaceholders() : [];
    const placeholderIdx = placeholder ? placeholders.indexOf(cell) : -1;
    // Placeholder/history edits are only allowed in History mode.
    if (!completedMode && placeholder) return;
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
      if (isCurrentRecord) {
        const st = subjectState.get(id) || { completed: false, toggled: false };
        if (st.completed) {
          subjectState.set(id, { completed: false, toggled: false });
        } else if (st.toggled) {
          subjectState.set(id, { completed: true, toggled: false });
        } else {
          subjectState.set(id, { completed: false, toggled: true });
        }
        withdrawnCurrentEnrolments.delete(id);
        applySubjectStateToCells();
        updateBitStateAfterToggle(cell);
        setElectiveCredits(buildElectiveAssignments(), true);
        updateElectiveWarning();
        updateSelectedList();
        conditionalRecompute({ force: true, usePlanned: false });
        updateResetState();
        return;
      }
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
      if (
        (id === 'BIT371' && subjectState.get('BIT372')?.toggled) ||
        (id === 'BIT372' && subjectState.get('BIT371')?.toggled)
      ) {
        const pair = id === 'BIT371' ? 'BIT372' : 'BIT371';
        capstonePairError = {
          title: 'Capstone selection',
          html: `<p><strong class="alert-inline-title alert-title-error">Capstone selection</strong> <span class="alert-inline-text">${id} and ${pair} cannot be selected in the same semester. Please choose one.</span></p>`,
        };
        refreshErrorAlerts();
        return;
      }
      capstonePairError = null;
      if (isCurrentRecord) {
        if (withdrawnCurrentEnrolments.has(id)) {
          withdrawnCurrentEnrolments.delete(id);
          subjectState.set(id, { completed: false, toggled: true });
        } else {
          withdrawnCurrentEnrolments.add(id);
          subjectState.set(id, { completed: false, toggled: false });
        }
        applySubjectStateToCells();
        updateBitStateAfterToggle(cell);
        setElectiveCredits(buildElectiveAssignments(), true);
        updateElectiveWarning();
        updateSelectedList();
        conditionalRecompute({ force: true, usePlanned: null });
        updateResetState();
        return;
      }
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
    cell.addEventListener('click', (event) => {
      if (!completedMode) {
        const id = cell.dataset.subject || '';
        console.info('[Elective click]', {
          context: 'grid',
          id,
          electivesFull: areElectivesFull(),
          toggled: !!subjectState.get(id)?.toggled,
          completedMode,
        });
        if (id && areElectivesFull() && isElectiveId(id) && !subjectState.get(id)?.toggled) {
          const anchorRect = cell.getBoundingClientRect();
          openElectiveFullPopup('All 4 Elective slots are full, so this subject cannot be selected.', anchorRect, {
            x: event.clientX,
            y: event.clientY,
          });
          electiveFullPopupAnchor = cell;
          event.stopPropagation();
          return;
        }
      }
      handleToggle(cell);
    });
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
      if (!completedMode) {
        remainingNoticeUnlocked = true;
        const counts = getMajorStreamCounts();
        const best = getBestMajorStreamFromCounts(counts);
        const hasAnyStream = (counts.ns || 0) + (counts.ba || 0) + (counts.sd || 0) > 0;
        const currentValue = majorDropdown?.dataset?.value || 'undecided';
        const bestValue = mapStreamKeyToDropdownValue(best.key);
        if (hasAnyStream && currentValue === 'undecided' && best.count > 0) {
          setMajorDropdownSelection(bestValue);
          triggerMajorPulse();
        }
      }
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
        updateWarnings();
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
  const buildStudentMailto = async (emails, firstName) => {
    const list = (emails || []).map((email) => email.trim()).filter(Boolean);
    if (!list.length) return '';
    let body = '';
    try {
      body = await buildTimetableEmailBody(firstName);
    } catch {
      body = '';
    }
    if (!body) {
      const fallbackName = (firstName || '').trim();
      body = fallbackName ? `Hello ${fallbackName}` : 'Hello';
    }
    const subject = encodeURIComponent('Student Declaration');
    const recipients = encodeURIComponent(list.join(','));
    const encodedBody = encodeURIComponent(body);
    return `mailto:${recipients}?subject=${subject}&body=${encodedBody}`;
  };
  const openStudentEmail = async (emails, firstName) => {
    const mailto = await buildStudentMailto(emails, firstName);
    if (!mailto) return;
    window.location.href = mailto;
  };
  if (studentDataPreview) {
    studentDataPreview.addEventListener('dblclick', (event) => {
      const target = event.target?.closest?.('.student-summary-id');
      if (!target) return;
      const text = target.getAttribute('data-copy') || '';
      if (!text || !clipboardAvailable) return;
      navigator.clipboard.writeText(text).then(() => {
        triggerFlash(target);
      }).catch(() => { });
    });
    studentDataPreview.addEventListener('click', (event) => {
      const strataAdd = event.target?.closest?.('.triage-in-strata-add');
      if (strataAdd) {
        event.preventDefault();
        const rawCodes =
          strataAdd.getAttribute('data-subject-codes') ||
          strataAdd.getAttribute('data-subject-code') ||
          '';
        const codes = rawCodes
          .split(',')
          .map((code) => normalizeSubjectCode(code))
          .filter(Boolean);
        if (!codes.length) return;
        const added = addStrataSubjectsToCurrentEnrolments(codes);
        if (added) {
          const currentRecord = staffWorkbookState.getStudentRecord();
          if (currentRecord) renderStudentPreviewHtml(formatStudentSummary(currentRecord));
        }
        return;
      }
      const triageComment = event.target?.closest?.('.triage-comment-preview, .triage-comment-menu');
      if (triageComment) {
        event.preventDefault();
        toggleTriageComment(triageComment);
        return;
      }
      const emailTarget = event.target?.closest?.('.student-email-link');
      if (emailTarget) {
        event.preventDefault();
        const email = emailTarget.getAttribute('data-email') || '';
        const firstName = emailTarget.getAttribute('data-first-name') || '';
        void openStudentEmail([email], firstName);
        triggerFlash(emailTarget);
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
      void openStudentEmail(emails, firstName);
      triggerFlash(emailAllTarget);
    });
    studentDataPreview.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const triageComment = event.target?.closest?.('.triage-comment-preview, .triage-comment-menu');
      if (!triageComment) return;
      event.preventDefault();
      toggleTriageComment(triageComment);
    });
    document.addEventListener('click', (event) => {
      if (event.target?.closest?.('.triage-comment-preview')) return;
      if (event.target?.closest?.('.triage-comment-menu')) return;
      if (event.target?.closest?.('.triage-comment-full')) return;
      closeAllTriageComments();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeAllTriageComments();
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
  if (closeEmailScriptsAccessModal) closeEmailScriptsAccessModal.addEventListener('click', hideEmailScriptsAccessModal);
  if (closeEmailScriptsAccessCta) closeEmailScriptsAccessCta.addEventListener('click', hideEmailScriptsAccessModal);
  if (applyCodeModal) applyCodeModal.addEventListener('click', applyCodes);
  if (presetFmpAssoc) {
    presetFmpAssoc.addEventListener('click', () => fillCodeInputWithPreset(codeModalPresets.fmpAssoc));
  }
  if (presetFmpDip) {
    presetFmpDip.addEventListener('click', () => fillCodeInputWithPreset(codeModalPresets.fmpDip));
  }
  if (presetMpDip) {
    presetMpDip.addEventListener('click', () => fillCodeInputWithPreset(codeModalPresets.mpDip));
  }
  if (presetMpDipOld) {
    presetMpDipOld.addEventListener('click', () => fillCodeInputWithPreset(codeModalPresets.mpDipOld));
  }
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
  if (clearStudentButton) {
    clearStudentButton.addEventListener('click', () => {
      clearActiveStudentState();
      if (studentIdInput) studentIdInput.focus();
    });
  }
  if (remainingColoursButton) {
    remainingColoursButton.addEventListener('click', () => {
      remainingColoursOn = !remainingColoursOn;
      updateRemainingColoursButton();
    });
    updateRemainingColoursButton();
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
        return;
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
    if (has('dual') || has('dual-split')) return 'Business Analytics | Software Development';
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
    const conflictCounts = new Map();
    toRender.forEach(({ placeholder, dayShort, data }) => {
      if (placeholder) return;
      const dayKey = dayShort || '';
      const slotKey = data?.slot || '';
      if (!dayKey || !slotKey || dayKey === 'N/A') return;
      const key = `${dayKey}|${slotKey}`;
      conflictCounts.set(key, (conflictCounts.get(key) || 0) + 1);
    });
    const loadThreshold = getLoadThreshold();
    const showConflicts = currentTableMode === 'selected' && rows.length === loadThreshold;

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
        const conflictKey = dayShort && data?.slot ? `${dayShort}|${data.slot}` : '';
        const isConflict = showConflicts && conflictKey && conflictCounts.get(conflictKey) > 1;
        row.dataset.subject = id;
        row.dataset.stream = stream || '';
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
          row.classList.add('row-hover');
          if (hoverTooltipTimer) clearTimeout(hoverTooltipTimer);
          updateTooltip(e, false);
          hoverTooltipTimer = setTimeout(() => updateTooltip(e, true), 4000);
        });
        row.addEventListener('mousemove', (e) => {
          const isVisible = hoverTooltip.style.display === 'block';
          updateTooltip(e, isVisible);
        });
        row.addEventListener('mouseleave', () => {
          row.classList.remove('row-hover');
          if (hoverTooltipTimer) clearTimeout(hoverTooltipTimer);
          hoverTooltip.style.display = 'none';
        });

        [
          { val: id },
          { val: name },
          { val: day, conflict: isConflict },
          { val: time, conflict: isConflict },
          { val: room },
          { val: teacher },
          { val: stream },
        ].forEach(({ val, conflict }) => {
          const td = document.createElement('td');
          td.textContent = val;
          if (conflict) td.classList.add('timetable-conflict');
          row.appendChild(td);
        });
      }
      tbody.appendChild(row);
    });
    const conflictKeys = Array.from(conflictCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([key]) => key);
    if (showConflicts && conflictKeys.length) {
      const conflictLabels = conflictKeys
        .map((key) => {
          const [day, slotName] = key.split('|');
          const timeLabel = slotName ? `${slotName} (${timeSlots[slotName] || slotName})` : slotName;
          return `${day} ${timeLabel}`.trim();
        })
        .filter(Boolean);
      const listHtml = conflictLabels.length
        ? `<ul class="alert-inline-list">${conflictLabels.map((label) => `<li>${escapeHtml(label)}</li>`).join('')}</ul>`
        : '';
      timetableClashError = {
        title: 'Timetable clash',
        html: `<p><strong class="alert-inline-title alert-title-error">Timetable clash</strong> <span class="alert-inline-text">Two or more subjects share the same day and time.</span></p>${listHtml}`,
      };
    } else {
      timetableClashError = null;
    }
    refreshErrorAlerts();
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
    initTooltips();
  };

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const TRIAGE_STRATA_ADD_TOOLTIP_HTML =
    "These new Strata additions are not recorded in the Source workbook and so don't appear in this web site as this student's Current Enrolments.  <br><br>Click to add them";

  const parseInStrataCodes = (value) => {
    const matches = String(value || '').toUpperCase().match(manualCodeRegexGlobal) || [];
    const unique = [];
    const seen = new Set();
    matches.forEach((raw) => {
      const code = normalizeSubjectCode(raw);
      if (!code || seen.has(code) || !validSubjectCodes.has(code)) return;
      seen.add(code);
      unique.push(code);
    });
    return unique;
  };

  const getStudentHistoryCodeSet = () => {
    const history = new Set();
    Array.from(subjectState.entries()).forEach(([code, st]) => {
      if (st?.completed && validSubjectCodes.has(code)) history.add(code);
    });
    manualEntryResults.forEach((entry) => {
      const code = normalizeSubjectCode(entry?.id || '');
      if (validSubjectCodes.has(code)) history.add(code);
    });
    return history;
  };

  const addStrataSubjectToCurrentEnrolments = (code) => {
    const normalized = normalizeSubjectCode(code);
    if (!normalized || !validSubjectCodes.has(normalized)) return false;
    let changed = false;
    const alreadyCurrent = workbookCurrent.has(normalized) || manualEntryCurrent.has(normalized);
    if (!alreadyCurrent) {
      manualEntryCurrent.set(normalized, { date: '' });
      changed = true;
    }
    const st = subjectState.get(normalized) || { completed: false, toggled: false };
    if (st.completed) {
      subjectState.set(normalized, { completed: false, toggled: false });
      changed = true;
    }
    if (withdrawnCurrentEnrolments.has(normalized)) {
      withdrawnCurrentEnrolments.delete(normalized);
      changed = true;
    }
    return changed;
  };

  const addStrataSubjectsToCurrentEnrolments = (codes = []) => {
    const uniqueCodes = Array.from(
      new Set(
        (codes || [])
          .map((code) => normalizeSubjectCode(code))
          .filter(Boolean)
      )
    );
    let changed = false;
    uniqueCodes.forEach((code) => {
      if (addStrataSubjectToCurrentEnrolments(code)) changed = true;
    });
    if (changed) {
      refreshCurrentEnrolmentStudentRecord();
      applyPassForEnrolmentsState();
      updateWarnings();
    }
    return changed;
  };

  const isElectiveId = (id) => {
    if (!id) return false;
    if (id.startsWith('ELECTIVE') || id.startsWith('USE')) return true;
    const meta = subjectMeta[id]?.classes || [];
    return meta.includes('elective');
  };

  const isElectiveLabel = (value = '') => String(value || '').toLowerCase().includes('elective');
  const isElectiveCandidateId = (id) => {
    if (!id) return false;
    const majorKey = getMajorKeyFromUi();
    const layout = computeElectiveList(majorKey);
    return Object.values(layout || {}).includes(id);
  };

  let electiveFullPopup = null;
  let electiveFullPopupOpenedAt = 0;
  let electiveFullPopupAnchor = null;
  let electiveFullPopupAnchorRect = null;
  const closeElectiveFullPopup = () => {
    if (!electiveFullPopup) return;
    electiveFullPopup.classList.remove('show');
    electiveFullPopup.style.display = 'none';
    electiveFullPopupAnchor = null;
    electiveFullPopupAnchorRect = null;
  };
  const getElectiveAnchorRect = () => {
    if (electiveFullPopupAnchor && document.contains(electiveFullPopupAnchor)) {
      return electiveFullPopupAnchor.getBoundingClientRect();
    }
    return electiveFullPopupAnchorRect;
  };
  const openElectiveFullPopup = (text, anchorRect, anchorPoint) => {
    if (!electiveFullPopup) {
      electiveFullPopup = document.createElement('div');
      electiveFullPopup.className = 'elective-full-popup';
      electiveFullPopup.addEventListener('click', (event) => event.stopPropagation());
      document.body.appendChild(electiveFullPopup);
    }
    console.info('[Elective popup]', { text, anchorRect });
    electiveFullPopup.textContent = text;
    electiveFullPopup.style.left = '0px';
    electiveFullPopup.style.top = '0px';
    electiveFullPopup.style.display = 'block';
    electiveFullPopup.style.zIndex = '9999';
    electiveFullPopup.classList.add('show');
    electiveFullPopupOpenedAt = Date.now();
    electiveFullPopupAnchorRect = anchorRect || null;
    requestAnimationFrame(() => {
      const popupRect = electiveFullPopup.getBoundingClientRect();
      const anchor = anchorRect || { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
      const baseLeft =
        anchorPoint && Number.isFinite(anchorPoint.x) ? anchorPoint.x + 10 : anchor.left + anchor.width / 2 - popupRect.width / 2;
      const baseTop =
        anchorPoint && Number.isFinite(anchorPoint.y) ? anchorPoint.y + 10 : anchor.top + anchor.height + 8;
      const left = Math.min(Math.max(8, baseLeft), window.innerWidth - popupRect.width - 8);
      const top = Math.min(Math.max(8, baseTop), window.innerHeight - popupRect.height - 8);
      electiveFullPopup.style.left = `${left}px`;
      electiveFullPopup.style.top = `${top}px`;
    });
  };

  const getSharePointParentInfo = (value) => {
    const raw = (value || '').toString().trim();
    if (!raw) return null;
    const isUrl = /^(https?:\/\/|file:\/\/)/i.test(raw);
    if (!isUrl) {
      return { parentName: raw, studentUrl: '' };
    }
    const clean = raw.split('#')[0].split('?')[0].replace(/\/$/, '');
    const parts = clean.split('/');
    if (parts.length < 2) {
      return { parentName: raw, studentUrl: raw };
    }
    const parentName = parts[parts.length - 2] || raw;
    return { parentName, studentUrl: clean };
  };
  const resolveSidebarSharePointHref = (value, sourceUrl = '') => {
    const toSafeSharePointHref = (candidate = '') => {
      let href = String(candidate || '')
        .replace(/&amp;/gi, '&')
        .replace(/\u00a0/g, ' ')
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .trim();
      if (!href) return '';
      if (/^about:blank#blocked/i.test(href)) return '';
      if (/^(javascript|data|vbscript):/i.test(href)) return '';
      if (/^file:\/\//i.test(href)) return '';
      if (/^\/\//.test(href)) href = `https:${href}`;
      if (/^www\./i.test(href)) href = `https://${href}`;
      if (/sharepoint\.com/i.test(href) && !/^https?:\/\//i.test(href)) {
        href = `https://${href.replace(/^\/+/, '')}`;
      }
      try {
        href = new URL(href).toString();
      } catch {
        try {
          href = new URL(encodeURI(href)).toString();
        } catch {
          return '';
        }
      }
      if (!/^https?:\/\//i.test(href)) return '';
      if (!/sharepoint\.com/i.test(href)) return '';
      return href;
    };

    let raw = String(value || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .trim();
    if (!raw) return '';
    raw = raw.replace(/&amp;/gi, '&').trim();
    if (
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
    ) {
      raw = raw.slice(1, -1).trim();
    }
    if (!raw) return '';
    const hyperlinkFormulaMatch = raw.match(/(?:_xlfn\.)?HYPERLINK\(\s*["']([^"']+)["']/i);
    if (hyperlinkFormulaMatch?.[1]) raw = hyperlinkFormulaMatch[1].trim();
    if (/^%2F/i.test(raw)) {
      try {
        const decoded = decodeURIComponent(raw);
        if (decoded) raw = decoded;
      } catch {
        // keep original encoded value
      }
    }
    const directUrlMatch = raw.match(/https?:\/\/[^\s"'<>]+/i);
    if (directUrlMatch?.[0] && !/^(https?:\/\/|\/|sites\/|www\.|\/\/)/i.test(raw)) {
      raw = directUrlMatch[0];
    }
    if (/^(https?:\/\/|\/\/|www\.)/i.test(raw) || /sharepoint\.com/i.test(raw)) {
      return toSafeSharePointHref(raw);
    }

    let sourceOrigin = '';
    if (sourceUrl) {
      try {
        sourceOrigin = new URL(sourceUrl).origin;
      } catch {
        sourceOrigin = '';
      }
    }
    const fallbackOrigin =
      sourceOrigin ||
      (window.location.hostname.includes('sharepoint.com')
        ? window.location.origin
        : 'https://melbournepolytechnic.sharepoint.com');
    if (/^\/sites\//i.test(raw)) return toSafeSharePointHref(`${fallbackOrigin}${raw}`);
    if (/^sites\//i.test(raw)) return toSafeSharePointHref(`${fallbackOrigin}/${raw}`);
    if (/^\.\.?\//.test(raw) && sourceUrl) {
      try {
        return toSafeSharePointHref(new URL(raw, sourceUrl).toString());
      } catch {
        return '';
      }
    }
    return '';
  };

  const scoreSidebarSharePointHref = (href = '') => {
    const value = String(href || '').toLowerCase();
    if (!value) return -10000;
    let score = 0;
    if (/sharepoint\.com/.test(value)) score += 25;
    if (/student(?:%20|\+|\s)+forms/.test(value)) score += 90;
    if (/\/forms\/allitems\.aspx/.test(value)) score += 30;
    if (/\/general\/enrol|enrol(?:%20|\+|\s)\d+/.test(value)) score += 12;
    if (/credit(?:%20|\+|\s)+(transfer|transfers)/.test(value)) score -= 180;
    if (/^file:\/\//.test(value)) score -= 250;
    return score;
  };

  const chooseSidebarSharePointHref = (...inputs) => {
    const seen = new Set();
    const candidates = [];
    inputs.flat().forEach((value) => {
      const href = String(value || '').trim();
      if (!href) return;
      const key = href.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push(href);
    });
    if (!candidates.length) return '';
    candidates.sort((a, b) => scoreSidebarSharePointHref(b) - scoreSidebarSharePointHref(a));
    return candidates[0] || '';
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
    const raw = String(value).trim();
    const dmyMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      let year = parseInt(dmyMatch[3], 10);
      if (year < 100) year += 2000;
      const parsed = new Date(year, month, day);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const textMatch = raw.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?[,]?\s*(\d{1,2})\s*([A-Za-z]{3})\s*(\d{2}|\d{4})/i);
    if (textMatch) {
      const day = parseInt(textMatch[1], 10);
      const monthText = textMatch[2].toLowerCase();
      const monthMap = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };
      const month = monthMap[monthText];
      if (month !== undefined) {
        let year = parseInt(textMatch[3], 10);
        if (year < 100) year += 2000;
        const parsed = new Date(year, month, day);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
    }
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

  const getDateOnly = (date) => {
    if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const addDays = (date, days) => {
    const base = getDateOnly(date);
    if (!base) return null;
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    return next;
  };

  const updateDateAlerts = (courseInfo) => {
    censusWarning = null;
    censusError = null;
    weekTwoWarning = null;
    weekTwoError = null;
    dateNoticeLines = [];

    if (!courseInfo) return;
    const today = getDateOnly(new Date());
    if (!today) return;

    const semesterStart = getDateOnly(toDateValue(courseInfo.Semester_Start_Date));
    const endWeekTwo = getDateOnly(toDateValue(courseInfo.EndOfWeekTwoDate));
    const censusDate = getDateOnly(toDateValue(courseInfo.CensusDate));

    if (endWeekTwo) {
      const weekOneEnd = semesterStart ? addDays(semesterStart, 7) : addDays(endWeekTwo, -7);
      if (weekOneEnd && today > weekOneEnd && today <= endWeekTwo) {
        weekTwoWarning = {
          title: 'Week 2 attendance',
          html: `<p><strong class="alert-inline-title alert-title-warning">Week 2 attendance</strong> <span class="alert-inline-text">We are after week 1 and before week 3 (End of Week 2: ${escapeHtml(
            formatDisplayDate(endWeekTwo)
          )}). Students must attend class in weeks 1 or 2 to allow late enrolment. If they miss the week 3 class, they cannot enrol in that subject.</span></p>`,
        };
        dateNoticeLines.push(
          `Week 2 window: attend by ${formatShortDate(endWeekTwo)} to allow late enrolment.`
        );
      } else if (today > endWeekTwo) {
        weekTwoError = {
          title: 'After week 2',
          html: `<p><strong class="alert-inline-title alert-title-error">After week 2</strong> <span class="alert-inline-text">End of Week 2 has passed (${escapeHtml(
            formatDisplayDate(endWeekTwo)
          )}). If a student missed the week 3 class, they cannot enrol in that subject.</span></p>`,
        };
        dateNoticeLines.push(
          `After week 2 (${formatShortDate(endWeekTwo)}): late enrolment not permitted without week 1–2 attendance.`
        );
      }
    }

    if (censusDate) {
      const censusWarningStart = addDays(censusDate, -7);
      if (censusWarningStart && today >= censusWarningStart && today <= censusDate) {
        censusWarning = {
          title: 'Census date within 1 week',
          html: `<p><strong class="alert-inline-title alert-title-warning">Census date within 1 week</strong> <span class="alert-inline-text">Census Date is ${escapeHtml(
            formatDisplayDate(censusDate)
          )}. After this date, students cannot get a refund if they withdraw. They also cannot switch classes if they did not attend week 1 or 2 in the new subject.</span></p>`,
        };
        dateNoticeLines.push(
          `Census within 1 week (${formatShortDate(censusDate)}): no refunds after this date.`
        );
      } else if (today > censusDate) {
        censusError = {
          title: 'Census date passed',
          html: `<p><strong class="alert-inline-title alert-title-error">Census date passed</strong> <span class="alert-inline-text">Census Date has passed (${escapeHtml(
            formatDisplayDate(censusDate)
          )}). Students cannot get a refund if they withdraw.</span></p>`,
        };
        dateNoticeLines.push(
          `Census passed (${formatShortDate(censusDate)}): no refunds if withdrawing.`
        );
      }
    }
    refreshErrorAlerts();
    applyTimetableDateHighlight();
  };

  const applyTimetableDateHighlight = () => {
    const isError = !!(censusError || weekTwoError);
    const isWarning = !isError && !!(censusWarning || weekTwoWarning);
    if (timetablePreparedEl) {
      timetablePreparedEl.classList.toggle('is-error', isError);
      timetablePreparedEl.classList.toggle('is-warning', isWarning);
    }
    if (timetableFees) {
      timetableFees.querySelectorAll('.timetable-date').forEach((el) => {
        el.classList.toggle('is-error', isError);
        el.classList.toggle('is-warning', isWarning);
      });
    }
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
    const fmpValue = (record.FMP || '').toString().trim();
    const intakeStart = (record.Intake_Start_Date || '').toString().trim();
    const nationality = (record.Nationality || '').toString().trim();
    const visaType = (record.Visa_Type || '').toString().trim();
    const fundingSource = (record.Funding_Source || '').toString().trim();
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
    const failedCount = (record.Failed_Count || '').toString().trim();
    const creditPointsValue = parseCreditPoints(record.Credit_Points_Earned);
    const formatCountValue = (value) =>
      Number.isInteger(value) ? value.toString() : value.toFixed(1);
    const creditPointsDisplay = creditPointsValue === null ? 0 : creditPointsValue;
    const creditSubjects = parseFloat((creditPointsDisplay / 12).toFixed(2));
    const creditSubjectsLabel = formatCountValue(creditSubjects);
    const hasHistory = !!(passedSubjects || resultsList);
    const feeDetails = getFeeStatusDetails(record);

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
    if (deferredInfo?.isDeferred) {
      const deferredMessage = buildDeferredNoticeText(deferredInfo);
      lines.push(
        `<div class="student-summary-warning"><strong class="alert-inline-title alert-title-warning">Returning student.</strong> <span class="alert-inline-text">${escapeHtml(
          deferredMessage
        )}</span></div>`
      );
    }
    const studentFlag = getStudentFlagText(record);
    if (studentFlag) {
      lines.push(
        `<div class="student-summary-warning"><strong class="alert-inline-title alert-title-warning">Student Flag:</strong> <span class="alert-inline-text">${escapeHtml(
          studentFlag
        )}</span></div>`
      );
    }
    if (record) {
      const triage = triageRecords.get(normalizeStudentId(record.Student_IDs_Unique));
      if (triage) {
        const triageLines = [];
        if (triage.friendlyName) {
          triageLines.push(
            `<div><strong>Friendly name:</strong> ${escapeHtml(triage.friendlyName)}</div>`
          );
        }
        if (triage.handledBy) {
          triageLines.push(
            `<div><strong>Handled by:</strong> ${escapeHtml(triage.handledBy)}</div>`
          );
        }
        if (triage.statusLabel) {
          const details = (triage.statusDetails || '').toLowerCase();
          let suffix = '';
          if (details.includes('details - crt, ongoing, domestic, etc.')) suffix += ' - New';
          if (details.includes('with ct')) suffix += ' - CT';
          triageLines.push(`<div>${escapeHtml(`${triage.statusLabel}${suffix}`)}</div>`);
        }
        if (triage.alteredStatus) {
          triageLines.push(
            `<div><strong>Altered Status:</strong> ${escapeHtml(triage.alteredStatus)}</div>`
          );
        }
        if (triage.onSharePoint) {
          const displayRaw = String(triage.onSharePoint || '').trim();
          const display = escapeHtml(displayRaw);
          const sharePointInfo = getSharePointParentInfo(sharePoint);
          const sourceSharePointUrl = sharePointInfo?.studentUrl || '';
          const sourceSharePointRaw = String(sharePoint || '').trim();
          const sourceSharePointContext = sourceSharePointRaw || sourceSharePointUrl || '';
          const normalizedStudentId = normalizeStudentId(record.Student_IDs_Unique);
          const linkFromTriage = resolveSidebarSharePointHref(
            triage.onSharePointLink || '',
            sourceSharePointContext
          );
          const linkFromDisplay = resolveSidebarSharePointHref(displayRaw, sourceSharePointContext);
          const linkFromSourceRaw = resolveSidebarSharePointHref(
            sourceSharePointRaw,
            sourceSharePointContext
          );
          const href = chooseSidebarSharePointHref(
            linkFromTriage,
            linkFromDisplay,
            linkFromSourceRaw
          );
          const debugKey = [
            normalizedStudentId,
            displayRaw,
            triage.onSharePointLink || '',
            sourceSharePointUrl,
            sourceSharePointRaw,
            href || '',
          ].join('|');
          const now = Date.now();
          const lastLogAt = triageSharePointDebugLastLoggedAt.get(debugKey) || 0;
          if (now - lastLogAt > 1500) {
            triageSharePointDebugLastLoggedAt.set(debugKey, now);
            const logger = href ? console.info : console.warn;
            logger('[Triage OnSharePoint debug]', {
              studentId: normalizedStudentId,
              display: displayRaw,
              sourceSharePointRaw: sharePoint || '',
              onSharePointLinkRaw: triage.onSharePointLink || '',
              sourceSharePointUrl,
              resolvedFromTriage: linkFromTriage,
              resolvedFromDisplay: linkFromDisplay,
              resolvedFromSourceRaw: linkFromSourceRaw,
              resolvedHref: href || '',
            });
          }
          const tooltipAddress =
            href ||
            linkFromTriage ||
            linkFromDisplay ||
            linkFromSourceRaw ||
            String(triage.onSharePointLink || '').trim();
          const tooltipText = tooltipAddress
            ? `SharePoint address: ${tooltipAddress}`
            : 'SharePoint address not resolved from Triage workbook.';
          const tooltipAttr = escapeHtml(tooltipText);
          if (href) {
            triageLines.push(
              `<div><strong>On SharePoint:</strong> <a class="triage-sharepoint-link" href="${escapeHtml(
                href
              )}" data-tooltip="${tooltipAttr}" target="_blank" rel="noopener noreferrer">${display}</a></div>`
            );
          } else {
            triageLines.push(
              `<div><strong>On SharePoint:</strong> <span class="triage-sharepoint-link" data-tooltip="${tooltipAttr}">${display}</span></div>`
            );
          }
        }
        if (triage.inStrata) {
          const strataCodes = parseInStrataCodes(triage.inStrata);
          if (strataCodes.length) {
            const historyCodes = getStudentHistoryCodeSet();
            const missingCodes = strataCodes.filter((code) => !historyCodes.has(code));
            const strataText = strataCodes.map((code) => escapeHtml(code)).join(', ');
            const strataHtml = missingCodes.length
              ? `<button type="button" class="triage-in-strata-add triage-in-strata-add-block" data-subject-codes="${escapeHtml(
                  missingCodes.join(',')
                )}" data-tooltip-html="${TRIAGE_STRATA_ADD_TOOLTIP_HTML}" aria-label="Add all In Strata subjects to current enrolments">${strataText}</button>`
              : `<span class="triage-in-strata-code">${strataText}</span>`;
            triageLines.push(`<div><strong>In Strata:</strong> ${strataHtml}</div>`);
          } else {
            triageLines.push(
              `<div><strong>In Strata:</strong> ${escapeHtml(
                triage.inStrata
              )}</div>`
            );
          }
        }
        if (triage.comments) {
          const rawComment = String(triage.comments || '');
          const commentText = escapeHtml(rawComment);
          const commentWithBreaks = rawComment.replace(/(\d{2}\/\d{2}\/\d{4})/g, '\n$1');
          const commentLines = commentWithBreaks.split(/\r?\n/).filter((line) => line.trim().length);
          const commentFull = commentLines.length
            ? commentLines.map((line) => `<div class="triage-comment-line">${escapeHtml(line)}</div>`).join('')
            : `<div class="triage-comment-line">${commentText}</div>`;
          triageLines.push(
            `<div class="triage-comment"><strong>Comments:</strong> <span class="triage-comment-preview" role="button" tabindex="0">${commentText}</span><span class="triage-comment-menu" aria-hidden="true">⋯</span><div class="triage-comment-full hidden-initial">${commentFull}</div></div>`
          );
        }
        if (triageLines.length) {
          lines.push(
            `<div class="student-summary-triage"><div class="student-summary-triage-title">Triage</div><div class="student-summary-triage-body">${triageLines.join(
              ''
            )}</div></div>`
          );
        }
      } else if (triageFileInfo?.fileName) {
        lines.push(
          `<div class="student-summary-warning"><strong class="alert-inline-title alert-title-warning">Triage: not there</strong></div>`
        );
      }
    }
    const repeatFailNotices = buildRepeatFailNotices();
    repeatFailNotices.summary.forEach((entry) => {
      const cls = entry.level === 'warning' ? 'alert-title-warning' : 'alert-title-error';
      const label = `Failed ${entry.code} ${entry.count} time${entry.count === 1 ? '' : 's'}.`;
      lines.push(
        `<div class="student-summary-warning fail-repeat fail-${entry.count}"><strong class="alert-inline-title ${cls}">${escapeHtml(
          label
        )}</strong></div>`
      );
    });
    if (acceptedOffered && !hasHistory) {
      const isOffered = acceptedOffered.toLowerCase() === 'offered';
      const text = isOffered ? `${acceptedOffered} only` : acceptedOffered;
      const line = isOffered
        ? `<span class="accepted-offered is-offered">${escapeHtml(text)}</span>`
        : escapeHtml(text);
      lines.push(line);
    }
    if (suppsAndHolds) {
      lines.push('<div><span class="alert-inline-title alert-title-warning">Supps and/or Holds</span></div>');
    }
    if (intakeStart && !hasHistory) {
      lines.push(`Intake Start: ${escapeHtml(formatDisplayDate(intakeStart))}`);
    }
    if (dateNoticeLines.length) {
      dateNoticeLines.forEach((line) => {
        if (line) lines.push(escapeHtml(line));
      });
    }
    if (feeDetails.feeLabel) {
      const hasVisa =
        feeDetails.visaType &&
        !feeDetails.feeLabel.toUpperCase().includes(feeDetails.visaType.toUpperCase());
      const visaSuffix = hasVisa
        ? ` (Visa: <span class="student-visa-strong">${escapeHtml(feeDetails.visaType)}</span>)`
        : '';
      const scheduleLink = feeDetails.domesticFees
        ? ' <a class="fee-schedule-link" href="https://www.melbournepolytechnic.edu.au/study/fees/local-student-fees/fees-for-local-higher-education-students/schedule-of-higher-education-tuition-fees/" target="_blank" rel="noopener">schedule</a>'
        : '';
      lines.push(
        `${escapeHtml(feeDetails.feeLabel)}${visaSuffix ? ` ${visaSuffix}` : ''}${scheduleLink}`
      );
      if (feeDetails.loadNote) {
        lines.push(escapeHtml(feeDetails.loadNote));
      }
      const visaNumbers = feeDetails.visaType
        ? feeDetails.visaType.toUpperCase().match(/\b\d{3}\b/g) || []
        : [];
      const caveatLine = getDomesticVisaCaveatLine(visaNumbers);
      if (caveatLine) {
        lines.push(escapeHtml(caveatLine));
      }
    }
    if (feeDetails.fundingSource) {
      lines.push(`Funding Source: ${escapeHtml(feeDetails.fundingSource)}`);
    }
    if (feeDetails.fundingSourcePrefix === 'F' && !visaType) {
      lines.push(
        'Funding Source begins with F. No visa information found; assuming Student Visa (500).'
      );
    }
    if (notes) {
      lines.push(`(${escapeHtml(`International Office Notes: ${notes}`)})`);
    }
    if (fmpValue) {
      lines.push('FMP student');
    }
    if (countryHittingTroubles) {
      lines.push(`Nationality: <span class="trouble-country">${escapeHtml(countryHittingTroubles)}</span>`);
    }
    if (suspended && suspended.toUpperCase() === 'Y') {
      const cleanReason = suspensionReason.replace(/\u2014/g, '\u2013');
      lines.push(escapeHtml(`Suspended: Suspension name: ${cleanReason}`));
    }
    if (aprApp) {
      const aprToken = /\bAPR\b/i.test(aprApp) ? 'APR' : /\bAPP\b/i.test(aprApp) ? 'APP' : 'APR';
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
      const aprLabel = `<span class="apr-app-tag">${aprToken}</span>`;
      const mainText = detailText ? `${escapeHtml(aprApp)} - ${detailText}` : escapeHtml(aprApp);
      lines.push(`${aprLabel} ${mainText}`);
    }
    if (failedCount) {
      lines.push(`Failed (N) count: ${escapeHtml(failedCount)}`);
    }
    const creditPointsLabel = formatCountValue(creditPointsDisplay);
    lines.push(
      `<div class="student-summary-credit" data-credit-subjects="${escapeHtml(
        creditSubjectsLabel
      )}">Credit Points Earned: ${escapeHtml(creditPointsLabel)} (${escapeHtml(
        creditSubjectsLabel
      )} subjects)</div>`
    );
    const medianGrade = getMedianGradeLabel(manualEntryResults);
    lines.push(`<div>Median grade: ${escapeHtml(medianGrade)}</div>`);
    const remainingCount = getRemainingSubjectsCount();
    if (shouldShowRemainingNotice(remainingCount)) {
      const medianGradePastYear = getMedianGradeLabelPastYear(manualEntryResults);
      lines.push(
        `<div><strong>${remainingCount} subjects remaining.</strong> Median grade (past year, median): ${escapeHtml(
          medianGradePastYear
        )}</div>`
      );
    }
    if (crtLocation) {
      const crtClass = creditTransferWarningActive ? 'crt-form-link crt-form-link-warning' : 'crt-form-link';
      lines.push(
        `<a class="${crtClass}" href="${escapeHtml(crtLocation)}" target="_blank" rel="noopener noreferrer">CRT form</a>`
      );
    }
    return lines.filter(Boolean).map((line) => (line.startsWith('<div') ? line : `<div>${line}</div>`)).join('');
  };

  let studentLookupWasVisible = false;
  const setStudentLookupVisible = (visible) => {
    if (!studentIdSection) return;
    studentIdSection.style.display = visible ? '' : 'none';
    studentIdSection.classList.toggle('hidden-initial', !visible);
    if (visible && !studentLookupWasVisible && studentIdInput) {
      requestAnimationFrame(() => {
        if (studentIdSection.style.display !== 'none') {
          studentIdInput.focus();
          studentIdInput.select();
        }
      });
    }
    studentLookupWasVisible = visible;
  };

  const normalizeHeadingText = (value) =>
    String(value || '')
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const getProfileNameHint = () => {
    if (fileLocationsProfileOverride) return fileLocationsProfileOverride.toLowerCase();
    let raw = '';
    if (Array.isArray(fileLocationsCache) && fileLocationsCache.length) {
      raw = fileLocationsCache.join('\n');
    } else if (fileLocationsCache && typeof fileLocationsCache === 'object') {
      raw = Object.values(fileLocationsCache)
        .filter((value) => typeof value === 'string')
        .join('\n');
    }
    if (!raw && emailScriptsSourcePath) raw = String(emailScriptsSourcePath);
    if (!raw) raw = window.location.pathname || '';
    const match = raw.match(/[/\\\\]Users[/\\\\]([^/\\\\]+)/i);
    if (match && match[1]) return match[1].toLowerCase();
    return '';
  };

  const getIntakeNameHint = () => {
    if (fileLocationsIntakeOverride) return fileLocationsIntakeOverride;
    const candidates = [];
    const pathName = window.location.pathname || '';
    if (pathName) candidates.push(pathName);
    if (emailScriptsSourcePath) candidates.push(String(emailScriptsSourcePath));
    if (lastDroppedFileInfo?.path) candidates.push(String(lastDroppedFileInfo.path));
    if (triageFileInfo?.path) candidates.push(String(triageFileInfo.path));
    if (staffFolderHandle?.name) candidates.push(String(staffFolderHandle.name));
    if (fileLocationsCache && typeof fileLocationsCache === 'object') {
      Object.values(fileLocationsCache).forEach((value) => {
        if (typeof value === 'string' && value.trim()) candidates.push(value);
      });
    }
    for (const raw of candidates) {
      const match = String(raw).match(/Enrol[^/\\\\]+/i);
      if (match && match[0]) return match[0];
    }
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const sem = now.getMonth() <= 5 ? 'S1' : 'S2';
    return `Enrol ${yy}_${sem}`;
  };

  const parseTriageWorkbookFromSheet = (sheet, ref, mode, workbook = null) => {
    const records = new Map();
    const previewRows = [];
    let parseInfo = { status: 'not parsed', headerFound: false, idIdx: null, total: 0, preview: 0 };
    if (!sheet || !ref) {
      return { records, previewRows, parseInfo };
    }
    try {
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
        const nonCreditCandidates = candidates.filter(
          (item) => !isCreditTransferUrl(item.url)
        );
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
          const existing = records.get(normalizedId) || {};
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
          records.set(normalizedId, merged);
        }
      }
      parseInfo = {
        status: 'ok',
        headerFound: true,
        idIdx,
        total: records.size,
        preview: previewRows.length,
      };
      return { records, previewRows, parseInfo };
    } catch {
      parseInfo = { status: 'parse error', headerFound: false, idIdx: null, total: 0, preview: 0 };
      return { records, previewRows, parseInfo };
    }
  };

  const parseTriageWorkbookBufferSync = (buffer, mode) => {
    const records = new Map();
    const previewRows = [];
    let parseInfo = { status: 'not parsed', headerFound: false, idIdx: null, total: 0, preview: 0 };
    if (!buffer || typeof XLSX === 'undefined') {
      return { records, previewRows, parseInfo };
    }
    const readAndParse = (options) => {
      const workbook = XLSX.read(buffer, options);
      const sheetNames = workbook.SheetNames || [];
      const sheet =
        workbook.Sheets?.Triage ||
        workbook.Sheets?.TRIAGE ||
        workbook.Sheets?.triage ||
        (sheetNames.length ? workbook.Sheets?.[sheetNames[0]] : null);
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
    });
    if (fastResult?.parseInfo?.headerFound && fastResult?.parseInfo?.total === 0) {
      return readAndParse({
        type: 'array',
        cellStyles: false,
        cellText: true,
        cellNF: false,
        dense: false,
        sheetRows: TRIAGE_READ_MAX_ROWS,
      });
    }
    return fastResult;
  };

  const applyTriageParseResult = (result, runId) => {
    if (runId && runId !== triageParseRunId) return;
    const map =
      result?.records instanceof Map
        ? result.records
        : new Map(Array.isArray(result?.records) ? result.records : []);
    triageRecords = map;
    triageSharePointDebugLastLoggedAt.clear();
    triagePreviewRows = Array.isArray(result?.previewRows) ? result.previewRows : [];
    triageParseInfo =
      result?.parseInfo || { status: 'parse error', headerFound: false, idIdx: null, total: 0, preview: 0 };
    if (triageParseInfo.total === undefined || triageParseInfo.total === null) {
      triageParseInfo.total = triageRecords.size;
    }
    if (triageParseInfo.preview === undefined || triageParseInfo.preview === null) {
      triageParseInfo.preview = triagePreviewRows.length;
    }
  };

  const parseTriageWorkbookInWorker = (buffer, mode) =>
    new Promise((resolve) => {
      if (!buffer || typeof Worker === 'undefined') {
        resolve(null);
        return;
      }
      let worker = null;
      let settled = false;
      let timeoutId = null;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        if (timeoutId) clearTimeout(timeoutId);
        if (worker) worker.terminate();
        resolve(value);
      };
      try {
        worker = new Worker(TRIAGE_WORKER_URL);
      } catch {
        finish(null);
        return;
      }
      timeoutId = setTimeout(() => finish(null), 120000);
      worker.onmessage = (event) => {
        const payload = event?.data || {};
        if (payload.type !== 'triageParsed') return;
        if (!payload.ok) {
          finish(null);
          return;
        }
        finish({
          records: Array.isArray(payload.records) ? payload.records : [],
          previewRows: Array.isArray(payload.previewRows) ? payload.previewRows : [],
          parseInfo: payload.parseInfo || null,
        });
      };
      worker.onerror = () => {
        finish(null);
      };
      const workerBuffer =
        typeof buffer.slice === 'function' ? buffer.slice(0) : buffer;
      const transfer = workerBuffer instanceof ArrayBuffer ? [workerBuffer] : [];
      worker.postMessage({ type: 'parseTriage', buffer: workerBuffer, mode }, transfer);
    });

  const parseTriageWorkbookBuffer = async (buffer, runId) => {
    if (runId && runId !== triageParseRunId) return;
    triageRecords = new Map();
    triagePreviewRows = [];
    triageParseInfo = { status: 'parsing', headerFound: false, idIdx: null, total: 0, preview: 0 };
    if (!buffer || typeof XLSX === 'undefined') {
      triageParseInfo = { status: 'not parsed', headerFound: false, idIdx: null, total: 0, preview: 0 };
      return;
    }
    const mode = getTriageParseMode();
    const workerResult = await parseTriageWorkbookInWorker(buffer, mode);
    if (workerResult) {
      applyTriageParseResult(workerResult, runId);
      return;
    }
    const bufferSize = buffer?.byteLength || 0;
    if (bufferSize > TRIAGE_FALLBACK_MAX_BYTES) {
      applyTriageParseResult(
        {
          records: new Map(),
          previewRows: [],
          parseInfo: {
            status: 'worker unavailable (file too large)',
            headerFound: false,
            idIdx: null,
            total: 0,
            preview: 0,
          },
        },
        runId
      );
      return;
    }
    applyTriageParseResult(parseTriageWorkbookBufferSync(buffer, mode), runId);
  };

  const scheduleTriageParse = (buffer) => {
    if (skipTriageParseOnLoad) return;
    triageParseRunId += 1;
    const runId = triageParseRunId;
    triageParseInfo = { status: 'parsing', headerFound: false, idIdx: null, total: 0, preview: 0 };
    if (triageFileInfo?.fileName) {
      renderDropZoneStatus(buildDropZoneStatusLines());
    }
    updateStudentPreview();
    const timeoutMs = TRIAGE_WORKER_TIMEOUT_MS + 2000;
    const timeoutId = setTimeout(() => {
      if (runId !== triageParseRunId) return;
      if (triageParseInfo?.status !== 'parsing') return;
      triageParseInfo = {
        status: 'timed out',
        headerFound: false,
        idIdx: null,
        total: 0,
        preview: 0,
      };
      if (triageFileInfo?.fileName) {
        renderDropZoneStatus(buildDropZoneStatusLines());
      }
      updateStudentPreview();
    }, timeoutMs);
    const run = async () => {
      await parseTriageWorkbookBuffer(buffer, runId);
      clearTimeout(timeoutId);
      if (runId !== triageParseRunId) return;
      if (triageFileInfo?.fileName) {
        renderDropZoneStatus(buildDropZoneStatusLines());
      }
      updateStudentPreview();
    };
    // Run immediately to avoid missing idle callbacks.
    run();
  };

  const readWorkbookAsync = (buffer) =>
    new Promise((resolve) => {
      const run = () => {
      try {
          const workbook = XLSX.read(buffer, {
            type: 'array',
            cellStyles: false,
            cellText: true,
            cellFormula: true,
            cellHTML: true,
            cellNF: false,
            dense: false,
            sheetRows: SOURCE_READ_MAX_ROWS,
          });
          resolve(workbook);
        } catch {
          resolve(null);
        }
      };
      setTimeout(run, 0);
    });

  const parseWorkbookInWorker = (buffer) =>
    new Promise((resolve) => {
      if (!buffer || typeof Worker === 'undefined') {
        resolve(null);
        return;
      }
      let worker = null;
      let settled = false;
      let timeoutId = null;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        if (timeoutId) clearTimeout(timeoutId);
        if (worker) worker.terminate();
        resolve(value);
      };
      try {
        worker = new Worker(SOURCE_WORKER_URL);
      } catch {
        finish(null);
        return;
      }
      timeoutId = setTimeout(() => finish(null), WORKER_PARSE_TIMEOUT_MS);
      worker.onmessage = (event) => {
        const payload = event?.data || {};
        if (payload.type !== 'workbookParsed') return;
        if (!payload.ok) {
          finish(null);
          return;
        }
        finish({
          records: Array.isArray(payload.records) ? payload.records : [],
          courseInfo: payload.courseInfo || null,
        });
      };
      worker.onerror = () => {
        finish(null);
      };
      // Keep the original buffer for fallback parsing on main thread.
      const workerBuffer =
        typeof buffer.slice === 'function' ? buffer.slice(0) : buffer;
      const transfer = workerBuffer instanceof ArrayBuffer ? [workerBuffer] : [];
      worker.postMessage({ type: 'parseWorkbook', buffer: workerBuffer }, transfer);
    });

  const parseWorkbookDataAsync = async (buffer) => {
    const workerResult = await parseWorkbookInWorker(buffer);
    if (workerResult && Array.isArray(workerResult.records) && workerResult.records.length > 0) {
      return workerResult;
    }
    const bufferSize = buffer?.byteLength || 0;
    if (bufferSize > WORKBOOK_FALLBACK_MAX_BYTES) return null;
    const workbook = await readWorkbookAsync(buffer);
    if (!workbook) return null;
    const fallbackResult = {
      records: buildStudentRecordsFromWorkbook(workbook),
      courseInfo: buildCourseInfoFromWorkbook(workbook),
    };
    if (!workerResult) return fallbackResult;
    if (Array.isArray(fallbackResult.records) && fallbackResult.records.length > 0) {
      return fallbackResult;
    }
    return workerResult;
  };

  const htmlToPlainText = (html) => {
    if (!html) return '';
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const text = wrapper.innerText || wrapper.textContent || '';
    return text.replace(/\n{3,}/g, '\n\n').trim();
  };

  const decodeQuotedPrintableBytes = (value) => {
    const raw = String(value || '').replace(/=\r?\n/g, '');
    const bytes = [];
    for (let i = 0; i < raw.length; i += 1) {
      const ch = raw[i];
      if (ch === '=' && i + 2 < raw.length && /[0-9A-Fa-f]{2}/.test(raw.slice(i + 1, i + 3))) {
        bytes.push(parseInt(raw.slice(i + 1, i + 3), 16));
        i += 2;
      } else {
        bytes.push(raw.charCodeAt(i) & 0xff);
      }
    }
    return new Uint8Array(bytes);
  };

  const decodeBufferWithCharset = (buffer, charset = 'utf-8') => {
    try {
      return new TextDecoder(charset).decode(buffer);
    } catch {
      return new TextDecoder('utf-8').decode(buffer);
    }
  };

  const sniffHtmlCharset = (buffer) => {
    if (!buffer) return '';
    const sample = decodeBufferWithCharset(buffer, 'latin1').slice(0, 2048);
    const metaMatch = sample.match(/charset\s*=\s*["']?([\w-]+)/i);
    return metaMatch ? metaMatch[1].toLowerCase() : '';
  };

  const extractHtmlFromMhtBuffer = (buffer) => {
    if (!buffer) return '';
    const rawText = decodeBufferWithCharset(buffer, 'latin1');
    const htmlStart = rawText.search(/<html[\s>]/i);
    const htmlEndMatch = rawText.match(/<\/html>/i);
    if (htmlStart >= 0 && htmlEndMatch && htmlEndMatch.index > htmlStart) {
      return rawText.slice(htmlStart, htmlEndMatch.index + htmlEndMatch[0].length);
    }
    const boundaryMatch = rawText.match(/boundary="?([^"\r\n;]+)"?/i);
    if (!boundaryMatch) return '';
    const boundary = boundaryMatch[1];
    const parts = rawText.split(new RegExp(`--${boundary}(?:--)?\\r?\\n`, 'i'));
    for (const part of parts) {
      if (!/content-type:\s*text\/html/i.test(part)) continue;
      const splitAt = part.search(/\r?\n\r?\n/);
      if (splitAt < 0) continue;
      const headers = part.slice(0, splitAt);
      let body = part.slice(splitAt).replace(/^\r?\n\r?\n/, '');
      const charsetMatch = headers.match(/charset="?([^"\r\n;]+)"?/i);
      const charset = charsetMatch ? charsetMatch[1].toLowerCase() : 'utf-8';
      let decodedHtml = '';
      if (/content-transfer-encoding:\s*quoted-printable/i.test(headers)) {
        decodedHtml = decodeBufferWithCharset(decodeQuotedPrintableBytes(body), charset);
      } else if (/content-transfer-encoding:\s*base64/i.test(headers)) {
        try {
          const binary = atob(body.replace(/\s+/g, ''));
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i) & 0xff;
          decodedHtml = decodeBufferWithCharset(bytes, charset);
        } catch {
          decodedHtml = body;
        }
      } else {
        decodedHtml = decodeBufferWithCharset(
          new Uint8Array([...body].map((ch) => ch.charCodeAt(0) & 0xff)),
          charset
        );
      }
      const start = decodedHtml.search(/<html[\s>]/i);
      const end = decodedHtml.search(/<\/html>/i);
      if (start >= 0) {
        if (end > start) return decodedHtml.slice(start, end + 7);
        return decodedHtml.slice(start);
      }
      return decodedHtml;
    }
    return '';
  };

  const extractSectionFromHtml = (html, startLabel, stopLabel, debugLabel = '') => {
    if (!html) return { html: '', text: '' };
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const normalizeText = (value) =>
      String(value || '')
        .replace(/[–—]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    const normalizedStop = normalizeText(stopLabel);
    const isHeadingEl = (el) => {
      if (!el) return false;
      if (/^H[1-6]$/.test(el.tagName)) return true;
      const cls = String(el.className || '').toLowerCase();
      if (cls.includes('heading') || cls.includes('msoheading')) return true;
      const style = el.getAttribute?.('style') || '';
      if (/font-weight:\s*bold/i.test(style) && /font-size:\s*1[4-9]pt/i.test(style)) {
        return true;
      }
      return false;
    };
    const findHeadingEl = (label) => {
      const normalized = normalizeText(label);
      const headingTags = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'));
      const direct = headingTags.find((el) => normalizeText(el.textContent) === normalized);
      if (direct) return direct;
      const candidates = Array.from(doc.querySelectorAll('p,div,span'));
      return (
        candidates.find((el) => normalizeText(el.textContent) === normalized) ||
        null
      );
    };
    const startEl = findHeadingEl(startLabel);
    if (!startEl) return { html: '', text: '' };
    const htmlParts = [];
    const collectedNodes = new Set();
    const hasCollectedAncestor = (el) => {
      let current = el.parentElement;
      while (current) {
        if (collectedNodes.has(current)) return true;
        current = current.parentElement;
      }
      return false;
    };
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
    let foundStart = false;
    let node = walker.nextNode();
    while (node) {
      if (node === startEl) {
        foundStart = true;
        node = walker.nextNode();
        continue;
      }
      if (!foundStart) {
        node = walker.nextNode();
        continue;
      }
      const nodeText = normalizeText(node.textContent);
      if (isHeadingEl(node)) break;
      if (normalizedStop && nodeText === normalizedStop) break;
      if (
        normalizedStop &&
        normalizedStop.includes('for subject planner') &&
        nodeText.includes('for subject planner') &&
        nodeText.includes('your preference')
      ) {
        break;
      }
      if (node.matches('p,ul,ol,table,div')) {
        if (node.querySelector && node.querySelector('h1,h2,h3,h4,h5,h6')) {
          break;
        }
        if (!hasCollectedAncestor(node)) {
          htmlParts.push(node.outerHTML);
          collectedNodes.add(node);
        }
      }
      node = walker.nextNode();
    }
    const htmlSection = htmlParts.join('\n').trim();
    // Debug logging removed.
    return {
      html: htmlSection,
      text: htmlToPlainText(htmlSection),
    };
  };

  const parseEmailScripts = async () => {
    if (emailScriptsCache) return emailScriptsCache;
    const hasHtmlSource = !!emailScriptsHtmlSource;
    const hasDocxSource = !!emailScriptsDocxBuffer;
    if (!hasHtmlSource && !hasDocxSource) {
      emailScriptsCache = null;
      return null;
    }
    try {
      let declarationText = '';
      let declarationHtml = '';
      let preferencesMatch = null;
      const declarationHeading = 'Student Declaration';
      const preferencesHeading = 'Your preference for subject planner';

      let html = '';
      if (hasHtmlSource) {
        html = emailScriptsHtmlSource;
      } else {
        const htmlExtractor = window.mammoth?.extractHtml || window.mammoth?.convertToHtml;
        if (htmlExtractor) {
          const htmlResult = await htmlExtractor({ arrayBuffer: emailScriptsDocxBuffer });
          html = htmlResult?.value || '';
        }
      }
      if (html) {
        const declarationSection = extractSectionFromHtml(
          html,
          declarationHeading,
          preferencesHeading,
          'parseEmailScripts'
        );
        declarationHtml = declarationSection.html;
        declarationText = declarationSection.text;

        const doc = new DOMParser().parseFromString(html, 'text/html');
        const normalizeText = (value) =>
          String(value || '')
            .replace(/[–—]/g, '-')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
        const findHeadingEl = (label) => {
          const normalized = normalizeText(label);
          const headingTags = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'));
          const direct = headingTags.find((el) => normalizeText(el.textContent) === normalized);
          if (direct) return direct;
          const all = Array.from(doc.querySelectorAll('p,div,h1,h2,h3,h4,h5,h6'));
          return all.find((el) => normalizeText(el.textContent) === normalized) || null;
        };
        const preferenceHeadingEl = findHeadingEl(preferencesHeading);
        if (preferenceHeadingEl) {
          let table = null;
          let cursor = preferenceHeadingEl.nextElementSibling;
          while (cursor && !table) {
            if (cursor.tagName === 'TABLE') {
              table = cursor;
              break;
            }
            const nested = cursor.querySelector?.('table');
            if (nested) {
              table = nested;
              break;
            }
            cursor = cursor.nextElementSibling;
          }
          if (table) {
            const rows = Array.from(table.querySelectorAll('tr'))
              .map((row) =>
                Array.from(row.querySelectorAll('th,td')).map((cell) =>
                  cell.textContent.trim()
                )
              )
              .filter((cells) => cells.some((cell) => cell));
            const headerRow = rows.find((cells) =>
              cells.some((cell) => /profile|salutation|sign off/i.test(cell))
            );
            const headerMap = {};
            if (headerRow) {
              headerRow.forEach((cell, idx) => {
                const key = normalizeHeader(cell);
                if (key.includes('profile')) headerMap.profile = idx;
                if (key.includes('salutation')) headerMap.salutation = idx;
                if (key.includes('signoffphrase') || key.includes('signoff') && key.includes('phrase')) {
                  headerMap.signOffPhrase = idx;
                }
                if (key.includes('signoffname') || key.includes('signoff') && key.includes('name')) {
                  headerMap.signOffName = idx;
                }
              });
            }
            const preferences = rows
              .filter((cells) => !headerRow || cells !== headerRow)
              .filter((cells) => cells.some((cell) => cell))
              .map((cells) => ({
                profile:
                  cells[headerMap.profile ?? 0] || cells[0] || '',
                salutation:
                  cells[headerMap.salutation ?? 1] || cells[1] || '',
                signOffPhrase:
                  cells[headerMap.signOffPhrase ?? 2] || cells[2] || '',
                signOffName:
                  cells[headerMap.signOffName ?? 3] || cells[3] || '',
              }))
              .filter((row) => row.profile && !/profile name/i.test(row.profile));
            const profileHint = getProfileNameHint();
            const profileHintLower = profileHint ? profileHint.toLowerCase() : '';
            const storedProfile =
              (window.localStorage && window.localStorage.getItem('subjectPlannerProfile')) || '';
            const storedLower = storedProfile ? storedProfile.toLowerCase() : '';
            preferencesMatch =
              preferences.find((row) => row.profile.toLowerCase() === profileHintLower) ||
              preferences.find(
                (row) => profileHintLower && row.profile.toLowerCase().includes(profileHintLower)
              ) ||
              preferences.find((row) => row.profile.toLowerCase() === storedLower) ||
              preferences.find(
                (row) => storedLower && row.profile.toLowerCase().includes(storedLower)
              ) ||
              null;
            if (!preferencesMatch && preferences.length === 1) {
              preferencesMatch = preferences[0];
            }
            if (!preferencesMatch && !profileHintLower && preferences.length > 1 && window.localStorage) {
              if (!window.__profilePrompted) {
                window.__profilePrompted = true;
                const choice = window.prompt(
                  `Select your profile for sign-off:\n${preferences
                    .map((row) => row.profile)
                    .join(', ')}`,
                  preferences[0]?.profile || ''
                );
                if (choice) {
                  window.localStorage.setItem('subjectPlannerProfile', choice.trim());
                  const choiceLower = choice.trim().toLowerCase();
                  preferencesMatch =
                    preferences.find((row) => row.profile.toLowerCase() === choiceLower) ||
                    preferences.find(
                      (row) => row.profile.toLowerCase().includes(choiceLower)
                    ) ||
                    preferencesMatch;
                }
              }
            }
            // no console debug here
          }
        }
      }

      if ((!declarationText || !preferencesMatch) && hasDocxSource && window.mammoth?.extractRawText) {
        const result = await window.mammoth.extractRawText({ arrayBuffer: emailScriptsDocxBuffer });
        const rawText = result?.value || '';
        const lines = rawText.split(/\r?\n/).map((line) => line.trim());
        const headings = [declarationHeading, preferencesHeading].map(normalizeHeadingText);
        const isKnownHeading = (line) => {
          const normalized = normalizeHeadingText(line);
          if (headings.includes(normalized)) return true;
          if (normalized.includes('for subject planner') && normalized.includes('your preference')) {
            return true;
          }
          return false;
        };
        const findHeadingIndex = (needle) => {
          const normalizedNeedle = normalizeHeadingText(needle);
          const direct = lines.findIndex(
            (line) => normalizeHeadingText(line) === normalizedNeedle
          );
          if (direct >= 0) return direct;
          if (normalizedNeedle.includes('ongoing student declaration')) {
            return lines.findIndex((line) => {
              const n = normalizeHeadingText(line);
              return n.includes('ongoing student declaration') && n.includes('please read and reply');
            });
          }
          if (normalizedNeedle.includes('for subject planner')) {
            return lines.findIndex((line) => {
              const n = normalizeHeadingText(line);
              return n.includes('for subject planner') && n.includes('your preference');
            });
          }
          return -1;
        };

        if (!declarationText) {
          const declarationStart = findHeadingIndex(declarationHeading);
          let declarationLines = [];
          if (declarationStart >= 0) {
            for (let i = declarationStart + 1; i < lines.length; i += 1) {
              const line = lines[i];
              if (isKnownHeading(line)) break;
              declarationLines.push(line);
            }
          }
          declarationText = declarationLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        }

        if (!preferencesMatch) {
          const preferencesStart = findHeadingIndex(preferencesHeading);
          let preferences = [];
          if (preferencesStart >= 0) {
            for (let i = preferencesStart + 1; i < lines.length; i += 1) {
              const line = lines[i];
              if (isKnownHeading(line)) break;
              if (!line) continue;
              const parts = line.includes('\t') ? line.split(/\t+/) : line.split(/\s{2,}/);
              if (parts.length < 4) continue;
              const [profile, signOffName, signOffPhrase, salutation] = parts.map((p) => p.trim());
              if (!profile || /your windows profile/i.test(profile)) continue;
              preferences.push({ profile, signOffName, signOffPhrase, salutation });
            }
          }
          const profileHint = getProfileNameHint();
          preferencesMatch =
            preferences.find((row) => row.profile.toLowerCase() === profileHint) ||
            preferences.find(
              (row) => profileHint && row.profile.toLowerCase().includes(profileHint)
            ) ||
            null;
        }
      }
      if (!declarationText && declarationHtml) {
        declarationText = htmlToPlainText(declarationHtml);
      }

      emailScriptsCache = {
        declarationText,
        declarationHtml,
        preferences: preferencesMatch,
      };
      return emailScriptsCache;
    } catch {
      emailScriptsCache = null;
      return null;
    }
  };

  const setStudentSearchEmptyNotice = (message = '') => {
    if (!studentSearchEmpty) return;
    studentSearchEmpty.textContent = message;
    studentSearchEmpty.style.display = message ? 'block' : 'none';
  };

  const setStudentPreviewVisible = (visible) => {
    if (!studentDataPreview) return;
    studentDataPreview.classList.toggle('is-visible', visible);
  };

  const toggleTriageComment = (target) => {
    const wrapper = target?.closest?.('.triage-comment');
    if (!wrapper) return;
    const full = wrapper.querySelector('.triage-comment-full');
    if (!full) return;
    const willShow = full.classList.contains('hidden-initial');
    closeAllTriageComments();
    if (!willShow) return;
    full.classList.remove('hidden-initial');
    const title = wrapper.querySelector('strong');
    const anchor = title || wrapper;
    const rect = anchor.getBoundingClientRect();
    full.style.left = `${Math.round(rect.left + 6)}px`;
    full.style.top = `${Math.round(rect.bottom + 6)}px`;
  };

  const closeAllTriageComments = () => {
    if (!studentDataPreview) return;
    studentDataPreview
      .querySelectorAll('.triage-comment-full:not(.hidden-initial)')
      .forEach((el) => el.classList.add('hidden-initial'));
  };

  const ensureTriageParsed = () => {
    if (!skipTriageParseOnLoad) return;
    if (!triageWorkbookBuffer) return;
    skipTriageParseOnLoad = false;
    scheduleTriageParse(triageWorkbookBuffer);
  };

  function applyStudentRecord(record) {
    if (!record) return;
    remainingNoticeUnlocked = false;
    const nextId = normalizeStudentId(record.Student_IDs_Unique || '');
    console.info('[Triage] active student id:', nextId, 'triage match:', triageRecords.has(nextId));
    if (activeStudentId && nextId && nextId !== activeStudentId) {
      loadedStudentSnapshot = null;
      staffWorkbookState.setStudentRecord(null);
    }
    resetStudentSelections();
    staffWorkbookState.setStudentRecord(record);
    const feeDetails = getFeeStatusDetails(record);
    feeStatus = feeDetails.feeStatus;
    domesticLoad = feeDetails.domesticLoad;
    studentType = domesticLoad ? 'domestic' : 'international';
    if (studentType !== 'international') {
      exceptionalLoadApproved = false;
    }
    const courseInfo = staffWorkbookState.getCourseInfo();

    const passedRaw = record.Passed_subjects || '';
    const resultsRaw = record.Results_List || '';
    const passedParsed = parseManualEntriesFromText(passedRaw);
    const resultsParsed = parseManualEntriesFromText(resultsRaw);
    const resultsCurrent = parseCurrentEntriesFromResults(resultsRaw);
    if (resultsCurrent.size && resultsParsed.resultEntries?.length) {
      const resultsByCode = new Set(resultsParsed.resultEntries.map((entry) => entry.id));
      passedParsed.resolvedSubjectCodes.forEach((code) => resultsByCode.add(code));
      resultsCurrent.forEach((_meta, code) => {
        if (resultsByCode.has(code)) resultsCurrent.delete(code);
      });
    }

    deferredInfo = null;
    if (isWorkbookFlag(record.In_Deferred)) {
      const entries = resultsParsed.resultEntries || [];
      const currentEntries = resultsParsed.currentEntries || new Map();
      const enrolmentDates = entries.map((entry) => entry?.date).filter(Boolean);
      currentEntries.forEach((meta) => {
        if (meta?.date) enrolmentDates.push(meta.date);
      });
      const lastEnrolmentDate = getLatestDateFromDates(enrolmentDates);
      const lastEnrolmentText = lastEnrolmentDate ? formatNumericDate(lastEnrolmentDate) : 'unknown';
      deferredInfo = {
        isDeferred: true,
        lastEnrolmentDate,
        lastEnrolmentText,
      };
    }

    resultsParsed.aliasEntries.forEach((aliases, mapped) => {
      aliases.forEach((original) => recordManualAlias(mapped, original));
    });
    workbookCurrent.clear();
    resultsCurrent.forEach((meta, mapped) => workbookCurrent.set(mapped, meta));
    refreshCurrentEnrolmentStudentRecord();
    resultsParsed.unknownEntries.forEach((entry) => addUnknownEntry(entry));
    manualEntryResults = resultsParsed.resultEntries ? [...resultsParsed.resultEntries] : [];
    resultsParsed.metaEntries.forEach((meta, mapped) => {
      manualEntryMeta.set(mapped, {
        result: meta.result || '',
        date: meta.date || '',
        failCountN: resultsParsed.failCountsN?.get(mapped) || 0,
      });
    });
    resultsParsed.resolvedSubjectCodes.forEach((code) => {
      if (!manualEntryMeta.has(code)) {
        manualEntryMeta.set(code, { result: '', date: '', failCountN: resultsParsed.failCountsN?.get(code) || 0 });
      }
    });

    const resolvedUseCodes = [
      ...passedParsed.resolvedUseCodes,
      ...resultsParsed.resolvedUseCodes,
    ];
    const uniqueUseCodes = resolvedUseCodes.filter(
      (code, idx, arr) => code && arr.indexOf(code) === idx
    );
    electivePlaceholderState = electivePlaceholderState.map((_, idx) => uniqueUseCodes[idx] || '');

    passedParsed.resolvedSubjectCodes.forEach((code) => {
      const cell = subjects.find((c) => c.dataset.subject === code);
      if (!cell) return;
      subjectState.set(code, { completed: true, toggled: false });
      if (!manualEntryMeta.has(code)) {
        manualEntryMeta.set(code, { result: '', date: '' });
      }
    });
    resultsParsed.resolvedSubjectCodes.forEach((code) => {
      const cell = subjects.find((c) => c.dataset.subject === code);
      if (!cell) return;
      subjectState.set(code, { completed: true, toggled: false });
    });

    const resultStatusByCode = new Map();
    resultsParsed.resultEntries?.forEach((entry) => {
      const status = getGradeStatus(entry?.result || '');
      if (!status) return;
      const existing = resultStatusByCode.get(entry.id) || { pass: false, fail: false };
      if (status === 'pass') existing.pass = true;
      if (status === 'fail') existing.fail = true;
      resultStatusByCode.set(entry.id, existing);
    });
    resultStatusByCode.forEach((status, code) => {
      if (!validSubjectCodes.has(code)) return;
      if (status.fail && !status.pass) {
        subjectState.set(code, { completed: false, toggled: false });
      }
    });

    workbookCurrent.forEach((meta, code) => {
      if (!validSubjectCodes.has(code)) return;
      if (subjectState.get(code)?.completed) {
        subjectState.set(code, { completed: false, toggled: false });
      }
      if (!manualEntryMeta.has(code)) {
        manualEntryMeta.set(code, { result: '', date: meta?.date || '', failCountN: resultsParsed.failCountsN?.get(code) || 0 });
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
    const infoMessages = buildInfoMessages(record, feeDetails);
    updateCreditTransferWarning();
    {
      const { codes, info } = splitInfoMessages(infoMessages);
      setAlertMessages('info', info);
      setAlertMessages('codes', codes);
    }

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
    syncLoadFormState();
    updateVaryLoadLabel();
    loadedStudentSnapshot = captureStudentSnapshot();
  };

  function toProperCase(value) {
    return String(value || '')
      .toLowerCase()
      .split(/(\s|-|')/)
      .map((part) => (/[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part))
      .join('');
  }

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

  const clearActiveStudentState = ({
    keepInput = false,
    keepExtractedId = false,
    skipPreviewUpdate = false,
  } = {}) => {
    remainingNoticeUnlocked = false;
    loadedStudentSnapshot = null;
    staffWorkbookState.setStudentRecord(null);
    activeStudentId = '';
    feeStatus = '';
    domesticLoad = true;
    studentType = 'international';
    exceptionalLoadApproved = false;
    clearAlertState();
    if (!keepExtractedId) extractedStudentId = '';
    if (studentIdInput) {
      if (!keepInput) studentIdInput.value = '';
      studentIdInput.classList.remove('student-match-found');
    }
    clearStudentSearchDropdown();
    resetStudentSelections();
    syncLoadFormState();
    updateVaryLoadLabel();
    if (!skipPreviewUpdate) updateStudentPreview();
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
    if (id && activeStudentId && id !== activeStudentId) {
      clearActiveStudentState({ keepInput: true, keepExtractedId: false, skipPreviewUpdate: true });
    }
    extractedStudentId = id;
    if (studentIdInput && id) studentIdInput.value = id;
    clearStudentSearchDropdown();
    updateStudentPreview();
  };

  function updateStudentPreview() {
    if (!studentDataPreview) return;
    updateDateAlerts(staffWorkbookState.getCourseInfo());
    const hasSourceLoaded = !!lastDroppedFileInfo?.fileName;
    if (!hasSourceLoaded) {
      renderStudentPreview('');
      setStudentLookupVisible(false);
      setStudentPreviewVisible(false);
      setStudentSearchEmptyNotice('');
      if (studentIdInput) studentIdInput.classList.remove('student-match-found');
      clearStudentSearchDropdown();
      return;
    }
    if (!studentRecords.length) {
      renderStudentPreview('');
      setStudentLookupVisible(staffFacing && hasSourceLoaded);
      setStudentPreviewVisible(false);
      setStudentSearchEmptyNotice('');
      if (studentIdInput) studentIdInput.classList.remove('student-match-found');
      clearStudentSearchDropdown();
      return;
    }
    setStudentSearchEmptyNotice('');
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
    if (timetableModal && timetableModal.classList.contains('show')) {
      updateTimetableStaffContent(currentTableMode);
    }
  };

  function handleStudentIdInput() {
    if (!studentIdInput) return;
    studentIdInput.classList.remove('student-match-found');
    const rawValue = studentIdInput.value || '';
    const trimmedValue = rawValue.trim();
    if (!trimmedValue) {
      clearActiveStudentState();
      return;
    }
    const digitsOnly = (trimmedValue.match(/\d+/g) || []).join('');
    if (digitsOnly.length >= 7) {
      const nextId = normalizeStudentId(digitsOnly);
      if (activeStudentId && nextId !== activeStudentId) {
        clearActiveStudentState({ keepInput: true, keepExtractedId: false, skipPreviewUpdate: true });
      }
      extractedStudentId = nextId;
      studentIdInput.value = nextId;
      clearStudentSearchDropdown();
      updateStudentPreview();
      return;
    }

    extractedStudentId = '';
    const sPrefixMatch = trimmedValue.match(/^[sS](\d{1,7})$/);
    const numericQuery = sPrefixMatch ? sPrefixMatch[1] : digitsOnly.match(/^\d{1,7}$/)?.[0];
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

      if (hasEmailQuery) {
        const emailMatches = (val) =>
          val && val.toLowerCase().includes(emailQuery);
        if (emailMatches(email)) {
          matched = true;
        } else {
          return;
        }
      }
      if (!matched && !isWordSearch) {
        const emailMatches = (val) =>
          val && val.toLowerCase().startsWith(emailQuery);
        if (emailMatches(secondaryEmail)) {
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
  };

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
    if (rowCount === 0) {
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (rows.length <= 1) {
        return [];
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
      if (!String(record.SharePoint_StudentForms || '').trim() && sharePointByStudentId.has(studentId)) {
        record.SharePoint_StudentForms = sharePointByStudentId.get(studentId) || '';
      }
      records.push(record);
    }
    return records;
  };

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
  };

  function loadWorkbookFromFile(file) {
    if (!file) {
      if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(false);
      return;
    }
    sourceWorkbookFileObject = file;
    if (typeof XLSX === 'undefined') {
      renderStudentPreview('Workbook library is not available in this environment.');
      if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(false);
      return;
    }
    if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const stopSpinner = () => {
        if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(false);
      };
      try {
        const timeoutMs = WORKBOOK_PARSE_TIMEOUT_MS;
        const parsePromise = parseWorkbookDataAsync(event.target.result);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Workbook parse timed out. Try dropping Source.xlsx directly.')), timeoutMs)
        );
        const parsed = await Promise.race([parsePromise, timeoutPromise]);
        if (!parsed) throw new Error('Workbook read failed.');
        const { records, courseInfo } = parsed;
        studentRecords = records;
        activeStudentId = '';
        staffWorkbookState.setStudentRecord(null);
        staffWorkbookState.setCourseInfo(courseInfo);
        loadedStudentSnapshot = null;
        clearStudentSearchDropdown();
        lastStudentCountLine = `${records.length} students listed`;
        if (lastDroppedFileInfo) {
          renderDropZoneStatus(buildDropZoneStatusLines());
        } else if (dropZoneTextEl) {
          renderDropZoneStatus([lastStudentCountLine]);
        }
        updateStudentPreview();
        stopSpinner();
      } catch (error) {
        renderStudentPreview(`Workbook parse error: ${error.message}`);
        stopSpinner();
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
    items.forEach(({ cell, id, result = '', date = '', isFail = false, repeatFail = false, displayCode, displayName, displayStream }) => {
      const row = document.createElement('tr');
      row.dataset.subject = id;
      applyDisplayTypeClass(row, cell || id);
      if (isHistoryTable && (isFail || isFailGradeToken(result))) {
        row.classList.add('history-fail');
      }
      if (isHistoryTable && repeatFail) {
        row.classList.add('history-repeat-fail');
        row.setAttribute(
          'data-tooltip',
          "Subjects failed 3 times can delay a student's graduation. Also, upon a 4th fail, a student will be exlcuded from the course"
        );
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
    let rows = sortHistoryRows(getHistoryRows());
    if (historyOnlyPassed) {
      rows = rows.filter((row) => !isWithdrawOrFailGrade(row.result));
    }
    renderSubjectTable(historyTable, rows, 'No completed subjects to show.');
    renderCurrentEnrolments();
    updateHistorySortButtons();
    updateHistoryOnlyPassedButton();
    updateHistoryColoursButton();
  };

  function loadEmailScriptsFromFile(file) {
    if (!file) return;
    emailScriptsFileObject = file;
    const prevPath = emailScriptsInfo?.path || getPathDirname(emailScriptsSourcePath || '') || '';
    const name = String(file.name || '');
    const isHtmlLike = /\.(html|htm)$/i.test(name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const loaded = event.target.result;
      if (isHtmlLike) {
        if (loaded instanceof ArrayBuffer) {
          const charset = sniffHtmlCharset(loaded) || 'utf-8';
          emailScriptsHtmlSource = decodeBufferWithCharset(loaded, charset);
        } else {
          const rawText = String(loaded || '');
          emailScriptsHtmlSource = rawText;
        }
        emailScriptsDocxBuffer = null;
        emailScriptsBaseHref = '';
      } else {
        emailScriptsDocxBuffer = loaded;
        emailScriptsHtmlSource = '';
        emailScriptsBaseHref = '';
      }
      emailScriptsFileName = name || 'Email Scripts.html';
      if (!emailScriptsSourcePath) {
        const inferredDir = getPathDirname(file.webkitRelativePath || '');
        if (inferredDir) {
          emailScriptsSourcePath = `${inferredDir}${emailScriptsFileName}`;
        } else if (prevPath) {
          emailScriptsSourcePath = `${prevPath}${emailScriptsFileName}`;
        }
      }
      emailScriptsCache = null;
      emailScriptsInfo = {
        fileName: emailScriptsFileName,
        modifiedMs: Number.isFinite(file.lastModified) ? file.lastModified : null,
        path: prevPath,
      };
      parseEmailScripts().catch(() => {});
      scheduleFolderShortcutPanelRefresh();
      if (lastDroppedFileInfo) {
        renderDropZoneStatus(buildDropZoneStatusLines());
      }
    };
    if (isHtmlLike) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  const fileLocationNames = [
    'file_locations.txt',
    'file locations.txt',
    'file_locations.text',
    'file locations.text',
  ];
  const logFilePathDebug = () => {};

  const isFileLocationsName = (name = '') => {
    const cleaned = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_.-]/g, '');
    if (!cleaned) return false;
    if (fileLocationNames.includes(cleaned)) return true;
    return /file[_-]?locations\.(txt|text)$/i.test(cleaned);
  };

  const parseFileLocationsText = (text = '') => {
    const rawLines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    fileLocationsProfileOverride = '';
    fileLocationsIntakeOverride = '';
    rawLines.forEach((line) => {
      const match = line.match(/^#\s*profile\s*=\s*([A-Za-z0-9._-]+)\s*$/i);
      if (match && match[1]) {
        fileLocationsProfileOverride = match[1].trim();
      }
      const intakeMatch = line.match(/^#\s*intake\s*=\s*(.+?)\s*$/i);
      if (intakeMatch && intakeMatch[1]) {
        fileLocationsIntakeOverride = intakeMatch[1].trim();
      }
    });
    const valueLines = rawLines.filter((line) => !line.startsWith('#'));
    const parts = valueLines.flatMap((line) => line.split(','));
    const profileHint = getProfileNameHint();
    const intakeHint = getIntakeNameHint();
    const parsed = parts
      .map((part) => part.trim())
      .map((part) => {
        let updated = part;
        if (profileHint) {
          updated = updated
            .replace(/\{PROFILE\}/gi, profileHint)
            .replace(/\\Users\\XXXXX\\/gi, `\\Users\\${profileHint}\\`)
            .replace(/\/Users\/XXXXX\//gi, `/Users/${profileHint}/`);
        }
        if (intakeHint) {
          updated = updated.replace(/\{INTAKE\}/gi, intakeHint);
        }
        return updated;
      })
      .map((part) => part.replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
    logFilePathDebug('parseFileLocationsText', {
      profileHint,
      intakeHint,
      profileOverride: fileLocationsProfileOverride || '',
      rawLines,
      parsed,
    });
    return parsed;
  };

  const getPathBasename = (value = '') => {
    const clean = value.split('#')[0].split('?')[0];
    const parts = clean.split(/[\\/]/);
    return parts[parts.length - 1] || clean;
  };
  const getPathDirname = (value = '') => {
    const clean = String(value || '').split('#')[0].split('?')[0];
    const slashIdx = clean.lastIndexOf('/');
    const backIdx = clean.lastIndexOf('\\');
    const idx = Math.max(slashIdx, backIdx);
    if (idx === -1) return '';
    return clean.slice(0, idx + 1);
  };

  const joinPath = (base = '', leaf = '') => {
    const b = String(base || '').trim();
    const l = String(leaf || '').trim();
    if (!b) return l;
    if (!l) return b;
    if (/[\\/]$/.test(b)) return `${b}${l}`;
    const sep = b.includes('\\') ? '\\' : '/';
    return `${b}${sep}${l}`;
  };

  const getClientOs = () => {
    const platform = String(navigator?.platform || '').toLowerCase();
    const ua = String(navigator?.userAgent || '').toLowerCase();
    if (platform.includes('mac') || ua.includes('mac os')) return 'mac';
    if (platform.includes('win') || ua.includes('windows')) return 'windows';
    return 'other';
  };

  const decodePathValue = (value = '') => {
    const raw = String(value || '').trim().replace(/^['"]|['"]$/g, '');
    if (!raw) return '';
    let output = raw.split('#')[0].split('?')[0];
    if (/^file:\/\//i.test(output) || /^https?:\/\//i.test(output)) {
      try {
        const parsed = new URL(output);
        output = parsed.pathname || '';
      } catch {
        output = raw;
      }
    }
    try {
      output = decodeURIComponent(output);
    } catch {
      output = output;
    }
    if (/^\/[A-Za-z]:\//.test(output)) output = output.slice(1);
    return output;
  };

  const isAbsoluteFsPath = (value = '') => {
    const raw = String(value || '').trim();
    if (!raw) return false;
    return /^[A-Za-z]:[\\/]/.test(raw) || /^\\\\/.test(raw) || raw.startsWith('/');
  };

  const extractSemesterFolderPath = (rawPath = '', os = getClientOs()) => {
    const decoded = decodePathValue(rawPath);
    if (!decoded) return '';
    const slashPath = decoded.replace(/\\/g, '/').replace(/\/+/g, '/');
    if (!slashPath) return '';
    const startsWithSlash = slashPath.startsWith('/');
    const segments = slashPath.split('/').filter(Boolean);
    if (!segments.length) return '';
    const normalizedSegments = segments.map((seg) => normalizeHeadingText(seg));
    let semesterIdx = -1;
    const enrolmentSystemIdx = normalizedSegments.findIndex((seg) => seg === 'enrolment system');
    if (enrolmentSystemIdx > 0) {
      semesterIdx = enrolmentSystemIdx - 1;
    }
    if (semesterIdx < 0) {
      semesterIdx = segments.findIndex((seg) => /^enrol\s*\d/i.test(String(seg || '')));
    }
    if (semesterIdx < 0) return '';
    const kept = segments.slice(0, semesterIdx + 1);
    if (!kept.length) return '';
    const semesterSegment = String(kept[kept.length - 1] || '').trim();
    if (/^\{.+\}$/.test(semesterSegment)) return '';
    const isWindowsPath = /^[A-Za-z]:$/.test(kept[0]) || /^[A-Za-z]:/.test(slashPath);
    let output = kept.join('/');
    if (startsWithSlash && !isWindowsPath) {
      output = `/${output}`;
    }
    if (isWindowsPath || os === 'windows') {
      return output.replace(/\//g, '\\');
    }
    return output;
  };

  const getSemesterFolderPath = () => {
    const os = getClientOs();
    const candidates = [];
    const pushCandidate = (value, score) => {
      const raw = String(value || '').trim();
      if (!raw) return;
      candidates.push({ value: raw, score });
    };
    pushCandidate(fileLocationsCache?.root, 160);
    pushCandidate(fileLocationsCache?.source, 155);
    pushCandidate(fileLocationsCache?.triage, 152);
    pushCandidate(fileLocationsCache?.email, 151);
    pushCandidate(lastDroppedFileInfo?.path, 145);
    pushCandidate(emailScriptsInfo?.path, 142);
    pushCandidate(triageFileInfo?.path, 141);
    pushCandidate(emailScriptsSourcePath, 138);
    if (window.location.protocol === 'file:') {
      pushCandidate(window.location.href, 130);
      pushCandidate(window.location.pathname, 129);
    }
    pushCandidate(window.location.pathname, 40);
    const seen = new Set();
    let bestPath = '';
    let bestScore = -1;
    candidates.forEach(({ value, score }) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      const semesterPath = extractSemesterFolderPath(value, os);
      if (!semesterPath) return;
      let weight = score;
      if (isAbsoluteFsPath(semesterPath)) weight += 20;
      if (/enrolment system/i.test(String(value))) weight += 10;
      if (/^enrol\s*\d/i.test(getPathBasename(semesterPath))) weight += 8;
      if (weight > bestScore) {
        bestScore = weight;
        bestPath = semesterPath;
      }
    });
    return bestPath;
  };

  const sanitizeFolderSegment = (value = '', os = getClientOs()) => {
    let cleaned = String(value || '').trim();
    if (!cleaned) return '';
    cleaned = cleaned.replace(/[\\/]/g, ' ').replace(/\s+/g, ' ').trim();
    if (os === 'windows') {
      cleaned = cleaned.replace(/[<>:"|?*]/g, '').trim();
    }
    return cleaned;
  };

  const toFolderHref = (value = '') => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^file:\/\//i.test(raw) || /^https?:\/\//i.test(raw)) return raw;
    if (/^[A-Za-z]:[\\/]/.test(raw)) {
      const normalized = raw.replace(/\\/g, '/');
      return `file:///${encodeURI(normalized).replace(/#/g, '%23')}`;
    }
    if (/^\\\\/.test(raw)) {
      const normalized = raw.replace(/\\/g, '/').replace(/^\/+/, '');
      return `file://${encodeURI(normalized).replace(/#/g, '%23')}`;
    }
    if (/^\//.test(raw)) {
      return `file://${encodeURI(raw).replace(/#/g, '%23')}`;
    }
    try {
      return new URL(encodeURI(raw), window.location.href).toString();
    } catch {
      return '';
    }
  };

  const toWindowsExplorerSearchHref = (folderPath = '', label = 'Folder') => {
    const raw = String(folderPath || '').trim();
    if (!raw) return '';
    let windowsPath = decodePathValue(raw) || raw;
    windowsPath = windowsPath.replace(/\//g, '\\').replace(/[\\]+$/, '');
    if (/^\\[^\\]/.test(windowsPath)) windowsPath = `\\${windowsPath}`;
    if (!/^[A-Za-z]:\\/.test(windowsPath) && !/^\\\\/.test(windowsPath)) return '';
    const displayName =
      sanitizeFolderSegment(label, 'windows') ||
      sanitizeFolderSegment(getPathBasename(windowsPath), 'windows') ||
      'Folder';
    const parts = [
      `displayname=${encodeURIComponent(displayName)}`,
      `query=${encodeURIComponent('*')}`,
      `crumb=${encodeURIComponent(`location:${windowsPath}`)}`,
    ];
    return `search-ms:${parts.join('&')}`;
  };

  const toEnrolProtocolHref = (folderPath = '') => {
    let raw = String(folderPath || '').trim();
    if (!raw) return '';
    raw = decodePathValue(raw) || raw;
    raw = raw.replace(/\//g, '\\').replace(/[\\]+$/, '');
    if (/^\\[^\\]/.test(raw)) raw = `\\${raw}`;
    if (/^\/[A-Za-z]:\\/.test(raw)) raw = raw.slice(1);
    if (!/^[A-Za-z]:\\/.test(raw) && !/^\\\\/.test(raw)) return '';
    return `enrol://open?path=${encodeURIComponent(raw)}`;
  };

  const launchEnrolProtocol = (folderPath = '') => {
    const href = toEnrolProtocolHref(folderPath);
    if (!href) return false;
    try {
      // Hidden iframe avoids popup blockers for user-initiated external protocol launch.
      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.style.position = 'fixed';
      frame.style.width = '1px';
      frame.style.height = '1px';
      frame.style.opacity = '0';
      frame.style.pointerEvents = 'none';
      frame.src = href;
      document.body.appendChild(frame);
      window.setTimeout(() => {
        try {
          frame.remove();
        } catch {
          // ignore cleanup errors
        }
      }, 1200);
      return true;
    } catch {
      return false;
    }
  };

  const waitForExternalLaunchSignal = (timeoutMs = 450) =>
    new Promise((resolve) => {
      let settled = false;
      let timerId = 0;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        if (timerId) window.clearTimeout(timerId);
        window.removeEventListener('blur', handleBlur, true);
        window.removeEventListener('pagehide', handlePageHide, true);
        document.removeEventListener('visibilitychange', handleVisibility, true);
        resolve(!!result);
      };
      function handleBlur() {
        finish(true);
      }
      function handlePageHide() {
        finish(true);
      }
      function handleVisibility() {
        if (document.hidden) finish(true);
      }
      window.addEventListener('blur', handleBlur, true);
      window.addEventListener('pagehide', handlePageHide, true);
      document.addEventListener('visibilitychange', handleVisibility, true);
      timerId = window.setTimeout(() => finish(false), Math.max(120, Number(timeoutMs) || 0));
    });

  const copyPlainText = async (value = '') => {
    const text = String(value || '');
    if (!text) return false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fall through to textarea fallback
      }
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      ta.style.pointerEvents = 'none';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return !!ok;
    } catch {
      return false;
    }
  };

  const openFolderShortcutPath = async (folderPath = '', label = 'Folder') => {
    const cleanPath = String(folderPath || '').trim();
    if (!cleanPath) return false;
    const os = getClientOs();
    const href = toFolderHref(cleanPath);
    if (os === 'windows' && isAbsoluteFsPath(cleanPath) && isEnrolProtocolEnabled()) {
      const launched = launchEnrolProtocol(cleanPath);
      if (launched) {
        const protocolHandled = await waitForExternalLaunchSignal(450);
        if (protocolHandled) return true;
      }
    }
    if (/^https?:\/\//i.test(href) && openHrefInNewTab(href)) return true;
    if (os === 'windows' && isAbsoluteFsPath(cleanPath)) {
      if (href && /^file:\/\//i.test(href)) {
        const openedDirect = await openHrefWithVerification(href, 220);
        if (openedDirect) return true;
      }
      const searchHref = toWindowsExplorerSearchHref(cleanPath, label);
      if (searchHref) {
        try {
          window.location.href = searchHref;
          if (!folderShortcutSearchFallbackNotified) {
            folderShortcutSearchFallbackNotified = true;
            window.alert('Direct folder links are blocked by this browser, so Windows Explorer is opening in Search view as fallback.');
          }
          return true;
        } catch {
          if (openHrefInNewTab(searchHref)) {
            if (!folderShortcutSearchFallbackNotified) {
              folderShortcutSearchFallbackNotified = true;
              window.alert('Direct folder links are blocked by this browser, so Windows Explorer is opening in Search view as fallback.');
            }
            return true;
          }
        }
      }
    }
    if (href && openHrefInNewTab(href)) return true;
    if (href) {
      try {
        window.location.href = href;
        return true;
      } catch {
        // fall through to copy fallback
      }
    }
    const copied = await copyPlainText(cleanPath);
    if (copied && os === 'windows') {
      window.alert(`Could not open ${label} directly from browser. Path copied to clipboard.`);
    } else if (copied) {
      window.alert(`Could not open ${label}. Path copied to clipboard.`);
    } else {
      window.alert(`Could not open ${label}. Path: ${cleanPath}`);
    }
    return false;
  };

  const getSemesterFolderNameHint = () => {
    const os = getClientOs();
    const candidates = [];
    const pushCandidate = (value) => {
      const raw = String(value || '').trim();
      if (raw) candidates.push(raw);
    };
    pushCandidate(fileLocationsCache?.root);
    pushCandidate(fileLocationsCache?.source);
    pushCandidate(fileLocationsCache?.triage);
    pushCandidate(fileLocationsCache?.email);
    pushCandidate(lastDroppedFileInfo?.path);
    pushCandidate(emailScriptsInfo?.path);
    pushCandidate(triageFileInfo?.path);
    pushCandidate(emailScriptsSourcePath);
    pushCandidate(window.location.href);
    pushCandidate(window.location.pathname);
    for (const raw of candidates) {
      const semesterPath = extractSemesterFolderPath(raw, os);
      if (!semesterPath) continue;
      const base = getPathBasename(String(semesterPath || '').replace(/[\\/]+$/, ''));
      if (!base || /^\{.+\}$/.test(base)) continue;
      if (/^enrol\s*\d/i.test(base)) return base;
      if (base) return base;
    }
    return getIntakeNameHint() || 'Enrol';
  };

  const setFolderShortcutButton = (button, label, folderPath, fallbackLabel = 'Folder') => {
    if (!button) return;
    const cleanLabel = String(label || '').trim() || String(fallbackLabel || 'Folder').trim();
    const cleanPath = String(folderPath || '').trim();
    button.classList.remove('hidden-initial');
    button.textContent = cleanLabel;
    button.disabled = false;
    if (!cleanPath) {
      button.classList.add('is-unavailable');
      button.removeAttribute('data-path');
      button.setAttribute('title', `${cleanLabel} (path unavailable)`);
      return;
    }
    button.classList.remove('is-unavailable');
    button.setAttribute('data-path', cleanPath);
    button.setAttribute('title', cleanPath);
  };

  const renderFolderShortcutPanel = async () => {
    if (!folderShortcutsPanel) return;
    const showPanel = !!staffFacing;
    folderShortcutsPanel.classList.toggle('hidden-initial', !showPanel);
    if (!showPanel) return;
    await ensureFileLocationsCacheLoaded().catch(() => false);
    const os = getClientOs();
    const semesterPath = getSemesterFolderPath();
    const semesterLabel = getSemesterFolderNameHint();
    const studentFormsPath = semesterPath ? joinPath(semesterPath, 'Student Forms') : '';
    let teacherName = String(emailScriptsCache?.preferences?.signOffName || '').trim();
    if (!teacherName && (emailScriptsDocxBuffer || emailScriptsHtmlSource)) {
      const scripts = await parseEmailScripts().catch(() => null);
      teacherName = String(scripts?.preferences?.signOffName || '').trim();
    }
    const teacherLabel = 'My temp';
    const teacherFolderPath =
      semesterPath
        ? joinPath(
            joinPath(semesterPath, 'Our temp and working files'),
            sanitizeFolderSegment(teacherName, os)
          )
        : '';
    const teacherFallbackPath =
      semesterPath ? joinPath(semesterPath, 'Our temp and working files') : '';
    setFolderShortcutButton(
      folderShortcutSemesterButton,
      semesterLabel,
      semesterPath,
      semesterLabel
    );
    setFolderShortcutButton(folderShortcutStudentFormsButton, 'Stud. Forms', studentFormsPath, 'Stud. Forms');
    setFolderShortcutButton(
      folderShortcutTeacherButton,
      teacherLabel,
      teacherFolderPath || teacherFallbackPath,
      teacherLabel
    );
    if (folderShortcutHelpButton) {
      folderShortcutHelpButton.classList.remove('hidden-initial');
      folderShortcutHelpButton.classList.remove('is-unavailable');
      folderShortcutHelpButton.disabled = false;
      folderShortcutHelpButton.textContent = '?';
      folderShortcutHelpButton.removeAttribute('data-path');
      folderShortcutHelpButton.setAttribute(
        'title',
        isEnrolProtocolEnabled()
          ? 'Protocol helper enabled (click to view/toggle)'
          : 'Install/enable Windows helper protocol'
      );
    }
  };

  scheduleFolderShortcutPanelRefresh = () => {
    void renderFolderShortcutPanel();
  };

  if (folderShortcutsPanel) {
    folderShortcutsPanel.addEventListener('click', async (event) => {
      const target = event.target?.closest?.('.folder-shortcut-btn');
      if (!target) return;
      event.preventDefault();
      if (target.id === 'folder-shortcut-help') {
        const os = getClientOs();
        if (os !== 'windows') {
          window.alert('Windows only.');
          return;
        }
        showFolderShortcutHelpPopup();
        return;
      }
      let path = String(target.getAttribute('data-path') || '').trim();
      const label = String(target.textContent || '').trim() || 'Folder';
      if (!path) {
        await renderFolderShortcutPanel();
        path = String(target.getAttribute('data-path') || '').trim();
      }
      if (!path) {
        window.alert(`Could not resolve ${label} path yet. Check file_locations.txt.`);
        return;
      }
      const copiedPath = await copyPlainText(path);
      if (copiedPath) {
        triggerFlash(target);
      }
      void openFolderShortcutPath(path, label);
    });
  }
  scheduleFolderShortcutPanelRefresh();

  const applyPathPlaceholders = (value = '') => {
    let updated = String(value || '');
    const profileHint = getProfileNameHint();
    const intakeHint = getIntakeNameHint();
    if (profileHint) {
      updated = updated
        .replace(/\{PROFILE\}/gi, profileHint)
        .replace(/\\Users\\XXXXX\\/gi, `\\Users\\${profileHint}\\`)
        .replace(/\/Users\/XXXXX\//gi, `/Users/${profileHint}/`);
    }
    if (intakeHint) {
      updated = updated.replace(/\{INTAKE\}/gi, intakeHint);
    }
    return updated;
  };

  const toFileUrlIfNeeded = (value = '') => {
    const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
    if (!trimmed) return '';
    if (/^(https?|file):/i.test(trimmed)) return trimmed;
    if (/^[A-Za-z]:\\/.test(trimmed)) {
      const normalized = trimmed.replace(/\\/g, '/');
      return encodeURI(`file:///${normalized}`);
    }
    try {
      return new URL(encodeURI(trimmed), window.location.href).toString();
    } catch {
      return trimmed;
    }
  };

  const classifyFileLocations = (locations = []) => {
    let source = '';
    let triage = '';
    let email = '';
    let root = '';
    const others = [];
    const emailMatches = [];
    locations.forEach((loc) => {
      const name = getPathBasename(loc).toLowerCase();
      if (!source && /^source.*\.xlsx$/i.test(name)) {
        source = loc;
        return;
      }
      if (!triage && /^triage.*\.xlsx$/i.test(name)) {
        triage = loc;
        return;
      }
      if (/^email scripts\.(docx|html|htm)$/i.test(name)) {
        emailMatches.push(loc);
        return;
      }
      others.push(loc);
    });
    if (!email && emailMatches.length) {
      const preferred = emailMatches.find((loc) => /\.docx$/i.test(loc));
      email = preferred || emailMatches[0];
    }
    root =
      others.find((loc) => /[\\/]$/.test(String(loc || '').trim())) ||
      others.find((loc) => {
        const base = getPathBasename(String(loc || '').trim());
        return base && !/\.[a-z0-9]{2,8}$/i.test(base);
      }) ||
      '';
    logFilePathDebug('classifyFileLocations', { source, triage, email, root, others });
    return { source, triage, email, root, others };
  };

  const fetchFileBlob = async (locationValue) => {
    const url = toFileUrlIfNeeded(locationValue);
    if (!url) return null;
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return null;
      const blob = await response.blob();
      const name = getPathBasename(locationValue) || getPathBasename(url);
      const lastModifiedHeader = response.headers.get('last-modified');
      const modifiedMs = lastModifiedHeader ? Date.parse(lastModifiedHeader) : null;
      return { blob, name, modifiedMs: Number.isFinite(modifiedMs) ? modifiedMs : null };
    } catch {
      return null;
    }
  };

  const staffHandleStore = {
    dbPromise: null,
    getDb() {
      if (this.dbPromise) return this.dbPromise;
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open('staff-folder-store', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('handles')) {
            db.createObjectStore('handles');
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      return this.dbPromise;
    },
    async setHandle(key, handle) {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('handles', 'readwrite');
        tx.objectStore('handles').put(handle, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },
    async getHandle(key) {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('handles', 'readonly');
        const req = tx.objectStore('handles').get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    },
  };
  const STAFF_HANDLE_KEY = 'staff-folder-handle';

  const hasDirectoryPicker = () => typeof window.showDirectoryPicker === 'function';

  const ensureHandlePermission = async (handle) => {
    if (!handle) return false;
    try {
      const status = await handle.queryPermission({ mode: 'read' });
      if (status === 'granted') return true;
    } catch {
      // ignore and fall through to request
    }
    try {
      const status = await handle.requestPermission({ mode: 'read' });
      return status === 'granted';
    } catch {
      return false;
    }
  };

  const findFilesInHandle = async (rootHandle, maxDepth = 2) => {
    const results = [];
    const queue = [{ handle: rootHandle, depth: 0, path: '' }];
    while (queue.length) {
      const { handle, depth, path } = queue.shift();
      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          results.push({ handle: entry, depth, path });
          continue;
        }
        if (entry.kind === 'directory' && depth < maxDepth) {
          queue.push({ handle: entry, depth: depth + 1, path: `${path}${entry.name}/` });
        }
      }
    }
    return results;
  };

  const pickBestFileByDepth = (entries, matcher, preferExactName) => {
    const matches = entries.filter((entry) => matcher(entry.handle?.name || ''));
    if (!matches.length) return null;
    if (preferExactName) {
      const exact = matches.find((entry) => preferExactName(entry.handle?.name || ''));
      if (exact) return exact;
    }
    matches.sort((a, b) => a.depth - b.depth || String(a.handle?.name || '').localeCompare(String(b.handle?.name || '')));
    return matches[0] || null;
  };

  const formatHandlePath = (entryPath = '') => {
    const root = staffFolderHandle?.name ? `${staffFolderHandle.name}/` : '';
    return `${root}${entryPath || ''}`;
  };

  const getBestStaffFiles = async () => {
    if (!staffFolderHandle) return null;
    const allowed = await ensureHandlePermission(staffFolderHandle);
    if (!allowed) return null;
    const fileEntries = await findFilesInHandle(staffFolderHandle, 2);
    const sourceExact = (name) => String(name || '').toLowerCase() === 'source.xlsx';
    const sourceStarts = (name) => /^source.*\.xlsx$/i.test(name || '');
    const triageStarts = (name) => /^triage.*\.xlsx$/i.test(name || '');
    const emailExact = (name) =>
      /^email scripts\.(docx|html|htm)$/i.test(String(name || ''));
    const bestSource = pickBestFileByDepth(
      fileEntries,
      (name) => sourceExact(name) || sourceStarts(name),
      (name) => sourceExact(name)
    );
    const bestTriage = pickBestFileByDepth(fileEntries, (name) => triageStarts(name));
    const bestEmail = pickBestFileByDepth(fileEntries, (name) => emailExact(name), (name) =>
      /\.(html|htm)$/i.test(String(name || ''))
    );
    return { bestSource, bestEmail, bestTriage };
  };

  const loadFilesFromDirectoryHandle = async (dirHandle, options = {}) => {
    const { sourceOnly = false } = options || {};
    if (!dirHandle) return false;
    const allowed = await ensureHandlePermission(dirHandle);
    if (!allowed) return false;
    const best = await getBestStaffFiles();
    if (!best) return false;
    const { bestSource, bestEmail, bestTriage } = best;
    const handles = [bestSource, bestEmail, bestTriage].filter(Boolean).map((entry) => entry.handle);
    const files = await Promise.all(handles.map((h) => h.getFile()));
    if (sourceOnly) {
      const sourceOnlyFiles = files.filter((file) => /^source.*\.xlsx$/i.test(file?.name || ''));
      handleSourceFilesSelection(sourceOnlyFiles);
      return true;
    }
    handleSourceFilesSelection(files);
    if (bestSource && lastDroppedFileInfo) {
      lastDroppedFileInfo.path = formatHandlePath(bestSource.path || '');
    }
    if (bestEmail) {
      const emailDir = formatHandlePath(bestEmail.path || '');
      const emailName = String(bestEmail.handle?.name || '').trim();
      emailScriptsSourcePath = emailName ? `${emailDir}${emailName}` : emailDir;
      if (emailScriptsInfo) {
        emailScriptsInfo.path = emailDir;
      }
    }
    if (bestTriage && triageFileInfo) {
      triageFileInfo.path = formatHandlePath(bestTriage.path || '');
    }
    ensureFileLocationsCacheLoaded().then((loaded) => {
      if (!loaded) return;
      if (lastDroppedFileInfo || emailScriptsInfo || triageFileInfo) {
        renderDropZoneStatus(buildDropZoneStatusLines());
      }
    }).catch(() => {});
    return true;
  };

  const loadFromStoredDirectoryHandle = async (options = {}) => {
    if (!hasDirectoryPicker()) return false;
    if (!staffFolderHandle) {
      try {
        staffFolderHandle = await staffHandleStore.getHandle(STAFF_HANDLE_KEY);
      } catch {
        staffFolderHandle = null;
      }
    }
    if (!staffFolderHandle) return false;
    return loadFilesFromDirectoryHandle(staffFolderHandle, options);
  };

  const toFileUrl = (path) => {
    const raw = String(path || '').trim();
    if (!raw) return '';
    if (/^file:\/\//i.test(raw)) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[a-z]:[\\/]/i.test(raw)) {
      const normalized = raw.replace(/\\/g, '/');
      return `file:///${encodeURI(normalized).replace(/#/g, '%23')}`;
    }
    return '';
  };

  const openHrefInNewTab = (href) => {
    if (!href) return false;
    try {
      const link = document.createElement('a');
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
      return true;
    } catch {
      return false;
    }
  };

  const openHrefWithVerification = async (href, verifyDelayMs = 200) => {
    if (!href) return false;
    try {
      const popup = window.open(href, '_blank');
      if (!popup) return false;
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(verifyDelayMs) || 0)));
      if (popup.closed) return false;
      try {
        const popupHref = String(popup.location?.href || '').trim();
        if (!popupHref || popupHref === 'about:blank') {
          popup.close();
          return false;
        }
      } catch {
        // Cross-origin or external protocol navigation succeeded.
      }
      return true;
    } catch {
      return false;
    }
  };

  const buildOfficeProtocolHref = (type, href) => {
    if (!/^file:\/\//i.test(String(href || ''))) return '';
    if (type === 'email') return `ms-word:ofe|u|${href}`;
    if (type === 'source' || type === 'triage') return `ms-excel:ofe|u|${href}`;
    return '';
  };

  const openOfficeProtocol = (protocolHref) => {
    if (!protocolHref) return false;
    try {
      window.location.href = protocolHref;
      return true;
    } catch {
      return false;
    }
  };

  const toDocxName = (name) => {
    const raw = String(name || '').trim();
    if (!raw) return 'Email Scripts.docx';
    if (/\.(html|htm)$/i.test(raw)) return raw.replace(/\.(html|htm)$/i, '.docx');
    return raw;
  };

  const getLoadedInfoByType = (type) => {
    if (type === 'source') return lastDroppedFileInfo;
    if (type === 'email') return emailScriptsInfo;
    if (type === 'triage') return triageFileInfo;
    return null;
  };

  const toOriginalHref = (rawValue) => {
    const raw = String(rawValue || '').trim();
    if (!raw) return '';
    if (/^file:\/\//i.test(raw)) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[a-z]:[\\/]/i.test(raw)) return toFileUrl(raw);
    try {
      return new URL(raw, window.location.href).toString();
    } catch {
      return '';
    }
  };

  const buildOriginalPathCandidates = (type) => {
    const info = getLoadedInfoByType(type);
    const originalName = info?.fileName || '';
    const targetName = type === 'email' ? toDocxName(originalName) : originalName;
    const candidates = [];
    const locationCandidate =
      type === 'source'
        ? fileLocationsCache?.source
        : type === 'email'
          ? fileLocationsCache?.email
          : fileLocationsCache?.triage;
    const rootCandidate = String(fileLocationsCache?.root || '').trim();
    if (locationCandidate) {
      const loc = String(locationCandidate).trim();
      if (type === 'email' && /\.(html|htm)$/i.test(loc)) {
        candidates.push(loc.replace(/\.(html|htm)$/i, '.docx'));
      }
      candidates.push(loc);
      if (/[\\/]$/.test(loc) && targetName) {
        candidates.push(`${loc}${targetName}`);
      }
    }
    if (rootCandidate && targetName) {
      candidates.push(joinPath(rootCandidate, targetName));
    }
    if (type === 'email' && rootCandidate) {
      candidates.push(joinPath(rootCandidate, 'Email Scripts.docx'));
    }
    if (type === 'email' && emailScriptsSourcePath) {
      const sourcePath = String(emailScriptsSourcePath);
      if (/\.(html|htm)$/i.test(sourcePath)) {
        candidates.push(sourcePath.replace(/\.(html|htm)$/i, '.docx'));
      }
      candidates.push(sourcePath);
      if (/[\\/]$/.test(sourcePath) && targetName) {
        candidates.push(`${sourcePath}${targetName}`);
      }
    }
    if (info?.path && targetName) {
      candidates.push(`${info.path}${targetName}`);
    }
    const resolved = candidates
      .filter(Boolean)
      .map((entry) => applyPathPlaceholders(entry).trim())
      .filter(Boolean);
    const deduped = Array.from(new Set(resolved));
    logFilePathDebug('buildOriginalPathCandidates', { type, deduped, fileLocationsCache });
    return deduped;
  };

  const openLoadedFile = async (type) => {
    await ensureFileLocationsCacheLoaded().catch(() => false);
    const candidates = buildOriginalPathCandidates(type);
    for (const candidate of candidates) {
      const href = toOriginalHref(candidate);
      logFilePathDebug('openLoadedFile attempt', { type, candidate, href });
      if (!href) continue;
      const officeHref = buildOfficeProtocolHref(type, href);
      if (officeHref) {
        logFilePathDebug('openLoadedFile office protocol', { type, officeHref });
        if (openOfficeProtocol(officeHref)) return true;
      }
      if (openHrefInNewTab(href)) return true;
    }
    logFilePathDebug('openLoadedFile failed', { type, candidates });
    return false;
  };

  const showEmailScriptsOpenError = (type) => {
    if (type === 'email') {
      window.alert('Could not open Email Scripts.docx in Word. Check Office protocol handling in your browser/Windows and try again.');
      return;
    }
    const label = type === 'source' ? 'Source.xlsx' : 'Triage.xlsx';
    window.alert(`Could not open ${label} in Excel. Check Office protocol handling in your browser/Windows and try again.`);
  };

  const handleDropZoneActionClick = (key) => {
    logFilePathDebug('handleDropZoneActionClick', { key, fileLocationsCache, emailScriptsSourcePath });
    if (key === 'email-actions') {
      showEmailScriptsAccessModal();
      return;
    }
    if (!['source', 'email', 'triage'].includes(key)) return;
    openLoadedFile(key).then((opened) => {
      if (!opened) showEmailScriptsOpenError(key);
    });
  };

  const promptForDirectoryHandle = async (options = {}) => {
    if (!hasDirectoryPicker()) return false;
    try {
      const handle = await window.showDirectoryPicker();
      staffFolderHandle = handle || null;
      if (staffFolderHandle) {
        await staffHandleStore.setHandle(STAFF_HANDLE_KEY, staffFolderHandle);
        return loadFilesFromDirectoryHandle(staffFolderHandle, options);
      }
    } catch {
      return false;
    }
    return false;
  };

  const loadFilesFromLocations = async (locations = [], options = {}) => {
    const { sourceOnly = false } = options || {};
    const { source, triage, email, root } = classifyFileLocations(locations);
    fileLocationsCache = { source, triage, email, root, updatedAt: Date.now() };
    logFilePathDebug('loadFilesFromLocations cache', fileLocationsCache);

    if (!source && !triage && !email && !root) {
      renderDropZoneStatus(['No Source/Triage/Email Scripts locations found in file_locations.']);
      return;
    }
    if (isFileProtocol) {
      renderDropZoneStatus([
        'file_locations read OK, but browser blocks loading local files by path.',
        'Drop Source.xlsx, Email Scripts (docx/html), and Triage*.xlsx directly onto the drop zone.',
      ]);
      return;
    }

    if (source) {
      const sourceBlob = await fetchFileBlob(source);
      if (sourceBlob?.blob) {
        const file = new File([sourceBlob.blob], sourceBlob.name, {
          type: sourceBlob.blob.type,
          lastModified: sourceBlob.modifiedMs || Date.now(),
        });
        sourceWorkbookFileObject = file;
        lastDroppedFileInfo = {
          fileName: sourceBlob.name,
          modifiedMs: sourceBlob.modifiedMs || null,
          path: getPathDirname(source),
        };
        renderDropZoneStatus(buildDropZoneStatusLines());
        loadWorkbookFromFile(file);
      }
    }

    if (sourceOnly) return;

    if (email) {
      const emailBlob = await fetchFileBlob(email);
      if (emailBlob?.blob) {
        const file = new File([emailBlob.blob], emailBlob.name, {
          type: emailBlob.blob.type,
          lastModified: emailBlob.modifiedMs || Date.now(),
        });
        emailScriptsFileObject = file;
        emailScriptsSourcePath = email;
        emailScriptsInfo = emailScriptsInfo || {};
        emailScriptsInfo.path = getPathDirname(email);
        loadEmailScriptsFromFile(file);
      }
    }

    if (triage) {
      const triageBlob = await fetchFileBlob(triage);
      if (triageBlob?.blob) {
        triageWorkbookFileObject = new File([triageBlob.blob], triageBlob.name, {
          type: triageBlob.blob.type,
          lastModified: triageBlob.modifiedMs || Date.now(),
        });
        triageWorkbookBuffer = await triageBlob.blob.arrayBuffer();
        triageWorkbookFileName = triageBlob.name || 'Triage.xlsx';
        triageFileInfo = {
          fileName: triageWorkbookFileName,
          modifiedMs: triageBlob.modifiedMs || null,
          path: getPathDirname(triage),
        };
        skipTriageParseOnLoad = false;
        scheduleTriageParse(triageWorkbookBuffer);
      } else {
        triageWorkbookFileObject = null;
        triageWorkbookBuffer = null;
        triageFileInfo = null;
        triageRecords = new Map();
        triagePreviewRows = [];
        updateStudentPreview();
      }
    }
  };

  const loadFileLocationsFromText = async (text, options = {}) => {
    const locations = parseFileLocationsText(text);
    logFilePathDebug('loadFileLocationsFromText locations', locations);
    if (!locations.length) {
      renderDropZoneStatus(['file_locations had no readable paths.']);
      return;
    }
    await loadFilesFromLocations(locations, options);
  };

  async function readFileLocationsSiteText() {
    const primaryName = fileLocationNames[0];
    let content = null;
    try {
      const primaryRes = await fetch(primaryName, { cache: 'no-store' });
      if (primaryRes.ok) content = await primaryRes.text();
    } catch {
      // ignore and fall back
    }
    if (!content) {
      for (const name of fileLocationNames.slice(1)) {
        try {
          const res = await fetch(name, { cache: 'no-store' });
          if (res.ok) {
            content = await res.text();
            break;
          }
        } catch {
          // ignore and keep searching
        }
      }
    }
    if (!content && isFileProtocol) {
      const readViaXhr = (name) =>
        new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', name, true);
          xhr.overrideMimeType('text/plain');
          xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300 ? xhr.responseText : null);
          xhr.onerror = () => resolve(null);
          xhr.send();
        });
      content = await readViaXhr(primaryName);
      if (!content) {
        for (const name of fileLocationNames.slice(1)) {
          content = await readViaXhr(name);
          if (content) break;
        }
      }
    }
    return content;
  }

  async function ensureFileLocationsCacheLoaded() {
    if (fileLocationsCache?.updatedAt) return true;
    const content = await readFileLocationsSiteText();
    if (!content) {
      logFilePathDebug('ensureFileLocationsCacheLoaded: file_locations not found');
      return false;
    }
    const locations = parseFileLocationsText(content);
    if (!locations.length) {
      logFilePathDebug('ensureFileLocationsCacheLoaded: no readable locations');
      return false;
    }
    const { source, triage, email, root } = classifyFileLocations(locations);
    fileLocationsCache = { source, triage, email, root, updatedAt: Date.now() };
    logFilePathDebug('ensureFileLocationsCacheLoaded: cache set', fileLocationsCache);
    return true;
  }

  const loadFileLocationsFromSite = async (options = {}) => {
    const content = await readFileLocationsSiteText();
    if (!content) {
      renderDropZoneStatus(['file_locations not found in this folder.']);
      return;
    }
    await loadFileLocationsFromText(content, options);
  };

  const handleSourceFilesSelection = (files = []) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    const sourceWorkbook = list.find((f) => /^source.*\.xlsx$/i.test(f.name || ''));
    const triageWorkbook = list.find((f) => /^triage.*\.xlsx$/i.test(f.name || ''));
    const workbookFile = sourceWorkbook || list.find((f) => /\.xlsx$/i.test(f.name));
    const scriptsCandidates = list.filter(
      (f) =>
        /\.(docx|html|htm)$/i.test(f.name || '') &&
        /email\s*scripts/i.test(f.name || '')
    );
    const scriptsFile =
      scriptsCandidates.find((f) => /\.(html|htm)$/i.test(f.name || '')) ||
      scriptsCandidates[0];
    if (workbookFile) {
      sourceWorkbookFileObject = workbookFile;
      lastDroppedFileInfo = {
        fileName: workbookFile.name,
        modifiedMs: Number.isFinite(workbookFile.lastModified) ? workbookFile.lastModified : null,
        path: getPathDirname(workbookFile.webkitRelativePath || ''),
      };
      if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(true);
      loadWorkbookFromFile(workbookFile);
    }
    if (scriptsFile) {
      emailScriptsFileObject = scriptsFile;
      if (/\.(html|htm)$/i.test(scriptsFile.name || '') && scriptsFile.webkitRelativePath) {
        const baseDir = scriptsFile.webkitRelativePath.replace(/\\/g, '/');
        const dir = baseDir.includes('/') ? baseDir.slice(0, baseDir.lastIndexOf('/') + 1) : '';
        emailScriptsBaseHref = `${window.location.origin}/${dir}`;
      } else {
        emailScriptsBaseHref = '';
      }
      emailScriptsInfo = emailScriptsInfo || {};
      emailScriptsInfo.path = getPathDirname(scriptsFile.webkitRelativePath || '');
      loadEmailScriptsFromFile(scriptsFile);
    }
    if (!scriptsFile && !emailScriptsInfo) {
      emailScriptsFileObject = null;
      emailScriptsInfo = null;
    }
    if (triageWorkbook) {
      triageWorkbookFileObject = triageWorkbook;
      triageWorkbookFileName = triageWorkbook.name;
        triageFileInfo = {
          fileName: triageWorkbook.name,
          modifiedMs: Number.isFinite(triageWorkbook.lastModified) ? triageWorkbook.lastModified : null,
          path: getPathDirname(triageWorkbook.webkitRelativePath || ''),
        };
      const triageReader = new FileReader();
      triageReader.onload = (event) => {
        triageWorkbookBuffer = event.target.result;
        skipTriageParseOnLoad = false;
        scheduleTriageParse(triageWorkbookBuffer);
      };
      triageReader.readAsArrayBuffer(triageWorkbook);
    } else {
      triageWorkbookFileObject = null;
      triageWorkbookBuffer = null;
      triageFileInfo = null;
      triageRecords = new Map();
      updateStudentPreview();
    }
    renderDropZoneStatus(buildDropZoneStatusLines());
  };

  const openSourceFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.docx,.html,.htm';
    input.multiple = true;
    input.addEventListener('change', () => {
      handleSourceFilesSelection(input.files || []);
    });
    input.click();
  };

  const openSourceFolderPicker = async () => {
    if (!window.showDirectoryPicker) {
      openSourceFilePicker();
      return;
    }
    try {
      const dir = await window.showDirectoryPicker();
      const files = [];
      for await (const entry of dir.values()) {
        if (entry.kind !== 'file') continue;
        const file = await entry.getFile();
        files.push(file);
      }
      handleSourceFilesSelection(files);
    } catch (error) {
      // user cancelled; no action needed
    }
  };

  async function loadEmailScriptsFromUrl(urls) {
    const candidates = Array.isArray(urls) ? urls : [urls];
    try {
      let response = null;
      let usedUrl = '';
      for (const candidate of candidates) {
        const cacheBustedUrl = (() => {
          const nonce =
            (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
            `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          try {
            const resolved = new URL(candidate, window.location.href);
            resolved.searchParams.set('t', nonce);
            return resolved.toString();
          } catch {
            const sep = candidate.includes('?') ? '&' : '?';
            return `${candidate}${sep}t=${nonce}`;
          }
        })();
        const attempt = await fetch(cacheBustedUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            Pragma: 'no-cache',
          },
        });
        if (attempt.ok) {
          response = attempt;
          usedUrl = candidate;
          break;
        }
      }
      if (!response) throw new Error('Email scripts not found');
      const lastModified = response.headers.get('last-modified');
      const fileName = usedUrl.split('?')[0].split('/').pop() || 'Email Scripts.html';
      const isHtmlLike = /\.(html|htm)$/i.test(fileName);
      if (isHtmlLike) {
        const buffer = await response.arrayBuffer();
        emailScriptsFileObject = new File([buffer], fileName, {
          type: response.headers.get('content-type') || 'text/html',
          lastModified: Date.now(),
        });
        const charset = sniffHtmlCharset(buffer) || 'utf-8';
        emailScriptsHtmlSource = decodeBufferWithCharset(buffer, charset);
        emailScriptsDocxBuffer = null;
        emailScriptsBaseHref = '';
      } else {
        const buffer = await response.arrayBuffer();
        emailScriptsFileObject = new File([buffer], fileName, {
          type: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          lastModified: Date.now(),
        });
        emailScriptsDocxBuffer = buffer;
        emailScriptsHtmlSource = '';
        emailScriptsBaseHref = '';
      }
      emailScriptsFileName = fileName;
      const modifiedMs = lastModified ? Date.parse(lastModified) : null;
      emailScriptsInfo = {
        fileName: emailScriptsFileName,
        modifiedMs: Number.isFinite(modifiedMs) ? modifiedMs : null,
      };
      parseEmailScripts().catch(() => {});
      scheduleFolderShortcutPanelRefresh();
      if (lastDroppedFileInfo) {
        renderDropZoneStatus(buildDropZoneStatusLines());
      }
    } catch (error) {
      emailScriptsFileObject = null;
      emailScriptsDocxBuffer = null;
      emailScriptsHtmlSource = '';
      emailScriptsInfo = null;
      scheduleFolderShortcutPanelRefresh();
      if (lastDroppedFileInfo) {
        renderDropZoneStatus(buildDropZoneStatusLines());
      }
    }
  }

  const renderRemainingModal = () => {
    const rows = getRemainingRows();
    renderSubjectTable(remainingTable, rows, 'No remaining core or major subjects to show.');
    if (remainingSummary) {
      const majorName = getMajorDisplayName();
      const coreMajorCount = rows.length;
      const remainingElectives = getRemainingElectiveCount();
      remainingSummary.innerHTML = `<p><strong>You have <span class="remaining-count">${coreMajorCount}</span> Core and ${majorName} subjects remaining</strong></p>`;
      if (remainingElectivesCount) {
        remainingElectivesCount.innerHTML = `<strong>You have <span class="remaining-count">${remainingElectives}</span> Elective${remainingElectives === 1 ? '' : 's'} to complete</strong>`;
      }
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
  let courseMapSharedEl = null;
  let courseMapStreamsBlockEl = null;
  let courseMapBaSectionEl = null;
  let courseMapSdSectionEl = null;
  let courseMapSharedRaf = null;
  let courseMapCoreConnectorEl = null;

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
      const prereqs = prerequisites[code] || [];
      const coreqs = corequisites?.[code] || [];
      const prereqEl = document.createElement('div');
      prereqEl.className = 'course-map-prereqs';
      if (code === 'BIT371') {
        prereqEl.textContent = 'Pre: BIT242 & 5 majors';
        cell.appendChild(prereqEl);
      } else if (prereqs.length || coreqs.length) {
        const parts = [];
        if (prereqs.length) parts.push(`Pre: ${prereqs.join(', ')}`);
        if (coreqs.length) parts.push(`Co-requ: ${coreqs.join(', ')}`);
        prereqEl.textContent = parts.join(' ');
        cell.appendChild(prereqEl);
      }
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
          if (isMajorPlaceholder) {
            const slotMatch = entry.match(/\b(\d+)\b/);
            if (slotMatch) cell.dataset.majorSlot = slotMatch[1];
            courseMapMajorPlaceholders.push(cell);
          }
          if (isElectivePlaceholder) {
            const slotMatch = entry.match(/\b(\d+)\b/);
            if (slotMatch) cell.dataset.electiveSlot = slotMatch[1];
            courseMapElectivePlaceholders.push(cell);
          }
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
    const heading = document.createElement('div');
    heading.className = 'course-map-key-title';
    heading.textContent = 'Colour Key';
    courseMapKey.appendChild(heading);
    const items = [
      { label: '(White background) Available to you this semseter', color: '#ffffff' },
      { label: 'Completed - passed or credit', color: '#cfe8ff' },
      { label: 'Current enrolment in your student record', color: 'linear-gradient(135deg, #0b3d91, #9ecbff)', textColor: '#fff' },
      { label: 'Selected here today', color: '#0b3d91', textColor: '#fff' },
      { label: 'You can tick off prerequisite requirements for this subject this semester and study it next semester', color: '#cfcfcf' },
      { label: 'It will take at least 2 semesters to tick-off prerequisites', color: '#7d7d7d', textColor: '#fff' },
      { label: 'Pre: means the subjects that need to be completed before the subject becomes available.', color: 'transparent' },
    ];
    items.forEach((item) => {
      const keyItem = document.createElement('div');
      keyItem.className = 'course-map-key-item';
      const swatch = document.createElement('span');
      swatch.className = 'course-map-key-swatch';
      swatch.style.background = item.color;
      if (item.textColor) swatch.style.borderColor = '#666';
      if (item.color === 'transparent') swatch.style.borderColor = 'transparent';
      const label = document.createElement('span');
      label.textContent = item.label;
      keyItem.appendChild(swatch);
      keyItem.appendChild(label);
      courseMapKey.appendChild(keyItem);
    });
  };

  const buildCourseMapNotes = () => {
    if (!courseMapContent) return;
    if (courseMapNotesEl) {
      courseMapNotesEl.remove();
      courseMapNotesEl = null;
    }
    const notes = document.createElement('div');
    notes.className = 'course-map-notes';
    notes.innerHTML = `
      <div class="notes-title">Notes</div>
      <p class="notes-paragraph notes-pre" data-notes-pre="true">
        Pre (prerequisites) are the subjects that must be completed before starting this subject.
      </p>
      <p class="notes-paragraph">
        <strong>BIT245</strong> belongs to both the Business Analytics and Software Development streams.
      </p>
      <div class="notes-title notes-subtitle">To graduate, complete:</div>
      <ol class="notes-list">
        <li>The 14 subjects on the first 2 rows above. These are the Core subjects.</li>
        <li>One of the Major streams.  That is, all 6 subjects from one of Network Security, Business Analytics, or Software Development.</li>
        <li>Four subjects from the other 2 streams. That is, 4 Electives.</li>
      </ol>
    `;
    const highlightNotesKeywords = (root) => {
      const keywords = ['Pre', 'BIT245', 'Core', 'Major', 'Electives'];
      const seen = new Set();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node) => {
        if (!node?.nodeValue) return;
        let text = node.nodeValue;
        let replaced = false;
        keywords.forEach((keyword) => {
          if (seen.has(keyword)) return;
          const pattern = new RegExp(`\\b${keyword}\\b`);
          const match = pattern.exec(text);
          if (!match) return;
          const before = text.slice(0, match.index);
          const after = text.slice(match.index + keyword.length);
          const frag = document.createDocumentFragment();
          if (before) frag.appendChild(document.createTextNode(before));
          const span = document.createElement('span');
          span.className = 'notes-keyword';
          span.textContent = keyword;
          frag.appendChild(span);
          if (after) frag.appendChild(document.createTextNode(after));
          node.parentNode.replaceChild(frag, node);
          text = after;
          replaced = true;
          seen.add(keyword);
        });
        if (replaced) {
          // stop once we have replaced all keywords
          if (seen.size === keywords.length) return;
        }
      });
    };
    highlightNotesKeywords(notes);
    courseMapNotesEl = notes;
    courseMapContent.appendChild(notes);
  };

  const buildCourseMapLayout = () => {
    if (!courseMapContent) return;
    courseMapContent.innerHTML = '';
    courseMapCells.clear();
    courseMapSharedPlaceholders.length = 0;
    courseMapMajorPlaceholders.length = 0;
    courseMapElectivePlaceholders.length = 0;

    const coreRows = [
      ['BIT106', 'BIT111', 'BIT112', 'BIT231', 'BIT241', 'BIT314', 'BIT352'],
      ['BIT121', 'BIT105', 'BIT108', 'BIT230', 'BIT242', 'BIT371', 'BIT372'],
    ];
    const majorRows = [
      ['Major Subject 1', 'Major Subject 3', 'Major Subject 5', 'Elective Subject 1', 'Elective Subject 3'],
      ['Major Subject 2', 'Major Subject 4', 'Major Subject 6', 'Elective Subject 2', 'Elective Subject 4'],
    ];
    const networkRows = courseMapStreamLayouts.ns;
    const baRows = courseMapStreamLayouts.ba;
    const sdRows = courseMapStreamLayouts.sd;

    const coreBlock = document.createElement('div');
    coreBlock.className = 'course-map-core-block';
    coreBlock.appendChild(buildCourseMapGrid(coreRows, 7, 'course-map-core-grid'));
    coreBlock.appendChild(buildCourseMapGrid(majorRows, 5, 'course-map-major-grid'));
    courseMapContent.appendChild(coreBlock);

    const streamsBlock = document.createElement('div');
    streamsBlock.className = 'course-map-streams-block';
    courseMapStreamsBlockEl = streamsBlock;

    const nsSection = document.createElement('div');
    nsSection.className = 'course-map-stream ns';
    nsSection.dataset.stream = 'ns';
    const nsLabel = document.createElement('div');
    nsLabel.className = 'course-map-stream-label';
    nsLabel.textContent = 'Network Security';
    nsLabel.dataset.stream = 'ns';
    nsSection.appendChild(nsLabel);
    nsSection.appendChild(buildCourseMapGrid(networkRows, 3, 'course-map-stream-grid'));
    streamsBlock.appendChild(nsSection);

    const baSection = document.createElement('div');
    baSection.className = 'course-map-stream ba';
    baSection.dataset.stream = 'ba';
    const baLabel = document.createElement('div');
    baLabel.className = 'course-map-stream-label';
    baLabel.textContent = 'Business Analytics';
    baLabel.dataset.stream = 'ba';
    baSection.appendChild(baLabel);
    baSection.appendChild(buildCourseMapGrid(baRows, 3, 'course-map-stream-grid'));
    streamsBlock.appendChild(baSection);
    courseMapBaSectionEl = baSection;

    const shared = document.createElement('div');
    shared.className = 'course-map-shared';
    const sharedCell = createCourseMapCell({ code: 'BIT245' });
    sharedCell.classList.add('course-map-shared-cell');
    sharedCell.title =
      "BIT245 belongs to both the Business Analtyics (BA) and Software Development (SD) streams.\n  - If your major is Network Security, BIT245 is treated as a single elective.\n  - If your major is BA or SD, it's treated as a single major subject.";
    shared.appendChild(sharedCell);
    streamsBlock.appendChild(shared);
    courseMapSharedEl = shared;

    const sdSection = document.createElement('div');
    sdSection.className = 'course-map-stream sd';
    sdSection.dataset.stream = 'sd';
    const sdLabel = document.createElement('div');
    sdLabel.className = 'course-map-stream-label';
    sdLabel.textContent = 'Software Development';
    sdLabel.dataset.stream = 'sd';
    sdSection.appendChild(sdLabel);
    sdSection.appendChild(buildCourseMapGrid(sdRows, 3, 'course-map-stream-grid'));
    streamsBlock.appendChild(sdSection);
    courseMapSdSectionEl = sdSection;

    courseMapContent.appendChild(streamsBlock);

    buildCourseMapKey();
    buildCourseMapNotes();
  };

  const positionCourseMapArrows = () => {
    if (!courseMapSharedEl || !courseMapStreamsBlockEl || !courseMapBaSectionEl || !courseMapSdSectionEl) return;
    const containerRect = courseMapStreamsBlockEl.getBoundingClientRect();
    const baRect = courseMapBaSectionEl.getBoundingClientRect();
    const sdRect = courseMapSdSectionEl.getBoundingClientRect();
    if (!baRect.height || !sdRect.top) return;
    const baBottom = baRect.bottom - containerRect.top;
    const sdTop = sdRect.top - containerRect.top;
    const gapCenter = sdTop > baBottom ? (baBottom + sdTop) / 2 : baBottom;
    courseMapSharedEl.style.top = '0px';
    courseMapSharedEl.style.transform = 'none';
    courseMapSharedEl.classList.add('arrows-hidden');

    if (courseMapSharedRaf) cancelAnimationFrame(courseMapSharedRaf);
    courseMapSharedRaf = requestAnimationFrame(() => {
      const sharedCell = courseMapSharedEl.querySelector('.course-map-shared-cell');
      const majorKey = getMajorKeyFromUi();
      if (sharedCell) {
        sharedCell.classList.toggle('bit245-overlay', majorKey === 'ba' || majorKey === 'sd');
      }
      const anchorSelector =
        majorKey === 'sd'
          ? '.course-map-stream.sd .course-map-cell.course-map-placeholder[data-placeholder="bit245-sd"]'
          : '.course-map-stream.ba .course-map-cell.course-map-placeholder[data-placeholder="bit245-ba"]';
      const anchorCell = courseMapContent?.querySelector(anchorSelector);
      if (!sharedCell || !anchorCell) return;
      const anchorRect = anchorCell.getBoundingClientRect();
      const isNsMajor = majorKey === 'ns';
      const left = isNsMajor ? anchorRect.left - containerRect.left + 3 : anchorRect.left - containerRect.left;
      const width = isNsMajor ? Math.max(0, anchorRect.width - 6) : anchorRect.width;
      const height = anchorRect.height;
      const adjustedHeight = isNsMajor ? height * 1.1 : height;
      const top =
        majorKey === 'ba' || majorKey === 'sd'
          ? anchorRect.top - containerRect.top
          : gapCenter - adjustedHeight / 2;
      sharedCell.style.left = `${Math.round(left)}px`;
      sharedCell.style.top = `${Math.round(top)}px`;
      sharedCell.style.width = `${Math.round(width)}px`;
      sharedCell.style.height = `${Math.round(adjustedHeight)}px`;
    });
  };

  const updateCourseMapStreamLabels = () => {
    const majorKey = getMajorKeyFromUi();
    const majorNameMap = {
      ns: 'Network Security',
      ba: 'Business Analytics',
      sd: 'Software Development',
    };
    const majorName = majorNameMap[majorKey] || 'Network Security';
    const undecided = getCurrentMajor() === 'undecided';
    const labels = courseMapContent
      ? Array.from(courseMapContent.querySelectorAll('.course-map-stream-label'))
      : [];
    labels.forEach((label) => {
      const stream = label.dataset.stream || '';
      const isMajor = stream === majorKey && courseMapIndicatorsOn;
      label.classList.toggle('is-major', isMajor);
      const streamNames = {
        ns: 'Network Security',
        ba: 'Business Analytics',
        sd: 'Software Development',
      };
      const streamName = streamNames[stream] || '';
      const descriptor = undecided
        ? stream === 'ns'
          ? 'A Major has <b>not</b> been selected.<br>Assuming this will be your major.'
          : 'A Major has <b>not</b> been selected.<br>Assuming these will be electives.'
        : isMajor
          ? 'Your chosen Major'
          : 'You Elective subjects';
      const descriptorHtml = undecided ? descriptor : escapeHtml(descriptor);
      const nameDisplay = courseMapIndicatorsOn
        ? escapeHtml(streamName)
        : escapeHtml(streamName).replace(' ', '<br>');
      const labelHtml = !courseMapIndicatorsOn
        ? `<span class="stream-name">${nameDisplay}</span>`
        : `<span class="stream-name">${escapeHtml(
          streamName
        )}</span><span class="stream-descriptor">${descriptorHtml}</span>`;
      label.innerHTML = labelHtml;
      const tooltipText = isMajor
        ? 'This stream is treated as your major.'
        : `This stream is treated as an elective. Major: ${majorName}.`;
      label.setAttribute('data-tooltip', tooltipText);
      label.setAttribute('title', tooltipText);
    });
    if (courseMapStreamsBlockEl) {
      requestAnimationFrame(() => {
        const containerRect = courseMapStreamsBlockEl.getBoundingClientRect();
        labels.forEach((label) => {
          const section = label.closest('.course-map-stream');
          const grid = section?.querySelector('.course-map-stream-grid');
          if (!grid) return;
          const gridRect = grid.getBoundingClientRect();
          const left = gridRect.left - containerRect.left - label.offsetWidth - 6;
          const labelHeight = label.offsetHeight || 0;
          const top = gridRect.top - containerRect.top + Math.max(0, (gridRect.height - labelHeight) / 2);
          label.style.position = 'absolute';
          label.style.left = `${Math.round(left)}px`;
          label.style.top = `${Math.round(top)}px`;
        });
        updateCourseMapNotesOverlap();
      });
    }
    initTooltips();
  };

  let courseMapNotesOverlapRaf = null;
  const updateCourseMapNotesOverlap = () => {
    if (!courseMapNotesEl || !courseMapContent || !courseMapModal?.classList.contains('show')) return;
    if (courseMapNotesOverlapRaf) cancelAnimationFrame(courseMapNotesOverlapRaf);
    courseMapNotesOverlapRaf = requestAnimationFrame(() => {
      if (!courseMapNotesEl || !courseMapContent) return;
      const notesRect = courseMapNotesEl.getBoundingClientRect();
      const labels = Array.from(courseMapContent.querySelectorAll('.course-map-stream-label'));
      const overlaps = labels.some((label) => {
        const rect = label.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;
        return (
          notesRect.left < rect.right &&
          notesRect.right > rect.left &&
          notesRect.top < rect.bottom &&
          notesRect.bottom > rect.top
        );
      });
      courseMapNotesEl.classList.toggle('course-map-notes-overlap', overlaps);
    });
  };

  const updateCourseMapStatuses = () => {
    const majorKey = getMajorKeyFromUi();
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
    const getCourseMapStatusClass = (code) => {
      const st = subjectState.get(code);
      if (!st) return '';
      const isCurrent = currentCodes.has(code) || passForEnrolmentsOverrides.has(code);
      if (isCurrent) return 'course-map-status-current';
      if (st.toggled) return 'course-map-status-selected';
      if (st.completed) return 'course-map-status-passed';
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
        if (Number.isFinite(dist) && dist <= 2) return 'course-map-status-next';
        return 'course-map-status-later';
      }
      return '';
    };
    const courseMapModalTarget = courseMapModal || document.getElementById('course-map-modal');
    if (courseMapModalTarget) {
      courseMapModalTarget.classList.remove('course-map-major-ns', 'course-map-major-ba', 'course-map-major-sd');
      courseMapModalTarget.classList.add(`course-map-major-${majorKey}`);
    }
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
      cell.classList.remove('course-map-major-placeholder', 'major-ns', 'major-ba', 'major-sd');
      cell.classList.add('course-map-major-placeholder', `major-${majorKey}`);
    });
    courseMapElectivePlaceholders.forEach((cell) => {
      cell.classList.remove(
        'course-map-status-passed',
        'course-map-status-current',
        'course-map-status-selected',
        'course-map-status-next',
        'course-map-status-later',
        'course-map-elective-unavailable'
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
      const status = getCourseMapStatusClass(code);
      if (status) cell.classList.add(status);
    });

    const sharedStatus = getCourseMapStatusClass('BIT245');
    if (sharedStatus && courseMapSharedPlaceholders.length) {
      // Keep status styling on the floating BIT245 card only (avoid double border on placeholders).
    }

    const majorStreamRows = courseMapStreamLayouts[majorKey] || courseMapStreamLayouts.ns;
    const majorStreamCodes = majorStreamRows
      .flatMap((row) =>
        row.map((entry) => {
          if (!entry) return null;
          if (typeof entry === 'object') return entry.code || null;
          return entry;
        })
      )
      .filter(Boolean);
    const majorStatuses = majorStreamCodes.map((code) => getCourseMapStatusClass(code));
    courseMapMajorPlaceholders.forEach((cell, idx) => {
      const slotRaw = cell.dataset.majorSlot;
      const slotIndex = slotRaw ? Math.max(0, parseInt(slotRaw, 10) - 1) : idx;
      const slotToStreamIndex = [0, 3, 1, 4, 2, 5];
      const streamIndex = slotToStreamIndex[slotIndex] ?? slotIndex;
      const status = majorStatuses[streamIndex];
      if (status) cell.classList.add(status);
    });
    const getElectiveSlotStatus = (slotIndex) => {
      const bitCode = electiveBitState[slotIndex];
      if (bitCode) {
        const st = subjectState.get(bitCode);
        if (!st) return '';
        const isCurrent = currentCodes.has(bitCode) || passForEnrolmentsOverrides.has(bitCode);
        if (isCurrent) return 'course-map-status-current';
        if (st.toggled) return 'course-map-status-selected';
        if (st.completed) return 'course-map-status-passed';
        return '';
      }
      const useCode = electivePlaceholderState[slotIndex];
      if (useCode) return 'course-map-status-passed';
      return '';
    };

    courseMapElectivePlaceholders.forEach((cell, idx) => {
      const slotRaw = cell.dataset.electiveSlot;
      const slotIndex = slotRaw ? Math.max(0, parseInt(slotRaw, 10) - 1) : idx;
      const status = getElectiveSlotStatus(slotIndex);
      if (status) cell.classList.add(status);
    });
    const electiveLayout = computeElectiveList(majorKey);
    const electiveCandidates = Array.from(
      new Set(Object.values(electiveLayout).filter(Boolean))
    ).filter((code) => !(majorLayouts[majorKey] || []).includes(code));
    const usePlanned = !completedMode;
    const hasAvailableElective = !areElectivesFull() && electiveCandidates.some((code) => {
      const st = subjectState.get(code);
      if (st?.toggled) return false;
      const { prereqMetPlanned, prereqMetNow, coreqMetPlanned, coreqMetNow } = getRequisiteStatus({
        id: code,
        completedSet,
        plannedSet,
        usePlanned,
      });
      const hasCoreq = (corequisites[code] || []).length > 0;
      return usePlanned
        ? hasCoreq
          ? prereqMetPlanned && coreqMetPlanned
          : prereqMetPlanned
        : hasCoreq
          ? prereqMetNow && coreqMetNow
          : prereqMetNow;
    });
    courseMapElectivePlaceholders.forEach((cell) => {
      const isBlue =
        cell.classList.contains('course-map-status-current') ||
        cell.classList.contains('course-map-status-selected') ||
        cell.classList.contains('course-map-status-passed');
      if (!isBlue) {
        cell.classList.toggle('course-map-elective-unavailable', !hasAvailableElective);
      }
    });
    updateCourseMapStreamLabels();
  };

  const renderCourseMapModal = () => {
    if (!courseMapContent) return;
    if (!courseMapBuilt) {
      buildCourseMapLayout();
      courseMapBuilt = true;
    }
    updateCourseMapStatuses();
    positionCourseMapArrows();
    positionCourseMapCoreConnector();
  };

  const getCourseMapCaptureTarget = () =>
    courseMapModal ? courseMapModal.querySelector('.course-map-modal') : null;

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
    positionCourseMapCoreConnector();
    const prereqColoursOff = courseMapModal?.classList.contains('course-map-prereq-off');
    const prereqTextOff = courseMapModal?.classList.contains('course-map-prereq-text-off');

    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (parseFloat(style.opacity || '1') === 0) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const getBoundsFromElements = (els) => {
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;
      els.forEach((el) => {
        if (!isVisible(el)) return;
        const rect = el.getBoundingClientRect();
        left = Math.min(left, rect.left);
        top = Math.min(top, rect.top);
        right = Math.max(right, rect.right);
        bottom = Math.max(bottom, rect.bottom);
      });
      if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    };

    const coreBlockEl = element.querySelector('.course-map-core-block');
    const streamsBlockEl = element.querySelector('.course-map-streams-block');
    const notesEl = element.querySelector('.course-map-notes');
    const keyEl = element.querySelector('.course-map-key');
    const bounds = getBoundsFromElements([
      coreBlockEl,
      streamsBlockEl,
      notesEl,
      prereqColoursOff ? null : keyEl,
    ]);
    const fallbackRect = element.getBoundingClientRect();
    const containerRect = bounds || fallbackRect;

    let width = Math.ceil(containerRect.width);
    let height = Math.ceil(containerRect.height);
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

    const getCourseMapExportHeaderLines = () => {
      const lines = ['Course Map.'];
      const studentId = activeStudentId || normalizeStudentId(studentIdInput?.value || '');
      if (!studentId) return lines;
      const record = studentRecords.find(
        (row) => normalizeStudentId(row.Student_IDs_Unique) === studentId
      );
      const given = record ? toProperCase(record.Given_Name || '') : '';
      const family = record ? String(record.Family_Name || '').toUpperCase() : '';
      const name = [given, family].filter(Boolean).join(' ').trim();
      const now = new Date();
      const pad = (value) => String(value).padStart(2, '0');
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
        now.getHours()
      )}:${pad(now.getMinutes())}`;
      const detail = [studentId, name, stamp].filter(Boolean).join(' ').trim();
      if (detail) lines.push(detail);
      return lines;
    };

    const headerLines = getCourseMapExportHeaderLines();
    const headerPaddingTop = 8;
    const headerPaddingBottom = 5;
    const headerTitleSize = 16;
    const headerMetaSize = 12;
    const headerLineGap = 4;
    const headerBlockHeight = headerLines.length
      ? headerPaddingTop +
      headerTitleSize +
      (headerLines.length > 1 ? headerLineGap + headerMetaSize : 0) +
      headerPaddingBottom
      : 0;
    if (headerBlockHeight) height += headerBlockHeight;

    const relativeRect = (el) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top + headerBlockHeight,
        width: rect.width,
        height: rect.height,
      };
    };

    const bit245SharedCell = element.querySelector('.course-map-shared-cell');
    const bit245Cell = bit245SharedCell || element.querySelector('.course-map-cell[data-subject="BIT245"]');
    const arrowOffsetX = 50;
    if (bit245Cell) {
      const rect = relativeRect(bit245Cell);
      const baseX = rect.x + rect.width + arrowOffsetX;
      const lineLength = 96;
      const arrowPad = 14;
      const angles = [-20, 20];
      let maxX = 0;
      angles.forEach((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x2 = baseX + Math.cos(rad) * lineLength;
        maxX = Math.max(maxX, x2 + arrowPad);
      });
      if (maxX > width) width = Math.ceil(maxX);
    }

    let offsetX = 0;
    let offsetY = 0;
    const notesRectForOffset = element.querySelector('.course-map-notes')
      ? relativeRect(element.querySelector('.course-map-notes'))
      : null;
    if (notesRectForOffset) {
      if (notesRectForOffset.x < 0) offsetX = Math.ceil(-notesRectForOffset.x + 8);
      if (notesRectForOffset.y < 0) offsetY = Math.ceil(-notesRectForOffset.y + 8);
    }
    if (offsetX || offsetY) {
      width += offsetX;
      height += offsetY;
    }

    const svgParts = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="geometricPrecision">`,
      `<rect width="${width}" height="${height}" fill="#fff"/>`,
    ];

    const escapeAttr = (value) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');

    const addRect = (rect, { fill, stroke, strokeWidth, rx = 0, ry = 0, dashArray, filter } = {}) => {
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      const x = rect.x + offsetX;
      const y = rect.y + offsetY;
      const strokeAttr = stroke ? ` stroke="${escapeAttr(stroke)}"` : '';
      const strokeWidthAttr = strokeWidth ? ` stroke-width="${strokeWidth}"` : '';
      const dashAttr = dashArray ? ` stroke-dasharray="${escapeAttr(dashArray)}"` : '';
      const filterAttr = filter ? ` filter="${escapeAttr(filter)}"` : '';
      svgParts.push(
        `<rect x="${x}" y="${y}" width="${rect.width}" height="${rect.height}" rx="${rx}" ry="${ry}" fill="${escapeAttr(fill || 'none')}"${strokeAttr}${strokeWidthAttr}${dashAttr}${filterAttr}/>`
      );
    };

    const normalizeSvgText = (value) => {
      const str = String(value ?? '');
      if (!str) return '';
      const leading = str.match(/^\s+/)?.[0] || '';
      const trailing = str.match(/\s+$/)?.[0] || '';
      const core = str.trim();
      const leadSafe = leading ? '\u00a0'.repeat(leading.length) : '';
      const trailSafe = trailing ? '\u00a0'.repeat(trailing.length) : '';
      return `${leadSafe}${core}${trailSafe}`;
    };
    const addText = (text, x, y, styles) => {
      if (!text) return;
      const normalizedText = normalizeSvgText(text);
      if (!normalizedText) return;
      const attrs = [
        `x="${x + offsetX}"`,
        `y="${y + offsetY}"`,
        `fill="${escapeAttr(styles.color || '#111')}"`,
        `font-size="${escapeAttr(styles.fontSize || '12px')}"`,
        `font-weight="${escapeAttr(styles.fontWeight || '400')}"`,
        `font-family="${escapeAttr(styles.fontFamily || 'Arial, sans-serif')}"`,
        `dominant-baseline="hanging"`,
      ];
      svgParts.push(`<text ${attrs.join(' ')}>${escapeXml(normalizedText)}</text>`);
    };
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    const getFontString = (styles) => {
      const style = styles.fontStyle || 'normal';
      const weight = styles.fontWeight || '400';
      const size = styles.fontSize || '12px';
      const family = styles.fontFamily || 'Arial, sans-serif';
      return `${style} ${weight} ${size} ${family}`.trim();
    };
    const measureTextWidth = (text, styles) => {
      if (!measureCtx) return text.length * 6;
      measureCtx.font = getFontString(styles);
      return measureCtx.measureText(text).width;
    };
    const keywordEmphasisState = {
      Pre: false,
      BIT245: false,
      Core: false,
      Major: false,
      Electives: false,
    };
    const keywordStyleOverrides = (baseStyle) => ({
      ...baseStyle,
      color: '#0b3d91',
      fontWeight: '700',
    });
    const getKeywordRanges = (text) => {
      const targets = Object.keys(keywordEmphasisState).filter((key) => !keywordEmphasisState[key]);
      if (!targets.length) return [];
      const ranges = [];
      targets.forEach((key) => {
        const pattern = new RegExp(`\\b${key}\\b`);
        const match = pattern.exec(text);
        if (!match) return;
        ranges.push({ key, start: match.index, end: match.index + key.length });
      });
      ranges.sort((a, b) => a.start - b.start);
      const filtered = [];
      ranges.forEach((range) => {
        const overlap = filtered.some((picked) => range.start < picked.end && range.end > picked.start);
        if (!overlap) filtered.push(range);
      });
      return filtered;
    };
    const addTextWithKeywordEmphasis = (text, x, y, baseStyle) => {
      if (!text) return;
      const ranges = getKeywordRanges(text);
      if (!ranges.length) {
        addText(text, x, y, baseStyle);
        return;
      }
      let cursorX = x;
      let cursor = 0;
      ranges.forEach((range) => {
        if (range.start > cursor) {
          const before = text.slice(cursor, range.start);
          addText(before, cursorX, y, baseStyle);
          cursorX += measureTextWidth(before, baseStyle);
        }
        const keyword = text.slice(range.start, range.end);
        const emphStyle = keywordStyleOverrides(baseStyle);
        addText(keyword, cursorX, y, emphStyle);
        cursorX += measureTextWidth(keyword, emphStyle);
        keywordEmphasisState[range.key] = true;
        cursor = range.end;
      });
      if (cursor < text.length) {
        const after = text.slice(cursor);
        addText(after, cursorX, y, baseStyle);
      }
    };
    const wrapText = (text, maxWidth, styles, maxLines) => {
      const words = String(text).trim().replace(/\s+/g, ' ').split(' ');
      const lines = [];
      let current = '';
      const pushLine = (line) => {
        if (line) lines.push(line);
      };
      const fits = (str) => measureTextWidth(str, styles) <= maxWidth;
      words.forEach((word) => {
        if (!current) {
          if (fits(word)) {
            current = word;
            return;
          }
          let chunk = '';
          for (let i = 0; i < word.length; i += 1) {
            const next = chunk + word[i];
            if (!fits(next) && chunk) {
              pushLine(chunk);
              chunk = word[i];
              if (lines.length >= maxLines) break;
            } else {
              chunk = next;
            }
          }
          current = chunk;
          return;
        }
        const nextLine = `${current} ${word}`;
        if (fits(nextLine)) {
          current = nextLine;
          return;
        }
        pushLine(current);
        current = word;
      });
      pushLine(current);
      if (lines.length > maxLines) lines.length = maxLines;
      return lines;
    };

    if (headerLines.length) {
      const titleStyle = {
        color: '#111',
        fontSize: `${headerTitleSize}px`,
        fontWeight: '700',
        fontFamily: 'Arial, sans-serif',
      };
      const metaStyle = {
        color: '#333',
        fontSize: `${headerMetaSize}px`,
        fontWeight: '400',
        fontFamily: 'Arial, sans-serif',
      };
      addText(headerLines[0], 12, headerPaddingTop, titleStyle);
      if (headerLines[1]) {
        addText(
          headerLines[1],
          12,
          headerPaddingTop + headerTitleSize + headerLineGap,
          metaStyle
        );
      }
    }

    const drawBorderedGrids = (selector) => {
      element.querySelectorAll(selector).forEach((grid) => {
        const rect = relativeRect(grid);
        const style = window.getComputedStyle(grid);
        const stroke = style.borderColor;
        const strokeWidth = toNumber(style.borderWidth);
        addRect(rect, { fill: 'none', stroke, strokeWidth });
      });
    };

    drawBorderedGrids('.course-map-stream-grid');
    const baseSepWidth =
      parseFloat(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--course-map-separator-width')
          .replace('px', '')
      ) || 3;
    const sepWidth = Math.max(3, Math.round(baseSepWidth));
    const sepColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--course-map-separator-color')
        .trim() || '#6a6a6a';
    const coreGridEl = element.querySelector('.course-map-core-grid');
    if (coreGridEl) {
      const coreRect = relativeRect(coreGridEl);
      addRect(coreRect, { fill: 'none', stroke: sepColor, strokeWidth: sepWidth });
    }
    const majorGridEl = element.querySelector('.course-map-major-grid');
    if (majorGridEl) {
      const majorRect = relativeRect(majorGridEl);
      addRect(majorRect, { fill: 'none', stroke: sepColor, strokeWidth: sepWidth });
    }

    let bit245ExportRect = null;
    let bit245ExportStyle = null;
    if (bit245Cell) {
      const rect = relativeRect(bit245Cell);
      rect.height = rect.height + 10;
      bit245ExportRect = rect;
      bit245ExportStyle = window.getComputedStyle(bit245Cell);
    }

    element.querySelectorAll('.course-map-cell').forEach((cell) => {
      if (bit245Cell && cell === bit245Cell) return;
      const rect = relativeRect(cell);
      const style = window.getComputedStyle(cell);
      const fill = style.backgroundColor;
      const stroke = style.borderColor;
      const strokeWidth = toNumber(style.borderWidth);
      const dash = style.borderStyle === 'dashed' ? '4,3' : null;
      addRect(rect, { fill, stroke, strokeWidth, dashArray: dash });

      const borderBottomWidth = toNumber(style.borderBottomWidth);
      if (borderBottomWidth > 0) {
        const sepColor =
          getComputedStyle(document.documentElement)
            .getPropertyValue('--course-map-separator-color')
            .trim() || '#6a6a6a';
        const bottomColor = style.borderBottomColor || stroke || sepColor;
        addRect(
          { x: rect.x, y: rect.y + rect.height - borderBottomWidth, width: rect.width, height: borderBottomWidth },
          { fill: bottomColor }
        );
      }

      const padLeft = toNumber(style.paddingLeft);
      const padTop = toNumber(style.paddingTop);
      const codeEl = cell.querySelector('.course-map-code');
      const nameEl = cell.querySelector('.course-map-name');
      const prereqEl = cell.querySelector('.course-map-prereqs');
      if (codeEl) {
        const codeStyle = window.getComputedStyle(codeEl);
        const fontSize = toNumber(codeStyle.fontSize);
        const lineHeight = toNumber(codeStyle.lineHeight) || fontSize * 1.2;
        let nameLines = [];
        let nameLineHeight = 0;
        addText(
          codeEl.textContent.trim(),
          rect.x + padLeft,
          rect.y + padTop,
          codeStyle
        );
        if (nameEl) {
          const nameStyle = window.getComputedStyle(nameEl);
          nameLineHeight = toNumber(nameStyle.lineHeight) || toNumber(nameStyle.fontSize) * 1.2;
          const availableHeight = Math.max(0, rect.height - padTop - lineHeight);
          const maxLines = Math.max(2, Math.floor(availableHeight / nameLineHeight));
          const maxWidth = Math.max(0, rect.width - padLeft * 2);
          nameLines = wrapText(nameEl.textContent.trim(), maxWidth, nameStyle, maxLines);
          nameLines.forEach((line, idx) => {
            addText(
              line,
              rect.x + padLeft,
              rect.y + padTop + lineHeight + nameLineHeight * idx,
              nameStyle
            );
          });
        }
        if (prereqEl) {
          const prereqStyle = window.getComputedStyle(prereqEl);
          const isHidden =
            prereqStyle.display === 'none' ||
            prereqStyle.visibility === 'hidden' ||
            parseFloat(prereqStyle.opacity || '1') === 0;
          if (!isHidden) {
            const prereqLineHeight =
              toNumber(prereqStyle.lineHeight) || toNumber(prereqStyle.fontSize) * 1.2;
            const prereqMarginTop = toNumber(prereqStyle.marginTop);
            const maxWidth = Math.max(0, rect.width - padLeft * 2);
            const usedHeight =
              padTop +
              lineHeight +
              (nameLineHeight ? nameLineHeight * nameLines.length : 0);
            const availableHeight = Math.max(0, rect.height - usedHeight - prereqMarginTop);
            const maxLines = Math.max(1, Math.floor(availableHeight / prereqLineHeight));
            const prereqLines = wrapText(prereqEl.textContent.trim(), maxWidth, prereqStyle, maxLines);
            prereqLines.forEach((line, idx) => {
              addText(
                line,
                rect.x + padLeft,
                rect.y + usedHeight + prereqMarginTop + prereqLineHeight * idx,
                prereqStyle
              );
            });
          }
        }
      } else if (nameEl) {
        const nameStyle = window.getComputedStyle(nameEl);
        const nameLineHeight = toNumber(nameStyle.lineHeight) || toNumber(nameStyle.fontSize) * 1.2;
        const maxLines = Math.max(2, Math.floor(Math.max(0, rect.height - padTop) / nameLineHeight));
        const maxWidth = Math.max(0, rect.width - padLeft * 2);
        const lines = wrapText(nameEl.textContent.trim(), maxWidth, nameStyle, maxLines);
        lines.forEach((line, idx) => {
          addText(
            line,
            rect.x + padLeft,
            rect.y + padTop + nameLineHeight * idx,
            nameStyle
          );
        });
      }
    });

    if (bit245ExportRect && bit245ExportStyle) {
      svgParts.splice(
        1,
        0,
        `<defs><filter id="bit245Shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.25"/></filter></defs>`
      );
      addRect(bit245ExportRect, {
        fill: bit245ExportStyle.backgroundColor,
        stroke: bit245ExportStyle.borderColor,
        strokeWidth: toNumber(bit245ExportStyle.borderWidth),
        rx: toNumber(bit245ExportStyle.borderRadius),
        ry: toNumber(bit245ExportStyle.borderRadius),
        filter: 'url(#bit245Shadow)',
      });
      const padLeft = toNumber(bit245ExportStyle.paddingLeft);
      const padTop = toNumber(bit245ExportStyle.paddingTop);
      const codeEl = bit245Cell.querySelector('.course-map-code');
      const nameEl = bit245Cell.querySelector('.course-map-name');
      if (codeEl) {
        const codeStyle = window.getComputedStyle(codeEl);
        const fontSize = toNumber(codeStyle.fontSize);
        const lineHeight = toNumber(codeStyle.lineHeight) || fontSize * 1.2;
        addText(
          codeEl.textContent.trim(),
          bit245ExportRect.x + padLeft,
          bit245ExportRect.y + padTop,
          codeStyle
        );
        if (nameEl) {
          const nameStyle = window.getComputedStyle(nameEl);
          const nameLineHeight = toNumber(nameStyle.lineHeight) || toNumber(nameStyle.fontSize) * 1.2;
          const availableHeight = Math.max(0, bit245ExportRect.height - padTop - lineHeight);
          const maxLines = Math.max(2, Math.floor(availableHeight / nameLineHeight));
          const maxWidth = Math.max(0, bit245ExportRect.width - padLeft * 2);
          const nameLines = wrapText(nameEl.textContent.trim(), maxWidth, nameStyle, maxLines);
          nameLines.forEach((line, idx) => {
            addText(
              line,
              bit245ExportRect.x + padLeft,
              bit245ExportRect.y + padTop + lineHeight + nameLineHeight * idx,
              nameStyle
            );
          });
        }
      }
    }
    element.querySelectorAll('.course-map-stream-label').forEach((label) => {
      const rect = relativeRect(label);
      const style = window.getComputedStyle(label);
      const isMajor = label.classList.contains('is-major');
      if (isMajor) {
        addRect(rect, {
          fill: style.backgroundColor || 'none',
          stroke: style.borderColor,
          strokeWidth: toNumber(style.borderWidth),
          rx: toNumber(style.borderRadius),
          ry: toNumber(style.borderRadius),
        });
      }
      const padLeft = toNumber(style.paddingLeft);
      const padTop = toNumber(style.paddingTop);
      const nameEl = label.querySelector('.stream-name');
      const descEl = label.querySelector('.stream-descriptor');
      const nameStyle = nameEl ? window.getComputedStyle(nameEl) : style;
      const descStyle = descEl ? window.getComputedStyle(descEl) : style;
      const nameLineHeight = toNumber(nameStyle.lineHeight) || toNumber(nameStyle.fontSize) * 1.2;
      const nameHtml = nameEl?.innerHTML || nameEl?.textContent || label.textContent || '';
      const nameLines = nameHtml
        .replace(/<br\s*\/?>/gi, '\n')
        .split('\n')
        .map((line) => line.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean);
      const safeNameLines = nameLines.length
        ? nameLines
        : [(nameEl?.textContent || label.textContent || '').trim()];
      safeNameLines.forEach((line, idx) => {
        addText(line, rect.x + padLeft, rect.y + padTop + nameLineHeight * idx, nameStyle);
      });
      if (descEl) {
        const descText = String(descEl.innerHTML || descEl.textContent || '')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '');
        const descLines = descText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        descLines.forEach((line, idx) => {
          const text = line.replace(/<[^>]+>/g, '');
          const hasNot = /\bnot\b/i.test(line);
          if (!hasNot) {
            addText(
              text,
              rect.x + padLeft,
              rect.y + padTop + nameLineHeight * (safeNameLines.length + idx),
              descStyle
            );
            return;
          }
          const parts = text.split(/\bnot\b/i);
          const before = parts[0] || '';
          const after = parts.slice(1).join('not');
          let cursorX = rect.x + padLeft;
          if (before) {
            addText(
              before.trimEnd(),
              cursorX,
              rect.y + padTop + nameLineHeight * (safeNameLines.length + idx),
              descStyle
            );
            cursorX += measureTextWidth(before.trimEnd() + ' ', descStyle);
          }
          const boldStyle = { ...descStyle, fontWeight: '700' };
          addText(
            'not',
            cursorX,
            rect.y + padTop + nameLineHeight * (safeNameLines.length + idx),
            boldStyle
          );
          cursorX += measureTextWidth('not ', boldStyle);
          if (after) {
            addText(
              after.trimStart(),
              cursorX,
              rect.y + padTop + nameLineHeight * (safeNameLines.length + idx),
              descStyle
            );
          }
        });
      }
    });

    const drawCourseMapNotes = () => {
      const notesEl = element.querySelector('.course-map-notes');
      if (!notesEl) return;
      const notesStyle = window.getComputedStyle(notesEl);
      if (notesStyle.display === 'none' || notesStyle.visibility === 'hidden') return;
      const notesRect = relativeRect(notesEl);
      addRect(notesRect, {
        fill: notesStyle.backgroundColor,
        stroke: notesStyle.borderColor,
        strokeWidth: toNumber(notesStyle.borderWidth),
        rx: toNumber(notesStyle.borderRadius),
        ry: toNumber(notesStyle.borderRadius),
      });

      const paddingLeft = toNumber(notesStyle.paddingLeft);
      const paddingRight = toNumber(notesStyle.paddingRight);
      const paddingTop = toNumber(notesStyle.paddingTop);
      const paddingBottom = toNumber(notesStyle.paddingBottom);
      const maxWidth = Math.max(0, notesRect.width - paddingLeft - paddingRight);
      let cursorY = notesRect.y + paddingTop;

      const drawBlock = (text, style, y, indent = 0) => {
        const lineHeight = toNumber(style.lineHeight) || toNumber(style.fontSize) * 1.25;
        const lines = wrapText(text, Math.max(0, maxWidth - indent), style, 999);
        lines.forEach((line, idx) => {
          addTextWithKeywordEmphasis(
            line,
            notesRect.x + paddingLeft + indent,
            y + lineHeight * idx,
            style
          );
        });
        return y + lineHeight * Math.max(1, lines.length);
      };

      const blockEls = Array.from(
        notesEl.querySelectorAll('.notes-title, .notes-paragraph, .notes-list li')
      );
      blockEls.forEach((block) => {
        if (prereqTextOff && block.dataset.notesPre === 'true') return;
        const style = window.getComputedStyle(block);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        const marginTop = toNumber(style.marginTop);
        const marginBottom = toNumber(style.marginBottom);
        cursorY += marginTop;
        if (block.tagName.toLowerCase() === 'li') {
          const bullet = '\u2022';
          const bulletGap = measureTextWidth(`${bullet} `, style);
          const lineHeight = toNumber(style.lineHeight) || toNumber(style.fontSize) * 1.25;
          const lines = wrapText(block.textContent || '', Math.max(0, maxWidth - bulletGap), style, 999);
          if (lines.length) {
            addTextWithKeywordEmphasis(
              `${bullet} ${lines[0]}`,
              notesRect.x + paddingLeft,
              cursorY,
              style
            );
            for (let i = 1; i < lines.length; i += 1) {
              addTextWithKeywordEmphasis(
                lines[i],
                notesRect.x + paddingLeft + bulletGap,
                cursorY + lineHeight * i,
                style
              );
            }
          }
          cursorY += lineHeight * Math.max(1, lines.length);
        } else {
          cursorY = drawBlock(block.textContent || '', style, cursorY);
        }
        cursorY += marginBottom;
      });
    };

    drawCourseMapNotes();

    const drawCoreConnectors = () => {
      const coreBlock = element.querySelector('.course-map-core-block');
      const bit105 = element.querySelector('.course-map-cell[data-subject="BIT105"]');
      const bit108 = element.querySelector('.course-map-cell[data-subject="BIT108"]');
      const bit121 = element.querySelector('.course-map-cell[data-subject="BIT121"]');
      const bit372 = element.querySelector('.course-map-cell[data-subject="BIT372"]');
      const majorGrid = element.querySelector('.course-map-major-grid');
      if (!coreBlock || !bit105 || !bit108 || !majorGrid) return;
      const coreRect = relativeRect(coreBlock);
      const bit105Rect = relativeRect(bit105);
      const bit108Rect = relativeRect(bit108);
      const bit121Rect = bit121 ? relativeRect(bit121) : null;
      const bit372Rect = bit372 ? relativeRect(bit372) : null;
      const majorRect = relativeRect(majorGrid);
      const baseSepWidth =
        parseFloat(
          getComputedStyle(document.documentElement)
            .getPropertyValue('--course-map-separator-width')
            .replace('px', '')
        ) || 3;
      const sepWidth = Math.max(3, Math.round(baseSepWidth));
      const sepColor =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--course-map-separator-color')
          .trim() || '#6a6a6a';
      const fmt = (v) => v;
      const bit105Style = window.getComputedStyle(bit105);
      const bit108Style = window.getComputedStyle(bit108);
      const bit105BorderRight = toNumber(bit105Style.borderRightWidth);
      const bit105BorderBottom = toNumber(bit105Style.borderBottomWidth);
      const bit108BorderLeft = toNumber(bit108Style.borderLeftWidth);
      const xStart = bit105Rect.x + bit105Rect.width - bit105BorderRight / 2 - 2;
      const xCorner = bit108Rect.x + bit108BorderLeft / 2;
      const yCenter = bit105Rect.y + bit105Rect.height - bit105BorderBottom / 2;
      const yDownEnd = majorRect.y + 4;
      const elbowX = xCorner - sepWidth / 2;
      const elbowY = yCenter - sepWidth / 2 - 1;
      addRect({ x: xStart, y: elbowY, width: Math.max(0, elbowX - xStart), height: sepWidth }, { fill: sepColor });
      addRect({ x: elbowX, y: yCenter, width: sepWidth, height: Math.max(0, yDownEnd - yCenter) }, { fill: sepColor });
      addRect({ x: elbowX, y: elbowY, width: sepWidth, height: sepWidth }, { fill: sepColor });

      if (bit121Rect) {
        const bit105BorderBottom2 = toNumber(bit105Style.borderBottomWidth);
        const bit121Style = window.getComputedStyle(bit121);
        const bit121BorderBottom = toNumber(bit121Style.borderBottomWidth);
      const yBottom =
          bit121Rect.y + bit121Rect.height - Math.max(bit121BorderBottom, bit105BorderBottom2) / 2 - 2;
        const bit105BorderLeft = toNumber(bit105Style.borderLeftWidth);
        const xStartLine = bit121Rect.x + bit121Rect.width;
        const xEndLine = bit105Rect.x + bit105BorderLeft / 2;
        addRect(
          { x: xStartLine, y: yBottom - sepWidth / 2, width: Math.max(0, xEndLine - xStartLine), height: sepWidth },
          { fill: sepColor }
        );
      }

      if (bit372Rect) {
        const es3 = element.querySelector('.course-map-major-grid .course-map-cell[data-elective-slot="3"]');
        if (es3) {
          const es3Rect = relativeRect(es3);
          const xMid = bit372Rect.x + bit372Rect.width + 1;
          const yStart = bit372Rect.y + bit372Rect.height;
          const yEnd = es3Rect.y;
          addRect(
            { x: xMid, y: yStart, width: sepWidth, height: Math.max(0, yEnd - yStart) },
            { fill: sepColor }
          );
        }
      }

      const ms5 = element.querySelector('.course-map-major-grid .course-map-cell[data-major-slot="5"]');
      const ms6 = element.querySelector('.course-map-major-grid .course-map-cell[data-major-slot="6"]');
      const es1 = element.querySelector('.course-map-major-grid .course-map-cell[data-elective-slot="1"]');
      const es2 = element.querySelector('.course-map-major-grid .course-map-cell[data-elective-slot="2"]');
      const esLeft = es1 || es2;
      if (ms5 && ms6 && esLeft) {
        const ms5Rect = relativeRect(ms5);
        const ms6Rect = relativeRect(ms6);
        const esRect = relativeRect(esLeft);
        const gapCenter = (ms5Rect.x + ms5Rect.width + esRect.x) / 2;
        const xGap = gapCenter - sepWidth / 2;
        addRect(
          { x: xGap, y: ms5Rect.y + ms5Rect.height, width: sepWidth, height: Math.max(0, ms6Rect.y - (ms5Rect.y + ms5Rect.height)) },
          { fill: sepColor }
        );
        const majorElectiveConnectorExtra = 0;
        addRect(
          { x: xGap, y: majorRect.y, width: sepWidth, height: Math.max(0, majorRect.height + majorElectiveConnectorExtra) },
          { fill: sepColor }
        );
      }
    };

    drawCoreConnectors();

    if (!prereqColoursOff) {
      const keyTitle = element.querySelector('.course-map-key-title');
      if (keyTitle) {
        const titleRect = relativeRect(keyTitle);
        const titleStyle = window.getComputedStyle(keyTitle);
        addText(
          keyTitle.textContent.trim(),
          titleRect.x,
          titleRect.y,
          titleStyle
        );
      }
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
          addTextWithKeywordEmphasis(
            item.textContent.trim(),
            swatchRect.x + swatchRect.width + 6,
            itemRect.y + 2,
            style
          );
        } else {
          addTextWithKeywordEmphasis(item.textContent.trim(), itemRect.x, itemRect.y + 2, style);
        }
      });
    }

    svgParts.push('</svg>');
    return { svg: svgParts.join(''), width, height };
  };

  const buildTimetableSvgFromDom = () => {
    if (!timetableTable || !timetableTitleEl) return null;
    const tableRect = timetableTable.getBoundingClientRect();
    if (!tableRect.width || !tableRect.height) return null;
    const feesRect =
      timetableFees && !timetableFees.hidden ? timetableFees.getBoundingClientRect() : null;

    const escapeXml = (value = '') =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/\'/g, '&#39;');

    const escapeAttr = (value) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/\"/g, '&quot;');

    const toNumber = (value) => {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    const getFontString = (styles) => {
      const style = styles.fontStyle || 'normal';
      const weight = styles.fontWeight || '400';
      const size = styles.fontSize || '12px';
      const family = styles.fontFamily || 'Arial, sans-serif';
      return `${style} ${weight} ${size} ${family}`.trim();
    };
    const measureTextWidth = (text, styles) => {
      if (!measureCtx) return text.length * 6;
      measureCtx.font = getFontString(styles);
      return measureCtx.measureText(text).width;
    };
    const wrapText = (text, maxWidth, styles, maxLines) => {
      const words = String(text).trim().replace(/\s+/g, ' ').split(' ');
      const lines = [];
      let current = '';
      const fits = (str) => measureTextWidth(str, styles) <= maxWidth;
      const pushLine = (line) => {
        if (line) lines.push(line);
      };
      words.forEach((word) => {
        if (!current) {
          current = word;
          return;
        }
        const nextLine = `${current} ${word}`;
        if (fits(nextLine)) {
          current = nextLine;
          return;
        }
        pushLine(current);
        current = word;
      });
      pushLine(current);
      if (lines.length > maxLines) lines.length = maxLines;
      return lines;
    };

    const paddingX = 12;
    const paddingTop = 10;
    const headingGap = 6;
    const feesGap = feesRect ? 8 : 0;
    const headingStyle = window.getComputedStyle(timetableTitleEl);
    const bodySample =
      timetableTable.querySelector('tbody td') || timetableTable.querySelector('td,th');
    const bodyStyle = bodySample ? window.getComputedStyle(bodySample) : headingStyle;
    const bodyFontSize = toNumber(bodyStyle.fontSize) || 12;
    const headingFontSize = Math.round((bodyFontSize + 4) * 0.85);
    const headingLineHeight = headingFontSize * 1.2;
    const headingText = timetableTitleEl.textContent.trim();
    const strongEl = timetableTitleEl.querySelector('.timetable-title-strong');
    const strongText = strongEl ? strongEl.textContent.trim() : headingText;
    const restText = headingText.slice(strongText.length);

    const width = Math.ceil(Math.max(tableRect.width, feesRect?.width || 0) + paddingX * 2);
    const height = Math.ceil(
      paddingTop +
      headingLineHeight +
      headingGap +
      tableRect.height +
      (feesRect ? feesRect.height : 0) +
      feesGap +
      paddingTop
    );

    const svgParts = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="geometricPrecision">`,
      `<rect width="${width}" height="${height}" fill="#fff"/>`,
    ];

    const addRect = (rect, { fill, stroke, strokeWidth } = {}) => {
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      const fillAttr = escapeAttr(fill || 'none');
      const strokeAttr = stroke ? ` stroke="${escapeAttr(stroke)}"` : '';
      const strokeWidthAttr = strokeWidth ? ` stroke-width="${strokeWidth}"` : '';
      svgParts.push(
        `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${fillAttr}"${strokeAttr}${strokeWidthAttr}/>`
      );
    };

    const addText = (text, x, y, styles) => {
      if (!text) return;
      const attrs = [
        `x="${x}"`,
        `y="${y}"`,
        `fill="${escapeAttr(styles.color || '#111')}"`,
        `font-size="${escapeAttr(styles.fontSize || '12px')}"`,
        `font-weight="${escapeAttr(styles.fontWeight || '400')}"`,
        `font-family="${escapeAttr(styles.fontFamily || 'Arial, sans-serif')}"`,
        `dominant-baseline="hanging"`,
      ];
      svgParts.push(`<text ${attrs.join(' ')}>${escapeXml(text)}</text>`);
    };

    const addTextSegments = (segments, x, y, baseStyle) => {
      if (!segments || !segments.length) return;
      let cursor = x;
      segments.forEach((segment) => {
        if (!segment.text) return;
        const style = {
          ...baseStyle,
          fontWeight: segment.bold ? '700' : baseStyle.fontWeight,
        };
        addText(segment.text, cursor, y, style);
        cursor += measureTextWidth(segment.text, {
          fontStyle: style.fontStyle,
          fontWeight: style.fontWeight,
          fontSize: style.fontSize,
          fontFamily: style.fontFamily,
        });
      });
    };

    const headingX = paddingX;
    const headingY = paddingTop;
    addText(strongText, headingX, headingY, {
      color: headingStyle.color,
      fontSize: `${headingFontSize}px`,
      fontWeight: '700',
      fontFamily: headingStyle.fontFamily,
    });
    if (restText) {
      const strongWidth = measureTextWidth(strongText, {
        fontStyle: headingStyle.fontStyle,
        fontWeight: '700',
        fontSize: `${headingFontSize}px`,
        fontFamily: headingStyle.fontFamily,
      });
      addText(restText, headingX + strongWidth, headingY, {
        ...headingStyle,
        fontSize: `${headingFontSize}px`,
      });
    }

    const tableOrigin = {
      x: paddingX,
      y: paddingTop + headingLineHeight + headingGap,
    };
    timetableTable.querySelectorAll('th,td').forEach((cell) => {
      const rect = cell.getBoundingClientRect();
      const style = window.getComputedStyle(cell);
      const fillValue =
        style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.backgroundColor === 'transparent'
          ? '#fff'
          : style.backgroundColor;
      addRect(
        {
          x: tableOrigin.x + rect.left - tableRect.left,
          y: tableOrigin.y + rect.top - tableRect.top,
          width: rect.width,
          height: rect.height,
        },
        {
          fill: fillValue,
          stroke: style.borderColor,
          strokeWidth: toNumber(style.borderWidth),
        }
      );
      const padLeft = toNumber(style.paddingLeft);
      const padTop = toNumber(style.paddingTop);
      const lineHeight = toNumber(style.lineHeight) || toNumber(style.fontSize) * 1.2;
      const maxWidth = Math.max(0, rect.width - padLeft * 2);
      const maxLines = Math.max(1, Math.floor((rect.height - padTop) / lineHeight));
      const lines = wrapText(cell.textContent.trim(), maxWidth, style, maxLines);
      lines.forEach((line, idx) => {
        addText(
          line,
          tableOrigin.x + rect.left - tableRect.left + padLeft,
          tableOrigin.y + rect.top - tableRect.top + padTop + lineHeight * idx,
          style
        );
      });
    });

    if (feesRect && timetableFees) {
      const feeStyle = window.getComputedStyle(timetableFees);
      const feeFontSize = Math.max(10, bodyFontSize - 2);
      const feeTextStyle = {
        ...feeStyle,
        fontSize: `${feeFontSize}px`,
      };
      const feeLineHeight = toNumber(feeTextStyle.lineHeight) || feeFontSize * 1.3;
      const feeX = paddingX;
      const feeY = tableOrigin.y + tableRect.height + feesGap;
      const feeMaxWidth = Math.max(0, width - paddingX * 2);
      addRect(
        {
          x: feeX,
          y: feeY,
          width: feesRect.width,
          height: feesRect.height,
        },
        {
          fill: feeStyle.backgroundColor || '#f7fbf2',
          stroke: feeStyle.borderColor || '#cfcfcf',
          strokeWidth: toNumber(feeStyle.borderWidth) || 1,
        }
      );
      const leftBorderWidth = toNumber(feeStyle.borderLeftWidth) || 0;
      if (leftBorderWidth > 0) {
        addRect(
          {
            x: feeX,
            y: feeY,
            width: leftBorderWidth,
            height: feesRect.height,
          },
          {
            fill: feeStyle.borderLeftColor || '#6aa84f',
          }
        );
      }
      const feeLines = [];
      const prefixEl = timetableFees.querySelector('.timetable-fee-prefix');
      if (prefixEl && prefixEl.textContent.trim()) {
        feeLines.push(prefixEl.textContent.trim());
      }
      const feeLineEls = Array.from(timetableFees.querySelectorAll('.timetable-fee-line')).filter(
        (el) => !el.classList.contains('fee-hidden')
      );
      feeLineEls.forEach((el) => {
        const text = el.textContent.trim();
        if (text) feeLines.push(text);
      });
      if (!feeLines.length) {
        const fallbackText = timetableFees.textContent.trim();
        if (fallbackText) feeLines.push(fallbackText);
      }
      const expandedLines = [];
      feeLines.forEach((line) => {
        const wrapped = wrapText(line, feeMaxWidth, feeTextStyle, 10);
        if (wrapped.length) {
          wrapped.forEach((item) => expandedLines.push(item));
        }
      });
      expandedLines.forEach((line, idx) => {
        const lower = line.toLowerCase();
        const labelMatch =
          lower.startsWith('fees:') ||
          lower.startsWith('cancellation date:') ||
          lower.startsWith('semester start date:');
        if (labelMatch) {
          const splitIndex = line.indexOf(':');
          const label = splitIndex >= 0 ? line.slice(0, splitIndex + 1) : line;
          const rest = splitIndex >= 0 ? line.slice(splitIndex + 1) : '';
          const restText = rest ? (rest.startsWith(' ') ? rest : ` ${rest}`) : '';
          addTextSegments(
            [
              { text: label, bold: true },
              { text: restText, bold: false },
            ],
            feeX,
            feeY + feeLineHeight * idx,
            feeTextStyle
          );
        } else {
          addText(line, feeX, feeY + feeLineHeight * idx, feeTextStyle);
        }
      });
    }

    svgParts.push('</svg>');
    return { svg: svgParts.join(''), width, height };
  };

  const buildElementSvg = (element) => buildCourseMapSvgFromDom(element);

  const renderElementToSvgBlob = (element) => {
    const built = buildCourseMapSvgFromDom(element) || buildElementSvg(element);
    if (!built) return null;
    return new Blob([built.svg], { type: 'image/svg+xml;charset=utf-8' });
  };

  const renderSvgToPngBlob = (svg, width, height, scaleOverride = null) =>
    new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.crossOrigin = 'anonymous';
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const finish = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale =
            Number.isFinite(scaleOverride) && scaleOverride > 0
              ? scaleOverride
              : Math.max(2, Math.round(window.devicePixelRatio || 1));
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(null);
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.setTransform(scale, 0, 0, scale, 0, 0);
          ctx.drawImage(img, 0, 0, width, height);
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

  const renderElementToPngBlob = (element) => {
    const built = buildElementSvg(element);
    if (!built) return Promise.resolve(null);
    return renderSvgToPngBlob(built.svg, built.width, built.height);
  };

  const cmToPx = (cm, dpi = 96) => Math.round((cm / 2.54) * dpi);

  const renderTimetableExportPngBlob = () => {
    const built = buildTimetableSvgFromDom();
    if (!built) return Promise.resolve(null);
    const targetWidthPx = cmToPx(16, 96);
    const scale = built.width ? targetWidthPx / built.width : 1;
    return renderSvgToPngBlob(
      built.svg,
      Math.round(built.width * scale),
      Math.round(built.height * scale),
      1
    );
  };

  const downloadTimetableExportImage = async () => {
    const blob = await renderTimetableExportPngBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'timetable.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const blobToDataUrl = (blob) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(blob);
    });

  const copyRichHtmlLegacy = (html, plainText = '') => {
    try {
      let copied = false;
      const host = document.createElement('div');
      host.contentEditable = 'true';
      host.style.position = 'fixed';
      host.style.left = '-9999px';
      host.style.top = '0';
      host.style.opacity = '0';
      host.innerHTML = html;
      document.body.appendChild(host);
      const range = document.createRange();
      range.selectNodeContents(host);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const onCopy = (event) => {
        event.preventDefault();
        event.clipboardData?.setData('text/html', html);
        event.clipboardData?.setData('text/plain', plainText || host.innerText || '');
        copied = true;
      };
      document.addEventListener('copy', onCopy);
      const ok = document.execCommand('copy');
      document.removeEventListener('copy', onCopy);
      selection.removeAllRanges();
      host.remove();
      return copied || ok;
    } catch {
      return false;
    }
  };

  const copyTimetableExportImageToClipboard = async () => {
    const blob = await renderTimetableExportPngBlob();
    if (!blob) return false;
    if (!window.ClipboardItem || !navigator.clipboard?.write || !window.isSecureContext) {
      await downloadTimetableExportImage();
      return false;
    }
    try {
      const dataUrl = await blobToDataUrl(blob);
      const widthPx = cmToPx(16, 96);
      const widthTwips = Math.round((16 / 2.54) * 72 * 20);
      const html = `<table role="presentation" style="border-collapse:collapse;width:16cm;max-width:16cm;"><tr><td style="padding:0;margin:0;"><img src="${dataUrl}" width="${widthPx}" style="display:block;width:16cm;max-width:16cm;height:auto;border:0;mso-width-source:userset;mso-width-alt:${widthTwips};" /></td></tr></table>`;
      if (copyRichHtmlLegacy(html, 'Timetable image')) return true;
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob(['Timetable image'], { type: 'text/plain' }),
        }),
      ]);
      return true;
    } catch {
      // try png fallback for apps that reject html clipboard image
    }
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      return true;
    } catch {
      await downloadTimetableExportImage();
      return false;
    }
  };

  const copyCourseMapImage = async () => {
    const target = getCourseMapCaptureTarget();
    if (!target) return;
    if (!window.ClipboardItem || !navigator.clipboard?.write || !window.isSecureContext) {
      await downloadCourseMapImage();
      return;
    }
    const blob = await renderElementToPngBlob(target);
    if (!blob) {
      await downloadCourseMapImage();
      return;
    }
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch (err) {
      await downloadCourseMapImage();
    }
  };

  const downloadCourseMapImage = async () => {
    const target = getCourseMapCaptureTarget();
    const blob = await renderElementToPngBlob(target);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'course-map.png';
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

    const measureNaturalWidths = () => {
      const clone = timetableTable.cloneNode(true);
      clone.style.visibility = 'hidden';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '-9999px';
      clone.style.width = 'auto';
      clone.style.maxWidth = 'none';
      clone.style.minWidth = '0';
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

      const widths = measureNaturalWidths();

      widths.forEach((w, idx) => {
        const target = Math.max(0, Math.ceil(w));
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

  const adjustTimetableSizing = () => {
    if (!timetableTable || !timetableModal) return;
    adjustTableColumnWidths();
    const modalEl = timetableModal.querySelector('.modal');
    if (!modalEl) return;
    const measureNaturalTableWidth = () => {
      const clone = timetableTable.cloneNode(true);
      clone.style.visibility = 'hidden';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '-9999px';
      clone.style.width = 'auto';
      clone.style.maxWidth = 'none';
      document.body.appendChild(clone);
      const width = Math.ceil(Math.max(clone.scrollWidth || 0, clone.getBoundingClientRect().width || 0));
      document.body.removeChild(clone);
      return width;
    };
    const tableRect = timetableTable.getBoundingClientRect();
    const wrapper = timetableTable.closest('.timetable-table-wrapper');
    const wrapperRect = wrapper ? wrapper.getBoundingClientRect() : null;
    const naturalWidth = measureNaturalTableWidth();
    const tableWidth = Math.ceil(
      Math.max(
        tableRect.width,
        timetableTable.scrollWidth || 0,
        wrapperRect?.width || 0,
        wrapper?.scrollWidth || 0,
        naturalWidth
      )
    );
    const modalStyle = window.getComputedStyle(modalEl);
    const padLeft = parseFloat(modalStyle.paddingLeft) || 0;
    const padRight = parseFloat(modalStyle.paddingRight) || 0;
    const borderLeft = parseFloat(modalStyle.borderLeftWidth) || 0;
    const borderRight = parseFloat(modalStyle.borderRightWidth) || 0;
    const chrome = padLeft + padRight + borderLeft + borderRight + 8;
    const viewportWidth = Math.floor(window.innerWidth * 0.98);
    const targetWidth = Math.min(viewportWidth, tableWidth + chrome);
    modalEl.style.width = `${targetWidth}px`;
    modalEl.style.maxWidth = `${targetWidth}px`;
    modalEl.style.minWidth = `${targetWidth}px`;
    if (wrapper) {
      wrapper.style.width = `${tableWidth}px`;
      wrapper.style.maxWidth = `${tableWidth}px`;
      wrapper.style.minWidth = `${tableWidth}px`;
    }
    timetableTable.style.width = `${tableWidth}px`;
    timetableTable.style.maxWidth = `${tableWidth}px`;
    timetableTable.style.minWidth = `${tableWidth}px`;
    if (DEBUG_TIMETABLE_MODAL || window.DEBUG_TIMETABLE_MODAL) {
      const modalRect = modalEl.getBoundingClientRect();
      console.info('[Timetable modal sizing]', {
        tableRect: { w: tableRect.width, sw: timetableTable.scrollWidth },
        wrapperRect: wrapperRect ? { w: wrapperRect.width, sw: wrapper?.scrollWidth || 0 } : null,
        naturalWidth,
        chrome,
        targetWidth,
        modalRect: { w: modalRect.width },
      });
    }
  };

  const scheduleAdjustTimetable = () => {
    if (!timetableTable) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        adjustTimetableSizing();
      });
    });
    setTimeout(() => {
      adjustTimetableSizing();
    }, 60);
  };

  const setTimetableModalMode = (mode) => {
    if (!timetableModal) return;
    timetableModal.dataset.mode = mode;
    timetableModal.classList.toggle('mode-available', mode === 'available');
    timetableModal.classList.toggle('mode-selected', mode === 'selected');
  };

  const showTimetableModal = () => {
    if (!timetableModal) return;
    manualFeeHidden.domestic = false;
    manualFeeHidden.international = false;
    lastFullLoadSelected = false;
    currentTableMode = 'selected';
    setTimetableModalMode(currentTableMode);
    setTimetableHeading(currentTableMode);
    renderTimetableTable();
    updateTimetableFees();
    updateTimetableEmailButtons();
    timetableModal.classList.add('show');
    timetableModal.setAttribute('aria-hidden', 'false');
    syncSubjectTableActions(timetableTable);
    lockModalPosition();
    scheduleAdjustTimetable();
  };

  const showAvailableModal = () => {
    if (!timetableModal) return;
    manualFeeHidden.domestic = false;
    manualFeeHidden.international = false;
    lastFullLoadSelected = false;
    const selectedCount = getSelectedRows().length;
    const threshold = getLoadThreshold();
    if (availableHeading) {
      availableHeading.style.display = '';
    }
    currentTableMode = selectedCount >= threshold ? 'selected' : 'available';
    setTimetableModalMode(currentTableMode);
    setTimetableHeading(currentTableMode);
    const rows =
      currentTableMode === 'available' ? getAvailableRowsForDisplay() : getSelectedRows();
    renderTimetableTable(rows, true);
    updateTimetableFees();
    updateTimetableEmailButtons();
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
    const historyFocusTarget = closeHistoryCta || closeHistory;
    if (historyFocusTarget) historyFocusTarget.focus();
  };

  const hideHistoryModal = () => {
    if (!historyModal) return;
    if (historyButton) historyButton.focus();
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
    updateCourseMapPrereqToggle();
    updateCourseMapPrereqTextToggle();
    updateCourseMapFontScale();
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
    let resizeScheduled = false;
    let lastWidth = 0;
    let lastHeight = 0;
    const observer = new ResizeObserver(() => {
      if (resizeScheduled) return;
      resizeScheduled = true;
      observer.disconnect();
      requestAnimationFrame(() => {
        if (courseMapModal?.classList.contains('show')) {
          const rect = target.getBoundingClientRect();
          const width = Math.round(rect.width);
          const height = Math.round(rect.height);
          if (width !== lastWidth || height !== lastHeight) {
            lastWidth = width;
            lastHeight = height;
            positionCourseMapArrows();
            positionCourseMapCoreConnector();
            updateCourseMapStreamLabels();
            updateCourseMapNotesOverlap();
          }
        }
        resizeScheduled = false;
        observer.observe(target);
      });
    });
    observer.observe(target);
    return observer;
  };

  let courseMapResizeObserver = observeCourseMapResize();

  const updateCourseMapPrereqToggle = () => {
    if (courseMapModal) {
      courseMapModal.classList.toggle('course-map-prereq-off', !courseMapPrereqColoursOn);
    }
    if (toggleCourseMapPrereqButton) {
      toggleCourseMapPrereqButton.textContent = courseMapPrereqColoursOn
        ? 'Prereq colours on'
        : 'Prereq colours off';
      toggleCourseMapPrereqButton.setAttribute('aria-pressed', courseMapPrereqColoursOn ? 'true' : 'false');
    }
    updateCourseMapStreamLabels();
  };

  const getCourseMapCoreConnector = () => {
    if (!courseMapContent) return null;
    if (courseMapCoreConnectorEl) return courseMapCoreConnectorEl;
    const coreBlock = courseMapContent.querySelector('.course-map-core-block');
    if (!coreBlock) return null;
    const connector = document.createElement('div');
    connector.className = 'course-map-core-connector';
    connector.innerHTML = '<div class="connector-h"></div><div class="connector-v"></div><div class="connector-elbow"></div><div class="connector-h-bit121"></div><div class="connector-v-bit372"></div><div class="connector-v-ms"></div><div class="connector-v-major-elective"></div>';
    coreBlock.appendChild(connector);
    courseMapCoreConnectorEl = connector;
    return connector;
  };

  const positionCourseMapCoreConnector = () => {
    if (!courseMapContent) return;
    const coreBlock = courseMapContent.querySelector('.course-map-core-block');
    if (!coreBlock) return;
    const bit105Cell = courseMapCells.get('BIT105');
    const bit108Cell = courseMapCells.get('BIT108');
    const majorGrid = coreBlock.querySelector('.course-map-major-grid');
    if (!bit105Cell || !bit108Cell || !majorGrid) return;
    const containerRect = coreBlock.getBoundingClientRect();
    const bit105Rect = bit105Cell.getBoundingClientRect();
    const bit108Rect = bit108Cell.getBoundingClientRect();
    const majorRect = majorGrid.getBoundingClientRect();
    const connectorNudge = 0;
    const sepWidth = parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--course-map-separator-width')
        .replace('px', '')
    ) || 3;
    const xNudge = 1;
    const bit105Style = getComputedStyle(bit105Cell);
    const bit108Style = getComputedStyle(bit108Cell);
    const bit105BorderRight = parseFloat(bit105Style.borderRightWidth) || 0;
    const bit105BorderBottom = parseFloat(bit105Style.borderBottomWidth) || 0;
    const bit108BorderLeft = parseFloat(bit108Style.borderLeftWidth) || 0;
    const xStart = bit105Rect.right - containerRect.left - connectorNudge - bit105BorderRight / 2 + xNudge - 2;
    const xCorner = bit108Rect.left - containerRect.left + bit108BorderLeft / 2 + xNudge;
    const yCenter = bit105Rect.bottom - containerRect.top - connectorNudge - bit105BorderBottom / 2;
    const yDownEnd = majorRect.top - containerRect.top + 4;
    if (!Number.isFinite(xStart) || !Number.isFinite(xCorner) || !Number.isFinite(yCenter) || !Number.isFinite(yDownEnd)) {
      return;
    }
    const connector = getCourseMapCoreConnector();
    if (!connector) return;
    connector.style.position = 'absolute';
    connector.style.left = '0px';
    connector.style.top = '0px';
    connector.style.width = '100%';
    connector.style.height = '100%';
    const horiz = connector.querySelector('.connector-h');
    const vert = connector.querySelector('.connector-v');
    const elbow = connector.querySelector('.connector-elbow');
    const bit121Horiz = connector.querySelector('.connector-h-bit121');
    const bit372Vert = connector.querySelector('.connector-v-bit372');
    const msVert = connector.querySelector('.connector-v-ms');
    const majorElectiveVert = connector.querySelector('.connector-v-major-elective');
    if (!horiz || !vert || !bit121Horiz || !bit372Vert || !msVert || !majorElectiveVert) return;
    const fmt = (value) => `${value.toFixed(2)}px`;
    const elbowX = xCorner - sepWidth / 2;
    const elbowY = yCenter - sepWidth / 2 - 1;
    horiz.style.left = fmt(xStart);
    horiz.style.top = fmt(elbowY);
    horiz.style.width = fmt(Math.max(0, elbowX - xStart));
    vert.style.left = fmt(elbowX);
    vert.style.top = fmt(yCenter);
    vert.style.height = fmt(Math.max(0, yDownEnd - yCenter));
    if (elbow) {
      elbow.style.left = fmt(elbowX);
      elbow.style.top = fmt(elbowY);
      elbow.style.width = fmt(sepWidth);
      elbow.style.height = fmt(sepWidth);
    }

    const bit121Cell = courseMapCells.get('BIT121');
    if (bit121Cell && bit105Cell) {
      const bit121Rect = bit121Cell.getBoundingClientRect();
      const bit121Style = getComputedStyle(bit121Cell);
      const bit105Style = getComputedStyle(bit105Cell);
      const bit121BorderBottom = parseFloat(bit121Style.borderBottomWidth) || 0;
      const bit105BorderBottom = parseFloat(bit105Style.borderBottomWidth) || 0;
      const yBottom =
        (bit121Rect.bottom - containerRect.top) - Math.max(bit121BorderBottom, bit105BorderBottom) / 2 - 2;
      const bit105BorderLeft = parseFloat(bit105Style.borderLeftWidth) || 0;
      const xStartLine = bit121Rect.right - containerRect.left;
      const xEndLine = bit105Rect.left - containerRect.left + bit105BorderLeft / 2;
      bit121Horiz.style.left = fmt(xStartLine);
      bit121Horiz.style.top = fmt(yBottom - sepWidth / 2);
      bit121Horiz.style.width = fmt(Math.max(0, xEndLine - xStartLine));
    } else {
      bit121Horiz.style.width = '0px';
    }

    const bit372Cell = courseMapCells.get('BIT372');
    const es3Cell = coreBlock.querySelector('.course-map-major-grid .course-map-cell[data-elective-slot="3"]');
    if (bit372Cell && es3Cell) {
      const bit372Rect = bit372Cell.getBoundingClientRect();
      const es3Rect = es3Cell.getBoundingClientRect();
      const xMid = bit372Rect.right - containerRect.left + 1;
      const yStart = bit372Rect.bottom - containerRect.top;
      const yEnd = es3Rect.top - containerRect.top;
      bit372Vert.style.left = `${Math.round(xMid)}px`;
      bit372Vert.style.top = `${Math.round(yStart)}px`;
      bit372Vert.style.height = `${Math.max(0, Math.round(yEnd - yStart))}px`;
    } else {
      bit372Vert.style.height = '0px';
    }

    const ms5Cell = coreBlock.querySelector('.course-map-major-grid .course-map-cell[data-major-slot="5"]');
    const ms6Cell = coreBlock.querySelector('.course-map-major-grid .course-map-cell[data-major-slot="6"]');
    const es1Cell = coreBlock.querySelector('.course-map-major-grid .course-map-cell[data-elective-slot="1"]');
    const es2Cell = coreBlock.querySelector('.course-map-major-grid .course-map-cell[data-elective-slot="2"]');
    const esLeftCell = es1Cell || es2Cell;
    if (ms5Cell && ms6Cell && esLeftCell) {
      const ms5Rect = ms5Cell.getBoundingClientRect();
      const ms6Rect = ms6Cell.getBoundingClientRect();
      const esRect = esLeftCell.getBoundingClientRect();
      const gapCenter = (ms5Rect.right + esRect.left) / 2;
      const xGap = gapCenter - containerRect.left - (sepWidth / 2);
      const yStart = ms5Rect.bottom - containerRect.top;
      const yEnd = ms6Rect.top - containerRect.top;
      msVert.style.left = `${Math.round(xGap)}px`;
      msVert.style.top = `${Math.round(yStart)}px`;
      msVert.style.height = `${Math.max(0, Math.round(yEnd - yStart))}px`;

      const majorTop = majorRect.top - containerRect.top;
      const majorBottom = majorRect.bottom - containerRect.top;
      const majorElectiveConnectorExtra = 0;
      majorElectiveVert.style.left = `${Math.round(xGap)}px`;
      majorElectiveVert.style.top = `${Math.round(majorTop)}px`;
      majorElectiveVert.style.height = `${Math.max(0, Math.round(majorBottom - majorTop + majorElectiveConnectorExtra))}px`;
    } else {
      msVert.style.height = '0px';
      majorElectiveVert.style.height = '0px';
    }
  };

  const updateCourseMapPrereqTextToggle = () => {
    if (courseMapModal) {
      courseMapModal.classList.toggle('course-map-prereq-text-off', !courseMapPrereqTextOn);
    }
    if (toggleCourseMapPrereqTextButton) {
      toggleCourseMapPrereqTextButton.textContent = courseMapPrereqTextOn
        ? 'Prereq text on'
        : 'Prereq text off';
      toggleCourseMapPrereqTextButton.setAttribute('aria-pressed', courseMapPrereqTextOn ? 'true' : 'false');
    }
    updateCourseMapStreamLabels();
    positionCourseMapArrows();
  };

  const updateCourseMapIndicatorsToggle = () => {
    if (toggleCourseMapIndicatorsButton) {
      toggleCourseMapIndicatorsButton.textContent = courseMapIndicatorsOn
        ? 'Stream indicators on'
        : 'Stream indicators off';
      toggleCourseMapIndicatorsButton.setAttribute('aria-pressed', courseMapIndicatorsOn ? 'true' : 'false');
    }
    updateCourseMapStreamLabels();
  };

  const updateCourseMapFontScale = () => {
    const target = courseMapModal?.querySelector('.course-map-modal') || courseMapModal;
    if (target) {
      target.style.setProperty('--course-map-font-scale', `${courseMapFontScaleEm}em`);
    }
  };

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
    setTimetableHeading(mode);
    const rows = mode === 'available' ? getAvailableRowsForDisplay() : getSelectedRows();
    renderTimetableTable(rows, true);
    updateTimetableFees();
    updateTimetableEmailButtons();
    scheduleAdjustTimetable();
  };

  const hideTimetableModal = () => {
    if (!timetableModal) return;
    unlockModalPosition();
    timetableModal.classList.remove('show');
    timetableModal.setAttribute('aria-hidden', 'true');
    lastFullLoadSelected = false;
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
  const alertContent = { error: [], warning: [], info: [], data: [], codes: [] };
  const alertPrevCounts = { error: 0, warning: 0, info: 0, data: 0, codes: 0 };
  const alertPrevSignatures = { error: '', warning: '', info: '', data: '', codes: '' };
  const ALERT_COLORS = {
    error: getCssVar('--alert-error', '#d32f2f'),
    warning: getCssVar('--alert-caution', '#c25a00'),
    info: getCssVar('--alert-info', '#0b7fab'),
    data: getCssVar('--alert-error', '#d32f2f'),
    codes: getCssVar('--alert-info', '#0b7fab'),
  };
  const alertState = {
    error: new Map(),
    warning: new Map(),
    info: new Map(),
    data: new Map(),
    codes: new Map(),
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
    if (type === 'data') return dataErrorButton;
    if (type === 'codes') return codesButton;
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
    const labels = { error: 'Error', warning: 'Caution', info: 'Info', data: 'Data Error?', codes: 'Codes' };
    const content = alertContent[type] || [];
    const count = content.length;
    const hasUnread = content.some((p) => !p.seen);
    const signature = content.map((p) => alertId(p)).join('|');
    const contentChanged = signature !== alertPrevSignatures[type];
    const isCountless = type === 'codes';
    if (count > 0) {
      btn.classList.remove('hidden');
      if (isCountless) {
        btn.textContent = labels[type] || type;
        btn.classList.remove('has-unread');
      } else {
        btn.innerHTML = `<span class="alert-label">${labels[type] || type}</span><span class="alert-count">${count}</span>`;
        btn.classList.toggle('has-unread', hasUnread);
      }
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
        if (!isCountless && (delta > 0 || (contentChanged && hasUnread))) {
          const rect = btn.getBoundingClientRect();
          btn.style.setProperty('--alert-flash-x', `${rect.left + rect.width / 2}px`);
          btn.style.setProperty('--alert-flash-y', `${rect.top + rect.height / 2}px`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => {
            btn.classList.add('alert-pending', 'alert-flash');
            setTimeout(() => btn.classList.remove('alert-flash'), 500);
          }, 150);
        } else if (!isCountless && delta < 0) {
          btn.classList.remove('alert-pending', 'alert-flash');
        }
        if (!isCountless && delta === 0 && !hasUnread) {
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
      type === 'warning'
        ? 'Cautions'
        : type === 'error'
          ? 'Errors'
          : type === 'data'
            ? 'Data Errors'
            : payloads[0].title || 'Notice';
    alertTitle.style.display = 'block';
    alertTitle.style.fontWeight = '700';
    if (type === 'warning') {
      alertTitle.style.color = ALERT_COLORS.warning;
    } else if (type === 'error' || type === 'data') {
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

  const copyTimetableToClipboard = async () => {
    if (!timetableTable || !clipboardAvailable) return false;
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
    const feesText = getVisibleTimetableFeesText();
    const feeLines = [];
    if (timetableFees && !timetableFees.hidden) {
      const prefix = timetableFees.querySelector('.timetable-fee-prefix');
      const prefixText = prefix ? prefix.textContent.trim() : '';
      if (prefixText) feeLines.push(prefixText);
      const visibleFeeLines = Array.from(timetableFees.querySelectorAll('.timetable-fee-line'))
        .filter((el) => !el.classList.contains('fee-hidden'))
        .map((el) => el.textContent.trim())
        .filter(Boolean);
      feeLines.push(...visibleFeeLines);
    } else if (feesText) {
      feeLines.push(feesText);
    }
    const feeTextLines = feeLines.filter(Boolean).join('\n');
    const text = includeHeading
      ? `${heading}\n\n\n${textBody}${feeTextLines ? `\n\n\n${feeTextLines}` : ''}`
      : `${textBody}${feeTextLines ? `\n\n\n${feeTextLines}` : ''}`;

    const headerSample = timetableTable.querySelector('thead th');
    const headerStyle = headerSample ? window.getComputedStyle(headerSample) : null;
    const headerBg = headerStyle?.backgroundColor || '#7ea8e6';
    const headerColor = headerStyle?.color || '#000';
    const conflictSample = timetableTable.querySelector('td.timetable-conflict');
    const conflictStyle = conflictSample ? window.getComputedStyle(conflictSample) : null;
    const conflictColor = conflictStyle?.color || '#c00';
    const conflictWeight = conflictStyle?.fontWeight || '700';
    const htmlRows = rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll('th,td')).map((c) => {
          const tag = c.tagName.toLowerCase();
          const baseStyle = 'border:1px solid #ccc;text-align:left;line-height:1;font-family:Calibri, Arial, sans-serif;font-size:11pt;';
          const headStyle = `${baseStyle}padding:6pt 8px;font-weight:700;background:${headerBg};color:${headerColor};`;
          let bodyStyle = `${baseStyle}padding:0 8px;font-weight:400;`;
          if (tag !== 'th' && c.classList.contains('timetable-conflict')) {
            bodyStyle += `color:${conflictColor};font-weight:${conflictWeight};`;
          }
          const style = tag === 'th' ? headStyle : bodyStyle;
          return `<${tag} style="${style}">${c.textContent.trim()}</${tag}>`;
        });
        return `<tr>${cells.join('')}</tr>`;
      })
      .join('');
    const headingHtml = includeHeading
      ? `<p style="margin:0 0 10pt 0;mso-margin-top-alt:0;mso-margin-bottom-alt:0;font-family:Calibri, Arial, sans-serif;font-size:11pt;font-weight:700;line-height:1.2;">${heading}</p>`
      : '';
      const formatFeeLineHtml = (line) => {
      const safe = escapeHtml(line);
      if (/^Cancellation Date\b/i.test(line)) {
        return safe.replace(
          /^Cancellation Date/i,
          '<span style="font-weight:700;">Cancellation Date</span>'
        );
      }
      if (/^Semester start date\b/i.test(line)) {
        return safe.replace(
          /^Semester start date/i,
          '<span style="font-weight:700;">Semester start date</span>'
        );
      }
      if (/^Fees\b/i.test(line)) {
        return safe.replace(/^Fees/i, '<span style="font-weight:800;">Fees</span>');
      }
      return safe;
    };
    const feeParagraphs = feeLines
      .map((line) => line.trim())
      .filter(Boolean)
      .map(
        (line) =>
          `<p style="margin:0;mso-margin-top-alt:0;mso-margin-bottom-alt:0;font-family:Calibri, Arial, sans-serif;font-size:11pt;line-height:1.2;">${formatFeeLineHtml(
            line
          )}</p>`
      )
      .join('');
    let feesHtml = feeParagraphs || '';
    if (feesHtml && timetableFees) {
      const feeStyle = window.getComputedStyle(timetableFees);
      const feeBoxStyle = [
        'margin:0',
        'mso-margin-top-alt:0',
        'mso-margin-bottom-alt:0',
        'font-family:Calibri, Arial, sans-serif',
        'font-size:11pt',
        'line-height:1.35',
        `padding:${feeStyle.paddingTop} ${feeStyle.paddingRight} ${feeStyle.paddingBottom} ${feeStyle.paddingLeft}`,
        `background:${feeStyle.backgroundColor}`,
        `border:1px solid ${feeStyle.borderColor}`,
        `border-left:${feeStyle.borderLeftWidth} solid ${feeStyle.borderLeftColor}`,
        'box-sizing:border-box',
      ].join(';');
      feesHtml = `<div style="${feeBoxStyle}">${feesHtml}</div>`;
    }
    const htmlSpacer = '<p style="margin:0 0 10pt 0;mso-margin-top-alt:0;mso-margin-bottom-alt:0;line-height:1;">&nbsp;</p>';
    const html = `${headingHtml}${htmlSpacer}<table style="border-collapse:collapse;border:1px solid #ccc;border-spacing:0;font-family:Calibri, Arial, sans-serif;font-size:11pt;">${htmlRows}</table>${htmlSpacer}${feesHtml}`;

    if (window.ClipboardItem) {
      const blobInput = {
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      };
      try {
        await navigator.clipboard.write([new ClipboardItem(blobInput)]);
        return true;
      } catch {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          return false;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const buildTimetableEmailBody = async (firstName) => {
    const name = firstName || 'student';
    const scripts = await parseEmailScripts();
    const pref = scripts?.preferences || null;
    const salutationBase = pref?.salutation ? pref.salutation.trim() : 'Hello';
    const salutation = `${salutationBase} ${name}`.trim();
    const signOffPhrase = pref?.signOffPhrase ? pref.signOffPhrase.trim() : 'Kind regards';
    const signOffName = pref?.signOffName ? pref.signOffName.trim() : '';
    const signOffBlock = `${signOffPhrase}${signOffName ? `\n${signOffName}` : ''}`;
    return `${salutation}\n\n\n${signOffBlock}`;
  };

  const buildTimetableEmailBodySync = (firstName) => {
    const name = firstName || 'student';
    const scripts = emailScriptsCache;
    const pref = scripts?.preferences || null;
    const salutationBase = pref?.salutation ? pref.salutation.trim() : 'Hello';
    const salutation = `${salutationBase} ${name}`.trim();
    const signOffPhrase = pref?.signOffPhrase ? pref.signOffPhrase.trim() : 'Kind regards';
    const signOffName = pref?.signOffName ? pref.signOffName.trim() : '';
    const signOffBlock = `${signOffPhrase}${signOffName ? `\n${signOffName}` : ''}`;
    return `${salutation}\n\n\n${signOffBlock}`;
  };

  const buildTimetableTextBlock = () => {
    if (!timetableTable) return '';
    const rows = Array.from(timetableTable.querySelectorAll('tr'));
    if (!rows.length) return '';
    return rows
      .map((row) =>
        Array.from(row.querySelectorAll('th,td'))
          .map((c) => c.textContent.trim())
          .join('\t')
      )
      .join('\n');
  };

  const insertTimetableIntoDeclaration = (text) => {
    const markerBefore = 'The subjects you have chosen for Semester 1 2026:';
    const markerAfter = 'Other important information:';
    if (!text) return { text: '', inserted: false };
    const idxStart = text.indexOf(markerBefore);
    const idxEnd = text.indexOf(markerAfter);
    if (idxStart === -1 || idxEnd === -1 || idxEnd <= idxStart) {
      return { text, inserted: false };
    }
    const timetableBlock = buildTimetableTextBlock();
    if (!timetableBlock) return { text, inserted: false };
    const before = text.slice(0, idxStart + markerBefore.length);
    const after = text.slice(idxEnd);
    const insertedText = `${before}\n\n${timetableBlock}\n\n${after}`;
    return { text: insertedText, inserted: true };
  };

  const buildTimetableHtmlBlock = () => {
    if (!timetableTable) return '';
    const rows = Array.from(timetableTable.querySelectorAll('tr'));
    if (!rows.length) return '';
    const htmlRows = rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll('th,td')).map((cell) => {
          const tag = cell.tagName.toLowerCase();
          const style =
            tag === 'th'
              ? 'border:1px solid #ccc;padding:6pt 8px;font-weight:700;font-family:Calibri, Arial, sans-serif;font-size:11pt;text-align:left;'
              : 'border:1px solid #ccc;padding:0 8px;font-weight:400;font-family:Calibri, Arial, sans-serif;font-size:11pt;text-align:left;';
          return `<${tag} style="${style}">${escapeHtml(cell.textContent.trim())}</${tag}>`;
        });
        return `<tr>${cells.join('')}</tr>`;
      })
      .join('');
    return `<table style="border-collapse:collapse;border:1px solid #ccc;border-spacing:0;font-family:Calibri, Arial, sans-serif;font-size:11pt;">${htmlRows}</table>`;
  };

  const insertTimetableIntoDeclarationHtml = (html) => {
    const markerBefore = 'The subjects you have chosen for Semester 1 2026:';
    const markerAfter = 'Other important information:';
    if (!html) return { html: '', inserted: false };
    const timetableHtml = buildTimetableHtmlBlock();
    if (!timetableHtml) return { html, inserted: false };
    const idxStart = html.indexOf(markerBefore);
    const idxEnd = html.indexOf(markerAfter);
    if (idxStart === -1 || idxEnd === -1 || idxEnd <= idxStart) {
      return { html, inserted: false };
    }
    const before = html.slice(0, idxStart + markerBefore.length);
    const after = html.slice(idxEnd);
    const insertedHtml = `${before}<br><br>${timetableHtml}<br><br>${after}`;
    return { html: insertedHtml, inserted: true };
  };

  const copyEmailScriptsToClipboard = async () => {
    const scripts = emailScriptsCache;
    if (!scripts) {
      parseEmailScripts().catch(() => {});
      return false;
    }
    const plain = scripts.declarationText || htmlToPlainText(scripts.declarationHtml || '');
    if (!plain) return false;
    const html = scripts.declarationHtml || '';
    if (window.ClipboardItem && navigator.clipboard?.write && window.isSecureContext) {
      const items = {
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      };
      if (html) {
        items['text/html'] = new Blob([html], { type: 'text/html' });
      }
      try {
        await navigator.clipboard.write([new ClipboardItem(items)]);
        return true;
      } catch {
        // fallback to text
      }
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(plain);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const copyHtmlPlainToClipboard = async (html, plain) => {
    if (!plain) return false;
    const fallbackHtmlFromText = plain
      .split(/\n{2,}/)
      .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
      .join('');
    const richHtml = html || fallbackHtmlFromText;
    const styledHtml = `<div style="font-family:Calibri, Arial, sans-serif;font-size:11pt;line-height:1.35;">${richHtml}</div>`;
    if (copyRichHtmlLegacy(styledHtml, plain)) return true;
    const copyViaExecCommand = () => {
      try {
        let copied = false;
        const onCopy = (event) => {
          event.preventDefault();
          event.clipboardData?.setData('text/plain', plain);
          event.clipboardData?.setData('text/html', styledHtml);
          copied = true;
        };
        document.addEventListener('copy', onCopy);
        const ok = document.execCommand('copy');
        document.removeEventListener('copy', onCopy);
        return copied || ok;
      } catch {
        return false;
      }
    };
    if (window.ClipboardItem && navigator.clipboard?.write && window.isSecureContext) {
      const items = {
        'text/plain': new Blob([plain], { type: 'text/plain' }),
        'text/html': new Blob([styledHtml], { type: 'text/html' }),
      };
      try {
        await navigator.clipboard.write([new ClipboardItem(items)]);
        return true;
      } catch {
        // fall through to legacy copy fallback
      }
    }
    if (copyViaExecCommand()) return true;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(plain);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const getEmailScriptsHtmlSourceResolved = async () => {
    if (emailScriptsHtmlSource) return emailScriptsHtmlSource;
    if (emailScriptsDocxBuffer && (window.mammoth?.extractHtml || window.mammoth?.convertToHtml)) {
      try {
        const extractor = window.mammoth.extractHtml || window.mammoth.convertToHtml;
        const htmlResult = await extractor({ arrayBuffer: emailScriptsDocxBuffer });
        return htmlResult?.value || '';
      } catch {
        return '';
      }
    }
    return '';
  };

  const extractEmailScriptsSectionByHeadings = async (headings = []) => {
    const htmlSource = await getEmailScriptsHtmlSourceResolved();
    if (!htmlSource) return { html: '', text: '' };
    for (const heading of headings) {
      const section = extractSectionFromHtml(
        htmlSource,
        heading,
        '',
        `extract:${heading}`
      );
      if (section?.text) return section;
    }
    return { html: '', text: '' };
  };

  const getEmailScriptsSectionHeadings = (sectionKey) =>
    Array.isArray(EMAIL_SCRIPTS_SECTION_HEADINGS[sectionKey])
      ? EMAIL_SCRIPTS_SECTION_HEADINGS[sectionKey]
      : [];

  const copyEmailScriptsSectionByKey = async (sectionKey) => {
    const headings = getEmailScriptsSectionHeadings(sectionKey);
    if (!headings.length) return false;
    await parseEmailScripts();
    const section = await extractEmailScriptsSectionByHeadings(headings);
    const plain = section?.text || '';
    const html = section?.html || '';
    if (!plain) return false;
    return copyHtmlPlainToClipboard(html, plain);
  };

  const copySupportsAtRiskSection = async () => {
    return copyEmailScriptsSectionByKey('supports-at-risk');
  };

  const copyStudentDeclaration = async () => {
    const scripts = await parseEmailScripts();
    let html = scripts?.declarationHtml || '';
    let plain = htmlToPlainText(html) || scripts?.declarationText || '';
    if (!plain && emailScriptsHtmlSource) {
      const fallback = extractSectionFromHtml(
        emailScriptsHtmlSource,
        'Student Declaration',
        'For Subject Planner – your preference',
        'copyStudentDeclaration'
      );
      html = fallback.html;
      plain = fallback.text;
    }
    if (!plain) return false;
    const fallbackHtmlFromText = plain
      .split(/\n{2,}/)
      .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
      .join('');
    let richHtml = html || fallbackHtmlFromText;
    if (richHtml) {
      const tmp = document.createElement('div');
      tmp.innerHTML = richHtml;
      tmp.querySelectorAll('table, th, td').forEach((el) => {
        el.style.fontSize = '11pt';
        el.style.fontFamily = 'Calibri, Arial, sans-serif';
      });
      tmp.querySelectorAll('mark, span.highlight, span[class*=\"highlight\"]').forEach((el) => {
        if (!el.style.backgroundColor) el.style.backgroundColor = '#fff200';
      });
      // Re-apply common declaration visual cues when Mammoth omits direct formatting.
      const normalizeText = (value) =>
        String(value || '')
          .replace(/[“”]/g, '"')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
      const highlightNeedles = [
        'i confirm the subjects listed for my enrolment',
        'i have read and understood the melbourne polytechnic student declaration and re-enrolment requirements',
      ];
      tmp.querySelectorAll('p,li,div,span').forEach((el) => {
        const text = normalizeText(el.textContent);
        if (!text) return;
        if (highlightNeedles.some((needle) => text.includes(needle))) {
          el.style.backgroundColor = '#fff200';
          el.style.display = 'inline-block';
          el.style.padding = '0 2px';
        }
      });
      tmp.querySelectorAll('p').forEach((el) => {
        const text = (el.textContent || '').trim();
        if (!text) return;
        // Preserve paragraph indentation for quoted response lines.
        if (/^[“"']/.test(text)) {
          el.style.marginLeft = '36pt';
        }
        // Restore bold blue heading style for short lead-in labels.
        if (text.endsWith(':') && text.length <= 70) {
          el.style.fontWeight = '700';
          el.style.color = '#2f5597';
        }
      });
      richHtml = tmp.innerHTML;
    }
    const styledHtml = `<div style="font-family:Calibri, Arial, sans-serif;font-size:11pt;line-height:1.35;">${richHtml}</div>`;
    if (copyRichHtmlLegacy(styledHtml, plain)) return true;
    const copyViaExecCommand = () => {
      try {
        let copied = false;
        const onCopy = (event) => {
          event.preventDefault();
          event.clipboardData?.setData('text/plain', plain);
          event.clipboardData?.setData('text/html', styledHtml);
          copied = true;
        };
        document.addEventListener('copy', onCopy);
        const ok = document.execCommand('copy');
        document.removeEventListener('copy', onCopy);
        return copied || ok;
      } catch {
        return false;
      }
    };
    if (window.ClipboardItem && navigator.clipboard?.write && window.isSecureContext) {
      const items = {
        'text/plain': new Blob([plain], { type: 'text/plain' }),
        'text/html': new Blob([styledHtml], { type: 'text/html' }),
      };
      try {
        await navigator.clipboard.write([new ClipboardItem(items)]);
        return true;
      } catch {
        // fall through to legacy copy fallback
      }
    }
    if (copyViaExecCommand()) return true;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(plain);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const copyStudentDeclarationWithTimetable = async () => {
    const scripts = await parseEmailScripts();
    let html = scripts?.declarationHtml || '';
    let plain = htmlToPlainText(html) || scripts?.declarationText || '';
    if (!plain && emailScriptsHtmlSource) {
      const fallback = extractSectionFromHtml(
        emailScriptsHtmlSource,
        'Student Declaration',
        'For Subject Planner – your preference',
        'copyStudentDeclaration'
      );
      html = fallback.html;
      plain = fallback.text;
    }
    if (!plain) return false;
    const { text: plainWithTable, inserted: insertedText } = insertTimetableIntoDeclaration(plain);
    const { html: htmlWithTable, inserted: insertedHtml } = insertTimetableIntoDeclarationHtml(
      html
    );
    const finalPlain = insertedText ? plainWithTable : plain;
    const finalHtml = insertedHtml ? htmlWithTable : html;
    const wrappedHtml = `<div style="font-family:Calibri, Arial, sans-serif;font-size:11pt;line-height:1.35;">${finalHtml}</div>`;
    if (copyRichHtmlLegacy(wrappedHtml, finalPlain)) return true;
    if (window.ClipboardItem && navigator.clipboard?.write && window.isSecureContext) {
      const items = {
        'text/plain': new Blob([finalPlain], { type: 'text/plain' }),
        'text/html': new Blob([wrappedHtml], { type: 'text/html' }),
      };
      try {
        await navigator.clipboard.write([new ClipboardItem(items)]);
        return true;
      } catch {
        // fall back to text only
      }
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(finalPlain);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const yieldToBrowser = () =>
    new Promise((resolve) => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => resolve());
      } else {
        setTimeout(resolve, 0);
      }
    });

  const openTimetableEmailDraft = (recipients, body) => {
    if (!recipients) return;
    const subject = 'Student Declaration';
    const mailto = `mailto:${encodeURIComponent(recipients)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const openTimetableEmailDraftSafe = (recipients, body, fallbackBody) => {
    if (!recipients) return false;
    const subject = 'Student Declaration';
    const encodedBody = encodeURIComponent(body || '');
    const maxMailtoBodyLength = 1800;
    if (encodedBody.length > maxMailtoBodyLength) {
      const shortBody = fallbackBody || body || '';
      const mailto = `mailto:${encodeURIComponent(recipients)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(shortBody)}`;
      window.location.href = mailto;
      return false;
    }
    const mailto = `mailto:${encodeURIComponent(recipients)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodedBody}`;
    window.location.href = mailto;
    return true;
  };

  let emailInProgress = false;

  const buildRecipientListFromTarget = (record, target) => {
    if (!record) return '';
    const primary = String(record.Primary_Email || '').trim();
    const institute = String(record.Institute_Email || '').trim();
    return target === 'primary'
      ? primary
      : target === 'institute'
        ? institute
        : [primary, institute].filter(Boolean).join(',');
  };

  const sendTimetableEmail = async (target) => {
    if (emailInProgress) return;
    emailInProgress = true;
    try {
      const record = getActiveStudentRecord();
      if (!record) {
        window.alert('Select a student record to email.');
        return;
      }
      const recipientList = buildRecipientListFromTarget(record, target);
      if (!recipientList) {
        window.alert('No email address available for this student.');
        return;
      }
      const scripts = await parseEmailScripts();
      console.info('[Email prefs] cache ready:', !!scripts);
      const firstName = getStudentFirstName(record);
      const baseBody = buildTimetableEmailBodySync(firstName);
      await copyTimetableToClipboard();
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const ok = await copyStudentDeclaration();
      if (!ok) {
        window.alert('Could not copy Student Declaration to clipboard.');
      }
      openTimetableEmailDraftSafe(recipientList, baseBody, baseBody);
    } finally {
      emailInProgress = false;
    }
  };

  const sendDeclarationEmail = async (target = 'both', options = {}) => {
    if (emailInProgress) return;
    emailInProgress = true;
    try {
      const record = getActiveStudentRecord();
      if (!record) {
        window.alert('Select a student record to email.');
        return;
      }
      const recipientList = buildRecipientListFromTarget(record, target);
      if (!recipientList) {
        window.alert('No email address available for this student.');
        return;
      }
      const firstName = getStudentFirstName(record);
      const baseBody = buildTimetableEmailBodySync(firstName);
      const copyFn = typeof options.copyFn === 'function' ? options.copyFn : copyStudentDeclaration;
      const copyFailMessage =
        typeof options.copyFailMessage === 'string' && options.copyFailMessage
          ? options.copyFailMessage
          : 'Could not copy Student Declaration to clipboard.';
      const ok = await copyFn();
      if (!ok) {
        window.alert(copyFailMessage);
      }
      openTimetableEmailDraftSafe(recipientList, baseBody, baseBody);
    } finally {
      emailInProgress = false;
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
    const currentEnrolmentIds = new Set([
      ...workbookCurrent.keys(),
      ...manualEntryCurrent.keys(),
    ]);
    const completedCodes = new Set(
      Array.from(subjectState.entries())
        .filter(([, st]) => st?.completed)
        .map(([code]) => code)
    );
    const useCodes = electivePlaceholderState.filter(Boolean);
    const useManualResults =
      staffFacing && staffWorkbookState.getStudentRecord() && manualEntryResults.length > 0;
    const passedFromResults = new Set(
      manualEntryResults
        .filter((entry) => getGradeStatus(entry.result) === 'pass')
        .map((entry) => entry.id)
    );

    let historyRows = [];
    if (useManualResults) {
      historyRows = manualEntryResults
        .filter((entry) => validSubjectCodes.has(entry.id) || validUseCodes.has(entry.id))
        .filter((entry) => !currentEnrolmentIds.has(entry.id))
        .map((entry) => {
          const isUse = entry.id.startsWith('USE');
          const data = isUse ? {} : timetable[entry.id] || {};
          const dayFull = data.day || '';
          const dayShort = dayFull.slice(0, 3);
          const slot = data.slot || '';
          const cell = isUse ? null : getCellByCode(entry.id);
          const meta = manualEntryMeta.get(entry.id) || {};
          const result = formatHistoryResult(entry.result || '');
          const isFail = isFailGradeToken(result);
          const isPassed =
            !!subjectState.get(entry.id)?.completed || passedFromResults.has(entry.id);
          const repeatFail = (meta.failCountN || 0) > 1 && !isPassed;
          const displayCode = isUse ? entry.id : null;
          const displayName = isUse ? 'Unspecified Elective (USE)' : null;
          const displayStream = isUse ? 'Elective' : null;
          return {
            cell,
            id: entry.id,
            data,
            dayFull,
            dayShort,
            slot,
            result,
            date: entry.date || '',
            isFail,
            repeatFail,
            displayCode,
            displayName,
            displayStream,
          };
        });
    } else {
      const baseCodes = Array.from(completedCodes);
      const allCodes = new Set([...baseCodes, ...useCodes]);
      historyRows = Array.from(allCodes)
        .filter((id) => validSubjectCodes.has(id) || validUseCodes.has(id))
        .filter((id) => !currentEnrolmentIds.has(id))
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
          const isPassed = !!subjectState.get(id)?.completed || getGradeStatus(result) === 'pass';
          const repeatFail = (meta.failCountN || 0) > 1 && !isPassed;
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
            repeatFail,
            displayCode,
            displayName,
            displayStream,
          };
        });
    }
    historyRows.sort(compareByDaySlotThenCode);
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
    if (!currentEnrolmentsSection || !currentEnrolmentsTable) return;
    const tbody = currentEnrolmentsTable.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const rows = [
      ...Array.from(workbookCurrent.entries()),
      ...Array.from(manualEntryCurrent.entries()),
    ].reduce((acc, [id, meta]) => {
      if (!acc.has(id)) acc.set(id, meta);
      return acc;
    }, new Map());
    const listRows = Array.from(rows.entries())
      .filter(([id]) => validSubjectCodes.has(id) && !subjectState.get(id)?.completed)
      .map(([id, meta]) => ({ id, date: meta?.date || '' }))
      .sort((a, b) => a.id.localeCompare(b.id));
    if (!listRows.length) {
      currentEnrolmentsSection.hidden = true;
      if (historyGradedHeading) historyGradedHeading.hidden = true;
      return;
    }
    listRows.forEach(({ id, date }) => {
      const row = document.createElement('tr');
      row.dataset.subject = id;
      applyDisplayTypeClass(row, id);
      const name = getSubjectName(id);
      const stream = buildStreamLabel(id);
      const valueMap = {
        code: formatHistoryCode(id),
        name,
        result: '',
        date,
        stream,
      };
      ['code', 'name', 'result', 'date', 'stream'].forEach((col) => {
        const td = document.createElement('td');
        td.textContent = valueMap[col] ?? '';
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    currentEnrolmentsSection.hidden = false;
    if (historyGradedHeading) historyGradedHeading.hidden = false;

    requestAnimationFrame(() => {
      if (!historyTable || !currentEnrolmentsTable) return;
      const headerCells = historyTable.querySelectorAll('thead tr:last-child th');
      const currentRows = currentEnrolmentsTable.querySelectorAll('tbody tr');
      if (!headerCells.length || !currentRows.length) return;
      headerCells.forEach((cell, idx) => {
        const width = Math.ceil(cell.getBoundingClientRect().width);
        if (!width) return;
        currentRows.forEach((row) => {
          const td = row.children[idx];
          if (td) {
            td.style.width = `${width}px`;
            td.style.minWidth = `${width}px`;
          }
        });
      });
      currentEnrolmentsTable.style.width = '100%';
    });
  };

  const buildModifiedLine = (name, modifiedMs) => {
    if (!name) return null;
    if (!Number.isFinite(modifiedMs)) {
      return `${name}. Modified date unknown.`;
    }
    const daysAgo = Math.max(0, Math.floor((Date.now() - modifiedMs) / (1000 * 60 * 60 * 24)));
    const label = `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
    return `${name}. ${label}.`;
  };
  const getBestKnownActionPath = (type, fallbackPath = '') => {
    const fromLocations =
      type === 'source'
        ? fileLocationsCache?.source
        : type === 'email'
          ? fileLocationsCache?.email
          : fileLocationsCache?.triage;
    const raw = String(fromLocations || '').trim();
    if (!raw) {
      const root = String(fileLocationsCache?.root || '').trim();
      if (root) return applyPathPlaceholders(root);
      if (type === 'email') {
        const sourcePath = String(emailScriptsSourcePath || '').trim();
        if (sourcePath) {
          const sourceDir = getPathDirname(sourcePath);
          return sourceDir || sourcePath;
        }
      }
      const fallback = String(fallbackPath || '').trim();
      return fallback;
    }
    if (/[\\/][^\\/]+\.[a-z0-9]+$/i.test(raw) || /^[^\\/]+\.[a-z0-9]+$/i.test(raw)) {
      const dir = getPathDirname(raw);
      return dir || raw;
    }
    return raw;
  };
  const buildDropZoneStatusLines = () => {
    if (!lastDroppedFileInfo || !lastDroppedFileInfo.fileName) {
      return [
        { text: 'Source.xlsx not loaded.' },
        { text: 'Student data not available', bold: true },
      ];
    }
    const lines = [];
    const sourceLine = buildModifiedLine(lastDroppedFileInfo.fileName, lastDroppedFileInfo.modifiedMs);
    if (sourceLine) {
      lines.push({
        text: sourceLine,
        actions: [
          {
            key: 'source',
            label: 's',
            fileName: lastDroppedFileInfo.fileName,
            path: getBestKnownActionPath('source', lastDroppedFileInfo.path),
          },
        ],
      });
    }
    if (lastStudentCountLine) {
      const countText = lastStudentCountLine.replace(/\s+students\s+listed\.?$/i, ' rows.');
      lines.push({ text: countText, bold: true });
    }
    if (emailScriptsInfo?.fileName) {
      lines.push({ blank: true });
      const emailLine = buildModifiedLine(emailScriptsInfo.fileName, emailScriptsInfo.modifiedMs);
      if (emailLine) {
        lines.push({
          text: emailLine,
          actions: [
            {
              key: 'email',
              label: 'e',
              fileName: toDocxName(emailScriptsInfo.fileName),
              path: getBestKnownActionPath('email', emailScriptsInfo.path),
            },
            {
              key: 'email-actions',
              label: '•••',
              fileName: toDocxName(emailScriptsInfo.fileName),
              path: getBestKnownActionPath('email', emailScriptsInfo.path),
              tooltip: "Open Email Scripts actions",
            },
          ],
        });
      }
    }
    if (triageFileInfo?.fileName) {
      lines.push({ blank: true });
      const triageLine = buildModifiedLine(triageFileInfo.fileName, triageFileInfo.modifiedMs);
      if (triageLine) {
        lines.push({
          text: triageLine,
          actions: [
            {
              key: 'triage',
              label: 't',
              fileName: triageFileInfo.fileName,
              path: getBestKnownActionPath('triage', triageFileInfo.path),
            },
          ],
        });
        if (triageParseInfo?.status === 'ok') {
          lines.push({ text: `${triageRecords.size} students.`, bold: true });
        }
      }
    }
    return lines;
  };

  async function loadWorkbookFromUrl(urls) {
    if (typeof XLSX === 'undefined') return;
    try {
      if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(true);
      const candidates = Array.isArray(urls) ? urls : [urls];
      let response = null;
      let usedUrl = '';
      for (const candidate of candidates) {
        const cacheBustedUrl = (() => {
          const nonce =
            (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
            `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          try {
            const resolved = new URL(candidate, window.location.href);
            resolved.searchParams.set('t', nonce);
            return resolved.toString();
          } catch {
            const sep = candidate.includes('?') ? '&' : '?';
            return `${candidate}${sep}t=${nonce}`;
          }
        })();
        const attempt = await fetch(cacheBustedUrl, {
          cache: 'reload',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            Pragma: 'no-cache',
          },
        });
        if (attempt.ok) {
          response = attempt;
          usedUrl = candidate;
          break;
        }
      }
      if (!response) throw new Error('Workbook not found');
      const lastModified = response.headers.get('last-modified');
      const buffer = await response.arrayBuffer();
      sourceWorkbookFileObject = new File([buffer], usedUrl.split('?')[0].split('/').pop() || 'Source.xlsx', {
        type: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        lastModified: Date.now(),
      });
      const parsed = await parseWorkbookDataAsync(buffer);
      if (!parsed) throw new Error('Workbook read failed.');
      const { records, courseInfo } = parsed;
      studentRecords = records;
      activeStudentId = '';
      staffWorkbookState.setStudentRecord(null);
      staffWorkbookState.setCourseInfo(courseInfo);
      loadedStudentSnapshot = null;
      clearStudentSearchDropdown();
      const modifiedMs = lastModified ? Date.parse(lastModified) : null;
      lastDroppedFileInfo = {
        fileName: usedUrl.split('?')[0].split('/').pop() || 'Source.xlsx',
        modifiedMs: Number.isFinite(modifiedMs) ? modifiedMs : null,
        path: getPathDirname(usedUrl),
      };
      lastStudentCountLine = `${records.length} students listed`;
      renderDropZoneStatus(buildDropZoneStatusLines());
      updateStudentPreview();
    } catch (error) {
      // ignore auto-load failures; user can still drop the workbook manually
    } finally {
      if (setDropZoneSpinnerVisible) setDropZoneSpinnerVisible(false);
    }
  }

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
        if (id === 'BIT371' && subjectState.get('BIT372')?.toggled) return false;
        if (id === 'BIT372' && subjectState.get('BIT371')?.toggled) return false;
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

  const buildAvailableListSnapshotKey = () => {
    const studentKey = activeStudentId || normalizeStudentId(studentIdInput?.value || '');
    const majorKey = getMajorKeyFromUi();
    const overrideKey = overrideMode ? '1' : '0';
    const liveKey = livePrereqUpdates ? '1' : '0';
    const currentKey = passForEnrolmentsEnabled ? '1' : '0';
    const completedSignature = Array.from(subjectState.entries())
      .filter(([, st]) => st?.completed)
      .map(([code]) => code)
      .sort()
      .join(',');
    return [
      studentKey,
      majorKey,
      overrideKey,
      liveKey,
      currentKey,
      completedSignature,
    ].join('|');
  };

  const resetAvailableListSnapshot = () => {
    availableListSnapshot = null;
    availableListSnapshotKey = '';
  };

  const getAvailableRowsSnapshot = () => {
    const key = buildAvailableListSnapshotKey();
    if (!availableListSnapshot || availableListSnapshotKey !== key) {
      availableListSnapshot = getAvailableRows().map((row) => ({
        id: row.id,
        dayFull: row.dayFull,
        dayShort: row.dayShort,
        slot: row.slot,
        cell: row.cell,
        data: row.data,
      }));
      availableListSnapshotKey = key;
    }
    return availableListSnapshot;
  };

  const getAvailableRowsForDisplay = () =>
    getAvailableRowsSnapshot().map((item) => ({
      ...item,
      isChosen: !!subjectState.get(item.id)?.toggled,
    }));

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
    const available = getAvailableRowsForDisplay();
    const plannedCount = getPlannedCount();
    const completedCount = getCompletedCount();
    const useCredits = getUseCreditsCount();
    const completedTotal = completedCount + useCredits;
    const totalSubjects = getTotalSubjectsCount();
    const remainingCount = getRemainingSubjectsCount();
    const loadThreshold = getLoadThreshold();
    const workbookCurrentCount = Array.from(workbookCurrent.keys()).filter(
      (code) => validSubjectCodes.has(code) && !subjectState.get(code)?.completed
    ).length;
    const hasWorkbookCurrent = workbookCurrentCount > 0;
    const hasManualSelections = plannedCount > 0;
    const isFullyGraduated = remainingCount === 0 && plannedCount === 0 && completedTotal >= totalSubjects;
    const graduatingWithCurrent =
      !isFullyGraduated &&
      !available.length &&
      hasWorkbookCurrent &&
      !hasManualSelections &&
      completedTotal + workbookCurrentCount >= totalSubjects;
    if (document?.body) {
      document.body.classList.toggle(
        'graduate-highlight',
        isFullyGraduated || graduatingWithCurrent
      );
    }
    const hasInsufficientLoad =
      available.length > 0 &&
      (remainingCount <= 5
        ? available.length < remainingCount
        : available.length < loadThreshold);
    if (selectedListEl) {
      selectedListEl.classList.toggle('available-list-warning', hasInsufficientLoad);
    }
    if (hasInsufficientLoad) {
      const remainingLabel = remainingCount === 1 ? 'subject' : 'subjects';
      const loadLabel = loadThreshold === 1 ? 'subject' : 'subjects';
      availableLoadError = {
        title: 'Not enough subjects available',
        html: `<p><strong class="alert-inline-title alert-title-error">Not enough subjects available</strong> <span class="alert-inline-text">${remainingCount <= 5
          ? `Only ${available.length} subject${available.length === 1 ? '' : 's'} are available, but ${remainingCount} ${remainingLabel} remain to graduate.`
          : `Only ${available.length} subject${available.length === 1 ? '' : 's'} are available for selection, which is below the full load of ${loadThreshold} ${loadLabel}.`
          }</span></p>`,
      };
    } else {
      availableLoadError = null;
    }
    if (sidebarSectionDescriptor) {
      const count = available.length;
      const subjectLabel = count === 1 ? 'subject' : 'subjects';
      sidebarSectionDescriptor.innerHTML =
        `<span class="inline-strong">Choose your subjects</span> by clicking among the ${count} ${subjectLabel} below, or in main grid to right. Or click 'Available now' to select from there.`;
    }
    selectedListEl.innerHTML = '';
    selectedListEl.setAttribute('role', 'list');
    if (!available.length) {
      const li = document.createElement('div');
      li.className = 'available-item';
      li.setAttribute('role', 'listitem');
      if (isFullyGraduated) {
        li.classList.add('available-item-success');
        li.textContent = 'Graduated. All subjects passed.';
        availableNowError = null;
      } else if (graduatingWithCurrent) {
        li.classList.add('available-item-success');
        li.textContent = 'Graduating this semester when current enrolments complete';
        availableNowError = null;
      } else {
        li.classList.add('available-item-error');
        li.textContent = 'No subjects are available to select';
        availableNowError = {
          title: 'No subjects available',
          html: `<p><strong class="alert-inline-title alert-title-error">No subjects available</strong> <span class="alert-inline-text">No subjects are available to select right now. Prerequisites or subjects running in alternate semesters may be preventing enrolment.</span></p>`,
        };
      }
      selectedListEl.appendChild(li);
    } else {
      availableNowError = null;
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
        const activate = (event) => {
          const cell = subjects.find((c) => c.dataset.subject === item.id);
          if (!cell) return;
          if (!completedMode && areElectivesFull()) {
            const isElectiveItem = isElectiveId(item.id) || isElectiveCandidateId(item.id);
            if (isElectiveItem && !subjectState.get(item.id)?.toggled) {
              const anchorRect = li.getBoundingClientRect();
              openElectiveFullPopup('All 4 Elective slots are full, so this subject cannot be selected.', anchorRect, {
                x: event?.clientX ?? anchorRect.left + anchorRect.width / 2,
                y: event?.clientY ?? anchorRect.top + anchorRect.height,
              });
              electiveFullPopupAnchor = li;
              return;
            }
          }
          cell.click();
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
    refreshErrorAlerts();
  };

  const clearAlertState = () => {
    electiveError = null;
    prereqError = null;
    chainDelayError = null;
    aprAppError = null;
    acceptedOfferedError = null;
    overCompletionError = null;
    overLoadError = null;
    capstonePairError = null;
    intakeStartError = null;
    availableNowError = null;
    availableLoadError = null;
    censusWarning = null;
    censusError = null;
    weekTwoWarning = null;
    weekTwoError = null;
    infoNotes = null;
    countryHittingTroubles = null;
    deferredInfo = null;
    dateNoticeLines = [];
    creditTransferWarning = null;
    creditTransferWarningActive = false;
    warningPayloads = [];
    nextSemWarning = null;
    finalSemWarning = null;
    refreshErrorAlerts();
    setAlertMessages('info', []);
    setAlertMessages('codes', []);
    setAlertMessages('data', []);
    renderAlertButton('error');
    renderAlertButton('warning');
    renderAlertButton('info');
    renderAlertButton('codes');
    renderAlertButton('data');
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
  if (timetableTable) {
    timetableTable.addEventListener('click', (event) => {
      const row = event.target.closest('tr');
      if (!row || !row.dataset.subject) return;
      const id = row.dataset.subject;
      const isElectiveRow =
        row.classList.contains('elective') ||
        isElectiveLabel(row.dataset.stream) ||
        isElectiveId(id) ||
        isElectiveCandidateId(id);
      console.info('[Elective click]', {
        context: 'available-modal',
        id,
        isElectiveRow,
        electivesFull: areElectivesFull(),
        toggled: !!subjectState.get(id)?.toggled,
        currentTableMode,
      });
      if (
        currentTableMode === 'available' &&
        isElectiveRow &&
        areElectivesFull() &&
        !subjectState.get(id)?.toggled
      ) {
        const anchorRect = row.getBoundingClientRect();
        openElectiveFullPopup('All 4 Elective slots are full, so this subject cannot be selected.', anchorRect, {
          x: event.clientX,
          y: event.clientY,
        });
        electiveFullPopupAnchor = row;
        event.stopPropagation();
        return;
      }
      const targetCell = subjects.find((cell) => cell.dataset.subject === id);
      if (!targetCell) return;
      handleToggle(targetCell);
      refreshTimetableModalState();
    });
  }
  if (closeTimetable) closeTimetable.addEventListener('click', hideTimetableModal);
  document.addEventListener('click', (event) => {
    if (!electiveFullPopup || !electiveFullPopup.classList.contains('show')) return;
    if (Date.now() - electiveFullPopupOpenedAt < 150) return;
    if (electiveFullPopup.contains(event.target)) return;
    const rect = getElectiveAnchorRect();
    if (rect) {
      const x = event.clientX;
      const y = event.clientY;
      const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      if (inside) return;
    }
    closeElectiveFullPopup();
  });
  document.addEventListener('mousemove', (event) => {
    if (!electiveFullPopup || !electiveFullPopup.classList.contains('show')) return;
    const rect = getElectiveAnchorRect();
    if (!rect) return;
    if (electiveFullPopup.contains(event.target)) return;
    const x = event.clientX;
    const y = event.clientY;
    const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    console.info('[Elective popup move]', {
      x,
      y,
      inside,
      rect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      },
      target: event.target?.tagName,
    });
    if (inside) return;
    closeElectiveFullPopup();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeElectiveFullPopup();
  });
  if (hideTimetable) hideTimetable.addEventListener('click', hideTimetableModal);
  if (copyTimetable) {
    copyTimetable.addEventListener('click', () => {
      flashCopyButton(copyTimetable);
      copyTimetableToClipboard();
    });
  }
  if (downloadTimetableImageButton) {
    downloadTimetableImageButton.addEventListener('click', async () => {
      await copyTimetableExportImageToClipboard();
    });
  }
  if (emailPrimaryButton) {
    emailPrimaryButton.addEventListener('click', () => {
      sendTimetableEmail('primary');
    });
  }
  if (emailInstituteButton) {
    emailInstituteButton.addEventListener('click', () => {
      sendTimetableEmail('institute');
    });
  }
  if (emailBothButton) {
    emailBothButton.addEventListener('click', () => {
      sendTimetableEmail('both');
    });
  }
  if (copyStudentDeclarationButton) {
    copyStudentDeclarationButton.addEventListener('click', async () => {
      flashCopyButton(copyStudentDeclarationButton);
      if (!emailScriptsDocxBuffer && !emailScriptsHtmlSource) {
        window.alert('Load Email Scripts (html/htm/docx) first, then click StudDec again.');
        return;
      }
      const ok = await copyStudentDeclaration();
      if (!ok) {
        window.alert('Could not copy StudDec content. Try a hard refresh (Ctrl+F5), then try again.');
      }
    });
  }
  if (emailScriptsRowCopyButton) {
    emailScriptsRowCopyButton.addEventListener('click', async () => {
      flashCopyButton(emailScriptsRowCopyButton);
      if (!emailScriptsDocxBuffer && !emailScriptsHtmlSource) {
        window.alert('Load Email Scripts (html/htm/docx) first, then click copy again.');
        return;
      }
      const ok = await copyStudentDeclaration();
      if (!ok) {
        window.alert('Could not copy StudDec content. Try a hard refresh (Ctrl+F5), then try again.');
      }
    });
  }
  if (emailScriptsRowOpenButton) {
    emailScriptsRowOpenButton.addEventListener('click', async () => {
      flashCopyButton(emailScriptsRowOpenButton);
      if (!emailScriptsDocxBuffer && !emailScriptsHtmlSource) {
        window.alert('Load Email Scripts (html/htm/docx) first, then click email again.');
        return;
      }
      await sendDeclarationEmail('both');
    });
  }
  if (emailScriptsSupportsCopyButton) {
    emailScriptsSupportsCopyButton.addEventListener('click', async () => {
      flashCopyButton(emailScriptsSupportsCopyButton);
      if (!emailScriptsDocxBuffer && !emailScriptsHtmlSource) {
        window.alert('Load Email Scripts (html/htm/docx) first, then click copy again.');
        return;
      }
      const ok = await copySupportsAtRiskSection();
      if (!ok) {
        window.alert('Could not copy Supports (at risk) text. Check the heading in Email Scripts and try again.');
      }
    });
  }
  if (emailScriptsSupportsEmailButton) {
    emailScriptsSupportsEmailButton.addEventListener('click', async () => {
      flashCopyButton(emailScriptsSupportsEmailButton);
      if (!emailScriptsDocxBuffer && !emailScriptsHtmlSource) {
        window.alert('Load Email Scripts (html/htm/docx) first, then click email again.');
        return;
      }
      await sendDeclarationEmail('both', {
        copyFn: copySupportsAtRiskSection,
        copyFailMessage: 'Could not copy Supports (at risk) text. Check the heading in Email Scripts and try again.',
      });
    });
  }
  const emailScriptsSectionCopyButtons = Array.from(
    document.querySelectorAll('.email-scripts-section-copy[data-section-key]')
  );
  const emailScriptsSectionEmailButtons = Array.from(
    document.querySelectorAll('.email-scripts-section-email[data-section-key]')
  );
  if (emailScriptsSectionCopyButtons.length) {
    emailScriptsSectionCopyButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        flashCopyButton(button);
        if (!emailScriptsDocxBuffer && !emailScriptsHtmlSource) {
          window.alert('Load Email Scripts (html/htm/docx) first, then click copy again.');
          return;
        }
        const sectionKey = String(button.dataset.sectionKey || '');
        const sectionLabel = String(button.dataset.sectionLabel || sectionKey || 'section');
        const ok = await copyEmailScriptsSectionByKey(sectionKey);
        if (!ok) {
          window.alert(`Could not copy "${sectionLabel}" text. Check the matching heading in Email Scripts and try again.`);
        }
      });
    });
  }
  if (emailScriptsSectionEmailButtons.length) {
    emailScriptsSectionEmailButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        flashCopyButton(button);
        if (!emailScriptsDocxBuffer && !emailScriptsHtmlSource) {
          window.alert('Load Email Scripts (html/htm/docx) first, then click email again.');
          return;
        }
        const sectionKey = String(button.dataset.sectionKey || '');
        const sectionLabel = String(button.dataset.sectionLabel || sectionKey || 'section');
        await sendDeclarationEmail('both', {
          copyFn: () => copyEmailScriptsSectionByKey(sectionKey),
          copyFailMessage: `Could not copy "${sectionLabel}" text. Check the matching heading in Email Scripts and try again.`,
        });
      });
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
      const tables = [historyTable];
      const headings = [historyTitleEl?.textContent || 'History'];
      if (currentEnrolmentsSection && !currentEnrolmentsSection.hidden && currentEnrolmentsTable) {
        tables.unshift(currentEnrolmentsTable);
        headings.unshift('Current Enrolments in your student record:');
      }
      copySimpleTablesToClipboard(tables, headings);
    });
  }
  if (historyColoursButton) {
    historyColoursButton.addEventListener('click', () => {
      historyColoursOn = !historyColoursOn;
      updateHistoryColoursButton();
    });
    updateHistoryColoursButton();
  }
  if (historyOnlyPassedButton) {
    historyOnlyPassedButton.addEventListener('click', () => {
      historyOnlyPassed = !historyOnlyPassed;
      renderHistoryModal();
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
      const hasElectivesTable =
        remainingElectivesSection && !remainingElectivesSection.hidden && remainingElectivesTable;
      const coreMajorCount = getRemainingRows().length;
      const majorName = getMajorDisplayName();
      const remainingElectives = getRemainingElectiveCount();

      const titleText = remainingTitleEl?.textContent?.trim() || '';
      const summaryText = `You have ${coreMajorCount} Core and ${majorName} subjects remaining`;
      const electiveHeadingText = 'Elective Options. Our course has 4 Electives';
      const electiveCountText = `You have ${remainingElectives} Elective${remainingElectives === 1 ? '' : 's'} to complete`;

      const corePart = buildSimpleTableCopyData(remainingTable, '');
      const electivePart = hasElectivesTable ? buildSimpleTableCopyData(remainingElectivesTable, '') : null;
      if (!corePart.text && !titleText && !summaryText) return;

      const textLines = [];
      if (titleText) textLines.push(titleText);
      if (summaryText) textLines.push('', summaryText);
      if (corePart.text) textLines.push(corePart.text);
      if (hasElectivesTable) textLines.push('', electiveHeadingText, '', electiveCountText);
      if (electivePart?.text) textLines.push(electivePart.text);
      const text = textLines.join('\n').trim();

      const fontBase = 'font-family: Calibri, sans-serif;';
      const blue = 'style="color:#1f6fd6;"';
      const lineHtml = (line, size = 11, marginBottomPt = 0) =>
        `<p style="${fontBase}font-weight:700;font-size:${size}pt;margin:0 0 ${marginBottomPt}pt 0;">${line}</p>`;
      const summaryHtml = `<p style="${fontBase}font-weight:700;font-size:11pt;margin:0;">You have <span ${blue}>${coreMajorCount}</span> Core and ${escapeHtml(
        majorName
      )} subjects remaining</p>`;
      const electiveCountHtml = `<p style="${fontBase}font-weight:700;font-size:11pt;margin:0;">You have <span ${blue}>${remainingElectives}</span> Elective${remainingElectives === 1 ? '' : 's'} to complete</p>`;
      const topHtml = [
        titleText ? lineHtml(escapeHtml(titleText), 12, 12) : '',
        summaryText ? summaryHtml : '',
      ]
        .filter(Boolean)
        .join('');
      const spacerPara = `<p style="${fontBase}font-size:11pt;margin:0 0 12pt 0;">&nbsp;</p>`;
      const midHtml = hasElectivesTable
        ? [
          spacerPara,
          lineHtml(escapeHtml(electiveHeadingText), 11, 0),
          electiveCountHtml,
        ].join('')
        : '';

      const htmlParts = [
        topHtml,
        corePart.html ? corePart.html : '',
        midHtml,
        electivePart?.html || '',
      ].filter(Boolean);
      const html = htmlParts.join('');

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
  if (toggleCourseMapPrereqButton) {
    toggleCourseMapPrereqButton.addEventListener('click', () => {
      courseMapPrereqColoursOn = !courseMapPrereqColoursOn;
      updateCourseMapPrereqToggle();
    });
    updateCourseMapPrereqToggle();
  }
  if (toggleCourseMapPrereqTextButton) {
    toggleCourseMapPrereqTextButton.addEventListener('click', () => {
      courseMapPrereqTextOn = !courseMapPrereqTextOn;
      updateCourseMapPrereqTextToggle();
    });
    updateCourseMapPrereqTextToggle();
  }
  if (toggleCourseMapIndicatorsButton) {
    toggleCourseMapIndicatorsButton.addEventListener('click', () => {
      courseMapIndicatorsOn = !courseMapIndicatorsOn;
      updateCourseMapIndicatorsToggle();
    });
    updateCourseMapIndicatorsToggle();
  }
  if (courseMapFontDecreaseButton) {
    courseMapFontDecreaseButton.addEventListener('click', () => {
      courseMapFontScaleEm = Math.max(0.5, Math.round((courseMapFontScaleEm - 0.05) * 100) / 100);
      updateCourseMapFontScale();
    });
  }
  if (courseMapFontIncreaseButton) {
    courseMapFontIncreaseButton.addEventListener('click', () => {
      courseMapFontScaleEm = Math.min(3, Math.round((courseMapFontScaleEm + 0.05) * 100) / 100);
      updateCourseMapFontScale();
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
  if (codesButton) codesButton.addEventListener('click', () => showAlertModal('codes'));
  if (dataErrorButton) dataErrorButton.addEventListener('click', () => showAlertModal('data'));
  if (closeAlert) closeAlert.addEventListener('click', hideAlertModal);
  if (alertModal) {
    alertModal.addEventListener('click', (e) => {
      if (e.target === alertModal) hideAlertModal();
    });
  }

  const enableOutsideClickClose = (modalEl, hideFn) => {
    if (!modalEl || !hideFn) return;
    const modalBox = modalEl.querySelector('.modal');
    if (modalBox) {
      modalBox.addEventListener('click', (event) => {
        event.stopPropagation();
      });
    }
    modalEl.addEventListener('click', (event) => {
      if (!modalEl.classList.contains('show')) return;
      if (!modalBox) return;
      if (Date.now() < suppressOutsideClickUntil) return;
      const rect = modalBox.getBoundingClientRect();
      const x = event.clientX;
      const y = event.clientY;
      const outside = x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
      if (outside) hideFn();
    });
  };

  enableOutsideClickClose(instructionsModal, hideInstructionsModal);
  enableOutsideClickClose(codeModal, hideCodeModal);
  enableOutsideClickClose(emailScriptsAccessModal, hideEmailScriptsAccessModal);
  enableOutsideClickClose(loadModal, hideLoadModal);
  enableOutsideClickClose(timetableModal, hideTimetableModal);
  enableOutsideClickClose(courseTimetableModal, hideCourseTimetableModal);
  enableOutsideClickClose(historyModal, hideHistoryModal);
  enableOutsideClickClose(remainingModal, hideRemainingModal);
  enableOutsideClickClose(courseMapModal, hideCourseMapModal);
  enableOutsideClickClose(nextSemesterModal, hideNextSemesterModal);
  enableOutsideClickClose(alertModal, hideAlertModal);

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
    updateWarnings();
    const record = staffWorkbookState.getStudentRecord();
    if (record) {
      renderStudentPreviewHtml(formatStudentSummary(record));
      const feeDetails = getFeeStatusDetails(record);
      const infoMessages = buildInfoMessages(record, feeDetails);
      const { codes, info } = splitInfoMessages(infoMessages);
      setAlertMessages('info', info);
      setAlertMessages('codes', codes);
      renderAlertButton('info');
      renderAlertButton('codes');
    }
    resetAvailableListSnapshot();
    updateSelectedList();
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
          pill.textContent = "You can't select these subjects.\nAll 4 Elective slots are full";
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
  setAlertMessages('codes', []);
  renderAlertButton('error');
  renderAlertButton('warning');
  renderAlertButton('info');
  renderAlertButton('codes');
  setAlertMessages('data', []);
  renderAlertButton('data');
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

  setStudentLookupVisible(false);

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
      hideEmailScriptsAccessModal();
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
      navigator.serviceWorker.register("sw.js").catch(() => { });
    });
  }
})();


