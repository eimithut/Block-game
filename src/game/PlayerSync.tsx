import { useFrame } from '@react-three/fiber';
import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { doc, setDoc, onSnapshot, collection, query, where, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import { world } from './WorldManager';
import { inputState } from './inputState';
import { NameTag } from '../components/NameTag';
import { PlayerModel } from './PlayerModel';

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
      name: inputState.playerName || 'Player',
      skinUrl: inputState.playerSkin || '',
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
  const lastRot = useRef(0);
  const lastMetaSync = useRef(0);

  useFrame((state) => {
    if (!userId || !roomId || !ready) return;
    
    // Sync local player position to Firebase (max 10 times per second)
    const now = performance.now();
    if (now - lastSyncTime.current < 100) return;

    const pos = state.camera.position;
    const rot = state.camera.rotation;
    
    // Check if metadata (name/skin) changed
    const metaChanged = now - lastMetaSync.current > 2000; // Sync metadata every 2 seconds if changed
    
    if (pos.distanceTo(playerRef.current) > 0.1 || Math.abs(rot.y - lastRot.current) > 0.1 || metaChanged) {
      playerRef.current.copy(pos);
      lastRot.current = rot.y;
      lastSyncTime.current = now;
      
      const updateData: any = {
        x: pos.x, y: pos.y, z: pos.z,
        yaw: rot.y, pitch: rot.x
      };

      if (metaChanged) {
        updateData.name = inputState.playerName;
        updateData.skinUrl = inputState.playerSkin;
        lastMetaSync.current = now;
      }

      setDoc(doc(db, 'rooms', roomId, 'players', userId), updateData, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'rooms/' + roomId + '/players/' + userId));
    }
  });

  return (
    <>
      {players.map(p => (
        <PlayerModel 
          key={p.id} 
          position={[p.x, p.y - 1.6, p.z]} 
          yaw={p.yaw || 0} 
          pitch={p.pitch || 0} 
          skinColor={p.skinColor} 
          name={p.name} 
          skinUrl={p.skinUrl}
        />
      ))}
    </>
  );
}
