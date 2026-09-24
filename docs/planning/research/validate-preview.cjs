// Planning artifact verification only; not product implementation.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/SG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const input = 'C:/Users/SG/.codex/visualizations/2026/09/20/01a0bf27-4fea-7dd2-ac7f-34433b2a3c90/oguz-academy-role-preview.html';
const output = __dirname;
(async () => {
  const source = fs.readFileSync(input,'utf8');
  const scripts = [...source.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  scripts.forEach(m => new Function(m[1]));
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const page = await browser.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const checks=[];
  for(const width of [390,1024]) {
    await page.setViewportSize({width,height:950});
    await page.setContent('<html><head><style>html{color-scheme:light dark}body{margin:0}</style></head><body>'+source+'</body></html>');
    for(const role of ['learner','admin','instructor','manager','platform']) {
      await page.selectOption('#ola-role',role);
      const title=await page.locator('#ola-main h1').textContent();
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
      if(overflow)throw Error('Horizontal overflow: '+width+'/'+role);
      await page.locator('#ola-main [data-action="flow"]').first().click();
      for(let step=0;step<3;step++)await page.locator('#ola-main [data-action="next"]').click();
      if(await page.locator('#ola-main .ola-success').count()!==1)throw Error('Flow failed '+role);
      await page.locator('#ola-main [data-action="home"]').click();
      checks.push({width,role,title,overflow:false,flow:'passed'});
      if(width===1024&&['learner','admin','platform'].includes(role))await page.screenshot({path:path.join(output,'preview-'+role+'.png'),fullPage:true});
    }
  }
  await page.emulateMedia({colorScheme:'dark'});
  await page.selectOption('#ola-role','learner');
  await page.screenshot({path:path.join(output,'preview-dark.png'),fullPage:true});
  await browser.close();
  const result={syntax:'passed',checks,pageErrors:errors,darkScreenshot:'preview-dark.png',scope:'Planning mockup; not product UAT or WCAG certification'};
  fs.writeFileSync(path.join(output,'preview-validation.json'),JSON.stringify(result,null,2));
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({syntax:result.syntax,scenarios:checks.length,pageErrors:errors.length}));
})().catch(e=>{console.error(e);process.exitCode=1});
