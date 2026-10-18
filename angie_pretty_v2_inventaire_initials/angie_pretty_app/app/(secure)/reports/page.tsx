import { prisma } from "../../../lib-prisma";
export default async function Reports() {
 const [orders, invoices, variants, parcels, feedback] = await Promise.all([
 prisma.order.findMany({where:{status:{not:"CANCELLED"}},select:{total:true,destination:true,status:true,createdAt:true,salesUser:{select:{name:true}}}}),
 prisma.invoice.findMany({include:{payments:true}}),
 prisma.variant.findMany(),
 prisma.parcel.findMany(),
 prisma.feedback.findMany()
 ]);
 const total=orders.reduce((s,o)=>s+o.total,0);
 const paid=invoices.reduce((s,i)=>s+i.payments.reduce((a,p)=>a+p.amount,0),0);
 const bySales=Object.entries(orders.reduce((acc,o)=>{acc[o.salesUser.name]=(acc[o.salesUser.name]||0)+o.total;return acc;},{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]).slice(0,10);
 const money=(n:number)=>new Intl.NumberFormat("fr-FR").format(n)+" Ar";
 return <><div className="page-head"><div><h1>Rapports et statistiques</h1><p className="sub">Indicateurs calculés à partir des données enregistrées.</p></div></div>
 <div className="grid stats"><div className="card"><div className="stat-label">Ventes (commandes actives)</div><div className="stat-value" style={{fontSize:22}}>{money(total)}</div></div><div className="card"><div className="stat-label">Paiements enregistrés</div><div className="stat-value" style={{fontSize:22}}>{money(paid)}</div></div><div className="card"><div className="stat-label">Variantes produits</div><div className="stat-value">{variants.length}</div></div><div className="card"><div className="stat-label">Colis / feedbacks</div><div className="stat-value">{parcels.length} / {feedback.length}</div></div></div>
 <div className="grid two"><section className="card"><h2 className="section-title">Ventes par commercial</h2>{bySales.map(([name,value])=><div key={name} style={{marginBottom:16}}><div className="list-row"><strong>{name}</strong><b>{money(value)}</b></div><div className="progress"><span style={{width:`${Math.round(value/(bySales[0]?.[1]||1)*100)}%`}}/></div></div>)}{!bySales.length&&<div className="empty">Pas encore de ventes.</div>}</section>
 <section className="card"><h2 className="section-title">Répartition des commandes</h2><div className="list-row"><strong>Tana</strong><b>{orders.filter(o=>o.destination==="TANA").length}</b></div><div className="list-row"><strong>Province</strong><b>{orders.filter(o=>o.destination==="PROVINCE").length}</b></div><div className="list-row"><strong>Livrées</strong><b>{orders.filter(o=>o.status==="DELIVERED").length}</b></div><div className="list-row"><strong>Échecs de livraison</strong><b>{orders.filter(o=>o.status==="DELIVERY_FAILED").length}</b></div><div className="list-row"><strong>Feedbacks avec réclamation</strong><b>{feedback.filter(f=>f.status==="COMPLAINT").length}</b></div></section></div>
 <p className="footer-note">Les indicateurs sont des agrégats de gestion et ne remplacent pas une comptabilité légale ou une validation fiscale.</p></>;
}
