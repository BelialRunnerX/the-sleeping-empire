// Three.setPixelRatio also resizes. Avoid reallocating the drawing buffer when
// only accessibility/motion settings change, and combine real changes once.
export function syncRendererSize(renderer, width, height, pixelRatio) {
  const size = renderer.getSize({
    set(x, y) { this.x = x; this.y = y; return this; },
  });
  if (size.x === width && size.y === height && renderer.getPixelRatio() === pixelRatio) {
    return false;
  }
  renderer.setDrawingBufferSize(width, height, pixelRatio);
  return true;
}
