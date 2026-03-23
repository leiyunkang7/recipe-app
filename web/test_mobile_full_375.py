#!/usr/bin/env python3
"""
移动端 375px 全面测试脚本
检查所有主要页面的布局问题
"""

from playwright.sync_api import sync_playwright
import os

def check_mobile_375():
    screenshots_dir = '/root/code/recipe-app/web/screenshots/mobile_375'
    os.makedirs(screenshots_dir, exist_ok=True)
    
    results = {
        'pages': [],
        'issues': [],
        'overflow_elements': []
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 创建 375px 视口（模拟 iPhone SE）
        page = browser.new_page(viewport={'width': 375, 'height': 812})
        
        # 监听控制台错误
        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
        
        pages_to_test = [
            {'url': '/en', 'name': 'Homepage', 'path': 'homepage.png'},
            {'url': '/en/recipes/1', 'name': 'Recipe Detail', 'path': 'recipe_detail.png'},
            {'url': '/en/admin', 'name': 'Admin Dashboard', 'path': 'admin.png'},
        ]
        
        for page_info in pages_to_test:
            print(f"\n{'='*60}")
            print(f"Testing: {page_info['name']} ({page_info['url']})")
            print('='*60)
            
            try:
                page.goto(f'http://localhost:3000{page_info["url"]}', 
                         wait_until='networkidle', timeout=30000)
                page.wait_for_timeout(2000)  # 等待动画完成
                
                # 截图
                screenshot_path = f'{screenshots_dir}/{page_info["path"]}'
                page.screenshot(path=screenshot_path, full_page=True)
                print(f"📸 Screenshot saved: {screenshot_path}")
                
                # 检查水平溢出
                overflow_info = page.evaluate('''() => {
                    const body = document.body;
                    const html = document.documentElement;
                    const bodyWidth = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth);
                    const windowWidth = window.innerWidth;
                    
                    const overflowElements = [];
                    const allElements = document.querySelectorAll('*');
                    
                    allElements.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        const style = window.getComputedStyle(el);
                        
                        if (rect.right > windowWidth && 
                            style.display !== 'none' && 
                            style.visibility !== 'hidden' &&
                            parseFloat(style.opacity) > 0 &&
                            rect.width > 0) {
                            overflowElements.push({
                                tag: el.tagName,
                                class: el.className.substring(0, 80),
                                id: el.id || '',
                                right: Math.round(rect.right),
                                width: Math.round(rect.width),
                                parent: el.parentElement?.tagName || 'unknown'
                            });
                        }
                    });
                    
                    return {
                        bodyWidth,
                        windowWidth,
                        hasOverflow: bodyWidth > windowWidth,
                        overflowElements: overflowElements.slice(0, 10)
                    };
                }''')
                
                print(f"Window width: {overflow_info['windowWidth']}px")
                print(f"Body scroll width: {overflow_info['bodyWidth']}px")
                
                if overflow_info['hasOverflow']:
                    print("⚠️  HORIZONTAL OVERFLOW DETECTED!")
                    results['issues'].append({
                        'page': page_info['name'],
                        'type': 'overflow',
                        'details': f"Body width {overflow_info['bodyWidth']}px > Window {overflow_info['windowWidth']}px"
                    })
                    results['overflow_elements'].extend([{
                        'page': page_info['name'],
                        **elem
                    } for elem in overflow_info['overflowElements']])
                    
                    for elem in overflow_info['overflowElements'][:5]:
                        print(f"  - {elem['tag']}#{elem['id']} ({elem['class'][:50]}...): right={elem['right']}px")
                else:
                    print("✅ No horizontal overflow")
                
                # 检查字体大小
                font_sizes = page.evaluate('''() => {
                    const elements = document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6, li, td, th, input, label');
                    const smallFonts = [];
                    
                    elements.forEach(el => {
                        const style = window.getComputedStyle(el);
                        const fontSize = parseFloat(style.fontSize);
                        
                        // 检查正文文本是否小于 14px
                        if (fontSize > 0 && fontSize < 14 && 
                            style.display !== 'none' && 
                            style.visibility !== 'hidden' &&
                            style.display !== 'inline' &&
                            el.textContent.trim().length > 0) {
                            smallFonts.push({
                                tag: el.tagName,
                                text: el.textContent.trim().substring(0, 40),
                                fontSize: fontSize,
                                class: el.className.substring(0, 40)
                            });
                        }
                    });
                    
                    return smallFonts.slice(0, 10);
                }''')
                
                if font_sizes:
                    print(f"⚠️  Found {len(font_sizes)} elements with font-size < 14px")
                    for font in font_sizes[:3]:
                        print(f"  - {font['tag']}: {font['fontSize']}px - '{font['text'][:30]}...'")
                
                # 检查按钮大小（触摸目标）
                buttons = page.evaluate('''() => {
                    const btns = document.querySelectorAll('button, a, [role="button"]');
                    const smallTouchTargets = [];
                    
                    btns.forEach(btn => {
                        const rect = btn.getBoundingClientRect();
                        const style = window.getComputedStyle(btn);
                        
                        if (rect.width > 0 && rect.height > 0 &&
                            style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            (rect.width < 44 || rect.height < 44)) {
                            smallTouchTargets.push({
                                tag: btn.tagName,
                                text: btn.textContent.trim().substring(0, 30),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height),
                                class: btn.className.substring(0, 40)
                            });
                        }
                    });
                    
                    return smallTouchTargets.slice(0, 10);
                }''')
                
                if buttons:
                    print(f"⚠️  Found {len(buttons)} touch targets < 44x44px")
                    for btn in buttons[:3]:
                        print(f"  - {btn['tag']}: {btn['width']}x{btn['height']}px - '{btn['text'][:20]}'")
                
                results['pages'].append({
                    'name': page_info['name'],
                    'status': 'success',
                    'overflow': overflow_info['hasOverflow']
                })
                
            except Exception as e:
                print(f"❌ Error: {e}")
                results['pages'].append({
                    'name': page_info['name'],
                    'status': 'error',
                    'error': str(e)
                })
        
        # 测试导航菜单
        print(f"\n{'='*60}")
        print("Testing Navigation Menu")
        print('='*60)
        
        page.goto('http://localhost:3000/en', wait_until='networkidle')
        page.wait_for_timeout(1000)
        
        # 检查底部导航是否存在
        bottom_nav = page.locator('nav[role="navigation"]').first
        if bottom_nav.is_visible():
            print("✅ Bottom navigation is visible")
        else:
            print("⚠️  Bottom navigation not visible")
            results['issues'].append({
                'page': 'Navigation',
                'type': 'missing_nav',
                'details': 'Bottom navigation not found'
            })
        
        # 截取移动端导航截图
        page.screenshot(path=f'{screenshots_dir}/nav_check.png')
        print(f"📸 Navigation screenshot: {screenshots_dir}/nav_check.png")
        
        browser.close()
        
        # 打印汇总
        print(f"\n{'='*60}")
        print("SUMMARY")
        print('='*60)
        print(f"Pages tested: {len(results['pages'])}")
        print(f"Pages with overflow: {sum(1 for p in results['pages'] if p.get('overflow'))}")
        print(f"Total issues: {len(results['issues'])}")
        
        if results['issues']:
            print("\nIssues found:")
            for issue in results['issues']:
                print(f"  - [{issue['page']}] {issue['type']}: {issue['details']}")
        
        if results['overflow_elements']:
            print(f"\nOverflow elements ({len(results['overflow_elements'])}):")
            for elem in results['overflow_elements'][:10]:
                print(f"  - [{elem['page']}] {elem['tag']}: right={elem['right']}px, class='{elem['class'][:40]}'")
        
        return results

if __name__ == '__main__':
    print("🔍 Starting Mobile 375px Test")
    print("="*60)
    results = check_mobile_375()
    print("\n✅ Test completed!")
