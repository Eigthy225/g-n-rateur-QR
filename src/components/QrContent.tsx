import { useEffect, useState } from 'react';
const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1').replace(/\r?\n/g, '\\n');
export function QrContent({onChange}:{onChange:(s:string)=>void}) {
 const [type,setType]=useState('text');
 const [name,setName]=useState(''); const [detail,setDetail]=useState(''); const [extra,setExtra]=useState('');
 useEffect(() => {
  if(type === 'wifi') onChange(`WIFI:T:WPA;S:${esc(name)};P:${esc(detail)};;`);
  if(type === 'contact') onChange(`BEGIN:VCARD\nVERSION:3.0\nFN:${esc(name)}\nTEL:${esc(detail)}\nEMAIL:${esc(extra)}\nEND:VCARD`);
  if(type === 'image') onChange(name);
 },[type,name,detail,extra]);
 const input = 'w-full p-2 border border-slate-300 rounded-lg';
 return <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
  <label className="block font-semibold">Type de contenu <select className={`${input} mt-2`} value={type} onChange={e=>{setType(e.target.value);setName('');setDetail('');setExtra('');}}><option value="text">Texte ou URL</option><option value="image">Lien vers une image</option><option value="wifi">Wi-Fi (WPA/WPA2)</option><option value="contact">Coordonnées (vCard)</option></select></label>
  {type === 'image' && <><input className={input} aria-label="URL de l'image" placeholder="https://exemple.com/image.jpg" value={name} onChange={e=>setName(e.target.value)}/><p className="text-xs text-slate-600">L’image doit être hébergée et accessible aux personnes qui scannent. Le QR contient son lien, pas le fichier.</p></>}
  {type === 'wifi' && <><input className={input} aria-label="Nom du réseau" placeholder="Nom du réseau Wi-Fi (SSID)" value={name} onChange={e=>setName(e.target.value)}/><input className={input} aria-label="Mot de passe Wi-Fi" type="password" placeholder="Mot de passe Wi-Fi" value={detail} onChange={e=>setDetail(e.target.value)}/><p className="text-xs text-amber-700">Toute personne qui scanne ce QR peut récupérer le mot de passe Wi-Fi.</p></>}
  {type === 'contact' && <><input className={input} aria-label="Nom complet" placeholder="Nom complet" value={name} onChange={e=>setName(e.target.value)}/><input className={input} aria-label="Téléphone" placeholder="Téléphone" value={detail} onChange={e=>setDetail(e.target.value)}/><input className={input} aria-label="E-mail" placeholder="E-mail" value={extra} onChange={e=>setExtra(e.target.value)}/></>}
 </div>;
}
