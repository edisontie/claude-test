// Fig: an API-gateway rate limiter (token bucket) drawn as a coin-dispensing bench.
// node build.mjs [--light]
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../plugins/anatomy/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../plugins/anatomy/skills/anatomy/scripts/inline-kit.mjs";
import * as M from "./model.mjs";

Object.assign(globalThis, k);
const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 640;
const HEIGHT = 384;

// ---------- world ----------
const PLATE = { x: -122, y: -62, w: 244, d: 134, r: 9 };
const PLATE_H = 10;
const FOOT_H = 5;

const RAIL = { x: -114, y: 11, w: 228, d: 18, r: 1 }; // conveyor, top at z 4
const RAIL_TOP = 4;
const TUNNEL_L = { x: -116, y: 5, w: 52, d: 30, r: 2 }; // clients
const TUNNEL_R = { x: 64, y: 5, w: 52, d: 30, r: 2 }; // upstream
const TUNNEL_H = 32;
const MOUTH = { y0: 10.5, y1: 29.5, z0: RAIL_TOP, z1: 22 };

const CAGE = { cx: 0, cy: 20, half: 11, postR: 1.6, top: 54, bar: 3 };
const POSTS = { bl: [-11, 8.5], br: [11, 8.5], fl: [-11, 31.5], fr: [11, 31.5] };
const TOKEN = { r: 6.6, h: 4.4, pitch: 5, seat: 21 };
const SIDE_PLATE = { z: 19.2, h: 4 };

const TRACK = { x: -32, y: -56, w: 44.6, d: 66, r: 1.5, z: 57, h: 3 };
const TRACK_TOP = TRACK.z + TRACK.h; // 60
const FEED = { from: -28, to: 13 };
const HOPPER = { cx: 0, cy: -28, neckR: 7.6, neckZ: 67, bodyZ: 73, top: 93 };
const GUIDE = { x: -26, w: 4 };
const MOTOR = { x: -31, y: -55, w: 12, d: 11, r: 1.4 };

const GATE_X = 34;
const GATE = { z: 4.4, h: 16, lift: 24, head: 46 };
const KICK = { rest: 10, out: 41, z: 6, h: 6 };
const TRAY = { x: -14, y: 36, w: 28, d: 26, r: 1.5, wall: 3.5 };
const TRAY_FLOOR = 1.2;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [HOPPER.cx, HOPPER.cy - 11, HOPPER.top + 2], [HOPPER.cx + 11, HOPPER.cy + 11, HOPPER.top]],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: 45 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const poly = (points, closed = true) => k.pathOf(points.map(at), closed);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const box = (x0, y0, x1, y1, z, h, steps = 3, bevel = 0.4, r = 0.6) => k.slabOf({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r }, z, h, P, steps, bevel);
const post = ([x, y], z0, z1, tone = "mid") => S(k.cylinder(x, y, CAGE.postR, z0, z1 - z0, P, 18), { tone, crease: "none" });

// ---------- base ----------
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // ruler strip along the front right
  const strip = { x: 24, y: 58, w: 86, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  // label plate front left
  const label = { x: -108, y: 44, w: 40, d: 18, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L(k.lineOnTop([label.x + 5, label.y + 5.5], [label.x + 34, label.y + 5.5], 0.8, P), { tone: "lo", free: true }));
  out.push(L(k.lineOnTop([label.x + 5, label.y + 9], [label.x + 26, label.y + 9], 0.8, P), { tone: "lo", free: true }));
  out.push(L(k.lineOnTop([label.x + 5, label.y + 12.5], [label.x + 30, label.y + 12.5], 0.8, P), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.6, label.y + 2.6, 0.8]), at([label.x + label.w - 2.6, label.y + label.d - 2.6, 0.8])], { size: 0.4 }));
  return out.join("");
}

// ---------- tray (back and left walls, floor) ----------
function trayBack() {
  const t = TRAY;
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(t, 2), 0, 0.1, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(t, 0, TRAY_FLOOR, P, 4, 0.4), { tone: "lo" }));
  const slots = [0, 1, 2].map((i) => k.planOutline({ x: t.x + 5, y: t.y + 6 + i * 6, w: t.w - 10, d: 2.2, r: 1.1 }, TRAY_FLOOR, P, 3)).join("");
  out.push(L(slots, { tone: "lo" }));
  out.push(S(box(t.x, t.y, t.x + t.w, t.y + 1.5, 0, t.wall), { tone: "mid" }));
  out.push(S(box(t.x, t.y + 1.5, t.x + 1.5, t.y + t.d - 1.5, 0, t.wall), { tone: "mid" }));
  return out.join("");
}
function trayFront() {
  const t = TRAY;
  const out = [];
  out.push(S(box(t.x + t.w - 1.5, t.y + 1.5, t.x + t.w, t.y + t.d - 1.5, 0, t.wall), { tone: "mid" }));
  out.push(S(box(t.x, t.y + t.d - 1.5, t.x + t.w, t.y + t.d, 0, t.wall), { tone: "mid" }));
  out.push(D([at([t.x + 0.75, t.y + t.d - 0.75, t.wall]), at([t.x + t.w - 0.75, t.y + t.d - 0.75, t.wall]), at([t.x + t.w - 0.75, t.y + 0.75, t.wall])], { size: 0.4 }));
  out.push(k.faceTextSvg(k.sideMatrix([0, t.y + t.d], 0.9, P, "left"), "429", { size: 2.2, tone: "lo", anchor: "middle" }));
  return out.join("");
}

