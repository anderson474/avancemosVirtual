import Mux from "@mux/mux-node";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

// --- INICIALIZACIÓN DEL CLIENTE DE MUX ---
// Se hace fuera del handler, como en el ejemplo de la documentación.
// Esto permite que la instancia pueda ser reutilizada entre invocaciones de la función serverless.
console.log("Inicializando cliente de Mux (a nivel de módulo)...");

// Primero, verificamos que las variables existan para evitar un crash al iniciar.
const tokenId = process.env.MUX_TOKEN_ID;
const tokenSecret = process.env.MUX_TOKEN_SECRET;
let muxClient;

if (tokenId && tokenSecret) {
  muxClient = new Mux({
    tokenId: tokenId,
    tokenSecret: tokenSecret,
  });
  console.log("Cliente de Mux inicializado con éxito.");
} else {
  console.error(
    "¡ERROR CRÍTICO! Las variables de entorno de Mux no están definidas. La API de subida no funcionará."
  );
}

// --- HANDLER DE LA API ---
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 1. VERIFICAR QUE EL CLIENTE DE MUX SE INICIALIZÓ CORRECTAMENTE
    if (!muxClient) {
      throw new Error(
        "El servidor no tiene las credenciales de Mux configuradas correctamente."
      );
    }

    // 2. VERIFICAR SESIÓN DE USUARIO
    const supabase = createPagesServerClient({ req, res });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ message: "No autorizado." });
    }

    // 3. OBTENER Y VALIDAR DATOS DEL CLIENTE
    const { titulo, descripcion, rutaId } = req.body;
    if (!titulo || !rutaId) {
      return res.status(400).json({ message: "Faltan campos requeridos." });
    }

    // 4. CREAR REGISTRO EN SUPABASE
    const { data: claseData, error: claseError } = await supabase
      .from("clases")
      .insert({ titulo, descripcion, ruta_id: rutaId })
      .select("id")
      .single();
    if (claseError) throw new Error(`Error de Supabase: ${claseError.message}`);
    const claseId = claseData.id;

    // 5. CREAR ENLACE DE SUBIDA EN MUX
    // Usamos la instancia 'muxClient' creada fuera del handler.
    const directUpload = await muxClient.video.uploads.create({
      cors_origin: "*",
      new_asset_settings: {
        playback_policy: ["public"],
        passthrough: claseId.toString(),
        master_access: "temporary",
      },
    });
    if (!directUpload || !directUpload.url) {
      throw new Error("Mux no pudo generar un enlace de subida.");
    }

    // 6. RESPONDER CON ÉXITO
    return res
      .status(200)
      .json({ uploadUrl: directUpload.url, claseId: claseId });
  } catch (error) {
    console.error("[/api/clases/upload-request ERROR]", error.message);
    return res.status(500).json({
      message: error.message || "Ocurrió un error interno del servidor.",
    });
  }
}
