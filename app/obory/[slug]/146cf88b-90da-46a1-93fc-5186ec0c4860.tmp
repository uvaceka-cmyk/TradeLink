import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import Link from "../../ui/SiteLink";
import { notFound } from "next/navigation";
import { categories } from "../../data";

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function generateStaticParams() {
  return categories.map((c) => ({ slug: slugify(c[0]) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = categories.find((x) => slugify(x[0]) === slug);
  return c ? { title: `Práce a zakázky – ${c[0]}`, description: `Aktuální práce a zakázky v oboru ${c[0]}. ${c[1]}.`, alternates: { canonical: `/obory/${slug}` } } : {};
}

export const dynamic = "force-dynamic";

type JobRow = { id: string; title: string; location: string; salary: string; company_name: string };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = categories.find((x) => slugify(x[0]) === slug);
  if (!c) notFound();

  let jobs: JobRow[] = [];
  try {
    const r = await env.DB.prepare(
      "SELECT j.id, j.title, j.location, j.salary, e.company_name FROM job_postings j JOIN employer_profiles e ON e.id = j.employer_id WHERE j.status = 'active' AND j.expires_at > ? ORDER BY j.created_at DESC LIMIT 12",
    ).bind(Date.now()).all<JobRow>();
    jobs = r.results;
  } catch {}

  return (
    <main className="simple">
      <Link href="/" className="brand"><span>Zak</span><strong>ly</strong></Link>
      <p className="eyebrow">OBOR</p>
      <h1>{c[0]}</h1>
      <p>{c[1]}</p>
      <h2>Aktuální nabídky</h2>
      <div className="job-grid">
        {jobs.map((j) => (
          <Link className="job-card" href={`/prace/${j.id}`} key={j.id}>
            <small>{j.company_name}</small>
            <h3>{j.title}</h3>
            <b>{j.location} · {j.salary}</b>
          </Link>
        ))}
      </div>
      {jobs.length === 0 && (
        <p className="empty-note">
          Zatím tu nejsou žádné nabídky v tomto oboru. <Link href="/pro-zamestnavatele">Přidejte první →</Link>
        </p>
      )}
    </main>
  );
}
