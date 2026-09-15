import { test } from 'node:test';
import { strict as assert_checks } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { build as build_bundle } from 'esbuild';
import { chromium as browser_engine } from 'playwright';

test('standalone canvases retain presets, zoom, interaction, lifecycle and full-widget controls', async () => {
  const bundle_result = await build_bundle({
    stdin: { contents: `export * from './src/slice/src/js/game-of-life.js';
      export * from './src/stories/organisms/game-of-life-example/game-of-life-example.markup.js';
      export * from './src/stories/organisms/game-of-life/game-of-life.markup.js';`, resolveDir: process.cwd() },
    bundle: true, write: false, format: 'iife', globalName: 'life_runtime', loader: { '.html': 'text' },
  });
  const browser_instance = await browser_engine.launch({ headless: true });
  try {
    const browser_page = await browser_instance.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page_errors = [];
    browser_page.on('pageerror', (page_error) => page_errors.push(page_error.message));
    await browser_page.setContent('<main></main>');
    await browser_page.addStyleTag({ content: await readFile('web/themes/custom/jurenites_theme/css/style.min.css', 'utf8') });
    await browser_page.addStyleTag({ content: 'main { padding-bottom: 200vh; }' });
    await browser_page.addScriptTag({ content: bundle_result.outputFiles[0].text });
    await browser_page.evaluate(() => {
      document.body.classList.add('jurenites-theme');
      const first_markup = life_runtime.life_example_markup({ column_count: 5, row_count: 5, zoom_size: 2, living_cells: ['b3', 'c4', 'd2', 'd3', 'd4'] });
      const second_markup = life_runtime.life_example_markup({ column_count: 8, row_count: 4, zoom_size: 3, living_cells: ['a1', 'h4'] });
      document.querySelector('main').innerHTML = first_markup + second_markup + life_runtime.game_of_life_markup();
      life_runtime.initialize_game_of_life(document);
      life_runtime.initialize_game_of_life(document);
    });
    const canvas_snapshot = () => browser_page.evaluate(() => [...document.querySelectorAll('canvas[data-user]')].map((canvas_element) => {
      const canvas_bounds = canvas_element.getBoundingClientRect();
      const drawing_context = canvas_element.getContext('2d');
      const column_count = Number(canvas_element.dataset.columns);
      const row_count = Number(canvas_element.dataset.rows);
      const zoom_size = Number(canvas_element.dataset.lifeSize);
      const computed_style = getComputedStyle(canvas_element);
      const cell_size = parseFloat(computed_style.getPropertyValue('--component-game-of-life-cell-size-default')) * zoom_size;
      const border_size = parseFloat(computed_style.getPropertyValue('--component-game-of-life-border-size-default')) * zoom_size;
      const background_canvas = document.createElement('canvas');
      const background_context = background_canvas.getContext('2d');
      background_context.fillStyle = computed_style.backgroundColor;
      background_context.fillRect(0, 0, 1, 1);
      const background_pixel = background_context.getImageData(0, 0, 1, 1).data;
      const living_cells = [];
      for (let row_index = 0; row_index < row_count; row_index += 1) {
        for (let column_index = 0; column_index < column_count; column_index += 1) {
          const center_pixel = drawing_context.getImageData(
            (column_index * (cell_size - border_size) + cell_size / 2) * devicePixelRatio,
            (row_index * (cell_size - border_size) + cell_size / 2) * devicePixelRatio, 1, 1,
          ).data;
          if (center_pixel.some((color_value, color_index) => color_value !== background_pixel[color_index])) living_cells.push([column_index, row_index]);
        }
      }
      return { canvas_width: canvas_bounds.width, canvas_height: canvas_bounds.height, bitmap_width: canvas_element.width,
        column_count, row_count, living_cells, generation_count: canvas_element.dataset.generation, inline_style: canvas_element.getAttribute('style') };
    }));
    const initial_boards = await canvas_snapshot();
    assert_checks.deepEqual(initial_boards[0], { canvas_width: 72, canvas_height: 72, bitmap_width: 144,
      column_count: 5, row_count: 5, living_cells: [[3, 1], [1, 2], [3, 2], [2, 3], [3, 3]], generation_count: '0', inline_style: null });
    assert_checks.equal(initial_boards[1].canvas_width, 171);
    assert_checks.equal(initial_boards[1].canvas_height, 87);
    assert_checks.deepEqual(initial_boards[1].living_cells, [[0, 0], [7, 3]]);
    assert_checks.equal(await browser_page.locator('[data-life-pause]').count(), 1);
    assert_checks.equal(await browser_page.locator('[data-life-status]').count(), 1);
    await browser_page.locator('canvas[data-user]').first().hover({ position: { x: 8, y: 8 } });
    const painted_boards = await canvas_snapshot();
    assert_checks.ok(painted_boards[0].living_cells.some(([column_index, row_index]) => column_index === 0 && row_index === 0));
    assert_checks.deepEqual(painted_boards[1], initial_boards[1]);
    await browser_page.mouse.move(950, 750);
    await browser_page.evaluate(() => {
      const canvas_element = document.querySelector('canvas[data-user]');
      life_runtime.detach_game_of_life(canvas_element);
      life_runtime.initialize_game_of_life(canvas_element);
    });
    assert_checks.deepEqual((await canvas_snapshot())[0], initial_boards[0]);
    await browser_page.emulateMedia({ reducedMotion: 'no-preference' });
    await browser_page.waitForFunction(() => Number(document.querySelector('canvas[data-user]').dataset.generation) >= 2);
    await browser_page.evaluate(() => window.scrollTo(0, 1000));
    await browser_page.waitForTimeout(150);
    const hidden_generation = await browser_page.locator('canvas[data-user]').first().getAttribute('data-generation');
    await browser_page.waitForTimeout(250);
    assert_checks.equal(await browser_page.locator('canvas[data-user]').first().getAttribute('data-generation'), hidden_generation);
    await browser_page.evaluate(() => window.scrollTo(0, 0));
    await browser_page.waitForFunction((previous_generation) => Number(document.querySelector('canvas[data-user]').dataset.generation) > Number(previous_generation), hidden_generation);
    await browser_page.locator('[data-life-pause]').click();
    assert_checks.equal(await browser_page.locator('[data-game-of-life]').getAttribute('data-paused'), 'true');
    assert_checks.equal(await browser_page.locator('[data-life-pause]').getAttribute('aria-label'), 'Play simulation');
    await browser_page.evaluate(() => {
      const main_element = document.querySelector('main');
      life_runtime.detach_game_of_life(main_element);
      main_element.innerHTML = '<canvas class="game-of-life__canvas" data-user="bad JSON"></canvas>' + life_runtime.life_example_markup();
      life_runtime.initialize_game_of_life(main_element);
    });
    assert_checks.equal(await browser_page.locator('[data-life-error]').count(), 1);
    await browser_page.waitForFunction(() => Number(document.querySelectorAll('canvas[data-user]')[1].dataset.generation) > 0);
    await browser_page.evaluate(() => {
      const repaired_canvas = document.querySelector('[data-life-error]');
      repaired_canvas.dataset.user = '{}';
      life_runtime.initialize_game_of_life(repaired_canvas);
    });
    assert_checks.equal(await browser_page.locator('[data-life-error]').count(), 0);
    await browser_page.waitForFunction(() => Number(document.querySelector('canvas[data-user]').dataset.generation) > 0);
    await browser_page.emulateMedia({ reducedMotion: 'reduce' });
    const table_markup = await readFile('scripts/content/conway-game-of-life-examples.html', 'utf8');
    await browser_page.evaluate((example_markup) => {
      life_runtime.detach_game_of_life(document);
      document.querySelector('main').innerHTML = `<article class="article-detail--game-of-life"><div class="article-detail__body">${example_markup}</div></article>`;
      life_runtime.initialize_game_of_life(document);
    }, table_markup);
    assert_checks.equal(await browser_page.locator('.game-of-life-examples canvas').count(), 6);
    assert_checks.equal(await browser_page.locator('.game-of-life-examples h3').count(), 6);
    for (const viewport_width of [1000, 360]) {
      await browser_page.setViewportSize({ width: viewport_width, height: 800 });
      const example_boards = await canvas_snapshot();
      for (const example_board of example_boards) {
        assert_checks.equal(example_board.canvas_width, 172);
        assert_checks.equal(example_board.canvas_height, 172);
        assert_checks.equal(example_board.column_count, 6);
        assert_checks.equal(example_board.row_count, 6);
      }
      assert_checks.equal(await browser_page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    }
    if (process.env.LIFE_SCREENSHOT_PATH) await browser_page.screenshot({ path: process.env.LIFE_SCREENSHOT_PATH, fullPage: true });
    assert_checks.deepEqual(page_errors, []);
  } finally {
    await browser_instance.close();
  }
});
