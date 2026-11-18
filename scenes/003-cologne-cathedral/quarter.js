import {furnishSquare} from "./square.js";
import {roofDetails} from "./landmarks.js";
const T=globalThis.THREE;
const styles=["terrace","sandstone","brick","limestone","forum","ludwig","roman","station"];
const colors=["#c6b495","#bbb6aa","#98695b","#d1c8b8","#acaaa2","#ac6852","#b1a99a","#9aa4a9"];
const fract=x=>x-Math.floor(x);
const hash=s=>[...s].reduce((v,c)=>(v*31+c.charCodeAt(0))>>>0,17);
function geometry(buffer){
  const g=new T.BufferGeometry();
  for(const [attr,n] of [["position",3],["uv",2],["layout",4]])if(buffer[attr]?.length)g.setAttribute(attr==="layout"?"cityLayout":attr,new T.Float32BufferAttribute(buffer[attr],n));
  g.computeVertexNormals();g.computeBoundingSphere();return g;
}
function wallMaterial(i,photos){
  const m=new T.MeshStandardMaterial({color:colors[i],roughness:.76,side:T.DoubleSide});
  m.onBeforeCompile=sh=>{
    sh.uniforms.frontEast={value:photos[0]};sh.uniforms.frontNorth={value:photos[1]};
    sh.vertexShader="attribute vec4 cityLayout;varying vec4 blockLayout;varying vec2 facadeUV;\n"+sh.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nblockLayout=cityLayout;facadeUV=uv;");
    sh.fragmentShader="uniform sampler2D frontEast;uniform sampler2D frontNorth;varying vec4 blockLayout;varying vec2 facadeUV;\n"+sh.fragmentShader;
    const modes=["0.","1.","2.","3.","4.","5.","6.","7."];
    sh.fragmentShader=sh.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
      float type=${modes[i]},width=blockLayout.x,height=blockLayout.y,variant=blockLayout.z,grade=blockLayout.w;
      float y=facadeUV.y,u=facadeUV.x,ground=step(y,4.1);
      float stepY=type>6.5?3.40:3.02+.40*variant, floors=max(1.,floor((height-4.)/stepY+.48));
      float ybay=y<4.1?y/4.1:1.+(y-4.1)/max(2.65,(height-4.1)/floors);
      float sx=type==4.?2.18:type>6.5?2.8:2.36+.62*variant;
      float bays=max(1.,floor(width/sx+.5));vec2 p=vec2(u*bays/max(width,.1),ybay),uv=fract(p);
      vec2 edge=abs(uv-.5);
      float grain=fract(sin(dot(floor(vec2(u,y)*21.),vec2(23.41,73.75)))*3481.5);
      float br=fract(y/.093);float bx=fract(u/.24+.5*mod(floor(y/.093),2.));
      float mortar=smoothstep(.010,.075,min(min(bx,1.-bx),min(br,1.-br)));
      vec3 wall=diffuseColor.rgb*(.93+.065*grain);
      if(type==2.||type==5.)wall*=.79+.21*mortar;
      else{vec2 joint=abs(fract(vec2(u/1.20,y/.70))-.5);wall*=1.-.105*smoothstep(.47,.50,max(joint.x,joint.y));}
      float col=fract(sin(dot(floor(p)+variant,vec2(19.35,77.51)))*3297.2);
      float wx=type>=4.?.44:.30+.06*variant;float wy=.34;float mid=.52;
      if(ground>.5){wx=.405;wy=.42;mid=.47;}if(type==5.){wx=.41;wy=.18;mid=.68;}if(type==6.){wx=.45;wy=.22;}if(type==7.){wx=.48;wy=.465;}
      vec2 delta=abs(vec2(uv.x-.5,uv.y-mid))-vec2(wx,wy);
      float border=max(delta.x,delta.y);
      float aa=clamp(max(fwidth(p.x),fwidth(p.y))*.75,.005,.09);
      float glass=(1.-smoothstep(-aa,aa,border))*step(4.5,height)*step(.75,width);
      float surround=(1.-smoothstep(.028,.057+aa,border))*step(4.5,height);
      wall=mix(wall,wall*vec3(1.15,1.11,1.02),surround);
      float cut=1.-smoothstep(-.044,-.013+aa,border);vec3 sky=mix(vec3(.045,.088,.114),vec3(.23,.37,.48),clamp(.12+uv.y*.59+.24*sin(p.x*.36+variant*5.)+.14*col,0.,1.));
      float curtain=step(.71,col)*step(uv.x,.38+.12*col);
      vec3 glazing=mix(sky,vec3(.30,.245,.17),.45*curtain);
      glazing*=.67+.33*smoothstep(.0,.15,.5-uv.y+mid);
      float mullion=1.-smoothstep(.012,.028+aa,min(abs(uv.x-.5),abs(uv.y-.72)));
      if(type==4.&&ground>.5)mullion=max(mullion,1.-smoothstep(.025,.055,abs(fract(p.x+1.45*p.y)-.5)));
      if(type==7.)mullion=max(mullion,1.-smoothstep(.023,.06,min(fract(p.x*1.0+p.y),1.-fract(p.x+p.y))));
      glazing=mix(glazing,vec3(.11,.13,.125),mullion*.79);
      vec2 reflected=vec2(.205+.080*uv.x+.0015*col,.185+.125*uv.y);
      vec3 photoGlass=texture2D(frontEast,reflected).rgb;
      glazing=mix(glazing,photoGlass*(.56+.38*col),.57);
      wall=mix(wall,mix(wall*.44,glazing,cut),glass);
      float band=1.-smoothstep(.013,.046+aa,min(uv.y,1.-uv.y));
      if(type!=5.)wall=mix(wall,wall*vec3(1.31,1.27,1.19),band*.63);
      if(type==4.&&y>4.15&&width>8.){
        vec2 panel=vec2(clamp(u/width,0.,1.),clamp((y-4.15)/max(1.,height-5.4),0.,1.));
        vec3 reference=grade>.55?texture2D(frontEast,panel).rgb:texture2D(frontNorth,panel).rgb;
        wall=reference*.93+wall*.055;
      }
      diffuseColor.rgb=wall;`);
  };m.customProgramCacheKey=()=>"quarter-front-"+i;return m;
}
function projectFace(rings,points,wall,datum){
  const outer=rings[0].map(i=>points[i]);let nx=0,ny=0,nz=0;
  for(let i=0;i<outer.length;i++){
    const a=outer[i],b=outer[(i+1)%outer.length];nx+=(a.y-b.y)*(a.z+b.z);ny+=(a.z-b.z)*(a.x+b.x);nz+=(a.x-b.x)*(a.y+b.y);
  }
  const len=Math.hypot(nx,nz),ux=len>1e-7?nz/len:1,uz=len>1e-7?-nx/len:0;
  const vertical=wall||Math.abs(ny)<Math.max(Math.abs(nx),Math.abs(nz));
  const planar=rings.map(r=>r.map(i=>{const p=points[i];return vertical?new T.Vector2(p.x*ux+p.z*uz,p.y):new T.Vector2(p.x,p.z);}));
  const indices=T.ShapeUtils.triangulateShape(planar[0],planar.slice(1));
  const ids=rings.flat(),uu=outer.map(p=>p.x*ux+p.z*uz);
  const u0=Math.min(...uu),width=Math.max(...uu)-u0;
  return {indices,ids,ux,uz,u0,width,outer};
}
function pointIn(x,z,ring,pts){
  let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=pts[ring[i]],b=pts[ring[j]];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
  }return inside;
}
export async function buildQuarter(scene,solids){
  const loader=new T.TextureLoader();
  const [response,ortho,...photos]=await Promise.all([fetch(new URL("./survey/quarter.json",import.meta.url)),...["orthophoto.webp","forum-east.webp","forum-north.webp"].map(name=>loader.loadAsync(new URL("./survey/"+name,import.meta.url).href))]);
  if(!response.ok)throw Error("City survey HTTP "+response.status);
  const {datum,grid,buildings}=await response.json(),angle=datum.angle,c=Math.cos(angle),s=Math.sin(angle);
  const uvAt=(x,z)=>[(datum.origin[0]+x*s-z*c-datum.ortho[0])/(datum.ortho[2]-datum.ortho[0]),(datum.origin[1]-x*c-z*s-datum.ortho[1])/(datum.ortho[3]-datum.ortho[1])];
  ortho.colorSpace=T.SRGBColorSpace;ortho.anisotropy=8;
  for(const p of photos){p.colorSpace=T.SRGBColorSpace;p.anisotropy=8;}
  const bins=new Map(),details=roofDetails(scene),facades=styles.map(()=>({position:[],uv:[],layout:[]})),roofs={position:[],uv:[]};
  const embellishments=[],frame=new T.Object3D();
  for(const [id,category,raw,faces] of buildings){
    const seed=hash(id),idx=category==="city"?seed%4:styles.indexOf(category),varn=fract(seed*.0006180339);
    const pts=raw.map(p=>new T.Vector3(p[0]*datum.unit,p[1]*datum.unit,p[2]*datum.unit));
    const low=Math.min(...pts.map(p=>p.y)),height=Math.max(...pts.map(p=>p.y))-low;
    for(const [role,...rings] of faces){
      const bounds=new T.Box3().setFromPoints(rings[0].map(i=>pts[i]));
      if(role===0){
        if(height>2.3&&low<3.5)for(let i=Math.floor(bounds.min.x/12);i<=Math.floor(bounds.max.x/12);i++)for(let j=Math.floor(bounds.min.z/12);j<=Math.floor(bounds.max.z/12);j++){
          const key=i+","+j;if(!bins.has(key))bins.set(key,[]);bins.get(key).push({rings,pts,bounds});
        }continue;
      }
      const face=projectFace(rings,pts,role===1,datum),dest=role===1?facades[idx]:roofs;
      if(role===2&&id.endsWith("fifT")&&bounds.max.y>13.)continue;
      if(role===2&&category==="ludwig"&&bounds.max.y-bounds.min.y<.25&&bounds.max.y>10.7){
        for(const t of face.indices)details.museumTriangle(t.map(i=>pts[face.ids[i]]));
        for(let j=0;j<face.outer.length;j++)details.museumEdge(face.outer[j],face.outer[(j+1)%face.outer.length]);
        continue;
      }
      for(const triangle of face.indices)for(const i of triangle){
        const p=pts[face.ids[i]];let y=p.y;
        if(role===1&&category==="ludwig"&&bounds.max.y>10.7&&y>bounds.max.y-.25)y-=details.depth;
        if(role===1&&id.endsWith("fifT")&&y>12.08)y=12.08;
        dest.position.push(p.x,y,p.z);
        if(role===1){dest.uv.push(p.x*face.ux+p.z*face.uz-face.u0,p.y-low);dest.layout.push(face.width,height,varn,Math.abs(face.ux));}
        else dest.uv.push(...uvAt(p.x,p.z));
      }
      if(role===1&&face.width>3&&face.width<70&&height>8&&bounds.distanceToPoint(new T.Vector3(0,0,-28))<125){
        const anchor=face.outer[0],v0=anchor.x*face.ux+anchor.z*face.uz-face.u0;
        const outside=new T.Vector3(-face.uz,0,face.ux),yaw=Math.atan2(-face.uz,face.ux);
        const storeys=Math.max(1,Math.round((height-4.1)/(3.02+.4*varn)));
        for(let floor=0;floor<=storeys;floor++){
          const y=low+4.1+(height-4.1)*floor/storeys;if(y>bounds.max.y+.02||y<bounds.min.y+.1)continue;
          frame.position.set(anchor.x+(face.width/2-v0)*face.ux,y-.055,anchor.z+(face.width/2-v0)*face.uz).addScaledVector(outside,.075);
          frame.rotation.set(0,yaw,0);frame.scale.set(face.width,.13,.34);frame.updateMatrix();embellishments.push(frame.matrix.clone());
        }
      }
    }
  }
  for(let i=0;i<facades.length;i++)if(facades[i].position.length){
    const obj=new T.Mesh(geometry(facades[i]),wallMaterial(i,photos));obj.name="survey-walls-"+styles[i];obj.castShadow=true;obj.receiveShadow=true;scene.add(obj);
  }
  const roofMat=new T.MeshStandardMaterial({map:ortho,color:0xeeeae2,side:T.DoubleSide,roughness:.78});
  const roof=new T.Mesh(geometry(roofs),roofMat);roof.name="survey-roofs";roof.receiveShadow=true;roof.castShadow=true;scene.add(roof);
  details.finish();
  if(embellishments.length){const trim=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:0xaaa599,roughness:.8}),embellishments.length);
    embellishments.forEach((m,i)=>trim.setMatrixAt(i,m));trim.computeBoundingSphere();trim.receiveShadow=true;scene.add(trim);}
  const heightAt=(x,z)=>{
    const fx=T.MathUtils.clamp((x-grid.x)/grid.dx,0,grid.cols-1.001),fz=T.MathUtils.clamp((z-grid.z)/grid.dx,0,grid.rows-1.001);
    const i=Math.floor(fx),j=Math.floor(fz),a=j*grid.cols+i;
    const land=T.MathUtils.lerp(T.MathUtils.lerp(grid.heights[a],grid.heights[a+1],fx-i),T.MathUtils.lerp(grid.heights[a+grid.cols],grid.heights[a+grid.cols+1],fx-i),fz-j)*.01;
    const e=Math.max(Math.abs(x)-(z< -62&&z> -94?43:24),z-.7,-143-z,0),mix=T.MathUtils.smoothstep(e,0,5);
    return T.MathUtils.lerp(0,land,mix)-.025;
  };
  const ground=new T.PlaneGeometry((grid.cols-1)*grid.dx,(grid.rows-1)*grid.dx,grid.cols-1,grid.rows-1);ground.rotateX(-Math.PI/2);
  const gp=ground.getAttribute("position"),gu=ground.getAttribute("uv");
  for(let i=0;i<gp.count;i++){const x=grid.x+(grid.cols-1)*grid.dx/2+gp.getX(i),z=grid.z+(grid.rows-1)*grid.dx/2+gp.getZ(i);gp.setXYZ(i,x,heightAt(x,z),z);gu.setXY(i,...uvAt(x,z));}
  ground.computeVertexNormals();const paving=new T.MeshStandardMaterial({map:ortho,roughness:.87,color:0xf5f0e5});
  paving.onBeforeCompile=sh=>{
    sh.vertexShader="varying vec2 streetXZ;\n"+sh.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nstreetXZ=position.xz;");
    sh.fragmentShader="varying vec2 streetXZ;\n"+sh.fragmentShader.replace("#include <map_fragment>",`#include <map_fragment>
      vec2 p=streetXZ;float court=(1.-smoothstep(46.,70.,abs(p.x)))*(1.-smoothstep(58.,88.,p.y));
      vec2 g=p/vec2(.94,.53);g.x+=.5*mod(floor(g.y),2.);vec2 e=min(fract(g),1.-fract(g));
      float seam=1.-smoothstep(.008,.032,min(e.x,e.y));float h=fract(sin(dot(floor(g),vec2(19.46,47.3)))*3827.);
      vec3 stone=mix(vec3(.31,.295,.274),vec3(.42,.405,.382),h);
      float l=dot(diffuseColor.rgb,vec3(.26,.60,.14));vec3 aerial=diffuseColor.rgb/(.34+l)*.59;
      diffuseColor.rgb=mix(aerial,mix(stone,aerial,.21)*(1.-.24*seam),court*.91);`);
  };
  const pavement=new T.Mesh(ground,paving);pavement.receiveShadow=true;scene.add(pavement);
  solids.street=(x,z,r)=>{
    const list=bins.get(Math.floor(x/12)+","+Math.floor(z/12));if(!list)return true;
    for(const {rings,pts,bounds} of list){
      if(x<bounds.min.x-r||x>bounds.max.x+r||z<bounds.min.z-r||z>bounds.max.z+r)continue;
      if(pointIn(x,z,rings[0],pts)&&!rings.slice(1).some(h=>pointIn(x,z,h,pts)))return false;
    }return true;
  };
  solids.heightAt=heightAt;furnishSquare(scene,heightAt,solids);
  return {count:buildings.length};
}
