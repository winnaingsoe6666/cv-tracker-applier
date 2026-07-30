# CareerForge Chrome Extension

Push job postings from any job board to your CareerForge workbench with one click.

## Supported Job Boards

| Board | URL Pattern | Notes |
|-------|-------------|-------|
| LinkedIn | linkedin.com/jobs/* | Full title, company, description |
| JobStreet | jobstreet.com, jobstreet.com.my | Full support |
| JobsDB | jobsdb.com | Full support |
| Indeed | indeed.com, au.indeed.com | Full support |
| Seek | seek.com, seek.com.au | Full support |
| Glassdoor | glassdoor.com, glassdoor.sg | Full support |
| Any site | * | Generic fallback via JSON-LD, OG tags, largest text block |

## Install (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this `extension/` folder
5. The CareerForge icon will appear in your Chrome toolbar

## First-Time Setup

When you first install the extension, it will automatically open the CareerForge Settings page.

1. Go to **Settings → Browser Extension**
2. Click **Generate token** and copy the `cf_xxx` token
3. Click the CareerForge extension icon in Chrome
4. Click ⚙ (settings gear) in the popup
5. Paste your app URL (default: `http://localhost:3000`) and the token
6. Click **Save Settings**

## Usage

1. Navigate to any job listing page on a supported job board
2. Click the CareerForge extension icon in your toolbar
3. Review the detected job title and company
4. Select the market (TH / MY / SG / Remote)
5. Click **Push to CareerForge**
6. Click "Open workbench →" in the success message to review the job

## Architecture

```
extension/
├── manifest.json       # Manifest V3 — permissions, content script declarations
├── popup.html          # Extension popup UI (dark theme matching CareerForge)
├── popup.js            # Popup logic — loads settings, calls content script, pushes job
├── content.js          # Injected into job pages — scrapes job data per site
├── background.js       # Service worker — opens settings on first install
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── generate-icons.js   # Helper: resize icon-128.png → icon-48.png + icon-16.png
```

## API

The extension POSTs to `POST /api/extension/push-job`:

```json
{
  "title": "Senior Backend Engineer",
  "company": "Acme Corp",
  "description": "Full job description text...",
  "url": "https://linkedin.com/jobs/view/12345",
  "location": "Bangkok, Thailand",
  "market": "TH",
  "source": "extension"
}
```

Auth: `Authorization: Bearer cf_<your_token>`

Response:
```json
{
  "jobId": "clxxxxxxx",
  "applicationId": "clyyyyyyy",
  "workbenchUrl": "/jobs/clxxxxxxx",
  "worthiness": 72
}
```

## Privacy

- The extension only reads page content when you click the icon
- No data is sent anywhere except your own CareerForge instance
- Tokens are stored in `chrome.storage.sync` (your Chrome profile, encrypted)
- Content scripts only activate on supported job board URLs

## Development

To update the extension after code changes:
1. Go to `chrome://extensions`
2. Click the refresh icon on the CareerForge extension card

To test with production CareerForge:
1. Change the App URL in the extension settings to your deployed URL
2. Regenerate a token against the production database
