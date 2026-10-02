// Run with playwright-cli run-code --filename=scripts/browser-mobile-review.js
// against npm run preview -- --host 127.0.0.1 --port 4333.
async page => {
  const errors = [];
  const issues = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  const routes = ['', 'mobile-spa/', 'services/', 'about/', 'contact/', 'international/', 'courses/', 'shop/', 'terms/'];
  let checked = 0;
  for (const width of [390, 320]) {
    await page.setViewportSize({width,height:844});
    for (const language of ['de','en','fr','es','it','pt','ru','th']) {
      for (const route of routes) {
        const path = `/${language === 'de' ? '' : language + '/'}${route}`;
        await page.goto('http://127.0.0.1:4333' + path);
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.evaluate(() => {
          return [...document.querySelectorAll('main h1, main h2, main h3, main p, main a, main li, main summary, footer p, footer a')].filter(e => {
            if (!e.getClientRects().length || e.classList.contains('sr-only') || getComputedStyle(e).visibility === 'hidden') return false;
            const r = e.getBoundingClientRect();
            return r.left < -2 || r.right > innerWidth + 2 || e.scrollWidth > e.clientWidth + 3;
          }).map(e => ({tag:e.tagName, cls:e.className,text:e.textContent.trim().slice(0,70),width:e.clientWidth,scroll:e.scrollWidth}));
        });
        if (overflow.length) issues.push({width,path,overflow});
        checked++;
      }
    }
  }
  if (errors.length || issues.length) throw new Error(JSON.stringify({checked,errors:[...new Set(errors)],issues}));
  return {checked, errors:[], issues:[]};
}
