// app/top_tracks/page.tsx

'use client' ;
import React, { useEffect, useState } from 'react';

interface Track{
    name: string; 
    genres: string[];
    images: { url: string }[];

}

export default function TopTracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/top_tracks', {
      method: 'GET',
      credentials: 'include', // include cookies for Django session authenticatessss
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then((data) => setTracks(data.items))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Top Artists</h1>
      {error && <p className="text-blue-500">Error: {error}</p>}
      <ul>
        {tracks.map((tracks, index) => (
          <li key={index} className="mb-4">
            <img
              src={tracks.images?.[0]?.url}
              alt={tracks.name}
              width={100}
              className="rounded"
            />
            <p className="font-semibold">{tracks.name}</p>
            <p className="text-sm text-gray-600">
            {tracks.genres?.length ? tracks.genres.join(', ') : 'No genres available'}

            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}