import {batch,box,hewnUnit,mesh,poly,seeded} from "./geometry.js";
const T=globalThis.THREE;

// Station and cross-road offset in metres, shared by paving, ruins and photography.
export function survey(points){
  const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,0,z)));
  curve.arcLengthDivisions=700;
  const length=curve.getLength();
  const line=curve.getSpacedPoints(Math.ceil(length/.5));
  function at(station,side=0){
    const t=T.MathUtils.clamp(station/length,0,1)*(line.length-1);
    const i=Math.min(Math.floor(t),line.length-2),a=line[i],b=line[i+1];
    const dx=b.x-a.x,dz=b.z-a.z,n=Math.hypot(dx,dz),u=t-i;
    return [a.x+dx*u+side*dz/n,a.z+dz*u-side*dx/n];
  }
  return {length,at};
}

export function buildNorthRoad(scene,m,road,ground){
  const rng=seeded(21837),obstacles=[];
  const patches=Array.from({length:5},()=>new T.Group());
  const group=s=>patches[Math.min(4,Math.floor(5*Math.max(0,s)/road.length))];
  const rocks=Array.from({length:5},(_,i)=>hewnUnit(803+i));
  function stone(s,q,y,w,h,d,material,twist=0,solid=false,rough=true){
    const [x,z]=road.at(s,q),[a,b]=road.at(s+.12,q);
    const yaw=Math.atan2(a-x,b-z)+twist;
    const g=group(s),rock=rough?mesh(g,rocks[Math.floor(rng()*rocks.length)],material):box(g,material,0,0,0,1,1,1);
    rock.scale.set(w,h,d);rock.position.set(x,ground(x,z)+y,z);rock.rotation.y=yaw;
    if(solid)obstacles.push([x,z,Math.cos(yaw),Math.sin(yaw),w/2+.20,d/2+.20]);
    return rock;
  }
  function slab(s0,s1,l,r,material,bevel){
    const ends=[[s0,l+bevel],[s0,r-bevel],[s0+bevel,r],[s1-bevel,r],
      [s1,r-bevel],[s1,l+bevel],[s1-bevel,l],[s0+bevel,l]];
    const low=[],high=[];
    for(const [s,q] of ends){
      const [x,z]=road.at(s,q),y=ground(x,z);
      high.push([x,y+.105+.012*rng(),z]);low.push([x,y-.075,z]);
    }
    const idx=[];
    for(let i=1;i<7;i++)idx.push(8,8+i+1,8+i);
    for(let i=0;i<8;i++){const k=(i+1)%8;idx.push(i,k+8,k,i,i+8,k+8);}
    poly(group(s0),material,[...low,...high],idx);
  }
  let s=0;
  while(s<road.length-.2){
    const end=Math.min(road.length,s+1.05+rng()*.85),half=2.08+.16*Math.sin(s*.064);
    const joints=rng()<.38?[-half,-.58+.60*rng(),half]:[-half,-1.05+.60*rng(),.38+.64*rng(),half];
    for(let j=1;j<joints.length;j++){
      const outer=j===1||j===joints.length-1;
      slab(s+.018,end-.018,joints[j-1]+.018,joints[j]-.018,
        rng()<.22?m.light:rng()<.24?m.limestone:m.paving,outer?.09+rng()*.13:.045);
    }
    s=end;
  }
  // Broken kerbs and spills of scree gather at the terrace edges, away from the walking strip.
  for(let station=2;station<road.length-3;station+=1.45){
    for(const sign of [-1,1]){
      if(Math.sin(station*.18+sign)>.05&&rng()>.17)
        stone(station,sign*2.41,.10,.37,.27,1.34,m.limestone,(rng()-.5)*.04);
      if(rng()<.35)for(let j=0;j<4;j++){
        const size=.10+.29*rng();
        stone(station+rng(),sign*(2.7+rng()*3.6),size*.15,size*1.5,size*.56,size,m.paving,rng()*3);
      }
    }
  }

  // An exhibition gateway leaves a clear opening aligned with the aisle beside the shrine.
  const gate=8;
  for(const sign of [-1,1]){
    stone(gate,sign*2.73,.10,1.65,.40,2.02,m.paving,0,true,false);
    for(let k=0;k<6;k++){
      const width=1.48-k*.055;
      stone(gate,sign*2.73,.47+k*.47,width,.469,1.83-k*.042,k===4?m.light:m.limestone,0,false,false);
    }
    stone(gate,sign*2.73,3.14,1.53,.24,1.87,m.light,0,false,false);
  }
  stone(gate,0,3.57,7.17,.66,1.58,m.limestone,0,false,false);
  for(const [q,w] of [[-2.53,2.24],[-.28,2.23],[2.24,2.78]]){
    stone(gate,q,3.96,w,.16,1.76,m.light,0,false,false);
  }
  for(const side of [-1,1]){
    stone(gate+.08,side*3.58,.25,.82,.66,2.38,m.paving,0,true);
    stone(gate+.10,side*3.53,.74,.69,.39,1.93,m.limestone);
  }

  // Battered wall ends and low rectangular foundations reveal the route around each turn.
  function wall(start,side,counts){
    for(let i=0;i<counts.length;i++){
      const at=start+i*1.64;
      stone(at,side,.14,1.36,.48,1.68,m.paving,0,true);
    }
    for(let tier=0;tier<Math.max(...counts);tier++){
      let i=0;
      while(i<counts.length){
        if(counts[i]<=tier){i++;continue;}
        const first=i;
        while(i<counts.length&&counts[i]>tier)i++;
        const end=start+(i-.5)*1.64;
        let edge=start+(first-.5)*1.64;
        while(edge<end-.015){
          let length=Math.min(end-edge,1.05+1.48*rng());
          if(end-edge-length<.65)length=end-edge;
          stone(edge+length*.5,side,.53+tier*.49,1.22-tier*.05,.505,length-.014,
            rng()<.18?m.paving:m.limestone,(rng()-.5)*.02);
          edge+=length;
        }
      }
    }
  }
  wall(10,4.9,[5,5,4,3,2,1,1]);
  wall(29,-6.1,[1,2,3,3,2,1,1,2]);
  wall(57,7.4,[1,0,0,0,1,3,4,4,3,1,0,1]);
  wall(59,15.1,[1,1,2,3,3,2,1,0,1]);
  for(let q=7.7;q<15;q+=1.45)stone(75,q,.34,1.47,.80,1.12,m.limestone,0,true);
  // The enclosure's offering recess faces the approaching visitor. Separate returns give the niche real depth.
  const recess=60.4;
  stone(recess,10.6,.12,4.8,.40,3.50,m.limestone,0,true);
  for(let row=0;row<5;row++){
    stone(recess+1.02,10.6,.45+row*.41,3.54,.413,.57,m.red,0,false,false);
    for(const sign of [-1,1])stone(recess+.27,10.6+sign*1.48,.45+row*.41,.64,.414,1.7,m.limestone,0,false,false);
  }
  stone(recess-.43,10.6,2.39,3.94,.50,.82,m.light,0,false,false);
  stone(recess-.32,10.6,.43,2.24,.38,1.20,m.red);
  wall(123,-6.25,[0,1,2,3,3,4,3,2,1]);
  wall(road.length-29,6.4,[1,2,3,3,2,1,0]);
  for(const [station,side] of [[20,7],[45,-8],[84,9.5],[137,-9],[road.length-22,8]]){
    for(let i=0;i<8;i++){
      const size=.6+.85*rng(),q=side+Math.sign(side)*rng()*3;
      const a=stone(station+rng()*5,q,size*.19,size*1.1,size*.62,size*1.48,m.limestone,rng()*2,true);
      a.rotation.z=(rng()-.5)*.40;
    }
  }
  // Horizontally bedded limestone outcrops; shared outlines keep the strata seated.
  for(const [station,side,radius,height] of [[35,13,7.2,1.8],[87,-16,10,2.1],[105,14,6.7,1.35],[148,19,8.2,2.2]]){
    const [cx,cz]=road.at(station,side),base=ground(cx,cz)-.68,sides=17;
    const radii=Array.from({length:sides},()=>.70+.35*rng());
    const ring=(level,scale)=>radii.map((r,i)=>{
      const a=i*Math.PI*2/sides;
      const bedding=.69+.24*Math.cos(a-.45)+.12*Math.sin(a*2+.5);
      return [cx+Math.cos(a)*radius*r*scale+level*.46,base+level*bedding+.17*Math.sin(a*3+.6),
        cz+Math.sin(a)*radius*.57*r*scale-level*.17];});
    const levels=[[0,1.08],[height*.34,1.05],[height*.34+.12,1.08],[height*.69,.93],[height*.69+.11,.96],[height+.25,.76]];
    for(let j=1;j<levels.length;j++){
      const lower=ring(...levels[j-1]),upper=ring(...levels[j]),idx=[];
      for(let i=0;i<sides;i++){const k=(i+1)%sides;idx.push(i,i+sides,k,k,i+sides,k+sides);}
      if(j===levels.length-1)for(let i=1;i<sides-1;i++)idx.push(sides,sides+i+1,sides+i);
      poly(group(station),j%2?m.limestone:m.paving,[...lower,...upper],idx);
    }
    // Elliptical rock footprint follows the outer bedding rather than blocking the whole bounding box.
    obstacles.push([cx,cz,1,0,radius*1.04,radius*.59,true]);
    for(let j=0;j<12;j++){
      const a=rng()*Math.PI*2,x=cx+Math.cos(a)*radius*.94,z=cz+Math.sin(a)*radius*.55;
      const chip=mesh(group(station),rocks[j%rocks.length],j%3?m.limestone:m.paving,x,ground(x,z)+.06,z);
      const span=.51+rng()*1.58;chip.scale.set(span,.25+span*.24,span*.72);
      chip.rotation.set((rng()-.5)*.23,a,(rng()-.5)*.26);
    }
  }
  for(const patch of patches)scene.add(batch(patch));
  return (x,z)=>!obstacles.some(([cx,cz,cos,sin,w,d,ellipse])=>{
    const dx=x-cx,dz=z-cz;
    if(ellipse)return (dx/w)**2+(dz/d)**2<1;
    return Math.abs(dx*cos-dz*sin)<w&&Math.abs(dx*sin+dz*cos)<d;
  });
}
