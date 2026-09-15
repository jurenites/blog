import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const script_source = await readFile('src/slice/src/js/heading-typing.js', 'utf8');
const style_source = await readFile('web/themes/custom/jurenites_theme/css/style.min.css', 'utf8');
const cta_template = await readFile('src/stories/organisms/call-to-action/call-to-action.template.html', 'utf8');
const cta_markup = cta_template.replace('{{prompt_heading}}', 'GOT A PROJECT?')
  .replace('{{invitation_heading}}', "LET'S DISCUSS IT!").replace('{{contact_button}}', '');
const browser_instance = await chromium.launch({ headless: true });
const runtime_errors = [];

async function create_fixture(viewport_width, reduced_motion = 'no-preference') {
  const page_instance = await browser_instance.newPage({ viewport: { width: viewport_width, height: 1000 }, reducedMotion: reduced_motion });
  page_instance.on('pageerror', (page_error) => runtime_errors.push(page_error.message));
  await page_instance.setContent(`<html lang="en"><body class="jurenites-theme"><main>
    <h1 class="two-tone-heading">Designing thoughtful<br><span class="two-tone-heading__segment--soft">digital experiences Привет 👩🏽‍💻 é</span></h1>
    <h2><a href="#target">Read the complete story</a></h2>
    <h2 class="numeric-values__number">123</h2><h2 data-heading-typing="off">Static heading</h2>
    <h2 class="visually-hidden">Accessible hidden label</h2><nav><h2>Navigation</h2></nav>
    <h3>Third-level heading</h3><h4>Fourth-level heading</h4>
    <h5>Fifth-level heading</h5><h6>Sixth-level heading</h6>
    <p id="target">Content below headings</p></main></body></html>`);
  await page_instance.addStyleTag({ content: style_source });
  await page_instance.addScriptTag({ content: script_source.replace(/^export /gm, '') });
  await page_instance.evaluate(() => document.fonts.ready);
  return page_instance;
}

