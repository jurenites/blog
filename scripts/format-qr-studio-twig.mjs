import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const TEMPLATE_PATH=new URL('../web/modules/custom/jurenites_qr_studio/templates/qr-studio-document.html.twig',import.meta.url);
const VOID_TAGS=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr','css-placeholder','js-placeholder','js-bottom-placeholder']);

// Scoped to the QR Studio document: preserve attributes, Twig expressions and raw bodies.
export function template_tokens(source_text){
 const token_rows=[];let source_index=0;
 while(source_index<source_text.length){
  const start_index=source_index;
  const raw_match=source_text.slice(source_index).match(/^<(pre|textarea|script|style)\b/i);
  if(raw_match){
   const closing_match=new RegExp(`</${raw_match[1]}\\s*>`,'i').exec(source_text.slice(source_index));
   if(!closing_match)throw new Error('Unclosed raw HTML element.');
   source_index+=closing_match.index+closing_match[0].length;token_rows.push({token_type:'raw',token_text:source_text.slice(start_index,source_index)});continue;
  }
  const comment_end=source_text.startsWith('<!--',source_index)?'-->':source_text.startsWith('{#',source_index)?'#}':null;
  if(comment_end){const end_index=source_text.indexOf(comment_end,source_index+2);if(end_index<0)throw new Error('Unclosed template comment.');source_index=end_index+comment_end.length;token_rows.push({token_type:'raw',token_text:source_text.slice(start_index,source_index)});continue;}
  if(source_text[source_index]==='<'){
   let quote_char=null;source_index++;
   while(source_index<source_text.length){
    if(source_text.startsWith('{{',source_index)||source_text.startsWith('{%',source_index)){
     const end_marker=source_text[source_index+1]==='{'?'}}':'%}';const end_index=source_text.indexOf(end_marker,source_index+2);
     if(end_index<0)throw new Error('Unclosed Twig expression.');source_index=end_index+2;continue;
    }
    const next_char=source_text[source_index++];
    if(quote_char){if(next_char===quote_char)quote_char=null;}
    else if(next_char==='"'||next_char==="'")quote_char=next_char;
    else if(next_char==='>')break;
   }
   if(source_text[source_index-1]!=='>')throw new Error('Unclosed HTML tag.');
   token_rows.push({token_type:'tag',token_text:source_text.slice(start_index,source_index)});continue;
  }
  while(source_index<source_text.length&&source_text[source_index]!=='<'&&!source_text.startsWith('{#',source_index))source_index++;
  token_rows.push({token_type:'text',token_text:source_text.slice(start_index,source_index)});
 }
 return token_rows;
}
export function format_studio_template(source_text,layout_name){
 if(!['expand','compact'].includes(layout_name))throw new Error('Choose expand or compact.');
 // Control-flow formatting belongs to the installed Twig formatter, not this document layout toggle.
 if(source_text.includes('{%'))throw new Error('Use Format Document for Twig control-flow blocks; this layout toggle is scoped to the QR Studio HTML document.');
 const token_rows=template_tokens(source_text);let formatted_text='';let indent_depth=0;
 for(const token_info of token_rows){
  if(token_info.token_type==='text'){
   const text_value=token_info.token_text;
   formatted_text+=text_value.includes('\n')?text_value.replace(/\r?\n[ \t]*/g,''):text_value;
   continue;
  }
  const close_match=token_info.token_type==='tag'&&token_info.token_text.match(/^<\/([\w-]+)/);
  if(close_match)indent_depth=Math.max(0,indent_depth-1);
  if(layout_name==='expand')formatted_text+=(formatted_text?'\n':'')+'  '.repeat(indent_depth);
  formatted_text+=token_info.token_text;
  const open_match=token_info.token_type==='tag'&&token_info.token_text.match(/^<([\w-]+)/);
  if(open_match&&!VOID_TAGS.has(open_match[1].toLowerCase())&&!/\/\s*>$/.test(token_info.token_text))indent_depth++;
 }
 return formatted_text+'\n';
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const layout_name=process.argv[2];const source_text=await readFile(TEMPLATE_PATH,'utf8');
 await writeFile(TEMPLATE_PATH,format_studio_template(source_text,layout_name));
 console.log(`QR Studio Twig: ${layout_name==='expand'?'one tag per line':'compact markup'}.`);
}
