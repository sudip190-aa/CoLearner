import { AiDocumentService, type DocumentProvider } from './AiDocumentService.ts';
const evidence=[{id:17,content:'Each node stores a value and a reference to the next node.',chapter_id:2,page_start:25,page_end:25}];
function assert(value:unknown,message='Assertion failed'): asserts value {if(!value)throw new Error(message)}
Deno.test('provider adapter preserves validated evidence citations',async()=>{
  const provider:DocumentProvider={generate:async(instructions,question,chunks)=>{
    assert(instructions.includes('ONLY'));assert(question==='Explain a linked list');assert(chunks.length===1&&chunks[0].id===17);
    return {value:{supported:true,answer:'A node points to the next node.',sources:[17]},inputTokens:50,outputTokens:20};
  }};
  const result=await new AiDocumentService(provider).answer('Explain a linked list',evidence);
  assert(result.citations[0].pageStart===25);assert(result.inputTokens===50);
});
Deno.test('unsupported provider answers and invented citations become uncertainty',async()=>{
  const provider:DocumentProvider={generate:async()=>({value:{supported:true,answer:'Invented claim',sources:[999]},inputTokens:1,outputTokens:1})};
  const result=await new AiDocumentService(provider).answer('Unknown question',evidence);
  assert(result.answer.includes('not find enough evidence'));assert(result.citations.length===0);
});
Deno.test('summary uses the same evidence validation as questions',async()=>{
  const provider:DocumentProvider={generate:async()=>({value:{supported:true,answer:'Overview: nodes connect values.',sources:[17]},inputTokens:5,outputTokens:5})};
  const result=await new AiDocumentService(provider).summarize(evidence);
  assert(result.citations[0].chunkId===17);
});
