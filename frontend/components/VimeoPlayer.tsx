// ===========================================
// WARIZMY EDUCATION - Vimeo Player Component
// ===========================================
// Erweiterter Vimeo-Player mit Fortschrittsverfolgung,
// Thumbnail-Vorschau und besserer UX

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipBack, 
  SkipForward,
  Settings,
  Loader2
} from 'lucide-react';

// ===========================================
// TYPEN
// ===========================================

interface VimeoPlayerProps {
  // Video-Identifikation (eine von beiden)
  videoId?: string;
  videoUrl?: string;
  // Optionale Props
  title?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  // Fortschrittsverfolgung
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  initialProgress?: number;
  // Styling
  className?: string;
}

interface VimeoOembedData {
  title: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
  duration: number;
}

// ===========================================
// HILFSFUNKTIONEN
// ===========================================

/**
 * Extrahiert die Vimeo Video-ID aus verschiedenen URL-Formaten
 * Unterstützt viele Formate:
 * - vimeo.com/123456789
 * - player.vimeo.com/video/123456789
 * - vimeo.com/123456789/abcdef (privat)
 * - vimeo.com/manage/videos/123456789
 * - vimeo.com/channels/xxx/123456789
 * - vimeo.com/groups/xxx/videos/123456789
 * - vimeo.com/album/xxx/video/123456789
 * - vimeo.com/showcase/xxx/video/123456789
 */
/**
 * Extrahiert die Vimeo Video-ID und optionalen Hash aus verschiedenen URL-Formaten
 */
function extractVimeoData(input: string): { id: string; hash?: string } | null {
  if (!input || typeof input !== 'string') return null;
  
  // Trim whitespace und entferne Query-Parameter
  input = input.trim().split('?')[0].split('#')[0];
  
  // Falls es bereits eine reine ID ist (nur Zahlen)
  if (/^\d+$/.test(input)) {
    return { id: input };
  }
  
  // Privates Video mit Hash: vimeo.com/123456789/abcdef (MUSS VOR anderen Matches kommen!)
  const privateMatch = input.match(/vimeo\.com\/(\d+)\/([a-zA-Z0-9]+)/);
  if (privateMatch) {
    return { id: privateMatch[1], hash: privateMatch[2] };
  }
  
  // Manage URL: vimeo.com/manage/videos/123456789
  const manageMatch = input.match(/vimeo\.com\/manage\/videos\/(\d+)/);
  if (manageMatch) return { id: manageMatch[1] };
  
  // Player URL: player.vimeo.com/video/123456789
  const playerMatch = input.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (playerMatch) return { id: playerMatch[1] };
  
  // Standard Vimeo URL: vimeo.com/123456789
  const standardMatch = input.match(/vimeo\.com\/(\d+)/);
  if (standardMatch) return { id: standardMatch[1] };
  
  // Fallback: Versuche irgendeine Zahl zu finden die wie eine Vimeo-ID aussieht (8-12 Stellen)
  const fallbackMatch = input.match(/(\d{7,12})/);
  if (fallbackMatch) return { id: fallbackMatch[1] };
  
  return null;
}

// Legacy-Funktion für Kompatibilität
function extractVimeoId(input: string): string | null {
  const data = extractVimeoData(input);
  return data?.id || null;
}

/**
 * Extrahiert die YouTube Video-ID aus verschiedenen URL-Formaten
 */
function extractYouTubeId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  const liveMatch = trimmed.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch) return liveMatch[1];

  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  return null;
}

