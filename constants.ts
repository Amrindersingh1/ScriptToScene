
import type { Style } from './types';

export const VIDEO_GENERATION_MESSAGES = [
  "Warming up the virtual cameras...",
  "Analyzing scene depth and parallax...",
  "Rendering cinematic motion vectors...",
  "Applying digital film grain...",
  "Interpolating keyframes for smooth motion...",
  "This can take a few minutes, good things come to those who wait.",
  "Finalizing color grade and composition...",
  "Almost there, adding the final touches..."
];

export const STYLES: Style[] = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    imageUrl: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=800&auto=format&fit=crop',
    promptModifier: 'cinematic film still, 16:9 aspect ratio, from a movie, high-quality, dramatic lighting, epic composition, professional color grading, sharp focus',
  },
  {
    id: 'pixar',
    name: 'Pixar Animation',
    imageUrl: 'https://images.unsplash.com/photo-1611118182702-83017c679e01?q=80&w=800&auto=format&fit=crop',
    promptModifier: 'Pixar animation style, 3D render, vibrant colors, friendly character design, detailed textures, soft lighting, family-friendly',
  },
  {
    id: 'anime',
    name: 'Anime',
    imageUrl: 'https://images.unsplash.com/photo-1580137189272-c976918205c5?q=80&w=800&auto=format&fit=crop',
    promptModifier: '90s anime aesthetic, Studio Ghibli inspired, detailed hand-drawn background, cel-shaded characters, expressive eyes, beautiful scenery, nostalgic feel',
  },
  {
    id: 'realistic',
    name: 'Hyper-Realistic',
    imageUrl: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?q=80&w=800&auto=format&fit=crop',
    promptModifier: 'hyper-realistic photograph, 8k resolution, photorealistic, detailed skin texture, natural lighting, shot on a DSLR camera with a 50mm lens, sharp details',
  },
];
