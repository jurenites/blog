// Generated from SMEP source. Rebuild with scripts/build-drupal-periodic.mjs.
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
};

// web-poc/environment.js
var init_environment = __esm({
  "web-poc/environment.js"() {
  }
});

// web-poc/nucleus-model.js
function modelCounts(element) {
  let protons = element.number, massNumber = Math.max(protons, Math.round(element.mass));
  return { protons, neutrons: massNumber - protons, massNumber };
}
function createNucleus(element, { buildBonds = !0 } = {}) {
  let counts = modelCounts(element), seed = element.number * 12347, random = () => (seed = Math.imul(seed, 1664525) + 1013904223 >>> 0, seed / 4294967296), sites = [], spacing = 6.25 / Math.SQRT2;
  for (let x = -8; x <= 8; x++) for (let y = -8; y <= 8; y++) for (let z = -8; z <= 8; z++)
    (x + y + z) % 2 === 0 && sites.push({ x: x * spacing, y: y * spacing, z: z * spacing, rank: x * x + y * y + z * z + random() * 0.05 });
  sites.sort((a, b) => a.rank - b.rank);
  let kinds = Array.from({ length: counts.massNumber }, (_, i) => i < counts.protons ? "proton" : "neutron");
  for (let i = kinds.length - 1; i > 0; i--) {
    let j = Math.floor(random() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  let particles = sites.slice(0, counts.massNumber).map((p, i) => ({
    x: p.x,
    y: p.y,
    z: p.z,
    vx: 0,
    vy: 0,
    vz: 0,
    kind: kinds[i],
    phase: random() * Math.PI * 2
  }));
  recenter(particles);
  let bonds = [];
  if (buildBonds) for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
    let a = particles[i], b = particles[j];
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 6.5 && bonds.push([i, j]);
  }
  return { particles, bonds, counts, time: 0 };
}
function recenter(particles) {
  let center = [0, 0, 0], velocity = [0, 0, 0];
  for (let p of particles)
    center[0] += p.x, center[1] += p.y, center[2] += p.z, velocity[0] += p.vx, velocity[1] += p.vy, velocity[2] += p.vz;
  for (let p of particles)
    p.x -= center[0] / particles.length, p.y -= center[1] / particles.length, p.z -= center[2] / particles.length, p.vx -= velocity[0] / particles.length, p.vy -= velocity[1] / particles.length, p.vz -= velocity[2] / particles.length;
}
function projectNucleus(model) {
  let yaw = 0.6 + Math.sin(model.time * 0.43) * 0.13, pitch = -0.35 + Math.sin(model.time * 0.37) * 0.1, cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch);
  return model.particles.map((p) => {
    let x = p.x * cy + p.z * sy, z = p.z * cy - p.x * sy;
    return { x: 30.5 + x, y: 30.5 + p.y * cx - z * sx, z: p.y * sx + z * cx, kind: p.kind };
  }).sort((a, b) => a.z - b.z);
}
var init_nucleus_model = __esm({
  "web-poc/nucleus-model.js"() {
  }
});

// web-poc/roundabout-typography.js
function roundaboutCompactCapitals(text) {
  return text.replace(/[A-Z]/g, (letter) => glyphs[letter]);
}
var capitals, alternateCapitals, glyphs, init_roundabout_typography = __esm({
  "web-poc/roundabout-typography.js"() {
    capitals = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", alternateCapitals = "\u0100\u0181\u0106\u010E\u0112\u0191\u011C\u0124\u012A\u0134\u0136\u0139\u019C\u0147\u01D1\u01A4\u01EA\u01A6\u015A\u0162\u0168\u0474\u0174\u0425\u0176\u0179", glyphs = Object.fromEntries([...capitals].map((letter, index) => [letter, [...alternateCapitals][index]]));
  }
});

// web-poc/radioactivity.js
function isRadioactiveElement(atomicNumber) {
  return atomicNumber === 43 || atomicNumber === 61 || atomicNumber >= 83 && atomicNumber <= 118;
}
var init_radioactivity = __esm({
  "web-poc/radioactivity.js"() {
  }
});

// web-poc/components/element-card.js
function createElementCard(element, { featured = !1, interactive = !0, active = !1, discovered = !0, mode = "normal" } = {}) {
  let card2 = document.createElement(interactive ? "button" : "div"), { number, symbol, name, mass } = element, { protons, neutrons } = modelCounts(element), massNumber = protons + neutrons;
  return card2.className = `element-card${featured ? " featured" : ""}`, card2.dataset.number = number, interactive && (card2.type = "button"), updateElementCardState(card2, element, { active, discovered, mode }), card2.innerHTML = `${isRadioactiveElement(number) ? '<span class="radioactive-glow" aria-hidden="true"></span>' : ""}<span class="card-content"><span class="corner top-left" title="Atomic mass: ${escapeHTML(mass)} u; sample mass number: ${escapeHTML(massNumber)} (${escapeHTML(protons)} protons + ${escapeHTML(neutrons)} neutrons)"><small>u</small><span class="mass-average">${escapeHTML(mass)}</span><span class="mass-number">${escapeHTML(massNumber)}</span></span><span class="corner top-right" hidden><small>Z</small>${escapeHTML(number)}</span><span class="electron-cloud" aria-hidden="true"></span><canvas class="particle" aria-hidden="true"></canvas><span class="element-symbol">${escapeHTML(symbol)}</span><span class="element-name">${escapeHTML(name)}</span><span class="corner bottom-left"><small>p\u207A</small>${escapeHTML(number)}</span><span class="corner bottom-right" title="Neutrons in preview"><small>n\u2070</small>${escapeHTML(neutrons)}</span><span class="compact-name" aria-hidden="true">${escapeHTML(roundaboutCompactCapitals(symbol))}</span></span>`, card2;
}
function updateElementCardState(card2, element, { active = !1, discovered = !0, mode = "normal" } = {}) {
  let { number, symbol, name, mass } = element, { neutrons, massNumber } = modelCounts(element), undiscovered = mode === "micro" && !discovered, radioactive = isRadioactiveElement(number), action = card2.tagName === "BUTTON" ? mode === "micro" ? " Select element." : " Open details." : "";
  card2.dataset.active = String(active), card2.dataset.discovered = String(discovered), card2.dataset.radioactive = String(radioactive), card2.title = `${name}${undiscovered ? " \xB7 Undiscovered (preview)" : ""}`, card2.setAttribute("aria-label", `${name}, ${symbol}. Atomic number ${number}, mass ${mass} u, ${number} protons, ${neutrons} neutrons in preview, sample mass number ${massNumber}.${radioactive ? " Radioactive element." : ""}${action}${undiscovered ? " Undiscovered (preview)." : ""}`);
}
var escapeHTML, init_element_card = __esm({
  "web-poc/components/element-card.js"() {
    init_nucleus_model();
    init_roundabout_typography();
    init_radioactivity();
    escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }
});

