/**
 * Exact swing of a frictionless pendulum at any amplitude (no small-angle sine): θ(t) = 2·asin(k·sn(ω₀t | k²)),
 * k = sin(amplitude / 2). Wide swings dwell longer at the ends and take longer per period, as a real bell does.
 */

/** Arithmetic-geometric mean steps from (1, √(1 − m)): the a and c columns of Abramowitz & Stegun 16.4. */
function agm(m: number) {
  const a = [1];
  const c = [Math.sqrt(m)];
  let b = Math.sqrt(1 - m);
  while (Math.abs(c.at(-1)!) > 1e-12 && a.length < 20) {
    const an = a.at(-1)!;
    a.push((an + b) / 2);
    c.push((an - b) / 2);
    b = Math.sqrt(an * b);
  }
  return { a, c };
}

/** Jacobi elliptic sn(u | m) by the AGM (A&S 16.4.3). */
export function sn(u: number, m: number) {
  const { a, c } = agm(m);
  const n = a.length - 1;
  let phi = 2 ** n * a[n] * u;
  for (let i = n; i > 0; i--) phi = (phi + Math.asin((c[i] / a[i]) * Math.sin(phi))) / 2;
  return Math.sin(phi);
}

/** Angle (rad) at time t of a pendulum with this amplitude and small-swing angular frequency ω₀; 0 and rising at t = 0. */
export function pendulum(t: number, amplitude: number, omega0: number) {
  const k = Math.sin(amplitude / 2);
  return 2 * Math.asin(k * sn(omega0 * t, k * k));
}

/** Full period (s): 4·K(k²)/ω₀, with K = π / (2·AGM). */
export function pendulumPeriod(amplitude: number, omega0: number) {
  const { a } = agm(Math.sin(amplitude / 2) ** 2);
  return (4 * (Math.PI / (2 * a.at(-1)!))) / omega0;
}