// ---------- conveyor ----------
function rail() {
  const out = [];
  out.push(S(k.slabOf(RAIL, 0, RAIL_TOP, P, 3, 0.5), { tone: "mid" }));
  // rollers: lines across the belt, edge to edge
  const rollers = [];
  for (let x = RAIL.x + 6; x < RAIL.x + RAIL.w - 3; x += 6) rollers.push(k.lineOnTop([x, RAIL.y], [x, RAIL.y + RAIL.d], RAIL_TOP, P));
  out.push(L(rollers.join(""), { tone: "faint" }));
  // back guide lip
  out.push(S(box(RAIL.x + 60, RAIL.y, RAIL.x + RAIL.w - 60, RAIL.y + 1, RAIL_TOP, 1.5, 2, 0.3, 0.3), { tone: "mid", crease: "none" }));
  // support blocks under the open stretch
  return out.join("");
}

function railFeet() {
  const out = [];
  for (const x of [-46, 50]) out.push(S(box(x - 4, RAIL.y - 2, x + 4, RAIL.y + RAIL.d + 2, 0, 1.2, 2, 0.3), { tone: "lo" }));
  return out.join("");
}

// ---------- tunnels ----------
function tunnel(plan, side) {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 2), 0, TUNNEL_H, P)}" style="filter:blur(6px)"/>`];
  const z0 = 0;
  const seam = k.sideSeam(plan, 6, P, 4);
  out.push(S(k.slabOf(plan, z0, TUNNEL_H, P, 4, 1.2), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  // roof: inspection cover and screws
  const cover = { x: plan.x + 8, y: plan.y + 5, w: plan.w - 16, d: plan.d - 10, r: 1.5 };
  out.push(S(k.slabOf(cover, TUNNEL_H, 1, P, 4, 0.4), { tone: "mid" }));
  out.push(D(k.corners(cover, 2.4).map(([x, y]) => at([x, y, TUNNEL_H + 1])), { size: 0.42 }));
  // louvre slots on the +y face (closed outlines)
  const yf = plan.y + plan.d;
  const slots = [];
  for (let i = 0; i < 4; i++) {
    const x0 = plan.x + 8 + i * 6;
    slots.push(poly([[x0, yf, 12], [x0 + 3.4, yf, 12], [x0 + 3.4, yf, 26], [x0, yf, 26]]));
  }
  out.push(L(slots.join(""), { tone: "lo" }));
  // plate on +y face with two screws
  const px = plan.x + plan.w - 10;
  out.push(L(poly([[px - 6, yf, 8.5], [px + 4, yf, 8.5], [px + 4, yf, 14.5], [px - 6, yf, 14.5]]), { tone: "faint" }));
  out.push(D([at([px - 4.6, yf, 11.5]), at([px + 2.6, yf, 11.5])], { size: 0.4 }));
  if (side === "left") {
    // mouth on the +x face
    const xm = plan.x + plan.w;
    const m = MOUTH;
    out.push(`<path class="iso-shade" data-shade="0" d="${poly([[xm, m.y0, m.z0], [xm, m.y1, m.z0], [xm, m.y1, m.z1], [xm, m.y0, m.z1]])}"/>`);
    out.push(L(poly([[xm, m.y0, m.z0], [xm, m.y1, m.z0], [xm, m.y1, m.z1], [xm, m.y0, m.z1]]), { tone: "lo" }));
    // frame bars round the mouth
    out.push(L(poly([[xm, m.y0 - 2, m.z0], [xm, m.y1 + 2, m.z0], [xm, m.y1 + 2, m.z1 + 2], [xm, m.y0 - 2, m.z1 + 2]]), { tone: "faint" }));
    out.push(D([[m.y0 - 1, m.z1 + 1], [m.y1 + 1, m.z1 + 1]].map(([y, z]) => at([xm, y, z])), { size: 0.42 }));
    // strip curtain: closed strips hanging from the lintel
    const strips = [];
    for (let i = 0; i < 6; i++) {
      const y0 = m.y0 + 0.6 + i * 3.1;
      strips.push(poly([[xm, y0, m.z1], [xm, y0 + 2.5, m.z1], [xm, y0 + 2.5, m.z0 + 5], [xm, y0, m.z0 + 5]]));
    }
    out.push(`<g data-part="curtain">${L(strips.join(""), { tone: "lo" })}</g>`);
  } else {
    out.push(`<circle data-part="led" class="iso-led" cx="${at([plan.x + plan.w - 6, yf, 20])[0]}" cy="${at([plan.x + plan.w - 6, yf, 20])[1]}" r="1.1"/>`);
    out.push(L(k.sideRing ? poly(circleOnY(plan.x + plan.w - 6, yf, 20, 2.2)) : "", { tone: "lo" }));
  }
  return out.join("");
}
function circleOnY(cx, y, cz, r, n = 20) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]);
  }
  return pts;
}

