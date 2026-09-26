import Link from 'next/link';

export default function AdminLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 text-gray-900">
      <aside className="w-64 bg-[#0F2547] text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-gray-700">Anglo Panel</div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="block px-4 py-2 rounded hover:bg-[#00fc82] hover:text-[#0F2547] transition-colors">Dashboard</Link>
          <Link href="/admin/crud" className="block px-4 py-2 rounded hover:bg-[#00fc82] hover:text-[#0F2547] transition-colors">Inventario (CRUD)</Link>
          <Link href="/" className="block px-4 py-2 rounded hover:bg-red-500 mt-8 transition-colors">← Salir a Tienda</Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}

