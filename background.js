// ============================================================================
// Muslim Policy OS — background service worker
// Handles: automatic scanning of every page you visit, a local keyword
// pre-filter (runs entirely in-browser, nothing sent externally) to avoid
// wasting Gemini calls on non-policy pages, per-tab result caching, a
// toolbar badge alert, optional system notifications, and the manual
// paste/URL analysis flow used by the popup.
// ============================================================================

const SYSTEM_PROMPT = `You are the analysis engine behind "Muslim Policy OS," a civic-advocacy tool that helps Muslim community organizations and everyday users understand legislation covered in news articles, government pages, and policy documents.

All text fields below are displayed in small cards, so BE CONCISE everywhere: short sentences, no filler, no throat-clearing, no restating the question. Prefer one tight sentence over two if it loses nothing.

Given raw page text, do the following:
1. Identify any specific law(s) or bill(s) being discussed. If none is identifiable, say so.
2. For each bill/law found, determine its jurisdiction (federal or a specific US state) and, if stated, its status.
3. Assess "Muslim Impact": whether and how it could plausibly affect Muslim communities in the US, using neutral, evidence-based reasoning grounded ONLY in the page text plus well-established general knowledge of policy categories (e.g. religious accommodation, surveillance/CVE programs, immigration and travel restrictions, civil rights/anti-discrimination protections, hate crime law, zoning for houses of worship, halal/dietary regulation, school curriculum, financial/banking access). Do not speculate wildly or state uncertain inferences as fact — flag uncertainty explicitly. Keep it to one concise, information-dense sentence.
4. Assess "Muslim Exposure": specifically WHO may be affected — which population, role, or institution (e.g. "Muslim residents of Massachusetts seeking state appointments," "mosque congregations in Texas"). One short phrase or sentence, not a paragraph.
5. Determine geographic scope: which state(s) are directly affected, and, only if the page itself mentions similar/precedent bills in other states, list those as "precedent" states. Do not invent precedent bills that are not mentioned in the source text.
6. Identify "Possible Actions": 2-4 short civic actions (a few words each, e.g. "Contact your state senator," "Submit a public comment before the deadline"), never fabricating a specific person's name, phone number, or email unless it is verbatim in the article.
7. Identify "Key Deadlines": any hearing dates, public comment deadlines, vote dates, or implementation dates EXPLICITLY stated in the page text, with a short (under ~10 word) description each. If no dates are stated, return an empty array — never invent a plausible-sounding date.
8. Identify the "Source Paragraph": copy, near-verbatim, the single paragraph (or two short adjacent ones if the discussion spans both) from the page text that most directly discusses this specific bill/law. Copy it exactly as it appears, do not paraphrase, do not merge non-adjacent paragraphs. Keep it under ~350 characters — take the most on-point contiguous excerpt rather than a whole long paragraph. Return null if no specific passage can be identified.
9. CRITICAL — never fabricate: do not invent legislator names, staff names, phone numbers, vote counts, dollar figures, dates, or source paragraph text that is not explicitly present in the page text. If the page doesn't mention them, leave those fields null, use "not stated in source," or return an empty array as appropriate.

Respond with ONLY valid JSON (no markdown fences, no prose before or after) matching this exact shape:

{
  "bills": [
    {
      "bill_id": "string or null (e.g. 'MA S.2134')",
      "title": "string or null — a few words, not the full official title",
      "jurisdiction": "federal" | "state" | "local" | "unclear",
      "state": "two-letter USPS state code or null",
      "status": "very short status string, or null",
      "last_action": "very short string, or null",
      "summary": "ONE concise, information-dense sentence on what the bill/law actually does — not two or three",
      "the_move": "ONE short sentence on the legislative context/maneuver if inferable, else null",
      "muslim_community_impact": {
        "relevance": "direct" | "indirect" | "unclear" | "none",
        "categories": ["array of category strings from: religious_accommodation, surveillance_cve, immigration_travel, civil_rights_antidiscrimination, hate_crime_protection, zoning_houses_of_worship, halal_dietary, education_curriculum, financial_banking, other"],
        "explanation": "ONE concise sentence — this is the 'Muslim Impact' field, grounded in the page text, no filler",
        "severity": "high" | "medium" | "low" | "unclear",
        "exposure": "ONE short phrase or sentence naming WHO specifically may be affected — this is the 'Muslim Exposure' field"
      },
      "geographic_scope": {
        "type": "single_state" | "multi_state" | "federal_nationwide" | "unclear",
        "states_directly_affected": ["array of two-letter state codes"],
        "states_with_precedent_mentioned_in_article": ["array of two-letter state codes, ONLY if explicitly mentioned in the page"],
        "notes": "very short string or null"
      },
      "possible_actions": ["array of 2-4 short actionable strings, a few words each"],
      "key_deadlines": [
        {
          "date": "string date exactly as stated in the page, or null",
          "type": "hearing" | "public_comment" | "vote" | "implementation" | "other",
          "description": "under ~10 words, grounded in the page"
        }
      ],
      "source_paragraph": "near-verbatim excerpt from the page text most directly discussing this bill, under ~350 characters, or null if no specific passage can be identified",
      "contacts_found_in_article": ["array of any names/titles/phone numbers/emails ONLY if verbatim present in the page text, else empty array"]
    }
  ],
  "no_bill_detected": boolean,
  "overall_note": "ONE short plain-language sentence for a general reader"
}`;

