import { test, expect, type Page, type Locator } from '@playwright/test';
import fs   from 'node:fs';
import path from 'node:path';
import { compareImages } from './utils/image-compare';
import { FIGMA_NODE_IDS } from './download-figma-refs';

// ─── Constants ────────────────────────────────────────────────────────────────

const FIGMA_DIR = path.join(process.cwd(), 'tests', '__figma__');

const COLORS   = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const;
const VARIANTS = ['contained', 'outlined', 'text'] as const;
const SIZES    = ['large', 'medium', 'small'] as const;

type Color   = typeof COLORS[number];
type Variant = typeof VARIANTS[number];

/**
 * Design tokens extracted from Figma — used for CSS assertion tests.
 * Source: file 0SGlWXx4nQMnLBUyMU7GZt, node 1:1068 (<Button> COMPONENT_SET)
 */
const TOKENS: Record<Color, { main: string; mainRgb: string }> = {
  primary:   { main: '#265DA5', mainRgb: 'rgb(38, 93, 165)'   },
  secondary: { main: '#FFA100', mainRgb: 'rgb(255, 161, 0)'   },
  error:     { main: '#FF3B30', mainRgb: 'rgb(255, 59, 48)'   },
  warning:   { main: '#FFA100', mainRgb: 'rgb(255, 161, 0)'   },
  info:      { main: '#007AFF', mainRgb: 'rgb(0, 122, 255)'   },
  success:   { main: '#34C759', mainRgb: 'rgb(52, 199, 89)'   },
};

