import Image from 'next/image'
import { FaLanguage, FaClipboard, FaChalkboardTeacher, FaSignOutAlt } from 'react-icons/fa'

export default function Slidebar({ onSelect }) {
  return (
    <div className="h-screen w-50 bg-white flex flex-col border-r border-gray-300 border-2">
      <div className="p-6 text-2xl font-bold">
        <Image src="/logo.ico" width={500} height={100} alt="Logo" />
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <button onClick={() => onSelect('crearRuta')} className="flex items-center py-2 w-full text-verde hover:text-azul cursor-pointer">
          <FaLanguage className="mr-2" /> Crear rutas
        </button>
        <button onClick={() => onSelect('eliminarRuta')} className="flex items-center py-2 w-full text-verde hover:text-azul cursor-pointer">
          <FaClipboard className="mr-2" /> Eliminar rutas
        </button>
        <button onClick={() => onSelect('subirClase')} className="flex items-center py-2 w-full text-verde hover:text-azul cursor-pointer">
          <FaChalkboardTeacher className="mr-2" /> Subir clase
        </button>
        <button onClick={() => onSelect('eliminarClase')} className="flex items-center py-2 w-full text-verde hover:text-azul cursor-pointer">
          <FaChalkboardTeacher className="mr-2" /> Eliminar clase
        </button>
      </nav>

      <a href="/" className="flex items-center px-4 py-4 mt-auto text-verde hover:text-azul border-t border-gray-200 cursor-pointer">
        <FaSignOutAlt className="mr-2" /> Cerrar sesión
      </a>
    </div>
  )
}
