#!/bin/bash

cd "$(dirname "$0")/.."

echo "=== i18n Check ==="
echo ""

# 1. Check for hardcoded Chinese strings in Vue templates
echo "1. Checking hardcoded Chinese strings..."

chinese_result=$(grep -rnP --include="*.vue" \
  --exclude-dir=node_modules \
  '[\p{Han}]+' app/ 2>/dev/null | \
  grep -vP "t\s*\(\s*['\"]" | \
  grep -v "locales/" | \
  grep -v "^\s*//" | \
  grep -v "<!--" || true)

if [ -z "$chinese_result" ]; then
  echo "   ✅ No hardcoded Chinese strings found!"
else
  echo "   ❌ Found hardcoded Chinese strings:"
  echo "$chinese_result"
  exit 1
fi

echo ""

# 2. Check for missing keys using Node.js
echo "2. Checking missing translation keys..."

node << 'NODESCRIPT'
const fs = require('fs');

// Load both locale files
const zhCN = JSON.parse(fs.readFileSync('i18n/locales/zh-CN.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('i18n/locales/en.json', 'utf8'));

function flattenKeys(obj, prefix = '') {
  let keys = new Set();
  for (const key in obj) {
    const fullKey = prefix ? prefix + '.' + key : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      flattenKeys(obj[key], fullKey).forEach(k => keys.add(k));
    } else {
      keys.add(fullKey);
    }
  }
  return keys;
}

const zhKeys = flattenKeys(zhCN);
const enKeys = flattenKeys(en);

// Check sync between locales
const missingInEn = [...zhKeys].filter(k => !enKeys.has(k));
const missingInZh = [...enKeys].filter(k => !zhKeys.has(k));

let hasError = false;

if (missingInEn.length > 0) {
  console.log('   ❌ Keys in zh-CN but missing in en.json:');
  missingInEn.forEach(k => console.log('      ' + k));
  hasError = true;
}

if (missingInZh.length > 0) {
  console.log('   ❌ Keys in en.json but missing in zh-CN.json:');
  missingInZh.forEach(k => console.log('      ' + k));
  hasError = true;
}

// Check used keys in code
const { execSync } = require('child_process');
const definedKeys = zhKeys;

let usedKeys = [];
try {
  const codeOutput = execSync(
    `grep -rohE "\\\\bt\\\\('[^']+'" app/ | sed "s/t('//" | sed "s/'$//" | sort -u`,
    { encoding: 'utf8' }
  );
  usedKeys = codeOutput.trim().split('\n')
    .filter(k => k && k !== '.' && !k.includes('('));
} catch (e) {
  // No matches
}

const missingKeys = usedKeys.filter(k => !definedKeys.has(k));

if (missingKeys.length > 0) {
  console.log('   ❌ Keys used in code but not defined in locale:');
  missingKeys.forEach(k => console.log('      ' + k));
  hasError = true;
}

if (!hasError) {
  console.log('   ✅ All translation keys are in sync!');
  console.log('      Defined: ' + zhKeys.size + ' keys');
  console.log('      Used: ' + usedKeys.length + ' keys');
}

process.exit(hasError ? 1 : 0);
NODESCRIPT

node_exit=$?

echo ""
echo "=== i18n Check Complete ==="

exit $node_exit
