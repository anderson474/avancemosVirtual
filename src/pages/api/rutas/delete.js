import Mux from "@mux/mux-node";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

const mux = new Mux();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { rutaId } = req.body;
    if (!rutaId)
      return res.status(400).json({ message: "Se requiere el ID de la ruta." });

    const supabase = createPagesServerClient({ req, res });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ message: "No autorizado." });

    // 1. Verificar que el usuario es el dueño de la ruta
    const { data: rutaData, error: ownerError } = await supabase
      .from("rutas")
      .select("docente_id")
      .eq("id", rutaId)
      .single();
    if (ownerError || !rutaData) throw new Error("Ruta no encontrada.");
    if (rutaData.docente_id !== user.id) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para eliminar esta ruta." });
    }

    // 2. Obtener todas las clases de la ruta para conseguir sus Mux Asset IDs
    const { data: clases, error: fetchError } = await supabase
      .from("clases")
      .select("mux_asset_id")
      .eq("ruta_id", rutaId);
    if (fetchError)
      throw new Error("No se pudieron obtener las clases asociadas.");

    // 3. Eliminar todos los assets de Mux asociados (en paralelo)
    if (clases && clases.length > 0) {
      const deletePromises = clases
        .filter((clase) => clase.mux_asset_id) // Filtramos por si alguna clase no tiene video
        .map((clase) => mux.video.assets.delete(clase.mux_asset_id));

      // Esperamos a que todas las promesas de eliminación de Mux terminen
      await Promise.all(deletePromises);
    }

    // 4. Eliminar la ruta de Supabase.
    // Si tu DB tiene 'ON DELETE CASCADE' configurado entre rutas y clases,
    // esto eliminará automáticamente todas las clases, recursos y embeddings.
    const { error: dbError } = await supabase
      .from("rutas")
      .delete()
      .eq("id", rutaId);
    if (dbError)
      throw new Error(
        `Error al eliminar la ruta de la base de datos: ${dbError.message}`
      );

    return res
      .status(200)
      .json({ message: "Ruta y su contenido eliminados con éxito." });
  } catch (error) {
    console.error("[/api/rutas/delete ERROR]", error.message);
    return res
      .status(500)
      .json({ message: error.message || "Ocurrió un error en el servidor." });
  }
}
