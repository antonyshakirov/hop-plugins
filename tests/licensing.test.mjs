import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {withLicenseNotice} from '../scripts/licensing.mjs';
const reference=await readFile(new URL('../LICENSE',import.meta.url),'utf8');
const own=reference.replace('Copyright (c) 2026 Anton Shakirov','Copyright (c) 2026 Example Author\nCopyright (c) 2026 Earlier Author');
test('packages preserve every original copyright notice and the full MIT text',()=>{
  const code='definePlugin({});';
  assert.equal(withLicenseNotice(code,own,reference),'/*\n'+own+'*/\n'+code);
});
test('license attachment rejects changed terms, missing authors and comment injection',()=>{
  for(const invalid of ['',reference.replace('Copyright (c) 2026 Anton Shakirov\n',''),own.replace('Example Author','*/ injected(); /*'),own.replace('without restriction','with restrictions')]) {
    assert.throws(()=>withLicenseNotice('definePlugin({});',invalid,reference));
  }
});
test('attaching a notice never executes plugin JavaScript',()=>{
  assert.match(withLicenseNotice('throw new Error("do not run");',own,reference),/throw new Error/);
});
