function licenseParts(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text) > 16384 || text.includes('*/')) throw new Error('Invalid plugin license');
  const normalized=text.replaceAll('\r\n','\n');
  const lines=normalized.split('\n');
  const copyright=lines.filter(line=>line.startsWith('Copyright '));
  if (!copyright.length || copyright.some(line=>!/^Copyright \(c\) (?:19|20)\d{2}(?:-(?:19|20)\d{2})? [^\x00-\x1F]{1,256}$/.test(line))) throw new Error('Missing copyright holder');
  return {terms:lines.filter(line=>!line.startsWith('Copyright ')).join('\n'),copyright};
}
export function withLicenseNotice(code, license, reference) {
  const actual=licenseParts(license),expected=licenseParts(reference);
  if (!actual.terms.startsWith('MIT License\n\n') || actual.terms!==expected.terms) throw new Error('Catalog plugins require the complete MIT license');
  return '/*\n'+license+(license.endsWith('\n')?'':'\n')+'*/\n'+code;
}
