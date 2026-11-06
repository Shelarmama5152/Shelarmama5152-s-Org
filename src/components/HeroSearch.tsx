import React, { useState } from 'react';
import { Station } from '../types';
import { ArrowLeftRight, Search, Calendar, MapPin, Sparkles, Clock, ShieldCheck, CheckCircle2, Ticket } from 'lucide-react';

interface HeroSearchProps {
  stations: Station[];
  onSearch: (from: string, to: string, date: string, travelClass: string) => void;
  onSelectQuickRoute: (fromCode: string, toCode: string) => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({ stations, onSearch, onSelectQuickRoute }) => {
  const [fromStation, setFromStation] = useState<string>('MMCT'); // Default Mumbai Central
  const [toStation, setToStation] = useState<string>('NDLS'); // Default New Delhi
  
  // Default to tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const [journeyDate, setJourneyDate] = useState<string>(tomorrowStr);
  const [travelClass, setTravelClass] = useState<string>('All');

  const handleSwap = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStation || !toStation) return;
    onSearch(fromStation, toStation, journeyDate, travelClass);
  };

  const popularRoutes = [
    { from: 'MMCT', fromName: 'Mumbai', to: 'NDLS', toName: 'New Delhi', train: 'Rajdhani / Tejas', time: '15h 30m' },
    { from: 'MMCT', fromName: 'Mumbai', to: 'ADI', toName: 'Ahmedabad', train: 'Vande Bharat / Shatabdi', time: '5h 25m' },
    { from: 'MMCT', fromName: 'Mumbai', to: 'PUNE', toName: 'Pune', train: 'Deccan Queen', time: '3h 15m' },
    { from: 'SBC', fromName: 'Bengaluru', to: 'NDLS', toName: 'New Delhi', train: 'Karnataka Express', time: '34h 20m' },
    { from: 'MAS', fromName: 'Chennai', to: 'NDLS', toName: 'New Delhi', train: 'Grand Trunk Express', time: '33h 35m' },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Visual Banner with Booking Card */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-xl border border-slate-800">
        
        {/* Cinematic Backdrop Image */}
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/hero_railway_train_1793891880491.jpg"
            alt="Sleek Indian Railway Vande Bharat Express on Scenic Route"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-5xl">
          
          {/* Header Typography */}
          <div className="max-w-2xl mb-8 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 tracking-wide uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Next-Gen Railway Ticketing System</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight text-balance">
              Your Journey, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-orange-300">
                Our Priority
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Book your train tickets with ease and convenience. Experience seamless seat reservations, live PNR status tracking, and ACID-compliant relational booking.
            </p>
          </div>

          {/* Interactive Booking Search Form */}
          <form
            onSubmit={handleFormSubmit}
            className="bg-white/95 backdrop-blur-md rounded-xl p-5 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              
              {/* From Station */}
              <div className="lg:col-span-3 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-900" />
                  <span>From Station</span>
                </label>
                <select
                  value={fromStation}
                  onChange={(e) => setFromStation(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 font-medium text-slate-900 transition-all"
                >
                  {stations.map((s) => (
                    <option key={`from-${s.Station_ID}`} value={s.Station_Code}>
                      {s.Station_Name} ({s.Station_Code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              <div className="lg:col-span-1 flex items-center justify-center pb-0.5">
                <button
                  type="button"
                  onClick={handleSwap}
                  title="Swap Origin and Destination Stations"
                  className="w-10 h-10 rounded-full border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-900 shadow-sm transition-transform active:rotate-180"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>

              {/* To Station */}
              <div className="lg:col-span-3 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  <span>To Station</span>
                </label>
                <select
                  value={toStation}
                  onChange={(e) => setToStation(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 font-medium text-slate-900 transition-all"
                >
                  {stations.map((s) => (
                    <option key={`to-${s.Station_ID}`} value={s.Station_Code}>
                      {s.Station_Name} ({s.Station_Code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Journey Date */}
              <div className="lg:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-900" />
                  <span>Journey Date</span>
                </label>
                <input
                  type="date"
                  value={journeyDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setJourneyDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 font-medium text-slate-900 transition-all"
                />
              </div>

              {/* Travel Class */}
              <div className="lg:col-span-3 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-blue-900" />
                  <span>Travel Class</span>
                </label>
                <select
                  value={travelClass}
                  onChange={(e) => setTravelClass(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 font-medium text-slate-900 transition-all"
                >
                  <option value="All">All Classes (General Quota)</option>
                  <option value="1A">AC First Class (1A)</option>
                  <option value="2A">AC 2 Tier (2A)</option>
                  <option value="3A">AC 3 Tier (3A)</option>
                  <option value="EC">Executive Chair Car (EC)</option>
                  <option value="CC">AC Chair Car (CC)</option>
                  <option value="SL">Sleeper Class (SL)</option>
                </select>
              </div>

            </div>

            {/* Quick date shortcuts and Search CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Quick Dates:</span>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    setJourneyDate(d.toISOString().split('T')[0]);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    setJourneyDate(d.toISOString().split('T')[0]);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    setJourneyDate(d.toISOString().split('T')[0]);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Next Week
                </button>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98]"
              >
                <Search className="w-4 h-4" />
                <span>Search Trains</span>
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Popular Travel Corridors */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Popular Railway Corridors
            </h2>
            <p className="text-xs text-slate-500">
              Frequently booked express and superfast routes across India
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {popularRoutes.map((r, i) => (
            <button
              key={`popular-${i}`}
              onClick={() => onSelectQuickRoute(r.from, r.to)}
              className="text-left p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-900/40 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-mono">
                <span>{r.from}</span>
                <span className="text-slate-300">→</span>
                <span>{r.to}</span>
              </div>
              <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                {r.fromName} to {r.toName}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="truncate max-w-[110px]">{r.train}</span>
                <span className="flex items-center gap-1 font-mono text-slate-700 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {r.time}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modern Fleet & Featured Trains Showcase */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Signature Indian Railway Trains
            </h2>
            <p className="text-xs text-slate-500">
              High-speed semi-bullet trains and iconic express rail services
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Vande Bharat */}
          <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-44 overflow-hidden relative">
              <img
                src="/src/assets/images/hero_railway_train_1793891880491.jpg"
                alt="Vande Bharat Express"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-blue-900 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                20901 · Vande Bharat
              </div>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-bold text-slate-900 text-base">
                Mumbai Central – Gandhinagar Vande Bharat
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Semi-high speed train with 160 km/h design speed, 180° rotatable executive seats, aerodynamic nose cone, and on-board infotainment.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Route: MMCT ↔ ADI</span>
                <span className="text-blue-900 font-bold">5h 25m</span>
              </div>
            </div>
          </div>

          {/* Card 2: Tejas Rajdhani */}
          <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-44 overflow-hidden relative">
              <img
                src="/src/assets/images/station_mumbai_cst_1793891880980.jpg"
                alt="Mumbai CST Station and Heritage Terminus"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-orange-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                12951 · Tejas Rajdhani
              </div>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-bold text-slate-900 text-base">
                Mumbai Central – New Delhi Tejas Rajdhani
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upgraded smart sleeper coaches with automatic plug doors, WiFi connectivity, bio-vacuum toilets, and sensor-based facilities.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Route: MMCT ↔ NDLS</span>
                <span className="text-blue-900 font-bold">15h 32m</span>
              </div>
            </div>
          </div>

          {/* Card 3: Modern Coach Comfort */}
          <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-44 overflow-hidden relative">
              <img
                src="/src/assets/images/train_coach_interior_1793891881545.jpg"
                alt="Modern Train Coach Interior"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-emerald-700 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                Executive & AC Chair
              </div>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-bold text-slate-900 text-base">
                First Class & AC Sleeper Luxury
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ergonomically engineered passenger seating with panoramic acoustic glass windows, charging sockets, and personal reading lamps.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Classes: 1A, 2A, 3A, EC</span>
                <span className="text-emerald-700 font-bold">Premium</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* System Features Section (Easy booking, Secure reservations, Instant PNR, Management) */}
      <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-sm">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Engineered for Modern Rail Travel
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A complete relational DBMS project simulating real-world Indian Railways reservation workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5 text-blue-900" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Easy Booking
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Intuitive search across 18 stations and 10 signature trains with instant fare calculations and multi-passenger reservations.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              ACID Transactional Security
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Database transactions lock seats, create passenger mappings, and record payments atomically to eliminate double-booking race conditions.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-900 flex items-center justify-center font-bold">
              <Ticket className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Instant PNR & Seat Allocation
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatic generation of 10-digit Indian Railway PNR format with real coach and seat/berth numbering and PDF ticket export.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 text-purple-800" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Booking Management
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full lifecycle ticket tracking, cancellation transactions with automatic seat release back to inventory, and simulated refunds.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
