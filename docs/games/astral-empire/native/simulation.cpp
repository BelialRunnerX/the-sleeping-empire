// Browser ABI: freestanding C++17, compiled to WebAssembly without a C++ runtime.
// Pure numeric Elysium rules and action-combat mitigation; no host imports.
using u32 = unsigned int;
extern "C" {
__attribute__((export_name("world_hash"))) u32 world_hash(int seed, int x, int z) {
    u32 h = u32(seed) ^ (u32(x) * 374761393u) ^ (u32(z) * 668265263u);
    h = (h ^ (h >> 13)) * 1274126177u;
    return h ^ (h >> 16);
}
__attribute__((export_name("world_tier"))) int world_tier(int level, int deepest) {
    int tier = level > 0 ? level / 10 : 0;
    return tier > deepest ? tier : (deepest > 0 ? deepest : 0);
}
__attribute__((export_name("ore_yield"))) int ore_yield(int tier, double roll) {
    if (tier < 0) tier = 0;
    return 1 + (roll < double(tier) / (tier + 6.0) ? tier / 3 : 0);
}
__attribute__((export_name("resolve_damage"))) double resolve_damage(double base, double increased, double more, double armor, double penetration, int critical, double critMultiplier) {
    double hit = base * (1.0 + increased) * more;
    if (critical) hit *= critMultiplier;
    double effective = armor * (1.0 - penetration);
    if (effective < 0) effective = 0;
    // Armor is weaker against large hits, creating a meaningful mitigation tradeoff.
    return hit * (1.0 - effective / (effective + 8.0 * hit + 1.0));
}
__attribute__((export_name("abi_version"))) int abi_version() { return 1; }
}
