-- =====================================================================
-- RailConnect - Railway Reservation Management System
-- Synthetic Sample Dataset Seed File (MySQL 8.0 Compatible)
-- Database Name: RailwayDB
-- =====================================================================

USE RailwayDB;

-- ---------------------------------------------------------------------
-- 1. STATIONS (18 Indian Railway Stations with Codes & Cities)
-- ---------------------------------------------------------------------
INSERT INTO Station (Station_ID, Station_Name, Station_Code, City) VALUES
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
(18, 'Agra Cantt', 'AGC', 'Agra');

-- ---------------------------------------------------------------------
-- 2. TRAINS (10 Signature Express, Rajdhani, Shatabdi & Vande Bharat Trains)
-- ---------------------------------------------------------------------
INSERT INTO Train (Train_ID, Train_Number, Train_Name, Train_Type, Total_Seats, Is_Active) VALUES
(1, '22221', 'Mumbai CSMT - Hazrat Nizamuddin Rajdhani', 'Rajdhani', 520, 1),
(2, '20901', 'Mumbai Central - Gandhinagar Vande Bharat', 'Vande Bharat', 450, 1),
(3, '12951', 'Mumbai Central - New Delhi Tejas Rajdhani', 'Rajdhani', 550, 1),
(4, '12123', 'Deccan Queen Superfast Express', 'Superfast', 600, 1),
(5, '12009', 'Mumbai Central - Ahmedabad Shatabdi', 'Shatabdi', 480, 1),
(6, '12261', 'Mumbai CSMT - Howrah Duronto Express', 'Superfast', 500, 1),
(7, '12627', 'Karnataka Express (SBC - NDLS)', 'Superfast', 650, 1),
(8, '12615', 'Grand Trunk Express (MAS - NDLS)', 'Superfast', 620, 1),
(9, '12953', 'August Kranti Tejas Rajdhani', 'Rajdhani', 530, 1),
(10, '20903', 'Ekta Nagar - Varanasi Mahamana Express', 'Express', 580, 1);

-- ---------------------------------------------------------------------
-- 3. TRAIN STOPS (Intermediate Stops, Arrival/Departure & Distances)
-- ---------------------------------------------------------------------
INSERT INTO Train_Stop (Train_ID, Station_ID, Stop_Number, Arrival_Time, Departure_Time, Distance_From_Source) VALUES
-- Train 1: Mumbai to Delhi Rajdhani
(1, 1, 1, NULL, '16:00:00', 0.00),
(1, 3, 2, '16:53:00', '16:55:00', 54.00),
(1, 6, 3, '19:18:00', '19:20:00', 188.00),
(1, 9, 4, '02:00:00', '02:05:00', 835.00),
(1, 18, 5, '07:15:00', '07:17:00', 1344.00),
(1, 10, 6, '09:55:00', NULL, 1538.00),

-- Train 2: Vande Bharat Mumbai - Gandhinagar
(2, 1, 1, NULL, '06:00:00', 0.00),
(2, 8, 2, '08:50:00', '08:53:00', 263.00),
(2, 16, 3, '10:05:00', '10:08:00', 392.00),
(2, 7, 4, '11:25:00', NULL, 491.00),

-- Train 3: Tejas Rajdhani (MMCT to NDLS)
(3, 1, 1, NULL, '17:00:00', 0.00),
(3, 8, 2, '19:35:00', '19:38:00', 263.00),
(3, 16, 3, '21:03:00', '21:06:00', 392.00),
(3, 17, 4, '03:15:00', '03:20:00', 920.00),
(3, 10, 5, '08:32:00', NULL, 1386.00),

-- Train 4: Deccan Queen
(4, 1, 1, NULL, '17:10:00', 0.00),
(4, 4, 2, '17:45:00', '17:47:00', 34.00),
(4, 3, 3, '18:10:00', '18:12:00', 54.00),
(4, 2, 4, '20:25:00', NULL, 192.00),

-- Train 5: Shatabdi (MMCT to ADI)
(5, 1, 1, NULL, '06:20:00', 0.00),
(5, 8, 2, '09:22:00', '09:25:00', 263.00),
(5, 16, 3, '10:48:00', '10:51:00', 392.00),
(5, 7, 4, '12:45:00', NULL, 491.00),

-- Train 6: Duronto (MMCT to HWH)
(6, 1, 1, NULL, '17:15:00', 0.00),
(6, 3, 2, '18:08:00', '18:10:00', 54.00),
(6, 6, 3, '20:30:00', '20:33:00', 188.00),
(6, 5, 4, '04:15:00', '04:20:00', 837.00),
(6, 15, 5, '16:15:00', NULL, 1968.00),

-- Train 7: Karnataka Express (SBC to NDLS)
(7, 13, 1, NULL, '19:20:00', 0.00),
(7, 14, 2, '08:10:00', '08:20:00', 650.00),
(7, 5, 3, '15:20:00', '15:25:00', 1150.00),
(7, 9, 4, '21:40:00', '21:50:00', 1540.00),
(7, 18, 5, '03:50:00', '03:55:00', 2190.00),
(7, 10, 6, '06:40:00', NULL, 2400.00),

-- Train 8: Grand Trunk Express (MAS to NDLS)
(8, 12, 1, NULL, '19:00:00', 0.00),
(8, 14, 2, '05:30:00', '05:40:00', 710.00),
(8, 5, 3, '13:10:00', '13:15:00', 1210.00),
(8, 9, 4, '19:25:00', '19:35:00', 1600.00),
(8, 18, 5, '02:30:00', '02:35:00', 2010.00),
(8, 10, 6, '06:35:00', NULL, 2185.00),

