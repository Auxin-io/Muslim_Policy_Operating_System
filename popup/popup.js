const mainEl = document.getElementById('mainContent');
const headerSubEl = document.getElementById('headerSub');
const toggleEl = document.getElementById('autoScanToggle');

let activeTab = null;
let canHighlight = false; // true only when the currently rendered result matches the live active tab
let currentBills = [];
let currentSelectedIndex = 0;

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sevClass(sev) {
  const s = (sev || 'unclear').toLowerCase();
  return ['high', 'medium', 'low'].includes(s) ? s : 'unclear';
}

// ---------------------------------------------------------------------------
// Inline US map (replaces the old separate dashboard.html tab)
// ---------------------------------------------------------------------------
let mapBuilt = false;

function buildMapInto(svgEl) {
  svgEl.innerHTML = '';
  svgEl.setAttribute('viewBox', USA_MAP_VIEWBOX);
  const ns = 'http://www.w3.org/2000/svg';
  Object.keys(USA_STATE_PATHS).forEach(code => {
    const { path, name } = USA_STATE_PATHS[code];
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', path);
    p.setAttribute('class', 'state-path');
    p.setAttribute('data-state', code);
    const titleEl = document.createElementNS(ns, 'title');
    titleEl.textContent = name;
    p.appendChild(titleEl);
    svgEl.appendChild(p);
  });
}

function colorMapForBill(svgEl, bill) {
  const paths = svgEl.querySelectorAll('.state-path');
  paths.forEach(p => p.classList.remove('direct', 'precedent'));
  if (!bill) return;
  const scope = bill.geographic_scope || {};

  if (scope.type === 'federal_nationwide') {
    paths.forEach(p => p.classList.add('direct'));
    return;
  }

  const direct = new Set((scope.states_directly_affected || []).map(s => (s || '').toUpperCase()));
  const precedent = new Set((scope.states_with_precedent_mentioned_in_article || []).map(s => (s || '').toUpperCase()));
  paths.forEach(p => {
    const code = p.getAttribute('data-state');
    if (direct.has(code)) p.classList.add('direct');
    else if (precedent.has(code)) p.classList.add('precedent');
  });
}

