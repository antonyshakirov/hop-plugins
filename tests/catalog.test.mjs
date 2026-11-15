import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,rm,chmod,rename,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {generateKeyPairSync} from 'node:crypto';
const source=new URL('../',import.meta.url);
async function fixture(run) {
  const temporary=await mkdtemp(join(tmpdir(),'hop-catalog-test-'));
  try {
    const root=join(temporary,'repo');
    await cp(source,root,{recursive:true,filter:path => !path.split('/').includes('.git')});
    const command=(...args)=>spawnSync(process.execPath,['scripts/catalog.mjs',...args],{cwd:root,encoding:'utf8',timeout:10000});
    const pair=generateKeyPairSync('ed25519');
    const config=JSON.parse(await readFile(join(root,'catalog-config.json'),'utf8'));
    config.publicKeyBase64=pair.publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64');
    await writeFile(join(root,'catalog-config.json'),JSON.stringify(config));
    const fixtureKey=join(temporary,'fixture-key.pem');
    await writeFile(fixtureKey,pair.privateKey.export({format:'pem',type:'pkcs8'}),{mode:0o600});
    assert.equal(command('build').status,0);
    assert.equal(command('sign','--key',fixtureKey).status,0);
    await run({root,temporary,command});
  } finally {await rm(temporary,{recursive:true,force:true});}
}
test('packages rebuild deterministically and have a valid exact-byte signature', async()=>fixture(async({command})=>{
  assert.equal(command('check').status,0);
  assert.equal(command('build').status,0);
  assert.equal(command('check').status,0);
}));
test('unsigned PR artifact validation still rejects a changed package',async()=>fixture(async({root,command})=>{
  await writeFile(join(root,'catalog.json.sig'),'not a signature\n');
  assert.equal(command('check-artifacts').status,0);
  assert.notEqual(command('check').status,0);
  await writeFile(join(root,'packages/auto-break-1.0.0.hopplugin'),'{}');
  assert.notEqual(command('check-artifacts').status,0);
}));
test('source changes require a rebuild and a new signature',async()=>fixture(async({root,command})=>{
  const path=join(root,'plugins/auto-break/plugin.js');
  await writeFile(path,(await readFile(path,'utf8'))+'\n// Changed source\n');
  assert.notEqual(command('check-artifacts').status,0);
  assert.equal(command('build').status,0);
  assert.equal(command('check-artifacts').status,0);
  assert.notEqual(command('check').status,0);
}));
test('signing with the wrong key or a readable key fails without replacing the signature',async()=>fixture(async({root,temporary,command})=>{
  const before=await readFile(join(root,'catalog.json.sig'));
  const key=join(temporary,'wrong-key.pem');
  await writeFile(key,generateKeyPairSync('ed25519').privateKey.export({format:'pem',type:'pkcs8'}),{mode:0o600});
  assert.notEqual(command('sign','--key',key).status,0);
  await chmod(key,0o644);
  assert.notEqual(command('sign','--key',key).status,0);
  assert.deepEqual(await readFile(join(root,'catalog.json.sig')),before);
}));
test('unexpected package files fail artifact validation',async()=>fixture(async({root,command})=>{
  await writeFile(join(root,'packages/extra.hopplugin'),'{}');
  assert.notEqual(command('check-artifacts').status,0);
}));
test('source and output ancestor symlinks are rejected without modifying outside files',async()=>{
  for(const name of ['packages','plugins']) await fixture(async({root,temporary,command})=>{
    const outside=join(temporary,'outside');
    await rename(join(root,name),outside);
    await symlink(outside,join(root,name));
    const sentinel=join(outside,name==='packages'?'auto-break-1.0.0.hopplugin':'auto-break/plugin.js');
    const before=await readFile(sentinel);
    assert.notEqual(command('check-artifacts').status,0);
    assert.notEqual(command('build').status,0);
    assert.deepEqual(await readFile(sentinel),before);
  });
});
test('an output file symlink is rejected without overwriting its target',async()=>fixture(async({root,temporary,command})=>{
  const target=join(temporary,'sentinel'),output=join(root,'packages/auto-break-1.0.0.hopplugin');
  await writeFile(target,'keep this file');await rm(output);await symlink(target,output);
  assert.notEqual(command('build').status,0);
  assert.equal(await readFile(target,'utf8'),'keep this file');
}));
