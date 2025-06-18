// components/dashboard/alumno/SlidebarAlumno.jsx
import Link from 'next/link';
import Image from 'next/image';

export default function SlidebarAlumno({ nombreUsuario, onLogout }) {
  return (
    <aside className="w-64 bg-white shadow-xl flex flex-col h-screen">
      <div className="p-6 text-center">
        <Image src="/logo.ico" width={150} height={80} alt="Logo de la Empresa" className="mx-auto" />
      </div>
      
      <nav className="flex-grow p-4">
        <ul>
          <li>
            <Link href="/Dashboard/alumno" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold">
              {/* Puedes añadir un ícono aquí */}
              <span>🏠 Mi Panel</span>
            </Link>
          </li>
          <li>
            <Link href="/perfil" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100">
              {/* Puedes añadir un ícono aquí */}
              <span>👤 Mi Perfil</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-300">
        <p className="text-center text-sm text-gray-600 mb-2">Bienvenido,</p>
        <p className="text-center font-bold text-gray-800">{nombreUsuario}</p>
        <button
          onClick={onLogout}
          className="w-full mt-4 px-4 py-2 text-sm text-black bg-red-300 rounded-lg hover:bg-red-900 hover:text-white cursor-pointer transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}