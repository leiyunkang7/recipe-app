const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
  });

  const pages = [
    { name: 'Homepage', url: 'https://web-mu-woad-35.vercel.app/' },
    { name: 'Recipe Detail', url: 'https://web-mu-woad-35.vercel.app/recipes/1' },
    { name: 'Favorites', url: 'https://web-mu-woad-35.vercel.app/favorites' },
    { name: 'Profile', url: 'https://web-mu-woad-35.vercel.app/profile' },
    { name: 'Admin Dashboard', url: 'https://web-mu-woad-35.vercel.app/admin' }
  ];

  for (const p of pages) {
    console.log(`\n=== Checking ${p.name} ===`);
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });

    // Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    console.log(`Body scrollWidth: ${bodyWidth}, Window innerWidth: ${windowWidth}`);
    if (bodyWidth > windowWidth) {
      console.log(`⚠️  HORIZONTAL OVERFLOW: ${bodyWidth - windowWidth}px`);
    }

    // Check for small text
    const smallTexts = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const small = [];
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize > 0 && fontSize < 12 && el.textContent.trim().length > 0) {
          small.push({ tag: el.tagName, text: el.textContent.trim().substring(0, 50), fontSize });
        }
      });
      return small.slice(0, 10);
    });
    if (smallTexts.length > 0) {
      console.log('⚠️  Small text found (<12px):');
      smallTexts.forEach(t => console.log(`   ${t.tag}: "${t.text}" (${t.fontSize}px)`));
    }

    // Check for small touch targets
    const smallButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, [role="button"], input[type="submit"]');
      const small = [];
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          small.push({ tag: btn.tagName, width: Math.round(rect.width), height: Math.round(rect.height), text: btn.textContent.trim().substring(0, 30) });
        }
      });
      return small.slice(0, 10);
    });
    if (smallButtons.length > 0) {
      console.log('⚠️  Small touch targets found (<44px):');
      smallButtons.forEach(b => console.log(`   ${b.tag}: "${b.text}" (${b.width}x${b.height}px)`));
    }

    // Check for layout containers overflow
    const overflowElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const overflow = [];
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.overflow === 'hidden' || style.overflow-x === 'hidden') {
          const rect = el.getBoundingClientRect();
          const scrollWidth = el.scrollWidth;
          if (scrollWidth > rect.width) {
            overflow.push({ tag: el.tagName, class: el.className, scrollWidth: el.scrollWidth, clientWidth: rect.width });
          }
        }
      });
      return overflow.slice(0, 5);
    });
    if (overflowElements.length > 0) {
      console.log('⚠️  Elements with hidden overflow but content exceeds bounds:');
      overflowElements.forEach(e => console.log(`   ${e.tag}.${e.class}: scrollWidth=${e.scrollWidth}, clientWidth=${e.clientWidth}`));
    }

    // Take screenshot
    await page.screenshot({ path: `/root/.openclaw/code/recipe-app/mobile-${p.name.toLowerCase().replace(/ /g, '-')}.png`, fullPage: false });
    console.log(`📸 Screenshot saved: mobile-${p.name.toLowerCase().replace(/ /g, '-')}.png`);
  }

  // Check navigation menu on homepage
  console.log('\n=== Checking Mobile Navigation ===');
  await page.goto('https://web-mu-woad-35.vercel.app/', { waitUntil: 'networkidle' });

  // Look for hamburger menu
  const hamburger = await page.$('button[class*="hamburger"], button[class*="menu"], [aria-label*="menu" i], [aria-label*="Menu" i]');
  if (hamburger) {
    console.log('✅ Hamburger menu button found');
    await hamburger.click();
    await page.waitForTimeout(500);

    // Check if drawer/menu opened
    const drawer = await page.$('[class*="drawer"], [class*="overlay"], [class*="modal"], nav[class*="open"]');
    if (drawer) {
      console.log('✅ Menu drawer/modal opened');
      await page.screenshot({ path: '/root/.openclaw/code/recipe-app/mobile-menu-open.png' });
      console.log('📸 Menu screenshot saved');
    }
  } else {
    console.log('⚠️  Hamburger menu button NOT found');
  }

  // Print any errors
  if (errors.length > 0) {
    console.log('\n=== Console/Page Errors ===');
    errors.forEach(e => console.log(e));
  }

  await browser.close();
  console.log('\n✅ Mobile check complete!');
})();
