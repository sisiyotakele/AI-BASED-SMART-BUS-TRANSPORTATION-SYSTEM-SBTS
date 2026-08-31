import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { setPortalHint } from '@/lib/auth-storage';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, clearAuth } = useAuthStore();
    const location = useLocation();
    const [isVerifying, setIsVerifying] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            if (!isAuthenticated) {
                setIsVerifying(false);
                return;
            }
            try {
                // Strictly verify the token with the backend before allowing dashboard access
                await authService.getMe();
                setIsVerifying(false); // Token is valid!
            } catch (error) {
                // Token is invalid, expired, or backend is offline. Clear storage.
                clearAuth();
                setIsVerifying(false);
            }
        };

        verifySession();
    }, [isAuthenticated, clearAuth]);

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-900">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium text-sm">Verifying secure session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        setPortalHint(location.pathname.startsWith('/driver') ? 'driver' : 'admin');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role-based boundary checks
    const userRoles = useAuthStore.getState().user?.roles || [];
    const roleNames = userRoles
        .map((r: any) => {
            if (typeof r === 'string') return r.toUpperCase();
            return (r.roleName || r.name || '').toUpperCase();
        })
        .filter(Boolean);
    const hasDriverRole = roleNames.includes('DRIVER');
    const hasAdminAccess = roleNames.some((role: string) => role !== 'DRIVER' && role !== 'PASSENGER');
    const canAccessDriver = hasDriverRole;
    const canAccessAdmin = hasAdminAccess;
    
    // If they cannot access admin pages, route them to driver page when possible.
    if (!canAccessAdmin && canAccessDriver && location.pathname.startsWith('/dashboard')) {
         return <Navigate to="/driver" replace />;
    }
    
    // If they cannot access driver pages, keep them on admin pages.
    if (!canAccessDriver && canAccessAdmin && location.pathname.startsWith('/driver')) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
