import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import Link from "../../ui/SiteLink";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };
type Job = {
  slug: string; title: string; company: string; place: string; pay: string; type: string;
  description: string; applyUrl: string; expires: number; created: number; tags: string[];
  match?: number; kind: string; workMode?: string; schedule?: string; startDate?: string;
  requirements?: string; benefits?: string;
};

async function getJob(slug: string): Promise<Job | null> {
  try {
    const j = await env.DB.prepare(
      "SELECT j.id, j.title, j.location, j.employment_type, j.work_mode, j.schedule, j.salary, j.start_date, j.description, j.requirements, j.benefits, j.apply_url, j.expires_at, j.created_at, e.company_name FROM job_postings j JOIN employer_profiles e ON e.id = j.employer_id WHERE j.id = ? AND j.status = 'active'",
    ).bind(slug).first<Record<string, string | number>>();
    if (!j) return null;
    return {
      slug: String(j.id), title: String(j.title), company: String(j.company_name),
      place: String(j.location), pay: String(j.salary), type: String(j.employment_type),
      workMode: String(j.work_mode), schedule: String(j.schedule), startDate: String(j.start_date),
      description: String(j.description), requirements: String(j.requirements), benefits: String(j.benefits),
      applyUrl: String(j.apply_url), expires: Number(j.expires_at), created: Number(j.created_at),
      tags: [], kind: "Práce",
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params, j = await getJob(slug);
  if (!j) return {};
  return {
    title: `${j.title} – ${j.place}`,
    description: `${j.title} ve společnosti ${j.company}. ${j.pay}, ${j.type}.`,
    alternates: { canonical: `/prace/${j.slug}` },
    robots: j.expires < Date.now() ? { index: false, follow: false } : undefined,
  };
}

export default async function JobDetail({ params }: Props) {
  const { slug } = await params, j = await getJob(slug);
  if (!j || j.expires < Date.now()) notFound();
  const jsonLd = {
    "@context": "https://schema.org", "@type": "JobPosting", title: j.title, description: j.description,
    datePosted: new Date(j.created).toISOString(), validThrough: new Date(j.expires).toISOString(),
    employmentType: employmentCode(j.type), hiringOrganization: { "@type": "Organization", name: j.company },
    jobLocation: j.place === "Celá ČR" ? undefined : { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: j.place, addressCountry: "CZ" } },
    jobLocationType: j.workMode === "Plně na dálku" ? "TELECOMMUTE" : undefined, directApply: true,
  };
  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand"><span>Zak</span><strong>ly</strong></Link>
        <Link href="/prace">← Zpět na nabídky</Link>
      </header>
      <main className="detail">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <p className="eyebrow">{j.kind} · {j.place}</p>
        <h1>{j.title}</h1>
        <p className="detail-company">{j.company}</p>
        <div className="detail-grid">
          <article>
            <h2>Náplň práce</h2>
            <p className="pre-line">{j.description}</p>
            {j.requirements && <><h2>Koho hledáme</h2><p className="pre-line">{j.requirements}</p></>}
            {j.benefits && <><h2>Co nabízíme</h2><p className="pre-line">{j.benefits}</p></>}
            {j.tags.length > 0 && <div className="chips static">{j.tags.map((t) => <span key={t}>✓ {t}</span>)}</div>}
            <h2>Jak reaguji</h2>
            <p>Kontaktujete přímo zaměstnavatele. Zakly nepřebírá CV ani neprovádí výběr kandidátů.</p>
          </article>
          <aside>
            {j.match && <span className="match">{j.match}% shoda</span>}
            <strong>{j.pay}</strong>
            <p>⌖ {j.place}<br />◷ {j.type}{j.workMode && <><br />⌂ {j.workMode}</>}{j.schedule && <><br />◴ {j.schedule}</>}{j.startDate && <><br />Nástup: {j.startDate}</>}</p>
            <a className="primary" href={safeApply(j.applyUrl)}>Jdu reagovat ↗</a>
            <small>Nabídka platí do {new Date(j.expires).toLocaleDateString("cs-CZ")}</small>
          </aside>
        </div>
      </main>
    </>
  );
}

function employmentCode(type: string) {
  if (type.includes("HPP")) return "FULL_TIME";
  if (type.includes("DPP") || type.includes("DPČ") || type.includes("Zkrácený")) return "PART_TIME";
  return "CONTRACTOR";
}
function safeApply(value: string) {
  if (value.includes("@") && !value.includes(":")) return `mailto:${value}`;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:" ? value : "#";
  } catch {
    return "#";
  }
}
