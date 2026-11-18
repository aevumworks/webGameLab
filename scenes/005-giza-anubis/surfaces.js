import {seeded} from "./geometry.js";
const T=globalThis.THREE;

function mineralNoise(){
  const size=512, data=new Uint8Array(size*size*4), random=seeded(48591);
  const grids=[4,8,16,32,64,128,256].map(n=>({n,v:Float32Array.from({length:n*n},random)}));
  const sample=(g,x,y)=>{
    const i=Math.floor(x),j=Math.floor(y),mask=g.n-1;
    let a=x-i,b=y-j;a=a*a*(3-2*a);b=b*b*(3-2*b);
    const at=(u,v)=>g.v[((v&mask)*g.n)+(u&mask)];
    return (at(i,j)*(1-a)+at(i+1,j)*a)*(1-b)+(at(i,j+1)*(1-a)+at(i+1,j+1)*a)*b;
  };
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const s=grids.map(g=>sample(g,x*g.n/size,y*g.n/size));
    const i=(y*size+x)*4, grain=random();
    data[i]=255*(s[0]*.3+s[1]*.26+s[2]*.20+s[3]*.14+s[4]*.10);
    data[i+1]=255*(s[3]*.22+s[4]*.32+s[5]*.29+s[6]*.17);
    data[i+2]=255*(s[6]*.42+grain*.58);data[i+3]=255;
  }
  const texture=new T.DataTexture(data,size,size,T.RGBAFormat);
  texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;
  texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.anisotropy=8;
  texture.needsUpdate=true;return texture;
}
let noise;
const worldVertex=`
vec4 geLocal=vec4(transformed,1.0);
#ifdef USE_INSTANCING
  geLocal=instanceMatrix*geLocal;
#endif
geWorld=(modelMatrix*geLocal).xyz;
`;
const varyings="varying vec3 geWorld;\n";
const surfaceFunctions=`
uniform sampler2D geNoise;
vec3 geology(vec3 p,vec3 n,float scale){
  vec3 a=abs(n);a*=a;a*=a;a/=max(.0001,a.x+a.y+a.z);
  return texture2D(geNoise,p.zy*scale).rgb*a.x+texture2D(geNoise,p.xz*scale).rgb*a.y+texture2D(geNoise,p.xy*scale).rgb*a.z;
}
vec3 bumpWorld(vec3 n,float height){
  vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
  vec3 r1=cross(dy,n),r2=cross(n,dx);
  float det=dot(dx,r1);
  return normalize(abs(det)*n-sign(det)*(dFdx(height)*r1+dFdy(height)*r2));
}`;
function finish(material,type) {
  const recipes={
    lime:`float shelf=sin(geWorld.y*7.5+big.r*13.0+mid.r*3.0);
      float fossil=smoothstep(.66,.83,mid.g)*smoothstep(.54,.70,big.r);
      float pit=smoothstep(.64,.82,grain.g+.14*(grain.b-.5));
      diffuseColor.rgb*=.65+.55*big.r+.25*mid.r+.20*(grain.g-.5)+.042*shelf-.21*pit;
      diffuseColor.rgb+=vec3(.10,.071,.038)*fossil;
      float relief=.0038*(mid.g-.5)+.00024*(grain.g-.5)-.0010*pit+.00065*shelf;`,
    sand:`float wave=geWorld.x*6.1+geWorld.z*4.75+10.0*big.r+2.8*mid.r;
      float farFade=1.0-smoothstep(.7,3.15,fwidth(wave));
      float ripple=(pow(.5+.5*sin(wave),3.0)-.30)*farFade;
      float bed=smoothstep(.41,.68,big.r+.18*(mid.r-.5));
      diffuseColor.rgb*=.77+.39*big.r+.19*(mid.g-.5)+.09*ripple*bed+.14*(grain.b-.5);
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.77,.79,.81),.55*(1.0-bed));
      float relief=.021*bed*ripple+.004*(mid.g-.5)+.00035*(grain.b-.5);`,
    granite:`float dark=smoothstep(.56,.75,grain.g+.24*(grain.b-.5)),crystal=smoothstep(.69,.82,grain.b);
      diffuseColor.rgb*=.50+.48*big.r+.33*mid.g-.43*dark;
      diffuseColor.rgb+=vec3(.31,.225,.17)*crystal+.06*smoothstep(.59,.74,mid.g);
      float relief=.00055*grain.g+.0007*mid.g;`,
    metal:`diffuseColor.rgb*=.86+.18*big.r+.09*mid.g+.08*(grain.b-.5);
      float relief=.00016*grain.g+.0008*mid.r;`
  };
  material.onBeforeCompile=shader=>{
    shader.uniforms.geNoise={value:noise};
    shader.vertexShader=varyings+shader.vertexShader.replace("#include <worldpos_vertex>","#include <worldpos_vertex>\n"+worldVertex);
    shader.fragmentShader=varyings+shader.fragmentShader.replace("void main() {",surfaceFunctions+"\nvoid main() {");
    const scale=type==="sand"?.021:.18;
    const rock=type==="graniteRoom"?"granite":["inner","pyramid","shell"].includes(type)?"lime":type;
    shader.fragmentShader=shader.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
      vec3 normW=normalize(cross(dFdx(geWorld),dFdy(geWorld)));
      vec3 big=geology(geWorld,normW,${scale}),mid=geology(geWorld,normW,${type==="sand"?".31":".73"}),grain=geology(geWorld,normW,${type==="sand"?"2.9":"2.35"});
      ${recipes[rock]}`).replace("#include <normal_fragment_maps>","#include <normal_fragment_maps>\nnormal=bumpWorld(normal,relief);");
    if(type==="pyramid"||type==="shell"){
      shader.fragmentShader=shader.fragmentShader.replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
        vec2 facing=abs(geWorld.x)>abs(geWorld.z)?vec2(sign(geWorld.x),0.):vec2(0.,sign(geWorld.z));
        vec3 slopeNormal=normalize(mat3(viewMatrix)*vec3(facing.x,.785,facing.y));
        normal=normalize(mix(normal,slopeNormal,.73*smoothstep(38.,270.,length(vViewPosition))));`);
    }
    if(type==="shell"){
      shader.vertexShader="attribute vec2 courseUV; varying vec2 geCourse;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\ngeCourse=courseUV;");
      shader.fragmentShader="varying vec2 geCourse;\n"+shader.fragmentShader.replace("#include <roughnessmap_fragment>",`
        float row=floor(geCourse.x+.1), seed=fract(sin(row*21.81+3.13)*2151.54);
        float u=abs(geWorld.x)>abs(geWorld.z)?geWorld.z:geWorld.x;
        float lane=u/(2.26+.71*seed)+seed*11.+.049*sin(u*.26+row*2.8);
        float edge=abs(fract(lane+.5)-.5),aa=max(.006,fwidth(lane)*.63);
        float seam=1.-smoothstep(.008-aa,.021+aa,edge);
        float separate=1.-smoothstep(.075,.52,aa);
        float patina=fract(sin(floor(lane)*17.14+row*9.41)*3874.2);
        float low=1.-smoothstep(0.,.23+min(.4,fwidth(geCourse.y)),geCourse.y);
        float bedding=texture2D(geNoise,vec2(geWorld.y*.010+.31,u*.0018+.57)).r;
        float bedBreak=texture2D(geNoise,vec2(row*.018,u*.0031)).g;
        float ochre=smoothstep(.47,.67,bedding);
        diffuseColor.rgb*=.62+.18*patina+.075*seed+.52*bedding+.11*bedBreak-.31*seam*separate-.14*low;
        diffuseColor.rgb*=mix(vec3(.94,.97,1.02),vec3(1.07,1.,.88),ochre);
        #include <roughnessmap_fragment>`);
    }
    if(type==="inner"||type==="graniteRoom"){
      const bounce=type==="inner"?`
        float h=geWorld.y-(22.1+(42.8-geWorld.z)*.493);
        float band=abs(fract((geWorld.z-2.4)/7.7)-.5)*7.7;
        float pool=exp(-.17*band*band)*exp(-.13*abs(h-1.6));
        float facet=.62+.38*abs(dot(normW,normalize(vec3(.31,.78,.48))));
        outgoingLight+=diffuseColor.rgb*facet*(vec3(.068,.059,.051)+vec3(.26,.144,.076)*pool);
        `:`
        float west=exp(-.21*abs(geWorld.x+.37)), low=exp(-.32*abs(geWorld.y-43.8));
        float wall=.35+.65*max(0.,dot(normW,normalize(vec3(.75,.44,.49))));
        outgoingLight+=diffuseColor.rgb*(vec3(.065,.058,.057)+vec3(.34,.205,.13)*west*low*wall);
        `;
      shader.fragmentShader=shader.fragmentShader.replace("#include <opaque_fragment>",bounce+"\n#include <opaque_fragment>");
    }
  };
  material.customProgramCacheKey=()=>"giza-surface-"+type;
  return material;
}
export function makeSurfaces(){
  noise??=mineralNoise();
  const stone=(hex,type="lime",r=.90)=>finish(new T.MeshStandardMaterial({color:hex,roughness:r,metalness:.01,envMapIntensity:.48}),type);
  const metal=(hex,m,r)=>finish(new T.MeshStandardMaterial({color:hex,roughness:r,metalness:m}),"metal");
  const plain=(color,roughness=.65,metalness=.05)=>new T.MeshStandardMaterial({color,roughness,metalness});
  return {
    limestone:stone(0xb39c82),pyramid:stone(0xbca382,"pyramid"),shell:stone(0xbca382,"shell"),light:stone(0xcbb798),red:stone(0x946f63,"granite",.65),recess:stone(0x735b44),
    gallery:stone(0xbda68b,"inner"),galleryLight:stone(0xc6ae90,"inner"),chamber:stone(0x947468,"graniteRoom",.62),coffer:stone(0x6b504b,"graniteRoom",.47),
    sand:stone(0xc9a783,"sand"),paving:stone(0xac9680),basalt:stone(0x42464a,"granite",.68),
    bronze:metal(0x413c3c,.56,.41),resin:metal(0x20252a,.32,.245),gold:metal(0xd5a454,.76,.29),
    bright:metal(0xddbb74,.70,.28),aged:metal(0x86643e,.57,.44),wood:stone(0x72422b,"lime",.80),
    blue:plain(0x24496a,.35,.18),teal:plain(0x37a1a1,.31,.24),coral:plain(0xa4462d,.44,.14),
    linen:stone(0xbdb29d,"lime",.77),ivory:plain(0xe2cba1,.32,.10),silver:metal(0xa9acad,.74,.25),
    lamp:new T.MeshBasicMaterial({color:new T.Color(2.9,1.13,.29)}),black:plain(0x111518,.32,.1)
  };
}
