import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "openai";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import os from "os";
import path from "path";

// Inicializa los clientes fuera del handler
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- FUNCIÓN AUXILIAR PARA OBTENER DURACIÓN (NUEVA) ---
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

// --- FUNCIÓN AUXILIAR PARA DIVIDIR AUDIO (SIN CAMBIOS) ---
const splitVideoIntoAudioChunks = (videoPath, tempDir) => {
  return new Promise((resolve, reject) => {
    // ... (el código de esta función no cambia)
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

// --- HANDLER PRINCIPAL DE LA API (MODIFICADO) ---
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { claseId, filePath, bucketId } = req.body;
  if (!claseId || !filePath || !bucketId) {
    return res.status(400).json({ error: "Faltan parámetros en la petición." });
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "video-processing-"));
  const localVideoPath = path.join(tempDir, "source_video.mp4");

  try {
    console.log(
      `[Clase ID: ${claseId}] Iniciando procesamiento para: ${filePath}`
    );

    // PASO 1: Descargar el video desde Supabase Storage
    console.log(`⬇️ Descargando video de Storage...`);
    const { data: fileData, error: downloadError } =
      await supabaseClient.storage.from(bucketId).download(filePath);
    if (downloadError) throw downloadError;
    fs.writeFileSync(localVideoPath, Buffer.from(await fileData.arrayBuffer()));
    console.log(`✅ Video descargado en: ${localVideoPath}`);

    // ===================================================================
    // PASO 1.5: OBTENER DURACIÓN Y ACTUALIZAR LA BASE DE DATOS (NUEVO)
    // ===================================================================
    console.log(`🔎 Obteniendo duración del video...`);
    const durationInSeconds = await getVideoDuration(localVideoPath);
    if (!durationInSeconds || durationInSeconds <= 0) {
      throw new Error("No se pudo obtener una duración válida para el video.");
    }

    console.log(`🔄 Actualizando duración en la tabla 'clases'...`);
    const { error: updateError } = await supabaseClient
      .from("clases")
      .update({ duracion_segundos: durationInSeconds })
      .eq("id", claseId);

    if (updateError) {
      // Lanzamos un error si no podemos guardar la duración, ya que es crucial.
      throw new Error(
        `Error al actualizar la duración: ${updateError.message}`
      );
    }
    console.log(`✅ Duración guardada en la base de datos.`);

    // PASO 2: Dividir el video en trozos de audio
    const audioChunksPaths = await splitVideoIntoAudioChunks(
      localVideoPath,
      tempDir
    );
    if (audioChunksPaths.length === 0) {
      throw new Error("ffmpeg no generó ningún trozo de audio.");
    }

    // PASO 3: Transcribir cada trozo y unir los textos
    let fullTranscription = "";
    console.log(
      `🗣️ Transcribiendo ${audioChunksPaths.length} trozos con Whisper...`
    );
    for (const chunkPath of audioChunksPaths) {
      // ... (código de transcripción sin cambios)
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
    console.log(
      `📝 Texto (primeros 100 caracteres): "${fullTranscription.substring(
        0,
        100
      )}..."`
    );

    // PASO 4: Dividir texto y generar embeddings
    const textChunks = fullTranscription
      .split(". ")
      .filter(Boolean)
      .map((s) => s.trim() + ".");
    console.log(
      `✂️  Texto dividido en ${textChunks.length} fragmentos para embeddings.`
    );
    for (const chunk of textChunks) {
      // ... (código de embeddings sin cambios)
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
      `\n--- ❌ ERROR FATAL en la API para la clase ID ${claseId} ---`
    );
    console.error("Mensaje de Error:", error.message);
    console.error("Stack Trace:", error.stack);
    res.status(500).json({ error: error.message });
  } finally {
    // PASO 5: Limpieza
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`🧹 Directorio temporal ${tempDir} eliminado.`);
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
