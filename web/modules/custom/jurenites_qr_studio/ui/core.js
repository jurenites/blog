import {validate_text_layer} from './pixel-text.js?font=4pixel-5';
const QR_CODE = globalThis.qrcodegen.QrCode;
const QR_SEGMENT = globalThis.qrcodegen.QrSegment;
const ORIGINAL_DRAW = QR_CODE.prototype.drawCodewords;
QR_CODE.prototype.drawCodewords = function(code_bytes) {
  this.function_grid = this.isFunction.map(row_values => [...row_values]);
  this.code_bytes = [...code_bytes];
  ORIGINAL_DRAW.call(this, code_bytes);
};
export const ECC_LEVELS = { L: QR_CODE.Ecc.LOW, M: QR_CODE.Ecc.MEDIUM, Q: QR_CODE.Ecc.QUARTILE, H: QR_CODE.Ecc.HIGH };
export function encode_text(payload_text, version_number=1, error_level='Q', mask_index=-1, alpha_only=false) {
  if (typeof payload_text !== 'string' || !payload_text.length) throw new Error('Enter text or an address first.');
  if (!Number.isInteger(version_number) || version_number < 1 || version_number > 10 || !ECC_LEVELS[error_level]) throw new Error('Choose a supported QR size and correction level.');
  const segment_rows = alpha_only ? [QR_SEGMENT.makeAlphanumeric(payload_text)] : QR_SEGMENT.makeSegments(payload_text);
  let qr_code;
  try { qr_code = QR_CODE.encodeSegments(segment_rows, ECC_LEVELS[error_level], version_number, version_number, mask_index, false); }
  catch (error_info) { throw new Error(`This text does not fit ${17+4*version_number}×${17+4*version_number} at level ${error_level}. Shorten it, lower correction, or choose a larger grid.`); }
  qr_code.text_segment=segment_rows[0];qr_code.encoded_text=payload_text;qr_code.alpha_only=alpha_only;
  return qr_code;
}
export function grid_from_code(qr_code) { return qr_code.modules.flat().map(Boolean); }
export function map_codewords(qr_code) {
  const grid_size = qr_code.size;
  const module_map = new Array(grid_size*grid_size).fill(-1);
  let bit_index = 0;
  for (let right_col=grid_size-1; right_col>=1; right_col-=2) {
    if (right_col===6) right_col=5;
    for (let vert_pos=0; vert_pos<grid_size; vert_pos++) for (let col_offset=0; col_offset<2; col_offset++) {
      const col_pos=right_col-col_offset;
      const row_pos=((right_col+1)&2)===0 ? grid_size-1-vert_pos : vert_pos;
      if (!qr_code.function_grid[row_pos][col_pos]) {
        if (bit_index < qr_code.code_bytes.length*8) module_map[row_pos*grid_size+col_pos]=Math.floor(bit_index/8);
        bit_index++;
      }
    }
  }
  return module_map;
}
export function block_layout(qr_code) {
  const level_index=qr_code.errorCorrectionLevel.ordinal;
  const block_count=QR_CODE.NUM_ERROR_CORRECTION_BLOCKS[level_index][qr_code.version];
  const parity_count=QR_CODE.ECC_CODEWORDS_PER_BLOCK[level_index][qr_code.version];
  const short_count=block_count-qr_code.code_bytes.length%block_count;
  const short_length=Math.floor(qr_code.code_bytes.length/block_count);
  const word_blocks=[];
  for (let byte_index=0;byte_index<short_length+1;byte_index++) for(let block_index=0;block_index<block_count;block_index++) {
    if(byte_index!==short_length-parity_count || block_index>=short_count) word_blocks.push(block_index);
  }
  return {word_blocks,block_count,parity_count,repair_limit:Math.floor(parity_count/2)};
}
export function apply_locks(qr_code, lock_values) {
  const base_grid=grid_from_code(qr_code);
  return base_grid.map((cell_value,cell_index)=>lock_values[cell_index]===0 ? false : lock_values[cell_index]===1 ? true : cell_value);
}
export function audit_grid(qr_code, result_grid) {
  const base_grid=grid_from_code(qr_code);
  const module_map=map_codewords(qr_code);
  const block_info=block_layout(qr_code);
  const damaged_sets=Array.from({length:block_info.block_count},()=>new Set());
  let changed_count=0;
  const structure_cells=[];
  for(let cell_index=0;cell_index<base_grid.length;cell_index++) if(base_grid[cell_index]!==result_grid[cell_index]) {
    changed_count++;
    if(qr_code.function_grid[Math.floor(cell_index/qr_code.size)][cell_index%qr_code.size]) structure_cells.push(cell_index);
    else if(module_map[cell_index]>=0) damaged_sets[block_info.word_blocks[module_map[cell_index]]].add(module_map[cell_index]);
  }
  const damaged_counts=damaged_sets.map(word_set=>word_set.size);
  const overflow_count=damaged_counts.reduce((count_sum,word_count)=>count_sum+Math.max(0,word_count-block_info.repair_limit),0);
  return {changed_count,structure_cells,damaged_counts,repair_limit:block_info.repair_limit,overflow_count,total_damaged:damaged_counts.reduce((count_sum,word_count)=>count_sum+word_count,0),remaining_words:Math.min(...damaged_counts.map(word_count=>block_info.repair_limit-word_count))};
}
export function rank_masks(payload_text,version_number,error_level,lock_values,protect_structure=false,alpha_only=false) {
  let best_result=null;
  for(let mask_index=0;mask_index<8;mask_index++) {
    const qr_code=encode_text(payload_text,version_number,error_level,mask_index,alpha_only);
    const result_grid=apply_locks(qr_code,lock_values);
    const audit_info=audit_grid(qr_code,result_grid);
    if(protect_structure&&audit_info.structure_cells.length)continue;
    const rank_score=audit_info.overflow_count*10000+audit_info.structure_cells.length*200+audit_info.total_damaged*10+audit_info.changed_count/100;
    if(!best_result || rank_score<best_result.rank_score) best_result={qr_code,result_grid,audit_info,rank_score};
  }
  if(!best_result)throw new Error('Existing locks conflict with QR structure. Release those locks or turn structure protection off.');
  return best_result;
}
export function raster_grid(result_grid,grid_size,pixel_scale=8) {
  const full_size=(grid_size+8)*pixel_scale;
  const pixel_data=new Uint8ClampedArray(full_size*full_size*4).fill(255);
  for(let row_pos=0;row_pos<grid_size;row_pos++) for(let col_pos=0;col_pos<grid_size;col_pos++) if(result_grid[row_pos*grid_size+col_pos]) {
    for(let offset_y=0;offset_y<pixel_scale;offset_y++) for(let offset_x=0;offset_x<pixel_scale;offset_x++) {
      const pixel_index=(((row_pos+4)*pixel_scale+offset_y)*full_size+(col_pos+4)*pixel_scale+offset_x)*4;
      pixel_data[pixel_index]=pixel_data[pixel_index+1]=pixel_data[pixel_index+2]=0;
    }
  }
  return {pixel_data,full_size};
}
export function decode_grid(result_grid,grid_size) {
  const {pixel_data,full_size}=raster_grid(result_grid,grid_size);
  return globalThis.jsQR(pixel_data,full_size,full_size,{inversionAttempts:'dontInvert'})?.data ?? null;
}
export function svg_grid(result_grid,grid_size) {
  const full_size=grid_size+8;
  let path_data='';
  for(let cell_index=0;cell_index<result_grid.length;cell_index++) if(result_grid[cell_index]) path_data+=`M${cell_index%grid_size+4} ${Math.floor(cell_index/grid_size)+4}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${full_size} ${full_size}" shape-rendering="crispEdges"><path fill="white" d="M0 0h${full_size}v${full_size}H0z"/><path fill="black" d="${path_data}"/></svg>`;
}
export function validate_project(project_data) {
  if(!project_data || project_data.format!=='qr-pixel-studio-v1' || typeof project_data.payload_text!=='string' || project_data.payload_text.length>4096) throw new Error('This is not a valid QR Pixel Studio project.');
  const grid_size=17+4*project_data.version_number;
  if(!Number.isInteger(project_data.version_number)||project_data.version_number<1||project_data.version_number>10||!ECC_LEVELS[project_data.error_level]) throw new Error('Invalid QR configuration.');
  if(!Array.isArray(project_data.lock_values)||project_data.lock_values.length!==grid_size*grid_size||project_data.lock_values.some(cell_value=>![-1,0,1].includes(cell_value))) throw new Error('Invalid lock grid.');
  if(project_data.quarter_turns!==undefined&&![0,1,2,3].includes(project_data.quarter_turns))throw new Error('Invalid QR rotation.');
  return {...project_data,text_layer:validate_text_layer(project_data.text_layer,grid_size)};
}
