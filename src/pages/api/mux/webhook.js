import Mux from "@mux/mux-node";
import { buffer } from "micro";
import { createClient } from "@supabase/supabase-js";

// Usamos el cliente de servicio de Supabase aquí porque el webhook no tiene sesión de usuario
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Inicializa el cliente de Mux
const { Video } = new Mux(
  process.env.MUX_TOKEN_ID,
  process.env.MUX_TOKEN_SECRET
);

// Desactivamos el bodyParser de Next.js para poder leer el raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const signature = req.headers["mux-signature"];
  if (!signature) {
    return res.status(400).send("Missing Mux signature");
  }

  const body = await buffer(req);

  try {
    // 1. Verificar la firma del webhook para seguridad
    const event = Video.Webhooks.verifyHeader(
      body,
      signature,
      process.env.MUX_WEBHOOK_SECRET
    );

    // 2. Procesar solo el evento que nos interesa
    if (event.type === "video.asset.ready") {
      const { passthrough: claseId, id: muxAssetId, playback_ids } = event.data;
      const playbackId = playback_ids?.[0]?.id;

      if (!claseId || !playbackId) {
        return res
          .status(200)
          .send("Webhook received, but missing required data.");
      }

      // 3. Actualizar la clase en Supabase
      await supabaseAdmin
        .from("clases")
        .update({ mux_playback_id: playbackId })
        .eq("id", claseId);

      // 4. Disparar la API de procesamiento en segundo plano
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/clases/procesar-clase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PROCESSING_API_SECRET}`,
        },
        body: JSON.stringify({ claseId, muxAssetId }),
      });
    }

    // 5. Responder a Mux que todo está bien
    res.status(200).send("Webhook received and processed.");
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
