import { prisma } from "../../../lib-prisma";
import { createProductAction } from "../../actions";
export default async function Products() {
 const rows=await prisma.variant.findMany({include:{product:true},orderBy:{createdAt:"desc"}});
 return <><div className="page-head"><div><h1>Catalogue produits</h1><p className="sub">Produits et variantes avec prix et quantité par taille/couleur.</p></div></div>
 <div className="grid two"><section className="card"><h2 className="section-title">Ajouter un produit et sa première variante</h2><form action={createProductAction}>
 <div className="form-grid">
 {[
 ["sku","Référence produit","DEMO-002"],["name","Nom du produit","Robe élégante"],["category","Catégorie","Vêtements"],
 ["variantSku","Référence variante","ROBE-NOIR-M"],["model","Modèle","Modèle 01"],["size","Taille","M"],["color","Couleur","Noir"],["unitPrice","Prix de vente (Ar)","45000"],["stock","Stock initial","10"],["alertAt","Seuil d'alerte","3"]
 ].map(([name,label,placeholder])=><div className="field" key={name}><label>{label} *</label><input name={name} placeholder={placeholder} required type={["unitPrice","stock","alertAt"].includes(name)?"number":"text"} min={["unitPrice","stock","alertAt"].includes(name)?"0":undefined}/></div>)}
 </div><button className="btn">Enregistrer le produit</button></form></section>
 <section className="card"><h2 className="section-title">Règles du catalogue</h2><div className="list">
 <div className="list-row"><div><strong>Références uniques</strong><small>SKU distincts pour produit et variante</small></div></div>
 <div className="list-row"><div><strong>Stock disponible</strong><small>Stock physique moins quantités réservées</small></div></div>
 <div className="list-row"><div><strong>Alertes</strong><small>Seuil configurable pour chaque variante</small></div></div>
 </div></section></div>
 <section className="card" style={{marginTop:18}}><h2 className="section-title">Variantes enregistrées</h2><div className="table-wrap"><table><thead><tr><th>Référence</th><th>Produit</th><th>Modèle</th><th>Taille</th><th>Couleur</th><th>Prix</th><th>Physique</th><th>Réservé</th><th>Disponible</th></tr></thead><tbody>
 {rows.map(v=><tr key={v.id}><td>{v.sku}</td><td>{v.product.name}</td><td>{v.model}</td><td>{v.size}</td><td>{v.color}</td><td>{new Intl.NumberFormat("fr-FR").format(v.unitPrice)} Ar</td><td>{v.stockOnHand}</td><td>{v.stockReserved}</td><td><span className={`badge ${v.stockOnHand-v.stockReserved<=v.alertAt?"orange":"green"}`}>{v.stockOnHand-v.stockReserved}</span></td></tr>)}
 {!rows.length&&<tr><td colSpan={9} className="empty">Aucune variante.</td></tr>}
 </tbody></table></div></section></>;
}
