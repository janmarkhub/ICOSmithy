
/**
 * Wraps a PNG Blob into an ICO container.
 * ICO format: Header (6 bytes) + Directory (16 bytes per entry) + Image Data
 */
export async function wrapPngInIco(pngBlob: Blob): Promise<Blob> {
  const pngBuffer = await pngBlob.arrayBuffer();
  const pngSize = pngBuffer.byteLength;
  
  // ICO Header
  const header = new ArrayBuffer(6);
  const hView = new DataView(header);
  hView.setUint16(0, 0, true);    // Reserved
  hView.setUint16(2, 1, true);    // Type (1 = ICO)
  hView.setUint16(4, 1, true);    // Number of images (1)

  // ICO Directory Entry (16 bytes)
  const directory = new ArrayBuffer(16);
  const dView = new DataView(directory);
  
  // Width and Height: 1 byte each. 0 means 256px. 
  // For HD sizes (>256), standard ICO behavior varies, but we'll use 0 as a placeholder.
  dView.setUint8(0, 0);           // Width
  dView.setUint8(1, 0);           // Height
  dView.setUint8(2, 0);           // Color palette (0 = no palette)
  dView.setUint8(3, 0);           // Reserved
  dView.setUint16(4, 1, true);    // Color planes
  dView.setUint16(6, 32, true);   // Bits per pixel
  dView.setUint32(8, pngSize, true); // Size of image data
  dView.setUint32(12, 6 + 16, true); // Offset to image data (header + 1 dir entry)

  const finalBlob = new Blob([header, directory, pngBuffer], { type: 'image/x-icon' });
  return finalBlob;
}
