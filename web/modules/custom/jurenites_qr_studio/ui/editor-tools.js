// Keep QR encoding coordinates stable while rotating the complete displayed symbol.
export function rotate_index(cell_index, grid_size, quarter_turns=0) {
  let col_pos=cell_index%grid_size, row_pos=Math.floor(cell_index/grid_size);
  for(let turn_index=0;turn_index<((quarter_turns%4)+4)%4;turn_index++) [col_pos,row_pos]=[grid_size-1-row_pos,col_pos];
  return row_pos*grid_size+col_pos;
}
export function rotate_grid(cell_values, grid_size, quarter_turns=0) {
  const rotated_values=new Array(cell_values.length);
  cell_values.forEach((cell_value,cell_index)=>{rotated_values[rotate_index(cell_index,grid_size,quarter_turns)]=cell_value;});
  return rotated_values;
}
export function invalid_pattern_characters(pattern_text) {
  const invalid_rows=[];
  let string_offset=0, character_number=1;
  for(const character_text of pattern_text) {
    if(!'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:?'.includes(character_text)) invalid_rows.push({character_text,string_offset,character_number});
    string_offset+=character_text.length;character_number++;
  }
  return invalid_rows;
}
export function toggled_lock_value(tool_name,lock_value,pixel_value,is_protected=false) {
  const next_value=tool_name==='paint'?1-Number(pixel_value):lock_value===-1?Number(pixel_value):-1;
  // Unlocking is allowed even when a previously edited structure cell is protected.
  return is_protected&&next_value!==-1?lock_value:next_value;
}

export function character_damage(cell_indices,expected_grid,actual_grid){
 let missing_black=0,extra_black=0;
 for(const cell_index of cell_indices){
  if(expected_grid[cell_index]&&!actual_grid[cell_index])missing_black++;
  if(!expected_grid[cell_index]&&actual_grid[cell_index])extra_black++;
 }
 return {missing_black,extra_black,changed_count:missing_black+extra_black,total_count:cell_indices.length};
}
