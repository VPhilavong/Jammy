'use client';
import React, { useEffect, useState, useCallback } from 'react';

interface Artist {
  name: string;
  images?: { url: string; height: number; width: number }[];
  external_urls?: { spotify: string };
}

interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: {
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  genres?: string[];
  popularity: number;
  duration_ms: number;
  external_urls: { spotify: string };
  preview_url?: string;
}

interface ApiResponse {
  items: Track[];
  total: number;
  limit: number;
  offset: number;
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export default function TopTracksPage(): JSX.Element {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const formatDuration = useCallback((ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const getArtistImage = useCallback((artist: Artist): string | null => {
    return artist.images?.[0]?.url || null;
  }, []);

  const fetchTopTracks = useCallback(async (): Promise<void> => {
    setLoadingState('loading');
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/top_tracks', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      
      // Enhanced to fetch artist images if not already included
      const tracksWithArtistDetails = await Promise.all(
        (data.items || []).map(async (track) => {
          // Fetch artist details for all artists to get their images
          const artistsWithImages = await Promise.all(
            track.artists.map(async (artist) => {
              // Always try to fetch artist details to get images
              try {
                const artistResponse = await fetch(`http://localhost:8000/artist/${encodeURIComponent(artist.name)}`, {
                  credentials: 'include',
                });
                
                if (artistResponse.ok) {
                  const artistData = await artistResponse.json();
                  return {
                    ...artist,
                    images: artistData.images || [],
                    external_urls: artistData.external_urls || artist.external_urls,
                  };
                }
              } catch (err) {
                console.error(`Failed to fetch details for artist ${artist.name}:`, err);
              }
              
              // Return original artist if fetch fails
              return artist;
            })
          );

          return {
            ...track,
            artists: artistsWithImages,
          };
        })
      );
      
      setTracks(tracksWithArtistDetails);
      setLoadingState('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoadingState('error');
    }
  }, []);

  useEffect(() => {
    fetchTopTracks();
  }, [fetchTopTracks]);

  const LoadingSpinner = (): JSX.Element => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-amber-200 border-t-transparent mx-auto shadow-2xl"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-600/20 blur-xl"></div>
        </div>
        <div className="space-y-2">
          <p className="text-amber-200 text-xl font-semibold tracking-wide">Loading your top tracks</p>
          <div className="flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }): JSX.Element => (
    <div className="bg-gradient-to-r from-red-900/90 to-red-800/90 backdrop-blur-sm border border-red-700/50 rounded-2xl p-8 text-center shadow-2xl">
      <div className="space-y-4">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-red-200 text-xl font-semibold mb-2">Something went wrong</h3>
          <p className="text-red-300/80 text-sm mb-6">{message}</p>
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  // Enhanced artist image component with better fallback
  const ArtistAvatar = ({ artist }: { artist: Artist }): JSX.Element => {
    const artistImage = getArtistImage(artist);
    
    return (
      <div 
        className="w-10 h-10 rounded-full border-2 border-slate-600 overflow-hidden bg-gradient-to-br from-amber-800 to-red-900 shadow-lg group-hover:scale-110 transition-all duration-300 hover:border-amber-400"
        title={artist.name}
      >
        {artistImage ? (
          <img
            src={artistImage}
            alt={artist.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Hide broken images and show fallback
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-amber-200 text-xs font-bold">
              {artist.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    );
  };

  const TrackCard = ({ track, index }: { track: Track; index: number }): JSX.Element => (
    <div
      className="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl hover:shadow-3xl transform hover:-translate-y-3 transition-all duration-500 border border-amber-200/10 hover:border-amber-200/30 cursor-pointer overflow-hidden"
      onClick={() => setSelectedTrack(track)}
    >
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
      
      {/* Rank Badge */}
      <div className="absolute -top-3 -right-3 z-10">
        <div className="bg-gradient-to-r from-red-900 to-amber-800 text-amber-200 rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold shadow-2xl border-2 border-amber-200/20">
          #{index + 1}
        </div>
      </div>

      {/* Album Art */}
      <div className="relative mb-6">
        <div className="aspect-square rounded-2xl overflow-hidden bg-slate-700 shadow-2xl ring-2 ring-amber-200/20 group-hover:ring-amber-200/40 transition-all duration-300">
          {track.album.images?.[0]?.url ? (
            <img
              src={track.album.images[0].url}
              alt={`${track.name} album cover`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-800 to-red-900 flex items-center justify-center">
              <svg className="w-20 h-20 text-amber-200/50" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-200">
            <svg className="w-6 h-6 text-slate-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Track Info */}
      <div className="relative z-10 space-y-4">
        <div>
          <h3 className="text-amber-200 font-bold text-xl leading-tight mb-2 group-hover:text-white transition-colors duration-300 line-clamp-2">
            {track.name}
          </h3>
          <p className="text-amber-200/70 text-sm font-medium">
            {track.artists.map(artist => artist.name).join(', ')}
          </p>
        </div>

        {/* Artist Images - Enhanced section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-amber-200/60 text-xs font-medium uppercase tracking-wider">Artists</span>
            <div className="flex -space-x-2">
              {track.artists.slice(0, 4).map((artist, artistIndex) => (
                <ArtistAvatar key={artistIndex} artist={artist} />
              ))}
              {track.artists.length > 4 && (
                <div className="w-10 h-10 rounded-full border-2 border-slate-600 bg-slate-700 flex items-center justify-center text-xs text-amber-200/70 font-bold hover:border-amber-400 transition-colors">
                  +{track.artists.length - 4}
                </div>
              )}
            </div>
          </div>
          
          {/* Spotify link */}
          {track.external_urls?.spotify && (
            <a
              href={track.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 transition-colors"
              title="Open in Spotify"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.479.179-.66.479-.66 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02v-.12zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.12 10.561 18.72 12.84c.361.181.481.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </a>
          )}
        </div>

        {/* Track Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-amber-200/60">
              <span>Popularity</span>
              <span>{track.popularity}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-600 to-amber-400 h-2 rounded-full transition-all duration-1000 shadow-lg"
                style={{ width: `${track.popularity}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-amber-200/60 mb-1">Duration</p>
            <p className="text-amber-200 font-mono text-sm font-semibold">
              {formatDuration(track.duration_ms)}
            </p>
          </div>
        </div>

        {/* Genres */}
        {track.genres && track.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {track.genres.slice(0, 2).map((genre, genreIndex) => (
              <span
                key={genreIndex}
                className="px-3 py-1 bg-gradient-to-r from-amber-800/80 to-red-900/80 text-amber-200 rounded-full text-xs font-medium backdrop-blur-sm border border-amber-200/20"
              >
                {genre}
              </span>
            ))}
            {track.genres.length > 2 && (
              <span className="px-3 py-1 bg-slate-700/80 text-amber-200/70 rounded-full text-xs backdrop-blur-sm">
                +{track.genres.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (loadingState === 'loading') {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/80 to-amber-800/80 backdrop-blur-sm" />
        <div className="relative px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 mb-6 tracking-tight">
              Your Top Tracks
            </h1>
            <p className="text-amber-200/80 text-xl md:text-2xl font-light max-w-2xl mx-auto leading-relaxed">
              Discover your most played songs and explore your musical journey through personalized insights
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-16">
        {loadingState === 'error' && error && (
          <div className="mb-12">
            <ErrorState message={error} onRetry={fetchTopTracks} />
          </div>
        )}

        {loadingState === 'success' && tracks.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
              </svg>
            </div>
            <h3 className="text-amber-200 text-2xl font-bold mb-4">No tracks found</h3>
            <p className="text-amber-200/60 text-lg max-w-md mx-auto">
              Start listening to music on Spotify to build your personalized top tracks list!
            </p>
          </div>
        )}

        {loadingState === 'success' && tracks.length > 0 && (
          <>
            <div className="text-center mb-12">
              <p className="text-amber-200/70 text-lg">
                Showing your top <span className="font-bold text-amber-400">{tracks.length}</span> tracks
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {tracks.map((track, index) => (
                <TrackCard key={track.id || index} track={track} index={index} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="relative border-t border-amber-200/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.479.179-.66.479-.66 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02v-.12zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.12 10.561 18.72 12.84c.361.181.481.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span className="text-amber-200/80 font-medium">Powered by Spotify</span>
            </div>
            <p className="text-amber-200/50 text-sm">
              Your music, beautifully displayed with love ❤️
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}