// ---------- conveyor drive, behind the upstream tunnel ----------
function drive() {
  const out = [];
  const Y = -22; // shift of the whole motor back from the tunnel
  const flange = { x: 57, y: -34 + Y, w: 22, d: 22, r: 1.6 };
  out.push(`<path class="iso-halo" d="${k.haloOf(flange, 0, 12, P)}" style="filter:blur(5px)"/>`);
  out.push(S(k.slabOf(flange, 0, 1.2, P, 4, 0.4), { tone: "lo" }));
  out.push(D(k.corners(flange, 2.2).map(([x, y]) => at([x, y, 1.2])), { size: 0.42 }));
  const motorPlan = { x: 60, y: -31 + Y, w: 16, d: 15, r: 2 };
  out.push(S(k.slabOf(motorPlan, 1.2, 13, P, 5, 0.8), { tone: "mid", inner: L(k.sideSeam(motorPlan, 4.2, P, 5) + k.sideSeam(motorPlan, 11.2, P, 5), { tone: "faint" }) }));
  const fins = [];
  for (let i = 0; i < 4; i++) fins.push(poly([[76, -28 + Y + i * 3.2, 5.6], [76, -26.4 + Y + i * 3.2, 5.6], [76, -26.4 + Y + i * 3.2, 10], [76, -28 + Y + i * 3.2, 10]]));
  out.push(L(fins.join(""), { tone: "lo" }));
  const plate = { x: 63, y: -28 + Y, w: 8, d: 9, r: 0.8 };
  out.push(S(k.slabOf(plate, 14.2, 0.5, P, 3), { tone: "lo", crease: "none" }));
  out.push(L(k.lineOnTop([plate.x + 1.6, plate.y + 3], [plate.x + 6.4, plate.y + 3], 14.7, P) + k.lineOnTop([plate.x + 1.6, plate.y + 5.4], [plate.x + 5, plate.y + 5.4], 14.7, P), { tone: "lo", free: true }));
  out.push(S(box(62, -16 + Y, 74, -7 + Y, 2, 11, 3, 0.5, 1), { tone: "mid" }));
  out.push(D([[64, -9], [72, -9], [64, -14], [72, -14]].map(([x, y]) => at([x, y + Y, 13])), { size: 0.4 }));
  // drive shaft to the head pulley inside the tunnel, on a pillow-block bearing
  out.push(S(box(66.4, -7 + Y, 69.6, 5, 6.2, 3.2, 2, 0.2, 0.6), { tone: "hi", crease: "lo" }));
  out.push(S(box(65.4, -3 + Y, 70.6, -1 + Y, 5.2, 5.2, 2, 0.2, 0.5), { tone: "mid" }));
  const block = { x: 63, y: -14, w: 10, d: 5, r: 0.8 };
  out.push(S(k.slabOf(block, 0, 1, P, 3, 0.3), { tone: "lo" }));
  out.push(S(box(65, -13.4, 71, -9.6, 1, 5.2, 2, 0.3, 0.6), { tone: "mid" }));
  out.push(D([at([64.2, -11.5, 1]), at([71.8, -11.5, 1])], { size: 0.4 }));
  out.push(S(box(66.4, -9.6, 69.6, 5, 6.2, 3.2, 2, 0.2, 0.6), { tone: "hi", crease: "lo" }));
  out.push(S(box(64.8, -13.6, 71.2, -9.4, 6.2, 4, 2, 0.3, 1.2), { tone: "mid" }));
  return out.join("");
}

