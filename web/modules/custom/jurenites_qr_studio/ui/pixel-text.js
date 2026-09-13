import {FONT_GLYPHS,FONT_METADATA} from './4pixel-data.js';

export function text_bitmap(text_value,max_width=Infinity){
 const character_rows=[...text_value];
 if(!character_rows.length||character_rows.length>32)throw new Error('Enter 1–32 characters from your 4Pixel font.');
 const glyph_rows=character_rows.map(character_text=>{const glyph_info=FONT_GLYPHS[character_text];if(!glyph_info)throw new Error(`Your 4Pixel font does not contain “${character_text}”.`);return glyph_info;});
 const line_rows=[];let current_line={glyph_rows:[],advance_cells:0,left_cell:0,right_cell:0,top_cell:FONT_METADATA.cap_height,bottom_cell:0};
 function finish_line(){line_rows.push(current_line);current_line={glyph_rows:[],advance_cells:0,left_cell:0,right_cell:0,top_cell:FONT_METADATA.cap_height,bottom_cell:0};}
 for(const glyph_info of glyph_rows){
  const visible_width=glyph_info.filled_cells.length?glyph_info.right_cell:glyph_info.advance_cells;
  if(visible_width-glyph_info.left_cell>max_width)throw new Error('This 4Pixel glyph is too wide for the grid.');
  if(current_line.glyph_rows.length&&Math.max(current_line.right_cell,current_line.advance_cells+visible_width)-Math.min(current_line.left_cell,current_line.advance_cells+glyph_info.left_cell)>max_width)finish_line();
  const glyph_offset=current_line.advance_cells;
  current_line.glyph_rows.push({glyph_info,glyph_offset});current_line.left_cell=Math.min(current_line.left_cell,glyph_offset+glyph_info.left_cell);current_line.right_cell=Math.max(current_line.right_cell,glyph_offset+visible_width);current_line.top_cell=Math.max(current_line.top_cell,glyph_info.top_cell);current_line.bottom_cell=Math.min(current_line.bottom_cell,glyph_info.bottom_cell);current_line.advance_cells+=glyph_info.advance_cells;
 }
 finish_line();
 const width_cells=Math.max(...line_rows.map(line_info=>line_info.right_cell-line_info.left_cell));
 const height_cells=line_rows.reduce((height_sum,line_info)=>height_sum+line_info.top_cell-line_info.bottom_cell+1,-1);
 const cell_values=new Array(width_cells*height_cells).fill(0);let row_offset=0;
 for(const line_info of line_rows){
  for(const {glyph_info,glyph_offset} of line_info.glyph_rows)for(const [col_pos,row_pos] of glyph_info.filled_cells){
   cell_values[(row_offset+line_info.top_cell-row_pos-1)*width_cells+glyph_offset+col_pos-line_info.left_cell]=1;
  }
  row_offset+=line_info.top_cell-line_info.bottom_cell+1;
 }
 return {text_value,width_cells,height_cells,cell_values};
}
export function validate_text_layer(layer_info,grid_size){
 if(layer_info==null)return null;
 if(typeof layer_info.text_value!=='string')throw new Error('Invalid pixel text.');
 if(layer_info.wrap_width!==undefined&&(!Number.isInteger(layer_info.wrap_width)||layer_info.wrap_width<19||layer_info.wrap_width>55))throw new Error('Invalid pixel-text wrap width.');
 const bitmap_info=text_bitmap(layer_info.text_value,layer_info.wrap_text?(layer_info.wrap_width??grid_size-2):Infinity);
 if(!Number.isInteger(layer_info.column_pos)||!Number.isInteger(layer_info.row_pos)||layer_info.column_pos<0||layer_info.row_pos<0||layer_info.column_pos>56||layer_info.row_pos>56)throw new Error('Invalid pixel-text position.');
 const released_rows=layer_info.released_cells??[];
 if(!Array.isArray(released_rows)||released_rows.length>3600||released_rows.some(cell_pair=>!Array.isArray(cell_pair)||cell_pair.length!==2||cell_pair.some(cell_value=>!Number.isInteger(cell_value)||cell_value< -1||cell_value>57)))throw new Error('Invalid released pixel-text cells.');
 const drawn_rows=layer_info.drawn_cells??[];
 if(!Array.isArray(drawn_rows)||drawn_rows.length>3600||drawn_rows.some(cell_entry=>!Array.isArray(cell_entry)||cell_entry.length!==3||cell_entry.slice(0,2).some(cell_value=>!Number.isInteger(cell_value)||cell_value< -1||cell_value>57)||![0,1].includes(cell_entry[2])))throw new Error('Invalid drawn pixel-text cells.');
 if(layer_info.is_enabled!==undefined&&typeof layer_info.is_enabled!=='boolean')throw new Error('Invalid pixel-text enabled state.');
 if(layer_info.is_visible!==undefined&&typeof layer_info.is_visible!=='boolean')throw new Error('Invalid pixel-text visibility.');
 const outline_size=layer_info.outline_size===1?1:0;
 const drawn_cells=[...new Map(drawn_rows.filter(([col_pos,row_pos])=>col_pos>=-outline_size&&row_pos>=-outline_size&&col_pos<bitmap_info.width_cells+outline_size&&row_pos<bitmap_info.height_cells+outline_size).map(cell_entry=>[cell_entry.slice(0,2).join(','),[...cell_entry]])).values()];
 const released_cells=[...new Map(released_rows.filter(([col_pos,row_pos])=>col_pos>=-outline_size&&row_pos>=-outline_size&&col_pos<bitmap_info.width_cells+outline_size&&row_pos<bitmap_info.height_cells+outline_size).map(cell_pair=>[cell_pair.join(','),[...cell_pair]])).values()];
 return {text_value:bitmap_info.text_value,column_pos:layer_info.column_pos,row_pos:layer_info.row_pos,white_background:layer_info.white_background===true,outline_size:layer_info.outline_size===1?1:0,wrap_text:layer_info.wrap_text===true,wrap_width:layer_info.wrap_width??grid_size-2,released_cells,drawn_cells:layer_info.is_enabled===false?[]:drawn_cells,is_enabled:layer_info.is_enabled!==false,is_visible:layer_info.is_visible!==false};
}
export function text_locks(lock_values,layer_info,grid_size,function_grid=null){
 const combined_locks=[...lock_values];
 if(!layer_info||layer_info.is_enabled===false||layer_info.is_visible===false)return combined_locks;
 const bitmap_info=text_bitmap(layer_info.text_value,layer_info.wrap_text?(layer_info.wrap_width??grid_size-2):Infinity);
 const outline_size=layer_info.outline_size===1?1:0;
 const released_cells=new Set((layer_info.released_cells??[]).map(cell_pair=>cell_pair.join(',')));
 const drawn_cells=new Map((layer_info.drawn_cells??[]).map(([col_pos,row_pos,pixel_value])=>[`${col_pos},${row_pos}`,pixel_value]));
 for(let row_index=-outline_size;row_index<bitmap_info.height_cells+outline_size;row_index++)for(let col_index=-outline_size;col_index<bitmap_info.width_cells+outline_size;col_index++){
  const target_row=layer_info.row_pos+row_index;const target_col=layer_info.column_pos+col_index;
  if(target_row<0||target_col<0||target_row>=grid_size||target_col>=grid_size||function_grid?.[target_row]?.[target_col])continue;
  if(released_cells.has(`${col_index},${row_index}`)){combined_locks[target_row*grid_size+target_col]=-1;continue;}
  if(drawn_cells.has(`${col_index},${row_index}`)){combined_locks[target_row*grid_size+target_col]=drawn_cells.get(`${col_index},${row_index}`);continue;}
  const is_outline=row_index<0||col_index<0||row_index>=bitmap_info.height_cells||col_index>=bitmap_info.width_cells;
  const pixel_value=is_outline?0:bitmap_info.cell_values[row_index*bitmap_info.width_cells+col_index];
  if(pixel_value||is_outline||layer_info.white_background)combined_locks[target_row*grid_size+target_col]=pixel_value;
 }
 return combined_locks;
}

