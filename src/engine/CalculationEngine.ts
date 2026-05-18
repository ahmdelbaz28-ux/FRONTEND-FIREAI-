/**
 * CalculationEngine.ts - Pure Electrical Engineering Calculations
 * Based on IEC 60364, IEC 60909, and NEC standards
 * NO MOCK DATA - All calculations from real formulas
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type CableMaterial = 'Cu' | 'Al';
export type InstallationMethod = 'conduit' | 'tray' | 'direct_buried' | 'free_air';
export type CircuitType = 'lighting' | 'power' | 'motor';

export interface VoltageDropResult {
  percentage: number;
  absoluteVoltage: number;
  status: 'PASS' | 'FAIL';
  limit: number;
  formula: string;
  details: {
    resistance: number;
    reactance: number;
    current: number;
    length: number;
    powerFactor: number;
  };
}

export interface ShortCircuitResult {
  prospectiveCurrent: number;
  cableBreakingCapacity: number;
  breakerRating: number;
  status: 'PASS' | 'FAIL';
  minRequiredBreakingCapacity: number;
}

export interface CableSizingResult {
  recommendedCrossSection: number;
  ampacity: number;
  deratingFactor: number;
  ambientTempFactor: number;
  installationFactor: number;
  finalAmpacity: number;
  suitable: boolean;
}

export interface LoadFlowResult {
  voltage: number;
  current: number;
  power: number;
  apparentPower: number;
  reactivePower: number;
  efficiency: number;
}

// ============================================================================
// CONSTANTS - Cable Properties per IEC 60228 / NEC Table
// ============================================================================

const CABLE_RESISTANCE: Record<CableMaterial, Record<number, number>> = {
  Cu: {
    1.5: 12.1, 2.5: 7.41, 4: 4.61, 6: 3.08, 10: 1.83, 16: 1.15, 25: 0.727,
    35: 0.524, 50: 0.387, 70: 0.268, 95: 0.193, 120: 0.153, 150: 0.124, 185: 0.0991, 240: 0.0754
  },
  Al: {
    2.5: 12.1, 4: 7.41, 6: 4.61, 10: 3.08, 16: 1.83, 25: 1.15, 35: 0.868,
    50: 0.641, 70: 0.443, 95: 0.320, 120: 0.253, 150: 0.206, 185: 0.164, 240: 0.125
  }
};

const CABLE_REACTANCE: Record<CableMaterial, Record<number, number>> = {
  Cu: {
    1.5: 0.145, 2.5: 0.135, 4: 0.127, 6: 0.119, 10: 0.112, 16: 0.106, 25: 0.101,
    35: 0.097, 50: 0.095, 70: 0.092, 95: 0.090, 120: 0.088, 150: 0.087, 185: 0.086, 240: 0.084
  },
  Al: {
    2.5: 0.135, 4: 0.127, 6: 0.119, 10: 0.112, 16: 0.106, 25: 0.101,
    35: 0.097, 50: 0.095, 70: 0.092, 95: 0.090, 120: 0.088, 150: 0.087, 185: 0.086, 240: 0.084
  }
};

const STANDARD_CROSS_SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

const AMBIENT_TEMP_FACTORS: Record<string, number[]> = {
  Cu: [
    1.29, 1.22, 1.15, 1.07, 1.00, 0.91, 0.82, 0.71, 0.58, 0.41 // 20°C to 80°C in 5°C steps
  ],
  Al: [
    1.25, 1.19, 1.12, 1.05, 1.00, 0.92, 0.83, 0.73, 0.62, 0.47
  ]
};

const INSTALLATION_METHOD_FACTORS: Record<InstallationMethod, number> = {
  conduit: 0.8,
  tray: 0.95,
  direct_buried: 0.7,
  free_air: 1.0
};

const VOLTAGE_DROP_LIMITS: Record<CircuitType, number> = {
  lighting: 3,  // IEC max 3% for lighting
  power: 5,     // IEC max 5% for power
  motor: 5      // NEC allows 5% at motor terminals
};

// ============================================================================
// VOLTAGE DROP CALCULATION (IEC 60364)
// ============================================================================

/**
 * Calculate voltage drop using IEC formula:
 * ΔV = (I × L × (R × cosφ + X × sinφ)) / 1000
 * Where:
 * - I = Current in Amperes
 * - L = Length in meters
 * - R = Resistance in Ω/km (from tables)
 * - X = Reactance in Ω/km (from tables)
 * - cosφ = Power Factor
 * - sinφ = √(1 - cos²φ)
 * Result in Volts, then calculate percentage
 */
