-- Run as root against the newly created local my_project database.
-- No user passwords or accounts are seeded. Authentication must support hashes first.
USE my_project;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  leader VARCHAR(100),
  parent_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES departments(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL COMMENT 'Password hash; never plaintext',
  realname VARCHAR(100) NOT NULL DEFAULT '',
  cellphone VARCHAR(32) NOT NULL DEFAULT '',
  enable TINYINT NOT NULL DEFAULT 1 CHECK (enable IN (0, 1)),
  role_id INT NOT NULL DEFAULT 2,
  department_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS menus (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  url VARCHAR(255) NOT NULL UNIQUE,
  parent_id INT NULL,
  FOREIGN KEY (parent_id) REFERENCES menus(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_menus (
  role_id INT NOT NULL,
  menu_id INT NOT NULL,
  PRIMARY KEY (role_id, menu_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (menu_id) REFERENCES menus(id)
) ENGINE=InnoDB;

START TRANSACTION;

-- Preserve role 0: the existing service uses it for the super administrator.
INSERT INTO roles (id, name) VALUES
  (0, '超级管理员'), (1, '编辑'), (2, '查看者')
ON DUPLICATE KEY UPDATE id = roles.id;

INSERT INTO departments (id, name, leader) VALUES
  (1, '内容运营部', '待设置')
ON DUPLICATE KEY UPDATE id = departments.id;

-- Initially expose only the user-management page; other pages are unfinished.
INSERT INTO menus (id, name, url, parent_id) VALUES
  (1, '系统管理', '/main/system', NULL)
ON DUPLICATE KEY UPDATE id = menus.id;

INSERT INTO menus (id, name, url, parent_id) VALUES
  (2, '用户管理', '/main/system/user', 1)
ON DUPLICATE KEY UPDATE id = menus.id;

INSERT INTO role_menus (role_id, menu_id) VALUES (0, 1), (0, 2)
ON DUPLICATE KEY UPDATE role_id = role_menus.role_id;

COMMIT;

SHOW TABLES;
SELECT id, name FROM roles;
SELECT id, name, url FROM menus;
