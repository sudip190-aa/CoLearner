import {randomBytes} from 'node:crypto';
import {writeFileSync,unlinkSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
// Keep provisioning material in the already-ignored workspace folder and remove it immediately.
mkdirSync('.dist',{recursive:true});
const secret=randomBytes(40).toString('hex');
const env='.dist/book-worker.env',sql='.dist/book-worker-secret.sql';
try {
  writeFileSync(env,`BOOK_WORKER_SECRET=${secret}\n`);
  execFileSync('supabase.cmd',['secrets','set','--project-ref','ghjdpcvnzclfvyosfhoz','--env-file',env],{shell:true,stdio:'pipe'});
  writeFileSync(sql,`do $$ declare v uuid;begin select id into v from vault.secrets where name='book_worker_secret';if v is null then perform vault.create_secret('${secret}','book_worker_secret');else perform vault.update_secret(v,'${secret}');end if;end $$;`);
  execFileSync('supabase.cmd',['db','query','--linked','--file',sql],{shell:true,stdio:'pipe'});
  console.log('Book worker credential configured in Edge secrets and Vault.');
} finally {for(const p of [env,sql])try{unlinkSync(p)}catch{}}
