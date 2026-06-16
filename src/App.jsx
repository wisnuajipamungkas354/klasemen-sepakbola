import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Calendar, Check, Undo2, Activity, Info } from 'lucide-react';

const TEAMS = ["Klari", "Lemah Mulya", "Adiarsa Timur", "Tunggak Jati"];

const INITIAL_MATCHES = [
  { id: 1, home: "Lemah Mulya", away: "Adiarsa Timur", homeScore: '', awayScore: '', homeYellow: '', awayYellow: '', homeRed: '', awayRed: '', isPlayed: false },
  { id: 2, home: "Klari", away: "Tunggak Jati", homeScore: '', awayScore: '', homeYellow: '', awayYellow: '', homeRed: '', awayRed: '', isPlayed: false },
  { id: 3, home: "Adiarsa Timur", away: "Klari", homeScore: '', awayScore: '', homeYellow: '', awayYellow: '', homeRed: '', awayRed: '', isPlayed: false },
  { id: 4, home: "Lemah Mulya", away: "Tunggak Jati", homeScore: '', awayScore: '', homeYellow: '', awayYellow: '', homeRed: '', awayRed: '', isPlayed: false },
  { id: 5, home: "Lemah Mulya", away: "Klari", homeScore: '', awayScore: '', homeYellow: '', awayYellow: '', homeRed: '', awayRed: '', isPlayed: false },
  { id: 6, home: "Adiarsa Timur", away: "Tunggak Jati", homeScore: '', awayScore: '', homeYellow: '', awayYellow: '', homeRed: '', awayRed: '', isPlayed: false }
];

