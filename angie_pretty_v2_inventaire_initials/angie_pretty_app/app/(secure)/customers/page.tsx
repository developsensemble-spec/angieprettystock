import { prisma } from "../../../lib-prisma";
export default async function Customers() {
 const customers=await prisma.customer.findMany({include:{_count:{select:{orders:true}}},orderBy:{createdAt:"desc"}});
 return <><div className="page-head"><div><h1>Clients</h1><p className="sub">Coordonnées et historique des commandes.</p></div></div>
 <div className="table-wrap"><table><thead><tr><th>Nom</th><th>Téléphone</th><th>Ville</th><th>Adresse</th><th>Commandes</th><th>Client depuis</th></tr></thead><tbody>
 {customers.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.phone}</td><td>{c.city}</td><td>{c.address}</td><td>{c._count.orders}</td><td>{c.createdAt.toLocaleDateString("fr-FR")}</td></tr>)}
 {!customers.length&&<tr><td colSpan={6} className="empty">Aucun client enregistré.</td></tr>}
 </tbody></table></div></>;
}
