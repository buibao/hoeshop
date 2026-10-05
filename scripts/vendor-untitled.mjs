import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const commit = '4702dc0ea8d140c3491a85670c7b4fab47b722da';
const root = `https://raw.githubusercontent.com/untitleduico/react/${commit}/`;
const entries = [
 'components/base/form/form.tsx', 'components/base/input/input.tsx',
 'components/base/input/input-date.tsx', 'components/base/input/input-number.tsx',
 'components/base/textarea/textarea.tsx', 'components/base/select/select.tsx',
 'components/base/checkbox/checkbox.tsx', 'components/base/radio-buttons/radio-buttons.tsx',
 'components/base/buttons/button.tsx', 'components/base/badges/badges.tsx',
 'components/application/date-picker/date-picker.tsx',
 'components/application/app-navigation/header-navigation.tsx',
 'components/application/app-navigation/sidebar-navigation/sidebar-simple.tsx',
 'components/application/table/table.tsx', 'components/application/pagination/pagination.tsx',
 'components/application/modals/modal.tsx', 'components/application/slideout-menus/slideout-menu.tsx',
 'components/application/file-upload/file-upload-base.tsx',
];
const manifest = await (await fetch(root+'package.json')).json();
const seen = new Map(); const packages = new Set();
async function source(file) {
 const candidates = path.posix.extname(file) ? [file] : [file,file+'.tsx',file+'.ts',file+'/index.tsx',file+'/index.ts'];
 for (const candidate of candidates) {
  const response = await fetch(root+candidate);
  if (response.ok) return {file:candidate,text:await response.text()};
  if (response.status !== 404) throw new Error(candidate+': '+response.status);
 }
 throw new Error('Missing upstream dependency '+file);
}
function destination(file) {
 return file.startsWith('components/') ? 'src/components/untitled/'+file.slice(11) : 'src/components/untitled/'+file;
}
async function vendor(file) {
 if ([file,file+'.tsx',file+'.ts',file+'/index.tsx',file+'/index.ts'].some(p=>seen.has(p))) return;
 const resolved = await source(file); file=resolved.file;
 if (seen.has(file)) return;
 const original=resolved.text;
 seen.set(file,{source:file,url:root+file,commit,sha256:createHash('sha256').update(original).digest('hex'),destination:destination(file)});
 const imports=[...original.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)].map(m=>m[1]);
 for (const specifier of imports) {
  if (specifier.startsWith('@/')) await vendor(specifier.slice(2));
  else if (specifier.startsWith('.')) await vendor(path.posix.normalize(path.posix.join(path.posix.dirname(file),specifier)));
  else { const parts=specifier.split('/');packages.add(specifier.startsWith('@')?parts.slice(0,2).join('/'):parts[0]); }
 }
 const rewritten=original.replace(/(["'])@\/(components|utils|hooks)\//g,(_,quote,group)=>quote+'@/components/untitled/'+(group==='components'?'':group+'/'));
 const target=destination(file);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,rewritten);
}
for (const entry of entries) await vendor(entry);
for(const file of ['styles/theme.css','styles/typography.css','styles/globals.css','LICENSE']) {
 const {text}=await source(file);const target=file==='LICENSE'?'src/components/untitled/LICENSE':'src/styles/untitled/'+file.slice(7);
 await mkdir(path.dirname(target),{recursive:true});await writeFile(target,text);
 seen.set(file,{source:file,url:root+file,commit,sha256:createHash('sha256').update(text).digest('hex'),destination:target});
}
await mkdir('docs/untitled-ui',{recursive:true});
await writeFile('docs/untitled-ui/upstream.json',JSON.stringify({repository:'https://github.com/untitleduico/react',commit,license:'MIT',files:[...seen.values()],dependencies:Object.fromEntries([...packages].filter(p=>manifest.dependencies[p]).map(p=>[p,manifest.dependencies[p].replace(/^\^/,'')]))},null,2)+'\n');
console.log(JSON.stringify({files:seen.size,dependencies:[...packages].filter(p=>manifest.dependencies[p]).map(p=>p+'@'+manifest.dependencies[p].replace(/^\^/,''))}));
if(process.argv.includes('--apply-patches')) {
 const patched=spawnSync('git',['apply','--whitespace=nowarn','docs/untitled-ui/upstream.patch'],{stdio:'inherit',windowsHide:true});
 if(patched.status!==0)throw new Error('Cannot restore recorded patches; do not release unpatched vendor source');
}
