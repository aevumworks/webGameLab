import {GLTFLoader} from "../../vendor/three-r160/GLTFLoader.js";

const loader=new GLTFLoader();
const published="https://aevumworks.github.io/webGameLab/scenes/005-giza-anubis/";

// A source checkout can use the public exhibition's model assets or its own locally repaired files.
async function loadSculpture(kind){
  const path="models/"+kind+"-r1.glb";
  let response=await fetch(new URL(path,import.meta.url));
  if(response.status===404 && location.hostname!=="aevumworks.github.io")response=await fetch(new URL(path,published));
  if(!response.ok)throw Error("Could not load the "+kind+" sculpture ("+response.status+").");
  const gltf=await loader.parseAsync(await response.arrayBuffer(),"");
  const model=gltf.scene;
  model.traverse(item=>{
    if(!item.isMesh)return;
    item.castShadow=true;item.receiveShadow=true;
    const mat=item.material;
    if(mat.normalMap)mat.normalScale.setScalar(.76);
    if(mat.map)mat.map.anisotropy=4;
  });
  return model;
}
export function loadSculptures(){return Promise.all([loadSculpture("standing"),loadSculpture("recumbent")]);}
