'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: severity-scorer.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: severity-scorer.js                                 ║
 * ║  Purpose: Calculates CVSS 3.1 base score from vector string      ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

function calculateCvss31(vector) {
  const parts = vector.split('/');
  const metrics = {};
  for (const part of parts) {
    const [key, value] = part.split(':');
    metrics[key] = value;
  }

  const AV_WEIGHTS = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
  const AC_WEIGHTS = { L: 0.77, H: 0.44 };
  const PR_WEIGHTS = { N: 0.85, L: 0.62, H: 0.27 }; // S:U
  const PR_S_C_WEIGHTS = { N: 0.85, L: 0.68, H: 0.5 }; // S:C
  const UI_WEIGHTS = { N: 0.85, R: 0.62 };
  const S_WEIGHTS = { U: 1.0, C: 1.0 }; // Scope weight is handled differently
  const CIA_WEIGHTS = { N: 0, L: 0.22, H: 0.56 };

  const ISS = 1 - (
    (1 - CIA_WEIGHTS[metrics.C]) * 
    (1 - CIA_WEIGHTS[metrics.I]) * 
    (1 - CIA_WEIGHTS[metrics.A])
  );

  let impact;
  if (metrics.S === 'U') {
    impact = 6.42 * ISS;
  } else {
    impact = 7.52 * (ISS - 0.029) - 3.25 * Math.pow(ISS - 0.02, 15);
  }

  const prWeight = metrics.S === 'U' ? PR_WEIGHTS[metrics.PR] : PR_S_C_WEIGHTS[metrics.PR];
  const exploitability = 8.22 * AV_WEIGHTS[metrics.AV] * AC_WEIGHTS[metrics.AC] * prWeight * UI_WEIGHTS[metrics.UI];

  let baseScore;
  if (impact <= 0) {
    baseScore = 0;
  } else if (metrics.S === 'U') {
    baseScore = Math.min(10, Math.ceil(Math.min(impact + exploitability, 10) * 10) / 10);
  } else {
    baseScore = Math.min(10, Math.ceil(Math.min(1.08 * (impact + exploitability), 10) * 10) / 10);
  }

  let rating = 'None';
  if (baseScore >= 9.0) rating = 'Critical';
  else if (baseScore >= 7.0) rating = 'High';
  else if (baseScore >= 4.0) rating = 'Medium';
  else if (baseScore >= 0.1) rating = 'Low';

  return { score: baseScore, rating, vector };
}

function run(argv = process.argv) {
  const arg = argv.find(a => a.startsWith('--vector='));
  const vector = arg ? arg.split('=')[1] : 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H';

  const result = calculateCvss31(vector);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  run();
}

module.exports = { calculateCvss31, run };
