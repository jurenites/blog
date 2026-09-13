import {encode_text,grid_from_code,rank_masks,apply_locks,audit_grid,decode_grid,raster_grid,svg_grid,validate_project,ECC_LEVELS} from './core.js';
import {append_match,validate_matches,excluded_addresses} from './matches.js';
import {rotate_index,rotate_grid,invalid_pattern_characters,toggled_lock_value,character_damage} from './editor-tools.js';
import {character_cells,matches_pattern,preview_payload} from './character-map.js';
import {domain_choices,candidate_patterns,has_search_slots,valid_domain_candidate} from './domain-pattern.js';
import {TLD_LIST,TLD_SOURCE,TLD_VERSION} from './tld-data.js';
const element_by_id=element_id=>document.getElementById(element_id);
const canvas_element=element_by_id('qr-canvas');
const canvas_context=canvas_element.getContext('2d');
const preview_element=element_by_id('preview-canvas');
const preview_context=preview_element.getContext('2d');
const APP_STATE={payload_text:'HTTPS://1KIC0.FR',version_number:1,error_level:'Q',lock_values:new Array(441).fill(-1),qr_code:null,result_grid:[],tool_name:'paint',quarter_turns:0,preview_only:false,alpha_only:false,highlight_index:null,highlight_cells:new Set(),character_rows:[],undo_rows:[],redo_rows:[],cursor_index:null,drag_start:null,drag_indices:new Set(),drag_snapshot:null,search_worker:null,decoded_text:null,found_matches:[],stencil_data:null,decode_timer:null};
const theme_values=getComputedStyle(document.documentElement);
const theme_color=color_name=>theme_values.getPropertyValue(color_name).trim();
const PALETTE={white:theme_color('--paper-white'),black:theme_color('--ink-black'),grid:theme_color('--guide-grid'),lock_match:theme_color('--guide-lock-match'),lock_conflict:theme_color('--guide-lock-conflict'),structure:theme_color('--guide-structure'),cursor:theme_color('--guide-cursor'),expected:theme_color('--guide-expected')};
let toast_timer;
let rotation_animations=[];
let previous_encoded_input=element_by_id('address-pattern').value;
function show_toast(message_text){element_by_id('toast-message').textContent=message_text;element_by_id('toast-message').hidden=false;clearTimeout(toast_timer);toast_timer=setTimeout(()=>element_by_id('toast-message').hidden=true,3800);}
function snapshot_state(){return {address_pattern:element_by_id('address-pattern').value,payload_text:APP_STATE.payload_text,version_number:APP_STATE.version_number,error_level:APP_STATE.error_level,lock_values:[...APP_STATE.lock_values],alpha_only:APP_STATE.alpha_only,preview_only:APP_STATE.preview_only,mask_index:APP_STATE.qr_code?.mask??-1,quarter_turns:APP_STATE.quarter_turns,protect_structure:element_by_id('protect-structure').checked};}
function push_history(){APP_STATE.undo_rows.push(snapshot_state());if(APP_STATE.undo_rows.length>80)APP_STATE.undo_rows.shift();APP_STATE.redo_rows=[];}
function restore_snapshot(saved_state){cancel_search();stop_rotation_animation();if(typeof saved_state.address_pattern==='string'){element_by_id('address-pattern').value=saved_state.mode_name==='encode'?saved_state.payload_text:saved_state.address_pattern;previous_encoded_input=element_by_id('address-pattern').value;validate_address_pattern();}Object.assign(APP_STATE,{payload_text:saved_state.payload_text,version_number:saved_state.version_number,error_level:saved_state.error_level,lock_values:[...saved_state.lock_values],quarter_turns:saved_state.quarter_turns??0,alpha_only:saved_state.alpha_only===true,preview_only:saved_state.preview_only===true});if(typeof saved_state.protect_structure==='boolean')element_by_id('protect-structure').checked=saved_state.protect_structure;sync_controls();rebuild_code(saved_state.mask_index);}
function sync_controls(){element_by_id('qr-version').value=String(APP_STATE.version_number);element_by_id('error-level').value=APP_STATE.error_level;}
function project_snapshot(){return {...snapshot_state(),format:'qr-pixel-studio-v1',found_matches:APP_STATE.found_matches,address_pattern:element_by_id('address-pattern').value,alphabet_name:element_by_id('search-alphabet').value,search_seconds:Number(element_by_id('search-limit').value)};}
function save_local(){try{localStorage.setItem('qr-pixel-studio-v1',JSON.stringify(project_snapshot()));}catch{element_by_id('workspace-status').textContent='Browser storage is full or unavailable · use Save project to keep your matches';}}
function restore_search_settings(project_data){
 element_by_id('address-pattern').value=project_data.mode_name==='encode'?project_data.payload_text:typeof project_data.address_pattern==='string'&&project_data.address_pattern.length<=4096?project_data.address_pattern:project_data.payload_text;
 if(['letters','digits','alphanumeric'].includes(project_data.alphabet_name))element_by_id('search-alphabet').value=project_data.alphabet_name;
 if([15,60,180].includes(project_data.search_seconds))element_by_id('search-limit').value=String(project_data.search_seconds);
 previous_encoded_input=element_by_id('address-pattern').value;validate_address_pattern();
}
function remember_current_match(){
 if(!APP_STATE.qr_code||APP_STATE.preview_only||!valid_domain_candidate(APP_STATE.payload_text)||decode_grid(APP_STATE.result_grid,APP_STATE.qr_code.size)!==APP_STATE.payload_text)return false;
 APP_STATE.found_matches=append_match(APP_STATE.found_matches,snapshot_state());render_matches();save_local();return true;
}
function render_matches(){
 update_generate_label();
 const list_element=element_by_id('matches-list');list_element.replaceChildren();element_by_id('matches-count').textContent=`${APP_STATE.found_matches.length} SAVED`;
 if(!APP_STATE.found_matches.length){const empty_element=document.createElement('p');empty_element.className='field-help';empty_element.textContent='Matches will stack here as you find them.';list_element.append(empty_element);return;}
 for(const [match_index,match_info] of [...APP_STATE.found_matches.entries()].reverse()){
  const row_element=document.createElement('article');row_element.className='match-card';
  const load_button=document.createElement('button');load_button.className='match-load';load_button.textContent=match_info.payload_text;
  const is_current=match_info.payload_text===APP_STATE.payload_text&&match_info.version_number===APP_STATE.version_number&&match_info.error_level===APP_STATE.error_level&&match_info.mask_index===APP_STATE.qr_code?.mask&&(match_info.quarter_turns??0)===APP_STATE.quarter_turns&&match_info.lock_values.every((cell_value,cell_index)=>cell_value===APP_STATE.lock_values[cell_index]);
  load_button.setAttribute('aria-pressed',String(is_current));load_button.setAttribute('aria-label',`Load saved match ${match_info.payload_text}`);
  load_button.addEventListener('click',()=>{push_history();restore_snapshot({...match_info,address_pattern:match_info.address_pattern??match_info.payload_text});element_by_id('candidate-text').textContent=match_info.payload_text;verify_current();show_toast('Saved QR and its locked artwork restored.');});
  const detail_row=document.createElement('div');detail_row.className='match-details';const detail_element=document.createElement('span');const grid_size=17+4*match_info.version_number;detail_element.textContent=`#${match_index+1} · ${grid_size}×${grid_size} · ${match_info.error_level} · mask ${match_info.mask_index}${is_current?' · Viewing':''}${valid_domain_candidate(match_info.payload_text)?'':' · Invalid website ending'}`;
  const export_button=document.createElement('button');export_button.className='text-button';export_button.textContent='SVG';export_button.setAttribute('aria-label',`Export SVG for ${match_info.payload_text}`);
  export_button.addEventListener('click',()=>{try{const saved_code=encode_text(match_info.payload_text,match_info.version_number,match_info.error_level,match_info.mask_index,match_info.alpha_only===true);const saved_grid=apply_locks(saved_code,match_info.lock_values);const is_verified=decode_grid(saved_grid,grid_size)===match_info.payload_text;download_file(svg_grid(rotate_grid(saved_grid,grid_size,match_info.quarter_turns??0),grid_size),`qr-match-${match_index+1}-${is_verified?'decoded':'experimental'}.svg`,'image/svg+xml');if(!is_verified)show_toast('This saved grid no longer verifies with the current decoder. Exported as experimental.');}catch(error_info){show_toast(error_info.message);}});
  detail_row.append(detail_element,export_button);row_element.append(load_button,detail_row);list_element.append(row_element);
 }
}

