# Muslim Policy Operating System (MPOS)

## 👁️ Muslim Policy Overwatch — Chrome Extension

An **AI-powered policy monitoring and analysis system** designed to help users identify laws, bills, regulations, and policy developments that may affect Muslim communities across the United States.

The core system is called the **Muslim Policy Operating System (MPOS)**.

When accessed through a user-facing interface such as a **Chrome Extension, Claude, Microsoft Copilot, or ChatGPT**, the system operates as **Muslim Policy Overwatch**.

### 🏗️ System Naming

| Layer | Name |
|---|---|
| 🖥️ Core / Main System | **Muslim Policy Operating System (MPOS)** |
| 👁️ AI Monitoring & Analysis Layer | **Muslim Policy Overwatch** |
| 🌐 Chrome Extension | **Muslim Policy Overwatch** |
| 🤖 ChatGPT Interface | **Muslim Policy Overwatch** |
| 🧠 Claude Interface | **Muslim Policy Overwatch** |
| 💼 Microsoft Copilot Interface | **Muslim Policy Overwatch** |

> **In simple terms:**  
> 🕌 **Muslim Policy Operating System** = The core policy intelligence platform  
> 👁️ **Muslim Policy Overwatch** = The intelligent monitoring, detection, and analysis layer

---

# 🌐 Muslim Policy Overwatch — Chrome Extension

The **Muslim Policy Overwatch Chrome Extension** automatically scans the pages you visit for legislative and policy-related content and explains how identified laws or bills may affect Muslim communities.

When a relevant policy is detected, Overwatch provides:

- 🕌 **Muslim Impact** — How the policy may affect Muslim individuals and communities.
- ⚠️ **Muslim Exposure** — Potential areas and levels of exposure or concern.
- 📋 **Possible Actions** — Practical actions individuals, organisations, or advocates may consider.
- ⏰ **Key Deadlines** — Important hearings, comment periods, voting dates, or other deadlines mentioned in the source.
- 📖 **Source Paragraph** — The original passage used to identify and analyse the bill or law.
- 🗺️ **US State Map** — A visual representation of the state or geographic scope affected by the policy.

The extension runs using **Google Gemini's free API tier**.

There is no separate dashboard tab. Everything is displayed directly inside the extension popup when the user clicks the toolbar icon.

---

# ⚙️ How It Works

### 1. 🌐 Automatic Page Scanning

Every page you visit is checked automatically after it finishes loading.

Only the **active browser tab** is scanned. Background tabs are not scanned until you switch to them.

### 2. 🔍 Local Policy Keyword Detection

Before sending anything externally, a **local keyword pre-filter** runs entirely inside your browser.

It checks visible page text for legislative and policy-related terms such as:

- 📜 Bill
- ⚖️ Act
- 🏛️ Senate
- 🏛️ Legislature
- 📑 Ordinance
- 📚 Statute
- 👥 Committee Hearing
- 💬 Public Comment
- 🗳️ Vote
- 🏛️ Regulation

Nothing is sent externally during this initial filtering stage.

### 3. 🤖 AI Policy Analysis

If the page passes the local filter, its relevant text is sent to Gemini.

The AI is instructed to identify the relevant bill or law and generate:

- 🕌 Muslim Impact
- ⚠️ Muslim Exposure
- 📋 Possible Actions
- ⏰ Key Deadlines
- 📖 Source Paragraph

### 4. 🚨 Policy Detection Alert

If a relevant bill or law is detected, the Chrome toolbar icon displays a badge:

- 🔴 **Red** — High severity
- 🟠 **Orange** — Moderate or lower severity

An optional system notification can also appear for high- and medium-severity direct matches.

🔔 Notifications can be enabled or disabled from **Settings**.

### 5. 👁️ Overwatch Popup

Click the **Muslim Policy Overwatch** icon to view the analysis for the page you're currently visiting.

The popup displays:

- 🗺️ State map
- 📜 Detected bill/law
- 🔄 Bill switcher when multiple bills are detected
- 🕌 Muslim Impact
- ⚠️ Muslim Exposure
- 📋 Possible Actions
- ⏰ Key Deadlines
- 📖 Source Paragraph
- 🔎 **Show on Page** option

Everything appears directly inside the extension popup.

### 6. 💾 Local Caching

Results are cached locally for **6 hours per URL**.

This prevents the same page from repeatedly consuming API calls.

### 7. ✍️ Manual Analysis

Users can also manually provide:

- 📄 Text
- 🔗 URL

through the collapsible section at the bottom of the popup.

Results are displayed inline using the same Overwatch interface.

### 8. 🔎 Source Verification

Every detected bill includes a **Source Paragraph** showing the passage from the webpage that the identification was based on.

The **Show on Page** button can automatically scroll to and highlight that passage using the browser's native find functionality.

The extension does not modify the webpage.

If the passage cannot be found, Overwatch clearly reports that instead of presenting an inaccurate match.

---

# 🤖 Muslim Policy Overwatch Across AI Platforms

The **Muslim Policy Operating System** is the underlying policy intelligence layer.

**Muslim Policy Overwatch** is the monitoring and interaction layer that can operate across multiple interfaces.

```text
                    🕌 MUSLIM POLICY
                 OPERATING SYSTEM (MPOS)
                         │
                         │
             ┌───────────┴───────────┐
             │                       │
       🧠 Policy Intelligence    🔐 Policy Data
             │                       │
             └───────────┬───────────┘
                         │
                  👁️ MUSLIM POLICY
                     OVERWATCH
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
   🌐 Chrome         🤖 ChatGPT        🧠 Claude
   Extension
                         │
                         ▼
                  💼 Microsoft
                    Copilot
```

