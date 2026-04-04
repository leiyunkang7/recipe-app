const fs = require('fs');
const content = fs.readFileSync('/root/.openclaw/workspace/recipe-app/web/app/components/RecipeGrid.vue', 'utf8');

// Remove unused ColumnState interface
let modified = content.replace(/\n\/\/ 列高度追踪（用于平衡分布）\ninterface ColumnState \{\n  recipes: RecipeListItem\[\]\n  totalHeight: number\n\}\n/g, '\n');

// Remove unused cleanupElementObserver function
modified = modified.replace(/\n\/\/ 清理指定元素的测量缓存\nconst cleanupElementObserver = \(el: HTMLElement\) => \{\n  measuredHeights\.delete\(el\)\n  pendingMeasures\.delete\(el\)\n  elementsBeingObserved\.delete\(el\)\n  lruMap\.delete\(el\)\n\}\n/g, '\n');

fs.writeFileSync('/root/.openclaw/workspace/recipe-app/web/app/components/RecipeGrid.vue', modified);
console.log('RecipeGrid.vue cleaned up successfully');