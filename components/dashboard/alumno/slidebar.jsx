import Image from 'next/image';
import Link from 'next/link';
import { FaLanguage, FaClipboard, FaChalkboardTeacher, FaSignOutAlt } from 'react-icons/fa';

export default function Slidebar() {
  return (
    <div className="h-screen w-50 bg-white flex flex-col border-r border-gray-300 border-2">
      <div className="p-6 text-2xl font-bold">
        <Image
          src="/logo.ico"
          width={500}
          height={100}
          alt="Picture of the author"
        />
      </div>

      <nav className="flex-1 px-4">
        <a
          href="#"
          className="flex items-center py-2 rounded hover:bg-blue-50"
          style={{ color: 'rgb(45, 168, 54)' }}
        >
          <FaLanguage className="mr-2" /> Bilinguismo
        </a>
        <a
          href="#"
          className="flex items-center py-2 rounded hover:bg-blue-50"
          style={{ color: 'rgb(45, 168, 54)' }}
        >
          <FaClipboard className="mr-2" /> Pre-saber
        </a>
        <a
          href="#"
          className="flex items-center py-2 rounded hover:bg-blue-50"
          style={{ color: 'rgb(45, 168, 54)' }}
        >
          <FaChalkboardTeacher className="mr-2" /> Evaluación
        </a>
        <a
          href="#"
          className="flex items-center py-2 rounded hover:bg-blue-50"
          style={{ color: 'rgb(45, 168, 54)' }}
        >
          <FaChalkboardTeacher className="mr-2" /> Formación Continua
        </a>
        <a
          href="#"
          className="flex items-center py-2 rounded hover:bg-blue-50"
          style={{ color: 'rgb(45, 168, 54)' }}
        >
          <FaChalkboardTeacher className="mr-2" /> Educación inclusiva
        </a>
      </nav>

      {/* Botón de cierre de sesión al fondo */}
      <Link
        href="/"
        className="flex items-center px-4 py-4 rounded hover:bg-blue-50 mt-auto border-t border-gray-200"
        style={{ color: 'rgb(45, 168, 54)' }}
      >
        <FaSignOutAlt className="mr-2" /> Cerrar sesión
      </Link>
    </div>
  );
}