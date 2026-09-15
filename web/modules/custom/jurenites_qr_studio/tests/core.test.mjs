import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import '../ui/vendor/qrcodegen.js';
vm.runInThisContext(await readFile(new URL('../ui/vendor/jsQR.js',import.meta.url),'utf8'));
const core_tools=await import('../ui/core.js');
const {search_linear,solve_equations}=await import('../ui/solver.js');
const logo_data=JSON.parse(await readFile(new URL('../ui/logo.json',import.meta.url),'utf8'));
function logo_locks(){const lock_values=new Array(441).fill(-1);for(let row_pos=0;row_pos<4;row_pos++)for(let col_pos=0;col_pos<20;col_pos++)lock_values[(row_pos+9)*21+col_pos+1]=logo_data.cells[row_pos*22+col_pos];return lock_values;}
test('encoder / decoder round trips across versions and correction levels',()=>{for(let version_number=1;version_number<=10;version_number++)for(const error_level of ['L','M','Q','H']){const payload_text=version_number===1&&error_level==='H'?'HELLO':'HTTPS://A.CC';const qr_code=core_tools.encode_text(payload_text,version_number,error_level,0);const result_grid=core_tools.grid_from_code(qr_code);assert.equal(core_tools.decode_grid(result_grid,qr_code.size),payload_text);const block_info=core_tools.block_layout(qr_code);assert.equal(block_info.word_blocks.length,qr_code.code_bytes.length);assert.equal(core_tools.audit_grid(qr_code,result_grid).total_damaged,0);}});
test('original logo keeps black and white locks and decodes to the known payload',()=>{const qr_code=core_tools.encode_text('HTTPS://1KIC0.FR',1,'Q',3);const lock_values=logo_locks();const result_grid=core_tools.apply_locks(qr_code,lock_values);lock_values.forEach((cell_value,cell_index)=>{if(cell_value!==-1)assert.equal(Number(result_grid[cell_index]),cell_value);});assert.equal(core_tools.decode_grid(result_grid,21),'HTTPS://1KIC0.FR');const audit_info=core_tools.audit_grid(qr_code,result_grid);assert.equal(audit_info.total_damaged,5);assert.deepEqual(audit_info.structure_cells,[9*21+6]);});
test('longer domain labels fit lower correction without changing QR size',()=>{assert.equal(core_tools.encode_text('HTTPS://ABCDEFGH.CC',1,'M').size,21);assert.throws(()=>core_tools.encode_text('HTTPS://ABCDEFGH.CC',1,'Q'),/does not fit/);assert.equal(core_tools.encode_text('https://Example.com/Case',3,'H').size,29);});
test('SVG export includes the quiet zone and only the finished QR geometry',()=>{const qr_code=core_tools.encode_text('HELLO');const svg_text=core_tools.svg_grid(core_tools.grid_from_code(qr_code),21);assert.match(svg_text,/viewBox="0 0 29 29"/);assert.doesNotMatch(svg_text,/script|guide|lock/i);});
test('project import rejects malformed lock grids and out-of-range versions',()=>{assert.throws(()=>core_tools.validate_project({format:'qr-pixel-studio-v1',payload_text:'HELLO',version_number:1,error_level:'Q',lock_values:[]}));assert.throws(()=>core_tools.validate_project({format:'qr-pixel-studio-v1',payload_text:'HELLO',version_number:99,error_level:'Q',lock_values:[]}));});
test('linear constraints produce solutions and reject contradictions',()=>{assert.equal(solve_equations([[1n,0],[1n,1]],1),null);const solved_rows=solve_equations([[3n,1],[2n,0]],2);assert.equal(solved_rows.assigned_bits,1n);});
test('reverse solver finds a new payload matching the exact whole-pixel logo',async()=>{const search_options={pattern_text:'HTTPS://?????.CC',version_number:1,error_level:'Q',lock_values:logo_locks(),alphabet_name:'alphanumeric',protect_structure:false};let result_data=null;const found_result=await search_linear(search_options,(payload_text,mask_index)=>{const qr_code=core_tools.encode_text(payload_text,1,'Q',mask_index,true);const result_grid=core_tools.apply_locks(qr_code,search_options.lock_values);if(core_tools.decode_grid(result_grid,21)!==payload_text)return false;result_data={payload_text,mask_index};return true;},()=>{},performance.now()+15000);assert.equal(found_result,true);assert.match(result_data.payload_text,/^HTTPS:\/\/[A-Z0-9]{5}\.CC$/);console.log('Solver fixture:',result_data);});
test('saved matches deduplicate by address, keep independent artwork, and survive JSON storage', async()=>{
  const {append_match,validate_matches,excluded_addresses}=await import('../ui/matches.js');
  const first_match={payload_text:'HTTPS://FUHRF.CC',version_number:1,error_level:'Q',mask_index:3,lock_values:logo_locks(),protect_structure:false};
  const match_rows=append_match([],first_match);
  first_match.lock_values[0]=1;
  assert.equal(match_rows[0].lock_values[0],-1);
  assert.equal(append_match(match_rows,{...first_match,mask_index:1}).length,1);
  assert.deepEqual(excluded_addresses(validate_matches(JSON.parse(JSON.stringify(match_rows)))),['HTTPS://FUHRF.CC']);
  assert.equal(match_rows[0].is_active,true);
  match_rows[0].is_active=false;
  const restored_matches=validate_matches(JSON.parse(JSON.stringify(match_rows)));
  assert.equal(restored_matches[0].is_active,false);
  assert.deepEqual(excluded_addresses(restored_matches),['HTTPS://FUHRF.CC']);
  assert.equal(append_match(restored_matches,first_match)[0].is_active,false);
  restored_matches[0].is_active=true;
  assert.equal(validate_matches(restored_matches)[0].is_active,true);
  assert.throws(()=>validate_matches([{...first_match,lock_values:[1]}]),/invalid lock grid/);
});
test('next constraint search skips the previous address across every mask',async()=>{
  const excluded_payloads=new Set(['HTTPS://FUHRF.CC']);
  const lock_values=logo_locks();let next_address=null;
  const found_result=await search_linear({pattern_text:'HTTPS://?????.CC',version_number:1,error_level:'Q',lock_values,alphabet_name:'alphanumeric',protect_structure:false},(payload_text,mask_index)=>{
    if(excluded_payloads.has(payload_text))return false;
    const qr_code=core_tools.encode_text(payload_text,1,'Q',mask_index,true);
    const result_grid=core_tools.apply_locks(qr_code,lock_values);
    if(core_tools.decode_grid(result_grid,21)!==payload_text)return false;
    next_address=payload_text;return true;
  },()=>{},performance.now()+15000);
  assert.equal(found_result,true);assert.notEqual(next_address,'HTTPS://FUHRF.CC');assert.match(next_address,/^HTTPS:\/\/[A-Z0-9]{5}\.CC$/);
  console.log('Next address fixture:',next_address);
});