// web-poc/elements-data.js
var elements, init_elements_data = __esm({
  "web-poc/elements-data.js"() {
    elements = [
      {
        number: 1,
        symbol: "H",
        name: "Hydrogen",
        category: "nonmetal",
        period: 1,
        column: 1,
        mass: 1.008
      },
      {
        number: 2,
        symbol: "He",
        name: "Helium",
        category: "noble-gas",
        period: 1,
        column: 18,
        mass: 4.003
      },
      {
        number: 3,
        symbol: "Li",
        name: "Lithium",
        category: "alkali-metal",
        period: 2,
        column: 1,
        mass: 6.941
      },
      {
        number: 4,
        symbol: "Be",
        name: "Beryllium",
        category: "alkaline-earth",
        period: 2,
        column: 2,
        mass: 9.012
      },
      {
        number: 5,
        symbol: "B",
        name: "Boron",
        category: "metalloid",
        period: 2,
        column: 13,
        mass: 10.811
      },
      {
        number: 6,
        symbol: "C",
        name: "Carbon",
        category: "nonmetal",
        period: 2,
        column: 14,
        mass: 12.011
      },
      {
        number: 7,
        symbol: "N",
        name: "Nitrogen",
        category: "nonmetal",
        period: 2,
        column: 15,
        mass: 14.007
      },
      {
        number: 8,
        symbol: "O",
        name: "Oxygen",
        category: "nonmetal",
        period: 2,
        column: 16,
        mass: 15.999
      },
      {
        number: 9,
        symbol: "F",
        name: "Fluorine",
        category: "nonmetal",
        period: 2,
        column: 17,
        mass: 18.998
      },
      {
        number: 10,
        symbol: "Ne",
        name: "Neon",
        category: "noble-gas",
        period: 2,
        column: 18,
        mass: 20.18
      },
      {
        number: 11,
        symbol: "Na",
        name: "Sodium",
        category: "alkali-metal",
        period: 3,
        column: 1,
        mass: 22.99
      },
      {
        number: 12,
        symbol: "Mg",
        name: "Magnesium",
        category: "alkaline-earth",
        period: 3,
        column: 2,
        mass: 24.305
      },
      {
        number: 13,
        symbol: "Al",
        name: "Aluminum",
        category: "post-transition-metal",
        period: 3,
        column: 13,
        mass: 26.982
      },
      {
        number: 14,
        symbol: "Si",
        name: "Silicon",
        category: "metalloid",
        period: 3,
        column: 14,
        mass: 28.086
      },
      {
        number: 15,
        symbol: "P",
        name: "Phosphorus",
        category: "nonmetal",
        period: 3,
        column: 15,
        mass: 30.974
      },
      {
        number: 16,
        symbol: "S",
        name: "Sulfur",
        category: "nonmetal",
        period: 3,
        column: 16,
        mass: 32.065
      },
      {
        number: 17,
        symbol: "Cl",
        name: "Chlorine",
        category: "nonmetal",
        period: 3,
        column: 17,
        mass: 35.453
      },
      {
        number: 18,
        symbol: "Ar",
        name: "Argon",
        category: "noble-gas",
        period: 3,
        column: 18,
        mass: 39.948
      },
      {
        number: 19,
        symbol: "K",
        name: "Potassium",
        category: "alkali-metal",
        period: 4,
        column: 1,
        mass: 39.098
      },
      {
        number: 20,
        symbol: "Ca",
        name: "Calcium",
        category: "alkaline-earth",
        period: 4,
        column: 2,
        mass: 40.078
      },
      {
        number: 21,
        symbol: "Sc",
        name: "Scandium",
        category: "transition-metal",
        period: 4,
        column: 3,
        mass: 44.956
      },
      {
        number: 22,
        symbol: "Ti",
        name: "Titanium",
        category: "transition-metal",
        period: 4,
        column: 4,
        mass: 47.867
      },
      {
        number: 23,
        symbol: "V",
        name: "Vanadium",
        category: "transition-metal",
        period: 4,
        column: 5,
        mass: 50.942
      },
      {
        number: 24,
        symbol: "Cr",
        name: "Chromium",
        category: "transition-metal",
        period: 4,
        column: 6,
        mass: 51.996
      },
      {
        number: 25,
        symbol: "Mn",
        name: "Manganese",
        category: "transition-metal",
        period: 4,
        column: 7,
        mass: 54.938
      },
      {
        number: 26,
        symbol: "Fe",
        name: "Iron",
        category: "transition-metal",
        period: 4,
        column: 8,
        mass: 55.845
      },
      {
        number: 27,
        symbol: "Co",
        name: "Cobalt",
        category: "transition-metal",
        period: 4,
        column: 9,
        mass: 58.933
      },
      {
        number: 28,
        symbol: "Ni",
        name: "Nickel",
        category: "transition-metal",
        period: 4,
        column: 10,
        mass: 58.693
      },
      {
        number: 29,
        symbol: "Cu",
        name: "Copper",
        category: "transition-metal",
        period: 4,
        column: 11,
        mass: 63.546
      },
      {
        number: 30,
        symbol: "Zn",
        name: "Zinc",
        category: "transition-metal",
        period: 4,
        column: 12,
        mass: 65.38
      },
      {
        number: 31,
        symbol: "Ga",
        name: "Gallium",
        category: "post-transition-metal",
        period: 4,
        column: 13,
        mass: 69.723
      },
      {
        number: 32,
        symbol: "Ge",
        name: "Germanium",
        category: "metalloid",
        period: 4,
        column: 14,
        mass: 72.64
      },
      {
        number: 33,
        symbol: "As",
        name: "Arsenic",
        category: "metalloid",
        period: 4,
        column: 15,
        mass: 74.922
      },
      {
        number: 34,
        symbol: "Se",
        name: "Selenium",
        category: "nonmetal",
        period: 4,
        column: 16,
        mass: 78.96
      },
      {
        number: 35,
        symbol: "Br",
        name: "Bromine",
        category: "nonmetal",
        period: 4,
        column: 17,
        mass: 79.904
      },
      {
        number: 36,
        symbol: "Kr",
        name: "Krypton",
        category: "noble-gas",
        period: 4,
        column: 18,
        mass: 83.798
      },
      {
        number: 37,
        symbol: "Rb",
        name: "Rubidium",
        category: "alkali-metal",
        period: 5,
        column: 1,
        mass: 85.468
      },
      {
        number: 38,
        symbol: "Sr",
        name: "Strontium",
        category: "alkaline-earth",
        period: 5,
        column: 2,
        mass: 87.62
      },
      {
        number: 39,
        symbol: "Y",
        name: "Yttrium",
        category: "transition-metal",
        period: 5,
        column: 3,
        mass: 88.906
      },
      {
        number: 40,
        symbol: "Zr",
        name: "Zirconium",
        category: "transition-metal",
        period: 5,
        column: 4,
        mass: 91.224
      },
      {
        number: 41,
        symbol: "Nb",
        name: "Niobium",
        category: "transition-metal",
        period: 5,
        column: 5,
        mass: 92.906
      },
      {
        number: 42,
        symbol: "Mo",
        name: "Molybdenum",
        category: "transition-metal",
        period: 5,
        column: 6,
        mass: 95.96
      },
      {
        number: 43,
        symbol: "Tc",
        name: "Technetium",
        category: "transition-metal",
        period: 5,
        column: 7,
        mass: 98
      },
      {
        number: 44,
        symbol: "Ru",
        name: "Ruthenium",
        category: "transition-metal",
        period: 5,
        column: 8,
        mass: 101.07
      },
      {
        number: 45,
        symbol: "Rh",
        name: "Rhodium",
        category: "transition-metal",
        period: 5,
        column: 9,
        mass: 102.906
      },
      {
        number: 46,
        symbol: "Pd",
        name: "Palladium",
        category: "transition-metal",
        period: 5,
        column: 10,
        mass: 106.42
      },
      {
        number: 47,
        symbol: "Ag",
        name: "Silver",
        category: "transition-metal",
        period: 5,
        column: 11,
        mass: 107.868
      },
      {
        number: 48,
        symbol: "Cd",
        name: "Cadmium",
        category: "transition-metal",
        period: 5,
        column: 12,
        mass: 112.411
      },
      {
        number: 49,
        symbol: "In",
        name: "Indium",
        category: "post-transition-metal",
        period: 5,
        column: 13,
        mass: 114.818
      },
      {
        number: 50,
        symbol: "Sn",
        name: "Tin",
        category: "post-transition-metal",
        period: 5,
        column: 14,
        mass: 118.71
      },
      {
        number: 51,
        symbol: "Sb",
        name: "Antimony",
        category: "metalloid",
        period: 5,
        column: 15,
        mass: 121.76
      },
      {
        number: 52,
        symbol: "Te",
        name: "Tellurium",
        category: "metalloid",
        period: 5,
        column: 16,
        mass: 127.6
      },
      {
        number: 53,
        symbol: "I",
        name: "Iodine",
        category: "nonmetal",
        period: 5,
        column: 17,
        mass: 126.904
      },
      {
        number: 54,
        symbol: "Xe",
        name: "Xenon",
        category: "noble-gas",
        period: 5,
        column: 18,
        mass: 131.293
      },
      {
        number: 55,
        symbol: "Cs",
        name: "Cesium",
        category: "alkali-metal",
        period: 6,
        column: 1,
        mass: 132.905
      },
      {
        number: 56,
        symbol: "Ba",
        name: "Barium",
        category: "alkaline-earth",
        period: 6,
        column: 2,
        mass: 137.327
      },
      {
        number: 57,
        symbol: "La",
        name: "Lanthanum",
        category: "lanthanide",
        period: 6,
        column: 3,
        mass: 138.905
      },
      {
        number: 58,
        symbol: "Ce",
        name: "Cerium",
        category: "lanthanide",
        period: 6,
        column: 3,
        mass: 140.116
      },
      {
        number: 59,
        symbol: "Pr",
        name: "Praseodymium",
        category: "lanthanide",
        period: 6,
        column: 4,
        mass: 140.908
      },
      {
        number: 60,
        symbol: "Nd",
        name: "Neodymium",
        category: "lanthanide",
        period: 6,
        column: 5,
        mass: 144.242
      },
      {
        number: 61,
        symbol: "Pm",
        name: "Promethium",
        category: "lanthanide",
        period: 6,
        column: 6,
        mass: 145
      },
      {
        number: 62,
        symbol: "Sm",
        name: "Samarium",
        category: "lanthanide",
        period: 6,
        column: 7,
        mass: 150.36
      },
      {
        number: 63,
        symbol: "Eu",
        name: "Europium",
        category: "lanthanide",
        period: 6,
        column: 8,
        mass: 151.964
      },
      {
        number: 64,
        symbol: "Gd",
        name: "Gadolinium",
        category: "lanthanide",
        period: 6,
        column: 9,
        mass: 157.25
      },
      {
        number: 65,
        symbol: "Tb",
        name: "Terbium",
        category: "lanthanide",
        period: 6,
        column: 10,
        mass: 158.925
      },
      {
        number: 66,
        symbol: "Dy",
        name: "Dysprosium",
        category: "lanthanide",
        period: 6,
        column: 11,
        mass: 162.5
      },
      {
        number: 67,
        symbol: "Ho",
        name: "Holmium",
        category: "lanthanide",
        period: 6,
        column: 12,
        mass: 164.93
      },
      {
        number: 68,
        symbol: "Er",
        name: "Erbium",
        category: "lanthanide",
        period: 6,
        column: 13,
        mass: 167.259
      },
      {
        number: 69,
        symbol: "Tm",
        name: "Thulium",
        category: "lanthanide",
        period: 6,
        column: 14,
        mass: 168.934
      },
      {
        number: 70,
        symbol: "Yb",
        name: "Ytterbium",
        category: "lanthanide",
        period: 6,
        column: 15,
        mass: 173.054
      },
      {
        number: 71,
        symbol: "Lu",
        name: "Lutetium",
        category: "lanthanide",
        period: 6,
        column: 16,
        mass: 174.967
      },
      {
        number: 72,
        symbol: "Hf",
        name: "Hafnium",
        category: "transition-metal",
        period: 6,
        column: 4,
        mass: 178.49
      },
      {
        number: 73,
        symbol: "Ta",
        name: "Tantalum",
        category: "transition-metal",
        period: 6,
        column: 5,
        mass: 180.948
      },
      {
        number: 74,
        symbol: "W",
        name: "Tungsten",
        category: "transition-metal",
        period: 6,
        column: 6,
        mass: 183.84
      },
      {
        number: 75,
        symbol: "Re",
        name: "Rhenium",
        category: "transition-metal",
        period: 6,
        column: 7,
        mass: 186.207
      },
      {
        number: 76,
        symbol: "Os",
        name: "Osmium",
        category: "transition-metal",
        period: 6,
        column: 8,
        mass: 190.23
      },
      {
        number: 77,
        symbol: "Ir",
        name: "Iridium",
        category: "transition-metal",
        period: 6,
        column: 9,
        mass: 192.217
      },
      {
        number: 78,
        symbol: "Pt",
        name: "Platinum",
        category: "transition-metal",
        period: 6,
        column: 10,
        mass: 195.084
      },
      {
        number: 79,
        symbol: "Au",
        name: "Gold",
        category: "transition-metal",
        period: 6,
        column: 11,
        mass: 196.967
      },
      {
        number: 80,
        symbol: "Hg",
        name: "Mercury",
        category: "transition-metal",
        period: 6,
        column: 12,
        mass: 200.59
      },
      {
        number: 81,
        symbol: "Tl",
        name: "Thallium",
        category: "post-transition-metal",
        period: 6,
        column: 13,
        mass: 204.383
      },
      {
        number: 82,
        symbol: "Pb",
        name: "Lead",
        category: "post-transition-metal",
        period: 6,
        column: 14,
        mass: 207.2
      },
      {
        number: 83,
        symbol: "Bi",
        name: "Bismuth",
        category: "post-transition-metal",
        period: 6,
        column: 15,
        mass: 208.98
      },
      {
        number: 84,
        symbol: "Po",
        name: "Polonium",
        category: "metalloid",
        period: 6,
        column: 16,
        mass: 209
      },
      {
        number: 85,
        symbol: "At",
        name: "Astatine",
        category: "metalloid",
        period: 6,
        column: 17,
        mass: 210
      },
      {
        number: 86,
        symbol: "Rn",
        name: "Radon",
        category: "noble-gas",
        period: 6,
        column: 18,
        mass: 222
      },
      {
        number: 87,
        symbol: "Fr",
        name: "Francium",
        category: "alkali-metal",
        period: 7,
        column: 1,
        mass: 223
      },
      {
        number: 88,
        symbol: "Ra",
        name: "Radium",
        category: "alkaline-earth",
        period: 7,
        column: 2,
        mass: 226
      },
      {
        number: 89,
        symbol: "Ac",
        name: "Actinium",
        category: "actinide",
        period: 7,
        column: 3,
        mass: 227
      },
      {
        number: 90,
        symbol: "Th",
        name: "Thorium",
        category: "actinide",
        period: 7,
        column: 3,
        mass: 232.038
      },
      {
        number: 91,
        symbol: "Pa",
        name: "Protactinium",
        category: "actinide",
        period: 7,
        column: 4,
        mass: 231.036
      },
      {
        number: 92,
        symbol: "U",
        name: "Uranium",
        category: "actinide",
        period: 7,
        column: 5,
        mass: 238.029
      },
      {
        number: 93,
        symbol: "Np",
        name: "Neptunium",
        category: "actinide",
        period: 7,
        column: 6,
        mass: 237
      },
      {
        number: 94,
        symbol: "Pu",
        name: "Plutonium",
        category: "actinide",
        period: 7,
        column: 7,
        mass: 244
      },
      {
        number: 95,
        symbol: "Am",
        name: "Americium",
        category: "actinide",
        period: 7,
        column: 8,
        mass: 243
      },
      {
        number: 96,
        symbol: "Cm",
        name: "Curium",
        category: "actinide",
        period: 7,
        column: 9,
        mass: 247
      },
      {
        number: 97,
        symbol: "Bk",
        name: "Berkelium",
        category: "actinide",
        period: 7,
        column: 10,
        mass: 247
      },
      {
        number: 98,
        symbol: "Cf",
        name: "Californium",
        category: "actinide",
        period: 7,
        column: 11,
        mass: 251
      },
      {
        number: 99,
        symbol: "Es",
        name: "Einsteinium",
        category: "actinide",
        period: 7,
        column: 12,
        mass: 252
      },
      {
        number: 100,
        symbol: "Fm",
        name: "Fermium",
        category: "actinide",
        period: 7,
        column: 13,
        mass: 257
      },
      {
        number: 101,
        symbol: "Md",
        name: "Mendelevium",
        category: "actinide",
        period: 7,
        column: 14,
        mass: 258
      },
      {
        number: 102,
        symbol: "No",
        name: "Nobelium",
        category: "actinide",
        period: 7,
        column: 15,
        mass: 259
      },
      {
        number: 103,
        symbol: "Lr",
        name: "Lawrencium",
        category: "actinide",
        period: 7,
        column: 16,
        mass: 262
      },
      {
        number: 104,
        symbol: "Rf",
        name: "Rutherfordium",
        category: "transition-metal",
        period: 7,
        column: 4,
        mass: 267
      },
      {
        number: 105,
        symbol: "Db",
        name: "Dubnium",
        category: "transition-metal",
        period: 7,
        column: 5,
        mass: 268
      },
      {
        number: 106,
        symbol: "Sg",
        name: "Seaborgium",
        category: "transition-metal",
        period: 7,
        column: 6,
        mass: 271
      },
      {
        number: 107,
        symbol: "Bh",
        name: "Bohrium",
        category: "transition-metal",
        period: 7,
        column: 7,
        mass: 272
      },
      {
        number: 108,
        symbol: "Hs",
        name: "Hassium",
        category: "transition-metal",
        period: 7,
        column: 8,
        mass: 270
      },
      {
        number: 109,
        symbol: "Mt",
        name: "Meitnerium",
        category: "transition-metal",
        period: 7,
        column: 9,
        mass: 276
      },
      {
        number: 110,
        symbol: "Ds",
        name: "Darmstadtium",
        category: "transition-metal",
        period: 7,
        column: 10,
        mass: 281
      },
      {
        number: 111,
        symbol: "Rg",
        name: "Roentgenium",
        category: "transition-metal",
        period: 7,
        column: 11,
        mass: 280
      },
      {
        number: 112,
        symbol: "Cn",
        name: "Copernicium",
        category: "transition-metal",
        period: 7,
        column: 12,
        mass: 285
      },
      {
        number: 113,
        symbol: "Nh",
        name: "Nihonium",
        category: "post-transition-metal",
        period: 7,
        column: 13,
        mass: 284
      },
      {
        number: 114,
        symbol: "Fl",
        name: "Flerovium",
        category: "post-transition-metal",
        period: 7,
        column: 14,
        mass: 289
      },
      {
        number: 115,
        symbol: "Mc",
        name: "Moscovium",
        category: "post-transition-metal",
        period: 7,
        column: 15,
        mass: 288
      },
      {
        number: 116,
        symbol: "Lv",
        name: "Livermorium",
        category: "post-transition-metal",
        period: 7,
        column: 16,
        mass: 293
      },
      {
        number: 117,
        symbol: "Ts",
        name: "Tennessine",
        category: "metalloid",
        period: 7,
        column: 17,
        mass: 294
      },
      {
        number: 118,
        symbol: "Og",
        name: "Oganesson",
        category: "noble-gas",
        period: 7,
        column: 18,
        mass: 294
      }
    ];
  }
});

