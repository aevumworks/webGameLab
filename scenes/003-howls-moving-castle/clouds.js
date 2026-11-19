import {T,TAU,Surface,random} from "./atelier.js";

// A wind-flattened bank has a broad underside and a peaked crown. Its long axis
// follows the horizon, which keeps the denser, inked engine exhaust readable.
export function cloudBanks(scene){
  const s=new Surface(),r=random(869);
  function bank(a,dist,width,depth,height,y){
    const ax=Math.cos(a),az=Math.sin(a),p=(x,up,z)=>[ax*(dist+z)-az*x,y+up,az*(dist+z)+ax*x];
    const lobes=[[-.31,.18,.35],[-.13,.24,.68],[.065,.20,1],[.23,.17,.56],[.36,.14,.27]];
    for(const l of lobes)l[2]*=.76+r()*.33;
    const rings=[];
    for(let j=0;j<=24;j++){
      const x=j/24-.5;
      let up=0;
      for(const [at,w,h] of lobes)up=Math.max(up,h*Math.sqrt(Math.max(0,1-((x-at)/w)**2)));
      const t=up*height,z=up*depth;
      rings.push([p(x*width,-t*.08,0),p(x*width,t*.07,-z*.85),p(x*width,t*.57,-z),
        p(x*width,t*.91,-z*.55),p(x*width,t,z*.07),p(x*width,t*.62,z),p(x*width,t*.04,z*.83)]);
    }
    const colors=[0xbfd3d4,0xd3ded9,0xe9eade,0xf1eee1,0xe9e8db,0xd6dfd9,0xc5d6d6];
    for(let j=0;j<rings.length-1;j++)for(let k=0;k<colors.length;k++){
      const next=(k+1)%colors.length;
      s.quad(rings[j][k],rings[j+1][k],rings[j+1][next],rings[j][next],colors[k]);
    }
  }
  for(let i=0;i<14;i++){
    const a=(i+.18+r()*.42)*TAU/14,dist=2250+r()*780;
    const width=310+r()*570,y=290+r()*490;
    bank(a,dist,width,75+r()*92,47+r()*80,y);
    if(i%3===1)bank(a+.13,dist+140,width*.51,57,25,y+25);
  }
  const mat=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,fog:false});
  const banks=new T.Mesh(s.geometry(),mat);scene.add(banks);
  return function update(camera,t,mood){
    banks.position.set(camera.position.x*.13+Math.sin(t*.0007)*110,0,camera.position.z*.13);
    mat.color.set(mood==="night"||mood==="memory"?0x687d99:mood==="front"?0xb399a1:mood==="dusk"?0xe6c3b6:mood==="gold"?0xffe3b6:0xffffff);
  };
}
