// src/components/dashboard/docente/SubirClaseDrawer.jsx

import { useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'; // Asegúrate que la ruta a tu cliente sea correcta
import { IoClose } from 'react-icons/io5';

export default function SubirClaseDrawer({ visible, onClose, rutasDisponibles, onClaseCreada }) {
  // --- ESTADOS DEL FORMULARIO ---
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [rutaId, setRutaId] = useState('');
  const [videoFile, setVideoFile] = useState(null); // Estado para el archivo de video
  const [isUploading, setIsUploading] = useState(false); // Estado para feedback de carga

  const supabase = useSupabaseClient();
  const user = useUser();


  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rutaId || !videoFile) {
      alert('Por favor, completa todos los campos y selecciona un video.');
      return;
    }

    setIsUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    // 3. LA VERIFICACIÓN DEL USUARIO AHORA ES SÍNCRONA Y MÁS LIMPIA
    if (!user) {
      setIsUploading(false);
      setFeedback({ type: 'error', message: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.' });
      return;
    }
    
    // 1. Subir el video a Supabase Storage
    const fileExt = videoFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('videos-clases') // El nombre de tu bucket
      .upload(filePath, videoFile);

    if (uploadError) {
      setIsUploading(false);
      alert('Error al subir el video: ' + uploadError.message);
      return;
    }

    // 2. Obtener la URL pública del video subido
    const { data: { publicUrl } } = supabase.storage
      .from('videos-clases')
      .getPublicUrl(filePath);

    // 3. Guardar la información de la clase en la base de datos
    const { data: nuevaClase, error: insertError } = await supabase
      .from('clases')
      .insert({ titulo, descripcion, video_url: publicUrl, ruta_id: rutaId })
      .select('*, rutas(nombre)') // Pedimos el nombre de la ruta para actualizar la UI correctamente
      .single();

    setIsUploading(false);

    if (insertError) {
      alert('Error al guardar la clase: ' + insertError.message);
    } else {
      onClaseCreada(nuevaClase);
      onClose();
      // Limpiar el formulario para la próxima vez
      setTitulo('');
      setDescripcion('');
      setRutaId('');
      setVideoFile(null);
      // Es buena práctica resetear también el input del DOM
      e.target.reset(); 
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Subir nueva clase</h2>
        <button onClick={onClose} className='p-1 rounded-full hover:text-red-600 hover:bg-red-100 transition-colors'>
          <IoClose size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 h-full overflow-y-auto pb-20">
        <div>
          <label htmlFor="titulo" className="block font-medium text-gray-700">Título de la clase</label>
          <input
            id="titulo"
            type="text"
            className="w-full mt-1 border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="descripcion" className="block font-medium text-gray-700">Descripción</label>
          <textarea
            id="descripcion"
            className="w-full mt-1 border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          ></textarea>
        </div>

        <div>
          <label htmlFor="ruta" className="block font-medium text-gray-700">Ruta asignada</label>
          <select
            id="ruta"
            className="w-full mt-1 border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={rutaId}
            onChange={(e) => setRutaId(e.target.value)}
            required
          >
            <option value="" disabled>Selecciona una ruta...</option>
            {rutasDisponibles.map(ruta => (
              <option key={ruta.id} value={ruta.id}>{ruta.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="videoFile" className="block font-medium text-gray-700">Video de la clase</label>
          <input
            id="videoFile"
            type="file"
            accept="video/mp4,video/quicktime,video/x-ms-wmv,video/webm"
            onChange={handleFileChange}
            className="w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
        </div>

        <div className="pt-4">
            <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
            >
            {isUploading ? 'Subiendo video...' : 'Subir Clase'}
            </button>
        </div>
      </form>
    </div>
  );
}