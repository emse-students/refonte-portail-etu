import type { RawAssociation, RawUser, RawMember, RawEvent } from "$lib/databasetypes";

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
		created_at: new Date(),
		edited_at: new Date(),
	} as RawUser,

	event: {
		id: 1,
		association_id: 1,
		title: "Test Event",
		description: "An event for testing",
		location: "EMSE Campus",
		start_date: new Date("2026-01-01T10:00:00"),
		end_date: new Date("2026-01-01T12:00:00"),
		created_at: new Date(),
		edited_at: new Date(),
		validated: true,
	} as RawEvent,

	member: {
		id: 1,
		visible: true,
		user_id: 1,
		association_id: 1,
		role_name: "Admin",
		permissions: 3, // BASIC
		hierarchy: 10,
		list_id: null,
		created_at: new Date(),
		edited_at: new Date(),
	} as RawMember,
};