// web-poc/element-deck.js
function createElementDeck({ dialog: dialog2, elements: elements2, nuclei: nuclei2, select, sourceCard }) {
  let host = dialog2.querySelector("#detail-card"), table, tableOpacity = "", previous = dialog2.querySelector("#previous-element"), next = dialog2.querySelector("#next-element"), reduced = matchMedia("(prefers-reduced-motion: reduce)"), parts = [".element-name", ".top-left", ".bottom-left", ".bottom-right", ".element-symbol", ".particle", ".electron-cloud"], current, face, origin, busy = !1, pendingClose = !1, pendingJump = null, drag, timing = (duration) => ({ duration: reduced.matches ? 0 : duration, easing: "cubic-bezier(.22,1,.36,1)" }), settle = (animations) => Promise.all(animations.map((animation) => animation.finished.catch(() => {
  })));
  function measure(card2) {
    let box = card2.getBoundingClientRect(), compact = card2.closest('[data-card-mode="small"]');
    return { box, parts: Object.fromEntries(parts.map((selector) => {
      let node = card2.querySelector(compact && selector === ".element-symbol" ? ".compact-name" : selector);
      return [selector, { box: node.getBoundingClientRect(), visible: getComputedStyle(node).visibility !== "hidden" }];
    })) };
  }
  function miniature(element) {
    let map2 = document.createElement("div");
    map2.className = "deck-periodic-map", map2.setAttribute("role", "group"), map2.setAttribute("aria-label", "Jump to element");
    for (let item of elements2) {
      let dot = document.createElement("button");
      dot.type = "button", dot.className = "deck-map-cell", dot.title = `${item.name} (${item.symbol})`, dot.setAttribute("aria-label", `${item.name} (${item.symbol}), ${item.number}`), dot.addEventListener("pointerenter", (event) => {
        event.pointerType !== "touch" && jump(item);
      }), dot.addEventListener("click", () => jump(item));
      let row = item.period, column = item.column;
      item.number >= 57 && item.number <= 71 && (row = 9, column = item.number - 54), item.number >= 89 && item.number <= 103 && (row = 10, column = item.number - 86), dot.style.gridArea = `${row} / ${column}`, dot.dataset.number = String(item.number), dot.dataset.active = String(item.number === element.number), map2.append(dot);
    }
    return map2;
  }
  let footer = document.createElement("div");
  footer.className = "deck-footer";
  let map = miniature(elements2[0]);
  footer.append(map);
  function captureTable() {
    return elements2.map((element) => {
      let source = sourceCard(element), box = source.getBoundingClientRect(), ghost = source.cloneNode(!0);
      ghost.removeAttribute("id"), ghost.removeAttribute("aria-label"), ghost.removeAttribute("title"), ghost.removeAttribute("hidden"), ghost.tabIndex = -1, ghost.classList.remove("dimmed"), ghost.classList.add("deck-table-tile"), ghost.style.cssText = `left:${box.x}px;top:${box.y}px;width:${box.width}px;height:${box.height}px;`;
      let canvas = ghost.querySelector("canvas");
      return canvas && canvas.getContext("2d").drawImage(source.querySelector("canvas"), 0, 0), ghost.querySelector(".radioactive-glow")?.remove(), { number: element.number, ghost, box };
    });
  }
  async function morphTable(snapshot, closing = !1) {
    if (reduced.matches) {
      dialog2.dataset.tableTransition = "idle";
      return;
    }
    let targets = new Map([...map.children].map((dot) => [Number(dot.dataset.number), dot.getBoundingClientRect()])), layer = document.createElement("div");
    layer.className = "element-grid deck-table-flight", layer.dataset.cardMode = table.dataset.cardMode, layer.setAttribute("aria-hidden", "true"), layer.inert = !0, layer.append(...snapshot.map((item) => item.ghost)), dialog2.append(layer), map.style.visibility = "hidden", dialog2.dataset.tableTransition = closing ? "closing" : "opening";
    let animations = [];
    for (let { number, ghost, box } of snapshot) {
      let target = targets.get(number), width = box.width || target.width, height = box.height || target.height;
      ghost.style.width = `${width}px`, ghost.style.height = `${height}px`, ghost.style.setProperty("--card-width", `${width}px`), ghost.style.setProperty("--card-height", `${height}px`);
      let color = number === current.number ? "#FFFFFF" : "#4A4A4A", frames = [
        { transform: "translate(0,0) scale(1,1)", backgroundColor: "transparent" },
        { transform: `translate(${target.x - box.x}px,${target.y - box.y}px) scale(${target.width / width},${target.height / height})`, backgroundColor: color }
      ];
      animations.push(ghost.animate(closing ? frames.reverse() : frames, { ...timing(680), fill: "both" }));
      let artwork = ghost.querySelector(".card-content");
      animations.push(artwork.animate(closing ? [{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0, offset: 0.45 }, { opacity: 0 }], { ...timing(680), fill: "both" }));
    }
    await settle(animations), map.style.visibility = "", layer.remove(), animations.forEach((animation) => animation.cancel()), dialog2.dataset.tableTransition = "idle";
  }
  function makeFace(element) {
    let node = createElementCard(element, { featured: !0, interactive: !1, active: !0 });
    node.querySelector(".element-name").id = "detail-title";
    let { protons, neutrons } = modelCounts(element), mass = node.querySelector(".top-left");
    return mass.querySelector(".mass-average").remove(), mass.querySelector("small").remove(), mass.querySelector(".mass-number").textContent = String(protons + neutrons), mass.title = `Mass number: ${protons + neutrons} (${protons} protons + ${neutrons} neutrons)`, node.setAttribute("aria-label", `${element.name}, ${element.symbol}. Mass number ${protons + neutrons}, ${protons} protons and ${neutrons} neutrons.${node.dataset.radioactive === "true" ? " Radioactive element." : ""}`), host.append(node), footer.parentElement !== host && host.append(footer), nuclei2.attach(node.querySelector("canvas"), element, !0), node;
  }
  function selection(element) {
    current = element;
    for (let dot of map.children) {
      let active = Number(dot.dataset.number) === element.number;
      dot.dataset.active = String(active), dot.setAttribute("aria-pressed", String(active)), dot.tabIndex = active ? 0 : -1;
    }
    select(element), previous.disabled = element.number === 1, next.disabled = element.number === elements2.length, dialog2.querySelector(".deck-status").textContent = `${element.name}, card ${element.number} of ${elements2.length}`, dialog2.dataset.atStart = String(element.number === 1), dialog2.dataset.atEnd = String(element.number === elements2.length);
  }
  async function morph(from, to, closing = !1) {
    let a = closing ? to : from, b = closing ? from : to, animations = [face.animate([
      { transform: `translate(${a.box.x - to.box.x}px,${a.box.y - to.box.y}px)`, width: `${a.box.width}px`, height: `${a.box.height}px` },
      { transform: `translate(${b.box.x - to.box.x}px,${b.box.y - to.box.y}px)`, width: `${b.box.width}px`, height: `${b.box.height}px` }
    ], { ...timing(560), fill: "both" })];
    for (let selector of parts) {
      let node = face.querySelector(selector), keyframe = (state, outer) => ({
        left: `${state.box.x - outer.x}px`,
        top: `${state.box.y - outer.y}px`,
        width: `${state.box.width}px`,
        height: `${state.box.height}px`,
        transform: "none",
        opacity: state.visible ? 1 : 0
      });
      animations.push(node.animate([keyframe(a.parts[selector], a.box), keyframe(b.parts[selector], b.box)], { ...timing(560), fill: "both" }));
    }
    animations.push(footer.animate([{ opacity: closing ? 1 : 0 }, { opacity: closing ? 0 : 1 }], { ...timing(400), fill: "both" })), await settle(animations), animations.forEach((animation) => animation.cancel());
  }
  async function open(element, source) {
    if (busy || dialog2.open) return;
    busy = !0, pendingClose = !1, pendingJump = null, origin = source || sourceCard(element);
    let start = measure(origin);
    table = origin.closest(".element-grid"), tableOpacity = table.style.opacity;
    let tableStart = captureTable();
    selection(element), face = makeFace(element), dialog2.showModal(), document.documentElement.classList.add("deck-open"), table.style.opacity = "0", nuclei2.refresh();
    let expanded = measure(face);
    await Promise.all([morphTable(tableStart), morph(start, expanded)]), busy = !1, pendingClose ? close() : pendingJump && jump(pendingJump);
  }
  async function close() {
    if (!dialog2.open) return;
    if (busy) {
      pendingClose = !0;
      return;
    }
    pendingClose = !1, pendingJump = null, busy = !0;
    let destination = sourceCard(current);
    origin.style.opacity = "", destination.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    let target = measure(destination), tableEnd = captureTable(), expanded = measure(face);
    await Promise.all([morphTable(tableEnd, !0), morph(target, expanded, !0)]), table.style.opacity = tableOpacity, dialog2.close(), document.documentElement.classList.remove("deck-open"), nuclei2.detach(host), host.replaceChildren(), destination.focus({ preventScroll: !0 }), pendingClose = !1, busy = !1, nuclei2.refresh();
  }
  async function move(direction) {
    let element = elements2[current.number - 1 + direction];
    if (busy || !element) return;
    busy = !0;
    let old = face, offset = host.clientWidth * 0.85, start = old.style.transform || "translateX(0)";
    old.style.transform = "", old.querySelector(".element-name").removeAttribute("id"), old.setAttribute("aria-hidden", "true"), old.inert = !0, selection(element), face = makeFace(element), nuclei2.refresh();
    let animations = [
      old.animate([{ transform: start, opacity: 1 }, { transform: `translateX(${-direction * offset}px) rotate(${-direction * 3}deg)`, opacity: 0 }], { ...timing(420), fill: "both" }),
      face.animate([{ transform: `translateX(${direction * offset}px) rotate(${direction * 3}deg)`, opacity: 0 }, { transform: "none", opacity: 1 }], timing(480))
    ];
    await settle(animations), nuclei2.detach(old), old.remove(), animations.forEach((animation) => animation.cancel()), busy = !1, pendingClose ? close() : pendingJump && jump(pendingJump);
  }
  function jump(element) {
    if (dialog2.open) {
      if (busy) {
        pendingJump = element;
        return;
      }
      pendingJump = null, element.number !== current.number && (nuclei2.detach(face), face.remove(), selection(element), face = makeFace(element), nuclei2.refresh());
    }
  }
  map.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault(), event.stopPropagation();
    let index = Number(event.target.dataset.number) - 1;
    if (index < 0 || !Number.isFinite(index)) return;
    let step = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1, target = event.key === "Home" ? 0 : event.key === "End" ? elements2.length - 1 : Math.max(0, Math.min(elements2.length - 1, index + step));
    map.children[target].focus({ preventScroll: !0 }), jump(elements2[target]);
  }), previous.addEventListener("click", () => move(-1)), next.addEventListener("click", () => move(1)), dialog2.querySelector(".close-dialog").addEventListener("click", close), dialog2.addEventListener("cancel", (event) => {
    event.preventDefault(), close();
  }), dialog2.addEventListener("click", (event) => {
    event.target === dialog2 && close();
  }), dialog2.addEventListener("keydown", (event) => {
    (event.key === "ArrowLeft" || event.key === "ArrowRight") && (event.preventDefault(), move(event.key === "ArrowLeft" ? -1 : 1));
  }), host.addEventListener("pointerdown", (event) => {
    busy || !event.isPrimary || event.button !== 0 || event.target.closest("button, .deck-footer") || (drag = { id: event.pointerId, x: event.clientX, y: event.clientY }, host.setPointerCapture(event.pointerId));
  }), host.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    let dx = Math.max(-host.clientWidth * 0.7, Math.min(host.clientWidth * 0.7, event.clientX - drag.x));
    face.style.transform = `translateX(${dx}px) rotate(${dx / host.clientWidth * 3}deg)`;
  });
  function release(event) {
    if (!drag || drag.id !== event.pointerId) return;
    let dx = event.clientX - drag.x, dy = event.clientY - drag.y, direction = dx < 0 ? 1 : -1;
    drag = null, host.hasPointerCapture(event.pointerId) && host.releasePointerCapture(event.pointerId), event.type !== "pointercancel" && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2 && elements2[current.number - 1 + direction] ? move(direction) : (face.animate([{ transform: face.style.transform }, { transform: "none" }], timing(260)), face.style.transform = "");
  }
  return host.addEventListener("pointerup", release), host.addEventListener("pointercancel", release), { open };
}
var init_element_deck = __esm({
  "web-poc/element-deck.js"() {
    init_element_card();
    init_nucleus_model();
  }
});

