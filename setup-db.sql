-- Book Portal — PostgreSQL setup script

-- Run this once on any new machine to create the database.
--  psql -U postgres -f setup-db.sql

CREATE DATABASE book_portal;

CREATE USER book_portal_user WITH PASSWORD 'changeme';

GRANT ALL PRIVILEGES ON DATABASE book_portal TO book_portal_user;

\c book_portal

GRANT ALL ON SCHEMA public TO book_portal_user;