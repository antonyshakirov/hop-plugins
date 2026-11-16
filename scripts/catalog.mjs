import {readFile, readdir, lstat, realpath, mkdir, open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPrivateKey, sign} from 'node:crypto';
import {validateManifest,validatePackage,validateCatalog,verifySignature,sha256} from './validation.mjs';

import {withLicenseNotice} from './licensing.mjs';

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const [command, ...args] = process.argv.slice(2);
const bytes = value => Buffer.from(JSON.stringify(value,null,2) + '\n');
const read = path => regular(join(root,path));
async function regular(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024*1024 || await realpath(path) !== path) throw new Error('Expected canonical bounded regular file: ' + path);
  return readFile(path);
}
async function requireDirectory(path) {
  const stat=await lstat(path);
  if(!stat.isDirectory() || stat.isSymbolicLink() || await realpath(path)!==path) throw new Error('Expected canonical directory: '+path);
}
async function write(path,data) {
  await requireDirectory(dirname(path));
  try {await regular(path);} catch(error) {if(error.code!=='ENOENT') throw error;}
  const file=await open(path,constants.O_WRONLY|constants.O_CREAT|constants.O_TRUNC|constants.O_NOFOLLOW,0o644);
  try {await file.writeFile(data);} finally {await file.close();}
}
async function build(check, signatureRequired = true) {
  const config = JSON.parse(await read('catalog-config.json'));
  const entries = [];
  await requireDirectory(join(root,'plugins'));
  const directories = await readdir(join(root,'plugins'), {withFileTypes:true});
  await mkdir(join(root,'packages'), {recursive:true});
  await requireDirectory(join(root,'packages'));
  for (const directory of directories.sort((a,b) => a.name.localeCompare(b.name,'en'))) {
    if (!directory.isDirectory() || directory.isSymbolicLink()) throw new Error('Plugin source must be a directory');
    const source = join(root,'plugins',directory.name);
    await requireDirectory(source);
    const manifest = validateManifest(JSON.parse(await regular(join(source,'manifest.json'))));
    if (manifest.id !== directory.name) throw new Error('Directory must match plugin id');
    const decode = data => new TextDecoder('utf-8',{fatal:true}).decode(data);
    const code = withLicenseNotice(decode(await regular(join(source,'plugin.js'))), decode(await regular(join(source,'LICENSE'))), decode(await read('LICENSE')));
    const data = bytes({formatVersion:1,manifest,code}); validatePackage(data);
    const name = manifest.id + '-' + manifest.version + '.hopplugin';
    if (check) { if (!(await regular(join(root,'packages',name))).equals(data)) throw new Error('Rebuild package: ' + name); }
    else await write(join(root,'packages',name),data);
    const {settings, ...metadata} = manifest;
    entries.push({...metadata,packageURL:config.packageBaseURL+name,sha256:sha256(data)});
  }
  const expected = entries.map(entry => entry.id + '-' + entry.version + '.hopplugin').sort();
  if (JSON.stringify((await readdir(join(root,'packages'))).sort()) !== JSON.stringify(expected)) throw new Error('Remove stale or unexpected package files');
  const catalog = bytes({schemaVersion:config.schemaVersion,revision:config.revision,plugins:entries,revokedSha256:config.revokedSha256});
  validateCatalog(catalog);
  if (check) {
    if (!(await read('catalog.json')).equals(catalog)) throw new Error('Rebuild catalog');
    if (signatureRequired) verifySignature(catalog,(await read('catalog.json.sig')).toString(),config.publicKeyBase64);
  } else await write(join(root,'catalog.json'),catalog);
  console.log((check ? 'Verified' : 'Built') + ' ' + entries.length + ' packages and catalog revision ' + config.revision);
}
if (command === 'build' || command === 'check' || command === 'check-artifacts') {
  if (args.length) throw new Error('Unexpected arguments');
  await build(command !== 'build', command !== 'check-artifacts');
} else if (command === 'sign') {
  if (args.length !== 2 || args[0] !== '--key') throw new Error('Usage: node scripts/catalog.mjs sign --key /private/path/key.pem');
  const path = await realpath(args[1]), stat = await lstat(args[1]);
  if (stat.isSymbolicLink() || !stat.isFile() || (stat.mode & 0o077) || stat.uid !== process.getuid() || path === root || path.startsWith(root + '/')) throw new Error('Signing key must be a private owner-only file outside the repository');
  const key = createPrivateKey(await readFile(path));
  if (key.asymmetricKeyType !== 'ed25519') throw new Error('Expected Ed25519 key');
  const catalog = await read('catalog.json'); validateCatalog(catalog);
  const signature = sign(null,catalog,key).toString('base64') + '\n';
  const config = JSON.parse(await read('catalog-config.json'));
  verifySignature(catalog,signature,config.publicKeyBase64);
  await write(join(root,'catalog.json.sig'),signature);
  console.log('Signed catalog revision ' + JSON.parse(catalog).revision);
} else throw new Error('Usage: node scripts/catalog.mjs build|check|check-artifacts|sign');
