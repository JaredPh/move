import { leagues, divisionGrades, type Divisions } from '../data'

interface Club {
  name: string
  logo?: string | null
  teams: {
    name: string
    division: Divisions
  }[]
}

interface ClubsGridProps {
  filteredClubs: Club[]
  getAssetPath: (path: string) => string
}

const ClubsGrid = ({ filteredClubs, getAssetPath }: ClubsGridProps) => {
  if (filteredClubs.length === 0) {
    return (
      <div className="no-clubs-message">
        No clubs match the current filter criteria.
      </div>
    )
  }

  return (
    <div className="clubs-grid">
      <div className="grid-header">
        <div className="grid-cell header-cell">Club</div>
        {[...new Set(leagues)].sort((a, b) => {
          if (a === 'P') return -1;
          if (b === 'P') return 1;
          return a.localeCompare(b, undefined, { numeric: true });
        }).map(league => (
          <div key={league} className="grid-cell header-cell">{league}</div>
        ))}
      </div>
      {filteredClubs.map((club, index) => (
        <div key={index} className="grid-row">
          <div className="grid-cell club-name-cell">
            {club.logo ? (
              <img
                src={getAssetPath(club.logo)}
                alt={`${club.name} logo`}
                className="club-logo"
              />
            ) : (
              <div className="club-logo-placeholder"></div>
            )}
            <span className="club-name">{club.name}</span>
          </div>
          {[...new Set(leagues)].sort((a, b) => {
            if (a === 'P') return -1;
            if (b === 'P') return 1;
            return a.localeCompare(b, undefined, { numeric: true });
          }).map(league => {
            const teamsInLeague = club.teams.filter(team =>
              divisionGrades[team.division].league === league
            );
            return (
              <div key={league} className="grid-cell team-cell">
                {teamsInLeague.map((team, teamIndex) => {
                  return (
                    <div key={teamIndex} className={`team-item div-${team.division}`}>
                      <span className="team-name">{team.name}</span>
                    </div>
                  )
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  )
}

export default ClubsGrid