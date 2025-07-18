import { data, divisions, type Divisions } from '../data'

interface SidebarProps {
  sidebarOpen: boolean
  selectedDivisions: Divisions[]
  selectedClubs: string[]
  onDivisionChange: (division: Divisions) => void
  onGroupChange: (groupNumber: string) => void
  onSelectAllDivisions: () => void
  onSelectNoneDivisions: () => void
  onClubChange: (clubName: string) => void
  onSelectAllClubs: () => void
  onSelectNoneClubs: () => void
  isGroupSelected: (groupNumber: string) => boolean
  isGroupIndeterminate: (groupNumber: string) => boolean
}

const Sidebar = ({
  sidebarOpen,
  selectedDivisions,
  selectedClubs,
  onDivisionChange,
  onGroupChange,
  onSelectAllDivisions,
  onSelectNoneDivisions,
  onClubChange,
  onSelectAllClubs,
  onSelectNoneClubs,
  isGroupSelected,
  isGroupIndeterminate
}: SidebarProps) => {
  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="filter-group">
        <div className="filter-header">
          <label>Division:</label>
          <div className="filter-controls">
            <button type="button" onClick={onSelectAllDivisions} className="control-button">
              All
            </button>
            <button type="button" onClick={onSelectNoneDivisions} className="control-button">
              None
            </button>
          </div>
        </div>
        <div className="division-list">
          {(() => {
            const sortedDivisions = divisions.sort((a, b) => {
              if (a === 'P') return -1;
              if (b === 'P') return 1;
              
              // Sort E divisions to the end within each numeric group
              const aEndsWithE = a.endsWith('E');
              const bEndsWithE = b.endsWith('E');
              
              if (aEndsWithE && !bEndsWithE) return 1;
              if (!aEndsWithE && bEndsWithE) return -1;
              
              return a.localeCompare(b, undefined, { numeric: true });
            });

            const groupedDivisions = sortedDivisions.reduce((acc, division) => {
              const firstChar = division[0];
              if (!acc[firstChar]) acc[firstChar] = [];
              acc[firstChar].push(division);
              return acc;
            }, {} as Record<string, Divisions[]>);

            return Object.entries(groupedDivisions)
              .sort(([a], [b]) => {
                if (a === 'P') return -1;
                if (b === 'P') return 1;
                return a.localeCompare(b, undefined, { numeric: true });
              })
              .map(([firstChar, divs]) => (
                <div key={firstChar} className="division-group">
                  {firstChar !== 'P' && firstChar !== '1' && (
                    <label className={`checkbox-item group-all div${firstChar}`}>
                      <input
                        type="checkbox"
                        checked={isGroupSelected(firstChar)}
                        ref={(el) => {
                          if (el) el.indeterminate = isGroupIndeterminate(firstChar)
                        }}
                        onChange={() => onGroupChange(firstChar)}
                        className="checkbox-input"
                      />
                      <span className="checkbox-label">{firstChar}</span>
                    </label>
                  )}
                  {divs.map(division => {
                    const divisionClass = `div${division}`
                    return (
                      <label 
                        key={division} 
                        className={`checkbox-item sub-option ${divisionClass}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDivisions.includes(division)}
                          onChange={() => onDivisionChange(division)}
                          className="checkbox-input"
                        />
                        <span className="checkbox-label">{division.length > 1 ? division.slice(1) : division}</span>
                      </label>
                    )
                  })}
                </div>
              ));
          })()}
        </div>
      </div>
      <div className="filter-group">
        <div className="filter-header">
          <label>Clubs:</label>
          <div className="filter-controls">
            <button type="button" onClick={onSelectAllClubs} className="control-button">
              All
            </button>
            <button type="button" onClick={onSelectNoneClubs} className="control-button">
              None
            </button>
          </div>
        </div>
        <div className="clubs-filter-list">
          {data.clubs.map((club, index) => {
            const matchesDivision = selectedDivisions.length === 0 ||
              club.teams.some(team => selectedDivisions.includes(team.division))
            
            return (
              <label 
                key={index} 
                className={`checkbox-item club-checkbox ${!matchesDivision ? 'hidden-club' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedClubs.includes(club.name)}
                  onChange={() => onClubChange(club.name)}
                  className="checkbox-input"
                />
                <span className="checkbox-label">{club.name}</span>
              </label>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar