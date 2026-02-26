'use client';

import React from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, User, Clock, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig = {
  [TaskStatus.TODO]: {
    color: 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    icon: Circle,
    label: 'To Do'
  },
  [TaskStatus.IN_PROGRESS]: {
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    icon: Clock,
    label: 'In Progress'
  },
  [TaskStatus.DONE]: {
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
    icon: CheckCircle2,
    label: 'Done'
  },
};

const priorityConfig = {
  [TaskPriority.LOW]: {
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
    label: '🟢 Low'
  },
  [TaskPriority.MEDIUM]: {
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    label: '🟡 Medium'
  },
  [TaskPriority.HIGH]: {
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
    label: '🔴 High'
  },
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isDeleting: boolean;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  isDeleting,
}: TaskCardProps) {
  const StatusIcon = statusConfig[task.status].icon;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;

  return (
    <div className="group border border-border bg-card rounded-lg p-5 hover:shadow-md hover:border-primary/50 transition-all duration-200">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <StatusIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <h3 className="font-semibold text-base leading-tight truncate">{task.title}</h3>
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="h-8 w-8 p-0 hover:bg-primary/10"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task._id)}
              disabled={isDeleting}
              className="h-8 w-8 p-0 hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={cn('border text-xs font-medium', statusConfig[task.status].color)}>
            {statusConfig[task.status].label}
          </Badge>
          <Badge className={cn('border text-xs font-medium', priorityConfig[task.priority].color)}>
            {priorityConfig[task.priority].label}
          </Badge>
          {isOverdue && (
            <Badge className="border bg-destructive/10 dark:bg-destructive/20 text-destructive dark:text-destructive/90 border-destructive/20 text-xs font-medium">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            <span>Created by {task.createdBy.name}</span>
          </div>
          {task.dueDate && (
            <div className={cn('flex items-center gap-2', isOverdue && 'text-destructive dark:text-destructive/90 font-medium')}>
              <Clock className="h-3.5 w-3.5" />
              <span>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
            </div>
          )}
        </div>

        {task.assignedTo && (
          <div className="text-xs bg-primary/5 border border-primary/10 p-3 rounded-md">
            <p className="text-muted-foreground mb-1">Assigned to</p>
            <p className="font-semibold text-foreground">{task.assignedTo.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
