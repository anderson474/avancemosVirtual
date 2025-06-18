// supabase/functions/delete-user/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('✅ [LOG 0] Script de la función cargado.');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('✅ [LOG 1] Petición recibida. Método:', req.method);

  if (req.method === 'OPTIONS') {
    console.log('✅ [LOG 2] Petición OPTIONS detectada, devolviendo OK.');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('✅ [LOG 3] Entrando en el bloque try...');

    // --- Punto de fallo potencial #1: Variables de Entorno ---
    const supabaseUrl = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('✅ [LOG 4] Variables de entorno leídas.');
    console.log('  -> SUPABASE_URL:', supabaseUrl ? 'Encontrada' : '¡NO ENCONTRADA!');
    console.log('  -> SUPABASE_SERVICE_KEY:', serviceKey ? 'Encontrada' : '¡NO ENCONTRADA!');

    if (!supabaseUrl || !serviceKey) {
        throw new Error('Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY no están definidas.');
    }

    // --- Punto de fallo potencial #2: Creación del Cliente ---
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    console.log('✅ [LOG 5] Cliente de Supabase (Admin) creado exitosamente.');

    // --- Punto de fallo potencial #3: Parseo del Body ---
    const body = await req.json();
    console.log('✅ [LOG 6] Body de la petición parseado exitosamente:', body);

    const { user_id } = body;
    if (!user_id) {
      throw new Error('El ID del usuario (user_id) es requerido en el body.');
    }
    console.log(`✅ [LOG 7] user_id a eliminar extraído: ${user_id}`);

    // --- Punto de fallo potencial #4: Llamada a la API de Auth ---
    console.log('▶️ [LOG 8] Intentando llamar a supabaseAdmin.auth.admin.deleteUser...');
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    
    if (error) {
      console.error('❌ [LOG 9a] Error devuelto por deleteUser:', error);
      throw error;
    }
    
    console.log('✅ [LOG 9b] Usuario eliminado exitosamente de Auth.');

    return new Response(JSON.stringify({ message: `Usuario ${user_id} eliminado exitosamente.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Si algo falla, este log SIEMPRE debería aparecer.
    console.error('❌ [CATCH] Error capturado en la Edge Function:', error.message, error);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})