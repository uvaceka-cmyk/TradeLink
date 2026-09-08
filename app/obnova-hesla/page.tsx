import Link from "../ui/SiteLink";

type Params = Promise<{ [key: string]: string | string[] | undefined }>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ResetPassword({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const token = first(sp.token);
  const error = first(sp.error);

  if (!token) {
    return (
      <>
        <header className="site-header">
          <Link href="/" className="brand"><span>Trade</span><strong>Link</strong></Link>
        </header>
        <main className="login-page">
          <div>
            <span className="eyebrow">OBNOVA HESLA</span>
            <h1>Odkaz chybí</h1>
            <p>Tuhle stránku je potřeba otevřít z odkazu, který jsme vám poslali e-mailem.</p>
            <small><Link href="/zapomenute-heslo">Poslat odkaz znovu</Link></small>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand"><span>Trade</span><strong>Link</strong></Link>
      </header>
      <main className="login-page">
        <div>
          <span className="eyebrow">OBNOVA HESLA</span>
          <h1>Nastavte si nové heslo</h1>
          <p>Zadejte nové heslo ke svému účtu TradeLink.</p>
          {error && <p className="form-error">{error}</p>}
          <form className="supplier-register" method="post" action="/api/auth/reset-password">
            <input type="hidden" name="token" value={token} />
            <label>Nové heslo *
              <input required name="password" type="password" autoComplete="new-password" minLength={8} placeholder="Alespoň 8 znaků" />
            </label>
            <button className="primary login-main">Nastavit nové heslo →</button>
            <small><Link href="/prihlaseni">Zpět na přihlášení</Link></small>
          </form>
        </div>
      </main>
    </>
  );
}
