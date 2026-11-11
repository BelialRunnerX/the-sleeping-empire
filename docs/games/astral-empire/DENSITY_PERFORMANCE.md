# Native density allocation reduction

The terrain kernel now provides scalar `sample3`, `fbm3`, and `ridged3` paths.
Normal Array-backed density/cave calls no longer create coordinate arrays for
volume positions, scale transforms, or each noise octave. Arithmetic order,
BigInt seed/hash operations, gradients, cache limits, and cave thresholds are
unchanged. This is an allocation reduction, not a noise approximation.

Existing array APIs remain available. Typed-array inputs use the original path
to preserve typed-array rounding (especially Float32Array.map). Overridden public
noise/volume methods also retain the original dispatch path. No input is mutated.

## Verification

- `node --test tests/native-density-parity.test.mjs`: four differential tests pass.
  The independent oracle is `tests/fixtures/native-density-c943a13.mjs`, frozen
  before optimization. Coverage includes seven seed values (negative and 64-bit
  wraparound included), signed/boundary coordinates, octave/gain variations,
  27,720 boundary density/cave/solid cases, deep terrain, positive cave hits,
  typed arrays, input immutability, and customized public methods. Floating-point
  results are checked with strict equality, not a tolerance.
- `node tests/native-density.test.mjs`: all 2,784 C++ fixture rows / 8,352 scalars
  pass with maximum error zero; 150 expected carved cases.

## Controlled kernel timing

Set `DENSITY_BENCH=1` when running the parity test to reproduce the optional
benchmark. It uses 3,960 identical density/cave/solid input rows, fresh caches on
each trial, a JIT warmup pass for each implementation, nine alternating paired
trials, and exact checksum equality. There is no timing assertion in CI.

Windows / Node v24.19.0 measurement on 2026-11-11, after compatibility fallbacks:
legacy median **20.035 ms**, scalar median **14.813 ms** (about 26% lower elapsed
kernel time). Observed trial ranges: legacy 19.326–26.116 ms, scalar 14.512–18.125
ms. These are noisy local microbenchmarks, not gameplay, frame-time, or FPS
measurements. Integrated pipeline timing and broader suite results are tracked
separately from this isolated kernel batch.
