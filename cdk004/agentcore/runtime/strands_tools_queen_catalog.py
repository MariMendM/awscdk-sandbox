import csv
from collections import Counter
from typing import Optional
from strands import Agent, tool


class QueenCatalogTools:
    """
    In-Memory Strands Song Catalog Tool
    
    Stateful toolset that loads the Queen CSV catalog into memory once
    and exposes decorated methods as Strands Agent tools.
    """

    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.songs: list[dict[str, str]] = []
        self._load_catalog()

    def _load_catalog(self) -> None:
        with open(self.csv_path, mode="r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Store cleaned strings and pre-parse Release Year as int for fast range checks
                cleaned_row = {k.strip(): (v.strip() if v else "") for k, v in row.items()}
                try:
                    cleaned_row["_year_int"] = int(cleaned_row.get("Release Year", 0))
                except ValueError:
                    cleaned_row["_year_int"] = 0
                self.songs.append(cleaned_row)

    @tool
    def search_queen_songs(
        self,
        title: Optional[str] = None,
        album: Optional[str] = None,
        release_year: Optional[int] = None,
        start_year: Optional[int] = None,
        end_year: Optional[int] = None,
        songwriter: Optional[str] = None,
        genre: Optional[str] = None,
        singer: Optional[str] = None,
        limit: int = 5,
    ) -> str:
        """
        Search the Queen song catalog by metadata fields and/or release year ranges.
        Text filters use case-insensitive partial matching.

        Args:
            title: Song title or partial title (e.g., "Bohemian", "Flash").
            album: Album name (e.g., "Queen II", "A Night at the Opera", "Jazz").
            release_year: Exact four-digit release year (e.g., 1975).
            start_year: Inclusive start year for a range query (e.g., 1973).
            end_year: Inclusive end year for a range query (e.g., 1977).
            songwriter: Primary songwriter name (e.g., "Freddie Mercury", "Brian May", "John Deacon", "Roger Taylor").
            genre: Musical genre or style (e.g., "Hard Rock", "Ballad", "Progressive Rock", "Synth").
            singer: Lead vocalist or "Instrumental" (e.g., "Freddie Mercury", "Brian May", "Instrumental").
            limit: Maximum number of matching songs to return in full detail (default 5).

        Returns:
            Total match count and formatted details for matching songs.
        """
        text_filters = {
            "Title": title,
            "Album": album,
            "Primary Songwriter": songwriter,
            "Genre": genre,
            "Singer": singer,
        }
        active_text = {k: v.strip().lower() for k, v in text_filters.items() if v and v.strip()}

        matches = []
        for song in self.songs:
            year = song["_year_int"]

            # Year and year-range checks
            if release_year is not None and year != release_year:
                continue
            if start_year is not None and year < start_year:
                continue
            if end_year is not None and year > end_year:
                continue

            # Substring checks for text columns
            if not all(val in song.get(col, "").lower() for col, val in active_text.items()):
                continue

            matches.append(song)

        if not matches:
            return "No songs matched your search criteria."

        lines = [f"Found {len(matches)} matching song(s):"]
        for s in matches[:limit]:
            lines.append(
                f"- {s['Title']} | Album: {s['Album']} ({s['Release Year']}) | "
                f"Writer: {s['Primary Songwriter']} | Genre: {s['Genre']} | Singer: {s['Singer']}"
            )

        if len(matches) > limit:
            lines.append(f"...and {len(matches) - limit} more. Narrow your filters or increase 'limit' to see more.")

        return "\n".join(lines)

    @tool
    def get_catalog_stats(
        self,
        group_by: str,
        start_year: Optional[int] = None,
        end_year: Optional[int] = None,
    ) -> str:
        """
        Count Queen songs grouped by a specific column, optionally filtered by a year range.

        Args:
            group_by: Exact column name to group by. Must be one of:
                      "Album", "Release Year", "Primary Songwriter", "Genre", "Singer".
            start_year: Optional inclusive start year to filter stats (e.g., 1973).
            end_year: Optional inclusive end year to filter stats (e.g., 1979).

        Returns:
            A ranked breakdown of song counts per category.
        """
        valid_columns = {"Album", "Release Year", "Primary Songwriter", "Genre", "Singer"}
        if group_by not in valid_columns:
            return f"Invalid column '{group_by}'. Choose one of: {', '.join(sorted(valid_columns))}"

        counts = Counter()
        for song in self.songs:
            year = song["_year_int"]
            if start_year is not None and year < start_year:
                continue
            if end_year is not None and year > end_year:
                continue

            value = song.get(group_by) or "Unknown"
            counts[value] += 1

        if not counts:
            return "No songs found in the specified year range."

        header = f"Song counts by {group_by}"
        if start_year or end_year:
            header += f" ({start_year or 'start'}–{end_year or 'end'})"
        header += f" | Total: {sum(counts.values())}:"

        breakdown = [header]
        for key, count in counts.most_common():
            breakdown.append(f"- {key}: {count}")

        return "\n".join(breakdown)
