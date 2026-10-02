// The Codex execution sandbox cannot launch Chromium's nested Windows sandbox.
// This switch applies only to disposable test processes, never to Studora shortcuts.
module.exports={args:['--no-sandbox',require('node:path').resolve(__dirname,'..')]};
