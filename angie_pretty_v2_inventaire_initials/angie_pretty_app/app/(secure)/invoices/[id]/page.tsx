import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { prisma } from "../../../../lib-prisma";
import { currentUser } from "../../../../lib-auth";
import PrintInvoiceButton from "./PrintInvoiceButton";
const money=(n:number)=>new Intl.NumberFormat("fr-FR").format(n)+" Ar";
export default async function InvoicePreview({params}:{params:Promise<{id:string}>}) {
 const user=await currentUser();if(!user)redirect("/login");
 const {id}=await params;
 const invoice=await prisma.invoice.findUnique({where:{id},include:{order:{include:{customer:true,lines:{include:{variant:{include:{product:true}}}}}},payments:true}});
 if(!invoice)notFound();
 const paid=invoice.payments.reduce((sum,p)=>sum+p.amount,0);
 const qrText=[`ANGIE PRETTY`,`FACTURE: ${invoice.number}`,`COMMANDE: ${invoice.order.number}`,`CLIENT: ${invoice.order.customer.name}`,`TOTAL: ${invoice.total} MGA`,`PAYE: ${paid} MGA`,`SOLDE: ${invoice.total-paid} MGA`].join("\n");
 const qr=await QRCode.toDataURL(qrText,{width:180,margin:1,errorCorrectionLevel:"M"});
 return <><div className="page-head print-hide"><div><h1>Aperçu de la facture</h1><p className="sub">Format ticket thermique 80 mm. Vérifiez le contenu avant impression.</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link className="btn outline" href="/invoices">Retour facturation</Link><PrintInvoiceButton/></div></div>
 <div className="thermal-ticket"><header className="ticket-center"><h1>ANGIE PRETTY</h1><p>FACTURE CLIENT</p><div className="ticket-rule"/></header>
 <div className="ticket-meta"><div><strong>Facture :</strong> {invoice.number}</div><div><strong>Commande :</strong> {invoice.order.number}</div><div><strong>Date :</strong> {new Intl.DateTimeFormat("fr-FR",{dateStyle:"short",timeStyle:"short"}).format(invoice.issuedAt)}</div><div><strong>Client :</strong> {invoice.order.customer.name}</div><div><strong>Tél. :</strong> {invoice.order.customer.phone}</div><div><strong>Livraison :</strong> {invoice.order.deliveryAddress}</div></div>
 <div className="ticket-rule"/><table className="ticket-table"><thead><tr><th>Article</th><th>Qté</th><th>PU</th><th>Total</th></tr></thead><tbody>{invoice.order.lines.map(line=><tr key={line.id}><td>{line.variant.product.name}<small>{line.variant.model} · {line.variant.size} · {line.variant.color}</small></td><td>{line.quantity}</td><td>{new Intl.NumberFormat("fr-FR").format(line.unitPrice)}</td><td>{new Intl.NumberFormat("fr-FR").format(line.lineTotal)}</td></tr>)}</tbody></table>
 <div className="ticket-rule"/><div className="ticket-totals"><div><span>Sous-total</span><strong>{money(invoice.order.subtotal)}</strong></div><div><span>Livraison</span><strong>{money(invoice.order.deliveryFee)}</strong></div><div><span>Remise</span><strong>- {money(invoice.order.discount)}</strong></div><div className="ticket-grand"><span>TOTAL</span><strong>{money(invoice.total)}</strong></div><div><span>Déjà payé</span><strong>{money(paid)}</strong></div><div><span>Reste à payer</span><strong>{money(invoice.total-paid)}</strong></div></div>
 <div className="ticket-center ticket-qr"><img src={qr} alt="QR code de vérification de la facture"/><p>QR de référence facture</p><small>{invoice.number}</small></div><div className="ticket-rule"/><p className="ticket-center ticket-thanks">Merci pour votre confiance !<br/>ANGIE PRETTY</p>
 </div></>;
}
