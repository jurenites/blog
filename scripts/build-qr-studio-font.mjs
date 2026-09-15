import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import font_tools from 'opentype.js';

const FONT_SOURCE=new URL('../src/public/assets/fonts/4pixel.ttf',import.meta.url);
const OUTPUT_PATH=new URL('../web/modules/custom/jurenites_qr_studio/ui/4pixel-data.js',import.meta.url);
const font_bytes=await readFile(FONT_SOURCE);
const font_data=font_tools.parse(font_bytes.buffer.slice(font_bytes.byteOffset,font_bytes.byteOffset+font_bytes.byteLength));
// This font's native pixels are one fifth of its em, with a four-pixel cap height.
const pixel_units=font_data.unitsPerEm/5;
function pixel_coordinate(font_value){
 const pixel_value=Math.round(font_value/pixel_units);
 if(Math.abs(font_value/pixel_units-pixel_value)>.01)throw new Error('Font outlines no longer align to the 4Pixel grid.');
 return pixel_value;
}
function winding_at(contour_rows,sample_x,sample_y){
 let winding_count=0;
 for(const point_rows of contour_rows)for(let point_index=0;point_index<point_rows.length;point_index++){
  const first_point=point_rows[point_index];const next_point=point_rows[(point_index+1)%point_rows.length];
  const cross_value=(next_point[0]-first_point[0])*(sample_y-first_point[1])-(sample_x-first_point[0])*(next_point[1]-first_point[1]);
  if(first_point[1]<=sample_y&&next_point[1]>sample_y&&cross_value>0)winding_count++;
  if(first_point[1]>sample_y&&next_point[1]<=sample_y&&cross_value<0)winding_count--;
 }
 return winding_count!==0;
}
const glyph_map={};
for(let glyph_index=1;glyph_index<font_data.glyphs.length;glyph_index++){
 const glyph_info=font_data.glyphs.get(glyph_index);if(!glyph_info.unicodes.length)continue;
 const contour_rows=[];let current_contour=[];
 for(const command_info of glyph_info.path.commands){
  if(command_info.type==='M'){current_contour=[];contour_rows.push(current_contour);}
  if(command_info.type==='M'||command_info.type==='L')current_contour.push([pixel_coordinate(command_info.x),pixel_coordinate(command_info.y)]);
  else if(command_info.type!=='Z')throw new Error('Expected straight pixel contours in 4Pixel.');
 }
 const point_rows=contour_rows.flat();const left_cell=Math.min(0,...point_rows.map(point_info=>point_info[0]));
 const right_cell=Math.max(0,...point_rows.map(point_info=>point_info[0]));
 const top_cell=Math.max(0,...point_rows.map(point_info=>point_info[1]));const bottom_cell=Math.min(0,...point_rows.map(point_info=>point_info[1]));
 const filled_cells=[];
 for(let row_pos=bottom_cell;row_pos<top_cell;row_pos++)for(let col_pos=left_cell;col_pos<right_cell;col_pos++)if(winding_at(contour_rows,col_pos+.5,row_pos+.5))filled_cells.push([col_pos,row_pos]);
 const glyph_record={advance_cells:pixel_coordinate(glyph_info.advanceWidth),left_cell,right_cell,top_cell,bottom_cell,filled_cells};
 for(const char_code of glyph_info.unicodes)glyph_map[String.fromCodePoint(char_code)]=glyph_record;
}
const metadata_info={font_name:'4Pixel',source_file:'src/public/assets/fonts/4pixel.ttf',sha256:createHash('sha256').update(font_bytes).digest('hex'),pixel_units,cap_height:4};
await writeFile(OUTPUT_PATH,`// Generated from the user's 4pixel.ttf by scripts/build-qr-studio-font.mjs. Do not draw replacement glyphs here.\nexport const FONT_METADATA=${JSON.stringify(metadata_info)};\nexport const FONT_GLYPHS=${JSON.stringify(glyph_map)};\n`);
console.log(`Extracted ${Object.keys(glyph_map).length} glyphs from ${metadata_info.source_file}.`);
