'use client';

import React from 'react';
import { TaskStatus, TaskPriority } from '@/types/task';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TaskFiltersProps {
  filters: {
    status?: TaskStatus;
    priority?: TaskPriority;
  };
  onFiltersChange: (filters: any) => void;
}

export function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : value,
    });
  };

  const handlePriorityChange = (value: string) => {
    onFiltersChange({
      ...filters,
      priority: value === 'all' ? undefined : value,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasFilters = filters.status || filters.priority;

  return (
    <div className="flex gap-3 items-center flex-wrap">
      <div className="text-sm font-medium text-muted-foreground">Filter by:</div>

      <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value={TaskStatus.TODO}>{TaskStatus.TODO}</SelectItem>
          <SelectItem value={TaskStatus.IN_PROGRESS}>
            {TaskStatus.IN_PROGRESS}
          </SelectItem>
          <SelectItem value={TaskStatus.DONE}>{TaskStatus.DONE}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.priority || 'all'} onValueChange={handlePriorityChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value={TaskPriority.LOW}>{TaskPriority.LOW}</SelectItem>
          <SelectItem value={TaskPriority.MEDIUM}>
            {TaskPriority.MEDIUM}
          </SelectItem>
          <SelectItem value={TaskPriority.HIGH}>{TaskPriority.HIGH}</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