// web-poc/nucleon-sprites.js
function createNucleonSprites(ratio = Math.min(devicePixelRatio || 1, 2)) {
  let sprites = {};
  for (let kind of ["proton", "neutron"]) {
    let sprite = document.createElement("canvas");
    sprite.width = sprite.height = Math.ceil(6 * ratio);
    let ctx = sprite.getContext("2d");
    ctx.scale(sprite.width / 6, sprite.height / 6);
    let shade = ctx.createRadialGradient(2, 1.7, 0.1, 3, 3, 3.2), colors = kind === "proton" ? ["#A5A8AD", "#34373D", "#070809", "#000000"] : ["#FFFFFF", "#FFFFF5", "#C2C4BF", "#6D736E"];
    [0, 0.25, 0.72, 1].forEach((stop, i) => shade.addColorStop(stop, colors[i])), ctx.fillStyle = shade, ctx.beginPath(), ctx.arc(3, 3, 3, 0, Math.PI * 2), ctx.fill(), sprites[kind] = sprite;
  }
  return sprites;
}
var init_nucleon_sprites = __esm({
  "web-poc/nucleon-sprites.js"() {
    init_nucleus_model();
  }
});

// web-poc/nucleus-visual.js
function createVisualNucleus(element) {
  let packed = createNucleus(element, { buildBonds: !1 }), spacing = element.number <= 5 ? 0.6 : element.number <= 18 ? 0.78 : 1, center = 61 / 2, particles = projectNucleus(packed).map((p, i) => ({
    ...p,
    x: center + (p.x - center) * spacing,
    y: center + (p.y - center) * spacing,
    phase: (i * 2.399963 + element.number * 0.73) % (Math.PI * 2),
    speed: 1 + (i * 17 + element.number * 13) % 23 / 46
  })), visible = cullBuriedParticles(particles);
  return { counts: packed.counts, total: particles.length, particles: visible, time: 0 };
}
function cullBuriedParticles(particles) {
  let side = 122, covered = new Uint8Array(side * side), keep = /* @__PURE__ */ new Set(), halfDiagonal = Math.SQRT2 / 4, position = new Float64Array(3);
  function visit(x0, y0, r, callback) {
    let minX = Math.max(0, Math.floor((x0 - r) * 2)), maxX = Math.min(side - 1, Math.ceil((x0 + r) * 2)), minY = Math.max(0, Math.floor((y0 - r) * 2)), maxY = Math.min(side - 1, Math.ceil((y0 + r) * 2));
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      let dx = (x + 0.5) / 2 - x0, dy = (y + 0.5) / 2 - y0;
      if (dx * dx + dy * dy <= r * r && !callback(y * side + x)) return !1;
    }
    return !0;
  }
  for (let pose = 0; pose < 16; pose++) {
    covered.fill(0);
    for (let i = particles.length - 1; i >= 0; i--) {
      sampleVisualParticle(particles[i], pose * 0.271, position);
      let [x, y, diameter] = position, r = diameter / 2;
      visit(x, y, r + halfDiagonal, (index) => covered[index] === 1) || keep.add(i), visit(x, y, r - halfDiagonal, (index) => (covered[index] = 1, !0));
    }
  }
  return particles.filter((_, index) => keep.has(index));
}
function sampleVisualParticle(p, time, out) {
  let t = time * p.speed * 1.3, f = p.phase, x = (Math.sin(t * 9.3 + f) + 0.35 * Math.sin(t * 15.7 + f * 1.7)) / 1.35, y = (Math.sin(t * 11.1 + f * 2.3) + 0.35 * Math.sin(t * 17.3 + f * 0.7)) / 1.35, z = Math.sin(t * 8.7 + f * 3.1);
  return out[0] = p.x + x * JITTER_RADIUS, out[1] = p.y + y * JITTER_RADIUS, out[2] = 6 * (1 + z * DEPTH_SCALE), out;
}
var JITTER_RADIUS, DEPTH_SCALE, init_nucleus_visual = __esm({
  "web-poc/nucleus-visual.js"() {
    init_nucleus_model();
    JITTER_RADIUS = 1.1, DEPTH_SCALE = 0.07;
  }
});

