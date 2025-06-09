import { IoClose } from 'react-icons/io5'

export default function EliminarRutaDrawer({ visible, onClose }) {
  // Dummy data por ahora — luego se trae de Supabase
  const rutas = [
    { id: 1, nombre: 'Inglés A1', nivel: 'Básico', idioma: 'Inglés' },
    { id: 2, nombre: 'Francés B1', nivel: 'Intermedio', idioma: 'Francés' },
    { id: 3, nombre: 'Portugués A2', nivel: 'Básico', idioma: 'Portugués' },
  ]

  const eliminarRuta = (id) => {
    console.log(`Ruta con ID ${id} eliminada`)
    // Aquí llamaremos a Supabase después
  }

  return (
    <div className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex justify-between items-center p-4">
        <h2 className="text-xl font-semibold">Eliminar ruta</h2>
        <button onClick={onClose} className="cursor-pointer hover:text-red-700 hover:bg-red-300 hover:rounded-lg">
          <IoClose size={24} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {rutas.length === 0 ? (
          <p className="text-gray-600">No hay rutas disponibles.</p>
        ) : (
          rutas.map((ruta) => (
            <div key={ruta.id} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-semibold">{ruta.nombre}</p>
                <p className="text-sm text-gray-500">{ruta.nivel} - {ruta.idioma}</p>
              </div>
              <button
                onClick={() => eliminarRuta(ruta.id)}
                className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
