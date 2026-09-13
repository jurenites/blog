importScripts('./vendor/qrcodegen.js','./vendor/jsQR.js');
const core_promise=import('./core.js');
const domain_promise=import('./domain-pattern.js');
const solver_promise=import('./solver.js');
self.onmessage=async({data:search_options})=>{
  const core_tools=await core_promise;
  const {candidate_patterns,valid_domain_candidate}=await domain_promise;
  let search_patterns=[];
  const {pattern_text,version_number,error_level,lock_values,alphabet_name,time_limit,protect_structure}=search_options;
  const alphabet_text=alphabet_name==='letters'?'ABCDEFGHIJKLMNOPQRSTUVWXYZ':alphabet_name==='digits'?'0123456789':'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const excluded_payloads=new Set(search_options.excluded_payloads??[]);
  const checked_candidates=new Set();
  let attempt_count=0;
  const start_time=performance.now(),stop_time=start_time+time_limit*1000;
  const report_progress=(solver_count,phase_name)=>self.postMessage({type:'progress',attempt_count:attempt_count+solver_count,phase_name});
  const check_candidate=(payload_text,mask_index)=>{
    if(excluded_payloads.has(payload_text)||!valid_domain_candidate(payload_text))return false;
    const candidate_key=payload_text+'\u0000'+mask_index;
    if(checked_candidates.has(candidate_key))return false;
    if(checked_candidates.size>100000)checked_candidates.clear();
    checked_candidates.add(candidate_key);
    const qr_code=core_tools.encode_text(payload_text,version_number,error_level,mask_index,true);
    const result_grid=core_tools.apply_locks(qr_code,lock_values);
    const audit_info=core_tools.audit_grid(qr_code,result_grid);attempt_count++;
    if(audit_info.overflow_count||protect_structure&&audit_info.structure_cells.length)return false;
    if(core_tools.decode_grid(result_grid,qr_code.size)!==payload_text)return false;
    self.postMessage({type:'result',payload_text,mask_index,attempt_count});return true;
  };
  try{
    if(!pattern_text.includes('?')&&!pattern_text.includes('*')||!Number.isFinite(time_limit)||time_limit<1||time_limit>180)throw new Error('Invalid search pattern or time limit.');
    search_patterns=candidate_patterns(pattern_text).filter(candidate_pattern=>{try{core_tools.encode_text(candidate_pattern.replaceAll('?','A'),version_number,error_level,0,true);return true;}catch{return false;}});
    if(!search_patterns.length)throw new Error('No matching domain ending fits this QR size and correction level. Shorten the name or choose a larger grid.');
    let pattern_index=Math.floor(Math.random()*search_patterns.length);
    const sample_payload=()=>search_patterns[pattern_index++%search_patterns.length].replaceAll('?',()=>alphabet_text[Math.floor(Math.random()*alphabet_text.length)]);
    // Try a few direct samples first; unconstrained patterns should resolve immediately.
    for(let sample_index=0;sample_index<30;sample_index++){const payload_text=sample_payload();for(let mask_index=0;mask_index<8;mask_index++)if(check_candidate(payload_text,mask_index))return;}
    report_progress(0,'building a constraint model');
    const {search_linear}=await solver_promise;
    const solver_deadline=start_time+time_limit*650;
    for(let search_index=0;search_index<search_patterns.length&&performance.now()<solver_deadline;search_index++){
      const candidate_pattern=search_patterns[(pattern_index+search_index)%search_patterns.length];
      const pattern_deadline=Math.min(solver_deadline,performance.now()+Math.max(30,(solver_deadline-performance.now())/(search_patterns.length-search_index)));
      if(await search_linear({...search_options,pattern_text:candidate_pattern},check_candidate,report_progress,pattern_deadline))return;
    }
    while(performance.now()<stop_time){
      for(let batch_index=0;batch_index<20;batch_index++){
        const payload_text=sample_payload();
        for(let mask_index=0;mask_index<8;mask_index++)if(check_candidate(payload_text,mask_index))return;
        if(performance.now()>=stop_time)break;
      }
      report_progress(0,'trying more addresses and masks');await new Promise(resolve_task=>setTimeout(resolve_task,0));
    }
    self.postMessage({type:'done',message_text:`No new decoded match found in ${time_limit} seconds. ${excluded_payloads.size} saved addresses were excluded. This is a bounded search, not proof of impossibility. Try more free characters, fewer locks, or a larger grid.`});
  }catch(error_info){self.postMessage({type:'error',message_text:error_info.message});}
};
