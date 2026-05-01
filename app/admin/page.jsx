import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import AdminDashboard from './dashboard.jsx'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const authed = await isAdminAuthenticated()
  if (!authed) {
    redirect('/admin/login')
  }
  return <AdminDashboard username="admin" />
}
