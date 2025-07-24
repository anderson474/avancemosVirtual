import Image from "next/image";
import {
  FaLanguage,
  FaClipboard,
  FaChalkboardTeacher,
  FaSignOutAlt,
} from "react-icons/fa";

export default function Slidebar({ onSelect }) {
  return (
    <div
      className="w-52 bg-gradient-to-br from-slate-400 from-10% to-white 
        to-40% shadow-xl flex flex-col h-screen border-r border-gray-200"
    >
      <div className="p-6 text-center border-gray-100">
        <Image
          src="/LOGO AVANCEMOS.png"
          width={120}
          height={60}
          alt="Logo de la Empresa"
          className="mx-auto"
        />
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <button
          onClick={() => onSelect("crearRuta")}
          className="flex items-center px-4 py-2 rounded-lg 
          transition-colors text-sm font-medium hover:bg-gray-100 cursor-pointer"
        >
          <FaLanguage className="h-5 w-5 mr-2" /> Crear rutas
        </button>
        <button
          onClick={() => onSelect("eliminarRuta")}
          className="flex items-center px-4 py-2 rounded-lg 
          transition-colors text-sm font-medium hover:bg-gray-100 cursor-pointer"
        >
          <FaClipboard className="h-5 w-5 mr-2" /> Eliminar rutas
        </button>
        <button
          onClick={() => onSelect("subirClase")}
          className="flex items-center px-4 py-2 rounded-lg 
          transition-colors text-sm font-medium hover:bg-gray-100 cursor-pointer"
        >
          <FaChalkboardTeacher className="h-5 w-5 mr-2" /> Subir clase
        </button>
        <button
          onClick={() => onSelect("eliminarClase")}
          className="flex items-center px-4 py-2 rounded-lg 
          transition-colors text-sm font-medium hover:bg-gray-100 cursor-pointer"
        >
          <FaChalkboardTeacher className="h-5 w-5 mr-2" /> Eliminar clase
        </button>
      </nav>
      <div className="p-4 border-gray-200">
        <a
          href="/"
          className="w-full border border-gray-300 shadow-lg cursor-pointer 
          transition-shadow duration-300 ease-in-out flex items-center justify-center 
          px-4 py-2 text-sm text-red-600 hover:bg-red-200 hover:shadow rounded-lg"
        >
          <FaSignOutAlt className="h-5 w-5 mr-2" /> Cerrar sesión
        </a>
      </div>
    </div>
  );
}