try {
  for (const viewport_width of [360, 1440]) {
    const page_instance = await create_fixture(viewport_width);
    const heading_locator = page_instance.locator('h1');
    const original_markup = await heading_locator.innerHTML();
    const original_bounds = await heading_locator.boundingBox();
    const original_content_top = await page_instance.locator('#target').evaluate((content_element) => content_element.getBoundingClientRect().top);
    await page_instance.evaluate(() => initialize_heading_typing(document));
    await page_instance.waitForFunction(() => document.querySelectorAll('.heading-typing__character').length > 0);
    assert.equal(await page_instance.locator('h2.heading-typing, h3.heading-typing, h4.heading-typing, h5.heading-typing, h6.heading-typing').count(), 0, 'H2 through H6 remain static');
    const initial_snapshot = await heading_locator.ariaSnapshot();
    assert(initial_snapshot.includes('digital experiences Привет 👩🏽‍💻 é'), 'Full heading stays accessible during typing');
    const animation_state = await heading_locator.evaluate((heading_element) => {
      const character_elements = [...heading_element.querySelectorAll('.heading-typing__character')];
      const character_animations = character_elements.flatMap((character_element) => character_element.getAnimations());
      character_animations.forEach((character_animation) => character_animation.pause());
      const settle_start = character_animations[0].effect.getTiming().delay;
      character_animations.forEach((character_animation) => { character_animation.currentTime = settle_start / 2; });
      const visible_count = character_elements.filter((character_element) => getComputedStyle(character_element).visibility === 'visible').length;
      const expanded_position = character_elements.at(-1).getBoundingClientRect().left;
      character_animations.forEach((character_animation) => { character_animation.currentTime = settle_start + 400; });
      const normal_position = character_elements.at(-1).getBoundingClientRect().left;
      return {
        visible_count, character_count: character_elements.length, expanded_position, normal_position,
        graphemes: character_elements.map((character_element) => character_element.textContent),
        scroll_width: document.documentElement.scrollWidth,
      };
    });
    assert(animation_state.visible_count > 0 && animation_state.visible_count < animation_state.character_count, 'Typing reveals a partial phrase');
    assert(animation_state.graphemes.includes('👩🏽‍💻') && animation_state.graphemes.includes('é'), 'Graphemes remain intact');
    assert(animation_state.expanded_position > animation_state.normal_position, 'Tracking contracts after typing');
    assert(animation_state.scroll_width <= viewport_width, 'Expanded tracking does not overflow');
    assert.deepEqual(await heading_locator.boundingBox(), original_bounds, 'Heading geometry stays stable');
    assert.equal(await page_instance.locator('#target').evaluate((content_element) => content_element.getBoundingClientRect().top), original_content_top);
    assert.equal(await page_instance.locator('.numeric-values__number .heading-typing__character, [data-heading-typing="off"] .heading-typing__character, nav .heading-typing__character').count(), 0);
    await page_instance.evaluate(() => initialize_heading_typing(document));
    assert.equal(await heading_locator.locator('.heading-typing__character').count(), animation_state.character_count, 'Repeated Drupal attach does not duplicate animation');
    await page_instance.waitForFunction(() => !document.querySelector('.heading-typing'));
    assert.equal(await heading_locator.innerHTML(), original_markup, 'Original markup restored');
    assert.deepEqual(await heading_locator.boundingBox(), original_bounds);
    assert.equal(await heading_locator.evaluate((heading_element) => getComputedStyle(heading_element).letterSpacing), 'normal');
    await page_instance.locator('main').evaluate((main_element, cta_markup) => { main_element.innerHTML = cta_markup; }, cta_markup);
    const cta_heading = page_instance.locator('.call-to-action__heading');
    const cta_bounds = await cta_heading.boundingBox();
    assert.equal(await cta_heading.evaluate((heading_element) => getComputedStyle(heading_element).letterSpacing), 'normal', 'CTA starts with normal spacing');
    await page_instance.evaluate(() => initialize_heading_typing(document));
    await page_instance.waitForFunction(() => document.querySelector('.call-to-action__heading.heading-typing'));
    assert.deepEqual(await cta_heading.boundingBox(), cta_bounds, 'CTA flex heading keeps its geometry while typing');
    if (viewport_width === 1440) {
      const tracking_positions = await cta_heading.evaluate((heading_element) => {
        const character_element = heading_element.querySelectorAll('.heading-typing__character')[1];
        const character_animation = character_element.getAnimations()[0];
        const animation_timing = character_animation.effect.getTiming();
        character_animation.pause();
        character_animation.currentTime = animation_timing.delay;
        const expanded_position = character_element.getBoundingClientRect().left;
        character_animation.currentTime += animation_timing.duration / 2;
        const midpoint_position = character_element.getBoundingClientRect().left;
        character_animation.currentTime = animation_timing.delay + animation_timing.duration;
        const normal_position = character_element.getBoundingClientRect().left;
        return { expanded_position, midpoint_position, normal_position, expected_spacing: parseFloat(getComputedStyle(character_element).fontSize) * 0.02 };
      });
      assert(Math.abs(tracking_positions.expanded_position - tracking_positions.normal_position - tracking_positions.expected_spacing) < 0.01, 'Typing adds exactly 2% spacing when the line has room');
      assert(tracking_positions.midpoint_position > tracking_positions.normal_position && tracking_positions.midpoint_position < tracking_positions.expanded_position, 'Spacing contracts progressively after typing stops');
    }
    await page_instance.waitForFunction(() => !document.querySelector('.call-to-action__heading.heading-typing'));
    assert.equal(await cta_heading.evaluate((heading_element) => getComputedStyle(heading_element).letterSpacing), 'normal', 'CTA returns to normal spacing after natural completion');
    assert.deepEqual(await cta_heading.boundingBox(), cta_bounds, 'CTA geometry stays stable after typing');
    await page_instance.close();
  }

  const reduced_page = await create_fixture(360, 'reduce');
  await reduced_page.evaluate(() => initialize_heading_typing(document));
  assert.equal(await reduced_page.locator('.heading-typing').count(), 0);
  await reduced_page.close();

  for (const viewport_width of [360, 1440]) {
    const scroll_page = await create_fixture(viewport_width);
    await scroll_page.addStyleTag({ content: '.heading-scroll-gap { block-size: 1200px; }' });
    await scroll_page.evaluate(() => {
      document.querySelector('main').insertAdjacentHTML('beforeend', '<div class="heading-scroll-gap"></div><h1 id="deferred-heading">This heading waits until the visitor scrolls down</h1><div class="heading-scroll-gap"></div>');
      window.deferred_animation_count = 0;
      const original_animate = Element.prototype.animate;
      Element.prototype.animate = function (...animation_args) {
        if (this.closest('#deferred-heading')) window.deferred_animation_count += 1;
        return original_animate.apply(this, animation_args);
      };
      initialize_heading_typing(document);
    });
    await scroll_page.waitForFunction(() => document.querySelector('h1.heading-typing'));
    await scroll_page.waitForFunction(() => !document.querySelector('h1.heading-typing'));
    assert.equal(await scroll_page.evaluate(() => window.deferred_animation_count), 0, 'Offscreen headings do not animate while the page loads');
    assert.equal(await scroll_page.locator('#deferred-heading .heading-typing__character').count(), 0, 'Offscreen headings keep their original markup');
    await scroll_page.locator('#deferred-heading').scrollIntoViewIfNeeded();
    await scroll_page.waitForFunction(() => document.querySelector('#deferred-heading.heading-typing'));
    const animation_count = await scroll_page.evaluate(() => window.deferred_animation_count);
    assert(animation_count > 0, 'Scrolling a heading into view starts typing');
    if (viewport_width === 360) {
      await scroll_page.evaluate(() => window.scrollTo(0, 0));
      await scroll_page.waitForFunction(() => !document.querySelector('#deferred-heading.heading-typing'), undefined, { timeout: 500 });
    }
    await scroll_page.waitForFunction(() => !document.querySelector('#deferred-heading.heading-typing'));
    await scroll_page.evaluate(() => window.scrollTo(0, 0));
    await scroll_page.locator('#deferred-heading').scrollIntoViewIfNeeded();
    await scroll_page.evaluate(() => new Promise((resolve_frame) => { requestAnimationFrame(() => requestAnimationFrame(resolve_frame)); }));
    assert.equal(await scroll_page.evaluate(() => window.deferred_animation_count), animation_count, 'Completed or scrolled-away headings never replay');
    assert.equal(await scroll_page.locator('#deferred-heading .heading-typing__character').count(), 0);

    await scroll_page.evaluate(() => {
      window.scrollTo(0, 0);
      const deferred_heading = document.querySelector('#deferred-heading');
      detach_heading_typing(deferred_heading);
      initialize_heading_typing(deferred_heading);
      detach_heading_typing(deferred_heading);
    });
    await scroll_page.locator('#deferred-heading').scrollIntoViewIfNeeded();
    await scroll_page.evaluate(() => new Promise((resolve_frame) => { requestAnimationFrame(() => requestAnimationFrame(resolve_frame)); }));
    assert.equal(await scroll_page.evaluate(() => window.deferred_animation_count), animation_count, 'Drupal detach cancels pending viewport observation');
    await scroll_page.close();
  }

  const studio_page = await create_fixture(1440);
  await studio_page.evaluate(() => {
    document.body.classList.remove('jurenites-theme');
    initialize_heading_typing(document);
  });
  assert.equal(await studio_page.locator('.heading-typing').count(), 0, 'Standalone apps do not animate');
  await studio_page.evaluate(() => {
    document.body.classList.add('jurenites-theme');
    document.querySelector('main').classList.add('studio-layout');
    initialize_heading_typing(document);
  });
  assert.equal(await studio_page.locator('.heading-typing').count(), 0, 'QR Studio is explicitly excluded');
  await studio_page.close();

  for (const cleanup_action of ['resize', 'motion', 'detach', 'focus']) {
    const page_instance = await create_fixture(1440);
    await page_instance.evaluate(() => initialize_heading_typing(document));
    await page_instance.waitForFunction(() => document.querySelector('.heading-typing'));
    if (cleanup_action === 'resize') await page_instance.setViewportSize({ width: 600, height: 1000 });
    if (cleanup_action === 'motion') await page_instance.emulateMedia({ reducedMotion: 'reduce' });
    if (cleanup_action === 'detach') await page_instance.evaluate(() => detach_heading_typing(document));
    if (cleanup_action === 'focus') {
      await page_instance.locator('h1').evaluate((heading_element) => { heading_element.tabIndex = 0; });
      await page_instance.locator('h1').focus();
    }
    await page_instance.waitForFunction(() => !document.querySelector('.heading-typing'));
    await page_instance.close();
  }
  assert.deepEqual(runtime_errors, []);
  console.log('Heading typing: viewport entry, offscreen deferral, no replay, desktop/mobile, graphemes, accessibility, stable layout, tracking, reduced motion, attach/detach and cleanup passed.');
} finally {
  await browser_instance.close();
}
