enum Permission {
	MEMBER = 0,
	ROLES = 1,
	EVENTS = 2,
	ADMIN = 3,
	SITE_ADMIN = 4,
}

export default Permission;

export function hasPermission(userPermissions: number, permissionToCheck: Permission): boolean {
	return userPermissions >= permissionToCheck;
}

export function getPermissionName(level: number): string {
	switch (level) {
		case Permission.MEMBER:
			return "Membre";
		case Permission.ROLES:
			return "Gestion Rôles & Membres";
		case Permission.EVENTS:
			return "Gestion Événements";
		case Permission.ADMIN:
			return "Administration";
		case Permission.SITE_ADMIN:
			return "Super Admin";
		default:
			return "Inconnu (" + level + ")";
	}
}
