import { BoxGeometry, CylinderGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, PlaneGeometry, SphereGeometry, type Material, type BufferGeometry } from "three";

/** Things the avatar holds or wears on some pages, in the figure's model space (metres, facing +z). */

const mesh = (name: string, geometry: BufferGeometry, material: Material, at: [number, number, number] = [0, 0, 0]) => {
  const m = new Mesh(geometry, material);
  m.name = name;
  m.position.set(...at);
  m.castShadow = true;
  return m;
};

const aluminium = new MeshStandardMaterial({ color: "#c9ccd1", metalness: 0.6, roughness: 0.35 });
const display = new MeshStandardMaterial({ color: "#1b2a44", emissive: "#2b4a7a", emissiveIntensity: 0.6, roughness: 0.2 });
const keys = new MeshStandardMaterial({ color: "#2b2d31", roughness: 0.8 });

/** An open, unbranded laptop resting on level forearms, screen toward the holder. */
export function buildLaptop(): Group {
  const laptop = new Group();
  laptop.name = "laptop";
  laptop.position.set(0, 1.17, 0.31);
  laptop.add(mesh("base", new BoxGeometry(0.31, 0.014, 0.215), aluminium));
  const keyboard = mesh("keyboard", new PlaneGeometry(0.27, 0.12), keys, [0, 0.0075, -0.02]);
  keyboard.rotation.x = -Math.PI / 2;
  laptop.add(keyboard);
  // Lid hinged on the far edge, opened ~106°: its inner face (the display) turns toward the holder.
  const hinge = new Group();
  hinge.position.set(0, 0.007, 0.1075);
  hinge.rotation.x = 1.85;
  const lid = mesh("lid", new BoxGeometry(0.31, 0.008, 0.215), aluminium, [0, 0, -0.1075]);
  const screen = mesh("screen", new PlaneGeometry(0.28, 0.18), display, [0, -0.0045, 0]);
  screen.rotation.x = Math.PI / 2;
  lid.add(screen);
  hinge.add(lid);
  laptop.add(hinge);
  return laptop;
}

/** A tablet held at chest height on the `side` (+1/-1 model x) of the holding hand, tilted toward the face. */
export function buildTablet(side: number): Group {
  const tablet = new Group();
  tablet.name = "tablet";
  tablet.position.set(side * 0.1, 1.28, 0.3);
  // Built upright with the screen facing the holder (-z), then tipped back so it faces up toward the face.
  tablet.rotation.set(0.9, -side * 0.25, 0);
  tablet.add(mesh("body", new BoxGeometry(0.19, 0.26, 0.008), keys));
  const screen = mesh("screen", new PlaneGeometry(0.17, 0.24), display, [0, 0, -0.0045]);
  screen.rotation.y = Math.PI;
  tablet.add(screen);
  return tablet;
}

const gownCloth = new MeshStandardMaterial({ color: "#1d1d22", roughness: 0.85, side: DoubleSide });

/** Flared skirt of the graduation gown, from the waist to just above the shoes. */
export function buildSkirt(): Mesh {
  return mesh("skirt", new CylinderGeometry(0.19, 0.34, 0.8, 32, 1, true), gownCloth, [0, 0.58, 0]);
}

/** Mortarboard in avatar-head space (see avatar.ts SKULL): skull cap, square board turned to a diamond, gold tassel. */
export function buildMortarboard(): Group {
  const black = new MeshStandardMaterial({ color: "#16161a", roughness: 0.7 });
  const gold = new MeshStandardMaterial({ color: "#d4a93a", metalness: 0.4, roughness: 0.4 });
  const cap = new Group();
  cap.name = "mortarboard";
  const skull = mesh("cap", new CylinderGeometry(0.1, 0.098, 0.05, 32), black, [0, 0.112, 0]);
  const board = mesh("board", new BoxGeometry(0.28, 0.012, 0.28), black, [0, 0.141, 0]);
  board.rotation.y = Math.PI / 4;
  const button = mesh("button", new CylinderGeometry(0.01, 0.01, 0.008, 12), gold, [0, 0.151, 0]);
  const tassel = mesh("tassel", new CylinderGeometry(0.004, 0.012, 0.07, 8), gold, [0.135, 0.11, 0.0]);
  const knot = mesh("knot", new SphereGeometry(0.008, 8, 8), gold, [0.135, 0.147, 0]);
  cap.add(skull, board, button, tassel, knot);
  cap.rotation.x = -0.12; // tipped back a little, the way it sits on most heads
  return cap;
}
