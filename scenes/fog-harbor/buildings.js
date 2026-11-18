(() => {
  const H=Harbor3D,T=THREE;
  const {tau,mat,group,mesh,box,cyl,rod,ring,bake,ground}=H;
  const iron=mat("#314449",.36,.54), copper=mat("#9b5a43",.34,.57), brass=mat("#b79752",.55,.43);
  const stone=mat("#999486"), wood=mat("#78583d"), darkWood=mat("#544638"), ivory=mat("#e5d8b1");
  const windowLight=new T.MeshStandardMaterial({color:"#ffc67c",emissive:"#ffac46",emissiveIntensity:1.65,roughness:.42});
  const lampLight=new T.MeshBasicMaterial({color:new T.Color(2.5,1.43,.41)});
  const towerX=3.0,towerZ=-.85,towerY=ground(towerX,towerZ)-.12;
  H.beaconPosition=new T.Vector3(towerX,towerY+10.04,towerZ);

  function radial(parent,a,r,y,name) {
    const g=group(parent,name,Math.sin(a)*r,y,Math.cos(a)*r);g.rotation.y=a;return g;
  }
  function arch(g,m,w,h,depth,z) {
    const shape=new T.Shape(),rad=w/2;
    shape.moveTo(-rad,0);shape.lineTo(rad,0);shape.lineTo(rad,h-rad);
    shape.absarc(0,h-rad,rad,0,Math.PI,false);shape.lineTo(-rad,0);
    return mesh(g,new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:10}),m,0,0,z);
  }
  function tower(parent) {
    const g=group(parent,"Lighthouse — masonry and lantern",towerX,towerY,towerZ);
    const plaster=H.limewash();
    const chalk=new T.MeshStandardMaterial({color:"#ede1bf",map:plaster,roughness:.94});
    const red=new T.MeshStandardMaterial({color:"#af4e3e",map:plaster,roughness:.87});
    for(const [lo,hi,rb,rt,m] of [
      [-.46,.08,1.72,1.72,stone],[.08,.34,1.71,1.58,ivory],[.34,.59,1.58,1.53,stone],
      [.59,2.82,1.53,1.40,chalk],[2.82,4.18,1.40,1.32,red],[4.18,6.28,1.32,1.19,chalk],
      [6.28,7.53,1.19,1.12,red],[7.53,8.51,1.12,1.06,chalk],[8.51,8.64,1.09,1.18,ivory],
      [8.64,8.86,1.18,1.48,chalk],[8.86,9.00,1.56,1.56,iron],[9.00,9.08,1.53,1.50,ivory],
    ]) cyl(g,m,0,(lo+hi)/2,0,rt,rb,hi-lo,56);
    const door=radial(g,.36,1.47,.34,"Arched tower entrance");
    arch(door,stone,.88,1.67,.13,0);arch(door,iron,.68,1.52,.075,.13);
    for(const u of [-.20,-.10,0,.10,.20])box(door,darkWood,u,.63,.21,.012,1.22,.015);
    box(door,brass,.21,.70,.239,.055,.055,.025);
    for(let i=0;i<3;i++)box(door,stone,0,-.08-i*.10,.18+i*.25,1.05+i*.12,.18,.45);
    for(const [angle,y,r] of [[.25,4.72,1.28],[1.92,6.92,1.14],[3.35,3.23,1.37],[4.75,5.06,1.25],[.31,7.78,1.10]]) {
      const w=radial(g,angle,r,y,"Tower window");
      arch(w,stone,.52,.80,.065,0);arch(w,iron,.40,.68,.035,.067);arch(w,windowLight,.28,.54,.015,.106);
      box(w,iron,0,.25,.129,.027,.49,.018);box(w,iron,0,.29,.129,.26,.029,.018);
      box(w,ivory,0,.025,.10,.60,.068,.18);
    }
    for(let i=0;i<24;i++){
      const a=i*tau/24,x=1.45*Math.sin(a),z=1.45*Math.cos(a);
      cyl(g,iron,x,9.36,z,.023,.030,.60,7);
      if(i%3===0)rod(g,iron,[x*.76,8.54,z*.76],[x,8.88,z],.047,6);
    }
    ring(g,iron,0,9.35,0,1.45,.023);ring(g,brass,0,9.67,0,1.45,.031);
    cyl(g,iron,0,9.18,0,1.04,1.12,.22,12);
    const glass=new T.MeshPhysicalMaterial({color:"#a3dbd8",transparent:true,opacity:.16,roughness:.19,metalness:.13,side:T.FrontSide,depthWrite:false});
    mesh(g,new T.CylinderGeometry(.98,.98,1.42,12,1,true),glass,0,9.95,0);
    for(let i=0;i<12;i++){
      const a=i*tau/12,x=.99*Math.sin(a),z=.99*Math.cos(a);
      cyl(g,iron,x,9.94,z,.035,.042,1.5,7);
    }
    ring(g,brass,0,10.02,0,1.01,.028);ring(g,iron,0,10.68,0,1.04,.065);
    cyl(g,iron,0,9.51,0,.23,.33,.9,16);
    const lens=mesh(g,new T.SphereGeometry(.4,24,16),lampLight,0,10.04,0);lens.scale.set(1,1.55,1);
    for(let i=0;i<8;i++)ring(g,brass,0,9.61+i*.115,0,.32+Math.sin((i+.5)*Math.PI/8)*.12,.015);
    for(const [y,rb,rt,h] of [[10.75,1.2,1.22,.13],[10.97,1.22,1.02,.30],[11.25,1.02,.63,.28],[11.53,.63,.19,.29]])cyl(g,copper,0,y,0,rt,rb,h,24);
    for(let i=0;i<12;i++){
      const a=i*tau/12;rod(g,copper,[1.17*Math.sin(a),10.82,1.17*Math.cos(a)],[.21*Math.sin(a),11.64,.21*Math.cos(a)],.018,5);
    }
    cyl(g,brass,0,11.81,0,.045,.16,.30,12);cyl(g,iron,0,12.18,0,.016,.034,.56,8);
    box(g,brass,0,12.20,0,.59,.035,.035);
    bake(g);
  }
  function sash(g,x,y,z,w,h,angle=0,shutters=true) {
    const q=group(g,"Sash window",x,y,z);q.rotation.y=angle;
    box(q,darkWood,0,0,0,w+.16,h+.14,.095);
    box(q,windowLight,0,0,.055,w,h,.035);
    for(const s of [-1,1]) {
      box(q,ivory,s*(w*.5+.032),0,.09,.058,h+.08,.065);
      box(q,ivory,0,s*(h*.5+.023),.09,w+.16,.05,.065);
      if(shutters) {
        box(q,iron,s*(w*.5+.17),0,.025,.19,h+.08,.055);
        for(let i=0;i<4;i++)box(q,wood,s*(w*.5+.17),-h*.4+i*h*.25,.066,.16,.021,.024);
      }
    }
    box(q,darkWood,0,0,.097,.035,h,.045);box(q,darkWood,0,0,.097,w,.037,.045);
    box(q,stone,0,-h*.5-.09,.10,w+.25,.095,.19);
  }
  function cottage(parent,x,z,rotation,small=false) {
    const g=group(parent,small?"Boathouse":"Keeper's cottage",x,ground(x,z)-.22,z);
    g.rotation.y=rotation;
    const w=small?2.55:4.3,d=small?1.92:2.62,h=small?1.42:2.13,rise=small?.88:1.21;
    const wall=mat(small?"#a67955":"#e2c59b"), slate=mat(small?"#52656a":"#a9513b");
    box(g,stone,0,.13,0,w+.13,.56,d+.13);
    box(g,wall,0,h*.5+.31,0,w,h,d);
    const eave=h+.31;
    const triangle=H.geometry([0,rise,0, 0,0,d/2, 0,0,-d/2, 0,rise,0, 0,0,-d/2, 0,0,d/2]);
    for(const s of [-1,1])mesh(g,triangle,wall,s*w*.5,eave,0);
    const slope=Math.atan2(rise,d/2), extent=Math.hypot(d/2+.18,rise+.12);
    for(const s of [-1,1]) {
      const roof=group(g,"Pitched roof",0,eave+rise*.48,s*(d/4+.045));roof.rotation.x=s*slope;
      box(roof,slate,0,0,0,w+.45,.15,extent);
      const tile=mat(small?"#627b79":"#b76143");
      for(let row=0;row<7;row++) {
        const pz=(row/7-.45)*extent;
        box(roof,tile,0,.087,pz,w+.46,.043,.049);
        for(let j=0;j<9;j++){
          const px=(-.48+(j+(row%2)*.5)/9)*(w+.44);
          box(roof,tile,px,.084,pz+extent/16,.021,.026,extent/7);
        }
      }
    }
    rod(g,copper,[-w*.5-.24,eave+rise+.075,0],[w*.5+.24,eave+rise+.075,0],.10,10);
    for(const s of [-1,1]){
      box(g,darkWood,0,eave-.02,s*(d/2+.14),w+.45,.15,.13);
      for(const a of [-1,1])rod(g,ivory,[a*(w/2+.13),eave-.1,s*(d/2+.18)],[a*(w/2+.13),eave+rise+.04,0],.07,4);
    }
    if(!small) {
      for(const sx of [-1.22,1.18]) {sash(g,sx,1.45,d/2+.01,.61,.72);sash(g,sx,1.45,-d/2-.01,.57,.65,Math.PI);}
      sash(g,w/2+.01,1.59,0,.59,.66,Math.PI/2);
      sash(g,-w/2-.01,eave+.27,0,.36,.45,-Math.PI/2,false);
      const chimney=group(g,"Chimney",1.1,eave+rise-.1,-.36);
      box(chimney,stone,0,.39,0,.45,1.2,.41);box(chimney,ivory,0,.96,0,.56,.16,.51);
      cyl(chimney,copper,0,1.12,0,.15,.17,.22,12);
      const canopy=box(g,slate,0,2.18,d/2+.31,1.19,.12,.70);canopy.rotation.x=.20;
      for(const side of [-1,1])rod(g,darkWood,[side*.48,1.83,d/2],[side*.48,2.09,d/2+.53],.045,5);
      const porch=group(g,"Porch lantern",.62,1.66,d/2+.18);
      cyl(porch,iron,0,.12,0,.04,.19,.14,6);
      cyl(porch,windowLight,0,-.04,0,.13,.092,.21,6);
      cyl(porch,iron,0,-.17,0,.11,.045,.055,6);
    } else sash(g,.65,1.0,d/2+.02,.42,.47,0,false);
    const doorX=small?-.55:0;
    box(g,darkWood,doorX,1.0,d/2+.05,.79,1.47,.12);
    box(g,iron,doorX,.98,d/2+.13,.62,1.34,.055);
    box(g,windowLight,doorX,1.30,d/2+.165,.35,.30,.018);
    box(g,brass,doorX+.22,.80,d/2+.19,.045,.055,.026);
    for(let i=0;i<2;i++)box(g,stone,doorX,.22-i*.11,d/2+.22+i*.25,1.05,.22,.48);
    bake(g);
  }
  function path(parent,points,width) {
    const verts=[];
    for(let i=0;i<points.length-1;i++) {
      const [x,z]=points[i],[xx,zz]=points[i+1],len=Math.hypot(xx-x,zz-z);
      const dx=-(zz-z)/len*width/2,dz=(xx-x)/len*width/2;
      const corners=[[x+dx,z+dz],[x-dx,z-dz],[xx-dx,zz-dz],[xx+dx,zz+dz]].map(([a,b])=>[a,ground(a,b)+.08,b]);
      for(const n of [0,2,1,0,3,2])verts.push(...corners[n]);
    }
    const material=mat("#c0a778");material.side=T.DoubleSide;
    mesh(parent,H.geometry(verts),material);
  }
  function wharf(parent) {
    const g=group(parent,"Landing stair, jetty and rowing boat");
    path(g,[[-2.2,3.57],[-.9,3.34],[.25,2.69],[1.55,1.90],[3.37,.83]],.68);
    path(g,[[-2.15,3.52],[-2.84,4.12],[-3.45,4.83]],.65);
    const start=new T.Vector3(-3.45,ground(-3.45,4.83)+.08,4.83);
    const end=new T.Vector3(-8.40,.86,7.30);
    const dx=end.x-start.x,dz=end.z-start.z,angle=Math.atan2(dx,dz),side=new T.Vector3(Math.cos(angle),0,-Math.sin(angle));
    const rails=[[],[]];
    for(let i=0;i<=20;i++) {
      const v=start.clone().lerp(end,i/20);
      const tread=box(g,wood,v.x,v.y,v.z,1.01,.12,.40);tread.rotation.y=angle;
      if(i%4===0)for(let j=0;j<2;j++){
        const p=v.clone().addScaledVector(side,(j-.5)*1.05);
        cyl(g,darkWood,p.x,p.y*.5+.24,p.z,.06,.09,p.y+.84,7);
        rails[j].push([p.x,p.y+.67,p.z]);
      }
    }
    for(const line of rails)for(let i=1;i<line.length;i++)rod(g,wood,line[i-1],line[i],.045,7);
    for(let i=0;i<18;i++)box(g,i%4?wood:darkWood,-8.5-i*.22,.84,7.37, .204,.13,1.38);
    for(const x of [-8.55,-10.2,-12.04])for(const z of [6.77,7.98]){
      cyl(g,darkWood,x,.28,z,.116,.14,2.55,10);ring(g,wood,x,1.31,z,.118,.037);
    }
    function barrel(x,y,z,scale) {
      const barrelGroup=group(g,"Hooped timber barrel",x,y,z);barrelGroup.scale.setScalar(scale);
      const points=[[.29,0],[.34,.06],[.38,.36],[.36,.66],[.30,.77]].map(([r,h])=>new T.Vector2(r,h));
      mesh(barrelGroup,new T.LatheGeometry(points,14),wood);
      cyl(barrelGroup,darkWood,0,.75,0,.30,.30,.035,14);
      for(const [yy,r] of [[.13,.35],[.56,.375],[.70,.336]])ring(barrelGroup,iron,0,yy,0,r,.025);
    }
    barrel(-11.49,.92,7.64,.86);barrel(-11.87,.92,7.40,.67);
    barrel(-4.03,ground(-4.03,2.6),2.60,1.02);
    for(const [xx,zz] of [[-3.92,3.54],[-4.51,3.25]]){
      const yy=ground(xx,zz),crate=group(g,"Fish crate",xx,yy+.20,zz);crate.rotation.y=xx;
      box(crate,darkWood,0,-.15,0,.61,.09,.47);
      for(const side of [-1,1])for(let k=0;k<3;k++){
        box(crate,wood,0,-.12+k*.13,side*.25,.65,.093,.036);
        box(crate,wood,side*.32,-.12+k*.13,0,.037,.093,.48);
      }
    }
    const posts=[[.42,4.96],[1.6,4.96],[2.79,4.8],[3.9,4.52],[4.96,4.08]].map(([x,z])=>[x,ground(x,z),z]);
    for(const [x,y,z] of posts)cyl(g,wood,x,y+.32,z,.048,.074,.75,7);
    for(let i=1;i<posts.length;i++)for(const railHeight of [.29,.58]){
      const [ax,ay,az]=posts[i-1],[bx,by,bz]=posts[i];
      rod(g,darkWood,[ax,ay+railHeight,az],[bx,by+railHeight,bz],.035,7);
    }
    const boat=group(g,"Clinker rowing boat",-10.48,.29,8.81);boat.rotation.y=-.21;
    const hull=H.geometry((()=>{
      const vertices=[];
      const sections=[[-1.61,.035,.40],[-1.22,.43,.25],[-.4,.55,.20],[.66,.51,.21],[1.26,.33,.30],[1.55,.07,.40]];
      for(let i=0;i<sections.length-1;i++)for(const s of [-1,1]){
        const [x,w,y]=sections[i],[x2,w2,y2]=sections[i+1];
        const a=[x,y,s*w],b=[x2,y2,s*w2],c=[x2,-.17,s*w2*.48],d=[x,-.17,s*w*.48];
        vertices.push(...a,...b,...c,...a,...c,...d);
      }
      return vertices;
    })());
    const hullMat=mat("#914b38");hullMat.side=T.DoubleSide;mesh(boat,hull,hullMat);
    box(boat,wood,0,-.10,0,2.43,.13,.55);
    for(const x of [-.83,0,.77])box(boat,wood,x,.18,0,.20,.08,.83);
    rod(boat,ivory,[-1.18,.29,-.27],[1.17,.31,.35],.033,7);
    bake(g);
  }
  H.buildBuildings=function(parent) {
    tower(parent);cottage(parent,-1.82,1.25,-.17);cottage(parent,-2.12,-1.35,-.72,true);wharf(parent);
  };
})();
