const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1080,height:1920}});
await pg.goto('file://'+__dirname+'/index.html');await pg.waitForTimeout(500);
const FPS=30,D=32,only=process.argv[3]?process.argv[3].split(',').map(Number):null;
const frames=only||[...Array(FPS*D).keys()].map(i=>i);
for(const i of frames){await pg.evaluate(t=>render(t),i/FPS);await pg.screenshot({path:`${out}/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92})}
await b.close()})();
