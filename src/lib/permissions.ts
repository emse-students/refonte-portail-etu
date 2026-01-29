enum Permission {
	MEMBER = 0,
	MANAGE = 1,
	ADMIN = 2,
}

export default Permission;

export function hasPermission(userPermissions: number, permissionToCheck: Permission): boolean {
	return userPermissions >= permissionToCheck;
}

export function getPermissionName(level: number): string {
	switch (level) {
		case Permission.MEMBER:
			return "Membre";
		case Permission.MANAGE:
			return "Gestion des Membres & Événements";
		case Permission.ADMIN:
			return "Administration";
		default:
			return "Inconnu (" + level + ")";
	}
}
