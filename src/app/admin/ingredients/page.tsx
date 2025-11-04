import AdminLayout from '@/components/admin/AdminLayout';
import ClientIngredients from './components/ClientIngredients';

export default function IngredientsPage() {
  return (
    <AdminLayout title="Ingredients Management">
      <ClientIngredients />
    </AdminLayout>
  );
}
