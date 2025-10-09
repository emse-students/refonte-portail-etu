enum Permission {
	CREATE_EVENT = 1 << 0,
	EDIT_EVENT = 1 << 1,
	DELETE_EVENT = 1 << 2,
	CREATE_ROLE = 1 << 3,
	EDIT_ROLE = 1 << 4,
	DELETE_ROLE = 1 << 5,
	ASSIGN_ROLE = 1 << 6,
	EDIT_ASSOCIATION = 1 << 7,
	CREATE_ASSOCIATION = 1 << 8,
	DELETE_ASSOCIATION = 1 << 9,
}

export default Permission;

export function hasPermission(
	userPermissions: number,
	permissionToCheck: Permission
): boolean {
	return (userPermissions & permissionToCheck) === permissionToCheck;
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