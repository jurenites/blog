import test from 'node:test';
import assert from 'node:assert/strict';
import {text_bitmap,text_locks,validate_text_layer} from '../ui/pixel-text.js';
test('four-pixel glyphs validate bounds and compose transparent or white-backed text without mutating base locks',()=>{
 const bitmap_info=text_bitmap('hi');assert.equal(bitmap_info.text_value,'hi');assert.equal(bitmap_info.height_cells,4);assert.equal(bitmap_info.cell_values.length,bitmap_info.width_cells*4);
 const base_locks=new Array(441).fill(-1);base_locks[0]=0;
 const layer_info={text_value:'H',column_pos:0,row_pos:0,white_background:false};
 const combined_locks=text_locks(base_locks,layer_info,21);
 assert.equal(combined_locks[0],1);assert.equal(combined_locks[1],-1);assert.equal(base_locks[0],0);
 assert.equal(text_locks(base_locks,{...layer_info,white_background:true},21)[1],0);
 assert.deepEqual(text_locks(base_locks,null,21),base_locks);
 assert.equal(validate_text_layer({...layer_info,column_pos:20},21).column_pos,20);
 assert.throws(()=>validate_text_layer({...layer_info,row_pos:-1},21),/Invalid pixel-text position/);
 assert.throws(()=>text_bitmap('☀'),/does not contain/);
 assert.throws(()=>text_bitmap('A'.repeat(33)),/1–32/);
});
test('long lettering wraps inside a small grid and its white perimeter is locked and reversible',()=>{
 const layer_info={text_value:'JURENITES',column_pos:1,row_pos:9,white_background:true,outline_size:1,wrap_text:true};
 const saved_layer=validate_text_layer(layer_info,25);const bitmap_info=text_bitmap('JURENITES',23);
 assert.ok(bitmap_info.width_cells<=23);assert.equal(bitmap_info.height_cells,9);
 const base_locks=new Array(625).fill(-1);base_locks[200]=1;
 const painted_locks=text_locks(base_locks,saved_layer,25);
 for(let col_index=0;col_index<bitmap_info.width_cells+2;col_index++)assert.equal(painted_locks[8*25+col_index],0);
 assert.equal(painted_locks[9*25+2],1);assert.equal(painted_locks[9*25+3],1);
 assert.equal(base_locks[200],1);assert.deepEqual(text_locks(base_locks,null,25),base_locks);
 assert.equal(saved_layer.outline_size,1);assert.equal(saved_layer.wrap_text,true);
});
test('the actual 4Pixel glyph shapes, baseline, descenders and mixed case are preserved',()=>{
 const expected_rows={A:['0111','1001','1111','1001'],a:['0000','1110','1010','1111'],J:['111','010','010','100'],j:['01','00','01','01','10'],u:['000','101','101','011'],t:['100','110','100','011'],e:['000','111','101','111','110'],S:['1111','1000','0001','1111']};
 for(const [character_text,row_strings] of Object.entries(expected_rows)){
  const bitmap_info=text_bitmap(character_text);assert.equal(bitmap_info.text_value,character_text);assert.equal(bitmap_info.height_cells,row_strings.length);assert.equal(bitmap_info.width_cells,row_strings[0].length);assert.deepEqual(bitmap_info.cell_values,row_strings.join('').split('').map(Number));
 }
 const saved_layer=validate_text_layer(JSON.parse(JSON.stringify({text_value:'JuReNiTeS',column_pos:1,row_pos:8,white_background:true,outline_size:1,wrap_text:true})),25);
 assert.equal(saved_layer.text_value,'JuReNiTeS');
});
test('bundled glyph data identifies the actual project font source',async()=>{
 const {FONT_METADATA,FONT_GLYPHS}=await import('../ui/4pixel-data.js');
 const {readFile}=await import('node:fs/promises');const {createHash}=await import('node:crypto');
 const font_bytes=await readFile(new URL('../../../../../src/public/assets/fonts/4pixel.ttf',import.meta.url));
 assert.equal(FONT_METADATA.sha256,createHash('sha256').update(font_bytes).digest('hex'));
 assert.equal(Object.keys(FONT_GLYPHS).length,527);assert.equal(FONT_METADATA.cap_height,4);
});
test('imported text corrections accept only binary pixels and default old layers to enabled',()=>{
 const layer_info={text_value:'H',column_pos:2,row_pos:2,white_background:true,outline_size:1};
 assert.equal(validate_text_layer(layer_info,21).is_enabled,true);
 assert.throws(()=>validate_text_layer({...layer_info,drawn_cells:[[0,0,2]]},21),/Invalid drawn/);
 assert.throws(()=>validate_text_layer({...layer_info,is_enabled:'false'},21),/enabled state/);
 const saved_layer=validate_text_layer({...layer_info,drawn_cells:[[0,0,0],[0,0,1],[50,50,1]]},21);
 assert.deepEqual(saved_layer.drawn_cells,[[0,0,1]]);
 assert.deepEqual(validate_text_layer({...saved_layer,is_enabled:false},21).drawn_cells,[]);
});
