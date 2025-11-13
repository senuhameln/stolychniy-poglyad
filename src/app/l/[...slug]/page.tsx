// src/app/l/[...slug]/page.tsx
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import MiniMap from "@/components/MiniMap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ParamsPromise = Promise<{ slug?: string[] }>;

export default async function LocationPage({ params }: { params: ParamsPromise }) {
  const p = await params;
  const parts = Array.isArray(p.slug) ? p.slug : [];
  const slug = (parts.filter(Boolean).pop() ?? "").replace(/^\/+|\/+$/g, "").trim();

  const { data } = await supabase.from("locations").select("*").eq("slug", slug).maybeSingle();
  if (!data) return <pre>Не знайдено</pre>;

  const md = (data.content_md || "").replace(/\\n/g, "\n");
  const links = (data.external_links || []) as Array<{ type: string; url: string }>;
  const yt = links.filter((x) => x.type === "youtube");

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {}
      <Link href="/" className="opacity-70 hover:opacity-100">
        ← Назад до мапи
      </Link>

      <h1 className="text-3xl font-bold">{data.title}</h1>
      <div className="text-sm opacity-70">
        {data.district}
        {data.tags?.length ? " · " + data.tags.join(" · ") : ""}
      </div>

      {data.lat && data.lng && (
        <MiniMap lat={data.lat} lng={data.lng} />
      )}

      {md && <ReactMarkdown>{md}</ReactMarkdown>}

      {yt.map((v) => {
        const id = v.url.match(/(?:v=|be\/)([A-Za-z0-9_-]{6,})/)?.[1];
        return id ? (
          <div key={id} className="aspect-video">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${id}`}
              allowFullScreen
            />
          </div>
        ) : null;
      })}
    </div>
  );
}
