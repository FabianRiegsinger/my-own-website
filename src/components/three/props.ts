import { BoxGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, type Material, type BufferGeometry } from "three";

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

/**
 * Where the tablet rests on Fabian's upturned palm (GenMe, Mobileye), in the hand's frame: `reach` toward the fingertips,
 * `side` toward the thumb, `lift` up off the hand bone (metres); `pitch`/`roll`/`yaw` (degrees) turn it about its short
 * side, long side and screen normal; `scale` grows it. Live-tunable with `?tune` on the page (TabletTuner).
 */
export const TABLET = { reach: -0.042, side: 0.15, lift: 0.039, pitch: 0, roll: 0, yaw: 87, scale: 1.7 };

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
