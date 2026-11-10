export const VOXEL_BODY={width:.6,height:3,step:.55,gravity:26};
const collides=(volume,x,y,z)=>volume.occupied([x-.3,y+.000001,z-.3],[x+.3,y+3,z+.3]);
export function findTerrainSpawn(volume,x,z,nearY) {
  for(let y=Math.ceil((nearY+8)*16)/16;y>=nearY-48;y-=1/16)
    if(!collides(volume,x,y,z)&&volume.occupied([x-.3,y-1/16,z-.3],[x+.3,y,z+.3]))return y;
  return nearY+8;
}
// Native-style swept axis movement, full-footprint support, sub-micro vertical
// steps, and an unobstructed rise corridor before a .55m step-up.
export function moveInTerrain(volume,p,dx,dz,dt,acceptHorizontal=()=>true,gravity=VOXEL_BODY.gravity,ready=()=>true) {
  dt=Math.min(.05,Math.max(0,dt));let foot=p.terrainY+p.y;
  if(!ready(p.x,foot,p.z))return;
  const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.3));
  for(let i=0;i<count;i++)for(const [axis,d]of [['x',dx/count],['z',dz/count]]){
    if(!d)continue;const x=p.x+(axis==='x'?d:0),z=p.z+(axis==='z'?d:0);if(!acceptHorizontal(x,z)||!ready(x,foot,z))continue;
    if(!collides(volume,x,foot,z)){p.x=x;p.z=z;continue;}
    if(p.y!==0||p.velocityY>0)continue;
    for(let rise=1/16;rise<=VOXEL_BODY.step;rise+=1/16){
      if(volume.occupied([p.x-.3,foot+3,p.z-.3],[p.x+.3,foot+3+rise,p.z+.3]))break;
      if(!ready(x,foot+rise,z))break;
      if(!collides(volume,x,foot+rise,z)){p.x=x;p.z=z;foot+=rise;p.terrainY+=rise;break;}
    }
  }
  const supported=volume.occupied([p.x-.3,foot-1/1024,p.z-.3],[p.x+.3,foot,p.z+.3]);
  if(supported&&p.velocityY<=0){p.terrainY=foot;p.y=0;p.velocityY=0;return;}
  const previousVelocity=p.velocityY;
  p.velocityY-=gravity*dt;const delta=p.velocityY*dt,steps=Math.max(1,Math.ceil(Math.abs(delta)/(1/32))),step=delta/steps;
  for(let i=0;i<steps;i++){
    if(!ready(p.x,foot+step,p.z)){p.velocityY=previousVelocity;break;}
    if(!collides(volume,p.x,foot+step,p.z)){foot+=step;continue;}
    let lo=0,hi=1;for(let j=0;j<12;j++){const t=(lo+hi)/2;if(collides(volume,p.x,foot+step*t,p.z))hi=t;else lo=t;}foot+=step*lo;
    if(step<0){p.terrainY=foot;p.y=0;}p.velocityY=0;break;
  }
  p.y=foot-p.terrainY;
}
