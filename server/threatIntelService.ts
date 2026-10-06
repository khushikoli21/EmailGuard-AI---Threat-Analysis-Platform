import { v4 as uuidv4 } from 'uuid';
import { ThreatIntelRecord } from './db.js';

interface CachedIntel {
  record: ThreatIntelRecord;
  cachedAt: number;
}

class ThreatIntelligenceService {
  private cache: Map<string, CachedIntel> = new Map();
  private readonly CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache

  // Normalize URL for consistent lookup
  public normalizeUrl(rawUrl: string): string {
    try {
      const clean = rawUrl.trim();
      const hasProto = clean.startsWith('http://') || clean.startsWith('https://');
      const parsed = new URL(hasProto ? clean : `http://${clean}`);
      // Strip trailing slashes, fragments
      return `${parsed.protocol}//${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}${parsed.search}`;
    } catch {
      return rawUrl.trim();
    }
  }

  public extractDomain(rawUrl: string): string {
    try {
      const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`);
      return parsed.hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  public async checkUrl(
    url: string,
    analysisId: string,
    userId: string
  ): Promise<ThreatIntelRecord[]> {
    const normalized = this.normalizeUrl(url);
    const domain = this.extractDomain(url);
    const now = new Date().toISOString();
    const results: ThreatIntelRecord[] = [];

    // Cache check
    const cacheKeyVt = `vt:${normalized}`;
    const cachedVt = this.cache.get(cacheKeyVt);
    if (cachedVt && Date.now() - cachedVt.cachedAt < this.CACHE_TTL_MS) {
      results.push({
        ...cachedVt.record,
        id: uuidv4(),
        analysisId,
        userId,
        checkedAt: now,
      });
    } else {
      const vtRecord = await this.queryVirusTotal(normalized, analysisId, userId);
      results.push(vtRecord);
      this.cache.set(cacheKeyVt, { record: vtRecord, cachedAt: Date.now() });
    }

    const cacheKeyUrlscan = `urlscan:${domain || normalized}`;
    const cachedUrlscan = this.cache.get(cacheKeyUrlscan);
    if (cachedUrlscan && Date.now() - cachedUrlscan.cachedAt < this.CACHE_TTL_MS) {
      results.push({
        ...cachedUrlscan.record,
        id: uuidv4(),
        analysisId,
        userId,
        checkedAt: now,
      });
    } else {
      const urlscanRecord = await this.queryUrlscan(domain, normalized, analysisId, userId);
      results.push(urlscanRecord);
      this.cache.set(cacheKeyUrlscan, { record: urlscanRecord, cachedAt: Date.now() });
    }

    return results;
  }

  private async queryVirusTotal(
    url: string,
    analysisId: string,
    userId: string
  ): Promise<ThreatIntelRecord> {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    const now = new Date().toISOString();

    if (!apiKey) {
      return {
        id: uuidv4(),
        userId,
        analysisId,
        url,
        provider: 'VirusTotal',
        status: 'not_configured',
        malicious: false,
        suspicious: false,
        reputation: 'NOT_CONFIGURED: Set VIRUSTOTAL_API_KEY in environment/secrets',
        details: { note: 'API key not configured in environment' },
        checkedAt: now,
      };
    }

    try {
      // VirusTotal v3 URL identifier is base64 without padding '='
      const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
      const response = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
        headers: { 'x-apikey': apiKey },
      });

      if (response.status === 404) {
        return {
          id: uuidv4(),
          userId,
          analysisId,
          url,
          provider: 'VirusTotal',
          status: 'unavailable',
          malicious: false,
          suspicious: false,
          reputation: 'NO_RESULT: URL has not yet been scanned by VirusTotal engines',
          details: { code: 404, status: 'Not Found in VT Dataset' },
          checkedAt: now,
        };
      }

      if (!response.ok) {
        return {
          id: uuidv4(),
          userId,
          analysisId,
          url,
          provider: 'VirusTotal',
          status: 'failed',
          malicious: false,
          suspicious: false,
          reputation: `UNAVAILABLE: HTTP ${response.status} from VirusTotal API`,
          details: { status: response.status, statusText: response.statusText },
          checkedAt: now,
        };
      }

      const data = await response.json();
      const stats = data?.data?.attributes?.last_analysis_stats || {};
      const maliciousCount = Number(stats.malicious || 0);
      const suspiciousCount = Number(stats.suspicious || 0);
      const harmlessCount = Number(stats.harmless || 0);
      const undetectedCount = Number(stats.undetected || 0);

      const isMalicious = maliciousCount > 0;
      const isSuspicious = suspiciousCount > 0;

      return {
        id: uuidv4(),
        userId,
        analysisId,
        url,
        provider: 'VirusTotal',
        status: 'completed',
        malicious: isMalicious,
        suspicious: isSuspicious,
        reputation: isMalicious
          ? `MALICIOUS: ${maliciousCount} security vendors flagged this URL`
          : isSuspicious
          ? `SUSPICIOUS: ${suspiciousCount} vendors flagged anomalies`
          : `CLEAN: 0/${maliciousCount + harmlessCount + undetectedCount} detections`,
        details: {
          malicious: maliciousCount,
          suspicious: suspiciousCount,
          harmless: harmlessCount,
          undetected: undetectedCount,
        },
        checkedAt: now,
      };
    } catch (err: any) {
      return {
        id: uuidv4(),
        userId,
        analysisId,
        url,
        provider: 'VirusTotal',
        status: 'failed',
        malicious: false,
        suspicious: false,
        reputation: `FAILED: Network error querying VirusTotal (${err.message})`,
        details: { error: err.message },
        checkedAt: now,
      };
    }
  }

  private async queryUrlscan(
    domain: string,
    url: string,
    analysisId: string,
    userId: string
  ): Promise<ThreatIntelRecord> {
    const apiKey = process.env.URLSCAN_API_KEY;
    const now = new Date().toISOString();

    if (!apiKey) {
      return {
        id: uuidv4(),
        userId,
        analysisId,
        url,
        provider: 'urlscan.io',
        status: 'not_configured',
        malicious: false,
        suspicious: false,
        reputation: 'NOT_CONFIGURED: Set URLSCAN_API_KEY in environment/secrets',
        details: { note: 'API key not configured in environment' },
        checkedAt: now,
      };
    }

    try {
      const query = domain ? `page.domain:${domain}` : `page.url:"${url}"`;
      const response = await fetch(`https://urlscan.io/api/v1/search/?q=${encodeURIComponent(query)}&size=3`, {
        headers: { 'API-Key': apiKey },
      });

      if (!response.ok) {
        return {
          id: uuidv4(),
          userId,
          analysisId,
          url,
          provider: 'urlscan.io',
          status: 'failed',
          malicious: false,
          suspicious: false,
          reputation: `UNAVAILABLE: HTTP ${response.status} from urlscan.io`,
          details: { status: response.status },
          checkedAt: now,
        };
      }

      const data = await response.json();
      const results = data?.results || [];

      if (results.length === 0) {
        return {
          id: uuidv4(),
          userId,
          analysisId,
          url,
          provider: 'urlscan.io',
          status: 'unavailable',
          malicious: false,
          suspicious: false,
          reputation: 'NO_RESULT: Domain not previously indexed in urlscan public scans',
          details: { totalScans: 0 },
          checkedAt: now,
        };
      }

      const topResult = results[0];
      const verdicts = topResult?.verdicts || {};
      const isMalicious = Boolean(verdicts.overall?.malicious || verdicts.community?.malicious);
      const categories = verdicts.overall?.categories || [];

      return {
        id: uuidv4(),
        userId,
        analysisId,
        url,
        provider: 'urlscan.io',
        status: 'completed',
        malicious: isMalicious,
        suspicious: isMalicious || categories.length > 0,
        reputation: isMalicious
          ? `MALICIOUS: Flagged by urlscan verdicts (${categories.join(', ') || 'malicious score'})`
          : `INDEXED: ${results.length} historical scans on record`,
        details: {
          scanId: topResult?._id,
          ip: topResult?.page?.ip,
          server: topResult?.page?.server,
          country: topResult?.page?.country,
        },
        checkedAt: now,
      };
    } catch (err: any) {
      return {
        id: uuidv4(),
        userId,
        analysisId,
        url,
        provider: 'urlscan.io',
        status: 'failed',
        malicious: false,
        suspicious: false,
        reputation: `FAILED: Error querying urlscan (${err.message})`,
        details: { error: err.message },
        checkedAt: now,
      };
    }
  }
}

export const threatIntelService = new ThreatIntelligenceService();
