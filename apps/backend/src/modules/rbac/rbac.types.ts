export interface CreateRoleInput {
  role_name: string;
  description?: string;
  created_by?: string;
}

export interface UpdateRoleInput {
  role_name?: string;
  description?: string;
  updated_by?: string;
}

export interface CreatePermissionInput {
  permission_name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface RoleWithPermissions {
  id: string;
  role_name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  permissions: {
    id: string;
    permission_name: string;
    resource: string;
    action: string;
  }[];
  users_count?: number;
}

export interface PermissionListItem {
  id: string;
  permission_name: string;
  resource: string;
  action: string;
  description: string | null;
}
