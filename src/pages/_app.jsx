// src/pages/_app.jsx
import { useState } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  // Crea el cliente UNA SOLA VEZ usando la función correcta para el Pages Router.
  const [supabaseClient] = useState(() => createPagesBrowserClient());

  return (
    // El proveedor oficial que maneja todo el estado de la sesión.
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession} // "Hidrata" el cliente con la sesión del servidor.
    >
      <Component {...pageProps} />
    </SessionContextProvider>
  );
}

export default MyApp;
