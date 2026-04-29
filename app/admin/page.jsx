import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import AdminDashboard from './dashboard.jsx'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }
  return <AdminDashboard username={session.username} />
}
