import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import '../ui/vendor/qrcodegen.js';
vm.runInThisContext(await readFile(new URL('../ui/vendor/jsQR.js',import.meta.url),'utf8'));

// A minimal DOM adapter exercises the actual input handler without a browser.
class TestElement {
 constructor(){this.value='';this.checked=false;this.hidden=false;this.textContent='';this.attributes={};this.events={};this.children=[];this.dataset={};this.scrollLeft=0;}
 addEventListener(event_name,event_handler){(this.events[event_name]??=[]).push(event_handler);}
 removeAttribute(attribute_name){delete this.attributes[attribute_name];}
 setAttribute(attribute_name,attribute_value){this.attributes[attribute_name]=attribute_value;}
 append(...child_rows){this.children.push(...child_rows);}
 replaceChildren(){this.children=[];}
 getContext(){const draw_calls=this.draw_calls=[];return new Proxy({}, {get:(context_data,method_name)=>(...method_args)=>{draw_calls.push({method_name,method_args,fill_style:context_data.fillStyle,stroke_style:context_data.strokeStyle});}});}
}
const html_text=await readFile(new URL('../templates/qr-studio-document.html.twig',import.meta.url),'utf8');
const element_map=new Map([...html_text.matchAll(/\bid="([^"]+)"/g)].map(match_info=>[match_info[1],new TestElement()]));
element_map.get('address-pattern').value='HTTPS://?????.CC';
element_map.get('protect-structure').checked=true;
element_map.get('search-alphabet').value='alphanumeric';
element_map.get('search-limit').value='60';
globalThis.document={getElementById:element_id=>element_map.get(element_id),documentElement:{},querySelectorAll:()=>[],addEventListener:()=>{},createElement:()=>new TestElement(),createTextNode:character_text=>({textContent:character_text})};
globalThis.getComputedStyle=()=>({getPropertyValue:property_name=>({'--guide-expected':'rgb(160 160 160)','--guide-lock-match':'green','--guide-lock-conflict':'red'})[property_name]??'black'});
globalThis.ImageData=class {constructor(pixel_data){this.data=pixel_data;}};
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
const app_tools=await import('../ui/app.js');
const {decode_grid}=await import('../ui/core.js');
function type_encoded_text(entered_text){
 element_map.get('address-pattern').value=entered_text;
 for(const event_handler of element_map.get('address-pattern').events.input)event_handler({isComposing:false});
}

test('live input replaces exact text, retains locks/rotation, and leaves rejected drafts unapplied',()=>{
 const app_state=app_tools.APP_STATE;
 app_state.quarter_turns=1;
 app_state.lock_values[210]=0;
 const original_locks=[...app_state.lock_values];
 let worker_stopped=false;app_state.search_worker={terminate(){worker_stopped=true;}};
 for(const entered_text of ['H','HE','HELLO']){
  type_encoded_text(entered_text);
  assert.equal(app_state.payload_text,entered_text);
  assert.equal(element_map.get('address-pattern').value,entered_text);
  assert.equal(decode_grid(app_state.result_grid,21),entered_text);
  assert.deepEqual(app_state.lock_values,original_locks);
  assert.equal(app_state.quarter_turns,1);
 }
 assert.equal(worker_stopped,true);
 const saved_grid=[...app_state.result_grid];
 type_encoded_text('');assert.deepEqual(app_state.result_grid,saved_grid);
 type_encoded_text('HTTPS://?????.CC');assert.equal(app_state.payload_text,'HTTPS://AAAAA.CC');assert.equal(app_state.preview_only,true);
 type_encoded_text('HTTPS://X????.CC');assert.equal(app_state.payload_text,'HTTPS://XAAAA.CC');
 type_encoded_text('https://?????.cc');assert.equal(element_map.get('address-pattern').attributes['aria-invalid'],'true');assert.equal(app_state.payload_text,'HTTPS://XAAAA.CC');
 type_encoded_text('http://a.cc');assert.equal(app_state.payload_text,'http://a.cc');assert.equal(element_map.get('address-pattern').attributes['aria-invalid'],'false');
 type_encoded_text('A'.repeat(40));assert.equal(app_state.payload_text,'http://a.cc');assert.equal(element_map.get('address-pattern').attributes['aria-invalid'],'true');
 assert.match(element_map.get('generation-message').textContent,/previous QR/);
 type_encoded_text('WORLD');assert.equal(app_state.payload_text,'WORLD');assert.equal(element_map.get('pattern-error').hidden,true);
 type_encoded_text('WORD');app_tools.restore_snapshot(app_state.undo_rows.pop());
 assert.equal(app_state.payload_text,'WORLD');assert.equal(element_map.get('address-pattern').value,'WORLD');
 app_tools.highlight_character(0);assert.equal(app_state.highlight_cells.size,11);assert.match(element_map.get('character-detail').textContent,/positions 1–2/);
 const before_hover=[...app_state.result_grid];app_tools.highlight_character(1);assert.deepEqual(app_state.result_grid,before_hover);
 element_map.get('address-pattern').selectionStart=2;for(const event_handler of element_map.get('address-pattern').events.keyup)event_handler({});assert.equal(app_state.highlight_index,2);
 assert.equal(element_map.has('payload-text'),false);assert.equal(element_map.has('encode-tab'),false);
 clearTimeout(app_state.decode_timer);
});

test('rotation animates clockwise, handles repeated clicks, and respects reduced motion',()=>{
 const animation_calls=[];
 for(const element_id of ['qr-canvas','preview-canvas'])element_map.get(element_id).animate=(key_frames,animation_options)=>{
  const animation_info={cancelled:false,cancel(){this.cancelled=true;},onfinish:null};
  animation_calls.push({key_frames,animation_options,animation_info});return animation_info;
 };
 globalThis.matchMedia=()=>({matches:false});
 const initial_turns=app_tools.APP_STATE.quarter_turns;
 const initial_grid=[...app_tools.APP_STATE.result_grid];
 const rotate_handler=element_map.get('rotate-qr').events.click[0];
 for(let turn_index=1;turn_index<=4;turn_index++){
  rotate_handler();
  assert.equal(app_tools.APP_STATE.quarter_turns,(initial_turns+turn_index)%4);
 }
 assert.equal(animation_calls.length,8);
 assert.deepEqual(animation_calls[0].key_frames,[{transform:'rotate(-90deg)'},{transform:'rotate(0deg)'}]);
 assert.equal(animation_calls[0].animation_options.duration,180);
 assert.equal(animation_calls[0].animation_info.cancelled,true);
 animation_calls[6].animation_info.onfinish();
 assert.equal(element_map.get('qr-canvas').attributes['data-rotating'],undefined);
 assert.deepEqual(app_tools.APP_STATE.result_grid,initial_grid);
 globalThis.matchMedia=()=>({matches:true});
 rotate_handler();assert.equal(animation_calls.length,8);
 clearTimeout(app_tools.APP_STATE.decode_timer);
});

test('workspace size selector grows and shrinks the QR while preserving locks and rotation',()=>{
 const app_state=app_tools.APP_STATE;
 const original_turns=app_state.quarter_turns;
 const size_handler=element_map.get('qr-version').events.change[0];
 element_map.get('qr-version').value='3';size_handler();
 assert.equal(app_state.qr_code.size,29);assert.equal(app_state.lock_values[10*29],0);
 assert.equal(app_state.quarter_turns,original_turns);
 element_map.get('qr-version').value='1';size_handler();
 assert.equal(app_state.qr_code.size,21);assert.equal(app_state.lock_values[210],0);
 assert.equal(decode_grid(app_state.result_grid,21),app_state.payload_text);
 clearTimeout(app_state.decode_timer);
});

test('expected guide draws missing black cells in gray without modifying the QR or its export',async()=>{
 const {grid_from_code,apply_locks,svg_grid}=await import('../ui/core.js');
 const app_state=app_tools.APP_STATE;
 const cell_indices=app_state.character_rows[0].cell_indices;
 const expected_grid=grid_from_code(app_state.qr_code);
 const missing_index=cell_indices.find(cell_index=>expected_grid[cell_index]);
 const extra_index=cell_indices.find(cell_index=>!expected_grid[cell_index]);
 assert.notEqual(missing_index,undefined);assert.notEqual(extra_index,undefined);
 app_state.lock_values[missing_index]=0;app_state.lock_values[extra_index]=1;
 app_state.result_grid=apply_locks(app_state.qr_code,app_state.lock_values);
 const intact_black=cell_indices.find(cell_index=>expected_grid[cell_index]&&cell_index!==missing_index);
 const intact_white=cell_indices.find(cell_index=>!expected_grid[cell_index]&&cell_index!==extra_index);
 app_state.lock_values[intact_black]=1;app_state.lock_values[intact_white]=0;
 element_map.get('show-locks').checked=true;
 const exported_svg=svg_grid(app_state.result_grid,app_state.qr_code.size);
 element_map.get('show-expected').checked=true;
 element_map.get('qr-canvas').draw_calls.length=0;
 app_tools.refresh_workspace(false);app_tools.highlight_character(0);
 assert.match(element_map.get('character-detail').textContent,/2 \/ 11 data cells changed \(1 missing black, 1 extra black\)/);
 assert.ok(element_map.get('qr-canvas').draw_calls.some(call_info=>call_info.method_name==='fillRect'&&call_info.fill_style==='rgb(160 160 160)'));
 const {rotate_index}=await import('../ui/editor-tools.js');
 for(const [cell_index,expected_color] of [[missing_index,'red'],[extra_index,'red'],[intact_black,'green'],[intact_white,'green']]){
  const display_index=rotate_index(cell_index,21,app_state.quarter_turns);
  const cell_x=(display_index%21+4)*20+3,cell_y=(Math.floor(display_index/21)+4)*20+3;
  assert.ok(element_map.get('qr-canvas').draw_calls.some(call_info=>call_info.method_name==='strokeRect'&&call_info.method_args[0]===cell_x&&call_info.method_args[1]===cell_y&&call_info.stroke_style===expected_color));
 }
 assert.equal(app_state.result_grid[missing_index],false);
 assert.equal(svg_grid(app_state.result_grid,app_state.qr_code.size),exported_svg);
 element_map.get('show-expected').checked=false;element_map.get('qr-canvas').draw_calls.length=0;
 element_map.get('show-expected').events.change[0]();
 assert.equal(element_map.get('qr-canvas').draw_calls.some(call_info=>call_info.fill_style==='rgb(160 160 160)'),false);
 clearTimeout(app_state.decode_timer);
});
