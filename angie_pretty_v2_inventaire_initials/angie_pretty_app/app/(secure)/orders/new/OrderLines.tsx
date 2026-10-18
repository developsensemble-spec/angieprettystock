"use client";
import { useMemo, useState } from "react";
type VariantOption = {id:string; label:string; available:number; price:number};
export default function OrderLines({variants}:{variants:VariantOption[]}) {
 const [lines,setLines]=useState([{key:1,variantId:"",quantity:"1"}]);
 const add=()=>setLines(old=>[...old,{key:Math.max(0,...old.map(x=>x.key))+1,variantId:"",quantity:"1"}]);
 const update=(key:number,field:"variantId"|"quantity",value:string)=>setLines(old=>old.map(l=>l.key===key?{...l,[field]:value}:l));
 const remove=(key:number)=>setLines(old=>old.length===1?old:old.filter(l=>l.key!==key));
 const total=useMemo(()=>lines.reduce((sum,l)=>{const v=variants.find(x=>x.id===l.variantId);return sum+(v?.price||0)*(Math.max(0,Number(l.quantity)||0));},0),[lines,variants]);
 return <>
  {lines.map((line,index)=>{const selected=variants.find(v=>v.id===line.variantId);const used=new Set(lines.filter(l=>l.key!==line.key).map(l=>l.variantId));return <div className="card" key={line.key} style={{padding:14,marginBottom:10,background:"var(--surface, #fafafa)"}}>
   <div className="page-head compact"><strong>Article {index+1}</strong>{lines.length>1&&<button type="button" className="btn outline" onClick={()=>remove(line.key)}>Retirer</button>}</div>
   <div className="form-grid">
    <div className="field" style={{gridColumn:"1 / -1"}}><label>Produit · modèle · taille · couleur *</label><select name="variantId" required value={line.variantId} onChange={e=>update(line.key,"variantId",e.target.value)}><option value="">Choisir une variante</option>{variants.map(v=><option key={v.id} value={v.id} disabled={v.available<=0||(used.has(v.id))}>{v.label} — {new Intl.NumberFormat("fr-FR").format(v.price)} Ar (disponible : {v.available}){used.has(v.id)?" · déjà ajouté":""}</option>)}</select></div>
    <div className="field"><label>Quantité *</label><input name="quantity" type="number" min="1" max={selected?.available||1000} value={line.quantity} required onChange={e=>update(line.key,"quantity",e.target.value)}/></div>
    <div className="field"><label>Montant de la ligne</label><div className="input-like" style={{padding:"11px 12px",border:"1px solid #ddd",borderRadius:8}}>{new Intl.NumberFormat("fr-FR").format((selected?.price||0)*(Number(line.quantity)||0))} Ar</div></div>
   </div>
  </div>})}
  <button type="button" className="btn outline" onClick={add}>＋ Ajouter un autre article</button>
  <div className="notice" style={{marginTop:12}}>Sous-total des articles : <strong>{new Intl.NumberFormat("fr-FR").format(total)} Ar</strong>. Le stock est vérifié pour chaque variante au moment de l’enregistrement.</div>
 </>;
}
