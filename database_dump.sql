--
-- PostgreSQL database dump
--

\restrict TztWTdnpHq4EaU6CMlf30LcK3QF2GMnapp0Upw7TRSKoohxBpH9TMYjq76oLWl4

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Department" VALUES (2, 'Ressources Humaines', 'Service des Ressources Humaines', '2026-07-10 11:33:22.908', '2026-07-10 11:33:22.908', NULL, true, 0);
INSERT INTO public."Department" VALUES (1, 'Direction Générale', 'Direction générale de l''entreprise', '2026-07-10 11:33:22.898', '2026-07-10 14:04:21.898', NULL, true, 0);
INSERT INTO public."Department" VALUES (3, 'Informatique', 'Service informatique', '2026-07-10 16:53:49.75', '2026-07-10 16:53:49.75', NULL, true, 0);
INSERT INTO public."Department" VALUES (4, 'Commercial', 'Communication avec la clientèle', '2026-07-13 11:31:46.779', '2026-07-13 11:31:46.779', NULL, true, 0);


--
-- Data for Name: Position; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Position" VALUES (1, 'Développeur', NULL, true, 3, '2026-07-10 16:54:14.906', '2026-07-10 16:54:14.906', true, false);
INSERT INTO public."Position" VALUES (2, 'Directeur Général', NULL, true, 1, '2026-07-13 11:26:39.388', '2026-07-13 11:26:39.388', true, false);
INSERT INTO public."Position" VALUES (3, 'Responsable RH', NULL, true, 2, '2026-07-13 11:28:11.754', '2026-07-13 11:28:11.754', true, false);
INSERT INTO public."Position" VALUES (4, 'Commercial', NULL, true, 4, '2026-07-13 11:32:04.247', '2026-07-13 11:32:04.247', true, false);


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Role" VALUES (1, 'ADMIN', 'Administrateur système', '2026-07-10 11:30:53.423', '2026-07-10 11:30:53.423');
INSERT INTO public."Role" VALUES (2, 'EMPLOYEE', 'Employé', '2026-07-10 11:30:53.442', '2026-07-10 11:30:53.442');
INSERT INTO public."Role" VALUES (3, 'HR', 'Service des Ressources Humaines', '2026-07-10 11:30:53.445', '2026-07-10 11:30:53.445');
INSERT INTO public."Role" VALUES (4, 'DIRECTOR', 'Direction', '2026-07-10 11:30:53.447', '2026-07-10 11:30:53.447');


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."User" VALUES (14, 'employee@siap-pharma.com', '$2b$10$/5aSrdrisKmdDAkXwSys2uSVrMTrWBbN3jogMexEwD/RdCzL1zlZq', true, false, NULL, NULL, 2, '2026-07-14 13:13:26.349', '2026-07-15 14:03:25.576', 'Jean', 'Homme', 'Douala', true);
INSERT INTO public."User" VALUES (2, 'rh@siap-pharma.com', '$2b$10$2n9A1feMPOIZmU/VTb8utOlv6.TbOszJy2TnBnt1lQpKlHSIUpHgm', true, false, NULL, NULL, 3, '2026-07-10 11:33:22.994', '2026-07-15 14:03:49.738', 'Marie', 'Femme', 'Eyenga', true);
INSERT INTO public."User" VALUES (4, 'employe@siap-pharma.com', '$2b$10$sk6rl/jl9l4b/.HRj2qVzOB12.jQ1gwhVkBC07REsgpg35MGjeR2C', true, false, NULL, NULL, 2, '2026-07-10 11:33:23.224', '2026-07-15 14:04:04.809', NULL, NULL, NULL, true);
INSERT INTO public."User" VALUES (3, 'directeur@siap-pharma.com', '$2b$10$niwMEkZ6k2A9FUROSZu1vOe4CRb0JMdyOsZ9jHyE2qyStH/ue4c8W', true, false, NULL, NULL, 4, '2026-07-10 11:33:23.133', '2026-07-13 11:27:17.575', NULL, NULL, NULL, true);
INSERT INTO public."User" VALUES (11, 'fabenzorosier@gmail.com', '$2b$10$omsERMj.8PLjt7LDMTsSleQLSIurdhr.PXc6lleG51Vhc.w9WsPrO', true, false, NULL, NULL, 2, '2026-07-10 16:50:08.053', '2026-07-13 12:07:11.084', 'Fabenzo', 'Homme', 'Rosier', true);
INSERT INTO public."User" VALUES (1, 'admin@siap-pharma.com', '$2b$10$Vmh9OVZdE/5Ht9PCXHMN6OSVprkMLw5sII51EKx.Kn43A9eKhewd6', true, false, NULL, NULL, 1, '2026-07-10 11:33:22.867', '2026-07-14 14:11:52.178', NULL, NULL, NULL, true);
INSERT INTO public."User" VALUES (15, 'fabenzo@gmail.com', '$2b$10$xbJl78dj8oFPHEseiF1MDueYKtjldhvOTyLy9zQ2FJL2n1oZ6z2Aq', true, true, NULL, NULL, 2, '2026-07-14 14:03:54.241', '2026-07-15 14:48:31.137', 'Jean', 'Homme', 'Yves', false);


