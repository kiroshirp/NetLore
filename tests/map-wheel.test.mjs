import test from 'node:test';
import assert from 'node:assert/strict';
import { MAP_ROUTES, canScrollInDirection, createMapWheelGesture, wheelDistance } from '../src/map-wheel.mjs';

test('wheel respects menu order, direction and device delta units', () => {
  assert.deepEqual(MAP_ROUTES, ['/', '/servidores/', '/promocion/', '/informacion/']);
  assert.equal(wheelDistance({deltaY:3,deltaX:0,deltaMode:1},800),48);
  assert.equal(wheelDistance({deltaY:-1,deltaX:0,deltaMode:2},800),-800);
  for (const modifier of ['ctrlKey','metaKey','altKey','shiftKey']) assert.equal(wheelDistance({deltaY:100,deltaX:0,[modifier]:true},800),0);
  assert.equal(wheelDistance({deltaY:10,deltaX:90},800),0);
});

test('trackpad accumulation produces one transition despite prolonged inertia', () => {
  const gesture = createMapWheelGesture();
  assert.equal(gesture.step({delta:20,now:0}), 'hold');
  assert.equal(gesture.step({delta:20,now:20}), 'hold');
  assert.equal(gesture.step({delta:20,now:40}), 1);
  for(let now=60;now<1600;now+=20) assert.equal(gesture.step({delta:10,now}), 'hold');
  assert.equal(gesture.step({delta:80,now:2000}),1);
  assert.equal(gesture.step({delta:-80,now:3100}),-1);
});

test('scrolling a panel to its boundary needs a new gesture to change section', () => {
  const gesture = createMapWheelGesture();
  assert.equal(gesture.step({delta:120,now:0,scrollable:true}), 'native');
  assert.equal(gesture.step({delta:120,now:80,scrollable:false}), 'hold');
  assert.equal(gesture.step({delta:120,now:160,scrollable:false}), 'hold');
  assert.equal(gesture.step({delta:120,now:500,scrollable:false}),1);
  assert.equal(gesture.step({delta:120,now:600,scrollable:true}), 'hold');
});

test('menu transitions settle before wheel navigation and ends do not wrap', () => {
  const gesture = createMapWheelGesture();
  gesture.settle(0);
  assert.equal(gesture.step({delta:120,now:100}), 'hold');
  assert.equal(gesture.step({delta:120,now:1100,available:false}), 'native');
  assert.equal(gesture.step({delta:-120,now:1400}),-1);
});

test('scroll boundaries tolerate fractional positions and short panels', () => {
  const panel = {scrollHeight:1000,clientHeight:400,scrollTop:200};
  assert.equal(canScrollInDirection(panel,1),true);
  assert.equal(canScrollInDirection(panel,-1),true);
  assert.equal(canScrollInDirection({...panel,scrollTop:599.5},1),false);
  assert.equal(canScrollInDirection({...panel,scrollTop:0},-1),false);
  assert.equal(canScrollInDirection({...panel,scrollHeight:400,scrollTop:0},1),false);
});
