export class Tier1RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Tier1RetryableError";
  }
}

const CHALLENGE_PATTERNS = [
  /cf-browser-verification/i,
  /challenge-platform/i,
  /Just a moment/i,
  /Checking your browser/i,
  /Attention Required/i,
  /Access denied/i,
  /You have been blocked/i,
  /DDoS protection/i,
  /security check/i,
  /captcha/i,
  /g-recaptcha/i,
  /hcaptcha/i,
  /data-dome/i,
  /perimeterx/i,
  /cdn-cgi\/challenge/i,
  /_cf_chl_opt/i,
];

export function detectBlockedPage(html: string): boolean {
  return CHALLENGE_PATTERNS.some((pattern) => pattern.test(html));
}

export function extractTitleAndContent(
  html: string,
  url: string
): { title: string; content: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch
    ? titleMatch[1].trim()
    : new URL(url).hostname;
  const body = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { title, content: body.slice(0, 50000) };
}

async function fetchWithBrightData(url: string): Promise<string> {
  const apiKey = process.env.BRIGHTDATA_API_KEY;
  if (!apiKey) throw new Error("BRIGHTDATA_API_KEY not configured");
  const zone = process.env.BRIGHTDATA_ZONE || "web_unlocker1";

  const res = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ zone, url, format: "raw" }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`BrightData (${res.status}): ${text.slice(0, 200)}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await res.json();
    return json?.body ?? json ?? "";
  }
  return res.text();
}

async function fetchWithScrapingBee(url: string): Promise<string> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) throw new Error("SCRAPINGBEE_API_KEY not configured");

  const result = await tryScrapingBee(url, apiKey, false);
  if (result) return result;

  console.log("[fetchWithScrapingBee] render_js alone failed, escalating with stealth_proxy");
  const resultStealth = await tryScrapingBee(url, apiKey, true);
  if (resultStealth) return resultStealth;

  throw new Error("ScrapingBee failed even with stealth_proxy");
}

async function tryScrapingBee(
  url: string,
  apiKey: string,
  stealth: boolean
): Promise<string | null> {
  const params: Record<string, string> = {
    api_key: apiKey,
    url,
    render_js: "true",
  };
  if (stealth) params.stealth_proxy = "true";

  const res = await fetch(
    `https://app.scrapingbee.com/api/v1?${new URLSearchParams(params)}`,
    { signal: AbortSignal.timeout(60000) }
  );

  if (!res.ok) return null;

  const html = await res.text();
  if (!html || html.length < 100 || detectBlockedPage(html)) return null;

  return html;
}

async function fetchWithZenRows(url: string): Promise<string> {
  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) throw new Error("ZENROWS_API_KEY not configured");

  const result = await tryZenRows(url, apiKey, false);
  if (result) return result;

  console.log("[fetchWithZenRows] js_render alone failed, escalating with antibot + premium_proxy");
  const resultFull = await tryZenRows(url, apiKey, true);
  if (resultFull) return resultFull;

  throw new Error("ZenRows failed even with antibot + premium_proxy");
}

async function tryZenRows(
  url: string,
  apiKey: string,
  full: boolean
): Promise<string | null> {
  const params: Record<string, string> = {
    apikey: apiKey,
    url,
    js_render: "true",
  };
  if (full) {
    params.antibot = "true";
    params.premium_proxy = "true";
  }

  const res = await fetch(
    `https://api.zenrows.com/v1/?${new URLSearchParams(params)}`,
    { signal: AbortSignal.timeout(60000) }
  );

  if (!res.ok) return null;

  const html = await res.text();
  if (!html || html.length < 100 || detectBlockedPage(html)) return null;

  return html;
}

export async function fetchRenderedHtml(url: string): Promise<string> {
  const provider = process.env.SCRAPER_PROVIDER || "scrapingbee";
  console.log(`[fetchRenderedHtml] using provider: ${provider}`);

  switch (provider) {
    case "brightdata":
      return fetchWithBrightData(url);
    case "scrapingbee":
      return fetchWithScrapingBee(url);
    case "zenrows":
      return fetchWithZenRows(url);
    default:
      throw new Error(
        `Unknown SCRAPER_PROVIDER: "${provider}". Use: brightdata, scrapingbee, or zenrows.`
      );
  }
}
