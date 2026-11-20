const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const out=process.argv[2],a=+process.argv[3],b=+process.argv[4],step=+(process.argv[5]||1);fs.mkdirSync(out,{recursive:true});
const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1920,height:1080}});
await pg.goto('file://'+__dirname+'/index.html');await pg.waitForTimeout(500);
for(let i=a;i<b;i+=step){await pg.evaluate(t=>render(t),i/30);await pg.screenshot({path:`${out}/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:90})}
await br.close()})();
