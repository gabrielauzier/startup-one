import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // AUTH-05: o login por codigo (OTP) saiu; links antigos e bookmarks
      // de /entrar/codigo caem na tela de entrada (308).
      { source: "/entrar/codigo", destination: "/entrar", permanent: true },
    ];
  },
};

export default nextConfig;
