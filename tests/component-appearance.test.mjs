import test from 'node:test';
import assert from 'node:assert/strict';
import { compare_appearance } from '../scripts/component-status/appearance.mjs';
import { validate_review_case } from '../scripts/component-status/review.mjs';
const REFERENCE_DATA = { surface_styles: { paddingLeft: '16px', minHeight: '40px', backgroundColor: 'rgb(1, 2, 3)' }, text_styles: [{ fontSize: '16px', lineHeight: '24px' }], text_content: 'Button', component_bounds: { width: 100, height: 40 } };
test('different copy and intrinsic width do not fail measured appearance', () => {
 const result_data=compare_appearance(REFERENCE_DATA,{...REFERENCE_DATA,text_content:'Contact me',component_bounds:{width:160,height:40}});
 assert.equal(result_data.status,'passed'); assert.equal(result_data.content_differs,true);
});
test('padding, font, and clipping regressions still fail with different copy', () => {
 for (const changed_data of [{surface_styles:{...REFERENCE_DATA.surface_styles,paddingLeft:'8px'}},{surface_styles:{...REFERENCE_DATA.surface_styles,minHeight:'56px'}},{text_styles:[{fontSize:'18px',lineHeight:'24px'}]},{content_overflow:true}]) assert.equal(compare_appearance(REFERENCE_DATA,{...REFERENCE_DATA,...changed_data,text_content:'Contact me'}).status,'failed');
});
test('incomplete measurement does not pass',()=>assert.equal(compare_appearance({},{}).status,'blocked'));
test('state/example validation preserves real URLs and rejects duplicates and unsupported states',()=>{
 const component_rows=[{component_id:'atoms-button',story_ids:['atoms-button--default-story']}];
 const input_data={component_id:'atoms-button',story_url:'/storybook/iframe.html?id=atoms-button--default-story',story_selector:'.button',viewport_width:1280,viewport_height:900,comparison_mode:'component',capture_states:['hover','focus'],website_examples:[{example_id:'home-contact',page_url:'/',component_selector:'.hero-section__action'}]};
 const case_data=validate_review_case(input_data,component_rows); assert.deepEqual(case_data.capture_states,['default','hover','focus']); assert.equal(case_data.website_examples[0].page_url,'http://jurenites.local/');
 assert.throws(()=>validate_review_case({...input_data,capture_states:['imaginary']},component_rows));
 assert.throws(()=>validate_review_case({...input_data,website_examples:[...input_data.website_examples,...input_data.website_examples]},component_rows));
 assert.throws(()=>validate_review_case({...input_data,website_examples:[{...input_data.website_examples[0],page_url:'javascript:alert(1)'}]},component_rows));
});

test('implicit flex/grid minimums do not create an appearance failure', () => {
 assert.equal(compare_appearance({surface_styles:{minWidth:'0px',paddingLeft:'16px'}},{surface_styles:{minWidth:'auto',paddingLeft:'16px'}}).status,'passed');
 assert.equal(compare_appearance({surface_styles:{minHeight:'40px'}},{surface_styles:{minHeight:'auto'}}).status,'failed');
});
