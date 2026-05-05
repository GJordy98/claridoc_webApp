import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AutoRefresh from '@/components/AutoRefresh';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const role = cookieStore.get('claridoc_role')?.value;

  if (!role || !['BOSS', 'ADMIN'].includes(role)) {
    redirect('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar role={role as 'BOSS' | 'ADMIN'} />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <AutoRefresh intervalMs={15000} />
        {children}
      </main>
    </div>
  );
}
