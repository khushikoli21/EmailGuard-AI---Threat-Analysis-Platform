import { v4 as uuidv4 } from 'uuid';
import { ThreatIntelRecord } from './db.js';
type IndicatorType = 'url' | 'domain' | 'hash';
type FetchLike = typeof fetch;
const timeoutMs = () => Math.max(1000, Number(process.env.THREAT_INTEL_TIMEOUT_MS || 8000));
export function parseVirusTotal(data: any) {
  const attrs=data?.data?.attributes||{}, stats=attrs.last_analysis_stats||{};
  const malicious=Number(stats.malicious||0), suspicious=Number(stats.suspicious||0);
  return {malicious:malicious>0,suspicious:suspicious>0,stats,reputation:malicious?`${malicious} VirusTotal engine(s) marked this indicator malicious`:suspicious?`${suspicious} VirusTotal engine(s) marked this indicator suspicious`:'No malicious or suspicious detections in returned VirusTotal analysis'};
}
export function parseUrlhaus(data:any) {
  const found=data?.query_status==='ok';
  return {found,malicious:found&&data.url_status==='online',suspicious:false};
}
export class ThreatIntelligenceService {
  constructor(private fetcher:FetchLike=fetch) {}
  normalizeUrl(raw:string):string { try {const p=new URL(raw.trim().startsWith('http')?raw.trim():'http://'+raw.trim());return p.origin+(p.pathname==='/'?'':p.pathname)+p.search;}catch{return raw.trim();} }
  extractDomain(raw:string):string {try{return new URL(raw.startsWith('http')?raw:'http://'+raw).hostname.toLowerCase();}catch{return '';}}
  async checkUrl(value:string,analysisId:string,userId:string,type:IndicatorType='url'):Promise<ThreatIntelRecord[]> {
    const normalized=type==='url'?this.normalizeUrl(value):value.toLowerCase();
    const results=await Promise.all([this.queryVirusTotal(normalized,type,analysisId,userId),type==='url'?this.queryUrlhaus(normalized,analysisId,userId):Promise.resolve(null)]);
    return results.filter((r):r is ThreatIntelRecord=>r!==null);
  }
  private async request(url:string,init:RequestInit):Promise<Response>{return this.fetcher(url,{...init,signal:AbortSignal.timeout(timeoutMs())});}
  private record(userId:string,analysisId:string,value:string,provider:string,status:ThreatIntelRecord['status'],extra:Partial<ThreatIntelRecord>={}):ThreatIntelRecord{return{id:uuidv4(),userId,analysisId,url:value,provider,status,malicious:false,suspicious:false,checkedAt:new Date().toISOString(),...extra};}
  private async queryVirusTotal(value:string,type:IndicatorType,analysisId:string,userId:string):Promise<ThreatIntelRecord>{
    const key=process.env.VIRUSTOTAL_API_KEY;if(!key)return this.record(userId,analysisId,value,'VirusTotal','not_configured',{reputation:'Unavailable: VIRUSTOTAL_API_KEY is not configured'});
    const id=type==='url'?Buffer.from(value).toString('base64').replace(/=/g,''):encodeURIComponent(value), collection=type==='url'?'urls':type==='domain'?'domains':'files';
    try{const res=await this.request(`https://www.virustotal.com/api/v3/${collection}/${id}`,{headers:{'x-apikey':key}});
      if(res.status===404)return this.record(userId,analysisId,value,'VirusTotal','unavailable',{reputation:'No VirusTotal record found',details:{httpStatus:404}});
      if(!res.ok)return this.record(userId,analysisId,value,'VirusTotal','failed',{reputation:`VirusTotal returned HTTP ${res.status}`,details:{httpStatus:res.status,rateLimited:res.status===429}});
      const parsed=parseVirusTotal(await res.json());return this.record(userId,analysisId,value,'VirusTotal','completed',{...parsed,details:parsed.stats});
    }catch(e){return this.record(userId,analysisId,value,'VirusTotal','failed',{reputation:'VirusTotal request failed or timed out',details:{error:e instanceof Error?e.message:String(e)}});}
  }
  private async queryUrlhaus(value:string,analysisId:string,userId:string):Promise<ThreatIntelRecord>{
    const key=process.env.URLHAUS_AUTH_KEY;if(!key)return this.record(userId,analysisId,value,'URLhaus','not_configured',{reputation:'Unavailable: URLHAUS_AUTH_KEY is not configured'});
    try{const res=await this.request('https://urlhaus-api.abuse.ch/v1/url/',{method:'POST',headers:{'Auth-Key':key,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({url:value})});
      if(!res.ok)return this.record(userId,analysisId,value,'URLhaus','failed',{reputation:res.status===429?'URLhaus rate limit reached':`URLhaus returned HTTP ${res.status}`,details:{httpStatus:res.status}});
      const data=await res.json(), parsed=parseUrlhaus(data);return this.record(userId,analysisId,value,'URLhaus',parsed.found?'completed':'unavailable',{malicious:parsed.malicious,reputation:parsed.found?'Listed by URLhaus as a malware URL':`URLhaus query status: ${data?.query_status||'unknown'}`,details:parsed.found?{urlStatus:data.url_status,threat:data.threat,tags:data.tags,dateAdded:data.date_added,reference:data.urlhaus_reference}:{queryStatus:data?.query_status}});
    }catch(e){return this.record(userId,analysisId,value,'URLhaus','failed',{reputation:'URLhaus request failed or timed out',details:{error:e instanceof Error?e.message:String(e)}});}
  }
}
export const threatIntelService=new ThreatIntelligenceService();
