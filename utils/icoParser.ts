
/**
 * Parses an ICO file binary to find the largest internal image.
 * High-res icons (256x256) are often stored as PNGs inside the ICO container.
 */
export async function parseIcoAndGetLargestImage(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const view = new DataView(arrayBuffer);

  // ICO Header: 2 bytes reserved (0), 2 bytes type (1 for ICO), 2 bytes count
  const type = view.getUint16(2, true);
  if (type !== 1) {
    throw new Error('Not a valid ICO file');
  }

  const count = view.getUint16(4, true);
  
  let maxWidth = 0;
  let bestOffset = 0;
  let bestSize = 0;

  // Each directory entry is 16 bytes
  for (let i = 0; i < count; i++) {
    const base = 6 + (i * 16);
    let w = view.getUint8(base);
    let h = view.getUint8(base + 1);
    
    // In ICO, 0 means 256px
    if (w === 0) w = 256;
    if (h === 0) h = 256;

    const size = view.getUint32(base + 8, true);
    const offset = view.getUint32(base + 12, true);

    // Prioritize width, then size (as proxy for bit depth/quality)
    if (w >= maxWidth) {
      if (w > maxWidth || size > bestSize) {
        maxWidth = w;
        bestOffset = offset;
        bestSize = size;
      }
    }
  }

  if (bestSize === 0) {
    return file; // Fallback to the whole file if parsing is ambiguous
  }

  const bestImageData = arrayBuffer.slice(bestOffset, bestOffset + bestSize);
  
  // Check if it's a PNG signature (0x89 0x50 0x4E 0x47)
  const isPng = new Uint8Array(bestImageData.slice(0, 4)).every((v, i) => [0x89, 0x50, 0x4E, 0x47][i] === v);
  
  return new Blob([bestImageData], { type: isPng ? 'image/png' : 'image/x-icon' });
}
