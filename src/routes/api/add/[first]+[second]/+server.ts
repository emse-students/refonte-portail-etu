import { json } from '@sveltejs/kit';

export const GET = (event) => {
    if (event.params.first && event.params.second && !isNaN(Number(event.params.first)) && !isNaN(Number(event.params.second))) {
        const sum = Number(event.params.first) + Number(event.params.second);
        return json({ sum });
    }
    return json({ error: 'Invalid parameters' }, { status: 400 });
}
