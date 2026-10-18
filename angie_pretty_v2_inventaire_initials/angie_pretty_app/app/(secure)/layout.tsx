import Link from "next/link";
import { currentUser } from "../../lib-auth";
import { redirect } from "next/navigation";
import { logoutAction } from "../actions";
const nav = [
  ["/","Vue générale"],["/orders","Commandes"],["/invoices","Facturation"],["/stock","Gestion du stock"],
  ["/products","Catalogue produits"],["/inventory-initial","Entrée stock / Inventaire initial"],["/dispatch","Dispatching"],["/feedback","Équipe feedback"],["/cashier","Caissier"],
  ["/reports","Rapports"],["/customers","Clients"],["/admin","Administration"]
];
export default async function SecureLayout({children}:{children:React.ReactNode}) {
  const user=await currentUser(); if(!user) redirect("/login");
  const roleNames:Record<string,string>={ADMIN:"Administrateur",MANAGER:"Gestionnaire général",SALES:"Commercial",BILLING:"Facturier",WAREHOUSE:"Magasinier",DISPATCH_TANA:"Dispatching Tana",DISPATCH_PROVINCE:"Dispatching Province",FEEDBACK_TANA:"Feedback Tana",FEEDBACK_PROVINCE:"Feedback Province"};
  return <div className="shell"><aside className="sidebar">
    <Link href="/" className="brand"><div className="brand-mark">AP</div><div><strong>ANGIE PRETTY</strong><small>GESTION DES VENTES</small></div></Link>
    <nav className="nav">{nav.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}</nav>
    <div className="sidebar-foot">Plateforme interne<br/>Tana · Province</div>
  </aside><div className="main"><header className="topbar"><div><strong>Espace de gestion</strong><br/><small>Ventes · Stock · Expéditions</small></div><div style={{display:"flex",alignItems:"center",gap:12}}><span className="user-pill">{user.name} · {roleNames[user.role]}</span><form action={logoutAction}><button className="btn outline">Déconnexion</button></form></div></header><main className="content">{children}</main></div></div>;
}
