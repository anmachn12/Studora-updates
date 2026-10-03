'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
let cached;
async function printStyles(){if(cached)return cached;const files=[require.resolve('katex/dist/katex.min.css'),require.resolve('@fontsource/instrument-sans/400.css'),require.resolve('@fontsource/noto-naskh-arabic/400.css')];let all='';for(const file of files){let css=await fs.readFile(file,'utf8');const matches=[...new Set([...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map(x=>x[1].replace(/["']/g,'')))];for(const font of matches){const bytes=await fs.readFile(path.resolve(path.dirname(file),font));css=css.replaceAll('url('+font+')','url(data:font/woff2;base64,'+bytes.toString('base64')+')')}all+=css}cached=all;return all;}
module.exports={printStyles};
