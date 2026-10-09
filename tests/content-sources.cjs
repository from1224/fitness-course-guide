const { chromium } = require('playwright');
const ref = require('../data/authorized-reference.json');
const count = ref.entries.reduce((a, x) => (a[x.detailStatus] = (a[x.detailStatus] || 0) + 1, a), {});
if (ref.entries.length !== 196 || count.read !== 116 || count.partial !== 1 || count.not_yet_read !== 79) throw Error('reference snapshot counts');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'/usr/bin/chromium', args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:390,height:844}});
  await page.route('**/fitness.j1exanderspace.cn/**', route => route.abort());
  const errors=[]; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:4173'); await page.waitForTimeout(500);
  if (await page.locator('[data-d]').count() !== 64) throw Error('course cards');
  await page.getByRole('button',{name:'动作库'}).click();
  if (await page.locator('[data-ref]').count() !== 116) throw Error('read reference details');
  await page.locator('[data-ref]').first().click();
  if (!(await page.locator('.detail').textContent()).trim()) throw Error('reference detail');
  if (errors.length) throw Error(errors.join('\n'));
  console.log('content sources passed'); await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
