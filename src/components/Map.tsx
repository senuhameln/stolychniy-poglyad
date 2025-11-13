"use client";

import { getIcon } from "@/lib/mapIcons";
import { DISTRICTS } from "@/lib/districts";
import { TAGS } from "@/lib/tags";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

L.Marker.prototype.options.icon = getIcon(); // дефолт

type Loc = {
  title: string;
  slug: string;
  lat: number;
  lng: number;
  tags: string[] | null;
  district: string | null;
  summary: string | null;
};

type Filters = {
  q: string;
  district: string;
  tags: string[];
  match: "any" | "all";
};

type BBoxLoaderProps = {
  setData: (d: Loc[]) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  filters: Filters;
};

function BBoxLoader({ setData, setLoading, setError, filters }: BBoxLoaderProps) {
  const lastRef = useRef<{ bbox: string; key: string } | null>(null);

  const map = useMapEvents({
    moveend: async () => {
      const b = map.getBounds();

      // трішки підрізаємо шум: округлення координат
      const round = (n: number) => Math.round(n * 10000) / 10000;

      const minLng = round(b.getWest());
      const minLat = round(b.getSouth());
      const maxLng = round(b.getEast());
      const maxLat = round(b.getNorth());

      const bbox = [minLng, minLat, maxLng, maxLat].join(",");

      const key =
        `${filters.q}|${filters.district}|` +
        `${filters.tags.join(",")}|${filters.match}`;

      // якщо bbox + фільтри не змінились — не фетчимо
      if (lastRef.current && lastRef.current.bbox === bbox && lastRef.current.key === key) {
        return;
      }
      lastRef.current = { bbox, key };

      const params = new URLSearchParams();
      params.set("bbox", bbox);
      params.set("limit", "500");
      if (filters.q) params.set("q", filters.q);
      if (filters.district) params.set("district", filters.district);
      if (filters.tags.length) params.set("tags", filters.tags.join(","));
      params.set("match", filters.match);

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/locations?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.data || []);
      } catch (e) {
        console.error(e);
        setError("Не вдалося завантажити локації");
        setData([]);
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    map.fire("moveend");
  }, [map, filters]);

  return null;
}

