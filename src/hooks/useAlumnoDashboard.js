// src/hooks/useAlumnoDashboard.js
import useSWR from 'swr';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

// Esta es la función que SWR usará para obtener los datos.
// Recibe como argumento la clave (key) que le pasemos.
// En este caso, la clave contendrá el cliente de Supabase y el usuario.
const fetcher = async ([supabase, user]) => {
  // Si no hay usuario, no hacemos nada.
  if (!user) return null;

  // --- 1. Obtener el perfil del alumno (nombre y avatar) ---
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('nombre, username, avatar_url')
    .eq('id', user.id)
    .single();

  if (perfilError) throw new Error('Error al obtener el perfil del alumno.');
  
  let avatarUrl = '/default-avatar.jpg';
  if (perfil.avatar_url) {
    const { data: publicURLData } = supabase.storage.from('avatars').getPublicUrl(perfil.avatar_url);
    avatarUrl = publicURLData.publicUrl;
  }
  const nombreAlumno = perfil.username || perfil.nombre || user.email;

  // --- 2. Obtener las rutas asignadas al alumno ---
  const { data: rutasData, error: rutasError } = await supabase
    .from('rutas_alumnos')
    .select(`
      ultima_clase_vista_id,
      rutas (
        id,
        nombre,
        descripcion
      )
    `)
    .eq('alumno_id', user.id);

  if (rutasError) throw new Error('Error al obtener las rutas asignadas.');

  const rutas = rutasData.map(item => item.rutas);
  
  // --- 3. Calcular el progreso para CADA ruta en paralelo ---
  const progressPromises = rutas.map(ruta => 
    supabase.rpc('calcular_progreso_ruta', {
      p_alumno_id: user.id,
      p_ruta_id: ruta.id
    })
  );
  const progressResults = await Promise.all(progressPromises);

  // --- 4. Combinar todo y formatear la salida ---
  const formattedRutas = rutas.map((ruta, index) => {
    const progressData = progressResults[index];
    if (progressData.error) {
      console.error(`Error al calcular progreso para la ruta ${ruta.id}:`, progressData.error);
    }
    return {
      id: ruta.id,
      titulo: ruta.nombre,
      descripcion: ruta.descripcion,
      progreso: progressData.data ? Math.round(progressData.data) : 0,
      ultimaClaseId: ruta.ultima_clase_vista_id, // Asegúrate que este dato viene de rutasData
    };
  });
  
  // El objeto que retornamos será el valor de `data` en nuestro componente
  return {
    nombreAlumno,
    avatarUrl,
    rutasAsignadas: formattedRutas,
  };
};

// --- Este es el Hook personalizado que usaremos en nuestra página ---
export function useAlumnoDashboard() {
  const supabase = useSupabaseClient();
  const user = useUser();

  // La clave (key) es importante. SWR la usa para cachear.
  // Si `user` es null, la clave será null y SWR no ejecutará el fetcher.
  const key = user ? [supabase, user] : null;

  const { data, error, isLoading } = useSWR(key, fetcher, {
    // Opciones adicionales (opcional pero recomendado):
    revalidateOnFocus: false, // Recarga los datos cuando el usuario vuelve a la pestaña
    dedupingInterval: 300000, // No pidas los mismos datos más de una vez cada 5 minutos
  });

  return {
    dashboardData: data,
    isLoading,
    isError: error
  };
}