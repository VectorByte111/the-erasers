// In-memory stats for the current playthrough (shown on the final screen).
// Day 7 will add localStorage best times on top of this.
const Run = {
  levels: [],
  reset() { this.levels = []; },
  record(index, secs, ink, deaths) { this.levels[index] = { secs, ink, deaths }; },
};
export default Run;
