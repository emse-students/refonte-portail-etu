
	import db from "$lib/server/database";
    import { resolve } from "$app/paths";
import type { AssociationDB } from "$lib/databasetypes";

	export async function load() {
		const associations: AssociationDB[] = await fetch(resolve("/api/associations")).then(res => res.json());

	

	return {
		associations: associations,
	};
}