import test from 'node:test';
import assert from 'node:assert/strict';
import {citizenSvg, citizenCopy, factions, cardFilename, cleanCardText} from '../src/citizen-card.mjs';

test('card escapes personal text, limits it and never creates external image requests',()=>{
  const svg=citizenSvg({name:'<script>alert(1)</script>',role:'"><image href="https://example.com"/>'});
  assert.ok(svg.includes('&lt;script&gt;'));assert.ok(!svg.includes('<script>'));assert.ok(!svg.includes('<image href="https:'));
  assert.equal(cleanCardText(' a\n\u202eb ',32),'ab');
  assert.equal(cleanCardText('a'.repeat(80),32).length,32);
  assert.match(cardFilename('../../x<script>','square'),/^netlore-[a-z0-9-]+-avatar\.png$/i);
});
test('all faction themes and formats retain supplied identity, both logos and beta',()=>{
  for(const faction of factions)for(const format of ['square','wide'])for(const language of ['es','en','fr']){
    const svg=citizenSvg({name:'Andrés',role:'Netrunner',faction:faction.id,format,language,logos:{netlore:'data:image/png;base64,YQ==',open77:'data:image/png;base64,Yg=='}});
    assert.ok(svg.includes(faction.name));assert.ok(svg.includes(faction.color));assert.ok(svg.includes('Andrés'));assert.ok(svg.includes('Netrunner'));assert.ok(svg.includes('BETA'));
    assert.equal((svg.match(/<image /g)||[]).length,2);
    assert.ok(svg.includes(format==='square'?'width="1080" height="1080"':'width="1600" height="900"'));
  }
  const keys=Object.keys(citizenCopy.en).sort();for(const copy of Object.values(citizenCopy))assert.deepEqual(Object.keys(copy).sort(),keys);
});
