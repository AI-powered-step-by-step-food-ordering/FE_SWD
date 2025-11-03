import type { Ingredient, Category } from '@/types/api.types';

/**
 * Server loader to fetch initial ingredients and categories for SSR.
 * Assumption: the project exposes the API under /api. We fall back to localhost
 * when NEXT_PUBLIC_SITE_URL is not set to make local dev predictable.
 */
export default async function getServerData(): Promise<{ ingredients: Ingredient[]; categories: Category[] }> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  try {
    const [ingsRes, catsRes] = await Promise.all([
      fetch(`${base}/api/ingredients/active`, { cache: 'no-store' }),
      fetch(`${base}/api/categories/getall`, { cache: 'no-store' }),
    ]);

    const ingsJson = ingsRes.ok ? await ingsRes.json() : null;
    const catsJson = catsRes.ok ? await catsRes.json() : null;

    // The API shape in this repo often returns { success, data }.
    const ingredients: Ingredient[] = (ingsJson?.data ?? ingsJson) ?? [];
    // categories endpoint returns { data: Category[] } or similar nested shapes
    const categories: Category[] = (catsJson?.data?.data ?? catsJson?.data ?? catsJson) ?? [];

    return { ingredients, categories };
  } catch (err) {
    // On error, return empty arrays so page still renders.
    return { ingredients: [], categories: [] };
  }
}
