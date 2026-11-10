#include "world/terrain.h"
#include "core/noise.h"
#include <iostream>
#include <iomanip>
using namespace ely;
int main(){std::cout<<std::setprecision(17);
for(uint64_t seed: {0ull,23ull,438102ull,18446744073709551615ull}){
 Noise n(seed); for(int i=0;i<96;i++){Vec3 p{-33.25+i*.713, -7.5+i*.037, .15-i*.347};std::cout<<"N "<<seed<<" "<<p.x<<" "<<p.y<<" "<<p.z<<" "<<n.sample(p)<<" "<<n.fbm(p,4)<<" "<<n.ridged(p,3)<<"\n";}
 PlanetParams params;params.seed=seed;params.radius=3000;Terrain t(params);
 for(int i=0;i<600;i++){const Vec3 dir=Vec3{1.+i*.017,.17-i*.013,-.39+i*.007}.normalised();const double base=-180+(i%13)*24,alt= i%3==0 ? base + (i%81-40)*.25 : -515+i*1.11,squash=.6+(i%27)*.1;
 std::cout<<"D "<<seed<<" "<<dir.x<<" "<<dir.y<<" "<<dir.z<<" "<<alt<<" "<<base<<" "<<squash<<" "<<t.density(dir,alt,base,squash)<<" "<<t.caveCarve(dir,alt,base)<<" "<<t.solidAt(dir,alt,base,squash)<<"\n";}
}
}
