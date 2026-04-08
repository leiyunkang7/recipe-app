const fs = require('fs');
const original = fs.readFileSync('/home/k/code/recipe-app/web/server/api/my-recipes/index.ts', 'utf8');
let content = original;
const oldQuerySection = 'const query = getQuery(event);\n  const page = parseInt';
console.log('Old section length:', oldQuerySection.length);
console.log('Old section bytes:', JSON.stringify(oldQuerySection));
