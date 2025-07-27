import { createClient } from "@supabase/supabase-js";

// Usamos el cliente de servicio de Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- ESTE ARCHIVO YA NO NECESITA LA LIBRERÍA DE MUX ---
// import Mux from "@mux/mux-node";
// import { buffer } from "micro";

// Volvemos a activar el bodyParser de Next.js, ya que no leeremos el raw body
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

export default async function handler(req, res) {
  const { method, body } = req;

  console.log("\n--- [WEBHOOK] /api/mux/webhook RECIBIDO (Modo Simple) ---");
  console.log(`Timestamp: ${new Date().toISOString()}`);

  switch (method) {
    case "POST": {
      try {
        // 1. OBTENER DATOS DEL BODY
        // El body ya viene parseado como JSON por Next.js
        const { type, data } = body;
        console.log(`[1/3] Evento recibido. Tipo: ${type}`);

        // 2. PROCESAR EL EVENTO 'video.asset.ready'
        if (type === "video.asset.ready") {
          const { passthrough: claseId, id: muxAssetId, playback_ids } = data;
          const playbackId = playback_ids?.[0]?.id;
          console.log(
            `  - Evento 'video.asset.ready' detectado para claseId: '${claseId}'`
          );

          if (!claseId || !playbackId) {
            console.warn(
              "  - Webhook ignorado: Faltan claseId o playbackId en el objeto 'data'."
            );
            // Respondemos 200 para que Mux no lo reintente.
            return res
              .status(200)
              .json({
                message: "Evento recibido pero ignorado por falta de datos.",
              });
          }

          // 3. ACTUALIZAR SUPABASE Y DISPARAR PROCESAMIENTO
          console.log(
            `[2/3] Actualizando clase ${claseId} con playbackId ${playbackId}...`
          );
          await supabaseAdmin
            .from("clases")
            .update({ mux_playback_id: playbackId })
            .eq("id", claseId);
          console.log("  - ...Clase actualizada en Supabase.");

          console.log(
            `[3/3] Disparando API de procesamiento para claseId: ${claseId}...`
          );
          fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/clases/procesar-clase`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.PROCESSING_API_SECRET}`,
              },
              body: JSON.stringify({ claseId, muxAssetId }),
            }
          );
        } else {
          console.log(`  - Evento de tipo '${type}' ignorado.`);
        }

        // Responder a Mux que todo está bien
        console.log("--- ✅ [WEBHOOK] Finalizado con éxito ---");
        return res.status(200).json({ status: "ok" });
      } catch (error) {
        console.error("--- ❌ [WEBHOOK] ERROR en el bloque try/catch ---");
        console.error("Mensaje:", error.message);
        return res.status(500).json({ error: error.message });
      }
    }
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
