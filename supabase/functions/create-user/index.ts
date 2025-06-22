// supabase/functions/create-user/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, profileData } = await req.json()

    if (!email || !password || !profileData) {
      throw new Error('Email, password y profileData son requeridos.')
    }

    // 1. Crear el usuario en el sistema de autenticación de Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Lo confirmamos automáticamente ya que lo crea un admin
    })

    if (authError) {
      throw authError
    }
    
    const newUser = authData.user;
    if (!newUser) {
      throw new Error('No se pudo crear el usuario en el sistema de Auth.');
    }

    // 2. Insertar los datos del perfil en la tabla 'perfiles'
    // Combinamos el ID del nuevo usuario con los datos del perfil recibidos
    const finalProfileData = {
      id: newUser.id,
      ...profileData
    };

    const { error: profileError } = await supabaseAdmin
      .from('perfiles')
      .insert(finalProfileData);

    if (profileError) {
      // Si falla la inserción del perfil, es una buena práctica borrar el usuario de auth
      // que acabamos de crear para no dejar datos inconsistentes.
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      throw profileError;
    }

    return new Response(JSON.stringify({ user: newUser, profile: finalProfileData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error en la función create-user:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})