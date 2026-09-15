import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const browser_instance = await chromium.launch();
const live_results = [];
try {
 const page_instance = await browser_instance.newPage({ viewport: {width: 1280, height: 900} });
 for (const route_path of ['/about', '/']) {
  await page_instance.goto(`http://jurenites.local${route_path}`, {waitUntil:'domcontentloaded', timeout:60000});
  await page_instance.evaluate(() => document.fonts.ready);
  const read_metrics = () => page_instance.evaluate(() => Object.fromEntries(['.site-header','.site-header__brand-name','main'].map(selector_text=>{const page_element=document.querySelector(selector_text); const element_rect=page_element.getBoundingClientRect(); return [selector_text,{top:element_rect.top,height:element_rect.height,line_height:getComputedStyle(page_element).lineHeight}];})));
  const collapsed_state = await read_metrics();
  await page_instance.locator('.site-header__brand').hover();
  await page_instance.waitForTimeout(800);
  const expanded_state = await read_metrics();
  assert.equal(collapsed_state['.site-header__brand-name'].height,48);
  assert.equal(expanded_state['.site-header__brand-name'].height,48);
  assert.equal(collapsed_state['.site-header'].height,expanded_state['.site-header'].height);
  assert.equal(collapsed_state.main.top,expanded_state.main.top);
  const text_metrics = await page_instance.evaluate(()=>[...document.querySelectorAll('.skills-profile__score,.home-introduction__heading > *, .home-introduction__description p,.call-to-action__prompt,.call-to-action__invitation')].map(page_element=>({class_name:page_element.className,line_height:getComputedStyle(page_element).lineHeight,height:page_element.getBoundingClientRect().height})));
  for (const text_metric of text_metrics) assert.equal(parseFloat(text_metric.line_height)%8,0);
  await page_instance.screenshot({path:`artifacts/vertical-rhythm/${route_path === '/' ? 'home' : 'about'}-desktop.png`});
  live_results.push({route_path,collapsed_state,expanded_state,text_metrics});
 }
 console.log(JSON.stringify(live_results,null,2));
 await writeFile('artifacts/vertical-rhythm/live-audit.json',JSON.stringify(live_results,null,2));
} finally {await browser_instance.close();}
