// Job board integration types and stubs.
// Production: wire up real API calls with proper OAuth / API keys.

export interface JobListing {
  id: string;
  source: "linkedin" | "jobstreet" | "other";
  title: string;
  company: string;
  location: string | null;
  url: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  seniority?: string;
  postedAt?: string;
}

export interface SearchParams {
  query: string;
  location?: string;
  market?: string;
  seniority?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  jobs: JobListing[];
  total: number;
  page: number;
  hasMore: boolean;
}

// ─── LinkedIn Jobs (stub) ────────────────────────────────────────────────────
// Production: use LinkedIn Jobs API (requires partner access or RapidAPI proxy).
// Docs: https://learn.microsoft.com/en-us/linkedin/shared/references/v2/profile/jobs

export async function searchLinkedIn(_params: SearchParams): Promise<SearchResult> {
  // Stub: return empty results until API key is configured.
  // To enable:
  // 1. Set LINKEDIN_API_KEY in env
  // 2. Call LinkedIn Jobs Search API
  // 3. Map response to JobListing[]
  return { jobs: [], total: 0, page: 1, hasMore: false };
}

export async function getLinkedInJob(_id: string): Promise<JobListing | null> {
  // Stub: fetch single job detail from LinkedIn
  return null;
}

// ─── JobStreet (stub) ────────────────────────────────────────────────────────
// Production: use JobStreet/Seek API (via Seek Partner Network).
// Docs: https://developer.seek.com.au/

export async function searchJobStreet(_params: SearchParams): Promise<SearchResult> {
  // Stub: return empty results until API key is configured.
  // To enable:
  // 1. Set JOBSTREET_API_KEY in env
  // 2. Call JobStreet Search API
  // 3. Map response to JobListing[]
  return { jobs: [], total: 0, page: 1, hasMore: false };
}

export async function getJobStreetJob(_id: string): Promise<JobListing | null> {
  // Stub: fetch single job detail from JobStreet
  return null;
}

// ─── Unified search ──────────────────────────────────────────────────────────

export async function searchAllBoards(params: SearchParams): Promise<SearchResult> {
  const [linkedin, jobstreet] = await Promise.all([
    searchLinkedIn(params),
    searchJobStreet(params),
  ]);

  const allJobs = [...linkedin.jobs, ...jobstreet.jobs];
  return {
    jobs: allJobs,
    total: linkedin.total + jobstreet.total,
    page: params.page ?? 1,
    hasMore: linkedin.hasMore || jobstreet.hasMore,
  };
}