export function toggle_text_lock(layer_info,grid_size,cell_index){
 if(!layer_info||layer_info.is_enabled===false||layer_info.is_visible===false)return null;
 const bitmap_info=text_bitmap(layer_info.text_value,layer_info.wrap_text?(layer_info.wrap_width??grid_size-2):Infinity);
 const col_pos=cell_index%grid_size-layer_info.column_pos;const row_pos=Math.floor(cell_index/grid_size)-layer_info.row_pos;const outline_size=layer_info.outline_size??0;
 if(col_pos< -outline_size||row_pos< -outline_size||col_pos>=bitmap_info.width_cells+outline_size||row_pos>=bitmap_info.height_cells+outline_size)return null;
 const is_outline=col_pos<0||row_pos<0||col_pos>=bitmap_info.width_cells||row_pos>=bitmap_info.height_cells;
 if(!is_outline&&!layer_info.white_background&&!bitmap_info.cell_values[row_pos*bitmap_info.width_cells+col_pos]&&!(layer_info.drawn_cells??[]).some(([cell_col,cell_row])=>cell_col===col_pos&&cell_row===row_pos))return null;
 const released_rows=layer_info.released_cells??[];
 const was_released=released_rows.some(([cell_col,cell_row])=>cell_col===col_pos&&cell_row===row_pos);
 return {...layer_info,released_cells:was_released?released_rows.filter(([cell_col,cell_row])=>cell_col!==col_pos||cell_row!==row_pos):[...released_rows,[col_pos,row_pos]]};
}

// Coordinates belong to the text layer, so painted corrections travel with it.
export function draw_text_pixel(layer_info,grid_size,cell_index,displayed_value){
 if(!layer_info||layer_info.is_enabled===false||layer_info.is_visible===false)return null;
 const bitmap_info=text_bitmap(layer_info.text_value,layer_info.wrap_text?(layer_info.wrap_width??grid_size-2):Infinity);
 const col_pos=cell_index%grid_size-layer_info.column_pos;const row_pos=Math.floor(cell_index/grid_size)-layer_info.row_pos;const outline_size=layer_info.outline_size??0;
 if(col_pos< -outline_size||row_pos< -outline_size||col_pos>=bitmap_info.width_cells+outline_size||row_pos>=bitmap_info.height_cells+outline_size)return null;
 const other_cells=cell_entry=>cell_entry[0]!==col_pos||cell_entry[1]!==row_pos;
 return {...layer_info,drawn_cells:[...(layer_info.drawn_cells??[]).filter(other_cells),[col_pos,row_pos,displayed_value?0:1]],released_cells:(layer_info.released_cells??[]).filter(other_cells)};
}
