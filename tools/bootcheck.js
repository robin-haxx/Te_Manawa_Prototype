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

// ---- eruption: tap erupts (no reseed), spam-guarded; hold reseeds ------
// The Eruption button is press-and-hold. A tap does a soft reset (living world
// only, terrain kept) and cannot be spammed (a 2 s cooldown); a ~3 s hold
// reseeds the land (the expensive init()) with the ash flash ramped up across
// the hold, so the reseed hitch never lands as a hard cut (TEMANAWA_BUILD_V3.md
// §3). init() swaps in a NEW TerrainGenerator, so terrain identity is the exact
// tap-vs-reseed signal; resetEcosystem() keeps the same object.
try{
  const G=vm.runInContext('game',ctx), H=vm.runInContext('InstallHUD',ctx);
  const K=vm.runInContext('Kiosk',ctx), TM=vm.runInContext('TM_TIME',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  // peak alpha of the full-screen ash rect, read straight off the render path
  const ashAlpha=()=>{ const cap=[], old=ctx.fill; ctx.fill=(...a)=>cap.push(a);
    H.renderAshFlash(G,1080,1920); ctx.fill=old;
    let mx=0; for(const a of cap) if(a.length===4) mx=Math.max(mx,a[3]); return mx; };

  // clean slate (the smoke test above tapped '4')
  G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0;

  // --- a tap: exactly one soft reset, terrain kept, flash armed ----------
  const terrTap=G.terrain, resTap=K.resetCount;
  G.handleKey('4'); ctx.__tick(6); G.handleKeyUp('4');
  chk(K.resetCount===resTap+1,'a tap fires exactly one soft reset');
  chk(G.terrain===terrTap,'a tap keeps the terrain (soft reset, no reseed)');
  chk(G._tmAshMode==='tap' && G._tmAshUntil>0,'a tap arms the ramped ash flash');

  // --- spam guard: a second tap inside the cooldown does nothing ---------
  const resSpam=K.resetCount;
  ctx.__tick(30); G.handleKey('4'); ctx.__tick(6); G.handleKeyUp('4');   // < 2 s later
  chk(K.resetCount===resSpam,'a second tap inside the 2 s cooldown is ignored');

  // --- past the cooldown, a tap fires again -----------------------------
  ctx.__tick(Math.ceil(TM.erCooldownMs/16)+2);
  const resAfter=K.resetCount;
  G.handleKey('4'); ctx.__tick(6); G.handleKeyUp('4');
  chk(K.resetCount===resAfter+1,'a tap after the cooldown fires again');

  // --- a long press: flash ramps up, then the land reseeds --------------
  G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0;
  const terrHold=G.terrain;
  G.handleKey('4');                                     // press & hold
  ctx.__tick(30);  const aEarly=ashAlpha();             // ~0.5 s in
  ctx.__tick(60);  const aMid=ashAlpha();               // ~1.5 s in
  chk(aMid>aEarly,`the flash must ramp UP while held (${aEarly.toFixed(0)} -> ${aMid.toFixed(0)})`);
  ctx.__tick(Math.ceil(TM.erLongPressMs/16));  G.update(1);   // cross erLongPressMs
  chk(G._tmErFired===true,'holding past erLongPressMs fires the reseed');
  chk(G.terrain!==terrHold,'a long press rebuilds (reseeds) the terrain');
  chk(G._tmAshMode==='hold','the reseed flash falls from the charged peak');
  const aPeak=ashAlpha();
  chk(aPeak>=180 && aPeak>aMid,`the flash is near full when the reseed lands (${aPeak.toFixed(0)})`);

  // --- releasing after a long press must NOT also tap-erupt --------------
  const resRel=K.resetCount;
  G.handleKeyUp('4');
  chk(K.resetCount===resRel,'releasing after a long press does not tap-erupt');

  // leave state clean for the sections below
  G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0;
  console.log(fail? `eruption: ${fail} FAILURES`
    : 'eruption: tap erupts (no reseed), 2 s spam-guard holds, hold reseeds with a ramped flash');
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
  const _bh = G.terrain.seasonBuffers.summer && G.terrain.seasonBuffers.summer.height;
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
  chk(!!G.terrain.seasonBuffers.summer, 're-bake must leave the season buffers built');

  // every move OFF must still bake cleanly (the isolate-one-move path)
  const saved = {}; for (const t of toggles) { saved[t] = L[t]; L[t] = false; }
  let threw = false;
  try { G.rebakeTerrain(); } catch (e) { threw = true; console.log('  FAIL bake with all moves off threw:', e.message); }
  chk(!threw, 'baking with every LOOK move off must not throw');
  chk(!!G.terrain.seasonBuffers.summer, 'buffers still built with all moves off');
  for (const t of toggles) L[t] = saved[t];        // restore and re-bake to a sane state
  G.rebakeTerrain();

  console.log(fail ? `look-dev: ${fail} FAILURES`
    : 'look-dev: LOOK toggles + in-place re-bake OK (no reseed, no reset)');
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
