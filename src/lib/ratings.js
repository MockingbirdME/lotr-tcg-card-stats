

function mocksInitialRatings(values, headerMap) {

  const { "Win Rate": winRateIndex, "Weighted Inclusion Rate": weightedInclusionRateIndex, "Pool Size": poolSizeIndex } = headerMap;

  const winRate = parseFloat(values[winRateIndex]);
  const weightedInclusionRate = parseFloat(values[weightedInclusionRateIndex]);
  const poolSize = parseFloat(values[poolSizeIndex]);

  if (weightedInclusionRate === "Unknown") return "N/A";


  const unplayedRate = 0.1;
  const lowPlayedRate = 0.5;
  const expectedPlayRate = 1;
  const highPlayRate = poolSize < 20 ? 1.25 : 1.5;
  const staplePlayRate = poolSize < 20 ? 1.5 : 2.5;
  const overPlayedRate = poolSize < 20 ? 1.75 : 7.5;

  if (weightedInclusionRate < unplayedRate) return "Unplayed";

  if (winRate >= 0.4 && winRate < 0.6 && weightedInclusionRate >= lowPlayedRate  && weightedInclusionRate < highPlayRate ) return "Average";

  if (winRate >= 0.4 && winRate < 0.6 && weightedInclusionRate < lowPlayedRate) return "Low Play Rate";

  if (winRate >= 0.4 && winRate < 0.6 && weightedInclusionRate >= highPlayRate && weightedInclusionRate < staplePlayRate ) return "High Play Rate";

  if (winRate >= 0.4 && winRate < 0.6 && weightedInclusionRate >= staplePlayRate && weightedInclusionRate < overPlayedRate ) return "Meta Staple";

  if (winRate >= 0.4 && winRate < 0.6 && weightedInclusionRate >= overPlayedRate ) return "Over Played?";

  if (winRate >= 0.25 && winRate < 0.4) return "Redeemable?";

  if (winRate < 0.25) return "Trash";

  if (winRate >= 0.6 && winRate < 0.75 && weightedInclusionRate < expectedPlayRate) return "Sleeper or Niche Power Picks";

  if (winRate >= 0.6 && winRate < 0.75 && weightedInclusionRate < staplePlayRate) return "Standard Power Picks";

  if (winRate >= 0.6 && winRate < 0.75 && weightedInclusionRate >= staplePlayRate) return "Meta Dominating Power Picks";

  if (winRate > 0.75) return "All it does is Win";

  return "outlier";
}

export default {
  "Mock's Initial Ratings": mocksInitialRatings
};