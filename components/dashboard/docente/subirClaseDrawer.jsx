import { useState } from 'react'
import { IoClose } from 'react-icons/io5'

export default function SubirClaseDrawer({ visible, onClose }) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [rutaAsignada, setRutaAsignada] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const nuevaClase = {
      titulo,
      descripcion,
      rutaAsignada,
      videoUrl
    }
    console.log('Clase subida:', nuevaClase)
    onClose()
  }

  return (
    <div className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex justify-between items-center p-4">
        <h2 className="text-xl font-semibold">Subir nueva clase</h2>
        <button onClick={onClose} className="cursor-pointer hover:text-red-700 hover:bg-red-300 hover:rounded-lg">
          <IoClose size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block font-medium">Título de la clase</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
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

        <div>
          <label className="block font-medium">Ruta asignada</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded"
            value={rutaAsignada}
            onChange={(e) => setRutaAsignada(e.target.value)}
            placeholder="Ej: Inglés Básico"
            required
          />
        </div>

        <div>
          <label className="block font-medium">URL del video</label>
          <input
            type="url"
            className="w-full border border-gray-300 p-2 rounded"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://..."
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Subir Clase
        </button>
      </form>
    </div>
  )
}
