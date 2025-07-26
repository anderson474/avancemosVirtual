import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "openai";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import os from "os";
import path from "path";

// Inicializa los clientes fuera del handler para reutilizarlos en las invocaciones
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ¡IMPORTANTE! Usa la Service Role Key para operaciones de backend
);
const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Función para dividir el video en trozos de audio usando ffmpeg
const splitVideoIntoAudioChunks = (videoPath, tempDir) => {
  return new Promise((resolve, reject) => {
    const chunkPathPrefix = path.join(tempDir, "chunk_");
    const chunkFilePattern = `${chunkPathPrefix}%03d.mp3`;

    ffmpeg(videoPath)
      // -f segment: Le dice a ffmpeg que divida la salida en múltiples archivos.
      // -segment_time 600: Crea un nuevo segmento cada 600 segundos (10 minutos).
      //   Puedes ajustar este valor. 10 minutos de audio MP3 suele estar muy por debajo de 25 MB.
      // -vn: Elimina la pista de video, solo nos interesa el audio.
      // -acodec libmp3lame: Codifica el audio a MP3, que es eficiente.
      // -q:a 2: Establece una buena calidad de audio (0 es la mejor, 9 la peor).
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
        // Lee el directorio temporal para obtener la lista de trozos creados
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { claseId, filePath, bucketId } = req.body;

  if (!claseId || !filePath || !bucketId) {
    return res.status(400).json({
      error:
        "Faltan 'claseId', 'filePath' o 'bucketId' en el cuerpo de la petición.",
    });
  }

  // Crea un directorio temporal para los archivos
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "video-processing-"));
  const localVideoPath = path.join(tempDir, "source_video.mp4");

  try {
    console.log(
      `[Clase ID: ${claseId}] Iniciando procesamiento para el archivo: ${filePath}`
    );

    // 1. Descargar el video desde Supabase Storage
    console.log(`⬇️ Descargando video de Storage...`);
    const { data: fileData, error: downloadError } =
      await supabaseClient.storage.from(bucketId).download(filePath);

    if (downloadError) throw downloadError;
    if (!fileData)
      throw new Error("La descarga del archivo no devolvió datos.");

    fs.writeFileSync(localVideoPath, Buffer.from(await fileData.arrayBuffer()));
    console.log(`✅ Video descargado en: ${localVideoPath}`);

    // 2. Dividir el video en trozos de audio
    const audioChunksPaths = await splitVideoIntoAudioChunks(
      localVideoPath,
      tempDir
    );

    if (audioChunksPaths.length === 0) {
      throw new Error("ffmpeg no generó ningún trozo de audio.");
    }

    // 3. Transcribir cada trozo y unir los textos
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
    console.log(
      `📝 Texto (primeros 100 caracteres): "${fullTranscription.substring(
        0,
        100
      )}..."`
    );

    // 4. Dividir el texto completo y generar embeddings (misma lógica que tenías)
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

      const { error: insertError } = await supabaseClient
        .from("clase_embeddings")
        .insert({
          clase_id: claseId,
          contenido: chunk,
          embedding: embedding.embedding,
        });

      if (insertError) {
        console.error(`🔥 Error al insertar embedding:`, insertError.message);
      }
    }

    console.log(
      `🎉 [Clase ID: ${claseId}] Proceso completado. ${textChunks.length} embeddings guardados.`
    );
    res.status(200).json({
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
    // 5. Limpieza: borra el directorio temporal y todo su contenido
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`🧹 Directorio temporal ${tempDir} eliminado.`);
    }
  }
}

// Configuración para Next.js para deshabilitar el bodyParser,
// aunque no estamos subiendo archivos directamente a esta API, es una buena práctica
// si en el futuro decides cambiar a un flujo de subida directa.
// En este caso, al recibir JSON, no es estrictamente necesario.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Aumenta el límite por si acaso, aunque aquí solo recibimos JSON.
    },
  },
};