--
-- Data for Name: Employee; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Employee" VALUES (4, 'Admin', 'Système', '2024-01-01 00:00:00', 'Administrateur', 1, 1, '2026-07-10 11:33:23.236', '2026-07-10 11:33:23.236', 'ADM-001', NULL);
INSERT INTO public."Employee" VALUES (6, 'Fabenzo', 'Rosier', '2026-07-13 00:00:00', 'Développeur', 11, 3, '2026-07-13 08:33:13.595', '2026-07-13 07:40:22.78', 'EMP-002', 1);
INSERT INTO public."Employee" VALUES (2, 'Pierre', 'Owona', '2020-01-01 00:00:00', 'Directeur Général', 3, 1, '2026-07-10 11:33:23.139', '2026-07-13 11:27:17.64', 'DIR-001', 2);
INSERT INTO public."Employee" VALUES (7, 'Jean', 'Douala', '2026-07-14 00:00:00', 'Développeur', 14, 3, '2026-07-14 13:13:27.073', '2026-07-15 14:03:25.635', 'employee-8cb7', 1);
INSERT INTO public."Employee" VALUES (1, 'Marie', 'Eyenga', '2022-06-01 00:00:00', 'Responsable RH', 2, 2, '2026-07-10 11:33:23.001', '2026-07-15 14:03:49.742', 'RH-001', 3);
INSERT INTO public."Employee" VALUES (3, 'Jean', 'Kenfack', '2020-01-15 00:00:00', 'Commercial', 4, 4, '2026-07-10 11:33:23.228', '2026-07-15 14:04:04.815', 'EMP-001', 4);
INSERT INTO public."Employee" VALUES (8, 'Jean', 'Yves', '2026-07-14 00:00:00', 'Développeur', 15, 3, '2026-07-14 14:03:54.574', '2026-07-15 14:48:31.14', 'fabenzo-nnip', 1);


