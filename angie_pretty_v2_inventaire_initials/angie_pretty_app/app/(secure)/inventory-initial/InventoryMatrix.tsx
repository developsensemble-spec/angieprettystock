"use client";
import { useMemo, useState } from "react";

const apparel = ["XXS","XS","S","M","L","XL","XXL","3XL","4XL","5XL"];
const french = Array.from({length:17},(_,i)=>String(30+i));

export default function InventoryMatrix() {
  const [sizeType, setSizeType] = useState("apparel");
  const [sizes, setSizes] = useState<string[]>(["S","M","L"]);
  const [colors, setColors] = useState<string[]>(["Noir"]);
  const [newColor, setNewColor] = useState("");
  const [quantities, setQuantities] = useState<Record<string,string>>({});
  const options = sizeType === "apparel" ? apparel : french;
  const key = (s:string,c:string) => `${s}__${c}`;
  const total = useMemo(
    () => sizes.reduce((sum,s) => sum + colors.reduce((n,c) => n + (Number(quantities[key(s,c)] || 0) || 0),0),0),
    [sizes,colors,quantities]
  );

  function toggleSize(s:string) {
    setSizes(old => old.includes(s) ? old.filter(x => x !== s) : [...old,s]);
  }
  function addColor() {
    const value = newColor.trim();
    if (!value) return;
    if (colors.some(c => c.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      setNewColor("");
      return;
    }
    setColors(old => [...old,value]);
    setNewColor("");
  }
  function removeColor(color:string) {
    setColors(old => old.filter(c => c !== color));
  }

  return <>
    <div className="field">
      <label>Barème des tailles</label>
      <select value={sizeType} onChange={e => {setSizeType(e.target.value);setSizes([]);}}>
        <option value="apparel">Tailles vêtements XXS à 5XL</option>
        <option value="french">Tailles françaises 30 à 46</option>
      </select>
    </div>
    <div className="field">
      <label>Tailles à inclure *</label>
      <div className="size-picks">
        {options.map(s => <label className={`size-chip ${sizes.includes(s)?"selected":""}`} key={s}>
          <input type="checkbox" checked={sizes.includes(s)} onChange={() => toggleSize(s)}/>{s}
        </label>)}
      </div>
    </div>
    <div className="field">
      <label>Ajouter plusieurs couleurs</label>
      <div className="inline-input">
        <input value={newColor} onChange={e => setNewColor(e.target.value)} placeholder="Ex. Noir, Blanc, Beige" onKeyDown={e => {if(e.key === "Enter"){e.preventDefault();addColor();}}}/>
        <button type="button" className="btn outline" onClick={addColor}>+ Ajouter couleur</button>
      </div>
      <div className="size-picks" style={{marginTop:10}}>
        {colors.map(color => <span className="size-chip selected" key={color} style={{display:"inline-flex",alignItems:"center",gap:8}}>
          {color}<button type="button" aria-label={`Retirer ${color}`} onClick={() => removeColor(color)} style={{border:0,background:"transparent",cursor:"pointer",fontWeight:700,padding:0}}>×</button>
        </span>)}
      </div>
      <small>Ajoutez chaque couleur une seule fois. Chaque couleur aura une colonne de quantités pour les tailles choisies.</small>
    </div>
    <input type="hidden" name="sizes" value={sizes.join(",")}/>
    <input type="hidden" name="colors" value={colors.join(",")}/>
    <div className="matrix-head">
      <div><strong>Quantités par variante</strong><small>Entrez la quantité pour chaque combinaison couleur / taille. Laissez 0 si aucune pièce.</small></div>
      <span className="badge green">Total : {total.toLocaleString("fr-FR")} pièces</span>
    </div>
    {sizes.length && colors.length ? <div className="table-wrap"><table>
      <thead><tr><th>Couleur</th>{sizes.map(s => <th key={s}>{s}</th>)}</tr></thead>
      <tbody>{colors.map(c => <tr key={c}><td><strong>{c}</strong></td>{sizes.map(s => <td key={s} style={{minWidth:72}}>
        <input className="qty-cell" aria-label={`${c} taille ${s}`} type="number" min="0" max="100000" name={`qty_${s}_${c}`} value={quantities[key(s,c)] ?? "0"} onChange={e => setQuantities(old => ({...old,[key(s,c)]:e.target.value}))}/>
      </td>)}</tr>)}</tbody>
    </table></div> : <p className="sub">Sélectionnez au moins une taille et ajoutez au moins une couleur pour afficher la matrice.</p>}
  </>;
}
