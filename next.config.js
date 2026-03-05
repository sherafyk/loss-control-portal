/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent indexing (good hygiene; not a substitute for access control).
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
          // Helps avoid leaking shared access keys via outbound referrers.
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
