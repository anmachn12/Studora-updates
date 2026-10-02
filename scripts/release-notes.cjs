const fs=require('node:fs'),path=require('node:path');
function extractReleaseNotes(changelog,version){
  const lines=changelog.replace(/^\uFEFF/,'').split(/\r?\n/);
  const start=lines.findIndex(line=>line.trim()===`# Studora ${version}`);
  if(start<0)throw new Error(`Add a CHANGELOG.md description for Studora ${version}.`);
  const next=lines.findIndex((line,index)=>index>start&&/^#\s/.test(line));
  const notes=lines.slice(start+1,next<0?undefined:next).join('\n').trim();
  if(!notes)throw new Error(`Release ${version} needs a description of its changes.`);
  return notes+'\n';
}
function prepare(root,output){
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
  if(pkg.version!==lock.version||pkg.version!==lock.packages[''].version)throw new Error('Update the version in both package files before publishing.');
  const notes=extractReleaseNotes(fs.readFileSync(path.join(root,'CHANGELOG.md'),'utf8'),pkg.version);
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,notes);return pkg.version;
}
if(require.main===module){try{const root=path.resolve(__dirname,'..'),output=path.resolve(root,process.argv[2]||'dist/release-notes.md');console.log('Prepared release notes for '+prepare(root,output))}catch(error){console.error(error.message);process.exitCode=1}}
module.exports={extractReleaseNotes,prepare};
