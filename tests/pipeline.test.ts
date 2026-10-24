import {test} from 'node:test';
import assert from 'node:assert/strict';
import {v4 as uuidv4} from 'uuid';
import {db,EmailRecord} from '../server/db.js';
import {executeThreatAnalysisPipeline} from '../server/aiService.js';
test('pipeline persists evidence-backed report and retains the source email',async()=>{
 const userId='pipeline-test-'+Date.now();
 const email:EmailRecord={id:uuidv4(),userId,senderName:'IT Support',senderEmail:'service@external.example',recipientEmail:'analyst@example.org',subject:'Mailbox review',body:'Your password session expired. Please verify your account credentials immediately.',receivedAt:new Date().toISOString(),source:'manual',hasUrls:false,hasAttachments:false,attachmentInfo:[],urls:[],createdAt:new Date().toISOString(),isStarred:false,isRead:false,folder:'inbox'};
 db.saveEmail(email);const result=await executeThreatAnalysisPipeline(email,userId);
 assert.equal(result.analysis.emailId,email.id);assert.equal(result.analysis.status,'completed');
 assert.ok(result.analysis.riskBreakdown?.some(x=>x.factor==='credential_request'&&x.applied));
 const credential=result.indicators.find(x=>x.type==='credential_request');assert.ok(credential?.textSpans?.some(span=>/password|verify|credentials|session/i.test(email.body.slice(span.start,span.end))));
 assert.ok(result.analysis.recommendedActions?.some(action=>action.includes('credentials')));
 assert.match(result.analysis.explanation,/credential|session|password|Risk score/i);
 assert.equal(db.getAnalysis(result.analysis.id,userId)?.id,result.analysis.id);
 assert.equal(db.getEmail(email.id,userId)?.folder,'inbox');
 assert.ok(result.pipelineLogs.some(x=>x.component==='report_generation'&&x.status==='completed'));
 assert.ok(result.pipelineLogs.some(x=>x.component==='threat_intelligence'&&x.status==='skipped'));
});

test('executive wire-transfer findings map exact evidence to the original body',async()=>{
 const userId='wire-span-test-'+Date.now();
 const body='Hello\n\nI am currently boarding a flight with limited connectivity. Please process an urgent wire of $48,500 to our escrow partner before 2 PM today.\n\nPlease do not contact my cell phone as I am airborne.\n\nBest regards,\nRobert Vance\nChief Executive Officer';
 const email:EmailRecord={id:uuidv4(),userId,senderName:'Robert Vance Chief Executive Officer',senderEmail:'robert@external.example',recipientEmail:'analyst@example.org',subject:'Wire transfer',body,receivedAt:new Date().toISOString(),source:'manual',hasUrls:false,hasAttachments:false,attachmentInfo:[],urls:[],createdAt:new Date().toISOString(),isStarred:false,isRead:false,folder:'inbox'};
 db.saveEmail(email);const result=await executeThreatAnalysisPipeline(email,userId);
 const allSpans=result.indicators.flatMap(f=>f.textSpans||[]);
 for(const phrase of ['urgent wire of $48,500','before 2 PM today','Please do not contact my cell phone']){
  const span=allSpans.find(item=>item.matchedText===phrase);
  assert.ok(span,'expected pipeline-supported span for '+phrase);
  assert.equal(body.slice(span.start,span.end),phrase);
  assert.ok(span.findingId);assert.ok(span.severity);assert.ok(span.reason);
 }
 assert.equal(db.getEmail(email.id,userId)?.body,body);
});
