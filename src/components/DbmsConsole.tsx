import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Database,
  Terminal,
  Play,
  FileCode,
  Download,
  CheckCircle2,
  AlertCircle,
  Table,
  Layers,
  Clock,
  Sparkles,
  Loader2,
  ChevronRight
} from 'lucide-react';

export const DbmsConsole: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'queries' | 'console' | 'schema' | 'export'>('queries');
  const [queries, setQueries] = useState<any[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<any | null>(null);
  const [loadingQueries, setLoadingQueries] = useState(true);

  // Interactive console states
  const [customSql, setCustomSql] = useState<string>(
    'SELECT t.Train_Number, t.Train_Name, t.Train_Type, COUNT(b.Booking_ID) AS Total_Bookings, SUM(b.Total_Amount) AS Total_Revenue FROM Train t LEFT JOIN Booking b ON t.Train_ID = b.Train_ID WHERE b.Status = "Confirmed" GROUP BY t.Train_ID, t.Train_Number, t.Train_Name ORDER BY Total_Revenue DESC;'
  );
  const [consoleResult, setConsoleResult] = useState<any | null>(null);
  const [executingCustom, setExecutingCustom] = useState(false);

  // Schema state
  const [schemaData, setSchemaData] = useState<any>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);

  useEffect(() => {
    async function loadQueries() {
      try {
        setLoadingQueries(true);
        const data = await api.getDbmsQueries();
        setQueries(data.queries);
        if (data.queries.length > 0) {
          setSelectedQuery(data.queries[0]);
        }
      } catch (err) {
        console.error('Failed to load DBMS queries:', err);
      } finally {
        setLoadingQueries(false);
      }
    }
    loadQueries();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'schema' && !schemaData) {
      setLoadingSchema(true);
      api.getDbmsSchema().then((data) => {
        setSchemaData(data);
      }).catch(console.error).finally(() => setLoadingSchema(false));
    }
  }, [activeSubTab, schemaData]);

  const handleExecuteCustom = async () => {
    if (!customSql.trim()) return;
    setExecutingCustom(true);
    setConsoleResult(null);
    try {
      const res = await api.executeDbmsQuery(customSql.trim());
      setConsoleResult(res);
    } catch (err: any) {
      setConsoleResult({ success: false, error: err.message || 'Execution failed' });
    } finally {
      setExecutingCustom(false);
    }
  };

  const samplePresets = [
    { label: 'Train Revenue Aggregation', sql: 'SELECT Train_Number, Train_Name, Total_Seats FROM Train;' },
    { label: 'Booking Details View', sql: 'SELECT * FROM Booking_Details LIMIT 10;' },
    { label: 'Station Departures', sql: 'SELECT s.Station_Name, s.City, COUNT(b.Booking_ID) AS Departures FROM Station s LEFT JOIN Booking b ON s.Station_ID = b.Source_Station_ID GROUP BY s.Station_ID ORDER BY Departures DESC;' },
    { label: 'Seat Inventory Status', sql: 'SELECT Travel_Class, Seat_Status, COUNT(*) AS Count FROM Seat_Inventory WHERE Journey_Date = "2026-11-15" GROUP BY Travel_Class, Seat_Status;' },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>Academic DBMS Mini-Project Evaluation</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            DBMS Concept Demonstrations & SQL Terminal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrating relational modeling, 3NF normalization, ACID transactions, relational joins, subqueries, and views.
          </p>
        </div>

        {/* SQL Export Downloads */}
        <div className="flex items-center gap-2">
          <a
            href="/api/dbms/download-sql/RailwayDB.sql"
            download="RailwayDB.sql"
            className="px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>RailwayDB.sql</span>
          </a>
          <a
            href="/api/dbms/download-sql/seed.sql"
            download="seed.sql"
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>seed.sql</span>
          </a>
          <a
            href="/api/dbms/download-sql/queries.sql"
            download="queries.sql"
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>queries.sql</span>
          </a>
        </div>
      </div>

      {/* Concept Badges Strip */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 text-xs flex flex-wrap items-center gap-2">
        <span className="font-bold text-orange-400 uppercase tracking-wider text-[11px]">Implemented Concepts:</span>
        {[
          '1. CREATE DATABASE', '2. CREATE TABLE', '3. INSERT', '4. SELECT', '5. UPDATE', '6. DELETE',
          '7. WHERE', '8. ORDER BY', '9. GROUP BY', '10. HAVING', '11. INNER JOIN', '12. LEFT JOIN',
          '13. AGGREGATES (COUNT, SUM, AVG, MIN, MAX)', '14. SUBQUERIES', '15. VIEWS', '16. TRANSACTIONS', '17. INDEXES'
        ].map((tag, i) => (
          <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
            {tag}
          </span>
        ))}
      </div>

      {/* Sub-tabs switcher */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-semibold">
          {[
            { id: 'queries', label: '15+ Academic Queries & Outputs', icon: FileCode },
            { id: 'console', label: 'Interactive SQL Console', icon: Terminal },
            { id: 'schema', label: 'Relational Schema & 3NF Models', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* SUB-TAB 1: 15+ ACADEMIC QUERIES & LIVE OUTPUTS */}
      {activeSubTab === 'queries' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Query Selection List (Left Column) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm max-h-[750px] overflow-y-auto">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
              DBMS Query Showcase ({queries.length} Queries)
            </div>
            {loadingQueries ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-blue-900" />
                <span className="text-xs">Executing academic queries...</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {queries.map((q) => {
                  const isSelected = selectedQuery?.id === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuery(q)}
                      className={`w-full text-left p-3.5 transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/80 border-l-4 border-l-blue-900'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-900">
                            Query #{q.id}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {q.rowCount} rows · {q.executionTimeMs}ms
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {q.title}
                        </h4>
                        <div className="text-[11px] text-orange-700 font-semibold">
                          {q.concept}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Query Details & Results View (Right Column) */}
          <div className="lg:col-span-7 space-y-4">
            {selectedQuery && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
                
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span className="font-bold text-blue-900">Query ID: #{selectedQuery.id}</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <Clock className="w-3.5 h-3.5" />
                      Executed in {selectedQuery.executionTimeMs} ms
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedQuery.title}
                  </h3>
                  <div className="text-xs font-semibold text-orange-700">
                    Concept Demonstrated: {selectedQuery.concept}
                  </div>
                  <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                    {selectedQuery.description}
                  </p>
                </div>

                {/* SQL Code Block */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
                    <span>SQL Query</span>
                    <button
                      onClick={() => {
                        setCustomSql(selectedQuery.sql);
                        setActiveSubTab('console');
                      }}
                      className="text-blue-900 hover:underline normal-case text-xs font-medium"
                    >
                      Open in Interactive Console →
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                    <code>{selectedQuery.sql}</code>
                  </pre>
                </div>

                {/* Live Output Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
                    <span>Live Database Output ({selectedQuery.rowCount} rows returned)</span>
                  </div>

                  {selectedQuery.error ? (
                    <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      {selectedQuery.error}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[360px] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200 sticky top-0">
                          <tr>
                            {selectedQuery.columns?.map((col: string, i: number) => (
                              <th key={i} className="py-2.5 px-3 whitespace-nowrap font-mono">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {selectedQuery.results?.map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-50/70">
                              {selectedQuery.columns?.map((col: string, cIdx: number) => (
                                <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-slate-800">
                                  {String(row[col] ?? 'NULL')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-TAB 2: INTERACTIVE SQL CONSOLE */}
      {activeSubTab === 'console' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-900" />
                  <span>Execute Arbitrary SQL Against RailwayDB</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Write any standard SQL query (SELECT, JOIN, GROUP BY, subqueries, view lookups)
                </p>
              </div>

              {/* Sample Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-semibold">Presets:</span>
                {samplePresets.map((sp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomSql(sp.sql)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors text-[11px] font-medium"
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SQL Textarea */}
            <div className="relative">
              <textarea
                rows={5}
                value={customSql}
                onChange={(e) => setCustomSql(e.target.value)}
                placeholder="Enter SQL statement here (e.g., SELECT * FROM Train;)"
                className="w-full p-4 font-mono text-xs text-slate-100 bg-slate-900 rounded-xl border border-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-none"
              />
            </div>

            {/* Execute Button */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Connected to: <strong className="text-slate-800 font-mono">RailwayDB</strong>
              </div>
              <button
                type="button"
                disabled={executingCustom}
                onClick={handleExecuteCustom}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {executingCustom ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>Run SQL Statement</span>
              </button>
            </div>

          </div>

          {/* Results Output */}
          {consoleResult && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800 uppercase tracking-wider">
                  Query Execution Results
                </span>
                {consoleResult.success ? (
                  <div className="flex items-center gap-3 font-mono text-slate-500">
                    <span>Rows: <strong className="text-slate-900">{consoleResult.rowCount}</strong></span>
                    <span>Execution Time: <strong className="text-emerald-700">{consoleResult.executionTimeMs} ms</strong></span>
                  </div>
                ) : null}
              </div>

              {!consoleResult.success ? (
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
                  {consoleResult.error}
                </div>
              ) : consoleResult.rowCount === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-mono">
                  0 rows returned. Query executed successfully with 0 matching records.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[420px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200 sticky top-0">
                      <tr>
                        {consoleResult.columns.map((col: string, i: number) => (
                          <th key={i} className="py-2.5 px-3 whitespace-nowrap font-mono">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {consoleResult.rows.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-50/70">
                          {consoleResult.columns.map((col: string, cIdx: number) => (
                            <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-slate-800">
                              {String(row[col] ?? 'NULL')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: RELATIONAL SCHEMA & 3NF MODELS */}
      {activeSubTab === 'schema' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Relational Model & 3NF Normalization Structure
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                RailwayDB is normalized up to Third Normal Form (3NF). Every non-prime attribute is fully functionally dependent on primary keys with zero transitive dependencies.
              </p>
            </div>

            {loadingSchema ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-900" />
              </div>
            ) : schemaData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {schemaData.tables?.map((table: any) => (
                  <div
                    key={table.tableName}
                    className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-blue-900" />
                        <h4 className="font-bold text-sm text-slate-900 font-mono">
                          {table.tableName}
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {table.rowCount} records
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-xs">
                      {table.columns.map((c: any) => (
                        <div key={c.cid} className="flex items-center justify-between text-[11px]">
                          <span className={c.isPrimaryKey ? 'font-bold text-orange-600' : 'text-slate-800'}>
                            {c.isPrimaryKey && '🔑 '}
                            {c.name}
                          </span>
                          <span className="text-slate-400">
                            {c.type} {c.notNull ? 'NOT NULL' : ''}
                          </span>
                        </div>
                      ))}
                    </div>

                    {table.foreignKeys && table.foreignKeys.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
                        <span className="font-bold text-slate-700">Foreign Keys: </span>
                        {table.foreignKeys.map((fk: any, i: number) => (
                          <span key={i} className="text-blue-900 block">
                            ↳ {fk.column} references {fk.referencesTable}({fk.referencesColumn})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
};
