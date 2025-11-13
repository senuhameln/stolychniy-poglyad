"use client";

import dynamic from "next/dynamic";

const MiniMap = dynamic(() => import("@/components/MiniMap"), {
  ssr: false,
});

type MiniMapClientProps = {
  lat: number;
  lng: number;
};

export default function MiniMapClient(props: MiniMapClientProps) {
  return <MiniMap {...props} />;
}
