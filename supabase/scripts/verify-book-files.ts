import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {zipSync,strToU8} from 'npm:fflate@0.8.2';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const ref='ghjdpcvnzclfvyosfhoz',url=`https://${ref}.supabase.co`;
const raw=JSON.parse(execFileSync('supabase.cmd',['projects','api-keys','--project-ref',ref,'--reveal','--output','json'],{shell:true,encoding:'utf8'}));
const keys=Array.isArray(raw)?raw:raw.api_keys||raw.keys,options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(url,keys.find((k:any)=>k.name==='service_role').api_key,options),staff=createClient(url,keys.find((k:any)=>k.name==='anon').api_key,options);
const ok=async(p:any)=>{const r=await p;if(r.error)throw new Error(r.error.message);return r.data};
const tag=`epub-${Date.now()}`,password=crypto.randomUUID()+'Verify!';
const {user}=await ok(admin.auth.admin.createUser({email:`${tag}@colearn.example`,password,email_confirm:true,user_metadata:{username:tag,full_name:'EPUB verification'}}));
let book:any;
try{
 await ok(admin.from('profiles').update({is_staff:true}).eq('id',user.id));await ok(staff.auth.signInWithPassword({email:user.email,password}));
 book=await ok(staff.from('books').insert({slug:tag,title:'EPUB verification',author:'CoLearn tests'}).select().single());
 const bytes=zipSync({'mimetype':strToU8('application/epub+zip'),'META-INF/container.xml':strToU8('<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'),'content.opf':strToU8('<package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata/><manifest><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="chapter"/></spine></package>'),'chapter.xhtml':strToU8('<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Learning</title></head><body><p>Opening a chapter does not mark it complete.</p></body></html>')},{level:0});
 const upload=async(content:Uint8Array)=>{const form=new FormData();form.append('action','upload');form.append('bookId',String(book.id));form.append('file',new File([new Uint8Array(content)],'learning.epub',{type:'application/epub+zip'}));return staff.functions.invoke('book-library',{body:form});};
 const valid=await upload(bytes);if(valid.error)throw new Error(JSON.stringify(await valid.error.context.json()));assert(valid.data.success);assert.equal(valid.data.checksum.length,64);
 const stored=await ok(staff.from('books').select('*').eq('id',book.id).single());assert.equal(stored.file_type,'epub');assert.equal(stored.status,'PENDING_REVIEW');
 const corrupt=bytes.slice();corrupt[42]^=1;assert((await upload(corrupt)).error);
 const traversal=zipSync({'mimetype':strToU8('application/epub+zip'),'../escape.txt':strToU8('invalid')},{level:0});assert((await upload(traversal)).error);
 const deleted=await staff.functions.invoke('book-library',{body:{action:'delete',bookId:book.id}});assert(!deleted.error);
 assert((await admin.storage.from('book-documents').download(stored.file_path)).error);
 console.log('PASS Live EPUB upload, checksum, corrupt/path traversal rejection, admin deletion and private-file cleanup');
}finally{
 if(book){const b=await admin.from('books').select('file_path').eq('id',book.id).maybeSingle();if(b.data?.file_path)await admin.storage.from('book-documents').remove([b.data.file_path]);await admin.from('books').delete().eq('id',book.id)}
 await admin.auth.admin.deleteUser(user.id);
}
