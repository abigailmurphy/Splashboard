function computeDefaultSeason(now = new Date()) {
    const y = now.getFullYear();
    // JS months are 0-based; 8 = September
    const cutoff = new Date(y, 8, 20, 0, 0, 0);
    return now >= cutoff ? String(y + 1) : String(y);
  }
module.exports = { computeDefaultSeason };