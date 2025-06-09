import { IoClose } from 'react-icons/io5'

export default function EliminarClaseDrawer({ visible, onClose }) {
  // Más adelante esto se puede conectar a Supabase
  const clasesDummy = [
    { id: 1, titulo: 'Clase 1 - Presentaciones' },
    { id: 2, titulo: 'Clase 2 - Verbos básicos' },
    { id: 3, titulo: 'Clase 3 - Saludos y despedidas' },
  ]

  const eliminarClase = (id) => {
    console.log(`Clase con ID ${id} eliminada`)
    // Aquí conectas a Supabase más adelante
  }

  return (
    <div className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex justify-between items-center p-4">
        <h2 className="text-xl font-semibold">Eliminar clase</h2>
        <button onClick={onClose} className="cursor-pointer hover:text-red-700 hover:bg-red-300 hover:rounded-lg">
          <IoClose size={24} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {clasesDummy.map((clase) => (
          <div key={clase.id} className="flex justify-between items-center border-b pb-2">
            <span>{clase.titulo}</span>
            <button
              onClick={() => eliminarClase(clase.id)}
              className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
