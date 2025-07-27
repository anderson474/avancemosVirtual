import useSWR from "swr";
// CAMBIO 1: Se importa `useSessionContext` en lugar de `useUser`.
import {
  useSupabaseClient,
  useSessionContext,
} from "@supabase/auth-helpers-react";

// El fetcher no necesita ningún cambio. Es robusto y está bien escrito.
const fetcher = async ([supabase, user]) => {
  console.group("🚀 [Fetcher] Iniciando búsqueda de datos...");
  console.log("  - Recibido user.id:", user.id);

  try {
    // --- 1. Obtener el perfil del alumno (nombre y avatar) ---
    console.log("   fetching... 1/4 - Perfil, usuario: ", user.id);
    const {
      data: perfil,
      error: perfilError,
      status: perfilStatus,
    } = await supabase
      .from("perfiles")
      .select("nombre, username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    console.log("     Resultado Perfil:", {
      perfil,
      perfilError,
      perfilStatus,
    });
    if (perfilError && perfilStatus !== 406) throw perfilError;
    if (!perfil) throw new Error("No se encontró un perfil para este usuario.");

    // --- 2. Obtener URL pública del avatar ---
    console.log("   fetching... 2/4 - Avatar URL");
    let avatarUrl = "/default-avatar.jpg";
    if (perfil.avatar_url) {
      const { data: publicURLData } = supabase.storage
        .from("avatars")
        .getPublicUrl(perfil.avatar_url);
      avatarUrl = publicURLData.publicUrl;
      console.log("     URL del Avatar:", avatarUrl);
    } else {
      console.log("     No hay avatar_url en el perfil, usando default.");
    }
    const nombreAlumno = perfil.username || perfil.nombre || user.email;

    // --- 3. Obtener las rutas asignadas al alumno ---
    console.log("   fetching... 3/4 - Rutas");
    const { data: rutasData, error: rutasError } = await supabase
      .from("rutas_alumnos")
      .select("ultima_clase_vista_id, rutas (id, nombre, descripcion)")
      .eq("alumno_id", user.id);

    console.log("     Resultado Rutas:", { rutasData, rutasError });
    if (rutasError) throw rutasError;

    const rutas = rutasData.map((item) => item.rutas);
    if (rutas.length === 0) {
      console.log(
        "     El alumno no tiene rutas asignadas. Devolviendo datos básicos."
      );
      console.groupEnd();
      return { nombreAlumno, avatarUrl, rutasAsignadas: [] };
    }

    // --- 4. Calcular el progreso para CADA ruta en paralelo ---
    console.log(`   fetching... 4/4 - Progreso para ${rutas.length} ruta(s)`);
    const progressPromises = rutas.map((ruta) =>
      supabase.rpc("calcular_progreso_ruta", {
        p_alumno_id: user.id,
        p_ruta_id: ruta.id,
      })
    );
    const progressResults = await Promise.all(progressPromises);
    console.log("     Resultados de Progreso:", progressResults);

    // --- Combinar todo y formatear la salida ---
    const formattedRutas = rutas.map((ruta, index) => {
      return {
        id: ruta.id,
        titulo: ruta.nombre,
        descripcion: ruta.descripcion,
        progreso: progressResults[index]?.data
          ? Math.round(progressResults[index].data)
          : 0,
      };
    });

    const finalData = {
      nombreAlumno,
      avatarUrl,
      rutasAsignadas: formattedRutas,
    };

    console.log("✅ [Fetcher] Búsqueda de datos completada con éxito.");
    console.log("  - Datos a retornar:", finalData);
    console.groupEnd();
    return finalData;
  } catch (error) {
    console.error("🔥 [Fetcher] Error durante la obtención de datos:", error);
    console.groupEnd();
    throw error;
  }
};

// --- El Hook personalizado con la solución ---
export function useAlumnoDashboard() {
  console.log("🎣 [Hook] Se está ejecutando useAlumnoDashboard.");
  const supabase = useSupabaseClient();

  // CAMBIO 2: Usamos useSessionContext para obtener el estado de carga de la sesión.
  const { session, isLoading: isSessionLoading } = useSessionContext();

  // El usuario se extrae de la sesión una vez que está disponible.
  const user = session?.user;

  console.log(
    "  - Estado de la sesión:",
    isSessionLoading
      ? "Cargando sesión..."
      : user
      ? `Sesión activa para user.id ${user.id}`
      : "Sin sesión"
  );

  // CAMBIO 3: La clave de SWR ahora solo se establece si la sesión NO está cargando Y el usuario existe.
  // Esto evita que el fetcher se ejecute prematuramente.
  const key = !isSessionLoading && user ? [supabase, user] : null;

  console.log(
    "  - 🔑 Key de SWR:",
    key
      ? `Establecida con user.id: ${user.id}`
      : "null (esperando sesión o usuario)"
  );

  // CAMBIO 4: Renombramos `isLoading` a `isSWRLoading` para evitar conflictos.
  const {
    data,
    error,
    isLoading: isSWRLoading,
  } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 400000,
  });

  // CAMBIO 5: El estado de carga general de nuestro hook es verdadero si la sesión está cargando O si SWR está cargando.
  const isLoading = isSessionLoading || isSWRLoading;

  console.log("  - Estado de SWR:", {
    data: !!data,
    error: !!error,
    isSWRLoading,
  });
  console.log("  - Devolviendo valores del hook:", {
    dashboardData: data,
    isLoading, // Devolvemos el estado de carga combinado.
    isError: error,
  });

  return {
    dashboardData: data,
    isLoading, // Este es el valor que tus componentes deben usar para mostrar un spinner.
    isError: error,
  };
}
