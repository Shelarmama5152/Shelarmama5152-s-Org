import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Train, TrainStop } from '../types';
import { X, Clock, MapPin, Loader2 } from 'lucide-react';

interface ScheduleModalProps {
  trainId: number;
  trainName: string;
  trainNumber: string;
  onClose: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ trainId, trainName, trainNumber, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [stops, setStops] = useState<TrainStop[]>([]);
  const [train, setTrain] = useState<Train | null>(null);

  useEffect(() => {
    async function loadSchedule() {
      try {
        setLoading(true);
        const data = await api.getTrainDetails(trainId);
        setTrain(data.train);
        setStops(data.stops);
      } catch (err) {
        console.error('Failed to load schedule:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, [trainId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-900 text-white">
                {trainNumber}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Complete Route Timetable
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {trainName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-blue-900" />
              <span className="text-xs font-medium">Fetching station schedule...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 font-mono">
                <span>Train Type: <strong className="text-slate-800">{train?.Train_Type}</strong></span>
                <span>Total Stops: <strong className="text-slate-800">{stops.length} Stations</strong></span>
              </div>

              {/* Station Stop Timeline */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {stops.map((stop, index) => {
                  const isFirst = index === 0;
                  const isLast = index === stops.length - 1;

                  return (
                    <div key={stop.Stop_ID} className="relative flex items-start justify-between gap-4">
                      {/* Circle indicator on timeline */}
                      <div
                        className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                          isFirst
                            ? 'bg-blue-900 border-white ring-2 ring-blue-900/30'
                            : isLast
                            ? 'bg-orange-600 border-white ring-2 ring-orange-600/30'
                            : 'bg-white border-slate-400'
                        }`}
                      />

                      {/* Station Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-900">
                            #{stop.Stop_Number}
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {stop.Station_Name}
                          </span>
                          <span className="font-mono text-xs text-slate-500">
                            ({stop.Station_Code})
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{stop.City}</span>
                          <span>·</span>
                          <span className="font-mono">{stop.Distance_From_Source} km</span>
                        </div>
                      </div>

                      {/* Arrival & Departure Times */}
                      <div className="text-right text-xs font-mono shrink-0">
                        {isFirst ? (
                          <div className="text-blue-900 font-bold">
                            Dep: {stop.Departure_Time || '--:--'}
                          </div>
                        ) : isLast ? (
                          <div className="text-orange-600 font-bold">
                            Arr: {stop.Arrival_Time || '--:--'}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="text-slate-700">Arr: {stop.Arrival_Time || '--:--'}</div>
                            <div className="text-slate-900 font-semibold">Dep: {stop.Departure_Time || '--:--'}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close Schedule
          </button>
        </div>

      </div>
    </div>
  );
};
