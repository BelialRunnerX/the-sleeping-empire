import test from 'node:test';
import assert from 'node:assert/strict';
import { syncRendererSize } from '../engine/renderer-sizing.mjs';

function mockRenderer() {
  return {
    width: 1440, height: 900, ratio: 1, writes: [],
    getSize(target) { return target.set(this.width, this.height); },
    getPixelRatio() { return this.ratio; },
    setDrawingBufferSize(width, height, ratio) {
      this.writes.push([width, height, ratio]);
      Object.assign(this, { width, height, ratio });
    },
  };
}
test('motion-only and duplicate resize events preserve the drawing buffer', () => {
  const renderer = mockRenderer();
  for (let i = 0; i < 100; i++) assert.equal(syncRendererSize(renderer, 1440, 900, 1), false);
  assert.deepEqual(renderer.writes, []);
});
test('size and quality changes update drawing buffer once per actual change', () => {
  const renderer = mockRenderer();
  assert.equal(syncRendererSize(renderer, 1440, 900, 1.5), true);
  assert.equal(syncRendererSize(renderer, 1440, 900, 1.5), false);
  assert.equal(syncRendererSize(renderer, 900, 600, 1), true);
  assert.deepEqual(renderer.writes, [[1440, 900, 1.5], [900, 600, 1]]);
});
