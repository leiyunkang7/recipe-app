from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 375, 'height': 812})
    
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(5000)
    page.screenshot(path='/root/code/recipe-app/web/screenshots/mobile_375_home.png', full_page=True)
    
    page_content = page.content()
    print("Page structure (first 3000 chars):")
    print(page_content[:3000])
    
    nuxt_links = page.locator('a[href*="recipe"]').all()
    print(f"\nLinks containing 'recipe': {len(nuxt_links)}")
    
    all_a = page.locator('a').all()
    print(f"All links: {len(all_a)}")
    
    for a in all_a:
        href = a.get_attribute('href')
        print(f"  - {href}")
    
    browser.close()
