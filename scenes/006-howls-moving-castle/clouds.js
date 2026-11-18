import {T,TAU,random,clamp,smooth} from "./atelier.js";

// Orthographic studies of clustered water vapour. The density and lighting are painted
// from the same lobes so light falls continuously across the whole cloud bank.
function cloudTexture(seed){
  const r=random(seed),w=448,h=200,canvas=document.createElement("canvas");
  canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d"),img=ctx.createImageData(w,h);
  const lobes=[],randomGrid=new Float32Array(128*64);
  for(let i=0;i<randomGrid.length;i++)randomGrid[i]=r();
  function noise(x,y){
    const i=Math.floor(x),j=Math.floor(y);let u=x-i,v=y-j;
    u=u*u*(3-2*u);v=v*v*(3-2*v);
    const a=randomGrid[(i&127)+(j&63)*128],b=randomGrid[((i+1)&127)+(j&63)*128];
    const c=randomGrid[(i&127)+((j+1)&63)*128],d=randomGrid[((i+1)&127)+((j+1)&63)*128];
    return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
  }
  for(let i=0;i<36;i++){
    const x=(i+.5+r()*.45)/36,env=Math.sin(x*Math.PI)**.64;
    const rx=(.05+r()*.075)*env+.018,ry=rx*(1.1+r()*.55)*w/h;
    const y=.64-env*(.09+r()*.19)+Math.sin(x*9+seed)*.07;
    lobes.push([.06+.88*x,y,rx,ry,.15+r()*.27]);
  }
  const depth=new Float32Array(w*h);depth.fill(-1);
  for(const [cx,cy,rx,ry,z] of lobes){
    for(let y=Math.max(0,Math.floor((cy-ry)*h));y<Math.min(h,(cy+ry)*h);y++){
      const vy=(y/h-cy)/ry;
      for(let x=Math.max(0,Math.floor((cx-rx)*w));x<Math.min(w,(cx+rx)*w);x++){
        const vx=(x/w-cx)/rx,dist=1-vx*vx-vy*vy;
        if(dist<=0)continue;
        const i=y*w+x,bump=z+Math.sqrt(dist)*ry;
        depth[i]=Math.max(depth[i],bump);
      }
    }
  }
  const sample=(x,y)=>depth[clamp(y,0,h-1)*w+clamp(x,0,w-1)];
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const m=noise(x*.033,y*.034),fine=noise(x*.164,y*.137);
    const xx=clamp(Math.round(x+(m-.5)*13+(fine-.5)*3),1,w-2);
    const yy=clamp(Math.round(y+(noise(x*.041+18,y*.042)-.5)*11+(fine-.5)*4),1,h-2);
    const z=sample(xx,yy);if(z<0)continue;
    const edge=Math.min(sample(xx-1,yy),sample(xx+1,yy),sample(xx,yy-1),sample(xx,yy+1));
    const slope=clamp((z-Math.max(.13,sample(xx-4,yy-4)))*5.3,-.38,.58);
    const sunlight=clamp(.78-y/h*.65+slope+.23*m+.13*fine,0,1);
    const a=(y*w+x)*4;
    img.data[a]=Math.round(133+118*sunlight);img.data[a+1]=Math.round(165+82*sunlight);
    img.data[a+2]=Math.round(184+53*sunlight);const border=smooth(0,18,Math.min(x,w-1-x,y,h-1-y));
    img.data[a+3]=Math.round((edge<0?120:231)*border);
  }
  ctx.putImageData(img,0,0);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;return tex;
}
export function cloudBanks(scene){
  const group=new T.Group(),textures=[cloudTexture(53),cloudTexture(921),cloudTexture(3307)],r=random(869);
  for(let i=0;i<29;i++){
    const a=(i+r()*.4)*TAU/29,dist=2320+r()*850,wide=400+r()*690;
    const bearing=Math.atan2(Math.sin(a-4.10),Math.cos(a-4.10));
    if(Math.abs(bearing)<.22)continue;
    const m=new T.SpriteMaterial({map:textures[i%3],transparent:true,depthWrite:false,fog:false});
    const b=new T.Sprite(m);b.position.set(Math.cos(a)*dist,235+r()*330,Math.sin(a)*dist);b.scale.set(wide,wide*(.22+r()*.13),1);
    b.userData.x=b.position.x;b.userData.z=b.position.z;group.add(b);
  }
  scene.add(group);
  return function update(camera,t,mood){
    const col=mood==="night"||mood==="memory"?0x596783:mood==="front"?0x9e838d:mood==="dusk"?0xcdab9e:0xfffdf3;
    for(const b of group.children){b.position.x=b.userData.x+camera.position.x*.18+Math.sin(t*.0008)*90;b.position.z=b.userData.z+camera.position.z*.18;b.material.color.set(col);}
  };
}
