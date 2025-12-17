import winston from "winston";
import { env } from "$env/dynamic/private";

const { combine, timestamp, printf, colorize, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
	let msg = `${timestamp} [${level}]: ${message}`;
	if (Object.keys(metadata).length > 0) {
		msg += ` ${JSON.stringify(metadata)}`;
	}
	return msg;
});

const logger = winston.createLogger({
	level: env.LOG_LEVEL || "info",
	format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), json()),
	transports: [
		new winston.transports.Console({
			format: combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
		}),
		new winston.transports.File({
			filename: "logs/error.log",
			level: "error",
			format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), json()),
		}),
		new winston.transports.File({
			filename: "logs/combined.log",
			format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), json()),
		}),
	],
});

const auditLogger = winston.createLogger({
	level: "info",
	format: combine(
		timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		printf(({ message, timestamp }) => {
			return `${message} ; ${timestamp}`;
		})
	),
	transports: [new winston.transports.File({ filename: "logs/audit.log" })],
});

export function logAudit(action: string, user: string) {
	auditLogger.info(`${action} ; ${user}`);
}

export default logger;
