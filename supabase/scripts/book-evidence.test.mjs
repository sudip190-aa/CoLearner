import test from 'node:test';
import assert from 'node:assert/strict';
import {chunkText,validatedAnswer,UNCERTAIN,educationalDisclaimer,validateFileMetadata} from '../functions/_shared/book-evidence.mjs';
test('overlapping chunks preserve boundaries and all content',()=>{
  const input='A useful sentence about linked lists. '.repeat(150),chunks=chunkText(input);
  assert(chunks.length>2);assert(chunks.every(c=>c.length<=1500));
  assert(chunks[0].endsWith(chunks[1].slice(0,50))===false); // overlap is longer than a short prefix
  assert(chunks[0].includes(chunks[1].slice(0,100)));
  assert.equal(chunkText('')[0],undefined);
  assert(chunkText(('a'.repeat(50)+'😀').repeat(100)).every(c=>c.isWellFormed()));
});
test('citations can reference supplied evidence only',()=>{
  const evidence=[{id:5,chapter_id:2,page_start:25,page_end:26}];
  assert.deepEqual(validatedAnswer({supported:true,answer:'Useful answer',sources:[5,99]},evidence).citations,[{chunkId:5,chapterId:2,pageStart:25,pageEnd:26}]);
  assert.equal(validatedAnswer({supported:true,answer:'Invented',sources:[99]},evidence).answer,UNCERTAIN);
  assert.equal(validatedAnswer({supported:false,answer:'Unknown',sources:[5]},evidence).answer,UNCERTAIN);
  assert.equal(validatedAnswer({supported:true,answer:'Text',sources:[5]},[{id:5,chapter_id:2,page_start:null,page_end:null}]).citations[0].pageStart,null);
});
test('file metadata rejects traversal, MIME spoofing, oversized and unsupported files',()=>{
  assert.throws(()=>validateFileMetadata('../book.pdf','application/pdf',50,100));
  assert.throws(()=>validateFileMetadata('book.pdf','text/html',50,100));
  assert.throws(()=>validateFileMetadata('book.pdf','application/pdf',101,100));
  assert.throws(()=>validateFileMetadata('book.exe','application/pdf',50,100));
  assert.equal(validateFileMetadata('book.pdf','application/pdf',50,100).ext,'pdf');
});
test('professional advice questions receive an educational disclaimer',()=>{
  assert(educationalDisclaimer('Should I invest my retirement savings?').includes('not a'));
  assert.equal(educationalDisclaimer('Explain JavaScript arrays'),'');
});
