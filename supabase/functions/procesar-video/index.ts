// supabase/functions/procesar-video/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OpenAI } from 'https://esm.sh/openai@4.47.1';

console.log("✅ Función 'procesar-video' iniciada y lista para recibir peticiones.");

serve(async (req) => {
  const functionStartTime = Date.now();
  console.log(`\n--- [${new Date().toISOString()}] Nueva Petición Recibida ---`);

  try {
    // LOG: Verificando la carga de variables de entorno
    if (!Deno.env.get('SUPABASE_URL') || !Deno.env.get('SUPABASE_ANON_KEY') || !Deno.env.get('OPENAI_API_KEY')) {
        console.error("🔥 ERROR CRÍTICO: Faltan una o más variables de entorno (SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY).");
        throw new Error("Configuración del servidor incompleta.");
    }
    console.log("🔍 Inicializando clientes de Supabase y OpenAI...");
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)
    const openAI = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! })
    console.log("👍 Clientes inicializados correctamente.");

    // LOG: Mostrando el payload de la petición
    const { record } = await req.json()
    console.log("📦 Payload recibido:", JSON.stringify(record, null, 2));
    
    const bucketId = record.bucket_id;
    const filePath = record.name;

    if (!bucketId || !filePath) {
      throw new Error("El payload no contiene 'bucket_id' o 'name'.");
    }

    // LOG: Extracción del ID de la clase
    // Asumimos una ruta como: "videos-clases/ID_DE_LA_CLASE/video.mp4"
    const pathParts = filePath.split('/');
    const claseId = pathParts[1]; // El ID debería ser el segundo elemento
    
    console.log(`📂 Ruta del archivo: "${filePath}"`);
    if (!claseId || isNaN(parseInt(claseId, 10))) {
      console.error(`🔥 Error de parseo. No se pudo extraer un ID de clase numérico válido de la ruta. Partes: [${pathParts.join(', ')}]. ID extraído: "${claseId}"`);
      throw new Error('No se pudo extraer el ID de la clase de la ruta del archivo.');
    }
    console.log(`🆔 ID de clase extraído: ${claseId}`);

    // 1. Descargar el video desde Supabase Storage
    console.log(`⬇️  Descargando video de Storage: bucket='${bucketId}', path='${filePath}'...`);
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from(bucketId)
      .download(filePath);
    if (downloadError) throw downloadError;
    if (!fileData) throw new Error("La descarga del archivo no devolvió datos.");
    
    const fileBuffer = await fileData.arrayBuffer();
    const fileSizeMB = (fileBuffer.byteLength / (1024 * 1024)).toFixed(2);
    console.log(`✅ Video descargado con éxito. Tamaño: ${fileSizeMB} MB.`);

    const file = new File([fileBuffer], "video.mp4", { type: fileData.type });
    
    // 2. Transcribir el video usando Whisper API
    console.log("🗣️  Enviando a Whisper API para transcripción (modelo: whisper-1)...");
    const whisperStartTime = Date.now();
    const transcription = await openAI.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      // --- ¡ESTAS DOS LÍNEAS SON LA CLAVE DE TODO! ---
      language: "es", // El video está en español, esto ayuda enormemente.
      prompt: "Esta es una clase de inglés para hispanohablantes. El audio contiene una mezcla de español e inglés, con terminología gramatical como pronombres, verbos, adjetivos y tiempos verbales. El profesor se llama Francisco, pero también se le conoce como Pacho.",
    });
    const whisperEndTime = Date.now();
    console.log(`✅ Transcripción recibida en ${((whisperEndTime - whisperStartTime) / 1000).toFixed(2)} segundos.`);
    
    const textoTranscribido = transcription.text;
    console.log(`📝 Texto transcribido (primeros 100 caracteres): "${textoTranscribido.substring(0, 100)}..."`);


    // 3. Dividir el texto y generar embeddings
    const chunks = textoTranscribido.split('. ').filter(Boolean).map(s => s.trim() + '.');
    console.log(`✂️  Texto dividido en ${chunks.length} fragmentos (chunks).`);
    
    if (chunks.length === 0) {
        console.warn("⚠️ No se generaron fragmentos. El texto transcribido podría estar vacío o no tener puntos.");
    } else {
        console.log(`🧠 Generando y guardando embeddings para cada fragmento...`);
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`  - Procesando fragmento ${i + 1} de ${chunks.length}...`);
      
      const embeddingResponse = await openAI.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk,
      });
      const [embedding] = embeddingResponse.data;

      // LOG: Guardando en la base de datos
      const { error: insertError } = await supabaseClient.from('clase_embeddings').insert({
        clase_id: parseInt(claseId, 10),
        contenido: chunk,
        embedding: embedding.embedding,
      });

      if (insertError) {
        console.error(`🔥 Error al insertar el embedding del fragmento ${i + 1}:`, insertError.message);
        // Podrías decidir si continuar o parar aquí
      }
    }
    
    const functionEndTime = Date.now();
    console.log(`🎉 ¡Proceso completado! Embeddings guardados en ${((functionEndTime - functionStartTime) / 1000).toFixed(2)} segundos.`);
    
    return new Response(JSON.stringify({ success: true, message: `Procesados ${chunks.length} fragmentos.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const functionEndTime = Date.now();
    console.error(`\n--- ❌ ERROR FATAL en la función después de ${((functionEndTime - functionStartTime) / 1000).toFixed(2)}s ---`);
    console.error('Mensaje de Error:', error.message);
    // Loguear el stack completo es muy útil para depurar
    console.error('Stack Trace:', error.stack); 
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})