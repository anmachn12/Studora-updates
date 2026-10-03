(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StudoraSources=api;})(globalThis,()=>{
 'use strict';
 function normalize(s){
  if(s.sourceFolders===undefined)s.sourceFolders=[];
  if(!Array.isArray(s.sourceFolders))throw Error('Invalid source folders.');
  const seen=new Set();
  for(const f of s.sourceFolders){
   if(!f||typeof f.id!=='string'||seen.has(f.id)||!s.subjects.some(x=>x.id===f.subjectId)||typeof f.name!=='string'||!f.name.trim()||f.name.length>120)throw Error('Invalid source folder.');
   seen.add(f.id);if(f.lessonId&&!s.lessons.some(l=>l.id===f.lessonId&&l.subjectId===f.subjectId))f.lessonId=null;
  }
  for(const src of s.sources)if(src.folderId&&!s.sourceFolders.some(f=>f.id===src.folderId&&f.subjectId===src.subjectId))src.folderId=null;
  return s;
 }
 function assign(s,src,folderId){
  const f=folderId?s.sourceFolders.find(f=>f.id===folderId&&f.subjectId===src.subjectId):null;
  if(folderId&&!f)throw Error('Choose a folder in this subject.');
  src.folderId=f?.id||null;
 }
 function lessonSources(s,l){
  if(!l)return [];
  const folders=s.sourceFolders.filter(f=>f.subjectId===l.subjectId&&f.lessonId===l.id).map(f=>f.id);
  return [...new Set([...(l.sourceIds||[]),...s.sources.filter(src=>src.subjectId===l.subjectId&&folders.includes(src.folderId)).map(src=>src.id)])].filter(id=>s.sources.some(src=>src.id===id&&src.subjectId===l.subjectId&&!src.retired));
 }
 function remove(s,id){s.sourceFolders=s.sourceFolders.filter(f=>f.id!==id);for(const src of s.sources)if(src.folderId===id)src.folderId=null;}
 return {normalize,assign,lessonSources,remove};
});
