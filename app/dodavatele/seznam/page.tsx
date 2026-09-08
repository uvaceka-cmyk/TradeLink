import { env } from "cloudflare:workers";
import Link from "../../ui/SiteLink";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Seznam dodavatelů", description: "Dodavatelé seřazení podle hodnocení, zkušeností a úplnosti profilu." };

type Supplier = Record<string, string | number | null>;

export default async function Page() {
  const rows = await env.DB.prepare(`SELECT s.id,s.company_name,s.category,s.other_services,s.service_area,s.availability,s.years_experience,s.pricing,s.bio,s.verification_status,ROUND(AVG(r.rating),1) rating,COUNT(r.id) review_count FROM supplier_profiles s LEFT JOIN supplier_reviews r ON r.supplier_id=s.id GROUP BY s.id ORDER BY CASE WHEN COUNT(r.id)=0 THEN 1 ELSE 0 END, AVG(r.rating) DESC, COUNT(r.id) DESC, s.created_at DESC LIMIT 100`).all<Supplier>();
  return <><header className="site-header"><Link href="/" className="brand"><span>Trade</span><strong>Link</strong></Link><nav><Link href="/dodavatele">Zadat poptávku</Link><Link href="/registrace">Registrace</Link></nav></header><main className="simple supplier-directory"><p className="eyebrow">VEŘEJNÝ SEZNAM</p><h1>Dodavatelé</h1><p>Profily s ověřeným hodnocením řadíme výše. Horší hodnocení se zobrazují až za lépe hodnocenými; nové profily bez hodnocení mají neutrální pořadí.</p><div className="job-grid">{rows.results.map(item => <article className="job-card" key={String(item.id)}><div className="job-top"><span className="company-mark">{String(item.company_name)[0]}</span><span className="match">{Number(item.review_count) ? `${item.rating} ★` : "Nový profil"}</span></div><small className={item.verification_status === "verified" ? "verify-badge verified" : "verify-badge"}>{item.verification_status === "verified" ? "✓ Ověřený subjekt" : "Ověření probíhá"}</small><h3>{String(item.company_name)}</h3><p>{String(item.category)} · {String(item.service_area)}</p><div className="tags">{item.availability && <span>{String(item.availability)}</span>}{item.years_experience && <span>{String(item.years_experience)} praxe</span>}</div><p>{String(item.bio || item.other_services || "Profil dodavatele")}</p><b>{String(item.pricing || "Cena dohodou")}</b><small>{Number(item.review_count)} ověřených hodnocení</small></article>)}</div>{rows.results.length === 0 && <p>Zatím nejsou zveřejněné žádné profily.</p>}</main></>;
}
