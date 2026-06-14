import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/cougan/avatar/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/cougan/gallery/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/cdn/:path*',
        destination: 'https://pygxavjgfzxeeyjbtmlo.supabase.co/storage/v1/object/public/cougan/:path*',
      },
    ];
  },
};

export default nextConfig;
