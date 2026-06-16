import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so Turbopack doesn't walk up to the home dir
  // (a stray ~/package-lock.json was making it infer C:\Users\jinye as root).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
