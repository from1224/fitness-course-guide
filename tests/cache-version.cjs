const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),app=fs.readFileSync(path.join(root,'app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const version=app.match(/const dataVersion='([^']+)'/);assert.ok(version,'data version is required');
assert.match(html,new RegExp(`app\\.js\\?v=${version[1]}`));
assert.match(app,/fetch\(`\.\/data\/\$\{n\}\?v=\$\{dataVersion\}`\)/);
assert.match(app,/subtitle-video-evidence-20261012\.json/);
console.log(JSON.stringify({passed:true,assetVersion:version[1],subtitleDataRequest:`subtitle-video-evidence-20261012.json?v=${version[1]}`},null,2));
