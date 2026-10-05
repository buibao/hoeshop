import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const file='docs/untitled-ui/upstream.json';
const manifest=JSON.parse(await readFile(file,'utf8'));
const hash=text=>createHash('sha256').update(text.replaceAll('\r\n','\n')).digest('hex');
if(process.argv.includes('--record')) {
 await mkdir('.local/untitled-original',{recursive:true});const patches=[];
 for(const entry of manifest.files) {
  const response=await fetch(entry.url);if(!response.ok)throw new Error('Cannot verify '+entry.source);
  const original=await response.text();if(hash(original)!==entry.sha256)throw new Error('Upstream hash changed: '+entry.source);
  const namespaced=original.replace(/(["'])@\/(components|utils|hooks)\//g,(_,quote,group)=>quote+'@/components/untitled/'+(group==='components'?'':group+'/'));
  const local=await readFile(entry.destination,'utf8');entry.localSha256=hash(local);entry.patched=hash(namespaced)!==hash(local);
  if(entry.patched) {
   const before='.local/untitled-original/'+entry.source.replaceAll('/','__');await writeFile(before,namespaced);
   const result=spawnSync('git',['diff','--no-index','--',before,entry.destination],{encoding:'utf8',windowsHide:true});
   if(result.status!==1)throw new Error('Cannot generate diff '+entry.source);
   patches.push(result.stdout.replaceAll('a/'+before,'a/'+entry.destination));
  }
 }
 await writeFile('docs/untitled-ui/upstream.patch',patches.join(''));
 await writeFile(file,JSON.stringify(manifest,null,2)+'\n');
 console.log({verified:manifest.files.length,patched:manifest.files.filter(e=>e.patched).length});
} else {
 for(const entry of manifest.files)if(!entry.localSha256 || hash(await readFile(entry.destination,'utf8'))!==entry.localSha256)throw new Error('Unrecorded source patch: '+entry.destination);
 console.log({source:manifest.commit,files:manifest.files.length,hashes:'passed'});
}
