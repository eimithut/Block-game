import { useFrame } from '@react-three/fiber';
import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { doc, setDoc, onSnapshot, collection, query, where, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import { world } from './WorldManager';
import { NameTag } from '../components/NameTag';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function PlayerSync() {
  const [players, setPlayers] = useState<any[]>([]);
  const playerRef = useRef<THREE.Vector3>(new THREE.Vector3(8, 40, 8));
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(world.roomId);
  const sessionId = useRef(Math.random().toString(36).substring(2, 8));

  useEffect(() => {
    const onRoomChange = () => setRoomId(world.roomId);
    world.roomChangeCallbacks.add(onRoomChange);
    return () => {
      world.roomChangeCallbacks.delete(onRoomChange);
    };
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user ? `${user.uid}_${sessionId.current}` : null);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId || !roomId) {
      setReady(false);
      return;
    }

    setReady(false); // Reset ready state for new room

    const playerDoc = doc(db, 'rooms', roomId, 'players', userId);
    setDoc(playerDoc, {
      id: userId,
      name: 'Player ' + userId.substring(0, 4),
      x: 8, y: 40, z: 8,
      skinColor: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    }).then(() => setReady(true)).catch(err => handleFirestoreError(err, OperationType.WRITE, playerDoc.path));

    const q = query(collection(db, 'rooms', roomId, 'players'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPlayers: any[] = [];
      snapshot.forEach((doc) => {
        if (doc.id !== userId) {
          newPlayers.push(doc.data());
        }
      });
      setPlayers(newPlayers);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'rooms/' + roomId + '/players'));

    return () => {
      unsubscribe();
      deleteDoc(playerDoc).catch(err => handleFirestoreError(err, OperationType.DELETE, playerDoc.path));
    };
  }, [roomId, userId]);

  const lastSyncTime = useRef(0);

  useFrame((state) => {
    if (!userId || !roomId || !ready) return;
    
    // Sync local player position to Firebase (max 10 times per second)
    const now = performance.now();
    if (now - lastSyncTime.current < 100) return;

    const pos = state.camera.position;
    if (pos.distanceTo(playerRef.current) > 0.1) {
      playerRef.current.copy(pos);
      lastSyncTime.current = now;
      setDoc(doc(db, 'rooms', roomId, 'players', userId), {
        x: pos.x, y: pos.y, z: pos.z
      }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'rooms/' + roomId + '/players/' + userId));
    }
  });

  return (
    <>
      {players.map(p => (
        <group key={p.id} position={[p.x, p.y - 1.6, p.z]}>
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
