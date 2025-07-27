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
const mux = new Mux(); // La librería usa las variables de entorno MUX_TOKEN_ID y MUX_TOKEN_SECRET automáticamente

// --- FUNCIÓN AUXILIAR PARA DESCARGAR CON REINTENTOS ---
const fetchWithRetry = async (url, retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    console.log(
      `  - Intento de descarga ${i + 1}/${retries} desde ${url.substring(
        0,
        50
      )}...`
    );
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log("  - ✅ Descarga exitosa (Status 200 OK).");
        return response;
      }
      // Si el error es 503 (Servicio No Disponible), esperamos y reintentamos.
      if (response.status === 503) {
        console.warn(
          `  - Aviso: Recibido Status 503 (Servicio No Disponible). Reintentando en ${
            delay / 1000
          }s...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // Pasa a la siguiente iteración del bucle
      }
      // Para cualquier otro error (403, 404, etc.), fallamos inmediatamente.
      throw new Error(
        `Fallo de descarga no recuperable. Status: ${response.status}`
      );
    } catch (error) {
      // Captura errores de red (ej. DNS, conexión)
      console.warn(
        `  - Aviso: Error de red en el intento ${i + 1}.`,
        error.message
      );
      if (i === retries - 1) throw error; // Si es el último intento, lanzamos el error
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(
    `Fallo al descargar el archivo después de ${retries} intentos.`
  );
};

// --- FUNCIÓN AUXILIAR PARA ESPERAR EL MASTER DEL VIDEO ---
const waitForMasterAccess = async (
  muxAssetId,
  maxRetries = 12,
  delay = 10000
) => {
  // 12 reintentos de 10s = 2 min de espera max.
  for (let i = 0; i < maxRetries; i++) {
    console.log(
      `  - Intento ${
        i + 1
      }/${maxRetries}: Verificando estado del master para el asset ${muxAssetId}...`
    );

    const asset = await mux.video.assets.retrieve(muxAssetId);

    if (asset?.master?.status === "ready" && asset.master.url) {
      console.log("  - ✅ Master está listo y la URL está disponible.");
      return asset.master.url;
    }
    if (asset?.master?.status === "errored") {
      throw new Error("Mux reportó un error al preparar el archivo master.");
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error("El archivo master no estuvo disponible a tiempo (timeout).");
};

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
        "600",
        "-vn",
        "-acodec",
        "libmp3lame",
        "-q:a",
        "2",
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
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const authToken = req.headers.authorization?.split(" ")[1];
  if (authToken !== process.env.PROCESSING_API_SECRET)
    return res.status(401).json({ error: "Unauthorized" });

  const { claseId, muxAssetId } = req.body;
  if (!claseId || !muxAssetId)
    return res
      .status(400)
      .json({ error: "Faltan parámetros claseId o muxAssetId." });

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "video-processing-"));
  const localVideoPath = path.join(tempDir, "source_video.mp4");

  try {
    console.log(
      `[Clase ID: ${claseId}] Iniciando procesamiento para Mux Asset ID: ${muxAssetId}`
    );

    if (!mux)
      throw new Error("El cliente de Mux no se inicializó correctamente.");

    // 1. ESPERAR Y OBTENER LA URL DE DESCARGA
    const downloadUrl = await waitForMasterAccess(muxAssetId);

    // 2. DESCARGAR EL VIDEO CON LÓGICA DE REINTENTOS
    const videoResponse = await fetchWithRetry(downloadUrl);

    fs.writeFileSync(
      localVideoPath,
      Buffer.from(await videoResponse.arrayBuffer())
    );
    console.log(`✅ Video descargado y guardado localmente.`);

    // 3. PROCESAMIENTO CON FFMPEG Y OPENAI
    const durationInSeconds = await getVideoDuration(localVideoPath);
    await supabaseClient
      .from("clases")
      .update({ duracion_segundos: durationInSeconds })
      .eq("id", claseId);
    console.log(`✅ Duración guardada: ${durationInSeconds}s`);

    const audioChunksPaths = await splitVideoIntoAudioChunks(
      localVideoPath,
      tempDir
    );
    console.log(`✅ Audio dividido en ${audioChunksPaths.length} trozos.`);

    let fullTranscription = "";
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

    const textChunks = fullTranscription
      .split(". ")
      .filter(Boolean)
      .map((s) => s.trim() + ".");
    console.log(
      `✅ Texto dividido en ${textChunks.length} fragmentos para embeddings.`
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
    console.log(`✅ Embeddings guardados.`);

    // 4. ÉXITO
    console.log(`🎉 [Clase ID: ${claseId}] Proceso completado.`);
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
    // 5. LIMPIEZA
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`🧹 Directorio temporal eliminado para clase ${claseId}.`);
    }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};