--
-- Data for Name: AnnualLeavePlanning; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."AnnualLeavePlanning" VALUES (1, 3, 2026, 1, 2, '2026-07-10 13:24:10.208', '2026-07-10 13:24:10.208');
INSERT INTO public."AnnualLeavePlanning" VALUES (2, 2, 2026, 3, 2, '2026-07-10 13:37:07.694', '2026-07-10 13:37:07.694');


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."AuditLog" VALUES (1, 'OTP_GENERATED', 'USER', 11, NULL, NULL, 11, '2026-07-13 07:43:06.653');
INSERT INTO public."AuditLog" VALUES (2, 'OTP_VERIFIED', 'USER', 11, NULL, NULL, 11, '2026-07-13 07:45:15.513');
INSERT INTO public."AuditLog" VALUES (3, 'PASSWORD_RESET', 'USER', 11, NULL, NULL, 11, '2026-07-13 07:45:43.109');
INSERT INTO public."AuditLog" VALUES (4, 'OTP_GENERATED', 'USER', 11, NULL, NULL, 11, '2026-07-13 08:03:31.847');
INSERT INTO public."AuditLog" VALUES (5, 'OTP_GENERATED', 'USER', 11, NULL, NULL, 11, '2026-07-13 10:23:16.063');
INSERT INTO public."AuditLog" VALUES (6, 'OTP_GENERATED', 'USER', 11, NULL, NULL, 11, '2026-07-13 11:12:02.63');
INSERT INTO public."AuditLog" VALUES (7, 'OTP_GENERATED', 'USER', 11, NULL, NULL, 11, '2026-07-13 11:17:33.07');
INSERT INTO public."AuditLog" VALUES (8, 'OTP_GENERATED', 'USER', 11, NULL, NULL, 11, '2026-07-13 12:06:15.188');
INSERT INTO public."AuditLog" VALUES (9, 'OTP_VERIFIED', 'USER', 11, NULL, NULL, 11, '2026-07-13 12:07:01.877');
INSERT INTO public."AuditLog" VALUES (10, 'PASSWORD_RESET', 'USER', 11, NULL, NULL, 11, '2026-07-13 12:07:11.147');
INSERT INTO public."AuditLog" VALUES (11, 'OTP_GENERATED', 'USER', 11, NULL, NULL, 11, '2026-07-14 12:28:25.086');
INSERT INTO public."AuditLog" VALUES (12, 'OTP_INVALID_ATTEMPT', 'USER', 11, NULL, NULL, 11, '2026-07-14 12:28:43.7');
INSERT INTO public."AuditLog" VALUES (13, 'OTP_INVALID_ATTEMPT', 'USER', 11, NULL, NULL, 11, '2026-07-14 12:29:05.427');
INSERT INTO public."AuditLog" VALUES (14, 'OTP_VERIFIED', 'USER', 11, NULL, NULL, 11, '2026-07-14 12:29:10.356');
INSERT INTO public."AuditLog" VALUES (15, 'USER_ACTIVATED', 'USER', 15, '{"email": "fabenzo@gmail.com", "isActive": false}', '{"email": "fabenzo@gmail.com", "isActive": true, "changedFields": ["isActive"]}', 1, '2026-07-14 14:40:56.679');
INSERT INTO public."AuditLog" VALUES (16, 'USER_MODIFIED', 'USER', 15, '{"email": "fabenzo@gmail.com", "isActive": true}', '{"email": "fabenzo@gmail.com", "isActive": true, "changedFields": ["firstName"]}', 1, '2026-07-14 15:17:19.216');
INSERT INTO public."AuditLog" VALUES (17, 'USER_MODIFIED', 'USER', 15, '{"email": "fabenzo@gmail.com", "isActive": true}', '{"email": "fabenzo@gmail.com", "isActive": true, "changedFields": ["firstName"]}', 1, '2026-07-14 16:32:02.675');
INSERT INTO public."AuditLog" VALUES (18, 'EMPLOYEE_MODIFIED', 'EMPLOYEE', 8, '{"lastName": "Yves", "firstName": "Jean", "positionId": 1, "departmentId": 3}', '{"lastName": "Yves", "firstName": "Jonas", "positionId": 1, "departmentId": 3, "changedFields": ["firstName", "hireDate"]}', 1, '2026-07-14 16:32:25.333');
INSERT INTO public."AuditLog" VALUES (19, 'EMPLOYEE_MODIFIED', 'EMPLOYEE', 7, '{"lastName": "Douala", "firstName": "Jean", "positionId": null, "departmentId": 4}', '{"lastName": "Douala", "firstName": "Jean", "positionId": 4, "departmentId": 4, "changedFields": ["positionId", "hireDate"]}', 1, '2026-07-14 16:33:06.253');
INSERT INTO public."AuditLog" VALUES (20, 'EMPLOYEE_POSITION_CHANGED', 'EMPLOYEE', 7, '{"positionId": null, "positionName": null}', '{"positionId": 4, "positionName": "Commercial"}', 1, '2026-07-14 16:33:06.256');
INSERT INTO public."AuditLog" VALUES (21, 'EMPLOYEE_MODIFIED', 'EMPLOYEE', 7, '{"lastName": "Douala", "firstName": "Jean", "positionId": 4, "departmentId": 4}', '{"lastName": "Douala", "firstName": "Jean", "positionId": 4, "departmentId": 3, "changedFields": ["departmentId", "positionId", "hireDate"]}', 1, '2026-07-14 16:33:16.98');
INSERT INTO public."AuditLog" VALUES (22, 'EMPLOYEE_DEPT_CHANGED', 'EMPLOYEE', 7, '{"departmentId": 4, "departmentName": "Commercial"}', '{"departmentId": 3, "departmentName": "Informatique"}', 1, '2026-07-14 16:33:16.987');
INSERT INTO public."AuditLog" VALUES (23, 'EMPLOYEE_POSITION_CHANGED', 'EMPLOYEE', 7, '{"positionId": 4, "positionName": "Commercial"}', '{"positionId": null, "positionName": "Commercial"}', 1, '2026-07-14 16:33:16.991');
INSERT INTO public."AuditLog" VALUES (24, 'EMPLOYEE_MODIFIED', 'EMPLOYEE', 7, '{"lastName": "Douala", "firstName": "Jean", "positionId": 4, "departmentId": 3}', '{"lastName": "Douala", "firstName": "Jean", "positionId": 1, "departmentId": 3, "changedFields": ["positionId", "hireDate"]}', 1, '2026-07-14 16:33:36.03');
INSERT INTO public."AuditLog" VALUES (25, 'EMPLOYEE_POSITION_CHANGED', 'EMPLOYEE', 7, '{"positionId": 4, "positionName": "Commercial"}', '{"positionId": 1, "positionName": "Développeur"}', 1, '2026-07-14 16:33:36.084');
INSERT INTO public."AuditLog" VALUES (26, 'USER_MODIFIED', 'USER', 2, '{"email": "rh@siap-pharma.com", "isActive": true}', '{"email": "rh@siap-pharma.com", "isActive": true, "changedFields": ["firstName", "lastName"]}', 1, '2026-07-14 16:50:30.74');
INSERT INTO public."AuditLog" VALUES (27, 'EMPLOYEE_MODIFIED', 'EMPLOYEE', 7, '{"lastName": "Douala", "firstName": "Jean", "positionId": 1, "departmentId": 3}', '{"lastName": "Douala", "firstName": "Jean", "positionId": 1, "departmentId": 3, "changedFields": ["hireDate"]}', 1, '2026-07-15 14:03:25.648');
INSERT INTO public."AuditLog" VALUES (28, 'EMPLOYEE_MODIFIED', 'EMPLOYEE', 1, '{"lastName": "Eyenga", "firstName": "Marie", "positionId": 3, "departmentId": 2}', '{"lastName": "Eyenga", "firstName": "Marie", "positionId": 3, "departmentId": 2, "changedFields": ["hireDate"]}', 1, '2026-07-15 14:03:49.755');
INSERT INTO public."AuditLog" VALUES (29, 'EMPLOYEE_MODIFIED', 'EMPLOYEE', 3, '{"lastName": "Kenfack", "firstName": "Jean", "positionId": 4, "departmentId": 3}', '{"lastName": "Kenfack", "firstName": "Jean", "positionId": 4, "departmentId": 4, "changedFields": ["departmentId", "hireDate"]}', 1, '2026-07-15 14:04:04.826');
INSERT INTO public."AuditLog" VALUES (30, 'EMPLOYEE_DEPT_CHANGED', 'EMPLOYEE', 3, '{"departmentId": 3, "departmentName": "Informatique"}', '{"departmentId": 4, "departmentName": "Commercial"}', 1, '2026-07-15 14:04:04.843');
INSERT INTO public."AuditLog" VALUES (31, 'EMPLOYEE_MODIFIED', 'EMPLOYEE', 8, '{"lastName": "Yves", "firstName": "Jonas", "positionId": 1, "departmentId": 3}', '{"lastName": "Yves", "firstName": "ubyuuvyydvcdaibciydicybaeyicyhbasicybayhibciyabsiy", "positionId": 1, "departmentId": 3, "changedFields": ["firstName", "hireDate"]}', 1, '2026-07-15 14:15:51.199');
INSERT INTO public."AuditLog" VALUES (32, 'EMPLOYEE_MODIFIED', 'EMPLOYEE', 8, '{"lastName": "Yves", "firstName": "ubyuuvyydvcdaibciydicybaeyicyhbasicybayhibciyabsiy", "positionId": 1, "departmentId": 3}', '{"lastName": "Yves", "firstName": "Jonas", "positionId": 1, "departmentId": 3, "changedFields": ["firstName", "hireDate"]}', 1, '2026-07-15 14:16:08.541');
INSERT INTO public."AuditLog" VALUES (33, 'USER_MODIFIED', 'USER', 15, '{"email": "fabenzo@gmail.com", "isActive": true}', '{"email": "fabenzo@gmail.com", "isActive": true, "changedFields": ["firstName"]}', 1, '2026-07-15 14:16:53.902');
INSERT INTO public."AuditLog" VALUES (34, 'USER_MODIFIED', 'USER', 15, '{"email": "fabenzo@gmail.com", "isActive": true}', '{"email": "fabenzo@gmail.com", "isActive": true, "changedFields": ["firstName"]}', 1, '2026-07-15 14:17:10.524');
INSERT INTO public."AuditLog" VALUES (35, 'EMPLOYEE_MODIFIED', 'EMPLOYEE', 8, '{"lastName": "Yves", "firstName": "Jonas", "positionId": 1, "departmentId": 3}', '{"lastName": "Yves", "firstName": "nionvdvnci", "positionId": 1, "departmentId": 3, "changedFields": ["firstName", "hireDate"]}', 1, '2026-07-15 14:31:07.81');
INSERT INTO public."AuditLog" VALUES (36, 'EMPLOYEE_MODIFIED', 'EMPLOYEE', 8, '{"lastName": "Yves", "firstName": "nionvdvnci", "positionId": 1, "departmentId": 3}', '{"lastName": "Yves", "firstName": "Jonas", "positionId": 1, "departmentId": 3, "changedFields": ["firstName", "hireDate"]}', 1, '2026-07-15 14:35:25.829');
INSERT INTO public."AuditLog" VALUES (37, 'EMPLOYEE_MODIFIED', 'EMPLOYEE', 8, '{"lastName": "Yves", "firstName": "Jonas", "positionId": 1, "departmentId": 3}', '{"lastName": "Yves", "firstName": "Jean", "positionId": 1, "departmentId": 3, "changedFields": ["firstName", "hireDate"]}', 1, '2026-07-15 14:48:31.15');


