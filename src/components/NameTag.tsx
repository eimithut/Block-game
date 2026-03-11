import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { createPortal } from 'react-dom';

export function NameTag({ groupRef, name }: { groupRef: React.RefObject<THREE.Group>, name: string }) {
  const { camera, size } = useThree();
  const ref = useRef<HTMLDivElement>(null);

  useFrame(() => {
    if (!ref.current || !groupRef.current) return;

    const position = new THREE.Vector3();
    groupRef.current.getWorldPosition(position);
    position.y += 2; // Offset above the mob

    const vector = position.project(camera);
    const x = (vector.x * 0.5 + 0.5) * size.width;
    const y = (vector.y * -0.5 + 0.5) * size.height;

    ref.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
  });

  const container = document.getElementById('name-tags-container');
  if (!container) return null;

  return createPortal(
    <div 
      ref={ref}
      className="absolute top-0 left-0 bg-black/50 text-white px-2 py-1 rounded text-xs font-bold pointer-events-none"
    >
      {name}
    </div>,
    container
  );
}
