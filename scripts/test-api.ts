#!/usr/bin/env bun
const response = await fetch('http://localhost:3000/api/recipes?limit=3', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; BackfillScript/1.0)',
    'Accept': 'application/json',
  }
});
const text = await response.text();
console.log('Status:', response.status);
console.log('First 500 chars:', text.slice(0, 500));
try {
  const data = JSON.parse(text);
  console.log('Keys:', Object.keys(data));
  console.log('Recipe count:', Array.isArray(data.data) ? data.data.length : 'not array');
} catch(e) {
  console.log('JSON parse error:', e);
}
