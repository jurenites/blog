import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createServer as create_vite_server } from "vite";
import { chromium as chromium_browser } from "playwright";

test("shared channel byline keeps diagonal avatar overlap and independent names", async (test_context) => {
  const browser_instance = await chromium_browser.launch({ headless: true });
  test_context.after(() => browser_instance.close());
  const vite_server = await create_vite_server({
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
  });
  test_context.after(() => vite_server.close());
  const { author_byline_markup } = await vite_server.ssrLoadModule("/src/stories/molecules/author-byline/author-byline.markup.js");
  const theme_styles = await readFile("web/themes/custom/jurenites_theme/css/style.min.css", "utf8");
  const browser_page = await browser_instance.newPage();
  // Keep verification local, including any font or image URLs in the CSS.
  await browser_page.route("**/*", (browser_route) => browser_route.abort());
  for (const viewport_width of [1280, 360]) {
    await browser_page.setViewportSize({ width: viewport_width, height: 500 });
    for (const [avatar_size, avatar_diameter] of [["small", 16], ["medium", 24], ["large", 32], ["big", 40]]) {
      const fixture_markup = author_byline_markup({
        author_name: "First Channel",
        author_url: "https://www.youtube.com/@first-channel",
        avatar_initials: "FC",
        avatar_size,
        coauthor_name: "Second Channel",
        coauthor_url: "https://www.youtube.com/@second-channel",
        coauthor_avatar_initials: "SC",
      });
      await browser_page.setContent(`<style>${theme_styles}</style>${fixture_markup}`);
      const first_avatar = await browser_page.locator(".author-identity__avatar-primary .avatar").boundingBox();
      const second_avatar = await browser_page.locator(".author-identity__avatar-secondary .avatar").boundingBox();
      assert.equal(first_avatar.width, avatar_diameter);
      assert.equal(first_avatar.height, avatar_diameter);
      assert.equal(second_avatar.width, avatar_diameter);
      assert.equal(second_avatar.x - first_avatar.x, avatar_diameter / 2);
      assert.equal(second_avatar.y - first_avatar.y, avatar_diameter / 2);
      assert.equal(await browser_page.locator(".author-identity__name a").count(), 2);
      assert.equal(await browser_page.locator(".author-identity__coauthor-separator").textContent(), "&");
      assert.equal(await browser_page.locator(".author-identity__coauthor-separator").evaluate((separator_element) => getComputedStyle(separator_element).color), await browser_page.locator(".author-identity__prefix").evaluate((prefix_element) => getComputedStyle(prefix_element).color));
      assert.equal(await browser_page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
  }
  await browser_page.setContent(`<style>${theme_styles}</style>${author_byline_markup({
    author_name: "A long first channel name that wraps on phones",
    author_url: "https://www.youtube.com/@first-channel",
    avatar_initials: "FC",
    avatar_size: "small",
    coauthor_name: "A long second channel name that also wraps on phones",
    coauthor_avatar_initials: "SC",
  })}`);
  assert.equal(await browser_page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await browser_page.setContent(`<style>${theme_styles}</style>${author_byline_markup({
    author_name: "Single Channel", avatar_initials: "SC", avatar_size: "small",
  })}`);
  assert.equal(await browser_page.locator(".avatar").count(), 1);
  assert.equal(await browser_page.locator(".author-identity__coauthor-separator").count(), 0);
  if (process.env.COAUTHOR_SCREENSHOT_PATH) {
    const primary_image = await readFile("src/public/assets/images/technology-stack/godot.svg");
    const secondary_image = await readFile("src/public/assets/images/technology-stack/blender-white.svg");
    await browser_page.setViewportSize({ width: 600, height: 100 });
    await browser_page.setContent(`<style>${theme_styles}</style>${author_byline_markup({
      author_name: "First Channel",
      author_url: "https://www.youtube.com/@first-channel",
      avatar_initials: "FC",
      avatar_size: "small",
      avatar_image_url: `data:image/svg+xml;base64,${primary_image.toString("base64")}`,
      coauthor_name: "Second Channel",
      coauthor_url: "https://www.youtube.com/@second-channel",
      coauthor_avatar_initials: "SC",
      coauthor_avatar_image_url: `data:image/svg+xml;base64,${secondary_image.toString("base64")}`,
    })}`);
    await browser_page.locator(".author-byline").screenshot({ path: process.env.COAUTHOR_SCREENSHOT_PATH });
  }
});
