import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://polytranscript.com';
  const lastModified = new Date();

  const routes = [
    '',
    '/youtube-transcript-generator',
    '/youtube-shorts-transcript-generator',
    '/youtube-to-srt-converter',
    '/tiktok-transcript-generator',
    '/tiktok-captions-extractor',
    '/podcast-transcript-generator',
    '/spotify-podcast-transcript-generator',
    '/mp3-to-text-converter',
    '/alternatives/transcriptapi-alternative',
    '/alternatives/descript-alternative',
    '/pricing',
    '/docs',
    '/api-keys',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : route.includes('alternatives') || route.includes('generator') || route.includes('converter') ? 0.9 : 0.8,
  }));
}
