export const MAP_ROUTES = ['/', '/servidores/', '/promocion/', '/informacion/'];

export function wheelDistance(event, pageHeight) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return 0;
  return event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? pageHeight : 1);
}

export function canScrollInDirection(element, direction) {
  return element.scrollHeight > element.clientHeight + 2 && (direction > 0
    ? element.scrollTop + element.clientHeight < element.scrollHeight - 2
    : element.scrollTop > 2);
}

// A gesture belongs either to a scrollable panel or to one map transition.
// Inertial events cannot become a second navigation when the camera settles.
export function createMapWheelGesture() {
  let last = -Infinity, until = -Infinity, total = 0, direction = 0, owner = null;
  return {
    settle(now) { until = now + 950; total = 0; owner = 'map'; },
    step({ delta, now, scrollable = false, available = true }) {
      if (!delta) return 'native';
      const nextDirection = Math.sign(delta);
      if (now - last > 240 || nextDirection !== direction) { total = 0; owner = null; }
      last = now; direction = nextDirection;
      if (now < until) { owner = 'map'; return 'hold'; }
      if (owner === 'map') return 'hold';
      if (scrollable) { owner = 'panel'; total = 0; return 'native'; }
      if (owner === 'panel') return 'hold';
      if (!available) return 'native';
      total += Math.abs(delta);
      if (total < 60) return 'hold';
      this.settle(now);
      return nextDirection;
    },
  };
}
