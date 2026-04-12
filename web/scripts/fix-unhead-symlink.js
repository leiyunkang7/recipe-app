#!/usr/bin/env node
// Post-build fix for unhead symlink issue
// Nitro sometimes creates incomplete unhead@2.1.13 - fix symlink to use complete 2.1.12

import { existsSync, unlinkSync, symlinkSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const symlinkPath = join(rootDir, '.output/server/node_modules/unhead');
const goodPath = join(rootDir, '.output/server/node_modules/.nitro/unhead@2.1.12');
const badPath = join(rootDir, '.output/server/node_modules/.nitro/unhead@2.1.13');

try {
  const hasBad = existsSync(badPath) && existsSync(join(badPath, 'dist'));
  const badMissing = hasBad && !existsSync(join(badPath, 'dist/server.mjs'));
  const hasGood = existsSync(goodPath) && existsSync(join(goodPath, 'dist/server.mjs'));

  if (badMissing && hasGood) {
    if (existsSync(symlinkPath)) unlinkSync(symlinkPath);
    symlinkSync('.nitro/unhead@2.1.12', symlinkPath);
    console.log('✅ Fixed unhead symlink -> unhead@2.1.12 (server.mjs missing in 2.1.13)');
  } else if (!existsSync(symlinkPath) && hasGood) {
    symlinkSync('.nitro/unhead@2.1.12', symlinkPath);
    console.log('✅ Created unhead symlink -> unhead@2.1.12');
  } else if (existsSync(symlinkPath) && hasGood) {
    const linkTarget = readdirSync(join(rootDir, '.output/server/node_modules'), { encoding: 'utf8' })
      .includes('unhead@2.1.13') ? '2.1.13' : '2.1.12';
    console.log(`ℹ️  unhead symlink already points to ${linkTarget}`);
  }
} catch (e) {
  console.error('⚠️  unhead symlink fix failed:', e.message);
}
