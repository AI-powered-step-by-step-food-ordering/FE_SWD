import bowlTemplateService from '@/services/bowlTemplate.service';
import categoryService from '@/services/category.service';
import type { BowlTemplate, Category } from '@/types/api.types';

export async function getServerData(): Promise<{ templates: BowlTemplate[]; categories: Category[] }> {
  try {
    const [tplRes, catRes] = await Promise.all([
      bowlTemplateService.getAll(),
      categoryService.getAll(),
    ]);

    const templates: BowlTemplate[] = Array.isArray(tplRes.data)
      ? tplRes.data
      : [];

    const categories: Category[] = Array.isArray(catRes.data)
      ? catRes.data
      : (catRes.data?.content ?? []);

    return { templates, categories };
  } catch (err) {
    console.error('Server loader error (bowl-templates)', err);
    return { templates: [], categories: [] };
  }
}