import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const browser_instance = await chromium.launch({ headless: true });
try {
  const browser_context = await browser_instance.newContext();
  const page_instance = await browser_context.newPage();
  for (const viewport_width of [1280, 390]) {
    await page_instance.setViewportSize({ width: viewport_width, height: 1000 });
    for (const language_path of ['/', '/ru']) {
      await page_instance.goto(`http://jurenites.local${language_path}`, { waitUntil: 'networkidle' });
      const notice_dismiss = page_instance.locator('[data-jurenites-cookie-policy-dismiss]');
      if (await notice_dismiss.isVisible()) await notice_dismiss.click();
      const footer_root = page_instance.locator('.footer-navigation');
      const recruiter_section = footer_root.locator('.footer-navigation__section');
      assert.equal(await recruiter_section.count(), 1);
      assert.equal(await recruiter_section.locator('h3').textContent(), language_path === '/' ? 'For recruiters' : 'Для рекрутеров');
      assert.equal(await recruiter_section.locator('.footer-navigation__section-description').textContent(), language_path === '/' ? 'Actively looking for a job' : 'Активно ищу работу');
      assert.deepEqual(await recruiter_section.locator('a').evaluateAll((link_nodes) => link_nodes.map((link_node) => (link_node.querySelector('.footer-navigation__social-label-text--default') || link_node.querySelector('.footer-navigation__link-label')).textContent.trim())), ['LinkedIn', 'hh.ru', language_path === '/' ? 'My CV' : 'Моё резюме']);
      assert.equal(await recruiter_section.locator('a[href*="docs.google.com/document/d/1Aec-"]').count(), 1);
      const contact_column = footer_root.locator('.footer-navigation__columns > nav').filter({ has: page_instance.locator('.footer-navigation__section') });
      assert.equal(await contact_column.locator('a[href="mailto:jurenites@gmail.com"]').count(), 1);
      const gmail_bounds = await contact_column.locator('a[href="mailto:jurenites@gmail.com"]').boundingBox();
      const section_bounds = await recruiter_section.boundingBox();
      assert.ok(section_bounds.y > gmail_bounds.y + gmail_bounds.height);
      assert.equal(await footer_root.locator('.footer-navigation__columns > nav').count(), 4);
      assert.equal(await footer_root.locator('.footer-navigation__legal-navigation a').count(), 1);
      const privacy_href = await footer_root.locator('.footer-navigation__legal-navigation a').getAttribute('href');
      assert.equal(await footer_root.locator('.footer-navigation__columns a').evaluateAll((link_nodes, legal_href) => link_nodes.filter((link_node) => link_node.getAttribute('href') === legal_href).length, privacy_href), 0);
      const hh_link = recruiter_section.locator('a[data-footer-icon="brand-hh"]');
      assert.equal(await hh_link.locator('[data-icon-name="brand-hh"] svg path').count(), 1);
      await hh_link.hover();
      await page_instance.waitForFunction(() => getComputedStyle(document.querySelector('[data-footer-icon="brand-hh"]')).color === 'rgb(255, 0, 2)');
      await page_instance.mouse.move(0, 0);
      await hh_link.focus();
      await page_instance.keyboard.press('Tab');
      await page_instance.keyboard.press('Shift+Tab');
      assert.equal(await hh_link.evaluate((link_node) => link_node.matches(':focus-visible')), true);
      await page_instance.waitForFunction(() => getComputedStyle(document.querySelector('[data-footer-icon="brand-hh"]')).color === 'rgb(255, 0, 2)');
      assert.equal(await footer_root.locator('[style], svg[width], svg[height]').count(), 0);
      assert.ok(await page_instance.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      await mkdir('artifacts/footer-menu', { recursive: true });
      await footer_root.screenshot({ path: `artifacts/footer-menu/recruiter-${viewport_width}${language_path === '/ru' ? '-ru' : '-en'}.png` });
    }
  }
  console.log('PASS: EN/RU recruiter links and copy, contact-column placement, separate privacy navigation, hh.ru icon and red hover/focus, desktop/mobile without overflow.');
} finally {
  await browser_instance.close();
}