test('pattern validation identifies exact unsupported characters and positions',async()=>{
 const {invalid_pattern_characters}=await import('../ui/editor-tools.js');
 assert.deepEqual(invalid_pattern_characters('HTTPS://?????.CC'),[]);
 assert.deepEqual(invalid_pattern_characters('WWW.????.CC $%*+-./:'),[]);
 assert.deepEqual(invalid_pattern_characters('HTTP://a_??.CC'),[
  {character_text:'a',string_offset:7,character_number:8},
  {character_text:'_',string_offset:8,character_number:9},
 ]);
 assert.deepEqual(invalid_pattern_characters('A💡é?'),[
  {character_text:'💡',string_offset:1,character_number:2},
  {character_text:'é',string_offset:3,character_number:3},
 ]);
});

test('clockwise rotations preserve artwork, quiet zone, and decoded payload in exported SVG',async()=>{
 const {rotate_grid,rotate_index}=await import('../ui/editor-tools.js');
 assert.deepEqual(rotate_grid([1,2,3,4,5,6,7,8,9],3,1),[7,4,1,8,5,2,9,6,3]);
 const qr_code=core_tools.encode_text('HTTPS://1KIC0.FR',1,'Q',3);
 const result_grid=core_tools.apply_locks(qr_code,logo_locks());
 for(let quarter_turns=0;quarter_turns<4;quarter_turns++){
  const rotated_grid=rotate_grid(result_grid,21,quarter_turns);
  const svg_text=core_tools.svg_grid(rotated_grid,21);
  assert.match(svg_text,/viewBox="0 0 29 29"/);
  const exported_grid=new Array(441).fill(false);
  for(const path_match of svg_text.matchAll(/M(\d+) (\d+)h1v1h-1z/g)){
   const col_pos=Number(path_match[1])-4,row_pos=Number(path_match[2])-4;
   assert.ok(col_pos>=0&&col_pos<21&&row_pos>=0&&row_pos<21);
   exported_grid[row_pos*21+col_pos]=true;
  }
  assert.equal(core_tools.decode_grid(exported_grid,21),'HTTPS://1KIC0.FR');
  for(let cell_index=0;cell_index<441;cell_index++)assert.equal(rotate_index(rotate_index(cell_index,21,quarter_turns),21,-quarter_turns),cell_index);
 }
 assert.deepEqual(rotate_grid(result_grid,21,4),result_grid);
});

test('paint and lock toggles invert each pixel independently and honor protected structure',async()=>{
 const {toggled_lock_value}=await import('../ui/editor-tools.js');
 assert.equal(toggled_lock_value('paint',-1,false),1);
 assert.equal(toggled_lock_value('paint',-1,true),0);
 assert.equal(toggled_lock_value('paint',1,true),0);
 assert.equal(toggled_lock_value('paint',0,false),1);
 assert.equal(toggled_lock_value('lock',-1,true),1);
 assert.equal(toggled_lock_value('lock',-1,false),0);
 assert.equal(toggled_lock_value('lock',1,true),-1);
 assert.equal(toggled_lock_value('lock',0,false),-1);
 assert.equal(toggled_lock_value('paint',-1,false,true),-1);
 assert.equal(toggled_lock_value('lock',-1,true,true),-1);
 assert.equal(toggled_lock_value('lock',0,false,true),-1);
});

