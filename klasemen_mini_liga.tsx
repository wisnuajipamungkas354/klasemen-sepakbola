import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Calendar, Check, Undo2, Activity, Info } from 'lucide-react';

const TEAMS = ["Klari", "Lemah Mulya", "Adiarsa Timur", "Tunggak Jati"];

// Generate 6 single round-robin matches with additional fields for cards
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
    const savedMatches = localStorage.getItem('minisoccer_matches');
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

  // Efek ini akan berjalan setiap kali state 'matches' berubah (misal saat skor disimpan)
  useEffect(() => {
    localStorage.setItem('minisoccer_matches', JSON.stringify(matches));
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
    const newMatches = matches.map(match => {
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
    });
    saveSync(newMatches); // Simpan dan tembak ke Cloud
  };

  // Function to reset a match
  const handleUndoMatch = (matchId) => {
    const newMatches = matches.map(match => 
      match.id === matchId ? { 
        ...match, 
        homeScore: '', awayScore: '', 
        homeYellow: '', awayYellow: '', 
        homeRed: '', awayRed: '', 
        isPlayed: false 
      } : match
    );
    saveSync(newMatches); // Reset dan tembak ke Cloud
  };

  // Calculate standings dynamically based on played matches
  const standings = useMemo(() => {
    // Initialize stats for all teams, including yc (yellow cards) and rc (red cards)
    const stats = TEAMS.reduce((acc, team) => {
      acc[team] = { name: team, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, yc: 0, rc: 0 };
      return acc;
    }, {});

    // Calculate stats from matches
    matches.forEach(match => {
      if (match.isPlayed) {
        const hTeam = stats[match.home];
        const aTeam = stats[match.away];
        const hScore = parseInt(match.homeScore);
        const aScore = parseInt(match.awayScore);

        // Update matches played
        hTeam.p += 1;
        aTeam.p += 1;

        // Update goals
        hTeam.gf += hScore;
        hTeam.ga += aScore;
        aTeam.gf += aScore;
        aTeam.ga += hScore;

        // Update cards
        hTeam.yc += parseInt(match.homeYellow);
        aTeam.yc += parseInt(match.awayYellow);
        hTeam.rc += parseInt(match.homeRed);
        aTeam.rc += parseInt(match.awayRed);

        // Determine result
        if (hScore > aScore) {
          hTeam.w += 1; hTeam.pts += 3;
          aTeam.l += 1;
        } else if (hScore < aScore) {
          aTeam.w += 1; aTeam.pts += 3;
          hTeam.l += 1;
        } else {
          hTeam.d += 1; hTeam.pts += 1;
          aTeam.d += 1; aTeam.pts += 1;
        }
      }
    });

    // Calculate Goal Difference and convert to array
    const standingsArray = Object.values(stats).map(team => ({
      ...team,
      gd: team.gf - team.ga
    }));

    // Sort logic: Points (desc) -> Goal Diff (desc) -> Goals For (desc) -> Alphabetical
    return standingsArray.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name);
    });
  }, [matches]);

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800 font-sans pb-12 selection:bg-neutral-200">
      {/* Header */}
      <header className="bg-neutral-900 text-white pt-5 pb-4 sticky top-0 z-20 shadow-xl shadow-neutral-900/10">
        <div className="max-w-md mx-auto px-4 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h1 className="text-sm font-bold tracking-widest text-center uppercase">
              Turnamen U45 Minisoccer
            </h1>
          </div>
          <p className="text-center text-[10px] text-neutral-400 font-medium tracking-[0.2em] mt-0.5">KARAWANG TIMUR</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-3 mt-6 space-y-6">
        
        {/* Standings Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-neutral-500" />
              <h2 className="font-bold text-xs text-neutral-800 tracking-wider uppercase">Klasemen</h2>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-white text-neutral-400 border-b border-neutral-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3 py-2.5 font-medium w-8 text-center">#</th>
                  <th className="px-2 py-2.5 font-medium">Klub</th>
                  <th className="px-1 py-2.5 font-medium text-center" title="Main">M</th>
                  <th className="px-1 py-2.5 font-medium text-center" title="Menang">M</th>
                  <th className="px-1 py-2.5 font-medium text-center" title="Seri">S</th>
                  <th className="px-1 py-2.5 font-medium text-center" title="Kalah">K</th>
                  <th className="px-1.5 py-2.5 font-medium text-center" title="Selisih Gol">SG</th>
                  <th className="px-1.5 py-2.5 font-medium text-center" title="Kartu Kuning">KK</th>
                  <th className="px-1.5 py-2.5 font-medium text-center" title="Kartu Merah">KM</th>
                  <th className="px-2 py-2.5 font-bold text-center text-neutral-900" title="Poin">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {standings.map((team, index) => (
                  <tr key={team.name} className={`transition-colors ${index === 0 ? 'bg-amber-50/30' : 'hover:bg-neutral-50'}`}>
                    <td className="px-3 py-2.5 text-center font-medium text-neutral-500">
                      {index === 0 ? <span className="text-amber-500 font-bold">{index + 1}</span> : index + 1}
                    </td>
                    <td className="px-2 py-2.5 font-bold text-neutral-800 whitespace-nowrap">{team.name}</td>
                    <td className="px-1 py-2.5 text-center text-neutral-500">{team.p}</td>
                    <td className="px-1 py-2.5 text-center text-neutral-500">{team.w}</td>
                    <td className="px-1 py-2.5 text-center text-neutral-500">{team.d}</td>
                    <td className="px-1 py-2.5 text-center text-neutral-500">{team.l}</td>
                    <td className="px-1.5 py-2.5 text-center text-neutral-500 font-medium">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                    <td className="px-1.5 py-2.5 text-center text-neutral-500">{team.yc}</td>
                    <td className="px-1.5 py-2.5 text-center text-neutral-500">{team.rc}</td>
                    <td className="px-2 py-2.5 text-center font-black text-neutral-900 text-sm">{team.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {}
          {/* Table Legend */}
          <div className="bg-neutral-50/80 px-4 py-3 border-t border-neutral-100">
            <div className="flex items-start gap-1.5 mb-1.5">
              <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
              <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide">Keterangan Kolom</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-xs text-neutral-500 ml-5">
              <span><strong className="text-neutral-700">M:</strong> Main</span>
              <span><strong className="text-neutral-700">M:</strong> Menang</span>
              <span><strong className="text-neutral-700">S:</strong> Seri</span>
              <span><strong className="text-neutral-700">K:</strong> Kalah</span>
              <span><strong className="text-neutral-700">SG:</strong> Selisih Gol</span>
              <span className="flex items-center gap-1"><div className="w-1.5 h-2 bg-yellow-400 rounded-sm"></div> <strong className="text-neutral-700">KK:</strong> Kartu Kuning</span>
              <span className="flex items-center gap-1"><div className="w-1.5 h-2 bg-red-500 rounded-sm"></div> <strong className="text-neutral-700">KM:</strong> Kartu Merah</span>
            </div>
          </div>
        </section>

        {}
        {/* Matches Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <h2 className="font-bold text-xs text-neutral-800 tracking-wider uppercase">Jadwal & Skor</h2>
            </div>
          </div>

          <div className="divide-y divide-neutral-100">
            {matches.map((match) => (
              <div key={match.id} className={`p-3 sm:px-4 sm:py-3.5 transition-colors flex flex-col sm:flex-row items-center justify-between gap-4 ${match.isPlayed ? 'bg-neutral-50/40' : ''}`}>
                
                {/* Match Matchup */}
                <div className="flex items-center justify-between w-full sm:w-auto flex-1 gap-2">
                  
                  {/* Home Team & Cards */}
                  <div className={`text-right flex-1 flex flex-col items-end gap-1.5`}>
                    <div className={`w-full text-xs sm:text-sm font-bold truncate ${match.isPlayed && parseInt(match.homeScore) >= parseInt(match.awayScore) ? 'text-neutral-900' : 'text-neutral-500 font-semibold'}`}>
                      {match.home}
                    </div>
                    {/* Home Cards Input */}
                    <div className={`flex items-center justify-end gap-1.5 ${match.isPlayed && !match.homeYellow && !match.homeRed ? 'opacity-40' : ''}`}>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          disabled={match.isPlayed}
                          value={match.homeYellow}
                          onChange={(e) => handleInputChange(match.id, 'homeYellow', e.target.value)}
                          className={`w-6 h-6 text-[11px] text-center rounded border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-transparent disabled:border-transparent outline-none transition-all ${match.isPlayed ? 'text-neutral-600 font-medium' : 'bg-neutral-50'}`}
                          placeholder="0"
                        />
                        <div className="w-1.5 h-2.5 bg-yellow-400 rounded-[2px] shadow-sm" title="Kartu Kuning"></div>
                      </div>
                      <div className="flex items-center gap-1 ml-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          disabled={match.isPlayed}
                          value={match.homeRed}
                          onChange={(e) => handleInputChange(match.id, 'homeRed', e.target.value)}
                          className={`w-6 h-6 text-[11px] text-center rounded border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-transparent disabled:border-transparent outline-none transition-all ${match.isPlayed ? 'text-neutral-600 font-medium' : 'bg-neutral-50'}`}
                          placeholder="0"
                        />
                        <div className="w-1.5 h-2.5 bg-red-500 rounded-[2px] shadow-sm" title="Kartu Merah"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Score Inputs (Center) */}
                  <div className="flex items-center justify-center gap-1.5 shrink-0 px-2 pb-5">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      disabled={match.isPlayed}
                      value={match.homeScore}
                      onChange={(e) => handleInputChange(match.id, 'homeScore', e.target.value)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 text-center font-bold text-sm rounded-md border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-transparent disabled:border-transparent transition-all outline-none ${match.isPlayed ? 'text-neutral-900 text-base' : 'bg-neutral-50'}`}
                      placeholder="-"
                    />
                    <span className="text-neutral-300 font-medium text-xs">:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      disabled={match.isPlayed}
                      value={match.awayScore}
                      onChange={(e) => handleInputChange(match.id, 'awayScore', e.target.value)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 text-center font-bold text-sm rounded-md border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-transparent disabled:border-transparent transition-all outline-none ${match.isPlayed ? 'text-neutral-900 text-base' : 'bg-neutral-50'}`}
                      placeholder="-"
                    />
                  </div>

                  {/* Away Team & Cards */}
                  <div className={`text-left flex-1 flex flex-col items-start gap-1.5`}>
                    <div className={`w-full text-xs sm:text-sm font-bold truncate ${match.isPlayed && parseInt(match.awayScore) >= parseInt(match.homeScore) ? 'text-neutral-900' : 'text-neutral-500 font-semibold'}`}>
                      {match.away}
                    </div>
                    {/* Away Cards Input */}
                    <div className={`flex items-center justify-start gap-1.5 ${match.isPlayed && !match.awayYellow && !match.awayRed ? 'opacity-40' : ''}`}>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-2.5 bg-yellow-400 rounded-[2px] shadow-sm" title="Kartu Kuning"></div>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          disabled={match.isPlayed}
                          value={match.awayYellow}
                          onChange={(e) => handleInputChange(match.id, 'awayYellow', e.target.value)}
                          className={`w-6 h-6 text-[11px] text-center rounded border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-transparent disabled:border-transparent outline-none transition-all ${match.isPlayed ? 'text-neutral-600 font-medium' : 'bg-neutral-50'}`}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-center gap-1 mr-1">
                        <div className="w-1.5 h-2.5 bg-red-500 rounded-[2px] shadow-sm" title="Kartu Merah"></div>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          disabled={match.isPlayed}
                          value={match.awayRed}
                          onChange={(e) => handleInputChange(match.id, 'awayRed', e.target.value)}
                          className={`w-6 h-6 text-[11px] text-center rounded border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-transparent disabled:border-transparent outline-none transition-all ${match.isPlayed ? 'text-neutral-600 font-medium' : 'bg-neutral-50'}`}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Button */}
                <div className="flex-shrink-0 w-full sm:w-auto flex justify-end">
                  {!match.isPlayed ? (
                    <button
                      onClick={() => handleSaveMatch(match.id)}
                      disabled={match.homeScore === '' || match.awayScore === ''}
                      className="flex items-center justify-center w-full sm:w-10 h-8 sm:h-9 bg-neutral-900 text-white rounded-md text-xs font-medium hover:bg-neutral-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm"
                      title="Simpan Hasil"
                    >
                      <Check className="w-4 h-4" />
                      <span className="sm:hidden ml-1">Simpan Hasil</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUndoMatch(match.id)}
                      className="flex items-center justify-center w-full sm:w-10 h-8 sm:h-9 bg-neutral-200 text-neutral-600 rounded-md text-xs font-medium hover:bg-neutral-300 hover:text-neutral-800 transition-all"
                      title="Edit Hasil"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span className="sm:hidden ml-1">Edit Kembali</span>
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