function renderMapSection(bill) {
  return `
    <div class="map-wrap">
      <svg id="usaSvg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"></svg>
      <div class="map-legend">
        <span class="map-chip direct"></span>Direct
        <span class="map-chip precedent"></span>Precedent
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Render states
// ---------------------------------------------------------------------------
function renderLoading(msg) {
  mainEl.innerHTML = `<div class="state-box"><div class="spinner"></div>${escapeHtml(msg || 'Loading…')}</div>`;
}

function renderMessage(msg, showScanButton) {
  mainEl.innerHTML = `
    <div class="state-box">${escapeHtml(msg)}</div>
    ${showScanButton ? '<div class="btn-row"><button id="scanBtn" class="btn-primary">Scan This Page</button></div>' : ''}
  `;
  const btn = document.getElementById('scanBtn');
  if (btn) btn.addEventListener('click', () => forceScan(false));
}

function renderNoSignal() {
  mainEl.innerHTML = `
    <div class="state-box">No policy or legislative language detected on this page (checked locally — nothing was sent to Gemini).</div>
    <div class="btn-row">
      <button id="analyzeAnywayBtn" class="btn-secondary">Analyze Anyway</button>
    </div>
  `;
  document.getElementById('analyzeAnywayBtn').addEventListener('click', () => forceScan(true));
}

function renderError(msg) {
  mainEl.innerHTML = `
    <div class="state-box" style="color:#ff8a8a;">${escapeHtml(msg)}</div>
    <div class="btn-row">
      <button id="retryBtn" class="btn-primary">Retry</button>
    </div>
  `;
  document.getElementById('retryBtn').addEventListener('click', () => forceScan(false));
}

function renderResult(data, opts) {
  opts = opts || {};
  canHighlight = !!opts.canHighlight;
  const bills = (data && data.bills) || [];
  currentBills = bills;

  if (!bills.length || data.no_bill_detected) {
    mainEl.innerHTML = `
      <div class="state-box">${escapeHtml(data.overall_note || 'No specific law or bill was identified.')}</div>
      <div class="btn-row">
        <button id="rescanBtn" class="btn-secondary">${opts.canRescan === false ? 'Analyze Again' : 'Re-scan'}</button>
      </div>
    `;
    document.getElementById('rescanBtn').addEventListener('click', () => {
      if (opts.canRescan === false) return; // manual results just stay as-is; nothing to re-trigger here
      forceScan(true);
    });
    return;
  }

  currentSelectedIndex = Math.min(currentSelectedIndex, bills.length - 1);
  if (currentSelectedIndex < 0) currentSelectedIndex = 0;
  renderBillAtIndex(currentSelectedIndex, opts);
}

function renderBillAtIndex(index, opts) {
  opts = opts || {};
  currentSelectedIndex = index;
  const bills = currentBills;
  const bill = bills[index];
  const impact = bill.muslim_community_impact || {};
  const actions = bill.possible_actions || [];
  const deadlines = bill.key_deadlines || [];

  const pillsHtml = bills.length > 1
    ? `<div class="bill-pills">${bills.map((b, i) => `
        <div class="bill-pill ${i === index ? 'active' : ''}" data-idx="${i}">${escapeHtml(b.bill_id || ('Bill ' + (i + 1)))}</div>
      `).join('')}</div>`
    : '';

  mainEl.innerHTML = `
    ${renderMapSection(bill)}
    ${pillsHtml}
    <span class="kicker ${sevClass(impact.severity)}">${escapeHtml((impact.severity || 'unclear').toUpperCase())} SEVERITY</span>
    <div class="bill-title">${escapeHtml(bill.bill_id || 'Unidentified bill')}</div>
    <div class="bill-sub">${escapeHtml(bill.title || 'No title extracted')} — ${escapeHtml((bill.jurisdiction || 'unclear'))}${bill.state ? ' · ' + escapeHtml(bill.state) : ''}</div>

    <div class="section">
      <div class="section-label">Muslim Impact</div>
      <div class="section-body">${escapeHtml(impact.explanation || 'Not assessed.')}</div>
    </div>

    <div class="section">
      <div class="section-label">Muslim Exposure</div>
      <div class="section-body">${escapeHtml(impact.exposure || 'Not stated.')}</div>
    </div>

    <div class="section">
      <div class="section-label">Possible Actions</div>
      ${actions.length
        ? `<ul class="action-list">${actions.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>`
        : '<div class="empty-note">No specific actions identified.</div>'}
    </div>

    <div class="section">
      <div class="section-label">Key Deadlines</div>
      ${deadlines.length
        ? `<ul class="deadline-list">${deadlines.map(d => `<li><span class="deadline-date">${escapeHtml(d.date || 'Date not specified')}</span> — ${escapeHtml(d.description || '')}</li>`).join('')}</ul>`
        : '<div class="empty-note">No deadlines stated in this source.</div>'}
    </div>

    <div class="section">
      <div class="section-label">Source Paragraph</div>
      ${bill.source_paragraph
        ? `<blockquote class="source-quote">${escapeHtml(bill.source_paragraph)}</blockquote>
           ${canHighlight
             ? `<div class="btn-row" style="margin-top:6px;"><button id="showOnPageBtn" class="btn-secondary">Show on Page</button></div>
                <div id="showOnPageStatus" class="empty-note" style="margin-top:4px;"></div>`
             : '<div class="empty-note" style="margin-top:4px;">Open this page directly and re-scan to use "Show on Page."</div>'}`
        : '<div class="empty-note">No specific passage identified — the bill may only be referenced indirectly or in a headline.</div>'}
    </div>

    <div class="btn-row">
      <button id="rescanBtn2" class="btn-secondary">${opts.canRescan === false ? 'Analyze Again' : 'Re-scan'}</button>
    </div>
  `;

  const svgEl = document.getElementById('usaSvg');
  buildMapInto(svgEl);
  colorMapForBill(svgEl, bill);

  mainEl.querySelectorAll('.bill-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      renderBillAtIndex(parseInt(pill.dataset.idx, 10), opts);
    });
  });

  const rescanBtn = document.getElementById('rescanBtn2');
  if (rescanBtn) {
    rescanBtn.addEventListener('click', () => {
      if (opts.canRescan === false) return;
      forceScan(true);
    });
  }

  const showBtn = document.getElementById('showOnPageBtn');
  if (showBtn) {
    showBtn.addEventListener('click', async () => {
      const statusEl = document.getElementById('showOnPageStatus');
      statusEl.textContent = 'Scrolling to it…';
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'HIGHLIGHT_ON_PAGE',
          tabId: activeTab.id,
          text: bill.source_paragraph
        });
        statusEl.textContent = (response && response.ok && response.found)
          ? 'Found and highlighted on the page.'
          : "Couldn't find an exact match on the page (the page may have changed since it was scanned).";
      } catch (e) {
        statusEl.textContent = 'Could not highlight on this page.';
      }
    });
  }
}

async function forceScan(bypassFilter) {
  if (!activeTab) return;
  renderLoading('Analyzing this page…');
  try {
    const response = await chrome.runtime.sendMessage({ type: 'FORCE_SCAN_TAB', tabId: activeTab.id, bypassFilter });
    if (!response || !response.ok) {
      renderError((response && response.error) || 'Analysis failed.');
      return;
    }
    handleStatus(response.status, response.data, response.error);
  } catch (e) {
    renderError(e.message);
  }
}

function handleStatus(status, data, error) {
  switch (status) {
    case 'excluded':
      renderMessage("This page isn't scanned — either it's a browser-internal page, or it's a category (email, banking, health portals, private messaging) this extension never auto-reads for your privacy.", false);
      break;
    case 'not_scanned':
      renderMessage("This page hasn't been scanned yet.", true);
      break;
    case 'no_signal':
      renderNoSignal();
      break;
    case 'loading':
      renderLoading('Analyzing this page…');
      setTimeout(refreshCurrentTab, 1500);
      break;
    case 'result':
      renderResult(data, { canHighlight: true, canRescan: true });
      break;
    case 'error':
      renderError(error || 'Something went wrong analyzing this page.');
      break;
    default:
      renderMessage("This page hasn't been scanned yet.", true);
  }
}

async function refreshCurrentTab() {
  if (!activeTab) return;
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_TAB_ANALYSIS', tabId: activeTab.id });
    if (!response || !response.ok) {
      renderMessage('Could not read this tab.', false);
      return;
    }
    headerSubEl.textContent = response.title
      ? `Currently viewing: ${response.title.slice(0, 60)}`
      : 'Auto-scanning pages you visit for policy impact.';
    handleStatus(response.status, response.data, response.error);
  } catch (e) {
    renderMessage('Could not read this tab.', false);
  }
}

async function init() {
  const settings = await chrome.storage.local.get(['apiKey_gemini', 'autoScanEnabled']);
  toggleEl.checked = settings.autoScanEnabled !== false;

  if (!settings.apiKey_gemini) {
    renderMessage('No API key set. Open Settings to add your free Gemini API key — auto-scanning needs it to work.', false);
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;

  if (settings.apiKey_gemini) {
    await refreshCurrentTab();
  }
}

toggleEl.addEventListener('change', async () => {
  await chrome.storage.local.set({ autoScanEnabled: toggleEl.checked });
});

// ---- manual paste/URL fallback (results render inline, no separate tab) ----
const manualStatusEl = document.getElementById('manualStatus');
const manualTextarea = document.getElementById('articleText');

function setManualStatus(msg, isError) {
  manualStatusEl.textContent = msg;
  manualStatusEl.className = isError ? 'error' : '';
}

document.getElementById('analyzePasted').addEventListener('click', async () => {
  const text = manualTextarea.value;
  if (!text || text.trim().length < 40) {
    setManualStatus('Paste more text (at least a few sentences) or a URL before analyzing.', true);
    return;
  }
  const isUrl = /^https?:\/\/\S+$/i.test(text.trim());
  setManualStatus(isUrl ? 'Opening the link and reading it… can take up to 30 seconds.' : 'Analyzing with Gemini…');

  try {
    const response = await chrome.runtime.sendMessage({ type: 'ANALYZE', text });
    if (!response || !response.ok) {
      throw new Error((response && response.error) || 'Unknown error.');
    }
    setManualStatus('Done.');
    document.getElementById('manualDetails').open = false;
    currentSelectedIndex = 0;
    renderResult(response.data, { canHighlight: false, canRescan: false });
    mainEl.scrollIntoView({ block: 'start' });
  } catch (err) {
    setManualStatus('Analysis failed: ' + err.message, true);
  }
});

init();
