# UVESMS - University Visitor Entry and Security Management System

Here's the README as plain text you can paste directly into GitHub:

UVESMS — University Visitor Entry & Security Management System
UVESMS is a full-stack web application built as a DBMS course project for managing visitor entry, exit, and security operations at a university campus. It allows admins and security staff to register visitors, log their entry and exit through campus gates, track who is currently inside, manage security staff, and generate reports — all through a clean web interface.
Tech Stack
The backend is built with Node.js and Express, connected to a PostgreSQL database using the pg driver. Authentication is handled with JWT and bcryptjs. The frontend is built with React 18, Vite, Tailwind CSS, and shadcn/ui components. Routing on the frontend uses Wouter, forms use React Hook Form with Zod validation, and server state is managed with TanStack React Query.
Database Schema
The PostgreSQL database has five tables. The users table is the base auth table for all system users. The admin and security_staff tables hold role-specific profiles linked to users. The visitors table stores visitor details including name, phone, ID proof type and number, and department. The entry_logs table records each visit with entry/exit timestamps, gate number, pass number, purpose of visit, host name, and current status (inside or exited). Indexes are set up on commonly queried fields like visitor name, phone, visit date, and log status.
Features
The system supports role-based access for Admin and Security Staff. Admins can manage security staff and view all data. Security staff can register visitors, log entries and exits, and track who is currently on campus. The dashboard shows live stats — how many visitors are currently inside, total visitors today, total exited today, and total security staff. There is also a full visitor management section, an entry/exit log viewer, and a reports section for traffic summaries.
Project Structure
The project is split into three folders — backend, frontend, and database. The backend contains the Express server, database connection, route files for auth, visitors, staff, logs, dashboard, and reports, and a setup script. The frontend contains the React app with pages for dashboard, visitors, visitor detail, logs, staff, register visitor, and reports, along with shared components, an auth context, and an API client library. The database folder contains the standalone schema SQL file.
Setup Instructions
First, create the PostgreSQL database and run the schema file to set up tables and seed demo data. Then configure the database credentials in backend/db.js. Install dependencies and start the backend with npm run dev inside the backend folder — it runs on port 5000. Then install dependencies and start the frontend with npm run dev inside the frontend folder — it runs on port 5173.
Demo Credentials
Admin login: User ID is ADMIN001, password is admin123. Security staff logins: SEC001, SEC002, and SEC003 all use the password sec123.
API Overview
The backend exposes REST endpoints under /api for login, visitor CRUD, entry/exit log creation and updates, security staff management, dashboard stats, and reports. Auth-protected routes require a JWT token in the Authorization header.
Course
This project was developed as part of a Database Management Systems (DBMS) course to demonstrate relational database design and full-stack web application development.
