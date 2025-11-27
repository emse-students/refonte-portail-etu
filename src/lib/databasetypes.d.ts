// Raw types :

export type RawAssociation = {
	id: number;
	handle: string;
	name: string;
	description: string;
	icon: number | null;
	color: number;
	created_at: Date;
	edited_at: Date;
};

export type RawList = {
	id: number;
	name: string;
	handle: string;
	description: string;
	association_id: number;
	icon: number;
	promo: number;
	color: number;
	created_at: Date;
	edited_at: Date;
};

export type RawUser = {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	login: string;
	promo: number;
	permissions: number;
	created_at: Date;
	edited_at: Date;
};

export type RawRole = {
	id: number;
	name: string;
	hierarchy: number;
	permissions: number;
	created_at: Date;
	edited_at: Date;
};

export type RawMember = {
	id: number;
	visible: boolean;
	user_id: number;
	association_id: number | null;
	role_id: number;
	list_id: number | null;
	created_at: Date;
	edited_at: Date;
};

export type RawEvent = {
	id: number;
	association_id: number | null;
	list_id: number | null;
	title: string;
	description: string;
	start_date: Date;
	end_date: Date;
	location: string;
	created_at: Date;
	edited_at: Date;
	validated: boolean;
};

// Processed types :

export type Association = {
	id: number;
	handle: string;
	name: string;
	description: string;
	members: Member[];
	icon: string;
	color: number;
};

export type List = {
	id: number;
	name: string;
	handle: string;
	description: string;
	association_id: number;
	association?: RawAssociation;
	icon: string;
	members: Member[];
	promo: number;
	color: number;
};

export type User = {
	id: number;
	first_name: string;
	last_name: string;
	login: string;
	email: string;
	permissions: number;
	promo: number;
};

export type Role = {
	id: number;
	name: string;
	permissions: number;
	hierarchy: number;
};

export type Member = {
	id: number;
	user: User;
	role: Role;
	association_id: number | null;
	list_id: number | null;
	visible: boolean;
};

export type FullUser = User & {
	memberships: Member[];
};

export type Event = {
	id: number;
	association_id: number | null;
	list_id: number | null;
	title: string;
	description: string;
	start_date: Date;
	end_date: Date;
	location: string;
	validated: boolean;
};

export type ConfigRow = {
	key_name: string;
	value: string;
};