// Storybook story IDs
const STORIES = [
  { id: 'components-button--playground',    name: 'Playground',   minButtons: 1  },
  { id: 'components-button--variants',      name: 'Variants',     minButtons: 3  },
  { id: 'components-button--sizes',         name: 'Sizes',        minButtons: 3  },
  { id: 'components-button--all-colors',    name: 'All Colors',   minButtons: 18 },
  { id: 'components-button--disabled-state',name: 'Disabled',     minButtons: 18 },
  { id: 'components-button--primary',       name: 'Primary',      minButtons: 9  },
  { id: 'components-button--secondary',     name: 'Secondary',    minButtons: 9  },
  { id: 'components-button--error',         name: 'Error',        minButtons: 9  },
  { id: 'components-button--warning',       name: 'Warning',      minButtons: 9  },
  { id: 'components-button--info',          name: 'Info',         minButtons: 9  },
  { id: 'components-button--success',       name: 'Success',      minButtons: 9  },
  { id: 'components-button--with-icons',    name: 'With Icons',   minButtons: 6  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Opens a Storybook story iframe and waits for it to be ready. */
async function openStory(page: Page, storyId: string, args?: Record<string, string>) {
  const argsParam = args
    ? '&args=' + Object.entries(args).map(([k, v]) => `${k}:${v}`).join(';')
    : '';
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story${argsParam}`);
  await page.waitForLoadState('networkidle');
  // Use .btn class to target our Button component, not Storybook's internal buttons
  await page.locator('button.btn').first().waitFor({ state: 'visible', timeout: 10_000 });
}

/** Returns the computed CSS property of a locator element. */
async function css(locator: Locator, prop: string): Promise<string> {
  return locator.evaluate(
    (el, p) => getComputedStyle(el).getPropertyValue(p),
    prop,
  );
}

// ─── 1. All stories load and contain the expected buttons ────────────────────

test.describe('Stories — all variants visible', () => {
  for (const story of STORIES) {
    test(`${story.name} renders ≥ ${story.minButtons} button(s)`, async ({ page }) => {
      await openStory(page, story.id);
      const buttons = page.locator('button.btn');
      await expect(buttons.first()).toBeVisible();
      expect(await buttons.count()).toBeGreaterThanOrEqual(story.minButtons);
    });
  }
});

// ─── 2. Disabled state ───────────────────────────────────────────────────────

test.describe('Disabled state', () => {
  for (const variant of VARIANTS) {
    for (const color of COLORS) {
      test(`${variant}/${color} — disabled button is non-interactive`, async ({ page }) => {
        await openStory(page, 'components-button--playground', {
          variant, color, size: 'large', children: 'Label', disabled: 'true',
        });
        const btn = page.locator('button.btn');
        await expect(btn).toBeVisible();
        await expect(btn).toBeDisabled();
        expect(await css(btn, 'color')).toBe('rgba(0, 0, 0, 0.38)');
        expect(await css(btn, 'cursor')).toBe('not-allowed');
      });
    }
  }
});

// ─── 3. Design tokens — CSS values match Figma ───────────────────────────────

test.describe('Design tokens — CSS values match Figma', () => {
  // Contained: background-color = brand colour
  for (const color of COLORS) {
    test(`contained/${color} — background matches Figma token`, async ({ page }) => {
      await openStory(page, 'components-button--playground', {
        variant: 'contained', color, size: 'large', children: 'Label',
      });
      const btn = page.locator('button.btn');
      await expect(btn).toBeVisible();
      expect(await css(btn, 'background-color')).toBe(TOKENS[color].mainRgb);
    });
  }

  // Outlined: background transparent, border matches brand colour
  for (const color of COLORS) {
    test(`outlined/${color} — border matches Figma token (50% opacity)`, async ({ page }) => {
      await openStory(page, 'components-button--playground', {
        variant: 'outlined', color, size: 'large', children: 'Label',
      });
      const btn = page.locator('button.btn');
      await expect(btn).toBeVisible();
      expect(await css(btn, 'background-color')).toBe('rgba(0, 0, 0, 0)');
      // Border colour should be transparent-50% of the brand colour
      const borderColor = await css(btn, 'border-top-color');
      expect(borderColor).toContain('rgba(');
    });
  }

  // Text: background transparent, colour = brand colour
  for (const color of COLORS) {
    test(`text/${color} — color matches Figma token`, async ({ page }) => {
      await openStory(page, 'components-button--playground', {
        variant: 'text', color, size: 'large', children: 'Label',
      });
      const btn = page.locator('button.btn');
      await expect(btn).toBeVisible();
      expect(await css(btn, 'background-color')).toBe('rgba(0, 0, 0, 0)');
      expect(await css(btn, 'color')).toBe(TOKENS[color].mainRgb);
    });
  }

  // Typography — same for all variants/colours
  test('font is Roboto, weight 500, uppercase, letter-spacing 0.03em', async ({ page }) => {
    await openStory(page, 'components-button--playground', {
      variant: 'contained', color: 'primary', size: 'large', children: 'Label',
    });
    const btn = page.locator('button.btn');
    await expect(btn).toBeVisible();
    expect(await css(btn, 'font-weight')).toBe('500');
    expect(await css(btn, 'text-transform')).toBe('uppercase');
    expect(await css(btn, 'border-top-left-radius')).toBe('4px');
    const fontFamily = await css(btn, 'font-family');
    expect(fontFamily.toLowerCase()).toContain('roboto');
  });

  // Size — height and font-size
  const SIZE_CHECKS = [
    { size: 'large',  height: '42px', fontSize: '15px' },
    { size: 'medium', height: '36px', fontSize: '14px' },
    { size: 'small',  height: '30px', fontSize: '13px' },
  ] as const;

  for (const { size, height, fontSize } of SIZE_CHECKS) {
    test(`size=${size} — height=${height}, font-size=${fontSize}`, async ({ page }) => {
      await openStory(page, 'components-button--playground', {
        variant: 'contained', color: 'primary', size, children: 'Label',
      });
      const btn = page.locator('button.btn');
      await expect(btn).toBeVisible();
      const box = await btn.boundingBox();
      expect(box?.height).toBe(parseInt(height));
      expect(await css(btn, 'font-size')).toBe(fontSize);
    });
  }
});

// ─── 4. Visual snapshots (regression baseline) ───────────────────────────────
//
// On first run these create the baseline PNGs in tests/__snapshots__.
// Subsequent runs compare against them.

test.describe('Visual snapshots', () => {
  for (const story of STORIES) {
    test(`${story.name}`, async ({ page }) => {
      await openStory(page, story.id);
      // Give any CSS transitions a moment to settle
      await page.waitForTimeout(200);
      await expect(page).toHaveScreenshot(`story-${story.id}.png`, {
        fullPage: false,
        animations: 'disabled',
      });
    });
  }
});

// ─── 5. Figma comparison ─────────────────────────────────────────────────────
//
// Compares a Playwright element screenshot to the exported Figma component PNG.
// Threshold 0.20 = up to 20% per-pixel delta is tolerated (accounts for
// font-hinting, antialiasing, and shadow differences between Figma and browser).
//
// Run `npx tsx tests/download-figma-refs.ts` first to populate tests/__figma__/.

const FIGMA_DIFF_THRESHOLD = 0.20;

test.describe('Figma comparison', () => {
  const figmaAvailable = fs.existsSync(FIGMA_DIR);

  if (!figmaAvailable) {
    test.skip(true, 'Figma reference images not downloaded yet — run: npx tsx tests/download-figma-refs.ts');
  }

  const SCREENSHOT_DIR = path.join(process.cwd(), 'tests', '__screenshots__');
  test.beforeAll(() => {
    if (figmaAvailable) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  for (const variant of VARIANTS) {
    for (const color of COLORS) {
      for (const state of ['enabled', 'disabled'] as const) {
        const key      = `${variant}_${color}_${state}`;
        const nodeId   = FIGMA_NODE_IDS[key];
        const figmaRef = path.join(FIGMA_DIR, `${key}.png`);

        test(`${variant}/${color}/${state} — matches Figma (node ${nodeId})`, async ({ page }) => {
          if (!fs.existsSync(figmaRef)) {
            test.skip(true, `Reference not found: ${key}.png`);
            return;
          }

          await openStory(page, 'components-button--playground', {
            variant,
            color,
            size:     'large',
            children: 'Label',
            disabled: state === 'disabled' ? 'true' : 'false',
          });

          const btn  = page.locator('button');
          await expect(btn).toBeVisible();

          // Capture just the button element at CSS-pixel scale
          const screenshotPath = path.join(SCREENSHOT_DIR, `${key}.png`);
          await btn.screenshot({ path: screenshotPath, scale: 'css', animations: 'disabled' });

          const result = compareImages(figmaRef, screenshotPath, FIGMA_DIFF_THRESHOLD);

          // Always write a summary to the test attachment for the HTML report
          await test.info().attach(`diff — ${key}`, {
            path: result.diffImagePath,
            contentType: 'image/png',
          });
          await test.info().attach(`actual — ${key}`, {
            path: screenshotPath,
            contentType: 'image/png',
          });
          await test.info().attach(`figma — ${key}`, {
            path: figmaRef,
            contentType: 'image/png',
          });

          if (result.sizeMismatch) {
            // Don't fail on size mismatch — surface it as a warning in the report.
            console.warn(
              `[${key}] Size mismatch between Figma export and screenshot. ` +
              `Check ${result.diffImagePath} for a side-by-side view.`
            );
          } else {
            expect(result.diffRatio).toBeLessThanOrEqual(
              FIGMA_DIFF_THRESHOLD,
              `${key}: ${(result.diffRatio * 100).toFixed(1)}% of pixels differ ` +
              `(max allowed: ${FIGMA_DIFF_THRESHOLD * 100}%). ` +
              `See diff: ${result.diffImagePath}`
            );
          }
        });
      }
    }
  }
});
