const {test}=require('node:test'),assert=require('node:assert/strict');
const {selectTools}=require('../local-tutor.cjs');
const tools=['calculate','show_geometry','show_concept_steps','provide_practice'].map(name=>({name}));
test('local subject tools preserve interaction without unrelated calculator or geometry calls',()=>{
 for(const subject of ['Arabic','English','Biology','Islamic Studies','KSA Studies'])assert.deepEqual(selectTools(tools,subject,'Explain this lesson').map(t=>t.name),['show_concept_steps']);
 for(const subject of ['Physics','Chemistry'])assert.deepEqual(selectTools(tools,subject,'Solve this').map(t=>t.name),['calculate','show_concept_steps']);
 assert.deepEqual(selectTools(tools,'Math','Solve this diagram').map(t=>t.name),['calculate','show_geometry','show_concept_steps']);
 assert.deepEqual(selectTools(tools,'Arabic','اختبرني في الدرس').map(t=>t.name),['show_concept_steps','provide_practice']);
 for(const subject of ['Biology','KSA Studies','Arabic'])assert.ok(selectTools(tools,subject,'احسب النسبة من ٤٠٠').some(t=>t.name==='calculate'));
 const sourced=selectTools(tools,'KSA Studies','Explain the timeline','Practice: 1902 and 1932').map(t=>t.name);assert.ok(sourced.includes('calculate'));assert.ok(!sourced.includes('provide_practice'));
});
