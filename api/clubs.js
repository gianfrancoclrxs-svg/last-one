
const slugs = [
  "eng.1", "esp.1", "ger.1", "ita.1", "fra.1",
  "ned.1", "por.1", "sco.1", "tur.1", "bel.1",
  "usa.1", "bra.1", "arg.1", "mex.1"
];

module.exports = async (req, res) => {
  try {
    const results = await Promise.allSettled(
      slugs.map(async (league) => {
        const url =
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams?limit=100`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`ESPN returned ${response.status}`);
        }

        return response.json();
      })
    );

    const clubs = [];
    const seen = new Set();

    for (const result of results) {
      if (result.status !== "fulfilled") continue;

      const league =
        result.value?.sports?.[0]?.leagues?.[0];

      for (const entry of league?.teams || []) {
        const team = entry.team;
        const logo = team?.logos?.[0]?.href;

        if (team?.id && logo && !seen.has(team.id)) {
          seen.add(team.id);

          clubs.push({
            name: team.displayName || team.name,
            logo
          });
        }
      }
    }

    if (clubs.length === 0) {
      return res.status(502).json({
        error: "ESPN returned no team data."
      });
    }

    return res.status(200).json({ items: clubs });
  } catch (error) {
    return res.status(502).json({
      error: "Unable to retrieve teams from ESPN."
    });
  }
};