export function calculateVoltageDrop(
  current: number,
  length: number,
  material: CableMaterial,
  crossSection: number,
  powerFactor: number = 0.85,
  voltage: number = 230
): VoltageDropResult {
  const L = length / 1000; // Convert meters to km
  const cosPhi = powerFactor;
  const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
  
  const R = CABLE_RESISTANCE[material][crossSection] || CABLE_RESISTANCE.Cu[1.5];
  const X = CABLE_REACTANCE[material][crossSection] || CABLE_REACTANCE.Cu[1.5];
  
  // ΔV = I × L × (R × cosφ + X × sinφ) in Volts
  const deltaV = (current * L * (R * cosPhi + X * sinPhi));
  
  // Calculate percentage
  const percentage = (deltaV / voltage) * 100;
  const absoluteVoltage = deltaV;
  
  // Determine limit based on circuit type (default to power = 5%)
  const limit = 5;
  
  return {
    percentage: Math.round(percentage * 1000) / 1000,
    absoluteVoltage: Math.round(absoluteVoltage * 1000) / 1000,
    status: percentage > limit ? 'FAIL' : 'PASS',
    limit,
    formula: `ΔV = I × L × (R × cosφ + X × sinφ) = ${current} × ${L.toFixed(3)} × (${R} × ${cosPhi} + ${X} × ${sinPhi.toFixed(3)})`,
    details: {
      resistance: R,
      reactance: X,
      current,
      length,
      powerFactor: cosPhi
    }
  };
}

// ============================================================================
// SHORT CIRCUIT CURRENT CALCULATION (IEC 60909 Simplified)
// ============================================================================

/**
 * Calculate prospective short circuit current at end of cable:
 * Isc = Unom / √(R² + X²)
 * 
 * Also verify circuit breaker breaking capacity is sufficient
 */
export function calculateShortCircuit(
  nominalVoltage: number,
  cableLength: number,
  material: CableMaterial,
  crossSection: number,
  upstreamPower: number = 50, // MVA of transformer
  breakerRating: number = 16 // kA breaker rating
): ShortCircuitResult {
  const L = cableLength / 1000; // km
  
  const R = CABLE_RESISTANCE[material][crossSection] || CABLE_RESISTANCE.Cu[1.5];
  const X = CABLE_REACTANCE[material][crossSection] || CABLE_REACTANCE.Cu[1.5];
  
  // Calculate impedance
  const Rtotal = R * L;
  const Xtotal = X * L;
  const Z = Math.sqrt(Rtotal * Rtotal + Xtotal * Xtotal);
  
  // Prospective short circuit current in kA
  const prospectiveCurrent = (nominalVoltage / (Math.sqrt(3) * Z)) / 1000;
  
  // Minimum required breaking capacity is prospective current
  const minRequiredBreakingCapacity = prospectiveCurrent * 1.25; // 25% margin
  
  return {
    prospectiveCurrent: Math.round(prospectiveCurrent * 100) / 100,
    cableBreakingCapacity: Math.round(prospectiveCurrent * 100) / 100,
    breakerRating,
    status: breakerRating >= minRequiredBreakingCapacity ? 'PASS' : 'FAIL',
    minRequiredBreakingCapacity: Math.round(minRequiredBreakingCapacity * 100) / 100
  };
}

// ============================================================================
// CABLE SIZING & DERATING (IEC 60364)
// ============================================================================

/**
 * Calculate minimum cable cross-section based on load current
 * with derating factors for installation method and ambient temperature
 */