// web-poc/nucleus-renderer.js
function createNucleusRenderer(toggle, dialog2, grid2 = null) {
  let entries = /* @__PURE__ */ new Map(), models = /* @__PURE__ */ new Map(), reduced = matchMedia("(prefers-reduced-motion: reduce)"), suspended = !1, paused = reduced.matches, last = 0, frame = 0, activeEntries = [], measuredFrames = 0, measuredCost = 0, measuredSince = 0, ratio = Math.min(devicePixelRatio || 1, 2), position = new Float64Array(3), sprites = createNucleonSprites(ratio);
  function getModel(element) {
    return models.has(element.number) || models.set(element.number, createVisualNucleus(element)), models.get(element.number);
  }
  function paint(entry, model) {
    let ctx = entry.context;
    if (ctx.clearRect(0, 0, 61, 61), entry.glow) {
      let weight = Math.min(1, Math.max(0, (model.counts.massNumber - 98) / 196)), pulse = (1 + Math.sin(model.time * 3.2 + entry.element.number * 0.137)) / 2;
      entry.glow.style.transform = `translate(-50%,-50%) scale(${(0.8 + 0.45 * weight) * (0.82 + 0.36 * pulse)})`, entry.glow.style.opacity = String((0.75 + 0.25 * weight) * (0.65 + 0.35 * pulse));
    }
    for (let p of model.particles) {
      sampleVisualParticle(p, model.time, position);
      let r = position[2] / 2;
      ctx.drawImage(sprites[p.kind], position[0] - r, position[1] - r, position[2], position[2]);
    }
  }
  function loop(now) {
    if (frame = 0, paused || suspended || document.hidden || !activeEntries.length) {
      last = 0;
      return;
    }
    if (!last || now - last >= 1e3 / 30 - 1) {
      let start = performance.now(), dt = last ? Math.min((now - last) / 1e3, 0.1) : 0;
      for (let entry of activeEntries) {
        let model = entry.model;
        model.paintedAt !== now && (model.time += dt, model.paintedAt = now), paint(entry, model);
      }
      if (measuredCost += performance.now() - start, measuredFrames++, grid2 && now - measuredSince > 1e3) {
        grid2.dataset.renderer = "visual-jitter", grid2.dataset.renderMs = (measuredCost / measuredFrames).toFixed(2), grid2.dataset.activePreviews = String(activeEntries.length), grid2.dataset.drawnParticles = String(activeEntries.reduce((n, e) => n + e.model.particles.length, 0)), grid2.dataset.totalParticles = String(activeEntries.reduce((n, e) => n + e.model.total, 0));
        for (let entry of activeEntries) entry.canvas.dataset.frame = String(Math.round(entry.model.time * 30));
        measuredFrames = 0, measuredCost = 0, measuredSince = now;
      }
      last = now;
    }
    frame = requestAnimationFrame(loop);
  }
  function schedule() {
    !frame && !paused && !suspended && !document.hidden && activeEntries.length && (frame = requestAnimationFrame(loop));
  }
  function refresh() {
    activeEntries = [];
    for (let entry of entries.values())
      !entry.visible || !entry.canvas.isConnected || entry.canvas.closest('[hidden],.dimmed,[data-card-mode="small"],[data-card-mode="micro"]') || dialog2?.open && !dialog2.contains(entry.canvas) || (entry.model = getModel(entry.element), activeEntries.push(entry), paint(entry, entry.model));
    schedule();
  }
  let observer = new IntersectionObserver((changes) => {
    for (let change of changes) {
      let entry = entries.get(change.target);
      entry && (entry.visible = change.isIntersecting);
    }
    refresh();
  });
  function syncToggle() {
    toggle && (toggle.textContent = paused ? "Resume motion" : "Pause motion", toggle.setAttribute("aria-pressed", String(paused)));
  }
  let onToggle = () => {
    paused = !paused, last = 0, syncToggle(), schedule();
  }, onReduced = () => {
    paused = reduced.matches, last = 0, syncToggle(), schedule();
  }, onVisibility = () => {
    last = 0, schedule();
  };
  return toggle?.addEventListener("click", onToggle), reduced.addEventListener("change", onReduced), document.addEventListener("visibilitychange", onVisibility), dialog2?.addEventListener("close", refresh), syncToggle(), {
    refresh,
    setSuspended(value) {
      suspended = !!value, last = 0, suspended ? (cancelAnimationFrame(frame), frame = 0) : refresh();
    },
    destroy() {
      cancelAnimationFrame(frame), observer.disconnect(), toggle?.removeEventListener("click", onToggle), reduced.removeEventListener("change", onReduced), document.removeEventListener("visibilitychange", onVisibility), dialog2?.removeEventListener("close", refresh), entries.clear(), models.clear(), activeEntries = [];
    },
    attach(canvas, element, eager = !1) {
      canvas.width = canvas.height = Math.ceil(61 * ratio);
      let context = canvas.getContext("2d");
      context.scale(canvas.width / 61, canvas.height / 61);
      let entry = { canvas, context, element, glow: canvas.closest(".element-card").querySelector(".radioactive-glow"), visible: !1, model: null };
      entries.set(canvas, entry), eager && paint(entry, getModel(element)), observer.observe(canvas);
    },
    detach(container) {
      for (let canvas of container.querySelectorAll("canvas.particle"))
        observer.unobserve(canvas), entries.delete(canvas);
      refresh();
    }
  };
}
var init_nucleus_renderer = __esm({
  "web-poc/nucleus-renderer.js"() {
    init_nucleon_sprites();
    init_nucleus_visual();
    init_nucleus_model();
  }
});

