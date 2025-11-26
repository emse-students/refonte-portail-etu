import type { RawAssociation, RawUser, RawMember, RawRole, RawEvent } from "$lib/databasetypes";

export const TestData = {
	association: {
		id: 1,
		handle: "bde",
		name: "Bureau des Élèves",
		description: "L'association des élèves",
		icon: null,
		color: 0x7c3aed,
		created_at: new Date(),
		edited_at: new Date(),
	} as RawAssociation,

	user: {
		id: 1,
		first_name: "Test",
		last_name: "User",
		email: "test@emse.fr",
		login: "test.user",
		promo: 2024,
		permissions: 0,
		created_at: new Date(),
		edited_at: new Date(),
	} as RawUser,

	adminRole: {
		id: 1,
		name: "Admin",
		hierarchy: 10,
		permissions: 3, // ADMIN
		created_at: new Date(),
		edited_at: new Date(),
	} as RawRole,

	event: {
		id: 1,
		association_id: 1,
		title: "Test Event",
		description: "An event for testing",
		location: "EMSE Campus",
		start_date: new Date(),
		end_date: new Date(),
		created_at: new Date(),
		edited_at: new Date(),
		validated: true,
	} as RawEvent,

	member: {
		id: 1,
		visible: true,
		user_id: 1,
		association_id: 1,
		role_id: 1,
		list_id: null,
		created_at: new Date(),
		edited_at: new Date(),
	} as RawMember,
};