// ---------- kicker housing ----------
function kickerHousing() {
  const out = [];
  const plan = { x: -9, y: -8, w: 18, d: 12, r: 1.5 };
  out.push(S(k.slabOf(plan, 0, 15, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(plan, 3, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(plan, 2.5), 15, P, 3), { tone: "faint" }));
  out.push(D(k.corners(plan, 2).map(([x, y]) => at([x, y, 15])), { size: 0.42 }));
  // gland on the +y face
  out.push(L(poly(circleOnY(0, 4, 9, 2.6)), { tone: "lo" }));
  return out.join("");
}

// ---------- cage: an open-fronted magazine on two back posts ----------
const BACK_Y = POSTS.bl[1];
const topBar = (which) => {
  const z = CAGE.top;
  const h = CAGE.bar;
  const w = 1.6;
  if (which === "back") return S(box(-12.6, BACK_Y - w, 12.6, BACK_Y + w, z, h, 2, 0.3), { tone: "mid" });
  const x = which === "left" ? -11 : 11;
  return S(box(x - w, BACK_Y + w, x + w, 29.5, z, h, 2, 0.3, 1.2), { tone: "mid" });
};
const sidePlate = (sx) => {
  const x0 = sx < 0 ? -12.6 : 9.4;
  const out = [S(box(x0, 10.1, x0 + 3.2, 29.9, SIDE_PLATE.z, SIDE_PLATE.h, 2, 0.3, 1), { tone: "mid" })];
  out.push(D([at([x0 + 1.6, 12.4, SIDE_PLATE.z + SIDE_PLATE.h]), at([x0 + 1.6, 27.6, SIDE_PLATE.z + SIDE_PLATE.h])], { size: 0.4 }));
  return out.join("");
};
function cageBack() {
  const out = [];
  out.push(S(k.cylinder(POSTS.bl[0], POSTS.bl[1], 2.6, 0, 1.2, P, 18), { tone: "lo" }));
  out.push(S(k.cylinder(POSTS.br[0], POSTS.br[1], 2.6, 0, 1.2, P, 18), { tone: "lo" }));
  out.push(post(POSTS.bl, 1.2, CAGE.top));
  out.push(post(POSTS.br, 1.2, CAGE.top));
  // back plate: one rule per coin seat, edge to edge, so the six places read even when empty
  const face = BACK_Y + 1.1;
  out.push(S(box(-9.4, BACK_Y - 0.5, 9.4, face, SIDE_PLATE.z, CAGE.top - SIDE_PLATE.z, 2, 0.2, 0.2), { tone: "lo" }));
  const rules = [];
  for (let i = 1; i <= M.CAPACITY; i++) rules.push(k.segment([-9.4, face, TOKEN.seat + TOKEN.pitch * i - 0.3], [9.4, face, TOKEN.seat + TOKEN.pitch * i - 0.3], P));
  out.push(L(rules.slice(0, -1).join(""), { tone: "faint" }), L(rules[rules.length - 1], { tone: "mid" }));
  out.push(sidePlate(-1));
  out.push(topBar("back"), topBar("left"));
  return out.join("");
}
const finger = (sx) => {
  const x0 = sx < 0 ? -9.4 : 5.4;
  return S(box(x0, 17, x0 + 4, 23, 19.8, 1.2, 2, 0.2, 0.4), { tone: "hi" });
};
function cageFrontLeft() {
  return "";
}
function cageFront() {
  const out = [];
  out.push(sidePlate(1));
  out.push(topBar("right"));
  out.push(D([[-11, BACK_Y], [11, BACK_Y], [-11, 27.6], [11, 27.6]].map(([x, y]) => at([x, y, CAGE.top + CAGE.bar])), { size: 0.5 }));
  return out.join("");
}

// ---------- feeder: track, guide, motor, hopper ----------
function trackLegs() {
  const out = [];
  for (const [x, y] of byDepth([[-29, -53], [9, -53], [-29, -22]])) {
    out.push(S(box(x - 1.6, y - 1.6, x + 1.6, y + 1.6, 0, TRACK.z, 2, 0.2, 0.4), { tone: "mid", crease: "none" }));
    out.push(S(box(x - 3, y - 3, x + 3, y + 3, 0, 1.2, 2, 0.3, 0.8), { tone: "lo" }));
  }
  return out.join("");
}
function track() {
  const out = [];
  out.push(S(k.slabOf(TRACK, TRACK.z, TRACK.h, P, 3, 0.5), { tone: "mid" }));
  // channel rails either side of the coin path
  out.push(S(box(-8.9, -44, -7.5, 10, TRACK_TOP, 2.5, 2, 0.2, 0.3), { tone: "mid", crease: "none" }));
  out.push(S(box(7.5, -44, 8.9, 10, TRACK_TOP, 2.5, 2, 0.2, 0.3), { tone: "mid", crease: "none" }));
  // a scale beside the path: one major per token pitch of travel
  const strip = { x: 9.6, y: FEED.from, w: 2.6, d: FEED.to - FEED.from, r: 0.4 };
  out.push(S(k.slabOf(strip, TRACK_TOP, 0.4, P, 2), { tone: "lo", crease: "none" }));
  const tk = k.topTicks(strip.y + 0.01, strip.y + strip.d, strip.d / 10, 5, strip.x + 0.2, TRACK_TOP + 0.4, [1, 2.2], P, "y");
  out.push(L(tk.minor, { tone: "lo" }), L(tk.major, { tone: "mid" }));
  // guide bar for the pusher
  out.push(S(box(GUIDE.x, -50, GUIDE.x + GUIDE.w, 6, TRACK_TOP, 3, 2, 0.3, 0.5), { tone: "mid" }));
  out.push(S(box(GUIDE.x - 1, 4, GUIDE.x + GUIDE.w + 1, 8, TRACK_TOP, 5, 2, 0.3, 0.5), { tone: "mid" }));
  out.push(D([at([GUIDE.x + 2, 6, TRACK_TOP + 5])], { size: 0.42 }));
  out.push(D([-40, -20, -2].map((y) => at([GUIDE.x + 2, y, TRACK_TOP + 3])), { size: 0.38, tone: "lo" }));
  out.push(D(k.corners(TRACK, 2.4).map(([x, y]) => at([x, y, TRACK_TOP])), { size: 0.42 }));
  return out.join("");
}
function motor() {
  const out = [];
  const m = MOTOR;
  const top = TRACK_TOP + 12;
  out.push(S(k.slabOf(m, TRACK_TOP, 12, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(m, TRACK_TOP + 3, P, 4), { tone: "faint" }) }));
  // fins on +y face: closed slots
  const yf = m.y + m.d;
  const fins = [];
  for (let i = 0; i < 3; i++) fins.push(poly([[m.x + 2.5 + i * 3, yf, TRACK_TOP + 5], [m.x + 4 + i * 3, yf, TRACK_TOP + 5], [m.x + 4 + i * 3, yf, TRACK_TOP + 10], [m.x + 2.5 + i * 3, yf, TRACK_TOP + 10]]));
  out.push(L(fins.join(""), { tone: "lo" }));
  // coupling into the guide bar
  out.push(S(box(GUIDE.x - 0.5, m.y + m.d, GUIDE.x + GUIDE.w + 0.5, -50, TRACK_TOP, 4, 2, 0.3, 0.5), { tone: "mid" }));
  // rate dial and knob
  const [cx, cy] = [m.x + m.w / 2, m.y + m.d / 2];
  out.push(S(k.cylinder(cx, cy, 5.2, top, 0.5, P, 32), { tone: "lo", crease: "none" }));
  const t = k.radialTicks(cx, cy, 5.2, 12, 4, top + 0.5, [0.8, 1.5], P, -Math.PI * 0.75, Math.PI * 1.5);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(S(k.cylinder(cx, cy, 3.1, top + 0.5, 2.6, P, 28), { tone: "mid" }));
  out.push(L(k.knurl(cx, cy, 3.1, top + 0.5, top + 3.1, 22, P, 0.3), { tone: "lo" }));
  out.push(`<path data-part="rate-pointer" class="iso-line" data-tone="hi" data-free="end" d=""/>`);
  out.push(D([at([cx, cy, top + 3.1])], { size: 0.45, tone: "hi" }));
  // running lamp
  out.push(L(poly(circleOnY(m.x + m.w - 2.5, yf, TRACK_TOP + 8, 1.2, 14)), { tone: "lo" }));
  out.push(`<circle data-part="run-led" class="iso-led" cx="${at([m.x + m.w - 2.5, yf, TRACK_TOP + 8])[0]}" cy="${at([m.x + m.w - 2.5, yf, TRACK_TOP + 8])[1]}" r="0.7"/>`);
  return out.join("");
}
function hopper() {
  const out = [];
  const h = HOPPER;
  // back struts
  for (const x of [-6, 6]) out.push(S(box(x - 1.2, -41.4, x + 1.2, -39, TRACK_TOP, h.bodyZ - TRACK_TOP, 2, 0.2, 0.3), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(h.cx, h.cy, h.neckR, h.neckZ, h.bodyZ - h.neckZ, P, 36), { tone: "mid", inner: L(k.sideArc(h.cx, h.cy, h.neckR, h.neckZ + 2.5, P, 24), { tone: "faint" }) }));
  const body = { x: h.cx - 11, y: h.cy - 11, w: 22, d: 22, r: 2.2 };
  out.push(S(k.slabOf(body, h.bodyZ, h.top - h.bodyZ, P, 5, 0.8), { tone: "mid", inner: L(k.sideSeam(body, h.bodyZ + 4, P, 5), { tone: "faint" }) }));
  // open top with coins inside
  const hole = k.insetPlan(body, 2.2);
  const holeD = k.planOutline(hole, h.top, P, 4);
  out.push(`<clipPath id="hopper-hole"><path d="${holeD}"/></clipPath>`);
  out.push(`<path class="iso-shade" data-shade="0" d="${holeD}"/>`);
  const coins = [[-3.5, -31, -3.6], [3.5, -26, -3.2], [-2, -24.5, -2.4]];
  const inside = coins.map(([x, y, dz]) => S(k.cylinder(x, y, TOKEN.r * 0.8, h.top + dz - 1.6, 1.6, P, 24), { tone: "hi", lit: true })).join("");
  out.push(`<g clip-path="url(#hopper-hole)">${inside}</g>`);
  out.push(L(holeD, { tone: "lo" }));
  out.push(D(k.corners(body, 1.1).map(([x, y]) => at([x, y, h.top])), { size: 0.4 }));
  return out.join("");
}

