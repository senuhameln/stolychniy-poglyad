"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getIcon } from "@/lib/mapIcons";

type MiniMapProps = {
  lat: number;
  lng: number;
};

L.Marker.prototype.options.icon = getIcon();

export default function MiniMap({ lat, lng }: MiniMapProps) {
  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}
