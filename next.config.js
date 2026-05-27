/** @type {import('next').NextConfig} */
const nextConfig = {
  // Restauración de emergencia para producción dinámica en Vercel
  // Sin 'output: export' para que el feed de Supabase cargue en tiempo real
  // y se sincronicen correctamente los datos en el celular para el Pitch
};

module.exports = nextConfig;
