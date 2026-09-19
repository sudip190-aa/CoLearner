import {zipSync,strToU8,unzipSync} from 'npm:fflate@0.8.2';
import {verifyZipChecksums} from './book-evidence.mjs';
function assert(value:unknown):asserts value{if(!value)throw new Error('Assertion failed')}
Deno.test('EPUB integrity validates all stored ZIP entries',()=>{
 const bytes=zipSync({'mimetype':strToU8('application/epub+zip'),'META-INF/container.xml':strToU8('<container><rootfiles><rootfile full-path="content.opf"/></rootfiles></container>'),'content.opf':strToU8('<package version="3.0"></package>')},{level:0});
 verifyZipChecksums(bytes,unzipSync(bytes));
 const corrupt=bytes.slice();corrupt[42]^=1;
 let failed=false;try{verifyZipChecksums(corrupt,unzipSync(corrupt))}catch{failed=true}assert(failed);
});
Deno.test('EPUB truncated ZIP files are rejected',()=>{
 let failed=false;try{verifyZipChecksums(new Uint8Array([1,2,3]),{})}catch{failed=true}assert(failed);
});
