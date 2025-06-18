// components/dashboard/Header.jsx
'use client'; // Sigue siendo necesario por el uso de hooks y la interactividad

import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function Header({ nombreUsuario, avatarUrl, onLogout }) {
  const router = useRouter();

  // Las funciones ahora son más simples, no necesitan manejar el estado del dropdown
  const goToProfile = () => {
    router.push('/perfil');
  };

  const handleLogoutClick = () => {
    onLogout();
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200">
      <h1 className="text-xl font-semibold text-gray-700">Mi Panel</h1>

      {/* El componente Menu reemplaza toda tu lógica manual */}
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="flex items-center space-x-3 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <span className="hidden md:inline text-gray-600 font-medium">{nombreUsuario}</span>
            <Image
              src={avatarUrl || '/default-avatar.jpg'}
              alt="Avatar"
              width={48}  // Ajustado a un tamaño más estándar para header
              height={48} // Ajustado a un tamaño más estándar para header
              className="h-20 w-20 rounded-full object-cover"
              unoptimized
            />
          </Menu.Button>
        </div>

        {/* El componente Transition añade la animación */}
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          {/* Menu.Items es el contenedor de las opciones */}
          <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <div className="px-1 py-1">
               <div className="px-3 py-2 text-sm text-gray-500">
                <p>Bienvenido,</p>
                <p className="font-semibold text-gray-800 truncate">{nombreUsuario}</p>
              </div>
            </div>
            <div className="px-1 py-1">
              {/* Cada opción es un Menu.Item */}
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={goToProfile}
                    className={`${
                      active ? 'bg-blue-500 text-white' : 'text-gray-900'
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    <span className="mr-2 h-5 w-5">👤</span>
                    Mi Perfil
                  </button>
                )}
              </Menu.Item>
            </div>
            <div className="px-1 py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogoutClick}
                    className={`${
                      active ? 'bg-red-500 text-white' : 'text-red-600'
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                     <span className="mr-2 h-5 w-5">🚪</span>
                    Cerrar Sesión
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </header>
  );
}