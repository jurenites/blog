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
const tool_buttons=['paint','lock','text'].map(tool_name=>{const button_element=new TestElement();button_element.dataset.tool=tool_name;return button_element;});
globalThis.document={getElementById:element_id=>element_map.get(element_id),documentElement:{},querySelectorAll:selector_text=>selector_text==='.drawing-toolbar [data-tool]'?tool_buttons:[],addEventListener:()=>{},createElement:()=>new TestElement(),createTextNode:character_text=>({textContent:character_text})};
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
 type_encoded_text('http://?.cc');assert.equal(element_map.get('address-pattern').attributes['aria-invalid'],'false');assert.equal(app_state.payload_text,'http://A.cc');assert.equal(app_state.alpha_only,false);
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

test('page rejects the reported .4AG result and outdated workers before changing or saving the QR',async()=>{
 const {TLD_VERSION}=await import('../ui/tld-data.js');
 const app_state=app_tools.APP_STATE;
 const before_payload=app_state.payload_text;
 const before_grid=[...app_state.result_grid];
 const before_matches=app_state.found_matches.length;
 globalThis.Worker=class {constructor(){this.onmessage=null;}postMessage(){}terminate(){this.stopped=true;}};
 element_map.get('address-pattern').value='HTTP://?????.???';
 app_tools.start_search();let active_worker=app_state.search_worker;
 active_worker.onmessage({data:{type:'result',payload_text:'HTTP://XFY60.4AG',mask_index:3,attempt_count:1,tld_version:TLD_VERSION}});
 assert.equal(active_worker.stopped,true);assert.equal(app_state.payload_text,before_payload);assert.deepEqual(app_state.result_grid,before_grid);assert.equal(app_state.found_matches.length,before_matches);
 assert.match(element_map.get('generation-message').textContent,/Rejected/);
 app_tools.start_search();active_worker=app_state.search_worker;
 active_worker.onmessage({data:{type:'result',payload_text:'HTTP://XFY60.TOP',mask_index:3,attempt_count:1}});
 assert.equal(app_state.payload_text,before_payload);assert.equal(active_worker.stopped,true);
 element_map.get('address-pattern').value='HTTP://X????.???';app_tools.start_search();active_worker=app_state.search_worker;
 active_worker.onmessage({data:{type:'result',payload_text:'HTTP://AFY60.TOP',mask_index:3,attempt_count:1,tld_version:TLD_VERSION}});
 assert.equal(app_state.payload_text,before_payload);assert.match(element_map.get('generation-message').textContent,/fixed characters/);
 clearTimeout(app_state.decode_timer);
});

