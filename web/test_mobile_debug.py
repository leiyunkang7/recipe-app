from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 375, 'height': 812})
    
    print("Testing: Home page at 375px")
    page.goto('http://localhost:3000', wait_until='networkidle', timeout=30000)
    page.wait_for_timeout(3000)
    
    # Check for horizontal overflow
    body_width = page.evaluate('document.body.scrollWidth')
    viewport_width = page.evaluate('window.innerWidth')
    print(f"Body width: {body_width}, Viewport: {viewport_width}")
    print(f"Horizontal overflow: {body_width > viewport_width}")
    
    # Check specific elements
    hero = page.locator('header.md\\:hidden').first
    if hero.is_visible():
        print("Hero section: VISIBLE")
        box = hero.bounding_box()
        print(f"Hero box: {box}")
    
    # Check cards
    cards = page.locator('.recipe-card-enter, [class*="rounded-2xl"]').all()
    print(f"Card-like elements found: {len(cards)}")
    
    # Check bottom nav
    nav = page.locator('nav.md\\:hidden').first
    if nav.is_visible():
        print("Mobile nav: VISIBLE")
        box = nav.bounding_box()
        print(f"Nav box: {box}")
        
    # Take screenshot
    page.screenshot(path='/root/code/recipe-app/web/screenshots/mobile_375_debug.png', full_page=False)
    print("Screenshot saved")
    
    browser.close()
