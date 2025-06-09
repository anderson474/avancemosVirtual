import { useState } from 'react'
import { IoClose } from 'react-icons/io5'

export default function CrearRutaDrawer({ visible, onClose }) {
  const [nombre, setNombre] = useState('')
  const [nivel, setNivel] = useState('A1')
  const [idioma, setIdioma] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const nuevaRuta = {
      nombre,
      nivel,
      idioma,
      descripcion,
      fechaInicio,
    }
    console.log('Ruta creada:', nuevaRuta)
    onClose() // ciérralo al guardar
  }

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex justify-between items-center p-4">
        <h2 className="text-xl font-semibold">Crear nueva ruta</h2>
        <button onClick={onClose} className='cursor-pointer hover:text-red-700 hover:bg-red-300 hover:rounded-lg'>
          <IoClose size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block font-medium">Nombre de la ruta</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium">Nivel</label>
          <select
            className="w-full border border-gray-300 p-2 rounded cursor-pointer"
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
          >
            <option>Nivel Básico</option>
            <option>Nivel Intermedio</option>
            <option>Nivel Avanzado</option>
            
          </select>
        </div>

        <div>
          <label className="block font-medium">Idioma</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded"
            value={idioma}
            onChange={(e) => setIdioma(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium">Descripción</label>
          <textarea
            className="w-full border border-gray-300 p-2 rounded"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          ></textarea>
        </div>


        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Crear Ruta
        </button>
      </form>
    </div>
  )
}
