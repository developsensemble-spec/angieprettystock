import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "../../../../../lib-prisma";
import { currentUser } from "../../../../../lib-auth";
import PrintButton from "../../PrintButton";

export default async function DispatchSheetDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const sheet = await prisma.dispatchSheet.findUnique({
    where: { id },
    include: {
      createdBy: true,
      items: {
        include: {
          parcel: {
            include: {
              order: {
                include: {
                  customer: true,
                  invoice: true,
                  feedback: true,
                  lines: { include: { variant: { include: { product: true } } } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!sheet) notFound();
  if (user.role === "DISPATCH_TANA" && sheet.items.some(i => i.parcel.destination !== "TANA")) notFound();
  if (user.role === "DISPATCH_PROVINCE" && sheet.items.some(i => i.parcel.destination !== "PROVINCE")) notFound();
  const money = (n: number) => n.toLocaleString("fr-FR") + " Ar";
  return <>
    <div className="page-head print-hide">
      <div><h1>Fiche {sheet.sheetNumber}</h1><p className="sub">Aperçu imprimable · A4 paysage · {sheet.items.length} commandes</p></div>
      <div className="actions"><Link href="/dispatch/history" className="btn outline">Historique</Link><PrintButton /></div>
    </div>
    <article className="dispatch-print">
      <header className="sheet-head">
        <div><h1>ANGIE PRETTY</h1><h2>FICHE DE LIVRAISON ANGIE PRETTY</h2></div>
        <div className="sheet-meta"><div><strong>N° fiche :</strong> {sheet.sheetNumber}</div><div><strong>Date d'assemblage :</strong> {sheet.assembledAt.toLocaleDateString("fr-FR")}</div><div><strong>Axe :</strong> {sheet.axis}</div><div><strong>Livreur :</strong> {sheet.driverName}</div></div>
      </header>
      <table className="dispatch-table"><thead><tr><th>N° facture</th><th>Client</th><th>Téléphone</th><th>Lieu de livraison</th><th>Article / réf. / taille / couleur</th><th>Qté</th><th>Prix unitaire</th><th>Frais livraison</th><th>Total commande</th><th>Feedback</th></tr></thead>
        <tbody>{sheet.items.flatMap(item => item.parcel.order.lines.map(line => <tr key={item.id + line.id}>
          <td>{item.parcel.order.invoice?.number || item.parcel.order.number}</td><td>{item.parcel.order.customer.name}</td><td>{item.parcel.order.customer.phone}</td><td>{item.parcel.order.deliveryAddress}</td>
          <td>{line.variant.product.name}<small>{line.variant.sku} · {line.variant.size} · {line.variant.color}</small></td><td>{line.quantity}</td><td>{money(line.unitPrice)}</td><td>{money(item.parcel.order.deliveryFee)}</td><td>{money(item.parcel.order.total)}</td>
          <td>{item.parcel.order.feedback.map(f => `${f.status}${f.result ? `: ${f.result}` : ""}`).join("; ") || "À recueillir"}</td>
        </tr>))}</tbody>
      </table>
      <footer className="sheet-foot"><span>Fiche conservée dans l'historique ANGIE PRETTY.</span><span>Signature livreur : __________________</span><span>Signature réception : __________________</span></footer>
    </article>
  </>;
}
