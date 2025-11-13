// src/lib/mapIcons.ts
import L from "leaflet";

// Базова іконка за замовчуванням
export const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// У майбутньому: об’єкт для кастомних маркерів на теги
const tagIcons: Record<string, L.Icon> = {
  // наприклад:
  // park: L.icon({ iconUrl: "/icons/park.png", ... }),
  // bar: L.icon({ iconUrl: "/icons/bar.png", ... }),
};

// Основна функція
export function getIcon(tags?: string[] | null): L.Icon {
  if (!tags || !tags.length) return defaultIcon;

  for (const t of tags) {
    if (tagIcons[t]) return tagIcons[t];
  }

  return defaultIcon;
}
