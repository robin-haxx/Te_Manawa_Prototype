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
  for(const k of ['1','2','3','4','d','d']) G0.handleKey(k);   // deep, FOREST, TUSSOCK, storm, debug x2
  G0.handleKey('5'); G0.handleKeyUp('5');   // eruption is press-and-hold; a tap is down+up
  for(let i=0;i<30;i++) FRAME(ctx.draw);
  console.log('buttons 1-5 + debug modes ok');
}catch(e){ console.log('INPUT FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- two-clock split: deep-time warps LIFE, not the walk cadence -------------
// A moa's walk cadence (animTime) and ground speed ride the REAL frame dt so they
// stay calm in 10x fast-forward; aging/breeding ride the warped sim clock (hunger rides the real
// one too: see "boost follow-through").
// The contract has three seams — behave() (life), Boid.update() (motion + anim),
// and simulation.update(dt, rdt) (the wiring) — and this asserts all three. Guards
// against a regression that re-couples the animation cadence to the deep-time speed
// (the "sped-up cartoon" look). Reading the code did not catch this class of bug.
try{
  const G=vm.runInContext('game',ctx);
  const sim=G.simulation, season=G.seasonManager;
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const m=sim.moas && sim.moas[0];
  chk(!!m,'a moa exists to exercise the two-clock split');
  // Within update() there are TWO real-clock sub-clocks (neither is the deep-time-warped one):
  // ANIMATION (animTime) carries CONFIG.faunaAnimScale — the cel cadence, slowed but still stepping
  // through every frame; MOTION (position) carries CONFIG.faunaTimeScale — the calm travel pace.
  // Both scale the REAL frame dt, so a 10x fast-forward never touches the walk cadence or ground
  // speed (guards the "sped-up cartoon" regression). Fold both knobs into the expected deltas.
  const fts=vm.runInContext('(typeof CONFIG!=="undefined" && CONFIG.faunaTimeScale) ? CONFIG.faunaTimeScale : 1', ctx);
  const fas=vm.runInContext('(typeof CONFIG!=="undefined" && CONFIG.faunaAnimScale) ? CONFIG.faunaAnimScale : 1', ctx);
  if(m){
    // (1) behave() is the LIFE clock: it ages the moa but must NOT touch animTime or pos.
    const a0=m.animTime, px0=m.pos.x, py0=m.pos.y, age0=m.age;
    m.behave(sim, season, 10);
    chk(m.animTime===a0,'behave() leaves animTime alone (the walk cadence is not a life event)');
    chk(m.pos.x===px0 && m.pos.y===py0,'behave() does not move the body (integration lives in update())');
    chk(Math.abs((m.age-age0)-10)<1e-6,'behave() ages the moa by its warped dt (10)');

    // (2) update(): animTime advances by dt*faunaAnimScale (paced cel cadence), position by
    // dt*faunaTimeScale (paced travel). Tiny velocity keeps it under any species cap so pos is exact.
    m.vel.set(0.05,0); m.acc.set(0,0); m._speedCap=null;
    const a1=m.animTime, px1=m.pos.x;
    m.update(2);
    chk(Math.abs((m.animTime-a1)-2*fas)<1e-9,'update() advances animTime by real dt*faunaAnimScale (2 * '+fas+')');
    chk(Math.abs((m.pos.x-px1)-0.1*fts)<1e-6,'update() moves the body by vel*dt*faunaTimeScale (0.05 * 2 * '+fts+')');

    // (3) wiring: simulation.update(sdt, rdt) sends the warped dt to behave, the real to update.
    m.hunger=0; m.alive=true;                 // keep it alive through the tick
    const a2=m.animTime, age2=m.age;
    sim.update(10, 1);
    chk(Math.abs((m.animTime-a2)-1*fas)<1e-6,'sim.update: animation advanced by real dt*faunaAnimScale (1 * '+fas+'), not the warped 10');
    chk((m.age-age2)>=9.9,'sim.update: aging advanced by the WARPED dt (~10)');
  }
  console.log(fail? `two-clock: ${fail} FAILURES`
    : 'two-clock split: deep-time warps aging/breeding, not the walk cadence or ground speed');
}catch(e){ console.log('TWO-CLOCK FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- eruption button: tap = revert to previous event, hold = skip to next ----
// The Eruption button navigates the four volcanic events on the timeline. A TAP reverts
// to the previous (older) eruption; a ~3 s HOLD skips forward to the next (younger) one,
// wrapping to Kidnappers past Whakamaru (Oruanui is terminal). Both soft-regen + morph the
// terrain TO THAT YEAR (terrain object KEPT — no init/reseed) and apply the ash clearing,
// so `yearsBP` after the gesture is the signal, not terrain identity. The flash still ramps
// across a hold, keeping full-screen luminance inside the photosensitivity budget.
try{
  const G=vm.runInContext('game',ctx), H=vm.runInContext('InstallHUD',ctx);
  const DT=vm.runInContext('DeepTime',ctx), TM=vm.runInContext('TM_TIME',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  // peak alpha of the full-screen ash FLASH rect, read straight off the render path
  const ashAlpha=()=>{ const cap=[], old=ctx.fill; ctx.fill=(...a)=>cap.push(a);
    H.renderAshFlash(G,1080,1920); ctx.fill=old;
    let mx=0; for(const a of cap) if(a.length===4) mx=Math.max(mx,a[3]); return mx; };
  const settle=()=>{ for(let i=0;i<4;i++) FRAME(ctx.draw); };   // let the morph job finish

  G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0; G._tmAutoErAt=0; G._tmAutoErupt=null;

  // --- a tap: revert to the previous (older) eruption; terrain kept ------
  DT.seekTo(500000);                                   // between Kaukatea (900k) and Whakamaru (349k)
  const terrTap=G.terrain;
  G.handleKey('5'); ctx.__tick(6); G.handleKeyUp('5');
  chk(DT.yearsBP===900000,'a tap reverts to the previous eruption (Kaukatea, 900 ka)');
  chk(G.terrain===terrTap,'revert keeps the terrain object (soft regen + morph, no reseed)');
  chk(G._tmAshMode==='tap' && G._tmAshUntil>0,'a tap arms the ramped ash flash');
  settle();

  // --- spam guard: a second tap inside the cooldown does nothing ---------
  const yGuard=DT.yearsBP;
  ctx.__tick(30); G.handleKey('5'); ctx.__tick(6); G.handleKeyUp('5');   // < 2 s later
  chk(DT.yearsBP===yGuard,'a second tap inside the 2 s cooldown is ignored');

  // --- no-op at/older than the first event ------------------------------
  G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0; G._tmAutoErAt=0; G._tmAutoErupt=null;
  DT.seekTo(DT.yearsStart);                            // 1 Ma — nothing older
  G.handleKey('5'); ctx.__tick(6); G.handleKeyUp('5');
  chk(DT.yearsBP===DT.yearsStart,'a tap at the first event is a no-op (nothing older)');

  // --- a hold: flash ramps up, then skip to the next (younger) eruption --
  G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0; G._tmAutoErAt=0; G._tmAutoErupt=null;
  DT.seekTo(500000);
  const terrHold=G.terrain;
  G.handleKey('5');                                     // press & hold
  ctx.__tick(30);  const aEarly=ashAlpha();             // ~0.5 s in
  ctx.__tick(60);  const aMid=ashAlpha();               // ~1.5 s in
  chk(aMid>aEarly,`the flash must ramp UP while held (${aEarly.toFixed(0)} -> ${aMid.toFixed(0)})`);
  ctx.__tick(Math.ceil(TM.erLongPressMs/16));  G.update(1);   // cross erLongPressMs
  chk(G._tmErFired===true,'holding past erLongPressMs fires the skip');
  chk(DT.yearsBP===349000,'a hold skips to the next eruption (Whakamaru, 349 ka)');
  chk(G.terrain===terrHold,'skip keeps the terrain object (morph, no reseed)');
  chk(G._tmAshMode==='hold','the skip flash falls from the charged peak');
  chk(ashAlpha()>=150,'the flash is near full when the skip lands');
  settle();

  // --- releasing after a hold must NOT also revert ----------------------
  const yRel=DT.yearsBP;
  G.handleKeyUp('5');
  chk(DT.yearsBP===yRel,'releasing after a hold does not also revert');

  // --- wrap: a hold past Whakamaru wraps forward to Kidnappers -----------
  G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0; G._tmAutoErAt=0; G._tmAutoErupt=null;
  DT.seekTo(200000);                                    // past Whakamaru, before Oruanui
  G.handleKey('5'); ctx.__tick(Math.ceil(TM.erLongPressMs/16)); G.update(1); G.handleKeyUp('5');
  chk(DT.yearsBP===DT.yearsStart,'a hold past Whakamaru wraps to Kidnappers (1 Ma)');
  settle();

  // leave state clean + clock reset for the sections below
  G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0; G._tmAutoErAt=0; G._tmAutoErupt=null;
  DT.reset();
  console.log(fail? `eruption: ${fail} FAILURES`
    : 'eruption nav: tap reverts (prev), hold skips (next, wraps at Whakamaru), cooldown + ramped hold flash');
}catch(e){ console.log('ERUPTION FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- habitat health: the split-growth lesson keyed to the climate -------------
// FOREST (warm) growth suits the interglacial, TUSSOCK (cold) growth suits the glacial. The
// RIGHT press for the current climate holds habitat health (full ground saturation); the WRONG
// press drains regime-fit and the scene quietly desaturates. Asserts the SIGN of the effect in
// both climate states — the core of md/TEMANAWA_INTERACTION_HEALTH_PLAN.md step 2. Drives the
// health update directly (flags forced live via a far-future `until`), so it is millis-clock-
// independent; regime-fit is read straight off Game (not the slow-slewed _sceneSat).
try{
  const G=vm.runInContext('game',ctx), DT=vm.runInContext('DeepTime',ctx);
  const season=G.seasonManager;
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const FAR=1e15;
  const climate=(yr)=>{ DT.seekTo(yr); season.update(1); return season.getWinterness(); };
  const drive=(warmUntil,coldUntil,n)=>{ G._tmGrowWarmUntil=warmUntil; G._tmGrowColdUntil=coldUntil;
    G._regimeFit=1; for(let i=0;i<n;i++) G._updateHabitatHealth(1); return G._regimeFit; };

  const gi=climate(122000);   // MIS 5e interglacial
  chk(gi<0.5, `122 ka reads interglacial (g=${gi.toFixed(2)})`);
  chk(drive(FAR,0,90) > 0.9, 'FOREST growth in an interglacial holds regime fit (right action)');
  chk(drive(0,FAR,90) < 0.8, 'TUSSOCK growth in an interglacial drains regime fit (wrong -> desaturates)');

  const gg=climate(140000);   // MIS 6 full glacial
  chk(gg>=0.5, `140 ka reads glacial (g=${gg.toFixed(2)})`);
  chk(drive(0,FAR,90) > 0.9, 'TUSSOCK growth in a glacial holds regime fit (right action)');
  chk(drive(FAR,0,90) < 0.8, 'FOREST growth in a glacial drains regime fit (wrong -> desaturates)');

  G._tmGrowWarmUntil=0; G._tmGrowColdUntil=0; G._regimeFit=1; DT.reset();
  console.log(fail? `habitat health: ${fail} FAILURES`
    : 'habitat health: split growth keyed to climate — right cover holds saturation, wrong drains it');
}catch(e){ console.log('HEALTH FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- kererū + seed dispersal --------------------------------------------------
// Kererū are the only large-seed disperser: Simulation.disperseSeed() is the one runtime path
// that GROWS the plant population (cap-guarded — nothing else adds plants). In the interglacial
// the forest recruits via kererū, so the recruitment term of habitat health holds; with no
// kererū it stalls and drains. md/TEMANAWA_INTERACTION_HEALTH_PLAN.md step 3.
try{
  const G=vm.runInContext('game',ctx), DT=vm.runInContext('DeepTime',ctx);
  const PT=vm.runInContext('PLANT_TYPES',ctx);
  const sim=G.simulation, season=G.seasonManager;
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  const ks = sim.otherEntities.kereru || [];
  const aliveK = ks.filter(k=>k.alive).length;
  chk(aliveK>0, `kererū spawn from initialEntityCounts (${aliveK} alive)`);
  const k = ks.find(x=>x.alive) || ks[0];
  chk(k && typeof k.behave==='function' && typeof k.update==='function' && typeof k.render==='function',
      'kererū implement behave/update/render (otherEntities contract)');

  // dispersal grows the plant population by one, near forest, as a low-growth warm seedling.
  // (relax the density gate here — this asserts the recruit mechanic, the gate is tested below)
  const M = vm.runInContext('LEVEL_MECHANICS', ctx);
  const savedDensMax = M ? M.disperseDensityMax : undefined;
  if(M) M.disperseDensityMax = 1e9;
  const n0 = sim.plants.length;
  let planted=null;
  for(let i=0;i<sim.plants.length && !planted;i++){
    const p=sim.plants[i], d=PT[p.type];
    if(d && d.coldTolerance<=0.65) planted=sim.disperseSeed(p.pos.x, p.pos.y);   // near a forest plant
  }
  chk(!!planted, 'disperseSeed plants a seedling near forest');
  if(planted){
    chk(sim.plants.length===n0+1, 'dispersal grows the plant population by one');
    chk(planted.growth<0.2, 'a dispersed seed starts as a low-growth seedling');
    chk(PT[planted.type] && PT[planted.type].coldTolerance<=0.65, 'kererū disperse a warm/forest (large-fruited) type');
  }
  if(M) M.disperseDensityMax = savedDensMax;

  // density gate: a drop into an already-dense stand is refused — only sparse canopy recruits.
  if(M){
    const Plant_=vm.runInContext('Plant',ctx);
    const sR=M.disperseDensityRadius, sMax=M.disperseDensityMax, keep=sim.plants.length;
    M.disperseDensityRadius=70; M.disperseDensityMax=3;
    let host=null;
    for(let i=0;i<sim.plants.length && !host;i++){ const p=sim.plants[i],d=PT[p.type]; if(p.alive&&d&&d.coldTolerance<=0.65) host=p; }
    if(host){
      for(let q=0;q<12;q++) sim.plants.push(new Plant_(host.pos.x, host.pos.y, host.type, sim.terrain, host.biomeKey));
      sim.updateSpatialGrids();                                          // refresh the plant grid so the gate sees them
      chk(sim.disperseSeed(host.pos.x, host.pos.y)===null, 'dispersal is refused in a dense stand (density gate)');
    }
    sim.plants.length=keep; M.disperseDensityRadius=sR; M.disperseDensityMax=sMax; sim.updateSpatialGrids();
  }

  // the live-plant cap is enforced HERE (the only place plants grow at runtime).
  const saveLen = sim.plants.length;
  while(sim.plants.length < 1000) sim.plants.push(sim.plants[0]);      // fill past any cap with refs
  chk(k ? sim.disperseSeed(k.pos.x,k.pos.y)===null : true, 'disperseSeed refuses past the live-plant cap');
  sim.plants.length = saveLen;                                        // restore

  // frugivore + reproduction contract: kererū carry sex / maturity / a fruit crop /
  // a behaviour state, and disperse only when they have eaten (crop > 0).
  chk(k && typeof k.isFemale==='boolean' && typeof k.mature==='boolean' &&
      typeof k.crop==='number' && typeof k.state==='string',
      'kererū carry sex / maturity / crop / state');

  // a kererū egg hatches a juvenile into the flock (the offspringType branch in
  // updateEggs → _hatchKereruEgg), mirroring the emergent eagle path.
  const kList = sim.otherEntities.kereru || [];
  const kBefore = kList.filter(x=>x.alive).length;
  const kegg = sim.addEgg(k ? k.pos.x : 100, k ? k.pos.y : 100);
  kegg.offspringType='kereru'; kegg.parentSpecies='kereru'; kegg.hatched=true;
  sim.updateEggs(1);
  const kNow = sim.otherEntities.kereru || [];
  chk(kNow.filter(x=>x.alive).length === kBefore+1, 'a kererū egg hatches a juvenile into the flock');
  const chick = kNow[kNow.length-1];
  chk(chick && chick.mature===false && typeof chick.crop==='number' &&
      typeof chick.behave==='function' && typeof chick.render==='function',
      'a hatched kererū is a juvenile with the frugivore fields');

  // recruitment term: interglacial + no kererū drains R; kererū present holds it.
  DT.seekTo(122000); season.update(1);
  const savedK = sim.otherEntities.kereru;
  G._recruitment=1; sim.otherEntities.kereru=[];
  for(let i=0;i<120;i++) G._updateHabitatHealth(1);
  chk(G._recruitment<0.9, 'no kererū in an interglacial drains recruitment (forest cannot recruit)');
  sim.otherEntities.kereru=savedK; G._recruitment=1;
  for(let i=0;i<60;i++) G._updateHabitatHealth(1);
  chk(G._recruitment>0.95, 'kererū present holds recruitment');

  G._recruitment=1; G._regimeFit=1; DT.reset();
  console.log(fail? `kererū: ${fail} FAILURES`
    : 'kererū: dispersal grows the forest (cap-guarded); recruitment stalls without them');
}catch(e){ console.log('KERERU FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- browse prunes, habitat removes: the two ways cover changes ----------------
// The design rule (TEMANAWA_PLAN_V3.md §4): a grazer's bite PRUNES a plant — it gets a
// little smaller and regrows — it never clears it. What makes a tree DISAPPEAR is
// unsuitable HABITAT: a canopy tree the glacial pushes outside the forest band dies
// back to nothing and regrows in place when the band returns. Reading the code missed a
// cover bug once (health-as-living-cover, MISTAKES.md), so assert the mechanism directly.
try{
  const Plant_=vm.runInContext('Plant',ctx), M=vm.runInContext('LEVEL_MECHANICS',ctx);
  const G=vm.runInContext('game',ctx), DT=vm.runInContext('DeepTime',ctx);
  const sim=G.simulation, season=G.seasonManager, terrain=sim.terrain;
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const floor=(M && M.browseFloor!=null)?M.browseFloor:0.3;
  const bk=(sim.plants[0]&&sim.plants[0].biomeKey)||'lowland';
  DT.seekTo(122000); season.update(1);                       // an interglacial — no dormancy, brisk growth

  // 1. BROWSING PRUNES, NEVER CLEARS. A grown plant, bitten hard, shrinks toward the
  //    stub, yields food per bite, is never pushed below the floor, and stays in the world.
  const bp=new Plant_(300,300,'tussock',terrain,bk);
  bp.growth=1.0; bp.alive=true; bp.dormant=false; bp.plantTypeModifier=1; bp.maxNutrition=bp.baseNutrition;
  const g0=bp.growth, gain1=bp.consume();
  chk(gain1>0, 'a bite yields food');
  chk(bp.growth<g0, 'a bite makes the plant a little smaller (growth drops)');
  chk(bp.alive && !bp._consumed, 'a browsed plant stays in the world — never removed or queued for removal');
  for(let i=0;i<20;i++) bp.consume();                        // graze it hard
  chk(bp.growth>=floor-1e-6, 'browsing can never crop a plant below the floor stub');
  chk(bp.alive, 'a hard-grazed plant is still alive (pruned, not cleared)');
  chk(bp.consume()<0.01, 'a plant cropped to the stub yields ~nothing to a further bite');
  const gStub=bp.growth; for(let i=0;i<60;i++) bp.update(season);
  chk(bp.growth>gStub, 'a browsed plant regrows in place afterwards');

  // 2. UNSUITABLE HABITAT DIES A TREE BACK, THEN IT RECOVERS. A canopy tree above every
  //    forest band (elevation 0.95 > every band max) is suppressed and dies back to nothing
  //    but survives in place as rootstock; dropped back inside the band it regrows where it stood.
  chk(!!(M && M.forestContraction && M.forestDieback), 'forest die-back is enabled in the level');
  const ht=new Plant_(300,300,'tawa',terrain,bk);            // tawa ∈ FOREST_TREES, NOT a cold refuge
  chk(ht._forestTree===true, 'a tawa is flagged a canopy tree (subject to die-back)');
  const fallMs=(M && M.forestDiebackFallMs)||800;
  ht.elevation=0.95; ht.growth=1.0; ht.alive=true;
  // FALL OVER, don't shrink: one update on unsuitable ground ARMS the fall — the tree keeps its
  // full size and topples over the real clock, only dropping to rootstock once the fall finishes.
  _t+=16; ht.update(season);
  chk(ht.suppressed===true, 'a canopy tree above the forest band is on unsuitable habitat (suppressed)');
  chk(ht._toppling===true, 'a died-back tree FALLS OVER (topple armed) rather than shrinking in place');
  chk(ht._toppleDir===1 || ht._toppleDir===-1, 'the fall has a random left/right direction');
  chk(ht.growth>0.5, 'the tree holds its full size WHILE it topples (it falls, then fades — no shrink)');
  _t += Math.floor(fallMs/2);                                // real time passes to mid-fall (no update → no finalize)
  const mid=ht._toppleProgress();
  chk(mid>0.3 && mid<0.8, `mid-fall the tree is partway over on the real clock (progress ${mid.toFixed(2)})`);
  _t += fallMs;                                              // let the fall play fully out
  for(let i=0;i<400;i++){ _t+=16; ht.update(season); }
  chk(ht.growth<=0.05, 'once the fall finishes the tree drops to nothing (invisible rootstock)');
  chk(ht.alive===true, 'a died-back tree survives in place as rootstock — never yanked from the world');
  chk(ht._toppleProgress()===1, 'a fully-fallen tree reads complete (progress 1 — faded out)');
  // TREES NEVER UN-GROW: the drawn growth (_dg) only rises, whatever browsing / dormancy / a storm
  // knock-back does to the sim growth; it restarts only when the tree really dies. Shrubs still crop.
  {
    const tr=new Plant_(310,310,'Totara',terrain,bk); tr.alive=true; tr.growth=1; tr._matured=true;
    chk(tr._dg()===1, 'a grown tree draws at full size');
    tr.growth=0.3; tr.goDormant(); tr.dormant=false;
    chk(tr._dg()===1, 'browsing/dormancy lowering a tree\'s sim growth never shrinks the drawn tree');
    const sap=new Plant_(320,320,'Totara',terrain,bk); sap.alive=true; sap._matured=false; sap.growth=0.6;
    chk(sap._dg()===0.6, 'a growing tree draws at its growth');
    sap.growth=0.3; chk(sap._dg()===0.6, 'a bite never steps a growing tree back to an earlier sapling frame');
    sap.growth=0.7; chk(sap._dg()===0.7, '…and it keeps growing visibly from there');
    sap.alive=false; sap.update(season); sap.alive=true; sap.growth=0.3;
    chk(sap._dg()===0.3, 'after a real death the tree regrows honestly from a sapling');
    chk(new Plant_(330,330,'fern',terrain,bk)._tree===true, 'the tree fern is a tree (never un-grows)');
    const sh=new Plant_(340,340,'tussock',terrain,bk); sh.alive=true; sh.growth=1; sh._dg(); sh.growth=0.4;
    chk(sh._dg()===0.4, 'a shrub/grass still visibly shrinks when cropped');
  }
  // Gentle fall shape: a slow lean at the start (zero speed), a soft settle at the end, faded by the end.
  const TA=(t)=>Plant_.toppleAngle(t), TAl=(t)=>Plant_.toppleAlpha(t);
  chk(TA(0)===0 && TA(0.1)<0.03 && TA(0.3)<0.1, 'the fall STARTS gently — barely a lean over its first 30%');
  chk(TA(1)-TA(0.95) < TA(0.55)-TA(0.5), 'the fall settles softly — slower at the end than mid-fall');
  chk(TAl(0.5)===1 && TAl(1)===0 && TAl(0.8)>0 && TAl(0.8)<1, 'opaque through the fall, fades only as it settles');
  ht.elevation=0.30;                                         // the band climbs back over it
  for(let i=0;i<400;i++) ht.update(season);
  chk(ht._toppling===false, 'the tree stands back up when habitat returns (topple cleared)');
  chk(ht.suppressed===false && ht.growth>0.5, 'the forest regrows in place when suitable habitat returns');

  // BEECH is the GLACIAL REFUGIUM tree — still a canopy die-back tree, but EXEMPT from the forest-
  // contraction suppression, so it HOLDS where the warm forest retreats (memory beech-glacial-refuge).
  const bh=new Plant_(300,300,'beech',terrain,bk);
  chk(bh._forestTree===true, 'beech is still flagged a canopy tree (die-back applies)');
  bh.elevation=0.95; bh.growth=1.0; bh.alive=true;           // above every band — a warm tree would be suppressed
  for(let i=0;i<400;i++) bh.update(season);
  chk(bh.suppressed===false && bh.growth>0.5, 'beech is NOT suppressed by forest contraction — the cold refuge holds');

  DT.reset();
  console.log(fail? `browse & habitat: ${fail} FAILURES`
    : 'browse & habitat: grazing prunes (smaller, never removed); unsuitable habitat dies trees back, then regrows them');
}catch(e){ console.log('BROWSE FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- disturbance / warp clock (§9) + wetland bloom ----------------------------
// A storm/eruption stamps disturb(); warpAt raises LOCAL recovery for a window that decays on
// REAL time (rdt), so an aftermath regrows as a visible ~2 s beat instead of an instant snap even
// under 10× fast-forward. The eruption also blooms the wetland (finding #4). It is a deterministic
// list of active disturbances, not a per-cell field — so nothing to tear across the sliced morph.
try{
  const Plant_=vm.runInContext('Plant',ctx);
  const G=vm.runInContext('game',ctx), DT=vm.runInContext('DeepTime',ctx);
  const sim=G.simulation, season=G.seasonManager, terrain=sim.terrain;
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const bk=(sim.plants[0]&&sim.plants[0].biomeKey)||'lowland';
  DT.seekTo(122000); season.update(1);                       // an interglacial — brisk growth, no dormancy

  sim._disturbances=[]; sim._disturbActive=false;
  chk(sim.warpAt(400,400)===0, 'warp is 0 with no active disturbance');
  sim.disturb(400,400, 50, 'gale', 1);
  chk(sim.warpAt(400,400)>0.9, 'a fresh disturbance raises warp at its centre');
  chk(sim.warpAt(400,900)===0, 'warp is 0 beyond the disturbance radius');

  // warp accelerates recovery: two identical bare plants, same spot, one warped one not.
  const pA=new Plant_(400,400,'tussock',terrain,bk); pA.alive=false; pA.growth=0; pA.regrowthTimer=0;
  const pB=new Plant_(400,400,'tussock',terrain,bk); pB.alive=false; pB.growth=0; pB.regrowthTimer=0;
  for(let i=0;i<8;i++){ pA.update(season,1,1); pB.update(season,1,0); }
  chk(pA.regrowthTimer > pB.regrowthTimer*1.5, 'warp accelerates a plant\'s recovery (the visible aftermath beat)');

  // it decays back to nothing on REAL time, so it cannot outlive the ~2 s beat under fast-forward.
  for(let i=0;i<200;i++) sim.updateDisturbance(1);
  chk(sim.warpAt(400,400)===0 && sim._disturbActive===false, 'the warp decays back to nothing on real time');

  // wetland bloom seeds only into wetland ground (cap/water-guarded; 0 on a seed with no wetland shown).
  const before=sim.plants.length;
  const bloomed=sim.bloomWetland(10);
  chk(bloomed>=0 && sim.plants.length===before+bloomed, 'bloomWetland adds exactly its seeded count');

  DT.reset(); sim._disturbances=[]; sim._disturbActive=false;
  console.log(fail? `disturbance/warp: ${fail} FAILURES`
    : 'disturbance/warp: disturb()+warpAt speed local recovery then decay on real time; the eruption blooms the wetland');
}catch(e){ console.log('WARP FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- kahikatea: the swamp-forest disturbance coloniser (wetland doc §4.1) ------
// Kahikatea is NOT a climax tree — it recruits ONLY on raw river alluvium (a storm flood, an eruption
// sediment pulse, or the deep-time channel shift), never via the free kererū/FOREST-button paths, and
// a stand with no fresh disturbance AGES OUT. This is the rule that couples the swamp forest to the
// moving river (the last ecology loop).
try{
  const Plant_=vm.runInContext('Plant',ctx), PT=vm.runInContext('PLANT_TYPES',ctx), M=vm.runInContext('LEVEL_MECHANICS',ctx);
  const G=vm.runInContext('game',ctx), DT=vm.runInContext('DeepTime',ctx);
  const sim=G.simulation, season=G.seasonManager, terrain=sim.terrain;
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const bk=(sim.plants[0]&&sim.plants[0].biomeKey)||'lowland';
  DT.seekTo(122000); season.update(1);                       // an interglacial — no dormancy

  chk(PT.kahikatea && PT.kahikatea.disturbanceRecruit===true, 'kahikatea is flagged disturbanceRecruit (kept out of free kererū/button recruitment)');

  // 1. it AGES without disturbance; a warp (fresh alluvium) resets the clock.
  const k=new Plant_(300,300,'kahikatea',terrain,bk); k.alive=true; k.growth=1; k.elevation=0.35; k._kahiAge=0;
  for(let i=0;i<10;i++) k.update(season,5,0);
  chk(k._kahiAge>0, 'kahikatea ages when the river is static (no warp)');
  k.update(season,5,1);                                       // a warp = a river disturbance
  chk(k._kahiAge===0, 'a river disturbance (warp) rejuvenates the stand — resets its age');

  // 2. an over-age kahikatea senesces: wilts back, dies, and does NOT regrow (the stand ages out).
  const maxAge=(M&&M.kahiMaxAge)||900;
  k._kahiAge=maxAge+1; k.growth=1; k.alive=true; k._senescent=false; k._matured=true;
  k.update(season,5,0);
  chk(k._toppling===true && k.growth===1 && k.alive, 'an over-age kahikatea FALLS OVER (topple armed) at full size, not shrinking in place');
  k.update(season,5,1);                                       // a warp mid-fall must not stand it back up
  chk(k._toppling===true, 'a falling kahikatea is committed — a warp mid-fall does not freeze it half-fallen');
  k.goDormant(); k.dormant=false;
  chk(k.growth===1, 'a falling tree cannot be shrunk by dormancy mid-fall');
  chk(k.consume()===0 && k.growth===1, 'a falling tree cannot be browsed smaller mid-fall');
  const fallMs=(M&&M.forestDiebackFallMs)||800;
  for(let i=0;i<Math.ceil(fallMs/16)+2 && k.alive;i++){ _t+=16; k.update(season,5,0); }
  chk(k._senescent===true && k.alive===false && k._toppling===false, 'an over-age kahikatea senesces and dies once its fall plays out — the stand ages out');
  const g0=k.growth; k.update(season,5,0);
  chk(k.growth===g0, 'a senesced kahikatea is inert — it never regrows');

  // 3. recruitKahikatea seeds kahikatea onto wetland ground (cap/water-guarded).
  const before=sim.plants.length;
  const rec=sim.recruitKahikatea(6);
  chk(rec>=0 && sim.plants.length===before+rec, 'recruitKahikatea adds exactly its seeded count');
  if(rec>0){ const last=sim.plants[sim.plants.length-1]; chk(last.type==='kahikatea' && last.biomeKey==='wetland', 'recruited kahikatea land on wetland ground'); }

  DT.reset(); sim._disturbances=[]; sim._disturbActive=false;
  console.log(fail? `kahikatea recruitment: ${fail} FAILURES`
    : 'kahikatea recruitment: recruits only on a river disturbance (storm/eruption/channel shift); ages out without one');
}catch(e){ console.log('KAHI FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- kōkako + huia: the other flighted forest birds ---------------------------
// Both EXTEND Kereru (own base type + otherEntities list, short-flight frugivore
// loop), disperse >50% less than the kererū, and breed true through the shared
// flyer egg path. Huia found as bonded male+female pairs that forage the same
// tree; the kōkako holds a territory and SINGS — a song makes the nearest kōkako
// answer while crowded-in rivals are pushed off to new ground. See TeManawa_kokako.js
// / TeManawa_huia.js.
try{
  const G=vm.runInContext('game',ctx);
  const Kokako=vm.runInContext('Kokako',ctx), Huia=vm.runInContext('Huia',ctx);
  const KOK=vm.runInContext('KOKAKO_SPECIES',ctx), HUI=vm.runInContext('HUIA_SPECIES',ctx);
  const KST=vm.runInContext('KERERU_STATE',ctx), KKST=vm.runInContext('KOKAKO_STATE',ctx);
  const sim=G.simulation;
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  // spawn from initialEntityCounts, into their own flyer lists.
  const kok = sim.otherEntities.kokako || [];
  const hui = sim.otherEntities.huia || [];
  chk(kok.filter(x=>x.alive).length>0, `kōkako spawn from initialEntityCounts (${kok.length})`);
  chk(hui.filter(x=>x.alive).length>0, `huia spawn from initialEntityCounts (${hui.length})`);
  const ko = kok.find(x=>x.alive), hu = hui.find(x=>x.alive);
  chk(ko instanceof Kokako, 'a spawned kōkako is a Kokako instance');
  chk(hu instanceof Huia, 'a spawned huia is a Huia instance');
  chk(ko && ko.isFlyer===true && typeof ko.behave==='function' && typeof ko.update==='function' &&
      typeof ko.render==='function', 'kōkako implement the flyer contract (behave/update/render, drawn above)');
  chk(hu && hu.isFlyer===true, 'huia are flyers (rendered above the ground plane)');

  // dispersal: both carry a chance well under half the kererū's (which is 1), but
  // still disperse some. This is the >50%-less requirement.
  chk(KOK.disperseChance>0 && KOK.disperseChance<0.5, `kōkako disperse >50% less than the kererū (${KOK.disperseChance})`);
  chk(HUI.disperseChance>0 && HUI.disperseChance<0.5, `huia disperse >50% less than the kererū (${HUI.disperseChance})`);
  chk(ko && ko._disperseChance===KOK.disperseChance, 'the reduced dispersal chance reaches the kōkako instance');

  // forest fidelity: each holds a home anchor the flying loop orbits (kōkako a
  // territory, huia its mate) rather than ranging like the free kererū.
  chk(ko && typeof ko._anchorPoint==='function' && ko._anchorPoint()!==null,
      'a kōkako holds a territory anchor (stays on its patch of forest)');

  // huia found as bonded male+female pairs.
  chk(hui.length>=2 && hui.length%2===0, `huia spawn as whole pairs (${hui.length})`);
  const bonded = hui.filter(h=>h._mate && h._mate.alive && h._mate.isFemale!==h.isFemale).length;
  chk(bonded===hui.length, `every founder huia is bonded to an opposite-sex mate (${bonded}/${hui.length})`);
  const female = hui.find(h=>h.isFemale && h._mate), male = female && female._mate;
  chk(male && male._anchorPoint()===female.pos, 'a huia anchors to its mate (hangs around the same tree)');
  if(male && female){
    const fake={alive:true,dormant:false,growth:1,pos:{x:female.pos.x,y:female.pos.y}};
    female._targetTree=fake; male._mate=female;
    chk(male._findFruitTree(sim)===fake, 'the male huia forages on the female\'s tree (pair forages together)');
    female._targetTree=null;
  }

  // kōkako SONG: a secure, perched kōkako breaks into a SINGING state (it sits on
  // the tree longer). The nearest kōkako in earshot is told to answer; a third bird
  // crowded inside the territory radius is displaced to new ground.
  const savedStormUntil=G._tmStormUntil, savedOveruse=G._stormOveruse;
  G._tmStormUntil=0; G._stormOveruse=false;                    // clear any storm ground-hold for the test
  if(kok.length>=3){
    const singer=kok[0], responder=kok[1], third=kok[2];
    // park every other kōkako far away so only these three interact.
    for(let i=3;i<kok.length;i++){ kok[i].pos.x=12; kok[i].pos.y=12; }
    singer.pos.x=500; singer.pos.y=500;
    responder.pos.x=560; responder.pos.y=500;                  // 60px — nearest, answers
    third.pos.x=500;    third.pos.y=620;                       // 120px — inside territory, displaced
    singer.state=KST.PERCHED; singer.hunger=0;                 // secure on a perch
    singer._singCooldown=0; singer._songTimer=0; singer._respondSing=false; singer._restTimer=1000;
    responder._respondSing=false; third._relocating=false;
    const posSq=(third.pos.x-500)**2+(third.pos.y-500)**2;   // third's distance² from the singer now
    singer.behave(sim, G.seasonManager, 1);
    chk(singer.state===KKST.SINGING, 'a secure kōkako breaks into a song (SINGING state — sits longer on the tree)');
    chk(responder._respondSing===true, 'the nearest kōkako in earshot is told to answer (call and response)');
    chk(third._relocating===true, 'a crowded-in kōkako is pushed to seek a different territory');
    const terr1=(third._territory.x-500)**2+(third._territory.y-500)**2;
    chk(terr1 > posSq, 'the displaced kōkako claims new ground farther out from the singer');
    singer.render();                                           // exercise the singing render (_renderExtra)
  }
  G._tmStormUntil=savedStormUntil; G._stormOveruse=savedOveruse;

  // breed true through the shared flyer egg path (_hatchFlyerEgg).
  const kokBefore=(sim.otherEntities.kokako||[]).filter(x=>x.alive).length;
  const ke=sim.addEgg(ko?ko.pos.x:100, ko?ko.pos.y:100); ke.offspringType='kokako'; ke.parentSpecies='kokako'; ke.hatched=true;
  sim.updateEggs(1);
  const kokAfter=sim.otherEntities.kokako||[];
  chk(kokAfter.filter(x=>x.alive).length===kokBefore+1, 'a kōkako egg hatches a juvenile into the flock');
  chk(kokAfter[kokAfter.length-1] instanceof Kokako, 'the kōkako hatchling breeds true (a Kokako, not a kererū)');
  const huiBefore=(sim.otherEntities.huia||[]).filter(x=>x.alive).length;
  const he=sim.addEgg(hu?hu.pos.x:100, hu?hu.pos.y:100); he.offspringType='huia'; he.parentSpecies='huia'; he.hatched=true;
  sim.updateEggs(1);
  const huiAfter=sim.otherEntities.huia||[];
  chk(huiAfter.filter(x=>x.alive).length===huiBefore+1, 'a huia egg hatches a juvenile into the flock');
  chk(huiAfter[huiAfter.length-1] instanceof Huia, 'the huia hatchling breeds true (a Huia)');

  // ---- tūī: the singing nectar-feeder (extends Kokako; a STRONG flier) --------------
  const Tui=vm.runInContext('Tui',ctx), TUI=vm.runInContext('TUI_SPECIES',ctx);
  const FVS=vm.runInContext('FLYER_VARIANT_SETS',ctx), ESf=vm.runInContext('EntitySprites',ctx);
  chk(!!Tui && !!TUI, 'Tui class + TUI_SPECIES are defined');
  const tui = sim.otherEntities.tui || [];
  chk(tui.filter(x=>x.alive).length>0, `tūī spawn from initialEntityCounts (${tui.length})`);
  const tu = tui.find(x=>x.alive);
  chk(tu instanceof Tui, 'a spawned tūī is a Tui instance');
  chk(tu instanceof Kokako, 'the tūī extends Kokako (reuses the song/territory machinery)');
  chk(tu && tu.isFlyer===true, 'tūī are flyers (rendered above the ground plane)');
  // dispersal sits BETWEEN the weak-gaped kōkako/huia (0.4) and the kererū (1.0).
  chk(TUI.disperseChance>KOK.disperseChance && TUI.disperseChance<1,
      `tūī disperse more than the kōkako but less than the kererū (${TUI.disperseChance})`);
  // a STRONG flier, unlike the weak kōkako/huia: faster and higher-cruising.
  chk(TUI.baseSpeed>KOK.baseSpeed, `tūī fly faster than the kōkako (${TUI.baseSpeed} > ${KOK.baseSpeed})`);
  chk(TUI.cruiseAlt>KOK.cruiseAlt, `tūī cruise higher than the kōkako (${TUI.cruiseAlt} > ${KOK.cruiseAlt})`);
  // it sings + holds a (loose) territory — the kōkako anchor machinery.
  chk(tu && typeof tu._anchorPoint==='function' && tu._anchorPoint()!==null,
      'a tūī holds a territory anchor it sings from (inherited from the kōkako)');
  // sprite wiring: its own multi-state flyer set, and the 240-frame Hopping export is
  // referenced as only its 10 UNIQUE frames (00010==00000, …) so the atlas stays lean.
  chk(FVS && FVS.tui && FVS.tui.states && FVS.tui.states.flying && FVS.tui.states.eating,
      'tūī is wired to its dedicated multi-state flyer sprite set');
  chk(FVS && FVS.tui && FVS.tui.states.hopping.count<=15,
      `tūī hopping references the deduped loop, not the 240-frame export (${FVS && FVS.tui && FVS.tui.states.hopping.count})`);
  chk(ESf && ESf.tui && typeof ESf.getTuiSprite==='function', 'the tūī sprite getter is wired (getTuiSprite)');
  // breed true through the shared flyer egg path.
  const tuiBefore=(sim.otherEntities.tui||[]).filter(x=>x.alive).length;
  const te=sim.addEgg(tu?tu.pos.x:100, tu?tu.pos.y:100); te.offspringType='tui'; te.parentSpecies='tui'; te.hatched=true;
  sim.updateEggs(1);
  const tuiAfter=sim.otherEntities.tui||[];
  chk(tuiAfter.filter(x=>x.alive).length===tuiBefore+1, 'a tūī egg hatches a juvenile into the flock');
  chk(tuiAfter[tuiAfter.length-1] instanceof Tui, 'the tūī hatchling breeds true (a Tui, not a kererū)');

  // ---- landing animation must NOT force the touch-down pose at cruise height ----------
  // Regression guard for the "flying birds jump to the ground momentarily, many at once" bug.
  // When a flyer decides to settle, its logical state flips to perched while the EASED altitude
  // is still at cruise. _flyerAnim must hold the CRUISE flap until the bird has actually
  // descended — entering the landing window only on the final approach (fp<=0.5), then the
  // perched cel cycle at the bottom. Playing the touch-down frames at height snapped the pose
  // downward, and a whole flock landing on the same frame did it together.
  {
    const kf = (sim.otherEntities.kokako||[]).find(x=>x.alive) || (sim.otherEntities.kereru||[]).find(x=>x.alive);
    chk(!!kf,'a live flyer is available for the landing-anim guard');
    if (kf) {
      kf.state = KST.FEEDING;                       // decided to settle (a perched state)
      kf._perchAltCur = kf._perchAlt;               // known perch target
      const cruise = kf._cruiseAlt, perch = kf._perchAltCur, span = Math.max(1, cruise - perch);
      const at = (fp) => { kf._altitude = perch + fp*span; return kf._flyerAnim().state; };
      chk(at(1.0)==='cruise','settling at cruise height keeps the CRUISE flap (no forced land pose at altitude)');
      chk(at(0.7)==='cruise','still high (fp 0.7) reads as cruise, not land');
      chk(at(0.35)==='land','on the final approach (fp 0.35) the landing window plays');
      chk(at(0.05)==='eating','settled at the perch (fp 0.05, feeding) plays the perched EATING cycle');
    }
  }

  console.log(fail? `flighted forest birds: ${fail} FAILURES`
    : 'flighted forest birds: kōkako sing + hold territory, huia pair-bond, tūī sing + fly strong; all disperse <the kererū and breed true; landing anim holds cruise until descent');
}catch(e){ console.log('KOKAKO/HUIA FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- North Island goose + the open-country tussock lift ------------------------
// The goose (Cnemiornis gracilis) is a moa-guild grazer: registered under the `moa`
// base type with its own Goose class, so it lives in the moa list and reuses the
// grazer engine. The goose + the plains/coastal moa (flagged `openCountry`) get a
// small population lift while the visitor grows TUSSOCK in a GLACIAL — the matched
// cold regime (Game._tussockFlush). "Cold is busier, not emptier" (ECOLOGY_FAUNA).
try{
  const G=vm.runInContext('game',ctx), DT=vm.runInContext('DeepTime',ctx);
  const REG=vm.runInContext('REGISTRY',ctx), Goose=vm.runInContext('Goose',ctx);
  const sim=G.simulation, season=G.seasonManager;
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  // registration + identity: a moa-guild species with its own class, flagged lowland.
  const gs = REG.getSpecies('giant_goose');
  chk(!!gs, 'giant_goose is registered');
  chk(gs && gs.baseType==='moa', 'goose registers under the moa guild (shares the grazer engine)');
  chk(gs && gs.class===Goose, 'goose uses the Goose behaviour class');
  chk(gs && gs.config.openCountry===true, 'goose is flagged open-country');
  chk(gs && gs.config.preferredElevation && gs.config.preferredElevation.max<=0.30,
      `goose favours lowland/coast (band max ${gs && gs.config.preferredElevation && gs.config.preferredElevation.max})`);

  // it spawns into the moa list and runs the grazer contract.
  const geese = sim.moas.filter(m=>m.speciesKey==='giant_goose');
  chk(geese.length>0, `geese spawn into the moa list (${geese.length})`);
  const goose = geese[0];
  chk(goose && Goose && goose instanceof Goose, 'a spawned goose is a Goose instance');
  chk(goose && typeof goose.behave==='function' && typeof goose.applySeparation==='function',
      'goose runs the moa grazer contract (behave / applySeparation)');

  // the plains/coastal moa share the flag; a forest moa does not.
  for (const key of ['stout_legged_moa','mantells_moa','heavy_footed_moa','south_island_giant_moa']){
    const s=REG.getSpecies(key); chk(s && s.config.openCountry===true, `${key} is open-country`);
  }
  const forest=REG.getSpecies('north_island_giant_moa');
  chk(forest && !forest.config.openCountry, 'a forest moa (NI giant) is NOT open-country');

  // mōho / NI takahē — the same moa-guild pattern, a territorial rail. NOT the SI takahē.
  const Takahe=vm.runInContext('Takahe',ctx);
  const ts = REG.getSpecies('north_island_takahe');
  chk(!!ts, 'north_island_takahe (mōho) is registered');
  chk(ts && ts.baseType==='moa' && ts.class===Takahe, 'mōho is a moa-guild grazer with the Takahe class');
  chk(ts && ts.config.scientificName==='Porphyrio mantelli', 'mōho is P. mantelli (NI), not the SI takahē');
  chk(ts && ts.config.openCountry===true, 'mōho is flagged open-country');
  const takahe = sim.moas.find(m=>m.alive && m.speciesKey==='north_island_takahe');
  chk(!!takahe, 'mōho spawns into the moa list');
  chk(takahe && Takahe && takahe instanceof Takahe, 'a spawned mōho is a Takahe instance');
  // territorial: it holds a tighter home range than a roaming moa, and does not do the
  // moa's seasonal elevation migration (only relocates when starving with no food).
  chk(takahe && takahe.homeRangeRadius<=50, 'mōho holds a tight territory (small home range)');
  if (takahe){
    takahe.hunger=10; takahe.localFoodScore=1;
    chk(takahe.shouldMigrate({migrationStrength:1})===false, 'a fed mōho stays put (no seasonal migration)');
  }

  // sprite wiring: the goose and mōho render through dedicated moa-variant art now.
  const MVS=vm.runInContext('MOA_VARIANT_SETS',ctx);
  chk(gs && gs.config.spriteSet==='goose' && MVS && MVS.goose, 'goose is wired to its dedicated sprite set');
  chk(ts && ts.config.spriteSet==='takahe' && MVS && MVS.takahe, 'mōho is wired to its dedicated sprite set');
  // the goose/takahē art is MULTI-STATE now (was a flat placeholder): looking/eating/walking.
  chk(MVS && MVS.goose && MVS.goose.states && MVS.goose.states.eating, 'goose art is multi-state (looking/eating/walking)');
  chk(MVS && MVS.takahe && MVS.takahe.states && MVS.takahe.states.walking, 'mōho art is multi-state');

  // NI brown kiwi — the forest-floor member of the guild, and the WARM-phase mirror of the
  // open-country grazers: NOT open-country, favours the forest band, and its unique quirk
  // HEALS the forest floor (a gentle soil-turning warp where it forages).
  const Kiwi=vm.runInContext('Kiwi',ctx);
  const ks = REG.getSpecies('north_island_brown_kiwi');
  chk(!!ks, 'north_island_brown_kiwi is registered');
  chk(ks && ks.baseType==='moa' && ks.class===Kiwi, 'kiwi is a moa-guild grazer with the Kiwi class');
  chk(ks && ks.config.scientificName==='Apteryx mantelli', 'kiwi is A. mantelli (the NI brown kiwi)');
  chk(ks && !ks.config.openCountry, 'kiwi is NOT open-country (the forest mirror of the goose/mōho)');
  chk(ks && ks.config.preferredElevation && ks.config.preferredElevation.min>=0.25,
      `kiwi favours the forest band (band min ${ks && ks.config.preferredElevation && ks.config.preferredElevation.min})`);
  chk(ks && ks.config.spriteSet==='kiwi' && MVS && MVS.kiwi && MVS.kiwi.states,
      'kiwi is wired to its dedicated multi-state sprite set');
  // forest bird, so cold is HARDER — glacial hungerRate above interglacial (opposite of the grazers).
  chk(ks && ks.config.seasonalModifiers &&
      ks.config.seasonalModifiers.fullGlacial.hungerRate > ks.config.seasonalModifiers.interglacial.hungerRate,
      'kiwi struggles in the glacial and thrives in the interglacial (opposite the open-country grazers)');

  const kiwi = sim.moas.find(m=>m.alive && m.speciesKey==='north_island_brown_kiwi');
  chk(!!kiwi, 'kiwi spawns into the moa list');
  chk(kiwi && Kiwi && kiwi instanceof Kiwi, 'a spawned kiwi is a Kiwi instance');

  // the quirk: a foraging kiwi on forest floor stamps a gentle soil-turning warp (the §9
  // disturbance clock). Stub the biome to forest and pin it into a foraging state, then
  // drive a few ticks until it probes — robust to the odd flee/idle tick. NOTE: the pinned
  // hunger MUST stay below the kiwi's maxHunger (70), or super.behave correctly starves it
  // (alive=false) and the quirk's own `if (!this.alive) return` fires before the stamp —
  // that killed an earlier hunger=90 version intermittently (food-availability dependent).
  // hunger 50 forces FORAGING (>threshold 30, localFoodScore≥0.3) without dying.
  if (kiwi){
    const origBiome = kiwi.terrain.getBiomeAt;
    kiwi.terrain.getBiomeAt = ()=>({key:'montane'});
    let kd=null;
    for (let t=0;t<60 && !kd;t++){
      kiwi.hunger=50; kiwi.localFoodScore=1; kiwi._probeTimer=0;
      kiwi.behave(sim, season, 1);
      const D=sim._disturbances||[]; kd=D.find(d=>d.kind==='kiwi')||null;
    }
    kiwi.terrain.getBiomeAt = origBiome;
    chk(kiwi.alive, 'the test kiwi survived the probe (pinned hunger below maxHunger)');
    chk(!!kd, 'a foraging kiwi turns the forest floor (stamps a kiwi soil-turning warp)');
    chk(kd && kd.strength < 0.5, 'the kiwi warp is GENTLE (strength < 0.5, vs 1.0 for a storm/bloom)');
    // and it never fires on open ground.
    kiwi.terrain.getBiomeAt = ()=>({key:'grassland'});
    const nBefore=(sim._disturbances||[]).filter(d=>d.kind==='kiwi').length;
    kiwi.hunger=50; kiwi.localFoodScore=1; kiwi._probeTimer=0; kiwi.behave(sim, season, 1);
    const nAfter=(sim._disturbances||[]).filter(d=>d.kind==='kiwi').length;
    kiwi.terrain.getBiomeAt = origBiome;
    chk(nAfter===nBefore, 'a kiwi does NOT turn open ground (soil-turning is forest-only)');
  }

  // Finsch's duck — the open-country grazing duck of the guild (own FinschDuck class, a
  // gentler loose-flock version of the goose; a common, mild-cold-leaning lowland grazer).
  const FinschDuck=vm.runInContext('FinschDuck',ctx), FDS=vm.runInContext('FINSCH_DUCK_SPECIES',ctx);
  chk(!!FinschDuck && !!FDS, 'FinschDuck class + FINSCH_DUCK_SPECIES are defined');
  const ds = REG.getSpecies('finschs_duck');
  chk(!!ds, 'finschs_duck is registered');
  chk(ds && ds.baseType==='moa' && ds.class===FinschDuck, 'Finsch\'s duck is a moa-guild grazer with the FinschDuck class');
  chk(ds && ds.config.scientificName==='Chenonetta finschi', 'Finsch\'s duck is C. finschi (the terrestrial grazing duck)');
  chk(ds && ds.config.openCountry===true, 'Finsch\'s duck is flagged open-country (shares the tussock-in-glacial lift)');
  chk(ds && ds.config.spriteSet==='finschDuck' && MVS && MVS.finschDuck && MVS.finschDuck.states,
      'Finsch\'s duck is wired to its dedicated multi-state sprite set');
  // a MILD cold lean (busier in the cold, less extreme than the goose).
  const _dsm=ds && ds.config.seasonalModifiers;
  chk(_dsm && _dsm.interglacial.hungerRate > _dsm.fullGlacial.hungerRate,
      'Finsch\'s duck leans cold (open glacial country suits it — like the goose, milder)');
  const duck = sim.moas.find(m=>m.alive && m.speciesKey==='finschs_duck');
  chk(!!duck, 'Finsch\'s duck spawns into the moa list');
  chk(duck && FinschDuck && duck instanceof FinschDuck, 'a spawned duck is a FinschDuck instance');
  // loose flock: a same-species cohesion, gentler than the goose's tight gaggle (0.25 urgency).
  chk(duck && typeof duck.applySeparation==='function' && duck._flockUrgency>0 && duck._flockUrgency<0.25,
      'a duck flocks loosely (gentler cohesion than the goose\'s gaggle)');

  // the flush flag: only TUSSOCK grown in a glacial arms it.
  const FAR=1e15;
  const flush=(warmUntil,coldUntil,yr)=>{ DT.seekTo(yr); season.update(1);
    G._tmGrowWarmUntil=warmUntil; G._tmGrowColdUntil=coldUntil; G._updateHabitatHealth(1); return G._tussockFlush; };
  chk(flush(0,FAR,140000)===true,  'TUSSOCK in a glacial arms the open-country flush');
  chk(flush(0,FAR,122000)===false, 'TUSSOCK in an interglacial does not (wrong regime)');
  chk(flush(FAR,0,140000)===false, 'FOREST growth never arms the tussock flush');
  chk(flush(0,0,140000)===false,   'no growth pressed → no flush');

  // the flag actually reaches the grazer (behave sets _openCountryBoost from it).
  if (goose){
    DT.seekTo(140000); season.update(1);
    G._tussockFlush=true;  goose.behave(sim, season, 1); chk(goose._openCountryBoost===true,  'flush on → the grazer takes the open-country boost');
    G._tussockFlush=false; goose.behave(sim, season, 1); chk(goose._openCountryBoost===false, 'flush off → no boost');
  }

  G._tmGrowWarmUntil=0; G._tmGrowColdUntil=0; G._tussockFlush=false; G._regimeFit=1; DT.reset();
  console.log(fail? `grazers: ${fail} FAILURES`
    : 'grazers: goose + mōho + kiwi + Finsch\'s duck are moa-guild birds (dedicated multi-state art); open-country lift on TUSSOCK-in-glacial; mōho territorial; kiwi turns the forest floor; duck flocks loosely');
}catch(e){ console.log('GRAZERS FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- climate-affinity tag + baked authoring tint ------------------------------
// The 'warm'/'cold'/'neutral' tag is DERIVED from the same authored fields the sim already
// uses (coldTolerance for flora, seasonalModifiers for fauna) — no second table to drift
// out of sync. The render tint bakes once per (frame,colour) and is off unless the C-key
// authoring toggle (CONFIG.showClimateAffinity) is on. Assert the derivation matches the
// data, the cache reuses baked frames, and the toggled render path doesn't throw.
try{
  const CA=vm.runInContext('ClimateAffinity',ctx), TB=vm.runInContext('TintBaker',ctx);
  const CONF=vm.runInContext('CONFIG',ctx), REG=vm.runInContext('REGISTRY',ctx);
  const G=vm.runInContext('game',ctx);
  const sim=G.simulation;
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  chk(!!CA && !!TB, 'ClimateAffinity + TintBaker are defined');

  // FLORA: coldTolerance split at TM_GROW.warmMax(0.65)/coldMin(0.75).
  chk(CA.ofPlantType('tussock')==='cold',   'tussock (coldTolerance 1.0) tags cold/glacial-boosted');
  chk(CA.ofPlantType('coprosma')==='cold',  'grey scrub (0.85) tags cold');
  chk(CA.ofPlantType('fern')==='warm',      'fern (0.1) tags warm/interglacial-boosted');
  chk(CA.ofPlantType('Totara')==='warm',    'tōtara (0.3) tags warm');
  chk(CA.ofPlantType('manuka')==='neutral', 'mānuka (0.7, between the thresholds) tags neutral');
  chk(CA.ofPlantType('nonesuch')==='neutral','an unknown plant type tags neutral (no throw)');

  // FAUNA: interglacial vs fullGlacial hungerRate (lower = thrives).
  const upl=REG.getSpecies('stout_legged_moa'), lbm=REG.getSpecies('little_bush_moa');
  chk(upl && CA.ofSpeciesConfig(upl.config)==='cold', 'stout-legged moa (easier in the cold) tags cold');
  chk(lbm && CA.ofSpeciesConfig(lbm.config)==='warm', 'little bush moa (easier in the warm) tags warm');
  chk(CA.ofSpeciesConfig({})==='neutral', 'a species with no seasonalModifiers tags neutral');

  // tintFor: a colour for the extremes, null for neutral.
  chk(Array.isArray(CA.tintFor('warm')) && Array.isArray(CA.tintFor('cold')), 'warm/cold map to [r,g,b] tints');
  chk(CA.tintFor('neutral')===null, 'neutral maps to no tint');

  // TintBaker: baked ONCE per (frame,colour), reused; a different colour is a different bake.
  const src=vm.runInContext('loadImage',ctx)();   // a stub frame object
  const warmA=TB.get(src, CA.tintFor('warm'));
  const warmB=TB.get(src, CA.tintFor('warm'));
  const cold =TB.get(src, CA.tintFor('cold'));
  chk(warmA && warmA===warmB, 'a repeat get() returns the SAME baked frame (no per-frame re-bake)');
  chk(cold && cold!==warmA, 'a different colour bakes a different frame');
  chk(TB.get(null, CA.tintFor('warm'))===null && TB.get(src, null)===src, 'get() passes through when src/colour is missing');

  // the toggled render path runs clean (flag on → a moa + a plant render without throwing).
  const savedFlag=CONF.showClimateAffinity;
  CONF.showClimateAffinity=true;
  const m=sim.moas.find(x=>x.alive), p=sim.plants.find(x=>x.alive);
  if(m) m.render();
  if(p) p.render();
  chk(!m || m._climateTint!==undefined, 'a rendered moa cached its climate tint');
  chk(!p || p._climateTint!==undefined, 'a rendered plant cached its climate tint');
  CONF.showClimateAffinity=savedFlag;

  console.log(fail? `climate tint: ${fail} FAILURES`
    : 'climate tint: warm/cold/neutral derived from the sim data; baked once per colour; authoring toggle renders clean');
}catch(e){ console.log('CLIMATE TINT FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- fauna stability: nothing goes extinct, forest birds don't run away -------
// Drives the ecology over a long warm↔cold sweep with NO visitor input (the honest
// unattended case). The design guarantees: per-species floors + the invisible
// sex-rebalance keep every founding species alive, the surplus-only harrier keeps
// the forest flyers from booming past their caps, and the add-a-bird refound stays
// BOUNDED — it now also does a deliberate quiet top-up (LEVEL_MECHANICS.refoundBelow)
// that trickles the smallest, slowest-breeding species back toward a visible group
// instead of leaving them pinned at their floor, so a few adds over a long harsh sweep
// is EXPECTED; a runaway count (every species crashing every delay) is the regression
// this bounds. See the scaffold ECOLOGY FEEDBACK block + TeManawa_eagle.js hunt /
// TeManawa_simulation.js _updateRefounding.
//
// It sweeps TWO lands: the boot land (1 Ma) and 300 ka. The 1 Ma opening is the most
// water-rich land the wall shows (~43% land); most of the run stands on far more, and more
// connected, land (300 ka ≈ 70%). A boot-only sweep hid a refound overshoot there.
// Then it stages the cause of that overshoot directly: a grazer held off its plant by a
// herd-mate must give the plant up (Moa._forageStalled), not starve beside it (MISTAKES.md).
try{
  const G=vm.runInContext('game',ctx), DT=vm.runInContext('DeepTime',ctx), REG=vm.runInContext('REGISTRY',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const HAWK=vm.runInContext('EylesHarrier',ctx);
  const HC=4000, N=4*HC;   // two warm↔cold cycles

  // One unattended sweep on whatever land is standing; checks tagged with `label`.
  const sweep=(label)=>{
    const sim=G.simulation, season=G.seasonManager;
    const grazers=(sim.activeSpecies.moa||[]).slice();
    const flyers=Object.keys(sim.otherEntities).filter(t=>sim.otherEntities[t][0]&&sim.otherEntities[t][0].isFlyer);
    const all=grazers.concat(flyers);
    const cnt=k=>sim.getSpeciesCount(k);

    // a warm (interglacial) and a cold (fullGlacial) year inside the window
    let warmY=null, coldY=null;
    for(let y=30000;y<=980000;y+=20000){ DT.seekTo(y); season.update(1);
      if(!warmY&&season.currentKey==='interglacial')warmY=y; if(season.currentKey==='fullGlacial')coldY=y; }
    warmY=warmY||105000; coldY=coldY||450000;

    const mn={}, mx={}; for(const k of all){mn[k]=Infinity;mx[k]=0;}
    const refound0=sim.stats.refounds;
    // Count every harrier catch, and any adult over its 40 kg prey ceiling (see "harrier prey ceiling").
    let catches=0, overCeiling=0;
    sim.handleEagleCatch=function(e,p){ catches++; if(!HAWK.withinPreyCeiling(p,e.maxPreyKg)) overCeiling++;
      return Object.getPrototypeOf(sim).handleEagleCatch.call(this,e,p); };
    for(let t=0;t<N;t++){
      const ph=(t%(2*HC))/HC, frac=ph<=1?ph:2-ph;   // triangular sweep 0..1..0
      if(t%40===0){ DT.seekTo(warmY+(coldY-warmY)*frac); season.update(1); }
      ctx.frameCount++; sim.update(1,1); sim._advanceFades();
      if(t%250===0){ for(const k of all){ const c=cnt(k); if(c<mn[k])mn[k]=c; if(c>mx[k])mx[k]=c; } }
    }
    delete sim.handleEagleCatch;
    for(const k of all){ const c=cnt(k); if(c<mn[k])mn[k]=c; if(c>mx[k])mx[k]=c; }
    chk(overCeiling===0, `${label}: the harrier never takes an adult over its 40 kg ceiling (${overCeiling} of ${catches} catches)`);

    for(const k of all) chk(mn[k]>=1, `${label}: ${k} never goes extinct (min ${mn[k]})`);
    for(const k of flyers){
      const cap=((REG.getSpecies(k)&&REG.getSpecies(k).config&&REG.getSpecies(k).config.maxPopulation)||20)+2;
      chk(mx[k]<=cap, `${label}: ${k} stays under its cap (max ${mx[k]} <= ${cap})`);   // breeding halts at maxPopulation
    }
    const adds=sim.stats.refounds-refound0;
    // Bounded, not near-zero: refoundBelow trickles the small species back toward a
    // visible group, so a handful of adds over this harsh 16k-tick sweep is expected.
    // The regression this catches is a RUNAWAY — every species collapsing each delay
    // (~11 species × ~6 fires ≈ 60+); well clear of the ~1-per-species top-up seen here
    // (5–14 at either land with the forage give-up; 13–23 without it).
    chk(adds<=20, `${label}: refound (add-a-bird) stays bounded, not runaway (${adds} adds in ${N} ticks)`);
    DT.reset(); G.resetEcosystem();   // a fresh world for whatever runs next
    return `${label} ${adds} adds/${catches} catches`;
  };

  const rBoot=sweep('1 Ma');
  G.terrain.morphTo(300000, 1); G.resetEcosystem();          // a land-rich year (≈70% land)
  const rRich=sweep('300 ka');
  DT.reset(); G.terrain.morphTo(DT.yearsStart, 1); G.resetEcosystem();   // back to the boot land

  // Forage give-up, staged: a plain grazer 40 px from an edible plant, a herd-mate standing ON
  // the plant. Its separation out-pushes the forage seek, so the bird can never close in. It
  // must drop the plant within forageGiveUpFrames and not re-pick it; and with the herd-mate
  // gone, the same approach must reach the plant and feed (the watch never fires on progress).
  {
    const sim=G.simulation, T=G.terrain, MoaC=vm.runInContext('Moa',ctx);
    const limit=(vm.runInContext('LEVEL_MECHANICS',ctx).forageGiveUpFrames)||180;
    const plain=sim.moas.filter(m=>m.alive && m.applySeparation===MoaC.prototype.applySeparation);
    const W=T.mapWidth, H=T.mapHeight;
    const clear=(x0,y0,x1,y1)=>{ for(let i=0;i<=8;i++){ const x=x0+(x1-x0)*i/8, y=y0+(y1-y0)*i/8; if(!T.isWalkable(x,y)) return false; } return true; };
    const p=sim.plants.find(q=>q.alive && !q._consumed && !q.dormant && q.growth>=0.9
      && q.pos.x>W*0.35 && q.pos.x<W*0.65 && q.pos.y>H*0.35 && q.pos.y<H*0.65 && clear(q.pos.x-40,q.pos.y,q.pos.x,q.pos.y));
    chk(plain.length>=2 && !!p, `forage give-up: found a plain grazer pair and a reachable plant (${plain.length}, ${!!p})`);
    if(plain.length>=2 && p){
      const m=plain[0], blocker=plain[1];
      const stage=()=>{ m.pos.set(p.pos.x-40,p.pos.y); m.vel.set(0,0); m.acc.set(0,0); m._walking=false;
        m.targetPlant=p; m._tpTrack=null; m._tpSkip.fill(null); m._eatHoldUntil=0; m.maxSpeed=m.baseSpeed; };
      const step=(nb)=>{ m.hunger=60; m.maxSpeed=m.baseSpeed; m.forage(sim); m.applySeparation(nb); m.update(1); };
      // (a) held off by a herd-mate on the plant
      stage(); blocker.pos.set(p.pos.x,p.pos.y);
      let gaveUp=-1, ate=false;
      for(let f=0; f<limit+120 && gaveUp<0; f++){ step([blocker]); if(m.hunger<60) ate=true; if(m.targetPlant!==p) gaveUp=f; }
      let repick=false; for(let f=0; f<60; f++){ step([blocker]); if(m.targetPlant===p) repick=true; }
      chk(!ate, 'forage give-up: the herd-mate on the plant really does hold the forager off (no bite)');
      chk(gaveUp>=0 && gaveUp<=limit+30, `forage give-up: the held-off grazer drops the plant within forageGiveUpFrames (${gaveUp} frames, limit ${limit})`);
      chk(!repick, 'forage give-up: the given-up plant is not re-picked straight away');
      // (b) the same approach unobstructed reaches the plant and feeds
      stage(); blocker.pos.set(p.pos.x+400,p.pos.y);
      let fed=-1;
      for(let f=0; f<4000 && fed<0; f++){ step([]); if(m.hunger<60) fed=f; if(m.targetPlant!==p && fed<0) break; }
      chk(fed>=0, `forage give-up: an unobstructed grazer keeps its plant and feeds (fed at frame ${fed})`);
    }
    DT.reset(); G.resetEcosystem();   // restore a fresh world for the sections that follow
  }

  console.log(fail? `fauna stability: ${fail} FAILURES`
    : `fauna stability: no extinction over ${N} ticks at 1 Ma and at 300 ka (warm↔cold, no visitor); flyers under cap; refound top-up bounded (${rBoot}; ${rRich}); none over the 40 kg ceiling; a held-off grazer gives its plant up`);
}catch(e){ console.log('FAUNA STABILITY FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- harrier prey ceiling: no adult moa over ~40 kg -----------------------------
// North Island kērangi could take moa only up to ~40 kg (NZ Birds Online), so adult giant
// moa were never prey. EylesHarrier.withinPreyCeiling gates the hunt scan on each bird's own
// mass (a size percentile drawn once × its sex's adultMassKg range); chicks and juveniles
// always pass. The second half drives the REAL hunt scan with one candidate in range and
// `random` pinned, so it is deterministic. Mutation check: delete the withinPreyCeiling line
// in the hunt scan and the adult-female giant and stout-legged cases fail here. (The fauna-
// stability catch count is a second guard on the strike itself; the locked-target re-check
// in hunt() is what keeps it at zero when a chick outgrows the ceiling mid-chase.)
try{
  const G=vm.runInContext('game',ctx), REG=vm.runInContext('REGISTRY',ctx), H=vm.runInContext('EylesHarrier',ctx);
  const sim=G.simulation;
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const hawk=sim.eagles[0];
  chk(hawk && hawk.maxPreyKg===40, `the harrier reads its 40 kg ceiling from EAGLE_SPECIES (got ${hawk&&hawk.maxPreyKg})`);
  chk(REG.getSpecies('eyles_harrier').config.preferredPreySize===undefined, "the dead Haast's-model prey-size fields are gone");
  const cfg=k=>REG.getSpecies(k).config;
  const bird=(k,female,juv,pct)=>({ alive:true, speciesKey:k, speciesConfig:cfg(k), isFemale:female, isJuvenile:()=>juv,
    _sizePct:pct, eagleResistance:0, camouflage:0, inShelter:false, pos:{x:0,y:0}, vel:{x:0,y:0} });
  const W=(b)=>H.withinPreyCeiling(b,40);
  chk(!W(bird('north_island_giant_moa',true,false,0)), 'an adult female giant moa (76–242 kg) is never prey, even the smallest');
  chk(!W(bird('north_island_giant_moa',false,false,0.5)), 'a mid-sized adult male giant moa (~60 kg) is not prey');
  chk(W(bird('north_island_giant_moa',false,false,0)), 'the smallest adult male giant moa (34 kg) is prey');
  chk(W(bird('north_island_giant_moa',true,true,1)), 'a juvenile giant moa is prey');
  chk(W(bird('stout_legged_moa',false,false,1)) && !W(bird('stout_legged_moa',true,false,0)),
    'stout-legged moa: every adult male is prey, no adult female is (reverse dimorphism)');
  chk(W(bird('mantells_moa',true,false,1)), "every adult Mantell's moa (17–36 kg) is prey");
  chk(W(bird('little_bush_moa',false,false,0)) && !W(bird('little_bush_moa',false,false,1)),
    'little bush moa (26–64 kg) straddles the ceiling');
  chk(W(bird('giant_goose',false,false,1)) && W({alive:true}), 'birds with no adultMassKg (goose, every flyer) are prey');
  const one=bird('north_island_giant_moa',false,false,undefined); W(one); const p0=one._sizePct; W(one);
  chk(p0!==undefined && one._sizePct===p0, 'a bird draws its size percentile once and keeps it');
  one._sizePct=0; one.isFemale=true;
  chk(!W(one), "a sex reassignment is read live: the same small bird as a female is not prey");

  // The real hunt scan: one candidate 60 px off (inside huntRadius, outside catchRadius).
  const save={x:hawk.pos.x,y:hawk.pos.y,pcx:hawk.patrolCenter.x,pcy:hawk.patrolCenter.y,
    target:hawk.target,hunting:hawk.hunting,state:hawk.state,timer:hawk.huntSearchTimer};
  const rnd=ctx.random;
  ctx.random=(a,b)=>a===undefined?0.99:(b===undefined?a*0.99:a+(b-a)*0.99);   // resistance/camo rolls never skip
  const fake=Object.create(sim); let list=[];
  fake.getHuntablePrey=()=>list; fake.isPreyProtected=()=>false; fake.handleEagleCatch=()=>{};
  const takes=(c)=>{ c.pos={x:hawk.pos.x+60,y:hawk.pos.y}; list=[c]; hawk.target=null; hawk.hunting=false;
    hawk.hunt(fake,1); return hawk.target===c; };
  chk(!takes(bird('north_island_giant_moa',true,false,0)), 'the hunt scan passes over an adult female giant moa alone in range');
  chk(takes(bird('north_island_giant_moa',true,true,0)), 'the hunt scan takes a juvenile giant moa');
  chk(takes(bird('stout_legged_moa',false,false,0.5)), 'the hunt scan takes an adult male stout-legged moa');
  chk(!takes(bird('stout_legged_moa',true,false,0.5)), 'the hunt scan passes over an adult female stout-legged moa');
  ctx.random=rnd;
  hawk.pos.x=save.x; hawk.pos.y=save.y; hawk.patrolCenter.x=save.pcx; hawk.patrolCenter.y=save.pcy;
  hawk.target=save.target; hawk.hunting=save.hunting; hawk.state=save.state; hawk.huntSearchTimer=save.timer;

  console.log(fail? `harrier prey ceiling: ${fail} FAILURES`
    : 'harrier prey ceiling: no adult over 40 kg (adult giant moa never; stout-legged males only; juveniles always); the real hunt scan obeys it');
}catch(e){ console.log('HARRIER PREY CEILING FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- storm overuse: the STORM cost (plan §4) ----------------------------------
// Each STORM press adds decaying pressure; above the overuse line the kererū stay grounded
// BETWEEN storms and interglacial recruitment stalls, so the scene desaturates. A SINGLE press
// stays below the line (cheap); spamming crosses it; leaving it alone decays it away.
try{
  const G=vm.runInContext('game',ctx), DT=vm.runInContext('DeepTime',ctx);
  const H=vm.runInContext('InstallHUD',ctx), TM=vm.runInContext('TM_TIME',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  // one press: pressure rises but stays below the overuse line
  G._stormPressure=0; G._stormOveruse=false;
  G.handleKey('4');
  chk(G._stormPressure>0 && G._stormPressure<=TM.stormOveruseAt, 'one STORM press adds pressure below the overuse line');
  H.update(G,1);
  chk(!G._stormOveruse, 'a single STORM press is NOT overuse (stays cheap)');

  // spam: repeated presses cross the line → overuse
  for(let i=0;i<3;i++) G.handleKey('4');
  H.update(G,1);
  chk(G._stormOveruse, 'repeated STORM presses cross the overuse line (kererū grounded between storms)');

  // overuse stalls interglacial recruitment even WITH kererū present — the STORM cost
  DT.seekTo(122000); G.seasonManager.update(1);
  G._stormOveruse=true; G._recruitment=1;
  for(let i=0;i<120;i++) G._updateHabitatHealth(1);
  chk(G._recruitment<0.9, 'storm overuse stalls recruitment with kererū present → the scene desaturates');
  G._stormOveruse=false; G._recruitment=1;
  for(let i=0;i<60;i++) G._updateHabitatHealth(1);
  chk(G._recruitment>0.95, 'recruitment recovers once overuse subsides');

  // pressure decays back below the line when STORM is left alone
  G._stormPressure=1; for(let i=0;i<1200;i++) H.update(G,1);
  chk(G._stormPressure<TM.stormOveruseAt, 'storm pressure decays below the overuse line when left alone');

  G._stormPressure=0; G._stormOveruse=false; G._recruitment=1; DT.reset();
  console.log(fail? `storm overuse: ${fail} FAILURES`
    : 'storm overuse: spamming grounds the kererū + stalls recruitment; one press stays cheap; pressure decays');
}catch(e){ console.log('STORM-OVERUSE FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- sand flux: the coastal dune engine (TEMANAWA_ECOLOGY_COAST.md §10A/§10D) --------
// sandFlux = windStrength(glacial index) × exposedSand(climate openness + visitor disturbance).
// Wind rises with cold; the WRONG regime / ash / storm expose bare sand; and the BURIAL drain is
// keyed to the DISTURBANCE-only exposure (`excess`), so a managed, undisturbed coast is never
// penalised whatever the climate — mismanagement bites hardest when the glacial wind is up.
try{
  const Game=vm.runInContext('Game',ctx), C=vm.runInContext('SANDFLUX',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const flux=(w,fit,ash,storm)=>Game._sandFluxModel(w,fit,ash,storm,C).flux;
  const model=(w,fit,ash,storm)=>Game._sandFluxModel(w,fit,ash,storm,C);
  // Wind is always ON but rises non-linearly into a glacial.
  chk(model(0,1,0,0).wind > 0, 'the NW wind is always on (baseline windStrength > 0 even in the interglacial)');
  chk(model(1,1,0,0).wind > model(0,1,0,0).wind, 'windStrength rises into a glacial');
  // Flux climbs with cold (thinner cover), disturbance held at zero.
  chk(flux(1,1,0,0) > flux(0.5,1,0,0) && flux(0.5,1,0,0) > flux(0,1,0,0), 'sand flux grows with the glacial index (open cold coast)');
  // A well-vegetated, undisturbed interglacial coast is essentially locked (flux ~0).
  chk(flux(0,1,0,0) < 0.02, 'a managed, undisturbed interglacial coast is locked down (flux ~0)');
  // Visitor-driven exposure raises flux: wrong regime, ash, storm.
  chk(flux(1,0.2,0,0) > flux(1,1,0,0), 'forcing the WRONG cover for the climate mobilises more sand');
  chk(flux(0,1,0.8,0) > flux(0,1,0,0), 'eruption ash strips cover and mobilises sand');
  chk(flux(0,1,0,0.8) > flux(0,1,0,0), 'a storm spikes the sand flux (advance the dune a step)');
  chk(flux(1,0,1,1) <= 1 && flux(0,1,0,0) >= 0, 'sand flux stays within 0..1 under extreme inputs');
  // BURIAL invariant: disturbance-only, so a managed+undisturbed coast burials nothing at any climate.
  chk(model(1,1,0,0).excess === 0 && model(0,1,0,0).excess === 0, 'burial excess is 0 on a managed, undisturbed coast (any climate) — health invariant preserved');
  chk(model(1,0.2,0,0).excess > 0, 'mismanagement (wrong regime) drives the burial excess above 0');
  chk((C.burialWeight*model(1,0.2,0,0).wind*model(1,0.2,0,0).excess) > (C.burialWeight*model(0.3,0.2,0,0).wind*model(0.3,0.2,0,0).excess),
      'the same mismanagement buries harder when the glacial wind is stronger');
  console.log(fail? `sand flux: ${fail} FAILURES`
    : 'sand flux: wind×exposure keyed to climate + disturbance; wrong regime/ash/storm mobilise sand; burial spares a managed coast');
}catch(e){ console.log('SAND-FLUX FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- storm habitat effects: the succession clock rewound UNEVENLY (§10B–C) ----------
// One STORM press snaps the inland emergents and salt-burns/buries the seaward margin, asymmetric
// by species: tall emergents thrown, soft coastal plants knocked back, hardy binders ride it out;
// harder in a glacial (stronger wind). _stormPlantDamage(type, growth, elevation, wind, cfg).
try{
  const Game=vm.runInContext('Game',ctx), C=vm.runInContext('STORMFX',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const d=(type,growth,elev,wind)=>Game._stormPlantDamage(type,growth,elev,wind,C);
  const FOREST=0.5, COAST=0.05;   // an inland forest elevation vs a seaward-margin one
  // (A) snap inland emergents — tall trees catch the wind, short ones ride it out.
  chk(d('Totara',1.0,FOREST,1) > C.killThresh, 'a fully-grown inland emergent (Totara) is windthrown by a strong storm');
  chk(d('Totara',0.3,FOREST,1) === 0, 'a short emergent (below emergentMinGrowth) rides the storm out');
  chk(d('Totara',1.0,FOREST,1) > d('Totara',1.0,FOREST,0.35), 'windthrow is worse in a glacial gale than a mild interglacial breeze');
  // (B) coastal salt-burn + lee burial, ASYMMETRIC by species (§10C).
  chk(d('fern',1.0,COAST,1) > d('tussock',1.0,COAST,1), 'at the coast a soft species (fern) is hit far harder than a hardy binder (tussock)');
  chk(d('tussock',1.0,COAST,1) < 0.2, 'a hardy open/dune binder rides out the coastal storm (§10C thrive/tolerate)');
  chk(d('fern',1.0,COAST,1) > d('fern',1.0,0.20,1), 'coastal damage is strongest at the waterline and fades inland/up');
  chk(d('kowhai',1.0,FOREST,1) === 0, 'a non-emergent inland plant above the coastal zone is untouched by the storm');
  // wind scales everything; damage stays bounded.
  chk(d('fern',1.0,COAST,1) > d('fern',1.0,COAST,0.35) && d('fern',1.0,COAST,1) <= 1, 'coastal damage scales with wind and stays within 0..1');
  // (C) a windthrow FALLS OVER downwind and fades (Plant.fall), then dies and regrows from bare —
  //     never a one-frame vanish.
  const G=vm.runInContext('game',ctx), Plant_=vm.runInContext('Plant',ctx), Mx=vm.runInContext('LEVEL_MECHANICS',ctx);
  const sim=G.simulation, season=G.seasonManager;
  const tt=new Plant_(300,300,'Totara',sim.terrain,'podocarp'); tt.alive=true; tt.growth=1; tt._matured=true;
  // Seat it INSIDE the live forest band: this tests windthrow, not habitat. A fixed spot's elevation
  // follows the deep-time terrain, so outside the band the regrow step below was silently a band
  // die-back instead (it broke when the ~1 Ma land changed — the tree landed above the band).
  const _fb=season.getForestBand&&season.getForestBand(); if(_fb) tt.elevation=(_fb.min+_fb.max)/2;
  const savedHits=G._stormHits; G._stormHits=[{ p:tt, at:ctx.millis()-1, kind:'throw', mul:1 }];
  G._stormStepPlants(1);
  chk(tt._toppling===true && tt.alive===true && tt.growth===1, 'a windthrown tree falls over at full size instead of vanishing');
  chk(tt._toppleDir===1, 'a windthrown tree falls downwind (W→E)');
  const fms=(Mx&&Mx.forestDiebackFallMs)||800;
  for(let i=0;i<Math.ceil(fms/16)+2 && tt.alive;i++){ _t+=16; tt.update(season,1,0); }
  chk(tt.alive===false && tt.growth===0 && !tt._senescent && tt._toppling===false, 'once the fall plays out the windthrown tree dies to bare ground (and is not senescent)');
  tt.regrowthTimer=1e9; tt.update(season,1,0);
  chk(tt.alive===true && tt._toppling===false, 'a windthrown tree regrows upright from bare ground');
  G._stormHits=savedHits;
  console.log(fail? `storm effects: ${fail} FAILURES`
    : 'storm effects: snaps inland emergents, salt-burns/buries the seaward margin, asymmetric by species, harder in a glacial');
}catch(e){ console.log('STORM-EFFECTS FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- auto-eruptions + attract returns to the last eruption --------------
// Eruptions fire ONCE as the clock CROSSES each checkpoint while playing forward (no button
// needed), and the attract reset returns to the previous eruption rather than the far 1 Ma.
try{
  const G=vm.runInContext('game',ctx), DT=vm.runInContext('DeepTime',ctx), K=vm.runInContext('Kiosk',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const fired=()=>G._firedEruptions;

  // opening: the 1 Ma event does NOT auto-fire on a fresh cycle — the run opens on the calm
  // ~1 Ma scene (the sim self-runs, so a forced opening takeover is unnecessary). Kidnappers is
  // still reachable via a manual hold-wrap. See Game reset: _autoPrevYear seeded AT yearsBP.
  DT.reset(); G.resetEcosystem(); G.update(1);
  chk(!fired().has(1000000),'the 1 Ma opening eruption does NOT auto-fire on cycle start (calm open)');

  // crossing 900 ka fires Kaukatea exactly once. The clock is PAUSED by default now, so play it
  // forward across the checkpoint with a deep burst (millis advances via ctx.__tick).
  DT.seekTo(900050); DT.pressDeep();
  for(let i=0;i<40 && DT.yearsBP>899980;i++){ ctx.__tick(); G.update(1); }
  chk(fired().has(900000),'crossing 900 ka auto-fires Kaukatea');

  // the attract loop replays a RANDOM eruption checkpoint (Math.random pinned to pick each one)
  const CM=vm.runInContext('Math',ctx), MR=CM.random, tg=DT.skipTargets();
  for(let k=0;k<tg.length;k++){
    CM.random=()=>(k+0.5)/tg.length;
    DT.seekTo(500000); const rc=K.resetCount; K.resetToAttract(G,'idle',{reseed:false});
    chk(Math.round(DT.yearsBP)===tg[k],`attract can land on the ${tg[k]/1000} ka eruption (got ${Math.round(DT.yearsBP)})`);
    chk(K.resetCount===rc+1,'attract still counts as a reset');
  }
  CM.random=MR;
  // the timeline running out (end-of-window) restarts at 1 Ma, NOT the last eruption (349 ka)
  DT.seekTo(DT.yearsEnd); K.resetToAttract(G,'end-of-window',{reseed:false});
  chk(Math.round(DT.yearsBP)===1000000,`end-of-window resets to 1 Ma (got ${Math.round(DT.yearsBP)})`);

  // a jump to 349 ka must NOT spuriously re-fire the older events behind the playhead
  DT.seekTo(500000); G.applyEruptionAt(349000, DT.eruptionByYear(349000));
  for(let i=0;i<6;i++) G.update(1);
  chk(!fired().has(1000000) && !fired().has(900000),'a jump to 349 ka does not re-fire the older eruptions');
  chk(fired().has(349000),'the jumped-to eruption is marked fired');

  DT.reset(); G._tmErDownAt=0; G._tmErFired=false; G._tmErCooldownUntil=0; G._tmAshUntil=0; G._tmAutoErAt=0; G._tmAutoErupt=null;
  console.log(fail? `auto-eruptions: ${fail} FAILURES`
    : 'auto-eruptions: no forced opening; fire once on checkpoint crossing; attract replays a random eruption; end-of-window restarts at 1 Ma; jumps do not re-fire');
}catch(e){ console.log('AUTOERUPT FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

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
  const IH=vm.runInContext('InstallHUD',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  D.mode='off'; D.applyVisibility();
  // The mating heart AND the kōkako song note are user-facing now (drawn outside the
  // showEntityUI gate); the REST of the entity-UI layer (bars/rings/state glyphs) stays off.
  chk(C.showEntityUI===false,'entity UI (bars/rings/glyphs) must be OFF for visitors');
  chk(D.enabled===false,'Debug.enabled must be false when mode is off');
  G.addNotification('test message','info');
  chk(G.ui.messages.length>0,'notifications should still be QUEUED (useful in debug)');
  FRAME(ctx.draw);   // must not throw with debug off — exercises the visitor HUD + edge glow
  // On the wall the five buttons are physical, so no on-screen buttons for visitors.
  chk(!G.ui._tmButtons || G.ui._tmButtons.length===0,'on-screen buttons hidden for visitors');

  D.mode='full'; D.applyVisibility();
  chk(C.showEntityUI===true,'entity UI must come back ON with the debug overlay');
  FRAME(ctx.draw);   // exercises the climate strip + all six panels
  chk(G.ui._tmButtons && G.ui._tmButtons.length===IH.BUTTONS.length,'on-screen buttons return with the debug overlay');
  D.mode='off'; D.applyVisibility(); FRAME(ctx.draw);

  console.log(fail? `visitor render: ${fail} FAILURES` : 'visitor render: clean (heart + kōkako note user-facing; no bars/rings/glyphs, no messages, no climate chart)');
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
  // extended window (1 Ma → 350 ka): the early run must breathe, not sit flat
  chk(CL.at(410000).glacialIndex<0.20,'MIS 11 (410ka) should be a strong interglacial');
  chk(CL.at(450000).glacialIndex>0.90,'MIS 12 (450ka) should be a strong glacial');
  chk(CL.at(787000).glacialIndex<0.25,'MIS 19 (787ka) should be interglacial');
  chk(CL.at(950000).glacialIndex>0.45 && CL.at(950000).glacialIndex<0.72,'MIS 24 (950ka) pre-MPT glacial (damped amplitude)');
  chk(Math.abs(CL.at(800000).glacialIndex-CL.at(600000).glacialIndex)>0.3,'1 Ma → 350 ka must vary (no flat 0.85 hold)');

  // eustatic SEA LEVEL (Climate.SEA_ANCHORS, md/TEMANAWA_COAST_PLAN.md): its own curve, not a
  // linear map of the glacial index. The old map put MIS 3 at −80 m (a near-LGM coast for 30 kyr);
  // the field evidence (Pico et al. 2017, Sloss et al.) says −40 to −60 m, and the deep lowstands
  // are short. A typo in an anchor shows up as a cliff, hence the rate bound.
  const SL=y=>CL.seaLevelAt(y);
  chk(SL(45000)>-60 && SL(45000)<-30, `MIS 3 (45ka) sea is −30…−60 m, not near-LGM (${SL(45000).toFixed(0)} m)`);
  chk(SL(21000)<-115, `LGM (21ka) sea is below −115 m (${SL(21000).toFixed(0)} m)`);
  chk(SL(140000)<-110, `MIS 6 (140ka) sea is below −110 m (${SL(140000).toFixed(0)} m)`);
  chk(SL(122000)>0 && SL(410000)>0, `MIS 5e and MIS 11 stand above today's sea (${SL(122000).toFixed(0)}, ${SL(410000).toFixed(0)} m)`);
  chk(CL.at(45000).seaLevel===SL(45000), 'Climate.at().seaLevel reads the anchored curve');
  {
    let run=0, longest=0, lastRun=0, rate=0, prev=SL(DT.yearsStart);
    for (let y=DT.yearsStart-250; y>=18000; y-=250) {
      const s=SL(y); rate=Math.max(rate, Math.abs(s-prev)/0.25); prev=s;
      if (s<-100) { run+=250; if (run>longest) longest=run; lastRun=run; } else run=0;
    }
    chk(longest<=25000, `no lowstand below −100 m lasts over 25 kyr (longest ${longest/1000} kyr)`);
    chk(lastRun<=15000, `the LGM lowstand below −100 m is short (${lastRun/1000} kyr)`);
    chk(rate<25, `sea level never moves faster than 25 m/kyr between anchors (max ${rate.toFixed(1)})`);
  }

  // regime-boundary finder (§7.1): the next interglacial↔glacial crossing forward in play. Pure;
  // the second-screen goal readout and the boost's timelapse target both read it.
  const b1=CL.nextRegimeBoundary(135000, DT.yearsEnd);   // mid MIS6 glacial → Termination II interglacial
  chk(b1 && b1.stageName==='interglacial' && b1.yearsBP<135000 && b1.yearsBP>126000,
      `nextRegimeBoundary from mid-glacial finds the interglacial (${b1?Math.round(b1.yearsBP):'null'} ${b1?b1.stageName:''})`);
  const b2=CL.nextRegimeBoundary(122000, DT.yearsEnd);   // MIS5e interglacial → the MIS4 glacial ahead
  chk(b2 && b2.stageName==='glacial' && b2.yearsBP<90000 && b2.yearsBP>60000,
      `nextRegimeBoundary from an interglacial finds the next glacial (${b2?Math.round(b2.yearsBP):'null'} ${b2?b2.stageName:''})`);
  chk(CL.nextRegimeBoundary(27000, DT.yearsEnd)===null,'no regime crossing before the window end returns null');
  // Chained the way back-to-back boosts chain them (each starts where the last stopped): every stop
  // must already sit in its NEW regime, so no boost ends on the old side and no next boost is a no-op.
  {
    let y=DT.yearsStart, n=0, bad=[], short=[];
    for (let b=CL.nextRegimeBoundary(y, DT.yearsEnd); b && n<80; b=CL.nextRegimeBoundary(y, DT.yearsEnd), n++) {
      if ((CL.glacialIndexAt(b.yearsBP) >= CL.regimeThreshold) !== (b.stageName==='glacial')) bad.push(b.yearsBP);
      if (y-b.yearsBP < 5000) short.push(y-b.yearsBP);
      y=b.yearsBP;
    }
    chk(bad.length===0, `every chained regime stop already sits in its new regime (${n} stops; wrong side at ${bad.join(', ')||'none'})`);
    chk(short.length===0, `no chained boost is a near no-op (gaps under 5 kyr: ${short.join(', ')||'none'})`);
  }

  // the clock is PAUSED BY DEFAULT now (the second screen drives it, md/TEMANAWA_SECOND_SCREEN.md §0):
  // idle update() holds yearsBP (and the terrain, which keys off it) but still returns a 1× LIFE scale,
  // so animals forage and plants grow at a fixed date — geology is frozen, the world is not.
  DT.reset();
  const y0=DT.yearsBP; let lifeIdle=1;
  for(let i=0;i<60;i++){ ctx.__tick(); lifeIdle=DT.update(1); }
  chk(DT.yearsBP===y0,`paused by default: yearsBP holds when idle (drifted ${Math.round(y0-DT.yearsBP)})`);
  chk(lifeIdle===1,'paused still returns a 1× life scale (ambient world keeps living, never frozen)');

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

  // the second-screen TIMELAPSE (§6.2/§7.2): a boost plays the clock forward on an eased
  // 500→5000 yr/s ramp and stops on its target; the life scale rides the ramp, then returns to 1×.
  DT.reset();
  chk(!DT.beginTimelapse(DT.yearsBP+10000),'a timelapse target older than now is a no-op');
  chk(DT.beginTimelapse(DT.yearsBP-8000),'beginTimelapse arms toward a younger target');
  let guard=0; while(DT.isTimelapsing() && guard++<20000){ ctx.__tick(); DT.update(1); }
  chk(!DT.isTimelapsing(),'a timelapse ends when it reaches its target');
  chk(Math.abs(DT.yearsBP-(DT.yearsStart-8000))<1,`timelapse stops exactly on its target (got ${Math.round(DT.yearsBP)})`);
  chk(DT.update(1)===1,'life scale returns to 1× after a timelapse (paused again)');
  // the ramp reaches ~tlMaxRate: a LONG timelapse past the ramp, sample the peak life scale
  DT.reset(); DT.beginTimelapse(DT.yearsStart-400000);
  let tlPeak=0; for(let i=0;i<Math.ceil(DT.tlRampSeconds*60)+120 && DT.isTimelapsing();i++){ ctx.__tick(); tlPeak=Math.max(tlPeak,DT.update(1)); }
  const wantPeak=DT.tlMaxRate/DT.yrPerSec;
  chk(tlPeak>wantPeak*0.9 && tlPeak<=wantPeak+0.01,`ramp peaks near ${DT.tlMaxRate} yr/s (life x${wantPeak.toFixed(1)}), got x${tlPeak.toFixed(1)}`);
  DT.endTimelapse();

  // end of window hands off rather than stalling (a timelapse — or a deep burst — can reach it)
  DT.reset(); DT.yearsBP=DT.yearsEnd; DT.update(1);
  chk(DT.hasEnded(),'hasEnded() must fire at the end of the window');
  const before=vm.runInContext('Kiosk',ctx).resetCount;
  DT.yearsBP=DT.yearsEnd; G.update(1);
  chk(vm.runInContext('Kiosk',ctx).resetCount>before,'end of window must trigger the attract reset');
  DT.reset();

  console.log(fail? `deep time: ${fail} FAILURES` : 'deep time: all checks pass'
    + ` (window ${(DT.windowSeconds()/60).toFixed(1)} min, press covers ${Math.round(covered/1000)} ky)`);
}

// ---- time dial: the macro pad's standing fast-forward (DeepTime.dial*) ---------
// Detent 0 = geology paused (real time); the top detent = dialMaxRate (5,000 yr/s), the whole window
// in ~3¼ min. The played rate EASES (never snaps — photosensitivity), a boost timelapse never runs
// slower than the dial, the detent survives soft resets, and both windows' keys (+ the bus) reach it.
try{
  const DT=vm.runInContext('DeepTime',ctx), G=vm.runInContext('game',ctx),
        TB=vm.runInContext('TMBus',ctx), FT=vm.runInContext('FaunaTrail',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const run=(frames)=>{ let sc=1; for(let i=0;i<frames;i++){ ctx.__tick(); sc=DT.update(1); } return sc; };

  DT.reset(); DT.dialReset(); run(120);
  const y0=DT.yearsBP; const sc0=run(60);
  chk(DT.yearsBP===y0 && sc0===1 && DT.geoRate===0,'detent 0 = paused geology, 1× life (real time)');
  chk(!DT.isMoving(),'isMoving() is false with the dial at 0 and nothing else running');

  // the curve: monotone, fine at the low end, exactly dialMaxRate at the top
  let mono=true; for(let s=1;s<=DT.dialSteps;s++) if(DT.dialTargetRate(s)<=DT.dialTargetRate(s-1)) mono=false;
  chk(mono,'every detent is faster than the one below it');
  chk(DT.dialTargetRate(1)<10,`detent 1 is fine-grained (${DT.dialTargetRate(1).toFixed(1)} yr/s)`);
  chk(Math.abs(DT.dialTargetRate(DT.dialSteps)-5000)<1e-6,'the top detent is 5,000 yr/s');

  // clamped, keyed, wheeled
  DT.dialSet(DT.dialSteps); DT.dialTurn(5); chk(DT.dialStep===DT.dialSteps,'the dial clamps at the top');
  DT.dialReset(); DT.dialTurn(-3); chk(DT.dialStep===0,'the dial clamps at 0');
  chk(DT.dialKey(']') && DT.dialStep===1,"']' turns the dial up");
  chk(DT.dialKey('[') && DT.dialStep===0,"'[' turns it down");
  DT.dialSet(7); chk(DT.dialKey('\\') && DT.dialStep===0,"'\\' (the push) resets it to 0");
  chk(!DT.dialKey('1') && !DT.dialKey('d'),'other keys are not dial keys');
  DT._wheelAcc=0; DT.dialWheel(-100); chk(DT.dialStep===1,'one wheel notch up = one detent faster');
  DT.dialWheel(-40); DT.dialWheel(-40); chk(DT.dialStep===1,'small wheel deltas accumulate (no detent yet)');
  DT.dialWheel(-40); chk(DT.dialStep===2,'...and carry over into the next detent');
  DT.dialReset(); DT._wheelAcc=0;
  G.handleKey(']'); chk(DT.dialStep===1,"Game.handleKey(']') reaches the dial");
  G.handleKey('\\'); chk(DT.dialStep===0,"Game.handleKey('\\\\') resets it");
  if(TB && typeof TB.dispatch==='function'){
    TB.dispatch({ type:'dial', delta:3 }); chk(DT.dialStep===3,'a console {type:dial, delta} turns the sim dial');
    TB.dispatch({ type:'dial', reset:true }); chk(DT.dialStep===0,'a console {type:dial, reset} resets it');
  } else chk(false,'TMBus.dispatch present for the dial relay test');

  // easing: no snap on a full spin, reaches the rate, and the top detent plays the window in ~3¼ min
  DT.reset(); DT.dialSet(DT.dialSteps); run(1);
  chk(DT.geoRate<DT.dialMaxRate*0.1,`a full spin eases in, never snaps (first frame ${Math.round(DT.geoRate)} yr/s)`);
  const life=run(Math.ceil(DT.dialEaseSeconds*60*8));
  chk(Math.abs(DT.geoRate-DT.dialMaxRate)<DT.dialMaxRate*0.01,`the dial settles on its rate (${Math.round(DT.geoRate)} yr/s)`);
  chk(Math.abs(life-DT.dialMaxRate/DT.yrPerSec)<0.05,`life keeps pace at the top detent (x${life.toFixed(2)})`);
  chk(DT.isMoving() && FT.active(),'the top detent counts as moving + fast-forward (river working, fauna trails)');
  DT.reset(); let frames=0; while(!DT.hasEnded() && frames<60*600){ ctx.__tick(); DT.update(1); frames++; }
  const secs=frames/60;
  chk(DT.hasEnded() && secs>185 && secs<205,`the top detent plays 1 Ma → 25.5 ka in ~3¼ min (${secs.toFixed(0)} s)`);
  // a slow detent moves the land but does not speed up life or draw trails
  DT.reset(); DT.dialSet(3); run(600);
  chk(DT.geoRate>40 && DT.geoRate<60 && DT.timeScale===1,`detent 3 ≈ 50 yr/s with life at 1× (${Math.round(DT.geoRate)} yr/s, x${DT.timeScale})`);
  chk(DT.isMoving() && !FT.active(),'a slow detent moves the river but draws no fast-forward trails');

  // a timelapse under the dial is never slower than it; the dial carries on after the target
  DT.reset(); DT.dialSet(DT.dialSteps); run(600);
  DT.beginTimelapse(DT.yearsBP-30000); run(1);
  chk(DT.geoRate>=DT.dialMaxRate*0.99,`a timelapse under a full dial runs at ≥ the dial (${Math.round(DT.geoRate)} yr/s)`);
  let guard=0; while(DT.isTimelapsing() && guard++<20000) run(1);
  run(1); chk(!DT.isTimelapsing() && DT.geoRate>DT.dialMaxRate*0.99,'after the timelapse lands the dial keeps playing');

  // the detent is a control setting: it survives a soft reset and a seek; the push eases to a dead stop
  DT.dialSet(12); DT.reset(); chk(DT.dialStep===12,'the detent survives DeepTime.reset()');
  DT.seekTo(500000); chk(DT.dialStep===12,'the detent survives a seek');
  run(600); DT.dialReset(); run(1); chk(DT.geoRate>0,'turning back to 0 eases down (not an instant stop)');
  run(600); const yS=DT.yearsBP; run(30);
  chk(DT.geoRate===0 && DT.yearsBP===yS,'...and comes to a dead stop (geology paused again)');

  // the HUD readout draws through both timelines without throwing
  const HUD=vm.runInContext('InstallHUD',ctx);
  let threw=null;
  try{ for(const s of [0,1,15,DT.dialSteps]){ DT.dialSet(s); HUD.renderVisitorTimeline(G,1080,1920); HUD.renderTimeline(G.ui,G,1080,1920); } }
  catch(e){ threw=e.message; }
  chk(!threw,'the dial readout renders on both timelines'+(threw?` (${threw})`:''));
  chk(HUD._dialLabel(5000)==='>> 5,000 yrs/s' && HUD._dialLabel(DT.dialTargetRate(1))==='>> 6 yrs/s','the readout names the detent rate, rounded');

  // the console page's key + wheel bindings emit the dial actions (secondscreen/input.js, own context)
  try{
    const lis={}, sctx=vm.createContext({ window:{ addEventListener:(t,f)=>{ lis[t]=f; } }, setTimeout, clearTimeout, console });
    vm.runInContext(fs.readFileSync(path.join(dir,'secondscreen','input.js'),'utf8')+';this.TMInput=TMInput;', sctx);
    const got=[]; sctx.TMInput.on((a,p)=>got.push(a+(p!==undefined?':'+p:''))); sctx.TMInput.start();
    const ev=(k,rep)=>({ key:k, repeat:!!rep, preventDefault(){} });
    lis.keydown(ev(']')); lis.keydown(ev('[')); lis.keydown(ev('\\')); lis.keydown(ev(']',true));
    lis.wheel({ deltaY:-100, preventDefault(){} });
    chk(got.join(',')==='dialTurn:1,dialTurn:-1,dialReset,dialTurn:1,dialTurn:1',`console dial keys/wheel → actions (${got.join(',')})`);
  }catch(e){ chk(false,'secondscreen/input.js dial bindings: threw '+e.message); }

  DT.dialReset(); DT._dialRate=0; DT._dialAt=0; DT.reset();
  console.log(fail? `time dial: ${fail} FAILURES`
    : `time dial: 0 → 5,000 yr/s over ${DT.dialSteps} detents, eased, window in ${secs.toFixed(0)} s at the top; keys/wheel/bus reach it`);
}catch(e){ console.log('time dial: FAILURES (threw)', e.message, '\n  ', (e.stack||'').split('\n')[1]); }

// ---- fauna time-lapse trail (ghost afterimages) ----------------------
// FaunaTrail leaves short SPRITE-ONLY afterimages behind a moving animal, but ONLY while a
// fast-forward runs. Contract: inert at 1x (no sampling, no draw); on during a timelapse; the
// per-animal sample ring is a fixed Float32Array reused every frame (allocation-free — never in
// draw, CLAUDE.md); ghosts replay the animal's own render() at reduced alpha with _ghosting set,
// so each render() skips its shadow/halo; and the flag/globalAlpha are always restored.
try{
  const FT=vm.runInContext('FaunaTrail',ctx), DT=vm.runInContext('DeepTime',ctx);
  const G=vm.runInContext('game',ctx), Boid=vm.runInContext('Boid',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  chk(FT && typeof FT.active==='function' && typeof FT.renderGhosts==='function','FaunaTrail exists with active()/renderGhosts()');
  chk(FT.ghosts>=1 && FT.sampleEvery>=1 && FT.alpha0>0 && FT.alpha0<=1,'trail config is sane (ghosts/sampleEvery/alpha0 in range)');

  DT.reset();
  chk(FT.active()===false,'trail is INERT at the normal 1x pace (no timelapse, no deep burst)');
  DT.beginTimelapse(DT.yearsBP-20000);
  chk(FT.active()===true,'trail turns on during a timelapse');

  const m=G.simulation.moas.find(x=>x.alive) || G.simulation.moas[0];
  chk(!!m && (m instanceof Boid),'a live moa (a Boid) is available to trail');
  if(m){
    const px0=m.pos.x, py0=m.pos.y, ga0=ctx.drawingContext.globalAlpha;
    // Spy the animal's render so ring-building never depends on sprite validity or draws for real:
    // record the alpha each ghost is replayed at, and whether _ghosting was set during it.
    const spy={calls:0, alphas:[], sawFlag:false};
    m.render=function(){ spy.calls++; spy.alphas.push(+ctx.drawingContext.globalAlpha); if(FT._ghosting) spy.sawFlag=true; };
    ctx.drawingContext.globalAlpha=1;
    m._trailX=null; ctx.frameCount++; FT.renderGhosts(m);      // lazy-arm the ring
    const buf=m._trailX;
    chk(buf && (buf instanceof Float32Array) && buf.length===FT.ghosts,'the sample ring is a fixed-length Float32Array');
    // Walk the animal across several sampling windows: the ring must record the motion and be REUSED.
    for(let w=0; w<FT.ghosts+1; w++){ m.pos.x+=40; m.pos.y+=8; ctx.frameCount+=FT.sampleEvery; FT.renderGhosts(m); }
    delete m.render;                                            // restore the prototype render
    chk(m._trailX===buf,'the ring is reused across frames (no per-frame allocation)');
    let spread=0; for(let i=0;i<buf.length;i++) spread=Math.max(spread,Math.abs(buf[i]-m.pos.x));
    chk(spread>3,`a moving animal spreads its samples into a trail (max ${spread.toFixed(0)}px behind)`);
    chk(spy.calls>=1,`ghosts are replayed as extra renders (${spy.calls} across the run)`);
    chk(spy.alphas.length>=1 && spy.alphas.every(a=>a<0.999),'every ghost is drawn at reduced alpha (an afterimage, not a solid duplicate)');
    chk(spy.sawFlag,'_ghosting is set while a ghost draws, so render() skips its shadow/halo (sprite-only)');
    chk(FT._ghosting===false,'_ghosting is cleared once renderGhosts returns');
    chk(ctx.drawingContext.globalAlpha===1,'renderGhosts restores globalAlpha after drawing');
    // The REAL render path (real sprite selection + projection) must not throw for a ghost.
    let threw=null; try{ ctx.drawingContext.globalAlpha=1; FT.renderGhosts(m); }catch(e){ threw=e.message; }
    chk(!threw,'the real render path draws ghosts without throwing'+(threw?` (${threw})`:''));
    m.pos.x=px0; m.pos.y=py0; ctx.drawingContext.globalAlpha=ga0;
  }
  DT.endTimelapse(); DT.reset();
  console.log(fail? `fauna trail: ${fail} FAILURES` : 'fauna trail: sprite-only afterimages, on only in fast-forward, ring reused (no per-frame alloc)');
}catch(e){ console.log('fauna trail: FAILURES (threw)', e.message, '\n  ', (e.stack||'').split('\n')[1]); }

// ---- over-canopy reveal (PLANT_GHOST.reveal) --------------------------
// A canopy plant in front of a ground bird still fades (maxReduce), and the bird is ALSO
// re-stamped over the canopy after the ground pass. Contract: the ghost test marks EVERY
// animal under the plant (no early break), each once per frame; the re-stamp replays the
// bird's own render() sprite-only (_ghosting) at reduced alpha scaled by its cover; flag and
// globalAlpha are restored; reveal: 0 marks nothing.
try{
  const PG=vm.runInContext('PLANT_GHOST',ctx), FT=vm.runInContext('FaunaTrail',ctx);
  const G=vm.runInContext('game',ctx), sim=G.simulation;
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  chk(PG && PG.reveal>0 && PG.reveal<1 && PG.maxReduce>0,'PLANT_GHOST.reveal is on and partial, tree fade kept');
  chk(typeof sim._renderReveal==='function','Simulation._renderReveal exists');
  const ms=sim.moas.filter(x=>x.alive).slice(0,2);
  chk(ms.length===2,'two live moas to cover');
  if(ms.length===2){
    const [m1,m2]=ms, saved=ms.map(m=>({x:m.pos.x,y:m.pos.y}));
    m1.pos.x=500; m1.pos.y=500; m2.pos.x=504; m2.pos.y=490;          // m1 dead-centre, m2 further back + off-centre
    const plant={pos:{x:500,y:520}, size:60, growth:1};
    const list=[m2,m1,plant];                                          // depth-sorted (pos.y ascending)
    sim._revealList=[]; sim._revealStamp=7;
    const ga=sim._plantGhostAlpha(plant,list,2,PG);
    chk(ga<1,`the covering plant still fades (alpha ${ga.toFixed(2)})`);
    chk(sim._revealList.length===2,`every animal under the plant is marked, not just the first full cover (${sim._revealList.length})`);
    sim._plantGhostAlpha(plant,list,2,PG);                            // a second plant over the same birds
    chk(sim._revealList.length===2,'an animal joins the reveal list once per frame');
    chk(m1._occ>m2._occ && m2._occ>0,'cover strength is kept per animal (centre-line, depth falloff)');
    const spy=[]; for(const m of ms) m.render=function(){ spy.push({a:+ctx.drawingContext.globalAlpha, g:FT._ghosting, m:this}); };
    ctx.drawingContext.globalAlpha=1;
    sim._renderReveal(sim._revealList, PG.reveal);
    for(const m of ms) delete m.render;
    chk(spy.length===2,'each marked bird is re-stamped once');
    chk(spy.every(s=>s.g),'the re-stamp is sprite-only (_ghosting set)');
    chk(spy.every(s=>s.a>0 && s.a<=PG.reveal+1e-6),'the re-stamp is partial, at most reveal');
    const s1=spy.find(s=>s.m===m1), s2=spy.find(s=>s.m===m2);
    chk(s1 && s2 && s1.a>s2.a,'a more-covered bird is revealed more strongly');
    chk(FT._ghosting===false && ctx.drawingContext.globalAlpha===1,'_ghosting and globalAlpha are restored');
    let threw=null; try{ sim._renderReveal(sim._revealList, PG.reveal); }catch(e){ threw=e.message; }
    chk(!threw,'the real render path re-stamps without throwing'+(threw?` (${threw})`:''));
    const r0=PG.reveal; PG.reveal=0; sim._revealList=[]; sim._revealStamp++;
    sim._plantGhostAlpha(plant,list,2,PG);
    chk(sim._revealList.length===0,'reveal: 0 marks nothing (off switch)');
    PG.reveal=r0; sim._revealList.length=0;
    ms.forEach((m,i)=>{ m.pos.x=saved[i].x; m.pos.y=saved[i].y; });
  }
  console.log(fail? `canopy reveal: ${fail} FAILURES` : 'canopy reveal: covered birds re-stamped over the canopy, sprite-only, scaled by cover');
}catch(e){ console.log('canopy reveal: FAILURES (threw)', e.message, '\n  ', (e.stack||'').split('\n')[1]); }

// ---- per-species boost seeding (§7.3) --------------------------------
// Simulation.seedSpecies plants the ONE named type into any biome whose palette lists it.
try{
  const G=vm.runInContext('game',ctx), PT=vm.runInContext('PLANT_TYPES',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const sim=G.simulation;
  chk(typeof sim.seedSpecies==='function','Simulation.seedSpecies exists');
  // Find a type some biome palette actually supports (robust to palette edits) and confirm it plants.
  let key=null, n=0;
  for(const t of Object.keys(PT)){ n=sim.seedSpecies(t,6); if(n>0){ key=t; break; } }
  chk(!!key && n>0,`seedSpecies plants a palette species (${key||'none'} x${n})`);
  if(key){
    const added=sim.plants.filter(p=>p.alive && p.type===key).length;
    chk(added>=n,`the seeded plants are the requested species (${added} ${key})`);
  }
  chk(sim.seedSpecies('not_a_real_plant', 5)===0,'seedSpecies of an unknown type seeds nothing');
  chk(sim.seedSpecies(key||'tussock', 0)===0,'seedSpecies with count 0 seeds nothing');
  console.log(fail? `seedSpecies: ${fail} FAILURES` : 'seedSpecies: plants the named species where its habitat supports it');
}catch(e){ console.log('SEEDSPECIES FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- second-screen bus: the boost drives the sim ---------------------
// BroadcastChannel is absent in the harness so the module is otherwise inert (reply() no-ops), but
// the boost's sim-side effects — regime-fit gate → per-species seed → ramped timelapse — still run.
try{
  const G=vm.runInContext('game',ctx), DT=vm.runInContext('DeepTime',ctx),
        TB=vm.runInContext('TMBus',ctx), PT=vm.runInContext('PLANT_TYPES',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  chk(TB && typeof TB.boost==='function','TMBus.boost is callable');
  // an interglacial year + a warm species → a MATCHED boost (seeds generously + starts a timelapse)
  DT.seekTo(122000);
  let key=null;
  for(const t of Object.keys(PT)){ if(PT[t].coldTolerance<=0.65 && G.simulation.seedSpecies(t,1)>0){ key=t; break; } }
  chk(!!key,'a warm species is placeable for the boost test');
  const before=G.simulation.plants.filter(p=>p.alive).length;
  TB.boost({ plantKey: key||'Totara' });
  chk(DT.isTimelapsing(),'a boost begins a timelapse');
  chk(DT._tlTarget<122000,'the timelapse targets a younger regime boundary');
  const after=G.simulation.plants.filter(p=>p.alive).length;
  chk(after>before,`a matched boost seeds the chosen species (${after-before} added)`);
  // Boost OUTLINE highlight: the chosen plant marked; helpers present; render must stay safe.
  const ES=vm.runInContext('EntitySprites',ctx);
  chk(G._boostHi && G._boostHi.keys && G._boostHi.keys.has(key||'Totara'),'a boost marks the chosen species for the outline highlight');
  chk(ES && typeof ES.boostOutline==='function' && typeof ES.drawSpriteOutline==='function','EntitySprites has the outline helpers');
  FRAME(ctx.draw);   // render with the highlight active — boostOutline is a safe no-op with GL off in the harness
  DT.endTimelapse();
  // Fauna coupling (§9.3): a matched Tōtara boost RECRUITS its linked harrier (spec §5).
  DT.seekTo(122000); G._boostHi=null;
  chk(typeof G.simulation.boostFauna==='function','Simulation.boostFauna exists');
  const eB=G.simulation.countAliveEagles();
  TB.boost({ plantKey:'Totara' });                 // Totara (warm) matched at the 122ka interglacial → recruits harrier
  const eA=G.simulation.countAliveEagles();
  chk(eA>eB,`a matched boost recruits the linked fauna (harriers ${eB}→${eA})`);
  DT.endTimelapse();
  // Idle-reset: a console intent over the bus IS visitor input, so it must reset the diorama's
  // idle/attract timer. The bug it guards: pressing buttons on the touchscreen still tripped the
  // 180 s idle→attract, because bus intents never reached Kiosk.noteInput (only local keys did).
  const KI=vm.runInContext('Kiosk',ctx);
  chk(KI && typeof TB.dispatch==='function','Kiosk + TMBus.dispatch present for the idle test');
  if(KI && typeof TB.dispatch==='function'){
    KI.lastInputAt = Date.now() - 999000;                                 // pretend the wall has been idle ~16 min
    TB.dispatch({ type:'plant', habitat:'forest', plantKey:'Totara' });   // a browse intent: no sim effect, but presence
    chk(Date.now() - KI.lastInputAt < 5000,'a console intent resets the diorama idle/attract timer');
  }
  DT.reset(); G._boostHi=null; G.resetEcosystem();
  console.log(fail? `bus boost: ${fail} FAILURES` : 'bus boost: gate → per-species seed → ramped timelapse + outline highlight; console intents reset idle');
}catch(e){ console.log('BUS FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- plant homeostasis: habitats hold steady, correct boosts lift them, a wrong one resets ----
// Each plant-bearing habitat is held at a target (spawn density × area). With no input the counts
// must not drift or churn; correct boosts lift the habitats they serve (capped); a wrong-for-the-
// climate boost (bus or button) drops every habitat back to its floor, and the surplus fades out
// — sparing the young — then leaves the plant list.
try{
  const G=vm.runInContext('game',ctx), DT=vm.runInContext('DeepTime',ctx),
        TB=vm.runInContext('TMBus',ctx), M=vm.runInContext('LEVEL_MECHANICS',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const sim=G.simulation;
  const step=(n)=>{ for(let i=0;i<n;i++){ ctx.__tick(1); sim.update(1,1); } };
  const census=()=>{ const c={}; for(const p of sim.plants){ if(p._senescent||p._fallKind==='thin') continue; c[p.biomeKey]=(c[p.biomeKey]||0)+1; } return c; };
  chk(typeof sim.liftHabitats==='function' && typeof sim.resetHabitatLift==='function' &&
      typeof sim.homeoTarget==='function' && sim._homeo, 'the homeostasis API is present');
  const keys=Object.keys(sim._homeo.dens).filter(k=>sim.homeoTarget(k)>=10);
  const near=(c)=>keys.every(k=>Math.abs((c[k]||0)-sim.homeoTarget(k)) <= sim._homeoDeadband(sim.homeoTarget(k))+1);

  // 1. Idle: nothing drifts.
  step(600);
  const c1=census();
  chk(near(c1), `with no input each habitat holds its target (${keys.map(k=>k+' '+(c1[k]||0)+'/'+Math.round(sim.homeoTarget(k))).join(', ')})`);
  let thinnedIdle=0; for(const p of sim.plants) if(p._fallKind==='thin') thinnedIdle++;
  chk(thinnedIdle===0, `an untouched world does not churn (${thinnedIdle} thinned)`);

  // 2. A correct boost lifts only the habitats that grow it; repeats accumulate up to the cap.
  const base={}; for(const k of keys) base[k]=sim.homeoTarget(k);
  sim.liftHabitats(['tawa']);
  chk(sim.homeoTarget('podocarp')>base.podocarp && sim.homeoTarget('montane')>base.montane, 'a correct tawa boost lifts the forest habitats');
  chk(sim.homeoTarget('grassland')===base.grassland, 'it leaves the lowland, which grows no tawa');
  sim.liftHabitats(['tawa']); sim.liftHabitats(['tawa']);
  step(1200);
  const c2=census(), gain=sim.homeoTarget('podocarp')-base.podocarp;
  chk((c2.podocarp||0)-(c1.podocarp||0) >= gain*0.6, `three correct boosts fill the forest toward its lifted target (+${(c2.podocarp||0)-(c1.podocarp||0)} of +${Math.round(gain)} in 20 s)`);
  for(let i=0;i<10;i++) sim.liftHabitats(['tawa']);
  chk(sim._homeo.lift.podocarp===M.homeoLiftMaxSteps, 'the lift is capped at homeoLiftMaxSteps');
  chk(sim.plants.length <= M.maxLivePlants, `the lifted world stays under the live-plant cap (${sim.plants.length})`);

  // 3. A wrong guess: back to the floor. The surplus fades (the young spared), then leaves the list.
  step(1200);
  const surplus=(census().podocarp||0)-base.podocarp;
  sim.resetHabitatLift();
  chk(sim.homeoTarget('podocarp')===base.podocarp, 'a reset drops the target back to the original floor');
  step(240);
  const now=vm.runInContext('millis()',ctx);
  let fading=0, youngHit=0;
  for(const p of sim.plants) if(p._fallKind==='thin'){ fading++; if(now-p._bornMs < M.homeoGraceMs - 4000) youngHit++; }
  chk(fading>0, `the surplus starts to fade out (${fading} fading of +${surplus})`);
  chk(youngHit===0, `plants younger than homeoGraceMs are never thinned (${youngHit})`);
  step(4800);
  const c3=census();
  chk(near(c3), `after a wrong guess the habitats settle back to the floor (${keys.map(k=>k+' '+(c3[k]||0)+'/'+Math.round(sim.homeoTarget(k))).join(', ')})`);
  chk(!sim.plants.some(p=>p._senescent && !p.alive && !p._toppling), 'thinned plants leave the plant list once faded');

  // 4. The two seams: the bus boost and the FOREST/TUSSOCK buttons.
  DT.seekTo(122000); G.seasonManager.update(1);                   // an interglacial
  TB.boost({ plantKey:'tawa' }); DT.endTimelapse();
  chk((sim._homeo.lift.podocarp||0)>=1, 'a matched bus boost lifts its habitats');
  TB.boost({ plantKey:'tussock' }); DT.endTimelapse();             // cold species in the interglacial
  chk(Object.keys(sim._homeo.lift).length===0, 'a wrong-for-the-climate bus boost resets every habitat');
  G.handleKey('2');                                                // FOREST, matched
  chk((sim._homeo.lift.podocarp||0)>=1 && !sim._homeo.lift.grassland, 'a matched FOREST press lifts the forest habitats only');
  G.handleKey('3');                                                // TUSSOCK in the interglacial: wrong
  chk(Object.keys(sim._homeo.lift).length===0, 'a wrong TUSSOCK press resets every habitat');

  // 5. Storm: the lightning cloud fades in and out — no blink.
  const HUD=vm.runInContext('InstallHUD',ctx), TT=vm.runInContext('TM_TIME',ctx);
  chk(TT.stormBoltFadeIn>=30 && TT.stormBoltFadeOut>=30, 'lightning fades ramp over ≥500 ms (photosensitivity)');
  G._tmStormUntil=vm.runInContext('millis()',ctx)+20000;
  HUD.initStormCells(G);
  const b=G._tmBolt; b.timer=0;
  let maxJump=0, prev=0, peak=0, follows=true, frames=0;
  HUD.updateStormCells(G,1);
  while(b.active && frames<400){
    const a=HUD.boltAlpha(b.age), c=G._tmStormCells[b.cell];
    maxJump=Math.max(maxJump, Math.abs(a-prev)); prev=a; peak=Math.max(peak,a);
    if(c && (b.x!==c.x || b.y!==c.y+10)) follows=false;
    HUD.updateStormCells(G,1); frames++;
  }
  chk(peak>0.99 && prev<0.05, `a strike reaches full and fades back out (peak ${peak.toFixed(2)}, last ${prev.toFixed(2)})`);
  chk(maxJump<0.08, `no frame-to-frame blink (max step ${maxJump.toFixed(3)})`);
  chk(follows, 'the lightning cloud rides the thunderhead it struck from');
  G._tmStormUntil=0;

  DT.reset(); G._boostHi=null; G.resetEcosystem();
  console.log(fail? `plant homeostasis: ${fail} FAILURES`
    : 'plant homeostasis: habitats hold steady unattended; correct boosts lift (capped), a wrong one fades back to the floor; lightning fades');
}catch(e){ console.log('HOMEOSTASIS FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- encyclopedia roster: every touchscreen card fits its screen's era ---------
// The second screen (secondscreen/encyclopedia.js) puts two WARM (interglacial) habitats above the
// centre rest and two COLD (glacial) below. The sim's boost gate grades a plant only by coldTolerance,
// so a card the sim calls warm-only on a glacial screen (black beech at 0.6, before the encyclopedia
// review) FAILS exactly when the visitor picks the right screen: grey pulse, desaturated scene. Assert
// every card passes the gate in its own era and resolves to a real plant, sprite, palette and species.
// md/TEMANAWA_ENCYCLOPEDIA_FLORA.md §3.
try{
  const PT=vm.runInContext('PLANT_TYPES',ctx), TG=vm.runInContext('TM_GROW',ctx),
        R=vm.runInContext('REGISTRY',ctx), G=vm.runInContext('game',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  const sdir=path.join(dir,'secondscreen');
  const ectx={console:{log(){},warn(){},error(){}}}; vm.createContext(ectx);   // its own page: own globals
  vm.runInContext(fs.readFileSync(path.join(sdir,'encyclopedia.js'),'utf8'),ectx);
  const ORDER=vm.runInContext('TM_SCREEN_ORDER',ectx), HAB=vm.runInContext('TM_HABITATS',ectx),
        FAUNA=vm.runInContext('TM_FAUNA',ectx), SPR=vm.runInContext('TM_PLANT_SPRITE',ectx);
  const mid=ORDER.indexOf('select');
  chk(ORDER.length===5 && mid===2,'the switch has five positions with Select at the centre');
  chk(ORDER[mid-1]==='forest' && ORDER[mid+1]==='alpine','forest and alpine sit one detent from the centre');
  ORDER.forEach((k,i)=>{ if(k==='select') return; const h=HAB[k];
    chk(!!h,`switch position '${k}' has a habitat`);
    if(h) chk(h.era===(i<mid?'interglacial':'glacial'),`${k}: warm habitats above the centre, cold below (era ${h.era})`); });
  const pal=new Set();   // every type some biome palette lists: a boost seeds only there (seedSpecies)
  for(const b of Object.values(G.currentLevel.biomes)) for(const t of (b.plantTypes||[])) pal.add(t);
  let cards=0;
  for(const [hk,h] of Object.entries(HAB)){
    for(const p of h.plants){
      cards++;
      const d=PT[p.key], tag=`${hk}/${p.name}`;
      chk(!!d,`${tag}: plant key '${p.key}' exists in PLANT_TYPES`);
      if(d){
        // mirrors TMBus onBoost: warm (ct<=warmMax) matches only an interglacial, cold (ct>=coldMin) only a glacial
        const ct=d.coldTolerance;
        const ok = h.era==='interglacial' ? !(ct>=TG.coldMin) : !(ct<=TG.warmMax);
        chk(ok,`${tag}: a boost passes the gate in its ${h.era} (coldTolerance ${ct})`);
      }
      chk(pal.has(p.key),`${tag}: '${p.key}' is in a biome palette, so a boost seeds somewhere`);
      const s=SPR[p.key];
      chk(!!s && fs.existsSync(path.join(sdir,s)),`${tag}: sticker sprite exists (${s})`);
      // its highlight: the outlined copy app.js swaps in (re-run `node tools/outline_plants.js` after new art)
      chk(!!s && fs.existsSync(path.join(sdir,'assets','plants_outlined',path.basename(s))),
          `${tag}: outlined highlight sprite baked (tools/outline_plants.js)`);
      // Card copy: `desc` (the plant: a string or paragraphs) and optional `birdDesc` (paragraphs under the
      // generated "Boosting … helps:" heading, so only on a card that has a bird).
      const paras=[].concat(p.desc||[]), birdParas=[].concat(p.birdDesc||[]);
      chk(paras.length>0 && paras.every(t=>typeof t==='string' && t.length>0) && paras.join(' ').length>40 &&
          !/lorem|TODO/i.test(paras.join(' ')),`${tag}: has authored card copy`);
      chk(birdParas.every(t=>typeof t==='string' && t.length>0) && (birdParas.length===0 || (p.fauna||[]).length>0),
          `${tag}: its bird copy is paragraphs, on a card that has a bird`);
      // Te reo in the card copy carries its macrons (the same list the plant goals are held to).
      const CARD_MACRONS={ totara:'tōtara', kereru:'kererū', kokako:'kōkako', nikau:'nīkau', kowhai:'kōwhai', tui:'tūī',
        manuka:'mānuka', okatia:'Ōkatia', apiti:'Āpiti', manawatu:'Manawatū', rangitane:'Rangitāne', takahe:'takahē',
        moho:'mōho', purei:'pūrei', kahu:'kāhu', kouka:'kōuka', raupo:'raupō', pohuehue:'pōhuehue', kaka:'kākā' };
      for(const t of paras.concat(birdParas)) for(const [bare,good] of Object.entries(CARD_MACRONS))
        chk(!new RegExp('\\b'+bare+'\\b','i').test(t), `${tag}: card copy spells ${good} with its macrons`);
      for(const fk of (p.fauna||[])){
        const f=FAUNA[fk];
        chk(!!f,`${tag}: fauna '${fk}' is defined`);
        if(!f) continue;
        for(const k of [f.key].concat(f.alsoKeys||[])) chk(!!R.getSpecies(k),`${tag}: fauna sim key '${k}' is a registered species`);
        for(const src of f.sprites) chk(fs.existsSync(path.join(sdir,src)),`${tag}: fauna sprite exists (${src})`);
      }
      // A hand-staged scene (birdStage) only re-poses the card's own birds, with real art.
      for(const s of (p.birdStage||[])){
        chk((p.fauna||[]).indexOf(s.fauna)>=0,`${tag}: staged bird '${s.fauna}' is one of the card's fauna`);
        chk(!!s.sprite && fs.existsSync(path.join(sdir,s.sprite)),`${tag}: staged bird sprite exists (${s.sprite})`);
      }
    }
  }
  // THE BIRD POLICY, and only birds the sim actually founds. The cast = the level's grazer guild +
  // raptor + the flighted forest birds. It must be NORTH ISLAND species (upland and heavy-footed moa
  // etc. are South Island; TEMANAWA_FAUNA.md). Then:
  //   · ONE BIRD PER PLANT: every plant key adds exactly one bird species to the sim (a plant on two
  //     screens carries the same bird on both; the copy may MENTION other birds, it just doesn't send them);
  //   · FULL REPRESENTATION: every cast bird is on at least one plant;
  //   · NO HOGGING: a bird may sit on several plants, but on no more than MAX_PLANTS_PER_BIRD.
  // And the sim's faunaLinks fallback must agree.
  const LV=G.currentLevel, cast=new Set([...(LV.species.moa||[]), ...(LV.species.eagle||[]),
    ...Object.keys(LV.initialEntityCounts||{}).filter(k=>k!=='moa' && k!=='eagle')]);
  const SOUTH_ONLY=['upland_moa','heavy_footed_moa','south_island_giant_moa','eastern_moa','crested_moa'];
  for(const k of SOUTH_ONLY) chk(!cast.has(k),`the founder cast has no South Island-only species (${k})`);
  const MAX_PLANTS_PER_BIRD=2;
  const birdPlants={}, plantBirds={};
  for(const h of Object.values(HAB)) for(const p of h.plants){
    const set=plantBirds[p.key]||(plantBirds[p.key]=new Set());
    for(const fk of (p.fauna||[])){ const f=FAUNA[fk]; if(!f) continue;
      chk(cast.has(f.key),`${p.name}: card bird '${f.key}' is in the founder cast`);
      set.add(f.key); (birdPlants[f.key]||(birdPlants[f.key]=new Set())).add(p.key); }
  }
  for(const [pk,birds] of Object.entries(plantBirds))
    chk(birds.size===1,`plant '${pk}' adds exactly one bird (found ${birds.size}: ${[...birds].join(', ')||'none'})`);
  for(const b of cast){ const n=birdPlants[b]?birdPlants[b].size:0;
    chk(n>=1 && n<=MAX_PLANTS_PER_BIRD,
        `cast bird '${b}' is on 1–${MAX_PLANTS_PER_BIRD} plants (found ${n}: ${birdPlants[b]?[...birdPlants[b]].join(', '):'none'})`); }
  const TBC=vm.runInContext('TM_BOOST',ctx);
  for(const [pk,birds] of Object.entries(plantBirds)){
    const fb=new Set((TBC.faunaLinks[pk]||[]).filter(k=>k.indexOf('young_')!==0));
    chk(fb.size===birds.size && [...birds].every(b=>fb.has(b)),`TM_BOOST.faunaLinks['${pk}'] matches its cards (${[...birds].join(',')||'none'})`);
  }

  // The art-sharing types draw with their source's frames, and a scale override stays on the alias.
  const PS=vm.runInContext('plantSprites',ctx);
  for(const k of ['sedge','wharariki']) chk(PS[k] && PS[k].variants && PS[k].variants.length>0,`'${k}' draws with shared art`);
  chk(PS.wharariki && PS.flax && PS.wharariki.meta!==PS.flax.meta && PS.flax.meta.scale===1,
      'an alias scale override does not leak onto its source set');
  // Beech is the glacial tree: its stage modifier rises into the cold while the podocarps sink.
  const GP=vm.runInContext('GLACIAL_PHASES',ctx);
  chk(GP.fullGlacial.plantTypeModifiers.beech > GP.interglacial.plantTypeModifiers.beech &&
      GP.fullGlacial.plantTypeModifiers.Totara < GP.interglacial.plantTypeModifiers.Totara,
      'beech gains in the cold while Totara sinks (glacial-stage type modifiers)');
  console.log(fail? `encyclopedia roster: ${fail} FAILURES`
    : `encyclopedia roster: ${cards} cards fit their screen's era and resolve to real plants, sprites, palettes and species; ` +
      `one bird per plant; ${cast.size} North Island cast birds, each on 1–${MAX_PLANTS_PER_BIRD} plants`);
}catch(e){ console.log('ENCYCLOPEDIA FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- boost follow-through: a matched boost's plants and birds survive their own time-lapse ----
// The encyclopedia trials (md/TEMANAWA_ENCYCLOPEDIA_CARDS.md, "Sim gaps") boosted every card and played
// the time-lapse out headless. Five things broke the card's promise that the birds answer the plant:
// a thin-habitat plant barely seeded (seedSpecies sampled the WHOLE map, so a species of one small biome
// found almost no site), a boosted kahikatea stand aged out inside the time-lapse while the river was
// visibly moving, tūī never fed at the flowers their card names, huia never in beech, and every
// time-lapse starved the grazer guild to its floor (hunger on the life clock, food-finding on the real
// one; MISTAKES.md). Each is asserted here; reading the code had passed all five.
try{
  const G=vm.runInContext('game',ctx), DT=vm.runInContext('DeepTime',ctx), PT=vm.runInContext('PLANT_TYPES',ctx);
  const Plant_=vm.runInContext('Plant',ctx), KST=vm.runInContext('KERERU_STATE',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  // Seat the land at the test year first. The deep-time morph is sliced across frames and the boot sits
  // at 1 Ma, before the ranges rise: no subalpine belt, so a Dracophyllum or wharariki boost would
  // correctly find nowhere to go. Run the same morph job the frame loop runs, to completion.
  const CFG=vm.runInContext('CONFIG',ctx);
  DT.endTimelapse(); DT.seekTo(122000);
  G.terrain.morphBegin(122000, CFG.morphBakeScale);
  for(let n=0; n<1000 && !G.terrain.morphStep(1e9); n++){}
  G._bakedYearsBP=122000; G._onMorphComplete(); G.resetEcosystem(); DT.seekTo(122000);   // the rebuild resets the clock
  let sim=G.simulation; const season=G.seasonManager, terrain=sim.terrain; season.update(1);
  chk(terrain.biomeArray.some((b,i)=>b.key==='subalpine' && terrain.biomeIndexMap.indexOf(i)>=0),
      'the land is seated at 122 ka (the risen ranges carry a subalpine belt)');

  // 1. Thin habitats seed a full boost: the sample is drawn from the species' own biome cells.
  for(const key of ['sedge','dracophyllum','wharariki','kahikatea']){
    const n=sim.seedSpecies(key,12);
    chk(n>=9, `a ${key} boost finds sites in its own (thin) habitat (${n}/12 seeded)`);
  }
  // …and a kahikatea boost lands only on river wetland, as fresh alluvium (age 0 + a flood disturbance).
  sim._disturbances=[]; sim._disturbActive=false;
  const prior=new Set(sim.plants), nk=sim.seedSpecies('kahikatea',6);
  const kc=sim.plants.filter(p=>!prior.has(p));
  chk(nk>0 && kc.length===nk && kc.every(p=>p.type==='kahikatea' && p.biomeKey==='wetland' && p._kahiAge===0),
      `a kahikatea boost seeds young stands on wetland only (${kc.length})`);
  chk((sim._disturbances||[]).length>=nk, 'each boosted kahikatea stands on a fresh flood (disturb), so it starts young');

  // 2. The river clock: a wetland kahikatea does not age while deep time is moving; at rest, or off the
  //    wetland, it still ages out. The batch loop passes the flag while a time-lapse plays.
  const kw=new Plant_(300,300,'kahikatea',terrain,'wetland'); kw.alive=true; kw.growth=1; kw._kahiAge=0;
  for(let i=0;i<10;i++) kw.update(season,5,0,1,true);
  chk(kw._kahiAge===0, 'a wetland kahikatea does not age while the river is working (a time-lapse)');
  for(let i=0;i<10;i++) kw.update(season,5,0,1,false);
  chk(kw._kahiAge>0, 'at rest the same stand ages (it needs a storm flood to stay young)');
  const kl=new Plant_(300,300,'kahikatea',terrain,'lowland'); kl.alive=true; kl.growth=1; kl._kahiAge=0;
  for(let i=0;i<10;i++) kl.update(season,5,0,1,true);
  chk(kl._kahiAge>0, 'off the wetland a kahikatea ages even in a time-lapse');
  let seen=null; const orig=kw.update;
  kw.update=function(){ seen=arguments[4]; return orig.apply(this,arguments); };
  sim.plants.unshift(kw); sim._plantBatchIndex=0;
  DT.beginTimelapse(DT.yearsBP-20000); sim.updatePlantsBatched(1);
  chk(seen===true, 'updatePlantsBatched tells plants the river is working while a time-lapse plays');
  DT.endTimelapse(); seen=null; sim._plantBatchIndex=0; sim.updatePlantsBatched(1);
  chk(seen===false, '…and that it is static at rest');
  sim.plants.shift();

  // 3. Flyer forage: tūī feed at the flowers on their card (kōwhai, harakeke, wharariki) and huia work
  //    beech, without carrying seed; the kererū still takes only warm, large-fruited trees.
  const one=(bird,type)=>({ alive:true, _consumed:false, dormant:false, growth:1, type,
                            coldTolerance:PT[type].coldTolerance, pos:{ x:bird.pos.x+5, y:bird.pos.y } });
  const only=(p)=>({ getNearbyPlants:()=>[p] });
  const tu=(sim.otherEntities.tui||[]).find(x=>x.alive), ke=(sim.otherEntities.kereru||[]).find(x=>x.alive);
  const hu=(sim.otherEntities.huia||[]).find(x=>x.alive && x.isFemale);
  chk(!!tu && !!ke && !!hu, 'a tūī, a kererū and a female huia exist for the forage checks');
  if(tu && ke && hu){
    for(const t of ['kowhai','flax','wharariki']){ const p=one(tu,t); chk(tu._findFruitTree(only(p))===p, `a tūī feeds at ${t}`); }
    { const p=one(ke,'kowhai'); chk(ke._findFruitTree(only(p))===null, 'a kererū does not take kōwhai (not a warm fruit tree)'); }
    { const p=one(ke,'tawa');   chk(ke._findFruitTree(only(p))===p,   'a kererū still feeds at tawa'); }
    { const p=one(hu,'beech');  chk(hu._findFruitTree(only(p))===p,   'a huia works beech (huhu grubs in dead wood)'); }
    { const p=one(ke,'beech');  chk(ke._findFruitTree(only(p))===null, 'a kererū does not feed in beech'); }
    // A seedless crop (nectar, grubs) moves no seed; a fruit crop still does.
    const feedThenDisperse=(bird,type)=>{
      const p=one(bird,type); bird._targetTree=p; bird._feedTimer=0.01; bird.state=KST.FEEDING; bird._relocating=false;
      bird._feeding(sim,1);
      let planted=0; const stub={ disperseSeed:()=>{ planted++; } };
      const dc=bird._disperseChance; bird._disperseChance=1; bird.crop=1; bird.state=KST.FLYING;
      bird._target.set(bird.pos.x,bird.pos.y); bird._flying(stub,1); bird._disperseChance=dc;
      return planted;
    };
    chk(feedThenDisperse(tu,'kowhai')===0 && tu._cropSeedless===true, 'a tūī nectar feed at kōwhai plants no seed');
    chk(feedThenDisperse(tu,'tawa')===1 && tu._cropSeedless===false, 'a tūī fruit feed at tawa still disperses');
  }

  // 4. Metabolism runs on the REAL clock: one real frame costs the same hunger at 1× and at 10× life
  //    speed, while ageing still runs on the life clock. Every behave() takes only the life dt.
  sim.update(10,1); chk(sim.lifeScale===10, `sim.update(10, 1) records the life clock's lead (lifeScale ${sim.lifeScale})`);
  sim.update(1,1);  chk(sim.lifeScale===1, 'at rest lifeScale is 1');
  const m=sim.moas.find(x=>x.alive);
  if(m){
    const tick=(ls)=>{ m.hunger=0; m.canMate=false; m.mateCooldown=1e9; m.isPregnant=false; sim.lifeScale=ls;
                       const a=m.age; m.behave(sim,season,ls); return [m.hunger, m.age-a]; };
    const [h1]=tick(1), [h10,aged]=tick(10);
    chk(h1>0 && Math.abs(h10-h1)<1e-9, `a moa burns the same hunger per real frame at 10× life speed (${h1.toFixed(4)} vs ${h10.toFixed(4)})`);
    chk(Math.abs(aged-10)<1e-6, 'and still ages by the life dt');
  }
  if(ke){
    const savedStorm=G._tmStormUntil, savedOver=G._stormOveruse; G._tmStormUntil=0; G._stormOveruse=false;
    const tick=(ls)=>{ ke.hunger=0; ke.state=KST.PERCHED; ke._restTimer=1e9; sim.lifeScale=ls; ke.behave(sim,season,ls); return ke.hunger; };
    const h1=tick(1), h10=tick(10);
    chk(h1>0 && Math.abs(h10-h1)<1e-9, `a kererū burns the same hunger per real frame at 10× life speed (${h1.toFixed(4)} vs ${h10.toFixed(4)})`);
    G._tmStormUntil=savedStorm; G._stormOveruse=savedOver;
  }
  const e=sim.eagles.find(x=>x.alive);
  if(e){
    const tick=(ls)=>{ e.hunger=0; e.hunting=false; e.target=null; sim.lifeScale=ls; e.behave(sim,ls); return e.hunger; };
    const h1=tick(1), h10=tick(10);
    chk(h1>0 && Math.abs(h10-h1)<1e-9, `a harrier burns the same hunger per real frame at 10× life speed (${h1.toFixed(4)} vs ${h10.toFixed(4)})`);
  }
  sim.lifeScale=1;

  // 5. End to end: a fast life clock alone (a fixed year, so no climate swing) must not thin the guild.
  //    With hunger on the life clock this fell 29 → 21 inside ~400 frames; now it holds or breeds up.
  G.resetEcosystem(); DT.endTimelapse(); DT.seekTo(122000); for(let i=0;i<30;i++) FRAME(ctx.draw);
  sim=G.simulation;
  const keys=(sim.activeSpecies && sim.activeSpecies.moa) || [];
  const total=()=>keys.reduce((a,k)=>a+sim.getSpeciesCount(k),0);
  const t0=total(); let tmin=t0;
  for(let i=0;i<480;i++){ ctx.frameCount++; sim.update(8,1); if(i%40===0){ const t=total(); if(t<tmin) tmin=t; } }
  chk(t0>0 && tmin>=t0-2, `an 8× life clock does not starve the grazer guild (${t0} → min ${tmin} → ${total()} over 480 frames)`);

  DT.reset(); G._boostHi=null; G.resetEcosystem();
  console.log(fail? `boost follow-through: ${fail} FAILURES`
    : 'boost follow-through: thin habitats seed full boosts, kahikatea stays young while the river works, '+
      'tūī/huia feed at their card plants (seedless), metabolism runs on the real clock so a time-lapse feeds the guild');
}catch(e){ console.log('FOLLOW-THROUGH FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- plant goals: the visitor objective is a question a plant answers ----------------------
// TeManawa_goals.js. The line above the timeline asks a question a plant answers ("Boost a plant
// that was rarer in ancient times than today" → harakeke). Each boost is judged against it
// (TMGoals.judge, from TeManawa_bus.js onBoost): the ANSWER gets its verdict in the climate colour, a
// bigger boost and a white outline easing to green/blue, and a new goal is drawn once the time-lapse is
// over; another plant in the right climate gets the "but is not" line; a wrong-climate plant the grey
// line. A goal is live only while an answer fits the climate and has habitat on the land, inside any
// date window and with its `requires` met. Among the live goals one is DRAWN, leaning on the bird
// sequence (moa → harrier → lowland → forest), skipping recent ones. md/TEMANAWA_GOALS.md.
try{
  const G=vm.runInContext('game',ctx), DT=vm.runInContext('DeepTime',ctx), TB=vm.runInContext('TMBus',ctx);
  const TG=vm.runInContext('TMGoals',ctx), TGL=vm.runInContext('TM_GOALS',ctx), TBO=vm.runInContext('TM_BOOST',ctx);
  const PT=vm.runInContext('PLANT_TYPES',ctx), CFG=vm.runInContext('CONFIG',ctx), ES=vm.runInContext('EntitySprites',ctx);
  const IH=vm.runInContext('InstallHUD',ctx), D=vm.runInContext('Debug',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };
  // Seat the land at a year (the morph job the frame loop runs, to completion), then a fresh cast.
  const seat=(yr)=>{ DT.endTimelapse(); DT.seekTo(yr); G.terrain.morphBegin(yr, CFG.morphBakeScale);
    for(let n=0; n<1000 && !G.terrain.morphStep(1e9); n++){}
    G._bakedYearsBP=yr; G._onMorphComplete(); G.resetEcosystem(); DT.seekTo(yr); };   // the rebuild resets the clock: re-seek
  const tick=()=>TG.update(G,_t);           // the per-frame hook (InstallHUD.update calls it), driven directly
  const boost=(m)=>{ TB.boost(m); DT.endTimelapse(); };   // judge + seed, without playing the time-lapse
  const solve=(key)=>{ boost({ plantKey:key }); _t+=TGL.holdMs+1; tick(); };   // boost, then let the verdict release
  const realBook=TGL.list, realRand=TG._rand;
  TG._rand=()=>0;                           // deterministic draws: always the stage pick, always the first
  const gHara=realBook.find(gl=>gl.id==='harakeke-rarer');
  try{

  // 1. The book is well formed, and every answer is a real plant a visitor can boost from a card.
  const ectx={console:{log(){},warn(){},error(){}}}; vm.createContext(ectx);
  vm.runInContext(fs.readFileSync(path.join(dir,'secondscreen','encyclopedia.js'),'utf8'),ectx);
  const onCard=new Set(), cardName={};
  for(const h of Object.values(vm.runInContext('TM_HABITATS',ectx))) for(const p of h.plants){ onCard.add(p.key); cardName[p.key]=p.name; }
  const sim0=G.simulation;
  const knownBirds=new Set([...(sim0.activeSpecies.moa||[]), 'eyles_harrier', ...Object.keys(sim0.otherEntities||{})]);
  const ids=new Set();
  chk(!!gHara, 'the book still has the harakeke goal');
  for(const gl of realBook){
    chk(!!gl.id && !ids.has(gl.id), `goal ids are unique (${gl.id})`); ids.add(gl.id);
    chk(TGL.sequence.includes(gl.group), `${gl.id}: its group '${gl.group}' is in the bird sequence`);
    chk(typeof gl.prompt==='string' && gl.prompt.length>0 && gl.prompt.length<=80 && typeof gl.cond==='string' && gl.cond.length>0,
        `${gl.id}: has a prompt (≤ 80 characters, ${gl.prompt && gl.prompt.length}) and a condition`);
    chk(Array.isArray(gl.answer) && gl.answer.length>0, `${gl.id}: has an answer`);
    for(const k of (gl.answer||[])){
      chk(!!PT[k], `${gl.id}: answer '${k}' is a real plant`);
      chk(onCard.has(k), `${gl.id}: answer '${k}' is on a touchscreen card (a visitor can boost it)`);
    }
    for(const [kind,line] of Object.entries(gl.text||{}))   // a goal's own verdict lines
      chk(['answer','matched','wrong','answerWrongClimate'].includes(kind) && typeof line==='string' && line.indexOf('{plant}')>=0,
          `${gl.id}: its own '${kind}' line is a known verdict and names the plant`);
    const R=gl.requires||{};
    for(const k of Object.keys(R.plants||{})) chk(!!PT[k], `${gl.id}: requires.plants '${k}' is a real plant`);
    for(const k of Object.keys(R.birds||{})) chk(knownBirds.has(k), `${gl.id}: requires.birds '${k}' is a bird in the cast`);
    // Every verdict line this goal can produce fits the HUD (≤ 3 wrapped lines): the longest card name.
    const longest=Object.keys(cardName).reduce((a,k)=>{ const n=(TGL.verdictNames[k]||cardName[k]); return n.length>a.length?n:a; },'');
    for(const kind of ['answer','matched','wrong','answerWrongClimate']){
      const tpl=(gl.text&&gl.text[kind])||TGL.text[kind];
      const L=TG.format(tpl,longest,'interglacial',gl.cond).length;
      chk(L<=130, `${gl.id}: its '${kind}' line fits the HUD (${L} ≤ 130 characters)`);
    }
  }
  // Te reo in every visitor-facing string carries its macrons.
  const MACRONS={ totara:'tōtara', kereru:'kererū', kokako:'kōkako', nikau:'nīkau', kowhai:'kōwhai', tui:'tūī', manuka:'mānuka',
    okatia:'Ōkatia', apiti:'Āpiti', manawatu:'Manawatū', rangitane:'Rangitāne', takahe:'takahē', moho:'mōho', purei:'pūrei',
    kahu:'kāhu', kouka:'kōuka' };
  const visible=[...Object.values(TGL.text), ...Object.values(TGL.names), ...Object.values(TGL.verdictNames)];
  for(const gl of realBook) visible.push(gl.prompt, gl.cond, ...Object.values(gl.text||{}));
  for(const s of visible) for(const [bare,good] of Object.entries(MACRONS))
    chk(!new RegExp('\\b'+bare+'\\b','i').test(s), `"${s}" spells ${good} with its macrons`);
  // The both-worlds goal answers with EXACTLY the card plants the boost gate matches in either climate,
  // so a coldTolerance retune can't leave it answering the wrong set.
  const gBoth=realBook.find(gl=>gl.id==='both-worlds');
  if(gBoth){
    const neutral=[...onCard].filter(k=>TG.fitOf(k)==='neutral').sort().join(',');
    chk([...gBoth.answer].sort().join(',')===neutral, `both-worlds answers are the both-worlds card plants (${neutral})`);
  }
  for(const k of ['answer','matched','wrong','answerWrongClimate'])
    chk(typeof TGL.text[k]==='string' && TGL.text[k].indexOf('{plant}')>=0 && TGL.text[k].indexOf('{cond}')>=0,
        `verdict line '${k}' names the plant and the condition`);
  chk(TG.fitOf('flax')==='neutral' && TG.fitOf('tawa')==='warm' && TG.fitOf('beech')==='cold',
      'TMGoals.fitOf (shared with the boost gate): harakeke neutral, tawa warm, beech cold');
  chk(TG.format('{a} {regime}','X','interglacial','')==='an interglacial' && TG.format('{a} {regime}','X','glacial','')==='a glacial',
      'the verdict says "an interglacial" / "a glacial"');

  // 2. Staging, on the 1 Ma land: the ranges have not risen, so there are no subalpine tops.
  seat(1000000);
  chk(G.simulation.hasHabitat('flax',TGL.minHabitatCells) && !G.simulation.hasHabitat('dracophyllum',TGL.minHabitatCells),
      'at 1 Ma harakeke has habitat and Dracophyllum has none to speak of (no subalpine tops yet)');
  const gDraco={ id:'t-draco', group:'forest', prompt:'P-draco', cond:'c', answer:['dracophyllum'] };
  const gLate ={ id:'t-late',  group:'moa', prompt:'P-late',  cond:'c', answer:['flax'], fromYearsBP:500000 };
  TGL.list=[gLate, gHara]; TG.reset(); tick();
  chk(TG.live()===gHara, `a fromYearsBP goal waits for its opening (live: ${TG.live()&&TG.live().id})`);
  // Isolate the habitat gate: a GLACIAL clock over the unrisen 1 Ma land (seeking does not morph the land
  // until frames run). Dracophyllum fits the climate, so only its missing habitat can keep it dark.
  DT.seekTo(30000); TGL.list=[gDraco, gHara]; TG.reset(); tick();
  chk(TG.glacialNow() && TG.live()===gHara,
      `the habitat gate alone keeps a Dracophyllum goal dark before the ranges rise (live: ${TG.live()&&TG.live().id})`);

  // 3. At 30 ka (a glacial) the ranges carry subalpine tops: the Dracophyllum goal (a cold plant) opens
  //    by itself, as does the window.
  seat(30000);
  chk(G.simulation.hasHabitat('dracophyllum',TGL.minHabitatCells) && !G.simulation.hasHabitat('dracophyllum',1e9),
      'hasHabitat counts cells against its threshold (enough subalpine at 30 ka, but not a billion cells)');
  TGL.list=[gDraco]; TG.reset(); tick();
  chk(TG.live()===gDraco, `the Dracophyllum goal goes live once the ranges carry subalpine tops (live: ${TG.live()&&TG.live().id})`);
  TGL.list=[gLate]; TG.reset(); tick();
  chk(TG.live()===gLate, `a fromYearsBP goal is live once the clock is younger than its opening (live: ${TG.live()&&TG.live().id})`);
  const gWarm={ id:'t-warm', group:'forest', prompt:'P-warm', cond:'c', answer:['tawa'] };
  TGL.list=[gWarm]; TG.reset(); DT.seekTo(122000); tick();
  chk(TG.live()===gWarm, 'a warm-answer goal is live in an interglacial');
  DT.seekTo(150000); tick();
  chk(TG.live()===null && TG.text()===null, 'and dark in a glacial, where it could not be met (the regime objective shows)');
  // A goal with a warm AND a cold answer is live in either climate; its warm answer boosted in a glacial
  // is the right plant in the wrong climate: grey, and nothing grows.
  const gMixed={ id:'t-mixed', group:'forest', prompt:'P-mixed', cond:'c', answer:['tawa','beech'] };
  TGL.list=[gMixed]; TG.reset(); tick();
  boost({ plantKey:'tawa', plantName:'Tawa' });
  chk(TG.verdict() && TG.verdict().kind==='answerWrongClimate' && TG.color()===TGL.colWrong,
      'the right plant in the wrong climate gets its own grey line');
  DT.seekTo(122000); G.resetEcosystem(); DT.seekTo(122000); TG.reset(); tick();

  // 4. The `requires` gate: grown plants, birds alive, an eruption this session; and drafts never show.
  const counts=TG._plantCounts(G.simulation), nK=G.simulation.getSpeciesCount('kereru');
  const tot=counts.Totara||0;
  const req=(r)=>({ id:'t-req', group:'moa', prompt:'P-req', cond:'c', answer:['flax'], requires:r });
  const liveWith=(gl)=>{ TGL.list=[gl]; TG.reset(); tick(); return TG.live()===gl; };
  chk(liveWith(req({ plants:{ Totara: tot } })) && !liveWith(req({ plants:{ Totara: tot+1 } })),
      `requires.plants counts the GROWN plants on the land (tōtara ${tot})`);
  chk(liveWith(req({ birds:{ kereru: nK } })) && !liveWith(req({ birds:{ kereru: nK+1 } })),
      `requires.birds counts the birds alive (kererū ${nK})`);
  const fired=G._firedEruptions; G._firedEruptions=new Set();
  chk(!liveWith(req({ eruption:true })), 'requires.eruption waits for an eruption this session');
  G._firedEruptions.add(349000);
  chk(liveWith(req({ eruption:true })), '…and opens once one has happened');
  G._firedEruptions=fired;
  chk(!liveWith({ id:'t-off', group:'moa', prompt:'P', cond:'c', answer:['flax'], off:true }), 'a draft (off: true) is never delivered');

  // 5. The real book through the climates: every live goal can be met, and the glacials have goals too.
  TGL.list=realBook;
  for(const yr of [122000, 30000]){
    DT.seekTo(yr); const gla=TG.glacialNow(); const live=TG.liveGoals(G, gla, yr);
    chk(live.length>0, `the real book has live goals in a${gla?' glacial':'n interglacial'} (${live.map(x=>x.id).join(', ')})`);
    for(const gl of live) chk(gl.answer.some(k=>TG.fits(k,gla)), `${gl.id}: live in a${gla?' glacial':'n interglacial'} only with an answer that fits it`);
  }
  DT.seekTo(122000);

  // 6. The verdicts, on a one-goal book (harakeke).
  TGL.list=[gHara]; TG.reset(); tick();
  chk(TG.live()===gHara && TG.text()===gHara.prompt, 'the harakeke goal is live, and its prompt is the line');
  const cond=gHara.cond;
  // (a) another plant in the right climate: the normal matched boost, the "but is not" line.
  boost({ plantKey:'tawa', plantName:'Tawa' });
  chk(TG.verdict() && TG.verdict().kind==='matched' &&
      TG.text()===TG.format(TGL.text.matched,'Tawa','interglacial',cond) && TG.color()===TGL.colPrompt,
      `another plant in the right climate: "${TG.text()}"`);
  // (b) the wrong climate: grey, nothing seeded.
  DT.seekTo(150000); tick();
  chk(TG.live()===gHara, 'harakeke (both worlds) keeps its goal live in a glacial');
  const sim=G.simulation, count=(k)=>sim.plants.filter(p=>p.alive && p.type===k).length;
  const t0=count('tawa');
  boost({ plantKey:'tawa', plantName:'Tawa' });
  chk(TG.verdict() && TG.verdict().kind==='wrong' &&
      TG.text()===TG.format(TGL.text.wrong,'Tawa','glacial',cond) && TG.color()===TGL.colWrong && count('tawa')===t0,
      `the wrong climate: "${TG.text()}" (grey, nothing grows)`);
  // (c) the answer: the verdict in the climate colour, a bigger boost, a white outline easing to colour.
  DT.seekTo(122000); tick();
  const f0=count('flax'), b0=sim.getSpeciesCount('mantells_moa');
  TB.boost({ plantKey:'flax', plantName:'Harakeke', fauna:['mantells_moa'] });
  chk(TG.verdict() && TG.verdict().kind==='answer' && TG.text()===TG.format(TGL.text.answer,'Harakeke','interglacial',cond),
      `the answer: "${TG.text()}"`);
  chk(TG.color()===TBO.outlineInterglacial, 'the answer verdict takes the interglacial boost colour (green)');
  chk(count('flax')-f0 > TBO.matchedSeed, `the answer gets a bigger boost than a normal one (${count('flax')-f0} > ${TBO.matchedSeed} harakeke)`);
  chk(sim.getSpeciesCount('mantells_moa')-b0 > TBO.faunaRecruit,
      `…and more of its bird (Mantell's moa ${b0} → ${sim.getSpeciesCount('mantells_moa')})`);
  const hi=G._boostHi;
  chk(!!(hi && hi.from) && ES.outlineStyle(hi, hi.t0).join(',')==='255,255,255' && ES._olAlpha===1,
      'the answer outline starts solid white');
  chk(ES.outlineStyle(hi, hi.t0+hi.fadeMs)===TBO.outlineInterglacial, '…and eases to the climate colour (green)');
  // The HUD shows the verdict, every word wrapped in.
  const dm=D.mode; D.mode='off'; D.applyVisibility(); FRAME(ctx.draw);
  chk(IH._goalFade && IH._goalFade.cur.text===TG.text() && IH._goalFade.cur.col===TG.color(),
      'the line above the timeline shows the verdict, in its colour');
  chk(IH._goalFade.cur.lines && IH._goalFade.cur.lines.join(' ')===TG.text(), 'wrapping keeps every word');
  D.mode=dm; D.applyVisibility();
  // (d) the verdict holds through its time-lapse, then a goal comes back (a one-goal book: itself).
  chk(DT.isTimelapsing(), 'the answer boost runs its time-lapse');
  _t+=TGL.holdMs+1; tick();
  chk(TG.verdict() && TG.verdict().kind==='answer', 'the verdict holds while the time-lapse plays');
  DT.endTimelapse(); tick();
  chk(!TG.verdict() && TG.live()===gHara && TG.text()===gHara.prompt, 'then the line returns to a goal');
  // A goal's own success line: the both-worlds goal answers in glacial/interglacial terms, and its
  // other lines fall back to the book's.
  if(gBoth){
    TGL.list=[gBoth]; TG.reset(); tick();
    boost({ plantKey:'manuka', plantName:'Mānuka' });
    chk(TG.verdict() && TG.verdict().kind==='answer' && TG.text()==='Mānuka was suited to both glacial and interglacial habitats!',
        `a goal can word its own success line: "${TG.text()}"`);
    boost({ plantKey:'tawa', plantName:'Tawa' });
    chk(TG.text()===TG.format(TGL.text.matched,'Tawa','interglacial',gBoth.cond), '…and the lines it leaves out use the book defaults');
    _t+=TGL.holdMs+1; tick();
  }
  // A verdict name can beat the card's own (the "Mamaku & Ponga" card reads "The tree fern" in a sentence).
  TGL.list=[{ id:'t-fern', group:'forest', prompt:'P', cond:'c', answer:['fern'] }]; TG.reset(); tick();
  boost({ plantKey:'fern', plantName:'Mamaku & Ponga' });
  chk(TG.text().indexOf(TGL.verdictNames.fern)===0, `a verdict name beats the card name ("${TG.text()}")`);
  _t+=TGL.holdMs+1; tick();

  // 7. The draw: the bird sequence, its variance, the recent memory, and holding a goal across a flip.
  const mk=(id,group)=>({ id, group, prompt:'P-'+id, cond:'c', answer:['flax'] });
  const gMoa=mk('t-moa','moa'), gHar=mk('t-har','harrier'), gLow=mk('t-low','lowland'), gFor=mk('t-for','forest');
  TGL.list=[gFor, gLow, gHar, gMoa]; TG.reset(); tick();
  const order=[TG.live().id];
  for(let i=0;i<3;i++){ solve('flax'); order.push(TG.live().id); }
  chk(order.join(',')==='t-moa,t-har,t-low,t-for', `solving moves the draw along the bird sequence (${order.join(' → ')})`);
  TGL.list=[gMoa, gHar, gLow, gFor]; TG._rand=()=>0.99; TG.reset(); tick();   // stage = moa, but the draw ≥ bias
  chk(TG.live()===gFor, `the variance draw can take a live goal outside the current stage (got ${TG.live().id})`);
  TG._rand=()=>0;
  const gMoa2=mk('t-moa2','moa');
  TGL.list=[gMoa, gMoa2]; TG.reset(); tick();
  const first=TG.live(); solve('flax');
  chk(TG.live()!==first, 'the recent memory skips the goal just shown while there is another choice');
  const held=TG.live(); DT.seekTo(150000); tick();
  chk(TG.glacialNow() && TG.live()===held, 'a goal that is still live is held across a climate flip');
  DT.seekTo(122000); tick();
  // A miss leaves the goal up; a soft reset (a new visitor) clears any verdict and restarts the sequence.
  boost({ plantKey:'tawa' }); _t+=TGL.holdMs+1; tick();
  chk(TG.live()===held, 'a miss leaves the same goal up');
  boost({ plantKey:'tawa' });
  G.resetEcosystem(); DT.seekTo(122000); tick();
  chk(!TG.verdict() && TG._stage===0 && TG._recent.length===1, 'a soft reset clears the verdict and restarts the sequence');

  // 8. The climate line under the year: "The climate is INTERGLACIAL / GLACIAL", the state in green / blue.
  const drawn=[]; const bt=IH._blitText;
  IH._blitText=function(s,f,t,sz,ah,av,x,y,col){ drawn.push([s,col]); return bt.apply(this,arguments); };
  const lineAt=(yr)=>{ DT.seekTo(yr); drawn.length=0; IH.renderVisitorYear(G,1920,1080); return drawn; };
  let d=lineAt(122000);
  chk(d.some(([s])=>s===IH.CLIMATE_PREFIX) && d.some(([s,c])=>s==='INTERGLACIAL' && c===TBO.outlineInterglacial),
      'under the year: "The climate is INTERGLACIAL", the state in green');
  d=lineAt(30000);
  chk(d.some(([s,c])=>s==='GLACIAL' && c===TBO.outlineGlacial), '…and "GLACIAL" in blue in a glacial');
  // 9. The tally under the climate line: right-for-the-climate boosts count, wrong ones do not, and a
  //    restarted timeline (DeepTime.reset, on every soft reset) starts it again at 0.
  const coldKey=['tussock','snow_tussock','dracophyllum','coprosma','hebe'].find(k=>TG.fitOf(k)==='cold');
  DT.reset(); DT.seekTo(122000);
  boost({ plantKey:'tawa' }); boost({ plantKey:'tawa' });
  if(coldKey) boost({ plantKey:coldKey });                  // a cold plant in an interglacial: wrong, not counted
  drawn.length=0; IH.renderVisitorYear(G,1920,1080);
  chk(DT.boostsOk===2 && drawn.some(([s])=>s===IH.BOOSTS_PREFIX+'2'),
      `under the climate line: "Successful boosts: 2" after two right boosts${coldKey?' and one wrong':''} (counted ${DT.boostsOk})`);
  G.resetEcosystem(); drawn.length=0; IH.renderVisitorYear(G,1920,1080);
  chk(DT.boostsOk===0 && drawn.some(([s])=>s===IH.BOOSTS_PREFIX+'0'), '…and a soft reset (timeline restart) zeroes it');
  IH._blitText=bt;

  } finally { TGL.list=realBook; TG._rand=realRand; TG.reset(); DT.reset(); G._boostHi=null; G.resetEcosystem(); }
  console.log(fail? `plant goals: ${fail} FAILURES`
    : 'plant goals: verdicts (answer / right climate / wrong climate) with a bigger answer boost; goals gated by climate, habitat, '+
      'window and requires; drawn along the bird sequence with variance; macrons + line lengths; the climate line under the year');
}catch(e){ console.log('GOALS FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

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

  // out-of-range elevation must clamp to the FLOOR band, not fall through to the
  // last (snow). Marine emergence clamps whole basins to elevation 0 and the
  // border wobble then samples slightly NEGATIVE — unguarded, that painted the
  // 1 Ma sea as a grey-white snow speckle (the grey-screen bug, Aug 2026).
  const lowest=G.terrain.biomeList[0], highest=G.terrain.biomeList[G.terrain.biomeList.length-1];
  chk(G.terrain.getBiomeFromElevation(-0.01)===lowest,
      'negative elevation must classify as the lowest band, not fall through to '+highest.key);
  chk(G.terrain.getBiomeFromElevation(NaN)===lowest,
      'NaN elevation must classify as the lowest band');

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

  // GEO — the ranges' shaping (still on the stubbed re-bake)
  const GEOt = vm.runInContext('GEO', ctx);
  chk(GEOt && typeof GEOt.apply === 'function' && typeof GEOt.list === 'function'
      && typeof GEOt.uplift === 'function' && typeof GEOt._draw === 'function',
      'GEO must exist with apply()/list()/uplift()/_draw()');
  GEOt.sync();
  chk(Math.abs(GEOt.relief - L.rangeRelief) < 1e-9, 'GEO.sync mirrors LOOK.rangeRelief');
  GEOt.set({ spine: 0.7 });
  chk(Math.abs(L.rangeSpine - 0.7) < 1e-9, 'GEO.set writes rangeSpine back to LOOK');
  GEOt.uplift(0.5);
  chk(G.terrain._geoUpliftOverride === 0.5, 'GEO.uplift sets the maturity-preview override');
  GEOt.uplift(null);
  chk(G.terrain._geoUpliftOverride == null, 'GEO.uplift(null) clears the override');
  if (G.terrain.geo && G.terrain.geo.ranges && G.terrain.geo.ranges[0]) {
    const _h0 = G.terrain.geo.ranges[0].height;
    GEOt.height(0, 0.77);
    chk(G.terrain.geo.ranges[0].height === 0.77, 'GEO.height edits the range source (picked up on regenerate)');
    G.terrain.geo.ranges[0].height = _h0;
  }

  // restore real re-bake + authored look/land (one real regenerate)
  G.rebakeTerrain = realBake;
  Object.assign(L, L._defaults);
  GN.reset();
  chk(C.octaves === G.currentLevel.terrain.octaves, 'GEN.reset restores the level authored terrain');

  console.log(fail ? `dev tools: ${fail} FAILURES`
    : 'dev tools: LOOK solo/all/reset + GEN sync/apply/reseed/reset + GEO ranges OK');
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
  const a1 = ES.getMoaSpriteTinted(0, true, tintA);
  const a2 = ES.getMoaSpriteTinted(0, true, tintA);
  chk(ES.isValid(a1), 'a tinted moa frame must be valid');
  chk(a1 === a2, 'tinted frames are baked once and reused (no per-frame allocation)');
  chk(!!(ES._tintCache && ES._tintCache['180,120,90']), 'tints cache keyed by colour');
  ES.getMoaSpriteTinted(0, true, [10, 20, 30]);
  chk(Object.keys(ES._tintCache).length >= 2, 'distinct tints cache separately');
  chk(ES.isValid(ES.getMoaSpriteTinted(0, true, null)), 'a null tint falls back to a valid untinted frame');

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

// ---- sprite atlas: loaded frames packed into shared pages, image() wrapped -----
// The harness stubs createGraphics/image, so it cannot verify pixel-correct
// sub-rects (that is the browser check) — but it CAN guard the WIRING: build ran,
// the loose sprite refs were rebound to AtlasFrames (aliases and all), and the
// draw shim is installed. This is what stops a future sprite-load refactor from
// silently leaving the atlas unbuilt.
{
  const SA = vm.runInContext('SpriteAtlas', ctx);
  const ES = vm.runInContext('EntitySprites', ctx);
  const PS = vm.runInContext('PLANT_SPRITES', ctx);
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };

  chk(SA && SA.enabled, 'SpriteAtlas.build() must have run in setup()');
  chk(SA && SA.frameCount > 0, 'the atlas must have packed at least one frame');
  chk(SA && SA.pages && SA.pages.length > 0, 'the atlas must have at least one page');

  // A loaded fauna frame is now an AtlasFrame whose width/height mirror the source.
  const eF = ES && ES.eagle && ES.eagle.fly[0];
  chk(SA.isFrame(eF), 'eagle.fly[0] must be rebound to an AtlasFrame');
  chk(eF && eF.width > 0 && eF.height > 0, 'an AtlasFrame must mirror the source dimensions');
  chk(eF && eF.__page && eF.sw > 0 && eF.sh > 0, 'an AtlasFrame must carry a page + sub-rect');
  // Aliased slots (eagle.dive === fly[huntFrame]) share the packed frame.
  chk(SA.isFrame(ES.eagle.dive), 'the aliased eagle.dive slot must also be a frame');
  // Flora rebound through the same pass.
  const somePlant = PS && Object.keys(PS)[0] && PS[Object.keys(PS)[0]];
  const pf = somePlant && (somePlant.mature || somePlant.dormant || (somePlant.variants && somePlant.variants[0]));
  chk(!pf || SA.isFrame(pf), 'a loaded plant frame must be rebound to an AtlasFrame');

  chk(SA._shimInstalled, 'the global image() shim must be installed');
  chk(SA.isFrame({ __atlas: true }) && !SA.isFrame({ width: 9, height: 9 }),
      'isFrame() distinguishes AtlasFrames from raw images');

  // Half-res packing (fix #4): frames are STORED at packScale× native, so the on-page
  // sub-rect (sw/sh) is smaller than the mirrored source size (width/height stays native
  // so downstream draw sizes are unchanged). Guards the VRAM/page-count fix from silently
  // reverting to a 1:1 pack (which blew the ≤80 MB BUILD_V3 §5.2 budget on an iGPU).
  chk(SA.scale > 0 && SA.scale <= 1, 'the atlas records the pack scale in force');
  if (SA.scale < 1) chk(eF && eF.sw < eF.width && eF.sh < eF.height,
      'a <1x pack scale stores frames smaller than native (sw/sh < width/height)');

  console.log(fail ? `sprite atlas: ${fail} FAILURES`
    : `sprite atlas: ${SA.frameCount} frames in ${SA.pages.length} page(s) at ${SA.scale}x, refs rebound + image() wrapped`);
}

// ---- live fauna outline (prototype): the baked sticker border, recoloured per frame ----------
// TeManawa_outline.js. The harness has no pixels (no masks get built) and no GL (draw() is a no-op),
// so it guards the parts that can silently go wrong: the extraction on a synthetic sticker sprite
// (border taken, ink + cream INSIDE the ink left alone, a gap in the ink can't leak far), the colour
// rules, the atlas packing each mask beside its sprite, and the 2D fallback keeping the baked border.
try{
  const FO=vm.runInContext('FaunaOutline',ctx), FOC=vm.runInContext('FAUNA_OUTLINE',ctx);
  const SA=vm.runInContext('SpriteAtlas',ctx), ES=vm.runInContext('EntitySprites',ctx), TBO=vm.runInContext('TM_BOOST',ctx);
  const G=vm.runInContext('game',ctx);
  let fail=0; const chk=(c,m)=>{ if(!c){ console.log('  FAIL',m); fail++; } };

  // 1. A 40×40 sticker: transparent margin, a 4 px off-white border, a 2 px ink line, then the body:
  //    its left half the SAME cream as the border (moa legs, the kererū's breast), its right half brown.
  const W=40, H=40, px=new Uint8ClampedArray(W*H*4);
  const ring=(x,y)=>Math.min(x, y, W-1-x, H-1-y);              // distance in from the frame edge
  const CREAM=[235,229,213], INK=[30,22,18], BROWN=[120,80,60];
  const paint=(gap)=>{
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){
      const d=ring(x,y), i=(y*W+x)*4;
      let c=null;
      if(d>=4 && d<8) c=CREAM;                                      // the sticker border
      else if(d>=8 && d<10) c=(gap && x>=8 && x<10 && y>=18 && y<22) ? CREAM : INK;   // ink, optionally gapped
      else if(d>=10) c=(x<20) ? CREAM : BROWN;                      // the body
      if(c){ px[i]=c[0]; px[i+1]=c[1]; px[i+2]=c[2]; px[i+3]=255; } else { px[i]=px[i+1]=px[i+2]=px[i+3]=0; }
    }
  };
  const at=(r,x,y)=>r.alpha[y*W+x];
  paint(false);
  let r=FO.extract(px,W,H,8);
  chk(r && Math.abs(r.base[0]-235)<2 && Math.abs(r.base[2]-213)<2, 'the border colour is read off the sticker edge');
  chk(r && at(r,5,20)===255 && at(r,20,6)===255, 'the sticker border is taken (fully)');
  chk(r && at(r,8,20)===0 && at(r,20,9)===0, 'the ink line is left alone');
  chk(r && at(r,14,20)===0 && at(r,12,30)===0, 'cream INSIDE the ink is left alone (moa legs, the kererū breast)');
  chk(r && at(r,26,20)===0, 'the body is left alone');
  // A gap in the ink: the leak through it is capped by the depth limit, so the body stays clear.
  paint(true);
  r=FO.extract(px,W,H,8);
  chk(r && at(r,9,20)===255, 'a gap in the ink is followed a little way…');
  chk(r && at(r,14,30)===0 && at(r,16,12)===0, '…but the depth cap keeps the leak off the body');

  // 2. Colour: identical to the baked border at rest with no climate lean (no quad drawn); the climate
  //    lean follows the edge band; a boost highlight takes the boost colour, a goal answer starts white.
  const base=[235,229,213], ent={ speciesKey:'little_bush_moa' }, now=1000;
  const saved={ mix:FOC.climateMix, hi:G._boostHi, r:G._edgeR, g:G._edgeG, b:G._edgeB };
  G._boostHi=null; FOC.climateMix=0;
  chk(FO.colorFor(ent,base,now)===null, 'no climate lean and no boost: no outline quad at all (the baked border shows)');
  FOC.climateMix=0.5; G._edgeR=150; G._edgeG=205; G._edgeB=236;
  const c=FO.colorFor(ent,base,now);
  chk(c && Math.abs(c[0]-192.5)<0.01 && Math.abs(c[2]-224.5)<0.01, 'the resting outline leans climateMix of the way to the edge band');
  G._boostHi={ keys:new Set(['little_bush_moa']), color:TBO.outlineInterglacial, until:now+5000, t0:now };
  chk(FO.colorFor(ent,base,now)===TBO.outlineInterglacial, 'a boost highlight recolours the border in the boost colour');
  chk(FO.colorFor({ speciesKey:'kereru' },base,now)!==TBO.outlineInterglacial, '…only for the highlighted species');
  G._boostHi={ keys:new Set(['little_bush_moa']), color:TBO.outlineInterglacial, until:now+5000, t0:now,
               from:[255,255,255], fadeMs:6000, _col:[255,255,255] };
  const w=FO.colorFor(ent,base,now);
  chk(w && w[0]===255 && w[1]===255 && w[2]===255, 'a goal answer starts the border white');
  // Fade-out: the last outlineFadeOutMs ease the highlight out instead of cutting it off.
  const fo=TBO.outlineFadeOutMs||0;
  chk(fo>0, 'the boost outline has a fade-out window (TM_BOOST.outlineFadeOutMs)');
  FOC.climateMix=0;
  G._boostHi={ keys:new Set(['little_bush_moa']), color:TBO.outlineInterglacial, until:now+fo*0.5, t0:now-20000 };
  ES.outlineStyle(G._boostHi, now);
  chk(ES._olAlpha!=null && ES._olAlpha<0.9 && ES._olAlpha>0 && ES._olFade>0 && ES._olFade<1, 'mid fade-out the plant ring alpha is eased down, not cut');
  const fm=FO.colorFor(ent,base,now), ig=TBO.outlineInterglacial;
  chk(fm && fm!==ig && fm[0]>Math.min(base[0],ig[0])-0.01 && fm[0]<Math.max(base[0],ig[0])+0.01 && fm[0]!==ig[0],
      'mid fade-out the live fauna border blends from the boost colour back to the baked one');
  ES.outlineStyle(G._boostHi, now+fo*0.5);
  chk(ES._olAlpha===0 && ES._olFade===0, 'the fade-out reaches zero exactly at the boost end');
  FOC.climateMix=saved.mix; G._boostHi=saved.hi; G._edgeR=saved.r; G._edgeG=saved.g; G._edgeB=saved.b;

  // 3. The atlas packs each mask beside its sprite: the pairs are collected FIRST, sprite then mask, and
  //    the stable height sort keeps them together (one page, no texture switch). The tūī is packed now.
  const fake={ sprite:{ width:8, height:8 }, mask:{ width:4, height:4, __nativeW:8, __nativeH:8 }, base };
  const savedPairs=FO._pairs; FO._pairs=[fake];
  const order=[]; SA._collectRoots((holder,key)=>order.push(holder[key]));
  FO._pairs=savedPairs;
  chk(order[0]===fake.sprite && order[1]===fake.mask, 'the atlas collects each outline pair first, sprite then mask');
  const tu=ES.tui && ES.tui.flying && ES.tui.flying[0];
  chk(!tu || SA.isFrame(tu), 'the tūī frames are packed into the atlas (they were missed, a GL texture switch per bird)');

  // 4. No GL here: draw() is a no-op and covers() is false, so the 2D fallback shows the baked border
  //    and keeps the boost ring.
  chk(FO.covers({})===false, 'without GL nothing is covered (the 2D fallback keeps the baked border + boost ring)');
  console.log(fail? `fauna outline: ${fail} FAILURES`
    : 'fauna outline: the border mask takes the sticker and spares the ink + body, colours follow climate/boost/goal, masks pack beside their sprites');
}catch(e){ console.log('OUTLINE FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }

// ---- glbatch: refuse a SOFTWARE WebGL renderer (kiosk GPU guard) -----------
// The batch only wins on a real GPU. On Chrome's software rasterizer (SwiftShader)
// getContext SUCCEEDS but every quad is CPU-shaded — slower than the 2D path, and with
// no context-lost event the _fallbackTo2D safety net never fires. init() must read the
// unmasked renderer string and stay on 2D. Real GL isn't available in the harness, so
// drive the pure helper directly and then init() with a fabricated software context.
{
  const GB = vm.runInContext('GLBatch', ctx);
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };

  // A gl-like stub whose reported renderer is `name` (both the debug-ext and the plain
  // RENDERER path resolve to it).
  const glWith = (name) => ({
    getExtension: (n) => n === 'WEBGL_debug_renderer_info' ? { UNMASKED_RENDERER_WEBGL: 0x9246 } : null,
    getParameter: () => name, RENDERER: 0x1F01
  });

  // Helper is pure: a GPU string passes; the CPU rasterizers are all caught; an
  // unreadable string is NOT rejected (never blind-fail a browser that hides its name).
  chk(GB._isSoftwareRenderer(glWith('ANGLE (NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)')) === false,
      'a hardware GPU renderer must NOT be flagged software');
  for (const soft of ['ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0)))',
                      'llvmpipe (LLVM 12.0.0, 256 bits)', 'Microsoft Basic Render Driver']) {
    chk(GB._isSoftwareRenderer(glWith(soft)) === true, 'must flag software renderer: ' + soft);
  }
  chk(GB._isSoftwareRenderer(glWith('')) === false, 'an unreadable renderer string must NOT be rejected');

  // Full init() path: createElement hands back a canvas whose context reports SwiftShader.
  const origCreate = ctx.document.createElement;
  const save = { enabled: GB.enabled, domStack: GB.domStack, requested: GB.requested };
  GB.enabled = false; GB.domStack = false; GB.requested = true;
  ctx.document.createElement = (t) => t === 'canvas'
    ? { style: {}, width: 0, height: 0, addEventListener() {},
        getContext: () => glWith('ANGLE (Google, SwiftShader Device (Subzero) (0x0000C0DE))') }
    : origCreate(t);
  const ok = GB.init(256, 256);
  chk(ok === false, 'init() must return false on a software renderer');
  chk(GB.enabled === false, 'GL must stay disabled after refusing a software renderer');
  ctx.document.createElement = origCreate;
  GB.enabled = save.enabled; GB.domStack = save.domStack; GB.requested = save.requested;

  // Coordinate decoupling (fix #1: HUD off the 4K canvas). The clip-mapping space
  // (coordW/coordH = the MAIN canvas backing) must be tracked separately from this
  // layer's raster size (W/H = the GL backing): in GL mode the main canvas is the 1080
  // HUD layer while the GL layer stays 4K. If _emit divided by W/H instead of coordW/H
  // the whole cast would render half-size in a corner — so guard _syncCoord directly.
  {
    const sv = { W: GB.W, H: GB.H, coordW: GB.coordW, coordH: GB.coordH, el: GB._mainEl };
    GB.W = 3840; GB.H = 2160; GB._mainEl = { width: 1920, height: 1080 };
    GB._syncCoord();
    chk(GB.coordW === 1920 && GB.coordH === 1080, '_syncCoord reads the coord space from the MAIN backing');
    chk(GB.W === 3840 && GB.H === 2160, 'the GL raster size (W/H) is untouched by _syncCoord');
    GB._mainEl = null; GB._syncCoord();
    chk(GB.coordW === GB.W && GB.coordH === GB.H, 'coord falls back to W/H with no main element (harness/lone-init)');
    GB.W = sv.W; GB.H = sv.H; GB.coordW = sv.coordW; GB.coordH = sv.coordH; GB._mainEl = sv.el;
  }

  console.log(fail ? `glbatch guard: ${fail} FAILURES`
    : 'glbatch guard: software WebGL refused; coord space decoupled from GL raster size');
}

// ---- HUD layer: main canvas drops to 1080 in GL mode, supersampled in 2D (fix #1) -----
// The single biggest resting-frame win: in DOM-stack GL mode the sprite cast is on the GL
// layer, so the main p5 canvas carries only the HUD and drops to logical 1080 — Chrome then
// composites a 1080 surface each frame, not a 4K one. In the 2D path the main canvas still
// carries the sprites, so it must stay at the sprite supersample. mainCanvasSS() is the one
// switch that decides this; assert both arms.
{
  const GB = vm.runInContext('GLBatch', ctx);
  const mcss = vm.runInContext('mainCanvasSS', ctx);
  const sss = vm.runInContext('spriteSS', ctx);
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };
  const svd = GB.domStack;
  GB.domStack = true;  chk(mcss() === 1, 'GL mode: the main canvas drops to logical (mainCanvasSS === 1)');
  GB.domStack = false; chk(mcss() === sss(), '2D path: the main canvas keeps the sprite supersample');
  GB.domStack = svd;
  console.log(fail ? `hud layer: ${fail} FAILURES`
    : 'hud layer: main canvas 1080 in GL mode, supersampled in the 2D path');
}

// ---- ash cover: one 1080p frame sequence, warmed in lazily + played at cloudFps ----------
// The eruption cover is now a single hand-drawn animation (VolcanicAsh_Cloud_00000..00041,
// 42 frames at 1920x1080). They warm in ONE AT A TIME after setup so the boot path never
// decodes all 42 in one frame; renderAshCloud steps them at TM_TIME.cloudFps across the
// cloudMillis window. Guard the (now safety-only) downsampler, the warm-up state machine, and
// the frame-index math. (renderAshCloud is also exercised by the eruption-button draw frames
// above; a throw there would show as console.error.)
{
  const HUD = vm.runInContext('InstallHUD', ctx);
  const TM = vm.runInContext('TM_TIME', ctx);
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };

  // cloudMillis must stay = ASH_CLOUD_FRAMES / cloudFps · 1000 so `now → _ashCloudUntil` maps to
  // frame 0 → last at exactly cloudFps.
  chk(TM.cloudMillis === Math.round(HUD.ASH_CLOUD_FRAMES / TM.cloudFps * 1000),
      `cloudMillis (${TM.cloudMillis}) = ${HUD.ASH_CLOUD_FRAMES} frames / ${TM.cloudFps} fps`);

  // _shrinkImage is now a safety guard: over-large art resamples to <= maxDim; native 1080p (and
  // anything already within the cap) is used directly, untouched.
  const big = HUD._shrinkImage({ width: 4525, height: 3777 }, 1920);
  chk(big && Math.max(big.width, big.height) <= 1920, 'an over-large cover frame resamples to <= maxDim on its long side');
  const native = { width: 1920, height: 1080 };
  chk(HUD._shrinkImage(native, 1920) === native, 'a native 1080p frame is used directly (no resample)');

  // Warm-up state machine: it must start exactly ONE load (not all 42 raws at once), then reach
  // ready with every frame present.
  HUD._ash = null; HUD._ashWarm = null;
  HUD._ashWarmupTick();
  chk(HUD._ashWarm && HUD._ashWarm.loading && HUD._ashWarm.queue.length === HUD.ASH_CLOUD_FRAMES - 1,
      `the warm-up starts exactly one load with ${HUD.ASH_CLOUD_FRAMES - 1} still queued (bounded memory)`);
  let guard = 0;
  while (!(HUD._ash && HUD._ash.ready) && guard++ < 400) HUD._ashWarmupTick();
  chk(HUD._ash && HUD._ash.ready, 'the ash warm-up reaches ready');
  chk(HUD._ash && HUD._ash.frames.filter(f => f).length === HUD.ASH_CLOUD_FRAMES,
      `all ${HUD.ASH_CLOUD_FRAMES} cloud frames warmed in`);

  // Frame-index math: the cover steps from frame 0 at the fire to the last frame at the window
  // end. Drive renderAshCloud through the window and capture which frame it blits (image() arg).
  const gg = { _ashCloudUntil: 0 };
  let drawn = -1; const oldImage = ctx.image;
  ctx.image = (im) => { if (HUD._ash && HUD._ash.frames.indexOf(im) >= 0) drawn = HUD._ash.frames.indexOf(im); };
  const at = (fracThroughWindow) => {
    // millis() in the harness is _t; place the window so `now` sits fracThroughWindow into it.
    gg._ashCloudUntil = ctx.millis() + Math.round(TM.cloudMillis * (1 - fracThroughWindow));
    drawn = -1; HUD.renderAshCloud(gg, 1920, 1080); return drawn;
  };
  chk(at(0.0) === 0, 'at the fire the cover shows frame 0');
  chk(at(0.99) === HUD.ASH_CLOUD_FRAMES - 1, 'at the window end the cover shows the last frame');
  const mid = at(0.5);
  chk(mid > 0 && mid < HUD.ASH_CLOUD_FRAMES - 1, `mid-window shows a middle frame (${mid})`);
  gg._ashCloudUntil = ctx.millis() - 1; drawn = -1; HUD.renderAshCloud(gg, 1920, 1080);
  chk(drawn === -1, 'a closed window draws no cover');
  ctx.image = oldImage;

  console.log(fail ? `ash cover: ${fail} FAILURES`
    : 'ash cover: one 1080p sequence warms in lazily (42 frames, one load at a time), steps 0→last at cloudFps across the window');
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
// ---- svg2geo: what the editor shows is what the sim gets ------------------------
// A path rotated in the editor carries `transform` + `transform-origin`; until 2026-10-20 the
// converter dropped both, so the Ōroua reached the sim un-rotated. Converts a scratch SVG with a
// rotated path (Boxy SVG's form), a translated <g>, and an `id` that holds the letter d.
{
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };
  const os = require('os'), cp = require('child_process');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'svg2geo-'));
  try {
    const svgF = path.join(tmp, 't.svg'), outF = path.join(tmp, 't.geo.js');
    fs.writeFileSync(svgF, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <polyline class="river" points="0,50 100,50"/>
  <path id="trib-dd" data-name="rot" style="fill: none; transform-origin: 50px 50px;" d="M 10 50 L 40 50" transform="matrix(-1, 0, 0, -1, 0, 0)"/>
  <g transform="translate(5 10)"><polyline class="tributary" data-name="grp" points="20,0 20,40"/></g>
</svg>`);
    cp.execFileSync(process.execPath, [path.join(dir, 'tools', 'svg2geo.js'), svgF, outF], { stdio: 'ignore' });
    const s = fs.readFileSync(outF, 'utf8'), G2 = JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
    const rot = G2.rivers.find(r => r.name === 'rot'), grp = G2.rivers.find(r => r.name === 'grp');
    const near = (p, x, y) => p && Math.abs(p[0] - x) < 1e-3 && Math.abs(p[1] - y) < 1e-3;
    chk(rot && near(rot.pts[0], 0.9, 0.5) && near(rot.pts[rot.pts.length - 1], 0.6, 0.5), `a path rotated 180° about its transform-origin lands rotated (${rot ? JSON.stringify(rot.pts) : 'missing'})`);
    chk(grp && near(grp.pts[0], 0.25, 0.1) && near(grp.pts[grp.pts.length - 1], 0.25, 0.5), `a <g transform> moves the shapes inside it (${grp ? JSON.stringify(grp.pts) : 'missing'})`);
    chk(rot && rot.type === 'tributary', 'an id containing "d" no longer hijacks the path data, and its class still tags it');
  } catch (e) { chk(false, 'svg2geo ran: ' + e.message); }
  finally { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {} }
  console.log(fail ? `svg2geo: ${fail} FAILURES` : 'svg2geo: transforms applied (rotation about transform-origin, <g> groups), names carried, no attribute cross-talk');
}

// SVG-authored skeleton (TE_MANAWA_GEO) reshapes the base noise: ranges lift the
// land, the river incises a channel that rides the local ground (reaching sea level
// only at the coast), both scaling with yearsBP.
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

  // N/S edge falloff: eases a truncated range down to plains at the top/bottom edge
  chk(TG._nsEdgeFalloff(0.9, 0.0, 0.1) < 0.3, 'N/S edge falloff eases a high truncated range down to plains at the top edge');
  chk(TG._nsEdgeFalloff(0.9, 0.5, 0.1) === 0.9, 'N/S edge falloff leaves the mid-map untouched');
  chk(TG._nsEdgeFalloff(0.04, 1.0, 0.1) === 0.04, 'the front (bottom) edge never RAISES the carved river channel / coast');
  // TOP edge is TWO-WAY: a LOW far row is eased UP to plains so it meets the relief crop (fills the
  // empty-headroom smear gap the zoom-out opened); the front (bottom) stays one-way (down only).
  chk(TG._nsEdgeFalloff(0.04, 0.0, 0.1) > 0.2, 'the far (top) edge eases a low far row UP to plains (no smear gap)');
  chk(TG._nsEdgeFalloff(0.9, 0.0, 0.1, 0) === 0.9, 'a 0 top margin leaves the far edge as raw generated terrain');
  chk(TG._nsEdgeFalloff(0.9, 1.0, 0.1, 0) < 0.3, 'the bottom apron still eases even when the top margin is 0');
  chk(TG._nsEdgeFalloff(0.9, 0.0, 0.1, 0.1) === TG._nsEdgeFalloff(0.9, 0.0, 0.1), '3-arg (symmetric) edge falloff is unchanged (back-compat)');
  // NORTH UP-RAMP: max lift at the very top edge, smoothstepping to 0 by `frac`, 0 below the band.
  chk(Math.abs(TG._northLift(0, 0.22, 0.13) - 0.13) < 1e-9, 'north up-ramp adds the full amount at the top edge');
  chk(TG._northLift(0.22, 0.22, 0.13) === 0 && TG._northLift(0.5, 0.22, 0.13) === 0, 'north up-ramp is 0 at and below its band');
  chk(TG._northLift(0.11, 0.22, 0.13) > 0 && TG._northLift(0.11, 0.22, 0.13) < 0.13, 'north up-ramp eases smoothly through the band');
  chk(TG._northLift(0.1, 0.22, 0) === 0, 'north up-ramp off (amt 0) adds nothing');

  // COASTAL DUNE FIELD: a sand tint on the WESTERN coastal plain, thinning inland to 0 at the
  // per-phase reach, capped short of the range spine so it can NEVER bleed east across the
  // ranges onto the trans-range land. _duneIntensity(nx, ny, e, coastX, coastXS, reach, off, eLo, eHi).
  const dLOOK = vm.runInContext('LOOK', ctx);
  const dCX = 0.14, dCXS = 0.1, dOff = 0.012, dLo = 0.16, dHi = 0.42;   // present coast + LOOK dune window
  const dRIg = dLOOK.duneReachByPhase.interglacial, dRFg = dLOOK.duneReachByPhase.fullGlacial;
  const dune = (nx, e, reach, ny = 0) => TG._duneIntensity(nx, ny, e, dCX, dCXS, reach, dOff, dLo, dHi);
  chk(dLOOK.duneReachByPhase.interglacial < dLOOK.duneReachByPhase.cooling
    && dLOOK.duneReachByPhase.cooling < dLOOK.duneReachByPhase.glacial
    && dLOOK.duneReachByPhase.glacial < dLOOK.duneReachByPhase.fullGlacial,
    'dune reach grows monotonically with cold (the Koputaroa glacial surge)');
  chk(dune(0.25, 0.28, dRFg) > 0, 'dunes tint the western coastal plain just inland of the shore');
  chk(dune(0.13, 0.28, dRFg) === 0, 'no dune tint seaward of the shoreline (west of the coast)');
  chk(dune(0.60, 0.28, dRFg) === 0 && dune(0.85, 0.28, dRFg) === 0,
    'the dune field is capped short of the spine — NO tint on the east / trans-range land, even at full glacial');
  chk(dune(0.25, 0.10, dRFg) === 0 && dune(0.25, 0.50, dRFg) === 0,
    'the dune window excludes water/wet slack (low e) and the range flank / hill forest (high e)');
  chk(dune(0.32, 0.28, dRIg) === 0 && dune(0.32, 0.28, dRFg) > 0,
    'the Koputaroa surge: a mid-plain cell is bare in the interglacial but sand at full glacial');
  chk(dune(0.20, 0.28, dRFg) > dune(0.30, 0.28, dRFg),
    'the sand tint is densest at the coast and thins inland (toward the ESE)');
  chk(dune(0.25, 0.28, 0) === 0, 'dune field off (reach 0) tints nothing');

  // DUNE RELIEF: relict wind-aligned ridges ADDED to the coastal-plain elevation, at the fixed
  // GLACIAL reach, off the river channel. _duneRelief(u,v,e,coastX,coastXS,reach,off,eLo,eHi,amp,freq).
  const dAmp = dLOOK.duneRelief, dFrq = dLOOK.duneRidgeFreq;
  const dRel = (nx, e, ny = 0) => TG._duneRelief(nx, ny, e, dCX, dCXS, dRFg, dOff, dLo, dHi, dAmp, dFrq);
  chk(TG._duneRidge(0.3, 0.5, dFrq) >= 0 && TG._duneRidge(0.3, 0.5, dFrq) <= 1, 'dune ridge pattern stays in 0..1');
  chk(dRel(0.60, 0.28) === 0 && dRel(0.85, 0.28) === 0, 'dune relief adds NO ridges east of the belt (nothing on the trans-range land)');
  chk(dRel(0.25, 0.10) === 0 && dRel(0.25, 0.50) === 0, 'dune relief respects the plain elevation window (no ridges on water or the range flank)');
  chk(dRel(0.25, 0.28) <= dAmp + 1e-9, 'dune relief never exceeds the authored peak amplitude');
  let anyRelief = false; for (let k = 0; k < 12; k++) { if (dRel(0.22 + 0.006 * k, 0.28, 0.08 * k) > 0) { anyRelief = true; break; } }
  chk(anyRelief, 'dune relief raises the western coastal plain into ridges');
  chk(TG._duneRelief(0.25, 0, 0.28, dCX, dCXS, dRFg, dOff, dLo, dHi, 0, dFrq) === 0, 'dune relief off (amp 0) adds no landform');

  // FLUX → COLOUR REACH: the live sand surge extends the per-phase reach toward the glacial
  // (relict) reach — mismanagement / a storm re-mobilises the belt inland. _duneEffReach(phase, full, surge, gain).
  const dRCg = dLOOK.duneReachByPhase.glacial, dGain = dLOOK.duneSurgeGain;
  chk(TG._duneEffReach(dRIg, dRFg, 0, dGain) === dRIg, 'surge 0 leaves the authored per-phase reach untouched (default look preserved)');
  chk(TG._duneEffReach(dRIg, dRFg, 1, dGain) > dRIg, 'a high sand surge extends the colour reach inland');
  chk(TG._duneEffReach(dRIg, dRFg, 1, dGain) <= dRFg + 1e-9, 'the surged reach never outruns the glacial (relict) reach — colour stays on the relief');
  chk(TG._duneEffReach(dRIg, dRFg, 0.5, dGain) > TG._duneEffReach(dRIg, dRFg, 0.2, dGain), 'the reach grows monotonically with the surge');
  chk(TG._duneEffReach(dRIg, dRFg, -1, dGain) === dRIg && TG._duneEffReach(dRIg, dRFg, 5, dGain) <= dRFg + 1e-9, 'surge is clamped: never below the phase reach, never past the glacial reach');
  chk(TG._duneEffReach(dRFg, dRFg, 1, dGain) === dRFg, 'the full-glacial phase (already at max) does not surge further');
  chk(TG._duneEffReach(dRIg, dRFg, 1, 0) === dRIg, 'surge gain 0 disables the flux→reach coupling (per-phase reach only)');
  // The surge also BRIGHTENS the belt (bare mobile sand). _duneEffAmt(baseAmt, surge, boost).
  chk(TG._duneEffAmt(0.5, 0, 0.6) === 0.5, 'surge 0 leaves the authored sand blend amount unchanged (default look)');
  chk(TG._duneEffAmt(0.5, 0.8, 0.6) > 0.5, 'a high surge brightens the sand blend (mobile bare sand)');
  chk(TG._duneEffAmt(0.9, 1, 0.6) <= 1, 'the brightened blend is capped at a full sand blend');
  // BLOW-OUTS (§10B(2)): a sparse deflation-hollow mask across the belt — mostly 0, occasional bowls.
  const bf = dLOOK.duneBlowoutFreq;
  let boMax = 0, boZero = 0, boHit = 0, boN = 0;
  for (let uu = 0.15; uu < 0.5; uu += 0.017) for (let vv = 0.1; vv < 0.9; vv += 0.037) {
    const bo = TG._duneBlowout(uu, vv, bf); boN++;
    if (bo < 0 || bo > 1) boMax = 99;                 // out of range → force a fail below
    if (bo > boMax && boMax < 90) boMax = bo;
    if (bo === 0) boZero++; else boHit++;
  }
  chk(boMax >= 0 && boMax <= 1, 'the blow-out mask stays in 0..1');
  chk(boHit > 0 && boZero > boHit, 'blow-outs are SPARSE — some bowls open, but most of the belt is un-deflated');


  // deep-time factors: keyed to ABSOLUTE dates (not window progress), so a given yearsBP
  // always maps to the same geological state — jump the clock or resize the window freely.
  const at = yr => TG.geoTimeFactors(yr);
  // ~1 Ma (Trewick & Bland 2012; md/TEMANAWA_NATURAL_HISTORY.md §I): the Manawatū Strait across the
  // axis had closed by ~1.6 Ma, the axis is a LOW EMERGENT FINGER of basement about to rise fast, the
  // river has just turned west, and the basin (deepest off Levin–Foxton) emerges north-first.
  const E0 = TG.GEO_EPOCHS;
  chk(Math.abs(at(1000000).uplift - E0.upliftStart) < 1e-9 && E0.upliftStart > 0.05,
      `at ~1 Ma the ranges are low basement hills, not a flat plain (uplift ${at(1000000).uplift})`);
  chk(at(25500).uplift > 0.98, 'by ~25 ka the ranges are mature (uplift ~1)');
  let leads = true; for (let y = 1000000; y >= 25000; y -= 25000) if (at(y).incision < at(y).uplift - 1e-9) leads = false;
  chk(leads, 'incision leads uplift across the whole window — the river outpaces the ranges');
  chk(at(1500000).uplift === at(1000000).uplift, 'before the onset date uplift holds at its head start');
  chk(at(1000000).emergence < 0.02, 'at ~1 Ma the river has barely emerged (strait, not yet a river)');
  chk(at(500000).emergence > 0.98, 'the river is fully connected by its dated completion (~500 ka)');
  chk(at(100000).emergence > 0.98 && at(100000).uplift > 0.7, 'a near-present date reads near-modern regardless of the window');
  // The river turned WEST c. 1 Ma: the flow is already seaward at the opening, the old east-flowing
  // arm dried by ~0.6 Ma.
  chk(at(1000000).mainArm > 0, 'the main stem already flows seaward (west) at the ~1 Ma opening');
  chk(at(600000).mainArm > 0.99, 'the old east-flowing NE arm is abandoned by ~0.6 Ma');

  // SOUTH-HALF STRAIT: one-way — the south opens as sea (the basin depocentre off Levin–Foxton) and
  // drains by ~0.5 Ma, emerging east-first. No later re-flooding pulse.
  chk(at(1000000).southSink > 0.98, 'at the ~1 Ma opening the south half is sea');
  chk(at(500000).southSink < 0.02, 'the south half has drained to land by ~0.5 Ma');
  chk(at(100000).southSink < 0.02, 'no southern strait near the present');
  let mono = true; for (let y = 1000000; y > 500000; y -= 25000) if (at(y - 25000).southSink > at(y).southSink + 1e-9) mono = false;
  chk(mono, 'the south drains one way — it never re-floods on the way to the present');

  // GORGE PINCH: the wide early water never crosses the axis — an estuary arm west of the gap, the
  // fault-ponded lake east of it, river-width in the gap itself.
  const gU = (vm.runInContext('LOOK', ctx) || {}).straitGorgeU;
  chk(TG._straitWide(gU, 1, 0, 0.08) === 0, 'at full strait the main stem is river-width in the range gap');
  chk(TG._straitWide(0.30, 1, 0, 0.08) > 0.99, 'west of the gap the early water is wide (the estuary arm)');
  chk(TG._straitWide(0.65, 1, 0, 0.08, 1) > 0.99, 'east of the gap the water is wide at the lake peak (the ponded lake)');
  chk(TG._straitWide(0.65, 1, 0, 0.08, 0) === 0, 'the strait factor never widens the east of the gap — the lake has its own clock');
  chk(TG._straitWide(0.90, 1, 0, 0.08, 1) === 0, 'the lake is confined near the gap; the far east stays land (T&B Fig. 4D)');
  chk(TG._mainWidthMult(0.65, 1, 0, 0.08, 1) > 2 && TG._mainWidthMult(0.65, 0, 0, 0.08, 0) === 1, 'the main widens into the lake at its peak and is plain river once it has drained');
  // WOODVILLE LAKE: ponds from ~1 Ma (uplift on the Wellington Fault), drains west through the gorge.
  chk(at(1000000).lake > 0 && at(900000).lake > 0.98, 'the Woodville lake ponds from ~1 Ma and is full by ~0.9 Ma');
  chk(at(600000).lake < 0.01 && at(100000).lake === 0, 'the lake has drained by ~0.6 Ma and never returns');
  // TRIBUTARY FANS: open at 1 Ma, one channel by the present.
  chk(at(1000000).tribSpread > 0.99 && at(300000).tribSpread < 0.01 && at(650000).tribSpread > 0 && at(650000).tribSpread < 1,
      'the tributary fans are open at 1 Ma, drawing together mid-window and closed by ~0.3 Ma');
  chk(at(1000000).mainArm > 0.99, 'the old east-flowing NE arm is already abandoned at the 1 Ma opening');
  // RANGE PROTECTION helper (applied to the SW strait + patch; the south strait has its own)
  chk(TG._rangeProtect(0.5, 1, 1) === 0 && TG._rangeProtect(0.5, 0, 1) === 0.5 && Math.abs(TG._rangeProtect(0.5, 0.5, 1) - 0.25) < 1e-12,
      'range protection scales a marine term by (1 − k·rMask), floored at 0');
  // _southStrength: a south-ward latitude ramp (0 north of `lat` → 1 by `lat`+`feather`) × the pulse
  chk(TG._southStrength(0.2, 1, 0.45, 0.22) === 0, 'south-sink strength is 0 north of the shore latitude');
  chk(TG._southStrength(0.9, 1, 0.45, 0.22) > 0.98, 'south-sink strength is full in the deep south at peak');
  chk(TG._southStrength(0.9, 0, 0.45, 0.22) === 0, 'south-sink strength is 0 when the pulse is 0 (no strait)');
  // _patchStrength: an elliptical mask (full in the core, tapering over `feather`) × the submergence
  chk(TG._patchStrength(0.58, 0.72, 1, 0.58, 0.72, 0.17, 0.15, 0.45) > 0.98, 'patch strength is full at the patch centre while submerged');
  chk(TG._patchStrength(0.9, 0.2, 1, 0.58, 0.72, 0.17, 0.15, 0.45) === 0, 'patch strength is 0 well outside the ellipse');
  chk(TG._patchStrength(0.58, 0.72, 0, 0.58, 0.72, 0.17, 0.15, 0.45) === 0, 'patch strength is 0 once emerged (submergence 0)');
  chk(TG._patchStrength(0.58, 0.72, 1, 0.58, 0.72, 0, 0.15, 0.45) === 0, 'patch strength is 0 when disabled (radius 0)');
  // directional EAST feather: a wide eastern taper reaches a point the symmetric feather can't, while the
  // matching WEST point stays dry (the bias is east-only) — so the coast eases down over a longer eastern grade
  chk(TG._patchStrength(0.852, 0.72, 1, 0.58, 0.72, 0.17, 0.15, 0.45, 1.4) > 0, 'patch east feather reaches uphill land the symmetric feather would not');
  chk(TG._patchStrength(0.852, 0.72, 1, 0.58, 0.72, 0.17, 0.15, 0.45) === 0, 'without an east feather that same eastern point is dry (symmetric fallback)');
  chk(TG._patchStrength(0.308, 0.72, 1, 0.58, 0.72, 0.17, 0.15, 0.45, 1.4) === 0, 'the east feather does not widen the western side');

  // integration: at mature factors, a range core lifts to alpine + a river cell carves to water
  if (GEO && G.terrain._baseNoise) {
    const T = G.terrain, savedT = T._geoT;
    // These shape / river / southSink checks probe the skeleton at its RAW authored coords, so run
    // them with the view zoom-out OFF (native scale) — otherwise the inset (_prepGeo, driven by
    // _viewF) would move the geo out from under the probes. Restored at the block end.
    const savedVF = T._viewF; T._viewF = 1;
    T._geoT = { uplift: 1, incision: 1, emergence: 1 }; T._prepGeo();
    const poly = GEO.ranges && GEO.ranges[0] && GEO.ranges[0].poly;
    const river = GEO.rivers && GEO.rivers[0] && GEO.rivers[0].pts;
    // The live _applyGeo path reads noise() per call, and the harness noise is Math.random, so one
    // probe of a range cell is a dice roll (~1 run in 10 fell under 0.35 on ridge noise alone; real
    // noise gives 0.56). Probe it 9 times and judge the median.
    const med9 = (f) => { const v = []; for (let k = 0; k < 9; k++) v.push(f()); v.sort((a, b) => a - b); return v[4]; };
    if (poly) {
      let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; } cx /= poly.length; cy /= poly.length;
      // The range relief is a ridged fBm, and the harness noise is white (Math.random per call), whose
      // ridged sum averages far below smooth noise's. Pin noise flat for this probe so it tests the
      // lift itself, not the stub.
      const nz = ctx.noise; ctx.noise = () => 0.5;
      const lifted = med9(() => T._applyGeo(0.2, cx, cy, cx * T.mapWidth, cy * T.mapHeight));
      ctx.noise = nz;
      chk(lifted > 0.35, `a range lifts the land well above the plains (got ${lifted.toFixed(2)})`);
    }
    // Range spine: the crest concentrates on the range's long (PCA) axis; flanks fall to foothills.
    const rr = T._geoRanges && T._geoRanges[0];
    if (rr && rr.halfW) {
      const offU = rr.cx + rr.perpX * rr.halfW * 0.9, offV = rr.cy + rr.perpY * rr.halfW * 0.9;
      chk(Math.abs(TG._spineHeight(rr, rr.cx, rr.cy, 0.45) - 1) < 1e-9, 'range spine: full crest height on the axis');
      chk(TG._spineHeight(rr, offU, offV, 0.45) < 0.75, 'range spine: the flank crest drops toward foothills');
      chk(TG._spineHeight(rr, offU, offV, 0) === 1, 'range spine: spine 0 = flat plateau (back-compat)');
    }
    if (river) {
      // A river over the PLAINS incises below the local ground but does NOT ditch to sea
      // level — that uniform trench was the bug (entities plunged crossing it). Given
      // plains-height ground (0.4) the bed sits ~incise below it, well above the sea band.
      const mid = river[(river.length / 2) | 0];
      const carvedMid = T._applyGeo(0.4, mid[0], mid[1], mid[0] * T.mapWidth, mid[1] * T.mapHeight);
      chk(carvedMid < 0.4 && carvedMid > 0.2,
        `a plains river cell incises below local ground but not to sea level (got ${carvedMid.toFixed(2)})`);
      // The SAME river, where the land is already low (the coast), DOES reach the sea band.
      const mouth = river[0];
      const carvedMouth = T._applyGeo(0.08, mouth[0], mouth[1], mouth[0] * T.mapWidth, mouth[1] * T.mapHeight);
      chk(carvedMouth < 0.1, `near the coast the river bed reaches the sea band (got ${carvedMouth.toFixed(2)})`);
    }
    // Antecedence: the MAIN stem is authored once and carved throughout the window (TEMANAWA_PLAN_V3
    // §0). The TRIBUTARIES are there throughout too — the east-side catchment's flow is what cut the
    // gorge (Trewick & Bland 2012) — but as a FAN of thin hill streams at 1 Ma that draws together
    // into one channel as the ranges steepen (t.tribSpread 1 → 0, LOOK.tribFan*). Until 2026-10-19
    // they were absent until 0.4 Ma and grew headward; these checks replaced that.
    if (river) {
      // Antecedent main: its seaward mouth (already-low ground) carries water at any fan state.
      T._geoT.tribSpread = 1;
      const mouth = river[0];
      const wetMouth = T._applyGeo(0.08, mouth[0], mouth[1], mouth[0] * T.mapWidth, mouth[1] * T.mapHeight);
      chk(wetMouth < 0.12, `the antecedent main stem carves its seaward reach throughout (got ${wetMouth.toFixed(2)})`);

      // The stream geometry, pure: on the trunk line the trunk is water at any spread; a cell on a
      // hill stream's line is water while the fan is open and dry once it has closed; and the fan
      // closes downstream — near the confluence that stream has drawn in to the trunk.
      const tr0 = T._geoTribs && T._geoTribs[0], th = tr0 && tr0.threads;
      chk(th && th.length === Math.round(vm.runInContext('LOOK', ctx).tribFanStreams), 'each tributary carries LOOK.tribFanStreams streams, the trunk first');
      if (th && th.length > 1) {
        const sp = vm.runInContext('LOOK', ctx).tribFanSpread, k = 1, pMid = th[k].p0 + 0.1;
        const tp = Math.max(0, Math.min(1, (th[k].pc - pMid) / vm.runInContext('LOOK', ctx).tribFanTaper)), tpS = tp * tp * (3 - 2 * tp);
        const q = pMid * 64, q0 = q | 0, mz = th[k].mz[q0] + (th[k].mz[Math.min(64, q0 + 1)] - th[k].mz[q0]) * (q - q0);
        const sOn = (th[k].off * sp + mz * vm.runInContext('LOOK', ctx).tribFanMeander * sp) * tpS;   // stream k's line at full spread
        chk(TG._tribThreads(0, 0.5, th, 1, 0.01, 0.005, 0) > 0.99 && TG._tribThreads(0, 0.5, th, 0, 0.01, 0.005, 0) > 0.99,
            'the trunk is water on its line whether the fan is open or closed');
        chk(TG._tribThreads(sOn, pMid, th, 1, 0.01, 0.005, 0, 0.01) > 0.99, `a hill stream is water on its own line while the fan is open (s ${sOn.toFixed(3)})`);
        chk(TG._tribThreads(sOn, pMid, th, 0, 0.01, 0.005, 0) === 0, 'that line is dry once the fan has closed into one channel');
        chk(TG._tribThreads(th[k].off * sp, Math.min(1, th[k].pc + 0.01), th, 1, 0.01, 0.005, 0) === 0,
            'below its merge point a hill stream has drawn in to the trunk (no stray parallel channel to the main)');
        chk(TG._tribThreads(sOn, th[k].p0 - 0.02, th, 1, 0.01, 0.005, 0) === 0, 'a hill stream starts below the trunk source, not at the top edge');
      }
      const w2 = TG._tribWidths(0.016, 0, [0, 0]), w2b = TG._tribWidths(0.016, 1, [0, 0]);
      chk(w2[0] < w2b[0] && Math.abs(w2b[0] - 0.016) < 1e-9 && w2[1] === w2b[1],
          'a trunk is a thin stream at 1 Ma and grows to its full width as the fan closes; the hill streams stay thin');

      // Live carve: a tributary trunk cell over plains carves at 1 Ma (fan open) AND at the present
      // (fan closed) — nothing waits for 0.4 Ma. Self-calibrating over the authored vertices.
      const tribs = T.getRivers().filter(r => r.type === 'tributary');
      let probed = false, early = 0, late = 0;
      for (const tr of tribs) {
        for (let k = 1; k < tr.pts.length - 1 && !probed; k++) {
          const p = tr.pts[k], wx = p[0] * T.mapWidth, wy = p[1] * T.mapHeight;
          T._geoT.tribSpread = 1; const a = T._applyGeo(0.4, p[0], p[1], wx, wy);
          T._geoT.tribSpread = 0; const b = T._applyGeo(0.4, p[0], p[1], wx, wy);
          if (b < 0.38) { probed = true; early = a; late = b; }
        }
        if (probed) break;
      }
      chk(probed && early < 0.4, `a tributary trunk carves at 1 Ma as well as at the present (1 Ma ${early.toFixed(2)}, present ${late.toFixed(2)})`);
      T._geoT.tribSpread = 0; T._geoT.emergence = 1;
    }
    // SOUTH-HALF STRAIT: at its ~0.5 Ma peak the southern lowlands drown to the sea band, but the
    // Tararua range footprint (GEO.ranges[0], the southern range) stays a dry peninsula — the land
    // bridge — even before it has uplifted; and the lowland returns to normal once the strait drains.
    // EAST→WEST FILL (LOOK.southSinkEastU): the strait fades toward the east, so the deep-SE lowland
    // stays land (it fills from the east as the coast expands) while the WESTERN south still drowns.
    if (poly) {
      const su = 0.10, sv = 0.85;   // a deep-SW lowland cell (west of the east-fade AND west of the range peninsula), which still drowns
      const seu = 0.85;             // a deep-SE lowland cell — east of the fade, so it stays land
      T._geoT = { uplift: 0, incision: 1, emergence: 1, southSink: 1 }; T._prepGeo();
      let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; } cx /= poly.length; cy /= poly.length;
      const peninsula = T._applyGeo(0.3, cx, cy, cx * T.mapWidth, cy * T.mapHeight);
      chk(peninsula > 0.2, `the Tararua footprint stays a dry peninsula at the strait peak (got ${peninsula.toFixed(2)})`);
      const drownedOn = T._applyGeo(0.35, su, sv, su * T.mapWidth, sv * T.mapHeight);
      const eastLand = T._applyGeo(0.35, seu, sv, seu * T.mapWidth, sv * T.mapHeight);
      chk(eastLand > 0.2, `the deep-SE lowland stays land at the strait peak — the east→west fill (got ${eastLand.toFixed(2)})`);
      T._geoT = { uplift: 1, incision: 1, emergence: 1, southSink: 0 }; T._prepGeo();
      const returned = T._applyGeo(0.35, su, sv, su * T.mapWidth, sv * T.mapHeight);
      chk(returned > 0.2, `the southern lowland returns to normal land after the strait drains (got ${returned.toFixed(2)})`);
      // Assert the DROP rather than an absolute band: the west-south margin cell is seed/meander-
      // sensitive, but southSink must still submerge it markedly relative to its drained self.
      chk(drownedOn < returned - 0.15, `the western southern lowland drowns markedly at the strait peak (on ${drownedOn.toFixed(2)} vs drained ${returned.toFixed(2)})`);
    }
    // RANGE PROTECTION at the ~1 Ma flood: under the full SW strait + submergence + south sink the
    // Tararua (GEO.ranges[0]) stands as land — the axis is a low emergent finger, the sea laps it.
    // Without LOOK.seaRangeProtect the SW strait drowned it: "the sea where the ranges later form",
    // which is the ~2.4 Ma Manawatū Strait, not 1 Ma (md/TEMANAWA_NATURAL_HISTORY.md §I).
    if (poly && T._geoRanges && T._geoRanges[0]) {
      const L = vm.runInContext('LOOK', ctx), kP = L.seaRangeProtect, r0 = T._geoRanges[0];
      T._geoT = { uplift: TG.GEO_EPOCHS.upliftStart, incision: 0.2, emergence: 1, submergence: 1, southSink: 1 }; T._prepGeo();
      const probe = () => med9(() => T._applyGeo(0.30, r0.cx, r0.cy, r0.cx * T.mapWidth, r0.cy * T.mapHeight));   // median: see med9
      // The central patch is OFF by default since 2026-10-19 (the east was land at 1 Ma), so switch
      // its old setting back on for the probe: the protection must still hold if it is re-enabled.
      const pRX = L.patchSubRX; L.patchSubRX = 0.17;
      const pSW = L.seaSWReach; L.seaSWReach = 1.60;   // the SW strait is retired too (relative sea level floods the west now)
      L.seaRangeProtect = 1; const kept = probe();
      L.seaRangeProtect = 0; const drowned = probe();
      L.seaRangeProtect = kP; L.patchSubRX = pRX; L.seaSWReach = pSW;
      chk(kP >= 0.9, `the ranges are protected from the SW strait and patch by default (LOOK.seaRangeProtect ${kP})`);
      chk(kept > 0.2, `at the ~1 Ma flood the Tararua stands as land (got ${kept.toFixed(2)})`);
      chk(kept > drowned + 0.1, `range protection is what keeps it dry (protected ${kept.toFixed(2)} vs unprotected ${drowned.toFixed(2)})`);
    }
    T._viewF = savedVF; T._geoT = savedT; T._prepGeo();
  }

  // VIEW ZOOM-OUT (config.viewAreaGain): the generated world scales DOWN so a wider window fits
  // the same grid (more terrain area on screen), the camera untouched. Assert the skeleton insets
  // toward centre (shrinks, is NOT stretched to refill), spread shrinks with it, and the coord
  // remap never hands getElevation a NaN at the corners (the getIslandFalloff edge clamp).
  if (GEO && G.terrain && G.terrain.geo) {
    const T = G.terrain, savedVF = T._viewF;
    const raw = GEO.ranges && GEO.ranges[0] && GEO.ranges[0].poly;
    if (raw) {
      let rcx = 0, rcy = 0; for (const p of raw) { rcx += p[0]; rcy += p[1]; } rcx /= raw.length; rcy /= raw.length;
      T._viewF = 1; T._prepGeo();
      const off = T._geoRanges[0];
      chk(Math.abs(off.cx - rcx) < 1e-6 && Math.abs(off.cy - rcy) < 1e-6, 'view zoom-out off (f=1): skeleton stays at its authored position');
      const offSpread = off.spread;
      T._viewF = 1.2; T._prepGeo();                       // an arbitrary zoom-out factor
      const on = T._geoRanges[0];
      chk(Math.abs(on.cx - 0.5) < Math.abs(off.cx - 0.5) && Math.abs(on.cy - 0.5) < Math.abs(off.cy - 0.5),
          'view zoom-out: the range insets toward centre (shrinks, not stretched to refill)');
      chk(on.spread < offSpread - 1e-9, 'view zoom-out: range spread shrinks with the factor');
    }
    T._viewF = Math.sqrt(1.6);                            // push corners well past the map edge
    let bad = 0;
    const corners = [[0, 0], [T.mapWidth - 1, 0], [0, T.mapHeight - 1], [T.mapWidth - 1, T.mapHeight - 1]];
    for (const c of corners) { const e = T.getElevation(c[0], c[1]); if (!(e >= 0 && e <= 1)) bad++; }
    chk(bad === 0, 'view zoom-out: getElevation stays finite in [0,1] at the map corners (edge clamp holds)');
    T._viewF = savedVF; T._prepGeo();                     // back to the production skeleton
  }

  // morph driver gating (pure) + morphTo re-shapes the land with deep time (geo cache)
  chk(TG.shouldMorphBake(100000, 120000, 5000, 0, 9000, 1000) === true, 'morph fires once yearsBP drifts past the interval and the throttle elapsed');
  chk(TG.shouldMorphBake(119000, 120000, 5000, 0, 9000, 1000) === false, 'morph waits until yearsBP drifts far enough');
  chk(TG.shouldMorphBake(100000, 120000, 500, 0, 9000, 1000) === false, 'morph respects the real-time throttle');
  chk(Math.abs(TG._combineGeo(0.3, 0, 0, 0, 0, 0, 0, 1, 1, 0.45, 0.06, 0.04, 0.5, 1) - 0.3) < 1e-9, 'combineGeo with no feature leaves the base untouched');
  // GLACIAL EUSTATIC SEA: a SIGNED coastal shift from the glacial index (the fast ripple, composed
  // onto the tectonic emergence). Colder EXPOSES land (coast seaward); warmer FLOODS (coast inland).
  chk(TG.glacialSeaShift(140000) > TG.glacialSeaShift(122000), 'the glacial sea shift is larger (more exposure) in a glacial than an interglacial');
  chk(TG.glacialSeaShift(140000) > 0, 'a glacial LOWSTAND raises the coastal shelf — exposes land, the coast marches seaward');
  // RELATIVE SEA LEVEL over the WHOLE window (2026-10-19): eustatic + a land offset that is the
  // plain's uplift near the present and saturates further back (sediment kept the basin's surface at
  // sea level). So every cycle sweeps the shore across the plain: highstands reach the range foot,
  // lowstands bare the plain — the early ones too (T&B Fig. 4D's pale band; Rees et al. 2019's lowstand
  // braid plains), and the later lowstands bare more. Two earlier versions failed this.
  {
    const U = TG.landOffsetM, R = TG.relativeSeaLevel;
    let upMono = true; for (let y = 0; y < 1000000; y += 20000) if (U(y + 20000) < U(y) - 1e-9) upMono = false;
    chk(U(0) === 0 && upMono, 'the land offset is 0 today and grows with age');
    chk(U(1000000) < 100 && U(1000000) - U(500000) < 10, `the offset saturates (${U(500000).toFixed(0)} m at 500 ka, ${U(1000000).toFixed(0)} m at 1 Ma): the early plain sat near sea level`);
    const earlyLows = [880000, 800000, 740000], earlyHighs = [918000, 834000, 786000];
    chk(earlyLows.every(y => R(y) <= 0), `the early glacials bare the plain — the sea falls to or below today's (${earlyLows.map(y => R(y).toFixed(0)).join(', ')} m)`);
    chk(earlyHighs.every(y => R(y) >= 35), `the early interglacials flood it to the range foot (${earlyHighs.map(y => R(y).toFixed(0)).join(', ')} m)`);
    chk(R(122000) >= 35, `MIS 5e still reaches the Tokomaru bench (${R(122000).toFixed(0)} m)`);
    chk(R(650000) > R(450000) && R(450000) > R(140000) && R(140000) > R(25500), `the glacial maxima bare more as the run plays: MIS 16, 12, 6, LGM (${[650000, 450000, 140000, 25500].map(y => R(y).toFixed(0)).join(', ')} m)`);
    chk(R(25500) < -100, `the LGM is still a deep lowstand (${R(25500).toFixed(0)} m)`);
    // _seaShift: a highstand floods by CONTOUR and flattens what it drowns; a lowstand lifts the shelf.
    const S = TG._seaShift;
    let mono = true; for (let e = 0; e < 1; e += 0.005) if (S(e + 0.005, -0.15, 0.3) < S(e, -0.15, 0.3) - 1e-9) mono = false;
    chk(mono, 'the highstand shift keeps the ground in order (monotonic in elevation)');
    chk(S(0.20, -0.15, 0.3) < 0.10 && S(0.24, -0.15, 0.3) < 0.10, 'a highstand drowns everything below its contour, not just the lowest strip');
    chk(S(0.20, -0.15, 0.3) - S(0.05, -0.15, 0.3) < 0.07, 'drowned ground is flattened to a shallow floor (no ghost relief under the water)');
    chk(S(0.60, -0.15, 0.3) === 0.60, 'ground well above the contour is untouched (the ranges never flood)');
    chk(S(0.20, -0.15, 0.3) < 0.10 && S(0.20, -0.05, 0.3) >= 0.10, 'a higher sea floods ground a lower one leaves dry');
    chk(S(0.15, 0.05, 0.3) > 0.15 && S(0.5, 0.05, 0.3) === 0.5, 'a lowstand lifts the low shelf and leaves the ranges alone');
  }
  const cg = (e, gs) => TG._combineGeo(e, 0,0,0,0, 0,0, 1,1, 0.45,0.06,0.04, 0.5, 1, 0, 1, 2.6, 0.25, 0, 0, 0.04, 0, 1, 0, gs, 0.30);
  chk(cg(0.15, 0.08) > 0.15, 'a glacial lowstand (+shift) lifts a low coastal cell toward land');
  chk(cg(0.15, -0.08) < 0.15, 'an interglacial highstand (−shift) sinks a low coastal cell toward sea');
  chk(Math.abs(cg(0.5, 0.08) - 0.5) < 1e-9, 'ground above the glacial-sea ceiling never moves (the ranges stay put)');
  chk(Math.abs(cg(0.15, 0) - 0.15) < 1e-9, 'a present-level sea (no shift) leaves the coast untouched');
  // DROWNED-VALLEY ESTUARY: the far pole of the highstand — the sea backs up the valley in a warm
  // interglacial (fills), drains in a glacial. Positional up the main stem (tested live for placement).
  chk(TG.estuaryStrength(122000) > TG.estuaryStrength(140000), 'the drowned-valley estuary fills in an interglacial and drains in a glacial');
  chk(TG.estuaryStrength(122000) > 0 && TG.estuaryStrength(140000) === 0, 'the estuary is present at a highstand and absent in a full glacial');
  if (GEO && G.terrain._geoCache) {
    const T = G.terrain;
    T.morphTo(vm.runInContext('DeepTime.yearsStart', ctx), 1);   // p=0 — ranges nascent
    let lo = 0; const a = T.heightMap; for (let i = 0; i < a.length; i += 53) if (a[i] > 0.6) lo++;
    T.morphTo(vm.runInContext('DeepTime.yearsEnd', ctx), 1);      // p=1 — ranges mature
    let hi = 0; const b = T.heightMap; for (let i = 0; i < b.length; i += 53) if (b[i] > 0.6) hi++;
    chk(hi > lo, `ranges rise with deep time — high-ground cells ${lo} -> ${hi}`);
    chk(!!T._geoCache, 'the geo field is cached (morph re-applies the deep-time factors only)');

    // The early west breathes: count land cells west of the ranges (u < 0.45) at an early highstand,
    // the lowstand after it, and MIS 5e. The lowstand bares far more; the early highstand drowns more
    // than MIS 5e, because the plain stood lower (Waitapu c. 0.88 Ma: Feilding–Halcombe under shelf).
    {
      const seaE0 = T._waterBiome && T._waterBiome.maxElevation != null ? T._waterBiome.maxElevation : 0.10;
      const westLand = (y) => {
        T.morphTo(y, 1);
        const a = T.heightMap, gc = T.gridCols, gr = T.gridRows; let n = 0;
        for (let row = 0; row < gr; row += 2) for (let c = 0; c < gc * 0.45; c += 2) if (a[row * gc + c] >= seaE0) n++;
        return n;
      };
      const hi = westLand(918000), lo = westLand(880000);
      chk(lo > hi * 1.5, `the early west breathes: the MIS 22 lowstand bares far more land than the MIS 23 highstand (${lo} vs ${hi} cells)`);
    }

    // MEANDERS and TE ĀPITI (2026-10-19). Each channel's line is offset by a 1D fBm that drifts
    // downstream with time: free on the low plain, pinned in the gorge and at every confluence, the same
    // for the same date (so the sliced morph matches the synchronous one). The gorge saddle joins the
    // two ranges across the gap so they slope down to meet the river.
    {
      const M = T._geoMain;
      chk(!!M && !!M.mOff && !!M.mEnv, 'the main stem carries a meander envelope and offset table');
      if (M && M.mOff) {
        const lut = (y) => { T._geoT = TG.geoTimeFactors(y); T._meanderKey = null; T._meanderLUT(); return Float32Array.from(M.mOff); };
        const a = lut(122000), b = lut(100000), a2 = lut(122000);
        let maxA = 0, diff = 0, same = true;
        for (let k = 0; k < a.length; k++) { if (Math.abs(a[k]) > maxA) maxA = Math.abs(a[k]); diff = Math.max(diff, Math.abs(a[k] - b[k])); if (a[k] !== a2[k]) same = false; }
        chk(maxA > 0.005, `the lower Manawatū meanders (peak offset ${maxA.toFixed(3)} of the map)`);
        chk(diff > 0.003, `the meanders migrate: 122 ka and 100 ka differ (by up to ${diff.toFixed(3)})`);
        chk(same, 'the meanders are the same for the same date (deterministic, no p5 noise)');
        // pinned in the gorge: the envelope is 0 where the main crosses the gap
        let gorgeEnv = 1;
        for (let k = 0; k <= 256; k++) {
          const p = k / 256, L = M.pts, ext = M.extLen || 0;
          let tot = 0; const cum = [0]; for (let i = 0; i + 1 < L.length; i++) { tot += Math.hypot(L[i + 1][0] - L[i][0], L[i + 1][1] - L[i][1]); cum.push(tot); }
          let d = ext + p * (tot - ext), i = 0; while (i + 2 < L.length && cum[i + 1] < d) i++;
          const t = (d - cum[i]) / ((cum[i + 1] - cum[i]) || 1), u = L[i][0] + (L[i + 1][0] - L[i][0]) * t;
          if (Math.abs(u - vm.runInContext('LOOK', ctx).straitGorgeU) < 0.02) gorgeEnv = Math.min(gorgeEnv, M.mEnv[k]);
        }
        chk(gorgeEnv < 1e-6, `the main does not wander in the gorge (envelope ${gorgeEnv.toFixed(3)})`);
        // THE NETWORK (redrawn 2026-10-20, geo/manawatu.svg): twelve named tributaries in the real
        // confluence order (Wikipedia: Mangatewainui, Tīraumea, Mangatainoka, Mangahao, Pohangina,
        // Ōroua, Tokomaru down the main; the Kiwitea into the Ōroua, the Mākākahi into the
        // Mangatainoka, the Tamaki and Mangatoro into the upper Manawatū), each rising off the map or
        // in a range, never on the plain.
        const Tr = T._geoTribs || [], byName = (n) => Tr.find(t => t.name === n);
        const want = ['Pohangina', 'Ōroua', 'Kiwitea', 'Tokomaru', 'upper Manawatū', 'Mangatewainui', 'Tamaki', 'Mangatoro', 'Tīraumea', 'Mangatainoka', 'Mākākahi', 'Mangahao'];
        chk(want.every(n => byName(n)), `every tributary is drawn and named (${Tr.map(t => t.name).join(', ')})`);
        const parentOf = (n) => { const t = byName(n); return t && t.parent ? (t.parent.name || 'main') : null; };
        chk(parentOf('Kiwitea') === 'Ōroua' && parentOf('Mākākahi') === 'Mangatainoka' && ['Mangatewainui', 'Tamaki', 'Mangatoro', 'Tīraumea'].every(n => parentOf(n) === 'upper Manawatū')
            && ['Pohangina', 'Ōroua', 'Tokomaru', 'Mangatainoka', 'Mangahao', 'upper Manawatū'].every(n => parentOf(n) === 'main'),
            'each tributary joins the right river (the Kiwitea the Ōroua, the Mākākahi the Mangatainoka, four streams the upper Manawatū)');
        const down = ['upper Manawatū', 'Mangatainoka', 'Mangahao', 'Pohangina', 'Ōroua', 'Tokomaru'].map(n => byName(n) ? byName(n).parentP : NaN);
        chk(down.every((p, i) => i === 0 || p < down[i - 1]), `they join the main in the real order, upstream to the sea (main positions ${down.map(p => p.toFixed(2)).join(' > ')})`);
        const up = ['Mangatewainui', 'Tamaki', 'Mangatoro', 'Tīraumea'].map(n => byName(n) ? byName(n).parentP : NaN);
        chk(up.every((p, i) => i === 0 || p > up[i - 1]), `…and the upper Manawatū's, the Mangatewainui first and the Tīraumea last (${up.map(p => p.toFixed(2)).join(' < ')})`);
        const rangeAt = (u, v) => { let m = 0; for (const R of T._geoRanges) m = Math.max(m, T._rangeMass(R, u, v)); return m; };
        const lq = { u: 0, v: 0, nx: 0, ny: 0 };
        const badSrc = Tr.filter(t => { T._lineAt(t, 0, lq); return lq.u >= 0 && lq.u < 1 && lq.v >= 0 && lq.v < 1 && rangeAt(lq.u, lq.v) < 0.5; });
        chk(badSrc.length === 0, `every tributary rises off the map or in a range, never on the plain${badSrc.length ? ' (not: ' + badSrc.map(t => t.name).join(', ') + ')' : ''}`);
        const sp = vm.runInContext('LOOK', ctx).tribFanSpread;
        const badHead = [];
        for (const t of Tr) for (const th of t.threads.slice(1)) {
          T._lineAt(t, th.p0, lq);
          const u = lq.u + lq.nx * th.off * sp, v = lq.v + lq.ny * th.off * sp;
          if (u >= 0 && u < 1 && v >= 0 && v < 1 && rangeAt(u, v) < 0.5) badHead.push(t.name);
        }
        chk(badHead.length === 0, `no fan stream rises on the plain: every head is off the map or on range ground${badHead.length ? ' (not: ' + badHead.join(', ') + ')' : ''}`);
        // JUNCTIONS: no channel is pinned at a confluence any more. A mouth slides with its parent and its
        // line ends where it crosses the parent's moved line, so across the window every mouth sits on
        // its parent's channel.
        const Rv = T._geoRivers, VW = () => T.getRivers();
        const ptAt = (rv, p) => { const P = rv.vP, pts = VW()[Rv.indexOf(rv)].pts; for (let i = 0; i + 1 < P.length; i++) if (P[i + 1] >= p) { const tt = (p - P[i]) / ((P[i + 1] - P[i]) || 1); return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * tt, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * tt]; } return pts[pts.length - 1]; };
        const dLine = (rv, u, v) => { const pts = VW()[Rv.indexOf(rv)].pts; let m = 9; for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy; let tt = l2 ? ((u - a[0]) * dx + (v - a[1]) * dy) / l2 : 0; tt = tt < 0 ? 0 : tt > 1 ? 1 : tt; m = Math.min(m, Math.hypot(u - a[0] - dx * tt, v - a[1] - dy * tt)); } return m; };
        let gap = 0, gapAt = '', peakM = 0, peakT = 0, conf = 0;
        const pinned = M.mEnv.reduce((a, e) => a + (e > 0.5 ? 1 : 0), 0);
        for (let y = 1000000; y >= 25500; y -= 25000) {
          T._geoT = TG.geoTimeFactors(y); T._meanderKey = null; T._meanderLUT();
          Tr.forEach((t, j) => { const m = ptAt(t, T._tribEndJ[j]), d = dLine(t.parent, m[0], m[1]); if (d > gap) { gap = d; gapAt = t.name + ' @' + Math.round(y / 1000) + ' ka'; } });
          for (let k = 0; k <= 256; k++) peakM = Math.max(peakM, Math.abs(M.mOff[k]));
          for (const t of Tr) for (let k = 0; k <= 256; k++) peakT = Math.max(peakT, Math.abs(t.mOff[k]));
          // CORRIDOR: off the gorge, the moved main never climbs into a range
          for (let i = 0; i < M.vP.length; i += 4) {
            const k = Math.round(M.vP[i] * 256); if (M.mEnv[k] < 0.2) continue;
            const o = TG._meanderAt(M.mOff, M.vP[i]), u = M.vB[i * 2] + M.vN[i * 2] * o, v = M.vB[i * 2 + 1] + M.vN[i * 2 + 1] * o;
            const lim = Math.min(0.95, Math.max(vm.runInContext('LOOK', ctx).corridorRangeT, rangeAt(M.vB[i * 2], M.vB[i * 2 + 1]) + 0.25));
            if (rangeAt(u, v) > lim + 0.05) conf++;
          }
        }
        chk(gap < 0.012, `every tributary's mouth sits on its parent's moved channel across the window (worst gap ${gap.toFixed(4)} of the map, ${gapAt})`);
        chk(pinned > 150, `the main is free over most of its course, no longer pinned at the confluences (${pinned}/257 samples)`);
        chk(peakM >= 0.035 && peakT >= 0.03, `the courses swing across their plains (peak offset: main ${peakM.toFixed(3)}, tributaries ${peakT.toFixed(3)} of the map)`);
        chk(conf === 0, `…inside their corridor: the moved main never climbs into a range off the gorge (${conf} samples did)`);
        for (const t of Tr) chk(t.mEnv[256] < 1e-6, `${t.name}: no meander of its own at the mouth (it follows its parent there)`);
        let inRange = 0;
        for (const t of Tr) for (let k = 0; k <= 256; k += 4) { T._lineAt(t, k / 256, lq); if (rangeAt(lq.u, lq.v) >= 0.99 && t.mEnv[k] > 0.05) inRange++; }
        chk(inRange === 0, `a tributary never wanders inside a range proper, where it is incised (${inRange} samples did)`);
        // COURSE SHIFTS: the course is fixed within a glacial cycle and takes a new line after each
        // termination (LOOK.meanderBelt*). Isolated by turning the bends off.
        const LK = vm.runInContext('LOOK', ctx), terms = TG.terminations();
        chk(terms.length >= 8, `the window holds the glacial terminations the course shifts key on (${terms.length})`);
        if (terms.length >= 3) {
          const keep = [LK.meanderAmp, LK.tribMeanderAmp]; LK.meanderAmp = 0; LK.tribMeanderAmp = 0;
          const beltAt = (y) => { T._geoT = TG.geoTimeFactors(y); T._meanderKey = null; T._meanderLUT(); return Float32Array.from(M.mOff); };
          const T1 = terms[1], T2 = terms[2], ease = LK.meanderBeltEase;
          const a1 = beltAt(T1 - ease - 500), a2 = beltAt(T2 + 500), b = beltAt(T2 - ease - 500);
          let same = 0, shift = 0; for (let k = 0; k <= 256; k++) { same = Math.max(same, Math.abs(a1[k] - a2[k])); shift = Math.max(shift, Math.abs(a1[k] - b[k])); }
          LK.meanderAmp = keep[0]; LK.tribMeanderAmp = keep[1];
          chk(same < 1e-6 && shift > 0.01, `the course holds through a glacial cycle and shifts at the next termination (within ${same.toExponential(1)}, across ${shift.toFixed(3)})`);
        }
        // the drawn lines follow the moved channels
        const V = T.getRivers()[T._geoRivers.indexOf(M)];
        chk(V && V.pts.length > M.pts.length * 3, `the drawn main line is resampled densely so it follows the bends (${V ? V.pts.length : 0} points)`);
      }
      const gu = vm.runInContext('LOOK', ctx).straitGorgeU, c2 = T._geoCache, gc2 = T.gridCols, gr2 = T.gridRows, col = Math.round(gu * gc2);
      let row0 = 0, best = 1e9; for (let r = 0; r < gr2; r++) { const d = Math.abs(c2.wMS[r * gc2 + col]); if (d < best) { best = d; row0 = r; } }
      chk(c2.rMask[row0 * gc2 + col] > 0.5, `Te Āpiti: the ranges meet at the river — range mass on the channel in the gap (${c2.rMask[row0 * gc2 + col].toFixed(2)})`);
      chk(TG._gorgeValley(gu) < 0.6 && TG._gorgeChannel(gu) < 0.6 && TG._gorgeDepth(gu) > 2, 'the gorge has a narrower valley and channel and cuts deeper');
      chk(TG._gorgeAlong(0.25) === 0 && TG._gorgeAlong(0.8) === 0, 'the gorge treatment is confined to the gap');
    }

    // THE SHELF (md/TEMANAWA_COAST_PLAN.md): the western coast sits where relative sea level puts
    // it on the baked shelf profile. Measured as the median, over the middle rows, of the first
    // column where 9 of the next 10 cells are land. The old noise sea floor sat in a thin band
    // under the waterline, so the coast held still and then flipped all at once.
    const seaE = T._waterBiome && T._waterBiome.maxElevation != null ? T._waterBiome.maxElevation : 0.10;
    const coastAt = (y) => {
      T.morphTo(y, 1);
      const a = T.heightMap, gc = T.gridCols, gr = T.gridRows, cs = [];
      for (let row = Math.round(gr * 0.3); row <= Math.round(gr * 0.8); row += 4) {
        const ro = row * gc; let coast = gc;
        for (let c = 0; c + 10 <= gc; c++) { let land = 0; for (let k = 0; k < 10; k++) if (a[ro + c + k] >= seaE) land++; if (land >= 9) { coast = c; break; } }
        cs.push(coast / gc);
      }
      cs.sort((x, y2) => x - y2); return cs[cs.length >> 1];
    };
    const RSL = (y) => TG.relativeSeaLevel(y);
    const dates = [25500, 140000, 45000, 122000, 410000];   // ascending relative sea level
    let ascending = true;
    for (let k = 0; k + 1 < dates.length; k++) if (!(RSL(dates[k]) < RSL(dates[k + 1]))) ascending = false;
    chk(ascending, `relative sea level rises through 25.5 → 140 → 45 → 122 → 410 ka (${dates.map(y => RSL(y).toFixed(0)).join(', ')} m)`);
    const cu = dates.map(coastAt);
    let mono = true;
    for (let k = 0; k + 1 < cu.length; k++) if (!(cu[k] < cu[k + 1])) mono = false;
    chk(mono, `the coast moves inland as relative sea level rises (coast u ${cu.map(c => c.toFixed(3)).join(', ')})`);
    chk(cu[0] < cu[2] - 0.05, `the LGM bares far more shelf than MIS 3 (coast u ${cu[0].toFixed(3)} vs ${cu[2].toFixed(3)})`);
    const c450 = coastAt(450000);
    chk(cu[1] < c450, `a later glacial bares more than an earlier one as the plain rises (MIS 6 ${cu[1].toFixed(3)} vs MIS 12 ${c450.toFixed(3)})`);
    // The main river reaches the lowstand sea: its mouth is carried offshore (riverOffshoreU), so
    // from the map edge up its lower course there is no dry gap between river and sea.
    {
      const W = T.mapWidth, H = T.mapHeight, rv = T.getRivers().find(r => r.type !== 'tributary');
      const runAt = (y) => {
        T.morphTo(y, 1);
        const p = rv.pts, seg = []; let tot = 0;
        for (let k = 0; k + 1 < p.length; k++) { const L = Math.hypot((p[k + 1][0] - p[k][0]) * W, (p[k + 1][1] - p[k][1]) * H); seg.push(L); tot += L; }
        const s = [];
        for (let j = 0; j <= 200; j++) {
          let d = tot * 0.4 * j / 200, k = 0;
          while (k < seg.length - 1 && d > seg[k]) { d -= seg[k]; k++; }
          const t = Math.min(1, d / (seg[k] || 1));
          const u = p[k][0] + (p[k + 1][0] - p[k][0]) * t, v = p[k][1] + (p[k + 1][1] - p[k][1]) * t;
          if (u >= 0 && u < 1 && v >= 0 && v < 1) s.push(T.waterTypeAt(u * W, v * H));
        }
        return s;
      };
      if (rv) for (const y of [25500, 140000]) {
        // The harness noise is Math.random per cell, so the channel's wobble leaves isolated dry
        // specks on the centre line; a break is a RUN of dry samples (~2 px each).
        const s = runAt(y);
        let gap = 0, longest = 0; for (const x of s) { gap = x === 0 ? gap + 1 : 0; if (gap > longest) longest = gap; }
        chk(s.length > 0 && s[0] !== 0 && longest <= 2, `at ${y / 1000} ka the main runs unbroken from the lowstand sea up its lower course (longest dry run ${longest} of ${s.length}: ${s.join('')})`);
      }
    }
  }

  console.log(fail ? `geography: ${fail} FAILURES`
    : 'geography: river incises ahead of the ranges, tributary fans close 1 Ma → 0.3 Ma, the Woodville lake fills and drains, ranges lift with a NE–SW spine (cached), morph driver gated');
}

// ---- cold cover: the painted hills open up with the glacial treeline ----------
// Above each stage's treeline (LEVEL_MECHANICS.forestBandByStage[stage].max, the band the live
// trees contract against) the forest biomes blend toward their authored glacial shrub–grassland
// (levelDef.biomes[*].coldCover), with beech held in the lee of the NW wind. Assert the pure
// pieces, the authoring, and the bake end to end: the full-glacial ground loses green, the
// interglacial ground is byte-identical with the cover on or off.
try {
  const TG = vm.runInContext('TerrainGenerator', ctx);
  const G = vm.runInContext('game', ctx);
  const L = vm.runInContext('LOOK', ctx);
  const M = vm.runInContext("typeof LEVEL_MECHANICS!=='undefined'?LEVEL_MECHANICS:null", ctx);
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };

  // Pure: the cover fraction steps up across the treeline, the shelter only on lee slopes.
  chk(TG._coldCoverT(0.30, 0.34, 0.05, 0) === 0 && TG._coldCoverT(0.34, 0.34, 0.05, 0) === 0, 'no cover at or below the treeline');
  chk(TG._coldCoverT(0.39, 0.34, 0.05, 0) === 1, 'full cover one fade above the treeline');
  const c1 = TG._coldCoverT(0.355, 0.34, 0.05, 0), c2 = TG._coldCoverT(0.37, 0.34, 0.05, 0);
  chk(c1 > 0 && c1 < c2 && c2 < 1, 'the cover eases in across the fade');
  chk(TG._coldCoverT(0.36, 0.34, 0.05, 0.03) < TG._coldCoverT(0.36, 0.34, 0.05, 0), 'facet jitter wanders the treeline');
  chk(TG._leeShelter(-0.01, 300) === 0 && TG._leeShelter(0, 300) === 0, 'windward and flat ground get no shelter');
  chk(TG._leeShelter(0.01, 300) === 1 && Math.abs(TG._leeShelter(0.001, 300) - 0.3) < 1e-9, 'lee slopes shelter in proportion to the fall, capped at 1');

  // Authoring: the treeline comes from the same band the plants use, and falls with the cold.
  const stages = ['interglacial', 'cooling', 'glacial', 'fullGlacial'];
  const tl = stages.map(s => TG._stageTreeline(s));
  chk(M && M.forestContraction && tl.every((t, k) => t === M.forestBandByStage[stages[k]].max), 'the treeline is LEVEL_MECHANICS.forestBandByStage[stage].max');
  chk(tl[0] > tl[1] && tl[1] > tl[2] && tl[2] > tl[3], 'the treeline falls monotonically into the full glacial');
  const T = G.terrain, bl = T.biomeArray, cov = T._coldCoverByIdx;
  const covered = bl.filter(b => b.coldCover).map(b => b.key);
  chk(covered.length >= 1 && covered.every(k => k === 'podocarp' || k === 'montane'), `coldCover is authored on the forest bands only (${covered.join(', ')})`);
  chk(bl.every(b => !b.coldCover || (b.coldCover.colors.length >= 2 && b.coldCover.amount > 0 && b.coldCover.amount <= 1
    && b.coldCover.refugeAmount >= 0 && b.coldCover.refugeAmount <= 1)), 'each coldCover has a 2+ stop ramp and 0..1 amounts');
  chk(!!cov && bl.every((b, k) => !!cov[k] === !!b.coldCover), 'the terrain resolved a cover entry for exactly the authored biomes');
  const topForest = Math.max(...bl.filter(b => b.coldCover).map(b => b.maxElevation));
  chk(tl[0] - (L.coldCoverJitter || 0) > topForest, 'the interglacial treeline clears every covered band, so the warm ground is untouched');
  // The harness stubs red()/green()/blue() to 0, so judge the colours from the authored hex.
  const rgb = (h) => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
  const gr = (h) => { const c = rgb(h); return c[1] - c[0]; };
  const lum = (h) => { const c = rgb(h); return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; };
  for (const b of bl.filter(b => b.coldCover)) {
    const forestG = Math.min(...b.colors.map(gr)), openG = Math.max(...b.coldCover.colors.map(gr));
    chk(openG < forestG, `${b.key}: the open ramp reads less green than the forest it replaces (G−R ${openG} < ${forestG})`);
    chk(lum(b.coldCover.refuge) < Math.min(...b.coldCover.colors.map(lum)), `${b.key}: the beech refuge reads darker than the open ground around it`);
  }

  // End to end: bake a stage with the cover on and off, compare the pixels.
  const bake = (stage, on) => {
    const was = L.coldCover; L.coldCover = on;
    const buf = T._bakeSeasonBuffer(stage);
    const px = buf.pixels.slice();
    T._releaseBakeBuffer(buf); L.coldCover = was;
    return px;
  };
  const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++; return n; };
  const igOn = bake('interglacial', true), igOff = bake('interglacial', false);
  chk(diff(igOn, igOff) === 0, 'the interglacial ground is byte-identical with the cover on or off');
  const fgOn = bake('fullGlacial', true), fgOff = bake('fullGlacial', false);
  const gOn = bake('glacial', true), gOff = bake('glacial', false);
  const nFg = diff(fgOn, fgOff), nG = diff(gOn, gOff);
  chk(nFg > 0, `the full-glacial ground changes with the cover (${nFg} px)`);
  chk(nFg > nG, `a lower treeline opens more ground (full glacial ${nFg} px > glacial ${nG} px)`);

  console.log(fail ? `cold cover: ${fail} FAILURES`
    : `cold cover: forest opens above the stage treeline (${tl.join(' → ')}), beech in the lee, interglacial ground untouched`);
} catch (e) { console.log('cold cover: FAILURES (threw)', e.message, '\n  ', (e.stack || '').split('\n')[1]); }

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
    // NaN guard: ridgeInfluence > 1 used to send ~2% of cells through
    // pow(negative, fractional) -> NaN, silently classified as the LAST biome.
    // (This identity section is what caught it — NaN !== NaN.)
    chk(refH.every(v=>!Number.isNaN(v)),'heightMap must contain no NaN cells (clamp before the elevation pow)');
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
    chk(eq(T.heightMap,refH),'sliced heightMap must be identical to the synchronous bake');
    chk(eq(T.biomeIndexMap,refB),'sliced biome map must be identical to the synchronous bake');
    chk(eq(T._paintElev,refE)&&eq(T._paintBiome,refPB)&&eq(T._paintEdge,refEd),
        'sliced paint grid must be identical — the time-independent wobble caches hold');

    // (3) only the VISIBLE glacial-phase pair (current + next) re-bakes; the
    // off-screen phases are left as-is and refresh when they re-enter the visible
    // pair (at ~0 effective alpha). This is the per-morph cost cut — 1-2 season
    // bakes, not 4. morphTo (a hard scene change) still bakes all four; see
    // TerrainGenerator._seasonBakeOrder.
    {
      const SMv = T.seasonManager;
      const vis = new Set([SMv.currentKey, SMv.nextKey]);
      chk([...vis].every(k=>T.seasonBuffers[k]&&T.seasonBuffers[k]!==fronts[k]),
          'the visible glacial-phase pair (current+next) must swap to fresh bakes');
      chk(['interglacial','cooling','glacial','fullGlacial'].filter(k=>!vis.has(k))
            .every(k=>T.seasonBuffers[k]===fronts[k]),
          'the off-screen phases must be LEFT un-rebaked (the per-morph cost cut)');
    }

    // (4) crossfade + pool hygiene: the visible season's retired buffer is held
    // for the fade, render() releases it when the fade ends, and releases recycle.
    chk(!!T._morphFade,'the on-screen buffer swap must arm the morph crossfade');
    chk(T._morphFade && T._morphFade.ms>=500,'the crossfade must ramp >= 500 ms (photosensitivity)');
    for(let i=0;i<80 && T._morphFade;i++) FRAME(ctx.draw);
    chk(!T._morphFade,'render() must retire the crossfade buffer once the fade ends');
    chk(T._bufPool.length>0,'retired back buffers must recycle into the bake pool');

    // (4b) the morph crossfade must fade the whole OLD composite out to the whole NEW composite.
    // The base is a frozen SNAPSHOT of the old on-screen image (old current+next phases already
    // blended into it), and it must draw at an EXPLICIT full alpha — not the stale context alpha
    // it happens to inherit. On top, the freshly re-baked land (BOTH phases) eases in scaled by
    // fadeAlpha. Two failures this guards, both seen as a double / wrong shoreline mid-morph:
    //   · a dim base (drawn at the inherited alpha) lets the new land bleed through; and
    //   · a next-phase layer drawn at full transitionProgress (ignoring fadeAlpha) lays the
    //     NEW-time shoreline over the old one for the length of the fade (the ghost).
    // Poison the context alpha to 0.7 to prove the base overrides it, then assert: at fadeAlpha 0
    // the snapshot draws at full and NOTHING freshly re-baked shows; at fade end the live blend
    // resumes (next at transitionProgress) and the snapshot is retired.
    {
      const SM = T.seasonManager;
      const s0 = SM.currentSeasonIndex, tp0 = SM.transitionProgress, y0 = DT.yearsBP;
      SM.currentSeasonIndex = 0; SM.transitionProgress = 0.8;    // interglacial --0.8--> cooling
      const nxtKey = SM.nextKey;                                 // 'cooling'
      T.morphTo(DT.yearsBP, 1);                                  // arms _morphFade (snapshot of the OLD composite)
      chk(!!T._morphFade, 'guard setup: a morph must arm the crossfade');
      const keyOf = (b) => { for (const k in T.seasonBuffers) if (T.seasonBuffers[k] === b) return k; return 'retired'; };
      const record = () => { const d = [], oi = ctx.image;
        ctx.drawingContext.globalAlpha = 0.7;                    // a stale inherited alpha the base must override
        ctx.image = (buf) => d.push({ k: keyOf(buf), a: +ctx.drawingContext.globalAlpha });
        T.render(); ctx.image = oi; return d; };
      // (i) fadeAlpha 0: the OLD composite is baked into the snapshot and drawn at FULL; nothing
      //     freshly re-baked may show, or the new-time shoreline ghosts over the old.
      if (T._morphFade) { T._morphFade.t0 = _t; T._morphFade.ms = 600; }   // (_t - t0)/ms == 0 -> fadeAlpha 0
      const d0 = record();
      let baseFull = false, freshMax = 0;
      for (const d of d0) { if (d.k === 'retired') { if (d.a > 0.98) baseFull = true; } else freshMax = Math.max(freshMax, d.a); }
      chk(baseFull, 'the morph fade must draw the OLD-composite snapshot at FULL alpha (fadeAlpha 0), not the inherited context alpha');
      chk(freshMax < 0.02, `no freshly re-baked land may show at fadeAlpha 0 (a fresh layer drew at ${freshMax.toFixed(2)}) — else the new shoreline ghosts over the old`);
      // (ii) fade ended: the snapshot is retired and the live glacial blend resumes (next at tp).
      if (T._morphFade) { T._morphFade.t0 = _t - 10000; T._morphFade.ms = 600; }   // t >= 1 -> retire on next render
      const d1 = record();
      let nextA = -1, anyRetired = false;
      for (const d of d1) { if (d.k === nxtKey) nextA = Math.max(nextA, d.a); if (d.k === 'retired') anyRetired = true; }
      chk(!anyRetired && !T._morphFade, 'render() must retire the snapshot once the fade ends');
      chk(Math.abs(nextA - SM.transitionProgress) < 0.05,
          `the live glacial blend must resume after the fade (next '${nxtKey}' at ${nextA.toFixed(2)}, want ~${SM.transitionProgress})`);
      ctx.drawingContext.globalAlpha = 1;

      // (4c) if the visible phase steps OFF the fade's phase mid-fade (a glacial
      // boundary crossed, or the index oscillated), the retired buffer is a stale,
      // wrong-phase, OLD-land buffer — drawing it at full flicks the terrain to that
      // previous state. render() must retire the fade instead. Re-arm a fade for
      // interglacial, move the live phase to glacial, and assert no stale buffer draws.
      T._morphFade = null;                                       // clear (4b)'s fade so morphTo re-arms fresh
      SM.currentSeasonIndex = 0; SM.transitionProgress = 0.5;
      T.morphTo(DT.yearsBP, 1);
      const fadeBuf = T._morphFade && T._morphFade.buf;
      chk(!!T._morphFade && T._morphFade.key === 'interglacial', 'guard setup: fade must record its phase key');
      if (T._morphFade) { T._morphFade.t0 = _t; T._morphFade.ms = 600; }   // fadeAlpha 0 (would draw the base)
      SM.currentSeasonIndex = 2; SM.transitionProgress = 0.1;   // phase steps onto glacial mid-fade
      const draws2 = [], origImage2 = ctx.image;
      ctx.image = (buf) => { draws2.push(buf); };
      T.render();
      ctx.image = origImage2;
      chk(!T._morphFade, 'render() must retire the crossfade when the visible phase steps off its phase');
      chk(!draws2.includes(fadeBuf), 'the stale wrong-phase retired buffer must NOT be drawn once the phase has moved');
      T._morphFade = null;                                       // retire the guard's fade
      SM.currentSeasonIndex = s0; SM.transitionProgress = tp0; DT.yearsBP = y0;
    }

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

// ---- animated water overlay: built from geometry, animates + renders clean ----
// WaterLayer stamps river-flow / eel / sea-shimmer decals from terrain.waterTypeAt()
// + the river polylines, and draws them each frame in Game.render(). The 120-frame
// boot loop above already exercised render() (a throw there fails as DRAW FAIL);
// this asserts the placement and the eel travel/wrap the render depends on.
{
  const G = vm.runInContext('game', ctx), SS = vm.runInContext('SpriteStrips', ctx);
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };
  const w = G.water, T = G.terrain;
  chk(!!w, 'game.water exists after a full build');
  chk(SS && SS.has('water_current') && SS.has('sea_shimmer') && SS.has('eel_swim'),
      'placeholder strips registered for every water animation');

  // eels are a deep-time feature — absent before 500 ka, present at/after it (WaterLayer gates on
  // the year, not the land shape). Build on each side of the gate with the year passed explicitly,
  // morphing the land to match so the seeded eel has a wet main stem to sit on.
  T.morphTo(900000, 1); w.build(T, 900000);
  chk(w.eels.length === 0, 'no eels before 500 ka (build @ 900 ka)');
  T.morphTo(500000, 1); w.build(T, 500000);
  chk(w.eels.length >= 1, 'eels appear once the clock reaches 500 ka');
  T.morphTo(300000, 1); w.build(T, 300000);   // a firmly post-gate year for the travel checks below

  chk(w && (w.decals.length + w.eels.length) > 0, 'water placed decals/eels from the geometry');
  chk(!w || w.decals.length <= w.cfg.maxDecals, 'decal count stays within maxDecals');
  chk(!w || w.eels.length <= w.cfg.eelCount, 'eel count stays within the configured count');
  const preErr = _errors.length;
  if (w && w.eels.length) {
    const d0 = w.eels[0].d;
    for (let i = 0; i < 40; i++) w.update(1);
    chk(w.eels[0].d !== d0, 'eels travel downstream when updated');
    chk(w.eels[0].d >= 0 && w.eels[0].d < w.eels[0].path.len + 1e-6, 'eel distance stays on the path (wraps)');
  }
  FRAME(ctx.draw);   // render the overlay once more through the full frame
  chk(_errors.length === preErr, 'water update + render raised no console.error');
  console.log(fail ? `water: ${fail} FAILURES`
    : `water: ${w ? w.decals.length + ' decals, ' + w.eels.length + ' eels (gated <=500 ka)' : 'none'}, animates + renders clean`);
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

// ---- land/water discipline: moa never strand on the sea, eels never on land --
// Two symmetric ways an entity used to end up on the wrong surface, both fixed:
//   • a moa is pushed off unwalkable water (coast advancing under it, or a fast
//     state carrying it on) even at rest — Boid.avoidUnwalkable() Case 1;
//   • an eel patrols only the WET river and bounces off any stretch that has
//     dried to land (the main's NE arm recedes at ~0.6 Ma) — WaterLayer.update().
// Runs LAST: it morphs the terrain to the window end and does not restore it, so
// nothing downstream must depend on the live clock's land (the state dump above
// has already printed). The morph is the single reason to sit here, not earlier.
{
  const DT = vm.runInContext('DeepTime', ctx);
  const T = g.terrain, w = g.water;
  let fail = 0; const chk = (c, m) => { if (!c) { console.log('  FAIL', m); fail++; } };

  // (a) moa eject — deterministic, on the live (window-start) land, tested
  //     straight through avoidUnwalkable() so no simulation luck is involved.
  const moa = g.simulation.moas[0];
  const findCell = (wantWalkable, shoreOnly) => {
    for (let y = 8; y < T.mapHeight - 8; y += 6)
      for (let x = 8; x < T.mapWidth - 8; x += 6) {
        if (T.isWalkable(x, y) !== wantWalkable) continue;
        if (shoreOnly && !(T.isWalkable(x + 18, y) || T.isWalkable(x - 18, y) ||
                           T.isWalkable(x, y + 18) || T.isWalkable(x, y - 18))) continue;
        return { x, y };
      }
    return null;
  };
  if (moa) {
    const sx = moa.pos.x, sy = moa.pos.y, svx = moa.vel.x, svy = moa.vel.y;
    const water = findCell(false, true), land = findCell(true, false);
    if (water) {
      moa.pos.set(water.x, water.y); moa.vel.set(0, 0);   // stranded and at rest
      const f = moa.avoidUnwalkable();
      chk(f.x * f.x + f.y * f.y > 0, 'a stationary moa on water is pushed off it');
      const fm = Math.hypot(f.x, f.y) || 1;
      let escaped = false;
      for (let r = 6; r <= 66 && !escaped; r += 6) escaped = T.isWalkable(water.x + f.x / fm * r, water.y + f.y / fm * r);
      chk(escaped, 'the escape force points toward walkable ground');
    }
    if (land) {
      moa.pos.set(land.x, land.y); moa.vel.set(0, 0);
      const f = moa.avoidUnwalkable();
      chk(f.x === 0 && f.y === 0, 'a stationary moa on land is not spuriously ejected');
    }
    moa.pos.set(sx, sy); moa.vel.set(svx, svy);           // restore the moa (not the land)
  }

  // (a2) the RIVER is unwalkable too. It rides THROUGH the walkable lowland at grassland
  //      elevation, so the coarse biome grid alone called it land and animals pathed straight
  //      onto it ("animals run onto the water"). isWalkable now also consults waterTypeAt, so
  //      no painted river/sea pixel is walkable. Scan the live land for a river cell and assert.
  let riverCell = null;
  for (let y = 8; y < T.mapHeight - 8 && !riverCell; y += 4)
    for (let x = 8; x < T.mapWidth - 8 && !riverCell; x += 4)
      if (T.waterTypeAt(x, y) === 2) riverCell = { x, y };
  chk(!riverCell || T.isWalkable(riverCell.x, riverCell.y) === false,
      'painted river water is not walkable (animals no longer path onto the river)');

  // (b) eels stay on water across deep time — including the window end, where the
  //     NE arm has dried. waterTypeAt: 0 land · 1 sea · 2 river; only 0 is illegal.
  //     Build at a post-500 ka year (yearsEnd) so eels are present to test (gated feature).
  const eelsAllWet = () => { for (const e of w.eels) if (T.waterTypeAt(e._x, e._y) === 0) return false; return true; };
  T.morphTo(500000, 1); w.build(T, 500000);              // seed eels on the deep-time river
  for (let i = 0; i < 80; i++) w.update(1);
  chk(w.eels.length >= 1, 'eels are present past 500 ka to exercise');
  chk(eelsAllWet(), 'eels stay on water once present');

  T.morphTo(DT.yearsEnd, 1); w.build(T, DT.yearsEnd);    // 25.5 ka — NE arm long dry
  let pathLand = 0;
  if (w.eels.length) {
    const p = w.eels[0].path, probe = { _x: 0, _y: 0, _angle: 0 };
    for (let s = 0; s <= 50; s++) { w._samplePath(p, p.len * s / 50, probe); if (T.waterTypeAt(probe._x, probe._y) === 0) pathLand++; }
  }
  for (let i = 0; i < 400; i++) w.update(1);
  chk(eelsAllWet(), 'eels never swim onto the dried NE arm at the window end');

  // (b2) a MORPH never strands a running swimmer. In the live pipeline the eels and fish are
  //      NOT re-seeded per morph (reconcile() leaves them running), so when the strait thins,
  //      the estuary drains or the coast moves under one, the old bounce flipped it in place on
  //      the bank forever: the "stuck eel". Seed once, then morph forward with reconcile() only,
  //      exactly as the time-lapse does, and require every swimmer on water and still travelling.
  const swimmers = () => w.eels.concat(w.fish);
  T.morphTo(500000, 1); w.build(T, 500000);
  for (const y of [420000, 330000, 250000, 160000, 122000, 60000, DT.yearsEnd]) {
    T.morphTo(y, 1); w.reconcile(T, y);
    for (let i = 0; i < 40; i++) w.update(1);
  }
  const strandedN = swimmers().filter(e => T.waterTypeAt(e._x, e._y) === 0).length;
  chk(strandedN === 0, `no eel or fish is left on dry land across morphs (${strandedN} stranded)`);
  const lo = swimmers().map(e => e.d), hi = lo.slice();
  for (let i = 0; i < 240; i++) {
    w.update(1);
    swimmers().forEach((e, k) => { if (e.d < lo[k]) lo[k] = e.d; if (e.d > hi[k]) hi[k] = e.d; });
  }
  const pacing = swimmers().filter((e, k) => hi[k] - lo[k] < 20).length;   // 240 ticks at 0.3–0.4 px/tick ≈ 70–95 px when free
  chk(pacing === 0, `every eel and fish keeps travelling, none paces a tiny pocket (${pacing} pacing)`);
  //      Deterministic stranding: whether a given morph dries the water under a swimmer is seed
  //      luck, so strand one on purpose. Put an eel on a dry point of its own path (the window end's
  //      dried NE arm), exactly as a morph that dried the water under it would leave it, then
  //      require (1) the per-tick step and (2) the morph path (reconcile) each put it back on water.
  if (w.eels.length) {
    const e = w.eels[0], probe = { _x: 0, _y: 0, _angle: 0 };
    let dryD = -1;
    for (let s = 0; s <= 100 && dryD < 0; s++) { const d = e.path.len * s / 100; w._samplePath(e.path, d, probe); if (T.waterTypeAt(probe._x, probe._y) === 0) dryD = d; }
    chk(dryD >= 0, 'the window-end main path has a dry stretch to strand an eel on');
    if (dryD >= 0) {
      e.d = dryD; w._samplePath(e.path, e.d, e);
      for (let i = 0; i < 5; i++) w.update(1);
      chk(T.waterTypeAt(e._x, e._y) !== 0, 'a stranded eel swims back onto water by itself (it used to flip in place on the bank)');
      e.d = dryD; w._samplePath(e.path, e.d, e);
      w.reconcile(T, DT.yearsEnd);
      chk(T.waterTypeAt(e._x, e._y) !== 0, 'a morph moves any eel the new land covers back onto water');
    }
  }

  // (b3) tributaries JOIN the river network at every stage. Sampled along each prepared
  //      polyline (source → confluence) at paint resolution: the wet cells must form ONE run
  //      that reaches the confluence end. The old source-first growth left a stub draining
  //      into dry land until it arrived, and the full-width meander wobble pinched narrow
  //      channels shut into pools; the eastern tributary also used to end in the dried NE arm.
  //      "Joined" = no RIVER water (type 2) upstream of the water run that touches the
  //      confluence; low sea-band hollows (type 1) in a valley the stream hasn't reached are
  //      not channel and are allowed.
  const tribDetached = (rv) => {
    const p = rv.pts, N = 120, W = T.mapWidth, H = T.mapHeight, seg = [], s = [];
    let tot = 0;
    for (let k = 0; k + 1 < p.length; k++) { const L = Math.hypot((p[k + 1][0] - p[k][0]) * W, (p[k + 1][1] - p[k][1]) * H); seg.push(L); tot += L; }
    // On the map only: a source drawn past the map edge reads as the clamped edge cell there.
    for (let j = 0; j <= N; j++) {
      let d = tot * j / N, k = 0;
      while (k < seg.length - 1 && d > seg[k]) { d -= seg[k]; k++; }
      const t = Math.min(1, d / (seg[k] || 1)), u = p[k][0] + (p[k + 1][0] - p[k][0]) * t, v = p[k][1] + (p[k + 1][1] - p[k][1]) * t;
      if (u >= 0 && u < 1 && v >= 0 && v < 1) s.push(T.waterTypeAt(u * W, v * H));
    }
    if (s.length < 2) return 0;
    const NN = s.length - 1;
    // The water run ending at the confluence, bridging dry specks of up to 4 samples: the harness
    // noise is Math.random per cell, so a thin 1 Ma stream's bank noise leaves isolated specks on its
    // line (real noise is smooth). A stub cut off from the main is a gap far longer than that.
    const wetNear = (i) => { for (let k = 1; k <= 5; k++) if (i - k >= 0 && s[i - k] > 0) return true; return false; };
    let start = NN; while (start > 0 && wetNear(start)) start--;
    // The growing HEAD is soft by design: its front feathers over 0.15 of the length (R_FEATHER)
    // plus ±riverFrontJitter, and over bumpy ground a puddle can show inside that feather. So wet
    // cells within a quarter of the polyline above the joined run are the stream's tip; anything
    // farther up is a stub (the old source-first growth left one ~100/120 from the confluence).
    let far = 0; for (let j = 0; j < start; j++) if (s[j] === 2) { const gap = start - j; if (gap > far) far = gap; }
    if (far > 30) tribDetached.last = s.join('');
    return far > 30 ? far : 0;
  };
  // FANS: across each tributary, part-way down, count the separate river-water runs on a transect
  // perpendicular to the trunk. At 1 Ma the hill streams are spread, so some tributary shows more
  // than one; by the window end the fan has closed and every tributary is one run.
  // half: the transect's half-width. The window end looks only across the channel (0.025): with twelve
  // tributaries a neighbour or a parent often runs within the full fan width.
  const fanRuns = (rv, half = 0.08, f = 0.45) => {
    const p = rv.pts, W = T.mapWidth, H = T.mapHeight;
    let tot = 0; for (let k = 0; k + 1 < p.length; k++) tot += Math.hypot(p[k + 1][0] - p[k][0], p[k + 1][1] - p[k][1]);
    let d = tot * f, k = 0;
    while (k < p.length - 2 && d > Math.hypot(p[k + 1][0] - p[k][0], p[k + 1][1] - p[k][1])) { d -= Math.hypot(p[k + 1][0] - p[k][0], p[k + 1][1] - p[k][1]); k++; }
    const L = Math.hypot(p[k + 1][0] - p[k][0], p[k + 1][1] - p[k][1]) || 1, t = Math.min(1, d / L);
    const cu = p[k][0] + (p[k + 1][0] - p[k][0]) * t, cv = p[k][1] + (p[k + 1][1] - p[k][1]) * t;
    const nu = -(p[k + 1][1] - p[k][1]) / L, nv = (p[k + 1][0] - p[k][0]) / L;
    // Runs separated by a dry gap of 8+ samples (~2.5 harness cells): one random-noise cell inside a
    // channel spans ~3 samples and is not land; separate fan streams sit ~35 samples apart.
    let runs = 0, gap = 99;
    for (let j = -100; j <= 100; j++) {
      const u = cu + nu * half * j / 100, v = cv + nv * half * j / 100;
      const wet = u >= 0 && u < 1 && v >= 0 && v < 1 && T.waterTypeAt(u * W, v * H) === 2;
      if (wet) { if (gap >= 8) runs++; gap = 0; } else gap++;
    }
    return runs;
  };
  for (const y of [1000000, 600000, 300000, DT.yearsEnd]) {
    T.morphTo(y, 1);
    const tribs = T.getRivers().filter(rv => rv.type === 'tributary');
    // A tributary the sea has drowned to its source (its water ends in the first tenth) has no
    // channel to be joined: the sea took its catchment. Counted, not walked.
    const drowned = T._geoTribs.map((t, j) => T._tribEndW[j] < 0.1);
    const det = tribs.map((rv, j) => drowned[j] ? 0 : tribDetached(rv));
    const bad = det.filter(n => n > 0).length;
    const why = det.map((n, j) => n > 0 ? `${T._geoTribs[j].name} end ${T._tribEndW[j].toFixed(2)}/${T._tribEndJ[j].toFixed(2)}` : null).filter(Boolean).join('; ');
    chk(bad === 0, `at ${Math.round(y / 1000)} ka every tributary is joined to the main or the sea (farthest detached river cell above the joined run, in 1/120ths: ${det.join(', ')}; drowned to the source: ${drowned.filter(Boolean).length})${bad ? ' [' + why + '] ' + tribDetached.last : ''}`);
    if (y === 1000000 || y === DT.yearsEnd) {
      // At the end, the fewest runs over three points along it: a tight meander loop can cross one
      // transect twice, a fan of parallel streams crosses all three.
      const runs = tribs.map(rv => y === 1000000 ? fanRuns(rv) : Math.min(fanRuns(rv, 0.025, 0.35), fanRuns(rv, 0.025, 0.45), fanRuns(rv, 0.025, 0.55)));
      if (y === 1000000) chk(Math.max(...runs) >= 2, `at 1 Ma the tributaries are fans of thin hill streams (water runs across each: ${runs.join(', ')})`);
      else chk(Math.max(...runs) <= 1, `at the window end each tributary has drawn together into one channel (water runs across each: ${runs.join(', ')})`);
    }
  }

  // THE SEA CUT + THE OPIKI CYCLE (2026-10-20). A tributary's water ends where the sea has drowned its
  // course (the reach below is estuary or dry, never river rising from a beach). At a highstand the
  // rising sea drowns the lower Manawatū and Ōroua valleys; once it stands still the estuary fills
  // (swamp first, then a swamp + forest mosaic); at a lowstand there is no estuary and no fill.
  {
    const Tr = T._geoTribs || [], jO = Tr.findIndex(t => t.name === 'Ōroua');
    const seaE = T._waterBiome.maxElevation;
    const estCount = () => { let s1 = 0, s2 = 0; for (const v of T._estState) { if (v === 1) s1++; else if (v === 2) s2++; } return [s1, s2]; };
    // the drowned lower Ōroua: cells within its valley on its lower reach that are sea or filled ground
    const orouaDrowned = () => {
      const c = T._geoCache; let n = 0;
      for (let i = 0; i < c.tJ.length; i++) {
        const hit = (c.tJ[i] === jO && c.tP[i] > 0.6 && c.tP[i] < 0.97 && Math.abs(c.tS[i]) < 0.03) || (c.tJ2[i] === jO && c.tP2[i] > 0.6 && c.tP2[i] < 0.97 && Math.abs(c.tS2[i]) < 0.03);
        if (hit && (T.heightMap[i] < seaE || T._estState[i] > 0)) n++;
      }
      return n;
    };
    const seaCut = [];
    for (const y of [410000, 335000, 122000]) { T.morphTo(y, 1); seaCut.push(Tr.filter((t, j) => T._tribEndW[j] < T._tribEndJ[j] - 0.01).length); }
    T.morphTo(DT.yearsEnd, 1);
    const cutEnd = Tr.filter((t, j) => T._tribEndW[j] < T._tribEndJ[j] - 0.01).map(t => t.name);
    chk(Math.max(...seaCut) > 0 && cutEnd.length === 0, `the sea cuts tributaries at highstands (410 / 335 / 122 ka: ${seaCut.join(' / ')} cut), none at the LGM${cutEnd.length ? ' (cut: ' + cutEnd.join(', ') + ')' : ''}`);
    const dEnd = orouaDrowned(), eEnd = estCount();
    T.morphTo(135000, 1); const e135 = estCount();
    T.morphTo(122000, 1); const e122 = estCount(), d122 = orouaDrowned();
    T.morphTo(118000, 1); const e118 = estCount();
    chk(jO >= 0 && d122 > 20 && dEnd === 0, `the MIS 5e sea drowns the lower Ōroua valley into the estuary (${d122} cells at 122 ka, ${dEnd} at the LGM)`);
    chk(e135[0] + e135[1] === 0 && eEnd[0] + eEnd[1] === 0, `no estuary fill while the sea is still rising or low (135 ka ${e135}, LGM ${eEnd})`);
    chk(e122[0] > 0, `at the MIS 5e peak the drowned valleys have begun to fill with swamp (swamp/forest cells ${e122})`);
    chk(e118[0] + e118[1] > e122[0] + e122[1] && e118[1] > e122[1], `as the sea stands, the fill spreads and swamp forest takes part of it (122 ka ${e122} → 118 ka ${e118})`);
    // the classify gives the fill its biomes
    const fb = T._estForestBiome(), bi = T.biomeIndexMap, key = T.biomeIndexByKey;
    let okF = 0, okW = 0, nF = 0, nW = 0;
    for (let i = 0; i < T._estState.length; i++) {
      if (bi[i] === key[T._waterBiome.key]) continue;   // the river channel runs on through the fill
      if (T._estState[i] === 2) { nF++; if (fb && bi[i] === key[fb.key]) okF++; }
      else if (T._estState[i] === 1) { nW++; if (bi[i] === key.wetland) okW++; }
    }
    chk(nF > 0 && okF / nF > 0.9 && okW / Math.max(1, nW) > 0.9, `the filled ground reads as swamp forest (${okF}/${nF}) and swamp (${okW}/${nW}) in the biome map`);
  }

  // (c) plants are never left standing on painted WATER after a morph + cull. Spawn a fresh field
  //     on the window-start land, then morph forward and cull at each step exactly as the live
  //     pipeline does (Game._onMorphComplete → cullSubmergedPlants). The visitor sees the PAINTED
  //     ground, so the check is against waterTypeAt (paint res); the coarser getBiomeAt used to
  //     leave margin-cell stragglers standing in the sea at the window end (the reported bug).
  DT.reset(); T.morphTo(DT.yearsStart, 1);
  const S = g.simulation;
  S.plants.length = 0; S.spawnPlants();
  const spawned = S.plants.length;
  let onWater = 0;
  for (const yr of [900000, 600000, 349000, 150000, DT.yearsEnd]) {
    T.morphTo(yr, 1);
    S.cullSubmergedPlants();
    for (const p of S.plants) if (p.alive && T.waterTypeAt(p.pos.x, p.pos.y) !== 0) onWater++;
  }
  chk(onWater === 0, `no plant left standing on painted water after morph+cull (found ${onWater} of ${spawned} spawned)`);

  // (d) survivors' cached SITE is refreshed to the morphed ground — the "plants don't update as the
  //     landscape changes" bug (a podocarp kept its forest elevation while the Ruahine uplifted into
  //     the subalpine band under it, so its forest-contraction check never fired). After the morph
  //     loop every living plant's cached elevation must equal the CURRENT terrain under it.
  let stale = 0;
  for (const p of S.plants) { if (!p.alive) continue; if (Math.abs(p.elevation - T.getElevationAt(p.pos.x, p.pos.y)) > 1e-6) stale++; }
  chk(stale === 0, `every surviving plant's cached elevation tracks the morphed ground (found ${stale} stale of ${S.plants.length})`);

  console.log(fail ? `land/water discipline: ${fail} FAILURES`
    : `land/water discipline: moa ejected off water, eels stay wet & gated <=500 ka, no plant on painted water `
      + `(${pathLand}/51 of the end-state path dried to land)`);
}

if(_errors.length){ console.log('--- console.error during run ---'); _errors.slice(0,10).forEach(e=>console.log('  ',e)); }
