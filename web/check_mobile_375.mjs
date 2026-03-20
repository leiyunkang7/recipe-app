import { chromium } from 'playwright';

async function checkMobile() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/check_375.png', fullPage: true });
    
    // Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    console.log(`Window width: ${windowWidth}, Body scroll width: ${bodyWidth}`);
    
    if (bodyWidth > windowWidth) {
      console.log('⚠️ HORIZONTAL OVERFLOW DETECTED!');
    }
    
    // Check for common issues
    const issues = await page.evaluate(() => {
      const results = [];
      const elements = document.querySelectorAll('*');
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth && rect.bottom >= 0) {
          // Check if element is actually visible
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0) {
            results.push({
              tag: el.tagName,
              class: el.className.substring(0, 100),
              right: rect.right,
              width: rect.width
            });
          }
        }
      });
      return results;
    });
    
    if (issues.length > 0) {
      console.log('\n⚠️ Elements extending beyond viewport:');
      issues.slice(0, 10).forEach(issue => {
        console.log(`  ${issue.tag}.${issue.class}: right=${issue.right}px, width=${issue.width}px`);
      });
    } else {
      console.log('✅ No elements extend beyond viewport');
    }
    
    // Get console errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') logs.push(msg.text());
    });
    
    console.log('\n✅ Mobile 375px check complete!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkMobile();