test('pixel text drags without damaging underlying artwork, survives undo/storage, and constrains search',async()=>{
 const {text_locks,text_bitmap}=await import('../ui/pixel-text.js');
 const {apply_locks,validate_project}=await import('../ui/core.js');
 const {validate_matches}=await import('../ui/matches.js');
 const app_state=app_tools.APP_STATE;
 app_tools.restore_snapshot({payload_text:'HTTP://A.TOP',version_number:1,error_level:'L',mask_index:0,lock_values:new Array(441).fill(-1),quarter_turns:0,protect_structure:true});
 app_state.lock_values[10*21+10]=0;
 const original_locks=[...app_state.lock_values];
 const original_grid=apply_locks(app_state.qr_code,original_locks);
 element_map.get('pixel-text-input').value='HI';
 element_map.get('pixel-text-input').events.input[0]({isComposing:false});
 assert.equal(app_state.text_layer.text_value,'HI');assert.equal(app_state.tool_name,'text');
 assert.deepEqual(app_state.lock_values,original_locks);
 const old_layer={...app_state.text_layer};
 const canvas_element=element_map.get('qr-canvas');canvas_element.focus=()=>{};canvas_element.setPointerCapture=()=>{};canvas_element.getBoundingClientRect=()=>({left:0,top:0,width:580,height:580});
 const pointer_event=(col_pos,row_pos)=>({button:0,pointerId:1,clientX:(col_pos+4.5)*20,clientY:(row_pos+4.5)*20});
 canvas_element.events.pointerdown[0](pointer_event(old_layer.column_pos,old_layer.row_pos));
 canvas_element.events.pointermove[0](pointer_event(11,15));
 canvas_element.events.pointerup[0]();
 assert.equal(app_state.text_layer.column_pos,11);assert.equal(app_state.text_layer.row_pos,15);
 for(let row_index=old_layer.row_pos;row_index<old_layer.row_pos+4;row_index++)for(let col_index=old_layer.column_pos;col_index<old_layer.column_pos+text_bitmap('HI').width_cells;col_index++)assert.equal(app_state.result_grid[row_index*21+col_index],original_grid[row_index*21+col_index]);
 assert.deepEqual(app_state.lock_values,original_locks);
 element_map.get('undo-button').events.click[0]();assert.deepEqual(app_state.text_layer,old_layer);
 element_map.get('redo-button').events.click[0]();assert.equal(app_state.text_layer.column_pos,11);
 const saved_snapshot=app_tools.snapshot_state();
 assert.deepEqual(validate_project(JSON.parse(JSON.stringify({...saved_snapshot,format:'qr-pixel-studio-v1'}))).text_layer,app_state.text_layer);
 assert.deepEqual(validate_matches([saved_snapshot])[0].text_layer,app_state.text_layer);
 let search_request;globalThis.Worker=class{postMessage(message_data){search_request=message_data;}terminate(){}};
 element_map.get('address-pattern').value='HTTP://????.TOP';app_tools.start_search();
 assert.deepEqual(search_request.lock_values,text_locks(original_locks,app_state.text_layer,21,app_state.qr_code.function_grid));
 element_map.get('cancel-search').events.click[0]();
 app_state.quarter_turns=1;const before_row=app_state.text_layer.row_pos;
 canvas_element.events.keydown[0]({key:'ArrowRight',preventDefault(){}});assert.equal(app_state.text_layer.row_pos,before_row-1);
 // Moving over protected finder cells leaves the structure unchanged.
 app_state.text_layer.column_pos=0;app_state.text_layer.row_pos=0;app_tools.refresh_workspace(false);
 for(let cell_index=0;cell_index<441;cell_index++)if(app_state.qr_code.function_grid[Math.floor(cell_index/21)][cell_index%21])assert.equal(app_state.result_grid[cell_index],original_grid[cell_index]);
 element_map.get('pixel-text-input').value='';element_map.get('pixel-text-input').events.input[0]({isComposing:false});assert.equal(app_state.text_layer,null);assert.deepEqual(app_state.result_grid,original_grid);
 clearTimeout(app_state.decode_timer);
});

test('resizing applies a formerly oversized lowercase draft and pointer hover highlights its byte cells',()=>{
 const app_state=app_tools.APP_STATE;
 app_tools.restore_snapshot({address_pattern:'://?????.???',payload_text:'://AAAAA.AAA',version_number:1,error_level:'Q',mask_index:0,lock_values:new Array(441).fill(-1),quarter_turns:0,protect_structure:true,preview_only:true});
 type_encoded_text('http://?????.???');
 assert.equal(app_state.payload_text,'://AAAAA.AAA');
 assert.equal(element_map.get('address-pattern').attributes['aria-invalid'],'true');
 element_map.get('qr-version').value='2';element_map.get('error-level').value='Q';
 element_map.get('qr-version').events.change[0]();
 assert.match(app_state.payload_text,/^http:\/\/[A-Z0-9]{5}\.[A-Z]{3}$/);
 assert.equal(element_map.get('address-pattern').attributes['aria-invalid'],'false');
 const mirror_rows=element_map.get('pattern-highlights').children;
 mirror_rows.forEach((mirror_element,char_index)=>{mirror_element.getBoundingClientRect=()=>({left:10+char_index*10,right:20+char_index*10});});
 const input_element=element_map.get('address-pattern');
 input_element.events.pointermove[0]({clientX:15});const first_cells=[...app_state.highlight_cells];
 assert.equal(app_state.highlight_index,0);assert.equal(first_cells.length,8);
 input_element.events.pointermove[0]({clientX:25});
 assert.equal(app_state.highlight_index,1);assert.equal(app_state.highlight_cells.size,8);assert.notDeepEqual([...app_state.highlight_cells],first_cells);
 assert.match(element_map.get('character-detail').textContent,/UTF-8 character/);
 input_element.events.pointerleave[0]();assert.equal(app_state.highlight_cells.size,0);
 clearTimeout(app_state.decode_timer);
});
test('typing pixel text immediately creates black lettering, a white locked outline and a visible drag area',()=>{
 const app_state=app_tools.APP_STATE;
 app_tools.restore_snapshot({address_pattern:'HELLO',payload_text:'HELLO',version_number:2,error_level:'Q',mask_index:0,lock_values:new Array(625).fill(-1),quarter_turns:0,protect_structure:false});
 element_map.get('pixel-text-input').value='jurenites';
 element_map.get('pixel-text-input').events.input[0]({isComposing:false});
 assert.equal(app_state.text_layer.text_value,'jurenites');assert.equal(app_state.text_layer.outline_size,1);assert.equal(app_state.text_layer.white_background,true);
 const layer_info=app_state.text_layer;const white_index=(layer_info.row_pos-1)*25+layer_info.column_pos;
 assert.equal(app_state.result_grid[white_index],false);
 element_map.get('show-expected').checked=true;const canvas_element=element_map.get('qr-canvas');canvas_element.draw_calls.length=0;app_tools.refresh_workspace(false);
 const draw_x=(white_index%25+4)*20;const draw_y=(Math.floor(white_index/25)+4)*20;
 assert.equal(canvas_element.draw_calls.some(draw_call=>draw_call.method_name==='fillRect'&&draw_call.fill_style==='rgb(160 160 160)'&&draw_call.method_args[0]===draw_x&&draw_call.method_args[1]===draw_y),false);
 assert.ok(canvas_element.draw_calls.some(draw_call=>draw_call.method_name==='strokeRect'&&draw_call.method_args[2]>20));
 element_map.get('pixel-text-input').value='';element_map.get('pixel-text-input').events.input[0]({isComposing:false});assert.equal(app_state.text_layer,null);
 clearTimeout(app_state.decode_timer);
});

