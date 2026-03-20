#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import os
import json

SCREENSHOT_DIR = "/root/code/recipe-app/web/test-screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def test_mobile_layout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 375, "height": 812},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = context.new_page()
        
        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        
        pages_to_test = [
            ("Homepage", "http://localhost:3000"),
            ("Recipe Detail", "http://localhost:3000/recipes/1"),
            ("Admin", "http://localhost:3000/admin"),
        ]
        
        results = []
        for name, url in pages_to_test:
            print(f"\nTesting: {name}")
            print(f"URL: {url}")
            
            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(1000)
                
                screenshot_path = f"{SCREENSHOT_DIR}/375px_{name.lower().replace(' ', '_')}.png"
                page.screenshot(path=screenshot_path, full_page=True)
                print(f"Screenshot: {screenshot_path}")
                
                viewport_width = page.viewport_size["width"] if page.viewport_size else 375
                content_width = page.evaluate("document.documentElement.scrollWidth")
                has_overflow = content_width > viewport_width
                
                issues = []
                nav_count = page.locator("[role='navigation']").count()
                if nav_count > 0:
                    issues.append(f"Navigation elements: {nav_count}")
                if has_overflow:
                    issues.append(f"Horizontal overflow: {content_width}px > {viewport_width}px")
                
                h_elements = page.locator("h1, h2")
                main_heading = (h_elements.first.text_content() or "No heading")[:50] if h_elements.count() > 0 else "No heading"
                
                results.append({
                    "name": name,
                    "url": url,
                    "screenshot": screenshot_path,
                    "viewport": viewport_width,
                    "content_width": content_width,
                    "has_overflow": has_overflow,
                    "issues": issues,
                    "main_heading": main_heading
                })
                
                print(f"Viewport: {viewport_width}px, Content: {content_width}px")
                print(f"Heading: {main_heading[:50]}")
                for issue in issues:
                    print(f"  - {issue}")
                        
            except Exception as e:
                print(f"Error: {e}")
                results.append({"name": name, "url": url, "error": str(e)})
        
        browser.close()
        
        results_path = f"{SCREENSHOT_DIR}/mobile_test_results.json"
        with open(results_path, "w") as f:
            json.dump(results, f, indent=2)
        print(f"\nResults: {results_path}")
        
        return results

if __name__ == "__main__":
    print("Testing mobile layout at 375px...")
    test_mobile_layout()
