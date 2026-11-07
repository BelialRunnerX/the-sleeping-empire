import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("./", import.meta.url));
const compiler = process.env.CXX || process.env.ZIG || "zig";
const prefix = process.env.CXX
  ? ["--target=wasm32-unknown-unknown"]
  : ["c++", "-target", "wasm32-freestanding"];
const result = spawnSync(
  compiler,
  [
    ...prefix,
    "-std=c++17",
    "-O3",
    "-nostdlib",
    "-fno-exceptions",
    "-fno-rtti",
    "-Wl,--no-entry",
    "-Wl,--export-dynamic",
    root + "simulation.cpp",
    "-o",
    root + "simulation.wasm",
  ],
  { stdio: "inherit" },
);
if (result.error)
  console.error(
    "Install Zig 0.14.1+ and set ZIG to its executable.",
    result.error.message,
  );
process.exit(result.status ?? 1);
