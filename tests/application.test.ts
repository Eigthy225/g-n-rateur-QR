import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generatePassword, CHARACTER_SETS, type CharacterKind } from '../src/utils/password';
import { normalizeUrl } from '../server/url';

test('mots de passe : longueur et catégories cochées', () => {
 const kinds = Object.keys(CHARACTER_SETS) as CharacterKind[];
 for (let n=8;n<=15;n++) for(let i=0;i<20;i++) { const p=generatePassword(n,kinds); assert.equal(p.length,n); for(const k of kinds) assert.ok([...p].some(c=>CHARACTER_SETS[k].includes(c))); }
 assert.throws(()=>generatePassword(7,kinds)); assert.throws(()=>generatePassword(16,kinds)); assert.throws(()=>generatePassword(8,[]));
 const p=generatePassword(10,['numbers']); assert.match(p,/^\d{10}$/);
});
test('validation des URL', () => {
 assert.equal(normalizeUrl('example.com/a'), 'https://example.com/a');
 assert.equal(normalizeUrl('http://example.com'), 'http://example.com/');
 for (const u of ['', 'javascript:alert(1)', 'ftp://example.com', 'http://u:p@example.com', 'http://bad host/']) assert.throws(()=>normalizeUrl(u));
});
test('API : création, collision insensible à la casse et redirection', async () => {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qr-studio-')); const old=process.cwd(); process.chdir(dir); delete process.env.DATABASE_URL; process.env.APP_URL='https://example.test';
 const {initDatabase}=await import('../server/db'); const {createExpressApp}=await import('../server/app'); await initDatabase();
 const server=createExpressApp().listen(0); await new Promise<void>(resolve=>server.once('listening',resolve));
 const port=(server.address() as {port:number}).port; const base=`http://127.0.0.1:${port}`;
 try {
  const create=(url:string,customSlug:string)=>fetch(`${base}/api/shorten`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url,customSlug})});
  const first=await create('https://example.org/destination','Test-123'); assert.equal(first.status,201); const data=await first.json(); assert.equal(data.shortUrl,'https://example.test/s/Test-123');
  assert.equal((await create('https://other.example','test-123')).status,409);
  assert.equal((await create('javascript:alert(1)','bad')).status,400);
  const redirect=await fetch(`${base}/s/test-123`,{redirect:'manual'}); assert.equal(redirect.status,302); assert.equal(redirect.headers.get('location'),'https://example.org/destination');
  assert.equal((await fetch(`${base}/s/missing`,{redirect:'manual'})).status,404);
  const stored=JSON.parse(fs.readFileSync(path.join(dir,'data/links.json'),'utf8')); assert.equal(stored[0].clicks,1);
 } finally { await new Promise<void>(resolve=>server.close(()=>resolve())); process.chdir(old); fs.rmSync(dir,{recursive:true,force:true}); }
});
