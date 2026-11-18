import {seeded, hewnUnit, vec, box, batch} from "./geometry.js";
import {giza} from "./parameters.js";
const T=globalThis.THREE, pi=Math.PI;
const normals=[[0,1],[1,0],[0,-1],[-1,0]];
export const entranceZ=giza.documented.base*.5*(1-giza.documented.entranceY/giza.documented.originalHeight);
export const mouthX=giza.documented.entranceX;

function elevations(n,h,seed){
  const rng=seeded(seed),levels=[0];
  for(let j=0;j<n;j++){
    const t=j/n, renewal=j%19===0?.28:0;
    levels.push(levels[j]+.55+.37*Math.exp(-4*t)+.28*rng()+renewal);
  }
  const scale=h/levels[n];return levels.map(y=>y*scale);
}

function tierShell(base,original,levels,material,opening=false,inset=0,casing=Infinity){
  const p=[],idx=[],tier=[];let course=0;
  function quad(a,b,c,d,ledge=false){const i=p.length/3;p.push(...a,...b,...c,...d);idx.push(i,i+1,i+2,i,i+2,i+3);
    tier.push(course,ledge?1:0,course,ledge?1:0,course,1,course,1);}
  const r=y=>Math.max(.15,base*.5*(1-y/original)-inset);
  const pos=(face,u,y,rad)=>{const [nx,nz]=normals[face];return [nx*rad+nz*u,y,nz*rad-nx*u];};
  for(let row=0;row<levels.length-1;row++){
    course=row;
    const y=levels[row],top=levels[row+1],a=r(y),b=r(top),smooth=y>=casing;
    for(let side=0;side<4;side++){
      const gap=opening && side===0 && top>giza.documented.entranceY-.45 && y<giza.documented.entranceY+8;
      const spans=gap?[[-1,(mouthX-2.7)/a],[(mouthX+2.7)/a,1]]:[[-1,1]];
      for(const [s,f] of spans){
        const faceTop=smooth?b:a;
        quad(pos(side,s*a,y,a),pos(side,f*a,y,a),pos(side,f*faceTop,top,faceTop),pos(side,s*faceTop,top,faceTop));
        if(!smooth)quad(pos(side,s*a,top,a),pos(side,f*a,top,a),pos(side,f*b,top,b),pos(side,s*b,top,b),true);
      }
    }
  }
  const top=levels[levels.length-1],a=r(top);quad([-a,top,a],[a,top,a],[a,top,-a],[-a,top,-a],true);
  const geom=new T.BufferGeometry();geom.setAttribute("position",new T.Float32BufferAttribute(p,3));geom.setAttribute("courseUV",new T.Float32BufferAttribute(tier,2));geom.setIndex(idx);geom.computeVertexNormals();
  const item=new T.Mesh(geom,material);item.castShadow=item.receiveShadow=true;return item;
}
export function distantPyramid(base,original,height,material,rows,cap=Infinity){
  const g=new T.Group(),levels=elevations(rows,height,rows*11);
  g.add(tierShell(base,original,levels,material,false,0,cap));
  return g;
}

export function buildKhufu(card,mat,individual=true){
  const p=card.documented, d=card.design, group=new T.Group(), rng=seeded(7104);
  const levels=elevations(d.courses,d.summit,749);
  group.name="Khufu";group.add(tierShell(p.base,p.originalHeight,levels,mat.shell,true,individual?.50:0));
  const nearby=[];
  if(individual){
    const stones=[hewnUnit(34),hewnUnit(96),hewnUnit(227)], matrix=new T.Object3D(), color=new T.Color();
    for(let face=0;face<4;face++){
      const [nx,nz]=normals[face];
      for(let band=0;band<4;band++){
        const buckets=new Map();
        for(let j=Math.floor(band*d.courses/4);j<Math.floor((band+1)*d.courses/4);j++){
          const y=levels[j],h=levels[j+1]-y,r=p.base*.5*(1-y/p.originalHeight);
          const coursesTint=.92+.16*rng();
          let u=-r;
          while(u<r-.01){
            const wanted=(2.0+2.05*rng())*(.85+.23*h);
            let w=Math.min(r-u,wanted);if(r-u-w<.85)w=r-u;
            const center=u+w*.5;u+=w;
            if(face===0 && y+h>p.entranceY-.43 && y<p.entranceY+7.9 && Math.abs(center-mouthX)<2.50+w*.5)continue;
            const thickness=1.26+.5*rng(), outward=r-thickness*.48-.12+(rng()-.5)*.36;
            const x=nx*outward+nz*center,z=nz*outward-nx*center;
            const shade=(.78+.36*rng())*coursesTint;
            const tile=Math.floor((center+p.base/2)/24)+16*Math.floor(y/17);
            if(!buckets.has(tile))buckets.set(tile,[]);
            buckets.get(tile).push([x,y+h*.49,z,w-.025,h*(.99+.065*rng()),thickness,shade,(rng()-.5)*.08]);
          }
        }
        buckets.forEach((items,k)=>{
          if(!items.length)return;
          const chunks=new T.InstancedMesh(stones[k%stones.length],mat.pyramid,items.length);
          items.forEach(([x,y,z,w,h,depth,t,v],i)=>{
            matrix.position.set(x,y,z);matrix.rotation.set(0,face*pi/2+v*.075,0);matrix.scale.set(w,h,depth);matrix.updateMatrix();
            chunks.setMatrixAt(i,matrix.matrix);color.setRGB(t*(1+v*.48),t,t*(1-v*.85));chunks.setColorAt(i,color);
          });
          chunks.computeBoundingSphere();chunks.receiveShadow=true;chunks.visible=false;nearby.push(chunks);group.add(chunks);
        });
      }
    }
  }
  const portal=new T.Group();
  const beam=(x,y,z,width,height,angle)=>{
    const b=box(portal,mat.light,mouthX+x,y,z,width,height,2.5);b.rotation.z=angle;
  };
  for(let j=0;j<3;j++){
    const z=entranceZ-1.05-j*.86,y=p.entranceY+2.58+j*1.12;
    beam(-1.55,y+.96,z,3.9,.95,.50);beam(1.55,y+.96,z,3.9,.95,-.50);
  }
  box(portal,mat.limestone,mouthX-1.91,p.entranceY+1.05,entranceZ-.11,1.08,2.14,2.4);
  box(portal,mat.limestone,mouthX+1.91,p.entranceY+1.05,entranceZ-.11,1.08,2.14,2.4);
  group.add(batch(portal));
  group.userData.updateDetail=position=>{
    for(const part of nearby){
      const s=part.boundingSphere,range=46+s.radius;
      part.visible=s.center.distanceToSquared(position)<range*range;
    }
  };
  return group;
}