const AUTO_CACHE_KEY = 'autoScanCache';
const AUTO_CACHE_MAX_ENTRIES = 60;
const LEGISLATIVE_SIGNAL_RE = /\b(bill|act\b|legislation|senate|house of representatives|congress(?:ional)?|statute|ordinance|regulation|committee hearing|lawmaker|governor(?:'s)? (?:sign|veto)|amendment|public comment|policy|law\b|city council|county commission)\b/i;

// ---------------------------------------------------------------------------
// Utility: JSON extraction (Gemini sometimes wraps or trails stray text)
// ---------------------------------------------------------------------------
function extractJson(rawText) {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

const DEPRECATED_MODELS = new Set([
  'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'
]);

async function callGemini(text) {
  const { apiKey_gemini, model_gemini } = await chrome.storage.local.get(['apiKey_gemini', 'model_gemini']);
  if (!apiKey_gemini) throw new Error('No Google AI Studio API key set. Open Settings first.');
  let model = model_gemini || 'gemini-3.6-flash';
  if (DEPRECATED_MODELS.has(model)) {
    model = 'gemini-3.6-flash';
    chrome.storage.local.set({ model_gemini: model }).catch(() => {});
  }
  const trimmed = text.slice(0, 15000);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey_gemini)}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: `Analyze this page text:\n\n${trimmed}` }] }],
      generationConfig: { maxOutputTokens: 3000, responseMimeType: 'application/json' }
    })
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`Gemini API error ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const data = await resp.json();
  const candidate = data.candidates && data.candidates[0];
  const textOut = candidate && candidate.content && candidate.content.parts
    ? candidate.content.parts.map(p => p.text || '').join('')
    : null;

  if (!textOut) {
    const blockReason = data.promptFeedback && data.promptFeedback.blockReason;
    throw new Error(blockReason
      ? `Gemini blocked this request (${blockReason}).`
      : 'No text response from Gemini. It may have hit a quota limit.');
  }

  return extractJson(textOut);
}

// ---------------------------------------------------------------------------
// Manual URL fetching (paste-a-link flow, used by the popup's text box)
// ---------------------------------------------------------------------------
function isLikelyUrl(input) {
  const trimmed = input.trim();
  return /^https?:\/\/\S+$/i.test(trimmed) && trimmed.length < 2000;
}

function waitForTabLoad(tabId, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, timeoutMs);

    function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        setTimeout(resolve, 900);
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

function extractPageText() {
  const article = document.querySelector('article');
  const main = document.querySelector('main');
  const source = article || main || document.body;
  return (source.innerText || '').trim();
}

async function fetchArticleTextFromUrl(url) {
  let tab;
  try {
    tab = await chrome.tabs.create({ url, active: false });
  } catch (e) {
    throw new Error('Could not open that URL: ' + e.message);
  }

  try {
    await waitForTabLoad(tab.id, 30000);

    let currentTab;
    try {
      currentTab = await chrome.tabs.get(tab.id);
    } catch (e) {
      throw new Error('The page closed unexpectedly before it could be read.');
    }
    if (currentTab.url && currentTab.url.startsWith('chrome-error://')) {
      throw new Error('That page failed to load in the browser (connection error or the site blocked it). Try opening the link yourself, or paste the article text directly instead.');
    }

    let results;
    try {
      results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractPageText });
    } catch (e) {
      if (/error page/i.test(e.message || '')) {
        throw new Error('That page failed to load properly (it showed a browser error page instead of the article). Try opening the link yourself, or paste the article text directly instead.');
      }
      throw e;
    }

    const extracted = results && results[0] && results[0].result;
    if (!extracted || extracted.length < 100) {
      throw new Error('Could not extract readable article text from that page. Try pasting the article text directly instead.');
    }
    return extracted.slice(0, 20000);
  } finally {
    if (tab && tab.id) {
      chrome.tabs.remove(tab.id).catch(() => {});
    }
  }
}

async function analyzeInput(input) {
  let articleText = input;
  if (isLikelyUrl(input)) {
    articleText = await fetchArticleTextFromUrl(input.trim());
  }
  return callGemini(articleText);
}

// ---------------------------------------------------------------------------
// Automatic per-tab scanning
// ---------------------------------------------------------------------------
function isScannablePageUrl(url) {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url)) return false; // skip chrome://, about:, file://, extension pages, etc.
  if (isSensitiveDomain(url)) return false;
  return true;
}

// Hard denylist for categories of site that should never be auto-scanned,
// regardless of what the local keyword filter thinks the text looks like.
// A private email or bank statement that happens to mention "the new zoning
// ordinance" should still never be sent to Gemini — this check runs before
// any page content is even read.
const SENSITIVE_DOMAIN_PATTERNS = [
  // webmail / personal messaging
  /(^|\.)mail\.google\.com$/i, /(^|\.)outlook\.(live|office)\.com$/i, /(^|\.)mail\.yahoo\.com$/i,
  /(^|\.)protonmail\.com$/i, /(^|\.)proton\.me$/i, /(^|\.)icloud\.com$/i,
  // banking / finance
  /bank/i, /chase\.com$/i, /wellsfargo\.com$/i, /bankofamerica\.com$/i, /citibank\.com$/i,
  /paypal\.com$/i, /venmo\.com$/i, /(^|\.)mint\.com$/i, /coinbase\.com$/i,
  // healthcare / medical portals
  /mychart/i, /healthportal/i, /(^|\.)patientportal/i, /(^|\.)kaiserpermanente\.org$/i,
  // social media DMs / private messaging surfaces
  /(^|\.)messenger\.com$/i, /web\.whatsapp\.com$/i, /(^|\.)telegram\.org$/i
];

function isSensitiveDomain(url) {
  try {
    const host = new URL(url).hostname;
    return SENSITIVE_DOMAIN_PATTERNS.some(re => re.test(host));
  } catch (e) {
    return false;
  }
}

async function getAutoCache() {
  const { [AUTO_CACHE_KEY]: cache } = await chrome.storage.local.get(AUTO_CACHE_KEY);
  return cache || {};
}

async function setAutoCacheEntry(url, entry) {
  const cache = await getAutoCache();
  cache[url] = { ...entry, timestamp: Date.now() };
  // prune oldest entries if over the cap
  const keys = Object.keys(cache);
  if (keys.length > AUTO_CACHE_MAX_ENTRIES) {
    keys
      .sort((a, b) => (cache[a].timestamp || 0) - (cache[b].timestamp || 0))
      .slice(0, keys.length - AUTO_CACHE_MAX_ENTRIES)
      .forEach(k => delete cache[k]);
  }
  await chrome.storage.local.set({ [AUTO_CACHE_KEY]: cache });
}

function billHasNotableImpact(bill) {
  if (!bill) return false;
  const impact = bill.muslim_community_impact || {};
  return (impact.relevance === 'direct' || impact.relevance === 'indirect')
    && impact.relevance !== 'none';
}

async function updateBadgeForTab(tabId, status, data) {
  try {
    if (status === 'result' && data && !data.no_bill_detected && (data.bills || []).some(billHasNotableImpact)) {
      const highSeverity = (data.bills || []).some(b => (b.muslim_community_impact || {}).severity === 'high');
      await chrome.action.setBadgeText({ tabId, text: '!' });
      await chrome.action.setBadgeBackgroundColor({ tabId, color: highSeverity ? '#d7263d' : '#c9822a' });
    } else {
      await chrome.action.setBadgeText({ tabId, text: '' });
    }
  } catch (e) {
    // tab may have closed already; ignore
  }
}

async function maybeNotify(tabTitle, data) {
  try {
    const { notificationsEnabled } = await chrome.storage.local.get('notificationsEnabled');
    if (notificationsEnabled === false) return; // default is enabled unless explicitly turned off
    const notable = (data.bills || []).find(b => {
      const impact = b.muslim_community_impact || {};
      return impact.relevance === 'direct' && (impact.severity === 'high' || impact.severity === 'medium');
    });
    if (!notable) return;
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Muslim Policy OS — bill detected',
      message: `${notable.bill_id || 'A bill'} on "${(tabTitle || '').slice(0, 60)}" may directly affect Muslim communities.`,
      priority: 1
    });
  } catch (e) {
    // notifications permission/icon issues shouldn't break scanning
  }
}

async function autoScanTab(tabId, url, tabTitle, bypassFilter) {
  const { autoScanEnabled } = await chrome.storage.local.get('autoScanEnabled');
  if (autoScanEnabled === false && !bypassFilter) return; // default is enabled unless explicitly turned off

  const { apiKey_gemini } = await chrome.storage.local.get('apiKey_gemini');
  if (!apiKey_gemini) return; // nothing to do without a key; popup will explain this

  if (!isScannablePageUrl(url)) return;

  if (!bypassFilter) {
    const cache = await getAutoCache();
    const cached = cache[url];
    if (cached && (Date.now() - cached.timestamp) < 6 * 60 * 60 * 1000) {
      // already scanned this exact URL recently — just refresh the badge for this tab
      await updateBadgeForTab(tabId, cached.status, cached.data);
      return;
    }
  }

  let extracted;
  try {
    const results = await chrome.scripting.executeScript({ target: { tabId }, func: extractPageText });
    extracted = results && results[0] && results[0].result;
  } catch (e) {
    return; // page not scriptable (chrome web store, pdf viewer, etc.) — silently skip
  }

  if (!extracted || extracted.length < 150) {
    await setAutoCacheEntry(url, { status: 'no_signal' });
    await updateBadgeForTab(tabId, 'no_signal', null);
    return;
  }

  // Local pre-filter — runs entirely in-browser. Only page text that looks
  // like it discusses legislation gets sent to Gemini at all (unless the
  // user explicitly asked to bypass this via "Analyze Anyway").
  if (!bypassFilter && !LEGISLATIVE_SIGNAL_RE.test(extracted)) {
    await setAutoCacheEntry(url, { status: 'no_signal' });
    await updateBadgeForTab(tabId, 'no_signal', null);
    return;
  }

  await setAutoCacheEntry(url, { status: 'loading' });

  try {
    const data = await callGemini(extracted.slice(0, 15000));
    await setAutoCacheEntry(url, { status: 'result', data, sourceExcerpt: extracted.slice(0, 4000) });
    await updateBadgeForTab(tabId, 'result', data);
    if (!data.no_bill_detected) {
      await maybeNotify(tabTitle, data);
    }
  } catch (err) {
    await setAutoCacheEntry(url, { status: 'error', error: err.message });
    await updateBadgeForTab(tabId, 'error', null);
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active && isScannablePageUrl(tab.url)) {
    autoScanTab(tabId, tab.url, tab.title);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete' && isScannablePageUrl(tab.url)) {
      autoScanTab(tabId, tab.url, tab.title);
    }
  } catch (e) {
    // tab may have closed
  }
});

// ---------------------------------------------------------------------------
// Message handlers (popup <-> background)
// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYZE') {
    analyzeInput(message.text)
      .then(data => sendResponse({ ok: true, data }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === 'GET_TAB_ANALYSIS') {
    (async () => {
      try {
        const tab = await chrome.tabs.get(message.tabId);
        if (!isScannablePageUrl(tab.url)) {
          sendResponse({ ok: true, status: 'excluded' });
          return;
        }
        const cache = await getAutoCache();
        const entry = cache[tab.url];
        if (!entry) {
          sendResponse({ ok: true, status: 'not_scanned', url: tab.url, title: tab.title });
          return;
        }
        sendResponse({ ok: true, status: entry.status, data: entry.data, error: entry.error, url: tab.url, title: tab.title });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'FORCE_SCAN_TAB') {
    (async () => {
      try {
        const tab = await chrome.tabs.get(message.tabId);
        // clear cache entry so autoScanTab doesn't short-circuit on it
        const cache = await getAutoCache();
        delete cache[tab.url];
        await chrome.storage.local.set({ [AUTO_CACHE_KEY]: cache });
        await autoScanTab(tab.id, tab.url, tab.title, true);
        const freshCache = await getAutoCache();
        const entry = freshCache[tab.url];
        sendResponse({ ok: true, status: entry ? entry.status : 'no_signal', data: entry ? entry.data : null, error: entry ? entry.error : null });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'HIGHLIGHT_ON_PAGE') {
    (async () => {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: message.tabId },
          func: highlightTextOnPage,
          args: [message.text]
        });
        const found = results && results[0] && results[0].result;
        sendResponse({ ok: true, found: !!found });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }
});

// Injected into the page. Scrolls to and highlights the source paragraph using
// the browser's native find — no DOM rewriting, so it can't break the page.
// Falls back to a shorter fragment if the full paragraph doesn't match exactly
// (whitespace/line-break differences between extracted text and live DOM text
// are common).
function highlightTextOnPage(searchText) {
  if (!searchText) return false;
  const tryFind = (str) => {
    try {
      return window.find(str, false, false, true, false, true, false);
    } catch (e) {
      return false;
    }
  };
  if (tryFind(searchText)) return true;
  const trimmed = searchText.trim();
  if (trimmed.length > 60 && tryFind(trimmed.slice(0, 60))) return true;
  if (trimmed.length > 20) {
    const words = trimmed.split(/\s+/).slice(0, 8).join(' ');
    if (words.length > 15 && tryFind(words)) return true;
  }
  return false;
}
