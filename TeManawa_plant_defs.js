// ============================================
// PLANT DEFINITIONS
// ============================================
// coldTolerance: 0 = most cold-sensitive (tree ferns), 1 = fully cold-hardy
// (tussock, glacial shrubs). Modulates dormancy chance and the effective
// modifier that drives sprite state, so a glacial produces varied composition
// (tussock thriving, beech holding mature, fern wilting) rather than a
// blanket shift.
const PLANT_TYPES = {
  tussock: { name: "Tussock", nutrition: 25, color: '#8ea040', size: 18, growthTime: 200,
    coldTolerance: 1.0, ashVulnerability: 0.25,
    description: "Hardy grass that covers the high country" },
  flax: { name: "Flax", nutrition: 35, color: '#487020', size: 18, growthTime: 280,
    coldTolerance: 0.7, ashVulnerability: 0.35,
    description: "Harakeke: versatile, with sweet nectar" },
  fern: { name: "Fern", nutrition: 30, color: '#228B22', size: 22, growthTime: 240,
    coldTolerance: 0.1, ashVulnerability: 0.95,
    description: "The iconic Ponga's fronds populate forests" },
  Totara: { name: "Totara", nutrition: 50, color: '#8B0000', size: 40, growthTime: 400,
    coldTolerance: 0.3, ashVulnerability: 0.65,
    description: "Ancient podocarp with bright red fruit" },
  beech: { name: "Beech", nutrition: 40, color: '#8b430f', size: 32, growthTime: 350,
    coldTolerance: 0.6, ashVulnerability: 0.6,
    description: "Tawhai: produces mast seed in good years" },
  kawakawa: { name: "Kawakawa", nutrition: 40, color: '#3d9a5e', size: 11, growthTime: 150,
    coldTolerance: 0.15, ashVulnerability: 0.85,
    description: "Heart-shaped leaves with peppery fruit" },
  patotara: { name: "Patotara", nutrition: 35, color: '#c94c5a', size: 14, growthTime: 160,
    coldTolerance: 0.8, ashVulnerability: 0.3,
    description: "Alpine shrub with summer berries" },

  // --- Glacial / open-country shrubland. coprosma + dracophyllum are now SPRITED and placed in the
  //     scaffold (grassland/subalpine/wetland). matagouri stays a defined-but-unplaced spare: it is a
  //     South-Island dryland shrub, rare in the North Island and NOT in the Manawatū glacial record
  //     (which is Coprosma/Muehlenbeckia/Myrsine/Veronica/Dracophyllum); see TEMANAWA_ECOLOGY_OPEN.md.
  // coprosma is the code key for a VISUAL GREY-SCRUB UMBRELLA: its variant sprites are the grey-scrub
  // taxa (coprosma, pōhuehue/Muehlenbeckia, …) under sprites/Shrub/.
  coprosma: { name: "Shrubs", nutrition: 30, color: '#5c7d3e', size: 18, growthTime: 190,
    coldTolerance: 0.85, ashVulnerability: 0.3,
    description: "Grey scrub: divaricating coprosma, pōhuehue and kin; hardy browse of dry, frosty open ground" },
  dracophyllum: { name: "Dracophyllum", nutrition: 28, color: '#9a7b4f', size: 22, growthTime: 250,
    coldTolerance: 0.9, ashVulnerability: 0.3,
    description: "Inaka grass-tree of the cold subalpine tops" },
  matagouri: { name: "Matagouri", nutrition: 26, color: '#7a6f4a', size: 12, growthTime: 210,
    coldTolerance: 0.95, ashVulnerability: 0.25,
    description: "Tūmatakuru: thorny shrub of the glacial outwash flats (South-Island; unplaced spare)" },

  // --- Favoured, browse-resistant plants (planted via the palette) ---
  lancewood: { name: "Juvenile Lancewood", nutrition: 34, color: '#6a5a33', size: 15, growthTime: 300,
    coldTolerance: 0.5, ashVulnerability: 0.35,
    description: "Horoeka: tough and spiky when growing." },
  speargrass: { name: "Speargrass", nutrition: 30, color: '#8f9a55', size: 13, growthTime: 260,
    coldTolerance: 0.85, ashVulnerability: 0.2,
    description: "Taramea: spiny herb of the hills" },

  // Kōwhai (Sophora): small flowering lowland/riparian tree, spreads into the
  // podocarp margin. coldTolerance 0.45 (< warmMax) makes it a warm, kererū-
  // dispersable type, so it recruits in the interglacial. Not in FOREST_TREES,
  // so the forest-band contraction does not suppress it. Single-asset art for
  // now; the flowering (spring gold) state comes with its own frame later.
  kowhai: { name: "Kōwhai", nutrition: 38, color: '#cba33c', size: 30, growthTime: 300,
    coldTolerance: 0.45, ashVulnerability: 0.7,
    description: "Kōwhai: spring-gold flowers, a lowland nectar tree" },

  // --- Dedicated-folder species (single-asset art). Habitats set in the level
  //     scaffold biomes; coldTolerance vs warmMax(0.65)/coldMin(0.75) decides
  //     which growth button matures them and whether kererū disperse them. ---

  // Kahikatea (Dacrycarpus): the tallest NZ tree, wet lowland podocarp forest, and the swamp-forest
  // DISTURBANCE COLONISER (wetland doc §4.1): NOT a climax tree, it recruits on the raw wet alluvium
  // a moving river exposes, and a stand with no fresh disturbance AGES OUT. `disturbanceRecruit:true`
  // takes it out of the free recruitment paths (kererū dispersal / the FOREST button): it establishes
  // only via a river disturbance (storm flood, eruption sediment pulse, the deep-time channel shift);
  // Plant.update ages it and it senesces without renewal. Warm canopy (coldTolerance 0.35), in FOREST_TREES.
  kahikatea: { name: "Kahikatea", nutrition: 48, color: '#556b3d', size: 28, growthTime: 420,
    coldTolerance: 0.35, ashVulnerability: 0.75, disturbanceRecruit: true,
    description: "Kahikatea: the tallest tree, of wet lowland forest, colonises raw river alluvium" },

  // Nīkau (Rhopalostylis): the world's southernmost palm; frost-tender lowland
  // forest. Low coldTolerance 0.2 sinks it hard in glacials (its range collapse);
  // warm, so kererū carry its red fruit. Understory, not FOREST_TREES.
  nikau: { name: "Nīkau", nutrition: 40, color: '#3f7d42', size: 16, growthTime: 380,
    coldTolerance: 0.2, ashVulnerability: 0.9,
    description: "Nīkau: the world's southernmost palm, red-fruited" },

  // Tawa (Beilschmiedia): broadleaf canopy of lowland-to-montane forest, and the
  // classic large-fruited tree kererū disperse. Warm canopy (0.4), in FOREST_TREES.
  tawa: { name: "Tawa", nutrition: 45, color: '#3d5f36', size: 30, growthTime: 400,
    coldTolerance: 0.4, ashVulnerability: 0.8,
    description: "Tawa: broadleaf canopy whose plum fruit needs kererū" },

  // Mānuka (Leptospermum): hardy light-demanding pioneer scrub, lowland to
  // subalpine. coldTolerance 0.7 is NEUTRAL to both growth buttons (like flax):
  // a pioneer, neither climax forest nor alpine tussock. Not in FOREST_TREES.
  manuka: { name: "Mānuka", nutrition: 22, color: '#6a7b4a', size: 32, growthTime: 180,
    coldTolerance: 0.7, ashVulnerability: 0.4,
    description: "Mānuka: hardy pioneer scrub with white tea-tree flowers" },

  // Tī kōuka / cabbage tree (Cordyline): open, damp lowland and wetland margins;
  // hardy and frost-tolerant but light-demanding, so open country not closed
  // forest. Warm-hardy 0.6; bird-dispersed. Not in FOREST_TREES.
  cabbagetree: { name: "Tī Kōuka", nutrition: 32, color: '#7a8a4e', size: 26, growthTime: 260,
    coldTolerance: 0.6, ashVulnerability: 0.5,
    description: "Tī kōuka: the cabbage tree of open, wet ground" }
};
