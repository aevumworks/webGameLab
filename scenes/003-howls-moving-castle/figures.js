import {T,TAU,Kit,Surface,lathe,random,pick} from "./atelier.js";

export const hatBrim=lathe("hat",[[0,.01],[.77,.01],[1,.07],[.98,.13],[.63,.12],[.55,.21],[.52,.49],[.44,.58],[0,.60]],26);
const skirt=lathe("skirt",[[.64,0],[.71,.10],[.61,.31],[.48,.71],[.38,.93],[.40,1.0]],18);
function eyePair(k,x,y,z,sep=.075,r=.022){
  for(const s of [-1,1])k.ball(x+s*sep,y,z,r,r*1.3,r*.57,0x373735);
}
export function turnip(k){
  k.post(0,.95,0,.069,1.90,0x705539,"wood");
  k.put(skirt,[0,.98,0],[.56,.82,.48],0x302f38,"cloth");
  k.ball(0,1.72,0,.27,.37,.20,0x343944,"cloth");
  for(const side of [-1,1]){
    k.line([side*.12,1.85,0],[side*.88,1.81,0],.119,0x323842,"cloth");
    k.line([side*.84,1.81,0],[side*1.18,1.82,.025],.061,0x6c5340,"wood");
    k.box(side*.22,1.82,.19,.22,.12,.055,0x8d3f3a,"cloth",[0,0,side*.28]);
  }
  k.ball(0,2.14,0,.236,.26,.23,0xddd6b4);k.ball(0,2.10,.219,.061,.083,.084,0xc29574);
  eyePair(k,0,2.19,.200,.102,.025);
  k.curve([[-.11,2.055,.19],[0,2.025,.23],[.12,2.076,.19]],.012,0x5c4f48,"paint",7);
  k.post(-.01,2.32,0,.36,.075,0x35323a,"cloth",[0,0,.06]);
  k.post(0,2.51,0,.223,.37,0x34333e,"cloth",[0,0,.06]);
  k.post(0,2.395,0,.23,.074,0x79534d,"cloth",[0,0,.06]);
  k.line([-.19,2.42,0],[-.29,2.67,.015],.015,0x778657,"leaf");
}
export function person(k,who){
  const sophie=who==="sophie",markl=who==="markl",suliman=who==="suliman",child=who==="child";
  const h=markl?1.21:child?1.40:sophie?1.48:1.61,skin=sophie||suliman?0xe0bc9a:0xecc4a5;
  const coat=sophie?0x72908b:markl?0x7d9257:suliman?0xe7d7aa:0x859cba;
  const yy=h*.84,hair=sophie||suliman?0xc6c2b4:markl?0x9c6247:0x505264;
  if(sophie||suliman)k.put(skirt,[0,.08,0],[.48,h*.63,.48],coat,"cloth");
  else for(const s of [-1,1]){
    k.line([s*.095,.10,.02],[s*.12,h*.48,0],.09,0x625849,"cloth");
    k.ball(s*.10,.07,.05,.112,.073,.17,0x53483a,"wood");
  }
  k.ball(0,h*.60,0,.244,h*.245,.175,coat,"cloth");
  k.ball(0,yy,0,.174,.208,.163,skin);k.ball(0,yy-.007,.157,.042,.055,.044,skin);
  k.ball(0,yy+.10,-.039,.184,.158,.166,hair,"cloth");
  for(let i=0;i<7;i++){
    const a=Math.PI*.46+i*.56;
    k.ball(.15*Math.sin(a),yy+.065,.13*Math.cos(a),.084,.13,.079,hair,"cloth");
  }
  if(sophie||suliman)k.ball(0,yy+.05,-.177,.133,.135,.115,hair,"cloth");
  eyePair(k,0,yy+.022,.15,.081,.017);
  k.line([-.04,yy-.085,.136],[.040,yy-.081,.141],.008,0x946b5b,"paint");
  for(const s of [-1,1]){
    const mid=[s*.28,h*.53,.07],hand=[s*(child?.13:.22),h*(child?.66:.44),child?.26:.17];
    k.line([s*.16,h*.70,0],mid,.086,coat,"cloth");k.line(mid,hand,.063,coat,"cloth");
    k.ball(...hand,.064,.069,.057,skin);
  }
  if(markl||sophie){
    k.put(hatBrim,[0,yy+.12,0],[.29,.36,.28],markl?0x817b54:0xd3bc83,"cloth",[0,0,-.09]);
    if(sophie)k.ball(.22,yy+.185,.06,.073,.053,.055,0xa76b79,"cloth");
  }
  if(child)k.ball(0,h*.68,.30,.090,.13,.09,0xffc67c,"glow");
}
export function heen(k){
  const fur=0x9f6c4f,cream=0xe4d6aa;
  k.ball(0,.34,0,.22,.25,.39,cream);
  k.ball(0,.47,.285,.203,.231,.202,cream);
  for(const s of [-1,1]){
    k.ball(s*.19,.40,.29,.089,.19,.12,fur);
    k.ball(s*.15,.11,.18,.087,.12,.10,fur);k.ball(s*.15,.11,-.17,.095,.12,.10,fur);
  }
  k.ball(0,.415,.465,.088,.071,.061,0x514840);eyePair(k,0,.52,.45,.073,.021);
  k.ball(0,.43,-.33,.12,.19,.19,fur);
}
export function calciferModel(){
  const g=new T.Group(),k=new Kit();
  const flame=lathe("flame",[[0,0],[.42,.03],[.75,.18],[.88,.43],[.68,.72],[.35,1.02],[.19,1.19],[.025,1.54]],20);
  k.put(flame,[0,0,0],[.45,.56,.28],0xf67b3e,"glow",[0,0,-.10]);
  k.put(flame,[-.27,.02,-.015],[.20,.35,.23],0xf79843,"glow",[0,0,.30]);
  k.put(flame,[.27,.02,-.015],[.18,.40,.19],0xf99844,"glow",[0,0,-.43]);
  k.ball(0,.16,.11,.31,.17,.14,0xffb852,"glow");
  for(const s of [-1,1]){
    k.ball(s*.122,.326,.205,.083,.087,.039,0xfff0cd,"glow");
    k.ball(s*.118,.315,.240,.034,.040,.014,0x373334);
  }
  k.ball(.015,.159,.251,.068,.030,.012,0x9e4033);
  k.finish(g,false);return g;
}
