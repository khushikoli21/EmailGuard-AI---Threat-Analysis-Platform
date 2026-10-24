import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {v4 as uuidv4} from 'uuid';
import {IndicatorRecord,EvidenceRecord} from './db.js';
const base=path.dirname(fileURLToPath(import.meta.url));
export interface KnowledgeDocument{id:string;technique:string;name:string;category:string;description:string;detection_signals:string[];url?:string;keywords:string[]}
class RagKnowledgeEngine{
 private documents:KnowledgeDocument[]=[];
 constructor(){this.load();}
 private load(){const dirs=[path.resolve(process.cwd(),'backend/knowledge_base'),path.resolve(base,'../backend/knowledge_base')],dir=dirs.find(d=>fs.existsSync(d));if(!dir)return;
  const walk=(d:string):string[]=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const f=path.join(d,e.name);return e.isDirectory()?walk(f):e.name.endsWith('.json')?[f]:[];});
  for(const f of walk(dir))try{const x=JSON.parse(fs.readFileSync(f,'utf8'));if(!x.name||!x.description)continue;const t=String(x.technique||'');const keywords=Array.from(new Set(([x.name,x.category,x.description,...(x.detection_signals||[])].join(' ').toLowerCase().match(/[a-z0-9.]{4,}/g)||[])));this.documents.push({id:x.id||path.basename(f),technique:t,name:x.name,category:x.category||'Security',description:x.description,detection_signals:x.detection_signals||[],url:x.url||(t.startsWith('T')?'https://attack.mitre.org/techniques/'+t.replace('.','/')+'/':undefined),keywords});}catch{console.warn('[RAG] invalid knowledge document',f);}
 }
 getDocumentCount(){return this.documents.length;}
 listDocuments(){return this.documents;}
 retrieveEvidence(text:string,indicators:IndicatorRecord[],analysisId:string,userId:string):EvidenceRecord[]{const tokens=new Set((text+' '+indicators.map(i=>i.type+' '+i.title+' '+i.description).join(' ')).toLowerCase().match(/[a-z0-9.]{4,}/g)||[]);return this.documents.map(doc=>{const hits=doc.keywords.filter(k=>tokens.has(k));return{doc,hits,score:doc.keywords.length?hits.length/doc.keywords.length:0};}).filter(x=>x.hits.length>0).sort((a,b)=>b.score-a.score).slice(0,4).map(x=>({id:uuidv4(),userId,analysisId,type:'RAG / Knowledge Base',title:(x.doc.technique||'Knowledge Base')+': '+x.doc.name,description:x.doc.description+' Matched terms: '+x.hits.slice(0,5).join(', '),source:'Project Knowledge Base',sourceUrl:x.doc.url,relevanceScore:Math.round(x.score*100)/100,createdAt:new Date().toISOString()}));}
}
export const ragEngine=new RagKnowledgeEngine();