// web-poc/debug-tools.js
var debug_tools_exports = {};
__export(debug_tools_exports, {
  createDebugSection: () => createDebugSection
});
function createDebugSection(title) {
  if (!!1) return null;
  let panel = document.querySelector(".debug-panel");
  panel || (panel = document.createElement("details"), panel.className = "debug-panel", panel.innerHTML = '<summary>DEV \xB7 Debug tools</summary><div class="debug-panel__content"></div>', document.body.append(panel), panel.addEventListener("keydown", (event) => {
    event.key === "Escape" && (event.stopPropagation(), panel.open = !1, panel.querySelector("summary").focus());
  }));
  let section = document.createElement("section"), heading = document.createElement("h2");
  return heading.textContent = title, section.append(heading), panel.querySelector(".debug-panel__content").append(section), section;
}
var init_debug_tools = __esm({
  "web-poc/debug-tools.js"() {
    init_environment();
  }
});

// web-poc/elements.js
var elements_exports = {};
function card(element, featured = !1, interactive = !0) {
  let card2 = createElementCard(element, {
    featured,
    interactive,
    active: element.number === selected.number,
    discovered: element.number !== 43
  });
  return nuclei.attach(card2.querySelector("canvas"), element, featured), interactive && card2.addEventListener("click", () => {
    !featured && cardModes[cardModeIndex].id === "micro" ? (selected = element, update()) : deck.open(element, card2);
  }), card2;
}
function update() {
  let query = $("#element-search").value.trim().toLowerCase(), count = 0;
  if (cards.forEach((item, index) => {
    let element = elements[index], match = (family === "all" || element.category === family) && (!query || element.name.toLowerCase().includes(query) || element.symbol.toLowerCase() === query || String(element.number) === query);
    match && count++, item.hidden = view === "cards" && !match, item.classList.toggle("dimmed", !match), updateElementCardState(item, element, {
      active: element.number === selected.number,
      discovered: item.dataset.discovered !== "false",
      mode: cardModes[cardModeIndex].id
    }), item.tabIndex = match && (cardModes[cardModeIndex].id !== "micro" || element.number === selected.number) ? 0 : -1;
  }), cardModes[cardModeIndex].id === "micro" && !cards.some((item) => item.tabIndex === 0)) {
    let first = cards.find((item) => !item.hidden && !item.classList.contains("dimmed"));
    if (first)
      return selected = elements[Number(first.dataset.number) - 1], update();
  }
  grid.classList.toggle("cards-view", view === "cards");
  let resultCount = $("#result-count");
  resultCount && (resultCount.textContent = `${count} ${count === 1 ? "element" : "elements"}${count !== 118 ? " / 118" : ""}`);
  let layoutHint = $("#layout-hint");
  layoutHint && (layoutHint.textContent = view === "table" ? "Groups 01\u201318 \xB7 Scroll to explore \u2192" : "Ordered by atomic number"), $("#empty-state").hidden = count > 0, $(".table-scroll").hidden = count === 0, $(".table-scroll").setAttribute("aria-label", view === "table" ? "Periodic table, scroll horizontally to see all groups" : "Element cards"), document.querySelectorAll("[data-view]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === view))), nuclei.refresh();
}
var $, families, family, view, selected, cardModes, cardModeIndex, grid, dialog, nuclei, deck, guide, cards, collectionResize, init_elements = __esm({
  async "web-poc/elements.js"() {
    init_environment();
    init_element_card();
    init_elements_data();
    init_element_deck();
    init_nucleus_renderer();
    $ = (selector) => document.querySelector(selector), families = {
      nonmetal: "Nonmetals",
      "noble-gas": "Noble gases",
      "alkali-metal": "Alkali metals",
      "alkaline-earth": "Alkaline earths",
      "transition-metal": "Transition metals",
      "post-transition-metal": "Post-transition metals",
      metalloid: "Metalloids",
      lanthanide: "Lanthanides",
      actinide: "Actinides",
      unknown: "Unclassified"
    }, family = "all", view = "table", selected = elements[5], cardModes = [{ id: "normal", name: "Normal cards", component: "UIRectangleBig" }, { id: "small", name: "Small card", component: "UISquare Mid" }, { id: "micro", name: "Micro cell", component: "UISquare Small" }], cardModeIndex = Math.max(0, cardModes.findIndex((mode) => mode.id === document.querySelector("#element-grid")?.dataset.cardMode)), grid = $("#element-grid"), dialog = $("#element-dialog"), nuclei = createNucleusRenderer($("#motion-toggle"), dialog, grid);
    document.addEventListener("smep:visibility", (event) => nuclei.setSuspended(event.detail?.visible === !1));
    deck = createElementDeck({
      dialog,
      elements,
      nuclei,
      select(element) {
        selected = element, update();
      },
      sourceCard(element) {
        return grid.querySelector(`[data-number="${element.number}"]`);
      }
    });
    $("#featured-card")?.append(card(selected, !0));
    for (let group = 1; group <= 18; group++) {
      let label = document.createElement("span");
      label.className = "group-label", label.style.gridColumn = group, label.style.gridRow = 1, label.textContent = String(group).padStart(2, "0"), grid.append(label);
    }
    guide = document.createElement("div");
    guide.className = "table-guide";
    guide.innerHTML = "<div>Select one. Look a little closer.</div>";
    grid.append(guide);
    for (let [row, range, label] of [[7, "57\u201371", "Lanthanides"], [8, "89\u2013103", "Actinides"]]) {
      let slot = document.createElement("div");
      slot.className = "series-slot", slot.style.gridColumn = 3, slot.style.gridRow = row, slot.innerHTML = `${range}<small>${label}</small><span>\u2193</span>`, grid.append(slot);
    }
    for (let element of elements) {
      let item = card(element), row = element.period + 1, column = element.column;
      element.number >= 57 && element.number <= 71 && (row = 10, column = element.number - 54), element.number >= 89 && element.number <= 103 && (row = 11, column = element.number - 86), item.style.gridColumn = column, item.style.gridRow = row, grid.append(item);
    }
    cards = [...grid.querySelectorAll(".element-card")];
    for (let [key, value] of [["all", "All elements"], ...Object.entries(families).filter(([key2]) => elements.some((element) => element.category === key2))]) {
      let button = document.createElement("button");
      button.textContent = value, button.setAttribute("aria-pressed", String(key === family)), button.addEventListener("click", () => {
        family = key, $(".filters").querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button))), update();
      }), $(".filters").append(button);
    }
    if (!1) {
      let { createDebugSection: createDebugSection2 } = await Promise.resolve().then(() => (init_debug_tools(), debug_tools_exports));
      createDebugSection2("Card preview").insertAdjacentHTML("beforeend", '<button id="card-mode-toggle" type="button" aria-controls="element-grid" title="Next: Small Card">Debug: Normal Cards \u21BB</button>'), $("#card-mode-toggle").addEventListener("click", () => {
        cardModeIndex = (cardModeIndex + 1) % cardModes.length;
        let mode = cardModes[cardModeIndex];
        grid.dataset.cardMode = mode.id, $("#card-mode-toggle").textContent = `Debug: ${mode.name} \u21BB`, $("#card-mode-toggle").title = `${mode.component} \xB7 Next: ${cardModes[(cardModeIndex + 1) % cardModes.length].name}`, update();
      });
    }
    grid.addEventListener("keydown", (event) => {
      if (cardModes[cardModeIndex].id !== "micro" || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      let visible = cards.filter((item) => !item.hidden && !item.classList.contains("dimmed")), index = visible.indexOf(event.target);
      if (index < 0) return;
      event.preventDefault();
      let step = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1, next = event.key === "Home" ? 0 : event.key === "End" ? visible.length - 1 : (index + step + visible.length) % visible.length;
      selected = elements[Number(visible[next].dataset.number) - 1], update(), visible[next].focus();
    });
    $("#element-search").addEventListener("input", update);
    document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
      view = button.dataset.view, update();
    }));
    update();
    collectionResize = new ResizeObserver(([entry]) => {
      grid.style.setProperty("--collection-columns", Math.max(1, Math.floor(entry.contentRect.width / 83)));
    });
    collectionResize.observe($(".table-scroll"));
  }
});

// integrations/drupal/embed/bootstrap.js
var initial_mode = new URL(window.location.href).searchParams.get("mode");
["normal", "small", "micro"].includes(initial_mode) && (document.querySelector("#element-grid").dataset.cardMode = initial_mode);
var host_visible = window.parent === window;
function notify_visibility() {
  document.documentElement.dataset.embedVisible = String(host_visible), document.dispatchEvent(new CustomEvent("smep:visibility", { detail: { visible: host_visible } }));
}
window.addEventListener("message", (message_event) => {
  message_event.source !== window.parent || message_event.origin !== window.location.origin || message_event.data?.type !== "smep:host-visibility" || (host_visible = message_event.data.visible === !0, notify_visibility());
});
await init_elements().then(() => elements_exports);
notify_visibility();
window.parent !== window && window.parent.postMessage({ type: "smep:ready" }, window.location.origin);
