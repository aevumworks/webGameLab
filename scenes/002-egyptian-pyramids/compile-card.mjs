// Pass the UTF-8 content returned by the workspace Obsidian MCP read_note tool on stdin.
import {writeFile} from "node:fs/promises";
import {giza as previous} from "./parameters.js";

let content="";
process.stdin.setEncoding("utf8");
for await(const chunk of process.stdin)content+=chunk;
const block=content.match(/^`{3}json\s*\n([\s\S]*?)\n`{3}/m);
if(!block)throw Error("The building note needs a fenced JSON parameter block.");
const card=JSON.parse(block[1]);
if(card.id!=="giza"||typeof card.name!=="string")throw Error("Expected the Khufu parameter card.");
for(const group of ["documented","design"]){
  for(const key of Object.keys(previous[group])){
    if(!Number.isFinite(card[group]?.[key]))throw Error("Invalid numeric parameter "+group+"."+key);
  }
}
const source="// Metres. Exported from the workspace Obsidian parameter card for Khufu.\nexport const giza = "+JSON.stringify(card,null,2)+";\n";
await writeFile(new URL("./parameters.js",import.meta.url),source,"utf8");
