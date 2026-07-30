/**
 * CareerForge Extension — content.js
 *
 * Injected into job board pages. Listens for GET_JOB_DATA message
 * from popup.js and replies with scraped { title, company, description, location }.
 *
 * Supported site strategies (in order):
 *   1. LinkedIn Jobs
 *   2. JobStreet (jobstreet.com / .com.my)
 *   3. JobsDB (jobsdb.com)
 *   4. Indeed
 *   5. Seek
 *   6. Glassdoor
 *   7. Generic fallback (OG tags, h1, largest text block)
 */

"use strict";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "GET_JOB_DATA") return;
  sendResponse(scrapeJob());
  return true; // keep channel open for async use
});

// ─── Main dispatcher ──────────────────────────────────────────────────────────
function scrapeJob() {
  const hostname = window.location.hostname.toLowerCase();

  if (hostname.includes("linkedin.com"))    return scrapeLinkedIn();
  if (hostname.includes("jobstreet.com"))   return scrapeJobStreet();
  if (hostname.includes("jobsdb.com"))      return scrapeJobsDB();
  if (hostname.includes("indeed.com"))      return scrapeIndeed();
  if (hostname.includes("seek.com"))        return scrapeSeek();
  if (hostname.includes("glassdoor.com") || hostname.includes("glassdoor.sg"))
                                            return scrapeGlassdoor();

  return scrapeGeneric();
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────
function scrapeLinkedIn() {
  const title   = text(".jobs-unified-top-card__job-title, .job-details-jobs-unified-top-card__job-title");
  const company = text(".jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name");
  const loc     = text(".jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__primary-description-container");
  const desc    = text(".jobs-description__content, .job-details-module__content, #job-details");
  return build(title, company, desc, loc);
}

// ─── JobStreet ────────────────────────────────────────────────────────────────
function scrapeJobStreet() {
  const title   = text('[data-automation="job-detail-title"], h1.z1s6m0');
  const company = text('[data-automation="advertiser-name"], [data-automation="job-detail-company-name"]');
  const loc     = text('[data-automation="job-detail-location"]');
  const desc    = text('[data-automation="jobAdDetails"], .z1s6m0y, [class*="JobDescription"]');
  return build(title, company, desc, loc);
}

// ─── JobsDB ───────────────────────────────────────────────────────────────────
function scrapeJobsDB() {
  const title   = text('[data-automation="job-detail-title"], h1[class*="Title"]');
  const company = text('[data-automation="job-detail-company-name"], [class*="CompanyName"]');
  const loc     = text('[data-automation="job-detail-location"], [class*="Location"]');
  const desc    = text('[data-automation="jobAdDetails"], [class*="JobContent"]');
  return build(title, company, desc, loc);
}

// ─── Indeed ───────────────────────────────────────────────────────────────────
function scrapeIndeed() {
  const title   = text('.jobsearch-JobInfoHeader-title, h1[class*="jobTitle"]');
  const company = text('.jobsearch-CompanyInfoContainer a, [data-company-name="true"]');
  const loc     = text('.jobsearch-JobInfoHeader-subtitle [class*="Location"], [data-testid="job-location"]');
  const desc    = text('#jobDescriptionText, .jobsearch-jobDescriptionText');
  return build(title, company, desc, loc);
}

// ─── Seek ─────────────────────────────────────────────────────────────────────
function scrapeSeek() {
  const title   = text('[data-automation="job-detail-title"], h1');
  const company = text('[data-automation="advertiser-name"]');
  const loc     = text('[data-automation="job-detail-location"]');
  const desc    = text('[data-automation="jobAdDetails"]');
  return build(title, company, desc, loc);
}

// ─── Glassdoor ────────────────────────────────────────────────────────────────
function scrapeGlassdoor() {
  const title   = text('[data-test="job-title"], .heading_Title__iv5DP');
  const company = text('[data-test="employer-name"], .EmployerProfile_employerName__Xemli');
  const loc     = text('[data-test="location"], .JobDetails_location__mSg5h');
  const desc    = text('[data-test="jobDescriptionContent"], .JobDetails_jobDescription__uW_fK');
  return build(title, company, desc, loc);
}

// ─── Generic fallback ─────────────────────────────────────────────────────────
function scrapeGeneric() {
  // Try OG tags first
  const ogTitle   = metaContent('property', 'og:title') || metaContent('name', 'twitter:title');
  const ogDesc    = metaContent('property', 'og:description') || metaContent('name', 'description');
  const ogSite    = metaContent('property', 'og:site_name');

  // Try structured data (JSON-LD)
  let ldTitle = null, ldCompany = null, ldDesc = null, ldLoc = null;
  document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
    try {
      const d = JSON.parse(el.textContent);
      const item = Array.isArray(d) ? d.find(i => i["@type"] === "JobPosting") : (d["@type"] === "JobPosting" ? d : null);
      if (item) {
        ldTitle   = item.title || ldTitle;
        ldCompany = (item.hiringOrganization && item.hiringOrganization.name) || ldCompany;
        ldDesc    = item.description || ldDesc;
        ldLoc     = (item.jobLocation && item.jobLocation.address && item.jobLocation.address.addressLocality) || ldLoc;
      }
    } catch { /* ignore */ }
  });

  const title   = ldTitle   || text('h1') || ogTitle;
  const company = ldCompany || ogSite;
  const loc     = ldLoc;
  const desc    = ldDesc    || ogDesc || largestTextBlock();

  return build(title, company, desc, loc);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get trimmed text from first matching CSS selector. */
function text(selectors) {
  const sels = selectors.split(',').map(s => s.trim());
  for (const sel of sels) {
    const el = document.querySelector(sel);
    if (el) {
      const t = el.innerText || el.textContent || "";
      if (t.trim().length > 0) return t.trim();
    }
  }
  return null;
}

/** Get content attribute of a meta element. */
function metaContent(attr, value) {
  const el = document.querySelector(`meta[${attr}="${value}"]`);
  return el ? el.getAttribute("content")?.trim() || null : null;
}

/** Find the element with the most text content as a description fallback. */
function largestTextBlock() {
  const candidates = Array.from(document.querySelectorAll('article, main, [class*="description"], [class*="content"], [id*="description"]'));
  if (candidates.length === 0) return null;
  const best = candidates.reduce((a, b) => {
    const al = (a.innerText || a.textContent || "").length;
    const bl = (b.innerText || b.textContent || "").length;
    return bl > al ? b : a;
  });
  const t = (best.innerText || best.textContent || "").trim();
  return t.length > 100 ? t.slice(0, 4000) : null;
}

/** Normalize and return result object. Returns null fields rather than empty strings. */
function build(title, company, description, location) {
  return {
    title:       clean(title) || guessTitle(),
    company:     clean(company),
    description: clean(description)?.slice(0, 8000) || null,
    location:    clean(location),
    url:         window.location.href,
  };
}

function clean(val) {
  if (!val) return null;
  return val.replace(/\s+/g, " ").trim() || null;
}

/** Last-resort title from document title (strip site suffix). */
function guessTitle() {
  const t = document.title;
  // Remove common suffixes like " | LinkedIn", " - Indeed", etc.
  return t.replace(/\s*[|–\-]\s*.{2,50}$/, "").trim() || t;
}
