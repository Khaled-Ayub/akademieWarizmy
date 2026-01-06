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
 * Unterstützt: vimeo.com/123456789, player.vimeo.com/video/123456789
 */
function extractVimeoId(input: string): string | null {
  // Falls es bereits eine reine ID ist (nur Zahlen)
  if (/^\d+$/.test(input)) {
    return input;
  }
  
  // Standard Vimeo URL: vimeo.com/123456789
  const standardMatch = input.match(/vimeo\.com\/(\d+)/);
  if (standardMatch) return standardMatch[1];
  
  // Player URL: player.vimeo.com/video/123456789
  const playerMatch = input.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (playerMatch) return playerMatch[1];
  
  // Privates Video mit Hash: vimeo.com/123456789/abcdef
  const privateMatch = input.match(/vimeo\.com\/(\d+)\/([a-zA-Z0-9]+)/);
  if (privateMatch) return privateMatch[1];
  
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
  // Video-ID ermitteln
  const id = videoId || (videoUrl ? extractVimeoId(videoUrl) : null);
  
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
    if (!id) return;
    
    async function fetchMetadata() {
      try {
        // Vimeo oEmbed API für Metadaten
        const response = await fetch(
          `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}`
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
  }, [id]);
  
  // Iframe Message Handler für Vimeo Player Events
  useEffect(() => {
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
  }, [onProgress, onComplete]);
  
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
  if (!id) {
    return (
      <div className={`aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Play className="w-10 h-10 opacity-50" />
          </div>
          <p className="text-lg font-medium">Kein Video verfügbar</p>
          <p className="text-sm text-gray-500 mt-1">Dieses Video wird später hinzugefügt</p>
        </div>
      </div>
    );
  }
  
  // Fortschritt berechnen
  const progressPercent = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;
  
  // Vimeo Embed URL mit Optionen
  const embedUrl = new URL(`https://player.vimeo.com/video/${id}`);
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
      className={`relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
    >
      {/* Thumbnail Preview (vor Start) */}
      {!hasStarted && thumbnailUrl && (
        <div className="absolute inset-0 z-10">
          <img 
            src={thumbnailUrl} 
            alt={title || 'Video Thumbnail'}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          
          {/* Play Button */}
          <button
            onClick={handleStartVideo}
            className="absolute inset-0 flex items-center justify-center group/play"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary-500 flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover/play:scale-110 group-hover/play:bg-primary-600">
              <Play className="w-10 h-10 md:w-12 md:h-12 text-white ml-1" fill="white" />
            </div>
          </button>
          
          {/* Video Info */}
          {title && (
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-lg md:text-xl font-bold mb-1">{title}</h3>
              {videoDuration > 0 && (
                <p className="text-sm text-white/80">{formatTime(videoDuration)}</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Loading Indicator */}
      {isLoading && hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
          <div className="text-center text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Video wird geladen...</p>
          </div>
        </div>
      )}
      
      {/* Vimeo iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl.toString()}
        className={`w-full h-full ${!hasStarted ? 'opacity-0' : 'opacity-100'}`}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        title={title || 'Video Player'}
      />
      
      {/* Custom Progress Bar (oben) */}
      {hasStarted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/30 z-30">
          <div 
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
      
      {/* Keyboard Hints (unten rechts, nur beim Hover) */}
      <div className={`absolute bottom-4 right-4 z-30 text-xs text-white/60 transition-opacity duration-300 ${showControls && hasStarted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
          <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">K</kbd> Play/Pause</span>
          <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">←/→</kbd> ±10s</span>
          <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">F</kbd> Vollbild</span>
        </div>
      </div>
      
      {/* Zeit-Anzeige (unten links) */}
      {hasStarted && videoDuration > 0 && (
        <div className={`absolute bottom-4 left-4 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(videoDuration)}
          </div>
        </div>
      )}
    </div>
  );
}

