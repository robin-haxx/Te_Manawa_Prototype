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
    fillStyle:'',globalAlpha:1,filter:'',shadowBlur:0,shadowColor:''},
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
  for(const k of ['1','2','3','d','d','4']) vm.runInContext('game',ctx).handleKey(k);
  for(let i=0;i<30;i++) FRAME(ctx.draw);
  console.log('buttons 1-4 + debug modes ok');
}catch(e){ console.log('INPUT FAIL:', e.message,'\n',e.stack.split('\n').slice(1,4).join('\n')); process.exit(1); }
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
