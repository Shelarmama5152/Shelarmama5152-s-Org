import React from 'react';
import { Database, CheckCircle2, Shield, Layers, FileText, ArrowRight } from 'lucide-react';

export const AboutModal: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Title Card */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 uppercase tracking-wider">
          <Database className="w-4 h-4 text-orange-600" />
          <span>Academic Project Report & Documentation</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          RailConnect – Railway Reservation Management System
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          A full-stack Database Management System (DBMS) mini-project demonstrating practical implementation of relational database modeling, Boyce-Codd & Third Normal Form (3NF) normalization, ACID transactions, and role-based access control modeled on Indian Railways reservation operations.
        </p>
      </div>

      {/* 3NF Relational Normalization Breakdown */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Database Normalization (Up to 3NF)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Systematic design eliminating insertion, update, and deletion anomalies.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px]">1</span>
              <span>First Normal Form (1NF) Compliance</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Every table contains atomic (indivisible) attribute values. No repeating groups or multi-valued columns. Multiple passengers for a reservation are factored out of the Booking table into an associative bridge entity <code className="text-blue-900 font-bold">Booking_Passenger</code> and <code className="text-blue-900 font-bold">Passenger</code> entity.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Second Normal Form (2NF) Compliance</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              In 1NF, every non-prime attribute must be fully functionally dependent on the entire primary key. In <code className="text-blue-900 font-bold">Booking_Passenger</code> with composite key (Booking_ID, Passenger_ID), demographic attributes (Passenger_Name, Age, Gender) are non-trivially moved to the separate <code className="text-blue-900 font-bold">Passenger</code> table to eliminate partial dependencies.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Third Normal Form (3NF) Compliance</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              In 2NF, no non-prime attribute is transitively dependent on the primary key (X → Y and Y → Z). Station names, codes, and cities are stored in <code className="text-blue-900 font-bold">Station</code> rather than repeated across Bookings or Train_Stops. Payment details and Seat Inventories are segregated with foreign keys, ensuring zero transitive redundancies.
            </p>
          </div>
        </div>
      </div>

      {/* Relational Schema Table Catalog */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Relational Schema Summary (10 Tables)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {[
            { name: 'User', pk: 'User_ID', desc: 'Stores passenger and admin credentials with BCrypt hashes' },
            { name: 'Station', pk: 'Station_ID', desc: '18 IR stations with unique station codes (MMCT, NDLS, etc.)' },
            { name: 'Train', pk: 'Train_ID', desc: '10 catalog trains with types and total capacity' },
            { name: 'Train_Stop', pk: 'Stop_ID', desc: 'Sequential stop sequence, arrival/departure, and route distances' },
            { name: 'Booking', pk: 'Booking_ID', desc: 'Master reservation records with unique 10-digit PNR' },
            { name: 'Passenger', pk: 'Passenger_ID', desc: 'Demographic entities (Name, Age, Gender)' },
            { name: 'Booking_Passenger', pk: '(Booking_ID, Passenger_ID)', desc: 'Bridge entity allocating coach and seat numbers' },
            { name: 'Payment', pk: 'Payment_ID', desc: 'Simulated payment records (UPI, NetBanking, Cards)' },
            { name: 'Seat_Inventory', pk: 'Inventory_ID', desc: 'Atomic seat availability preventing double booking' },
            { name: 'Fare', pk: 'Fare_ID', desc: 'Distance and class-based fare rate matrix' },
          ].map((t) => (
            <div key={t.name} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 text-sm">{t.name}</span>
                <span className="text-[11px] text-orange-600 font-bold">PK: {t.pk}</span>
              </div>
              <p className="text-slate-600 font-sans text-xs">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ACID Transaction Guarantees */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          ACID Transaction Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-sm text-slate-900">Atomicity & Consistency</h4>
            <p className="text-slate-600 leading-relaxed">
              Ticket booking executes steps (verify seats, create booking, insert passengers, allocate coach/seat, update inventory, record payment) inside a single transaction. If any step fails or seats become exhausted, the transaction immediately rolls back to prevent orphan records.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-sm text-slate-900">Isolation & Durability</h4>
            <p className="text-slate-600 leading-relaxed">
              Seat allocation checks inventory state under transaction lock, guaranteeing that concurrent passengers booking the same coach and seat cannot double book. Database modifications persist immediately to storage.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