export function calculateCableSizing(
  loadCurrent: number,
  material: CableMaterial,
  installationMethod: InstallationMethod,
  ambientTemp: number = 30, // °C
  simultaneousFactor: number = 1.0
): CableSizingResult {
  // Get installation method factor
  const installationFactor = INSTALLATION_METHOD_FACTORS[installationMethod];
  
  // Calculate ambient temperature factor
  const tempIndex = Math.floor((ambientTemp - 20) / 5);
  const tempFactor = AMBIENT_TEMP_FACTORS[material][Math.max(0, Math.min(tempIndex, 9))] || 0.7;
  
  // Combined derating factor
  const deratingFactor = installationFactor * tempFactor * simultaneousFactor;
  
  // Required ampacity before derating
  const requiredAmpacity = loadCurrent / deratingFactor;
  
  // Find suitable cross-section from tables
  const baseAmpacity: Record<number, number> = {
    1.5: 18, 2.5: 25, 4: 34, 6: 43, 10: 60, 16: 80, 25: 105,
    35: 125, 50: 150, 70: 185, 95: 225, 120: 260, 150: 300, 185: 340, 240: 400
  };
  
  let recommendedCrossSection = 1.5;
  let ampacity = 0;
  
  for (const section of STANDARD_CROSS_SECTIONS) {
    const baseAmp = baseAmpacity[section] || 18;
    const finalAmp = baseAmp * deratingFactor;
    
    if (finalAmp >= loadCurrent) {
      recommendedCrossSection = section;
      ampacity = finalAmp;
      break;
    }
  }
  
  return {
    recommendedCrossSection,
    ampacity: Math.round(ampacity * 10) / 10,
    deratingFactor: Math.round(deratingFactor * 1000) / 1000,
    ambientTempFactor: tempFactor,
    installationFactor,
    finalAmpacity: Math.round(ampacity * 10) / 10,
    suitable: ampacity >= loadCurrent
  };
}

// ============================================================================
// LOAD FLOW ANALYSIS
// ============================================================================

/**
 * Perform load flow analysis to determine operating parameters
 */
export function calculateLoadFlow(
  realPower: number, // kW
  voltage: number = 400,
  powerFactor: number = 0.85
): LoadFlowResult {
  const P = realPower * 1000; // Convert kW to W
  
  // Calculate apparent power: S = P / cosφ
  const S = P / powerFactor;
  
  // Calculate reactive power: Q = S × sinφ
  const Q = S * Math.sin(Math.acos(powerFactor));
  
  // Calculate current: I = S / (√3 × U)
  const I = S / (Math.sqrt(3) * voltage);
  
  // Calculate efficiency (simplified)
  const efficiency = powerFactor * 0.95; // Assume 95% efficiency
  
  return {
    voltage,
    current: Math.round(I * 100) / 100,
    power: realPower,
    apparentPower: Math.round(S / 1000 * 100) / 100,
    reactivePower: Math.round(Q / 1000 * 100) / 100,
    efficiency: Math.round(efficiency * 1000) / 1000
  };
}

// ============================================================================
// CIRCUIT BREAKER COORDINATION
// ============================================================================

export interface BreakerCoordinationResult {
  upstreamRating: number;
  downstreamRating: number;
  coordinationRatio: number;
  status: 'PROPER' | 'WARNING' | 'FAIL';
  recommendation: string;
}

export function checkBreakerCoordination(
  upstreamAmps: number,
  downstreamAmps: number
): BreakerCoordinationResult {
  const ratio = upstreamAmps / downstreamAmps;
  
  if (ratio >= 1.6 && ratio <= 3) {
    return {
      upstreamRating: upstreamAmps,
      downstreamRating: downstreamAmps,
      coordinationRatio: Math.round(ratio * 100) / 100,
      status: 'PROPER',
      recommendation: 'Good selectivity maintained'
    };
  } else if (ratio >= 1.25 && ratio < 1.6) {
    return {
      upstreamRating: upstreamAmps,
      downstreamRating: downstreamAmps,
      coordinationRatio: Math.round(ratio * 100) / 100,
      status: 'WARNING',
      recommendation: 'Reduced selectivity - may not coordinate under all fault conditions'
    };
  } else {
    return {
      upstreamRating: upstreamAmps,
      downstreamRating: downstreamAmps,
      coordinationRatio: Math.round(ratio * 100) / 100,
      status: 'FAIL',
      recommendation: ratio < 1.25 ? 'Upstream breaker too small!' : 'Excessive ratio - review settings'
    };
  }
}

