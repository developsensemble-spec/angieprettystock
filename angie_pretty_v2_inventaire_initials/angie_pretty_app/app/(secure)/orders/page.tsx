import Link from "next/link";
import { prisma } from "../../../lib-prisma";
import { currentUser } from "../../../lib-auth";
import { redirect } from "next/navigation";
const fr:Record<string,string>={NEW:"Nouvelle",CONFIRMED:"Confirmée",TO_INVOICE:"À facturer",INVOICED:"Facturée",PREPARING:"En préparation",READY_TO_DISPATCH:"Prête à expédier",DISPATCHED:"Expédiée",DELIVERED:"Livrée",DELIVERY_FAILED:"Échec livraison",CANCELLED:"Annulée",RETURN_REQUESTED:"Retour demandé"};
export default async function Orders({searchParams}:{searchParams:Promise<{created?:string}>}) {
 const user=await currentUser();if(!user)redirect("/login");
 const p=await searchParams;
 const rows=await prisma.order.findMany({orderBy:{createdAt:"desc"},include:{customer:true,salesUser:true,invoice:true}});
 return <><div className="page-head"><div><h1>Commandes</h1><p className="sub">Suivi centralisé des commandes Tana et Province.</p></div><Link className="btn" href="/orders/new">＋ Nouvelle commande</Link></div>
 {p.created&&<div className="notice">Commande {p.created} créée et stock réservé.</div>}
 <div className="table-wrap"><table><thead><tr><th>Référence</th><th>Client</th><th>Commercial</th><th>Destination</th><th>Statut</th><th>Paiement</th><th>Total</th><th>Créée le</th></tr></thead><tbody>
 {rows.map(o=><tr key={o.id}><td><strong>{o.number}</strong></td><td>{o.customer.name}<small style={{display:"block",color:"#777"}}>{o.customer.phone}</small></td><td>{o.salesUser.name}</td><td>{o.destination==="TANA"?"Tana":"Province"}</td><td><span className="badge blue">{fr[o.status]||o.status}</span></td><td>{o.paymentStatus==="PAID"?"Payée":o.paymentStatus==="PARTIAL"?"Partielle":o.paymentStatus==="TO_VERIFY"?"À vérifier":"Non payée"}</td><td>{new Intl.NumberFormat("fr-FR").format(o.total)} Ar</td><td>{o.createdAt.toLocaleDateString("fr-FR")}</td></tr>)}
 {!rows.length&&<tr><td colSpan={8} className="empty">Aucune commande pour le moment.</td></tr>}
 </tbody></table></div></>;
}
