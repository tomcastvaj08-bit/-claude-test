// Registr všech modelů Love Bricks.
import { BrickModel, buildHeart } from './models.js';
import { buildOrchid, buildMiniOrchid, buildTulips, buildTinyPlants, buildCactus, buildChrysanthemum, buildPeaceLily, buildPlumBlossom, buildBonsai } from './flowers.js';
import { buildChiron, buildHuracan, buildSian, buildDaytona, buildMcLaren, buildMercedes, buildVisionGT } from './cars.js';

export const BUILDERS = {
  orchid: buildOrchid, miniorchid: buildMiniOrchid, tulips: buildTulips, tinyplants: buildTinyPlants, cactus: buildCactus,
  chrysanthemum: buildChrysanthemum, peacelily: buildPeaceLily, plum: buildPlumBlossom, bonsai: buildBonsai,
  chiron: buildChiron, huracan: buildHuracan, sian: buildSian, daytona: buildDaytona, mclaren: buildMcLaren, mercedes: buildMercedes, visiongt: buildVisionGT,
  heart: buildHeart
};

const defCache = new Map();
export function createModel(id, opts = {}) {
  if (!defCache.has(id)) defCache.set(id, BUILDERS[id]());
  const def = defCache.get(id);
  return new BrickModel(def.pieces, { variants: def.variants, seed: id.length * 13 + 5, ...opts });
}
