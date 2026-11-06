import React, { useState } from 'react';
import { SearchTrainResult, ClassAvailability } from '../types';
import { Clock, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';

interface TrainCardProps {
  train: SearchTrainResult;
  onBook: (train: SearchTrainResult, selectedClass: ClassAvailability) => void;
  onViewSchedule: (trainId: number, trainName: string, trainNumber: string) => void;
}

export const TrainCard: React.FC<TrainCardProps> = ({ train, onBook, onViewSchedule }) => {
  const [selectedClass, setSelectedClass] = useState<ClassAvailability>(
    train.classes[0] || { travelClass: '3A', fare: 1250, availableSeats: 30, status: 'AVL 30' }
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
      
      {/* Top Banner: Train Name, Number, Type */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-900 text-white tracking-wide">
            {train.Train_Number}
          </span>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            {train.Train_Name}
          </h3>
          <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            {train.Train_Type}
          </span>
        </div>

        <button
          onClick={() => onViewSchedule(train.Train_ID, train.Train_Name, train.Train_Number)}
          className="text-xs text-blue-900 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
        >
          <span>View Timetable</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle Grid: Departure, Duration, Arrival */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        
        {/* Departure Station & Time */}
        <div className="space-y-0.5">
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {train.Departure_Time || '--:--'}
          </div>
          <div className="font-semibold text-sm text-slate-800">
            {train.Source_Station_Name}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Station Code: {train.Source_Station_Code}
          </div>
        </div>

        {/* Journey Duration Graphic */}
        <div className="flex flex-col items-center justify-center text-center space-y-1">
          <div className="flex items-center gap-1 text-xs font-mono font-medium text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{train.duration}</span>
          </div>
          <div className="w-full flex items-center gap-1.5 px-4">
            <div className="w-2 h-2 rounded-full bg-blue-900 shrink-0" />
            <div className="h-0.5 flex-1 bg-slate-300 relative">
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="w-2 h-2 rounded-full bg-orange-600 shrink-0" />
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {train.Distance_Km} km distance
          </div>
        </div>

        {/* Arrival Station & Time */}
        <div className="space-y-0.5 sm:text-right">
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {train.Arrival_Time || '--:--'}
          </div>
          <div className="font-semibold text-sm text-slate-800">
            {train.Dest_Station_Name}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Station Code: {train.Dest_Station_Code}
          </div>
        </div>

      </div>

      {/* Class Selection Strip */}
      <div className="px-5 pb-5 pt-1 space-y-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Select Travel Class & Availability
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {train.classes.map((cls) => {
            const isSelected = selectedClass.travelClass === cls.travelClass;
            const isAvailable = cls.availableSeats > 0;

            return (
              <button
                key={cls.travelClass}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`p-3 rounded-lg border text-left transition-all relative ${
                  isSelected
                    ? 'border-blue-900 bg-blue-50/70 shadow-sm ring-1 ring-blue-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">
                    {cls.travelClass}
                  </span>
                  <span className="font-extrabold text-sm text-slate-900 font-mono">
                    ₹{cls.fare}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-xs">
                  <span
                    className={`font-semibold font-mono ${
                      isAvailable ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {cls.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    General
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Selected: <strong className="text-slate-900">{selectedClass.travelClass}</strong> (₹{selectedClass.fare} / passenger)</span>
        </div>

        <button
          onClick={() => onBook(train, selectedClass)}
          className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap active:scale-[0.98]"
        >
          Book Ticket Now
        </button>
      </div>

    </div>
  );
};
