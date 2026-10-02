// Run with playwright-cli run-code --filename=scripts/browser-interactions-review.js
// against npm run preview -- --host 127.0.0.1 --port 4333.
async page => {
  const results = [];
  const check = (ok, text) => { if (!ok) throw new Error(text); results.push(text); };
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  for (const route of ['services','mobile-spa']) {
    await page.goto(`http://127.0.0.1:4333/en/${route}/`);
    await page.evaluate(() => document.fonts.ready);
    check(await page.locator('[data-service-card]').count() === 8, `${route}: eight treatment cards`);
    const price = page.locator('[data-service-id="kwiin-massage"] [data-minutes="90"] [data-price-value]');
    await page.waitForFunction(() => document.querySelector('[data-service-id="kwiin-massage"] [data-minutes="90"] [data-price-value]').textContent === '385');
    check(await price.textContent() === '385', `${route}: CHF385 at 15 km`);
    await page.locator('[data-zone-select]').selectOption('30');
    await page.waitForFunction(() => document.querySelector('[data-service-id="kwiin-massage"] [data-minutes="90"] [data-price-value]').textContent === '440');
    check(await price.textContent() === '440', `${route}: CHF440 at 30 km`);
    const addons = await page.locator('[data-addon] [data-price-value]').allTextContents();
    check(addons.length === 2 && addons.every(p => p === '85'), `${route}: add-ons stay CHF85 with no extra travel`);
    check((await page.locator('[data-addon] [data-price-breakdown]').first().textContent()).includes('add-on'), `${route}: add-on labels translated`);
    check((await page.locator('[data-service-book]').first().getAttribute('href')).includes('30%20km'), `${route}: booking message matches selected zone`);
    check(await page.locator('[data-service-id="back-serenity"] [data-minutes="30"]').count() === 0, `${route}: Back Serenity 30min removed`);
    await page.locator('[data-zone-select]').selectOption('15');
    if (route === 'services') {
      await page.locator('[data-service-card]').first().scrollIntoViewIfNeeded();
      await page.screenshot({path:'/tmp/kwiin-treatment-mobile.png',scale:'css'});
    } else {
      await page.locator('#office-offer summary').click();
      check(await page.locator('#office-offer').getAttribute('open') !== null, 'Office details expand');
      const link = await page.locator('#office-offer [data-enquiry]').getAttribute('href');
      check(link.startsWith('https://wa.me/41779669928?text=') && /office|workplace/i.test(decodeURIComponent(link)), 'Office enquiry is ready without sending a message');
    }
  }
  await page.goto('http://127.0.0.1:4333/en/');
  await page.locator('.language-menu--hero summary').click();
  await page.waitForFunction(() => document.querySelector('.language-menu--hero').open);
  check(await page.locator('.language-menu--hero .language-menu__popover').evaluate(e => getComputedStyle(e).backgroundColor === 'rgb(251, 249, 246)'), 'Language dropdown has opaque background');
  await page.locator('.language-menu--hero [data-language="pt"]').click();
  await page.waitForFunction(() => document.documentElement.lang === 'pt');
  check(await page.locator('html').getAttribute('lang') === 'pt', 'Last language option is reachable and switches language');
  await page.locator('[data-menu-toggle]').click();
  await page.waitForFunction(() => document.body.classList.contains('menu-open'));
  check(await page.locator('[data-mobile-navigation] nav a').count() === 7, 'Mobile menu contains seven pages');
  await page.locator('[data-mobile-navigation] a[href="/pt/shop/"]').click();
  await page.waitForURL('**/pt/shop/');
  check((await page.locator('h1').textContent()).length > 0, 'New shop route retains selected language');
  await page.screenshot({path:'/tmp/kwiin-shop-mobile.png',scale:'css'});
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.screenshot({path:'/tmp/kwiin-footer-mobile.png',scale:'css'});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:4333/en/international/');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.page-transition')).opacity) < .01);
  await page.screenshot({path:'/tmp/kwiin-international-desktop.png',scale:'css',fullPage:true});
  return results;
}
