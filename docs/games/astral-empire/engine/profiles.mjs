import { freshState, migrateState } from "./simulation.mjs";
const INDEX = "astral_empire_profiles_v1",
  SESSION = "astral_empire_session_v3";
export const profileId = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
export function localPinHash(id, pin) {
  let h = 2166136261;
  for (const c of id + "|" + String(pin)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
export class Profiles {
  constructor(storage) {
    this.storage = storage;
    this.active = null;
  }
  list() {
    try {
      const value = JSON.parse(this.storage.getItem(INDEX) || "[]");
      return Array.isArray(value)
        ? value.filter((v) => v && profileId(v.id) === v.id).slice(0, 8)
        : [];
    } catch {
      return [];
    }
  }
  key(id) {
    return "astral_empire_profile_" + id + "_v3";
  }
  login(name, pin, create = false) {
    const id = profileId(name),
      list = this.list();
    if (id.length < 2 || pin.length < 4 || pin.length > 12)
      throw Error(
        "Use a name of at least two letters and a 4–12 character local PIN.",
      );
    let profile = list.find((p) => p.id === id);
    if (create) {
      if (profile) throw Error("This profile already exists. Use Continue.");
      if (list.length >= 8)
        throw Error("This browser already has eight profiles.");
      profile = {
        id,
        name: String(name).trim().slice(0, 24),
        pinHash: localPinHash(id, pin),
        createdAt: Date.now(),
      };
      list.push(profile);
      this.storage.setItem(INDEX, JSON.stringify(list));
    } else if (!profile || profile.pinHash !== localPinHash(id, pin))
      throw Error("Profile or local PIN was not recognized.");
    let raw = this.storage.getItem(this.key(id));
    if (!raw) raw = this.storage.getItem("astral_empire_profile_" + id + "_v2");
    if (!raw && list.length === 1)
      raw = this.storage.getItem("astral_empire_v1");
    let state;
    try {
      state = raw
        ? migrateState(JSON.parse(raw))
        : freshState(crypto.getRandomValues(new Uint32Array(1))[0]);
    } catch {
      throw Error(
        "This save could not be read. Export or restore a backup before continuing.",
      );
    }
    this.active = profile;
    this.storage.setItem(SESSION, id);
    this.save(state);
    return state;
  }
  save(state) {
    if (!this.active) return;
    state.lastSaved = Date.now();
    const key = this.key(this.active.id),
      previous = this.storage.getItem(key);
    if (previous) this.storage.setItem(key + "_backup", previous);
    this.storage.setItem(key, JSON.stringify(state));
  }
  logout() {
    this.active = null;
    this.storage.removeItem(SESSION);
  }
}
