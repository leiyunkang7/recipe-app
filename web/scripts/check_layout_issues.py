#!/usr/bin/env python3
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True)
    page = context.new_page()
    
    print("=== HOMEPAGE ===")
    page.goto("http://localhost:3000", wait_until="networkidle")
    
    issues = []
    
    hero_text = page.locator("h1").first
    if hero_text.is_visible():
        text = hero_text.text_content()
        font_size = hero_text.evaluate("el => getComputedStyle(el).fontSize")
        print(f"Hero h1: '{text}' (font-size: {font_size})")
        if text and "Recipe App" in text:
            print("  ✓ Hero title visible")
    
    search_input = page.locator("input[type='text']").first
    if search_input.is_visible():
        input_width = search_input.evaluate("el => el.offsetWidth")
        input_padding = search_input.evaluate("el => getComputedStyle(el).paddingLeft")
        print(f"Search input width: {input_width}px, padding: {input_padding}")
    
    cards = page.locator("a[href*='/recipes/']")
    card_count = cards.count()
    print(f"Recipe cards visible: {card_count}")
    
    if card_count > 0:
        first_card = cards.first
        card_width = first_card.evaluate("el => el.offsetWidth")
        print(f"Card width: {card_width}px")
        if card_width < 160:
            issues.append(f"Card width too narrow: {card_width}px")
    
    bottom_nav = page.locator("nav").last
    if bottom_nav.is_visible():
        nav_height = bottom_nav.evaluate("el => el.offsetHeight")
        print(f"Bottom nav height: {nav_height}px")
    
    print("\n=== RECIPE DETAIL ===")
    page.goto("http://localhost:3000/recipes/1", wait_until="networkidle")
    page.wait_for_timeout(2000)
    
    back_btn = page.locator("a:has-text('返回')").first
    if back_btn.is_visible():
        print("✓ Back button visible")
    
    recipe_title = page.locator("h1").first
    if recipe_title.is_visible():
        title_text = recipe_title.text_content()
        title_width = recipe_title.evaluate("el => el.offsetWidth")
        font_size = recipe_title.evaluate("el => getComputedStyle(el).fontSize")
        print(f"Recipe title: '{(title_text or '')[:30]}...' (width: {title_width}px, font: {font_size})")
    
    info_cards = page.locator(".rounded-xl").filter(has=page.locator("text=时间"))
    info_count = info_cards.count()
    print(f"Info cards: {info_count}")
    
    ingredients = page.locator("li").filter(has=page.locator("input[type='checkbox'], [class*='rounded-md']"))
    ing_count = ingredients.count()
    print(f"Ingredient items: {ing_count}")
    
    print("\n=== ADMIN ===")
    page.goto("http://localhost:3000/admin", wait_until="networkidle")
    
    stats = page.locator(".rounded-xl").filter(has=page.locator("text=总"))
    stats_count = stats.count()
    print(f"Stats cards: {stats_count}")
    
    table = page.locator("table")
    if table.is_visible():
        table_width = table.evaluate("el => el.offsetWidth")
        container_width = table.evaluate("el => el.parentElement.offsetWidth")
        print(f"Table width: {table_width}px, Container: {container_width}px")
        if table_width > container_width:
            issues.append(f"Admin table overflows: table={table_width}px > container={container_width}px")
            print(f"  ⚠️  Table horizontal scroll needed")
    
    add_btn = page.locator("a:has-text('添加食谱')")
    if add_btn.is_visible():
        btn_text = add_btn.text_content()
        btn_width = add_btn.evaluate("el => el.offsetWidth")
        print(f"Add button: '{btn_text}' (width: {btn_width}px)")
    
    print("\n=== ISSUES SUMMARY ===")
    if issues:
        for issue in issues:
            print(f"  ⚠️  {issue}")
    else:
        print("  ✓ No major layout issues found")
    
    browser.close()
