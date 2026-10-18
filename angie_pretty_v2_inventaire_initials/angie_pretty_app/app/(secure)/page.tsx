import Link from "next/link";
import { prisma } from "../../lib-prisma";
import { currentUser } from "../../lib-auth";
import { redirect } from "next/navigation";
import { OrderStatus, ParcelStatus, FeedbackStatus } from "@prisma/client";

function money(value: number) { return new Intl.NumberFormat("fr-FR").format(value) + " Ar"; }
const statusFr: Record<string,string> = {
  NEW:"Nouvelle", CONFIRMED:"Confirmée", TO_INVOICE:"À facturer", INVOICED:"Facturée", PREPARING:"En préparation",
  READY_TO_DISPATCH:"Prête à expédier", DISPATCHED:"Expédiée", DELIVERED:"Livrée", DELIVERY_FAILED:"Échec livraison",
  CANCELLED:"Annulée", RETURN_REQUESTED:"Retour demandé"
};
export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const today = new Date(); today.setHours(0,0,0,0);
  const [ordersToday, orders, invoiceCount, parcelCount, feedbackCount, sales, lowStock, recent] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: { notIn: [OrderStatus.CANCELLED] } } }),
    prisma.invoice.count({ where: { status: "ISSUED" } }),
    prisma.parcel.count({ where: { status: { in: [ParcelStatus.TO_PREPARE, ParcelStatus.PREPARING, ParcelStatus.READY] } } }),
    prisma.feedback.count({ where: { status: { in: [FeedbackStatus.TO_CONTACT, FeedbackStatus.FOLLOW_UP] } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: today }, status: { notIn: [OrderStatus.CANCELLED] } }, _sum: { total: true } }),
    prisma.variant.count({ where: { stockOnHand: { lte: 3 } } }),
    prisma.order.findMany({ take: 7, orderBy: { createdAt: "desc" }, include: { customer: true, salesUser: true } })
  ]);
  const totalTana = await prisma.order.count({ where: { destination: "TANA", status: { not: "CANCELLED" } } });
  const totalProvince = await prisma.order.count({ where: { destination: "PROVINCE", status: { not: "CANCELLED" } } });
  const sum = totalTana + totalProvince || 1;
  return <div>
    <div className="page-head"><div><h1>Tableau de bord</h1><p className="sub">Bonjour {user.name}, voici l'activité de ANGIE PRETTY.</p></div><Link className="btn" href="/orders/new">＋ Nouvelle commande</Link></div>
    <div className="grid stats">
      <div className="card"><div className="stat-label">Commandes aujourd'hui</div><div className="stat-value">{ordersToday}</div><div className="stat-note">Toutes destinations</div></div>
      <div className="card"><div className="stat-label">Ventes du jour</div><div className="stat-value">{money(sales._sum.total || 0)}</div><div className="stat-note">Montant des commandes non annulées</div></div>
      <div className="card"><div className="stat-label">Factures émises</div><div className="stat-value">{invoiceCount}</div><div className="stat-note">Documents enregistrés</div></div>
      <div className="card"><div className="stat-label">Colis à préparer</div><div className="stat-value">{parcelCount}</div><div className="stat-note">{feedbackCount} feedbacks à suivre</div></div>
    </div>
    <div className="grid two">
      <section className="card"><h2 className="section-title">Commandes récentes</h2>
        <div className="table-wrap"><table><thead><tr><th>Référence</th><th>Client</th><th>Destination</th><th>Statut</th><th>Total</th></tr></thead><tbody>
          {recent.map(o=><tr key={o.id}><td><Link href="/orders"><strong>{o.number}</strong></Link></td><td>{o.customer.name}</td><td>{o.destination==="TANA"?"Tana":"Province"}</td><td><span className="badge blue">{statusFr[o.status]||o.status}</span></td><td>{money(o.total)}</td></tr>)}
          {!recent.length && <tr><td colSpan={5} className="empty">Aucune commande enregistrée.</td></tr>}
        </tbody></table></div>
      </section>
      <div className="grid">
        <section className="card"><h2 className="section-title">Répartition par circuit</h2>
          <div className="list-row"><div><strong>Antananarivo (Tana)</strong><small>{totalTana} commandes</small></div><b>{Math.round(totalTana/sum*100)}%</b></div>
          <div className="progress"><span style={{width:`${Math.round(totalTana/sum*100)}%`}}/></div>
          <div className="list-row"><div><strong>Province</strong><small>{totalProvince} commandes</small></div><b>{Math.round(totalProvince/sum*100)}%</b></div>
          <div className="progress"><span style={{width:`${Math.round(totalProvince/sum*100)}%`,background:"#d49a51"}}/></div>
        </section>
        <section className="card"><h2 className="section-title">Alertes opérationnelles</h2>
          <div className="list-row"><div><strong>Stock bas</strong><small>Variantes au seuil ou en dessous</small></div><span className="badge orange">{lowStock}</span></div>
          <div className="list-row"><div><strong>Commandes suivies</strong><small>Commandes actives</small></div><span className="badge">{orders}</span></div>
          <Link className="btn secondary" href="/stock">Consulter le stock →</Link>
        </section>
      </div>
    </div>
  </div>;
}
