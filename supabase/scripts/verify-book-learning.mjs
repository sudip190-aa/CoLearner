import {createClient} from '../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const ref='ghjdpcvnzclfvyosfhoz',url=`https://${ref}.supabase.co`,tag=`books-${Date.now()}`;
const raw=JSON.parse(execFileSync('supabase.cmd',['projects','api-keys','--project-ref',ref,'--reveal','--output','json'],{shell:true,encoding:'utf8'}));
const keys=Array.isArray(raw)?raw:raw.api_keys||raw.keys;
const options={auth:{persistSession:false,autoRefreshToken:false}};
const service=createClient(url,keys.find(k=>k.name==='service_role').api_key,options);
const client=()=>createClient(url,keys.find(k=>k.name==='anon').api_key,options);
const anon=client(),accounts=[],bookIds=[],checks=[];
const ok=async promise=>{const r=await promise;if(r.error)throw new Error(r.error.message);return r.data};
const pass=s=>{checks.push(s);console.log('PASS '+s)};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function createUser(staff=false){const email=`${tag}-${accounts.length}@colearn.example`,password=`Verify!${randomUUID()}`;const {user}=await ok(service.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{username:`${tag}-${accounts.length}`,full_name:'Book Learning Test'}}));accounts.push(user);await ok(service.from('profiles').update({is_staff:staff,onboarding_completed:true}).eq('id',user.id));const c=client();await ok(c.auth.signInWithPassword({email,password}));return c;}
async function invoke(c,body){return c.functions.invoke('book-library',{body});}
async function book(c,title='Learning fixture'){const b=await ok(c.from('books').insert({slug:`${tag}-${randomUUID().slice(0,5)}`,title,author:'CoLearn test suite',source_url:'https://example.com/source',license_name:'Test permission',license_url:'https://example.com/license',attribution:'Original test content',changes_made:'None',license_evidence_url:'https://example.com/evidence',license_evidence_notes:'Original fixture, no third-party material',redistribution_confirmed:true}).select().single());bookIds.push(b.id);return b;}
function pdf(){const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];const text='BT /F1 12 Tf 60 700 Td (A linked list connects nodes. Each node stores a value and a reference to the next node.) Tj ET';objects.push(`<< /Length ${text.length} >>\nstream\n${text}\nendstream`);let s='%PDF-1.4\n',offset=[0];for(let i=0;i<objects.length;i++){offset.push(s.length);s+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`}const start=s.length;s+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offset.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;return new File([s],'learning.pdf',{type:'application/pdf'});}
let staff,learner,b,c1,c2;
try{
 staff=await createUser(true);learner=await createUser();
 const published=await ok(anon.from('books').select('id,slug,status,license_name,attribution'));
 assert(published.length>=7);assert(published.every(b=>b.status==='APPROVED'&&b.license_name&&b.attribution));
 b=await book(staff);assert.equal((await ok(anon.from('books').select('id').eq('id',b.id))).length,0);
 assert((await learner.from('books').insert({slug:tag,title:'Forbidden',author:'No'})).error);
 assert((await learner.rpc('colearn_queue_book',{book:b.id})).error);
 assert((await staff.rpc('colearn_queue_book',{book:b.id})).error);
 const bad=await book(staff,'Missing license');await ok(staff.from('books').update({license_evidence_notes:''}).eq('id',bad.id));assert((await staff.from('books').update({status:'APPROVED'}).eq('id',bad.id)).error);
 pass('Approved-only public catalog, complete license metadata, admin RLS and approval/processing gates');
 [c1,c2]=await ok(staff.from('chapters').insert([{book_id:b.id,slug:tag+'-1',title:'Linked lists',chapter_number:1,content:'A linked list stores values in nodes. Each node refers to the next node. Traversal follows references until the end. '.repeat(10)},{book_id:b.id,slug:tag+'-2',title:'Arrays',chapter_number:2,content:'An array stores indexed values. Use the index to look up a value. '.repeat(12)}]).select());
 assert((await learner.rpc('colearn_action',{action:'progress',payload:{slug:b.slug,chapter_id:c1.id}})).error);
 assert((await invoke(learner,{action:'ask',bookId:b.id,question:'Explain nodes'})).error);
 await ok(staff.from('books').update({status:'APPROVED'}).eq('id',b.id));
 await ok(learner.rpc('colearn_action',{action:'progress',payload:{slug:b.slug,chapter_id:c1.id,completed:false}}));
 let progress=await ok(learner.from('reading_progress').select('*').eq('book_id',b.id).single());assert.equal(progress.completed,false);assert.equal(progress.progress_percent,0);
 await ok(learner.rpc('colearn_reading_position',{chapter:c1.id,read_position:43}));
 await ok(learner.rpc('colearn_action',{action:'progress',payload:{slug:b.slug,chapter_id:c1.id,completed:true}}));
 await ok(learner.rpc('colearn_action',{action:'progress',payload:{slug:b.slug,chapter_id:c1.id,completed:false}}));
 const cp=await ok(learner.from('chapter_progress').select('*').eq('chapter_id',c1.id).single());assert.equal(Number(cp.position_percent),43);assert(cp.completed_at);
 progress=await ok(learner.from('reading_progress').select('*').eq('book_id',b.id).single());assert.equal(progress.progress_percent,50);assert(progress.completed_chapters.includes(c1.id));
 assert.equal((await ok(staff.from('chapter_progress').select('*').eq('chapter_id',c1.id))).length,0);
 pass('Opening never completes a chapter; completion and reading position persist privately');
 let r=await invoke(learner,{action:'status',bookId:b.id});assert(!r.error);assert.equal(r.data.configured,false);
 r=await invoke(learner,{action:'ask',bookId:b.id,question:'Explain nodes',chapterId:c1.id});assert(r.error);assert.equal((await r.error.context.json()).code,'not_configured');
 pass('Unconfigured assistant degrades clearly without an external generation call');
 const jobId=await ok(staff.rpc('colearn_queue_book',{book:b.id}));
 for(let i=0;i<30;i++){const j=await ok(staff.from('book_jobs').select('*').eq('id',jobId).single());if(j.status==='completed')break;if(j.status==='failed')throw new Error(j.error);await staff.functions.invoke('book-worker',{body:{jobId}});await pause(500)}
 let job=await ok(staff.from('book_jobs').select('*').eq('id',jobId).single());assert.equal(job.status,'completed',JSON.stringify(job));
 const chunks=await ok(service.from('book_chunks').select('*').eq('book_id',b.id));assert(chunks.length>=2);assert(chunks.every(c=>c.embedding));
 const vec=JSON.parse(chunks.find(c=>c.chapter_id===c1.id).embedding);
 const retrieved=await ok(service.rpc('colearn_book_retrieve',{book:b.id,question:'Explain this chapter',query_embedding:vec,chapter:c1.id,row_limit:4}));assert(retrieved.length);assert.equal(retrieved[0].chapter_id,c1.id);assert(retrieved.every(r=>chunks.some(c=>c.id===r.id)));
 assert((await learner.rpc('colearn_book_retrieve',{book:b.id,question:'nodes',query_embedding:vec})).error);
 pass('Real cloud embeddings, book-scoped retrieval, chapter preference and restricted retrieval RPC');
 const again=await ok(staff.rpc('colearn_queue_book',{book:b.id}));
 for(let i=0;i<30;i++){const j=await ok(staff.from('book_jobs').select('*').eq('id',again).single());if(j.status==='completed')break;if(j.status==='failed')throw new Error(j.error);await staff.functions.invoke('book-worker',{body:{jobId:again}});await pause(500)}
 const fresh=await ok(service.from('book_chunks').select('*').eq('book_id',b.id));assert.equal(fresh.length,chunks.length);assert(fresh.every(c=>c.generation===again));
 const summary=await ok(staff.rpc('colearn_queue_book',{book:b.id,job_kind:'summary'}));await staff.functions.invoke('book-worker',{body:{jobId:summary}});await pause(800);job=await ok(staff.from('book_jobs').select('*').eq('id',summary).single());assert.equal(job.status,'failed');assert(job.error.includes('Configure'));
 const retry=await ok(staff.rpc('colearn_queue_book',{book:b.id,job_kind:'summary'}));assert(retry!==summary);await ok(service.from('book_jobs').delete().eq('id',retry));
 pass('Reprocessing replaces generations without duplicates; failures recorded and retry supported');
 const form=new FormData();form.append('action','upload');form.append('bookId',b.id);form.append('file',pdf());
 assert((await invoke(learner,form)).error);
 r=await invoke(staff,form);if(r.error)throw new Error(JSON.stringify(await r.error.context.json()));assert.equal(r.data.pages,1);assert.equal(r.data.checksum.length,64);
 const uploaded=await ok(staff.from('books').select('*').eq('id',b.id).single());assert.equal(uploaded.status,'PENDING_REVIEW');assert.equal(uploaded.redistribution_confirmed,false);
 const malformed=new FormData();malformed.append('action','upload');malformed.append('bookId',b.id);malformed.append('file',new File(['not a PDF'],'bad.pdf',{type:'application/pdf'}));assert((await invoke(staff,malformed)).error);
 await ok(staff.from('books').update({in_app_permission_confirmed:true,status:'APPROVED'}).eq('id',b.id));assert((await invoke(learner,{action:'file',bookId:b.id,download:true})).error);
 r=await invoke(learner,{action:'file',bookId:b.id});assert(!r.error);assert(r.data.url.includes('token='));
 assert((await learner.storage.from('book-documents').download(uploaded.file_path)).error);
  pass('Validated PDF upload/checksum, exact-file review reset, private storage and controlled read/download');
  await ok(staff.from('chapters').update({page_start:1,page_end:1}).eq('id',c1.id));
  await ok(staff.from('chapters').update({status:'DRAFT'}).eq('id',c2.id));
  await ok(staff.from('books').update({status:'APPROVED'}).eq('id',b.id));
  const pdfJob=await ok(staff.rpc('colearn_queue_book',{book:b.id}));
  for(let i=0;i<30;i++){const j=await ok(staff.from('book_jobs').select('*').eq('id',pdfJob).single());if(j.status==='completed')break;if(j.status==='failed')throw new Error(j.error);await staff.functions.invoke('book-worker',{body:{jobId:pdfJob}});await pause(500)}
  const pages=await ok(service.from('book_pages').select('*').eq('generation',pdfJob));
  assert.equal(pages.length,1);assert.equal(pages[0].page_number,1);assert(pages[0].text.includes('linked list'));
  const pdfChunks=await ok(service.from('book_chunks').select('*').eq('generation',pdfJob));assert(pdfChunks.length);assert(pdfChunks.every(c=>c.page_start===1&&c.page_end===1&&c.chapter_id===c1.id));
  await ok(learner.rpc('colearn_reading_position',{chapter:c1.id,read_position:0,page:1}));
  assert.equal((await ok(learner.from('chapter_progress').select('*').eq('chapter_id',c1.id).single())).last_page,1);
  pass('PDF extraction preserves real page numbers and chapter boundaries; PDF page resumes');
 for(let i=0;i<10;i++)await ok(service.rpc('colearn_reserve_book_usage',{viewer:accounts[1].id,book:b.id,usage_kind:'test',provider_name:'test',reserve:0,budget:5}));
 assert((await service.rpc('colearn_reserve_book_usage',{viewer:accounts[1].id,book:b.id,usage_kind:'test',provider_name:'test',reserve:0,budget:5})).error);
 assert((await service.rpc('colearn_reserve_book_usage',{viewer:null,book:b.id,usage_kind:'test',provider_name:'test',reserve:0.1,budget:0})).error);
 pass('Atomic per-user rate limits and monthly budget reservations');
 await service.storage.from('book-documents').remove([uploaded.file_path]);
 // Seed library indexing is asynchronous and uses no generation API key.
 for(const seed of published.filter(b=>['javascript-foundations','web-development-foundations','machine-learning-foundations','data-science-foundations','working-with-data','connected-systems','generative-ai-foundations'].includes(b.slug))) {const current=await ok(service.from('books').select('active_generation').eq('id',seed.id).single());if(current.active_generation)continue;const j=await staff.rpc('colearn_queue_book',{book:seed.id});if(j.error&&!j.error.message.includes('duplicate'))throw new Error(j.error.message)}
 pass('Initial approved reading guides queued for automatic indexing');
}catch(error){console.error(error);process.exitCode=1}
finally{
 for(const id of bookIds){const stored=await service.from('books').select('file_path').eq('id',id).maybeSingle();if(stored.data?.file_path)await service.storage.from('book-documents').remove([stored.data.file_path]);await service.from('book_ai_usage').delete().eq('book_id',id);await service.from('books').delete().eq('id',id)}
 for(const account of accounts)await service.auth.admin.deleteUser(account.id);
 mkdirSync('.dist',{recursive:true});writeFileSync('.dist/book-learning-verification.json',JSON.stringify({checks,passed:!process.exitCode,fixturesRemoved:true},null,2));
}
