from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 375, 'height': 812})
    
    print("Testing home page with longer wait...")
    page.goto('http://localhost:3000', timeout=30000)
    
    # Wait for potential JS rendering
    page.wait_for_timeout(5000)
    
    # Get page content
    html = page.content()
    
    # Look for Nuxt-specific content
    has_nuxt_link = 'NuxtLink' in html or 'nuxt-link' in html
    has_recipe = 'recipe' in html.lower()
    
    print(f"Has NuxtLink: {has_nuxt_link}")
    print(f"Has 'recipe' text: {has_recipe}")
    
    # Get body text
    body_text = page.locator('body').inner_text()
    print(f"\nBody text preview (500 chars):")
    print(body_text[:500])
    
    # List all links
    links = page.locator('a').all()
    print(f"\nTotal links on page: {len(links)}")
    for link in links[:10]:
        href = link.get_attribute('href')
        text = link.inner_text()[:30]
        print(f"  - {text}: {href}")
    
    # Check for loading state
    loading = page.locator('[class*="loading"], [class*="skeleton"], [class*="pulse"]').count()
    print(f"\nLoading/skeleton elements: {loading}")
    
    # Screenshot
    page.screenshot(path='/root/code/recipe-app/web/screenshots/mobile_375_dom.png', full_page=True)
    print("\nScreenshot saved")
    
    browser.close()
