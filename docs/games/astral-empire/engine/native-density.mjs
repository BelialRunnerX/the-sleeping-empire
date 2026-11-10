// Exact numerical slice of C:\ElysiumDev\playable_baseline.
// Ported: seed.h, noise.h, Terrain::density(base,squash), caveCarve, solidAt.
// Caller supplies native unit direction, radius, altitude, base and squash.
// NOT ported: planet generator, climate/terrainHeight, biomes, material/ore, cube-sphere mapping.
const U=n=>BigInt.asUintN(64,n), GOLD=0x9E3779B97F4A7C15n;
export function mix(z){z=U(z+GOLD);z=U((z^(z>>30n))*0xBF58476D1CE4E5B9n);z=U((z^(z>>27n))*0x94D049BB133111EBn);return U(z^(z>>31n));}
export function labelHash(s){let h=0xCBF29CE484222325n;for(const n of new TextEncoder().encode(s))h=U((h^BigInt(n))*0x100000001B3n);return h;}
export function hash3(x,y,z){return mix(U(BigInt(x)*GOLD)^mix(U(BigInt(y)*0xC2B2AE3D27D4EB4Fn))^mix(U(BigInt(z)*0x165667B19E3779F9n)));}
const lerp=(a,b,t)=>a+(b-a)*t, smooth=t=>t*t*t*(t*(t*6-15)+10), clamp=(v,l,h)=>v<l?l:v>h?h:v;
export class Noise{
 constructor(seed){this.seed=U(BigInt(seed));this.gradients=new Map();this.cells=new Map();this.lastX=NaN;this.lastY=NaN;this.lastZ=NaN;this.lastCell=0;}
 gradientIndex(x,y,z){const key=x+":"+y+":"+z;let g=this.gradients.get(key);if(g===undefined){g=Number((hash3(x,y,z)^this.seed)&15n);if(this.gradients.size>=16384)this.gradients.clear();this.gradients.set(key,g);}return g;}
 grad(x,y,z,dx,dy,dz){switch(this.gradientIndex(x,y,z)){
 case 0:return dx+dy;case 1:return -dx+dy;case 2:return dx-dy;case 3:return -dx-dy;
 case 4:return dx+dz;case 5:return -dx+dz;case 6:return dx-dz;case 7:return -dx-dz;
 case 8:return dy+dz;case 9:return -dy+dz;case 10:return dy-dz;case 11:return -dy-dz;
 case 12:return dx+dy;case 13:return -dy+dz;case 14:return -dx+dy;default:return -dy-dz;}}
 gradientValue(index,dx,dy,dz){switch(index){
 case 0:return dx+dy;case 1:return -dx+dy;case 2:return dx-dy;case 3:return -dx-dy;
 case 4:return dx+dz;case 5:return -dx+dz;case 6:return dx-dz;case 7:return -dx-dz;
 case 8:return dy+dz;case 9:return -dy+dz;case 10:return dy-dz;case 11:return -dy-dz;
 case 12:return dx+dy;case 13:return -dy+dz;case 14:return -dx+dy;default:return -dy-dz;}}
 cell(x,y,z){
 if(x===this.lastX&&y===this.lastY&&z===this.lastZ)return this.lastCell;
 const key=x+":"+y+":"+z;let packed=this.cells.get(key);
 if(packed===undefined){packed=0;for(let k=0;k<8;k++)packed|=this.gradientIndex(x+(k&1),y+((k>>1)&1),z+((k>>2)&1))<<(4*k);if(this.cells.size>=4096)this.cells.clear();this.cells.set(key,packed);}
 this.lastX=x;this.lastY=y;this.lastZ=z;this.lastCell=packed;return packed;
 }
 sample([x,y,z]){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),tx=x-ix,ty=y-iy,tz=z-iz,ux=smooth(tx),uy=smooth(ty),uz=smooth(tz);
 const packed=this.cell(ix,iy,iz);
 const c000=this.gradientValue((packed >>> 0) & 15,tx,ty,tz),c100=this.gradientValue((packed >>> 4) & 15,tx-1,ty,tz),c010=this.gradientValue((packed >>> 8) & 15,tx,ty-1,tz),c110=this.gradientValue((packed >>> 12) & 15,tx-1,ty-1,tz),c001=this.gradientValue((packed >>> 16) & 15,tx,ty,tz-1),c101=this.gradientValue((packed >>> 20) & 15,tx-1,ty,tz-1),c011=this.gradientValue((packed >>> 24) & 15,tx,ty-1,tz-1),c111=this.gradientValue((packed >>> 28) & 15,tx-1,ty-1,tz-1);
 return lerp(lerp(lerp(c000,c100,ux),lerp(c010,c110,ux),uy),lerp(lerp(c001,c101,ux),lerp(c011,c111,ux),uy),uz);}
 fbm(p,octaves,lacunarity=2,gain=.5){let sum=0,amp=1,norm=0,freq=1;for(let i=0;i<octaves;i++){sum+=this.sample(p.map(n=>n*freq))*amp;norm+=amp;amp*=gain;freq*=lacunarity;}return norm>0?sum/norm:0;}
 ridged(p,octaves,lacunarity=2,gain=.5){let sum=0,amp=1,norm=0,freq=1;for(let i=0;i<octaves;i++){const n=1-Math.abs(this.sample(p.map(n=>n*freq)));sum+=n*n*amp;norm+=amp;amp*=gain;freq*=lacunarity;}return norm>0?sum/norm*2-1:0;}
}
export class DensitySlice{
 constructor(seed,radius){this.radius=radius;for(const name of ['large','small','caveA','caveB','chamber','fissure'])this[name]=new Noise(mix(U(BigInt(seed))^labelHash(name)));}
 volumePos(dir,alt){return dir.map(n=>n*(this.radius+alt));}
 density(dir,alt,base,squash){const fp=this.volumePos(dir,alt);let d=(base-alt)/squash;const near=clamp(1-Math.abs(base-alt)/40,0,1);if(near>0){d+=this.large.fbm(fp.map(n=>n/180),3)*2.2*near;d+=this.small.fbm(fp.map(n=>n/45),2)*.9*near;}if(alt< -440)d+=(-440-alt)*.06;return d;}
 caveCarve(dir,alt,surfaceHint){if(alt>140||alt< -498)return 0;const under=surfaceHint-alt;if(under<8)return 0;const near=under<24,fp=this.volumePos(dir,alt),widen=1+clamp(-alt/420,0,1)*.45,r=.042*widen,r2=r*r;
 if(!near){const a=this.caveA.fbm(fp.map(n=>n/78),3);if(a*a<r2){const b=this.caveB.fbm(fp.map(n=>n/78),3);if(a*a+b*b<r2)return 1;}}
 const bias=clamp(1-Math.abs(alt+210)/260,0,1);if(!near&&bias>0){const ch=this.chamber.fbm(fp.map(n=>n/165),3);if(ch>.50-.12*bias)return 1;}
 if(alt> -200){const sq=[fp[0],fp[1]*.14,fp[2]],f=this.fissure.fbm(sq.map(n=>n/62),2);if(Math.abs(f)<(near?.0022:.020))return 1;}return 0;}
 solidAt(dir,alt,base,squash){const reach=3.4*squash;if(alt>base+reach)return false;if(alt<base-reach)return this.caveCarve(dir,alt,base)<=0;if(this.density(dir,alt,base,squash)<=0)return false;return this.caveCarve(dir,alt,base)<=0;}
}