// ---------- gate ----------
function gateBack() {
  return S(box(GATE_X - 1.6, 7, GATE_X + 1.6, 10.2, 0, GATE.head, 2, 0.3, 0.4), { tone: "mid", crease: "none" }) + S(box(GATE_X - 3, 5.6, GATE_X + 3, 11.6, 0, 1.2, 2, 0.3, 0.8), { tone: "lo" });
}
function gateFront() {
  const out = [];
  out.push(S(box(GATE_X - 3, 28.4, GATE_X + 3, 34.4, 0, 1.2, 2, 0.3, 0.8), { tone: "lo" }));
  out.push(S(box(GATE_X - 1.6, 29.8, GATE_X + 1.6, 33, 0, GATE.head, 2, 0.3, 0.4), { tone: "mid", crease: "none" }));
  out.push(S(box(GATE_X - 2.2, 6.4, GATE_X + 2.2, 33.6, GATE.head, 4, 2, 0.4, 0.6), { tone: "mid" }));
  out.push(D([at([GATE_X, 8.6, GATE.head + 4]), at([GATE_X, 31.4, GATE.head + 4])], { size: 0.42 }));
  return out.join("");
}

// ---------- page ----------
const label =
  "A token-bucket rate limiter built as a bench machine. Requests ride a conveyor out of a client tunnel. A pusher feeds coins (tokens) from a hopper along a track at the refill rate, and they drop into a cage that holds at most six. Under the cage each request is given one coin and the gate lifts to let it through to the upstream tunnel; when the cage is empty the gate stays shut and a kicker pushes the request into a 429 tray.";

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label,
  body: [
    base(),
    trayBack(),
    railFeet(),
    trackLegs(),
    drive(),
    kickerHousing(),
    cageBack(),
    `<g data-part="finger-l">${finger(-1)}</g>`,
    track(),
    motor(),
    `<g data-part="pusher"></g>`,
    `<g data-part="feed-a"></g>`,
    hopper(),
    `<g data-part="feed-b"></g>`,
    rail(),
    gateBack(),
    tunnel(TUNNEL_L, "left"),
    `<g data-part="r1"></g>`,
    cageFrontLeft(),
    `<g data-part="r2"></g>`,
    `<g data-part="stack"></g>`,
    `<g data-part="finger-r">${finger(1)}</g>`,
    cageFront(),
    gateFront(),
    tunnel(TUNNEL_R, "right"),
    trayFront(),
  ],
});

const css = `<style>
.iso-led{fill:var(--anatomy-faint);transition:fill .25s}
.iso-led[data-on]{fill:var(--anatomy-lit)}
.rl-stage{touch-action:pan-y;cursor:pointer}
.rl-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
</style>`;

const CONST = {
  P, C: M.CAPACITY, RATES: M.RATES, RATE_INDEX: M.RATE_INDEX, BURST: M.BURST,
  TOKEN, FEED, TRACK_TOP, RAIL_TOP, GATE_X, GATE, KICK, TRAY, TRAY_FLOOR, MOUTH_X: TUNNEL_L.x + TUNNEL_L.w, EXIT_X: TUNNEL_R.x,
  KNOB: [MOTOR.x + MOTOR.w / 2, MOTOR.y + MOTOR.d / 2, TRACK_TOP + 15.1], GUIDE,
};

const live = `
const K = ${JSON.stringify(CONST)};
${M.source}
(${LIVE.toString()})();
`;

