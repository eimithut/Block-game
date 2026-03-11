import { useFrame } from '@react-three/fiber';
import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { doc, setDoc, onSnapshot, collection, query, where, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { world } from './WorldManager';
import { NameTag } from '../components/NameTag';

export function PlayerSync() {
  const [players, setPlayers] = useState<any[]>([]);
  const playerRef = useRef<THREE.Vector3>(new THREE.Vector3(8, 40, 8));

  useEffect(() => {
    if (!auth.currentUser || !world.roomId) return;

    const playerDoc = doc(db, 'rooms', world.roomId, 'players', auth.currentUser.uid);
    setDoc(playerDoc, {
      id: auth.currentUser.uid,
      name: 'Player ' + auth.currentUser.uid.substring(0, 4),
      x: 8, y: 40, z: 8,
      skinColor: '#' + Math.floor(Math.random()*16777215).toString(16)
    });

    const q = query(collection(db, 'rooms', world.roomId, 'players'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPlayers: any[] = [];
      snapshot.forEach((doc) => {
        if (doc.id !== auth.currentUser?.uid) {
          newPlayers.push(doc.data());
        }
      });
      setPlayers(newPlayers);
    });

    return () => {
      unsubscribe();
      deleteDoc(playerDoc);
    };
  }, [world.roomId]);

  useFrame((state) => {
    if (!auth.currentUser || !world.roomId) return;
    
    // Sync local player position to Firebase
    const pos = state.camera.position;
    if (pos.distanceTo(playerRef.current) > 0.1) {
      playerRef.current.copy(pos);
      setDoc(doc(db, 'rooms', world.roomId, 'players', auth.currentUser.uid), {
        x: pos.x, y: pos.y, z: pos.z
      }, { merge: true });
    }
  });

  return (
    <>
      {players.map(p => (
        <group key={p.id} position={[p.x, p.y, p.z]}>
          <NameTag name={p.name} />
          <mesh castShadow position={[0, 0.8, 0]}>
            <boxGeometry args={[0.6, 1.6, 0.3]} />
            <meshLambertMaterial color={p.skinColor} />
          </mesh>
        </group>
      ))}
    </>
  );
}
