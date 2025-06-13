// src/components/dashboard/docente/eliminarClaseDrawer.jsx

import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
// 1. IMPORTAMOS EL HOOK CORRECTO
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function EliminarClaseDrawer({ visible, onClose, clases, onClaseEliminada }) {
  // 2. OBTENEMOS EL CLIENTE COMPARTIDO DESDE EL CONTEXTO
  const supabase = useSupabaseClient();
  
  // Estados para una mejor UX
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const handleEliminarClase = async (clase) => {
    // Usamos el ID de la clase para saber cuál botón deshabilitar
    setDeletingId(clase.id); 
    setFeedback({ type: '', message: '' });

    if (!window.confirm(`¿Estás seguro de que quieres eliminar la clase "${clase.titulo}"? Esta acción no se puede deshacer.`)) {
      setDeletingId(null);
      return;
    }
    
    // 3. PRIMERO, BORRAMOS EL REGISTRO DE LA BASE DE DATOS
    const { error: dbError } = await supabase
      .from('clases')
      .delete()
      .eq('id', clase.id);

    if (dbError) {
      setFeedback({ type: 'error', message: 'Error al eliminar la clase: ' + dbError.message });
      setDeletingId(null);
      return;
    }

    // 4. SI LA BD SE BORRÓ, BORRAMOS EL VIDEO DE STORAGE
    if (clase.video_url) {
      // Extraemos el path del archivo desde la URL completa
      const filePath = clase.video_url.split('/videos-clases/')[1];
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('videos-clases')
          .remove([filePath]);
        
        if (storageError) {
          // Si falla el borrado del video, informamos pero la operación principal ya tuvo éxito
          console.error("Error al eliminar el video de Storage, pero la clase fue borrada de la DB:", storageError.message);
        }
      }
    }
    
    // Si todo sale bien, actualizamos la UI
    setFeedback({ type: 'success', message: `¡Clase "${clase.titulo}" eliminada!` });
    onClaseEliminada(clase.id);
    
    // Reseteamos el estado del botón después de un momento
    setTimeout(() => {
        setDeletingId(null);
        setFeedback({ type: '', message: '' });
    }, 2000);
  };

  return (
    <div className={`...`}> {/* Contenedor principal sin cambios */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold">Eliminar clase</h2>
        <button onClick={onClose} className="...">
          <IoClose size={24} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {feedback.message && (
          <div className={`p-3 rounded-md text-sm text-center mb-4 ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {feedback.message}
          </div>
        )}

        {clases && clases.length > 0 ? (
          clases.map((clase) => (
            <div key={clase.id} className="flex justify-between items-center border-b pb-2">
              <span className="truncate pr-4">{clase.titulo}</span>
              <button
                onClick={() => handleEliminarClase(clase)}
                disabled={deletingId === clase.id} // Deshabilitamos solo el botón que se está procesando
                className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex-shrink-0 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {deletingId === clase.id ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 mt-8">No hay clases para eliminar.</p>
        )}
      </div>
    </div>
  );
}