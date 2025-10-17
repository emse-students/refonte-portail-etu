import { SQL, env } from "bun";

const db = new SQL({
    adapter: "mysql",
    hostname: env.DB_HOST,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: Number(env.DB_PORT) || 3306
});

export default db;

