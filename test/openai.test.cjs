const {test}=require('node:test'),assert=require('node:assert/strict');
const {tutorModels,responseOptions,apiError,assertTutorModel}=require('../openai.cjs');
test('account discovery excludes legacy, completion, specialized and unsupported tutors',()=>{
 const ids=['gpt-3.5-turbo-instruct-0914','gpt-3.5-turbo','gpt-4','gpt-4o-realtime-preview','gpt-5-pro','gpt-5-codex','gpt-4o-mini-search-preview','o1','o3-pro','gpt-image-1','gpt-4.1-mini','gpt-5','o3','gpt-6.1-sol','gpt-4.1-mini-2025-04-14'];
 const models=tutorModels(ids.map(id=>({id})));assert.equal(models.length,5);assert.ok(models.every(m=>ids.includes(m.id)));assert.equal(models[0].id,'gpt-4.1-mini');assert.equal(models.at(-1).id,'gpt-4.1-mini-2025-04-14');
});
test('standard tutors omit reasoning settings even when the saved effort is high',()=>{
 for(const m of ['gpt-4.1','gpt-4.1-mini','gpt-4o','gpt-4o-mini-2024-07-18'])assert.deepEqual(responseOptions(m,'high'),{});
 assert.deepEqual(responseOptions('gpt-5','high'),{include:['reasoning.encrypted_content'],reasoning:{effort:'high'}});
 assert.deepEqual(responseOptions('gpt-6.1-sol','default'),{include:['reasoning.encrypted_content']});
 assert.throws(()=>assertTutorModel('gpt-3.5-turbo-instruct-0914'),/not compatible/);assert.throws(()=>assertTutorModel(''),/Choose a model/);
});
test('API diagnostics distinguish billing, model access, keys and transient limits without exposing keys',()=>{
 assert.match(apiError(404,{code:'model_not_found'},'gpt-4.1').message,/cannot use gpt-4.1/);
 assert.match(apiError(429,{code:'insufficient_quota'}).message,/Changing models will not resolve/);
 assert.match(apiError(401,{message:'bad sk-secret-key'}).message,/rejected this API key/);
 assert.match(apiError(429,{code:'rate_limit_exceeded'}).message,/Wait briefly/);
 assert.ok(!apiError(400,{message:'bad sk-secret-key'}).message.includes('sk-secret-key'));
});
