import { chromium } from 'playwright';

const BASE_URL = 'https://web-mu-woad-35.vercel.app';
const MOBILE_WIDTH = 375;

async function verifyMobileLayout() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: MOBILE_WIDTH, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  const results = [];

  try {
    // 1. Open homepage
    console.log('1. Opening homepage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: '/root/code/recipe-app/web/screenshots/01-homepage.png', fullPage: false });
    results.push({ step: 'Homepage loaded', status: 'OK' });

    // 2. Check RecipeCard padding (p-3 on mobile)
    console.log('2. Checking RecipeCard padding...');
    const recipeCards = await page.locator('.recipe-card, [class*="RecipeCard"]').first();
    if (recipeCards) {
      const padding = await recipeCards.evaluate(el => {
        const style = window.getComputedStyle(el);
        return `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`;
      });
      console.log(`   RecipeCard padding: ${padding}`);
      results.push({ step: 'RecipeCard padding', status: 'Checked', value: padding });
    }

    // 3. Check FavoriteButton touch target
    console.log('3. Checking FavoriteButton touch target...');
    const favoriteButtons = await page.locator('button[class*="FavoriteButton"], [class*="favorite"]').first();
    if (favoriteButtons) {
      const box = await favoriteButtons.boundingBox();
      if (box) {
        console.log(`   FavoriteButton bounding box: ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
        const has44px = box.width >= 44 && box.height >= 44;
        results.push({ step: 'FavoriteButton touch target (44px)', status: has44px ? 'PASS' : 'FAIL', value: `${box.width.toFixed(1)}x${box.height.toFixed(1)}px` });
      }
    }

    // 4. Navigate to a recipe detail page
    console.log('4. Navigating to recipe detail...');
    const recipeLinks = await page.locator('a[href*="/recipe/"]');
    if (await recipeLinks.count() > 0) {
      await recipeLinks.first().click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await page.screenshot({ path: '/root/code/recipe-app/web/screenshots/02-recipe-detail.png', fullPage: false });
      console.log('   Recipe detail page loaded');

      // 5. Check back button touch target
      console.log('5. Checking RecipeDetailHeader back button...');
      const backButton = await page.locator('button[aria-label*="back"], button[class*="back"], a[aria-label*="返回"], a[class*="back"]').first();
      if (backButton) {
        const box = await backButton.boundingBox();
        if (box) {
          console.log(`   Back button bounding box: ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
          const has44px = box.width >= 44 && box.height >= 44;
          results.push({ step: 'Back button touch target (44px)', status: has44px ? 'PASS' : 'FAIL', value: `${box.width.toFixed(1)}x${box.height.toFixed(1)}px` });
        }
      }

      // 6. Check share button touch target
      console.log('6. Checking RecipeShareMenu share button...');
      const shareButton = await page.locator('button[aria-label*="share"], button[class*="share"], [class*="ShareMenu"] button').first();
      if (shareButton) {
        const box = await shareButton.boundingBox();
        if (box) {
          console.log(`   Share button bounding box: ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
          const has44px = box.width >= 44 && box.height >= 44;
          results.push({ step: 'Share button touch target (44px)', status: has44px ? 'PASS' : 'FAIL', value: `${box.width.toFixed(1)}x${box.height.toFixed(1)}px` });
        }
      }

      // 7. Check RecipeDetailTitleCard metadata text size
      console.log('7. Checking RecipeDetailTitleCard metadata text size...');
      const metadata = await page.locator('[class*="TitleCard"] p, [class*="titleCard"] p, [class*="metadata"]').first();
      if (metadata) {
        const fontSize = await metadata.evaluate(el => window.getComputedStyle(el).fontSize);
        console.log(`   Metadata font size: ${fontSize}`);
        const isTextSm = parseInt(fontSize) >= 14;
        results.push({ step: 'Metadata text-sm (14px)', status: isTextSm ? 'PASS' : 'FAIL', value: fontSize });
      }
    }

    // 8. Navigate to favorites page
    console.log('8. Navigating to favorites page...');
    await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: '/root/code/recipe-app/web/screenshots/03-favorites.png', fullPage: false });
    console.log('   Favorites page loaded');

    // Check RecipeCard padding on favorites
    const favCards = await page.locator('.recipe-card, [class*="RecipeCard"]').first();
    if (favCards) {
      const padding = await favCards.evaluate(el => {
        const style = window.getComputedStyle(el);
        return `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`;
      });
      console.log(`   RecipeCard padding on favorites: ${padding}`);
      results.push({ step: 'Favorites RecipeCard padding', status: 'Checked', value: padding });
    }

    // 9. Check AdminRecipeMobileList if accessible
    console.log('9. Checking admin page...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: '/root/code/recipe-app/web/screenshots/04-admin.png', fullPage: false });

    const editButtons = await page.locator('button[class*="edit"], a[class*="edit"], button:has-text("编辑"), a:has-text("编辑")').first();
    if (editButtons) {
      const box = await editButtons.boundingBox();
      if (box) {
        console.log(`   Edit button bounding box: ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
        const has44px = box.width >= 44 && box.height >= 44;
        results.push({ step: 'Admin edit button touch target (44px)', status: has44px ? 'PASS' : 'FAIL', value: `${box.width.toFixed(1)}x${box.height.toFixed(1)}px` });
      }
    }

    const deleteButtons = await page.locator('button[class*="delete"], button:has-text("删除")').first();
    if (deleteButtons) {
      const box = await deleteButtons.boundingBox();
      if (box) {
        console.log(`   Delete button bounding box: ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
        const has44px = box.width >= 44 && box.height >= 44;
        results.push({ step: 'Admin delete button touch target (44px)', status: has44px ? 'PASS' : 'FAIL', value: `${box.width.toFixed(1)}x${box.height.toFixed(1)}px` });
      }
    }

  } catch (error) {
    console.error('Error during verification:', error.message);
    results.push({ step: 'Error', status: 'FAIL', value: error.message });
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n========== VERIFICATION SUMMARY ==========');
  console.log(`Viewport: ${MOBILE_WIDTH}x812 (mobile)`);
  console.log('-----------------------------------');
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✓' : r.status === 'FAIL' ? '✗' : '○';
    console.log(`${icon} ${r.step}: ${r.status} ${r.value ? `(${r.value})` : ''}`);
  });
  console.log('==========================================\n');

  return results;
}

verifyMobileLayout().catch(console.error);
