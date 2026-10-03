/* Shared lesson structure and labels for the workspace and tutor context. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StudoraLessons=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const presets={
  chapters:{preset:'chapters',grouped:true,numbered:true,groupLabel:'Chapter',numberPrefix:'',examples:true},
  modules:{preset:'modules',grouped:true,numbered:true,groupLabel:'Module',numberPrefix:'Lesson',examples:false},
  named:{preset:'named',grouped:false,numbered:false,groupLabel:'Unit',numberPrefix:'',examples:false}
 };
 function defaultStructure(name){return {...presets[/^(math|mathematics)$/i.test(name||'')?'chapters':/^(physics|biology|chemistry)$/i.test(name||'')?'modules':'named']};}
 function structure(subject){const fallback=defaultStructure(subject?.name),saved=subject?.lessonStructure;if(!saved||typeof saved!=='object')return fallback;const result={...fallback};for(const field of ['grouped','numbered','examples'])if(typeof saved[field]==='boolean')result[field]=saved[field];for(const field of ['groupLabel','numberPrefix'])if(typeof saved[field]==='string')result[field]=saved[field].trim().slice(0,40);result.groupLabel=result.groupLabel||fallback.groupLabel;if(['chapters','modules','named','custom'].includes(saved.preset))result.preset=saved.preset;return result;}
 function number(lesson,subject){const config=structure(subject);return config.numbered&&lesson?.number?[config.numberPrefix,lesson.number].filter(Boolean).join(' '):'';}
 function label(lesson,subject){return [number(lesson,subject),lesson?.title].filter(Boolean).join(' ');}
 function context(lesson,subject){return [structure(subject).grouped?lesson?.chapter:'',label(lesson,subject)].filter(Boolean).join(' / ');}
 function summary(subject){const config=structure(subject);return (config.grouped?config.groupLabel+'s → ':'')+(config.numbered?'Numbered lessons':'Named lessons')+(config.examples?' · Worked examples':'');}
 return {presets,defaultStructure,structure,number,label,context,summary};
});
