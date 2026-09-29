import {TLD_LIST} from './tld-data.js';
const TLD_SET=new Set(TLD_LIST);
// Curated purchase-oriented shortlist, not a popularity ranking. Reviewed 2026-09-28:
// https://www.namecheap.com/domains/full-tld-list/
export const COMMON_TLDS=['COM','NET','ORG','INFO','BIZ','CO','ME','CC'];
export function domain_pool(domain_scope){return domain_scope==='common'?COMMON_TLDS.filter(ending_text=>TLD_SET.has(ending_text)):TLD_LIST;}

export function domain_parts(pattern_text){
 const scheme_match=pattern_text.match(/^HTTPS?:\/\//i);
 const host_start=scheme_match?scheme_match[0].length:0;
 const remaining_text=pattern_text.slice(host_start);
 const host_text=remaining_text.split(/[/#:]/,1)[0];
 if(!scheme_match&&!/^WWW\./i.test(host_text)&&(!host_text.includes('.')||/\s/.test(pattern_text)))return null;
 const dot_index=host_text.lastIndexOf('.');
 if(dot_index<1)return null;
 return {host_text,ending_text:host_text.slice(dot_index+1),ending_start:host_start+dot_index+1,ending_end:host_start+host_text.length};
}
export function has_search_slots(pattern_text){
 return pattern_text.includes('?')||domain_parts(pattern_text)?.ending_text==='*';
}
export function domain_choices(pattern_text,domain_scope='all'){
 const host_info=domain_parts(pattern_text);
 if(!host_info)return null;
 const ending_pattern=host_info.ending_text.toUpperCase();
 const ending_rows=ending_pattern.includes('?')||ending_pattern==='*'?domain_pool(domain_scope):TLD_LIST;
 const matching_tlds=ending_rows.filter(ending_text=>ending_pattern==='*'||ending_text.length===ending_pattern.length&&[...ending_pattern].every((character_text,char_index)=>character_text==='?'||character_text===ending_text[char_index]));
 return {...host_info,matching_tlds,pattern_rows:matching_tlds.map(ending_text=>pattern_text.slice(0,host_info.ending_start)+(ending_pattern==='*'?ending_text:[...host_info.ending_text].map((character_text,char_index)=>character_text==='?'?ending_text[char_index]:character_text).join(''))+pattern_text.slice(host_info.ending_end))};
}
export function valid_domain_candidate(payload_text){
 const host_info=domain_parts(payload_text);
 if(!host_info)return !/^HTTPS?:\/\//i.test(payload_text);
 return TLD_SET.has(host_info.ending_text.toUpperCase())&&host_info.host_text.length<=253&&host_info.host_text.split('.').every(label_text=>/^[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?$/i.test(label_text));
}
export function candidate_patterns(pattern_text,domain_scope='all'){
 const choice_info=domain_choices(pattern_text,domain_scope);
 if(!choice_info){
  if(/^HTTPS?:\/\//i.test(pattern_text))throw new Error('Enter a hostname with a real ending, such as HTTP://?????.COM.');
  return [pattern_text];
 }
 if(!choice_info.matching_tlds.length&&domain_scope==='common')throw new Error(`No common ending matches .${choice_info.ending_text}. Use .??, .???, .????, or .*; select All IANA zones for more endings.`);
 if(!choice_info.matching_tlds.length)throw new Error(`No IANA-listed ending matches .${choice_info.ending_text}. Use .??, .???, .????, or .* for any length.`);
 return choice_info.pattern_rows;
}
