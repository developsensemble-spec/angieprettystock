import { prisma } from "../../../lib-prisma";
export default async function Stock() {
 const variants=await prisma.variant.findMany({include:{product:true},orderBy:{product:{name:"asc"}}});
 const low=variants.filter(v=>v.stockOnHand-v.stockReserved<=v.alertAt).length;
 return <><div className="page-head"><div><h1>Gestion du stock</h1><p className="sub">Stocks physiques, réservations et quantités disponibles.</p></div></div>
 <div className="grid stats"><div className="card"><div className="stat-label">Variantes</div><div className="stat-value">{variants.length}</div></div><div className="card"><div className="stat-label">Stock physique</div><div className="stat-value">{variants.reduce((n,v)=>n+v.stockOnHand,0)}</div></div><div className="card"><div className="stat-label">Quantités réservées</div><div className="stat-value">{variants.reduce((n,v)=>n+v.stockReserved,0)}</div></div><div className="card"><div className="stat-label">Alertes de stock</div><div className="stat-value">{low}</div></div></div>
 <div className="table-wrap"><table><thead><tr><th>SKU</th><th>Produit</th><th>Modèle</th><th>Taille</th><th>Couleur</th><th>Physique</th><th>Réservé</th><th>Disponible</th><th>Seuil</th></tr></thead><tbody>
 {variants.map(v=><tr key={v.id}><td>{v.sku}</td><td>{v.product.name}</td><td>{v.model}</td><td>{v.size}</td><td>{v.color}</td><td>{v.stockOnHand}</td><td>{v.stockReserved}</td><td>{v.stockOnHand-v.stockReserved}</td><td>{v.alertAt}</td></tr>)}
 {!variants.length&&<tr><td colSpan={9} className="empty">Aucune donnée de stock.</td></tr>}
 </tbody></table></div><p className="footer-note">Le stock est réservé à la confirmation de commande et déduit du stock physique lors du dispatching. Les corrections manuelles doivent être journalisées.</p></>;
}
