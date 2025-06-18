// components/dashboard/alumno/SlidebarAlumno.jsx
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function SlidebarAlumno({ nombreUsuario, onLogout }) {
  const router = useRouter();
  const isActive = router.pathname === '/MiPerfil'; // o el href del link
  return (
    <aside className="w-64 bg-white shadow-xl flex flex-col h-screen">
      <div className="p-6 text-center">
        <Image src="/logo.ico" width={150} height={80} alt="Logo de la Empresa" className="mx-auto" />
      </div>
      
      <nav className="flex-grow p-4">
        <ul>
          <li>
            <Link 
              href="/MiPerfil" 
              className={`flex items-center ... ${isActive ? 'bg-blue-100 text-blue-600 font-bold' : 'text-gray-700'}`}
            >
            </Link>
            <span>👤 Home</span>
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
        
        <button
          onClick={onLogout}
          className="w-full mt-4 px-4 py-2 text-sm text-red-600 bg-transparent hover:bg-red-50 cursor-pointer transition-colors rounded-lg"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}