// Optional administrator verification helper. The installed cron handles normal operation.
import {createClient} from '../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
const ref='ghjdpcvnzclfvyosfhoz',url=`https://${ref}.supabase.co`;
const raw=JSON.parse(execFileSync('supabase.cmd',['projects','api-keys','--project-ref',ref,'--reveal','--output','json'],{shell:true,encoding:'utf8'}));
const keys=Array.isArray(raw)?raw:raw.api_keys||raw.keys,options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(url,keys.find(k=>k.name==='service_role').api_key,options),staff=createClient(url,keys.find(k=>k.name==='anon').api_key,options);
const ok=async p=>{const r=await p;if(r.error)throw new Error(r.error.message);return r.data};
const tag=`book-index-${Date.now()}`,password=randomUUID()+'Verify!';
const {user}=await ok(admin.auth.admin.createUser({email:`${tag}@colearn.example`,password,email_confirm:true,user_metadata:{username:tag,full_name:'Book indexing verification'}}));
try{
 await ok(admin.from('profiles').update({is_staff:true}).eq('id',user.id));await ok(staff.auth.signInWithPassword({email:user.email,password}));
 const slugs=JSON.parse(readFileSync('data/books/manifest.json','utf8')).map(b=>b.slug);
 const books=await ok(admin.from('books').select('*').in('slug',slugs));
 const outcomes=await Promise.allSettled(books.map(async b=>{
   let jobs=await ok(admin.from('book_jobs').select('*').eq('book_id',b.id).in('status',['queued','processing']).order('created_at',{ascending:false}).limit(1));
   if(!jobs.length && b.ai_status==='READY'){console.log(`${b.title}: already ready`);return}
   let id=jobs[0]?.id;
   if(!id)id=await ok(staff.rpc('colearn_queue_book',{book:b.id}));
   for(let n=0;n<900;n++){
     const j=await ok(admin.from('book_jobs').select('status,stage,cursor,error').eq('id',id).single());
     if(j.status==='completed'){console.log(`${b.title}: ready (${j.cursor} chunks)`);return}
     if(j.status==='failed')throw new Error(`${b.title}: ${j.error}`);
     const r=await staff.functions.invoke('book-worker',{body:{jobId:id}});
     if(r.error)console.log(`${b.title}: waiting for automatic retry`);
     await new Promise(r=>setTimeout(r,300));
   }
   throw new Error(`${b.title}: verification deadline reached; cron remains scheduled`);
 }));
 for(const outcome of outcomes)if(outcome.status==='rejected'){console.error(outcome.reason.message);process.exitCode=1}
}finally{await admin.auth.admin.deleteUser(user.id)}
