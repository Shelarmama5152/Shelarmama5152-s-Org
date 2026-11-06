import React from 'react';
import { Train, Database, Shield, FileText } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onOpenAuth }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand & Project Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center">
                <Train className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Rail<span className="text-blue-400">Connect</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modern full-stack Railway Reservation Management System built for practical demonstration of Relational Database Management System (DBMS) concepts, ACID transactions, and Indian Railways operations.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Database className="w-3.5 h-3.5 text-orange-400" />
              <span>Database: <strong className="text-slate-200">RailwayDB (MySQL 8.0)</strong></span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider mb-3">
              Passenger Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveTab('search')} className="hover:text-white transition-colors">
                  Search & Book Trains
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('pnr')} className="hover:text-white transition-colors">
                  Live PNR Status Enquiry
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('bookings')} className="hover:text-white transition-colors">
                  My Reservations & History
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('pnr')} className="hover:text-white transition-colors">
                  Ticket Cancellation & Refund
                </button>
              </li>
            </ul>
          </div>

          {/* DBMS & Academic Resources */}
          <div>
            <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider mb-3">
              DBMS Mini-Project Lab
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveTab('dbms')} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-orange-400" />
                  15+ Academic SQL Queries
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('dbms')} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-blue-400" />
                  Relational Schema & 3NF
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('about')} className="hover:text-white transition-colors">
                  System Architecture & ER Model
                </button>
              </li>
              <li>
                <a href="/api/dbms/download-sql/RailwayDB.sql" download className="hover:text-white transition-colors">
                  Download RailwayDB.sql DDL
                </a>
              </li>
            </ul>
          </div>

          {/* Administration & Roles */}
          <div>
            <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider mb-3">
              Administration & Access
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Role-based access control with separate Passenger and Administrative operations.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  onOpenAuth();
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-orange-400" />
                Administrative Login
              </button>
              <div className="text-[11px] text-slate-400">
                Demo Admin: <code className="text-slate-300">admin@railconnect.com</code>
              </div>
            </div>
          </div>

        </div>

        {/* Hairline Divider & Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © 2026 RailConnect – Railway Reservation Management System. College DBMS Mini-Project.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Academic Simulation</span>
            <span>·</span>
            <span>Zero Real Card Charges</span>
            <span>·</span>
            <span>Full Relational ACID Integrity</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
