import { supabase } from '../supabase';

export async function getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

export function subscribeToAuthChanges(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session);
    });

    return subscription;
}

export async function signInWithPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
}

export async function signOutUser() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function fetchUserRbac(userId) {
    const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_id, roles (name, description)')
        .eq('user_id', userId);

    if (rolesError) throw rolesError;

    const roleNames = (userRoles || []).map((userRole) => userRole.roles.name);

    const { data: rolePermissions, error: permissionsError } = await supabase
        .from('user_roles')
        .select(`
            role_id,
            roles: roles (
                role_permissions (
                    permissions (code)
                )
            )
        `)
        .eq('user_id', userId);

    if (permissionsError) throw permissionsError;

    const permissions = new Set();
    (rolePermissions || []).forEach((userRole) => {
        userRole.roles.role_permissions.forEach((rolePermission) => {
            if (rolePermission.permissions?.code) {
                permissions.add(rolePermission.permissions.code);
            }
        });
    });

    return { roles: roleNames, permissions };
}
