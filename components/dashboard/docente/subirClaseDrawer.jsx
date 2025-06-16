// src/components/dashboard/docente/SubirClaseDrawer.jsx

import { useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { IoClose } from 'react-icons/io5';

export default function SubirClaseDrawer({ visible, onClose, rutasDisponibles, onClaseCreada }) {
  // --- ESTADOS DEL FORMULARIO ---
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [rutaId, setRutaId] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  
  // --- ESTADOS PARA LA EXPERIENCIA DE USUARIO (UX) ---
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

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
        setFeedback({ type: 'error', message: 'Por favor, completa todos los campos y selecciona un video.' });
        return;
    }

    setIsUploading(true);
    setFeedback({ type: '', message: '' });

    if (!user) {
      setIsUploading(false);
      setFeedback({ type: 'error', message: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.' });
      return;
    }
    
    // PASO 1: SUBIR EL VIDEO A SUPABASE STORAGE
    const fileExt = videoFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `docente-videos/${user.id}/${fileName}`; 

    const { error: uploadError } = await supabase.storage
      .from('videos-clases')
      .upload(filePath, videoFile);

    if (uploadError) {
      setIsUploading(false);
      setFeedback({ type: 'error', message: 'Error al subir el video: ' + uploadError.message });
      return;
    }

    // PASO 2: OBTENER LA URL PÚBLICA (asumiendo bucket público)
    const { data: { publicUrl } } = supabase.storage
      .from('videos-clases')
      .getPublicUrl(filePath);

    // PASO 3: GUARDAR LA INFORMACIÓN EN LA BASE DE DATOS
    const { data: nuevaClase, error: insertError } = await supabase
      .from('clases')
      .insert({ 
        titulo, 
        descripcion, 
        video_url: publicUrl,
        ruta_id: rutaId 
      })
      .select('*, rutas(nombre)')
      .single();

    if (insertError) {
      setIsUploading(false);
      setFeedback({ type: 'error', message: 'Error al guardar la clase: ' + insertError.message });
      // Limpieza: si falla el guardado en la DB, borramos el video que acabamos de subir
      await supabase.storage.from('videos-clases').remove([filePath]);
      return;
    }

    // PASO 4: ÉXITO TOTAL
    setIsUploading(false);
    setFeedback({ type: 'success', message: '¡Clase subida y guardada con éxito!' });
    
    onClaseCreada(nuevaClase); // Actualizamos la UI en la página principal

    // Limpiamos el formulario
    setTitulo('');
    setDescripcion('');
    setRutaId('');
    setVideoFile(null);
    e.target.reset();

    // Cerramos el drawer después de un momento
    setTimeout(() => {
      onClose();
      setFeedback({ type: '', message: '' });
    }, 2500);
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
        
        {/* Componente de Feedback Visual */}
        {feedback.message && (
          <div className={`p-3 rounded-md text-sm text-center ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {feedback.message}
          </div>
        )}

        <div className="pt-4">
            <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
            >
            {isUploading ? 'Subiendo...' : 'Subir Clase'}
            </button>
        </div>
      </form>
    </div>
  );
}