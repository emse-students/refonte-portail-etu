import type {Association} from "$lib/databasetypes";
import { resolve } from "$app/paths";

export const load = async (event) => {
    const association : Association = await event.fetch(resolve(`/api/associations/handle/${event.params.handle}`)).then(res => res.json());

    // Fetch events for the association
    const events = await event.fetch(`${resolve("/api/calendar")}?asso=${association.id}`).then(res => res.json());
    

    return {
        association,
        events
    };

}

