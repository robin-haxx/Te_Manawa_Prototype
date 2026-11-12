// ============================================================
// North Island palaeogeography, 4 Ma -> today: the map series.
// ------------------------------------------------------------
//   node research/palaeogeography/build_maps.js [out.html] [simthumbs.json]
//
// Reads slices.json (land / lowland / shelf / high-ground outlines per date, in km on an
// NZTM2000 grid) and writes:
//   svg/north_island_<date>.svg        the whole island
//   svg/lower_north_island_<date>.svg  the lower North Island, larger
//   out.html (optional)                the page that shows the series and the sim comparison
//
// Where slices.json came from (2026-11-12): the four maps of Trewick & Bland (2012) Fig. 4
// (4, 3, 2.4, 1 Ma), their national 3 Ma map (Fig. 1) and their Last Glacial Maximum map (Fig. 3)
// were registered to today's coastline (Natural Earth 1:10m, NZTM2000; fit ~1 km), sampled onto one
// 600 m grid, and outlined. 1.5 Ma and 0.45 Ma are distance-field interpolations between their
// neighbours; 125 ka is today's coast with the lowlands flooded to the last-interglacial shore.
// Reference only: this is not read by the sim.
// ============================================================
const fs = require('fs'), path = require('path');
const DIR = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(DIR, 'slices.json'), 'utf8'));
const G = data.grid;

function nztm(lon, lat) {
  const a = 6378137, f = 1 / 298.257222101, k0 = 0.9996, lon0 = 173 * Math.PI / 180, FE = 1600000, FN = 10000000;
  const e2 = 2 * f - f * f, ep2 = e2 / (1 - e2), phi = lat * Math.PI / 180, lam = lon * Math.PI / 180;
  const A0 = 1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256, A2 = 3 / 8 * (e2 + e2 * e2 / 4 + 15 * e2 ** 3 / 128), A4 = 15 / 256 * (e2 * e2 + 3 * e2 ** 3 / 4), A6 = 35 * e2 ** 3 / 3072;
  const m = a * (A0 * phi - A2 * Math.sin(2 * phi) + A4 * Math.sin(4 * phi) - A6 * Math.sin(6 * phi));
  const s = Math.sin(phi), c = Math.cos(phi), t = Math.tan(phi), nu = a / Math.sqrt(1 - e2 * s * s), psi = 1 + ep2 * c * c, w = lam - lon0;
  const E = FE + k0 * nu * w * c * (1 + w * w / 6 * c * c * (psi - t * t));
  const N = FN + k0 * (m + nu * s * w * w / 2 * c + nu * s * w ** 4 / 24 * c ** 3 * (4 * psi * psi + psi - t * t));
  return [E, N];
}
const km = (lon, lat) => { const [E, N] = nztm(lon, lat); return [(E - G.E0) / 1000, (G.N1 - N) / 1000]; };
const f1 = (v) => (Math.round(v * 10) / 10).toString();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---- views (km on the grid) -------------------------------------------------
const GORGE = [175.80, -40.31];
const fc = km(175.83, -40.33);
const VIEWS = {
  island: { x: 40, y: 6, w: 628, h: 862, font: 19, name: 'north_island', bar: 100 },
  lower: { x: 215, y: 538, w: 322, h: 330, font: 7.2, name: 'lower_north_island', bar: 50 },
  frame: { x: fc[0] - 42.5, y: fc[1] - 24, w: 85, h: 48, font: 2.6, name: 'frame', bar: 10 }
};
const COL = { deep: '#2c5d7a', shelf: '#86b6c9', low: '#dccb96', land: '#7ea66b', high: '#f0ede3', ink: '#17262d', river: '#2f6e93', fire: '#c9472b' };

