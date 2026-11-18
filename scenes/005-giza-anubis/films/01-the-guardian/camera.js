// Physical camera paths, in metres local to the court, the standing figure, the cabinet or the jackal.
export const fps=30;
export const shots=[
  {id:"guardian-at-giza",space:"court",frames:120,fov:[61,59],light:0,iris:1.3,
   eye:[[1.18,1.26,19.3],[1.30,1.19,18.20],[2.02,1.34,16.95]],
   aim:[[1.55,8.18,-1.75],[1.82,8.08,-1.85],[2.05,8.07,-1.9]]},
  {id:"the-grip",space:"guardian",frames:108,fov:[39,37],light:0,iris:3.4,
   eye:[[-6.90,7.24,7.54],[-6.18,7.94,7.06],[-5.28,8.60,6.48]],
   aim:[[-1.43,8.45,.53],[-1.04,9.31,.55],[-.48,10.56,.54]]},
  {id:"the-watch",space:"guardian",frames:138,fov:[37,35],light:0,iris:3.8,
   eye:[[5.50,13.26,7.65],[4.80,13.60,7.15],[3.96,13.92,6.85]],
   aim:[[.68,13.58,.22],[.62,13.61,.24],[.54,13.63,.26]]},
  {id:"the-gold-doors",space:"cabinet",frames:90,fov:[54,52],light:.12,iris:2.5,
   eye:[[-1.65,2.04,7.95],[-1.08,1.91,7.49],[-.56,1.78,7.05]],
   aim:[[.0,1.64,.81],[.0,1.59,.81],[.0,1.54,.82]]},
  {id:"unsealing",space:"cabinet",frames:171,fov:[51,44],light:.12,iris:3.3,
   eye:[[.18,1.72,5.89],[.08,1.57,4.39],[.04,1.48,2.72]],
   aim:[[0,1.54,.88],[-.02,1.41,.57],[-.035,1.34,.37]]},
  {id:"the-gilded-chest",space:"jackal",frames:105,fov:[28,30],light:.16,iris:4.5,
   eye:[[.89,.125,-.12],[.85,.155,.095],[.81,.202,.30]],
   aim:[[.00,.145,-.11],[.00,.155,.01],[.005,.178,.16]]},
  {id:"the-second-guardian",space:"jackal",frames:138,fov:[32,29],light:.16,iris:4.1,
   eye:[[.73,.54,1.10],[.60,.55,1.00],[.47,.55,.96]],
   aim:[[.005,.457,.29],[.002,.465,.30],[.000,.469,.31]]}
];
export const frameCount=shots.reduce((total,s)=>total+s.frames,0);
function arc(points,t){
  const u=1-t;
  return points[0].map((a,i)=>u*u*a+2*u*t*points[1][i]+t*t*points[2][i]);
}
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function framePose(index){
  let i=Math.max(0,Math.min(frameCount-1,Math.floor(index)));
  for(const s of shots){
    if(i<s.frames){
      const u=i/(s.frames-1),t=.72*u+.28*smooth(u);
      const opening=s.id==="unsealing"?smooth((u-.06)/.64):s.space==="jackal"?1:0;
      return {id:s.id,space:s.space,eye:arc(s.eye,t),aim:arc(s.aim,t),fov:s.fov[0]+(s.fov[1]-s.fov[0])*t,light:s.light,iris:s.iris,opening};
    }
    i-=s.frames;
  }
}
