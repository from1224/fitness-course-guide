/* Run with NODE_PATH=/tmp/fitness-pw/node_modules node tests/app-routing-regression.cjs */
const assert=require('assert'),{chromium}=require('playwright');
(async()=>{const base=process.env.BASE_URL||'http://127.0.0.1:4173';const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true});const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(base+'/#courses'); await page.waitForSelector('text=胸背两分化'); await page.screenshot({path:'tests/view-home-390.png',fullPage:true});
  await page.goto(base+'/#course/chest-back/0/exercise/barbell-bench-press'); await page.waitForSelector('text=平板杠铃卧推');
  await page.goto(base+'/#course/glute-leg/1/exercise/BV17aovBqEdg%3Abarbell_romanian_deadlift'); await page.waitForSelector('text=罗马尼亚硬拉');
  await page.goto(base+'/#library'); await page.waitForSelector('#search'); await page.fill('#search','绳索'); await page.waitForTimeout(150); assert.match(await page.locator('#app').innerText(),/绳索/);
  await page.locator('a[href*="library/reference/"]').first().click(); await page.waitForSelector('[data-close]'); await page.goBack(); await page.waitForSelector('#search'); assert.equal(await page.inputValue('#search'),'绳索'); await page.goForward(); await page.reload(); await page.waitForSelector('[data-close]'); await page.locator('[data-close]').click(); await page.waitForSelector('#search');
  await page.goto(base+'/#library/reference/cable-chest-fly'); await page.locator('[data-close]').click(); await page.waitForSelector('#search');
  await page.goto(base+'/#tonight'); await page.locator('a[href*="library/reference/incline-dumbbell-chest-press"]').click(); await page.locator('[data-close]').click(); await page.waitForSelector('text=今晚：胸部＋腿后侧');
  await page.goto(base+'/#tonight'); await page.locator('a[href*="library/course/BV17aovBqEdg%3Awarmup_foam_hamstrings"]').click(); await page.reload(); await page.locator('[data-close]').click(); await page.waitForSelector('text=今晚：胸部＋腿后侧');
  const bench=page.locator('article[data-detail-scope="tonight:barbell-bench-press"]');
  await bench.locator('details > summary').first().click(); await bench.locator('details details > summary').first().click();
  assert.equal(await bench.locator('details[open]').count(),2);
  await bench.locator('[data-tonight-field="sets"]').fill('3');
  await bench.scrollIntoViewIfNeeded(); const planScroll=await page.evaluate(()=>scrollY);
  await bench.locator('[data-tonight-skip]').evaluate(node=>{node.checked=true;node.dispatchEvent(new Event('change',{bubbles:true}))}); await page.waitForTimeout(80);
  assert.equal(await bench.locator('details[open]').count(),2); {const y=await page.evaluate(()=>scrollY);assert.ok(Math.abs(y-planScroll)<20,`skip scroll ${planScroll} -> ${y}`)}
  await page.reload(); await page.waitForSelector('article[data-detail-scope="tonight:barbell-bench-press"]');
  assert.equal(await bench.locator('details[open]').count(),2); assert.ok(Math.abs(await page.evaluate(()=>scrollY)-planScroll)<20); assert.equal(await bench.locator('[data-tonight-field="sets"]').inputValue(),'3');
  await bench.locator('a[href*="library/reference/barbell-bench-press"]').evaluate(node=>node.click()); await page.waitForSelector('[data-close]'); await page.locator('[data-close]').evaluate(node=>node.click()); await page.waitForSelector('article[data-detail-scope="tonight:barbell-bench-press"]');
  assert.equal(await bench.locator('details[open]').count(),2); assert.ok(Math.abs(await page.evaluate(()=>scrollY)-planScroll)<20);
  await page.goto(base+'/#course/chest-back/0'); await page.screenshot({path:'tests/view-course-390.png',fullPage:true}); await page.locator('[data-action="set"]').click(); await page.waitForSelector('[data-timer]'); let before=await page.locator('[data-timer]').textContent(); await page.reload(); await page.waitForSelector('[data-timer]'); assert.ok(await page.locator('[data-timer]').textContent()<=before);
  await page.goto(base+'/#library/course/barbell_bench_press_flat'); await page.waitForSelector('text=课程补充'); assert.ok(await page.locator('text=课程补充').count());
  await page.goto(base+'/#library/course/BV1qF6wBaEWu__barbell_romanian_deadlift'); await page.waitForSelector('text=呼吸与躯干'); await page.waitForSelector('text=常见问题');
  await page.goto(base+'/#library'); await page.screenshot({path:'tests/view-library-390.png',fullPage:true}); await page.goto(base+'/#library/reference/cable-chest-fly'); await page.screenshot({path:'tests/view-detail-390.png',fullPage:true}); await browser.close(); console.log('app routing regression passed');
})().catch(e=>{console.error(e);process.exit(1)});