// ---- shared furniture -------------------------------------------------------
const TOWNS = [ // today's places, for orientation only
  ['Whanganui', 175.05, -39.93, 'il'], ['Palmerston North', 175.61, -40.355, 'l'], ['Wellington', 174.78, -41.29, 'il'],
  ['Napier', 176.91, -39.49, 'il'], ['Masterton', 175.66, -40.95, 'l'], ['New Plymouth', 174.08, -39.06, 'il'],
  ['Taupō', 176.07, -38.69, 'i'], ['Auckland', 174.76, -36.85, 'i'], ['Gisborne', 178.02, -38.66, 'i'],
  ['Tauranga', 176.17, -37.69, 'i'], ['Whangārei', 174.32, -35.73, 'i'], ['Nelson', 173.28, -41.27, 'il'],
  ['Levin', 175.28, -40.62, 'l']
];
const FRAME_TOWNS = [['Palmerston North', 175.61, -40.355], ['Feilding', 175.57, -40.22], ['Woodville', 175.87, -40.34], ['Dannevirke', 176.10, -40.21], ['Pahiatua', 175.84, -40.45], ['Foxton', 175.29, -40.47]];
const RIVERS = {
  manawatu: [[175.22, -40.47], [175.33, -40.48], [175.45, -40.43], [175.55, -40.40], [175.62, -40.37], [175.72, -40.33], [175.80, -40.31], [175.89, -40.36], [176.00, -40.33], [176.08, -40.25], [176.20, -40.12], [176.30, -40.00]],
  rangitikei: [[175.22, -40.30], [175.40, -40.17], [175.55, -39.95], [175.75, -39.75], [175.95, -39.55]],
  whanganui: [[175.00, -39.95], [175.10, -39.80], [175.05, -39.50], [175.20, -39.20], [175.30, -38.95]],
  ruamahanga: [[175.23, -41.38], [175.45, -41.20], [175.60, -41.00], [175.66, -40.80]]
};
const TAUPO = [[175.70, -38.72], [175.95, -38.68], [176.08, -38.78], [176.05, -38.95], [175.90, -39.00], [175.75, -38.95], [175.67, -38.85]];
const V = { // volcanic centres [name, lon, lat]
  coromandel: ['Coromandel arc', 175.75, -37.05], kaimai: ['Tauranga–Kaimai', 175.95, -37.72], karioi: ['Karioi', 174.80, -37.86],
  pirongia: ['Pirongia', 175.10, -37.99], mangakino: ['Mangakino', 175.75, -38.40], paritutu: ['Paritutu', 174.03, -39.06],
  kaitake: ['Kaitake', 173.96, -39.16], hauhungatahi: ['Hauhungatahi', 175.44, -39.23], whakamaru: ['Whakamaru', 175.95, -38.48],
  taranaki: ['Taranaki', 174.063, -39.296], ruapehu: ['Ruapehu', 175.57, -39.28], tongariro: ['Tongariro', 175.64, -39.13],
  taupo: ['Ōruanui (Taupō)', 175.90, -38.82], okataina: ['Okataina', 176.50, -38.17]
};

