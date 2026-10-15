import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { create_status_server, PROJECT_ROOT } from '../scripts/component-status/server.mjs';
import { run_visual_review } from '../scripts/component-status/review.mjs';
const REPORT_DIRECTORY=await mkdtemp(resolve(tmpdir(),'appearance-state-test-'));
const STATUS_SERVER=create_status_server();
await new Promise(resolve_listen=>{ STATUS_SERVER.listen(0,'127.0.0.1',resolve_listen); });
const STATUS_ORIGIN=`http://127.0.0.1:${STATUS_SERVER.address().port}`;
const STORY_URL='/storybook/iframe.html?id=atoms-button--default-story&viewMode=story&args=button_label:Button;button_style:primary;is_disabled:false';
try {
 const report_data=await run_visual_review({project_root:PROJECT_ROOT,report_directory:REPORT_DIRECTORY,status_origin:STATUS_ORIGIN,review_case:{component_id:'states-fixture',story_url:STORY_URL,story_selector:'.button',viewport_width:1280,viewport_height:900,figma_url:'',comparison_mode:'component',capture_states:['default','hover','focus','active'],website_examples:[{example_id:'contact',example_label:'Contact example',page_url:STATUS_ORIGIN+STORY_URL.replace('button_label:Button','button_label:Contact%20me'),component_selector:'.button'},{example_id:'different-style',example_label:'Different variant',page_url:STATUS_ORIGIN+STORY_URL.replace('button_style:primary;is_disabled:false','button_style:secondary;is_disabled:false'),component_selector:'.button'}]}});
 const check_rows=report_data.components[0].checks;
 const state_rows=check_rows.find(check_row=>check_row.check_key==='integration').details.visual_states;
 assert.equal(state_rows.length,8);
 for (const capture_row of check_rows.find(check_row=>check_row.check_key==='storybook').details) { if (capture_row.state_key==='default' || capture_row.state_key==='focus') assert.equal(capture_row.appearance_values.interactive_state.hovered,false); }
 for(const state_row of state_rows.filter(state_row=>state_row.example_id==='contact')) {
   const pair_result=state_row.comparisons.find(pair_row=>pair_row.pair_name==='implementation');
   assert.equal(pair_result.status,'passed',JSON.stringify(state_row));
   assert.equal(pair_result.content_differs,true);
   assert.match(state_row.content.drupal,/CONTACT ME/i);
   assert.equal(state_row.comparisons.find(pair_row=>pair_row.pair_name==='figma-storybook').status,'missing');
 }
 assert.equal(state_rows.find(state_row=>state_row.example_id==='different-style' && state_row.state_key==='default').comparisons[0].status,'failed');
 assert.equal(check_rows.find(check_row=>check_row.check_key==='interaction').status,'passed',JSON.stringify(check_rows.find(check_row=>check_row.check_key==='interaction')));
 console.log('PASS: multiple examples, four native states, different labels accepted, visual variant regression detected, absent Figma states remain missing.');
} finally { await new Promise(resolve_close=>{ STATUS_SERVER.close(resolve_close); }); await rm(REPORT_DIRECTORY,{recursive:true,force:true}); }
