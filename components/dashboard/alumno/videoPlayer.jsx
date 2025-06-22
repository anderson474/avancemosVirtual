// @components/dashboard/alumno/videoPlayer.jsx

import { useEffect, useRef, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function VideoPlayer({ videoUrl, claseId, userId, onVideoEnded }) {
  const videoRef = useRef(null);
  const supabase = useSupabaseClient();
  // Usamos una ref para evitar que el intervalo se reinicie en cada render
  const intervalRef = useRef(null); 

  

  // --- FUNCIÓN PARA GUARDAR EL PROGRESO ---
  // Usamos useCallback para optimizar y asegurar que la función no se recree innecesariamente.
  const guardarProgreso = useCallback(async () => {
    if (!videoRef.current || !claseId || !userId) return;

    const currentTime = videoRef.current.currentTime;
    // No guardamos si el tiempo es 0 o si el video ha terminado (para no sobreescribir).
    if (currentTime === 0 || videoRef.current.ended) return;

    console.log(`Guardando progreso: Clase ${claseId}, Tiempo ${currentTime}`);

    // Hacemos un 'upsert' para crear o actualizar el registro de progreso.
    const { error } = await supabase
      .from('clases_vistas')
      .upsert({
        clase_id: claseId,
        alumno_id: userId,
        ultimo_tiempo_visto: currentTime,
      }, {
        onConflict: 'alumno_id, clase_id', // Si ya existe, actualiza en lugar de insertar
      });
    
    if (error) {
      console.error('Error al guardar el progreso del video:', error);
    }
  }, [claseId, userId, supabase]);

  // --- FUNCIÓN PARA MARCAR CLASE COMO COMPLETADA ---
  const marcarComoVista = useCallback(async () => {
    if (!claseId || !userId) return;

    console.log(`Video de la clase ${claseId} finalizado.`);

    const { error } = await supabase
      .from('clases_vistas')
      .upsert({
        clase_id: claseId,
        alumno_id: userId,
        ultimo_tiempo_visto: 0, // Reiniciamos el tiempo al completar
      }, {
        onConflict: 'alumno_id, clase_id',
      });
    if (onVideoEnded) {
      onVideoEnded();
    }

    if (error) {
      console.error('Error al marcar la clase como vista:', error);
    } else {
      console.log(`Clase ${claseId} marcada como completa.`);
    }
  }, [claseId, userId, supabase, onVideoEnded]);

  // --- EFECTO PRINCIPAL: Cargar video, progreso y configurar eventos ---
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoUrl || !userId || !claseId) return;

    // --- Lógica de Carga Inicial ---
    const cargarVideoYProgreso = async () => {
      // 1. Cargar la URL del video
      videoElement.src = videoUrl;

      // 2. Buscar el progreso guardado para esta clase y este usuario
      const { data, error } = await supabase
        .from('clases_vistas')
        .select('ultimo_tiempo_visto')
        .eq('alumno_id', userId)
        .eq('clase_id', claseId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = 'no rows found', lo ignoramos
        console.error("Error al recuperar el progreso:", error);
      }
      
      // 3. Establecer el tiempo inicial del video
      if (data && data.ultimo_tiempo_visto > 0) {
        // Solo establecemos el tiempo si el video está listo para recibirlo
        videoElement.onloadedmetadata = () => {
          videoElement.currentTime = data.ultimo_tiempo_visto;
          console.log(`Video reanudado en ${data.ultimo_tiempo_visto}s`);
        };
      }
    };

    cargarVideoYProgreso();

    // --- Configuración de Eventos ---
    // Guardar progreso periódicamente mientras se reproduce
    intervalRef.current = setInterval(guardarProgreso, 15000); // Cada 15 segundos
    // Marcar como completo al finalizar
    videoElement.addEventListener('ended', marcarComoVista);
    // Guardar progreso al pausar
    videoElement.addEventListener('pause', guardarProgreso);

    // --- Función de Limpieza ---
    // Esto es crucial para evitar fugas de memoria y comportamientos extraños.
    return () => {
      console.log("Limpiando eventos y intervalo para la clase:", claseId);
      clearInterval(intervalRef.current);
      videoElement.removeEventListener('ended', marcarComoVista);
      videoElement.removeEventListener('pause', guardarProgreso);
      
      // Guardar una última vez al cambiar de video o desmontar el componente
      guardarProgreso(); 
    };
  }, [videoUrl, claseId, userId, guardarProgreso, marcarComoVista, supabase]);


  return (
    <video
      ref={videoRef}
      controls
      controlsList="nodownload"
      className="w-full h-full object-cover"
    >
      Tu navegador no soporta la reproducción de videos.
    </video>
  );
}