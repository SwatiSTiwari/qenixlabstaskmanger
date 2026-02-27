'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { Task } from '@/types/task';

export type TaskSocketEvent = 'task.created' | 'task.updated' | 'task.deleted';

interface UseTaskSocketOptions {
  token: string | null;
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (payload: { taskId: string }) => void;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export function useTaskSocket({
  token,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
}: UseTaskSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  // Keep callbacks in refs so the effect never needs to re-run because of them
  const onCreatedRef = useRef(onTaskCreated);
  const onUpdatedRef = useRef(onTaskUpdated);
  const onDeletedRef = useRef(onTaskDeleted);

  useEffect(() => {
    onCreatedRef.current = onTaskCreated;
  }, [onTaskCreated]);

  useEffect(() => {
    onUpdatedRef.current = onTaskUpdated;
  }, [onTaskUpdated]);

  useEffect(() => {
    onDeletedRef.current = onTaskDeleted;
  }, [onTaskDeleted]);

  useEffect(() => {
    if (!token) return;

    // Connect to the /tasks namespace
    const socket = io(`${BACKEND_URL}/tasks`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket.io] Connected to /tasks gateway');
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.io] Connection error:', err.message);
      if (
        err.message === 'Authentication token missing' ||
        err.message === 'Invalid or expired token'
      ) {
        toast.error('Real-time updates unavailable — authentication failed');
        socket.disconnect();
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
    });

    // ── Task events ──────────────────────────────────────────────────────────

    socket.on('task.created', (task: Task) => {
      onCreatedRef.current(task);
      toast.success(`New task created: "${task.title}"`, {
        description: `Priority: ${task.priority} · Status: ${task.status}`,
        duration: 4000,
        icon: '📋',
      });
    });

    socket.on('task.updated', (task: Task) => {
      onUpdatedRef.current(task);
      toast.info(`Task updated: "${task.title}"`, {
        description: `Status: ${task.status} · Priority: ${task.priority}`,
        duration: 4000,
        icon: '✏️',
      });
    });

    socket.on('task.deleted', (payload: { taskId: string }) => {
      onDeletedRef.current(payload);
      toast.warning('A task was deleted', {
        description: `Task ID: ${payload.taskId}`,
        duration: 4000,
        icon: '🗑️',
      });
    });

    return () => {
      socket.off('task.created');
      socket.off('task.updated');
      socket.off('task.deleted');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]); // only reconnect when the auth token changes

  return socketRef;
}
