// @components/dashboard/alumno/videoPlayer.jsx

import { useEffect, useRef } from 'react';

/**
 * Un componente de reproductor de video simple y eficiente que utiliza el elemento <video> de HTML5.
 * Muestra los controles nativos del navegador, que incluyen reproducción/pausa, volumen,
 * pantalla completa y, en la mayoría de los navegadores modernos, control de velocidad de reproducción.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.videoUrl - La URL del video que se va a reproducir.
 * @returns {JSX.Element} El elemento del reproductor de video.
 */
export default function VideoPlayer({ videoUrl }) {
  const videoRef = useRef(null);

  // Este efecto se ejecuta cada vez que la prop 'videoUrl' cambia.
  // Es crucial para actualizar el video cuando el usuario selecciona una nueva clase.
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      // Asignamos la nueva URL al atributo 'src' del elemento de video.
      videoRef.current.src = videoUrl;

      // Llamamos a .load() para que el navegador cargue los metadatos del nuevo video
      // y esté listo para reproducirse.
      videoRef.current.load();
    }
  }, [videoUrl]);

  return (
    // El video ocupará el 100% del espacio de su contenedor padre.
    // El contenedor padre (en [rutaId].jsx) ya tiene un `aspect-ratio` definido
    // para mantener el tamaño consistente.
    <video
      ref={videoRef}
      controls // Habilita los controles de reproducción nativos del navegador.
      // `controlsList` es una lista de controles que queremos deshabilitar.
      // "nodownload" evita que aparezca un botón de descarga.
      // "noremoteplayback" deshabilita la capacidad de transmitir a otros dispositivos (ej. Chromecast).
      controlsList="nodownload" 
      className="w-full h-full object-cover" // `object-cover` asegura que el video llene el espacio sin distorsionarse.
      // Opcional: añade un `poster` si quieres mostrar una imagen mientras el video carga.
      // poster="/path/to/your/video-poster.jpg"
    >
      {/* Este texto solo se mostrará si el navegador del usuario es muy antiguo
          y no soporta el tag <video>. */}
      Lo sentimos, tu navegador no soporta la reproducción de videos.
    </video>
  );
}