function update_capacity(){const data_count=globalThis.qrcodegen.QrCode.getNumDataCodewords(APP_STATE.version_number,ECC_LEVELS[APP_STATE.error_level]);const header_count=4+(APP_STATE.version_number<10?9:11);const char_capacity=Math.floor((data_count*8-header_count)*2/11);element_by_id('capacity-value').textContent=`${char_capacity} alphanumeric characters`;element_by_id('capacity-detail').textContent='Includes HTTPS:// · lowercase text takes more space';}
function set_scan_state(state_name,status_text,description_text,decoded_text=''){element_by_id('scan-card').dataset.state=state_name;element_by_id('scan-status').textContent=status_text;element_by_id('status-icon').textContent=state_name==='good'?'✓':state_name==='bad'?'×':'◇';element_by_id('scan-description').textContent=description_text;element_by_id('decoded-text').textContent=decoded_text;}
function rebuild_code(mask_index=-1){try{APP_STATE.qr_code=encode_text(APP_STATE.payload_text,APP_STATE.version_number,APP_STATE.error_level,mask_index,APP_STATE.alpha_only);APP_STATE.result_grid=apply_locks(APP_STATE.qr_code,APP_STATE.lock_values);element_by_id('generation-message').textContent='Paint a cell to lock it. Regeneration keeps your artwork.';refresh_workspace();return true;}catch(error_info){show_toast(error_info.message);element_by_id('generation-message').textContent=error_info.message;return false;}}
function render_canvas(){if(!APP_STATE.qr_code)return;const grid_size=APP_STATE.qr_code.size;const cell_size=20;const full_size=(grid_size+8)*cell_size;canvas_element.width=canvas_element.height=full_size;canvas_context.fillStyle=PALETTE.white;canvas_context.fillRect(0,0,full_size,full_size);for(let cell_index=0;cell_index<grid_size*grid_size;cell_index++){const display_index=rotate_index(cell_index,grid_size,APP_STATE.quarter_turns);const col_pos=display_index%grid_size;const row_pos=Math.floor(display_index/grid_size);const source_col=cell_index%grid_size;const source_row=Math.floor(cell_index/grid_size);const draw_x=(col_pos+4)*cell_size;const draw_y=(row_pos+4)*cell_size;if(APP_STATE.result_grid[cell_index]){canvas_context.fillStyle=PALETTE.black;canvas_context.fillRect(draw_x,draw_y,cell_size,cell_size);}const is_missing=APP_STATE.qr_code.modules[source_row][source_col]&&!APP_STATE.result_grid[cell_index];if(element_by_id('show-expected').checked&&is_missing){canvas_context.fillStyle=PALETTE.expected;canvas_context.fillRect(draw_x,draw_y,cell_size,cell_size);}if(element_by_id('show-structure').checked&&APP_STATE.qr_code.function_grid[source_row][source_col]){canvas_context.fillStyle=PALETTE.structure;canvas_context.globalAlpha=.27;canvas_context.fillRect(draw_x,draw_y,cell_size,cell_size);canvas_context.globalAlpha=1;}if(APP_STATE.highlight_cells.has(cell_index)){if(!(element_by_id('show-expected').checked&&is_missing)){canvas_context.fillStyle=PALETTE.cursor;canvas_context.globalAlpha=.42;canvas_context.fillRect(draw_x,draw_y,cell_size,cell_size);canvas_context.globalAlpha=1;}canvas_context.strokeStyle=PALETTE.cursor;canvas_context.lineWidth=2;canvas_context.strokeRect(draw_x+1,draw_y+1,cell_size-2,cell_size-2);}if(element_by_id('show-locks').checked&&APP_STATE.lock_values[cell_index]!==-1){const matches_expected=APP_STATE.result_grid[cell_index]===APP_STATE.qr_code.modules[source_row][source_col];canvas_context.strokeStyle=matches_expected?PALETTE.lock_match:PALETTE.lock_conflict;canvas_context.lineWidth=1.8;canvas_context.strokeRect(draw_x+3,draw_y+3,cell_size-6,cell_size-6);}}if(element_by_id('show-grid').checked){canvas_context.strokeStyle=PALETTE.grid;canvas_context.lineWidth=.7;canvas_context.beginPath();for(let line_index=0;line_index<=grid_size;line_index++){const line_pos=(line_index+4)*cell_size;canvas_context.moveTo(4*cell_size,line_pos);canvas_context.lineTo((grid_size+4)*cell_size,line_pos);canvas_context.moveTo(line_pos,4*cell_size);canvas_context.lineTo(line_pos,(grid_size+4)*cell_size);}canvas_context.stroke();}if(APP_STATE.cursor_index!==null){const display_index=rotate_index(APP_STATE.cursor_index,grid_size,APP_STATE.quarter_turns);const draw_x=(display_index%grid_size+4)*cell_size;const draw_y=(Math.floor(display_index/grid_size)+4)*cell_size;canvas_context.strokeStyle=PALETTE.cursor;canvas_context.lineWidth=3;canvas_context.strokeRect(draw_x+1.5,draw_y+1.5,cell_size-3,cell_size-3);}const {pixel_data,full_size:preview_size}=raster_grid(display_grid(),grid_size,5);preview_element.width=preview_element.height=preview_size;preview_context.putImageData(new ImageData(pixel_data,preview_size,preview_size),0,0);}
function refresh_workspace(run_decode=true){element_by_id('candidate-text').textContent=(APP_STATE.preview_only?'Preview: ':'')+APP_STATE.payload_text;const audit_info=audit_grid(APP_STATE.qr_code,APP_STATE.result_grid);const black_count=APP_STATE.lock_values.filter(cell_value=>cell_value===1).length;const white_count=APP_STATE.lock_values.filter(cell_value=>cell_value===0).length;element_by_id('locked-count').textContent=black_count+white_count;element_by_id('lock-split').textContent=`${black_count} / ${white_count}`;element_by_id('damage-count').textContent=`${audit_info.damaged_counts.join(', ')} / ${audit_info.repair_limit}${audit_info.damaged_counts.length>1?' per block':''}`;element_by_id('structure-count').textContent=audit_info.structure_cells.length;element_by_id('mask-value').textContent=APP_STATE.qr_code.mask;element_by_id('canvas-title').textContent=`${APP_STATE.qr_code.size} × ${APP_STATE.qr_code.size} modules${APP_STATE.quarter_turns?` · ${APP_STATE.quarter_turns*90}°`:""}`;element_by_id('undo-button').disabled=!APP_STATE.undo_rows.length;element_by_id('redo-button').disabled=!APP_STATE.redo_rows.length;element_by_id('risk-message').textContent=audit_info.structure_cells.length?`Experimental: ${audit_info.structure_cells.length} structure cells are changed. A successful decode does not guarantee phone-camera reliability.`:audit_info.overflow_count?'Some blocks exceed their correction limit. Try another address, release locks, or increase the grid size.':`${audit_info.remaining_words} additional codeword errors can be corrected in the most constrained block. Test the exported code on a phone.`;update_capacity();APP_STATE.character_rows=character_cells(APP_STATE.qr_code);highlight_character(APP_STATE.highlight_index,false);render_canvas();render_matches();save_local();if(run_decode){clearTimeout(APP_STATE.decode_timer);APP_STATE.decode_timer=setTimeout(verify_current,120);}}
function verify_current(){clearTimeout(APP_STATE.decode_timer);if(!APP_STATE.qr_code)return null;try{const decoded_text=decode_grid(display_grid(),APP_STATE.qr_code.size);APP_STATE.decoded_text=decoded_text;const audit_info=audit_grid(APP_STATE.qr_code,APP_STATE.result_grid);if(decoded_text===APP_STATE.payload_text){set_scan_state('good',APP_STATE.preview_only?'Preview decodes':'Decodes correctly',audit_info.structure_cells.length?'Text matches. Structure is altered; test on a phone.':'Decoded text matches the encoded text.',decoded_text);element_by_id('workspace-status').textContent='Verified · decoded text matches';}else if(decoded_text){set_scan_state('bad','Different text decoded','This grid does not decode to the intended text.',decoded_text);element_by_id('workspace-status').textContent='Decoded text does not match';}else{set_scan_state('bad','Not decodable','The painted grid could not be decoded. Try generating around your locks.');element_by_id('workspace-status').textContent='Artwork preserved · decode failed';}return decoded_text;}catch(error_info){set_scan_state('bad','Decoder error',error_info.message);return null;}}
function point_to_cell(pointer_event){const canvas_bounds=canvas_element.getBoundingClientRect();const grid_size=APP_STATE.qr_code.size;const col_pos=Math.floor((pointer_event.clientX-canvas_bounds.left)/canvas_bounds.width*(grid_size+8))-4;const row_pos=Math.floor((pointer_event.clientY-canvas_bounds.top)/canvas_bounds.height*(grid_size+8))-4;return col_pos>=0&&row_pos>=0&&col_pos<grid_size&&row_pos<grid_size?rotate_index(row_pos*grid_size+col_pos,grid_size,-APP_STATE.quarter_turns):null;}
function display_grid(){return rotate_grid(APP_STATE.result_grid,APP_STATE.qr_code.size,APP_STATE.quarter_turns);}
function apply_tool(cell_index){
 if(cell_index===null)return false;
 const grid_size=APP_STATE.qr_code.size;
 const is_protected=APP_STATE.qr_code.function_grid[Math.floor(cell_index/grid_size)][cell_index%grid_size]&&element_by_id('protect-structure').checked;
 const old_value=APP_STATE.lock_values[cell_index];
 const next_value=toggled_lock_value(APP_STATE.tool_name,old_value,APP_STATE.result_grid[cell_index],is_protected);
 if(next_value===old_value)return false;
 APP_STATE.lock_values[cell_index]=next_value;APP_STATE.result_grid=apply_locks(APP_STATE.qr_code,APP_STATE.lock_values);return true;
}
function cursor_label(cell_index){if(cell_index===null){element_by_id('cursor-position').textContent='Hover to inspect a cell';return;}const grid_size=APP_STATE.qr_code.size;const structure_text=APP_STATE.qr_code.function_grid[Math.floor(cell_index/grid_size)][cell_index%grid_size]?' · QR structure':'';const display_index=rotate_index(cell_index,grid_size,APP_STATE.quarter_turns);element_by_id('cursor-position').textContent=`Column ${display_index%grid_size} · Row ${Math.floor(display_index/grid_size)}${structure_text}`;}
canvas_element.addEventListener('pointerdown',pointer_event=>{if(pointer_event.button!==0||rotation_animations.length)return;cancel_search();const cell_index=point_to_cell(pointer_event);if(cell_index===null)return;canvas_element.focus({preventScroll:true});canvas_element.setPointerCapture(pointer_event.pointerId);push_history();APP_STATE.drag_start=cell_index;APP_STATE.drag_snapshot=[...APP_STATE.lock_values];APP_STATE.drag_indices=new Set();if(!apply_tool(cell_index))show_toast('QR structure is protected. Turn protection off to experiment.');APP_STATE.drag_indices.add(cell_index);refresh_workspace(false);});
canvas_element.addEventListener('pointermove',pointer_event=>{const cell_index=point_to_cell(pointer_event);APP_STATE.cursor_index=cell_index;cursor_label(cell_index);if(APP_STATE.drag_start!==null&&cell_index!==null){if(pointer_event.shiftKey){APP_STATE.lock_values=[...APP_STATE.drag_snapshot];APP_STATE.result_grid=apply_locks(APP_STATE.qr_code,APP_STATE.lock_values);const grid_size=APP_STATE.qr_code.size;const first_col=Math.min(APP_STATE.drag_start%grid_size,cell_index%grid_size);const last_col=Math.max(APP_STATE.drag_start%grid_size,cell_index%grid_size);const first_row=Math.min(Math.floor(APP_STATE.drag_start/grid_size),Math.floor(cell_index/grid_size));const last_row=Math.max(Math.floor(APP_STATE.drag_start/grid_size),Math.floor(cell_index/grid_size));APP_STATE.drag_indices=new Set();for(let row_pos=first_row;row_pos<=last_row;row_pos++)for(let col_pos=first_col;col_pos<=last_col;col_pos++){const target_index=row_pos*grid_size+col_pos;apply_tool(target_index);APP_STATE.drag_indices.add(target_index);}}else if(!APP_STATE.drag_indices.has(cell_index)){apply_tool(cell_index);APP_STATE.drag_indices.add(cell_index);}refresh_workspace(false);}else render_canvas();});
function finish_stroke(){if(APP_STATE.drag_start===null)return;APP_STATE.drag_start=null;APP_STATE.drag_snapshot=null;refresh_workspace();}
canvas_element.addEventListener('pointerup',finish_stroke);canvas_element.addEventListener('pointercancel',finish_stroke);canvas_element.addEventListener('pointerleave',()=>{if(APP_STATE.drag_start===null){APP_STATE.cursor_index=null;cursor_label(null);render_canvas();}});
function choose_tool(tool_name){APP_STATE.tool_name=tool_name;document.querySelectorAll('[data-tool]').forEach(button_element=>button_element.setAttribute('aria-pressed',String(button_element.dataset.tool===tool_name)));}
document.querySelectorAll('[data-tool]').forEach(button_element=>button_element.addEventListener('click',()=>choose_tool(button_element.dataset.tool)));
canvas_element.addEventListener('keydown',key_event=>{if(rotation_animations.length){key_event.preventDefault();return;}const grid_size=APP_STATE.qr_code.size;let cell_index=APP_STATE.cursor_index??Math.floor(grid_size/2)*grid_size+Math.floor(grid_size/2);const key_offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-grid_size,ArrowDown:grid_size};if(key_event.key in key_offsets){key_event.preventDefault();const display_index=rotate_index(cell_index,grid_size,APP_STATE.quarter_turns);const next_col=Math.max(0,Math.min(grid_size-1,display_index%grid_size+(key_event.key==='ArrowLeft'?-1:key_event.key==='ArrowRight'?1:0)));const next_row=Math.max(0,Math.min(grid_size-1,Math.floor(display_index/grid_size)+(key_event.key==='ArrowUp'?-1:key_event.key==='ArrowDown'?1:0)));APP_STATE.cursor_index=rotate_index(next_row*grid_size+next_col,grid_size,-APP_STATE.quarter_turns);cursor_label(APP_STATE.cursor_index);render_canvas();}else if(key_event.code==='Space'){key_event.preventDefault();cancel_search();push_history();apply_tool(cell_index);refresh_workspace();}});
element_by_id('undo-button').addEventListener('click',()=>{if(!APP_STATE.undo_rows.length)return;APP_STATE.redo_rows.push(snapshot_state());restore_snapshot(APP_STATE.undo_rows.pop());});element_by_id('redo-button').addEventListener('click',()=>{if(!APP_STATE.redo_rows.length)return;APP_STATE.undo_rows.push(snapshot_state());restore_snapshot(APP_STATE.redo_rows.pop());});
document.addEventListener('keydown',key_event=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if((key_event.metaKey||key_event.ctrlKey)&&key_event.key.toLowerCase()==='z'){key_event.preventDefault();element_by_id(key_event.shiftKey?'redo-button':'undo-button').click();}else if(!key_event.metaKey&&!key_event.ctrlKey&&({b:'paint',w:'paint',l:'lock',u:'lock'})[key_event.key.toLowerCase()])choose_tool(({b:'paint',w:'paint',l:'lock',u:'lock'})[key_event.key.toLowerCase()]);});
['show-grid','show-locks','show-structure','show-expected'].forEach(element_id=>element_by_id(element_id).addEventListener('change',render_canvas));
function stop_rotation_animation(){
 for(const animation_info of rotation_animations)animation_info.cancel();
 rotation_animations=[];
 canvas_element.removeAttribute('data-rotating');
}
function animate_clockwise_rotation(){
 if(typeof canvas_element.animate!=='function'||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 // The raster already contains the final quarter-turn; animate it from its old orientation.
 rotation_animations=[canvas_element,preview_element].map(target_element=>target_element.animate(
  [{transform:'rotate(-90deg)'},{transform:'rotate(0deg)'}],
  {duration:180,easing:'ease-in-out'}
 ));
 canvas_element.setAttribute('data-rotating','true');
 rotation_animations[0].onfinish=stop_rotation_animation;
}
element_by_id('rotate-qr').addEventListener('click',()=>{stop_rotation_animation();cancel_search();finish_stroke();push_history();APP_STATE.quarter_turns=(APP_STATE.quarter_turns+1)%4;cursor_label(APP_STATE.cursor_index);refresh_workspace();animate_clockwise_rotation();show_toast(`QR rotated clockwise · ${APP_STATE.quarter_turns*90}°`);});
function update_generate_label(){const has_wildcards=has_search_slots(element_by_id('address-pattern').value);element_by_id('generate-button').textContent=has_wildcards?(APP_STATE.found_matches.length?'Find next matching address':'Find a matching address'):'Update QR code';element_by_id('search-options').hidden=!has_wildcards;element_by_id('find-next').disabled=!has_wildcards;}
function cancel_search(){if(APP_STATE.search_worker){APP_STATE.search_worker.terminate();APP_STATE.search_worker=null;element_by_id('workspace-status').textContent='Search stopped · artwork kept';}element_by_id('cancel-search').hidden=true;element_by_id('generate-button').disabled=false;update_generate_label();}
element_by_id('cancel-search').addEventListener('click',cancel_search);
function generate_fixed(){return encode_live_input();}
function start_search(){cancel_search();if(APP_STATE.found_matches.length>=1000){show_toast('This project has reached 1,000 saved matches. Save it before starting a new project.');return;}const pattern_text=element_by_id('address-pattern').value;if(!validate_address_pattern()){element_by_id('generation-message').textContent=element_by_id('pattern-error').textContent;element_by_id('address-pattern').focus();return;}try{if(!has_search_slots(pattern_text))throw new Error('Use ? for the characters that search may choose.');const fitting_patterns=candidate_patterns(pattern_text).filter(candidate_pattern=>{try{encode_text(candidate_pattern.replaceAll('?','A'),APP_STATE.version_number,APP_STATE.error_level,0,true);return true;}catch{return false;}});if(!fitting_patterns.length)throw new Error('No matching domain ending fits this QR. Shorten the name or choose a larger grid.');}catch(error_info){show_toast(error_info.message);element_by_id('generation-message').textContent=error_info.message;return;}save_local();const worker_instance=new Worker(new URL('./search-worker.js',import.meta.url));APP_STATE.search_worker=worker_instance;element_by_id('generate-button').disabled=true;element_by_id('find-next').disabled=true;element_by_id('cancel-search').hidden=false;element_by_id('generation-message').textContent='Searching while keeping every locked pixel…';worker_instance.onmessage=({data:message_data})=>{if(APP_STATE.search_worker!==worker_instance)return;if(message_data.type==='progress'){element_by_id('generation-message').textContent=`${message_data.attempt_count.toLocaleString()} candidates checked · ${message_data.phase_name}`;element_by_id('workspace-status').textContent='Searching · painting or changing settings stops the search';}else if(message_data.type==='result'){if(APP_STATE.found_matches.some(match_info=>match_info.payload_text===message_data.payload_text))return;push_history();APP_STATE.preview_only=false;APP_STATE.alpha_only=true;APP_STATE.payload_text=message_data.payload_text;APP_STATE.qr_code=encode_text(message_data.payload_text,APP_STATE.version_number,APP_STATE.error_level,message_data.mask_index,true);APP_STATE.result_grid=apply_locks(APP_STATE.qr_code,APP_STATE.lock_values);sync_controls();remember_current_match();refresh_workspace();element_by_id('candidate-text').textContent=message_data.payload_text;element_by_id('generation-message').textContent=`Found a decodable match after ${message_data.attempt_count.toLocaleString()} candidates. Domain registration is unchecked.`;cancel_search();verify_current();}else if(message_data.type==='done'||message_data.type==='error'){cancel_search();element_by_id('generation-message').textContent=message_data.message_text;show_toast(message_data.message_text);}};worker_instance.onerror=()=>{cancel_search();show_toast('Search could not run. Your artwork is preserved.');};worker_instance.postMessage({pattern_text,version_number:APP_STATE.version_number,error_level:APP_STATE.error_level,lock_values:[...APP_STATE.lock_values],alphabet_name:element_by_id('search-alphabet').value,time_limit:Number(element_by_id('search-limit').value),protect_structure:element_by_id('protect-structure').checked,excluded_payloads:excluded_addresses(APP_STATE.found_matches)});}
element_by_id('generate-button').addEventListener('click',()=>has_search_slots(element_by_id('address-pattern').value)?start_search():encode_live_input());
element_by_id('find-next').addEventListener('click',()=>{cancel_search();try{remember_current_match();start_search();}catch(error_info){show_toast(error_info.message);}});
function update_tld_details(){
 const choice_info=domain_choices(element_by_id('address-pattern').value);
 element_by_id('tld-status').textContent=choice_info?choice_info.matching_tlds.length?`${choice_info.matching_tlds.length} IANA-listed ending${choice_info.matching_tlds.length===1?'':'s'} match this pattern. Domain availability and registration restrictions are not checked.`:`.${choice_info.ending_text} is not an IANA-listed ending or matching pattern.`:'Website searches use IANA-listed top-level domains.';
 const groups_map=new Map();
 for(const ending_text of choice_info?choice_info.matching_tlds:TLD_LIST){if(!groups_map.has(ending_text.length))groups_map.set(ending_text.length,[]);groups_map.get(ending_text.length).push('.'+ending_text);}
 const list_element=element_by_id('tld-list');list_element.replaceChildren();
 for(const [ending_length,ending_rows] of [...groups_map].sort((left_row,right_row)=>left_row[0]-right_row[0])){
  const group_element=document.createElement('p');group_element.className='field-help';group_element.textContent=`${ending_length} characters (${ending_rows.length}): ${ending_rows.join(' · ')}`;list_element.append(group_element);
 }
 element_by_id('tld-source').textContent=`IANA · ${TLD_LIST.length} endings · ${TLD_VERSION}`;
 element_by_id('tld-source').href=TLD_SOURCE;
}
function validate_address_pattern(){
 const input_element=element_by_id('address-pattern');
 const highlight_element=element_by_id('pattern-highlights');
 const error_element=element_by_id('pattern-error');
 const invalid_rows=has_search_slots(input_element.value)?invalid_pattern_characters(input_element.value):[];
 const invalid_offsets=new Set(invalid_rows.map(character_info=>character_info.string_offset));
 highlight_element.replaceChildren();let string_offset=0;let character_index=0;
 for(const character_text of input_element.value){
  const mark_element=document.createElement(invalid_offsets.has(string_offset)?'mark':'span');mark_element.textContent=character_text;mark_element.dataset.characterIndex=String(character_index++);mark_element.dataset.stringOffset=String(string_offset);highlight_element.append(mark_element);
  string_offset+=character_text.length;
 }
 highlight_element.scrollLeft=input_element.scrollLeft;
 input_element.setAttribute('aria-invalid',String(invalid_rows.length>0));error_element.hidden=!invalid_rows.length;
 error_element.textContent=invalid_rows.length?`Unsupported in a search pattern: ${invalid_rows.map(character_info=>`${JSON.stringify(character_info.character_text)} at position ${character_info.character_number}`).join(', ')}. Search with ? requires uppercase A–Z, 0–9, space or $ % * + - . / : . Complete text without ? can also use lowercase and other symbols.`:'';
 update_tld_details();return !invalid_rows.length;
}
function highlight_character(character_index,redraw_canvas=true){
 const input_chars=[...element_by_id('address-pattern').value];
 const domain_info=domain_choices(input_chars.join(''));
 const has_any_tld=domain_info?.ending_text==='*';
 const is_current=matches_pattern(input_chars.join(''),APP_STATE.payload_text)||(has_any_tld&&matches_pattern(input_chars.join('').slice(0,domain_info.ending_start),APP_STATE.payload_text.slice(0,domain_info.ending_start))&&valid_domain_candidate(APP_STATE.payload_text));
 const character_info=is_current&&(!has_any_tld||character_index<domain_info.ending_start)?APP_STATE.character_rows[character_index]:null;
 APP_STATE.highlight_index=character_info?character_index:null;
 APP_STATE.highlight_cells=new Set(character_info?.cell_indices??[]);
 for(const mirror_element of element_by_id('pattern-highlights').children)mirror_element.setAttribute('data-active',String(character_info&&Number(mirror_element.dataset.characterIndex)===character_index));
 const detail_element=element_by_id('character-detail');
 if(character_info){
  const selected_text=input_chars[character_index];
  const resolved_text=[...APP_STATE.payload_text][character_index];
  const locked_count=character_info.cell_indices.filter(cell_index=>APP_STATE.lock_values[cell_index]!==-1).length;
  const damage_info=character_damage(character_info.cell_indices,grid_from_code(APP_STATE.qr_code),APP_STATE.result_grid);
  const grouped_text=character_info.group_size>1?`Shared by positions ${character_info.group_start+1}–${character_info.group_start+character_info.group_size} (${character_info.mode_name}).`:`${character_info.mode_name} character.`;
  detail_element.textContent=`Position ${character_index+1}: ${JSON.stringify(selected_text)}${selected_text==='?'?` → ${JSON.stringify(resolved_text)} · ${APP_STATE.preview_only?'temporary value':'found value'}`:' · fixed'}. ${damage_info.changed_count} / ${damage_info.total_count} data cells changed (${damage_info.missing_black} missing black, ${damage_info.extra_black} extra black). ${grouped_text} ${locked_count?`${locked_count} are locked. `:''}Correction may still recover the text; its bits are not highlighted.`;
 }else detail_element.textContent=has_any_tld?'The .* placeholder can expand to several characters. Use a fixed ending or .??? to inspect character cells.':is_current?'Hover a character or move the text cursor to highlight its QR data cells.':'This draft is not the displayed QR. Enter text that fits to inspect its cells.';
 if(redraw_canvas)render_canvas();
}
function highlight_text_cursor(){
 const input_element=element_by_id('address-pattern');
 const character_index=[...input_element.value.slice(0,input_element.selectionStart??0)].length;
 highlight_character(Math.min(character_index,[...input_element.value].length-1));
}
element_by_id('address-pattern').addEventListener('pointermove',pointer_event=>{
 const hovered_element=[...element_by_id('pattern-highlights').children].find(mirror_element=>{
  const character_bounds=mirror_element.getBoundingClientRect();
  return pointer_event.clientX>=character_bounds.left&&pointer_event.clientX<character_bounds.right;
 });
 highlight_character(hovered_element?Number(hovered_element.dataset.characterIndex):null);
});
element_by_id('address-pattern').addEventListener('pointerleave',()=>highlight_character(null));
element_by_id('address-pattern').addEventListener('blur',()=>highlight_character(null));
for(const event_name of ['keyup','click','select','focus'])element_by_id('address-pattern').addEventListener(event_name,highlight_text_cursor);

function encode_live_input(){
 cancel_search();APP_STATE.highlight_index=null;APP_STATE.highlight_cells.clear();
 const input_element=element_by_id('address-pattern');
 const entered_text=input_element.value;
 const previous_text=previous_encoded_input;
 previous_encoded_input=entered_text;
 update_generate_label();highlight_character(null);
 if(!validate_address_pattern()){
  element_by_id('generation-message').textContent='Fix the highlighted characters to search. The current QR is unchanged.';
  save_local();return false;
 }
 if(!entered_text.length){
  element_by_id('generation-message').textContent='Type text to encode it immediately. The previous QR stays visible until then.';
  save_local();return false;
 }
 try{
  // Compute first: text that does not fit must never overwrite the working code.
  const has_wildcards=has_search_slots(entered_text);
  let preview_pattern=entered_text;
  if(has_wildcards){
   const fitting_patterns=candidate_patterns(entered_text).filter(candidate_pattern=>{try{encode_text(candidate_pattern.replaceAll('?','A'),APP_STATE.version_number,APP_STATE.error_level,0,true);return true;}catch{return false;}});
   if(!fitting_patterns.length)throw new Error('No matching domain ending fits this QR. Shorten the name or choose a larger grid.');
   preview_pattern=fitting_patterns.find(candidate_pattern=>matches_pattern(candidate_pattern,APP_STATE.payload_text))??fitting_patterns[0];
  }
  const resolved_text=has_wildcards?preview_payload(preview_pattern,APP_STATE.payload_text,element_by_id('search-alphabet').value):entered_text;
  const best_result=rank_masks(resolved_text,APP_STATE.version_number,APP_STATE.error_level,APP_STATE.lock_values,element_by_id('protect-structure').checked,has_wildcards);
  if(entered_text!==APP_STATE.payload_text||best_result.qr_code.mask!==APP_STATE.qr_code?.mask){
   push_history();APP_STATE.undo_rows.at(-1).address_pattern=previous_text;
  }
  APP_STATE.preview_only=has_wildcards;APP_STATE.alpha_only=has_wildcards;APP_STATE.payload_text=resolved_text;APP_STATE.qr_code=best_result.qr_code;APP_STATE.result_grid=best_result.result_grid;
  element_by_id('candidate-text').textContent=(has_wildcards?'Preview: ':'')+resolved_text;
  set_scan_state('pending','Checking new text','The grid has updated. Checking the painted result.');
  refresh_workspace();
  element_by_id('generation-message').textContent=has_wildcards?`Preview: ${resolved_text}. The ? positions use temporary characters; search to find a matching result.`:'Encoded as you type. Locked artwork is preserved.';
  return true;
 }catch(error_info){
  input_element.setAttribute('aria-invalid','true');
  element_by_id('pattern-error').hidden=false;
  element_by_id('pattern-error').textContent=error_info.message;
  element_by_id('generation-message').textContent='Text not applied. The previous QR is still displayed.';
  save_local();return false;
 }
}
element_by_id('address-pattern').addEventListener('input',input_event=>{if(!input_event.isComposing)encode_live_input();});
element_by_id('address-pattern').addEventListener('compositionend',encode_live_input);
element_by_id('search-alphabet').addEventListener('input',encode_live_input);
element_by_id('address-pattern').addEventListener('scroll',()=>{element_by_id('pattern-highlights').scrollLeft=element_by_id('address-pattern').scrollLeft;});
['search-limit','protect-structure'].forEach(element_id=>element_by_id(element_id).addEventListener('input',()=>{cancel_search();save_local();}));
['qr-version','error-level'].forEach(element_id=>element_by_id(element_id).addEventListener('change',()=>{cancel_search();const saved_state=snapshot_state();const next_version=Number(element_by_id('qr-version').value);const next_level=element_by_id('error-level').value;const next_size=17+4*next_version;const old_size=17+4*APP_STATE.version_number;if(next_size<old_size&&APP_STATE.lock_values.some((cell_value,cell_index)=>cell_value!==-1&&(cell_index%old_size>=next_size||Math.floor(cell_index/old_size)>=next_size))){sync_controls();show_toast('Locked artwork extends beyond that grid. Release the out-of-bounds locks first.');return;}try{encode_text(APP_STATE.payload_text,next_version,next_level,-1,APP_STATE.alpha_only);}catch(error_info){sync_controls();show_toast(error_info.message);return;}push_history();const next_locks=new Array(next_size*next_size).fill(-1);for(let row_pos=0;row_pos<Math.min(old_size,next_size);row_pos++)for(let col_pos=0;col_pos<Math.min(old_size,next_size);col_pos++)next_locks[row_pos*next_size+col_pos]=APP_STATE.lock_values[row_pos*old_size+col_pos];APP_STATE.version_number=next_version;APP_STATE.error_level=next_level;APP_STATE.lock_values=next_locks;rebuild_code();}));
element_by_id('uppercase-host').addEventListener('click',()=>{const input_text=element_by_id('address-pattern').value;const matched_url=input_text.match(/^([a-z][a-z0-9+.-]*:\/\/)([^/?#]+)(.*)$/i);if(!matched_url){show_toast('Enter a full URL including HTTPS:// first.');return;}element_by_id('address-pattern').value=matched_url[1].toUpperCase()+matched_url[2].toUpperCase()+matched_url[3];encode_live_input();});
element_by_id('clear-locks').addEventListener('click',()=>{cancel_search();push_history();APP_STATE.lock_values.fill(-1);APP_STATE.result_grid=grid_from_code(APP_STATE.qr_code);refresh_workspace();});
element_by_id('verify-button').addEventListener('click',verify_current);
function download_file(file_text,file_name,mime_type){const file_url=URL.createObjectURL(new Blob([file_text],{type:mime_type}));const link_element=document.createElement('a');link_element.href=file_url;link_element.download=file_name;link_element.click();setTimeout(()=>URL.revokeObjectURL(file_url),1000);}
element_by_id('export-svg').addEventListener('click',()=>{const payload_result=verify_current();download_file(svg_grid(display_grid(),APP_STATE.qr_code.size),`qr-${APP_STATE.qr_code.size}-${payload_result===APP_STATE.payload_text?'decoded':'experimental'}.svg`,'image/svg+xml');if(payload_result!==APP_STATE.payload_text)show_toast('Exported as experimental: this grid does not decode to the intended text.');});
element_by_id('save-project').addEventListener('click',()=>download_file(JSON.stringify(project_snapshot(),null,2),'qr-pixel-project.json','application/json'));
element_by_id('load-project').addEventListener('click',()=>element_by_id('project-file').click());
element_by_id('project-file').addEventListener('change',async file_event=>{try{const file_item=file_event.target.files[0];if(!file_item)return;if(file_item.size>8*1024*1024)throw new Error('Project file is too large.');const project_data=validate_project(JSON.parse(await file_item.text()));const found_matches=validate_matches(project_data.found_matches);encode_text(project_data.payload_text,project_data.version_number,project_data.error_level,Number.isInteger(project_data.mask_index)?project_data.mask_index:-1,project_data.alpha_only===true);push_history();APP_STATE.found_matches=found_matches;restore_search_settings(project_data);element_by_id('protect-structure').checked=project_data.protect_structure!==false;restore_snapshot(project_data);show_toast('Project opened. All locks are restored.');}catch(error_info){show_toast(error_info.message);}finally{file_event.target.value='';}});
element_by_id('copy-payload').addEventListener('click',async()=>{const payload_result=verify_current();if(payload_result===null){show_toast('Nothing decoded to copy yet.');return;}try{await navigator.clipboard.writeText(payload_result);show_toast('Decoded text copied.');}catch{show_toast('Clipboard unavailable. Select the decoded text to copy it.');}});
element_by_id('logo-preset').addEventListener('click',async()=>{cancel_search();try{const response_info=await fetch(new URL('./logo.json',import.meta.url));const logo_data=await response_info.json();push_history();APP_STATE.version_number=1;APP_STATE.error_level='Q';APP_STATE.quarter_turns=0;APP_STATE.payload_text='HTTPS://1KIC0.FR';APP_STATE.alpha_only=false;APP_STATE.preview_only=false;element_by_id('address-pattern').value=APP_STATE.payload_text;validate_address_pattern();APP_STATE.lock_values=new Array(441).fill(-1);for(let row_pos=0;row_pos<4;row_pos++)for(let col_pos=0;col_pos<20;col_pos++)APP_STATE.lock_values[(row_pos+9)*21+col_pos+1]=logo_data.cells[row_pos*22+col_pos];element_by_id('protect-structure').checked=false;sync_controls();rebuild_code(3);show_toast('Original letters loaded with a one-pixel underline. Structure protection is off for this experiment.');}catch(error_info){show_toast('Could not load the logo.');}});
// Local image processing never uploads imported files.
import('./imports.js').then(({connect_imports})=>connect_imports({APP_STATE,element_by_id,show_toast,push_history,cancel_search,refresh_workspace})).catch(error_info=>show_toast('Image tools could not load: '+error_info.message));
try{const local_text=localStorage.getItem('qr-pixel-studio-v1');if(local_text){const saved_state=validate_project(JSON.parse(local_text));const found_matches=validate_matches(saved_state.found_matches);encode_text(saved_state.payload_text,saved_state.version_number,saved_state.error_level,saved_state.mask_index??-1,saved_state.alpha_only===true);Object.assign(APP_STATE,{payload_text:saved_state.payload_text,version_number:saved_state.version_number,error_level:saved_state.error_level,lock_values:saved_state.lock_values,quarter_turns:saved_state.quarter_turns??0,alpha_only:saved_state.alpha_only===true,preview_only:saved_state.preview_only===true,found_matches});restore_search_settings(saved_state);element_by_id('protect-structure').checked=saved_state.protect_structure!==false;sync_controls();rebuild_code(saved_state.mask_index??-1);if(!APP_STATE.found_matches.length)remember_current_match();}else rebuild_code();}catch{rebuild_code();}
previous_encoded_input=element_by_id('address-pattern').value;validate_address_pattern();update_generate_label();
export {APP_STATE,generate_fixed,encode_live_input,start_search,verify_current,restore_snapshot,snapshot_state,refresh_workspace,show_toast,highlight_character};

function inspect_state(){return {...snapshot_state(),decoded_text:decode_grid(APP_STATE.result_grid,APP_STATE.qr_code.size),audit_info:audit_grid(APP_STATE.qr_code,APP_STATE.result_grid),locked_count:APP_STATE.lock_values.filter(cell_value=>cell_value!==-1).length,saved_matches:APP_STATE.found_matches.map(match_info=>({payload_text:match_info.payload_text,version_number:match_info.version_number,error_level:match_info.error_level,mask_index:match_info.mask_index}))};}
function set_locked_cells(cell_rows){
  if(!Array.isArray(cell_rows)||cell_rows.length>3249)throw new Error('Provide a bounded cells array.');
  const grid_size=APP_STATE.qr_code.size;
  for(const cell_info of cell_rows){if(!Number.isInteger(cell_info.column)||!Number.isInteger(cell_info.row)||cell_info.column<0||cell_info.row<0||cell_info.column>=grid_size||cell_info.row>=grid_size||![0,1,null].includes(cell_info.value))throw new Error('Each cell needs valid column, row, and value (0, 1 or null).');if(cell_info.value!==null&&element_by_id('protect-structure').checked&&APP_STATE.qr_code.function_grid[cell_info.row][cell_info.column])throw new Error('A requested cell is protected QR structure.');}
  cancel_search();push_history();for(const cell_info of cell_rows)APP_STATE.lock_values[cell_info.row*grid_size+cell_info.column]=cell_info.value===null?-1:cell_info.value;APP_STATE.result_grid=apply_locks(APP_STATE.qr_code,APP_STATE.lock_values);refresh_workspace();verify_current();return inspect_state();
}
if(document.modelContext?.registerTool){
 const lifecycle_control=new AbortController();window.addEventListener('pagehide',()=>lifecycle_control.abort(),{once:true});
 const tool_rows=[
  {name:'inspect_qr',title:'Inspect QR',description:'Read the current QR settings, locks, decoded text and correction audit without changing the drawing.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>inspect_state()},
  {name:'encode_qr',title:'Encode QR text',description:'Encode text using the selected size and correction level, preserve every locked pixel and compare all masks. Updates the current drawing.',inputSchema:{type:'object',properties:{payload_text:{type:'string',minLength:1,maxLength:4096}},required:['payload_text'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:(input_data)=>{if(typeof input_data?.payload_text!=='string'||input_data.payload_text.length>4096)throw new Error('Provide payload_text.');rank_masks(input_data.payload_text,APP_STATE.version_number,APP_STATE.error_level,APP_STATE.lock_values,element_by_id('protect-structure').checked);element_by_id('address-pattern').value=input_data.payload_text;generate_fixed();verify_current();return inspect_state();}},
  {name:'set_qr_locks',title:'Paint and lock QR cells',description:'Set black (1), white (0), or free (null) cells using zero-based column and row. Rejects the whole edit if any cell is invalid or protected.',inputSchema:{type:'object',properties:{cells:{type:'array',maxItems:3249,items:{type:'object',properties:{column:{type:'integer',minimum:0},row:{type:'integer',minimum:0},value:{type:['integer','null'],enum:[0,1,null]}},required:['column','row','value'],additionalProperties:false}}},required:['cells'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:(input_data)=>set_locked_cells(input_data?.cells)}
 ];
 for(const tool_info of tool_rows)try{Promise.resolve(document.modelContext.registerTool(tool_info,{signal:lifecycle_control.signal})).catch(()=>{});}catch{}
}