--
-- Data for Name: LeaveType; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."LeaveType" VALUES (1, 'Congé annuel', 'Congés payés annuels', 25, true, '2026-07-10 11:33:22.879', '2026-07-10 12:24:02.606', '#0B6B3A', true, 'Calendar', 30, 1, true, false, true);
INSERT INTO public."LeaveType" VALUES (2, 'Congé maladie', 'Congé pour raison médicale', 15, true, '2026-07-10 11:33:22.884', '2026-07-10 12:24:02.629', '#D91F26', false, 'HeartPulse', NULL, 1, false, true, true);
INSERT INTO public."LeaveType" VALUES (3, 'Congé maternité', 'Congé pour maternité', 98, true, '2026-07-10 11:33:22.889', '2026-07-10 12:24:02.631', '#8DBB52', false, 'Baby', 98, 14, false, true, true);
INSERT INTO public."LeaveType" VALUES (4, 'Permission exceptionnelle', 'Permission pour événement familial', 5, true, '2026-07-10 11:33:22.892', '2026-07-10 12:24:02.633', '#F59E0B', true, 'Star', 5, 1, false, false, false);
INSERT INTO public."LeaveType" VALUES (5, 'Congé sans solde', 'Congé non rémunéré', 0, true, '2026-07-10 11:33:22.896', '2026-07-10 12:24:02.635', '#6B7280', false, 'Clock', NULL, 1, true, false, true);


