import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, sign} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {validateManifest,validatePackage,validateCatalog,verifySignature,sha256} from '../scripts/validation.mjs';

const manifest = () => ({id:'test-plugin',version:'1.0.0',apiVersion:1,name:'Test',description:'Test plugin',author:'Test',capabilities:['ui.panel'],settings:[]});
const pack = (modify = () => {}) => {const value={formatVersion:1,manifest:manifest(),code:'definePlugin({});'};modify(value);return Buffer.from(JSON.stringify(value));};
const catalog = (modify = () => {}) => {const value={schemaVersion:1,revision:1,plugins:[{...manifest(),packageURL:'https://raw.githubusercontent.com/antonyshakirov/hop-plugins/main/packages/test-plugin-1.0.0.hopplugin',sha256:'a'.repeat(64)}],revokedSha256:[]};delete value.plugins[0].settings;modify(value);return Buffer.from(JSON.stringify(value));};

test('a package parses without evaluating its JavaScript', () => {
  assert.equal(validatePackage(pack(p => p.code='throw new Error("must not execute");')).manifest.id,'test-plugin');
});
test('malformed JavaScript is rejected at compile time', () => assert.throws(() => validatePackage(pack(p => p.code='definePlugin({'))));
test('native or zip payload is not a package', () => assert.throws(() => validatePackage(Buffer.from('PK\x03\x04'))));
test('unknown API and package formats are inert', () => {
  assert.throws(() => validatePackage(pack(p => p.manifest.apiVersion=2)));
  assert.throws(() => validatePackage(pack(p => p.formatVersion=2)));
});
test('path traversal and ambiguous plugin ids are rejected', () => {
  for(const id of ['../other','a/b','a..b','a--b','a.','A','a%2fb','a\\b','a\u0000b']) assert.throws(() => validateManifest({...manifest(),id}));
});
test('unknown, duplicate and non-array capabilities are rejected', () => {
  for(const capabilities of [['hardware.control'],['ui.panel','ui.panel'],'ui.panel']) assert.throws(() => validateManifest({...manifest(),capabilities}));
});
test('unknown manifest and package fields are rejected', () => {
  assert.throws(() => validatePackage(pack(p => p.nativeModule='plugin.dylib')));
  assert.throws(() => validatePackage(pack(p => p.manifest.enabled=true)));
});
test('missing required metadata is rejected', () => assert.throws(() => validatePackage(pack(p => delete p.manifest.author))));
test('package and JavaScript byte limits apply independently', () => {
  assert.throws(() => validatePackage(Buffer.alloc(1024*1024+1)));
  assert.throws(() => validatePackage(pack(p => p.code='//'+ 'é'.repeat(128*1024))));
});
test('invalid UTF-8 is rejected rather than replaced', () => assert.throws(() => validatePackage(Buffer.from([0xc0,0xaf]))));
test('metadata length limits are enforced', () => assert.throws(() => validatePackage(pack(p => p.manifest.name='x'.repeat(81)))));
test('integer settings require a safe integer within bounds', () => {
  const setting={key:'minutes',label:'Minutes',type:'integer',default:5,min:1,max:60};
  assert.doesNotThrow(() => validateManifest({...manifest(),settings:[setting]}));
  for(const change of [{default:0},{default:1.5},{max:4},{min:10},{default:2**54}]) assert.throws(() => validateManifest({...manifest(),settings:[{...setting,...change}]}));
});
test('setting keys cannot collide or alter an object prototype', () => {
  const setting={key:'title',label:'Title',type:'string',default:'Desk'};
  assert.throws(() => validateManifest({...manifest(),settings:[setting,setting]}));
  for(const key of ['__proto__','constructor','prototype','../title']) assert.throws(() => validateManifest({...manifest(),settings:[{...setting,key}]}));
});
test('boolean and string defaults are checked; bounds only apply to integers', () => {
  for(const setting of [{key:'show',label:'Show',type:'boolean',default:'yes'},{key:'title',label:'Title',type:'string',default:12},{key:'title',label:'Title',type:'string',default:'Desk',min:0}]) assert.throws(() => validateManifest({...manifest(),settings:[setting]}));
});
test('catalog rejects duplicate ids', () => assert.throws(() => validateCatalog(catalog(c => c.plugins.push(c.plugins[0])))));
test('catalog requires positive integral revisions', () => {
  for(const revision of [0,-1,1.5,'1']) assert.throws(() => validateCatalog(catalog(c => c.revision=revision)));
});
test('catalog rejects unknown fields and schema versions', () => {
  assert.throws(() => validateCatalog(catalog(c => c.schemaVersion=2)));
  assert.throws(() => validateCatalog(catalog(c => c.autoEnable=true)));
});
test('catalog requires the expected HTTPS package location', () => {
  for(const url of ['http://raw.githubusercontent.com/antonyshakirov/hop-plugins/main/packages/test-plugin-1.0.0.hopplugin','https://evil.invalid/test-plugin.hopplugin','https://user@raw.githubusercontent.com/antonyshakirov/hop-plugins/main/packages/test-plugin-1.0.0.hopplugin','https://raw.githubusercontent.com/antonyshakirov/hop-plugins/main/packages/other-1.0.0.hopplugin']) assert.throws(() => validateCatalog(catalog(c => c.plugins[0].packageURL=url)));
});
test('revoked packages cannot remain listed as installable', () => assert.throws(() => validateCatalog(catalog(c => c.revokedSha256.push('a'.repeat(64))))));
test('invalid and duplicate revocation hashes are rejected', () => {
  for(const hashes of [['x'],['b'.repeat(64),'b'.repeat(64)]]) assert.throws(() => validateCatalog(catalog(c => c.revokedSha256=hashes)));
});
test('catalog hashes and URLs must be strings, never coerced arrays or objects', () => {
  for(const value of [['a'.repeat(64)],{},null,123]) {
    assert.throws(() => validateCatalog(catalog(c => c.plugins[0].sha256=value)));
    assert.throws(() => validateCatalog(catalog(c => c.revokedSha256=[value])));
  }
  assert.throws(() => validateCatalog(catalog(c => c.plugins[0].packageURL=[c.plugins[0].packageURL])));
});
test('digest detects any package-byte change', () => assert.notEqual(sha256(pack()),sha256(Buffer.concat([pack(),Buffer.from('\n')]))));
test('Ed25519 verifies exact catalog bytes', () => {
  const {publicKey,privateKey}=generateKeyPairSync('ed25519');
  const raw=publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64');
  const data=catalog(),signature=sign(null,data,privateKey).toString('base64');
  assert.doesNotThrow(() => verifySignature(data,signature,raw));
  assert.throws(() => verifySignature(Buffer.concat([data,Buffer.from('\n')]),signature,raw));
  const other=generateKeyPairSync('ed25519').publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64');
  assert.throws(() => verifySignature(data,signature,other));
  assert.throws(() => verifySignature(data,'invalid',raw));
});
test('the two example manifests request only their required permissions', async () => {
  for(const [id,expected] of [['desk-panel',['ui.theme','ui.panel']],['auto-break',['timer.read','timer.control']]]) {
    const value=validateManifest(JSON.parse(await readFile(new URL('../plugins/'+id+'/manifest.json',import.meta.url))));
    assert.deepEqual(value.capabilities,expected);
  }
});