/**
 * Formatiert Sekunden in MM:SS Format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===========================================
// HAUPTKOMPONENTE
// ===========================================

export default function VimeoPlayer({
  videoId,
  videoUrl,
  title,
  autoplay = false,
  muted = false,
  loop = false,
  onProgress,
  onComplete,
  initialProgress = 0,
  className = '',
}: VimeoPlayerProps) {
  // Video-ID und Hash ermitteln
  const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null;
  const isYouTube = Boolean(youtubeId);
  const vimeoData = !isYouTube && videoUrl ? extractVimeoData(videoUrl) : null;
  const id = !isYouTube ? (videoId || vimeoData?.id || null) : null;
  const hash = !isYouTube ? (vimeoData?.hash || null) : null;
  
  // Debug-Output (nur in Entwicklung)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[VimeoPlayer] Props:', { videoId, videoUrl });
      console.log('[VimeoPlayer] Extracted:', { id, hash, youtubeId });
    }
  }, [videoId, videoUrl, id, hash, youtubeId]);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Vimeo Video-Metadaten laden (Thumbnail, Dauer)
  useEffect(() => {
    if (!id || isYouTube) return;
    
    async function fetchMetadata() {
      try {
        // Vimeo oEmbed API für Metadaten (mit Hash für nicht gelistete Videos)
        const vimeoUrl = hash 
          ? `https://vimeo.com/${id}/${hash}`
          : `https://vimeo.com/${id}`;
        const response = await fetch(
          `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoUrl)}`
        );
        
        if (response.ok) {
          const data: VimeoOembedData = await response.json();
          // Thumbnail URL anpassen für höhere Auflösung
          const thumbUrl = data.thumbnail_url.replace(/_\d+x\d+/, '_1280x720');
          setThumbnailUrl(thumbUrl);
          setVideoDuration(data.duration);
        }
      } catch (err) {
        console.error('Failed to fetch Vimeo metadata:', err);
      }
    }
    
    fetchMetadata();
  }, [id, hash, isYouTube]);
  
  // Iframe Message Handler für Vimeo Player Events
  useEffect(() => {
    if (isYouTube) return;
    function handleMessage(event: MessageEvent) {
      // Nur Vimeo Events verarbeiten
      if (!event.origin.includes('vimeo.com')) return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.event === 'ready') {
          setIsLoading(false);
        }
        
        if (data.event === 'play') {
          setIsPlaying(true);
          setHasStarted(true);
        }
        
        if (data.event === 'pause') {
          setIsPlaying(false);
        }
        
        if (data.event === 'timeupdate' && data.data) {
          const time = data.data.seconds || 0;
          setCurrentTime(time);
          onProgress?.(time);
        }
        
        if (data.event === 'ended') {
          setIsPlaying(false);
          onComplete?.();
        }
      } catch (err) {
        // Ignore non-JSON messages
      }
    }
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onProgress, onComplete, isYouTube]);
  
  // Controls Auto-Hide
  useEffect(() => {
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);
  
  // Vimeo Player API Commands
  const sendCommand = useCallback((method: string, value?: any) => {
    if (iframeRef.current?.contentWindow) {
      const message = { method, value };
      iframeRef.current.contentWindow.postMessage(JSON.stringify(message), '*');
    }
  }, []);
  
  // Player Controls
  const handlePlayPause = () => {
    sendCommand(isPlaying ? 'pause' : 'play');
  };
  
  const handleMouseMove = () => {
    setShowControls(true);
  };
  
  const handleStartVideo = () => {
    setHasStarted(true);
    sendCommand('play');
  };
  
  // Keyboard Controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Nur wenn Container fokussiert ist
      if (!containerRef.current?.contains(document.activeElement)) return;
      
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          sendCommand('setCurrentTime', Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          sendCommand('setCurrentTime', currentTime + 10);
          break;
        case 'f':
          e.preventDefault();
          containerRef.current?.requestFullscreen?.();
          break;
        case 'm':
          e.preventDefault();
          sendCommand('setMuted', true);
          break;
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, sendCommand]);
  
  // Kein Video verfügbar
  if (!id && !youtubeId) {
    return (
      <div className={`aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400 p-6">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Play className="w-10 h-10 opacity-50" />
          </div>
          <p className="text-lg font-medium">Kein Video verfügbar</p>
          <p className="text-sm text-gray-500 mt-1">Dieses Video wird später hinzugefügt</p>
          
          {/* Debug-Info nur in Entwicklung */}
          {process.env.NODE_ENV === 'development' && videoUrl && (
            <div className="mt-4 p-3 bg-red-900/30 rounded-lg text-xs text-red-400">
              <p className="font-semibold mb-1">Debug-Info:</p>
              <p className="text-left">URL: {videoUrl}</p>
              <p className="text-left mt-1">ID konnte nicht extrahiert werden</p>
              <p className="text-left mt-2">Unterstützte Formate:</p>
              <ul className="text-left list-disc list-inside mt-1 space-y-0.5">
                <li>vimeo.com/123456789</li>
                <li>player.vimeo.com/video/123456789</li>
                <li>vimeo.com/manage/videos/123456789</li>
                <li>youtube.com/watch?v=VIDEO_ID</li>
                <li>youtu.be/VIDEO_ID</li>
                <li>Nur die Video-ID: 123456789</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (youtubeId) {
    const embedUrl = new URL(`https://www.youtube.com/embed/${youtubeId}`);
    embedUrl.searchParams.set('rel', '0');
    embedUrl.searchParams.set('modestbranding', '1');
    embedUrl.searchParams.set('playsinline', '1');
    embedUrl.searchParams.set('controls', '1');
    if (autoplay) embedUrl.searchParams.set('autoplay', '1');
    if (muted) embedUrl.searchParams.set('mute', '1');
    if (loop) {
      embedUrl.searchParams.set('loop', '1');
      embedUrl.searchParams.set('playlist', youtubeId);
    }

    return (
      <div 
        ref={containerRef}
        className={`relative aspect-video bg-gray-900 rounded-xl overflow-hidden ${className}`}
      >
        <iframe
          ref={iframeRef}
          src={embedUrl.toString()}
          className="w-full h-full"
          frameBorder="0"
          allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
          title={title || 'YouTube Player'}
        />
      </div>
    );
  }

  // Fortschritt berechnen
  const progressPercent = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;
  
  // Vimeo Embed URL mit Optionen
  const embedUrl = new URL(`https://player.vimeo.com/video/${id}`);
  // Hash für private Videos
  if (hash) embedUrl.searchParams.set('h', hash);
  embedUrl.searchParams.set('badge', '0');
  embedUrl.searchParams.set('autopause', '0');
  embedUrl.searchParams.set('player_id', '0');
  embedUrl.searchParams.set('app_id', '58479');
  embedUrl.searchParams.set('api', '1');
  embedUrl.searchParams.set('quality', '1080p');
  embedUrl.searchParams.set('transparent', '0');
  embedUrl.searchParams.set('dnt', '1'); // Do Not Track
  if (autoplay) embedUrl.searchParams.set('autoplay', '1');
  if (muted) embedUrl.searchParams.set('muted', '1');
  if (loop) embedUrl.searchParams.set('loop', '1');
  // Vimeo native Controls ausblenden für custom Controls
  embedUrl.searchParams.set('controls', '1');
  embedUrl.searchParams.set('title', '0');
  embedUrl.searchParams.set('byline', '0');
  embedUrl.searchParams.set('portrait', '0');
  
  return (
    <div 
      ref={containerRef}
      className={`relative aspect-video bg-gray-900 rounded-xl overflow-hidden ${className}`}
    >
      
      {/* Vimeo iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl.toString()}
        className="w-full h-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        title={title || 'Video Player'}
      />
    </div>
  );
}




