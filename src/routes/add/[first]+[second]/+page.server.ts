export const load = ({ params }) => {
    return {
        sum: Number(params.first) + Number(params.second)
    };
}