import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-xl shadow-lg p-8 backdrop-blur-sm">
          {children}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Built with Next.js, NestJS & MongoDB Atlas
        </p>
      </div>
    </div>
  );
}
