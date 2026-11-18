const T=globalThis.THREE;
const P=(x,y,z)=>new T.Vector3(x,y,z);
function face(store,a,b,c,d){
  for(const p of d?[a,b,c,a,c,d]:[a,b,c])store.push(p.x,p.y,p.z);
}
function clipX(poly,cut,keepRight){
  const result=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],aa=keepRight?a.x>=cut:a.x<=cut,bb=keepRight?b.x>=cut:b.x<=cut;
    if(aa)result.push(a);
    if(aa!==bb)result.push(a.clone().lerp(b,(cut-a.x)/(b.x-a.x)));
  }
  return result;
}
export function roofDetails(scene){
  const zinc=[],glazing=[],end=[],steel=[],up=P(0,1,0),item=new T.Object3D();
  function beam(a,b,r){
    const delta=b.clone().sub(a),len=delta.length();if(len<.001)return;
    item.position.copy(a).lerp(b,.5);item.scale.set(r,len,r);item.quaternion.setFromUnitVectors(up,delta.divideScalar(len));item.updateMatrix();steel.push(item.matrix.clone());
  }
  const period=6.65,depth=2.14;
  const profile=t=>t<.78?Math.sin(Math.min(1,t/.78)*Math.PI*.5):1.-(t-.78)/.22;
  function museumTriangle(triangle){
    const min=Math.min(...triangle.map(p=>p.x)),max=Math.max(...triangle.map(p=>p.x));
    for(let cell=Math.floor(min/period);cell<=Math.floor(max/period);cell++){
      const start=cell*period,ts=[0,.24,.48,.67,.78,1];
      for(let j=1;j<ts.length;j++){
        const poly=clipX(clipX(triangle,start+ts[j-1]*period,true),start+ts[j]*period,false);
        const verts=poly.map(p=>P(p.x,p.y-depth+profile(T.MathUtils.clamp((p.x-start)/period,0,1))*depth,p.z));
        for(let i=2;i<verts.length;i++)face(j===5?glazing:zinc,verts[0],verts[i-1],verts[i]);
      }
    }
  }
  function museumEdge(a,b){
    const len=a.distanceTo(b),n=Math.max(1,Math.ceil(len/.57));
    const low=p=>P(p.x,p.y-depth,p.z),upper=p=>P(p.x,p.y-depth+profile(T.MathUtils.euclideanModulo(p.x,period)/period)*depth,p.z);
    for(let i=0;i<n;i++){const p=a.clone().lerp(b,i/n),q=a.clone().lerp(b,(i+1)/n);face(end,low(p),low(q),upper(q),upper(p));}
  }
  // The platform hall runs diagonally across the survey tile. Its measured end centres set the bearing.
  function station(){
    const A=P(-122.8,0,-152.95),B=P(-339.05,0,-18.15),axis=B.clone().sub(A),length=axis.length(),t=axis.divideScalar(length),n=P(-t.z,0,t.x);
    const point=(u,theta,offset=0)=>A.clone().addScaledVector(t,u).addScaledVector(n,(32.05-offset)*Math.cos(theta)).add(P(0,12.08+(16.9-offset)*Math.sin(theta),0));
    const bays=36,rings=24;
    for(let j=0;j<bays;j++)for(let i=0;i<rings;i++){
      const u=j*length/bays,v=(j+1)*length/bays,a=i*Math.PI/rings,b=(i+1)*Math.PI/rings;
      const p=point(u,a),q=point(v,a),r=point(v,b),s=point(u,b);
      face(i>=6&&i<=17?glazing:zinc,p,q,r,s);
      beam(p,s,.12);beam(p,q,.067);if(i%2===0)beam(p,point(u,b,.68),.071);
      if(j%3===0&&i%2===0)beam(point(u,a,.66),point(u,b,.66),.094);
      if(j===0||j===bays-1){
        const f=j===0?0:length,top=point(f,a),other=point(f,b),base=P(top.x,11.9,top.z),next=P(other.x,11.9,other.z);
        face(glazing,base,next,other,top);beam(base,top,.13);if(i%2===0)beam(base,other,.092);beam(top,other,.24);
      }
    }
  }
  function finish(){
    station();
    const materials=[new T.MeshStandardMaterial({color:0xa0a8ac,metalness:.52,roughness:.49,side:T.DoubleSide}),
      new T.MeshStandardMaterial({color:0x819ca5,metalness:.48,roughness:.25,side:T.DoubleSide}),new T.MeshStandardMaterial({color:0x938a80,roughness:.81,side:T.DoubleSide})];
    for(const [i,data] of [zinc,glazing,end].entries()){if(!data.length)continue;
      const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(data,3));g.computeVertexNormals();g.computeBoundingSphere();
      const m=materials[i];m.onBeforeCompile=sh=>{sh.vertexShader="varying vec3 metalP;\n"+sh.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nmetalP=position;");
        sh.fragmentShader="varying vec3 metalP;\n"+sh.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
        float u=metalP.z/${i===1?"1.27":".53"};float edge=min(fract(u),1.-fract(u));
        diffuseColor.rgb*=.78+.22*smoothstep(.012,.063,edge)+.038*sin(metalP.x*.98+metalP.z*.14);`);};m.customProgramCacheKey=()=>"landmark"+i;
      const mesh=new T.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);}
    const ribs=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,7),new T.MeshStandardMaterial({color:0x575e5b,metalness:.54,roughness:.43}),steel.length);
    steel.forEach((m,i)=>ribs.setMatrixAt(i,m));ribs.computeBoundingSphere();ribs.castShadow=true;scene.add(ribs);
  }
  return {museumTriangle,museumEdge,finish,depth};
}
