import { chromium } from 'playwright';
const browser_instance = await chromium.launch();
try {
 const page_instance = await browser_instance.newPage({ viewport: {width: 1280, height: 900} });
 await page_instance.goto('http://jurenites.local/about', {waitUntil:'domcontentloaded'});
 await page_instance.evaluate(() => document.fonts.ready);
 const read_metrics = () => page_instance.evaluate(() => Object.fromEntries(['.site-header','.site-header__brand-name','.site-header__brand-name-short','.site-header__brand-name-word','.site-header__brand-name-remainder','.site-header__brand-name-letter','main'].map(selector_text=>{const page_element=document.querySelector(selector_text); const element_rect=page_element.getBoundingClientRect(); return [selector_text,{top:element_rect.top,height:element_rect.height,line_height:getComputedStyle(page_element).lineHeight}];})));
 console.log('collapsed',await read_metrics());
 await page_instance.locator('.site-header__brand').hover();
 await page_instance.waitForTimeout(800);
 console.log('expanded',await read_metrics());
 console.log('fractional text',await page_instance.evaluate(()=>[...document.querySelectorAll('body *')].filter(page_element=>[...page_element.childNodes].some(child_node=>child_node.nodeType===3&&child_node.textContent.trim())).map(page_element=>({element:page_element.className,line_height:getComputedStyle(page_element).lineHeight,height:page_element.getBoundingClientRect().height})).filter(element_data=>parseFloat(element_data.line_height)%2>0.01)));
} finally {await browser_instance.close();}
