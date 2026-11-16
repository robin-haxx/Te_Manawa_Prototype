// The page that shows the series (built by build_maps.js). Reference only.
module.exports = function page({ SLICES, VIEWS, COL, data, baseLayers, overlay, thumbs, f1, esc }) {
  const FONT = `font-family="Inter, 'Segoe UI', system-ui, sans-serif"`;
  const view = (sl, vk, label) => { const v = VIEWS[vk];
    return `<svg class="map" viewBox="${f1(v.x)} ${f1(v.y)} ${v.w} ${v.h}" ${FONT} role="img" aria-label="${esc(label)}"><rect x="${f1(v.x)}" y="${f1(v.y)}" width="${v.w}" height="${v.h}" fill="${COL.deep}"/><use href="#base-${sl.id}"/>${overlay(sl, vk, true)}</svg>`; };
  const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><path id="coast" d="${data.coast}"/>${SLICES.map(s => `<g id="base-${s.id}">${baseLayers(s.id)}</g>`).join('')}</defs></svg>`;
  const basisName = { map: 'From a published map', interp: 'Interpolated', recon: 'Reconstructed', now: 'Surveyed' };

  // ---- timeline -------------------------------------------------------------
  const TX = (ma) => 30 + (4 - ma) / 4 * 900;
  const bars = [
    ['Whanganui Basin sinking', [[4.0, 1.0]], 'sea'], ['Kuripapango Strait', [[4.0, 3.6]], 'sea'], ['Manawatū Strait', [[3.3, 3.0], [2.4, 1.63]], 'sea'],
    ['Ruataniwha Strait', [[4.0, 1.5]], 'sea'], ['Taupō Volcanic Zone', [[2.0, 0]], 'fire'], ['Ruahine and Tararua rising', [[1.0, 0]], 'land'], ['Cook Strait', [[0.45, 0]], 'sea']
  ];
  let tl = `<svg class="timeline" viewBox="0 0 960 ${64 + bars.length * 22}" ${FONT} role="img" aria-label="Timeline of straits, ranges and volcanism from 4 million years ago to today">`;
  bars.forEach(([name, spans, kind], i) => { const y = 14 + i * 22;
    for (const [a, b] of spans) tl += `<rect x="${TX(a)}" y="${y}" width="${Math.max(3, TX(b) - TX(a))}" height="12" rx="2" class="bar-${kind}"/>`;
    const first = spans[0][0], endX = TX(spans[spans.length - 1][1]);
    const lastEnd = spans[spans.length - 1][1];   // a bar that runs to today is named on its left, the rest on their right
    tl += lastEnd <= 0.05 ? `<text x="${TX(first) - 6}" y="${y + 10}" text-anchor="end" class="tl-t">${esc(name)}</text>` : `<text x="${endX + 6}" y="${y + 10}" class="tl-t">${esc(name)}</text>`; });
  const ay = 22 + bars.length * 22;
  tl += `<path d="M30 ${ay}H930" class="tl-axis"/>`;
  for (let m = 4; m >= 0; m -= 0.5) tl += `<path d="M${TX(m)} ${ay}v${m % 1 ? 4 : 7}" class="tl-axis"/>` + (m % 1 ? '' : `<text x="${TX(m)}" y="${ay + 34}" text-anchor="middle" class="tl-n">${m ? m + ' Ma' : 'today'}</text>`);
  for (const s of SLICES) tl += `<a href="#${s.id}"><circle cx="${TX(s.ma)}" cy="${ay}" r="5" class="tl-dot tl-${s.basis}"><title>${esc(s.short)}: ${esc(s.title)}</title></circle></a>`;
  tl += `<text x="${TX(0.45)}" y="${ay + 20}" text-anchor="middle" class="tl-s">450 ka</text><text x="${TX(1.5)}" y="${ay + 20}" text-anchor="middle" class="tl-s">1.5</text><text x="${TX(2.4)}" y="${ay + 20}" text-anchor="middle" class="tl-s">2.4</text><text x="${TX(0.06)}" y="${ay + 20}" text-anchor="end" class="tl-s">125 · 20 ka</text></svg>`;

  // ---- slices ---------------------------------------------------------------
  const sliceHtml = SLICES.map(s => `<section class="slice" id="${s.id}">
  <header><p class="when">${esc(s.date)}</p><h2>${esc(s.title)}</h2><p class="basis"><span class="tag tag-${s.basis}">${basisName[s.basis]}</span> ${esc(s.basisText)}</p></header>
  <div class="maps">
    <figure class="f-island">${view(s, 'island', 'North Island, ' + s.date)}<figcaption>Whole island</figcaption></figure>
    <figure class="f-lower">${view(s, 'lower', 'Lower North Island, ' + s.date)}<figcaption>Lower North Island. The dashed box is the Te Manawa frame.</figcaption></figure>
    <ul class="notes">${s.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
  </div></section>`).join('\n');

  // ---- sim comparison -------------------------------------------------------
  const CMP = [
    ['m4000', 'match', 'Matches since 13 Nov', 'About half of the frame is land in the paper’s map: 45% low coastal plain and 4% hills, widest at the gorge’s latitude and reaching from Feilding and Palmerston North to just east of the gorge. Deep water lies to the south-east.', 'About half the frame is low coastal plain round the axis, a beach fringe and then lowland grass, with the Tararua as green hills and the Ruahine low. Shelf sea to the west, deep water only off the south-east. Land and sea agree with the reconstruction over about 90% of the frame (54% before).'],
    ['m3000', 'match', 'Matches since 13 Nov', '10% land. The Ruahine finger stops about 14 km north of the gorge. The Tararua peninsula ends near Palmerston North. Open shelf covers the gorge between them.', 'The strait crosses the southern Ruahine: the Ruahine finger ends well north of the gorge and the Tararua begins near Palmerston North, close to the reconstruction’s tips. The whole frame is shelf sea.'],
    ['m2400', 'match', 'Matches since 13 Nov', '8% land. A thin strip of shoals is all that marks the Ruahine, ending about 19 km north of the gorge. The Tararua peninsula is low hill country and comes within about 12 km of the gorge.', 'The Ruahine is a scatter of shoals north of the strait and the Tararua low green hills to its south. Shelf sea throughout.'],
    ['m1500', 'close', 'No published map', 'Interpolation only: the west half low and marginal, the east half land. The paper’s words for the west are “shelf to marginal-marine”.', 'The same split: the east land, the west a shallow, shelf-toned sea that darkens back to the window’s own sea by 1 Ma.'],
    ['m1000', 'match', 'Matches', 'Lasting land east of a line through the gorge (59%). West of it the swing band (41%): land at low sea level, estuary and shallow sea at high.', 'At a warm stage the coast stands 11–22 km west of the gorge with an estuary reaching the gorge mouth, the river crossing the axis, and a lake to the east. All inside the paper’s band. Unchanged.'],
    ['m0125', 'match', 'Matches since 13 Nov', 'The Tokomaru terrace puts the shore at the foot of the Tararua from Palmerston North south to Levin. (This panel is my reconstruction, not a published map.)', 'South of the river the sea now reaches the Tararua foothills: the plain between today’s coast and the Tokomaru terrace is younger than the last interglacial, so the sim floods it at 5e. North of the river the sea reaches about Palmerston North’s longitude.'],
    ['m0020', 'match', 'Matches', 'All land. The coast lay far to the west, across what is now the South Taranaki Bight.', 'All land, with the river running on west out of the frame. Unchanged.'],
  ];
  const cmpHtml = CMP.map(([id, cls, tag, paper, sim]) => { const s = SLICES.find(x => x.id === id);
    return `<div class="cmp" id="cmp-${id}"><h3>${esc(s.short)} <span class="tag tag-${cls}">${tag}</span></h3><div class="cmp-grid">
    <figure>${view(s, 'frame', 'Reconstruction on the sim frame, ' + s.date)}<figcaption><b>Reconstruction, on the sim’s frame.</b> ${esc(paper)}</figcaption></figure>
    <figure>${thumbs[id] ? `<img src="${thumbs[id]}" alt="Te Manawa sim terrain export, ${esc(s.short)}" width="560" height="315">` : '<div class="noimg">sim export not embedded</div>'}<figcaption><b>The sim.</b> ${esc(sim)}</figcaption></figure></div></div>`; }).join('\n');

  const sw = (c, t) => `<span class="sw"><i style="background:${c}"></i>${t}</span>`;
  return `<title>North Island Since 4 Ma</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;1,400&family=Space+Grotesk:wght@500;700&display=swap">
<style>
/* Layout: an atlas page. A scaled timeline up top, then one band per date: two maps and their notes. */
:root{--bg:#f1f4f2;--panel:#ffffff;--fg:#17262d;--muted:#58686e;--line:#d3dbd8;--accent:#1c6d86;--warn:#8a5a00;--bad:#a23a22;--good:#2f6b3c;
  --display:'Space Grotesk','Segoe UI',system-ui,sans-serif;--body:Inter,'Segoe UI',system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0f181c;--panel:#16232a;--fg:#e3ecee;--muted:#9aacb2;--line:#2a3b42;--accent:#72c2da;--warn:#e0b25a;--bad:#ef9078;--good:#8fd09c;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0f181c;--panel:#16232a;--fg:#e3ecee;--muted:#9aacb2;--line:#2a3b42;--accent:#72c2da;--warn:#e0b25a;--bad:#ef9078;--good:#8fd09c;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font:15px/1.55 var(--body)}
.wrap{max-width:1200px;margin:0 auto;padding-block:28px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:flex;flex-direction:column;gap:36px}
h1,h2,h3{font-family:var(--display);text-wrap:balance;margin:0;line-height:1.15}
h1{font-size:clamp(28px,4.2vw,44px);font-weight:700;letter-spacing:-.01em}
h2{font-size:clamp(20px,2.4vw,26px);font-weight:700}
h3{font-size:18px;font-weight:700;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
p{margin:0}.lede{max-width:68ch;color:var(--muted);font-size:16px}
.top{display:flex;flex-direction:column;gap:14px}
.eyebrow{font:600 12px/1 var(--body);letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.legend{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:13px;color:var(--muted)}
.sw{display:inline-flex;align-items:center;gap:6px}.sw i{width:16px;height:12px;border-radius:2px;border:1px solid rgba(0,0,0,.25);display:inline-block}
.sw.line i{height:0;border:0;border-top:2px dashed var(--fg);background:none!important}
.tlbox{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:12px;overflow-x:auto}
.timeline{min-width:680px;width:100%;height:auto;display:block}
.tl-axis{stroke:var(--fg);stroke-width:1.2;fill:none}.tl-t{font-size:11.5px;fill:var(--muted)}.tl-n{font-size:12px;fill:var(--fg);font-weight:600}.tl-s{font-size:10.5px;fill:var(--muted)}
.bar-sea{fill:#5d9fb8}.bar-land{fill:#7ea66b}.bar-fire{fill:#c9472b}
.tl-dot{fill:var(--panel);stroke:var(--fg);stroke-width:2}.tl-dot.tl-interp,.tl-dot.tl-recon{stroke:var(--warn)}
.slice{display:flex;flex-direction:column;gap:14px;border-top:2px solid var(--fg);padding-top:14px;scroll-margin-top:12px}
.when{font:700 13px/1 var(--display);letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:6px}
.basis{color:var(--muted);font-size:13px;margin-top:8px}
.tag{font:600 11px/1 var(--body);letter-spacing:.06em;text-transform:uppercase;padding:4px 7px;border-radius:3px;border:1px solid currentColor;white-space:nowrap}
.tag-map,.tag-now,.tag-match{color:var(--good)}.tag-interp,.tag-recon,.tag-check,.tag-close{color:var(--warn)}.tag-differs{color:var(--bad)}
.maps{display:grid;grid-template-columns:.747fr 1fr .8fr;gap:18px;align-items:start}
figure{margin:0;min-width:0}figcaption{font-size:12.5px;color:var(--muted);margin-top:6px}
.map{display:block;width:100%;height:auto;border-radius:4px;border:1px solid var(--line)}
.notes{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:10px;min-width:0}
@media (max-width:980px){.maps{grid-template-columns:.747fr 1fr}.notes{grid-column:1/-1;max-width:68ch}}
@media (max-width:560px){.maps{grid-template-columns:1fr}}
.block{display:flex;flex-direction:column;gap:18px}
.cmp{display:flex;flex-direction:column;gap:10px;padding-top:14px;border-top:1px solid var(--line)}
.cmp-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.cmp-grid img{display:block;width:100%;height:auto;border-radius:4px;border:1px solid var(--line)}
@media (max-width:700px){.cmp-grid{grid-template-columns:1fr}}
.noimg{aspect-ratio:16/9;display:grid;place-items:center;border:1px dashed var(--line);color:var(--muted);border-radius:4px}
ol.recs{margin:0;padding-left:22px;display:flex;flex-direction:column;gap:16px;max-width:76ch}
ol.recs li b{font-family:var(--display);font-size:16px}
code{font:13px/1.4 ui-monospace,Consolas,monospace;background:color-mix(in srgb,var(--fg) 9%,transparent);padding:1px 4px;border-radius:3px;overflow-wrap:anywhere}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:28px}@media (max-width:800px){.cols{grid-template-columns:1fr}}
.cols ul{margin:8px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:8px}
a{color:var(--accent)}a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.small{font-size:13px;color:var(--muted)}
</style>
${defs}
<div class="wrap">
<div class="top">
  <p class="eyebrow">Te Ika-a-Māui · palaeogeography</p>
  <h1>The North Island over four million years</h1>
  <p class="lede">Nine maps of the land, from a deep basin crossed by a finger of rock to the island as it stands. The lower half of the island is drawn larger beside each one, with the Te Manawa frame marked. Four of the nine come straight from published maps; the rest are labelled for what they are.</p>
  <div class="legend">${sw(COL.deep, 'Deep sea, over 200 m')}${sw(COL.shelf, 'Shelf sea, 0–200 m')}${sw(COL.low, 'Coastal lowland: land at low sea level')}${sw(COL.land, 'Land')}${sw(COL.high, 'High ground, about 1,000 m and over')}<span class="sw line"><i></i>Today’s coast</span>${sw(COL.fire, 'Active volcanic centre')}</div>
  <div class="tlbox">${tl}</div>
</div>
${sliceHtml}
<section class="block" id="sim">
  <header><p class="when">Against the sim</p><h2>How Te Manawa draws the same ground</h2><p class="lede" style="margin-top:8px">Each reconstruction is cropped to the sim’s visible frame (about 85 by 48 km on the gorge) and set beside the sim’s own terrain export for that date. The sim is a cartoon and is not to scale north to south, so read these for what is land, what is sea, and where the pieces sit, not for exact outlines.</p></header>
  ${cmpHtml}
</section>
<section class="block" id="changes">
  <header><p class="when">What changed in the sim</p><h2>The suggestions, as built on 13 November 2026</h2><p class="lede" style="margin-top:8px">Each change was scored against these reconstructions cell by cell on the sim’s own map, inside the wall’s frame, and the harness now asserts it. Two findings in the first version of this page were read against sim exports that predated changes made on 3 and 5 November; they were corrected before building.</p></header>
  <ol class="recs">
    <li><b>Give 4 Ma its coastal plain. Built.</b><br>A dated apron of low plain lies between two coasts read off Fig. 4A, from about Feilding to just east of the gorge. It drowns from 3.6 to 3.3 Ma as both coasts sweep in onto the axis (the Young-1 date), leaving the basement finger.</li>
    <li><b>Move the strait onto the southern Ruahine at 3.0 and 2.4 Ma. Built.</b><br>The strait is measured from the gap in kilometres, so it takes the southern Ruahine and the northern Tararua alike, with land about 11 km out at both dates. It closes by shoaling, as before.</li>
    <li><b>Swap which range is the solid one before 2.4 Ma. Built.</b><br>The Tararua’s core stands as low green hills, forest on the crest, until the ranges begin their rise. The Ruahine is low plain at 4 Ma, a low finger at 3 Ma and shoals at 2.4 Ma.</li>
    <li><b>Paint shallow water as shallow. Built.</b><br>The sea before the window is shelf-toned, with deep water only off the south-east at 4 Ma. It hands back to the window’s own sea by 1 Ma.</li>
    <li><b>Check the 125 ka shore south of the river. Built.</b><br>On the wall the gap was real: 1–10 km of plain stayed dry south of the river, depending on the terrain. The plain between today’s coast and the Tokomaru terrace is younger than the last interglacial, so the sim now floods it at the 5e highstand only. The sea reaches the foothills on every terrain tried; no other date moves.</li>
    <li><b>Leave 1 Ma and the ice-age end alone. Kept.</b><br>Neither changed.</li>
    <li><b>Use the island-scale maps for what the frame cannot show. Built.</b><br>An inset of the lower North Island, with the sim’s frame boxed on it, sits beside the intro’s present-day map. It turns from today to 1 Ma (no Cook Strait, which first breaks through about 450,000 years ago) as the map crosses into the live land. The outro shows the ice-age land bridge to Nelson, then today. The development-only sequence before the window shows the island at its date.</li>
  </ol>
</section>
<section class="block" id="method">
  <header><p class="when">Method and limits</p><h2>How these were made, and how far to trust them</h2></header>
  <div class="cols">
    <div><b>Made</b><ul>
      <li>The paper’s four maps (4, 3, 2.4 and 1 Ma), its national 3 Ma map and its Last Glacial Maximum map were lined up with today’s coastline by fitting the modern coast each one carries. The fit is about 1 km.</li>
      <li>Land, coastal lowland, shelf and high ground were sampled from each onto one 600 m grid, then outlined and redrawn in one style.</li>
      <li>1.5 Ma and 450 ka are geometric blends of the maps either side, checked against the dated events in the text. They are not mapped evidence.</li>
      <li>125 ka is today’s coast with the lowlands flooded. Only the Manawatū–Horowhenua shore rests on a dated terrace.</li>
    </ul></div>
    <div><b>Limits</b><ul>
      <li>The paper’s own lines are first-order. Its authors drew them on the modern coastline without undoing up to about 20 km of fault movement, and say details may change.</li>
      <li>Each of the paper’s maps blends high and low sea level. The lowland tone is the band the shore swept across.</li>
      <li>North of 37.7°S the paper’s detailed maps stop. For 4, 3 and 2.4 Ma the north is its national 3 Ma map; for 1 Ma and later it is today’s coast. The Bay of Plenty plains probably did not exist before about 2 Ma.</li>
      <li>High ground on the three youngest maps is sketched by hand.</li>
      <li>These redraw published figures. If they go on public display, credit them “after Trewick & Bland (2012)” and check reuse terms with the publisher.</li>
    </ul></div>
  </div>
  <p class="small"><b>Sources.</b> Trewick & Bland 2012, <a href="https://doi.org/10.1080/03036758.2010.549493">Fire and slice</a>, J. Royal Society of NZ 42: 153–183 (Figs 1, 3, 4; page numbers above are theirs). Rees, Palmer & Palmer 2018, <a href="https://doi.org/10.1080/00288306.2017.1408023">Plio-Pleistocene geology of the lower Pohangina Valley</a>. Milner 2017, <a href="https://openaccess.wgtn.ac.nz/articles/thesis/The_Pliocene-Pleistocene_Development_Uplift_and_Emergence_History_of_the_Manawatu_Strait_New_Zealand/17065340">emergence history of the Manawatū Strait</a> (MSc, VUW). Lewis & Carter 1992, <a href="https://www.searchanddiscovery.com/abstracts/html/1992/international/abstracts/1113c.htm">the opening of Cook Strait</a>. GSNZ 2006 field guide, <a href="https://gsnz.org.nz/assets/Uploads/Shop/Products/GSNZ_annual_conference/MP122_2006_Palmerston_North/MP122B_2006_GSNZ_conference_Palmerston_North_FT1_Manawatu_coastal_plain_geomorph.pdf">Manawatū coastal plain</a>. Clement 2011, <a href="https://mro.massey.ac.nz/handle/10179/2678">Holocene sea level and the lower Manawatū valley</a> (PhD, Massey). Coastline: Natural Earth 1:10m.</p>
</section>
</div>`;
};
