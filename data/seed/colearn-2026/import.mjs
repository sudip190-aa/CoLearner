// Run from repository root. Secrets are fetched into memory, never printed/saved.
// This script imports only this reviewed dataset into the explicitly linked project.
import {createClient} from '../../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const ref='ghjdpcvnzclfvyosfhoz';
const cli=(args)=>execFileSync('supabase.cmd',args,{shell:true,encoding:'utf8',maxBuffer:40*1024*1024});
const keyResult=JSON.parse(cli(['projects','api-keys','--project-ref',ref,'--reveal','--output','json']));
const keys=Array.isArray(keyResult)?keyResult:keyResult.api_keys||keyResult.keys;
const db=createClient(`https://${ref}.supabase.co`,keys.find(k=>k.name==='service_role').api_key,{auth:{persistSession:false,autoRefreshToken:false}});
const manifest=JSON.parse(readFileSync('data/seed/colearn-2026/manifest.json','utf8'));
const data=JSON.parse(readFileSync('.dist/data-generated.json','utf8'));
const expect=async promise=>{const r=await promise;if(r.error)throw Error(r.error.message);return r.data;};
const firstProject=data.projects[0];
const already=await expect(db.from('projects').select('id,slug,owner_id').eq('id',firstProject.id).maybeSingle());
if(already?.slug===firstProject.slug&&already.owner_id===firstProject.owner_id){
 throw Error('Dataset already imported. Run verify-live.mjs instead of replaying the import.');
}
const provisioned=[];
for(const p of data.profiles){
 const existing=await db.auth.admin.getUserById(p.id);
 if(existing.data?.user){
  if(existing.data.user.app_metadata?.demo_dataset!==manifest.dataset)throw Error('Refusing to reuse an unrelated account');
 }else{
  await expect(db.auth.admin.createUser({id:p.id,email:`demo-${p.id}@colearn.example`,password:randomBytes(48).toString('base64url'),email_confirm:true,ban_duration:'876000h',
   user_metadata:{username:p.username,full_name:p.full_name},app_metadata:{demo_dataset:manifest.dataset,synthetic:true}}));
 }
 provisioned.push(p.id);
 if(provisioned.length%25===0)console.log(`Provisioned ${provisioned.length}/${data.profiles.length} fictional identities (login disabled).`);
}
writeFileSync('.dist/data-provisioned.json',JSON.stringify({dataset:manifest.dataset,ids:provisioned}));
console.log('Uploading small batches to private import staging...');
cli(['db','query','--linked','--file','.dist/data-stage-init.sql']);
const stageFiles=JSON.parse(readFileSync('.dist/data-stage-files.json','utf8'));
for(const [i,file] of stageFiles.entries()){
 cli(['db','query','--linked','--file',file]);
 if((i+1)%10===0)console.log(`Uploaded ${i+1}/${stageFiles.length} private staging batches.`);
}
console.log('Importing CSV data in one guarded transaction...');
const output=cli(['db','query','--linked','--file','.dist/data-import.sql']);
writeFileSync('.dist/data-import-result.json',output);
console.log('Cloud import finished. Running independent verification is required.');