test('Lock edits text padding without dragging, persists released cells, and permits clipping the border at grid edges',async()=>{
 const {text_locks,text_bitmap}=await import('../ui/pixel-text.js');
 const {validate_matches}=await import('../ui/matches.js');
 const app_state=app_tools.APP_STATE;
 app_tools.restore_snapshot({address_pattern:'HELLO',payload_text:'HELLO',version_number:1,error_level:'Q',mask_index:0,lock_values:new Array(441).fill(-1),quarter_turns:0,protect_structure:false});
 element_map.get('pixel-text-input').value='Hi';element_map.get('pixel-text-input').events.input[0]({isComposing:false});
 const text_layer=app_state.text_layer;const grid_size=21;
 const pad_col=text_layer.column_pos;const pad_row=text_layer.row_pos-1;const pad_index=pad_row*grid_size+pad_col;
 app_state.lock_values[pad_index]=0;app_tools.refresh_workspace(false);
 const canvas_element=element_map.get('qr-canvas');canvas_element.focus=()=>{};canvas_element.setPointerCapture=()=>{};canvas_element.getBoundingClientRect=()=>({left:0,top:0,width:580,height:580});
 const pointer_event=(col_pos,row_pos,shiftKey=false)=>({button:0,pointerId:1,clientX:(col_pos+4.5)*20,clientY:(row_pos+4.5)*20,shiftKey});
 app_state.tool_name='lock';canvas_element.events.pointerdown[0](pointer_event(pad_col,pad_row));
 assert.equal(app_state.text_drag,null);assert.deepEqual(app_state.text_layer.released_cells,[[0,-1]]);
 assert.equal(text_locks(app_state.lock_values,app_state.text_layer,grid_size)[pad_index],-1);
 assert.equal(app_state.result_grid[pad_index],app_state.qr_code.modules[pad_row][pad_col]);
 // Repeated Shift rectangle moves recompute from the start of the stroke.
 canvas_element.events.pointermove[0](pointer_event(pad_col+1,pad_row,true));canvas_element.events.pointermove[0](pointer_event(pad_col+1,pad_row,true));
 assert.deepEqual(app_state.text_layer.released_cells,[[0,-1],[1,-1]]);canvas_element.events.pointerup[0]();
 assert.deepEqual(validate_matches([app_tools.snapshot_state()])[0].text_layer.released_cells,[[0,-1],[1,-1]]);
 element_map.get('undo-button').events.click[0]();assert.deepEqual(app_state.text_layer.released_cells,[]);
 element_map.get('redo-button').events.click[0]();assert.equal(app_state.text_layer.released_cells.length,2);
 canvas_element.events.pointerdown[0](pointer_event(pad_col,pad_row));canvas_element.events.pointerup[0]();assert.equal(app_state.result_grid[pad_index],false);assert.deepEqual(app_state.text_layer.released_cells,[[1,-1]]);
 // Glyphs can reach zero; the white perimeter is clipped outside the QR.
 app_state.tool_name='text';app_state.text_layer.column_pos=1;app_state.text_layer.row_pos=1;
 canvas_element.events.keydown[0]({key:'ArrowLeft',preventDefault(){}});canvas_element.events.keydown[0]({key:'ArrowUp',preventDefault(){}});
 assert.equal(app_state.text_layer.column_pos,0);assert.equal(app_state.text_layer.row_pos,0);assert.equal(app_state.result_grid.length,441);
 assert.deepEqual(app_state.text_layer.released_cells,[[1,-1]]);
 assert.equal(app_state.lock_values[pad_index],0);
 const bitmap_info=text_bitmap('Hi',19);app_state.text_layer.column_pos=21-bitmap_info.width_cells-1;app_state.text_layer.row_pos=21-bitmap_info.height_cells-1;
 canvas_element.events.keydown[0]({key:'ArrowRight',preventDefault(){}});canvas_element.events.keydown[0]({key:'ArrowDown',preventDefault(){}});
 assert.equal(app_state.text_layer.column_pos,21-bitmap_info.width_cells);assert.equal(app_state.text_layer.row_pos,21-bitmap_info.height_cells);
 clearTimeout(app_state.decode_timer);
});

test('Draw edits travel with pixel text, restore the underlying QR, and reset when text is switched off',async()=>{
 const {apply_locks,validate_project}=await import('../ui/core.js');
 const {validate_matches}=await import('../ui/matches.js');
 const app_state=app_tools.APP_STATE;
 app_tools.restore_snapshot({address_pattern:'HELLO',payload_text:'HELLO',version_number:1,error_level:'Q',mask_index:0,lock_values:new Array(441).fill(-1),quarter_turns:0,protect_structure:false});
 element_map.get('pixel-text-input').value='H';element_map.get('pixel-text-input').events.input[0]({isComposing:false});
 const start_col=app_state.text_layer.column_pos;const start_row=app_state.text_layer.row_pos;
 const padding_index=(start_row-1)*21+start_col;const glyph_index=start_row*21+start_col;
 app_state.lock_values[padding_index]=0;
 const base_locks=[...app_state.lock_values];const base_grid=apply_locks(app_state.qr_code,base_locks);
 const canvas_element=element_map.get('qr-canvas');canvas_element.focus=()=>{};canvas_element.setPointerCapture=()=>{};canvas_element.getBoundingClientRect=()=>({left:0,top:0,width:580,height:580});
 const pointer_event=(col_pos,row_pos,shiftKey=false)=>({button:0,pointerId:1,clientX:(col_pos+4.5)*20,clientY:(row_pos+4.5)*20,shiftKey});
 function click_cell(col_pos,row_pos){canvas_element.events.pointerdown[0](pointer_event(col_pos,row_pos));canvas_element.events.pointerup[0]();}
 app_state.tool_name='paint';
 canvas_element.events.pointerdown[0](pointer_event(start_col,start_row-1));
 assert.equal(app_state.text_drag,null);assert.equal(app_state.result_grid[padding_index],true);
 canvas_element.events.pointermove[0](pointer_event(start_col+1,start_row-1,true));canvas_element.events.pointermove[0](pointer_event(start_col+1,start_row-1,true));canvas_element.events.pointerup[0]();
 assert.deepEqual(app_state.text_layer.drawn_cells,[[0,-1,1],[1,-1,1]]);
 click_cell(start_col,start_row);assert.equal(app_state.result_grid[glyph_index],false);
 assert.deepEqual(app_state.lock_values,base_locks);
 const saved_state=app_tools.snapshot_state();
 assert.deepEqual(validate_project({...saved_state,format:'qr-pixel-studio-v1'}).text_layer,app_state.text_layer);
 assert.deepEqual(validate_matches([saved_state])[0].text_layer,app_state.text_layer);
 element_map.get('undo-button').events.click[0]();assert.equal(app_state.result_grid[glyph_index],true);
 element_map.get('redo-button').events.click[0]();assert.equal(app_state.result_grid[glyph_index],false);
 // Lock can release and restore a drawn correction, and drawing a released cell locks it again.
 app_state.tool_name='lock';click_cell(start_col,start_row-1);assert.equal(app_state.result_grid[padding_index],app_state.qr_code.modules[start_row-1][start_col]);
 app_state.tool_name='paint';click_cell(start_col,start_row-1);assert.deepEqual(app_state.text_layer.released_cells,[]);
 app_state.tool_name='lock';click_cell(start_col+2,start_row-1);
 // The Text tool moves both black and white corrections without touching base artwork.
 app_state.tool_name='text';canvas_element.events.pointerdown[0](pointer_event(start_col,start_row));canvas_element.events.pointermove[0](pointer_event(2,15));canvas_element.events.pointerup[0]();
 assert.equal(app_state.result_grid[padding_index],base_grid[padding_index]);assert.equal(app_state.result_grid[glyph_index],base_grid[glyph_index]);
 assert.equal(app_state.result_grid[14*21+3],true);assert.equal(app_state.result_grid[15*21+2],false);
 assert.deepEqual(app_state.lock_values,base_locks);
 const enabled_control=element_map.get('pixel-text-enabled');enabled_control.checked=false;enabled_control.events.change[0]();
 assert.deepEqual(app_state.result_grid,base_grid);assert.deepEqual(app_state.text_layer.drawn_cells,[]);assert.equal(app_state.text_layer.is_enabled,false);
 assert.equal(validate_matches([app_tools.snapshot_state()])[0].text_layer.is_enabled,false);
 enabled_control.checked=true;enabled_control.events.change[0]();
 assert.equal(app_state.result_grid[14*21+3],false);assert.equal(app_state.result_grid[15*21+2],true);
 assert.deepEqual(app_state.text_layer.released_cells,[[2,-1]]);
 assert.equal(saved_state.text_layer.drawn_cells.length,3);
 // Protected finder pixels remain protected even inside the text rectangle.
 app_state.text_layer.column_pos=0;app_state.text_layer.row_pos=0;element_map.get('protect-structure').checked=true;app_tools.refresh_workspace(false);app_state.tool_name='paint';click_cell(0,0);
 assert.deepEqual(app_state.text_layer.drawn_cells,[]);assert.equal(app_state.result_grid[0],app_state.qr_code.modules[0][0]);
 clearTimeout(app_state.decode_timer);
});

