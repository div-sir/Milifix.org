import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseReceipt, compareReceipt, expectedReceipt } from '../public/ekispell/receipt-check.js';
const planned=[{number:1,entry:'銀座',exit:'京橋',messageIndex:0,character:'銀',column:0},{number:2,entry:'京橋',exit:'日本橋',messageIndex:1,character:'京',column:0}];
it('parses two-column input, preserves significant spaces, and rejects malformed or excessive input',()=>{
 expect(parseReceipt(' 銀座\t京橋\r\n京橋|日本橋\r\n')).toEqual([{entry:' 銀座',exit:'京橋',line:1},{entry:'京橋',exit:'日本橋',line:2}]);
 for(const input of ['', '銀座', '銀座|京橋|日本橋','銀座|','銀座|京橋\n\n京橋|日本橋','a'.repeat(20001),Array(101).fill('a|b').join('\n')])expect(()=>parseReceipt(input)).toThrow();
});
it('normalizes print order while preserving observed row numbers',()=>{
 const old=compareReceipt(planned,parseReceipt('銀座|京橋\n京橋|日本橋'),{order:'oldest-first'});
 const newest=compareReceipt(planned,parseReceipt('京橋|日本橋\n銀座|京橋'));
 expect(old.counts).toEqual({same:2,changed:0,missing:0,extra:0});
 expect(newest.counts).toEqual(old.counts);expect(newest.rows.map(r=>r.observed?.line)).toEqual([2,1]);
 expect(newest.rows.every(r=>r.targetMatches)).toBe(true);expect(newest.verification).toBe('manual-unverified');
});
it('aligns an inserted purchase and a missing journey without shifting all subsequent records',()=>{
 const extra=compareReceipt(planned,parseReceipt('銀座|京橋\n物販|—\n京橋|日本橋'),{order:'oldest-first'});
 expect(extra.rows.map(r=>r.kind)).toEqual(['same','extra','same']);expect(extra.ambiguous).toBe(false);
 const missing=compareReceipt(planned,parseReceipt('京橋|日本橋'),{order:'oldest-first'});
 expect(missing.rows.map(r=>r.kind)).toEqual(['missing','same']);
});
it('does not confuse normalized name equality with glyph placement',()=>{
 const check=compareReceipt(planned,parseReceipt(' 銀座|京橋\n京橋|日本橋'),{order:'oldest-first'});
 expect(check.counts.same).toBe(2);expect(check.rows[0].targetMatches).toBe(false);
 const changed=compareReceipt(planned,parseReceipt('メトロ銀座|京橋\n京橋|日本橋'),{order:'oldest-first'});
 expect(changed.counts.changed).toBe(1);expect(changed.rows[0].targetMatches).toBe(false);
});
it('flags ambiguous alignments for repeated station pairs',()=>{
 const repeated=[planned[0],{...planned[0],number:2,messageIndex:1}];
 const check=compareReceipt(repeated,parseReceipt('銀座|京橋'),{order:'oldest-first'});
 expect(check.ambiguous).toBe(true);expect(check.counts.missing).toBe(1);
});
it('compares the selected exit label at its half-width cell offset',()=>{
 const context={stations:[{id:'a',name:'銀座'},{id:'b',name:'京橋'}],field:'exit',sequence:[{character:'京',selected:{text:'メ京橋',column:2}}]};
 const expected=expectedReceipt({records:[{entry:'a',exit:'b',messageIndex:0}]},context);
 expect(expected[0].exit).toBe('メ京橋');
 const matching=compareReceipt(expected,parseReceipt('銀座|メ京橋'),{order:'oldest-first',field:'exit'});
 expect(matching.rows[0].targetMatches).toBe(true);
 const mismatch=compareReceipt(expected,parseReceipt('銀座|京橋'),{order:'oldest-first',field:'exit'});
 expect(mismatch.rows[0].targetMatches).toBe(false);
 for(const file of ['receipt-check.js','receipt-panel.js'])expect(readFileSync('public/ekispell/'+file)).toEqual(readFileSync('integrations/ekispell/'+file));
});
