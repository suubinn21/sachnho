import type { AudioTrackItem } from './types';

const staticAudioUrls = import.meta.glob('./audio/*.{mp3,wav,ogg,m4a,aac,flac}', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function formatTrackTitleFromPath(filePath: string): string {
  const fileName = filePath.split('/').pop() ?? filePath;
  return fileName
    .replace(/\.(mp3|wav|ogg|m4a|aac|flac)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

/**
 * Automatically discover any audio files placed inside `src/data/audio/`
 * so users can drop `.mp3`/`.wav`/`.ogg` tracks in without editing code.
 */
export function getBundledAudioTracks(): AudioTrackItem[] {
  return Object.entries(staticAudioUrls)
    .sort(([a], [b]) => a.localeCompare(b, 'vi'))
    .map(([filePath, url], idx) => ({
      id: `static-audio-${idx}-${filePath}`,
      title: formatTrackTitleFromPath(filePath),
      bpm: 72,
      sourceType: 'static-file' as const,
      url,
    }));
}