test('shrinking clips text without losing its layout or edits, including saved state and rotated outlines',async()=>{
 const {validate_project}=await import('../ui/core.js');const {validate_matches}=await import('../ui/matches.js');
 const {text_locks}=await import('../ui/pixel-text.js');const app_state=app_tools.APP_STATE;
 app_tools.restore_snapshot({address_pattern:'HELLO',payload_text:'HELLO',version_number:7,error_level:'Q',mask_index:0,lock_values:new Array(2025).fill(-1),quarter_turns:0,protect_structure:false,text_layer:{text_value:'JURENITES',column_pos:10,row_pos:19,white_background:true,outline_size:1,wrap_text:true,drawn_cells:[[20,0,1]],released_cells:[[21,0]]}});
 tool_buttons.find(button_element=>button_element.dataset.tool==='text').events.click[0]();
 if(!app_state.text_controls_open)tool_buttons.find(button_element=>button_element.dataset.tool==='text').events.click[0]();
 const original_layer=JSON.parse(JSON.stringify(app_state.text_layer));
 const original_text_locks=text_locks(app_state.lock_values,original_layer,45);
 element_map.get('qr-version').value='1';element_map.get('error-level').value='Q';element_map.get('qr-version').events.change[0]();
 assert.equal(app_state.version_number,1);assert.equal(app_state.result_grid.length,441);assert.deepEqual(app_state.text_layer,original_layer);
 const small_locks=text_locks(app_state.lock_values,app_state.text_layer,21);
 for(let row_index=0;row_index<21;row_index++)for(let col_index=0;col_index<21;col_index++)assert.equal(small_locks[row_index*21+col_index],original_text_locks[row_index*45+col_index]);
 const saved_state=validate_project({...app_tools.snapshot_state(),format:'qr-pixel-studio-v1'});
 assert.deepEqual(saved_state.text_layer,original_layer);assert.deepEqual(validate_matches([saved_state])[0].text_layer,original_layer);
 app_tools.restore_snapshot(saved_state);assert.deepEqual(app_state.text_layer,original_layer);
 const canvas_element=element_map.get('qr-canvas');
 for(let turn_index=0;turn_index<4;turn_index++){
  app_state.quarter_turns=turn_index;canvas_element.draw_calls.length=0;app_tools.refresh_workspace(false);
  const clip_index=canvas_element.draw_calls.findIndex(draw_call=>draw_call.method_name==='clip');assert.ok(clip_index>0);
  assert.deepEqual(canvas_element.draw_calls[clip_index-1].method_args,[80,80,420,420]);
  assert.equal(canvas_element.draw_calls.filter(draw_call=>draw_call.method_name==='rotate').length,turn_index);
  assert.ok(canvas_element.draw_calls.slice(clip_index).some(draw_call=>draw_call.method_name==='restore'));
 }
 element_map.get('qr-version').value='7';element_map.get('qr-version').events.change[0]();
 assert.deepEqual(app_state.text_layer,original_layer);assert.deepEqual(text_locks(app_state.lock_values,app_state.text_layer,45),original_text_locks);
 // A completely clipped layer still survives persistence and can reappear on a larger grid.
 app_state.text_layer.row_pos=35;element_map.get('qr-version').value='1';element_map.get('qr-version').events.change[0]();
 assert.equal(app_state.version_number,1);assert.deepEqual(text_locks(app_state.lock_values,app_state.text_layer,21),app_state.lock_values);
 assert.equal(validate_project({...app_tools.snapshot_state(),format:'qr-pixel-studio-v1'}).text_layer.row_pos,35);
 clearTimeout(app_state.decode_timer);
});

