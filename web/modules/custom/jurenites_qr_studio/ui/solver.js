import {encode_text,ECC_LEVELS} from './core.js';
const ALPHA_TEXT='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
const QR_CODE=globalThis.qrcodegen.QrCode;
function parity_bit(bit_value){let parity_value=0;while(bit_value){bit_value&=bit_value-1n;parity_value^=1;}return parity_value;}
export function solve_equations(equation_rows,variable_count){
  const pivot_rows=new Map();
  for(const equation_row of equation_rows){let [coeff_bits,rhs_value]=equation_row;while(coeff_bits){const pivot_index=coeff_bits.toString(2).length-1;if(pivot_rows.has(pivot_index)){const existing_row=pivot_rows.get(pivot_index);coeff_bits^=existing_row[0];rhs_value^=existing_row[1];}else{pivot_rows.set(pivot_index,[coeff_bits,rhs_value]);break;}}if(!coeff_bits&&rhs_value)return null;}
  const sorted_rows=[...pivot_rows].sort((left_row,right_row)=>left_row[0]-right_row[0]);
  const substitute_bits=(assigned_bits,use_rhs)=>{for(const [pivot_index,[coeff_bits,rhs_value]] of sorted_rows)if(parity_bit(coeff_bits&assigned_bits)^(use_rhs?rhs_value:0))assigned_bits|=1n<<BigInt(pivot_index);return assigned_bits;};
  const free_basis=[];for(let bit_index=0;bit_index<variable_count;bit_index++)if(!pivot_rows.has(bit_index))free_basis.push(substitute_bits(1n<<BigInt(bit_index),false));
  return {assigned_bits:substitute_bits(0n,true),free_basis};
}
function* choose_groups(source_rows,choose_count,start_index=0,selected_rows=[]){if(choose_count===0){yield selected_rows;return;}for(let row_index=start_index;row_index<=source_rows.length-choose_count;row_index++)yield* choose_groups(source_rows,choose_count-1,row_index+1,[...selected_rows,source_rows[row_index]]);}
function yield_task(){return new Promise(resolve_task=>{setTimeout(resolve_task,0);});}
export async function search_linear(search_options,on_candidate,on_progress,stop_time){
  if(search_options.version_number!==1)return false;
  const {pattern_text,error_level,lock_values,alphabet_name,protect_structure}=search_options;
  const allowed_text=alphabet_name==='letters'?'ABCDEFGHIJKLMNOPQRSTUVWXYZ':alphabet_name==='digits'?'0123456789':'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const variable_groups=[];const source_indices=[];
  for(let char_start=0;char_start<pattern_text.length;char_start+=2){const group_text=pattern_text.slice(char_start,char_start+2);if(!group_text.includes('?'))continue;const bit_length=group_text.length===2?11:6;const bit_start=13+Math.floor(char_start/2)*11;variable_groups.push({char_start,bit_length,variable_start:source_indices.length,group_text});for(let bit_index=0;bit_index<bit_length;bit_index++)source_indices.push(bit_start+bit_index);}
  if(!source_indices.length||source_indices.length>128)return false;
  const initial_code=encode_text(pattern_text.replaceAll('?','0'),1,error_level,0,true);
  const data_count=QR_CODE.getNumDataCodewords(1,ECC_LEVELS[error_level]);
  const base_data=initial_code.code_bytes.slice(0,data_count);
  for(const bit_index of source_indices)base_data[Math.floor(bit_index/8)]&=~(1<<(7-bit_index%8));
  const base_code=new QR_CODE(1,ECC_LEVELS[error_level],base_data,0);
  const base_bytes=base_code.code_bytes;
  const basis_rows=source_indices.map(bit_index=>{const next_data=[...base_data];next_data[Math.floor(bit_index/8)]^=1<<(7-bit_index%8);const next_code=new QR_CODE(1,ECC_LEVELS[error_level],next_data,0);return next_code.code_bytes.map((byte_value,byte_index)=>byte_value^base_bytes[byte_index]);});
  const bit_positions=[];
  for(let right_col=20;right_col>=1;right_col-=2){if(right_col===6)right_col=5;for(let vert_pos=0;vert_pos<21;vert_pos++)for(let col_offset=0;col_offset<2;col_offset++){const col_pos=right_col-col_offset;const row_pos=((right_col+1)&2)===0?20-vert_pos:vert_pos;if(!base_code.function_grid[row_pos][col_pos])bit_positions.push(row_pos*21+col_pos);}}
  const repair_limit=Math.floor(QR_CODE.ECC_CODEWORDS_PER_BLOCK[ECC_LEVELS[error_level].ordinal][1]/2);
  const decode_assignment=assigned_bits=>{const text_chars=[...pattern_text];for(const group_info of variable_groups){let pair_value=0;for(let bit_index=0;bit_index<group_info.bit_length;bit_index++)pair_value=pair_value*2+Number((assigned_bits>>BigInt(group_info.variable_start+bit_index))&1n);const decoded_chars=group_info.bit_length===11?[ALPHA_TEXT[Math.floor(pair_value/45)],ALPHA_TEXT[pair_value%45]]:[ALPHA_TEXT[pair_value]];for(let char_offset=0;char_offset<decoded_chars.length;char_offset++){const actual_char=decoded_chars[char_offset],expected_char=group_info.group_text[char_offset];if(!actual_char||(expected_char==='?'?!allowed_text.includes(actual_char):actual_char!==expected_char))return null;text_chars[group_info.char_start+char_offset]=actual_char;}}return text_chars.join('');};
  let checked_count=0,group_count=0;
  for(const error_limit of [...new Set([0,Math.max(0,repair_limit-1),repair_limit])])for(const mask_index of [3,0,1,2,4,5,6,7]){
    if(performance.now()>stop_time)return false;
    const mask_code=new QR_CODE(1,ECC_LEVELS[error_level],new Array(data_count).fill(0),mask_index);
    if(protect_structure&&lock_values.some((cell_value,cell_index)=>cell_value!==-1&&mask_code.function_grid[Math.floor(cell_index/21)][cell_index%21]&&Number(mask_code.modules[Math.floor(cell_index/21)][cell_index%21])!==cell_value))continue;
    const equation_map=new Map(),forced_words=new Set();
    for(let bit_index=0;bit_index<bit_positions.length;bit_index++){
      const cell_index=bit_positions[bit_index];if(lock_values[cell_index]!==0&&lock_values[cell_index]!==1)continue;
      const byte_index=Math.floor(bit_index/8),byte_mask=1<<(7-bit_index%8);
      let coeff_bits=0n;for(let basis_index=0;basis_index<basis_rows.length;basis_index++)if(basis_rows[basis_index][byte_index]&byte_mask)coeff_bits|=1n<<BigInt(basis_index);
      const expected_bit=lock_values[cell_index]^Number(mask_code.modules[Math.floor(cell_index/21)][cell_index%21]);
      const rhs_value=Number(Boolean(base_bytes[byte_index]&byte_mask))^expected_bit;
      if(!coeff_bits&&rhs_value)forced_words.add(byte_index);
      if(coeff_bits){if(!equation_map.has(byte_index))equation_map.set(byte_index,[]);equation_map.get(byte_index).push([coeff_bits,rhs_value]);}
    }
    if(forced_words.size>error_limit)continue;
    const variable_words=[...equation_map.keys()].filter(byte_index=>!forced_words.has(byte_index));
    const match_count=Math.max(0,variable_words.length-(error_limit-forced_words.size));
    for(const matched_words of choose_groups(variable_words,match_count)){
      if(performance.now()>stop_time||group_count++>10000)return false;
      const solved_rows=solve_equations(matched_words.flatMap(byte_index=>equation_map.get(byte_index)),source_indices.length);if(!solved_rows)continue;
      const free_count=solved_rows.free_basis.length;
      const sample_limit=free_count<=16?2**free_count:2048;
      let assigned_bits=solved_rows.assigned_bits;
      for(let sample_index=0;sample_index<sample_limit;sample_index++){
        if(free_count<=16){if(sample_index){const trailing_index=31-Math.clz32(sample_index&-sample_index);assigned_bits^=solved_rows.free_basis[trailing_index];}}
        else{assigned_bits=solved_rows.assigned_bits;for(const basis_bits of solved_rows.free_basis)if(Math.random()<.5)assigned_bits^=basis_bits;}
        const payload_text=decode_assignment(assigned_bits);checked_count++;
        if(payload_text&&await on_candidate(payload_text,mask_index))return true;
        if(checked_count%2048===0){on_progress(checked_count,'solving locked pixel constraints');await yield_task();if(performance.now()>stop_time)return false;}
      }
      if(group_count%80===0){on_progress(checked_count,'solving locked pixel constraints');await yield_task();}
    }
  }
  return false;
}
