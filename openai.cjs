'use strict';

// General tutor models need Responses, function tools and image/PDF input.
// Account discovery remains the source of availability; this is a capability filter.
const general = /^(?:gpt-4\.1(?:-mini|-nano)?|gpt-4o(?:-mini)?|gpt-5(?:\.\d+)?(?:-mini|-nano|-sol|-terra|-luna)?|gpt-6(?:\.\d+)?(?:-astra|-sol|-luna)?|o3|o4-mini)(?:-\d{4}-\d{2}-\d{2})?$/;
const reasoning = /^(?:gpt-[56](?:[.-]|$)|o3(?:-|$)|o4-mini(?:-|$))/;
function modelInfo(id) { return {id, reasoning: reasoning.test(id), compatible: general.test(id)}; }
function tutorModels(data) {
  return [...new Set((data || []).map(x => x.id).filter(id => typeof id === 'string' && general.test(id)))].sort((a,b) => {
    const snapshot = id => /-\d{4}-\d{2}-\d{2}$/.test(id) ? 1 : 0;
    return snapshot(a)-snapshot(b) || a.localeCompare(b, undefined, {numeric:true});
  }).map(modelInfo);
}
function assertTutorModel(model) {
  if (!model || typeof model !== 'string' || !/^[a-zA-Z0-9._:-]{1,150}$/.test(model)) throw new Error('Choose a model in Settings → AI connection.');
  // Keep advanced IDs possible, but block the known incompatible families before sending.
  if (/instruct|gpt-3\.5|gpt-4(?:-|$)|audio|realtime|transcribe|tts|embedding|image|search|deep-research|codex|(?:^|-)pro(?:-|$)|^o1/.test(model))
    throw new Error('This model is not compatible with Studora’s tutor. Open Settings → AI connection, refresh models, and choose a tutor model.');
}
function responseOptions(model, effort='default') {
  assertTutorModel(model);
  if (!modelInfo(model).reasoning) return {};
  const options={include:['reasoning.encrypted_content']};
  if (effort && effort!=='default') options.reasoning={effort};
  return options;
}
function apiError(status, error={}, model='') {
  const code=error.code || error.type || '', msg=String(error.message || '');
  let message;
  if (status===401 || code==='invalid_api_key') message='OpenAI rejected this API key. Change it in Settings → AI connection using a key from your API account.';
  else if (/quota|credit_balance|billing|spend_limit|budget|usage_limit/.test(code) || /quota|billing|credit balance/i.test(msg)) message='Your API account has no available quota or has reached a billing limit. Check API credits and project/organization limits at platform.openai.com. ChatGPT Free or Plus does not include API usage. Changing models will not resolve a quota error.';
  else if (code==='model_not_found' || status===404) message=`Your API account cannot use ${model || 'this model'}, or it no longer exists. Refresh models in Settings → AI connection and choose an available tutor model. Model listings do not guarantee permission to run it.`;
  else if (status===403) message='This API account or project does not have permission for this request. Check project key permissions, model access, and any organization verification required by OpenAI.';
  else if (status===429) message='OpenAI’s request or token rate limit was reached. Wait briefly, then retry. Check your API account limits if it continues.';
  else if (status>=500) message='OpenAI is temporarily unavailable. Try again shortly.';
  else message='OpenAI rejected this request. '+(msg || 'Check the selected model and settings.');
  // Provider messages can echo a bad key. Never display credentials in the UI.
  message=message.replace(/\bsk-[A-Za-z0-9_-]+/g,'[API key hidden]');
  return new Error(message);
}
module.exports={modelInfo,tutorModels,assertTutorModel,responseOptions,apiError};
