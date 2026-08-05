// Headless boot: stub p5 + DOM, load every script in index.html order,
// run setup() and 120 draw() frames. Catches real reference/runtime errors.
const fs=require('fs'), path=require('path'), vm=require('vm');
const dir=require('path').resolve(__dirname,'..');
const files=fs.readFileSync(path.join(dir,'index.html'),'utf8')
  .match(/src="([^"]+\.js)"/g).map(s=>s.slice(5,-1)).filter(f=>!f.startsWith('p5'));

const img=()=>({width:64,height:64,loadPixels(){},pixels:new Uint8Array(64*64*4)});
const gfx=(w=1,h=1)=>{const o={width:w,height:h,pixels:new Uint8Array(Math.max(4,w*h*4))};
  for(const k of DRAW) o[k]=()=>o;
  o.remove=()=>{}; o.loadPixels=()=>{}; o.updatePixels=()=>{};
  o.pixelDensity=()=>1; o.get=()=>img(); o.set=()=>{}; o.resizeCanvas=()=>{};
  o.elt={getContext:()=>({})}; o.drawingContext={save(){},restore(){},beginPath(){},rect(){},clip(){},
    fillStyle:'',globalAlpha:1,filter:'',imageSmoothingEnabled:true,
    createImageData:(a,b)=>({data:new Uint8ClampedArray(Math.max(4,(a|0)*(b|0)*4)),width:a|0,height:b|0}),
    putImageData(){},getImageData:(x,y,a,b)=>({data:new Uint8ClampedArray(Math.max(4,(a|0)*(b|0)*4))})};
  o.noSmooth=()=>o; o.smooth=()=>o; return o;};
const DRAW=['background','fill','noFill','stroke','noStroke','strokeWeight','rect','ellipse','circle','line','triangle','quad','text','textAlign','textSize','textFont','push','pop','translate','rotate','scale','image','imageMode','rectMode','tint','noTint','beginShape','endShape','vertex','curveVertex','arc','point','noSmooth','smooth','blendMode','strokeCap','textLeading','textStyle','clear','erase','noErase','curveTightness','bezier','bezierVertex','quadraticVertex','curve','shearX','shearY','resetMatrix','applyMatrix','angleMode','ambientLight','noStroke2','noLoop','loop','cursor','noCursor','filter'];

let _errors=[];
const ctx={console:{log(){},warn(){},error(...a){_errors.push('console.error: '+a.join(' '))}},
  Math,JSON,Object,Array,String,Number,Boolean,Date,Set,Map,WeakMap,Symbol,RegExp,Error,Promise,
  Float32Array,Uint8Array,Uint16Array,Int32Array,performance:{now:()=>Date.now()},
  parseInt,parseFloat,isNaN,isFinite,Infinity,NaN,URLSearchParams,
  setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},
  localStorage:{_d:{},getItem(k){return this._d[k]??null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}},
  location:{search:'',reload(){_errors.push('!! location.reload called')}},
  navigator:{userAgent:'node'},
  document:{body:{style:{}},head:{appendChild(){}},createElement:()=>({style:{},textContent:''}),
            addEventListener(){},documentElement:{style:{}},
            querySelector:()=>({style:{setProperty(){}},getBoundingClientRect:()=>({width:1080,height:1920})}),
            querySelectorAll:()=>[],getElementById:()=>null,hidden:false},
};
ctx.window=ctx; ctx.globalThis=ctx;
ctx.window.addEventListener=()=>{};
// Startup URL flags, so a whole boot can be exercised in either mode:
//   TERRAIN=fit node tools/bootcheck.js     ART=low node tools/bootcheck.js
if(process.env.TERRAIN) ctx.location.search='?terrain='+process.env.TERRAIN;
if(process.env.ART) ctx.location.search+=(ctx.location.search?'&':'?')+'art='+process.env.ART;
// p5 surface
let _t=0; const FRAME=(f)=>{_t+=16; f();};
Object.assign(ctx,{
  createCanvas:()=>({style(){},elt:{}}), resizeCanvas(){}, pixelDensity:()=>1, frameRate(){},
  loadImage:img, loadFont:()=>({}), loadSound:()=>({isLoaded:()=>false,play(){},stop(){},setVolume(){},loop(){}}),
  createGraphics:gfx, createVector:(x=0,y=0)=>({x,y,copy(){return ctx.createVector(this.x,this.y)},
    add(v){this.x+=v.x;this.y+=v.y;return this},sub(v){this.x-=v.x;this.y-=v.y;return this},
    mult(n){this.x*=n;this.y*=n;return this},div(n){this.x/=n;this.y/=n;return this},
    set(x,y){this.x=x;this.y=y;return this},mag(){return Math.hypot(this.x,this.y)},
    magSq(){return this.x*this.x+this.y*this.y},
    normalize(){const m=this.mag()||1;this.x/=m;this.y/=m;return this},
    limit(m){const l=this.mag();if(l>m)this.mult(m/l);return this},
    setMag(m){return this.normalize().mult(m)},heading(){return Math.atan2(this.y,this.x)},
    dist(v){return Math.hypot(this.x-v.x,this.y-v.y)}}),
  random:(a,b)=>{if(a===undefined)return Math.random();if(Array.isArray(a))return a[(Math.random()*a.length)|0];
                 if(b===undefined)return Math.random()*a;return a+Math.random()*(b-a)},
  noise:()=>Math.random(), noiseSeed(){}, randomSeed(){},
  map:(v,a,b,c,d)=>c+(d-c)*((v-a)/((b-a)||1)),
  constrain:(v,a,b)=>Math.min(b,Math.max(a,v)), lerp:(a,b,t)=>a+(b-a)*t,
  dist:(x1,y1,x2,y2)=>Math.hypot(x2-x1,y2-y1), millis:()=>_t,
  color:(...a)=>({levels:a,toString:()=>'c'}), red:()=>0,green:()=>0,blue:()=>0,alpha:()=>255,
  textWidth:()=>10, windowWidth:1080, windowHeight:1920, mouseX:0, mouseY:0, key:'', keyCode:0,
  frameCount:0, deltaTime:16, drawingContext:{save(){},restore(){},beginPath(){},rect(){},clip(){},
    fillStyle:'',globalAlpha:1,filter:'',shadowBlur:0,shadowColor:'',
    createLinearGradient:()=>({addColorStop(){}}),fillRect(){}},
  getAudioContext:()=>({state:'running',resume(){}}),
  LEFT:'left',RIGHT:'right',CENTER:'center',TOP:'top',BOTTOM:'bottom',BASELINE:'baseline',
  CORNER:'corner',CORNERS:'corners',RADIUS:'radius',PI:Math.PI,TWO_PI:Math.PI*2,
  HALF_PI:Math.PI/2,QUARTER_PI:Math.PI/4,BLEND:'blend',ADD:'add',MULTIPLY:'multiply',
  ROUND:'round',SQUARE:'square',PROJECT:'project',NORMAL:'normal',BOLD:'bold',ITALIC:'italic',
  DEGREES:'degrees',RADIANS:'radians',CLOSE:'close',
  abs:Math.abs,floor:Math.floor,ceil:Math.ceil,round:Math.round,min:Math.min,max:Math.max,
  sqrt:Math.sqrt,pow:Math.pow,sin:Math.sin,cos:Math.cos,atan2:Math.atan2,exp:Math.exp,sq:v=>v*v,
  degrees:r=>r*180/Math.PI, radians:d=>d*Math.PI/180, int:v=>v|0, shuffle:a=>a,
  nf:(v,l,r)=>Number(v).toFixed(r||0), print(){},
  lerpColor:(a,b,t)=>({levels:[0,0,0,255],toString:()=>'c'}),
  hue:()=>0,saturation:()=>0,brightness:()=>0,lightness:()=>0,
  colorMode(){},noiseDetail(){},createImage:img,
  hypot:Math.hypot,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,
  log:Math.log,mag:(x,y)=>Math.hypot(x,y),norm:(v,a,b)=>(v-a)/((b-a)||1),
  textAscent:()=>10,textDescent:()=>4,year:()=>2026,month:()=>7,day:()=>28,
  hour:()=>12,minute:()=>0,second:()=>0,touches:[],pmouseX:0,pmouseY:0,
  mouseIsPressed:false,keyIsPressed:false,keyIsDown:()=>false,
  fullscreen:()=>false,displayWidth:1080,displayHeight:1920,
  saveTable(){},save(){},createWriter:()=>({write(){},close(){}}),
});
for(const k of DRAW) if(!ctx[k]) ctx[k]=()=>{};
ctx.__tick=(n=1)=>{_t+=16*n;};
vm.createContext(ctx);

