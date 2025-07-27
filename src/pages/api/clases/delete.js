import Mux from "@mux/mux-node";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

const mux = new Mux();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { claseId } = req.body;
    if (!claseId)
      return res
        .status(400)
        .json({ message: "Se requiere el ID de la clase." });

    const supabase = createPagesServerClient({ req, res });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ message: "No autorizado." });

    // 1. Obtener la clase de la DB para conseguir el asset_id y verificar la propiedad
    const { data: clase, error: fetchError } = await supabase
      .from("clases")
      .select("mux_asset_id, rutas(docente_id)")
      .eq("id", claseId)
      .single();

    if (fetchError || !clase) throw new Error("Clase no encontrada.");

    // 2. Verificar que el usuario que solicita es el dueño de la clase
    if (clase.rutas.docente_id !== user.id) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para eliminar esta clase." });
    }

    // 3. Eliminar el asset de Mux si existe
    if (clase.mux_asset_id) {
      await mux.video.assets.delete(clase.mux_asset_id);
    }

    // 4. Eliminar el registro de la clase de Supabase
    // Esto eliminará en cascada los recursos y embeddings asociados.
    const { error: dbError } = await supabase
      .from("clases")
      .delete()
      .eq("id", claseId);
    if (dbError)
      throw new Error(
        `Error al eliminar de la base de datos: ${dbError.message}`
      );

    return res.status(200).json({ message: "Clase eliminada con éxito." });
  } catch (error) {
    console.error("[/api/clases/delete ERROR]", error.message);
    return res
      .status(500)
      .json({ message: error.message || "Ocurrió un error en el servidor." });
  }
}
