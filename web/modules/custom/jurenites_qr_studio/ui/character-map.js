import {block_layout} from './core.js';

// Map original data-stream bits through RS block interleaving and the QR zigzag.
export function data_bit_cells(qr_code){
 const {block_count,parity_count}=block_layout(qr_code);
 const short_length=Math.floor(qr_code.code_bytes.length/block_count);
 const short_count=block_count-qr_code.code_bytes.length%block_count;
 const block_lengths=Array.from({length:block_count},(_,block_index)=>short_length-parity_count+(block_index<short_count?0:1));
 let source_offset=0;
 const block_starts=block_lengths.map(data_length=>{const block_start=source_offset;source_offset+=data_length;return block_start;});
 const word_sources=[];
 for(let byte_index=0;byte_index<Math.max(...block_lengths);byte_index++)for(let block_index=0;block_index<block_count;block_index++)if(byte_index<block_lengths[block_index])word_sources.push(block_starts[block_index]+byte_index);
 const source_cells=new Array(source_offset*8);
 const grid_size=qr_code.size;let stream_bit=0;
 for(let right_col=grid_size-1;right_col>=1;right_col-=2){
  if(right_col===6)right_col=5;
  for(let vert_pos=0;vert_pos<grid_size;vert_pos++)for(let col_offset=0;col_offset<2;col_offset++){
   const col_pos=right_col-col_offset,row_pos=((right_col+1)&2)===0?grid_size-1-vert_pos:vert_pos;
   if(qr_code.function_grid[row_pos][col_pos])continue;
   const source_byte=word_sources[Math.floor(stream_bit/8)];
   if(source_byte!==undefined)source_cells[source_byte*8+stream_bit%8]=row_pos*grid_size+col_pos;
   stream_bit++;
  }
 }
 return source_cells;
}
export function character_cells(qr_code){
 const segment_info=qr_code.text_segment;
 if(!segment_info)return [];
 const source_cells=data_bit_cells(qr_code);
 const text_chars=[...qr_code.encoded_text];
 const mode_bits=segment_info.mode.modeBits;
 let bit_start=4+segment_info.mode.numCharCountBits(qr_code.version);
 const character_rows=[];
 for(let char_index=0;char_index<text_chars.length;){
  const group_size=mode_bits===2?Math.min(2,text_chars.length-char_index):mode_bits===1?Math.min(3,text_chars.length-char_index):1;
  const bit_count=mode_bits===2?(group_size===2?11:6):mode_bits===1?group_size*3+1:new TextEncoder().encode(text_chars[char_index]).length*8;
  const cell_indices=source_cells.slice(bit_start,bit_start+bit_count);
  for(let group_offset=0;group_offset<group_size;group_offset++)character_rows.push({cell_indices,group_start:char_index,group_size,bit_count,mode_name:mode_bits===2?'alphanumeric':mode_bits===1?'numeric':'UTF-8'});
  bit_start+=bit_count;char_index+=group_size;
 }
 return character_rows;
}
export function matches_pattern(pattern_text,payload_text){
 const pattern_chars=[...pattern_text],payload_chars=[...payload_text];
 return pattern_chars.length===payload_chars.length&&pattern_chars.every((character_text,char_index)=>character_text==='?'||character_text===payload_chars[char_index]);
}
export function preview_payload(pattern_text,current_text,alphabet_name){
 const allowed_text=alphabet_name==='digits'?'0123456789':alphabet_name==='letters'?'ABCDEFGHIJKLMNOPQRSTUVWXYZ':'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
 const current_chars=[...current_text],pattern_chars=[...pattern_text];
 return pattern_chars.map((character_text,char_index)=>character_text!=='?'?character_text:current_chars.length===pattern_chars.length&&allowed_text.includes(current_chars[char_index])?current_chars[char_index]:allowed_text[0]).join('');
}
