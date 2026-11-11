export function provideCraftStation(s, kind = "foundry") {
  s.production.stations["placed-250"] = {kind, realm:s.realm, x:s.position.x+2,z:s.position.z,tier:3,jobs:[],output:{},xp:{},completed:0};
}
