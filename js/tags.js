/* The suitcase beside the location line and its two luggage tags.

   The case floats: a slow rise and fall and a slight rock, on two clocks
   that never line up, so it never repeats in an obvious loop.

   Each tag is a damped pendulum hung from the top of its string loop.
   Gravity pulls it to hang straight down in the room, not in the case:
   when the case rocks, the tag's resting angle is the opposite of the
   case's tilt, so it stays plumb while the handle turns under it, and
   lags and swings a little as the case moves. Scrolling the page gives
   both a nudge, as a tag swings when the case is carried. */
(function () {
  var trip = document.querySelector('.trip');
  if (!trip) return;
  var tags = [].slice.call(trip.querySelectorAll('.trip-tag'));
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* a little longer string swings a little slower */
  var bobs = tags.map(function (el, i) {
    return { el: el, a: 0, v: 0, k: i ? 26 : 34, c: i ? 2.4 : 2.8, kick: i ? 0.9 : 1.1 };
  });

  var MAX = 16;                       /* degrees: never swings round the handle */
  var lastY = window.scrollY, push = 0, raf = 0, last = 0, t = 0, visible = true;

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    push += y - lastY;
    lastY = y;
  }, { passive: true });

  function step(now) {
    raf = 0;
    if (!visible) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    t += dt;

    /* the case: two slow, unrelated clocks */
    var bob  = Math.sin(t * 2 * Math.PI / 5.3) * 4 + Math.sin(t * 2 * Math.PI / 8.9 + 1.7) * 1.5;
    var tilt = Math.sin(t * 2 * Math.PI / 6.7 + 0.6) * 1.8 + Math.sin(t * 2 * Math.PI / 11.3) * 0.7;

    trip.style.setProperty('--bob', bob.toFixed(2) + 'px');
    trip.style.setProperty('--tilt', tilt.toFixed(3) + 'deg');

    /* scrolling down carries the case up the screen; the tags lag */
    var kick = Math.max(-40, Math.min(40, push)) * 11;
    push = 0;

    bobs.forEach(function (b) {
      var rest = -tilt;               /* plumb in the room, not in the case */
      b.v += (kick * b.kick - b.k * (b.a - rest) - b.c * b.v) * dt;
      b.a += b.v * dt;
      if (b.a > MAX) { b.a = MAX; b.v *= -0.3; }
      if (b.a < -MAX) { b.a = -MAX; b.v *= -0.3; }
      b.el.style.setProperty('--sw', b.a.toFixed(2) + 'deg');
    });

    raf = requestAnimationFrame(step);
  }

  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(step); } }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible) start();
    }).observe(trip);
  }
  start();
  window.__tagsKick = function (px) { push += px; };
})();
