import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export interface CompareResult {
  diffRatio: number;      // 0–1 fraction of pixels that differ
  diffPixels: number;
  totalPixels: number;
  diffImagePath: string;
  sizeMismatch: boolean;
}

/**
 * Compares two PNG files using pixelmatch.
 * Writes a diff PNG next to the actual image.
 *
 * @param figmaPath  Path to the downloaded Figma reference PNG
 * @param actualPath Path to the Playwright element screenshot
 * @param threshold  Per-pixel colour threshold 0–1 (default 0.15)
 */
export function compareImages(
  figmaPath: string,
  actualPath: string,
  threshold = 0.15,
): CompareResult {
  const figmaImg  = PNG.sync.read(fs.readFileSync(figmaPath));
  const actualImg = PNG.sync.read(fs.readFileSync(actualPath));

  if (figmaImg.width !== actualImg.width || figmaImg.height !== actualImg.height) {
    // Still write a side-by-side diff file but flag as size mismatch.
    const maxW = Math.max(figmaImg.width,  actualImg.width);
    const maxH = Math.max(figmaImg.height, actualImg.height);
    const diff = new PNG({ width: maxW * 2, height: maxH });
    diff.data.fill(0xff);       // white
    // blit figma left, actual right
    PNG.bitblt(figmaImg,  diff, 0, 0, figmaImg.width,  figmaImg.height,  0,    0);
    PNG.bitblt(actualImg, diff, 0, 0, actualImg.width, actualImg.height, maxW, 0);
    const diffImagePath = actualPath.replace('.png', '-diff.png');
    fs.writeFileSync(diffImagePath, PNG.sync.write(diff));
    return { diffRatio: 1, diffPixels: maxW * maxH, totalPixels: maxW * maxH, diffImagePath, sizeMismatch: true };
  }

  const { width, height } = figmaImg;
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(
    figmaImg.data, actualImg.data, diff.data,
    width, height,
    { threshold, includeAA: true },
  );

  const diffImagePath = actualPath.replace('.png', '-diff.png');
  fs.writeFileSync(diffImagePath, PNG.sync.write(diff));

  return {
    diffRatio:   diffPixels / (width * height),
    diffPixels,
    totalPixels: width * height,
    diffImagePath,
    sizeMismatch: false,
  };
}
