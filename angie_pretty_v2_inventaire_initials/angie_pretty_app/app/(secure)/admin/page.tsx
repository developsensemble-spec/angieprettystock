import { prisma } from "../../../lib-prisma";
import { createUserAction } from "../../actions";
import { currentUser } from "../../../lib-auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
const roleNames:Record<string,string>={ADMIN:"Administrateur",MANAGER:"Gestionnaire général",SALES:"Commercial",BILLING:"Facturier",WAREHOUSE:"Magasinier",DISPATCH_TANA:"Dispatching Tana",DISPATCH_PROVINCE:"Dispatching Province",FEEDBACK_TANA:"Feedback Tana",FEEDBACK_PROVINCE:"Feedback Province"};
export default async function Admin() {
 const user=await currentUser();if(!user)redirect("/login");
 const allowed=["ADMIN","MANAGER"].includes(user.role);
 if(!allowed)return <><div className="page-head"><div><h1>Administration</h1><p className="sub">Gestion des utilisateurs et des permissions.</p></div></div><div className="card"><h2>Accès limité</h2><p className="muted">Seuls l'administrateur et le gestionnaire général peuvent gérer les utilisateurs.</p></div></>;
 const users=await prisma.user.findMany({orderBy:{createdAt:"asc"},select:{id:true,name:true,email:true,role:true,active:true,createdAt:true}});
 return <><div className="page-head"><div><h1>Administration</h1><p className="sub">Comptes utilisateurs, rôles et équipes.</p></div></div>
 <div className="grid two"><section className="card"><h2 className="section-title">Créer un compte</h2><form action={createUserAction}>
 <div className="field"><label>Nom complet</label><input name="name" required minLength={2}/></div><div className="field"><label>E-mail de connexion</label><input name="email" type="email" required/></div><div className="field"><label>Mot de passe initial (12 caractères minimum)</label><input name="password" type="password" minLength={12} required/></div><div className="field"><label>Rôle</label><select name="role">{Object.values(Role).map(r=><option key={r} value={r}>{roleNames[r]}</option>)}</select></div><button className="btn">Créer le compte</button></form></section>
 <section className="card"><h2 className="section-title">Répartition recommandée</h2><div className="list">{[["Commerciaux","12 comptes"],["Facturation","2 à 3 comptes"],["Magasiniers","2 comptes"],["Dispatching","Tana et Province"],["Feedback","Tana et Province"],["Gestion générale","1 ou plusieurs responsables"]].map(([a,b])=><div className="list-row" key={a}><strong>{a}</strong><span className="badge">{b}</span></div>)}</div><p className="footer-note">Créer les comptes individuels, ne partagez jamais un mot de passe entre collègues.</p></section></div>
 <section className="card" style={{marginTop:18}}><h2 className="section-title">Utilisateurs existants</h2><div className="table-wrap"><table><thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Statut</th><th>Créé le</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{roleNames[u.role]}</td><td><span className={`badge ${u.active?"green":"orange"}`}>{u.active?"Actif":"Désactivé"}</span></td><td>{u.createdAt.toLocaleDateString("fr-FR")}</td></tr>)}</tbody></table></div></section></>;
}
