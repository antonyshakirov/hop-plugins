import {createHash, createPublicKey, verify} from 'node:crypto';
import {Script} from 'node:vm';

export const caps = ['ui.theme', 'ui.panel', 'timer.read', 'timer.control', 'system.read'];
export const idPattern = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/;
const digestPattern = /^[a-f0-9]{64}$/;
const isDigest = value => typeof value === 'string' && digestPattern.test(value);
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function requireValue(value, message) { if (!value) throw new Error(message); }
function object(value, allowed, required = allowed) {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected object');
  requireValue(Object.keys(value).every(key => allowed.includes(key)), 'Unknown field');
  requireValue(required.every(key => Object.hasOwn(value, key)), 'Missing field');
}
function string(value, max, name) {
  requireValue(typeof value === 'string' && value.length > 0 && value.length <= max && !/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value), 'Invalid ' + name);
}
function identity(value) {
  requireValue(typeof value.id === 'string' && value.id.length <= 128 && idPattern.test(value.id), 'Invalid id');
  requireValue(typeof value.version === 'string' && value.version.length <= 64 && versionPattern.test(value.version), 'Invalid version');
  requireValue(value.apiVersion === 1, 'Unsupported API');
  string(value.name, 80, 'name'); string(value.description, 512, 'description'); string(value.author, 128, 'author');
  requireValue(Array.isArray(value.capabilities) && value.capabilities.length <= caps.length && new Set(value.capabilities).size === value.capabilities.length && value.capabilities.every(cap => caps.includes(cap)), 'Invalid capabilities');
}
export function validateManifest(value) {
  object(value, ['id','version','apiVersion','name','description','author','capabilities','settings']);
  identity(value);
  requireValue(Array.isArray(value.settings) && value.settings.length <= 32, 'Invalid settings');
  const keys = new Set();
  for (const setting of value.settings) {
    object(setting, ['key','label','type','default','min','max'], ['key','label','type','default']);
    requireValue(typeof setting.key === 'string' && /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(setting.key) && !['__proto__','constructor','prototype'].includes(setting.key) && !keys.has(setting.key), 'Invalid setting key');
    keys.add(setting.key); string(setting.label, 128, 'setting label');
    requireValue(['integer','string','boolean'].includes(setting.type), 'Invalid setting type');
    if (setting.type === 'integer') {
      requireValue(Number.isSafeInteger(setting.default), 'Invalid integer default');
      for (const bound of ['min','max']) if (Object.hasOwn(setting, bound)) requireValue(Number.isSafeInteger(setting[bound]), 'Invalid bound');
      requireValue((setting.min ?? -Number.MAX_SAFE_INTEGER) <= setting.default && setting.default <= (setting.max ?? Number.MAX_SAFE_INTEGER), 'Default outside bounds');
    } else {
      requireValue(!Object.hasOwn(setting, 'min') && !Object.hasOwn(setting, 'max'), 'Bounds require integer');
      requireValue(setting.type === 'boolean' ? typeof setting.default === 'boolean' : typeof setting.default === 'string' && setting.default.length <= 4096, 'Invalid default');
    }
  }
  return value;
}
export function validatePackage(bytes) {
  requireValue(bytes.length <= 1024 * 1024, 'Package exceeds 1 MiB');
  const value = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
  object(value, ['formatVersion','manifest','code']);
  requireValue(value.formatVersion === 1, 'Unsupported format'); validateManifest(value.manifest);
  requireValue(typeof value.code === 'string' && Buffer.byteLength(value.code) <= 256 * 1024, 'Invalid code size');
  new Script(value.code, {filename: value.manifest.id + '.js'}); // Compile only. PR checks never execute plugin code.
  return value;
}
export function validateCatalog(bytes) {
  requireValue(bytes.length <= 1024 * 1024, 'Catalog exceeds 1 MiB');
  const value = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
  object(value, ['schemaVersion','revision','plugins','revokedSha256']);
  requireValue(value.schemaVersion === 1 && Number.isSafeInteger(value.revision) && value.revision >= 1, 'Invalid catalog version');
  requireValue(Array.isArray(value.plugins) && value.plugins.length <= 1000 && Array.isArray(value.revokedSha256) && value.revokedSha256.length <= 1000 && value.revokedSha256.every(isDigest) && new Set(value.revokedSha256).size === value.revokedSha256.length, 'Invalid catalog list');
  const ids = new Set();
  for (const entry of value.plugins) {
    object(entry, ['id','version','apiVersion','name','description','author','capabilities','packageURL','sha256']); identity(entry);
    requireValue(!ids.has(entry.id), 'Duplicate plugin'); ids.add(entry.id);
    requireValue(typeof entry.packageURL === 'string', 'Invalid package URL');
    const url = new URL(entry.packageURL);
    requireValue(url.protocol === 'https:' && !url.username && !url.password && !url.hash && !url.search && url.hostname === 'raw.githubusercontent.com' && url.pathname === '/antonyshakirov/hop-plugins/main/packages/' + entry.id + '-' + entry.version + '.hopplugin', 'Invalid package URL');
    requireValue(isDigest(entry.sha256) && !value.revokedSha256.includes(entry.sha256), 'Invalid or revoked digest');
  }
  return value;
}
export function verifySignature(bytes, signatureText, publicKeyText) {
  const signature = signatureText.trim();
  requireValue(/^[A-Za-z0-9+/]{86}==$/.test(signature), 'Invalid signature encoding');
  const raw = Buffer.from(publicKeyText, 'base64'); requireValue(raw.length === 32, 'Invalid public key');
  const key = createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),raw]), format:'der',type:'spki'});
  requireValue(verify(null, bytes, key, Buffer.from(signature,'base64')), 'Catalog signature mismatch');
}
