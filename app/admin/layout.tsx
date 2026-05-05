import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AutoRefresh from '@/components/AutoRefresh';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const role = cookieStore.get('claridoc_role')?.value;

  if (role !== 'SUPERADMIN') {
    redirect('/login');
  }

  return (
    <div className="admin-theme" style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
      <Sidebar role="SUPERADMIN" />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <AutoRefresh intervalMs={15000} />
        {children}
      </main>
    </div>
  );
}
