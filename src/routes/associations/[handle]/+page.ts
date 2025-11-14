import type {Association} from "$lib/databasetypes";
import { resolve } from "$app/paths";

export const load = async (event) => {
    const association : Association = await event.fetch(resolve(`/api/associations/handle/${event.params.handle}?includeMembers=true`)).then(res => res.json());

    return {
        association
    };

}

