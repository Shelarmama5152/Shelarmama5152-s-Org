import { jsPDF } from 'jspdf';
import { BookingRecord } from '../types';

export function generateTicketPDF(booking: BookingRecord): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Colors
  const navy = [15, 23, 42]; // #0f172a
  const royalBlue = [30, 58, 138]; // #1e3a8a
  const orange = [234, 88, 12]; // #ea580c
  const slate = [100, 116, 139]; // #64748b
  const lightBg = [248, 250, 252]; // #f8fafc

  // Header Banner
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand and Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RailConnect - Electronic Reservation Slip (ERS)', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('Ministry of Railways · Indian Railway Reservation Portal · IR-Standard Ticket', 14, 18);
  doc.text(`Issued On: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 23);

  // Status Badge on Right
  const isCancelled = booking.Status === 'Cancelled';
  if (isCancelled) {
    doc.setFillColor(225, 29, 72); // Rose/Red
  } else {
    doc.setFillColor(16, 185, 129); // Emerald
  }
  doc.roundedRect(pageWidth - 44, 8, 30, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(booking.Status.toUpperCase(), pageWidth - 29, 14.5, { align: 'center' });

  // Key Identifiers Card (PNR & Train)
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 34, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PNR NUMBER', 20, 42);
  doc.text('TRAIN NUMBER & NAME', 75, 42);
  doc.text('JOURNEY DATE', 150, 42);

  doc.setTextColor(royalBlue[0], royalBlue[1], royalBlue[2]);
  doc.setFontSize(13);
  doc.text(booking.PNR, 20, 50);

  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(11);
  doc.text(`${booking.Train_Number} / ${booking.Train_Name.slice(0, 32)}`, 75, 50);

  doc.setFontSize(11);
  doc.text(booking.Journey_Date, 150, 50);

  // Journey Stations Grid
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 66, pageWidth - 28, 34, 2, 2, 'D');

  // Origin
  doc.setFontSize(8);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('FROM / DEPARTURE', 20, 73);
  doc.setFontSize(12);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`${booking.Source_Station || 'Source'} (${booking.Source_Code || 'SRC'})`, 20, 81);
  doc.setFontSize(10);
  doc.setTextColor(royalBlue[0], royalBlue[1], royalBlue[2]);
  doc.text(`Time: ${booking.Departure_Time || '--:--'}`, 20, 88);

  // Arrow
  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.setFontSize(16);
  doc.text('------------------->', 85, 83);

  // Destination
  doc.setFontSize(8);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('TO / ARRIVAL', 135, 73);
  doc.setFontSize(12);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`${booking.Destination_Station || 'Destination'} (${booking.Destination_Code || 'DEST'})`, 135, 81);
  doc.setFontSize(10);
  doc.setTextColor(royalBlue[0], royalBlue[1], royalBlue[2]);
  doc.text(`Time: ${booking.Arrival_Time || '--:--'}`, 135, 88);

  // Passenger Table Header
  let y = 108;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('#', 18, y + 5.5);
  doc.text('PASSENGER NAME', 28, y + 5.5);
  doc.text('AGE', 95, y + 5.5);
  doc.text('GENDER', 115, y + 5.5);
  doc.text('CLASS', 138, y + 5.5);
  doc.text('COACH', 158, y + 5.5);
  doc.text('SEAT / BERTH', 178, y + 5.5);

  // Passenger Rows
  const passengers = booking.passengers || [
    { Passenger_Name: booking.Booked_By_Name || 'Passenger 1', Age: 28, Gender: 'Male', Coach_Number: 'B1', Seat_Number: '12', Travel_Class: '3A' }
  ];

  y += 8;
  passengers.forEach((p, idx) => {
    const isOdd = idx % 2 === 1;
    if (isOdd) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 9, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 9, pageWidth - 14, y + 9);

    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(String(idx + 1), 18, y + 6);
    doc.text(p.Passenger_Name, 28, y + 6);
    doc.text(String(p.Age), 95, y + 6);
    doc.text(p.Gender, 115, y + 6);
    doc.text(p.Travel_Class, 138, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(p.Coach_Number, 158, y + 6);
    doc.text(p.Seat_Number, 178, y + 6);

    y += 9;
  });

  // Fare & Payment Summary Block
  y += 6;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('PAYMENT & FARE BREAKDOWN', 20, y + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`Payment Method: ${booking.Payment_Method || 'UPI / Online'}`, 20, y + 14);
  doc.text(`Payment Status: ${booking.Payment_Status || 'Success'}`, 20, y + 20);

  doc.text(`Ticket Fare: Rs. ${(booking.Total_Amount * 0.95).toFixed(2)}`, 110, y + 14);
  doc.text('IRCTC / Convenience Fee: Rs. 40.00', 110, y + 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.text(`Total Amount: Rs. ${Number(booking.Total_Amount).toFixed(2)}`, pageWidth - 20, y + 20, { align: 'right' });

  // Academic Simulation Watermark Notice
  y += 34;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, pageWidth - 14, y);

  y += 5;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('TERMS & INSTRUCTIONS:', 14, y);
  y += 4;
  doc.text('1. One of the passengers booked on this ERS must present original valid Photo Identity proof (Aadhaar, Voter ID, Passport, PAN) during the journey.', 14, y);
  y += 3.5;
  doc.text('2. This is a computer-generated simulated reservation slip produced by RailConnect Railway Reservation Management System for DBMS Project Demonstration.', 14, y);
  y += 3.5;
  doc.text('3. Cancellation rules: Up to 4 hours before train departure, 90% simulated refund is processed. Double cancellation is prevented.', 14, y);
  y += 3.5;
  doc.text('4. No real banking payment was processed; all database transactions demonstrate ACID guarantees, relational integrity, and seat inventory locking.', 14, y);

  // Save PDF
  doc.save(`RailConnect_Ticket_${booking.PNR}.pdf`);
}
