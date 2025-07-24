import Image from "next/image";
import {
  FaLanguage,
  FaClipboard,
  FaChalkboardTeacher,
  FaSignOutAlt,
} from "react-icons/fa";
//bg-gradient-to-br from-gray-[#cbcbcb] from-50% to-white
//to-40%
export default function Slidebar({ onSelect }) {
  return (
    <div className="w-52 shadow-xl backdrop-blur-lg flex flex-col h-screen border-r border-gray-200 rounded-4xl">
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
          transition-colors text-lg text-black font-medium hover:bg-gray-100 cursor-pointer"
        >
          <FaLanguage className="h-5 w-5 mr-2" /> Crear rutas
        </button>
        <button
          onClick={() => onSelect("eliminarRuta")}
          className="flex items-center px-4 py-2 rounded-lg 
          transition-colors text-lg text-black font-medium hover:bg-gray-100 cursor-pointer"
        >
          <FaClipboard className="h-5 w-5 mr-2" /> Eliminar rutas
        </button>
        <button
          onClick={() => onSelect("subirClase")}
          className="flex items-center px-4 py-2 rounded-lg 
          transition-colors text-lg text-black font-medium hover:bg-gray-100 cursor-pointer"
        >
          <FaChalkboardTeacher className="h-5 w-5 mr-2" /> Subir clase
        </button>
        <button
          onClick={() => onSelect("eliminarClase")}
          className="flex items-center px-4 py-2 rounded-lg 
          transition-colors text-lg text-black  font-medium hover:bg-gray-100 cursor-pointer"
        >
          <FaChalkboardTeacher className="h-5 w-5 mr-2" /> Eliminar clase
        </button>
      </nav>
      <div className="p-4 border-gray-200">
        <a
          href="/"
          className="w-full border bg-red-500 hover:bg-white cursor-pointer 
           flex items-center justify-center hover:text-red-500
          px-4 py-2 text-sm text-white hover:shadow-2xl/30 hover:shadow-gray-700 rounded-lg"
        >
          <FaSignOutAlt className="h-5 w-5 mr-2" /> Cerrar sesión
        </a>
      </div>
    </div>
  );
}
