'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { taskService } from '@/lib/api';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { TaskListComponent } from '@/components/tasks/TaskList';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTaskSocket } from '@/hooks/use-task-socket';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [filters, setFilters] = useState<{
    status?: TaskStatus;
    priority?: TaskPriority;
  }>({});

  const fetchTasks = async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');

    try {
      const data = await taskService.getTasks(filters, token);
      setTasks(data as Task[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token, filters]);

  // ── Real-time handlers ──────────────────────────────────────────────────────

  const handleTaskCreated = useCallback((task: Task) => {
    setTasks((prev) => {
      // Avoid duplicate if our own create already added it via REST
      const exists = prev.some((t) => t._id === task._id);
      return exists ? prev : [task, ...prev];
    });
  }, []);

  const handleTaskUpdated = useCallback((task: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? task : t)),
    );
  }, []);

  const handleTaskDeleted = useCallback(({ taskId }: { taskId: string }) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }, []);

  const socketRef = useTaskSocket({
    token,
    onTaskCreated: handleTaskCreated,
    onTaskUpdated: handleTaskUpdated,
    onTaskDeleted: handleTaskDeleted,
  });

  // Track socket connection status for the UI badge
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) setIsSocketConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socketRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dialog helpers ──────────────────────────────────────────────────────────

  const handleOpenDialog = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
  };

  const handleTaskSuccess = () => {
    handleCloseDialog();
    fetchTasks();
  };

  // Calculate statistics
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-card/5">
      <div className="p-6 lg:p-8 space-y-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">Tasks</h1>
              {/* Real-time connection status badge */}
              <Badge
                variant={isSocketConnected ? 'default' : 'secondary'}
                className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium transition-all ${
                  isSocketConnected
                    ? 'bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {isSocketConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </>
                )}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage and organize your work
            </p>
          </div>
          <Button 
            onClick={handleOpenDialog} 
            className="gap-2 h-11 px-6 text-base shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="h-5 w-5" />
            New Task
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">📋</span>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold mt-2">{stats.inProgress}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-accent">⚡</span>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-2">{stats.completed}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">✓</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-2">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="ml-2">{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <TaskFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center">
            <p className="text-2xl font-semibold text-muted-foreground mb-2">No tasks yet</p>
            <p className="text-muted-foreground mb-6">Create your first task to get started</p>
            <Button 
              onClick={handleOpenDialog}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <TaskListComponent
              tasks={tasks}
              onEdit={(task) => {
                setEditingTask(task);
                setIsDialogOpen(true);
              }}
              onRefresh={fetchTasks}
            />
          </div>
        )}

        <TaskDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          editingTask={editingTask}
          onSuccess={handleTaskSuccess}
        />
      </div>
    </div>
  );
}