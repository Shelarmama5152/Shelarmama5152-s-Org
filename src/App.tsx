import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HeroSearch } from './components/HeroSearch';
import { TrainCard } from './components/TrainCard';
import { BookingModal } from './components/BookingModal';
import { ScheduleModal } from './components/ScheduleModal';
import { PNRSearch } from './components/PNRSearch';
import { MyBookings } from './components/MyBookings';
import { AdminDashboard } from './components/AdminDashboard';
import { DbmsConsole } from './components/DbmsConsole';
import { AboutModal } from './components/AboutModal';
import { AuthModal } from './components/AuthModal';
import { api } from './services/api';
import { Station, SearchTrainResult, ClassAvailability } from './types';
import { Search, Filter, ArrowUpDown, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);

  // Search results state
  const [searchResults, setSearchResults] = useState<{
    source?: Station;
    destination?: Station;
    journeyDate?: string;
    totalFound: number;
    trains: SearchTrainResult[];
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Search filter and sort controls
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'departure' | 'arrival' | 'duration' | 'fare'>('departure');

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedBookingTrain, setSelectedBookingTrain] = useState<{
    train: SearchTrainResult;
    selectedClass: ClassAvailability;
  } | null>(null);
  const [scheduleModalInfo, setScheduleModalInfo] = useState<{
    trainId: number;
    trainName: string;
    trainNumber: string;
  } | null>(null);

  // Initial PNR for PNR view navigation
  const [activePnrLookup, setActivePnrLookup] = useState<string>('');

  // Fetch stations on mount
  useEffect(() => {
    async function fetchStations() {
      try {
        setStationsLoading(true);
        const data = await api.getStations();
        setStations(data.stations);
      } catch (err) {
        console.error('Failed to load stations:', err);
      } finally {
        setStationsLoading(false);
      }
    }
    fetchStations();
  }, []);

  // Search handler
  const handleSearchTrains = async (from: string, to: string, date: string, travelClass: string) => {
    setSearchLoading(true);
    setSearchError(null);
    setActiveTab('search');
    try {
      const data = await api.searchTrains({
        from,
        to,
        date,
        class: travelClass,
        type: selectedTypeFilter !== 'All' ? selectedTypeFilter : undefined,
      });
      setSearchResults(data);
    } catch (err: any) {
      setSearchResults(null);
      setSearchError(err.message || 'No trains found for the selected stations.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Quick route selector from popular list
  const handleSelectQuickRoute = (fromCode: string, toCode: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    handleSearchTrains(fromCode, toCode, dateStr, 'All');
  };

  // Trigger booking modal
  const handleOpenBooking = (train: SearchTrainResult, selectedClass: ClassAvailability) => {
    setSelectedBookingTrain({ train, selectedClass });
  };

  // Sort and filter results
  const filteredAndSortedTrains = (searchResults?.trains || [])
    .filter((t) => {
      if (selectedTypeFilter !== 'All' && t.Train_Type !== selectedTypeFilter) return false;
      if (selectedClassFilter !== 'All' && !t.classes.some((c) => c.travelClass === selectedClassFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'departure') {
        return (a.Departure_Time || '').localeCompare(b.Departure_Time || '');
      }
      if (sortBy === 'arrival') {
        return (a.Arrival_Time || '').localeCompare(b.Arrival_Time || '');
      }
      if (sortBy === 'duration') {
        return a.Distance_Km - b.Distance_Km;
      }
      if (sortBy === 'fare') {
        const fareA = a.classes[0]?.fare || 0;
        const fareB = b.classes[0]?.fare || 0;
        return fareA - fareB;
      }
      return 0;
    });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white">
      
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW 1: HOME PAGE */}
        {activeTab === 'home' && (
          <HeroSearch
            stations={stations}
            onSearch={handleSearchTrains}
            onSelectQuickRoute={handleSelectQuickRoute}
          />
        )}

        {/* VIEW 2: TRAIN SEARCH & RESULTS */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            
            {/* Search Header Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('home')}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    {searchResults ? (
                      <span>
                        {searchResults.source?.Station_Name} → {searchResults.destination?.Station_Name}
                      </span>
                    ) : (
                      <span>Search Trains Across Routes</span>
                    )}
                  </h1>
                </div>
                {searchResults && (
                  <p className="text-xs text-slate-500 font-mono pl-6">
                    Journey Date: <strong className="text-slate-800">{searchResults.journeyDate}</strong> · Found {searchResults.totalFound} Available Trains
                  </p>
                )}
              </div>

              {/* Filter & Sorting Strip */}
              {searchResults && searchResults.trains.length > 0 && (
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  {/* Train Type Filter */}
                  <select
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium"
                  >
                    <option value="All">All Train Types</option>
                    <option value="Rajdhani">Rajdhani</option>
                    <option value="Vande Bharat">Vande Bharat</option>
                    <option value="Shatabdi">Shatabdi</option>
                    <option value="Superfast">Superfast</option>
                    <option value="Express">Express</option>
                  </select>

                  {/* Class Filter */}
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium"
                  >
                    <option value="All">All Classes</option>
                    <option value="1A">1A (AC First)</option>
                    <option value="2A">2A (AC 2 Tier)</option>
                    <option value="3A">3A (AC 3 Tier)</option>
                    <option value="EC">EC (Executive)</option>
                    <option value="CC">CC (Chair Car)</option>
                    <option value="SL">SL (Sleeper)</option>
                  </select>

                  {/* Sort By */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:ring-0 pr-2 cursor-pointer"
                    >
                      <option value="departure">Sort: Departure Time</option>
                      <option value="arrival">Sort: Arrival Time</option>
                      <option value="duration">Sort: Distance</option>
                      <option value="fare">Sort: Lowest Fare</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Results Grid */}
            {searchLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
                <span className="text-xs font-medium">Validating route order and seat inventory...</span>
              </div>
            ) : searchError ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-sm max-w-lg mx-auto">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <h3 className="font-bold text-sm text-slate-900">No Trains Found</h3>
                <p className="text-xs text-slate-500">{searchError}</p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-4 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Modify Search Stations
                </button>
              </div>
            ) : !searchResults ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-3 shadow-sm max-w-md mx-auto">
                <Search className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="font-bold text-sm text-slate-800">Ready to Search Trains</h3>
                <p className="text-xs">
                  Select your origin and destination stations to view live express schedules and seat inventory.
                </p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
                >
                  Go to Train Search Form
                </button>
              </div>
            ) : filteredAndSortedTrains.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-3 shadow-sm">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="font-bold text-sm text-slate-800">No Matching Trains</h3>
                <p className="text-xs">
                  No trains match your active filter criteria ({selectedTypeFilter} / {selectedClassFilter}). Try resetting the filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedTypeFilter('All');
                    setSelectedClassFilter('All');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-blue-900 bg-blue-50 rounded-lg"
                >
                  Reset Search Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedTrains.map((train) => (
                  <TrainCard
                    key={train.Train_ID}
                    train={train}
                    onBook={handleOpenBooking}
                    onViewSchedule={(id, name, num) =>
                      setScheduleModalInfo({ trainId: id, trainName: name, trainNumber: num })
                    }
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* VIEW 3: PNR STATUS & ENQUIRY */}
        {activeTab === 'pnr' && (
          <PNRSearch initialPnr={activePnrLookup} />
        )}

        {/* VIEW 4: MY BOOKINGS */}
        {activeTab === 'bookings' && (
          <MyBookings
            onSelectPnr={(pnr) => {
              setActivePnrLookup(pnr);
              setActiveTab('pnr');
            }}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {/* VIEW 5: DBMS LAB & ACADEMIC QUERIES */}
        {activeTab === 'dbms' && (
          <DbmsConsole />
        )}

        {/* VIEW 6: ADMIN DASHBOARD */}
        {activeTab === 'admin' && (
          user?.Role === 'Admin' ? (
            <AdminDashboard />
          ) : (
            <div className="max-w-md mx-auto p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-900 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Administrator Authentication Required
              </h3>
              <p className="text-xs text-slate-500">
                Please login with an Administrator role account to access train catalog management, station CRUD, route sequence configurations, and system-wide revenue ledgers.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
              >
                Sign In with Admin Credentials
              </button>
            </div>
          )
        )}

        {/* VIEW 7: ABOUT SYSTEM & ACADEMIC DOCUMENTATION */}
        {activeTab === 'about' && (
          <AboutModal />
        )}

      </main>

      {/* Global Modals */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {selectedBookingTrain && (
        <BookingModal
          train={selectedBookingTrain.train}
          selectedClass={selectedBookingTrain.selectedClass}
          onClose={() => setSelectedBookingTrain(null)}
          onBookingComplete={() => {
            setSelectedBookingTrain(null);
            setActiveTab('bookings');
          }}
        />
      )}

      {scheduleModalInfo && (
        <ScheduleModal
          trainId={scheduleModalInfo.trainId}
          trainName={scheduleModalInfo.trainName}
          trainNumber={scheduleModalInfo.trainNumber}
          onClose={() => setScheduleModalInfo(null)}
        />
      )}

      {/* Footer */}
      <Footer
        setActiveTab={setActiveTab}
        onOpenAuth={() => setShowAuthModal(true)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
