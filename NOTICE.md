# AI Tools, Data Sources, Code & Licenses — Disclosure

This document lists every AI tool, dataset, and piece of pre-existing code/library
used in building Muslim Policy OS, for transparency and hackathon compliance review.

## AI tools used during development

**Claude (Anthropic)** — Model: Claude Sonnet 5, accessed via claude.ai chat.
Used as the development assistant for the entire build: architecture decisions,
writing all HTML/CSS/JavaScript source files, writing the analysis system prompt,
debugging (URL-fetch timeouts, deprecated model IDs, Chrome extension permission
errors), and drafting documentation. All code in this repository was generated
through this tool in conversation with the project owner during the working
session and reflects fresh authorship for this project — no pre-written extension
boilerplate or template was used as a starting point.

## AI model used at runtime (inside the shipped extension)

**Google Gemini API** — the deployed extension calls Google's Gemini models
(`gemini-3.6-flash`, `gemini-3.7-flash`, or `gemini-3.5-flash-lite`, user-selectable)
via `generativelanguage.googleapis.com` to perform the actual bill/law extraction
and Muslim-community impact analysis at runtime. This is a live third-party API
dependency, not something used to generate the code — it's what the shipped
product calls every time a user analyzes a page. Requires the end user's own
free-tier Google AI Studio API key; no model weights, training data, or Google
IP are bundled into the extension itself.

## Datasets

**No training/ML dataset was used.** This is not a trained model — it's a rules/prompt-
based application that calls a third-party LLM (Gemini) at inference time. The only
"data" bundled with the extension is:

**US state boundary path data** — sourced from the `@svg-maps/usa` npm package
(v2.0.0), authored by Victor Cazanave (github.com/VictorCazanave/svg-maps). This
package provides accurate SVG `<path>` geometry for all 50 states + DC, which was
extracted at build time via a Node.js script and baked into a static file,
`usa-map-data.js`, bundled with the extension. No live network call is made to this
package at runtime — it's embedded, static, offline data.

- **License: CC BY-NC 4.0** (Creative Commons Attribution-NonCommercial 4.0
  International) — https://creativecommons.org/licenses/by-nc/4.0/
- **Attribution required**: Victor Cazanave, https://github.com/VictorCazanave/svg-maps
- **Commercial-use restriction**: this specific dataset may not be used for
  commercial purposes under its license terms without the author's separate
  permission. If this extension is ever distributed commercially, the map
  component would need to be replaced with a differently-licensed or
  self-drawn map, or separate permission obtained from the author.
- No modifications were made to the underlying path geometry — only extraction
  into a different file format (JS object literal instead of raw SVG/JS export).

No legislative/policy database, bill-tracking API, or government dataset is bundled
with the extension. Bill and law information is not pre-loaded — it is extracted
live, per page, by Gemini from whatever article/page text the user is currently
viewing or has pasted. The extension does not claim to have or query any
authoritative legislative-tracking data source (e.g. LegiScan, OpenStates,
congress.gov's API); all bill identification is inferential, from page text only.

## Pre-existing code / libraries

**None**, beyond the one dataset above. Specifically:

- No JavaScript framework (React, Vue, etc.) — vanilla HTML/CSS/JS throughout
- No UI component library
- No CSS framework (Tailwind, Bootstrap, etc.) — hand-written CSS
- No copied boilerplate extension template
- The only `npm` dependency ever installed (`@svg-maps/usa`) was used purely as a
  build-time data source, not as a runtime dependency — it is not `require()`'d or
  imported by the shipped extension at all
- All Chrome Extension APIs used (`chrome.storage`, `chrome.tabs`, `chrome.scripting`,
  `chrome.runtime`, `chrome.action`, `chrome.notifications`) are native browser
  platform APIs provided by Chrome itself, not third-party code, and require no
  separate license beyond Chrome's own terms

## Fresh-work timing note

All source files (`manifest.json`, `popup.html/js`, `options.html/js`,
`background.js`) were written from scratch during this project's working session.
(An earlier version of this project also had separate `dashboard.html/css/js`
files for a full-page view; those were removed and their functionality — the map
and multi-bill display — was merged directly into `popup.html/js`.) The one
pre-existing artifact incorporated is the `@svg-maps/usa` map-path dataset
described above, which was published prior to this project's start (v2.0.0) and
pulled in as a data source rather than authored during the session — disclosed
here per the above.
