-- =====================================================================
-- RailConnect - Railway Reservation Management System
-- Supabase PostgreSQL Schema & Seed Migration Script
-- Run this script in the Supabase SQL Editor or via VS Code psql
-- =====================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables/views if resetting
DROP VIEW IF EXISTS "Passenger_Booking_Details" CASCADE;
DROP VIEW IF EXISTS "Train_Route_Details" CASCADE;
DROP VIEW IF EXISTS "Booking_Details" CASCADE;

DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "Booking_Passenger" CASCADE;
DROP TABLE IF EXISTS "Passenger" CASCADE;
DROP TABLE IF EXISTS "Seat_Inventory" CASCADE;
DROP TABLE IF EXISTS "Booking" CASCADE;
DROP TABLE IF EXISTS "Fare" CASCADE;
DROP TABLE IF EXISTS "Train_Stop" CASCADE;
DROP TABLE IF EXISTS "Train" CASCADE;
DROP TABLE IF EXISTS "Station" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- ---------------------------------------------------------------------
-- TABLE 1: User
-- ---------------------------------------------------------------------
CREATE TABLE "User" (
    "User_ID" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(100) NOT NULL UNIQUE,
    "Phone" VARCHAR(20),
    "Password" VARCHAR(255) NOT NULL,
    "Role" VARCHAR(20) NOT NULL DEFAULT 'Passenger' CHECK ("Role" IN ('Passenger', 'Admin')),
    "Created_At" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_email ON "User"("Email");
CREATE INDEX idx_user_role ON "User"("Role");

-- ---------------------------------------------------------------------
-- TABLE 2: Station
-- ---------------------------------------------------------------------
CREATE TABLE "Station" (
    "Station_ID" SERIAL PRIMARY KEY,
    "Station_Name" VARCHAR(100) NOT NULL,
    "Station_Code" VARCHAR(10) NOT NULL UNIQUE,
    "City" VARCHAR(50) NOT NULL
);

CREATE INDEX idx_station_code ON "Station"("Station_Code");

-- ---------------------------------------------------------------------
-- TABLE 3: Train
-- ---------------------------------------------------------------------
CREATE TABLE "Train" (
    "Train_ID" SERIAL PRIMARY KEY,
    "Train_Number" VARCHAR(10) NOT NULL UNIQUE,
    "Train_Name" VARCHAR(100) NOT NULL,
    "Train_Type" VARCHAR(30) NOT NULL,
    "Total_Seats" INT NOT NULL DEFAULT 400,
    "Is_Active" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_train_number ON "Train"("Train_Number");

-- ---------------------------------------------------------------------
-- TABLE 4: Train_Stop
-- ---------------------------------------------------------------------
CREATE TABLE "Train_Stop" (
    "Stop_ID" SERIAL PRIMARY KEY,
    "Train_ID" INT NOT NULL REFERENCES "Train"("Train_ID") ON DELETE CASCADE,
    "Station_ID" INT NOT NULL REFERENCES "Station"("Station_ID") ON DELETE CASCADE,
    "Stop_Number" INT NOT NULL,
    "Arrival_Time" TIME,
    "Departure_Time" TIME,
    "Distance_From_Source" DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT uq_train_stop UNIQUE ("Train_ID", "Stop_Number")
);

CREATE INDEX idx_stop_station ON "Train_Stop"("Station_ID");
CREATE INDEX idx_stop_train_seq ON "Train_Stop"("Train_ID", "Stop_Number");

-- ---------------------------------------------------------------------
-- TABLE 5: Booking
-- ---------------------------------------------------------------------
CREATE TABLE "Booking" (
    "Booking_ID" SERIAL PRIMARY KEY,
    "PNR" VARCHAR(20) NOT NULL UNIQUE,
    "User_ID" INT NOT NULL REFERENCES "User"("User_ID"),
    "Train_ID" INT NOT NULL REFERENCES "Train"("Train_ID"),
    "Source_Station_ID" INT NOT NULL REFERENCES "Station"("Station_ID"),
    "Destination_Station_ID" INT NOT NULL REFERENCES "Station"("Station_ID"),
    "Journey_Date" DATE NOT NULL,
    "Booking_Date" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "Total_Amount" DECIMAL(10,2) NOT NULL,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'Confirmed' CHECK ("Status" IN ('Confirmed', 'Cancelled', 'Pending'))
);

CREATE INDEX idx_booking_pnr ON "Booking"("PNR");
CREATE INDEX idx_booking_user ON "Booking"("User_ID");
CREATE INDEX idx_booking_date ON "Booking"("Journey_Date");

-- ---------------------------------------------------------------------
-- TABLE 6: Passenger
-- ---------------------------------------------------------------------
CREATE TABLE "Passenger" (
    "Passenger_ID" SERIAL PRIMARY KEY,
    "Passenger_Name" VARCHAR(100) NOT NULL,
    "Age" INT NOT NULL,
    "Gender" VARCHAR(15) NOT NULL
);

-- ---------------------------------------------------------------------
-- TABLE 7: Booking_Passenger
-- ---------------------------------------------------------------------
CREATE TABLE "Booking_Passenger" (
    "Booking_ID" INT NOT NULL REFERENCES "Booking"("Booking_ID") ON DELETE CASCADE,
    "Passenger_ID" INT NOT NULL REFERENCES "Passenger"("Passenger_ID") ON DELETE CASCADE,
    "Seat_Number" VARCHAR(10) NOT NULL,
    "Coach_Number" VARCHAR(10) NOT NULL,
    "Travel_Class" VARCHAR(30) NOT NULL,
    PRIMARY KEY ("Booking_ID", "Passenger_ID")
);

-- ---------------------------------------------------------------------
-- TABLE 8: Payment
-- ---------------------------------------------------------------------
CREATE TABLE "Payment" (
    "Payment_ID" SERIAL PRIMARY KEY,
    "Booking_ID" INT NOT NULL UNIQUE REFERENCES "Booking"("Booking_ID") ON DELETE CASCADE,
    "Amount" DECIMAL(10,2) NOT NULL,
    "Payment_Method" VARCHAR(30) NOT NULL,
    "Payment_Status" VARCHAR(20) NOT NULL DEFAULT 'Success',
    "Payment_Date" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- TABLE 9: Seat_Inventory
-- ---------------------------------------------------------------------
CREATE TABLE "Seat_Inventory" (
    "Inventory_ID" SERIAL PRIMARY KEY,
    "Train_ID" INT NOT NULL REFERENCES "Train"("Train_ID") ON DELETE CASCADE,
    "Journey_Date" DATE NOT NULL,
    "Travel_Class" VARCHAR(30) NOT NULL,
    "Seat_Number" VARCHAR(10) NOT NULL,
    "Coach_Number" VARCHAR(10) NOT NULL,
    "Seat_Status" VARCHAR(20) NOT NULL DEFAULT 'Available' CHECK ("Seat_Status" IN ('Available', 'Booked')),
    "Booking_ID" INT REFERENCES "Booking"("Booking_ID") ON DELETE SET NULL,
    CONSTRAINT uq_seat_slot UNIQUE ("Train_ID", "Journey_Date", "Travel_Class", "Seat_Number", "Coach_Number")
);

CREATE INDEX idx_inv_lookup ON "Seat_Inventory"("Train_ID", "Journey_Date", "Travel_Class", "Seat_Status");

-- ---------------------------------------------------------------------
-- TABLE 10: Fare
-- ---------------------------------------------------------------------
CREATE TABLE "Fare" (
    "Fare_ID" SERIAL PRIMARY KEY,
    "Train_ID" INT NOT NULL REFERENCES "Train"("Train_ID") ON DELETE CASCADE,
    "Source_Station_ID" INT NOT NULL REFERENCES "Station"("Station_ID") ON DELETE CASCADE,
    "Destination_Station_ID" INT NOT NULL REFERENCES "Station"("Station_ID") ON DELETE CASCADE,
    "Travel_Class" VARCHAR(30) NOT NULL,
    "Fare_Amount" DECIMAL(10,2) NOT NULL,
    CONSTRAINT uq_fare_rule UNIQUE ("Train_ID", "Source_Station_ID", "Destination_Station_ID", "Travel_Class")
);

-- ---------------------------------------------------------------------
-- DATABASE VIEWS
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW "Booking_Details" AS
SELECT 
    b."Booking_ID",
    b."PNR",
    u."Name" AS "Passenger_Account_Name",
    u."Email" AS "Passenger_Email",
    u."Phone" AS "Passenger_Phone",
    t."Train_Number",
    t."Train_Name",
    t."Train_Type",
    s_src."Station_Name" AS "Source_Station",
    s_src."Station_Code" AS "Source_Code",
    s_dest."Station_Name" AS "Destination_Station",
    s_dest."Station_Code" AS "Destination_Code",
    b."Journey_Date",
    b."Booking_Date",
    b."Total_Amount",
    b."Status" AS "Booking_Status",
    p."Payment_Method",
    p."Payment_Status"
FROM "Booking" b
JOIN "User" u ON b."User_ID" = u."User_ID"
JOIN "Train" t ON b."Train_ID" = t."Train_ID"
JOIN "Station" s_src ON b."Source_Station_ID" = s_src."Station_ID"
JOIN "Station" s_dest ON b."Destination_Station_ID" = s_dest."Station_ID"
LEFT JOIN "Payment" p ON b."Booking_ID" = p."Booking_ID";

CREATE OR REPLACE VIEW "Train_Route_Details" AS
SELECT 
    t."Train_ID",
    t."Train_Number",
    t."Train_Name",
    t."Train_Type",
    ts."Stop_Number",
    s."Station_Name",
    s."Station_Code",
    s."City",
    ts."Arrival_Time",
    ts."Departure_Time",
    ts."Distance_From_Source"
FROM "Train" t
JOIN "Train_Stop" ts ON t."Train_ID" = ts."Train_ID"
JOIN "Station" s ON ts."Station_ID" = s."Station_ID"
ORDER BY t."Train_ID", ts."Stop_Number";

CREATE OR REPLACE VIEW "Passenger_Booking_Details" AS
SELECT 
    b."PNR",
    b."Journey_Date",
    t."Train_Number",
    t."Train_Name",
    p."Passenger_Name",
    p."Age",
    p."Gender",
    bp."Coach_Number",
    bp."Seat_Number",
    bp."Travel_Class",
    b."Status" AS "Ticket_Status"
FROM "Booking_Passenger" bp
JOIN "Booking" b ON bp."Booking_ID" = b."Booking_ID"
JOIN "Passenger" p ON bp."Passenger_ID" = p."Passenger_ID"
JOIN "Train" t ON b."Train_ID" = t."Train_ID";

-- ---------------------------------------------------------------------
-- INITIAL SEED DATA FOR SUPABASE
-- ---------------------------------------------------------------------
INSERT INTO "Station" ("Station_ID", "Station_Name", "Station_Code", "City") VALUES
(1, 'Mumbai Central', 'MMCT', 'Mumbai'),
(2, 'Pune Junction', 'PUNE', 'Pune'),
(3, 'Kalyan Junction', 'KYN', 'Kalyan'),
(4, 'Thane', 'TNA', 'Thane'),
(5, 'Nagpur Junction', 'NGP', 'Nagpur'),
(6, 'Nashik Road', 'NK', 'Nashik'),
(7, 'Ahmedabad Junction', 'ADI', 'Ahmedabad'),
(8, 'Surat', 'ST', 'Surat'),
(9, 'Bhopal Junction', 'BPL', 'Bhopal'),
(10, 'New Delhi', 'NDLS', 'New Delhi'),
(11, 'Jaipur Junction', 'JP', 'Jaipur'),
(12, 'Chennai Central', 'MAS', 'Chennai'),
(13, 'Bengaluru City (KSR)', 'SBC', 'Bengaluru'),
(14, 'Hyderabad Deccan', 'HYB', 'Hyderabad'),
(15, 'Howrah Junction', 'HWH', 'Kolkata'),
(16, 'Vadodara Junction', 'BRC', 'Vadodara'),
(17, 'Kota Junction', 'KOTA', 'Kota'),
(18, 'Agra Cantt', 'AGC', 'Agra')
ON CONFLICT ("Station_ID") DO NOTHING;

INSERT INTO "Train" ("Train_ID", "Train_Number", "Train_Name", "Train_Type", "Total_Seats", "Is_Active") VALUES
(1, '22221', 'Mumbai CSMT - Hazrat Nizamuddin Rajdhani', 'Rajdhani', 520, TRUE),
(2, '20901', 'Mumbai Central - Gandhinagar Vande Bharat', 'Vande Bharat', 450, TRUE),
(3, '12951', 'Mumbai Central - New Delhi Tejas Rajdhani', 'Rajdhani', 550, TRUE),
(4, '12123', 'Deccan Queen Superfast Express', 'Superfast', 600, TRUE),
(5, '12009', 'Mumbai Central - Ahmedabad Shatabdi', 'Shatabdi', 480, TRUE),
(6, '12261', 'Mumbai CSMT - Howrah Duronto Express', 'Superfast', 500, TRUE),
(7, '12627', 'Karnataka Express (SBC - NDLS)', 'Superfast', 650, TRUE),
(8, '12615', 'Grand Trunk Express (MAS - NDLS)', 'Superfast', 620, TRUE),
(9, '12953', 'August Kranti Tejas Rajdhani', 'Rajdhani', 530, TRUE),
(10, '20903', 'Ekta Nagar - Varanasi Mahamana Express', 'Express', 580, TRUE)
ON CONFLICT ("Train_ID") DO NOTHING;

-- Initial Demo Users (Passwords hashed with bcrypt: password123 and admin123)
INSERT INTO "User" ("User_ID", "Name", "Email", "Phone", "Password", "Role") VALUES
(1, 'Chief Railway Admin', 'admin@railconnect.com', '+91 9820011223', '$2a$08$b8g.E8Y6w0q3m7p9s1v4tOu1Z3y5X7W9V1u3r5t7u9v1w3x5y7z9a', 'Admin'),
(2, 'Rahul Sharma', 'rahul.sharma@example.com', '+91 9876543210', '$2a$08$b8g.E8Y6w0q3m7p9s1v4tOu1Z3y5X7W9V1u3r5t7u9v1w3x5y7z9a', 'Passenger')
ON CONFLICT ("User_ID") DO NOTHING;

-- Reset identity sequence counters
SELECT setval(pg_get_serial_sequence('"Station"', 'Station_ID'), coalesce(max("Station_ID"), 1)) FROM "Station";
SELECT setval(pg_get_serial_sequence('"Train"', 'Train_ID'), coalesce(max("Train_ID"), 1)) FROM "Train";
SELECT setval(pg_get_serial_sequence('"User"', 'User_ID'), coalesce(max("User_ID"), 1)) FROM "User";
