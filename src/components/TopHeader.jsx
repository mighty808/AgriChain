export function TopHeader({ title, breadcrumb }) {
  return (
    <header className="border-b border-gray-200 px-8 py-6">
      <nav className="text-sm flex items-center gap-2 text-gray-600">
        {breadcrumb && (
          <>
            {breadcrumb.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && <span className="text-gray-400">/</span>}
                <span className={idx === breadcrumb.length - 1 ? 'text-gray-900 font-medium' : ''}>
                  {item}
                </span>
              </div>
            ))}
          </>
        )}
      </nav>
    </header>
  )
}
