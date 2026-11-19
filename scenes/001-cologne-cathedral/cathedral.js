import {Workshop} from "./masonry.js";
import {interior} from "./interior.js";
import {exterior} from "./exterior.js";
export function buildCologne(card){
  const w=new Workshop();interior(w,card.documented,card.design);exterior(w,card.documented,card.design);
  const building=w.finish();building.name=card.name;return building;
}
