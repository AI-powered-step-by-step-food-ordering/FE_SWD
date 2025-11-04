import AdminLayout from '@/components/admin/AdminLayout';
import ClientBowlTemplates from './components/ClientBowlTemplates';

export default function BowlTemplatesPage() {
  return (
    <AdminLayout title="Bowl Templates Management">
      <ClientBowlTemplates />
    </AdminLayout>
  );
}