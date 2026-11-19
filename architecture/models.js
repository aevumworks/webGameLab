import {buildCologne} from "../scenes/001-cologne-cathedral/cathedral.js";
import {howl} from "../scenes/003-howls-moving-castle/parameters.js";
import {buildCastle} from "../scenes/003-howls-moving-castle/castle.js";
import {readBuildingCard} from "./read-card.js";
import {giza} from "../scenes/002-egyptian-pyramids/parameters.js";
import {buildKhufu} from "../scenes/002-egyptian-pyramids/pyramid.js";
import {makeSurfaces} from "../scenes/002-egyptian-pyramids/surfaces.js";
export const buildings = {cologne:"科隆大教堂", giza:"埃及金字塔", howl:"哈尔的移动城堡"};
export async function readBuilding(id) {
  if (id === howl.id) return howl;
  if (id === giza.id) return giza;
  if (id === "cologne") return readBuildingCard(id);
  throw new Error("未知建筑 " + id);
}
export function buildBuilding(card) {
  if (card.id === howl.id) return buildCastle(card).root;
  if (card.id === giza.id) return buildKhufu(card,makeSurfaces());
  return buildCologne(card);
}
