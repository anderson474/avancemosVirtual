import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "openai";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import os from "os";
import path from "path";
import Mux from "@mux/mux-node";

// --- INICIALIZACIÓN DE CLIENTES ---
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { Video } = new Mux(
  process.env.MUX_TOKEN_ID,
  process.env.MUX_TOKEN_SECRET
);

// --- FUNCIÓN AUXILIAR PARA OBTENER DURACIÓN ---
const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error("🔥 Error al sondear el video con ffprobe:", err.message);
        return reject(err);
      }
      const duration = metadata.format.duration;
      console.log(`⏱️ Duración del video obtenida: ${duration} segundos.`);
      resolve(duration);
    });
  });
};

// --- FUNCIÓN AUXILIAR PARA DIVIDIR AUDIO ---
const splitVideoIntoAudioChunks = (videoPath, tempDir) => {
  return new Promise((resolve, reject) => {
    const chunkPathPrefix = path.join(tempDir, "chunk_");
    const chunkFilePattern = `${chunkPathPrefix}%03d.mp3`;

    ffmpeg(videoPath)
      .outputOptions([
        "-f",
        "segment",
        "-segment_time",
        "600", // 10 minutos por trozo
        "-vn", // Sin video
        "-acodec",
        "libmp3lame",
        "-q:a",
        "2", // Buena calidad
      ])
      .output(chunkFilePattern)
      .on("end", () => {
        const chunks = fs
          .readdirSync(tempDir)
          .filter((file) => file.startsWith("chunk_") && file.endsWith(".mp3"));
        console.log(`✅ Video dividido en ${chunks.length} trozos de audio.`);
        resolve(chunks.map((chunk) => path.join(tempDir, chunk)));
      })
      .on("error", (err) => {
        console.error("🔥 Error en ffmpeg:", err.message);
        reject(err);
      })
      .run();
  });
};

// --- HANDLER PRINCIPAL DE LA API ---
export default async function handler(req, res) {
  // 1. VERIFICAR MÉTODO Y AUTORIZACIÓN
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const authToken = req.headers.authorization?.split(" ")[1];
  if (authToken !== process.env.PROCESSING_API_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 2. OBTENER PARÁMETROS DEL BODY
  const { claseId, muxAssetId } = req.body;
  if (!claseId || !muxAssetId) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros claseId o muxAssetId." });
  }

  // 3. PREPARAR ENTORNO TEMPORAL
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "video-processing-"));
  const localVideoPath = path.join(tempDir, "source_video.mp4");

  try {
    console.log(
      `[Clase ID: ${claseId}] Iniciando procesamiento para Mux Asset ID: ${muxAssetId}`
    );

    // 4. DESCARGAR VIDEO DESDE MUX
    console.log(`⬇️ Obteniendo URL de descarga de Mux...`);
    const playbackIdInfo = await Video.Assets.createPlaybackId(muxAssetId, {
      policy: "signed",
    });
    const downloadUrl = `https://stream.mux.com/${playbackIdInfo.id}/high.mp4`;
    console.log(`⬇️ Descargando video de: ${downloadUrl}`);
    const videoResponse = await fetch(downloadUrl);
    if (!videoResponse.ok)
      throw new Error(
        `Failed to download from Mux. Status: ${videoResponse.status}`
      );
    fs.writeFileSync(
      localVideoPath,
      Buffer.from(await videoResponse.arrayBuffer())
    );
    console.log(`✅ Video descargado en: ${localVideoPath}`);

    // 5. OBTENER DURACIÓN Y ACTUALIZAR DB
    const durationInSeconds = await getVideoDuration(localVideoPath);
    await supabaseClient
      .from("clases")
      .update({ duracion_segundos: durationInSeconds })
      .eq("id", claseId);
    console.log(`✅ Duración guardada en la base de datos.`);

    // 6. DIVIDIR EN TROZOS DE AUDIO
    const audioChunksPaths = await splitVideoIntoAudioChunks(
      localVideoPath,
      tempDir
    );
    if (audioChunksPaths.length === 0)
      throw new Error("ffmpeg no generó ningún trozo de audio.");

    // 7. TRANSCRIBIR CON WHISPER
    let fullTranscription = "";
    console.log(
      `🗣️ Transcribiendo ${audioChunksPaths.length} trozos con Whisper...`
    );
    for (const chunkPath of audioChunksPaths) {
      const transcription = await openAI.audio.transcriptions.create({
        file: fs.createReadStream(chunkPath),
        model: "whisper-1",
        language: "es",
        prompt:
          "Esta es una clase de inglés para hispanohablantes. El audio contiene una mezcla de español e inglés, con terminología gramatical como pronombres, verbos, adjetivos y tiempos verbales.",
      });
      fullTranscription += transcription.text + " ";
    }
    console.log(`✅ Transcripción completa generada.`);

    // 8. GENERAR Y GUARDAR EMBEDDINGS
    const textChunks = fullTranscription
      .split(". ")
      .filter(Boolean)
      .map((s) => s.trim() + ".");
    console.log(
      `✂️  Texto dividido en ${textChunks.length} fragmentos para embeddings.`
    );
    for (const chunk of textChunks) {
      const embeddingResponse = await openAI.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });
      const [embedding] = embeddingResponse.data;
      await supabaseClient.from("clase_embeddings").insert({
        clase_id: claseId,
        contenido: chunk,
        embedding: embedding.embedding,
      });
    }

    // 9. ÉXITO
    console.log(
      `🎉 [Clase ID: ${claseId}] Proceso completado. ${textChunks.length} embeddings guardados.`
    );
    res
      .status(200)
      .json({
        success: true,
        message: `Procesados ${textChunks.length} fragmentos.`,
      });
  } catch (error) {
    console.error(
      `\n--- ❌ ERROR FATAL en la API para la clase ID ${claseId} ---\n`,
      error
    );
    res.status(500).json({ error: error.message });
  } finally {
    // 10. LIMPIEZA
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`🧹 Directorio temporal ${tempDir} eliminado.`);
    }
  }
}

// Configuración de la API para aceptar archivos grandes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Aunque ya no recibe el archivo, es buena práctica mantenerlo si hay otros endpoints.
    },
  },
};
