import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchUserRbac, getCurrentSession, signOutUser, subscribeToAuthChanges } from '../services/authService';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check active session
        getCurrentSession().then((session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRolesAndPermissions(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // 2. Listen for auth changes
        const subscription = subscribeToAuthChanges((session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRolesAndPermissions(session.user.id);
            } else {
                setRoles([]);
                setPermissions(new Set());
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserRolesAndPermissions = async (userId) => {
        try {
            const { roles: userRoles, permissions: userPermissions } = await fetchUserRbac(userId);
            setRoles(userRoles);
            setPermissions(userPermissions);

        } catch (error) {
            console.error('Error fetching RBAC:', error);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await signOutUser();
        setRoles([]);
        setPermissions(new Set());
    };

    const can = (permissionCode) => {
        // Admins have all permissions implicit or explicit
        if (roles.includes('admin')) return true;
        return permissions.has(permissionCode);
    };

    const value = {
        session,
        user,
        roles,
        permissions,
        loading,
        signOut,
        can
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