test('Text toggles the actual layer, controls and outline while retaining edits and saved visibility',async()=>{
 const {apply_locks,validate_project}=await import('../ui/core.js');
 const app_state=app_tools.APP_STATE;const text_button=tool_buttons.find(button_element=>button_element.dataset.tool==='text');const paint_button=tool_buttons.find(button_element=>button_element.dataset.tool==='paint');
 app_tools.restore_snapshot({address_pattern:'HELLO',payload_text:'HELLO',version_number:1,error_level:'Q',mask_index:0,lock_values:new Array(441).fill(-1),quarter_turns:0,protect_structure:false});
 if(app_state.text_controls_open)text_button.events.click[0]();
 text_button.events.click[0]();assert.equal(element_map.get('pixel-text-controls').hidden,false);assert.equal(text_button.attributes['aria-expanded'],'true');
 element_map.get('pixel-text-input').value='Hi';element_map.get('pixel-text-input').events.input[0]({isComposing:false});
 app_state.text_layer.drawn_cells=[[0,-1,1]];app_tools.refresh_workspace(false);
 const base_grid=apply_locks(app_state.qr_code,app_state.lock_values);
 const original_grid=[...app_state.result_grid];const original_layer=JSON.stringify(app_state.text_layer);const canvas_element=element_map.get('qr-canvas');
 paint_button.events.click[0]();assert.equal(app_state.tool_name,'paint');assert.equal(element_map.get('pixel-text-controls').hidden,false);
 canvas_element.draw_calls.length=0;text_button.events.click[0]();
 assert.equal(element_map.get('pixel-text-controls').hidden,true);assert.equal(text_button.attributes['aria-pressed'],'false');assert.equal(text_button.attributes['aria-expanded'],'false');
 assert.equal(canvas_element.draw_calls.some(draw_call=>draw_call.method_name==='clip'),false);assert.deepEqual(app_state.result_grid,base_grid);assert.equal(app_state.text_layer.is_visible,false);assert.deepEqual(app_state.text_layer.drawn_cells,[[0,-1,1]]);
 const hidden_snapshot=validate_project({...app_tools.snapshot_state(),format:'qr-pixel-studio-v1'});app_tools.restore_snapshot(hidden_snapshot);assert.equal(element_map.get('pixel-text-controls').hidden,true);assert.deepEqual(app_state.result_grid,base_grid);
 canvas_element.draw_calls.length=0;text_button.events.click[0]();assert.equal(app_state.tool_name,'text');assert.equal(element_map.get('pixel-text-controls').hidden,false);assert.ok(canvas_element.draw_calls.some(draw_call=>draw_call.method_name==='clip'));
 assert.deepEqual(app_state.result_grid,original_grid);assert.equal(JSON.stringify(app_state.text_layer),original_layer);
 text_button.events.click[0]();assert.equal(app_state.tool_name,'paint');assert.deepEqual(app_state.result_grid,base_grid);
 element_map.get('undo-button').events.click[0]();assert.deepEqual(app_state.result_grid,original_grid);assert.equal(element_map.get('pixel-text-controls').hidden,false);
 assert.equal(element_map.has('apply-pixel-text'),false);assert.equal(element_map.has('remove-pixel-text'),false);
 clearTimeout(app_state.decode_timer);
});
