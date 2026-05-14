import type { NextConfig } from "next";
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // fallback runs after all pages and API routes — so app/api/v1/auth/[...path]
      // takes precedence and the rewrite only handles non-auth paths.
      fallback: [
        {
          source: "/api/v1/:path*",
          destination: `${process.env.BACKEND_URL}/api/v1/:path*`,
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
