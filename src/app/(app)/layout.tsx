import { Sidebar } from '@/components/layout/sidebar'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar userRole={session.role} />
      <main className="flex-1 w-full overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
