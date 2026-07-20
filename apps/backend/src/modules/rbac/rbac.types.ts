export interface RoleCreateInput {
  roleName: string;
  description?: string;
}

export interface RoleUpdateInput {
  roleName?: string;
  description?: string;
}

export interface AssignPermissionInput {
  permissionId: string;
}

export interface AssignRoleInput {
  roleId: string;
}

export interface PermissionFilter {
  resource?: string;
  action?: string;
  search?: string;
}
