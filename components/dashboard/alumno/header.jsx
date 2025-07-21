// components/dashboard/Header.jsx
'use client';

import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { LogOut, UserCircle2 } from 'lucide-react';
import Lottie from 'lottie-react';
import Bookloading  from "@public/animation/Bookloading.json"

export default function Header({ nombreUsuario, avatarUrl, onLogout }) {
  const router = useRouter();

  const goToProfile = () => {
    router.push('/perfil');
  };

  const handleLogoutClick = () => {
    onLogout();
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white">
      <h1 className="text-xl font-semibold text-gray-500">Mi Panel</h1>
      <div className="w-24 h-24 -mt-4">
          <Lottie 
            animationData={Bookloading} 
            loop={true} // Puedes ponerlo en false si quieres que se reproduzca una sola vez
          />
        </div>

      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="flex items-center space-x-3 rounded-full focus:outline-none focus:ring-2 
          focus:ring-offset-2 focus:ring-verde hover:outline-none hover:ring-2 hover:ring-offset-4 hover:ring-verde">
            <span className="hidden md:inline text-gray-600 font-medium">
              {nombreUsuario}
            </span>
            <Image
              src={avatarUrl || '/default-avatar.jpg'}
              alt="Avatar"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover border-2 border-verde"
              unoptimized
            />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 
          rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <div className="px-3 py-2 text-sm text-gray-500">
              <p>Bienvenido,</p>
              <p className="font-semibold text-gray-800 truncate">{nombreUsuario}</p>
            </div>
            <div className="px-1 py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={goToProfile}
                    className={'group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-blue-300'}
                  >
                    <UserCircle2 className="mr-2 h-5 w-5" />
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
                    className={'group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-red-300'}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
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