test('project and saved-match rotation survives storage and rejects invalid values',async()=>{
 const {validate_matches}=await import('../ui/matches.js');
 const project_data={format:'qr-pixel-studio-v1',payload_text:'HTTPS://1KIC0.FR',version_number:1,error_level:'Q',mask_index:3,lock_values:logo_locks(),quarter_turns:1};
 assert.equal(core_tools.validate_project(JSON.parse(JSON.stringify(project_data))).quarter_turns,1);
 assert.equal(validate_matches([project_data])[0].quarter_turns,1);
 assert.equal(validate_matches([{...project_data,quarter_turns:undefined}])[0].quarter_turns,0);
 assert.throws(()=>core_tools.validate_project({...project_data,quarter_turns:4}),/rotation/);
 assert.throws(()=>validate_matches([{...project_data,quarter_turns:-1}]),/rotation/);
});

test('character cells recover actual encoded groups through every QR version and block layout',async()=>{
 const {character_cells,data_bit_cells}=await import('../ui/character-map.js');
 const alpha_text='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
 for(let version_number=1;version_number<=10;version_number++)for(const error_level of ['L','M','Q','H'])for(const [payload_text,alpha_only] of [['ABCDE',false],['1234567',false],['aé💡',false],['12345',true],...(version_number===10&&error_level==='L'?[['AB'.repeat(100),false]]:[])]){
  const qr_code=core_tools.encode_text(payload_text,version_number,error_level,0,alpha_only);
  const mapped_rows=character_cells(qr_code);
  assert.equal(mapped_rows.length,[...payload_text].length);
  // Independently recover unmasked, interleaved bit values in draw order.
  const bit_values=new Map();let stream_bit=0;
  for(let right_col=qr_code.size-1;right_col>=1;right_col-=2){if(right_col===6)right_col=5;
   for(let vert_pos=0;vert_pos<qr_code.size;vert_pos++)for(let col_offset=0;col_offset<2;col_offset++){
    const col_pos=right_col-col_offset,row_pos=((right_col+1)&2)===0?qr_code.size-1-vert_pos:vert_pos;
    if(qr_code.function_grid[row_pos][col_pos])continue;
    bit_values.set(row_pos*qr_code.size+col_pos,(qr_code.code_bytes[Math.floor(stream_bit/8)]>>(7-stream_bit%8))&1);stream_bit++;
   }
  }
  const source_cells=data_bit_cells(qr_code);
  assert.equal(new Set(source_cells).size,source_cells.length);
  for(const [char_index,char_info] of mapped_rows.entries()){
   assert.ok(char_info.cell_indices.every(cell_index=>Number.isInteger(cell_index)&&!qr_code.function_grid[Math.floor(cell_index/qr_code.size)][cell_index%qr_code.size]));
   const bit_string=char_info.cell_indices.map(cell_index=>bit_values.get(cell_index)).join('');
   const group_text=[...payload_text].slice(char_info.group_start,char_info.group_start+char_info.group_size).join('');
   if(char_info.mode_name==='alphanumeric')assert.equal(parseInt(bit_string,2),group_text.length===2?alpha_text.indexOf(group_text[0])*45+alpha_text.indexOf(group_text[1]):alpha_text.indexOf(group_text));
   else if(char_info.mode_name==='numeric')assert.equal(parseInt(bit_string,2),Number(group_text));
   else assert.equal(bit_string,[...new TextEncoder().encode([...payload_text][char_index])].map(byte_value=>byte_value.toString(2).padStart(8,'0')).join(''));
  }
 }
 // A long text crosses block boundaries; every mapped group must recover its value.
 const payload_text='AB'.repeat(100),qr_code=core_tools.encode_text(payload_text,10,'L',0);
 const mapped_rows=character_cells(qr_code);assert.equal(mapped_rows.length,200);
 const source_cells=data_bit_cells(qr_code);
 assert.deepEqual(mapped_rows.at(-1).cell_indices,source_cells.slice(4+11+99*11,4+11+100*11));
});

test('pattern previews preserve fixed positions and only choose allowed wildcard values',async()=>{
 const {preview_payload,matches_pattern}=await import('../ui/character-map.js');
 assert.equal(preview_payload('AB?D?','ZZ9ZZ','digits'),'AB9D0');
 assert.equal(preview_payload('AB?D?','ZZ9ZZ','letters'),'ABADZ');
 assert.equal(preview_payload('ABC?','OLD','alphanumeric'),'ABCA');
 assert.equal(matches_pattern('AB?D?','AB9D0'),true);
 assert.equal(matches_pattern('AB?D?','AX9D0'),false);
 assert.equal(matches_pattern('AB?D?','AB9D00'),false);
});

test('character damage counts both missing black and extra black without counting intact cells',async()=>{
 const {character_damage}=await import('../ui/editor-tools.js');
 assert.deepEqual(character_damage([0,1,2,3],[true,false,true,false,true],[false,true,true,false,false]),{missing_black:1,extra_black:1,changed_count:2,total_count:4});
});
