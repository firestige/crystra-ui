import {expect,it} from 'vitest';
import {initialStudioDraft,checkStudioDraft,applyStudioChange,publishStudioDraft} from './studio-intent-draft';
it('allows incomplete drafts but blocks publication',()=>{const d=initialStudioDraft();expect(checkStudioDraft(d).issues).toHaveLength(2);expect(()=>publishStudioDraft(d,checkStudioDraft(d))).toThrow();});
it('binds checks to exact content and keeps a published copy independent',()=>{const a=initialStudioDraft(),check=checkStudioDraft(a);const b=applyStudioChange(applyStudioChange(a,'return-path'),'test-skill');expect(()=>publishStudioDraft(b,check)).toThrow();const published=publishStudioDraft(b,checkStudioDraft(b));expect(published.content).toEqual(b);expect(published.content).not.toBe(b);expect(a.returnPath).toBe(false);});