---

# 📥 Installation

1. 📦 Unzip this folder.
2. 🌐 Go to `chrome://extensions`.
3. ⚙️ Turn on **Developer mode**.
4. 📂 Click **Load unpacked** and select this folder.
5. 🔑 Get a free Gemini API key from Google AI Studio.
6. 🧩 Click the extension icon → **Settings**.
7. 🔐 Paste the API key and save.
8. 🚀 Auto-scanning starts on the next page you load or switch to.

---

# 📐 Popup Size

Chrome limits extension popups to approximately **800 × 600px**.

The popup is approximately **460px wide** with an internal scroll area of around **500px maximum height**.

This allows the following to fit inside the popup:

- 🗺️ State map
- 📜 Bill switcher
- 🕌 Impact analysis
- ⚠️ Exposure analysis
- 📋 Actions
- ⏰ Deadlines
- 📖 Source paragraph

without opening a separate dashboard.

---

# 🎛️ Controlling Auto-Scan

The extension provides several controls:

- 🔘 **Auto-Scan Toggle** — Turn continuous scanning on or off.
- 🤖 **Analyze Anyway** — Force an AI analysis when the local filter does not detect legislative language.
- 🔄 **Re-scan** — Perform a fresh analysis even when a cached result exists.
- ⚙️ **Settings** — Manage API configuration and notifications.

---

# 🤖 Gemini API Usage

Continuous scanning is intentional because **Muslim Policy Overwatch is designed as a proactive policy-monitoring system** rather than a tool that only analyses pages when manually requested.

### 📊 Quota

Gemini's free tier has daily rate limits.

Scanning every page you visit can consume more quota than a click-to-analyse model.

If the quota is exceeded, the extension displays the API error directly in the popup.

### 🔐 What Gets Sent Externally

The local pre-filter helps prevent ordinary browsing content from being sent to Gemini.

Pages such as:

- 📧 Email
- 🛒 Shopping
- 📱 Social media
- 🔎 Search results

normally do not proceed to AI analysis unless their visible text contains legislative or policy-related signals.

---

# 🔒 Privacy & Data Handling

- 🔑 The API key is stored only in `chrome.storage.local`.
- 🌐 The API key is sent only to Google's Gemini API endpoint.
- 🚫 Webmail sites are excluded from automatic scanning.
- 💳 Banking and payment websites are excluded.
- 🏥 Healthcare and patient portals are excluded.
- 💬 Private messaging sites such as Messenger, WhatsApp Web, Telegram Web, and similar services are excluded.
- 💾 Cached results are stored locally.
- 🧹 Cached results are automatically removed after exceeding 60 entries.
- 📊 The extension does not use analytics.
- 🚫 No external logging is performed beyond the Gemini API calls described above.

---

# ⚠️ Important Caveats

**Muslim Policy Overwatch is an AI-powered analysis and research aid — not legal advice.**

AI-generated severity ratings, impact assessments, and exposure descriptions are estimates.

Users should verify consequential information against:

- 📜 Official bill text
- 🏛️ Government sources
- ⚖️ Qualified legal professionals
- 🧑‍💼 Policy professionals

The system is instructed **not to fabricate**:

- 👤 Legislator names
- ☎️ Phone numbers
- 🗳️ Vote counts
- 💰 Dollar figures
- ⏰ Deadlines
- 📖 Source paragraphs

If information cannot be found in the source, Overwatch should explicitly state that the information is unavailable.

---

# 🗺️ US State Map

The US map uses state boundary path data extracted from the `@svg-maps/usa` npm package (v2.0.0) by Victor Cazanave.

**License:** CC BY-NC 4.0 — Attribution-NonCommercial.

Attribution is required when the project is shared, and the map data cannot be used commercially without separate permission from the author.

See `NOTICE.md` for the complete disclosure.

---

# 📁 Project Files

| File | Description |
|---|---|
| 📄 `manifest.json` | Manifest V3 configuration |
| 🖥️ `popup.html/js` | Overwatch popup, auto-scan summary, map, bill switcher, and manual analysis |
| ⚙️ `background.js` | Auto-scan pipeline, local filtering, caching, badge, notifications, Gemini API calls, and source highlighting |
| 🔧 `options.html/js` | API key, model settings, and notification controls |
| 🗺️ `usa-map-data.js` | Embedded US state path data |
| 🖼️ `icon128.png` | Toolbar and notification icon |
| 📜 `NOTICE.md` | AI tools, dataset, and licence disclosure |

---

# 🛠️ Customisation

### 🔍 Legislative Detection

Edit `LEGISLATIVE_SIGNAL_RE` in `background.js` to change the keywords used by the local policy pre-filter.

### 🤖 AI Behaviour

Edit `SYSTEM_PROMPT` in `background.js` to modify:

- 🕌 Impact categories
- ⚠️ Exposure assessment
- 📋 Action recommendations
- ⏰ Deadline extraction
- 📏 Response length
- 🛡️ Anti-fabrication rules

### 🎨 User Interface

Edit the inline `<style>` section in `popup.html` to customise:

- 🗺️ Map
- 🃏 Analysis cards
- 🎛️ Controls
- 🔤 Typography
- 📐 Layout
- 🎨 Overall Overwatch appearance

---

# 🚀 Vision

The long-term vision of the **Muslim Policy Operating System** is to create a unified policy intelligence platform that continuously monitors legislative activity across all **50 US states** and transforms complex policy information into clear, actionable insights for Muslim communities.

**🕌 Muslim Policy Operating System**

> *The intelligence layer for understanding policy.*

**👁️ Muslim Policy Overwatch**

> *Watch. Understand. Respond.*
