'use strict';
const {calculate}=require('./core.cjs');
function plain(expression){
 const units=new Set(['mm','cm','m','km','s','h','min','kg','g','mg','mol','J','N','m/s','m/s²','degrees','degree']);
 return expression.replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,(full,text)=>units.has(text.trim())?'':full).replace(/\^?\s*\\circ|°/g,'').replace(/\\frac\{([\d.+*/() -]+)\}\{([\d.+*/() -]+)\}/g,'($1)/($2)').replace(/\\sqrt\{([\d.+*/() -]+)\}/g,'sqrt($1)').replace(/\\(?:times|cdot)/g,'*').replace(/\\(?:left|right)/g,'').trim();
}
function checkNumericEqualities(text){
 const checks=[],failures=[];const seen=new Set();
 for(const match of String(text).matchAll(/\${1,2}([^$]+)\${1,2}/g)){
  const parts=plain(match[1]).split('=').map(x=>x.trim());if(parts.length<2||parts.some(x=>!x||x.length>150||!/^[\d\s.+*/()^%-]+$/.test(x.replace(/sqrt/g,''))))continue;
  for(let i=1;i<parts.length&&checks.length<12;i++){const expression=`(${parts[i-1]}) - (${parts[i]})`;if(seen.has(expression))continue;seen.add(expression);
   try{const left=calculate(parts[i-1]).result,right=calculate(parts[i]).result,difference=calculate(expression);const passed=Math.abs(left-right)<=1e-9*Math.max(1,Math.abs(left),Math.abs(right));checks.push({type:'calculation',...difference,note:passed?'Numeric arithmetic checked: both sides agree. This does not verify units, the givens or the full solution.':'Arithmetic mismatch: the difference should be zero. Review this step.'});if(!passed)failures.push({statement:match[1],left,right})}catch{}
  }
 }return {checks,failures};
}
module.exports={checkNumericEqualities};