// label: [text, lon, lat, class, rot, views]  class: s = sea (italic, light), S = big sea name, l = land, n = note
const SLICES = [
  { id: 'm4000', ma: 4.0, date: '4 million years ago', short: '4.0 Ma', title: 'A deep basin and a low finger of land',
    basis: 'map', basisText: 'Trewick & Bland 2012, Fig. 4A. North of 37.7°S from their national 3 Ma map.',
    volc: ['coromandel'], rivers: [], taupo: false,
    labels: [['WHANGANUI BASIN', 174.55, -39.72, 'S', 0, 'l'], ['WHANGANUI BASIN', 173.6, -39.75, 'S', 0, 'i'], ['deep sea, 200–600 m', 174.55, -39.87, 's', 0, 'l'],
      ['Kuripapango Strait', 176.02, -39.47, 's', -18, 'l'], ['Ruataniwha Strait', 176.42, -40.02, 's', -56, 'l'],
      ['low basement finger', 175.52, -40.74, 'l', -50, 'l'], ['Marlborough ranges', 174.02, -41.2, 'l', -58, 'l'],
      ['Kaimanawa', 176.05, -39.05, 'l', 0, 'l'], ['shoals and islets', 176.95, -40.25, 'n', -58, 'l'], ['old North Island', 175.6, -38.3, 'l', 0, 'i']],
    notes: ['The Whanganui Basin has just dropped. Since about 4.8 Ma the Whanganui–Manawatū area has sunk under 200–600 m of water (p. 160).',
      'The line of the future Ruahine and Tararua ranges is a low, continuous finger of worn basement rock, joined to Marlborough in the south. No seaway crosses the Manawatū Gorge area. West of the gorge the land ran at least as far as the Young-1 drillhole near Feilding: the sea did not cover that ground until about 3.6 Ma (p. 170).',
      'The Kuripapango Strait, 50–100 m deep, cuts across the site of the Kaweka Range.',
      'Wellington belongs to the southern land. Marlborough’s mountains stand higher than today, perhaps 1,700 m.'] },
  { id: 'm3000', ma: 3.0, date: '3 million years ago', short: '3.0 Ma', title: 'The Manawatū Strait opens',
    basis: 'map', basisText: 'Trewick & Bland 2012, Fig. 4B. North of 37.7°S from their national 3 Ma map (Fig. 1).',
    volc: ['kaimai'], rivers: [], taupo: false,
    labels: [['WHANGANUI BASIN', 174.6, -39.6, 'S', 0, 'l'], ['WHANGANUI BASIN', 173.6, -39.6, 'S', 0, 'i'], ['Manawatū Strait', 175.36, -40.12, 's', 30, 'l'],
      ['Ruataniwha Strait', 176.42, -40.05, 's', -56, 'l'], ['Ruahine finger', 176.12, -39.72, 'l', -66, 'l'],
      ['Tararua peninsula', 175.28, -40.88, 'l', -42, 'l'], ['proto-Kaimanawa', 176.0, -39.12, 'l', 0, 'l'],
      ['shell-bank islands', 176.98, -40.2, 'n', -58, 'l'], ['King Country rising', 175.2, -38.55, 'l', 0, 'i']],
    notes: ['The Kuripapango Strait has closed. The sea first broke across the gorge area in the late Waipipian, about 3.3 Ma. By 3 Ma a narrow seaway separates a low Tararua peninsula from a finger of low land and shoals over the Ruahine (p. 163).',
      'East of the axis the Ruataniwha Strait runs from Wairarapa to Hawke’s Bay, with an archipelago of small islands and shell banks along its outer side.',
      'Most of the Manawatū is shelf sea, 0–200 m deep. The basin off Whanganui is 200–400 m deep.',
      'Between 3.0 and 2.4 Ma the gorge area was land again and being worn down (p. 165). That closure is not drawn as its own map.'] },
  { id: 'm2400', ma: 2.4, date: '2.4 million years ago', short: '2.4 Ma', title: 'The strait at its widest',
    basis: 'map', basisText: 'Trewick & Bland 2012, Fig. 4C. North of 37.7°S from their national 3 Ma map.',
    volc: ['karioi', 'pirongia', 'kaimai'], rivers: [], taupo: false,
    labels: [['MANAWATŪ STRAIT', 175.25, -39.97, 'S', 0, 'l'], ['shallow shelf sea', 175.25, -40.08, 's', 0, 'l'], ['Manawatū Strait', 175.0, -40.05, 's', 0, 'i'],
      ['Ruataniwha Strait', 176.5, -40.3, 's', -56, 'l'], ['greywacke shoals', 176.3, -39.82, 'n', -72, 'l'],
      ['Tararua peninsula', 175.42, -40.82, 'l', -42, 'l'], ['proto-Kaimanawa', 176.2, -39.08, 'l', -22, 'l'],
      ['Whanganui Basin', 174.4, -39.4, 's', 0, 'l'], ['Whanganui Basin', 173.5, -39.6, 's', 0, 'i']],
    notes: ['The Ruahine area is under the sea as a narrow, shallow sill. A seaway crosses the site of the southern Ruahine and northern Tararua at shallow shelf depths and separates a northern land from a southern one (p. 165).',
      'The paper’s text says the strait was under 20 km wide on the outcrop evidence (p. 170). Its map leaves about 30 km of open water between the tip of the Tararua peninsula and the nearest Ruahine shoal. Both readings are shown honestly here: the map is drawn, the text is quoted.',
      'The northern coast runs east–west near 39.8°S. South of it lie shoals that dried at low sea level.',
      'Karioi and Pirongia are active volcanoes in western Waikato (2.74–1.6 Ma).'] },
  { id: 'm1500', ma: 1.5, date: '1.5 million years ago', short: '1.5 Ma', title: 'The strait closes and the east fills',
    basis: 'interp', basisText: 'Interpolated between the 2.4 Ma and 1 Ma maps. No published map exists for this date.',
    volc: ['mangakino', 'paritutu'], rivers: [], taupo: false,
    labels: [['strait closing from 1.63 Ma', 175.5, -40.03, 'n', 0, 'l'], ['Mount Bruce uplift', 175.95, -40.74, 'n', 0, 'l'],
      ['Whanganui Basin', 174.2, -39.9, 's', 0, 'il'], ['shelf to marginal sea', 174.75, -40.3, 's', -50, 'l'], ['Hawke’s Bay still partly sea', 177.1, -39.95, 's', -58, 'l'],
      ['Kaimanawa', 176.1, -39.12, 'l', -22, 'l']],
    notes: ['The Manawatū Strait began to close in the early Castlecliffian, about 1.63 Ma: shallow-marine beds give way to river and estuary deposits (Rees, Palmer & Palmer 2018).',
      'By about 1.5 Ma uplift of the Mount Bruce block had closed the Ruataniwha Strait at its southern end and set the divide between the Manawatū and Ruamāhanga rivers (p. 166).',
      'Most of the Whanganui–Manawatū area is shelf to marginal-marine. The basin’s deepest part steps 50 km south.',
      'Rhyolitic eruptions have begun at Mangakino (from about 1.7 Ma). The Paritutu and Sugar Loaf volcanoes stand as islands off the future Taranaki.'] },
  { id: 'm1000', ma: 1.0, date: '1 million years ago', short: '1.0 Ma', title: 'One island, and the ranges begin',
    basis: 'map', basisText: 'Trewick & Bland 2012, Fig. 4D. North of 37.7°S is today’s coast (the paper’s map stops there).',
    volc: ['mangakino', 'paritutu'], rivers: ['manawatu'], taupo: false,
    labels: [['proto-Ruahine', 176.2, -39.82, 'l', -66, 'l'], ['proto-Tararua', 175.52, -40.75, 'l', -48, 'l'], ['Kaimanawa', 176.05, -39.2, 'l', -22, 'l'],
      ['land at low sea level,', 175.2, -40.13, 'n', 0, 'l'], ['shallow sea at high', 175.2, -40.21, 'n', 0, 'l'],
      ['isthmus', 174.42, -41.33, 'n', 0, 'l'], ['Whanganui Basin', 174.45, -40.5, 's', 0, 'l'], ['Whanganui Basin', 173.5, -40.0, 's', 0, 'i'], ['Hawke’s Bay plain', 176.75, -39.85, 'n', -40, 'l'],
      ['no Cook Strait', 174.2, -41.05, 'n', 0, 'i']],
    notes: ['The northern land and the Wellington–Marlborough land are joined, possibly as one large island with a low, narrow isthmus at Wellington (p. 168). There is no Cook Strait.',
      'Rapid uplift of the Ruahine and Tararua ranges starts about now. The Manawatū River, already turned west, keeps its course across the rising axis and cuts the gorge. A lake ponds for a time east of the gorge (p. 167).',
      'The Whanganui–Manawatū lowland is a swing band: land at low sea level, estuaries and shallow sea at high. The basin’s deepest part lies off Levin and Foxton.',
      'Much of Hawke’s Bay is land. Mangakino ignimbrites still cross the line of the ranges to reach it. The Taranaki peninsula does not exist.'] },
  { id: 'm0450', ma: 0.45, date: '450,000 years ago', short: '450 ka', title: 'Cook Strait breaks through',
    basis: 'interp', basisText: 'Interpolated between the 1 Ma map and today’s coast. The breach date is from Lewis & Carter (1992, 1994).',
    volc: ['kaitake', 'hauhungatahi', 'whakamaru'], rivers: ['manawatu', 'rangitikei', 'whanganui'], taupo: false,
    labels: [['Cook Strait', 174.45, -41.12, 's', -50, 'il'], ['Ruahine', 176.2, -39.82, 'l', -66, 'l'], ['Tararua', 175.5, -40.78, 'l', -48, 'l'],
      ['terraces stepping seaward', 174.55, -39.85, 'n', -30, 'l'], ['South Taranaki Bight', 174.45, -40.45, 's', 0, 'l']],
    notes: ['The barrier between Wellington and Marlborough was first breached in a rising sea about 450,000 years ago, and tides then scoured the strait. It dried again at later ice-age low sea levels (Lewis & Carter).',
      'The Whanganui Basin turned from sinking to rising about 1 Ma. A flight of marine terraces records the coast stepping seaward since, the oldest about 680,000 years old.',
      'The Ruahine and Tararua are well up but not yet at full height. Hauhungatahi (about 800 ka) is the oldest volcano of the Tongariro centre. Kaitake (about 500 ka) begins the Taranaki peninsula. The Whakamaru ignimbrites follow at about 340 ka.'] },
  { id: 'm0125', ma: 0.125, date: '125,000 years ago', short: '125 ka', title: 'Last interglacial: a high sea',
    basis: 'recon', basisText: 'Today’s coast with lowlands flooded to the last-interglacial shore. Manawatū from the Tokomaru terrace; other embayments schematic.',
    volc: ['taranaki', 'ruapehu', 'tongariro'], rivers: ['manawatu', 'rangitikei', 'whanganui', 'ruamahanga'], riverFrom: { manawatu: 4, rangitikei: 1, ruamahanga: 1 }, taupo: false,
    labels: [['Cook Strait', 174.45, -41.12, 's', -50, 'il'], ['sea to the foot', 175.02, -40.36, 's', 0, 'l'], ['of the Tararua', 175.02, -40.45, 's', 0, 'l'],
      ['Ruahine', 176.2, -39.82, 'l', -66, 'l'], ['Tararua', 175.5, -40.78, 'l', -48, 'l'], ['Kaimanawa', 176.05, -39.2, 'l', -22, 'l']],
    notes: ['Sea level stood a few metres above today’s. In Manawatū and Horowhenua the sea reached the foot of the Tararua. Its sands (the Ōtaki Formation) and its bench (the Tokomaru Marine Terrace) now stand about 30 m up near Levin and about 90 m up near Palmerston North, lifted since.',
      'The other embayments drawn here (Hauraki, Heretaunga, Wairarapa, Rangitāiki, Poverty Bay) are schematic, placed by analogy with the better-known flooding of about 7,000 years ago.',
      'Taranaki has begun to erupt (from about 130 ka). Ruapehu (245 ka) and Tongariro (275 ka) stand on the plateau.'] },
  { id: 'm0020', ma: 0.02, date: '20,000 years ago', short: '20 ka', title: 'Ice-age low sea: the islands joined',
    basis: 'map', basisText: 'Trewick & Bland 2012, Fig. 3 (after Alloway et al. 2007): the shore at today’s 120 m depth contour.',
    volc: ['taupo', 'taranaki', 'ruapehu'], rivers: ['manawatu', 'rangitikei', 'whanganui', 'ruamahanga'], taupo: true,
    labels: [['land bridge', 174.2, -40.62, 'n', 0, 'l'], ['land bridge', 173.6, -40.5, 'n', 0, 'i'], ['Cook Strait bay', 174.3, -40.93, 'n', 0, 'l'], ['exposed shelf plain', 174.3, -39.95, 'n', -40, 'l'],
      ['Ruahine', 176.2, -39.82, 'l', -66, 'l'], ['Tararua', 175.5, -40.78, 'l', -48, 'l'], ['Hawke Bay plain', 177.12, -39.72, 'n', -58, 'l']],
    notes: ['With the sea about 120 m lower, the North and South Islands were joined across what is now the South Taranaki Bight. Cook Strait was a bay open to the south-east. Tidal channels may have persisted through the bridge (p. 173).',
      'The Manawatū’s rivers ran on across a plain where the bight is now. Hawke Bay and the Hauraki Gulf were dry land.',
      'The Ōruanui eruption of about 25,500 years ago had just formed Lake Taupō. The strait reopened about 15,000 years ago as the sea rose.'] },
  { id: 'm0000', ma: 0, date: 'Today', short: 'Today', title: 'The island as it stands',
    basis: 'now', basisText: 'Natural Earth 1:10m coastline. Shelf from the 120 m contour of Fig. 3. High ground sketched.',
    volc: ['taranaki', 'ruapehu', 'tongariro', 'okataina'], rivers: ['manawatu', 'rangitikei', 'whanganui', 'ruamahanga'], taupo: true,
    labels: [['Cook Strait', 174.45, -41.12, 's', -50, 'il'], ['South Taranaki Bight', 174.45, -40.4, 's', 0, 'l'], ['Hawke Bay', 177.2, -39.4, 's', 0, 'l'], ['Hawke Bay', 177.55, -39.3, 's', 0, 'i'],
      ['Ruahine', 176.2, -39.82, 'l', -66, 'l'], ['Tararua', 175.5, -40.78, 'l', -48, 'l'], ['Kaimanawa', 176.05, -39.2, 'l', -22, 'l'], ['Bay of Plenty', 176.9, -37.55, 's', 0, 'i']],
    notes: ['The sea reached its present level about 7,500 years ago. It ran up the lower Manawatū valley as an estuary as far as Ōpiki, which the river then filled in; the dune country built out along the coast.',
      'About a third of the old Whanganui Basin is now land. The basin is still sinking at its southern end, where the Marlborough Sounds are drowned valleys.'] }
];

