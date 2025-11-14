import AdminLayout from '@/components/admin/AdminLayout';
import ClientIngredients from './components/ClientIngredients';
import getServerData from './getServerData';

export default async function IngredientsPage() {
  const { ingredients, categories } = await getServerData();
  return (
    <AdminLayout title="Ingredients Management">
      <ClientIngredients initialIngredients={ingredients} initialCategories={categories} />
    </AdminLayout>
  );
}
