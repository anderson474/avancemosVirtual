// @components/dashboard/alumno/videoPlayer.jsx

import { useEffect, useRef } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

/**
 * Reproductor de video que, además de mostrar el contenido, se encarga de
 * marcar la clase como "vista" en la base de datos cuando el video se completa.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.videoUrl - La URL del video a reproducir.
 * @param {number|string} props.claseId - El ID de la clase que se está viendo.
 * @param {string} props.userId - El ID del usuario que está viendo la clase.
 * @returns {JSX.Element}
 */
export default function VideoPlayer({ videoUrl, claseId, userId }) {
  const videoRef = useRef(null);
  const supabase = useSupabaseClient();

  // Función asíncrona para registrar que el usuario ha completado la clase.
  const marcarComoVista = async () => {
    // Verificaciones de seguridad: no hacer nada si falta información esencial.
    if (!claseId || !userId) {
      console.warn("Falta claseId o userId, no se puede marcar la clase como vista.");
      return;
    }

    console.log(`Video de la clase ${claseId} finalizado. Intentando marcar como vista...`);

    // Usamos 'upsert' (update or insert) para manejar el registro en la tabla 'clases_vistas'.
    // Si el par (alumno_id, clase_id) ya existe, no hace nada gracias a onConflict.
    // Si no existe, inserta una nueva fila.
    const { error } = await supabase
      .from('clases_vistas')
      .upsert({
        clase_id: claseId,
        alumno_id: userId,
        // 'created_at' se establece por defecto en la base de datos.
      }, {
        // En caso de conflicto en la clave única (alumno_id, clase_id), ignora el duplicado.
        // Esto previene errores si el usuario ve el video varias veces.
        onConflict: 'alumno_id, clase_id',
        ignoreDuplicates: true,
      });

    if (error) {
      console.error('Error al marcar la clase como vista:', error.message);
    } else {
      console.log(`¡Éxito! Clase ${claseId} marcada como vista para el usuario ${userId}.`);
      // **Futura mejora:** Aquí podrías emitir un evento personalizado para que la UI
      // se actualice en tiempo real (ej. que el checkmark aparezca en el sidebar).
      // Por ejemplo: window.dispatchEvent(new CustomEvent('claseCompletada', { detail: { claseId } }));
    }
  };

  // Efecto para cargar el video cuando la URL cambia.
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.src = videoUrl;
      videoRef.current.load();
    }
  }, [videoUrl]);

  // Efecto para manejar los eventos del reproductor de video.
  useEffect(() => {
    const videoElement = videoRef.current;

    // Si no hay elemento de video, no hacer nada.
    if (!videoElement) return;

    // Añadimos el "escuchador" de eventos para el evento 'ended'.
    // Este evento se dispara automáticamente cuando el video llega a su fin.
    videoElement.addEventListener('ended', marcarComoVista);

    // Función de limpieza: es MUY IMPORTANTE eliminar los "escuchadores" de eventos
    // cuando el componente se "desmonta" o cuando sus dependencias cambian.
    // Esto previene fugas de memoria y comportamientos inesperados.
    return () => {
      videoElement.removeEventListener('ended', marcarComoVista);
    };
  }, [claseId, userId, supabase]); // El efecto se vuelve a ejecutar si cambia la clase o el usuario.

  return (
    <video
      ref={videoRef}
      controls
      controlsList="nodownload"
      className="w-full h-full object-cover"
    >
      Lo sentimos, tu navegador no soporta la reproducción de videos.
    </video>
  );
}