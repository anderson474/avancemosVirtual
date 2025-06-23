// supabase/functions/responder-pregunta/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OpenAI } from 'https://esm.sh/openai@4.47.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
}

// Interfaz para la respuesta de la API de Tavily
interface TavilySearchResult {
  query: string;
  response_time: number;
  results: {
    title: string;
    url: string;
    content: string;
    score: number;
    raw_content: null | string;
  }[];
}

// --- Nueva Función: Búsqueda Web con Tavily ---
async function searchWeb(query: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic', // 'basic' es más rápido y barato, 'advanced' es más profundo
        include_answer: true, // ¡Tavily puede intentar dar una respuesta directa!
        max_results: 3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    const data: TavilySearchResult = await response.json();
    
    // Combinamos los contenidos de los resultados de búsqueda en un solo texto
    const searchContext = data.results.map(res => `Fuente: ${res.title}\nContenido: ${res.content}`).join('\n\n');
    
    return searchContext;

  } catch (error) {
    console.error("Error en la búsqueda web con Tavily:", error.message);
    return "No se pudo realizar la búsqueda en internet.";
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { claseId, pregunta } = await req.json();

    // --- Carga de Claves y Clientes ---
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
    const tavilyApiKey = Deno.env.get('TAVILY_API_KEY')!; // Nueva clave
    const openAI = new OpenAI({ apiKey: openAIApiKey });
    
    // --- Búsqueda de Contexto en la Clase (como antes) ---
    const embeddingResponse = await openAI.embeddings.create({
      model: 'text-embedding-3-small',
      input: pregunta,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const { data: classChunks } = await supabaseClient.rpc('match_clase_contenidos', {
      p_clase_id: claseId,
      p_query_embedding: queryEmbedding,
      p_match_threshold: 0.7, // Umbral normal
      p_match_count: 3,
    });
    const classContext = classChunks?.map(chunk => chunk.contenido).join('\n---\n') || null;

    // --- Búsqueda de Contexto en la Web (NUEVO PASO) ---
    console.log("▶️ Realizando búsqueda web...");
    const webContext = await searchWeb(pregunta, tavilyApiKey);

    // --- Construcción del Prompt Final Combinando Contextos ---
    const prompt = `
      Eres un asistente de enseñanza experto y amigable. Tu tarea es responder la pregunta del estudiante de la forma más completa posible.
      Tienes dos fuentes de información. Prioriza la información del "Contexto de la Clase" si está disponible y es relevante.
      Usa el "Contexto de Internet" para complementar la respuesta, para responder preguntas generales que no están en la clase, o si no hay contexto de la clase.
      Si citas información, sé natural. No digas "según la fuente...". Simplemente integra la información.
      Si no puedes encontrar una respuesta en ninguna de las dos fuentes, di amablemente que no tienes suficiente información para responder.

      ---
      Contexto de la Clase:
      ${classContext || "No se encontró información relevante en esta clase."}
      ---
      Contexto de Internet:
      ${webContext || "No se encontró información relevante en internet."}
      ---

      Pregunta del estudiante: "${pregunta}"

      Respuesta completa y útil:
    `;

    console.log("▶️ Enviando prompt final a OpenAI...");
    const chatCompletion = await openAI.chat.completions.create({
      model: 'gpt-4o-mini', // Un modelo potente es mejor para sintetizar múltiples fuentes
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    const respuesta = chatCompletion.choices[0].message.content;

    return new Response(JSON.stringify({ respuesta }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Error en la función "responder-pregunta":', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});