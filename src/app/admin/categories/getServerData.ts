import type { Category } from '@/types/api';

export default async function getServerData(): Promise<{ categories: Category[] }> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${base}/api/categories/getall`, { cache: 'no-store' });
    const json = res.ok ? await res.json() : null;
    const categories: Category[] = (json?.data?.data ?? json?.data ?? json) ?? [];
    return { categories };
  } catch (err) {
    return { categories: [] };
  }
}