function LIVE() {
  const { P, C, TOKEN, FEED, TRACK_TOP, RAIL_TOP, GATE_X, GATE, KICK, TRAY, TRAY_FLOOR, MOUTH_X, EXIT_X, KNOB, GUIDE } = K;
  const stage = document.querySelector(".rl-stage");
  const svg = stage.querySelector("svg");
  const $ = (name) => svg.querySelector('[data-part="' + name + '"]');
  const parts = { r1: $("r1"), r2: $("r2"), stack: $("stack"), feedA: $("feed-a"), feedB: $("feed-b"), pusher: $("pusher"), fl: $("finger-l"), fr: $("finger-r"), pointer: $("rate-pointer"), led: $("led"), run: $("run-led") };
  const readout = document.querySelector("[data-readout]");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const NS = "http://www.w3.org/2000/svg";
  const mk = (parent) => { const g = document.createElementNS(NS, "g"); parent.appendChild(g); return g; };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const ease = (v, t, dt, tau) => v + (t - v) * (1 - Math.exp(-dt / tau));

  // ----- drawing -----
  const coinSvg = (x, y, z) =>
    solidSvg(cylinder(x, y, TOKEN.r, z, TOKEN.h, P, 30, 0.4), { tone: "hi", lit: true }) +
    lineSvg(ring(x, y, TOKEN.r - 2, z + TOKEN.h, P, 30), { tone: "lo" }) +
    dotsSvg([iso([x, y, z + TOKEN.h], P)], { size: 0.45, tone: "lo" });
  const COIN = coinSvg(0, 0, 0);
  const coinAt = (g, x, y, z) => g.setAttribute("transform", translateAlong(P, [x, y, z]));

  function requestSvg(r) {
    const x0 = Math.max(r.x - 8, MOUTH_X);
    const x1 = r.x + 8;
    if (x1 - x0 < 0.3) return "";
    const cut = x0 > r.x - 8;
    const plan = { x: x0, y: r.y - 7, w: x1 - x0, d: 14, r: cut ? 0.3 : 1.4 };
    const top = r.z + 10;
    let out = solidSvg(slabOf(plan, r.z, 10, P, 3, 0.5), { tone: "hi", crease: "lo", inner: lineSvg(sideSeam(plan, r.z + 3, P, 3), { tone: "faint" }) });
    if (!cut) {
      out += lineSvg(planOutline(insetPlan(plan, 2.2), top, P, 3), { tone: "faint" });
      out += dotsSvg([iso([r.x - 5.6, r.y + 4.6, top], P), iso([r.x + 5.6, r.y - 4.6, top], P)], { size: 0.4, tone: "lo" });
    }
    if (r.coin) out += coinSvg(r.x, r.y, top);
    return r.alpha < 1 ? '<g opacity="' + r.alpha.toFixed(3) + '">' + out + "</g>" : out;
  }

  // feed coin: one element, moved between the slot behind the hopper neck and the one in front
  const feed = mk(parts.feedA);
  feed.innerHTML = COIN;
  // pusher: carriage on the guide bar, an arm over the channel, a finger behind the coin
  const carriage = mk(parts.pusher);
  carriage.innerHTML = solidSvg(slabOf({ x: GUIDE.x - 2, y: -5, w: GUIDE.w + 4, d: 10, r: 1 }, TRACK_TOP + 3, 4, P, 3, 0.5), { tone: "mid" }) +
    dotsSvg([iso([GUIDE.x, -3, TRACK_TOP + 7], P), iso([GUIDE.x + GUIDE.w, 3, TRACK_TOP + 7], P)], { size: 0.4 });
  const arm = mk(parts.pusher);
  arm.innerHTML = solidSvg(slabOf({ x: GUIDE.x + GUIDE.w + 2, y: -1, w: -4 - (GUIDE.x + GUIDE.w + 2), d: 2, r: 0.4 }, TRACK_TOP + 4.6, 1.8, P, 2, 0.2), { tone: "mid", crease: "none" }) +
    solidSvg(slabOf({ x: -4, y: -1, w: 8, d: 2, r: 0.4 }, TRACK_TOP + 2.8, 3.6, P, 2, 0.2), { tone: "hi" });
  // stack pool
  const pool = [];
  for (let i = 0; i < C + 3; i++) { const g = mk(parts.stack); g.innerHTML = COIN; g.style.display = "none"; pool.push(g); }

  // ----- state -----
  const model = bucket();
  let rateIndex = K.RATE_INDEX;
  let stack = []; // coins in the cage, bottom first: { g, y, z, v }
  let drop = null; // coin released onto a request
  let wrapAt = -1, carY = FEED.from - 8.8, retract = 0, pointerAngle = null;
  let reqs = [], current = null, nextId = 1;
  let gateZ = 0, kickY = KICK.rest, fingers = 0;
  let pending = 0, spawnClock = 0, clock = 0, nextArrival = 1.2, nextBurst = 3.2, lastUser = -99, ledUntil = -1;
  let frame = 0, last = 0, visible = false;
  const kicker = mk(parts.r2);
  const gate = mk(parts.r2);
  gate.innerHTML = solidSvg(slabOf({ x: GATE_X - 1, y: 10.4, w: 2, d: 19.2, r: 0.4 }, GATE.z, GATE.h, P, 2, 0.3), { tone: "mid" }) +
    lineSvg(segment([GATE_X + 1, 10.4, GATE.z + 5], [GATE_X + 1, 29.6, GATE.z + 5], P) + segment([GATE_X + 1, 10.4, GATE.z + 11], [GATE_X + 1, 29.6, GATE.z + 11], P), { tone: "faint" });

  const seatZ = (i) => TOKEN.seat + TOKEN.pitch * i;
  for (let i = 0; i < Math.floor(model.tokens); i++) stack.push({ g: null, y: 20, z: seatZ(i), v: 0 });

  function spawn(n) { pending += n; }
  function burst() { spawn(K.BURST); }

  function step(dt) {
    clock += dt;
    // traffic
    if (!still.matches) {
      if (clock >= nextArrival) { spawn(1); nextArrival = clock + 0.6 + -Math.log(1 - Math.random()) * 2.4; }
      if (clock >= nextBurst) { if (clock - lastUser > 10) burst(); nextBurst = clock + 16; }
    }
    spawnClock -= dt;
    if (pending > 0 && spawnClock <= 0) {
      const back = reqs.filter((r) => r.state === "queue").reduce((m, r) => Math.min(m, r.x), 0);
      reqs.push({ id: nextId++, x: Math.min(-150, back - 20), y: 20, z: RAIL_TOP, alpha: 1, state: "queue", coin: false, g: null, html: "" });
      pending--; spawnClock = 0.12;
    }

    // refill: the model is the truth; the coins follow it
    const before = Math.floor(model.tokens + 1e-9);
    refill(model, K.RATES[rateIndex], dt);
    const after = Math.floor(model.tokens + 1e-9);
    for (let n = before; n < after; n++) { stack.push({ g: null, y: FEED.to, z: TRACK_TOP, v: 0, fall: true }); wrapAt = clock; }
    const frac = fraction(model);
    const feedY = FEED.from + frac * (FEED.to - FEED.from);
    const target = feedY - 8.8;
    if (target < carY - 1) { retract = ease(retract, -12, dt, 0.03); if (retract < -10.5) carY = ease(carY, target, dt, 0.06); }
    else { carY = Math.max(carY, target); if (carY - target < 1) carY = target; retract = ease(retract, 0, dt, 0.04); }

    // coins in the cage fall to their seats
    stack.forEach((c, i) => {
      const seat = seatZ(i);
      if (c.z > seat) { c.v += 700 * dt; c.z = Math.max(seat, c.z - c.v * dt); if (c.fall) c.y = FEED.to + (20 - FEED.to) * smooth(0, 8, TRACK_TOP - c.z); if (c.z === seat) { c.v = 0; c.y = 20; c.fall = false; } }
    });

    // queue
    const queue = reqs.filter((r) => r.state === "queue");
    const onRail = reqs.filter((r) => r.state !== "queue" && r.y < 21);
    let ahead = onRail.length ? Math.min(...onRail.map((r) => r.x)) : Infinity;
    queue.forEach((r) => {
      const tx = Math.min(0, ahead - 20);
      const dx = tx - r.x;
      const v = Math.min(150, Math.sqrt(2 * 1400 * Math.abs(dx)));
      r.x = Math.abs(dx) <= v * dt ? tx : r.x + Math.sign(dx) * v * dt;
      ahead = r.x;
    });
    // decision at the gate
    if (!current && queue.length && Math.abs(queue[0].x) < 0.3) {
      const r = queue[0];
      r.x = 0;
      current = r;
      if (take(model)) { r.state = "grant"; r.phase = "wait"; }
      else { r.state = "kick"; }
    }
    // grant: release the bottom coin onto the request, then lift the gate
    if (current && current.state === "grant") {
      const r = current;
      if (r.phase === "wait" && stack.length && stack[0].z === seatZ(0) && !stack[0].fall) {
        r.phase = "open";
      }
      if (r.phase === "open") {
        fingers = ease(fingers, 1, dt, 0.025);
        if (fingers > 0.9) { const c = stack.shift(); drop = { g: c.g, z: c.z, v: 0, req: r }; r.phase = "drop"; }
      }
      if (r.phase === "drop" && !drop) { r.phase = "lift"; }
      if (r.phase === "lift" && gateZ > GATE.lift * 0.8) { r.state = "go"; current = null; }
    }
    if (!(current && current.state === "grant" && current.phase === "open")) fingers = ease(fingers, 0, dt, 0.04);
    if (drop) {
      drop.v += 700 * dt; drop.z -= drop.v * dt;
      const land = RAIL_TOP + 10;
      if (drop.z <= land) { drop.req.coin = true; if (drop.g) drop.g.style.display = "none"; drop.g = null; drop = null; }
    }
    // gate is up while a granted request is under it or about to be
    const needGate = reqs.some((r) => (r.state === "go" && r.x < GATE_X + 14) || (r.state === "grant" && r.phase === "lift"));
    gateZ = ease(gateZ, needGate ? GATE.lift : 0, dt, needGate ? 0.05 : 0.07);
    // passing requests
    for (const r of reqs) if (r.state === "go") {
      r.vx = Math.min(150, (r.vx || 0) + 600 * dt);
      r.x += r.vx * dt;
      if (r.x > EXIT_X && !r.counted) { r.counted = true; ledUntil = clock + 0.18; }
    }
    // deny: kick into the tray
    if (current && current.state === "kick") {
      kickY = Math.min(KICK.out, kickY + 190 * dt);
      const r = current;
      r.y = Math.max(20, kickY + 7);
      r.z = RAIL_TOP - (RAIL_TOP - TRAY_FLOOR) * smooth(33, 41, r.y);
      if (kickY >= KICK.out) { r.state = "tray"; r.t = 0; r.z = TRAY_FLOOR; current = { state: "retract" }; }
    } else {
      kickY = Math.max(KICK.rest, kickY - 170 * dt);
      if (current && current.state === "retract" && kickY < 12) current = null;
    }
    for (const r of reqs) if (r.state === "tray") { r.t += dt; r.alpha = 1 - smooth(0.3, 0.7, r.t); }
    reqs = reqs.filter((r) => { const gone = (r.state === "go" && r.x > EXIT_X + 40) || (r.state === "tray" && r.t > 0.7); if (gone && r.g) r.g.remove(); return !gone; });

    return { frac, feedY };
  }

  function draw({ frac, feedY }) {
    // feed coin and pusher
    const host = feedY > FEED.from + 16 ? parts.feedB : parts.feedA;
    if (feed.parentNode !== host) host.appendChild(feed);
    coinAt(feed, 0, feedY, TRACK_TOP);
    feed.setAttribute("opacity", wrapAt < 0 ? "1" : smooth(0, 0.3, clock - wrapAt).toFixed(3));
    carriage.setAttribute("transform", translateAlong(P, [0, carY, 0]));
    arm.setAttribute("transform", translateAlong(P, [retract, carY, 0]));
    // cage
    const used = new Set();
    stack.forEach((c) => { if (!c.g || !pool.includes(c.g)) c.g = null; });
    for (const c of stack) if (c.g) used.add(c.g);
    if (drop && drop.g) used.add(drop.g);
    const free = pool.filter((g) => !used.has(g));
    for (const c of stack) if (!c.g) c.g = free.shift();
    pool.forEach((g) => { if (!stack.some((c) => c.g === g) && !(drop && drop.g === g)) g.style.display = "none"; });
    const order = [...(drop && drop.g ? [{ g: drop.g, y: 20, z: drop.z }] : []), ...stack];
    order.forEach((c) => { c.g.style.display = ""; coinAt(c.g, 0, c.y, c.z); parts.stack.appendChild(c.g); });
    parts.fl.setAttribute("transform", translateAlong(P, [-3 * fingers, 0, 0]));
    parts.fr.setAttribute("transform", translateAlong(P, [3 * fingers, 0, 0]));
    // requests: rebuild, place in the layer in front of or behind the front-left post, sort by depth
    const items = [];
    for (const r of reqs) {
      if (!r.g) r.g = document.createElementNS(NS, "g");
      const html = requestSvg(r);
      if (html !== r.html) { r.g.innerHTML = html; r.html = html; }
      const behind = (r.state === "queue" || r.state === "grant") && r.x < -0.5 && r.y < 21;
      items.push({ g: r.g, layer: behind ? parts.r1 : parts.r2, key: r.x + r.y + (r.state === "tray" ? 10 : 0) });
    }
    kicker.innerHTML = kickY > KICK.rest + 0.05 || true
      ? solidSvg(slabOf({ x: -1.5, y: 4, w: 3, d: Math.max(0.2, kickY - 2.5 - 4), r: 0.6 }, 8, 2.6, P, 2, 0.2), { tone: "mid", crease: "none" }) +
        solidSvg(slabOf({ x: -7, y: kickY - 2.5, w: 14, d: 2.5, r: 0.5 }, KICK.z, KICK.h, P, 2, 0.3), { tone: "mid" })
      : "";
    items.push({ g: kicker, layer: parts.r2, key: kickY - 1 });
    gate.setAttribute("transform", translateAlong(P, [0, 0, gateZ]));
    items.push({ g: gate, layer: parts.r2, key: GATE_X + 20 });
    items.sort((a, b) => a.key - b.key).forEach((it) => { if (it.g.parentNode !== it.layer || it.layer.lastChild !== it.g) it.layer.appendChild(it.g); });
    // dials and lamps
    const angle = -Math.PI * 0.75 + (rateIndex / (K.RATES.length - 1)) * Math.PI * 1.5;
    pointerAngle = pointerAngle === null ? angle : pointerAngle + (angle - pointerAngle) * 0.25;
    const [cx, cy, cz] = KNOB;
    parts.pointer.setAttribute("d", lineOnTop([cx + Math.sin(pointerAngle) * 0.8, cy - Math.cos(pointerAngle) * 0.8], [cx + Math.sin(pointerAngle) * 2.7, cy - Math.cos(pointerAngle) * 2.7], cz, P));
    if (model.tokens < C - 1e-9) parts.run.setAttribute("data-on", ""); else parts.run.removeAttribute("data-on");
    if (clock < ledUntil) parts.led.setAttribute("data-on", ""); else parts.led.removeAttribute("data-on");
    const text = model.tokens.toFixed(1) + " / " + C + " tokens · +" + K.RATES[rateIndex] + "/s · " + model.passed + " ok · " + model.rejected + " × 429";
    if (readout.textContent !== text) readout.textContent = text;
  }

  function tick(now) {
    const speed = window.__driveSpeed || 1;
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) * speed : 1 / 60;
    last = now;
    const s = step(dt);
    draw(s);
    frame = visible ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
  const describe = () => stage.setAttribute("aria-valuetext", "refill " + K.RATES[rateIndex] + " tokens per second, bucket holds " + C);
  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
  stage.addEventListener("click", () => { lastUser = clock; burst(); run(); });
  stage.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Enter") { event.preventDefault(); lastUser = clock; burst(); }
    else if (event.key === "ArrowUp" || event.key === "ArrowRight") { event.preventDefault(); rateIndex = Math.min(K.RATES.length - 1, rateIndex + 1); describe(); }
    else if (event.key === "ArrowDown" || event.key === "ArrowLeft") { event.preventDefault(); rateIndex = Math.max(0, rateIndex - 1); describe(); }
    else if (event.key === "Home") { event.preventDefault(); rateIndex = 0; describe(); }
    else if (event.key === "End") { event.preventDefault(); rateIndex = K.RATES.length - 1; describe(); }
    else return;
    stage.setAttribute("aria-valuenow", String(K.RATES[rateIndex]));
    run();
  });
  describe();
  draw(step(0));
  window.__rl = { model, get reqs() { return reqs; }, burst, setRate: (i) => { rateIndex = i; } };
}

