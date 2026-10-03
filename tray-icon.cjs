// Use the same crisp brand mark as the installed app. No remote assets.
module.exports=()=>require('node:fs').readFileSync(require('node:path').join(__dirname,'assets/tray.png'));
