const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.setDefaultTimeout(5000);p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4173/')?r.continue():r.abort());
 await p.goto('http://127.0.0.1:4173#courses');await p.getByTestId('course-root').waitFor();
 if(await p.getByTestId('course-open').count()!==2)throw Error('two split templates');
 await p.getByTestId('course-open').first().click();await p.getByTestId('course-steps').waitFor();
 if(!(await p.getByTestId('course-steps').textContent()).includes('不是原视频处方'))throw Error('template disclosure');
 await p.getByTestId('course-set-done').click();if(!(await p.getByTestId('course-progress').textContent()).includes('1 / 2'))throw Error('set completion');await p.getByTestId('course-rest-pause').click();let paused=await p.getByTestId('course-rest-timer').textContent();await p.reload();await p.getByTestId('course-rest-timer').waitFor();if(await p.getByTestId('course-rest-timer').textContent()!==paused)throw Error('paused rest refresh');await p.getByTestId('course-set-undo').click();if(!(await p.getByTestId('course-progress').textContent()).includes('0 / 2'))throw Error('set undo');
 await p.getByTestId('course-replace').first().click();await p.getByTestId('course-atom-detail').waitFor();
 await p.goBack();await p.getByTestId('course-steps').waitFor();
 if(!(await p.getByTestId('course-atom').textContent()).includes('俯卧撑'))throw Error('replacement after Back');
 await p.reload();await p.getByTestId('course-steps').waitFor();
 if(!(await p.getByTestId('course-atom').textContent()).includes('俯卧撑'))throw Error('replacement after reload');
 await p.goBack();await p.getByTestId('course-root').waitFor();
 await p.goto('http://127.0.0.1:4173#course/chest-back/0/exercise/bench');await p.getByTestId('course-atom-detail').waitFor();await p.getByTestId('course-detail-back').click();await p.getByTestId('course-steps').waitFor();
 if(errors.length)throw Error(errors.join('\n'));await b.close();console.log('training course passed');
})().catch(e=>{console.error(e);process.exit(1)});
