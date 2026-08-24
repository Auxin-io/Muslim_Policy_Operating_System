# Muslim Policy OS — Chrome Extension

An AI-powered Chrome extension that automatically scans pages you visit for laws and
bills, and shows how they may affect Muslim communities — **Muslim Impact**, **Muslim
Exposure**, **Possible Actions**, **Key Deadlines**, and a **Source Paragraph** — with
a US state map, all directly inside the extension popup. Runs on Google Gemini's free
API tier.

There is no separate dashboard tab anymore — everything renders inline when you click
the toolbar icon.

## How it works
1. **Every page you visit** is checked automatically once it finishes loading (only
   the tab you're actively looking at — background tabs aren't scanned until you
   switch to them).
2. A **local keyword pre-filter** runs entirely inside your browser first — it checks
   the page's visible text for legislative-sounding language (bill, act, senate,
   ordinance, statute, committee hearing, public comment, etc.). Nothing is sent
   anywhere at this stage. Only pages that pass this check get sent to Gemini.
3. If a page passes the filter, its text goes to Gemini with a prompt asking it to
   identify the bill/law and produce: Muslim Impact, Muslim Exposure, Possible
   Actions, Key Deadlines, and a Source Paragraph.
4. If a bill is found, the **toolbar icon shows a badge (!)** — red for high severity,
   orange otherwise. An optional system notification can also fire for high/medium
   severity direct matches (toggle in Settings, on by default).
5. **Click the icon** to see everything for the page you're currently on — right in
   the popup: a small state map colored for that bill's geographic scope, a switcher
   if more than one bill was found on the page, and all the analysis fields. No new
   tab opens.
6. Results are **cached per URL for 6 hours** so revisiting the same page doesn't
   burn another API call.
7. You can still **paste text or a URL manually** via the collapsible section at the
   bottom of the popup — results render inline the same way, just without the
   "Show on Page" button (there's no live tab to highlight against for pasted
   content).
8. Every detected bill includes a **Source Paragraph** — the near-verbatim passage
   from the page that the bill identification was actually grounded in. A **"Show on
   Page" button** (auto-scan results only) scrolls to and highlights that exact
   passage in the live tab using the browser's native find — no page content is
   modified. If the passage can't be found, it says so rather than pretending to.

## Install
1. Unzip this folder.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.
5. Get a free key at **aistudio.google.com/apikey**.
6. Click the extension icon → **Settings** → paste the key → Save.
7. Auto-scanning starts immediately on the next page you load or switch to.

## Popup size note
Chrome caps extension popups at roughly 800×600px. The popup here is 460px wide with
an internal scroll area (max ~500px tall) so the map, bill switcher, and every field
fit within that limit without the popup itself getting clipped.

## Controlling auto-scan
- A toggle in the top-right of the popup turns auto-scan on/off at any time.
- "Analyze Anyway" appears when the local filter found no legislative language on a
  page — click it to force a Gemini check anyway.
- "Re-scan" forces a fresh check even if a cached result exists.

## About calling Gemini on every page
This was a deliberate choice to scan continuously rather than only on demand. Two
things worth knowing:
- **Quota**: Gemini's free tier has daily rate limits. Scanning every page you visit
  (even with the local pre-filter cutting out most non-policy pages) will use more
  quota than a click-to-analyze-only version. If you hit a quota error, the popup
  will show it plainly.
- **What actually gets sent externally**: the local pre-filter means routine browsing
  — email, shopping, social media, search results — almost never reaches the point of
  being sent to Gemini, because that text won't contain legislative keywords. Only
  pages whose visible text already looks like it's about a bill/law get sent for full
  analysis.

## Privacy / data handling
- Your API key lives only in this browser's local extension storage
  (`chrome.storage.local`) and is sent only to `generativelanguage.googleapis.com`.
- **Hard domain exclusions**: webmail (Gmail, Outlook, Yahoo Mail, Proton, iCloud),
  banking/payment sites, healthcare/patient portals, and private-messaging sites
  (Messenger, WhatsApp Web, Telegram Web) are never auto-scanned at all — this check
  runs before any page text is even read, so it's independent of and stronger than the
  keyword pre-filter.
- Cached scan results (URL → analysis) are stored locally and pruned automatically
  past 60 entries.
- The extension has no analytics and no external logging beyond the Gemini API calls
  described above.

## Important caveats
- This is an **analysis aid for research and advocacy**, not legal advice. AI-generated
  severity ratings, impact categories, and exposure descriptions are estimates —
  verify anything consequential against the actual bill text and a qualified attorney
  or policy professional.
- The tool is instructed never to invent legislator names, phone numbers, vote counts,
  dollar figures, deadlines, or source-paragraph text. If the source page doesn't
  mention them, the popup says so explicitly rather than filling in a
  plausible-looking placeholder.
- The US map uses accurate state boundary path data extracted from the
  `@svg-maps/usa` npm package (v2.0.0) by Victor Cazanave
  (github.com/VictorCazanave/svg-maps). **License: CC BY-NC 4.0
  (Attribution-NonCommercial).** That means: (1) attribution to the creator is
  required if this project is shared, and (2) the map data specifically may not be
  used for commercial purposes without separate permission from the author — see
  https://creativecommons.org/licenses/by-nc/4.0/. See `NOTICE.md` for the full
  disclosure. All other code in this extension was written fresh for this project
  and carries no such restriction.

## Files
- `manifest.json` — Manifest V3 config
- `popup.html/js` — everything: auto-scan summary, inline map, multi-bill switcher,
  manual paste/URL fallback. This is now the only UI surface.
- `background.js` — auto-scan pipeline (local filter, caching, badge, notifications),
  Gemini API calls, manual paste/URL analysis, page-highlight logic
- `options.html/js` — API key/model settings + notification toggle
- `usa-map-data.js` — embedded state path data for the map
- `icon128.png` — toolbar/notification icon
- `NOTICE.md` — full AI tools / dataset / license disclosure

## Customizing
- Edit `LEGISLATIVE_SIGNAL_RE` in `background.js` to tune what counts as
  "legislative-sounding" for the local pre-filter.
- Edit the `SYSTEM_PROMPT` in `background.js` to adjust categories, action
  suggestions, text length, or how strict the anti-fabrication rules are.
- Edit `popup.html`'s inline `<style>` block to restyle the map, cards, or layout.
