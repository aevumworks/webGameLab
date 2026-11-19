import {giza} from "./parameters.js";
import {entranceZ,mouthX as cx} from "./pyramid.js";
import {batch,box,poly} from "./geometry.js";
const T=globalThis.THREE, p=giza.documented,d=giza.design;
const slope=Math.tan(T.MathUtils.degToRad(d.gallerySlope));
export const galleryNorth=d.gallerySouthZ+p.galleryLength*Math.cos(T.MathUtils.degToRad(d.gallerySlope));
const turn=(entranceZ+galleryNorth+(d.galleryFloor-p.entranceY)/slope)*.5;
export const highFloor=d.galleryFloor+(galleryNorth-d.gallerySouthZ)*slope;
const room={x:cx-3.60,north:-7.30};room.south=room.north-p.chamberWidth;room.z=(room.north+room.south)/2;
export const coffer={x:room.x-p.chamberLength*.5+1.21,z:room.z-.05,w:1.02,d:2.29};
export const stairEnd=150;
export function routeFloor(z){
  if(z>=stairEnd)return 0;
  if(z>=entranceZ)return p.entranceY*(stairEnd-z)/(stairEnd-entranceZ);
  if(z>=turn)return p.entranceY+(z-entranceZ)*slope;
  if(z>=d.gallerySouthZ)return d.galleryFloor+(galleryNorth-z)*slope;
  return highFloor;
}
export function interiorAt(x,z){
  if(z<room.north+.13 && z>room.south+.18 && Math.abs(x-room.x)<p.chamberLength*.5-.20){
    if(Math.abs(x-coffer.x)<coffer.w*.5+.21&&Math.abs(z-coffer.z)<coffer.d*.5+.21)return null;
    return {floor:highFloor,eye:1.66,place:"chamber"};
  }
  const offset=Math.abs(x-cx);
  if(z>=stairEnd+.15||z<room.north-.16)return null;
  if(z>=entranceZ && offset<1.77)return {floor:routeFloor(z),eye:1.09+.57*T.MathUtils.smoothstep(z,entranceZ+.5,entranceZ+4.2),place:"portal"};
  if(z<=entranceZ+.04 && z>=galleryNorth && offset<.63)return {floor:routeFloor(z),eye:1.09,place:"passage"};
  if(z<=galleryNorth+.04 && z>=d.gallerySouthZ && offset<.85)return {floor:routeFloor(z),eye:1.26+.40*T.MathUtils.smoothstep(z,d.gallerySouthZ+.3,d.gallerySouthZ+2.5),place:"gallery"};
  if(z<=d.gallerySouthZ+.04&&offset<.59)return {floor:highFloor,eye:1.26,place:"antechamber"};
  return null;
}
export const chamberView={x:room.x+3.59,z:room.z+1.31};
function longitudinal(g,m,left,right,z1,z2,bottom,top,hfun=routeFloor){
  const vertices=[];
  for(const z of [z1,z2]){const h=hfun(z);vertices.push([left,h+bottom,z],[right,h+bottom,z],[right,h+top,z],[left,h+top,z]);}
  // z1 is north: front, back, floor, ceiling and both lateral faces.
  return poly(g,m,vertices,[0,1,2,0,2,3,4,7,6,4,6,5,0,4,5,0,5,1,3,2,6,3,6,7,0,3,7,0,7,4,1,5,6,1,6,2]);
}
export function buildPassages(scene,materials){
  const m={...materials,limestone:materials.gallery,light:materials.galleryLight,paving:materials.gallery,red:materials.chamber};
  const geo=new T.Group();scene.add(geo);
  const count=96,stepDepth=(stairEnd-entranceZ)/count;
  for(let i=0;i<count;i++){
    const z=stairEnd-stepDepth*(i+.5),h=routeFloor(z)+.065;
    box(geo,i%9===0?materials.light:materials.paving,cx,(h-.2)/2,z,3.90,Math.max(.12,h+.2),stepDepth+.012);
    if(i%3===0)for(const s of [-1,1])box(geo,materials.limestone,cx+s*2.15,h*.5,z-stepDepth,.47,h+.54,stepDepth*3+.018);
  }
  function corridor(north,south,width,clear){
    const length=north-south,n=Math.ceil(length/1.55),dz=length/n;
    longitudinal(geo,m.recess,cx-width-.48,cx+width+.48,north,south,-.33,-.036);
    for(let j=0;j<n;j++){
      const a=north-j*dz,b=a-dz+.009;
      longitudinal(geo,m.paving,cx-width,cx+width,a,b,-.20,0);
      longitudinal(geo,m.limestone,cx-width-.42,cx+width+.42,a,b,clear,clear+.46);
      for(const sign of [-1,1])for(let k=0;k<2;k++){
        const x=cx+sign*(width+.21);
        longitudinal(geo,(j+k)%7===0?m.light:m.limestone,x-.21,x+.21,a,b,k*clear/2+.004,(k+1)*clear/2-.005);
      }
    }
  }
  corridor(entranceZ+.35,turn,.88,1.58);corridor(turn,galleryNorth,.88,1.58);
  const n=23,dz=(galleryNorth-d.gallerySouthZ)/n;
  for(let j=0;j<n;j++){
    const a=galleryNorth-j*dz,b=a-dz+.009;
    longitudinal(geo,m.paving,cx-1.08,cx+1.08,a,b,-.22,0);
    for(const sign of [-1,1]){
      const w=p.galleryWidth/2, benchX=cx+sign*.809;
      longitudinal(geo,m.limestone,benchX-.239,benchX+.239,a,b,0,.54);
      const foot=cx+sign*(w+.29);
      longitudinal(geo,m.limestone,foot-.29,foot+.29,a,b,.528,2.32);
      for(let k=0;k<p.corbels;k++){
        const outer=w-(k+1)*(p.galleryWidth-p.galleryCrown)/(2*p.corbels);
        const middle=cx+sign*(outer+.29),low=2.32+k*(p.galleryHeight-2.32)/p.corbels;
        longitudinal(geo,(j+k)%11===0?m.light:m.limestone,middle-.29,middle+.29,a,b,low,low+(p.galleryHeight-2.32)/p.corbels-.008);
      }
      if(j%2===1){
        const slot=box(geo,m.recess,benchX,routeFloor((a+b)*.5)+.548,(a+b)*.5,.19,.013,.32);
        slot.rotation.x=Math.atan(slope);
      }
    }
    longitudinal(geo,m.light,cx-.90,cx+.90,a,b,p.galleryHeight,p.galleryHeight+.38);
    for(let t=0;t<5;t++){
      const z=a-(t+.5)*(a-b)/5;
      box(geo,m.paving,cx,routeFloor(z)+.052,z,1.12,.105,(a-b)/5+.004);
    }
  }
  // Transverse head walls close the tall corbelled space over its two low doorways.
  for(const [z,sg,lintel] of [[galleryNorth,1,1.58],[d.gallerySouthZ,-1,1.83]]){
    const base=routeFloor(z),count=7,h=(p.galleryHeight-lintel)/count;
    for(const side of [-1,1])box(geo,m.gallery,cx+side*.974,base+lintel*.5,z+sg*.17,.28,lintel,.36);
    for(let j=0;j<count;j++)box(geo,j%3?m.gallery:m.galleryLight,cx,base+lintel+(j+.5)*h,z+sg*.16,2.32,h-.009,.36);
  }
  corridor(d.gallerySouthZ,room.north-.05,.83,1.83);
  const Y=highFloor,x0=room.x-p.chamberLength/2,x1=room.x+p.chamberLength/2;
  box(geo,m.red,room.x,Y-.13,room.z,p.chamberLength+.7,.26,p.chamberWidth+.63);
  function wallX(z,left,right){
    for(let k=0;k<5;k++){
      const h=p.chamberHeight/5, door=z>room.z&&k<2;
      const spans=door?[[left,cx-.83],[cx+.83,right]]:[[left,right]];
      for(const [a,b] of spans){const num=Math.ceil((b-a)/2.9),w=(b-a)/num;
        for(let j=0;j<num;j++)box(geo,m.red,a+(j+.5)*w,Y+(k+.5)*h,z,w-.013,h-.009,.50);
      }
    }
  }
  wallX(room.north+.24,x0-.48,x1+.48);wallX(room.south-.24,x0-.48,x1+.48);
  box(geo,m.red,cx,Y+2.07,room.north+.24,1.69,.49,.50);
  for(const x of [x0-.24,x1+.24])for(let j=0;j<3;j++)for(let k=0;k<5;k++){
    const w=p.chamberWidth/3,h=p.chamberHeight/5;
    box(geo,m.red,x,Y+(k+.5)*h,room.south+(j+.5)*w,.5,h-.009,w-.014);
  }
  for(let j=0;j<9;j++){const w=p.chamberLength/9;box(geo,m.red,x0+(j+.5)*w,Y+p.chamberHeight+.22,room.z,w-.013,.45,p.chamberWidth+.35);}
  for(let j=0;j<4;j++)for(let k=0;k<2;k++)box(geo,m.red,x0+(j+.5)*p.chamberLength/4,Y+.011,room.south+(k+.5)*p.chamberWidth/2,p.chamberLength/4-.017,.038,p.chamberWidth/2-.017);
  const f=coffer;box(geo,m.coffer,f.x,Y+.12,f.z,f.w,.23,f.d);
  box(geo,m.basalt,f.x,Y+.242,f.z,f.w-.29,.02,f.d-.29);
  for(const s of [-1,1]){box(geo,m.coffer,f.x+s*(f.w/2-.080),Y+.59,f.z,.16,.89,f.d);
    box(geo,m.coffer,f.x,Y+.59,f.z+s*(f.d/2-.08),f.w-.32,.89,.16);}
  const fixtures=[];
  function addLamp(x,y,z,side){
    fixtures.push([x-side*.27,y+.22,z]);box(geo,m.aged,x,y,z,.085,.18,.31);box(geo,m.lamp,x-side*.053,y-.035,z,.027,.039,.23);
  }
  for(let z=entranceZ-4,i=0;z>room.north;z-=6.7,i++){
    const gallery=z<galleryNorth&&z>d.gallerySouthZ,sg=i%2?1:-1;
    addLamp(cx+sg*(gallery?.94:.79),routeFloor(z)+(gallery?1.35:.72),z,sg);
  }
  for(const x of [x0+.45,x1-.45])for(const z of [room.south+.48,room.north-.55])addLamp(x,Y+.29,z,x<room.x?-1:1);
  batch(geo);
  return fixtures;
}
