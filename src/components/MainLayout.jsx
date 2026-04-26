import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'

export function MainLayout({ children, title, breadcrumb }) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <TopHeader title={title} breadcrumb={breadcrumb} />
      <main className="p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}
