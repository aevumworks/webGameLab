// Run with Ego Lite nodejs. Start the local webGameLab preview on port 4182 first.
const uri="http://127.0.0.1:4182/scenes/006-howls-moving-castle/";
async function setup(p){
  await p.cdp("Emulation.setDeviceMetricsOverride",{width:1360,height:800,deviceScaleFactor:1,mobile:false});
}
async function enter(p,url=uri){
  await p.goto(url,{timeout:45000});
  await p.waitForFunction(()=>document.querySelector("canvas")?.dataset.ready==="true",undefined,{timeout:35000});
  await p.evaluate(async()=>{window.routeInspect=(await import("./scene.js")).tourState;});
}
const snap=p=>p.evaluate(()=>window.routeInspect());
const mode=(p,value)=>p.waitForFunction(m=>window.routeInspect().mode===m,value,{timeout:9000});
async function point(p,yaw,pitch){
 const cur=await snap(p);let dx=-Math.atan2(Math.sin(yaw-cur.walker.yaw),Math.cos(yaw-cur.walker.yaw))/.0042,dy=-(pitch-cur.walker.pitch)/.004;
 const parts=Math.max(1,Math.ceil(Math.max(Math.abs(dx)/490,Math.abs(dy)/295)));
 for(let j=0;j<parts;j++){await p.mouse.move(670,410);await p.mouse.down();await p.mouse.move(670+dx/parts,410+dy/parts,{label:"转向下一个参观点"});await p.mouse.up();}
}
async function go(p,x,z,pitch=0){
 console.log("Walking to",x,z);
 for(let i=0;i<40;i++){
   const {walker:w}=await snap(p),distance=Math.hypot(x-w.x,z-w.z);
   if(distance<.40)return;
   await point(p,Math.atan2(x-w.x,w.z-z),pitch);
   await p.keyboard.down("w");
   try{
     await p.evaluate(ms=>new Promise(ok=>setTimeout(ok,ms)),Math.min(850,distance*210));
   }finally{await p.keyboard.up("w");}
 }
 throw Error("Waypoint unreachable "+x+","+z);
}
import fs from "node:fs/promises";
const destination=new URL("../../../../../场景资产/WGL-006_哈尔的移动城堡/荒地至波特港.webm",import.meta.url);
await fs.mkdir(new URL(".",destination),{recursive:true});
const t=await taskSpace("哈尔移动城堡荒地至港口实录"),p=t.page("p1");
await p.goto(uri);
await setup(p);
await enter(p);
await p.cdp("Page.bringToFront");
await p.evaluate(()=>{const tracks=document.querySelector("canvas").captureStream(30),rec=new MediaRecorder(tracks,{mimeType:"video/webm;codecs=vp9",videoBitsPerSecond:9000000}),parts=[];rec.ondataavailable=e=>parts.push(e.data);rec.onstop=async()=>{const fr=new FileReader();fr.onload=()=>window.movie=fr.result.split(",")[1];fr.readAsDataURL(new Blob(parts));tracks.getTracks().forEach(t=>t.stop());};window.rec=rec;rec.start();});
async function hold(n){const s=await snap(p);
await p.waitForFunction(x=>window.routeInspect().frame>=x,s.frame+n,{timeout:25000});}
await hold(36);
await p.keyboard.down("w");try{await p.waitForFunction(()=>window.routeInspect().castle.z>12);}finally{await p.keyboard.up("w");}await hold(20);
await p.keyboard.press("f");
await mode(p,"walk");
await hold(40);
const st=(await snap(p)).stairs;
await go(p,st.platform.x,st.platform.z,.22);
await point(p,st.platform.yaw-.54,.16);
await hold(34);
await go(p,st.door.x,st.door.z,.18);
await p.keyboard.press("e");
await mode(p,"room");
await hold(44);
await go(p,2.22,-1.7);
await go(p,-.92,-1.72);
await point(p,-.60,-.23);
await p.keyboard.press("e");
await hold(29);
await go(p,3.28,-.67);
await point(p,1.06,.11);
await p.keyboard.press("q");
await hold(30);
await point(p,1.5,.035);
await p.keyboard.press("e");
await hold(39);
await point(p,Math.PI/2,0);
await p.keyboard.down("w");try{await mode(p,"walk");}finally{await p.keyboard.up("w");}if((await snap(p)).place!=="harbor")throw Error("港口出口未到达");
await hold(28);for(const [x,z] of [[400.7,299],[404,307.82],[415.6,308]])await go(p,x,z);
await point(p,2.10,-.09);
await hold(65);
await p.evaluate(()=>window.rec.stop());
await p.waitForFunction(()=>!!window.movie);
const len=await p.evaluate(()=>window.movie.length),f=await fs.open(destination,"w");try{for(let i=0;i<len;i+=196608)await f.write(Buffer.from(await p.evaluate(i=>window.movie.slice(i,i+196608),i),"base64"));}finally{await f.close();}console.log("harbor recorded",len);
await t.finish({keep:[]});