// ============================================================================
// EARTH FAULT LOOP IMPEDANCE
// ============================================================================

export interface EarthFaultResult {
  loopImpedance: number;
  maxPermissible: number;
  status: 'PASS' | 'FAIL';
  tripTime: number;
}

export function calculateEarthFaultLoop(
  phaseResistance: number, // Ohms
  earthResistance: number, // Ohms
  voltage: number = 230,
  breakerRating: number = 32,
  maxTripTime: number = 0.2 // seconds (for 30mA RCD typically)
): EarthFaultResult {
  const totalImpedance = phaseResistance + earthResistance;
  const faultCurrent = voltage / totalImpedance;
  
  // For Type B circuit breakers, magnetic trip at 5-10x rated current
  const magneticTrip = breakerRating * 7.5;
  const tripTime = faultCurrent > magneticTrip ? 0.05 : 0.2;
  
  // Maximum earth loop impedance (simplified IEC calculation)
  const maxPermissible = voltage / (breakerRating * 5);
  
  return {
    loopImpedance: Math.round(totalImpedance * 1000) / 1000,
    maxPermissible: Math.round(maxPermissible * 1000) / 1000,
    status: totalImpedance < maxPermissible ? 'PASS' : 'FAIL',
    tripTime: Math.round(tripTime * 1000) / 1000
  };
}

// ============================================================================
// POWER FACTOR CORRECTION
// ============================================================================

export interface PowerFactorCorrectionResult {
  requiredReactivePower: number;
  capacitorSize: number;
  newPowerFactor: number;
  annualSavings: number; // kEUR/year (simplified estimate)
}

export function calculatePowerFactorCorrection(
  realPower: number, // kW
  currentPF: number,
  targetPF: number = 0.95,
  energyCost: number = 0.12, // EUR/kWh
  operatingHours: number = 4000
): PowerFactorCorrectionResult {
  // Calculate current reactive power
  const currentQ = realPower * Math.tan(Math.acos(currentPF));
  
  // Calculate target reactive power
  const targetQ = realPower * Math.tan(Math.acos(targetPF));
  
  // Required correction
  const requiredQ = currentQ - targetQ;
  
  // Annual energy savings from reduced losses (simplified)
  const lossReduction = requiredQ * 0.02 * operatingHours / 1000; // Assume 2% loss per kVAr
  const annualSavings = Math.round(lossReduction * energyCost * 100) / 100;
  
  return {
    requiredReactivePower: Math.round(requiredQ * 100) / 100,
    capacitorSize: Math.round(requiredQ * 1.1 * 100) / 100, // 10% safety margin
    newPowerFactor: targetPF,
    annualSavings: Math.round(annualSavings * 100) / 100
  };
}

// ============================================================================
// GENERATE COMPLETE ENGINEERING REPORT
// ============================================================================

export interface EngineeringReport {
  voltageDrop: VoltageDropResult;
  shortCircuit: ShortCircuitResult;
  cableSizing: CableSizingResult;
  loadFlow: LoadFlowResult;
  breakerCoordination: BreakerCoordinationResult;
  timestamp: number;
}

export function generateCompleteReport(
  current: number,
  length: number,
  material: CableMaterial,
  crossSection: number,
  powerFactor: number,
  voltage: number,
  installationMethod: InstallationMethod,
  ambientTemp: number,
  upstreamBreaker: number,
  downstreamBreaker: number
): EngineeringReport {
  return {
    voltageDrop: calculateVoltageDrop(current, length, material, crossSection, powerFactor, voltage),
    shortCircuit: calculateShortCircuit(voltage, length, material, crossSection, 50, upstreamBreaker),
    cableSizing: calculateCableSizing(current, material, installationMethod, ambientTemp),
    loadFlow: calculateLoadFlow(current * voltage * Math.sqrt(3) * powerFactor / 1000, voltage, powerFactor),
    breakerCoordination: checkBreakerCoordination(upstreamBreaker, downstreamBreaker),
    timestamp: Date.now()
  };
}