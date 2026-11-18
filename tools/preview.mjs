import http from "node:http";
import {createReadStream} from "node:fs";
import {stat} from "node:fs/promises";
import {resolve,relative,sep,extname} from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url)), port=Number(process.argv[2]||4182);
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".md":"text/plain; charset=utf-8",".json":"application/json",".jpg":"image/jpeg",".png":"image/png",".webp":"image/webp",".svg":"image/svg+xml",".mp4":"video/mp4"};
http.createServer(async(req,res)=>{
  if(!["GET","HEAD"].includes(req.method)){res.writeHead(405);return res.end();}
  let path;try{path=decodeURIComponent(new URL(req.url,"http://localhost").pathname);}catch{res.writeHead(400);return res.end();}
  const pieces=path.split("/").filter(Boolean);
  if(pieces.some(p=>p.startsWith(".")||p.includes("\\")||p.includes(":"))||(pieces.length && !["scenes","architecture","knowledge","vendor","docs","index.html","README.md","LICENSE"].includes(pieces[0]))){res.writeHead(404);return res.end();}
  let file=resolve(root,...pieces);
  if(relative(root,file).startsWith(".."+sep)){res.writeHead(404);return res.end();}
  try{
    if((await stat(file)).isDirectory()){
      if(!path.endsWith("/")){res.writeHead(308,{Location:path+"/"});return res.end();}
      file=resolve(file,"index.html");
    }
    const info=await stat(file);if(!info.isFile())throw Error();
    const type=mime[extname(file)]||"text/plain; charset=utf-8";
    const headers={"Content-Type":type,"Content-Length":info.size,"Cache-Control":"no-cache"};
    let status=200, span;
    if(type==="video/mp4"){
      headers["Accept-Ranges"]="bytes";
      const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||"");
      if(range && (range[1]||range[2])){
        const start=range[1]?Number(range[1]):Math.max(0,info.size-Number(range[2]));
        const end=range[1]&&range[2]?Math.min(info.size-1,Number(range[2])):info.size-1;
        if(start>end || start>=info.size){
          res.writeHead(416,{"Content-Range":"bytes */"+info.size});return res.end();
        }
        status=206;span={start,end};
        headers["Content-Range"]="bytes "+start+"-"+end+"/"+info.size;
        headers["Content-Length"]=end-start+1;
      }
    }
    res.writeHead(status,headers);
    if(req.method==="HEAD")res.end();else createReadStream(file,span).on("error",()=>res.destroy()).pipe(res);
  }catch{res.writeHead(404);res.end("Not found");}
}).listen(port,"127.0.0.1",()=>console.log("webGameLab  http://127.0.0.1:"+port+"/"));
