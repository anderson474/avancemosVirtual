"use client";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <div
      className="bg-fixed bg-center bg-cover min-h-screen"
      style={{ backgroundImage: "url('/FotoCoorporativa.jpeg')" }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:grid-rows-2 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 backdrop-blur bg-white/30 w-2/3 h-2/3 rounded-xl p-8">
        <a
          href="https://inventarios.avancemos.edu.co/"
          className="flex items-center justify-center bg-azul text-white text-center text-xl font-bold px-4 hover:bg-white hover:text-azul cursor-pointer rounded-xl"
        >
          Sistema de inventarios
        </a>
      </div>
    </div>
  );
}
