import { prisma } from "../../../lib-prisma";
import { invoiceOrderAction, addPaymentAction } from "../../actions";
import { currentUser } from "../../../lib-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
export default async function Invoices({searchParams}:{searchParams:Promise<{error?:string}>}) {
 const user=await currentUser();if(!user)redirect("/login");
 const params=await searchParams;
 const [orders,invoices]=await Promise.all([
 prisma.order.findMany({where:{invoice:null,status:{in:["CONFIRMED","TO_INVOICE"]}},include:{customer:true},orderBy:{createdAt:"asc"}}),
 prisma.invoice.findMany({include:{order:{include:{customer:true}},payments:true},orderBy:{issuedAt:"desc"}})
 ]);
 return <><div className="page-head"><div><h1>Facturation</h1><p className="sub">Factures, paiements et soldes clients.</p></div></div>
 {params.error&&<div className="error">Impossible de créer cette facture : elle existe peut-être déjà.</div>}
 <section className="card"><h2 className="section-title">Commandes à facturer</h2><div className="table-wrap"><table><thead><tr><th>Commande</th><th>Client</th><th>Circuit</th><th>Total</th><th>Action</th></tr></thead><tbody>
 {orders.map(o=><tr key={o.id}><td>{o.number}</td><td>{o.customer.name}</td><td>{o.destination==="TANA"?"Tana":"Province"}</td><td>{new Intl.NumberFormat("fr-FR").format(o.total)} Ar</td><td><form action={invoiceOrderAction}><input type="hidden" name="orderId" value={o.id}/><button className="btn">Créer la facture</button></form></td></tr>)}
 {!orders.length&&<tr><td colSpan={5} className="empty">Aucune commande à facturer.</td></tr>}
 </tbody></table></div></section>
 <section className="card" style={{marginTop:18}}><h2 className="section-title">Factures émises</h2><div className="table-wrap"><table><thead><tr><th>Facture</th><th>Commande</th><th>Client</th><th>Total</th><th>Payé</th><th>Solde</th><th>Facture thermique</th><th>Ajouter paiement</th></tr></thead><tbody>
 {invoices.map(i=>{const paid=i.payments.reduce((n,p)=>n+p.amount,0);return <tr key={i.id}><td>{i.number}</td><td>{i.order.number}</td><td>{i.order.customer.name}</td><td>{new Intl.NumberFormat("fr-FR").format(i.total)} Ar</td><td>{new Intl.NumberFormat("fr-FR").format(paid)} Ar</td><td>{new Intl.NumberFormat("fr-FR").format(i.total-paid)} Ar</td><td><Link className="btn outline" href={`/invoices/${i.id}`}>Aperçu / Imprimer</Link></td><td>{paid<i.total?<form action={addPaymentAction} style={{display:"flex",gap:5}}><input type="hidden" name="invoiceId" value={i.id}/><input name="amount" type="number" min="1" max={i.total-paid} required placeholder="Montant" style={{width:100}}/><select name="method"><option>Espèces</option><option>Mobile Money</option><option>Virement</option><option>Autre</option></select><button className="btn">Ajouter</button></form>:"Soldée"}</td></tr>})}
 {!invoices.length&&<tr><td colSpan={8} className="empty">Aucune facture émise.</td></tr>}
 </tbody></table></div></section>
 <p className="footer-note">Les montants sont exprimés en ariary (Ar). Vérifiez la conformité de la numérotation et des mentions de facture avec les obligations applicables à Madagascar avant mise en production.</p></>;
}
