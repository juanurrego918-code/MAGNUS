const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const out=process.argv[2],a=+process.argv[3],b=+process.argv[4];fs.mkdirSync(out,{recursive:true});
const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1080,height:1920}});
pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.goto('file://'+__dirname+'/index.html');await pg.waitForTimeout(500);
for(let i=a;i<b;i++){await pg.evaluate(t=>render(t),i/30);await pg.screenshot({path:`${out}/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:90})}
await br.close()})();
