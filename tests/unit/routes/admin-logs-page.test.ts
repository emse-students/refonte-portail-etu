import { render, screen } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import AdminLogsPage from "../../../src/routes/admin/logs/+page.svelte";

describe("Admin Logs Page", () => {
	it("renders logs table", () => {
		const mockData = {
			logs: [
				{ action: "Update User 1", user: "admin", timestamp: "2023-01-01 12:00:00" },
				{ action: "Delete Event 2", user: "admin", timestamp: "2023-01-02 12:00:00" },
			],
		};

		render(AdminLogsPage, { data: mockData });

		expect(screen.getByText("Audit Logs")).toBeInTheDocument();
		expect(screen.getByText("Update User 1")).toBeInTheDocument();
		expect(screen.getByText("Delete Event 2")).toBeInTheDocument();
		expect(screen.getAllByText("admin").length).toBe(2);
	});

	it("renders empty state when no logs", () => {
		render(AdminLogsPage, { data: { logs: [] } });

		expect(screen.getByText("No logs found")).toBeInTheDocument();
	});

	it("has a back link to dashboard", () => {
		render(AdminLogsPage, { data: { logs: [] } });
		const link = screen.getByRole("link", { name: "Retour au Dashboard" });
		expect(link).toHaveAttribute("href", "/admin");
	});
});
