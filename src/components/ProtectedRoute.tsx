"use client";

import { useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";

type UserRole = 'guest' | 'owner' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ 
  children, 
  allowedRoles
}: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        const role = (session.user as any).role || 'guest';
        setUserRole(role as UserRole);
        setIsLoading(false);
      } else {
        setUserRole('guest');
        setIsLoading(false);
      }
    }
  }, [session, isPending]);

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-secondary)]"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-4">Please sign in to access this page.</p>
          <a href="/login" className="inline-block px-6 py-2 bg-[#89A38F] text-white rounded-lg hover:opacity-90">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page. Required role: {allowedRoles.join(' or ')}.
          </p>
          <p className="text-sm text-gray-600">
            Your current role: <span className="font-semibold">{userRole}</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function withOwnerProtection(Component: React.ComponentType) {
  return function ProtectedComponent(props: any) {
    return (
      <ProtectedRoute allowedRoles={['owner', 'admin']}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

export function withAdminProtection(Component: React.ComponentType) {
  return function ProtectedComponent(props: any) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
