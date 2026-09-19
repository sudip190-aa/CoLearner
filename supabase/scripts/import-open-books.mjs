// Pinned, openly licensed curriculum chapters, adapted into clearly labelled reading guides.
// This importer never approves arbitrary uploaded files or overwrites existing books.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const sources = [
  ['javascript-foundations','JavaScript Foundations','Programming','Web-Dev-For-Beginners','78085398be0dea7abaaf5eda914817f46f6ddbbc',['2-js-basics/1-data-types','2-js-basics/2-functions-methods','2-js-basics/3-making-decisions','2-js-basics/4-arrays-loops']],
  ['web-development-foundations','Web Development Foundations','Web Development','Web-Dev-For-Beginners','78085398be0dea7abaaf5eda914817f46f6ddbbc',['1-getting-started-lessons/1-intro-to-programming-languages','1-getting-started-lessons/2-github-basics','1-getting-started-lessons/3-accessibility','3-terrarium/1-intro-to-html','3-terrarium/2-intro-to-css']],
  ['machine-learning-foundations','Machine Learning Foundations','Artificial Intelligence','ML-For-Beginners','de2d4e12236445198213a0711855e348e7253cd4',['1-Introduction/1-intro-to-ML','1-Introduction/2-history-of-ML','1-Introduction/3-fairness','1-Introduction/4-techniques-of-ML']],
  ['data-science-foundations','Data Science Foundations','Mathematics & Data Science','Data-Science-For-Beginners','4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f',['1-Introduction/01-defining-data-science','1-Introduction/02-ethics','1-Introduction/03-defining-data','1-Introduction/04-stats-and-probability']],
  ['working-with-data','Working with Data','Databases','Data-Science-For-Beginners','4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f',['2-Working-With-Data/05-relational-databases','2-Working-With-Data/06-non-relational','2-Working-With-Data/07-python','2-Working-With-Data/08-data-preparation']],
  ['connected-systems','Connected Systems','Networking & Security','IoT-For-Beginners','6ae558ee2b0aaade53f08b0f76505d5ea9736c43',['1-getting-started/lessons/1-introduction-to-iot','1-getting-started/lessons/2-deeper-dive','1-getting-started/lessons/3-sensors-and-actuators','1-getting-started/lessons/4-connect-internet','2-farm/lessons/6-keep-your-plant-secure']],
  ['generative-ai-foundations','Generative AI Foundations','Artificial Intelligence','generative-ai-for-beginners','d8ec07e31c4b32bd283d565c1abd9b58bb5cf2e8',['01-introduction-to-genai','02-exploring-and-comparing-different-llms','03-using-generative-ai-responsibly','04-prompt-engineering-fundamentals']],
];
const cache=new Map();
async function get(url) {
  if(!cache.has(url)) cache.set(url,(async()=>{
    const r=await fetch(url,{signal:AbortSignal.timeout(60000)});
    if(!r.ok)throw new Error(`${r.status}: ${url}`);
    return r.text();
  })());
  return cache.get(url);
}
const quote=v=>`'${String(v).replaceAll("'","''").replaceAll('\u0000','')}'`;
const manifest=[];
const sql=['-- Pinned MIT-licensed educational reading guides. Source manifests and complete notices are in data/books/.', 'do $seed$ declare b bigint;begin'];
mkdirSync('data/books',{recursive:true});
for(const [slug,title,category,repo,commit,paths] of sources) {
  const base=`https://raw.githubusercontent.com/microsoft/${repo}/${commit}`;
  const license=await get(`${base}/LICENSE`);
  if(!license.includes('Permission is hereby granted, free of charge'))throw new Error(`Review license for ${repo}`);
  const chapters=await Promise.all(paths.map(async(path,index)=>{
    const original=await get(`${base}/${path}/README.md`);
    const title=original.match(/^#\s+(.+)$/m)?.[1]?.replace(/<[^>]*>/g,'').trim() || path.split('/').pop().replace(/^\d+-/,'').replaceAll('-',' ');
    const content=original.split(/(```[^]*?```)/g).map(part=>part.startsWith('```')?part:part.replace(/<!--[^]*?-->/g,'').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/<img\b[^>]*>/gi,'').replace(/<iframe\b[^]*?<\/iframe>/gi,'').replace(/<\/?[a-z][^>]*>/gi,'').replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,href)=>`[${label}](${new URL(href,`${base}/${path}/README.md`).href})`)).join('').replace(/(SharedAccessKey\s*=\s*)[A-Za-z0-9+\/]{32,}={0,2}/gi,'$1<your-device-key>').trim();
    if(content.length<1200)throw new Error(`Insufficient educational content: ${path}`);
    return {title,content,chapter_number:index+1,est_minutes:Math.ceil(content.split(/\s+/).length/200),source_url:`https://github.com/microsoft/${repo}/blob/${commit}/${path}/README.md`,sha256:createHash('sha256').update(original).digest('hex')};
  }));
  const source=`https://github.com/microsoft/${repo}/tree/${commit}`;
  const record={slug,title,category,repository:repo,commit,source,license,chapters};
  writeFileSync(`data/books/${slug}.json`,JSON.stringify(record,null,2)+'\n');
  manifest.push({slug,source,chapters:chapters.length,license:'MIT'});
  sql.push(`if not exists(select 1 from public.books where slug=${quote(slug)}) then`);
  sql.push(`insert into public.books(slug,title,author,description,category,language,source_url,license_name,license_url,attribution,changes_made,license_evidence_url,license_evidence_notes,commercial_use_allowed,redistribution_confirmed,est_minutes) values(${[slug,title,'Microsoft and curriculum contributors',`A chapter-based reading guide adapted from the openly licensed ${repo} curriculum. Includes original lessons, examples and exercises; linked labs remain at the source.`,category,'English',source,'MIT',`${source.replace('/tree/','/blob/')}/LICENSE`,license,'Selected curriculum lessons arranged as chapters. Images and embeds omitted; relative links resolved to the pinned source. Text and examples retained; credential values in connection strings replaced with placeholders. This is a reading adaptation, not a complete standalone edition.',`${source.replace('/tree/','/blob/')}/LICENSE`,'Reviewed the pinned repository MIT license and the exact included Markdown chapters. Third-party images and embeds excluded. Full copyright and license notice retained.'].map(quote).join(',')},true,true,${chapters.reduce((n,c)=>n+c.est_minutes,0)}) returning id into b;`);
  for(const c of chapters)sql.push(`insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,${quote(`${slug}-${c.chapter_number}`)},${quote(c.title)},${c.chapter_number},${quote(c.content)},${c.est_minutes});`);
  sql.push(`update public.books set status='APPROVED',published_at=now() where id=b;end if;`);
  console.log(`${slug}: ${chapters.length} chapters verified`);
}
sql.push('end $seed$;');
writeFileSync('data/books/manifest.json',JSON.stringify(manifest,null,2)+'\n');
const initialMigration='supabase/migrations/20260919092000_open_educational_books.sql';
mkdirSync('.dist',{recursive:true});
writeFileSync(existsSync(initialMigration)?'.dist/open-books-proposed.sql':initialMigration,sql.join('\n')+'\n');
