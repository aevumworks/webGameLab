(() => {
  const H=Harbor3D, T=THREE;
  const {tau,random,mat,group,mesh,rod,rock,geometry,bake}=H;
  const coast = a => 1+.088*Math.sin(3*a+.4)+.065*Math.cos(5*a-.6)+.034*Math.sin(9*a+1.1);
  const ground = (x,z) => 5.12+.065*x+.27*Math.sin(x*.47+z*.22)+.19*Math.cos(z*.77-x*.32)-.22*((x/9)**2+(z/6)**2);
  H.ground=ground;
  H.shores=[[0,0,9.75,6.4],[-13,-5.7,2.25,1.55],[-17,-7.3,1.22,1.05],[14,-8.4,2.6,1.65],[8.3,9.5,.83,.63],[-11.8,4.0,1.25,.86]];
  const vertexMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.96,flatShading:true});
  vertexMat.onBeforeCompile=shader=>{
    shader.vertexShader="varying vec3 bedrock; varying float steep;\n"+shader.vertexShader.replace("#include <begin_vertex>",
      "#include <begin_vertex>\nbedrock=(modelMatrix*vec4(position,1.)).xyz;steep=1.-smoothstep(.32,.80,abs(normalize(mat3(modelMatrix)*normal).y));");
    shader.fragmentShader="varying vec3 bedrock; varying float steep;\n"+shader.fragmentShader.replace("#include <color_fragment>",`
      #include <color_fragment>
      float strike=bedrock.y+bedrock.x*.13-bedrock.z*.09+.075*sin(bedrock.x*1.7)+.04*sin(bedrock.z*3.);
      float lamina=smoothstep(.74,.98,sin(strike*11.3+.53*sin(bedrock.x*.6)));
      float flecks=sin(bedrock.x*53.+bedrock.y*29.)*sin(bedrock.z*37.-bedrock.y*17.);
      float nearRock=(1.-smoothstep(16.,34.,length(bedrock.xz)))*steep;
      diffuseColor.rgb*=1.+nearRock*(.052*flecks-.22*lamina+.036*sin(strike*29.));
    `);
  };
  const doubleMat=new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide});
  function triangles() {
    const positions=[],colors=[];
    function add(a,b,c,color) {
      positions.push(...a,...b,...c);
      for(let j=0;j<3;j++) colors.push(color.r,color.g,color.b);
    }
    return {add,finish:()=>geometry(positions,colors)};
  }
  function tone(hex,jitter) { return new T.Color(hex).multiplyScalar(jitter); }

  function cliff(parent) {
    const rng=random(717), face=triangles(), count=58, rims=[];
    const angles=Array.from({length:count},(_,i)=>tau*(i+(rng()-.5)*.36)/count);
    const rough=angles.map(()=>rng());
    for (let ring=0;ring<6;ring++) {
      rims.push(angles.map((a,i)=>{
        const s=[.92,.99,.985,1.045,1.13,1.12][ring] * (coast(a)+.025*Math.sin(i*3.3+ring*.95));
        const x=9.1*s*Math.cos(a)+.13*ring, z=5.9*s*Math.sin(a);
        const top=ground(x,z);
        const y=[top,top-.23-rough[i]*.22,top*.79+Math.sin(a*3)*.48,top*.43+.40*Math.sin(a*2+.5),.07+rough[i]*.38,-2][ring];
        return [x,y,z];
      }));
    }
    const stoneBands=["#a99e70","#796d5b","#756c68","#67696a","#465963"];
    for(let j=0;j<5;j++) for(let i=0;i<count;i++) {
      const k=(i+1)%count, a=rims[j][i], b=rims[j][k], c=rims[j+1][k], d=rims[j+1][i];
      const hue=stoneBands[j];
      face.add(a,b,c,tone(hue,.76+.40*rough[i]));
      face.add(a,c,d,tone(hue,.75+.36*rng()));
    }
    let inner=angles.map(()=>[0,ground(0,0),0]);
    for(let r=1;r<=7;r++) {
      const s=r/7;
      const outer=rims[0].map(([x,y,z],i)=>{
        if(r===7)return [x,y,z];
        const px=x*s+.13*Math.sin(i+r), pz=z*s+.12*Math.cos(i*4+r);
        return [px,ground(px,pz),pz];
      });
      for(let i=0;i<count;i++){
        const k=(i+1)%count, p=outer[i];
        const v=.49+.29*Math.sin(p[0]*.48+p[2]*.36)+.14*Math.sin(p[2]*.81)+rng()*.13;
        const c=new T.Color("#586e4d").lerp(new T.Color("#a2a866"),Math.max(0,Math.min(1,v)));
        if(r>1)face.add(inner[i],inner[k],outer[k],c);
        face.add(inner[i],outer[k],outer[i],c.clone().multiplyScalar(.96+.07*rng()));
      }
      inner=outer;
    }
    mesh(parent,face.finish(),vertexMat);
    const ledges=triangles();
    for(let j=0;j<28;j++){
      const start=rng()*tau, arc=.17+rng()*.68, fraction=.16+rng()*.56, thickness=.10+rng()*.22;
      let last;
      for(let k=0;k<8;k++){
        const angle=start+arc*k/7,ca=Math.cos(angle),sa=Math.sin(angle);
        const edge=coast(angle)*(1.095-.12*fraction+.018*Math.sin(k*1.9+j));
        const x=9.1*ca*edge+.35,z=5.9*sa*edge,y=ground(x,z)*fraction+.15*Math.sin(angle*3+j);
        const lip=.13+.19*Math.sin(Math.PI*k/7);
        const next=[[x-ca*.16,y,z-sa*.16],[x+ca*lip,y-.045,z+sa*lip],[x+ca*.03,y-thickness,z+sa*.03]];
        if(last){
          const col=tone(j%3?"#8b8175":"#9b917f",.87+.17*rng());
          for(let n=0;n<2;n++){ledges.add(last[n],next[n],next[n+1],col);ledges.add(last[n],next[n+1],last[n+1],col);}
        }last=next;
      }
    }
    mesh(parent,ledges.finish(),vertexMat);
    // Inclined ribs and talus break the continuous island silhouette.
    const rocks=["#64696b","#827769","#6a6668","#8b8173","#53656b"].map(c=>mat(c));
    for(let i=0;i<83;i++) {
      const a=tau*rng(), r=coast(a)*(.98+rng()*.18), x=9.1*r*Math.cos(a), z=5.9*r*Math.sin(a);
      const size=.19+rng()**1.7*1.07, y=rng()*.72*ground(x,z);
      const b=rock(parent,rocks[i%rocks.length],x,y,z,size*(.85+rng()),size*(.44+rng()*.66),size*(.58+rng()*.8),a);
      b.rotation.z=.18+.40*Math.sin(a-.6);
    }
  }

  function mound(parent,x,z,rx,rz,height,seed,remote) {
    const rng=random(seed), f=triangles(), n=remote?30:20;
    const border=Array.from({length:n},(_,i)=>1+.16*Math.sin(i*tau/n*3+seed)+.13*(rng()-.5));
    const rings=[[-1.8,1.13],[.5,1.04],[height*.54,.74],[height*.86,.48],[height,.13]].map(([y,r],j)=>
      border.map((scale,i)=>{
        const a=tau*i/n, notch=1+.09*Math.sin(i*8.3+j*.5);
        return [x+rx*(r*scale*notch*Math.cos(a)+j*.032),y+height*.12*Math.sin(a*3+.4)*Math.min(1,j*.65),
          z+rz*(r*scale*notch*Math.sin(a)-j*.019)];
      }));
    const palette=remote?["#466679","#546f80","#627e87","#778e90"]:["#41565f","#606a6d","#7e7972","#85906e"];
    for(let j=0;j<4;j++)for(let i=0;i<n;i++){
      const k=(i+1)%n, a=rings[j][i],b=rings[j][k],c=rings[j+1][k],d=rings[j+1][i];
      f.add(a,c,b,tone(palette[j],.80+rng()*.31));f.add(a,d,c,tone(palette[j],.81+rng()*.28));
    }
    for(let i=0;i<n;i++)f.add([x+rx*.13,height+.1,z-rz*.08],rings[4][(i+1)%n],rings[4][i],tone(palette[3],.97));
    mesh(parent,f.finish(),vertexMat);
  }

  function spruce(g,foliage,x,z,h,lean,rng) {
    const y=ground(x,z)-.10, bark=mat("#685339");
    const bend = u=>[x+lean*u*u,y+h*u,z+.075*h*u*u];
    rod(g,bark,bend(0),bend(.64),h*.033,7,h*.018);
    rod(g,bark,bend(.64),bend(1),h*.018,6,.015);
    const shades=["#294a45","#31584c","#466a53","#617955"];
    for(let level=0;level<9;level++){
      const u=.20+level*.082, center=bend(u), span=h*(1-u)*(.29+rng()*.035);
      const offset=rng()*tau, n=level>6?7:10;
      for(let j=0;j<n;j++){
        const a=offset+j*tau/n, len=span*(.68+rng()*.45), ca=Math.cos(a),sa=Math.sin(a);
        const tip=[center[0]+ca*len+.12*h*(1-u),center[1]-(.05+rng()*.045)*h,center[2]+sa*len];
        const mid=[center[0]+ca*len*.66,center[1]+h*.046,center[2]+sa*len*.66];
        const wing=len*(.25+rng()*.14);
        const left=[mid[0]-sa*wing,center[1]-.06*h,mid[2]+ca*wing];
        const right=[mid[0]+sa*wing,center[1]-.054*h,mid[2]-ca*wing];
        const root=[center[0],center[1]+h*.09,center[2]];
        const c=tone(shades[Math.min(3,Math.floor(rng()*3+u*.7))],.88+rng()*.19);
        foliage.add(root,mid,left,c);foliage.add(root,right,mid,c);foliage.add(left,mid,tip,c);foliage.add(mid,right,tip,c);
      }
    }
  }
  function flora(parent) {
    const g=group(parent,"Coastal spruce and meadow"), f=triangles(), rng=random(312);
    const stands=[[-5.2,-1.6,4.1],[-4.0,-2.9,5.1],[-6.0,-.6,3.8],[-6.6,-1.8,3.4],[-2.9,-3.6,3.7],
      [5.8,-2.8,3.6],[7.1,-.6,3.7],[6.1,-1.5,4.3],[7.4,1.0,2.8],[2.5,-4.4,2.7],[-6.6,1.5,2.2]];
    for(const [x,z,h] of stands)spruce(g,f,x,z,h,h*(.10+rng()*.09),rng);
    for(let i=0;i<2400;i++){
      const x=(rng()-.5)*17,z=(rng()-.5)*10,a=Math.atan2(z/5.9,x/9.1);
      if(Math.hypot(x/9.1,z/5.9)>.92*coast(a))continue;
      const y=ground(x,z)+.015,h=.075+rng()**2*.29,w=.023+rng()*.035, lean=.035+rng()*.09;
      const c=tone(i%5===0?"#d6ba79":"#969755",.8+rng()*.35);
      f.add([x-w,y,z],[x+lean,y+h,z+.05],[x+w,y,z+.01],c);
      if(i%4===0)f.add([x,y,z-w],[x+lean*.7,y+h*.76,z+.09],[x,y,z+w],c);
    }
    mesh(g,f.finish(),doubleMat);bake(g);
  }
  H.buildTerrain=function(parent) {
    const island=group(parent,"Basalt headland");cliff(island);bake(island);
    const stacks=group(parent,"Sea stacks and distant islands");
    const heights=[0,5.2,3.1,5.8,1.36,1.84];
    H.shores.slice(1).forEach(([x,z,rx,rz],i)=>mound(stacks,x,z,rx,rz,heights[i+1],i*8+306,false));
    [[-52,-47,15,8,7],[-22,-73,30,12,12],[36,-69,26,13,15],[71,-40,22,13,9],
      [77,38,25,11,11],[-56,47,25,13,8],[-84,-9,18,8,5],[8,93,29,11,8]].forEach(([x,z,rx,rz,h],i)=>mound(stacks,x*1.3,z*1.3,rx,rz,h*.76,414+i*41,true));
    bake(stacks);flora(parent);
  };
})();
