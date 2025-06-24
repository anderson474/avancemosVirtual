// components/dashboard/SlidebarAlumno.jsx
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { UserCircle2, LayoutDashboard, LogOut } from 'lucide-react';

export default function SlidebarAlumno({ nombreUsuario, onLogout }) {
  const router = useRouter();

  const navLinks = [
    {
      name: 'Inicio',
      href: '/Dashboard/alumno',
      icon: <LayoutDashboard className="h-5 w-5 mr-2" />,
    },
    {
      name: 'Mi Perfil',
      href: '/perfil',
      icon: <UserCircle2 className="h-5 w-5 mr-2" />,
    },
  ];

  return (
    <aside className="w-64 bg-white shadow-xl flex flex-col h-screen border-r border-gray-200">
      <div className="p-6 text-center border-b border-gray-100">
        <Image
          src="/logo.ico"
          width={120}
          height={60}
          alt="Logo de la Empresa"
          className="mx-auto"
        />
      </div>

      <nav className="flex-grow px-4 py-6">
        <ul className="space-y-2">
          {navLinks.map(({ name, href, icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  router.pathname === href
                    ? 'bg-[--color-verde]/10 text-[--color-verde] font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {icon}
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