export default function App() {
  const [matches, setMatches] = useState(() => {
    // Cek apakah ada data tersimpan di localStorage saat aplikasi pertama kali dimuat
    const savedMatches = localStorage.getItem('minisoccer_matches_v2');
    if (savedMatches) {
      try {
        return JSON.parse(savedMatches);
      } catch (e) {
        console.error("Gagal membaca data dari localStorage", e);
        return INITIAL_MATCHES;
      }
    }
    return INITIAL_MATCHES;
  });

  // Efek ini akan berjalan setiap kali state 'matches' berubah (misal saat skor disimpan/diedit)
  useEffect(() => {
    localStorage.setItem('minisoccer_matches_v2', JSON.stringify(matches));
  }, [matches]);

  // Function to handle input changes (works for both scores and cards)
  const handleInputChange = (matchId, type, value) => {
    // Only allow numbers or empty string
    if (value !== '' && !/^\d+$/.test(value)) return;
    
    setMatches(prevMatches => 
      prevMatches.map(match => 
        match.id === matchId ? { ...match, [type]: value } : match
      )
    );
  };

  // Function to save a match result including cards
  const handleSaveMatch = (matchId) => {
    setMatches(prevMatches => prevMatches.map(match => {
      if (match.id === matchId) {
        return { 
          ...match, 
          homeScore: match.homeScore === '' ? 0 : parseInt(match.homeScore), 
          awayScore: match.awayScore === '' ? 0 : parseInt(match.awayScore),
          homeYellow: match.homeYellow === '' ? 0 : parseInt(match.homeYellow),
          awayYellow: match.awayYellow === '' ? 0 : parseInt(match.awayYellow),
          homeRed: match.homeRed === '' ? 0 : parseInt(match.homeRed),
          awayRed: match.awayRed === '' ? 0 : parseInt(match.awayRed),
          isPlayed: true 
        };
      }
      return match;
    }));
  };

  // Function to reset/edit a match (this acts as the edit feature)
  const handleUndoMatch = (matchId) => {
    setMatches(prevMatches => prevMatches.map(match => 
      match.id === matchId ? { 
        ...match, 
        // Mengosongkan kembali form saat di-reset
        homeScore: '', awayScore: '', 
        homeYellow: '', awayYellow: '', 
        homeRed: '', awayRed: '', 
        isPlayed: false // Resetting 'isPlayed' makes the inputs editable again
      } : match
    ));
  };

  // Calculate standings dynamically based on played matches
  const standings = useMemo(() => {
    // Initialize points mapping for all teams
    let table = TEAMS.reduce((acc, team) => {
      acc[team] = { 
        name: team, played: 0, win: 0, draw: 0, lose: 0, 
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
        yellowCards: 0, redCards: 0
      };
      return acc;
    }, {});

    // Loop through matches to calculate stats
    matches.forEach(match => {
      if (match.isPlayed) {
        // Update stats for Home Team
        table[match.home].played += 1;
        table[match.home].goalsFor += match.homeScore;
        table[match.home].goalsAgainst += match.awayScore;
        table[match.home].yellowCards += match.homeYellow;
        table[match.home].redCards += match.homeRed;

        // Update stats for Away Team
        table[match.away].played += 1;
        table[match.away].goalsFor += match.awayScore;
        table[match.away].goalsAgainst += match.homeScore;
        table[match.away].yellowCards += match.awayYellow;
        table[match.away].redCards += match.awayRed;

        // Calculate Points & W/D/L
        if (match.homeScore > match.awayScore) {
          table[match.home].win += 1;
          table[match.home].points += 3;
          table[match.away].lose += 1;
        } else if (match.homeScore < match.awayScore) {
          table[match.away].win += 1;
          table[match.away].points += 3;
          table[match.home].lose += 1;
        } else {
          table[match.home].draw += 1;
          table[match.away].draw += 1;
          table[match.home].points += 1;
          table[match.away].points += 1;
        }
      }
    });

    // Calculate Goal Difference and convert to array
    const standingsArray = Object.values(table).map(team => ({
      ...team,
      goalDifference: team.goalsFor - team.goalsAgainst
    }));

    // Sort logic (like Premier League): Points > Goal Difference > Goals For
    standingsArray.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    return standingsArray;
  }, [matches]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10">
      
      {/* Header App */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">TURNAMEN U45</h1>
              <p className="text-xs text-slate-300">MINISOCCER KARAWANG TIMUR</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-2 mt-6 space-y-8">
        
        {}
        {/* Standings Table Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-white">Klasemen Sementara</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-3 py-3 w-8 text-center">#</th>
                  <th className="px-3 py-3">Klub</th>
                  <th className="px-2 py-3 text-center" title="Main">M</th>
                  <th className="px-2 py-3 text-center text-emerald-600" title="Menang">M</th>
                  <th className="px-2 py-3 text-center text-amber-500" title="Seri">S</th>
                  <th className="px-2 py-3 text-center text-red-500" title="Kalah">K</th>
                  <th className="px-2 py-3 text-center hidden sm:table-cell" title="Gol Memasukkan">GM</th>
                  <th className="px-2 py-3 text-center hidden sm:table-cell" title="Gol Kemasukan">GK</th>
                  <th className="px-2 py-3 text-center" title="Selisih Gol">SG</th>
                  <th className="px-2 py-3 text-center bg-yellow-100" title="Kartu Kuning">KK</th>
                  <th className="px-2 py-3 text-center bg-red-100" title="Kartu Merah">KM</th>
                  <th className="px-3 py-3 text-center font-bold bg-slate-100" title="Poin">PTS</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => (
                  <tr key={team.name} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${index === 0 ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-3 py-3 text-center font-medium text-gray-500">
                      {index === 1 ? (
                         <div className="w-6 h-6 mx-auto rounded-full bg-amber-400 text-white flex items-center justify-center text-xs shadow-sm">1</div>
                      ) : index === 0 ? ( // Posisi ke-2 visual (index 0 karena sudah di-swap)
                         <div className="w-6 h-6 mx-auto rounded-full bg-slate-300 text-white flex items-center justify-center text-xs shadow-sm">1</div>
                      ) : index + 1}
                    </td>
                    <td className="px-3 py-3 font-semibold whitespace-nowrap">
                      {team.name}
                      {index === 0 && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Top</span>}
                    </td>
                    <td className="px-2 py-3 text-center text-slate-500">{team.played}</td>
                    <td className="px-2 py-3 text-center">{team.win}</td>
                    <td className="px-2 py-3 text-center">{team.draw}</td>
                    <td className="px-2 py-3 text-center">{team.lose}</td>
                    <td className="px-2 py-3 text-center hidden sm:table-cell text-slate-500">{team.goalsFor}</td>
                    <td className="px-2 py-3 text-center hidden sm:table-cell text-slate-500">{team.goalsAgainst}</td>
                    <td className="px-2 py-3 text-center">{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                    <td className="px-2 py-3 text-center bg-yellow-50">{team.yellowCards}</td>
                    <td className="px-2 py-3 text-center bg-red-50">{team.redCards}</td>
                    <td className="px-3 py-3 text-center font-bold bg-slate-50 text-slate-800">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Legend for the table columns */}
          <div className="bg-slate-50 px-4 py-3 border-t border-gray-100 text-[11px] text-slate-500 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex items-center gap-1"><Info className="w-3 h-3"/> <b>M:</b> Main (Played)</div>
            <div><b>M (Hijau):</b> Menang (Win)</div>
            <div><b>S:</b> Seri (Draw)</div>
            <div><b>K:</b> Kalah (Lose)</div>
            <div className="hidden sm:block"><b>GM:</b> Gol Memasukkan</div>
            <div className="hidden sm:block"><b>GK:</b> Gol Kemasukan</div>
            <div><b>SG:</b> Selisih Gol</div>
            <div><b>KK/KM:</b> K. Kuning / Merah</div>
          </div>
        </section>

        {}
        {/* Matches Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-5 h-5 text-slate-700" />
            <h2 className="font-semibold text-slate-800 text-lg">Jadwal & Hasil Pertandingan</h2>
          </div>

          <div className="grid gap-3">
            {matches.map((match) => (
              <div key={match.id} className={`bg-white rounded-xl border transition-all ${match.isPlayed ? 'border-emerald-200 shadow-sm' : 'border-gray-200 shadow'}`}>
                
                {/* Match Header (Teams and Score) */}
                <div className="p-4 flex items-center justify-between gap-2">
                  {/* Home Team */}
                  <div className="flex-1 text-right">
                    <p className={`font-bold text-sm sm:text-base leading-tight ${match.isPlayed && match.homeScore > match.awayScore ? 'text-slate-900' : 'text-slate-600'}`}>
                      {match.home}
                    </p>
                  </div>

                  {/* Score / Inputs */}
                  <div className="flex flex-col items-center justify-center w-28 shrink-0">
                    {match.isPlayed ? (
                      // Render Saved Score
                      <div className="bg-slate-800 text-white px-4 py-1.5 rounded-lg font-bold text-xl tracking-widest shadow-inner">
                        {match.homeScore} - {match.awayScore}
                      </div>
                    ) : (
                      // Render Input Form for Score
                      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                        <input 
                          type="text" inputMode="numeric" pattern="[0-9]*"
                          className="w-10 h-10 text-center font-bold text-lg rounded bg-white border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={match.homeScore}
                          onChange={(e) => handleInputChange(match.id, 'homeScore', e.target.value)}
                        />
                        <span className="text-slate-400 font-bold">-</span>
                        <input 
                          type="text" inputMode="numeric" pattern="[0-9]*"
                          className="w-10 h-10 text-center font-bold text-lg rounded bg-white border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={match.awayScore}
                          onChange={(e) => handleInputChange(match.id, 'awayScore', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 text-left">
                    <p className={`font-bold text-sm sm:text-base leading-tight ${match.isPlayed && match.awayScore > match.homeScore ? 'text-slate-900' : 'text-slate-600'}`}>
                      {match.away}
                    </p>
                  </div>
                </div>

                {/* Cards Input & Action Button Section */}
                <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex flex-row items-center justify-between gap-1 sm:gap-4 rounded-b-xl">
                  
                  {/* Home Cards */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                      <div className="w-3 h-4 bg-yellow-400 rounded-sm"></div>
                      {match.isPlayed ? (
                        <span className="text-xs font-bold w-4 text-center">{match.homeYellow}</span>
                      ) : (
                        <input type="text" inputMode="numeric" placeholder="0" className="w-6 text-xs text-center outline-none bg-transparent" value={match.homeYellow} onChange={(e) => handleInputChange(match.id, 'homeYellow', e.target.value)} />
                      )}
                    </div>
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                      <div className="w-3 h-4 bg-red-500 rounded-sm"></div>
                      {match.isPlayed ? (
                        <span className="text-xs font-bold w-4 text-center">{match.homeRed}</span>
                      ) : (
                        <input type="text" inputMode="numeric" placeholder="0" className="w-6 text-xs text-center outline-none bg-transparent" value={match.homeRed} onChange={(e) => handleInputChange(match.id, 'homeRed', e.target.value)} />
                      )}
                    </div>
                  </div>

                  {/* Away Cards */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                      {match.isPlayed ? (
                        <span className="text-xs font-bold w-4 text-center">{match.awayYellow}</span>
                      ) : (
                        <input type="text" inputMode="numeric" placeholder="0" className="w-6 text-xs text-center outline-none bg-transparent" value={match.awayYellow} onChange={(e) => handleInputChange(match.id, 'awayYellow', e.target.value)} />
                      )}
                      <div className="w-3 h-4 bg-yellow-400 rounded-sm"></div>
                    </div>
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                      {match.isPlayed ? (
                        <span className="text-xs font-bold w-4 text-center">{match.awayRed}</span>
                      ) : (
                        <input type="text" inputMode="numeric" placeholder="0" className="w-6 text-xs text-center outline-none bg-transparent" value={match.awayRed} onChange={(e) => handleInputChange(match.id, 'awayRed', e.target.value)} />
                      )}
                      <div className="w-3 h-4 bg-red-500 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                {/* Action Button (Save / Undo) */}
                  <div className="flex w-full justify-center items-center py-2">
                    {match.isPlayed ? (
                       <button 
                         onClick={() => handleUndoMatch(match.id)}
                         className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                       >
                         <Undo2 className="w-3.5 h-3.5" /> Edit/Reset
                       </button>
                    ) : (
                      <button 
                        onClick={() => handleSaveMatch(match.id)}
                        disabled={match.homeScore === '' || match.awayScore === ''}
                        className="flex items-center gap-1.5 px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        <Check className="w-4 h-4" /> Simpan
                      </button>
                    )}
                  </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}