// The look is authored in sRGB: paper and enamel base colours, a cool shadow
// plate, and a small hard highlight reserved for polished metal and glass.
const T=globalThis.THREE;
export const plate={value:0},captureInk={value:false};
export function tagInkPass(value){captureInk.value=value;}
export function studyLayer(name){plate.value=name==="paint"?1:name==="shadow"?2:0;}

const lighting=`
  vec3 base=diffuseColor.rgb;
  vec3 keyDir=vec3(.34,.72,.60),lightTint=vec3(1.);
  float incidence=0.,visibilityMask=1.;
  #if NUM_DIR_LIGHTS > 0
    keyDir=directionalLights[0].direction;
    vec3 sun=directionalLights[0].color;
    float energy=max(sun.r,max(sun.g,sun.b));
    lightTint=mix(vec3(1.),sun/max(.01,energy),.54)*clamp(.18+.34*energy,.39,1.);
    incidence=dot(normal,keyDir);visibilityMask=getShadowMask();
  #else
    // Interior spot and point lights pick a shadow shape at the real furniture
    // position. Calcifer's flare changes the extent of his warm light.
    float best=0.;vec3 dye=vec3(.96,.89,.80);
    #if NUM_POINT_LIGHTS > 0
      for(int j=0;j<NUM_POINT_LIGHTS;j++){
        IncidentLight lamp;getPointLightInfo(pointLights[j],-vViewPosition,lamp);
        float e=max(lamp.color.r,max(lamp.color.g,lamp.color.b));
        float hit=max(dot(normal,lamp.direction),0.)*e;
        if(hit>best){best=hit;keyDir=lamp.direction;dye=lamp.color/max(e,.001);}
      }
    #endif
    #if NUM_SPOT_LIGHTS > 0
      IncidentLight casement;getSpotLightInfo(spotLights[0],-vViewPosition,casement);
      float e=max(casement.color.r,max(casement.color.g,casement.color.b));
      float hit=max(dot(normal,casement.direction),0.)*e*getShadowMask();
      if(hit>best){best=hit;keyDir=casement.direction;dye=casement.color/max(.001,e);}
    #endif
    incidence=best-.38;
    lightTint=mix(vec3(.83,.87,.92),dye,.43);
  #endif
  float band=smoothstep(.08,.12,incidence)*smoothstep(.46,.54,visibilityMask);
  vec3 shadowTint=mix(vec3(.45,.56,.73),vec3(.56,.64,.76),celGround);
  vec3 outgoingLight=base*lightTint*mix(shadowTint,vec3(1.),band);
  if(celSatin>.5){
    vec3 halfVector=normalize(keyDir+normalize(vViewPosition));
    float glint=smoothstep(.960,.969,dot(normal,halfVector))*band;
    outgoingLight=mix(outgoingLight,vec3(.91,.82,.61)*lightTint,glint*.52);
  }
  if(celGlow>.5){outgoingLight=base;band=1.;}
  if(stylePlate==1)outgoingLight=base;
  if(stylePlate==2)outgoingLight=mix(vec3(.37,.46,.57),vec3(.91,.92,.90),band);
`;
export function celMaterial(options={},finish="matte",decorate=null){
  const material=new T.MeshLambertMaterial({flatShading:true,...options});
  material.onBeforeCompile=shader=>{
    if(decorate)decorate(shader);
    shader.uniforms.stylePlate=plate;shader.uniforms.captureInk=captureInk;
    const defines="uniform int stylePlate;uniform bool captureInk;\nconst float celGround="+(finish==="land"?"1.":"0.")+
      ";const float celSatin="+(finish==="satin"?"1.":"0.")+";const float celGlow="+(finish==="glow"?"1.":"0.")+";\n";
    shader.fragmentShader=defines+shader.fragmentShader
      .replace("#include <shadowmap_pars_fragment>","#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>")
      .replace(/#include <lights_lambert_fragment>[\s\S]*?vec3 outgoingLight = [^;]+;/,lighting)
      .replace("#include <opaque_fragment>",`#include <opaque_fragment>
        // Store the unlit paint value in alpha for internal seams. Lighting
        // changes never create an ink stroke through a continuous surface.
        if(captureInk)gl_FragColor.a=celGround>.5?.84:.12+.34*sqrt(clamp(dot(base,vec3(.25,.58,.17)),0.,1.));`);
  };
  material.customProgramCacheKey=()=>finish+(decorate?decorate.toString():"");
  return material;
}