for(const f of files){
  try{ vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'), ctx, {filename:f}); }
  catch(e){ console.log('LOAD FAIL',f,'\n  ',e.message); process.exit(1); }
}
console.log('all', files.length, 'scripts loaded');
// Dev harness runs MANY regenerations; bake at 1× so they stay fast. bakeScale is
// only a paint-resolution knob — the "buffer = footprint × bakeScale" relationship
// is still asserted (via terrain._paintScale), so the checks are not weakened.
try { const _L = vm.runInContext('LOOK', ctx); if (_L) _L.bakeScale = 1; } catch (e) {}
try{ ctx.preload && ctx.preload(); console.log('preload() ok'); }
catch(e){ console.log('PRELOAD FAIL:', e.message,'\n',e.stack.split('\n')[1]); process.exit(1); }
try{ ctx.setup(); console.log('setup() ok'); }
catch(e){ console.log('SETUP FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }
let frames=0;
try{ for(;frames<120;frames++) FRAME(ctx.draw); }
catch(e){ console.log(`DRAW FAIL at frame ${frames}:`, e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }
console.log('draw() x'+frames+' ok');
// exercise the buttons and the debug overlay
try{
  const G0=vm.runInContext('game',ctx);
  for(const k of ['1','2','3','d','d']) G0.handleKey(k);
  G0.handleKey('4'); G0.handleKeyUp('4');   // eruption is press-and-hold; a tap is down+up
  for(let i=0;i<30;i++) FRAME(ctx.draw);
  console.log('buttons 1-4 + debug modes ok');
}catch(e){ console.log('INPUT FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- eruption button: tap = revert to previous event, hold = skip to next ----
// The Eruption button navigates the four volcanic events. A TAP reverts to the previous
// (older) eruption; a HOLD skips forward to the next (younger) one, wrapping to Kidnappers
// past Whakamaru. Both soft-regen + morph the terrain TO THAT YEAR (terrain object KEPT)
// and apply the ash clearing, so `yearsBP` after the gesture is the signal.
try{
  const G=vm.runInContext('game',ctx), H=vm.runInContext('InstallHUD',ctx);
  const DT=vm.runInContext('DeepTime',ctx), TM=vm.runInContext('TM_TIME',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  const ashAlpha=()=>{ const cap=[], old=ctx.fill; ctx.fill=(...a)=>cap.push(a);
    H.renderAshFlash(G,1080,1920); ctx.fill=old;
    let mx=0; for(const a of cap) if(a.length===4) mx=Math.max(mx,a[3]); return mx; };
  const settle=()=>{ for(let i=0;i<4;i++) FRAME(ctx.draw); };

  G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0;

  DT.seekTo(500000);
  const terrTap=G.terrain;
  G.handleKey('4'); ctx.__tick(6); G.handleKeyUp('4');
  chk(DT.yearsBP===900000,'a tap reverts to the previous eruption (Kaukatea, 900 ka)');
  chk(G.terrain===terrTap,'revert keeps the terrain object (soft regen + morph, no reseed)');
  chk(G._tmAshMode==='tap' && G._tmAshUntil>0,'a tap arms the ramped ash flash');
  settle();

  const yGuard=DT.yearsBP;
  ctx.__tick(30); G.handleKey('4'); ctx.__tick(6); G.handleKeyUp('4');
  chk(DT.yearsBP===yGuard,'a second tap inside the 2 s cooldown is ignored');

  G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0;
  DT.seekTo(DT.yearsStart);
  G.handleKey('4'); ctx.__tick(6); G.handleKeyUp('4');
  chk(DT.yearsBP===DT.yearsStart,'a tap at the first event is a no-op (nothing older)');

  G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0;
  DT.seekTo(500000);
  const terrHold=G.terrain;
  G.handleKey('4');
  ctx.__tick(30);  const aEarly=ashAlpha();
  ctx.__tick(60);  const aMid=ashAlpha();
  chk(aMid>aEarly,`the flash must ramp UP while held (${aEarly.toFixed(0)} -> ${aMid.toFixed(0)})`);
  ctx.__tick(Math.ceil(TM.erLongPressMs/16));  G.update(1);
  chk(G._tmErFired===true,'holding past erLongPressMs fires the skip');
  chk(DT.yearsBP===349000,'a hold skips to the next eruption (Whakamaru, 349 ka)');
  chk(G.terrain===terrHold,'skip keeps the terrain object (morph, no reseed)');
  chk(G._tmAshMode==='hold','the skip flash falls from the charged peak');
  settle();

  const yRel=DT.yearsBP; G.handleKeyUp('4');
  chk(DT.yearsBP===yRel,'releasing after a hold does not also revert');

  G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0;
  DT.seekTo(200000);
  G.handleKey('4'); ctx.__tick(Math.ceil(TM.erLongPressMs/16)); G.update(1); G.handleKeyUp('4');
  chk(DT.yearsBP===DT.yearsStart,'a hold past Whakamaru wraps to Kidnappers (1 Ma)');
  settle();

  G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0;
  DT.reset();
  console.log(fail? `eruption: ${fail} FAILURES`
    : 'eruption nav: tap reverts (prev), hold skips (next, wraps at Whakamaru), cooldown + ramped hold flash');
}catch(e){ console.log('ERUPTION FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }
try{
  const K=vm.runInContext('Kiosk',ctx);
  const t=[]; for(let n=0;n<6;n++){ const a=Date.now(); K.resetToAttract(K.game,'test'); t.push(Date.now()-a); for(let i=0;i<5;i++) FRAME(ctx.draw); }
  console.log('soft resets (ms, harness):', t.join(', '));
  const a=Date.now(); K.game.init(); const full=Date.now()-a;
  console.log('full init() for comparison:', full+'ms  -> soft is ~'+(full/Math.max(1,t[t.length-1])).toFixed(0)+'x cheaper');
}catch(e){ console.log('RESET FAIL:', e.message, e.stack.split('\n')[1]); process.exit(1); }
const g=vm.runInContext('game',ctx);
// ---- visitor-facing render must be clean -----------------------------
{
  const D=vm.runInContext('Debug',ctx), C=vm.runInContext('CONFIG',ctx);
  const G=vm.runInContext('game',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  D.mode='off'; D.applyVisibility();
  chk(C.showEntityUI===false,'entity UI (bars/hearts/rings/glyphs) must be OFF for visitors');
  chk(D.enabled===false,'Debug.enabled must be false when mode is off');
  G.addNotification('test message','info');
  chk(G.ui.messages.length>0,'notifications should still be QUEUED (useful in debug)');
  FRAME(ctx.draw);   // must not throw with debug off

  D.mode='full'; D.applyVisibility();
  chk(C.showEntityUI===true,'entity UI must come back ON with the debug overlay');
  FRAME(ctx.draw);   // exercises the climate strip + all six panels
  D.mode='off'; D.applyVisibility(); FRAME(ctx.draw);

  console.log(fail? `visitor render: ${fail} FAILURES` : 'visitor render: clean (no entity UI, no messages, no climate chart)');
}

// ---- Phase 2: deep-time model ----------------------------------------
{
  const DT=vm.runInContext('DeepTime',ctx), CL=vm.runInContext('Climate',ctx);
  const G=vm.runInContext('game',ctx);
  let fail=0;
  const chk=(cond,msg)=>{ if(!cond){ console.log('  FAIL',msg); fail++; } };

  // real-record checks: the curve must put these where they actually happened
  chk(CL.at(122000).glacialIndex<0.35,'MIS 5e (122ka) should be interglacial');
  chk(CL.at(21000).glacialIndex>0.85, 'LGM (21ka) should be full glacial');
  chk(CL.at(140000).glacialIndex>0.85,'MIS 6 (140ka) should be full glacial');
  chk(CL.at(335000).glacialIndex<0.35,'MIS 9e (335ka) should be interglacial');
  chk(CL.at(270000).glacialIndex>0.75,'MIS 8 (270ka) should be glacial');

  // clock runs the right direction at the right rate
  DT.reset();
  const y0=DT.yearsBP; for(let i=0;i<60;i++){ ctx.__tick(); DT.update(1); }
  const perSec=y0-DT.yearsBP;
  chk(perSec>450&&perSec<550,`baseline should be ~500 yr/sec, got ${perSec.toFixed(0)}`);

  // deep-time ramp: eased, never exceeds deepMult, returns to 1
  DT.reset(); DT.pressDeep();
  let peak=0, samples=[];
  for(let i=0;i<Math.ceil(DT.deepSeconds*60);i++){ ctx.__tick(); const sc=DT.update(1); peak=Math.max(peak,sc); if(i<6) samples.push(sc.toFixed(1)); }
  chk(peak<=DT.deepMult+0.01,`ramp must not exceed x${DT.deepMult}, peaked ${peak.toFixed(2)}`);
  chk(peak>DT.deepMult*0.95,`ramp should reach ~x${DT.deepMult}, peaked ${peak.toFixed(2)}`);
  ctx.__tick(120); chk(DT.update(1)===1,'scale must return to 1 after the window closes');
  chk(Number(samples[1])<DT.deepMult*0.6,'ramp must ease in, not step (early samples '+samples.slice(0,4).join('/')+')');

  // ~50 ky per press
  DT.reset(); const b=DT.yearsBP; DT.pressDeep();
  for(let i=0;i<DT.deepSeconds*60;i++){ ctx.__tick(); DT.update(1); }
  const covered=b-DT.yearsBP;
  chk(covered>38000&&covered<52000,`one press should cover ~50 ky, got ${Math.round(covered)}`);

  // end of window hands off rather than stalling
  DT.reset(); DT.yearsBP=DT.yearsEnd+1; DT.update(1);
  chk(DT.hasEnded(),'hasEnded() must fire at the end of the window');
  const before=vm.runInContext('Kiosk',ctx).resetCount;
  DT.yearsBP=DT.yearsEnd+1; G.update(1);
  chk(vm.runInContext('Kiosk',ctx).resetCount>before,'end of window must trigger the attract reset');

  console.log(fail? `deep time: ${fail} FAILURES` : 'deep time: all checks pass'
    + ` (window ${(DT.windowSeconds()/60).toFixed(1)} min, press covers ${Math.round(covered/1000)} ky)`);
}

// ---- biomes: one table, and the bands actually reachable --------------
// There were two biome tables: levelDef.biomes (which renders) and a BIOMES
// const in sketch.js (which was registered, validated, and drew nothing). A
// colour edited in the wrong one changed nothing, silently. Assert the
// duplicate cannot come back, and that band shadowing gets reported.
{
  const G=vm.runInContext('game',ctx), R=vm.runInContext('REGISTRY',ctx);
  const vbb=vm.runInContext('validateBiomeBands',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  chk(vm.runInContext("typeof BIOMES==='undefined'",ctx),
      'a global BIOMES table must not exist — levelDef.biomes is the only source');
  chk(G.terrain.biomes===G.currentLevel.biomes,
      'TerrainGenerator must render the level definition\'s biomes, not a copy');

  const keys=Object.keys(G.currentLevel.biomes);
  chk(keys.every(k=>R.getBiome(k)===G.currentLevel.biomes[k]),
      'REGISTRY must hold the same biome objects the terrain renders');

  // every registered biome must actually reach the screen
  const bm=G.terrain.biomeIndexMap, seen=new Set();
  for(let i=0;i<bm.length;i+=97) seen.add(G.terrain.biomeArray[bm[i]].key);
  chk(seen.size>=4,`only ${seen.size} biomes present in the baked map`);

  // shadowing detection: a band fully covered by a lower one must be reported
  const broken=vbb({a:{key:'a',minElevation:0,maxElevation:0.9},
                    b:{key:'b',minElevation:0.3,maxElevation:0.6}});
  chk(broken.some(s=>s.includes("'b'")&&s.includes('NEVER renders')),
      'a fully shadowed band must be reported as never rendering');
  const gap=vbb({a:{key:'a',minElevation:0,maxElevation:0.4},
                 b:{key:'b',minElevation:0.7,maxElevation:1.0}});
  chk(gap.some(s=>s.includes('in no band')),'an uncovered elevation gap must be reported');
  chk(vbb({a:{key:'a',minElevation:0,maxElevation:0.5},
           b:{key:'b',minElevation:0.5,maxElevation:1.0}}).length===0,
      'a clean partition must report nothing');

  const live=vbb(G.currentLevel.biomes);
  console.log(fail? `biomes: ${fail} FAILURES`
    : `biomes: one table, ${keys.length} bands, ${seen.size} on screen` +
      (live.length? ` (${live.length} band warning${live.length>1?'s':''} — see console.warn)` : ''));
}

// ---- terrain footprint modes -----------------------------------------
// gridFor() is pure and static, so the aspect sweep needs no rebuild. The
// point of the sweep is the cell budget: a fill mode that grew the grid with
// the aspect would blow TEMANAWA_BUILD_V3.md §5.2 on a tall panel, and that
// would not show up on a landscape dev monitor.
{
  const TG=vm.runInContext('TerrainGenerator',ctx), C=vm.runInContext('CONFIG',ctx);
  const G=vm.runInContext('game',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  const base={mapGrid:512, noiseScale:0.005, terrainFitMaxStretch:2.0};
  const budget=512*512;

  const sq=TG.gridFor({...base, terrainFit:'square', canvasWidth:1080, canvasHeight:1920});
  chk(sq.cols===512&&sq.rows===512,`square must stay 512x512, got ${sq.cols}x${sq.rows}`);
  chk(sq.noiseScale===0.005,'square must not touch noiseScale');

  const aspects=[[1080,1920],[1920,1080],[1080,1080],[2520,1080],[1080,2520],[1440,1080]];
  let worst=0, rows=[];
  for(const [w,h] of aspects){
    const f=TG.gridFor({...base, terrainFit:'fit', canvasWidth:w, canvasHeight:h});
    const cells=f.cols*f.rows;
    worst=Math.max(worst, cells/budget);
    rows.push(`${w}x${h} -> ${f.cols}x${f.rows}`);
    chk(cells<=budget*1.02, `${w}x${h}: ${cells} cells exceeds the ${budget} budget`);
    chk(cells>=budget*0.98, `${w}x${h}: ${cells} cells wastes the ${budget} budget`);
    chk(f.cols%2===0&&f.rows%2===0, `${w}x${h}: dimensions must be even`);
    // apparent landform size must survive the reshape
    const zFit=Math.min(w/f.cols, h/f.rows), zSq=Math.min(w,h)/512;
    chk(Math.abs((1/f.noiseScale)*zFit - (1/0.005)*zSq) < 1,
        `${w}x${h}: feature size not preserved (ns ${f.noiseScale.toFixed(5)})`);
  }

  // past maxStretch the world stops stretching rather than becoming a ribbon
  const wide=TG.gridFor({...base, terrainFit:'fit', canvasWidth:5400, canvasHeight:1080});
  chk(wide.cols/wide.rows <= 2.05, `3:1 panel must clamp to 2:1, got ${(wide.cols/wide.rows).toFixed(2)}`);

  // and the real thing: a live refit rebuilds and the sim follows the new dims.
  // Start from a known footprint — TERRAIN=fit may already have booted us there.
  const bootedAs=G.terrain.fitMode;
  C.terrainFit='square'; G.refitTerrain();
  C.terrainFit='fit';
  const rebuilt=G.refitTerrain();
  const t=G.terrain;
  chk(rebuilt===true,'refitTerrain() must rebuild when the footprint changes');
  chk(t.mapWidth!==t.mapHeight,'fit terrain on a 9:16 canvas must not be square');
  chk(G.simulation.worldWidth===t.mapWidth&&G.simulation.worldHeight===t.mapHeight,
      'simulation world must follow the refitted terrain');
  chk(G.refitTerrain()===false,'a second refit at the same size must be a no-op');
  FRAME(ctx.draw);   // must render clean at a non-square footprint

  // buffer hygiene: re-baking must free the outgoing canvases, or the kiosk
  // leaks ~4MB per reseed (TEMANAWA_BUILD_V3.md §2.3)
  let removed=0;
  for(const k in t.seasonBuffers){ const b=t.seasonBuffers[k]; if(b) b.remove=()=>{removed++;}; }
  t.regenerate();
  chk(removed===4,`regenerate() must remove() all 4 old season buffers, freed ${removed}`);

  // back to whatever the boot flags asked for, so later sections see a sane world
  C.terrainFit=bootedAs; G.refitTerrain();
  chk(G.terrain.fitMode===bootedAs,`must restore the booted footprint (${bootedAs})`);
  if(bootedAs==='square') chk(G.terrain.mapWidth===G.terrain.mapHeight,'square grid must be square');
  FRAME(ctx.draw);

  console.log(fail? `terrain fit: ${fail} FAILURES`
    : `terrain fit: all checks pass (booted ${bootedAs}; ${rows.join(', ')}; ` +
      `peak ${(worst*100).toFixed(1)}% of budget)`);
}

// ---- facing smoothing: glide, ramp-up, no whip on flicker -------------
// The renderer used to set each sprite's angle straight from velocity every
// frame (SpriteAngle.snap), so a heading that flipped for a frame or two —
// state chatter — whipped the sprite around. Boid.updateFacing() now eases a
// rate-limited turn toward the heading. Assert the properties that buys, since
// they are exactly the kind of thing that reads fine in code and looks wrong on
// screen.
{
  const Boid=vm.runInContext('Boid',ctx);
  const terr={mapWidth:512,mapHeight:512};
  const TAU=Math.PI*2, arc=a=>a-TAU*Math.floor((a+Math.PI)/TAU);
  const mk=(vx,vy)=>{const b=new Boid(100,100,terr); b.vel.set(vx,vy); b.updateFacing(1); return b;};
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  // ease-in: a turn starts gently and speeds up (turn rate ramps from zero) —
  // it must not jump to full rate on frame one.
  const b=mk(1,0);                 // settled facing east
  b.vel.set(0,-1);                 // now ask it to face north
  const d=[]; let prev=b._facing;
  for(let i=0;i<6;i++){ b.updateFacing(1); d.push(Math.abs(arc(b._facing-prev))); prev=b._facing; }
  chk(d[0]<d[3], `turn must ramp up, not snap (per-frame ${d.map(x=>x.toFixed(3)).join('/')})`);
  chk(d[0]<=b._turnMax*1.01, 'first-frame turn must respect the rate cap');

  // convergence + no overshoot: with the target held, facing reaches it and
  // never rotates past it (past-target is what reads as a wobble).
  const target=Math.atan2(-1,0); let past=false;
  for(let i=0;i<400;i++){ b.updateFacing(1); if(b._facing<target-0.02) past=true; }
  chk(Math.abs(arc(b._facing-target))<0.01, 'facing must converge onto the heading');
  chk(!past, 'facing must not overshoot the heading (no wobble)');

  // flicker damping: a heading that alternates every frame must not whip the
  // sprite — every frame's rotation stays inside the turn cap and the facing
  // stays between the two headings instead of snapping across each frame.
  const c=mk(1,0);                 // east
  let maxStep=0, lo=Infinity, hi=-Infinity, pf=c._facing;
  for(let i=0;i<40;i++){
    c.vel.set(i%2?1:0, i%2?0:1);   // alternate east / south each frame
    c.updateFacing(1);
    maxStep=Math.max(maxStep,Math.abs(arc(c._facing-pf))); pf=c._facing;
    lo=Math.min(lo,c._facing); hi=Math.max(hi,c._facing);
  }
  chk(maxStep<=c._turnMax*1.01, `flicker must stay within the turn cap, got ${maxStep.toFixed(3)}`);
  chk(lo>-0.1 && hi<Math.PI/2+0.1, 'facing must stay between the flickering headings, not snap across');

  // dt-aware: from the same state a larger dt advances the turn further, so the
  // smoothing tracks a deep-time fast-forward instead of lagging behind it.
  const prog=dt=>{ const x=mk(1,0); x.vel.set(0,-1); x.updateFacing(dt); return Math.abs(arc(x._facing)); };
  chk(prog(2)>prog(1), 'a larger dt must advance the turn further (deep-time aware)');

  // a soft reset makes fresh boids: facing must re-initialise, not spin from 0.
  const e=mk(-1,0);                // facing west from birth
  chk(Math.abs(arc(e._facing-Math.PI))<1e-9, 'a new boid adopts its heading with no initial spin');

  console.log(fail? `facing smoothing: ${fail} FAILURES`
    : 'facing smoothing: glide + ramp-up + flicker-damped, no overshoot, dt-aware');
}

// ---- lateral flip: face from vel.x, animate through edge-on, hysteresis --
// The moa renderer flips (scale(_flip, ...)) instead of rotating. _flip must
// commit a direction from horizontal movement, ease toward it (through 0 = the
// turn-around pop), stay in [-1,1], and NOT flip on a near-vertical path.
{
  const Boid = vm.runInContext('Boid', ctx);
  const terr = { mapWidth: 512, mapHeight: 512 };
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };

  const b = new Boid(100, 100, terr);
  b.vel.set(1, 0);
  for (let i = 0; i < 32; i++) b.updateFacing(1);
  chk(b._faceDir === 1 && Math.abs(b._flip - 1) < 0.05, 'clear rightward motion settles facing +1');

  b.vel.set(-1, 0);
  let minAbs = 1, outOfRange = false;
  for (let i = 0; i < 40; i++) { b.updateFacing(1); const a = Math.abs(b._flip); if (a < minAbs) minAbs = a; if (b._flip < -1.001 || b._flip > 1.001) outOfRange = true; }
  chk(b._faceDir === -1 && Math.abs(b._flip + 1) < 0.05, 'turning left settles facing -1');
  chk(minAbs < 0.2, 'the flip animates THROUGH edge-on (|flip| passes near 0 = the pop)');
  chk(!outOfRange, 'flip stays within [-1, 1]');

  // vertical-only motion must not change the committed facing (hysteresis on vel.x)
  const c = new Boid(0, 0, terr); c.vel.set(1, 0); c.updateFacing(1);
  const dir0 = c._faceDir;
  for (let i = 0; i < 20; i++) { c.vel.set(0, i % 2 ? 1 : -1); c.updateFacing(1); }
  chk(c._faceDir === dir0, 'a near-vertical path must not flip the sprite');

  console.log(fail ? `lateral flip: ${fail} FAILURES`
    : 'lateral flip: faces from vel.x, animates through edge-on, hysteresis holds');
}

// ---- 3/4 projection: pure module, round-trip, no CONFIG writeback -----
// Plan-oblique paint (md/TEMANAWA_34VIEW_PLAN.md §2, §9). The module is pure so
// most of this needs no sketch; the live-state checks confirm the game
// configured it from the level and never leaked K/LIFT onto CONFIG.
{
  const P=vm.runInContext('Projection',ctx);
  const C=vm.runInContext('CONFIG',ctx), G=vm.runInContext('game',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  // Live state FIRST, before the pure tests below mutate the singleton: the
  // booted game (through several resets/refits) must have configured it, and
  // must not have written K/LIFT back onto CONFIG (same rule as noiseScale).
  const K0=P.K, lf0=P.liftFrac;
  chk(P.mapHeight===G.terrain.mapHeight, 'projection map height must track the live terrain');
  chk(P.K>=P.K_MIN && P.K<=P.K_MAX, `live K must be in [${P.K_MIN},${P.K_MAX}], got ${P.K}`);
  chk(typeof C.projK==='undefined' && typeof C.K==='undefined' && typeof C.LIFT==='undefined' && typeof C.liftFrac==='undefined',
      'K/LIFT must live on Projection, never on CONFIG');
  chk(P.relief===true, 'live game must enable relief after the bake');
  const _S = G.terrain._paintScale || 1;
  const _bh = G.terrain.seasonBuffers.interglacial && G.terrain.seasonBuffers.interglacial.height;
  chk(_bh === Math.ceil(G.terrain.mapHeight * P.K + P.LIFT) * _S,
      `relief buffer height (${_bh}) must equal ceil(mapH*K+LIFT)*bakeScale=${Math.ceil(G.terrain.mapHeight*P.K+P.LIFT)*_S}`);
  chk(G.terrain._paintW === Math.round(G.terrain.mapWidth * _S), 'paint grid width must be mapWidth * bakeScale');

  // configure() clamps out-of-range authoring into the documented bounds
  P.configure({K:5, liftFrac:9, mapWidth:400, mapHeight:600});
  chk(P.K===P.K_MAX, `K=5 must clamp to K_MAX ${P.K_MAX}, got ${P.K}`);
  chk(P.liftFrac===P.LIFT_FRAC_MAX, `liftFrac=9 must clamp to ${P.LIFT_FRAC_MAX}, got ${P.liftFrac}`);
  chk(Math.abs(P.LIFT - P.liftFrac*600)<1e-9, 'LIFT must be liftFrac x mapHeight');

  // the projection itself: x unchanged, flat plane is exactly worldY x K, and
  // higher ground is drawn HIGHER on screen (smaller y)
  P.configure({K:0.8, liftFrac:0.14, mapWidth:400, mapHeight:600});
  chk(P.projX(123)===123, 'projX is the identity (no x-shear in plan-oblique)');
  chk(Math.abs(P.projY(100,0)-80)<1e-9, 'flat projY must be worldY x K');
  chk(P.projY(100,1)<P.projY(100,0), 'elevation must lift a point UP the screen');
  chk(P.squashedHeight()===600*0.8, 'squashedHeight must be mapHeight x K');
  chk(P.projectedWorldHeight()>P.squashedHeight(), 'projected height must reserve relief headroom');

  // groundY is the paint-space mapping shared by the terrain buffer and every
  // entity (here K=0.8, mapHeight=600 → LIFT=0.14*600=84).
  P.relief=false;
  chk(P.groundY(100,0)===80 && P.groundY(100,1)===80, 'relief OFF: groundY ignores elevation (flat squash = worldY*K)');
  P.relief=true;
  chk(Math.abs(P.groundY(100,1) - 80) < 1e-9, 'relief ON: a peak (elev 1) sits at worldY*K');
  chk(Math.abs(P.groundY(100,0) - (80 + P.LIFT)) < 1e-9, 'relief ON: flat ground sits LIFT below the peak line');
  chk(P.groundY(100,1) < P.groundY(100,0), 'relief ON: higher ground draws higher on screen');
  P.relief=false;

  // screen -> world round-trip (the authoring inverse). Flat sampler is exact;
  // a sloped sampler must still iterate back onto the source point.
  const flat=()=>0.5;
  let rtOk=true;
  for(const [x,y] of [[0,0],[137,42],[399,599]]){
    const w=P.screenToWorld(P.projX(x), P.projY(y, flat()), flat);
    if(Math.abs(w.x-x)>1e-6 || Math.abs(w.y-y)>1e-6) rtOk=false;
  }
  chk(rtOk, 'screen->world must round-trip exactly on flat ground');
  const slope=(x,y)=>Math.max(0,Math.min(1,y/600));
  const yS=321, wS=P.screenToWorld(200, P.projY(yS, slope(200,yS)), slope);
  chk(Math.abs(wS.y-yS)<0.5, `screen->world must converge on sloped ground (got ${wS.y.toFixed(2)} vs ${yS})`);

  // restore a terrain-consistent projection so later sections see a sane world
  P.configure({K:K0, liftFrac:lf0, mapWidth:G.terrain.mapWidth, mapHeight:G.terrain.mapHeight});
  P.relief = true;   // match the live (post-bake) state

  console.log(fail? `projection: ${fail} FAILURES`
    : `projection: pure + round-trips, live K=${P.K} LIFT=${P.LIFT.toFixed(1)}px, no CONFIG writeback`);
}

// ---- look-dev tools: LOOK toggles + in-place re-bake --------------------
// Every illustration move must be a LOOK on/off toggle, must bake cleanly when
// switched off (the "isolate one move" workflow), and rebakeTerrain() must
// re-bake in place — no reseed, no ecosystem reset (md/TEMANAWA_34VIEW_PLAN.md §7).
{
  const L = vm.runInContext('LOOK', ctx);
  const G = vm.runInContext('game', ctx);
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };

  chk(L && typeof L.dump === 'function', 'LOOK must exist with a dump() helper');
  const toggles = ['posterize', 'wobble', 'outlines', 'shore', 'shade', 'haze', 'quiet'];
  chk(toggles.every(t => typeof L[t] === 'boolean'), 'every illustration move must be a LOOK on/off toggle');

  // in-place re-bake keeps the same land (no reseed) and the same living world
  const seed0 = G.terrain.seed;
  const moa0 = G.simulation.moas.length, eag0 = G.simulation.eagles.length;
  G.rebakeTerrain();
  chk(G.terrain.seed === seed0, 'rebakeTerrain must NOT reseed the land');
  chk(G.simulation.moas.length === moa0 && G.simulation.eagles.length === eag0,
      'rebakeTerrain must not touch the ecosystem');
  chk(!!G.terrain.seasonBuffers.interglacial, 're-bake must leave the season buffers built');

  // every move OFF must still bake cleanly (the isolate-one-move path)
  const saved = {}; for (const t of toggles) { saved[t] = L[t]; L[t] = false; }
  let threw = false;
  try { G.rebakeTerrain(); } catch (e) { threw = true; console.log('  FAIL bake with all moves off threw:', e.message); }
  chk(!threw, 'baking with every LOOK move off must not throw');
  chk(!!G.terrain.seasonBuffers.interglacial, 'buffers still built with all moves off');
  for (const t of toggles) L[t] = saved[t];        // restore and re-bake to a sane state
  G.rebakeTerrain();

  console.log(fail ? `look-dev: ${fail} FAILURES`
    : 'look-dev: LOOK toggles + in-place re-bake OK (no reseed, no reset)');
}

// ---- dev console tools: LOOK API + GEN landform + reset ------------------
// LOOK.solo/all/reset drive the toggles; GEN mirrors, writes and reseeds the
// landform params (md/TEMANAWA_DEVTOOLS.md). rebake is stubbed so the API logic
// is exercised without paying for real regenerations.
{
  const L = vm.runInContext('LOOK', ctx), GN = vm.runInContext('GEN', ctx);
  const C = vm.runInContext('CONFIG', ctx), G = vm.runInContext('game', ctx);
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };

  chk(GN && typeof GN.apply === 'function' && typeof GN.reseed === 'function', 'GEN must exist with apply()/reseed()');
  chk(typeof L.solo === 'function' && typeof L.reset === 'function' && typeof L.bake === 'function',
      'LOOK must gain solo()/reset()/bake()');

  const realBake = G.rebakeTerrain.bind(G);            // stub the slow real re-bake
  let bakes = 0; G.rebakeTerrain = () => { bakes++; };

  L.solo('shade');
  chk(L.shade === true && L.posterize === false && L.outlines === false, 'LOOK.solo isolates one move');
  chk(bakes >= 1, 'LOOK.solo re-bakes');
  L.all(true);
  chk(L._toggles.every(t => L[t] === true), 'LOOK.all(true) turns every move on');
  L.reset();
  chk(L.posterize === L._defaults.posterize && L.shadeSteps === L._defaults.shadeSteps,
      'LOOK.reset restores the authored defaults');

  GN.sync();
  chk(GN.octaves === C.octaves, 'GEN.sync mirrors the live CONFIG');
  const seed0 = G.terrain.seed;
  GN.octaves = 5; GN.apply();
  chk(C.octaves === 5, 'GEN.apply writes params back to CONFIG');
  chk(G.terrain.seed === seed0, 'GEN.apply keeps the same land (no reseed)');
  GN.reseed();
  chk(G.terrain.seed !== seed0, 'GEN.reseed changes the seed (new landform)');

  // restore real re-bake + authored look/land (one real regenerate)
  G.rebakeTerrain = realBake;
  Object.assign(L, L._defaults);
  GN.reset();
  chk(C.octaves === G.currentLevel.terrain.octaves, 'GEN.reset restores the level authored terrain');

  console.log(fail ? `dev tools: ${fail} FAILURES`
    : 'dev tools: LOOK solo/all/reset + GEN sync/apply/reseed/reset OK');
}

// ---- simulation robustness: dynamic grids + walkable-null guards --------
// Two latent crashes on the visitor path that reading the code did not surface:
//  (1) the constructor set this.dynamicGrids while updateSpatialGrids() and
//      getNearbyOfType() read this._dynamicGrids, so the first level to register
//      an "other" entity type (weka, kea) would TypeError every frame;
//  (2) _assignEagleNest / _findCragEyrie used findWalkablePositionNear()'s result
//      without a null guard, so an eagle sited next to unwalkable terrain
//      (likelier as the winter snow line expands) crashed the frame and the
//      watchdog masked it as a mystery reset.
{
  const G = vm.runInContext('game', ctx);
  const S = G.simulation;
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };

  // (1) dynamic grids: registering an otherEntities type must not throw on the
  // grid update, and the entity must be queryable through the dynamic grid.
  chk(S._dynamicGrids && typeof S._dynamicGrids === 'object',
      'Simulation must initialise this._dynamicGrids (not this.dynamicGrids)');
  chk(typeof S.dynamicGrids === 'undefined', 'the mis-named this.dynamicGrids must be gone');
  const dummy = { alive: true, pos: { x: 100, y: 100 } };
  S.otherEntities.testcritter = [dummy];
  let threw = false;
  try { S.updateSpatialGrids(); } catch (e) { threw = true; console.log('  FAIL updateSpatialGrids threw:', e.message); }
  chk(!threw, 'updateSpatialGrids() must not throw with an otherEntities type present');
  const near = S.getNearbyOfType('testcritter', 100, 100, 50);
  chk(near.length === 1 && near[0] === dummy, 'a dynamic-grid entity must be queryable via getNearbyOfType');
  delete S.otherEntities.testcritter; delete S._dynamicGrids.testcritter; S.updateSpatialGrids();

  // (2) walkable-null guards: when findWalkablePositionNear returns null (30
  // failed attempts near unwalkable terrain), the eagle-siting helpers must
  // degrade instead of dereferencing null.
  S.findWalkablePositionNear = () => null;
  S.getClosestMoa = () => ({ pos: { x: 200, y: 200 } });   // force the guarded branch in _assignEagleNest
  const fakeEagle = { nest: { set() {} }, patrolCenter: { set() {} } };
  let nestThrew = false, cragThrew = false, crag = null;
  try { S._assignEagleNest(fakeEagle, 200, 200); } catch (e) { nestThrew = true; console.log('  FAIL _assignEagleNest threw:', e.message); }
  try { crag = S._findCragEyrie(200, 200); } catch (e) { cragThrew = true; console.log('  FAIL _findCragEyrie threw:', e.message); }
  chk(!nestThrew, '_assignEagleNest must guard a null walkable position');
  chk(!cragThrew, '_findCragEyrie must guard a null walkable position');
  chk(crag && typeof crag.x === 'number' && typeof crag.y === 'number',
      '_findCragEyrie must still return a usable fallback site');
  delete S.findWalkablePositionNear; delete S.getClosestMoa;   // restore the prototype methods

  console.log(fail ? `sim robustness: ${fail} FAILURES`
    : 'sim robustness: dynamic-grid init + query OK, walkable-null guards hold');
}


// ---- perf batch: baked tints (#6), cull-box zoom (#10), one pop cache (#13) --
// Render wins that read fine in code but not in a boot: assert the properties.
{
  const ES = vm.runInContext('EntitySprites', ctx);
  const G  = vm.runInContext('game', ctx);
  const C  = vm.runInContext('CONFIG', ctx);
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };

  // #6 tinted moa frames are baked once per colour and reused — the per-frame
  // per-moa tint() composite (p5's _getTintedImageCanvas) is gone.
  chk(typeof ES.getMoaSpriteTinted === 'function', 'EntitySprites.getMoaSpriteTinted must exist');
  const tintA = [180, 120, 90];
  const a1 = ES.getMoaSpriteTinted(0, true, false, tintA);
  const a2 = ES.getMoaSpriteTinted(0, true, false, tintA);
  chk(ES.isValid(a1), 'a tinted moa frame must be valid');
  chk(a1 === a2, 'tinted frames are baked once and reused (no per-frame allocation)');
  chk(!!(ES._tintCache && ES._tintCache['180,120,90']), 'tints cache keyed by colour');
  ES.getMoaSpriteTinted(0, true, false, [10, 20, 30]);
  chk(Object.keys(ES._tintCache).length >= 2, 'distinct tints cache separately');
  chk(ES.isValid(ES.getMoaSpriteTinted(0, true, false, null)), 'a null tint falls back to a valid untinted frame');

  // #10 cull box tracks the LIVE viewZoom, not the authored zoom
  const z0 = C.viewZoom, zz0 = C.zoom;
  C.zoom = 2.5; C.viewZoom = 1.25;                    // a wider view than authored
  G.simulation.updateViewport();
  const wideRight = G.simulation._viewRight;
  C.viewZoom = 5.0;                                   // a tighter view
  G.simulation.updateViewport();
  const tightRight = G.simulation._viewRight;
  chk(wideRight > tightRight, `cull box must widen as viewZoom drops (${wideRight.toFixed(0)} > ${tightRight.toFixed(0)})`);
  chk(Math.abs(wideRight - C.gameAreaWidth / 1.25) < 0.01, 'cull box right must derive from viewZoom, not zoom');
  C.viewZoom = z0; C.zoom = zz0; G.simulation.updateViewport();   // restore

  // #13 one population cache: Game delegates to the Simulation, no duplicate walk
  chk(typeof G.updateCachedCounts === 'undefined', 'Game.updateCachedCounts (the duplicate walk) must be gone');
  chk(G.getMoaPopulation() === G.simulation.getMoaPopulation(), 'Game.getMoaPopulation must delegate to the Simulation cache');

  console.log(fail ? `perf batch: ${fail} FAILURES`
    : 'perf batch: baked tints reused, cull box tracks viewZoom, one population cache');
}

// ---- bake memory guard: bakeScale auto-caps so a buffer never OOMs ------
// createGraphics(...).loadPixels() at a high bakeScale / large grid throws
// NS_ERROR_OUT_OF_MEMORY (Firefox) and kills the whole sim. bakeScaleFor caps it.
// The harness can't allocate real pixels, so assert the pure clamp directly.
{
  const TG = vm.runInContext('TerrainGenerator', ctx);
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };
  chk(typeof TG.bakeScaleFor === 'function', 'TerrainGenerator.bakeScaleFor must exist');
  chk(TG.bakeScaleFor(683, 342, 4, 2200000) === 3, 'bakeScale 4 caps to 3 at a 16:9 grid under the 2.2M budget');
  chk(TG.bakeScaleFor(683, 342, 2, 2200000) === 2, 'a within-budget bakeScale is left alone');
  const s = TG.bakeScaleFor(683, 342, 8, 2200000);
  chk((683 * s) * (342 * s) <= 2200000, `a capped buffer never exceeds the budget (S=${s})`);
  chk(TG.bakeScaleFor(4000, 4000, 5, 2200000) >= 1, 'even an absurd grid never returns < 1');
  chk(TG.bakeScaleFor(683, 342, 1, 10) === 1, 'S floors at 1 under an absurd cap');
  console.log(fail ? `bake cap: ${fail} FAILURES` : 'bake cap: bakeScale auto-caps to the memory budget (no OOM)');
}

// ---- geography skeleton: river carves, ranges lift, deep-time factors --------
// SVG-authored skeleton (TE_MANAWA_GEO) reshapes the base noise: ranges lift the
// land, the river carves to the water band, both scaling with yearsBP.
{
  const TG = vm.runInContext('TerrainGenerator', ctx);
  const G = vm.runInContext('game', ctx);
  const GEO = vm.runInContext("typeof TE_MANAWA_GEO!=='undefined'?TE_MANAWA_GEO:null", ctx);
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };

  // pure geometry helpers
  chk(TG._pointInPoly([[0,0],[1,0],[1,1],[0,1]], 0.5, 0.5) === true, 'point inside a square');
  chk(TG._pointInPoly([[0,0],[1,0],[1,1],[0,1]], 1.5, 0.5) === false, 'point outside a square');
  chk(Math.abs(TG._distToSeg(0,1, 0,0, 2,0) - 1) < 1e-9, 'perpendicular distance to a segment');
  chk(Math.abs(TG._distToPolyline([[0,0],[1,0]], 0.5, 0.5) - 0.5) < 1e-9, 'distance to a polyline');

  // base compression: with a skeleton, procedural noise can't reach alpine on its own
  chk(TG._compressBase(0.3, 0.5) === 0.3, 'base below the ceiling is unchanged');
  chk(TG._compressBase(1.0, 0.5) < 0.77, 'max procedural base stays out of the alpine band (ranges own the highs)');

  // deep-time factors: ranges grow, incision leads uplift, clamped
  const s = vm.runInContext('DeepTime.yearsStart', ctx), e = vm.runInContext('DeepTime.yearsEnd', ctx);
  const f0 = TG.geoTimeFactors(s), f1 = TG.geoTimeFactors(e);
  chk(f0.uplift < 0.02, 'at the start (~1.1 Ma) ranges are nascent (uplift ~0)');
  chk(f1.uplift > 0.98, 'by the end ranges are mature (uplift ~1)');
  chk(f0.incision > f0.uplift, 'incision leads uplift — the river outpaces the ranges');
  chk(TG.geoTimeFactors(s + 5e5).uplift === 0, 'uplift floors at 0 before the window opens');

  // integration: at mature factors, a range core lifts to alpine + a river cell carves to water
  if (GEO && G.terrain._baseNoise) {
    const T = G.terrain, savedT = T._geoT;
    T._geoT = { uplift: 1, incision: 1 }; T._prepGeo();
    const poly = GEO.ranges && GEO.ranges[0] && GEO.ranges[0].poly;
    const river = GEO.rivers && GEO.rivers[0] && GEO.rivers[0].pts;
    if (poly) {
      let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; } cx /= poly.length; cy /= poly.length;
      const lifted = T._applyGeo(0.2, cx, cy, cx * T.mapWidth, cy * T.mapHeight);
      chk(lifted > 0.35, `a range lifts the land well above the plains (got ${lifted.toFixed(2)})`);
    }
    if (river) {
      const mid = river[(river.length / 2) | 0];
      const carved = T._applyGeo(0.4, mid[0], mid[1], mid[0] * T.mapWidth, mid[1] * T.mapHeight);
      chk(carved < 0.2, `a river cell carves toward water (got ${carved.toFixed(2)})`);
    }
    T._geoT = savedT; T._prepGeo();
  }

  // morph driver gating (pure) + morphTo re-shapes the land with deep time (geo cache)
  chk(TG.shouldMorphBake(100000, 120000, 5000, 0, 9000, 1000) === true, 'morph fires once yearsBP drifts past the interval and the throttle elapsed');
  chk(TG.shouldMorphBake(119000, 120000, 5000, 0, 9000, 1000) === false, 'morph waits until yearsBP drifts far enough');
  chk(TG.shouldMorphBake(100000, 120000, 500, 0, 9000, 1000) === false, 'morph respects the real-time throttle');
  chk(Math.abs(TG._combineGeo(0.3, 0, 0, 0, 0, 0, 0, 1, 1, 0.45) - 0.3) < 1e-9, 'combineGeo with no feature leaves the base untouched');
  if (GEO && G.terrain._geoCache) {
    const T = G.terrain;
    T.morphTo(vm.runInContext('DeepTime.yearsStart', ctx), 1);   // p=0 — ranges nascent
    let lo = 0; const a = T.heightMap; for (let i = 0; i < a.length; i += 53) if (a[i] > 0.6) lo++;
    T.morphTo(vm.runInContext('DeepTime.yearsEnd', ctx), 1);      // p=1 — ranges mature
    let hi = 0; const b = T.heightMap; for (let i = 0; i < b.length; i += 53) if (b[i] > 0.6) hi++;
    chk(hi > lo, `ranges rise with deep time — high-ground cells ${lo} -> ${hi}`);
    chk(!!T._geoCache, 'the geo field is cached (morph re-applies the deep-time factors only)');
  }

  console.log(fail ? `geography: ${fail} FAILURES`
    : 'geography: river carves, ranges lift over deep time (cached), morph driver gated');
}

// ---- incremental morph: sliced job == synchronous bake ------------------
// morphTo() used to pay the whole re-bake in one frame — the on-wall hitch.
// morphBegin()/morphStep(budget) slice the same work across frames into back
// buffers that swap in when finished. Assert:
//  (1) the sliced result is IDENTICAL to the synchronous one. This also proves
//      the wobble caches: the harness's noise() is Math.random, so any live
//      noise call on the morph path would diverge between the two runs;
//  (2) the job really spreads across many steps (it slices, it doesn't stall);
//  (3) all four season buffers swap to fresh bakes;
//  (4) the on-screen swap arms the >=500 ms crossfade, render() retires it,
//      and retired buffers recycle into the bake pool (no §2.3 leak);
//  (5) the Game driver stages a job without blocking and completes it over ticks.
{
  const G=vm.runInContext('game',ctx), C=vm.runInContext('CONFIG',ctx);
  const DT=vm.runInContext('DeepTime',ctx);
  const T=G.terrain;
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  if (T.geo && T._baseNoise) {
    const wasEnabled=C.morphEnabled; C.morphEnabled=false;   // this section drives the terrain directly

    // (1) identity: synchronous reference at yearsEnd, rewind, slice back to yearsEnd
    T.morphTo(DT.yearsEnd, 1);
    const refH=T.heightMap.slice(), refB=T.biomeIndexMap.slice();
    const refE=T._paintElev.slice(), refPB=T._paintBiome.slice(), refEd=T._paintEdge.slice();
    T.morphTo(DT.yearsStart, 1);
    const fronts={...T.seasonBuffers};
    T.morphBegin(DT.yearsEnd, 1);
    chk(T.morphInProgress===true,'morphBegin must stage a resumable job');
    let steps=0;
    while(T.morphInProgress && steps<200000){ T.morphStep(1); steps++; }
    chk(!T.morphInProgress,`the job must complete (ran ${steps} steps)`);
    chk(steps>1,'the job must actually slice across multiple steps, not stall once');
    const eq=(a,b)=>{ if(!a||!b||a.length!==b.length) return false;
      for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return false; return true; };
    {let fi=-1;for(let i=0;i<T.heightMap.length;i++)if(Number.isNaN(T.heightMap[i])){fi=i;break;}
     if(fi>=0){const gc=T._geoCache;
       console.log('  DBG NaN@',fi,'row',Math.floor(fi/T.gridCols),'col',fi%T.gridCols,
         'base',T._baseNoise[fi],'rMask',gc&&gc.rMask[fi],'rH',gc&&gc.rH[fi],'ridge',gc&&gc.ridge[fi],
         'detail',gc&&gc.detail[fi],'wMask',gc&&gc.wMask[fi],'wDepth',gc&&gc.wDepth[fi],
         'geoT',JSON.stringify(T._geoT),'relief',vm.runInContext('LOOK.rangeRelief',ctx));}}
    chk(eq(T.heightMap,refH),'sliced heightMap must be identical to the synchronous bake');
    chk(eq(T.biomeIndexMap,refB),'sliced biome map must be identical to the synchronous bake');
    chk(eq(T._paintElev,refE)&&eq(T._paintBiome,refPB)&&eq(T._paintEdge,refEd),
        'sliced paint grid must be identical — the time-independent wobble caches hold');

    // (3) every season buffer swapped to a fresh bake
    chk(['interglacial','cooling','glacial','fullGlacial'].every(k=>T.seasonBuffers[k]&&T.seasonBuffers[k]!==fronts[k]),
        'all four season buffers must swap to fresh bakes');

    // (4) crossfade + pool hygiene: the visible season's retired buffer is held
    // for the fade, render() releases it when the fade ends, and releases recycle.
    chk(!!T._morphFade,'the on-screen buffer swap must arm the morph crossfade');
    chk(T._morphFade && T._morphFade.ms>=500,'the crossfade must ramp >= 500 ms (photosensitivity)');
    for(let i=0;i<80 && T._morphFade;i++) FRAME(ctx.draw);
    chk(!T._morphFade,'render() must retire the crossfade buffer once the fade ends');
    chk(T._bufPool.length>0,'retired back buffers must recycle into the bake pool');

    // (5) the driver: a due morph stages a job inside one tick (no blocking bake)
    // and finishes it across subsequent ticks.
    C.morphEnabled=true;
    G._bakedYearsBP=DT.yearsBP+50000;   // force the drift past morphIntervalYears
    G._lastMorphMs=0;
    G._morphTick();
    chk(T.morphInProgress===true,'the driver must stage the job, not bake synchronously');
    let ticks=0;
    while(T.morphInProgress && ticks<100000){ G._morphTick(); ticks++; }
    chk(!T.morphInProgress,`the driver must complete the job over ticks (ran ${ticks})`);
    chk(Math.abs(G._bakedYearsBP-DT.yearsBP)<1,'_bakedYearsBP must record the job target at start');

    C.morphEnabled=wasEnabled;
    console.log(fail? `incremental morph: ${fail} FAILURES`
      : `incremental morph: sliced == synchronous (${steps} steps), 4 buffers swap, `+
        `crossfade retires, pool recycles, driver non-blocking (${ticks} ticks)`);
  } else {
    console.log('incremental morph: skipped (no geography skeleton)');
  }
}

const K=vm.runInContext('Kiosk',ctx), D=vm.runInContext('Debug',ctx);
console.log('--- state ---');
console.log('  Kiosk.game attached', !!K.game, ' resets', K.resetCount);
const snap=D.stats(g);
console.log('  debug fauna  ', JSON.stringify(snap.fauna.bySpecies));
console.log('  debug flora  ', JSON.stringify(snap.flora.byType));
console.log('  debug terrain', snap.terrain.grid, 'biomes', Object.keys(snap.terrain.biomeArea).length);
console.log('  debug time   ', Math.round(snap.time.yearsBP), 'BP  season', snap.time.season);
console.log('  debug climate', snap.climate.stage, 'g='+snap.climate.glacialIndex.toFixed(2),
            snap.climate.mis, 'sea', snap.climate.seaLevel.toFixed(0)+'m');
console.log('  grid      ', g.terrain.mapWidth+'x'+g.terrain.mapHeight);
console.log('  moa/eagle ', g.simulation.moas.length+'/'+g.simulation.eagles.length);
console.log('  plants    ', g.simulation.plants.length);
console.log('  playTime  ', g.playTime.toFixed(0));
if(_errors.length){ console.log('--- console.error during run ---'); _errors.slice(0,10).forEach(e=>console.log('  ',e)); }
