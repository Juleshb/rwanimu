# Implementation 2.13 — Reports, Dashboard & Financial Visibility

Status: IMPLEMENTED (source level)

- Role-scoped dashboard and report API added.
- Every request derives role/location from the authenticated Username + Password session; non-Admin users cannot switch location.
- Admin dashboard/financial report includes revenue, COGS, Gross Profit, operating Expenses, Net Profit and Stock Valuation.
- Manager and Branch User receive operational summaries only; buying cost/WAC/COGS/profit are not exposed.
- Storekeeper dashboard/report is deliberately restricted to Physical Stock Count task/history and MATCHED/NOT_MATCHED status. It never returns system stock quantity, WAC, discrepancy quantity or financial values.
- Sales and Expense reports obey location scope. Voided sales remain visible in history; financial totals include CONFIRMED sales only.
- Print/PDF clients must consume the same permission-filtered endpoints; there is no separate unrestricted export endpoint.

Full PostgreSQL integration and Windows/browser UI testing remain pending.
