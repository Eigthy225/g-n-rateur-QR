import { useState } from 'react';
import { CHARACTER_SETS, generatePassword, type CharacterKind } from '../utils/password';
const labels: Record<CharacterKind, string> = { uppercase: 'Majuscules (A–Z)', lowercase: 'Minuscules (a–z)', numbers: 'Chiffres (0–9)', symbols: 'Symboles' };
export function PasswordGenerator() {
  const [length, setLength] = useState(15);
  const [selected, setSelected] = useState<CharacterKind[]>(['uppercase', 'lowercase', 'numbers', 'symbols']);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const entropy = length * Math.log2(selected.reduce((n, k) => n + CHARACTER_SETS[k].length, 0) || 1);
  const strength = entropy >= 75 ? 'Élevée' : entropy >= 55 ? 'Moyenne' : 'Faible';
  return <section className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
    <h2 className="text-xl font-bold">Générateur de mots de passe</h2>
    <p className="text-sm text-slate-600">Généré dans votre navigateur, sans envoi ni enregistrement. Privilégiez 15 caractères et un mot de passe différent par service.</p>
    <label className="block font-semibold">Longueur : {length}<input className="w-full block mt-2" type="range" min="8" max="15" value={length} onChange={e => { setLength(Number(e.target.value)); setPassword(''); }} /></label>
    <fieldset><legend className="font-semibold mb-2">Caractères autorisés</legend><div className="grid grid-cols-2 gap-3">{(Object.keys(labels) as CharacterKind[]).map(k => <label key={k} className="flex gap-2 items-center"><input type="checkbox" checked={selected.includes(k)} onChange={e => { setSelected(e.target.checked ? [...selected, k] : selected.filter(x => x !== k)); setPassword(''); }} />{labels[k]}</label>)}</div></fieldset>
    <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-50" disabled={!selected.length} onClick={() => { try { setPassword(generatePassword(length, selected)); setMessage(''); } catch (e) { setMessage(e instanceof Error ? e.message : 'Génération impossible.'); } }}>Générer</button>
    {!selected.length && <p className="text-red-700" role="alert">Sélectionnez au moins un jeu de caractères.</p>}
    {password && <div className="space-y-3"><output className="block break-all font-mono text-lg p-4 bg-slate-100 rounded-lg" aria-label="Mot de passe généré">{password}</output><p className="text-sm">Robustesse indicative : <strong>{strength}</strong> (estimation, dépend aussi de la longueur et de l’usage).</p><button className="border rounded-lg px-4 py-2" onClick={async () => { try { await navigator.clipboard.writeText(password); setMessage('Mot de passe copié.'); } catch { setMessage('Copie impossible : sélectionnez le mot de passe manuellement.'); } }}>Copier</button></div>}
    <p role="status" className="text-sm text-slate-600">{message}</p>
  </section>;
}
