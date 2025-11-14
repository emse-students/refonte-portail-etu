// Raw types : 

export type RawAssociation = {
	id: number;
	handle: string;
	name: string;
	description: string;
	is_list: boolean;
	icon: number;
	color: number;
	created_at: Date;
	updated_at: Date;
};

export type RawUser = {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	login: string;
	permissions: number;
	created_at: Date;
	updated_at: Date;
};

export type RawRole = {
	id: number;
	name: string;
	permissions: number;
	created_at: Date;
	updated_at: Date;
};

export type RawMember = {
	id: number;
	visible: boolean;
	user_id: number;
	association_id: number;
	role_id: number;
	created_at: Date;
	updated_at: Date;
};

export type RawEvent = {
	id: number;
	association_id: number;
	title: string;
	description: string;
	start_date: Date;
	end_date: Date;
	location: string;
	created_at: Date;
	updated_at: Date;
};

// Processed types :

export type Association = {
	id: number;
	handle: string;
	name: string;
	description: string;
	members: Member[];
	is_list: boolean;
	icon: string;
	color: number;
};

export type User = {
	id: number;
	first_name: string;
	last_name: string;
	login: string;
	email: string;
	permissions: number;
};

export type Role = {
	id: number;
	name: string;
	permissions: number;
};

export type Member = {
	user: User;
	role: Role;
	association: number;
	visible: boolean;
};
