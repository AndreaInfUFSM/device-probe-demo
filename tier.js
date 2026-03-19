export function guessTier(result) {
  const mem = result.hardware.deviceMemoryGB ?? 0;
  const cores = result.hardware.hardwareConcurrency ?? 0;
  const filterAvg = result.benchmarks.filter.avgMs;
  const resizeAvg = result.benchmarks.resize.avgMs;
  const webgl = result.capabilities.webGL;

  let score = 0;

  if (mem >= 8) score += 2;
  else if (mem >= 4) score += 1;

  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;

  if (webgl) score += 1;

  if (filterAvg < 70) score += 2;
  else if (filterAvg < 140) score += 1;

  if (resizeAvg < 8) score += 1;
  else if (resizeAvg > 20) score -= 1;

  if (score >= 6) return 'advanced';
  if (score >= 3) return 'balanced';
  return 'quick';
}
