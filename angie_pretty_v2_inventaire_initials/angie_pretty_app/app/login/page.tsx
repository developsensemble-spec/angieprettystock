import { loginAction } from "../actions";
export default async function Login({ searchParams }: { searchParams: Promise<{error?:string}> }) {
  const params = await searchParams;
  return <main className="login-wrap"><section className="login-card">
    <div className="brand"><div className="brand-mark">AP</div><div><strong>ANGIE PRETTY</strong><small>GESTION DES VENTES</small></div></div>
    <h1>Connexion</h1><p className="sub" style={{marginBottom:22}}>Connectez-vous à votre espace professionnel.</p>
    {params.error && <div className="error">Identifiants incorrects ou compte inactif.</div>}
    <form action={loginAction}>
      <div className="field"><label>Adresse e-mail</label><input name="email" type="email" required autoComplete="username" placeholder="vous@angiepretty.mg"/></div>
      <div className="field"><label>Mot de passe</label><input name="password" type="password" required autoComplete="current-password" placeholder="Votre mot de passe"/></div>
      <button className="btn" style={{width:"100%",marginTop:8}}>Se connecter</button>
    </form>
    <p className="footer-note">Accès réservé aux utilisateurs autorisés. Si vous avez oublié votre mot de passe, contactez l'administrateur.</p>
  </section></main>;
}
