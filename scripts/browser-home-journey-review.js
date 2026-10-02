// With preview on port 4333:
// playwright-cli run-code --filename=scripts/browser-home-journey-review.js
async page => {
  const results = [];
  await page.emulateMedia({reducedMotion:'reduce'});
  for (const width of [320,390,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto('http://127.0.0.1:4333/');
    const journey = page.locator('.mobile-arrival__journey');
    await journey.scrollIntoViewIfNeeded();
    const result = await journey.evaluate(async element => {
      const logo = element.querySelector('image');
      if (!logo) throw new Error('Homepage journey is missing the logo');
      const img = new Image();
      img.src = logo.getAttribute('href');
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img,0,0);
      const pixels = ctx.getImageData(0,0,canvas.width,canvas.height).data;
      const box = logo.getBBox();
      let overlaps = 0;
      for (const route of element.querySelectorAll('.mobile-arrival__route')) {
        for (let distance = 0; distance <= route.getTotalLength(); distance += .5) {
          const point = route.getPointAtLength(distance);
          // Include a 4 SVG-unit clearance around the visible logo pixels.
          for (const dx of [-4,0,4]) for (const dy of [-4,0,4]) {
            const x = Math.floor((point.x + dx - box.x) / box.width * canvas.width);
            const y = Math.floor((point.y + dy - box.y) / box.height * canvas.height);
            if (x >= 0 && y >= 0 && x < canvas.width && y < canvas.height && pixels[(y * canvas.width + x) * 4 + 3] > 32) overlaps++;
          }
        }
      }
      const home = element.querySelector('.mobile-arrival__home').getBoundingClientRect();
      const mark = logo.getBoundingClientRect();
      const frame = element.getBoundingClientRect();
      if (overlaps) throw new Error('Route intersects visible logo: ' + overlaps);
      if (home.top < mark.bottom) throw new Error('House must sit below the logo');
      if (home.bottom > frame.bottom || mark.top < frame.top) throw new Error('Journey artwork is clipped');
      return {width:innerWidth,overlaps,houseBelowLogo:true};
    });
    await journey.screenshot({path:`/tmp/kwiin-home-journey-${width}.png`,scale:'css'});
    results.push(result);
  }
  return results;
}