-- Train 9: August Kranti (MMCT to NDLS via JP)
(9, 1, 1, NULL, '17:40:00', 0.00),
(9, 8, 2, '20:15:00', '20:18:00', 263.00),
(9, 16, 3, '21:42:00', '21:45:00', 392.00),
(9, 17, 4, '04:00:00', '04:05:00', 920.00),
(9, 11, 5, '07:25:00', '07:35:00', 1160.00),
(9, 10, 6, '11:00:00', NULL, 1468.00),

-- Train 10: Mahamana Express
(10, 7, 1, NULL, '21:15:00', 0.00),
(10, 16, 2, '22:30:00', '22:35:00', 100.00),
(10, 8, 3, '23:55:00', '23:58:00', 228.00),
(10, 9, 4, '08:20:00', '08:30:00', 840.00),
(10, 10, 5, '16:50:00', NULL, 1540.00);

-- ---------------------------------------------------------------------
-- 4. USERS (Admin + Sample Passengers with BCrypt Password Hashes)
-- ---------------------------------------------------------------------
INSERT INTO User (User_ID, Name, Email, Phone, Password, Role) VALUES
(1, 'Chief Railway Admin', 'admin@railconnect.com', '+91 9820011223', '$2a$08$K8.5r4xXh7y1P7v0lB1vOeQ.N6Z0o7X9W2p4Y1q3r5t7u9v1w3x5y', 'Admin'),
(2, 'Rahul Sharma', 'rahul.sharma@example.com', '+91 9876543210', '$2a$08$b8g.E8Y6w0q3m7p9s1v4tOu1Z3y5X7W9V1u3r5t7u9v1w3x5y7z9a', 'Passenger'),
(3, 'Priya Patel', 'priya.patel@example.com', '+91 9812345678', '$2a$08$b8g.E8Y6w0q3m7p9s1v4tOu1Z3y5X7W9V1u3r5t7u9v1w3x5y7z9a', 'Passenger'),
(4, 'Amitabh Sen', 'amitabh.sen@example.com', '+91 9823456789', '$2a$08$b8g.E8Y6w0q3m7p9s1v4tOu1Z3y5X7W9V1u3r5t7u9v1w3x5y7z9a', 'Passenger'),
(5, 'Sneha Deshmukh', 'sneha.d@example.com', '+91 9834567890', '$2a$08$b8g.E8Y6w0q3m7p9s1v4tOu1Z3y5X7W9V1u3r5t7u9v1w3x5y7z9a', 'Passenger'),
(6, 'Rohan Verma', 'rohan.v@example.com', '+91 9845678901', '$2a$08$b8g.E8Y6w0q3m7p9s1v4tOu1Z3y5X7W9V1u3r5t7u9v1w3x5y7z9a', 'Passenger'),
(7, 'Ananya Iyer', 'ananya.iyer@example.com', '+91 9856789012', '$2a$08$b8g.E8Y6w0q3m7p9s1v4tOu1Z3y5X7W9V1u3r5t7u9v1w3x5y7z9a', 'Passenger'),
(8, 'Vikram Malhotra', 'vikram.m@example.com', '+91 9867890123', '$2a$08$b8g.E8Y6w0q3m7p9s1v4tOu1Z3y5X7W9V1u3r5t7u9v1w3x5y7z9a', 'Passenger'),
(9, 'Deepika Nair', 'deepika.n@example.com', '+91 9878901234', '$2a$08$b8g.E8Y6w0q3m7p9s1v4tOu1Z3y5X7W9V1u3r5t7u9v1w3x5y7z9a', 'Passenger'),
(10, 'Kunal Kapoor', 'kunal.k@example.com', '+91 9889012345', '$2a$08$b8g.E8Y6w0q3m7p9s1v4tOu1Z3y5X7W9V1u3r5t7u9v1w3x5y7z9a', 'Passenger');

-- ---------------------------------------------------------------------
-- 5. FARES (Train ID, Source, Dest, Travel Class, Amount)
-- ---------------------------------------------------------------------
INSERT INTO Fare (Train_ID, Source_Station_ID, Destination_Station_ID, Travel_Class, Fare_Amount) VALUES
(1, 1, 10, '1A', 4850.00),
(1, 1, 10, '2A', 2850.00),
(1, 1, 10, '3A', 1980.00),
(2, 1, 7, 'EC', 2460.00),
(2, 1, 7, 'CC', 1385.00),
(3, 1, 10, '1A', 5100.00),
(3, 1, 10, '2A', 3050.00),
(3, 1, 10, '3A', 2150.00),
(4, 1, 2, 'CC', 390.00),
(4, 1, 2, '2S', 110.00),
(5, 1, 7, 'EC', 2325.00),
(5, 1, 7, 'CC', 1160.00),
(6, 1, 15, '2A', 3600.00),
(6, 1, 15, '3A', 2450.00),
(6, 1, 15, 'SL', 890.00),
(7, 13, 10, '2A', 3350.00),
(7, 13, 10, '3A', 2280.00),
(7, 13, 10, 'SL', 840.00),
(8, 12, 10, '2A', 3100.00),
(8, 12, 10, '3A', 2150.00),
(8, 12, 10, 'SL', 790.00),
(9, 1, 10, '1A', 4900.00),
(9, 1, 10, '2A', 2900.00),
(9, 1, 10, '3A', 2050.00),
(10, 7, 10, '2A', 2250.00),
(10, 7, 10, '3A', 1580.00),
(10, 7, 10, 'SL', 590.00);

-- Sample Bookings, Passengers, Booking_Passenger, and Payments are loaded
-- dynamically and populated in RailwayDB through server/db.ts seeder and transactions.
