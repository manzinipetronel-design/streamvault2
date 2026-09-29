import { imageHosts } from './image-hosts.config.mjs';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

export default (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  /** @type {import('next').NextConfig} */
  return {
    output: isDev ? undefined : 'standalone',
    productionBrowserSourceMaps: !isDev,
    distDir: process.env.DIST_DIR || (isDev ? '.next-dev' : '.next'),
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
    images: {
      remotePatterns: imageHosts,
    },
    devIndicators: {
      buildActivity: false,
    },
  };
};
