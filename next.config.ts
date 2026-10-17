import type { NextConfig } from 'next';

// No GitHub Pages o site fica em /<nome-do-repo>. O workflow passa esse caminho
// em NEXT_PUBLIC_BASE_PATH; rodando local fica vazio.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // gera HTML estático em out/, que é o que o Pages consegue servir
  output: 'export',
  basePath,
  trailingSlash: true,
  // sem servidor não tem otimização de imagem; as fotos já vêm no tamanho certo pela URL
  images: { unoptimized: true },
};

export default nextConfig;
