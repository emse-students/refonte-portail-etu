import type { List } from "$lib/databasetypes";
import { resolve } from "$app/paths";

export const load = async (event) => {
    const list : List = await event.fetch(resolve(`/api/lists/handle/${event.params.handle}`)).then(res => res.json());

    return {
        list
    };

}

