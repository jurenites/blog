import {apply_locks} from './core.js';
import {rotate_index} from './editor-tools.js';
export function sanitize_svg(svg_text){
  if(/<!DOCTYPE|<!ENTITY/i.test(svg_text))throw new Error('SVG document declarations are not supported.');
  const svg_document=new DOMParser().parseFromString(svg_text,'image/svg+xml');
  if(svg_document.querySelector('parsererror')||svg_document.documentElement.localName!=='svg')throw new Error('The SVG could not be read.');
  const allowed_names=new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon','defs','clipPath','use','title','desc']);
  for(const svg_element of svg_document.querySelectorAll('*')){
    if(!allowed_names.has(svg_element.localName))throw new Error(`SVG element ${svg_element.localName} is not supported. Export a plain vector SVG or PNG.`);
    for(const attribute_info of [...svg_element.attributes]){
      if(/^on/i.test(attribute_info.name)||/javascript:|@import|expression\(/i.test(attribute_info.value))throw new Error('Active SVG content is not supported.');
      if(attribute_info.localName==='href'&&!attribute_info.value.startsWith('#'))throw new Error('SVG links must stay inside the file.');
      for(const url_match of attribute_info.value.matchAll(/url\(\s*['"]?([^)'"\s]+)/gi))if(!url_match[1].startsWith('#'))throw new Error('External SVG resources are not supported.');
    }
  }
  return svg_document;
}
async function load_image_file(file_item,decode_mode=false){
  if(file_item.size>8*1024*1024)throw new Error('Choose an image smaller than 8 MB.');
  let image_blob=file_item;
  let logical_width,logical_height;
  if(file_item.type==='image/svg+xml'||file_item.name.toLowerCase().endsWith('.svg')){
    const svg_document=sanitize_svg(await file_item.text());
    const svg_root=svg_document.documentElement;
    const viewbox_parts=(svg_root.getAttribute('viewBox')??'').trim().split(/[\s,]+/).map(Number);
    logical_width=viewbox_parts.length===4?viewbox_parts[2]:Number.parseFloat(svg_root.getAttribute('width'));
    logical_height=viewbox_parts.length===4?viewbox_parts[3]:Number.parseFloat(svg_root.getAttribute('height'));
    if(!Number.isFinite(logical_width)||!Number.isFinite(logical_height)||logical_width<=0||logical_height<=0||logical_width>4096||logical_height>4096)throw new Error('The SVG needs a finite viewBox, no larger than 4096 × 4096.');
    const render_scale=decode_mode?Math.min(24,1024/Math.max(logical_width,logical_height)):1;
    svg_root.setAttribute('width',String(Math.ceil(logical_width*render_scale)));svg_root.setAttribute('height',String(Math.ceil(logical_height*render_scale)));
    image_blob=new Blob([new XMLSerializer().serializeToString(svg_document)],{type:'image/svg+xml'});
  }
  const image_url=URL.createObjectURL(image_blob);
  try{
    const image_element=new Image();image_element.src=image_url;await image_element.decode();
    if(image_element.naturalWidth>8192||image_element.naturalHeight>8192)throw new Error('That image is too large. Use an image no larger than 8192 pixels per side.');
    const max_size=decode_mode?1200:512;
    if(!decode_mode&&(image_element.naturalWidth>512||image_element.naturalHeight>512))throw new Error('Use a pixel-art stencil up to 512 × 512 pixels. For a QR screenshot, use Decode image.');
    const render_scale=Math.min(1,max_size/Math.max(image_element.naturalWidth,image_element.naturalHeight));
    const image_canvas=document.createElement('canvas');image_canvas.width=Math.max(1,Math.round(image_element.naturalWidth*render_scale));image_canvas.height=Math.max(1,Math.round(image_element.naturalHeight*render_scale));
    const image_context=image_canvas.getContext('2d',{willReadFrequently:true});image_context.fillStyle='white';image_context.fillRect(0,0,image_canvas.width,image_canvas.height);image_context.drawImage(image_element,0,0,image_canvas.width,image_canvas.height);
    return {pixel_data:image_context.getImageData(0,0,image_canvas.width,image_canvas.height),image_canvas};
  }finally{URL.revokeObjectURL(image_url);}
}
export function connect_imports({APP_STATE,element_by_id,show_toast,push_history,cancel_search,refresh_workspace}){
  element_by_id('import-stencil').addEventListener('click',()=>element_by_id('stencil-file').click());
  element_by_id('decode-image').addEventListener('click',()=>element_by_id('decode-file').click());
  element_by_id('stencil-file').addEventListener('change',async file_event=>{
    try{
      const file_item=file_event.target.files[0];if(!file_item)return;
      const {pixel_data}=await load_image_file(file_item);
      let min_col=pixel_data.width,min_row=pixel_data.height,max_col=-1,max_row=-1;
      const dark_cells=[];
      for(let row_pos=0;row_pos<pixel_data.height;row_pos++)for(let col_pos=0;col_pos<pixel_data.width;col_pos++){
        const pixel_index=(row_pos*pixel_data.width+col_pos)*4;
        const is_dark=(pixel_data.data[pixel_index]+pixel_data.data[pixel_index+1]+pixel_data.data[pixel_index+2])/3<128;
        dark_cells.push(is_dark?1:0);if(is_dark){min_col=Math.min(min_col,col_pos);max_col=Math.max(max_col,col_pos);min_row=Math.min(min_row,row_pos);max_row=Math.max(max_row,row_pos);}
      }
      if(max_col<0)throw new Error('The stencil has no dark pixels.');
      const stencil_width=max_col-min_col+1,stencil_height=max_row-min_row+1;
      const stencil_cells=[];for(let row_pos=min_row;row_pos<=max_row;row_pos++)for(let col_pos=min_col;col_pos<=max_col;col_pos++)stencil_cells.push(dark_cells[row_pos*pixel_data.width+col_pos]);
      APP_STATE.stencil_data={stencil_width,stencil_height,stencil_cells};
      element_by_id('stencil-size').textContent=`Artwork: ${stencil_width} × ${stencil_height} pixels, after trimming the outer white margin. One artwork pixel equals one QR module.`;
      element_by_id('stencil-x').value=String(Math.max(0,Math.floor((APP_STATE.qr_code.size-stencil_width)/2)));
      element_by_id('stencil-y').value=String(Math.max(0,Math.floor((APP_STATE.qr_code.size-stencil_height)/2)));
      element_by_id('stencil-crop').checked=false;element_by_id('stencil-message').textContent='';element_by_id('stencil-dialog').showModal();
    }catch(error_info){show_toast(error_info.message);}finally{file_event.target.value='';}
  });
  element_by_id('place-stencil').addEventListener('click',()=>{
    try{
      if(!APP_STATE.stencil_data)return;
      const {stencil_width,stencil_height,stencil_cells}=APP_STATE.stencil_data;
      const origin_col=Number(element_by_id('stencil-x').value),origin_row=Number(element_by_id('stencil-y').value),grid_size=APP_STATE.qr_code.size;
      if(!Number.isInteger(origin_col)||!Number.isInteger(origin_row)||origin_col<0||origin_row<0||origin_col>=grid_size||origin_row>=grid_size)throw new Error('Choose whole-pixel coordinates inside the grid.');
      if((origin_col+stencil_width>grid_size||origin_row+stencil_height>grid_size)&&!element_by_id('stencil-crop').checked)throw new Error('The artwork extends beyond the grid. Choose a larger QR or explicitly allow cropping.');
      const lock_whites=element_by_id('stencil-white').checked;
      const next_locks=[...APP_STATE.lock_values];let skipped_count=0,placed_count=0;
      for(let row_pos=0;row_pos<stencil_height;row_pos++)for(let col_pos=0;col_pos<stencil_width;col_pos++){
        const target_col=origin_col+col_pos,target_row=origin_row+row_pos;
        if(target_col>=grid_size||target_row>=grid_size)continue;
        const cell_value=stencil_cells[row_pos*stencil_width+col_pos];if(!cell_value&&!lock_whites)continue;
        const target_index=rotate_index(target_row*grid_size+target_col,grid_size,-APP_STATE.quarter_turns);
        if(element_by_id('protect-structure').checked&&APP_STATE.qr_code.function_grid[Math.floor(target_index/grid_size)][target_index%grid_size]){skipped_count++;continue;}
        next_locks[target_index]=cell_value;placed_count++;
      }
      if(!placed_count)throw new Error('No cells could be placed. Move the stencil away from protected QR structure.');
      cancel_search();push_history();APP_STATE.lock_values=next_locks;APP_STATE.result_grid=apply_locks(APP_STATE.qr_code,next_locks);refresh_workspace();element_by_id('stencil-dialog').close();show_toast(`Placed ${placed_count} locked cells.${skipped_count?` Skipped ${skipped_count} protected structure cells.`:''}`);
    }catch(error_info){element_by_id('stencil-message').textContent=error_info.message;}
  });
  element_by_id('decode-file').addEventListener('change',async file_event=>{
    try{
      const file_item=file_event.target.files[0];if(!file_item)return;const {pixel_data}=await load_image_file(file_item,true);
      const decoded_result=globalThis.jsQR(pixel_data.data,pixel_data.width,pixel_data.height,{inversionAttempts:'attemptBoth'});
      if(!decoded_result)throw new Error('No QR could be decoded from this image. Try a sharp, straight-on image with its white border.');
      const result_dialog=document.createElement('dialog');const heading_element=document.createElement('h2');heading_element.textContent='Decoded image';const text_element=document.createElement('textarea');text_element.value=decoded_result.data;text_element.readOnly=true;text_element.rows=4;text_element.setAttribute('aria-label','Decoded image text');text_element.className='decoded-image-text';const note_element=document.createElement('p');note_element.className='field-help';note_element.textContent='This is the text recovered from the image. Your current drawing is unchanged.';const use_button=document.createElement('button');use_button.className='primary-button wide-button';use_button.textContent='Use this text';use_button.onclick=()=>{cancel_search();element_by_id('address-pattern').value=decoded_result.data;element_by_id('address-pattern').dispatchEvent(new Event('input',{bubbles:true}));result_dialog.close();show_toast('Text loaded. Generate to apply it to your drawing.');};const close_button=document.createElement('button');close_button.className='quiet-button wide-button';close_button.textContent='Close';close_button.onclick=()=>result_dialog.close();result_dialog.append(heading_element,text_element,note_element,use_button,close_button);document.body.append(result_dialog);result_dialog.addEventListener('close',()=>result_dialog.remove());result_dialog.showModal();
    }catch(error_info){show_toast(error_info.message);}finally{file_event.target.value='';}
  });
}
