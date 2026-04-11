import { useDb } from '../utils/db';
import { recipes, categories, cuisines } from '@recipe-app/database';

export default defineSitemapEventHandler(async (_event) => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.siteUrl || 'http://localhost:3000';

  const db = useDb();

  const [recipeRows, categoryRows, cuisineRows] = await Promise.all([
    db.select({
      id: recipes.id,
      title: recipes.title,
      updatedAt: recipes.updatedAt,
      imageUrl: recipes.imageUrl,
    }).from(recipes).limit(5000),
    db.select({
      name: categories.name,
    }).from(categories).limit(100),
    db.select({
      name: cuisines.name,
    }).from(cuisines).limit(100),
  ]);

  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    {
      loc: baseUrl,
      lastmod: today,
      priority: 1.0,
      changefreq: 'daily' as const,
      alternatives: [
        { hreflang: 'zh-CN', href: `${baseUrl}/zh-CN` },
        { hreflang: 'en', href: `${baseUrl}/en` },
        { hreflang: 'ja', href: `${baseUrl}/ja` },
      ],
    },
  ];

  const categoryUrls = categoryRows.map((cat) => {
    const slug = cat.name.toLowerCase().replace(/\s+/g, '-');
    const zhUrl = `${baseUrl}/categories/${slug}`;
    const enUrl = `${baseUrl}/en/categories/${slug}`;
    const jaUrl = `${baseUrl}/ja/categories/${slug}`;
    return {
      loc: zhUrl,
      lastmod: today,
      priority: 0.7,
      changefreq: 'weekly' as const,
      alternatives: [
        { hreflang: 'zh-CN', href: zhUrl },
        { hreflang: 'en', href: enUrl },
        { hreflang: 'ja', href: jaUrl },
      ],
    };
  });

  const cuisineUrls = cuisineRows.map((cuisine) => {
    const slug = cuisine.name.toLowerCase().replace(/\s+/g, '-');
    const zhUrl = `${baseUrl}/cuisines/${slug}`;
    const enUrl = `${baseUrl}/en/cuisines/${slug}`;
    const jaUrl = `${baseUrl}/ja/cuisines/${slug}`;
    return {
      loc: zhUrl,
      lastmod: today,
      priority: 0.7,
      changefreq: 'weekly' as const,
      alternatives: [
        { hreflang: 'zh-CN', href: zhUrl },
        { hreflang: 'en', href: enUrl },
        { hreflang: 'ja', href: jaUrl },
      ],
    };
  });

  const recipeUrls = recipeRows.map((recipe) => {
    const lastmod = recipe.updatedAt?.toISOString().split('T')[0] || today;
    const defaultUrl = `${baseUrl}/recipes/${recipe.id}`;
    const englishUrl = `${baseUrl}/en/recipes/${recipe.id}`;
    const japaneseUrl = `${baseUrl}/ja/recipes/${recipe.id}`;
    const imageUrl = recipe.imageUrl
      ? recipe.imageUrl.startsWith('http')
        ? recipe.imageUrl
        : `${baseUrl}${recipe.imageUrl}`
      : undefined;

    return {
      loc: defaultUrl,
      lastmod,
      priority: 0.8,
      changefreq: 'weekly' as const,
      alternatives: [
        { hreflang: 'zh-CN', href: defaultUrl },
        { hreflang: 'en', href: englishUrl },
        { hreflang: 'ja', href: japaneseUrl },
      ],
      images: imageUrl
        ? [{ loc: imageUrl, caption: recipe.title || '', title: recipe.title || '' }]
        : [],
    };
  });

  return [...staticPages, ...categoryUrls, ...cuisineUrls, ...recipeUrls];
});
