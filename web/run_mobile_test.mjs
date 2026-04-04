import { chromium } from 'playwright';

async function checkMobile() {
  console.log('Starting mobile layout test...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

  // Collect console messages
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('Navigating to http://localhost:3000...');
    const response = await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Page status:', response.status());

    // Wait for any dynamic content
    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log('Page title:', title);

    // Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    console.log(`\n=== Layout Check ===`);
    console.log(`Window width: ${windowWidth}`);
    console.log(`Body scroll width: ${bodyWidth}`);
    console.log(`Has horizontal overflow: ${bodyWidth > windowWidth ? 'YES - ISSUE!' : 'No'}`);

    // Check for small text
    const smallTexts = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const small = [];
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize > 0 && fontSize < 12 && el.textContent.trim().length > 0) {
          small.push({ tag: el.tagName, class: el.className.substring(0, 50), fontSize: Math.round(fontSize * 10) / 10 });
        }
      });
      return small.slice(0, 10);
    });
    console.log(`\n=== Small Text (< 12px) ===`);
    if (smallTexts.length > 0) {
      smallTexts.forEach(t => console.log(`  ${t.tag}.${t.class}: ${t.fontSize}px`));
    } else {
      console.log('  None found');
    }

    // Check for small buttons (height < 44px)
    const smallButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
      const small = [];
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.height > 0 && rect.height < 44) {
          small.push({ height: Math.round(rect.height), text: btn.textContent.trim().substring(0, 30), class: btn.className.substring(0, 50) });
        }
      });
      return small.slice(0, 10);
    });
    console.log(`\n=== Small Buttons/Touch Targets (< 44px height) ===`);
    if (smallButtons.length > 0) {
      smallButtons.forEach(b => console.log(`  Height ${b.height}px: "${b.text}"`));
    } else {
      console.log('  None found');
    }

    // Elements overflowing viewport
    const overflowElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const overflow = [];
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0) {
            overflow.push({ tag: el.tagName, class: el.className.substring(0, 50), right: Math.round(rect.right), width: Math.round(rect.width), left: Math.round(rect.left) });
          }
        }
      });
      return overflow.slice(0, 10);
    });
    console.log(`\n=== Elements Overflowing Viewport ===`);
    if (overflowElements.length > 0) {
      overflowElements.forEach(e => console.log(`  ${e.tag}.${e.class}: right=${e.right}px (width=${e.width}px, left=${e.left}px)`));
    } else {
      console.log('  None found');
    }

    // Test hamburger menu
    console.log(`\n=== Testing Hamburger Menu ===`);
    const hamburger = await page.$('button[class*="hamburger"], button[class*="menu"], [class*="toggle"][class*="nav"]');
    if (hamburger) {
      console.log('  Found hamburger/menu button');
      await hamburger.click();
      await page.waitForTimeout(500);
      console.log('  Clicked hamburger button');
      // Check if drawer opened
      const drawerOpen = await page.evaluate(() => {
        const drawer = document.querySelector('[class*="drawer"], [class*="menu"], [class*="sidebar"], nav');
        if (drawer) {
          const style = window.getComputedStyle(drawer);
          return style.transform !== 'matrix(1, 0, 0, 1, 0, 0)' || style.left === '0px' || style.display !== 'none';
        }
        return false;
      });
      console.log(`  Drawer opened: ${drawerOpen}`);
      // Close it
      await hamburger.click();
      await page.waitForTimeout(500);
      console.log('  Clicked again to close');
    } else {
      console.log('  Hamburger button NOT found');
    }

    // Navigate to /favorites
    console.log(`\n=== Checking /favorites ===`);
    await page.goto('http://localhost:3000/favorites', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const favBodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const favWindowWidth = await page.evaluate(() => window.innerWidth);
    console.log(`  Window width: ${favWindowWidth}, Body scroll width: ${favBodyWidth}`);
    console.log(`  Has horizontal overflow: ${favBodyWidth > favWindowWidth ? 'YES - ISSUE!' : 'No'}`);

    const favOverflow = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const overflow = [];
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0) {
            overflow.push({ tag: el.tagName, class: el.className.substring(0, 50), right: Math.round(rect.right) });
          }
        }
      });
      return overflow.slice(0, 5);
    });
    if (favOverflow.length > 0) {
      console.log(`  Overflow elements:`);
      favOverflow.forEach(e => console.log(`    ${e.tag}.${e.class}: right=${e.right}px`));
    } else {
      console.log('  No overflow elements');
    }

    // Navigate to /profile
    console.log(`\n=== Checking /profile ===`);
    await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const profBodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const profWindowWidth = await page.evaluate(() => window.innerWidth);
    console.log(`  Window width: ${profWindowWidth}, Body scroll width: ${profBodyWidth}`);
    console.log(`  Has horizontal overflow: ${profBodyWidth > profWindowWidth ? 'YES - ISSUE!' : 'No'}`);

    const profOverflow = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const overflow = [];
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0) {
            overflow.push({ tag: el.tagName, class: el.className.substring(0, 50), right: Math.round(rect.right) });
          }
        }
      });
      return overflow.slice(0, 5);
    });
    if (profOverflow.length > 0) {
      console.log(`  Overflow elements:`);
      profOverflow.forEach(e => console.log(`    ${e.tag}.${e.class}: right=${e.right}px`));
    } else {
      console.log('  No overflow elements');
    }

    // Print console errors
    console.log(`\n=== Console Errors ===`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(e => console.log(`  ERROR: ${e}`));
    } else {
      console.log('  None');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkMobile();