const {test}=require('node:test'),assert=require('node:assert/strict');
const {extractReleaseNotes}=require('../scripts/release-notes.cjs');
test('release description contains only the current version',()=>{
  const log='# Studora 0.1.2\n\nClear update description.\n\n- Show what changed.\n\n# Studora 0.1.1\n\nOld change.';
  assert.equal(extractReleaseNotes(log,'0.1.2'),'Clear update description.\n\n- Show what changed.\n');
  assert.equal(extractReleaseNotes(log,'0.1.1'),'Old change.\n');
});
test('missing and empty descriptions block publication',()=>{
  assert.throws(()=>extractReleaseNotes('# Studora 0.1.1\nOld changes.','0.1.2'),/Add a CHANGELOG/);
  assert.throws(()=>extractReleaseNotes('# Studora 0.1.2\n\n# Studora 0.1.1\nOld changes.','0.1.2'),/needs a description/);
});
