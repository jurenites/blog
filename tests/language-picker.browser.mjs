import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const dashboard_origin = process.env.STATUS_DASHBOARD_URL ?? 'http://127.0.0.1:7779';
const browser_instance = await chromium.launch({headless:true});
try {
const page_instance = await browser_instance.newPage({viewport:{width:1440,height:1000}});
const page_errors=[];
page_instance.on('pageerror',(page_error)=>page_errors.push(page_error.message));
await page_instance.goto(`${dashboard_origin}/#organisms-top-nav-menu-site-header`);
await page_instance.getByRole('button',{name:'Run language-picker tests'}).waitFor();
const response_promise=page_instance.waitForResponse((response_data)=>response_data.url().endsWith('/api/language-picker'),{timeout:240000});
await page_instance.getByRole('button',{name:'Run language-picker tests'}).click();
const response_data=await response_promise;
assert.equal(response_data.status(),200);
const report_data=await response_data.json();
console.log(JSON.stringify(report_data.components[0].checks.map((check_item)=>({check_key:check_item.check_key,status:check_item.status,message:check_item.message})),null,2));
for (const check_item of report_data.components[0].checks) assert.equal(check_item.details.result_items.some((result_item)=>result_item.status === 'blocked'), false, JSON.stringify(check_item.details.result_items));
await page_instance.waitForFunction(()=>document.querySelector('#visual-review-message')?.textContent.startsWith('Capture finished.'));
await page_instance.locator('#review-state').waitFor();
assert.equal(await page_instance.locator('#review-state option').count(),6);
await page_instance.getByText('Overlay and differences', {exact:true}).click();
for(const option_value of ['0','1','2','3','4','5']) {
await page_instance.locator('#review-state').selectOption(option_value);
await page_instance.locator('#comparison-pair').selectOption('figma-web');
await page_instance.locator('#comparison-mode').selectOption('difference');
await page_instance.waitForFunction(()=>document.querySelector('#comparison-message').textContent.includes('pixels differ'));
assert.equal(await page_instance.locator('.visual-review__three-up img').count(),3);
}
await page_instance.locator('#review-state').selectOption('4');
await page_instance.locator('#comparison-mode').selectOption('overlay');
await page_instance.locator('#comparison-balance').evaluate((range_input)=>{range_input.value='50';range_input.dispatchEvent(new Event('input',{bubbles:true}));});
await page_instance.locator('.visual-review__three-up img').evaluateAll((image_items)=>Promise.all(image_items.map((image_item)=>image_item.decode())));
await page_instance.locator('.visual-review__three-up').screenshot({path:'.cache/component-status/language-picker-three-up.png'});
await page_instance.setViewportSize({width:390,height:900});
assert.equal(await page_instance.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
assert.deepEqual(page_errors,[]);
console.log('Dashboard: capture button, 6 states, 3-way images, Figma differences, overlay and mobile overflow checks passed.');
} finally {await browser_instance.close();}
