'use client';

import React, { useState } from 'react';
import { Task } from '@/types/task';
import { useAuth } from '@/context/AuthContext';
import { taskService } from '@/lib/api';
import { TaskCard } from './TaskCard';
import { Empty } from '@/components/ui/empty';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onRefresh: () => void;
}

export function TaskListComponent({ tasks, onEdit, onRefresh }: TaskListProps) {
  const { token } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleDelete = async (taskId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    setDeletingId(taskId);
    setError('');

    try {
      await taskService.deleteTask(taskId, token);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    } finally {
      setDeletingId(null);
    }
  };

  if (tasks.length === 0) {
    return <Empty title="No tasks yet" description="Create your first task to get started" />;
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onEdit={onEdit}
            onDelete={handleDelete}
            isDeleting={deletingId === task._id}
          />
        ))}
      </div>
    </div>
  );
}
