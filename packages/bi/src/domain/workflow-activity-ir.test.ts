import {describe,it,expect} from 'vitest';
import example from './workflow-activity-ir.example.json';
import simple from './workflow-activity-ir.simple.json';
import {validateActivityIR,type WorkflowActivityIR} from './workflow-activity-ir';
const copy=()=>structuredClone(example) as WorkflowActivityIR;
describe('activity projection references',()=>{
 it('accepts one main view and the shared trigger referenced by several activities',()=>{
  expect(validateActivityIR(copy())).toEqual([]);
  expect(validateActivityIR(simple as WorkflowActivityIR)).toEqual([]);
 });
 it('rejects an unresolved target instead of rendering a dead badge',()=>{
  const ir=copy();ir.relations[1].target.flowId='missing';
  expect(validateActivityIR(ir).join(' ')).toContain('target');
 });
 it('requires the main flow first and only once',()=>{
  const ir=copy();ir.flows[1].kind='main';
  expect(validateActivityIR(ir).length).toBeGreaterThan(0);
 });
 it('does not admit an unlabelled trigger or an exit outside its flow',()=>{
  const ir=copy();ir.relations[1].condition='';ir.relations[0].target.exitNodeId='goal';
  expect(validateActivityIR(ir).join(' ')).toContain('condition');
  expect(validateActivityIR(ir).join(' ')).toContain('exit');
 });
 it('keeps each entity unique and each edge inside its view',()=>{
  const ir=copy();ir.nodes.push(ir.nodes[0]);ir.flows[0].edges[0].to='request';
  expect(validateActivityIR(ir).join(' ')).toContain('duplicate');
  expect(validateActivityIR(ir).join(' ')).toContain('edge');
 });
});

it('projects the implementation test-first ladder and deterministic Goal loop',()=>{
 const main=example.flows.find(f=>f.id==='main')!;
 const ladder=example.flows.find(f=>f.id==='ladder')!;
 expect(ladder).toBeDefined();
 expect(main.edges).toEqual(expect.arrayContaining([expect.objectContaining({from:'commit',to:'select-goal'})]));
 expect(ladder.edges).toEqual(expect.arrayContaining([expect.objectContaining({from:'calibrate',to:'implement'}),expect.objectContaining({from:'rung-result',to:'implement',outcome:'rework'})]));
 expect(example.nodes.find(n=>n.id==='planner')).toBeUndefined();
 expect(example.nodes.every(n=>!!n.sourceRef)).toBe(true);
});
