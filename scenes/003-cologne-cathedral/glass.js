const T=globalThis.THREE;
function random(seed){return ()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
function paneTexture(style) {
  const w=style===3?320:280,h=style===3?640:640,c=document.createElement("canvas");c.width=w;c.height=h;
  const g=c.getContext("2d"),r=random(1379+style*394),pick=a=>a[Math.floor(r()*a.length)];
  const gems=["#2453a4","#426fa6","#3f7292","#793746","#b64d3f","#d89952","#d0aa66","#42796d","#847695","#658baa"];
  function polygon(points,fill,line="#352f36",width=1.9){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();g.lineWidth=width;g.strokeStyle=line;g.stroke();}
  function ring(x,y,radius,fill,stroke,width){g.beginPath();g.arc(x,y,radius,0,Math.PI*2);if(fill){g.fillStyle=fill;g.fill();}g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}
  g.fillStyle="#3a4256";g.fillRect(0,0,w,h);
  if(style===3){
    const hues=["#4c677f","#c18478","#a6adb0","#7a8484","#4c8785","#ba995a","#8d6880","#cfbb81","#989584","#778099","#536a97","#bbaba5"];
    const cols=72,rows=136,sw=w/cols,sh=h/rows;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){g.fillStyle=pick(hues);g.fillRect(x*sw,y*sh,sw,sh);g.fillStyle="rgba(31,35,41,.32)";g.fillRect(x*sw,y*sh,.43,sh);}
  }else if(style===4){
    g.fillStyle="#eddfad";g.fillRect(0,0,w,h);
    for(let j=-2;j<28;j++)for(let i=-1;i<9;i++){const x=i*42+(j%2)*21,y=j*26;
      polygon([[x,y-26],[x+21,y],[x,y+26],[x-21,y]],pick(["#ebdfb7","#e2d5ab","#cad1ba","#ddcda0","#d5c5a4","#efdb9d"]),"#777a6a",1.55);}
    for(const x of [12,w-12])for(let y=5;y<h;y+=24){ring(x,y,8,pick(["#b98249","#8f5e43","#427b94","#bd9452"]),"#50483e",2);}
    for(const y of [131,346,551]){ring(w/2,y,48,"#b38750","#776549",3);ring(w/2,y,41,"#8dabab","#f4dd9b",4);
      for(let n=0;n<8;n++){const a=n*Math.PI/4;ring(w/2+25*Math.cos(a),y+25*Math.sin(a),14,n%2?"#d3a25e":"#e5c786","#776d57",2);}ring(w/2,y,13,"#b47351","#746953",1.5);}
  }else{
    const cols=12,rows=35,sw=w/cols,sh=h/rows,grid=[];
    for(let y=0;y<=rows;y++){const row=[];for(let x=0;x<=cols;x++)row.push([x*sw+(x>0&&x<cols?(r()-.5)*11:0),y*sh+(y>0&&y<rows?(r()-.5)*8:0)]);grid.push(row);}
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const border=x===0||x===cols-1, palette=border?["#9c492f","#dfb65d","#678f9b"]:style===2?["#9caeb2","#b7b7a3","#829ca9","#8ea6ab","#c6bda1"]:gems;
      polygon([grid[y][x],grid[y][x+1],grid[y+1][x+1],grid[y+1][x]],pick(palette));}
    for(let m=0;m<2;m++){
      const y=168+m*260,x=w/2;
      if(style!==2){
        g.save();g.translate(x,y);g.scale(1,.99);
        polygon([[-81,102],[-80,-42],[-51,-67],[-36,-70],[0,-111],[38,-69],[53,-67],[82,-41],[81,102]],"#b68e51","#594433",4);
        polygon([[-68,93],[-65,-35],[-42,-54],[-28,-60],[0,-86],[29,-60],[51,-50],[69,-31],[67,93]],style===0?"#284e80":"#595d81");
        ring(0,-37,26,"#cda153","#4f3e37",3);ring(0,-37,21,null,"#f5d993",2);
        polygon([[-12,-43],[0,-53],[14,-43],[11,-25],[2,-20],[-9,-27]],"#d2aa82");
        polygon([[-8,-22],[-25,-14],[-42,50],[-52,89],[44,90],[30,45],[22,-14],[9,-21]],m===style?"#b35e44":"#286da0");
        polygon([[-6,-19],[15,-16],[33,85],[4,73],[-19,88],[-30,73]],m===style?"#cf9162":"#9d4881");
        polygon([[-23,-8],[-10,26],[16,35],[22,28],[-1,17],[-8,-11]],"#d5b891");
        for(let j=0;j<4;j++){g.beginPath();g.moveTo(-16+j*8,13);g.lineTo(-29+j*15,76);g.strokeStyle="#705044";g.lineWidth=1.7;g.stroke();}
        g.restore();
      }else{for(let j=0;j<5;j++)ring(x,y+34,(j+1)*15,null,j%2?"#c0a77c":"#496780",4);}
    }
    for(let x=12;x<w;x+=w-24){g.fillStyle="#dbc078";g.fillRect(x-2,0,3,h);}
    for(let y=0;y<h;y+=52){g.fillStyle="rgba(26,34,42,.86)";g.fillRect(0,y,w,2.3);}
  }
  for(let i=0;i<17000;i++){const x=r()*w,y=r()*h;g.fillStyle=r()<.50?"rgba(255,241,182,.095)":"rgba(29,35,50,.079)";g.fillRect(x,y,1+r()*3,.6+r()*2);}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;tex.wrapS=T.RepeatWrapping;return tex;
}
export function glassMaterials(){
  return [0,1,2,3,4].map(i=>{
    const m=new T.MeshBasicMaterial({map:paneTexture(i),color:0xffffff,side:T.DoubleSide,toneMapped:false});
    m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace("#include <map_fragment>",`#include <map_fragment>
      bool outside=cameraPosition.z>-.4||cameraPosition.z< -145.||abs(cameraPosition.x)>(cameraPosition.z< -60.&&cameraPosition.z> -95.?43.5:24.);
      if(outside){float value=dot(diffuseColor.rgb,vec3(.24,.60,.16));diffuseColor.rgb=vec3(.019,.031,.044)+vec3(.074,.095,.12)*value+.026*diffuseColor.rgb;}
      else{diffuseColor.rgb=diffuseColor.rgb*1.34+vec3(.027,.021,.014);}`);};
    return m;});
}
