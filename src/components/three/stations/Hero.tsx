/** The studio floor every station stands on: flat unlit paper white, so only the contact shadow reads. */
export function Hero() {
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </mesh>
  );
}
