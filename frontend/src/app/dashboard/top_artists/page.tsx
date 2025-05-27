// app/top_artists/page.tsx

'use client';

import React, { useEffect, useState } from 'react';

interface Artist {
  name: string;
  genres: string[];
  images: { url: string }[];
}

export default function TopArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/top_artists', {
      method: 'GET',
      credentials: 'include', // include cookies for Django session authenticatessss
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then((data) => setArtists(data.items))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Top Artists</h1>
      {error && <p className="text-blue-500">Error: {error}</p>}
      <ul>
        {artists.map((artist) => (
          <li key={artist.name} className="mb-4">
            <img
              src={artist.images[0]?.url}
              alt={artist.name}
              width={100}
              className="rounded"
            />
            <p className="font-semibold">{artist.name}</p>
            <p className="text-sm text-gray-600">
              {artist.genres.join(', ')}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
