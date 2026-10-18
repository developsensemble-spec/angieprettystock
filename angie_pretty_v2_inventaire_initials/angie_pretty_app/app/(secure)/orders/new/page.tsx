import { prisma } from "../../../../lib-prisma";
import { currentUser } from "../../../../lib-auth";
import { redirect } from "next/navigation";
import { createOrderAction } from "../../../actions";
import OrderLines from "./OrderLines";
export default async function NewOrder() {
 const user=await currentUser();if(!user)redirect("/login");
 const variants=await prisma.variant.findMany({where:{product:{active:true}},include:{product:true},orderBy:{product:{name:"asc"}}});
 const options=variants.map(v=>({id:v.id,label:`${v.product.name} — ${v.model} / ${v.size} / ${v.color}`,available:v.stockOnHand-v.stockReserved,price:v.unitPrice}));
 return <><div className="page-head"><div><h1>Nouvelle commande</h1><p className="sub">Réservez plusieurs articles différents pour un même client en une seule commande.</p></div></div>
 <section className="card"><form action={createOrderAction}>
 <h2 className="section-title">Client</h2><div className="form-grid">
 <div className="field"><label>Nom complet *</label><input name="customerName" required minLength={2}/></div>
 <div className="field"><label>Téléphone *</label><input name="phone" required minLength={5}/></div>
 <div className="field"><label>Destination *</label><select name="destination" required><option value="TANA">Antananarivo (Tana)</option><option value="PROVINCE">Province</option></select></div>
 <div className="field" style={{gridColumn:"1 / -1"}}><label>Adresse de livraison *</label><input name="address" required minLength={4}/></div></div>
 <h2 className="section-title" style={{marginTop:20}}>Articles à réserver</h2><OrderLines variants={options}/>
 <div className="form-grid" style={{marginTop:16}}><div className="field"><label>Frais de livraison (Ar)</label><input name="deliveryFee" type="number" min="0" defaultValue="0"/></div><div className="field"><label>Remise (Ar)</label><input name="discount" type="number" min="0" defaultValue="0"/></div><div className="field" style={{gridColumn:"1 / -1"}}><label>Notes</label><textarea name="notes"/></div></div>
 <button className="btn" style={{marginTop:16}}>Créer la commande et réserver tous les articles</button>
 </form></section></>;
}
