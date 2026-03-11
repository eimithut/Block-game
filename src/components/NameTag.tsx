import * as THREE from 'three';
import { Html } from '@react-three/drei';

export function NameTag({ name }: { name: string }) {
  return (
    <Html position={[0, 2, 0]} center occlude={false}>
      <div className="bg-black/50 text-white px-2 py-1 rounded text-xs font-bold pointer-events-none whitespace-nowrap">
        {name}
      </div>
    </Html>
  );
}