// ---- drawing ----------------------------------------------------------------
function baseLayers(id) {
  const s = data.slices[id];
  return `<path d="${s[1]}" fill="${COL.shelf}" fill-rule="evenodd"/>` +
    `<path d="${s[2]}" fill="${COL.low}" fill-rule="evenodd"/>` +
    `<path d="${s[3]}" fill="${COL.land}" fill-rule="evenodd" stroke="#4d7343" stroke-width="0.35" stroke-linejoin="round"/>` +
    `<path d="${s[4]}" fill="${COL.high}" fill-rule="evenodd"/>`;
}
function poly(ptsLL) { return 'M' + ptsLL.map(p => km(p[0], p[1]).map(f1).join(' ')).join('L'); }

function overlay(sl, viewKey, ref) {
  const v = VIEWS[viewKey], F = v.font, o = [];
  const tag = viewKey === 'island' ? 'i' : 'l';
  const halo = (dark) => `paint-order="stroke" stroke="${dark ? 'rgba(23,38,45,.55)' : 'rgba(255,255,255,.75)'}" stroke-width="${f1(F * 0.28)}" stroke-linejoin="round"`;
  // today's coast as a ghost line
  if (sl.id !== 'm0000') o.push((ref ? `<use href="#coast"` : `<path d="${data.coast}"`) + ` fill="none" stroke="${COL.ink}" stroke-opacity="0.5" stroke-width="${f1(F * 0.05)}" stroke-dasharray="${f1(F * 0.22)} ${f1(F * 0.16)}"/>`);
  if (sl.taupo) o.push(`<path d="${poly(TAUPO)}Z" fill="${COL.shelf}" stroke="#4d7343" stroke-width="0.3"/>`);
  for (const r of sl.rivers) { if (viewKey === 'island' && r !== 'manawatu') continue; const from = (sl.riverFrom && sl.riverFrom[r]) || 0; o.push(`<path d="${poly(RIVERS[r].slice(from))}" fill="none" stroke="${COL.river}" stroke-width="${f1(F * (r === 'manawatu' ? 0.2 : 0.13))}" stroke-linecap="round" stroke-linejoin="round"/>`); }
  // the sim's frame
  if (viewKey !== 'frame') { const fr = VIEWS.frame; o.push(`<rect x="${f1(fr.x)}" y="${f1(fr.y)}" width="${fr.w}" height="${fr.h}" fill="none" stroke="#fff" stroke-width="${f1(F * 0.2)}"/><rect x="${f1(fr.x)}" y="${f1(fr.y)}" width="${fr.w}" height="${fr.h}" fill="none" stroke="${COL.ink}" stroke-width="${f1(F * 0.09)}" stroke-dasharray="${f1(F * 0.4)} ${f1(F * 0.25)}"/>`); }
  // volcanoes
  for (const k of sl.volc) { const [nm, lo, la] = V[k], [x, y] = km(lo, la), r = F * 0.55; if (viewKey === 'frame') continue;
    if (x < v.x || x > v.x + v.w || y < v.y || y > v.y + v.h) continue;
    o.push(`<path d="M${f1(x)} ${f1(y - r)}L${f1(x + r * 0.9)} ${f1(y + r * 0.7)}L${f1(x - r * 0.9)} ${f1(y + r * 0.7)}Z" fill="${COL.fire}" stroke="#fff" stroke-width="${f1(F * 0.07)}"/>`);
    o.push(`<text x="${f1(x + r * 1.2)}" y="${f1(y + r * 0.6)}" font-size="${f1(F * 0.8)}" fill="#7d2412" font-weight="600" ${halo(false)}>${esc(nm)}</text>`); }
  // towns
  const towns = viewKey === 'frame' ? FRAME_TOWNS.map(t => [t[0], t[1], t[2], 'f']) : TOWNS;
  for (const [nm, lo, la, vw] of towns) { if (viewKey !== 'frame' && !vw.includes(tag)) continue; const [x, y] = km(lo, la);
    o.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(F * 0.13)}" fill="#fff" stroke="${COL.ink}" stroke-width="${f1(F * 0.07)}"/>`);
    o.push(`<text x="${f1(x + F * 0.3)}" y="${f1(y + F * 0.28)}" font-size="${f1(F * 0.74)}" fill="${COL.ink}" fill-opacity="0.82" ${halo(false)}>${esc(nm)}</text>`); }
  // the gorge
  if (viewKey !== 'island') { const [x, y] = km(GORGE[0], GORGE[1]), r = F * 0.3; o.push(`<path d="M${f1(x)} ${f1(y - r)}L${f1(x + r)} ${f1(y)}L${f1(x)} ${f1(y + r)}L${f1(x - r)} ${f1(y)}Z" fill="${COL.ink}" stroke="#fff" stroke-width="${f1(F * 0.07)}"/>`);
    if (viewKey === 'frame') o.push(`<text x="${f1(x + F * 0.45)}" y="${f1(y - F * 0.3)}" font-size="${f1(F * 0.74)}" fill="${COL.ink}" font-weight="600" ${halo(false)}>gorge</text>`); }
  // labels
  if (viewKey !== 'frame') for (const [t, lo, la, cls, rot, vw] of sl.labels) { if (!vw.includes(tag)) continue; const [x, y] = km(lo, la);
    const st = cls === 'S' ? `font-size="${f1(F * 1.25)}" fill="#f3f8fa" font-style="italic" letter-spacing="${f1(F * 0.14)}" ${halo(true)}`
      : cls === 's' ? `font-size="${f1(F * 0.92)}" fill="#f3f8fa" font-style="italic" ${halo(true)}`
      : cls === 'l' ? `font-size="${f1(F)}" fill="#1d3318" font-weight="600" letter-spacing="${f1(F * 0.05)}" ${halo(false)}`
      : `font-size="${f1(F * 0.82)}" fill="${COL.ink}" font-style="italic" ${halo(false)}`;
    o.push(`<text x="${f1(x)}" y="${f1(y)}" text-anchor="middle" ${st}${rot ? ` transform="rotate(${rot} ${f1(x)} ${f1(y)})"` : ''}>${esc(t)}</text>`); }
  // scale bar
  { const bx = v.x + v.w * 0.04, by = v.y + v.h - F * 1.1; o.push(`<path d="M${f1(bx)} ${f1(by)}h${v.bar}" stroke="#fff" stroke-width="${f1(F * 0.34)}"/><path d="M${f1(bx)} ${f1(by)}h${v.bar}" stroke="${COL.ink}" stroke-width="${f1(F * 0.16)}"/><text x="${f1(bx + v.bar + F * 0.4)}" y="${f1(by + F * 0.3)}" font-size="${f1(F * 0.8)}" fill="#f3f8fa" ${halo(true)}>${v.bar} km</text>`); }
  return o.join('');
}
const FONT = `font-family="Inter, 'Segoe UI', system-ui, sans-serif"`;
function standalone(sl, viewKey) {
  const v = VIEWS[viewKey];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(v.x)} ${f1(v.y)} ${v.w} ${v.h}" width="${Math.round(v.w * (viewKey === 'island' ? 1.6 : 3.4))}" ${FONT}>` +
    `<title>${esc(sl.date)}: ${esc(sl.title)}</title><rect x="${f1(v.x)}" y="${f1(v.y)}" width="${v.w}" height="${v.h}" fill="${COL.deep}"/>` + baseLayers(sl.id) + overlay(sl, viewKey) + `</svg>`;
}

fs.mkdirSync(path.join(DIR, 'svg'), { recursive: true });
for (const sl of SLICES) for (const vk of ['island', 'lower']) {
  const stamp = sl.ma >= 1 ? Math.round(sl.ma * 1000) + 'ka' : sl.ma === 0 ? 'today' : Math.round(sl.ma * 1000) + 'ka';
  fs.writeFileSync(path.join(DIR, 'svg', `${VIEWS[vk].name}_${String(SLICES.indexOf(sl) + 1).padStart(2, '0')}_${stamp}.svg`), standalone(sl, vk));
}
console.log('wrote', SLICES.length * 2, 'SVGs to', path.join(DIR, 'svg'));

// ---- the page ---------------------------------------------------------------
const outHtml = process.argv[2];
if (outHtml) {
  const thumbs = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : {};
  const page = require('./page.js');
  fs.writeFileSync(outHtml, page({ SLICES, VIEWS, COL, data, baseLayers, overlay, thumbs, f1, esc }));
  console.log('wrote', outHtml, (fs.statSync(outHtml).size / 1024).toFixed(0) + ' KB');
}
