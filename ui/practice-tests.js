(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StudoraTests=api;})(globalThis,()=>{
 'use strict';
 function text(value,label,max=3000){if(typeof value!=='string'||!value.trim()||value.length>max)throw Error('Invalid '+label+'.');return value.trim().replace(/\\n(?![a-zA-Z])/g,'\n').replace(/\\\\(?=[a-zA-Z])/g,'\\')}
 function parseQuestion(raw,type,pages=[]){
  if(typeof raw!=='string'||raw.length>20000)throw Error('The tutor returned an invalid test question.');
  let s=raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');let q;try{q=JSON.parse(s)}catch{throw Error('The tutor did not return a complete test question. Try creating the test again.')}
  const result={type,prompt:text(q.prompt,'question'),answer:text(q.answer,'answer'),explanation:text(q.explanation,'explanation'),options:[]};
  if(type==='choice'){
   if(!Array.isArray(q.options)||q.options.length!==4)throw Error('A multiple-choice question must have four choices.');
   result.options=q.options.map((x,i)=>({id:'ABCD'[i],text:text(x,'choice',700)}));
   if(new Set(result.options.map(x=>x.text.toLowerCase())).size!==4||!['A','B','C','D'].includes(result.answer))throw Error('The choices or answer key are invalid.');
  }
  if(q.sourceId){const p=pages.find(p=>p.sourceId===q.sourceId&&p.page===q.page);if(!p)throw Error('The tutor returned a source reference that was not provided.');result.sourceId=q.sourceId;result.page=q.page}
  return result;
 }
 function normalize(s){if(s.practiceTests===undefined)s.practiceTests=[];if(!Array.isArray(s.practiceTests))throw Error('Invalid saved practice tests.');for(const t of s.practiceTests){if(!t||typeof t.id!=='string'||typeof t.subjectId!=='string'||!Array.isArray(t.questions)||t.questions.length>20)throw Error('Invalid saved practice test.');t.answers||={};t.marks||={};}return s;}
 function score(t){let earned=0,reviewed=0;for(const q of t.questions){if(q.type==='choice'){reviewed++;if(t.answers[q.id]===q.answer)earned++}else if(typeof t.marks[q.id]==='boolean'){reviewed++;if(t.marks[q.id])earned++}}return {earned,reviewed,total:t.questions.length,pending:t.questions.length-reviewed};}
 return {parseQuestion,normalize,score};
});
