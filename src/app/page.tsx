'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Make sure the Map component exists at the specified path, or update the path if necessary
const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <Map />
    </main>
  );
}
