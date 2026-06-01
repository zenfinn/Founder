/** Demo-Einträge für das Leaderboard, wenn noch wenig echte Aktivität in der DB ist. */
export const LEADERBOARD_SEED_ENTRIES = [
  { user_id: "seed-felix", display_name: "Felix M.", username: null, avatar_url: null, current_rank: "scaler", score: 48 },
  { user_id: "seed-sarah", display_name: "Sarah K.", username: null, avatar_url: null, current_rank: "scaler", score: 44 },
  { user_id: "seed-jonas", display_name: "Jonas W.", username: null, avatar_url: null, current_rank: "builder", score: 39 },
  { user_id: "seed-alex", display_name: "Alex H.", username: null, avatar_url: null, current_rank: "builder", score: 36 },
  { user_id: "seed-jan", display_name: "Jan R.", username: null, avatar_url: null, current_rank: "builder", score: 33 },
  { user_id: "seed-marco", display_name: "Marco L.", username: null, avatar_url: null, current_rank: "starter", score: 29 },
  { user_id: "seed-mia", display_name: "Mia S.", username: null, avatar_url: null, current_rank: "starter", score: 26 },
  { user_id: "seed-luca", display_name: "Luca B.", username: null, avatar_url: null, current_rank: "starter", score: 23 },
  { user_id: "seed-sven", display_name: "Sven T.", username: null, avatar_url: null, current_rank: "starter", score: 21 },
  { user_id: "seed-lea", display_name: "Lea F.", username: null, avatar_url: null, current_rank: "starter", score: 18 },
  { user_id: "seed-paul", display_name: "Paul D.", username: null, avatar_url: null, current_rank: "starter", score: 15 },
  { user_id: "seed-tim", display_name: "Tim C.", username: null, avatar_url: null, current_rank: "starter", score: 12 },
  { user_id: "seed-lena", display_name: "Lena H.", username: null, avatar_url: null, current_rank: "aspiring", score: 9 },
  { user_id: "seed-nina", display_name: "Nina V.", username: null, avatar_url: null, current_rank: "aspiring", score: 7 },
  { user_id: "seed-ben", display_name: "Ben K.", username: null, avatar_url: null, current_rank: "aspiring", score: 5 },
];

export function mergeLeaderboardEntries(realEntries = [], limit = 20) {
  const realIds = new Set(realEntries.map((entry) => entry.user_id));
  const seeds = LEADERBOARD_SEED_ENTRIES.filter((entry) => !realIds.has(entry.user_id));

  return [...realEntries, ...seeds]
    .sort((a, b) => {
      const scoreDiff = Number(b.score) - Number(a.score);
      if (scoreDiff !== 0) return scoreDiff;
      return String(a.display_name).localeCompare(String(b.display_name), "de");
    })
    .slice(0, limit);
}
