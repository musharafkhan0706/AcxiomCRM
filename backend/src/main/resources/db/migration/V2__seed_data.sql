-- V2__seed_data.sql: Baseline Reference & Seed Data

INSERT INTO roles (id, name, description)
SELECT 1, 'ADMIN', 'Administrator with full system privileges'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id = 1);

INSERT INTO roles (id, name, description)
SELECT 2, 'MANAGER', 'Sales Manager with team-level oversight'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id = 2);

INSERT INTO roles (id, name, description)
SELECT 3, 'SALES_EXECUTIVE', 'Sales Executive managing assigned pipeline'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id = 3);
