from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 375, 'height': 812},
        has_touch=True
    )
    page = context.new_page()
    
    print("=" * 50)
    print("MOBILE 375px LAYOUT ANALYSIS")
    print("=" * 50)
    
    # Test 1: Home page
    print("\n[1] Testing Home Page...")
    page.goto('http://localhost:3000', wait_until='networkidle', timeout=30000)
    page.wait_for_timeout(2000)
    
    # Get all visible text
    title = page.title()
    print(f"Page title: {title}")
    
    # Check hero elements
    hero_title = page.locator('h1').first
    if hero_title.is_visible():
        print(f"Hero title: '{hero_title.inner_text()[:50]}'")
    
    # Check for recipe cards (by NuxtLink to recipes)
    recipe_links = page.locator('a[href*="/recipes/"]').all()
    print(f"Recipe links found: {len(recipe_links)}")
    
    # Check category buttons
    cat_buttons = page.locator('button:has-text("全部分类")').count()
    print(f"Category filter visible: {cat_buttons > 0}")
    
    # Check bottom nav
    nav_items = page.locator('nav >> text=首页').count()
    print(f"Bottom nav visible: {nav_items > 0}")
    
    # Full page screenshot
    page.screenshot(path='/root/code/recipe-app/web/screenshots/mobile_375_home_v2.png', full_page=True)
    
    # Test 2: Navigate to a recipe
    if recipe_links:
        print("\n[2] Testing Recipe Detail Page...")
        recipe_links[0].click()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        
        # Check recipe title
        h1 = page.locator('h1').first
        if h1.is_visible():
            print(f"Recipe title: '{h1.inner_text()[:50]}'")
        
        # Check ingredients
        ingredients = page.locator('text=食材').count()
        print(f"Ingredients section: {ingredients > 0}")
        
        # Check steps
        steps = page.locator('text=步骤').count()
        print(f"Steps section: {steps > 0}")
        
        # Take detail screenshot
        page.screenshot(path='/root/code/recipe-app/web/screenshots/mobile_375_detail.png', full_page=False)
        
        # Test 3: Check for touch targets
        print("\n[3] Testing Touch Targets...")
        buttons = page.locator('button').all()
        small_buttons = []
        for btn in buttons:
            box = btn.bounding_box()
            if box and (box['width'] < 44 or box['height'] < 44):
                small_buttons.append({
                    'text': btn.inner_text()[:30],
                    'width': box['width'],
                    'height': box['height']
                })
        
        print(f"Buttons smaller than 44px touch target: {len(small_buttons)}")
        for btn in small_buttons[:5]:  # Show first 5
            print(f"  - '{btn['text']}' ({btn['width']:.0f}x{btn['height']:.0f}px)")
    
    print("\n" + "=" * 50)
    print("TEST COMPLETE")
    print("=" * 50)
    
    browser.close()
