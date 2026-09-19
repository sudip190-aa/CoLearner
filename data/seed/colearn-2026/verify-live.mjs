import {createClient} from '../../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const cli=args=>execFileSync('supabase.cmd',args,{shell:true,encoding:'utf8',maxBuffer:30*1024*1024});
const raw=JSON.parse(cli(['projects','api-keys','--project-ref','ghjdpcvnzclfvyosfhoz','--reveal','--output','json']));
const keys=Array.isArray(raw)?raw:raw.api_keys||raw.keys;
const db=createClient('https://ghjdpcvnzclfvyosfhoz.supabase.co',keys.find(k=>k.name==='service_role').api_key,{auth:{persistSession:false,autoRefreshToken:false}});
const ok=async p=>{const r=await p;if(r.error)throw Error(r.error.message);return r.data;};
const before=JSON.parse(readFileSync('.dist/data-before.json','utf8'));
const expected=JSON.parse(readFileSync('.dist/data-generated.json','utf8'));
const cleanup=JSON.parse(readFileSync('.dist/data-cleanup.json','utf8'));
const catalog=JSON.parse(cli(['db','query','--linked','--file','.dist/data-catalog.sql'])).rows[0].catalog;
const canon=value=>Array.isArray(value)?value.map(canon):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canon(value[k])])):typeof value==='string'&&/^\d{4}-\d\d-\d\d(?:T.*(?:Z|[+]\d\d:\d\d))?$/.test(value)?new Date(value).toISOString():value;
const serial=value=>JSON.stringify(canon(value));
const sortRows=rows=>rows.map(serial).sort();
const key=(table,row)=>table==='thread_tags'?`${row.thread_id}/${row.tag_id}`:table==='thread_views'?`${row.thread_id}/${row.user_id}/${row.viewed_on}`:String(row.id);
for(const part of ['columns','constraints','indexes','policies','triggers','functions'])assert.deepEqual(sortRows(catalog[part]),sortRows(before.catalog[part]),`${part} unchanged`);
const tables={};
const results=[];
for(const table of Object.keys(before.tables)){
 tables[table]=[];
 const order=table==='thread_tags'?['thread_id','tag_id']:table==='thread_views'?['thread_id','user_id','viewed_on']:['id'];
 for(let offset=0;;offset+=1000){let q=db.from(table).select('*').range(offset,offset+999);for(const col of order)q=q.order(col);const rows=await ok(q);tables[table].push(...rows);if(rows.length<1000)break;}
 const index=new Map(tables[table].map(row=>[key(table,row),row]));
 const removed=new Set((cleanup.rows[table]||[]).map(row=>key(table,row)));
 for(const row of before.tables[table]){
  if(removed.has(key(table,row)))assert(!index.has(key(table,row)),`${table} planned removal`);
  else assert.equal(serial(index.get(key(table,row))),serial(row),`${table} original row preserved`);
 }
 for(const row of expected[table]||[]){
  const actual=index.get(key(table,row));assert(actual,`${table} new row exists`);
  assert.equal(serial(Object.fromEntries(Object.keys(row).map(k=>[k,actual[k]]))),serial(row),`${table} CSV values match`);
 }
 assert.equal(tables[table].length,before.tables[table].length-removed.size+(expected[table]?.length||0),`${table} exact count`);
 results.push({table,before:before.tables[table].length,removed:removed.size,added:expected[table]?.length||0,after:tables[table].length});
}
let users=[];for(let page=1;;page++){const list=(await ok(db.auth.admin.listUsers({page,perPage:1000}))).users;users.push(...list);if(list.length<1000)break;}
for(const p of expected.profiles){const u=users.find(u=>u.id===p.id);assert(u?.app_metadata?.demo_dataset==='colearn-2026'&&u.app_metadata.synthetic===true);assert(new Date(u.banned_until)>new Date());assert(!u.last_sign_in_at);}
const xps=new Map();for(const e of tables.xp_events)xps.set(e.user_id,(xps.get(e.user_id)||0)+e.amount);
for(const p of expected.profiles){assert.equal(p.xp,xps.get(p.id));assert.equal(p.level,Math.floor(Math.sqrt(p.xp/50))+1);}
writeFileSync('.dist/data-after.json',JSON.stringify({captured_at:new Date().toISOString(),catalog,tables}));
writeFileSync('data/seed/colearn-2026/verification.json',JSON.stringify({verified_at:new Date().toISOString(),status:'passed',schema_unchanged:true,library_unchanged:true,original_accounts_preserved:before.tables.profiles.length,fictional_auth_accounts_banned:expected.profiles.length,counts:results},null,2)+'\n');
console.log(JSON.stringify(results,null,2));
console.log('PASS: exact CSV values, protected rows, counts, schema/RLS/triggers, library, XP and banned fictional identities.');
