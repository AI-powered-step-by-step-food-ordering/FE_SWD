import AdminLayout from "@/components/admin/AdminLayout";
import ClientCategories from './components/ClientCategories';

export default function CategoriesPage() {
  return (
    <AdminLayout title="Categories Management">
      <ClientCategories />
    </AdminLayout>
  );
}