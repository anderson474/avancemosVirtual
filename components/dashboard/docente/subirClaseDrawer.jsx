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
    setFeedback({ type: 'info', message: 'Iniciando proceso de subida...' });

    if (!user) {
      setIsUploading(false);
      setFeedback({ type: 'error', message: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.' });
      return;
    }
    
    let nuevaClaseId = null;

    try {
      // PASO 1: CREAR EL REGISTRO DE LA CLASE PRIMERO PARA OBTENER EL ID
      setFeedback({ type: 'info', message: 'Creando registro de la clase...' });
      const { data: claseCreada, error: insertError } = await supabase
        .from('clases')
        .insert({ 
          titulo, 
          descripcion, 
          ruta_id: rutaId,
          // Dejamos video_url nulo por ahora
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      
      nuevaClaseId = claseCreada.id;

      // PASO 2: CONSTRUIR LA RUTA DEL VIDEO CON EL ID DE LA CLASE
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `video.${fileExt}`; // Nombre estandarizado
      // La ruta ahora incluye el ID de la clase, que es lo que la Edge Function necesita
      const filePath = `docente-videos/${nuevaClaseId}/${fileName}`;

      // PASO 3: SUBIR EL VIDEO A SUPABASE STORAGE
      setFeedback({ type: 'info', message: `Subiendo video (ID de clase: ${nuevaClaseId})...` });
      const { error: uploadError } = await supabase.storage
        .from('videos-clases') // Asegúrate que el bucket se llame así
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;

      // PASO 4: OBTENER LA URL PÚBLICA Y ACTUALIZAR EL REGISTRO DE LA CLASE
      setFeedback({ type: 'info', message: 'Finalizando y guardando URL...' });
      const { data: { publicUrl } } = supabase.storage
        .from('videos-clases')
        .getPublicUrl(filePath);
      
      const { data: claseActualizada, error: updateError } = await supabase
        .from('clases')
        .update({ video_url: publicUrl })
        .eq('id', nuevaClaseId)
        .select('*, rutas(nombre)')
        .single();
      
      if (updateError) throw updateError;
      
      // PASO 5: ÉXITO TOTAL
      setIsUploading(false);
      setFeedback({ type: 'success', message: '¡Clase subida con éxito! El procesamiento del video ha comenzado.' });
      
      onClaseCreada(claseActualizada);

      // Limpiamos el formulario
      setTitulo('');
      setDescripcion('');
      setRutaId('');
      setVideoFile(null);
      document.getElementById('subir-clase-form').reset();

      setTimeout(() => {
        onClose();
        setFeedback({ type: '', message: '' });
      }, 3000);

    } catch (error) {
      setIsUploading(false);
      setFeedback({ type: 'error', message: 'Error en el proceso: ' + error.message });

      // --- LÓGICA DE LIMPIEZA EN CASO DE ERROR ---
      if (nuevaClaseId) {
        // Si la clase se creó pero algo más falló, la borramos para no dejar registros huérfanos.
        await supabase.from('clases').delete().eq('id', nuevaClaseId);
        console.log(`Registro de clase huérfano (ID: ${nuevaClaseId}) eliminado.`);
      }
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

      <form id="subir-clase-form"  onSubmit={handleSubmit} className="p-4 space-y-4 h-full overflow-y-auto pb-20">
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