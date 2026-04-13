// Team assignment logic.
// 4-8 players => 2 teams, 9-12 => 3 teams, 13+ => 4 teams.

const TEAM_DEFS = [
  { id: 'team-1', name: 'Globe Trotters', color: '#2ECDA7' },
  { id: 'team-2', name: 'Map Maniacs', color: '#F5C542' },
  { id: 'team-3', name: 'Compass Kings', color: '#7B6EF6' },
  { id: 'team-4', name: 'Atlas Aces', color: '#F28C5A' },
];

function numTeamsFor(count) {
  if (count >= 13) return 4;
  if (count >= 9) return 3;
  return 2;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function assignTeams(players) {
  const n = numTeamsFor(players.length);
  const teams = TEAM_DEFS.slice(0, n).map(t => ({ ...t, players: [] }));
  const shuffled = shuffle(players);
  shuffled.forEach((p, i) => {
    const team = teams[i % n];
    p.teamId = team.id;
    team.players.push({ id: p.id, name: p.name, teamId: team.id });
  });
  return teams;
}

module.exports = { assignTeams, TEAM_DEFS };
