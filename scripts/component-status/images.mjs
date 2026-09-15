import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export function compare_images(reference_buffer, actual_buffer) {
  const reference_image = PNG.sync.read(reference_buffer);
  const actual_image = PNG.sync.read(actual_buffer);
  const image_dimensions = { reference_width: reference_image.width, reference_height: reference_image.height, actual_width: actual_image.width, actual_height: actual_image.height };
  if (reference_image.width !== actual_image.width || reference_image.height !== actual_image.height) {
    return { status: 'failed', message: 'Capture dimensions differ. Images were not resized.', ...image_dimensions };
  }
  const difference_image = new PNG({ width: reference_image.width, height: reference_image.height });
  const different_pixels = pixelmatch(reference_image.data, actual_image.data, difference_image.data, reference_image.width, reference_image.height, { threshold: 0, includeAA: true });
  return { status: different_pixels === 0 ? 'passed' : 'failed', message: `${different_pixels.toLocaleString()} pixels differ in an exact comparison.`, different_pixels, total_pixels: reference_image.width * reference_image.height, ...image_dimensions, difference_buffer: PNG.sync.write(difference_image) };
}
