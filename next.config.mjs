/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "lpuggtfwgjllmupmjgha.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "puolotrip.com",
      },
      {
        protocol: "https",
        hostname: "media.thuonghieucongluan.vn",
      },
      {
        protocol: "https",
        hostname: "viettimetravel.vn",
      },
      {
        protocol: "https",
        hostname: "product.hstatic.net",
      },
      {
        protocol: "https",
        hostname: "longphutravel.com",
      },
      {
        protocol: "https",
        hostname: "agotourist.com",
      },
      {
        protocol: "https",
        hostname: "cdn3.ivivu.com",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
