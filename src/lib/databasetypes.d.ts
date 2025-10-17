export interface Association {
	id: number;
	name: string;
	description: string;
	icon: string;
	color: string;
	members: Member[];
	established: string;
	// UI-specific properties that might not be in the main 'associations' table
	size?: "small" | "medium" | "large";
	position?: { x: number; y: number };
}

export interface User {
	id: number;
	login: string;
	email: string;
	name: string;
	avatar_url: string;
}

export interface Event {
	id: number;
	title: string;
	date: Date;
	duration: number; // duration in minutes
	description: string | null;
	location: string | null;
	association: AssociationDB;
	color: string;
}
/**
 * Represents the raw data structure for a Role from the database.
 */
export interface Role {
	id: number;
	name: string;
    permissions: number;
}

/**
 * Represents the raw, nested data structure for a Member,
 * combining user and role information as fetched from the database.
 */
export interface Member {
	user: User;
	role: Role;
	association: Association["id"];
}

/**
 * Represents the raw data structure for an Association from the database.
 * Note: Members are not included here as they are fetched in a separate query.
 */
export interface AssociationDB {
	id: number;
	name: string;
	description: string;
	icon: string;
	color: string;
	contact: string;
	established: string;
}

/**
 * Represents the raw data structure for an Event from the database.
 */
export interface EventDB {
	id: number;
	title: string;
	start_date: string;
	end_date: string;
	description: string | null;
	location: string | null;
	association_id: number | null;
	color: string;
}









