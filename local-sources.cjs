'use strict';
// Local vision accepts pictures, so PDF excerpts must become actual page images.
async function prepareLocalContent(content){
 const result=[];let pictures=0;
 for(const part of content){
  if(part.type==='input_image'){if(pictures>=2)throw Error('For local tutoring, select at most two photos or PDF pages per question.');result.push(part);pictures++;continue}
  if(part.type!=='input_file'){result.push(part);continue}
  if(pictures>=2)throw Error('For local tutoring, select at most two photos or PDF pages per question.');
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task=pdfjs.getDocument({data:new Uint8Array(Buffer.from(part.file_data.split(',')[1],'base64')),useSystemFonts:true});
  try{const pdf=await task.promise;if(pdf.numPages>2-pictures)throw Error('Select a lesson page range of one or two PDF pages for local tutoring. For a scanned book, import a photo of the page you need.');
   for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),raw=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(1.5,1200/Math.max(raw.width,raw.height))});const canvas=pdf.canvasFactory.create(Math.ceil(viewport.width),Math.ceil(viewport.height));try{await page.render({canvasContext:canvas.context,viewport}).promise;result.push({type:'input_image',image_url:'data:image/png;base64,'+canvas.canvas.toBuffer('image/png').toString('base64')});pictures++}finally{pdf.canvasFactory.destroy(canvas)}}
  }finally{await task.destroy()}
 }return result;
}
module.exports={prepareLocalContent};
