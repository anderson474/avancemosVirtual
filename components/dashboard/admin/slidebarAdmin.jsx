// components/dashboard/admin/SlidebarAdmin.jsx
import Link from 'next/link';
import Image from 'next/image';

export default function SlidebarAdmin({ onLogout }) {
  return (
    <aside className="w-64 bg-white text-black shadow-xl flex flex-col h-screen">
      <div className="p-6 text-center border-b border-gray-700">
        <Image src="/logo.ico" width={100} height={50} alt="Logo" className="mx-auto" />
        <p className="mt-2 text-xs text-verde font-semibold tracking-wider">PANEL DE ADMINISTRADOR</p>
      </div>
      
      <nav className="flex-grow p-4">
        <ul>
          <li>
            <Link href="/Dashboard/admin" className="flex items-center p-3 rounded-lg hover:bg-gray-700 font-semibold">
              <span>📊 Dashboard</span>
            </Link>
          </li>
          <li>
            <Link href="/Dashboard/admin/usuarios" className="flex items-center p-3 rounded-lg hover:bg-gray-700">
               <span>👥 Gestión de Usuarios</span>
            </Link>
          </li>
           <li>
            <Link href="/Dashboard/admin/rutas" className="flex items-center p-3 rounded-lg hover:bg-gray-700">
               <span>📚 Gestión de Rutas</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full mt-4 px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}