const body = k.plateHtml({
  fig: "Fig 1",
  title: "Token-bucket rate limiter",
  hint: "Click for a burst of 12 · ↑↓ refill rate",
  readout: `${M.CAPACITY.toFixed(1)} / ${M.CAPACITY} tokens · +${M.RATES[M.RATE_INDEX]}/s · 0 ok · 0 × 429`,
  keys: [
    { mark: "lit", label: "Tokens: the coins in the cage, at most six" },
    { mark: "raised", label: "Requests on the conveyor" },
  ],
  caption:
    "A gateway rate limiter as a token bucket. The pusher feeds coins at the refill rate (its travel along the track is the fraction of the next token), and the cage holds at most six, so a quiet client saves up a burst of six. Every request needs one coin to pass the gate; when the cage is empty the gate stays down and the request is turned away with 429 Too Many Requests. Click to send 12 at once: six pass on the saved coins, a few more on the coins that arrive meanwhile, and the rest are refused.",
  body: `<div class="rl-stage iso-stage" tabindex="0" role="slider" aria-label="Token-bucket rate limiter. Click, Space or Enter sends a burst of 12 requests; arrow keys change the refill rate." aria-valuemin="${M.RATES[0]}" aria-valuemax="${M.RATES[M.RATES.length - 1]}" aria-valuenow="${M.RATES[M.RATE_INDEX]}">${svg}</div>`,
});

const file = theme === "light" ? "rate-limiter-light.html" : "rate-limiter.html";
writeFileSync(join(HERE, file), k.pageHtml({ title: "Token-bucket rate limiter", theme, body: css + body, script: kitScript() + live }));
console.log("wrote", file);
