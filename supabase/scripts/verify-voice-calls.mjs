// Run from repository root with Vite on :5176 and isolated Chromium CDP on :9224.
// Chromium flags: --headless=new --use-fake-device-for-media-stream
// --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required
// Creates disposable users, verifies live RLS + real WebRTC transport, cleans up.
import { createClient } from '../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const ref = 'ghjdpcvnzclfvyosfhoz', origin = 'http://127.0.0.1:5176'
const raw = JSON.parse(execFileSync('supabase.cmd', ['projects','api-keys','--project-ref',ref,'--reveal','--output','json'], { shell:true, encoding:'utf8' }))
const keys = Array.isArray(raw) ? raw : raw.api_keys || raw.keys
const options = { auth: { persistSession:false, autoRefreshToken:false } }
const client = () => createClient(`https://${ref}.supabase.co`, keys.find(k=>k.name==='anon').api_key, options)
const admin = createClient(`https://${ref}.supabase.co`, keys.find(k=>k.name==='service_role').api_key, options)
const ok = async q => { const {data,error}=await q; if(error) throw new Error(error.message); return data }
const pause = ms => new Promise(r=>setTimeout(r,ms))
const accounts=[], contexts=[], clients=[], channels=[], checks=[], errors=[], badNetwork=[], expectedNetwork=[]
const pass = label => { checks.push(label); console.log('PASS '+label) }
const tag=`voice-${Date.now()}`
const browserInfo=await (await fetch('http://127.0.0.1:9224/json/version')).json()
const ws=new WebSocket(browserInfo.webSocketDebuggerUrl)
await new Promise(r=>ws.addEventListener('open',r,{once:true}))
let seq=0
const pending=new Map()
ws.addEventListener('message',({data})=>{
  const m=JSON.parse(data)
  if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result)}
  else if(m.method==='Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)
  else if(m.method==='Runtime.consoleAPICalled' && m.params.type==='error') errors.push(m.params.args.map(a=>a.value||a.description||'').join(' '))
  else if(m.method==='Network.responseReceived' && m.params.response.status>=400) badNetwork.push({status:m.params.response.status,path:new URL(m.params.response.url).pathname})
})
const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params,sessionId}))})
const instrument=`(() => {
  if (!navigator.mediaDevices?.getUserMedia) return;
  window.voiceTest={pcs:[],tracks:[]};
  const Original=window.RTCPeerConnection;
  window.RTCPeerConnection=class extends Original { constructor(...args){super(...args);window.voiceTest.pcs.push(this)} };
  const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async (...args)=>{const stream=await get(...args);window.voiceTest.tracks.push(...stream.getTracks());return stream};
})()`
async function page(account,peer,contextId){
  if(!contextId){contextId=(await send('Target.createBrowserContext')).browserContextId;contexts.push(contextId)}
  const {targetId}=await send('Target.createTarget',{url:'about:blank',browserContextId:contextId})
  const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true})
  const cmd=(m,p={})=>send(m,p,sessionId)
  const evaluate=async e=>{const r=await cmd('Runtime.evaluate',{expression:`(async()=>(${e}))()`,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
  const wait=async(e,n=120)=>{for(let i=0;i<n;i++){try{if(await evaluate(e))return}catch{}await pause(250)}throw new Error('Timed out: '+e+' UI: '+(await evaluate('document.body.innerText')).slice(-1800))}
  const click=async label=>{await wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()===${JSON.stringify(label)}&&!b.disabled)`);return evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`)}
  const fill=(selector,value)=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}))})()`)
  await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Network.enable')
  await cmd('Page.addScriptToEvaluateOnNewDocument',{source:instrument})
  await cmd('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false})
  await cmd('Page.navigate',{url:origin+'/login'})
  await wait("!!document.querySelector('input[type=email]') || location.pathname==='/dashboard'")
  if(await evaluate("location.pathname==='/login'")){
    await fill('input[type=email]',account.email);await fill('input[type=password]',account.password)
    await evaluate("document.querySelector('form').requestSubmit()")
    await wait("location.pathname==='/dashboard'")
  }
  await cmd('Page.navigate',{url:origin+'/messages?to='+peer.id})
  await wait("!!document.querySelector('button[aria-label^=\"Voice call\"]:not(:disabled)')")
  const call=()=>evaluate("document.querySelector('button[aria-label^=\"Voice call\"]').click()")
  const connected=()=>wait("document.querySelector('[aria-label=\"Voice call\"] [role=status]')?.textContent.includes('Connected')")
  const idle=()=>wait("!document.querySelector('section[aria-label=\"Voice call\"]') && !document.querySelector('[role=dialog]')")
  const clean=async()=>{await idle();assert(await evaluate("voiceTest.pcs.every(p=>p.connectionState==='closed') && voiceTest.tracks.every(t=>t.readyState==='ended')"),'WebRTC/microphone leaked');await wait("import('/src/services/supabase/client.js').then(({supabase})=>supabase.getChannels().every(c=>!c.topic.startsWith('realtime:voice:')))")}
  const screenshot=async name=>{const {data}=await cmd('Page.captureScreenshot',{format:'png'});writeFileSync(`.dist/${name}.png`,Buffer.from(data,'base64'))}
  return {cmd,evaluate,wait,click,call,connected,idle,clean,screenshot,contextId}
}
let complete=false
try {
  for(let i=0;i<3;i++){
    const email=`${tag}-${i}@colearn.example`,password=`Test!${randomUUID()}`
    const {user}=await ok(admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{username:`${tag}-${i}`,full_name:['Voice Alice','Voice Bob','Voice Outsider'][i]}}))
    accounts.push({...user,password});await ok(admin.from('profiles').update({onboarding_completed:true}).eq('id',user.id))
    const c=client();await ok(c.auth.signInWithPassword({email,password}));clients.push(c)
  }
  const [a,b,c]=accounts,[alice,bob,outsider]=clients
  await ok(admin.from('connections').insert({from_user_id:a.id,to_user_id:b.id,status:'accepted'}))
  let denied=await alice.rpc('colearn_start_call',{peer:c.id,device_id:randomUUID()});assert.equal(denied.error?.code,'42501')
  denied=await client().rpc('colearn_start_call',{peer:b.id,device_id:randomUUID()});assert(denied.error)
  pass('Nonconnections and anonymous callers rejected by server')
  const ad=randomUUID(),bd=randomUUID()
  const race=await Promise.all([alice.rpc('colearn_start_call',{peer:b.id,device_id:ad}),bob.rpc('colearn_start_call',{peer:a.id,device_id:bd})])
  assert.equal(race.filter(r=>!r.error).length,1)
  const winner=race[0].error?1:0,record=race[winner].data,owner=clients[winner],ownerDevice=winner?bd:ad
  assert.equal((await ok(outsider.from('voice_calls').select('*'))).length,0)
  assert((await outsider.rpc('colearn_call_action',{call_id:record.id,operation:'end',device_id:randomUUID()})).error)
  assert((await owner.from('voice_calls').update({status:'ended'}).eq('id',record.id)).error)
  assert((await owner.rpc('colearn_call_action',{call_id:record.id,operation:'heartbeat',device_id:randomUUID()})).error)
  pass('Simultaneous cross-calls serialized; RLS, direct writes, device ownership protected')
  // Real Realtime join authorization, including a peer trying to forge the other sender.
  async function join(c,topic){const channel=c.channel(topic,{config:{private:true,broadcast:{ack:true}}});channels.push([c,channel]);const status=await new Promise(resolve=>{const timer=setTimeout(()=>resolve('TIMEOUT'),10000);channel.subscribe(s=>{if(['SUBSCRIBED','CHANNEL_ERROR','TIMED_OUT'].includes(s)){clearTimeout(timer);resolve(s)}})});return {channel,status}}
  const rejected=await join(outsider,`voice:${record.id}:${record.caller_id}`);assert.notEqual(rejected.status,'SUBSCRIBED')
  const forged=await join(owner,`voice:${record.id}:${record.receiver_id}`);assert.equal(forged.status,'SUBSCRIBED')
  assert.notEqual(await forged.channel.send({type:'broadcast',event:'signal',payload:{kind:'end'}}),'ok')
  for(const [cl,ch] of channels.splice(0))await cl.removeChannel(ch)
  const receiver=clients[winner?0:1],receiverDevice=randomUUID()
  await ok(receiver.rpc('colearn_call_action',{call_id:record.id,operation:'accept',device_id:receiverDevice}))
  assert((await receiver.rpc('colearn_call_action',{call_id:record.id,operation:'accept',device_id:randomUUID()})).error)
  assert((await owner.rpc('colearn_start_call',{peer:record.receiver_id,device_id:randomUUID()})).error)
  pass('Accepted call belongs to one receiving device; additional calls rejected')
  await ok(owner.rpc('colearn_call_action',{call_id:record.id,operation:'end',device_id:ownerDevice}))
  pass('Private signaling rejects outsiders and sender impersonation')
  // Remove only this disposable security fixture to keep UI tests below rate limits.
  await ok(admin.from('voice_calls').delete().eq('id',record.id))
  const expired=await ok(alice.rpc('colearn_start_call',{peer:b.id,device_id:ad}))
  await ok(admin.from('voice_calls').update({created_at:new Date(Date.now()-60000).toISOString(),caller_seen_at:new Date(Date.now()-60000).toISOString()}).eq('id',expired.id))
  const replacement=await ok(bob.rpc('colearn_start_call',{peer:a.id,device_id:bd}))
  assert.equal((await ok(admin.from('voice_calls').select('status').eq('id',expired.id).single())).status,'unavailable')
  await ok(admin.from('connections').update({status:'blocked'}).eq('from_user_id',a.id).eq('to_user_id',b.id))
  assert.equal((await ok(admin.from('voice_calls').select('status').eq('id',replacement.id).single())).status,'ended')
  assert((await alice.rpc('colearn_start_call',{peer:b.id,device_id:ad})).error)
  await ok(admin.from('connections').update({status:'accepted'}).eq('from_user_id',a.id).eq('to_user_id',b.id))
  await ok(admin.from('voice_calls').delete().in('id',[expired.id,replacement.id]))
  pass('Expired leases release busy users; revoked connections end calls and reject new calls')
  for(let i=0;i<3;i++){
    const old=await ok(alice.rpc('colearn_start_call',{peer:b.id,device_id:ad}))
    await ok(admin.from('voice_calls').update({caller_seen_at:new Date(Date.now()-44900).toISOString()}).eq('id',old.id))
    await Promise.all([alice.rpc('colearn_call_action',{call_id:old.id,operation:'heartbeat',device_id:ad}),bob.rpc('colearn_start_call',{peer:a.id,device_id:bd})])
    const records=await ok(admin.from('voice_calls').select('*').eq('caller_id',a.id).or('status.eq.ringing,status.eq.accepted'))
    const other=await ok(admin.from('voice_calls').select('*').eq('caller_id',b.id).or('status.eq.ringing,status.eq.accepted'))
    assert([...records,...other].filter(r=>Date.now()-Date.parse(r.caller_seen_at)<45000&&Date.now()-Date.parse(r.created_at)<45000).length<=1)
    await ok(admin.from('voice_calls').delete().in('caller_id',[a.id,b.id]))
  }
  pass('Concurrent heartbeat and replacement-call requests leave at most one live call')

  const A=await page(a,b),B=await page(b,a)
  await A.call();await B.wait("document.body.innerText.includes('Incoming voice call')")
  await B.screenshot('voice-incoming')
  await B.cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true})
  assert(await B.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
  await B.screenshot('voice-incoming-mobile')
  await B.click('Accept');await Promise.all([A.connected(),B.connected()])
  await pause(3500)
  for(const p of [A,B]){
    const stats=await p.evaluate("voiceTest.pcs.at(-1).getStats().then(s=>Array.from(s.values()).filter(r=>r.type==='inbound-rtp'&&r.kind==='audio').map(r=>({packets:r.packetsReceived,energy:r.totalAudioEnergy})))")
    assert(stats.some(s=>s.packets>0&&s.energy>0),'No received audio energy')
  }
  pass('Connected invitation + accept; bidirectional WebRTC audio packets and nonzero audio energy')
  await A.screenshot('voice-connected')
  await B.screenshot('voice-connected-mobile')
  assert(await B.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
  pass('Incoming and active call UI fit mobile and desktop')
  await A.click('Mute');assert(await A.evaluate('voiceTest.tracks.every(t=>!t.enabled)'))
  await A.click('Unmute');assert(await A.evaluate('voiceTest.tracks.every(t=>t.enabled)'))
  await A.click('End call');await Promise.all([A.clean(),B.clean()])
  pass('Mute/unmute and caller hang-up release tracks, peers and call channels')

  await A.call();await B.click('Decline');await Promise.all([A.clean(),B.clean()]);await A.wait("document.body.innerText.includes('Call declined')")
  pass('Decline reaches caller and frees all resources')
  await B.call();await A.click('Accept');await Promise.all([A.connected(),B.connected()])
  await A.click('End call');await Promise.all([A.clean(),B.clean()])
  pass('Receiver can hang up and both ends clean up')

  const original=await A.evaluate("(()=>{window.originalVoiceMic=navigator.mediaDevices.getUserMedia;navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Denied','NotAllowedError')};return true})()")
  assert(original);await A.call();await A.wait("document.body.innerText.includes('Microphone permission denied')")
  await A.clean();await A.evaluate('navigator.mediaDevices.getUserMedia=window.originalVoiceMic')
  pass('Microphone denial produces actionable UI without opening a call')
  await A.evaluate("navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Missing','NotFoundError')}")
  await A.call();await A.wait("document.body.innerText.includes('No microphone found')");await A.clean()
  await A.evaluate('navigator.mediaDevices.getUserMedia=window.originalVoiceMic')
  await A.evaluate('(()=>{window.originalVoiceRTC=window.RTCPeerConnection;window.RTCPeerConnection=undefined})()')
  await A.call();await A.wait("document.body.innerText.includes('supported browser')");await A.clean()
  await A.evaluate('window.RTCPeerConnection=window.originalVoiceRTC')
  pass('Missing microphone and unsupported browser fail cleanly')
  await A.call();await B.click('Accept');await Promise.all([A.connected(),B.connected()])
  await A.cmd('Page.reload');await B.clean();await A.wait("!!document.querySelector('button[aria-label^=\"Voice call\"]:not(:disabled)')")
  pass('Refresh ends the call remotely and initializes a clean caller session')

  // Existing message form and Realtime delivery still work after repeated calls.
  await A.evaluate("(()=>{const el=document.querySelector('textarea[aria-label=Message]');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'Voice regression: text still works');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
  await A.evaluate("document.querySelector('button[aria-label=\"Send message\"]').click()")
  await B.wait("document.querySelector('[role=log]')?.innerText.includes('Voice regression: text still works')")
  pass('Existing text messaging and Realtime delivery work after calls')
  // Duplicate notifications across tabs may ring, but only one tab can accept.
  const B2=await page(b,a,B.contextId)
  await B.cmd('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false})
  await B2.call();await A.click('Accept');await Promise.all([A.connected(),B2.connected()])
  await B.wait("document.querySelector('button[aria-label^=\"Voice call\"]') && !document.querySelector('[role=dialog]')")
  const networkBefore=badNetwork.length, errorsBefore=errors.length
  await B.call();await B.wait("document.body.innerText.includes('already in a call')");await B.clean()
  const rejectedCalls=badNetwork.splice(networkBefore)
  assert(rejectedCalls.length && rejectedCalls.every(r=>r.status===400&&r.path==='/rest/v1/rpc/colearn_start_call'))
  expectedNetwork.push(...rejectedCalls)
  const rejectionLogs=errors.splice(errorsBefore)
  assert(rejectionLogs.every(e=>/Failed to load resource.*400/.test(e)))
  await B2.cmd('Page.navigate',{url:'about:blank'});await A.clean()
  pass('Other tabs cannot start overlapping calls; leaving the page ends the remote call')
  // A pending permission prompt can be canceled, including a late permission grant.
  await A.evaluate("(()=>{window.originalVoiceMic=navigator.mediaDevices.getUserMedia;navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{window.resolveLateMic=resolve})})()")
  await A.call();await A.click('End call')
  await A.evaluate('originalVoiceMic({audio:true}).then(stream=>window.resolveLateMic(stream))')
  await A.clean();await A.evaluate('navigator.mediaDevices.getUserMedia=window.originalVoiceMic')
  pass('Canceling a microphone prompt stops tracks granted after cancellation')
  assert.deepEqual(errors,[]);assert.deepEqual(badNetwork,[])
  complete=true
} finally {
  for(const context of contexts)await send('Target.disposeBrowserContext',{browserContextId:context}).catch(()=>{})
  await pause(700)
  for(const [cl,ch] of channels)await cl.removeChannel(ch)
  for(const c of clients)await c.removeAllChannels()
  for(const account of accounts)await ok(admin.auth.admin.deleteUser(account.id))
  ws.close()
  writeFileSync('.dist/voice-verification.json',JSON.stringify({status:complete?'passed':'failed',checks,errors,badNetwork,expectedNetwork,fixturesRemoved:true},null,2))
}
