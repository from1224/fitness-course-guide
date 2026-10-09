const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  for(const viewport of [{width:390,height:844},{width:1280,height:900}]){
    const p=await b.newPage({viewport}); p.setDefaultTimeout(5000); const errors=[]; const requests=[];
    p.on('pageerror',e=>errors.push(e.message)); p.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4173/'))requests.push(r.url())});
    await p.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4173/')?r.continue():r.abort());
    await p.goto('http://127.0.0.1:4173'); await p.getByTestId('content-root').waitFor();
    if(await p.locator('[data-testid=course-detail]').count()!==64)throw Error('64 course cards');
    await p.getByTestId('course-detail').first().click(); await p.getByTestId('content-detail').waitFor();
    await p.getByTestId('content-back').click(); if(await p.locator('[data-testid=course-detail]').count()!==64)throw Error('course back');
    await p.getByRole('button',{name:'动作库',exact:true}).click(); if(await p.locator('[data-ref]').count()!==117)throw Error('117 reference records');
    await p.locator('[data-ref="barbell-bench-press"]').click(); await p.getByTestId('content-detail').waitFor(); await p.waitForTimeout(100); if(await p.locator('img').count()&&await p.locator('img').count()!==0) throw Error('external image fallback missing');
    await p.getByTestId('content-back').click(); if(await p.locator('[data-ref]').count()!==117)throw Error('reference back');
    await p.getByTestId('training-tool').click(); await p.getByRole('button',{name:'动作库',exact:true}).waitFor();
    await p.locator('button[data-a]').first().click(); await p.getByRole('button',{name:'执行',exact:true}).click(); await p.getByRole('button',{name:'开始计划'}).click(); await p.getByText('完成一组').click();
    const before=await p.locator('.timer').textContent(); await p.getByTestId('content-tool').click(); await p.getByTestId('content-root').waitFor(); await p.waitForTimeout(1200);
    if(!await p.getByTestId('content-root').count())throw Error('old draw overwrote content');
    await p.getByTestId('training-tool').click(); await p.getByRole('button',{name:'执行',exact:true}).click(); const after=await p.locator('.timer').textContent();
    if(Number(after.replace(':',''))>=Number(before.replace(':','')))throw Error('deadline did not advance');
    if(errors.length)throw Error(errors.join('\n'));
    await p.screenshot({path:`/tmp/content-${viewport.width}.png`,fullPage:true}); await p.close();
  } await b.close(); console.log('content init regression passed');
})().catch(e=>{console.error(e);process.exit(1)});