export default function Map() {
  const [data, setData] = useState<Loc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    q: "",
    district: "",
    tags: [],
    match: "any",
  });

  // вибрана локація для блоку 2
  const [selected, setSelected] = useState<Loc | null>(null);

  // debounce фільтрів
  const [debouncedFilters, setDebouncedFilters] = useState<Filters>(filters);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedFilters(filters), 400);
    return () => clearTimeout(id);
  }, [filters]);

  const center = useMemo<[number, number]>(() => [50.45, 30.52], []);
  // умовні межі Києва + трохи околиць
  const kyivBounds: [[number, number], [number, number]] = [
    [50.2, 30.2], // південний-захід
    [50.7, 30.9], // північний-схід
  ];

  return (
    <main className="min-h-screen flex justify-center items-start bg-slate-100 text-gray-900">
      <div className="w-full max-w-6xl px-2 py-4">
        <div className="flex flex-col lg:flex-row gap-4 bg-white rounded-2xl shadow-md p-4">
          {/* Ліва панель з фільтрами / прев'ю */}
          <section className="w-full lg:w-[360px] lg:flex-shrink-0">
            <div className="w-full max-w-none flex flex-col gap-3">
              {/* 1. Фільтри */}
              <div className="bg-white/95 backdrop-blur px-4 py-3 flex flex-col gap-2 rounded-xl shadow border">
                <input
                  type="text"
                  placeholder="Пошук по назві…"
                  value={filters.q}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, q: e.target.value }))
                  }
                  className="border rounded px-2 py-1 text-sm w-full"
                />

                <select
                  value={filters.district}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, district: e.target.value }))
                  }
                  className="border rounded px-2 py-1 text-sm w-full"
                >
                  <option value="">Всі райони</option>
                  {DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <button
                    type="button"
                    className="border rounded px-2 py-1 text-sm w-full text-left bg-white"
                    onClick={(e) => {
                      const menu = (e.currentTarget.nextElementSibling as HTMLElement);
                      menu.classList.toggle("hidden");
                    }}
                  >
                    {filters.tags.length > 0 ? `Теги (${filters.tags.length})` : "Виберіть теги"}
                  </button>
                  <div className="hidden absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                    {TAGS.map((tag) => (
                      <label
                        key={tag}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={filters.tags.includes(tag)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters((f) => ({
                                ...f,
                                tags: [...f.tags, tag],
                              }));
                            } else {
                              setFilters((f) => ({
                                ...f,
                                tags: f.tags.filter((t) => t !== tag),
                              }));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filters.match}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        match: e.target.value === "all" ? "all" : "any",
                      }))
                    }
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="any">Теги: будь-який</option>
                    <option value="all">Теги: всі</option>
                  </select>

                  <button
                    onClick={() => {
                      setFilters({ q: "", district: "", tags: [], match: "any" });
                      setSelected(null);
                    }}
                    className="ml-auto border rounded px-3 py-1 text-sm hover:bg-gray-100"
                  >
                    Скинути
                  </button>
                </div>
              </div>

              {/* 2. Прев’ю вибраної локації */}
              <div className="bg-white rounded-xl shadow border p-4 flex-1 flex flex-col">
                {selected ? (
                  <>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Обрана локація
                    </div>
                    <h2 className="text-lg font-semibold mb-1">
                      {selected.title}
                    </h2>
                    <div className="text-xs text-gray-500 mb-2">
                      {selected.district}
                      {selected.tags?.length
                        ? " · " + selected.tags.join(" · ")
                        : ""}
                    </div>
                    {selected.summary && (
                      <p className="text-sm text-gray-700 mb-3 line-clamp-4">
                        {selected.summary}
                      </p>
                    )}
                    <Link
                      href={`/l/${encodeURIComponent(
                        (selected.slug || "").replace(/^\/+|\/+$/g, "")
                      )}`}
                      className="mt-auto inline-flex items-center justify-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md px-3 py-1.5"
                    >
                      Відкрити сторінку
                    </Link>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-start justify-center gap-2 text-sm text-gray-500">
                    <div className="text-xs uppercase tracking-wide">
                      Обрана локація
                    </div>
                    <p>
                      Натисни на маркер на мапі праворуч, щоб побачити короткий
                      опис місця.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Секція карти */}
          <section className="w-full h-[60vh] lg:h-[80vh]">
            <div className="relative h-full rounded-2xl overflow-hidden border shadow bg-white">
              {loading && (
                <div className="absolute top-2 right-2 z-[900] bg-white/80 rounded-full p-1 shadow">
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
                </div>
              )}

              {error && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[950] bg-red-500 text-white text-sm px-3 py-1 rounded shadow">
                  {error}
                </div>
              )}

              {!loading && !error && data.length === 0 && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[950] bg-white text-gray-900 text-sm px-3 py-1 rounded shadow border">
                  Нічого не знайдено для цих фільтрів
                </div>
              )}

              <div className="w-full h-full">
                <MapContainer
                  center={center}
                  zoom={12}
                  className="w-full h-full"
                  maxBounds={kyivBounds}
                  maxBoundsViscosity={1.0}
                  minZoom={11}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <BBoxLoader
                    setData={setData}
                    setLoading={setLoading}
                    setError={setError}
                    filters={debouncedFilters}
                  />
                  {data.map((p) => (
                    <Marker
                      key={p.slug}
                      position={[p.lat, p.lng]}
                      icon={getIcon(p.tags)}
                      eventHandlers={{
                        click: () => setSelected(p),
                      }}
                    >
                      <Popup>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <b>{p.title}</b>
                          {p.summary && (
                            <span style={{ opacity: 0.8, fontSize: 12 }}>
                              {p.summary}
                            </span>
                          )}
                          <Link
                            href={`/l/${encodeURIComponent(
                              (p.slug || "").replace(/^\/+|\/+$/g, "")
                            )}`}
                            style={{
                              color: "#2563eb",
                              textDecoration: "underline",
                            }}
                          >
                            Детальніше
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
