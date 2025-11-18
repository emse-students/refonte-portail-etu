enum Permission {
	ROLES = 1 << 0,
	MEMBERS = 1 << 1,
	EVENTS = 1 << 2,
	ADMIN = 1 << 3,
	SITE_ADMIN = 1 << 4,
}

export default Permission;

export function hasPermission(
	userPermissions: number,
	permissionToCheck: Permission
): boolean {
	return ((userPermissions & permissionToCheck) | (userPermissions & Permission.SITE_ADMIN)) !== 0;
}

export function addPermission(
	userPermissions: number,
	permissionToAdd: Permission
): number {
	return userPermissions | permissionToAdd;
}

export function removePermission(
	userPermissions: number,
	permissionToRemove: Permission
): number {
	return userPermissions & ~permissionToRemove;
}

export function listPermissions(userPermissions: number): Permission[] {
	return Object.values(Permission).filter(
		(value) =>
			typeof value === "number" &&
			hasPermission(userPermissions, value as Permission)
	) as Permission[];
}