--
-- Data for Name: LeaveBalance; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."LeaveBalance" VALUES (301, 2026, 0, 0, 0, 7, 1, '2026-07-14 13:13:27.573', '2026-07-16 08:42:42.972', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (302, 2026, 15, 0, 0, 7, 2, '2026-07-14 13:13:28.039', '2026-07-16 08:42:42.974', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (303, 2026, 98, 0, 0, 7, 3, '2026-07-14 13:13:28.041', '2026-07-16 08:42:42.976', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (304, 2026, 0, 0, 0, 7, 5, '2026-07-14 13:13:28.043', '2026-07-16 08:42:42.979', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (305, 2026, 5, 0, 0, 7, 4, '2026-07-14 13:13:28.045', '2026-07-16 08:42:42.981', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (16, 2026, 18, 0, 0, 1, 1, '2026-07-13 14:13:57.304', '2026-07-16 08:42:42.998', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (17, 2026, 15, 0, 0, 1, 2, '2026-07-13 14:13:57.337', '2026-07-16 08:42:43', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (18, 2026, 98, 0, 0, 1, 3, '2026-07-13 14:13:57.351', '2026-07-16 08:42:43.002', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (19, 2026, 0, 0, 0, 1, 5, '2026-07-13 14:13:57.354', '2026-07-16 08:42:43.003', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (20, 2026, 5, 0, 0, 1, 4, '2026-07-13 14:13:57.356', '2026-07-16 08:42:43.005', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (21, 2026, 20, 0, 12, 3, 1, '2026-07-13 14:13:57.386', '2026-07-16 08:42:43.044', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (22, 2026, 15, 0, 0, 3, 2, '2026-07-13 14:13:57.403', '2026-07-16 08:42:43.236', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (23, 2026, 98, 0, 0, 3, 3, '2026-07-13 14:13:57.405', '2026-07-16 08:42:43.238', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (24, 2026, 0, 0, 0, 3, 5, '2026-07-13 14:13:57.407', '2026-07-16 08:42:43.24', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (25, 2026, 5, 0, 0, 3, 4, '2026-07-13 14:13:57.409', '2026-07-16 08:42:43.242', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (336, 2026, 0, 0, 0, 8, 1, '2026-07-14 14:03:54.891', '2026-07-16 08:42:43.262', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (337, 2026, 15, 0, 0, 8, 2, '2026-07-14 14:03:54.919', '2026-07-16 08:42:43.265', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (338, 2026, 98, 0, 0, 8, 3, '2026-07-14 14:03:54.921', '2026-07-16 08:42:43.267', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (339, 2026, 0, 0, 0, 8, 5, '2026-07-14 14:03:54.923', '2026-07-16 08:42:43.269', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (340, 2026, 5, 0, 0, 8, 4, '2026-07-14 14:03:54.926', '2026-07-16 08:42:43.271', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (1, 2026, 18, 0, 0, 4, 1, '2026-07-13 14:13:56.84', '2026-07-16 08:42:42.666', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (2, 2026, 15, 0, 0, 4, 2, '2026-07-13 14:13:57.109', '2026-07-16 08:42:42.89', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (3, 2026, 98, 0, 0, 4, 3, '2026-07-13 14:13:57.136', '2026-07-16 08:42:42.892', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (4, 2026, 0, 0, 0, 4, 5, '2026-07-13 14:13:57.142', '2026-07-16 08:42:42.894', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (5, 2026, 5, 0, 0, 4, 4, '2026-07-13 14:13:57.157', '2026-07-16 08:42:42.896', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (6, 2026, 0, 0, 0, 6, 1, '2026-07-13 14:13:57.184', '2026-07-16 08:42:42.916', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (7, 2026, 15, 0, 0, 6, 2, '2026-07-13 14:13:57.186', '2026-07-16 08:42:42.919', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (8, 2026, 98, 0, 0, 6, 3, '2026-07-13 14:13:57.189', '2026-07-16 08:42:42.921', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (9, 2026, 0, 0, 0, 6, 5, '2026-07-13 14:13:57.224', '2026-07-16 08:42:42.923', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (10, 2026, 5, 0, 0, 6, 4, '2026-07-13 14:13:57.227', '2026-07-16 08:42:42.925', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (11, 2026, 20, 0, 0, 2, 1, '2026-07-13 14:13:57.259', '2026-07-16 08:42:42.944', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (12, 2026, 15, 0, 0, 2, 2, '2026-07-13 14:13:57.261', '2026-07-16 08:42:42.945', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (13, 2026, 98, 0, 0, 2, 3, '2026-07-13 14:13:57.263', '2026-07-16 08:42:42.948', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (14, 2026, 0, 0, 0, 2, 5, '2026-07-13 14:13:57.266', '2026-07-16 08:42:42.95', 0, 'ACTIF');
INSERT INTO public."LeaveBalance" VALUES (15, 2026, 5, 0, 0, 2, 4, '2026-07-13 14:13:57.268', '2026-07-16 08:42:42.952', 0, 'ACTIF');


--
-- Data for Name: BalanceAdjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: DecisionAnalysis; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: EmployeeReplacement; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Skill; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: EmployeeSkill; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Holiday; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: InternalEvent; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: LeaveCampaign; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."LeaveCampaign" VALUES (1, 2026, 'Campagne 2026', 'CLOTUREE', '2026-07-13 15:06:36.604', '2026-07-13 15:23:01.726');
INSERT INTO public."LeaveCampaign" VALUES (2, 2025, 'Campagne 2025', 'OUVERTE', '2026-07-13 15:38:41.106', '2026-07-13 15:38:52.609');


--
-- Data for Name: LeaveProposal; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."LeaveProposal" VALUES (1, '2026-07-15 00:00:00', 'Voici ma proposition de date.', 'REPROGRAMMEE', 1, 2, '2026-07-13 15:21:36.737', '2026-07-13 15:23:04.808', NULL, 'PENDING', 0, NULL, NULL);
INSERT INTO public."LeaveProposal" VALUES (2, '2025-01-10 00:00:00', 'Bien', 'RECUE', 2, 1, '2026-07-13 15:39:45.493', '2026-07-13 15:39:45.556', '{"results": [{"status": "COMPATIBLE", "message": "Aucun conflit détecté dans le département", "ruleName": "DeptConflictRule", "severity": "INFO"}], "computedAt": "2026-07-13T15:39:45.550Z"}', 'COMPATIBLE', 18, NULL, NULL);


--
-- Data for Name: LeaveRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."LeaveRequest" VALUES (1, '2026-07-10 00:00:00', '2026-07-20 00:00:00', 9, 'J''en ai besoin', 'APPROUVE', 'Je pense qu''on devrait accepter', 'Favorable', 'D''accord', '2026-07-10 13:41:09.558', '2026-07-10 13:42:16.878', 3, 2, 1, 2, 3, '2026-07-10 13:39:02.426', '2026-07-10 13:42:16.885');
INSERT INTO public."LeaveRequest" VALUES (2, '2026-07-14 00:00:00', '2026-08-14 00:00:00', 28, 'Je dois me reposer', 'EN_ATTENTE_RH', NULL, NULL, NULL, NULL, NULL, 3, 1, 1, NULL, NULL, '2026-07-13 11:36:00.727', '2026-07-13 11:36:00.727');
INSERT INTO public."LeaveRequest" VALUES (3, '2026-08-07 00:00:00', '2026-08-20 00:00:00', 12, 'jiubvvyvi9ygiy', 'EN_ATTENTE_RH', NULL, NULL, NULL, NULL, NULL, 3, 1, 1, NULL, NULL, '2026-07-14 12:03:27.717', '2026-07-14 12:03:27.717');


--
-- Data for Name: LeaveRequestHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."LeaveRequestHistory" VALUES (1, NULL, 'EN_ATTENTE_RH', NULL, 4, 2, '2026-07-13 11:36:00.756');
INSERT INTO public."LeaveRequestHistory" VALUES (2, NULL, 'EN_ATTENTE_RH', NULL, 4, 3, '2026-07-14 12:03:27.833');


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Notification" VALUES (1, 'Bienvenue sur Gestion Congés', 'Bienvenue ! Vous pouvez dès à présent soumettre vos demandes de congés et permissions depuis votre espace.', true, 'INFO', 4, '2026-07-10 12:01:38.689', NULL, NULL, NULL);
INSERT INTO public."Notification" VALUES (2, 'Bienvenue sur Gestion Congés', 'Bienvenue ! Vous pouvez dès à présent soumettre vos demandes de congés et permissions depuis votre espace.', true, 'INFO', 1, '2026-07-10 12:09:31.653', NULL, NULL, NULL);
INSERT INTO public."Notification" VALUES (3, 'Bienvenue sur Gestion Congés', 'Bienvenue ! Vous pouvez dès à présent soumettre vos demandes de congés et permissions depuis votre espace.', true, 'INFO', 2, '2026-07-10 13:01:48.824', NULL, NULL, NULL);
INSERT INTO public."Notification" VALUES (4, 'Nouvelle demande de congé', 'employe@siap-pharma.com a soumis une demande de Congé maladie du 10/07/2026 au 20/07/2026', true, 'LEAVE_CREATED', 2, '2026-07-10 13:39:02.486', NULL, NULL, NULL);
INSERT INTO public."Notification" VALUES (7, 'Bienvenue sur Gestion Congés', 'Bienvenue ! Vous pouvez dès à présent soumettre vos demandes de congés et permissions depuis votre espace.', true, 'INFO', 3, '2026-07-10 13:41:39.45', NULL, NULL, NULL);
INSERT INTO public."Notification" VALUES (6, 'Avis RH donné', 'Le RH a examiné la demande de employe@siap-pharma.com. Décision requise.', true, 'LEAVE_RH_REVIEWED', 3, '2026-07-10 13:41:09.586', NULL, NULL, NULL);
INSERT INTO public."Notification" VALUES (8, 'Demande de congé approuvée', 'Votre demande de congé a été approuvée par la direction.', true, 'LEAVE_DECIDED', 4, '2026-07-10 13:42:16.9', NULL, NULL, NULL);
INSERT INTO public."Notification" VALUES (5, 'Demande de congé examinée', 'Votre demande de congé a été examinée par le RH. En attente de décision de la direction.', true, 'LEAVE_RH_REVIEWED', 4, '2026-07-10 13:41:09.586', NULL, NULL, NULL);
INSERT INTO public."Notification" VALUES (10, 'Département créé', 'Le département Informatique a été créé.', true, 'DEPARTMENT_CREATED', 1, '2026-07-10 16:53:49.954', 3, 'DEPARTMENT', '/departments');
INSERT INTO public."Notification" VALUES (9, 'Utilisateur créé', 'L''utilisateur fabenzorosier@gmail.com a été créé avec le rôle EMPLOYEE.', true, 'USER_CREATED', 1, '2026-07-10 16:50:12.427', 11, 'USER', '/users');
INSERT INTO public."Notification" VALUES (11, 'Poste créé', 'Le poste Développeur a été créé.', true, 'POSITION_CREATED', 1, '2026-07-10 16:54:15.136', 1, 'POSITION', '/departments');
INSERT INTO public."Notification" VALUES (12, 'Employé modifié', 'Les informations de Fabenzo Rosier ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-13 07:40:23.047', 6, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (13, 'Bienvenue sur Gestion Congés', 'Bienvenue ! Vous pouvez dès à présent soumettre vos demandes de congés et permissions depuis votre espace.', true, 'INFO', 11, '2026-07-13 07:41:41.432', NULL, NULL, NULL);
INSERT INTO public."Notification" VALUES (14, 'Poste créé', 'Le poste Directeur Général a été créé.', true, 'POSITION_CREATED', 1, '2026-07-13 11:26:39.524', 2, 'POSITION', '/departments');
INSERT INTO public."Notification" VALUES (15, 'Employé modifié', 'Les informations de Pierre Owona ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-13 11:27:17.693', 2, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (16, 'Poste créé', 'Le poste Responsable RH a été créé.', true, 'POSITION_CREATED', 1, '2026-07-13 11:28:11.785', 3, 'POSITION', '/departments');
INSERT INTO public."Notification" VALUES (17, 'Employé modifié', 'Les informations de Marie Eyenga ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-13 11:28:45.394', 1, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (18, 'Département créé', 'Le département Commercial a été créé.', true, 'DEPARTMENT_CREATED', 1, '2026-07-13 11:31:46.844', 4, 'DEPARTMENT', '/departments');
INSERT INTO public."Notification" VALUES (19, 'Poste créé', 'Le poste Commercial a été créé.', true, 'POSITION_CREATED', 1, '2026-07-13 11:32:04.271', 4, 'POSITION', '/departments');
INSERT INTO public."Notification" VALUES (20, 'Employé modifié', 'Les informations de Jean Kenfack ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-13 11:32:34.986', 3, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (22, 'Nouvelle demande de congé', 'employe@siap-pharma.com a soumis une demande de Congé annuel du 14/07/2026 au 14/08/2026', true, 'LEAVE_CREATED', 1, '2026-07-13 11:36:00.889', 2, 'LEAVE_REQUEST', '/leave');
INSERT INTO public."Notification" VALUES (21, 'Nouvelle demande de congé', 'employe@siap-pharma.com a soumis une demande de Congé annuel du 14/07/2026 au 14/08/2026', true, 'LEAVE_CREATED', 2, '2026-07-13 11:36:00.889', 2, 'LEAVE_REQUEST', '/leave');
INSERT INTO public."Notification" VALUES (23, 'Nouvelle demande de permission', 'Fabenzo Rosier a soumis une demande de permission du 15/07/2026 au 20/07/2026', true, 'PERMISSION_CREATED', 2, '2026-07-13 12:09:37.083', 1, 'PERMISSION_REQUEST', '/permissions');
INSERT INTO public."Notification" VALUES (25, 'Demande de permission examinée', 'Votre demande de permission a été examinée par le RH (rh@siap-pharma.com). En attente de décision de la direction.', true, 'PERMISSION_RH_REVIEWED', 11, '2026-07-13 12:15:42.293', 1, 'PERMISSION_REQUEST', '/permissions');
INSERT INTO public."Notification" VALUES (26, 'Demande de permission approuvée', 'Votre demande de permission a été approuvée par directeur@siap-pharma.com.', true, 'PERMISSION_DECIDED', 11, '2026-07-13 12:17:33.445', 1, 'PERMISSION_REQUEST', '/permissions');
INSERT INTO public."Notification" VALUES (24, 'Nouvelle demande de permission', 'Fabenzo Rosier a soumis une demande de permission du 15/07/2026 au 20/07/2026', true, 'PERMISSION_CREATED', 1, '2026-07-13 12:09:37.083', 1, 'PERMISSION_REQUEST', '/permissions');
INSERT INTO public."Notification" VALUES (27, 'Programmation annuelle des congés', 'La campagne Campagne 2026 est ouverte. Veuillez proposer votre période souhaitée de départ en congé.', true, 'CAMPAIGN_OPENED', 3, '2026-07-13 15:06:50.889', 0, 'CAMPAIGN', '/my-campaign');
INSERT INTO public."Notification" VALUES (28, 'Programmation annuelle des congés', 'La campagne Campagne 2026 est ouverte. Veuillez proposer votre période souhaitée de départ en congé.', true, 'CAMPAIGN_OPENED', 2, '2026-07-13 15:06:50.889', 0, 'CAMPAIGN', '/my-campaign');
INSERT INTO public."Notification" VALUES (30, 'Programmation annuelle des congés', 'La campagne Campagne 2025 est ouverte. Veuillez proposer votre période souhaitée de départ en congé.', true, 'CAMPAIGN_OPENED', 2, '2026-07-13 15:38:52.775', 0, 'CAMPAIGN', '/my-campaign');
INSERT INTO public."Notification" VALUES (31, 'Utilisateur désactivé', 'Le compte de employe@siap-pharma.com a été désactivé.', true, 'USER_DEACTIVATED', 1, '2026-07-14 12:01:12.544', 4, 'USER', '/users');
INSERT INTO public."Notification" VALUES (32, 'Utilisateur activé', 'Le compte de employe@siap-pharma.com a été activé.', true, 'USER_ACTIVATED', 1, '2026-07-14 12:02:13.202', 4, 'USER', '/users');
INSERT INTO public."Notification" VALUES (34, 'Nouvelle demande de congé', 'employe@siap-pharma.com a soumis une demande de Congé annuel du 07/08/2026 au 20/08/2026', true, 'LEAVE_CREATED', 1, '2026-07-14 12:03:27.953', 3, 'LEAVE_REQUEST', '/leave');
INSERT INTO public."Notification" VALUES (35, 'Utilisateur créé', 'L''utilisateur employee@siap-pharma.com a été créé avec le rôle EMPLOYEE.', true, 'USER_CREATED', 1, '2026-07-14 13:13:27.749', 14, 'USER', '/users');
INSERT INTO public."Notification" VALUES (36, 'Bienvenue sur Gestion Congés', 'Bienvenue ! Vous pouvez dès à présent soumettre vos demandes de congés et permissions depuis votre espace.', true, 'INFO', 14, '2026-07-14 13:13:57.508', NULL, NULL, NULL);
INSERT INTO public."Notification" VALUES (33, 'Nouvelle demande de congé', 'employe@siap-pharma.com a soumis une demande de Congé annuel du 07/08/2026 au 20/08/2026', true, 'LEAVE_CREATED', 2, '2026-07-14 12:03:27.953', 3, 'LEAVE_REQUEST', '/leave');
INSERT INTO public."Notification" VALUES (37, 'Utilisateur créé', 'L''utilisateur fabenzo@gmail.com a été créé avec le rôle EMPLOYEE.', true, 'USER_CREATED', 1, '2026-07-14 14:03:54.677', 15, 'USER', '/users');
INSERT INTO public."Notification" VALUES (38, 'Utilisateur désactivé', 'Le compte de fabenzo@gmail.com a été désactivé.', true, 'USER_DEACTIVATED', 1, '2026-07-14 14:04:11.865', 15, 'USER', '/users');
INSERT INTO public."Notification" VALUES (39, 'Utilisateur modifié', 'Le compte de fabenzo@gmail.com a été modifié.', true, 'USER_MODIFIED', 1, '2026-07-14 14:06:08.14', 15, 'USER', '/users');
INSERT INTO public."Notification" VALUES (40, 'Utilisateur activé', 'Le compte de fabenzo@gmail.com a été activé.', true, 'USER_ACTIVATED', 1, '2026-07-14 14:21:36.071', 15, 'USER', '/users');
INSERT INTO public."Notification" VALUES (41, 'Utilisateur désactivé', 'Le compte de fabenzo@gmail.com a été désactivé.', true, 'USER_DEACTIVATED', 1, '2026-07-14 14:21:37.016', 15, 'USER', '/users');
INSERT INTO public."Notification" VALUES (42, 'Utilisateur activé', 'Le compte de fabenzo@gmail.com a été activé.', true, 'USER_ACTIVATED', 1, '2026-07-14 14:40:56.727', 15, 'USER', '/users');
INSERT INTO public."Notification" VALUES (29, 'Programmation annuelle des congés', 'La campagne Campagne 2025 est ouverte. Veuillez proposer votre période souhaitée de départ en congé.', true, 'CAMPAIGN_OPENED', 3, '2026-07-13 15:38:52.775', 0, 'CAMPAIGN', '/my-campaign');
INSERT INTO public."Notification" VALUES (43, 'Employé modifié', 'Les informations de Christian Yves ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-14 14:50:01.911', 8, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (45, 'Employé modifié', 'Les informations de Jean Kenfack ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-14 15:08:46.766', 3, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (44, 'Employé modifié', 'Les informations de Jean Kenfack ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-14 15:06:04.183', 3, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (46, 'Utilisateur modifié', 'Le compte de fabenzo@gmail.com a été modifié.', true, 'USER_MODIFIED', 1, '2026-07-14 15:17:19.277', 15, 'USER', '/users');
INSERT INTO public."Notification" VALUES (47, 'Utilisateur modifié', 'Le compte de fabenzo@gmail.com a été modifié.', true, 'USER_MODIFIED', 1, '2026-07-14 16:32:02.766', 15, 'USER', '/users');
INSERT INTO public."Notification" VALUES (48, 'Employé modifié', 'Les informations de Jonas Yves ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-14 16:32:25.367', 8, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (49, 'Employé modifié', 'Les informations de Jean Douala ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-14 16:33:06.263', 7, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (50, 'Employé modifié', 'Les informations de Jean Douala ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-14 16:33:17.051', 7, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (51, 'Employé modifié', 'Les informations de Jean Douala ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-14 16:33:36.13', 7, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (52, 'Utilisateur modifié', 'Le compte de rh@siap-pharma.com a été modifié.', true, 'USER_MODIFIED', 1, '2026-07-14 16:50:30.792', 2, 'USER', '/users');
INSERT INTO public."Notification" VALUES (53, 'Employé modifié', 'Les informations de Jean Douala ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-15 14:03:25.89', 7, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (54, 'Employé modifié', 'Les informations de Marie Eyenga ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-15 14:03:49.761', 1, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (55, 'Employé modifié', 'Les informations de Jean Kenfack ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-15 14:04:04.854', 3, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (56, 'Employé modifié', 'Les informations de ubyuuvyydvcdaibciydicybaeyicyhbasicybayhibciyabsiy Yves ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-15 14:15:51.216', 8, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (57, 'Employé modifié', 'Les informations de Jonas Yves ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-15 14:16:08.554', 8, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (58, 'Utilisateur modifié', 'Le compte de fabenzo@gmail.com a été modifié.', true, 'USER_MODIFIED', 1, '2026-07-15 14:16:53.922', 15, 'USER', '/users');
INSERT INTO public."Notification" VALUES (59, 'Utilisateur modifié', 'Le compte de fabenzo@gmail.com a été modifié.', true, 'USER_MODIFIED', 1, '2026-07-15 14:17:10.542', 15, 'USER', '/users');
INSERT INTO public."Notification" VALUES (60, 'Employé modifié', 'Les informations de nionvdvnci Yves ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-15 14:31:07.845', 8, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (61, 'Employé modifié', 'Les informations de Jonas Yves ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-15 14:35:25.844', 8, 'EMPLOYEE', '/employees');
INSERT INTO public."Notification" VALUES (62, 'Employé modifié', 'Les informations de Jean Yves ont été mises à jour.', true, 'EMPLOYEE_MODIFIED', 1, '2026-07-15 14:48:31.209', 8, 'EMPLOYEE', '/employees');


--
-- Data for Name: PasswordResetOtp; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."PasswordResetOtp" VALUES (7, 11, '283249', '2026-07-14 12:38:25.034', true, '2026-07-14 12:28:25.037');


--
-- Data for Name: PermissionRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."PermissionRequest" VALUES (1, '2026-07-15 00:00:00', '2026-07-20 00:00:00', 5, 'J''en ai besoin', 'APPROUVE', 'Je valide', 'Favorable', 'OK, allez y', '2026-07-13 12:15:41.938', '2026-07-13 12:17:33.43', 6, 2, 3, '2026-07-13 12:09:36.992', '2026-07-13 12:17:33.433');


--
-- Data for Name: ProposalAnalysisLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."ProposalAnalysisLog" VALUES (1, 'ANALYSE_EFFECTUEE', 'Analyse terminée : COMPATIBLE', 2, '2026-07-13 15:39:45.583');


--
-- Data for Name: Setting; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public._prisma_migrations VALUES ('708fe51d-0a84-4052-85e4-651233b8cc29', 'a6277d89d5b1a759cf6ac7e300cd4a8cd95528e1faf6e6891e8ef0d6d19afc34', '2026-07-10 12:30:35.237465+01', '20260706082945_init', NULL, NULL, '2026-07-10 12:30:34.370113+01', 1);


--
-- Name: AnnualLeavePlanning_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."AnnualLeavePlanning_id_seq"', 2, true);


--
-- Name: AuditLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."AuditLog_id_seq"', 37, true);


--
-- Name: BalanceAdjustment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."BalanceAdjustment_id_seq"', 1, false);


--
-- Name: DecisionAnalysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DecisionAnalysis_id_seq"', 1, false);


--
-- Name: Department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Department_id_seq"', 4, true);


--
-- Name: EmployeeReplacement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."EmployeeReplacement_id_seq"', 1, false);


--
-- Name: Employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Employee_id_seq"', 8, true);


--
-- Name: Holiday_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Holiday_id_seq"', 1, false);


--
-- Name: InternalEvent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."InternalEvent_id_seq"', 1, false);


--
-- Name: LeaveBalance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."LeaveBalance_id_seq"', 765, true);


--
-- Name: LeaveCampaign_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."LeaveCampaign_id_seq"', 2, true);


--
-- Name: LeaveProposal_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."LeaveProposal_id_seq"', 2, true);


--
-- Name: LeaveRequestHistory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."LeaveRequestHistory_id_seq"', 2, true);


--
-- Name: LeaveRequest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."LeaveRequest_id_seq"', 3, true);


--
-- Name: LeaveType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."LeaveType_id_seq"', 15, true);


--
-- Name: Notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Notification_id_seq"', 62, true);


--
-- Name: PasswordResetOtp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PasswordResetOtp_id_seq"', 7, true);


--
-- Name: PermissionRequest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PermissionRequest_id_seq"', 1, true);


--
-- Name: Position_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Position_id_seq"', 4, true);


--
-- Name: ProposalAnalysisLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ProposalAnalysisLog_id_seq"', 1, true);


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Role_id_seq"', 4, true);


--
-- Name: Setting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Setting_id_seq"', 1, false);


--
-- Name: Skill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Skill_id_seq"', 1, false);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 17, true);


--
-- PostgreSQL database dump complete
--

\unrestrict TztWTdnpHq4EaU6CMlf30LcK3QF2GMnapp0Upw7TRSKoohxBpH9TMYjq76oLWl4

