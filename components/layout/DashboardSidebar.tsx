'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare2, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutGrid,
    },
    {
      label: 'Tasks',
      href: '/dashboard',
      icon: CheckSquare2,
    },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-sm fixed inset-y-0 left-0 z-40">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <CheckSquare2 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">TaskFlow</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80',
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-6 border-t border-border bg-primary/5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Version</p>
          <p className="text-sm font-medium text-foreground mt-1">1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
