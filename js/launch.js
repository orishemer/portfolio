/* The hand at the foot of the blue card throws a paper plane as the page
   scrolls past it.

   One number drives all of it: p, zero while the card is still the thing
   you are reading, one once it has left the screen. Because the position
   is read from the scroll rather than played on a timer, stopping halfway
   leaves the plane halfway, and scrolling back puts it in the hand again.

   Three beats:
   - aim      the arm sways once across and back, then draws back a touch
   - release  the photograph of the hand holding the plane is swapped for
              the one with the fingers open; the arm follows through
   - flight   the loose plane travels along a curve (a cubic Bezier) and
              always points where it is going: its angle is the tangent of
              the path, so it noses forward off the hand, climbs, and
              levels out as it glides away, rocking less as it goes */
(function () {
  var host = document.querySelector('.launch-host');
  var rig  = host && host.querySelector('.launch');
  if (!rig) return;

  var RELEASE = 0.46;
  var SWAP    = 0.05;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function smooth(t) { return t * t * (3 - 2 * t); }

  /* the flight path, in multiples of the rig's width: a short push
     forward off the fingers, then up and away to the right */
  var P = [[0, 0], [0.7, -0.2], [0.95, -1.3], [1.45, -2.6]];
  function bez(t, i) {
    var u = 1 - t;
    return u*u*u*P[0][i] + 3*u*u*t*P[1][i] + 3*u*t*t*P[2][i] + t*t*t*P[3][i];
  }
  function tangent(t) {
    var u = 1 - t, dx = 0, dy = 0;
    dx = 3*u*u*(P[1][0]-P[0][0]) + 6*u*t*(P[2][0]-P[1][0]) + 3*t*t*(P[3][0]-P[2][0]);
    dy = 3*u*u*(P[1][1]-P[0][1]) + 6*u*t*(P[2][1]-P[1][1]) + 3*t*t*(P[3][1]-P[2][1]);
    return Math.atan2(dy, dx) * 180 / Math.PI;
  }
  var HEADING0 = tangent(0);

  function update() {
    var r = host.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var p = clamp((vh * 0.80 - r.bottom) / (vh * 0.80 - vh * 0.10), 0, 1);
    var unit = rig.getBoundingClientRect().width || 180;

    /* aim: one sway across and back, then a short draw back before the
       throw, so the release has something to come out of */
    var u = clamp(p / RELEASE, 0, 1);
    var sway = Math.sin(clamp(u / 0.8, 0, 1) * Math.PI * 2);
    var draw = smooth(clamp((u - 0.8) / 0.2, 0, 1));
    var aimX = sway * unit * 0.2 - draw * unit * 0.06;
    var aimR = sway * 5 + draw * 6;

    /* release and follow-through: the arm snaps forward past where it
       threw from, then settles back a little */
    var f = clamp((p - RELEASE) / 0.22, 0, 1);
    var follow = Math.sin(f * Math.PI) * (1 - f * 0.4) + f * 0.35;
    aimX += follow * unit * 0.12;
    aimR -= follow * 13;

    var sw = clamp((p - RELEASE) / SWAP, 0, 1);

    /* the flight */
    var q = clamp((p - RELEASE) / (1 - RELEASE), 0, 1);
    /* slow out of the fingers, quick through the middle, easing away */
    var t = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
    var x = bez(t, 0) * unit;
    var y = bez(t, 1) * unit;
    var rock = Math.sin(q * Math.PI * 4) * 4 * (1 - q);
    /* a paper plane glides nose-high but never stands on its tail: it
       follows the path's angle at a little over half strength */
    var rot = (tangent(t) - HEADING0) * 0.55 + rock;
    var sc = 1 - smooth(q) * 0.45;          /* it gets further away */
    var op = sw * (1 - smooth(clamp((q - 0.62) / 0.38, 0, 1)));

    rig.style.setProperty('--p', p.toFixed(4));
    rig.style.setProperty('--aim-x', aimX.toFixed(2) + 'px');
    rig.style.setProperty('--aim-r', aimR.toFixed(2) + 'deg');
    rig.style.setProperty('--hold', (1 - sw).toFixed(3));
    rig.style.setProperty('--free', sw.toFixed(3));
    rig.style.setProperty('--tx', x.toFixed(2) + 'px');
    rig.style.setProperty('--ty', y.toFixed(2) + 'px');
    rig.style.setProperty('--rot', rot.toFixed(2) + 'deg');
    rig.style.setProperty('--sc', sc.toFixed(4));
    rig.style.setProperty('--op', op.toFixed(3));
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
  window.addEventListener('load', update);
  update();
  window.__launchUpdate = update;
  window.__launchAt = function (p) {            /* for checking by hand */
    var vh = window.innerHeight, r = host.getBoundingClientRect();
    var from = vh * 0.80, to = vh * 0.10;
    window.scrollBy(0, r.bottom - (from - p * (from - to)));
    update();
  };
})();
