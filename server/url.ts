export function normalizeUrl(input: unknown): string {
 if (typeof input !== 'string' || !input.trim() || input.length > 2048) throw new Error('URL invalide ou trop longue (2 048 caractères maximum).');
 const value = input.trim();
 // Do not reinterpret a non-HTTP protocol as a host.
 if (/^[a-z][a-z\d+.-]*:\/\//i.test(value) && !/^https?:\/\//i.test(value)) throw new Error('Seules les URL HTTP et HTTPS sont acceptées.');
 if (/^(?:javascript|data|file|mailto):/i.test(value)) throw new Error('Seules les URL HTTP et HTTPS sont acceptées.');
 let parsed: URL;
 try { parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`); } catch { throw new Error('URL invalide.'); }
 if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password || /\s/.test(value)) throw new Error('URL invalide.');
 return parsed.href;
}
