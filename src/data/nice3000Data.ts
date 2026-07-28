import type { FaultCode, Parameter, Diagram, GuideSymptom, Elevator, ServiceVisit } from "../types";

// ─── Storage Keys ───
const KEYS = {
  ELEVATORS: "nice3000_elevators",
  TECH_NAME: "nice3000_tech_name",
  FAULT_NOTES: "nice3000_fault_notes",
} as const;

// ─── localStorage Helpers ───
export function getElevators(): Elevator[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.ELEVATORS) || "[]");
  } catch { return []; }
}
export function saveElevators(e: Elevator[]) { localStorage.setItem(KEYS.ELEVATORS, JSON.stringify(e)); }

export function getElevator(id: string): Elevator | undefined {
  return getElevators().find((e) => e.id === id);
}

export function saveElevator(elevator: Elevator) {
  const list = getElevators().filter((e) => e.id !== elevator.id);
  list.push(elevator);
  saveElevators(list);
}

export function deleteElevator(id: string) {
  saveElevators(getElevators().filter((e) => e.id !== id));
}

export function getVisits(elevatorId: string): ServiceVisit[] {
  return getElevator(elevatorId)?.visits || [];
}

export function addVisit(elevatorId: string, visit: ServiceVisit) {
  const el = getElevator(elevatorId);
  if (!el) return;
  el.visits.push(visit);
  saveElevator(el);
}

export function deleteVisit(elevatorId: string, visitId: string) {
  const el = getElevator(elevatorId);
  if (!el) return;
  el.visits = el.visits.filter((v) => v.id !== visitId);
  saveElevator(el);
}

export function getTechName(): string {
  return localStorage.getItem(KEYS.TECH_NAME) || "";
}
export function setTechName(n: string) { localStorage.setItem(KEYS.TECH_NAME, n); }

export function getTechNote(code: string): string {
  try {
    const notes = JSON.parse(localStorage.getItem(KEYS.FAULT_NOTES) || "{}");
    return notes[code] || "";
  } catch { return ""; }
}
export function setTechNote(code: string, note: string) {
  try {
    const notes = JSON.parse(localStorage.getItem(KEYS.FAULT_NOTES) || "{}");
    notes[code] = note;
    localStorage.setItem(KEYS.FAULT_NOTES, JSON.stringify(notes));
  } catch { /* noop */ }
}

// ─── Fault Codes ───
export const FAULT_CODES: FaultCode[] = [
  { code: "Err02", subcodes: ["Err02"], level: "Critical", description: "Hardware overcurrent / inverter module fault",
    possibleCauses: ["Inverter module (IGBT) short circuit", "Motor wiring short to ground", "Motor winding insulation breakdown", "DC bus capacitor failure"],
    quickChecks: ["Check motor insulation with Megger", "Inspect IGBT module for visible damage", "Measure DC bus voltage", "Disconnect motor and retest"],
    procedure: "1. Power down and lockout. 2. Disconnect motor U/V/W terminals. 3. Measure resistance between phases and ground (should be >1M Ohm). 4. Inspect inverter module for burn marks or cracks. 5. Measure DC bus voltage at P/N terminals. 6. Replace inverter module if faulty. 7. Rewind or replace motor if insulation is compromised.",
    relatedParams: ["F0-00", "F0-01", "F0-02"], relatedDiagrams: ["wiring-main", "safety-circuit"], source: "NICE3000new Troubleshooting Manual §5.2" },
  { code: "Err03", subcodes: ["Err03"], level: "Critical", description: "Accelerator overcurrent during acceleration",
    possibleCauses: ["Acceleration time too short", "Brake release too early", "Motor parameters incorrect", "Load exceeds rated capacity"],
    quickChecks: ["Verify acceleration time (F0-17)", "Check brake release timing", "Confirm motor nameplate data in F1 group", "Reduce load and retest"],
    procedure: "1. Check F0-17 (acceleration time) and increase by 0.5s increments. 2. Verify F1-00 through F1-04 match motor nameplate. 3. Perform motor auto-tuning (F1-11). 4. Check brake release delay (F5-00). 5. Inspect for mechanical binding in guide rails.",
    relatedParams: ["F0-17", "F1-00", "F1-01", "F1-02", "F1-03", "F1-04", "F5-00"], relatedDiagrams: ["wiring-main", "brake-circuit"], source: "NICE3000new Troubleshooting Manual §5.3" },
  { code: "Err04", subcodes: ["Err04"], level: "Critical", description: "Decelerator overcurrent during deceleration",
    possibleCauses: ["Deceleration time too short", "Brake engages too early", "Re-gen energy not dissipated", "Brake resistor undersized or open"],
    quickChecks: ["Verify deceleration time (F0-18)", "Check brake resistor continuity", "Monitor DC bus voltage during stop", "Inspect brake resistor wiring"],
    procedure: "1. Increase F0-18 (deceleration time) by 0.5s increments. 2. Measure brake resistor value (should match rated Ohms). 3. Check F5-01 (brake engage delay). 4. Verify external brake resistor is properly connected. 5. Add external brake resistor if using light-load applications.",
    relatedParams: ["F0-18", "F5-01", "F5-02"], relatedDiagrams: ["wiring-main", "brake-circuit"], source: "NICE3000new Troubleshooting Manual §5.4" },
  { code: "Err05", subcodes: ["Err05"], level: "Critical", description: "AC supply overvoltage — DC bus exceeded max threshold",
    possibleCauses: ["Mains voltage too high (>264VAC)", "Regen overvoltage from overhauling load", "Brake resistor circuit open", "Voltage regulator malfunction"],
    quickChecks: ["Measure incoming AC voltage at R/S/T", "Monitor DC bus voltage on keypad (U0-00)", "Check brake resistor continuity", "Inspect voltage regulator board"],
    procedure: "1. Measure input voltage between R-S, S-T, T-R — should be 220-264VAC. 2. Verify DC bus voltage (U0-00) — normal range 310-380VDC. 3. Check brake resistor for open circuit. 4. Inspect P/N bus capacitor bank for bulging. 5. Install line reactor if mains is unstable.",
    relatedParams: ["F0-00", "F0-03", "FA-05"], relatedDiagrams: ["wiring-main", "power-supply"], source: "NICE3000new Troubleshooting Manual §5.5" },
  { code: "Err06", subcodes: ["Err06"], level: "Critical", description: "AC supply undervoltage — DC bus dropped below min threshold",
    possibleCauses: ["Mains voltage too low (<187VAC)", "Single-phase loss on 3-phase supply", "DC bus capacitor bank degraded", "Input rectifier diode open"],
    quickChecks: ["Measure incoming AC voltage at R/S/T", "Check for blown input fuses", "Monitor DC bus voltage", "Inspect main contactor"],
    procedure: "1. Measure all three phases — ensure >187VAC. 2. Check input fuses and main contactor. 3. Verify DC bus voltage >250VDC. 4. Inspect capacitor bank for swelling/leakage. 5. Check for loose power connections.",
    relatedParams: ["F0-00", "FA-05", "FA-06"], relatedDiagrams: ["wiring-main", "power-supply"], source: "NICE3000new Troubleshooting Manual §5.6" },
  { code: "Err07", subcodes: ["Err07", "Err07-01", "Err07-02"], level: "Critical", description: "STO (Safe Torque Off) active — safety circuit interrupted",
    possibleCauses: ["STO1/STO2 input signals not present", "Safety contactor opened", "E-stop pressed", "Safety relay board fault", "Door lock circuit open"],
    quickChecks: ["Check STO LED status on control board", "Verify 24VDC at STO1/STO2 terminals", "Check E-stop position", "Inspect safety chain continuity"],
    procedure: "1. Confirm STO LEDs on control board are lit (both CH1 and CH2). 2. Measure 24VDC between STO1-COM and STO2-COM. 3. Verify all E-stop buttons are released. 4. Check safety relay coil voltage. 5. Inspect door lock contact position. 6. Trace STO circuit per wiring diagram.",
    relatedParams: ["F5-10", "F5-11", "F5-12"], relatedDiagrams: ["safety-circuit", "sto-cluster"], source: "NICE3000new Troubleshooting Manual §5.7" },
  { code: "Err08", subcodes: ["Err08", "Err08-01", "Err08-02"], level: "Critical", description: "Encoder / Speed feedback signal loss",
    possibleCauses: ["Encoder wiring broken or loose", "Encoder supply voltage missing", "Encoder damaged by electrical noise", "PG card (PG-D/O) faulty", "Wrong encoder type selected"],
    quickChecks: ["Check encoder connector seating", "Verify +5VDC at encoder pins", "Inspect encoder cable for shielding", "Monitor encoder pulses (U0-04)", "Test with known-good encoder"],
    procedure: "1. Verify encoder connector is fully seated at both ends. 2. Measure +5VDC between encoder power and ground pins. 3. Inspect cable for cuts, kinks, or bad shielding. 4. Check F1-12 (encoder type) matches physical encoder. 5. Observe U0-04 (encoder pulse count) while rotating manually. 6. Replace PG card if no pulses detected.",
    relatedParams: ["F1-12", "F1-13", "F1-14", "F0-03"], relatedDiagrams: ["encoder-wiring", "wiring-main"], source: "NICE3000new Troubleshooting Manual §5.8" },
  { code: "Err09", subcodes: ["Err09", "Err09-01", "Err09-02"], level: "Major", description: "Encoder signal phase error / ABZ phase mismatch",
    possibleCauses: ["Encoder A/B phase swapped", "Encoder Z pulse misaligned", "Electrical noise on encoder lines", "Encoder damaged"],
    quickChecks: ["Check encoder wiring order (A, A-, B, B-, Z, Z-)", "Verify F1-12 encoder type", "Swap encoder A/B wires and retest", "Check shielded cable grounding"],
    procedure: "1. Verify A, A\\, B, B\\, Z, Z\\ wiring order per diagram. 2. Check F1-12 matches encoder — set to 1 (ABZ) or 2 (UVW). 3. Swap A and B wires if phases are reversed. 4. Ensure encoder cable shield is grounded at drive end only. 5. Replace encoder if errors persist.",
    relatedParams: ["F1-12", "F1-13", "F1-14"], relatedDiagrams: ["encoder-wiring"], source: "NICE3000new Troubleshooting Manual §5.9" },
  { code: "Err10", subcodes: ["Err10", "Err10-01", "Err10-02"], level: "Major", description: "Encoder count exceeded / overspeed protection",
    possibleCauses: ["Overspeed condition", "Brake slipping", "Encoder pulse count mismatch", "Motor over-speeding due to load"],
    quickChecks: ["Check U0-05 motor speed", "Inspect brake lining wear", "Verify F1-01 motor rated speed", "Test encoder pulse count per rev"],
    procedure: "1. Read U0-05 (motor speed) — should not exceed 1.2x rated speed. 2. Inspect brake pads for wear (min 3mm thickness). 3. Verify F1-01 motor rated speed matches nameplate. 4. Check F1-13 encoder pulses per revolution. 5. Adjust overspeed threshold (F9-03) if needed.",
    relatedParams: ["F1-01", "F1-13", "F9-03", "F0-17", "F0-18"], relatedDiagrams: ["encoder-wiring", "brake-circuit"], source: "NICE3000new Troubleshooting Manual §5.10" },
  { code: "Err11", subcodes: ["Err11", "Err11-01", "Err11-02"], level: "Major", description: "Motor over-load / current limit exceeded",
    possibleCauses: ["Mechanical binding in guide rails", "Car over-loaded", "Motor parameters incorrect", "Balance chains/ropes incorrect tension"],
    quickChecks: ["Check motor current (U0-02) vs rated", "Verify counterweight balance", "Inspect guide rail lubrication", "Check F1-03 motor rated current"],
    procedure: "1. Read U0-02 (motor current) — should be < F1-03 rated current. 2. Verify counterweight balance (50% load test). 3. Inspect guide rails for binding or dry guides. 4. Check rope tension (all ropes should be even). 5. Adjust F1-03 if motor nameplate data was incorrect.",
    relatedParams: ["F1-03", "F0-11", "F0-10", "F9-00", "F9-01"], relatedDiagrams: ["wiring-main"], source: "NICE3000new Troubleshooting Manual §5.11" },
  { code: "Err12", subcodes: ["Err12", "Err12-01", "Err12-02"], level: "Major", description: "Controller over-temperature",
    possibleCauses: ["Heatsink fan not running", "Ambient temperature too high", "Heatsink clogged with dust", "Excessive load duty cycle"],
    quickChecks: ["Check heatsink fan operation", "Measure ambient temperature", "Clean heatsink fins", "Monitor temperature (U0-06)"],
    procedure: "1. Verify heatsink fan spins freely at power-on. 2. Measure ambient temperature — must be <40°C. 3. Clean heatsink fins with compressed air. 4. Read U0-06 (inverter temperature) — alarm at 85°C, trip at 95°C. 5. Reduce duty cycle or add forced ventilation.",
    relatedParams: ["F9-10", "F9-11"], relatedDiagrams: ["wiring-main"], source: "NICE3000new Troubleshooting Manual §5.12" },
  { code: "Err13", subcodes: ["Err13"], level: "Critical", description: "Brake resistor over-temperature",
    possibleCauses: ["Brake resistor undersized", "Frequent start/stop cycling", "Brake resistor obstructed/blocked", "Brake transistor shorted"],
    quickChecks: ["Check brake resistor thermal switch", "Inspect resistor mounting clearance", "Count starts/hour", "Measure brake resistor resistance"],
    procedure: "1. Check brake resistor thermal switch (should be NC). 2. Ensure minimum 100mm clearance around resistor. 3. Reduce starts per hour (<180 recommended). 4. Increase deceleration time (F0-18). 5. Install larger brake resistor if cycling is frequent.",
    relatedParams: ["F0-18", "F5-00", "F5-01", "F5-02"], relatedDiagrams: ["brake-circuit", "wiring-main"], source: "NICE3000new Troubleshooting Manual §5.13" },
  { code: "Err14", subcodes: ["Err14", "Err14-01", "Err14-02", "Err14-03"], level: "Critical", description: "Motor over-temperature (PTC thermistor trip)",
    possibleCauses: ["Motor overload", "Motor fan not running", "PTC sensor wiring open/short", "Ambient motor temperature too high"],
    quickChecks: ["Check motor fan operation", "Measure PTC resistance across motor terminals", "Read U0-07 motor temperature", "Check motor duty cycle"],
    procedure: "1. Verify motor cooling fan is running. 2. Measure PTC resistance at motor terminals (normal <100 Ohm, trip >750 Ohm). 3. Read U0-07 (motor temperature) if supported. 4. Check F9-04 (motor overload protection level). 5. Allow motor to cool and retest.",
    relatedParams: ["F9-04", "F1-03", "F0-11"], relatedDiagrams: ["wiring-main"], source: "NICE3000new Troubleshooting Manual §5.14" },
  { code: "Err15", subcodes: ["Err15", "Err15-01", "Err15-02"], level: "Major", description: "PG card / encoder power supply fault",
    possibleCauses: ["PG card fuse blown", "PG card +5V short circuit", "Encoder short circuit", "PG card damaged"],
    quickChecks: ["Check PG card status LED", "Measure +5V at PG card output", "Disconnect encoder and check +5V", "Inspect PG card for visible damage"],
    procedure: "1. Check PG card LED (green = OK, red = fault). 2. Measure +5VDC at PG card output terminals. 3. Disconnect encoder — if +5V returns, encoder is shorted. 4. Replace PG card if +5V is still missing after disconnecting encoder. 5. Check F1-14 (PG card type) setting.",
    relatedParams: ["F1-14", "F1-12", "F1-13"], relatedDiagrams: ["encoder-wiring"], source: "NICE3000new Troubleshooting Manual §5.15" },
  { code: "Err16", subcodes: ["Err16"], level: "Critical", description: "Brake circuit feedback failure",
    possibleCauses: ["Brake contactor feedback not received", "Brake coil open circuit", "Brake relay failure", "Brake power supply missing"],
    quickChecks: ["Check brake contactor auxiliary contacts", "Verify 110VDC at brake coil", "Check brake relay coil voltage", "Inspect brake rectifier"],
    procedure: "1. Check brake contactor auxiliary contact wiring. 2. Measure 110VDC across brake coil terminals. 3. Verify brake relay (on control board) is switching. 4. Check brake rectifier output. 5. Inspect F5-00 through F5-02 timing parameters.",
    relatedParams: ["F5-00", "F5-01", "F5-02", "F5-03"], relatedDiagrams: ["brake-circuit", "safety-circuit"], source: "NICE3000new Troubleshooting Manual §5.16" },
  { code: "Err17", subcodes: ["Err17", "Err17-01", "Err17-02"], level: "Major", description: "Drive output phase loss",
    possibleCauses: ["Motor U/V/W wire disconnected", "Output contactor open", "Motor winding open", "Inverter output module failure"],
    quickChecks: ["Check all motor connections U/V/W", "Verify output contactor is closed", "Measure resistance between phases", "Check motor continuity"],
    procedure: "1. Tighten U/V/W terminals at drive and motor. 2. Verify output contactor is closed (if used). 3. Measure U-V, V-W, W-U resistance (should be equal). 4. Check each phase to ground (>1M Ohm). 5. Run motor in open-loop (F0-03=0) to isolate drive vs motor.",
    relatedParams: ["F0-03", "F1-00", "F1-01", "F1-02"], relatedDiagrams: ["wiring-main"], source: "NICE3000new Troubleshooting Manual §5.17" },
  { code: "Err18", subcodes: ["Err18", "Err18-01", "Err18-02"], level: "Major", description: "Input phase loss on mains",
    possibleCauses: ["One phase of 3-phase supply missing", "Input fuse blown on one phase", "Main contactor not closing one pole", "Supply transformer issue"],
    quickChecks: ["Measure R-S, S-T, T-R voltages", "Check input fuses", "Verify main contactor closes all 3 poles", "Check supply transformer output"],
    procedure: "1. Measure R-S, S-T, T-R — all should be 220-264VAC. 2. Check all three input fuses with meter. 3. Inspect main contactor for pitted contacts. 4. Verify supply transformer taps are correct. 5. Set FA-06 (phase loss protection) to 0 to disable if single-phase supply is intentional.",
    relatedParams: ["FA-05", "FA-06"], relatedDiagrams: ["power-supply", "wiring-main"], source: "NICE3000new Troubleshooting Manual §5.18" },
  { code: "Err19", subcodes: ["Err19", "Err19-01", "Err19-02"], level: "Critical", description: "Controller EEPROM parameter read/write fault",
    possibleCauses: ["EEPROM corrupted by power loss during write", "Parameter writing cycle exceeded", "Static discharge on keypad", "Control board hardware failure"],
    quickChecks: ["Try to restore factory defaults", "Check if parameters were being saved during power loss", "Verify keypad ribbon cable", "Check for static discharge events"],
    procedure: "1. Record all parameters manually. 2. Perform factory reset (FP-01=1). 3. Power cycle controller. 4. Re-enter parameters if reset worked. 5. Replace control board if factory reset fails.",
    relatedParams: ["FP-01", "FP-00"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.19" },
  { code: "Err20", subcodes: ["Err20", "Err20-01", "Err20-02", "Err20-03", "Err20-04"], level: "Major", description: "CAN communication bus fault (between control board and keypad/expansion)",
    possibleCauses: ["Keypad ribbon cable loose", "CAN termination resistor missing", "Electrical noise on CAN bus", "Expansion board not properly seated", "Duplicate node ID on CAN bus"],
    quickChecks: ["Check keypad ribbon cable connection", "Verify CAN termination jumpers", "Inspect expansion board seating", "Check for shield grounding"],
    procedure: "1. Reseat keypad ribbon cable at both ends. 2. Verify CAN termination resistors are fitted at both ends of bus. 3. Check expansion board seating. 4. Ensure CAN cable shield is grounded at one end only. 5. Verify no duplicate node addresses on bus.",
    relatedParams: ["FC-00", "FC-01", "FC-02", "FC-03"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.20" },
  { code: "Err21", subcodes: ["Err21", "Err21-01", "Err21-02", "Err21-03", "Err21-04"], level: "Major", description: "Controller communication timeout (board-to-board)",
    possibleCauses: ["Control board to driver board ribbon loose", "Driver board power supply missing", "Control board or driver board fault", "Firmware mismatch between boards"],
    quickChecks: ["Check ribbon cable between control and driver boards", "Verify +5V and +24V on driver board", "Check firmware version labels", "Power cycle controller"],
    procedure: "1. Reseat ribbon cable between control board and driver board. 2. Measure +5V and +24V test points on driver board. 3. Compare firmware version numbers on both boards. 4. If voltages OK and firmware matches, replace control board then driver board.",
    relatedParams: ["FP-00", "FP-01"], relatedDiagrams: ["wiring-main"], source: "NICE3000new Troubleshooting Manual §5.21" },
  { code: "Err22", subcodes: ["Err22", "Err22-01", "Err22-02", "Err22-03"], level: "Major", description: "Positioning / homing sensor fault",
    possibleCauses: ["Leveling sensor (door zone) fault", "Top/bottom limit switch stuck", "Re-leveling sensor misaligned", "Sensor wiring open/short"],
    quickChecks: ["Check door zone sensor alignment", "Test top/bottom limit switches manually", "Verify sensor input on keypad (U0-17)", "Inspect sensor wiring harness"],
    procedure: "1. Check door zone sensor LED (should light when passing door zone). 2. Manually actuate top/bottom limit switches — verify input at keypad. 3. Clean sensor lenses. 4. Measure sensor supply voltage (24VDC). 5. Check sensor alignment gap (3-5mm typical).",
    relatedParams: ["F2-00", "F2-01", "F2-02", "F2-03"], relatedDiagrams: ["door-control"], source: "NICE3000new Troubleshooting Manual §5.22" },
  { code: "Err23", subcodes: ["Err23", "Err23-01", "Err23-02"], level: "Major", description: "Door controller communication fault",
    possibleCauses: ["Door controller power missing", "CAN bus between main controller and door controller broken", "Door controller fault", "Wiring harness damage"],
    quickChecks: ["Check door controller power LED", "Verify CAN wiring between controllers", "Inspect door controller harness", "Power cycle door controller"],
    procedure: "1. Verify door controller power LED is lit. 2. Check CAN H and CAN L wiring between main and door controllers. 3. Check door controller for fault codes. 4. Inspect harness for damage in traveling cable. 5. Replace door controller if no communication.",
    relatedParams: ["FC-00", "FC-01", "FC-02", "FC-03"], relatedDiagrams: ["door-control"], source: "NICE3000new Troubleshooting Manual §5.23" },
  { code: "Err24", subcodes: ["Err24", "Err24-01", "Err24-02"], level: "Major", description: "Re-leveling failure",
    possibleCauses: ["Door zone sensor misaligned", "Leveling speed too fast", "Brake release timing incorrect", "Encoder drift during re-level"],
    quickChecks: ["Check door zone sensor alignment", "Verify re-leveling speed (F6-00)", "Check brake timing (F5-00/F5-01)", "Watch encoder count during re-level"],
    procedure: "1. Clean and align door zone sensors. 2. Reduce re-leveling speed (F6-00). 3. Adjust brake release timing (F5-00 delay). 4. Check encoder coupling tightness. 5. Verify F7-00 (re-leveling mode) is set correctly.",
    relatedParams: ["F6-00", "F5-00", "F5-01", "F7-00", "F2-00", "F2-01"], relatedDiagrams: ["door-control", "encoder-wiring"], source: "NICE3000new Troubleshooting Manual §5.24" },
  { code: "Err25", subcodes: ["Err25", "Err25-01", "Err25-02"], level: "Major", description: "Leveling / floor position offset error",
    possibleCauses: ["Floor height data corrupted", "Leveling sensor reading inconsistent", "Car frame shifted", "Hoistway learning data incorrect"],
    quickChecks: ["Perform floor re-learning", "Check car level at each floor", "Verify sensor bracket alignment", "Check F4 group floor heights"],
    procedure: "1. Perform hoistway learning (F2-11=1). 2. Manually level car at each floor to check offset. 3. Verify sensor brackets are tight. 4. Check F4-xx floor height data. 5. Adjust F2-02 (leveling zone offset).",
    relatedParams: ["F2-02", "F2-11", "F4-00", "F4-01", "F4-02"], relatedDiagrams: ["door-control"], source: "NICE3000new Troubleshooting Manual §5.25" },
  { code: "Err26", subcodes: ["Err26", "Err26-01", "Err26-02"], level: "Critical", description: "Emergency run / governor overspeed trip",
    possibleCauses: ["Governor overspeed tripped", "Emergency stop switch activated", "Safety gear engaged", "Car overspeed detected"],
    quickChecks: ["Check governor reset lever", "Verify emergency stop switch position", "Inspect safety gear status", "Check governor rope tension"],
    procedure: "1. Reset governor by pulling reset lever. 2. Verify safety gear is not engaged. 3. Check emergency stop switch on car top. 4. Inspect governor rope tension and Rope Gripper. 5. Test run at inspection speed. 6. Contact elevator authority if safety gear engaged.",
    relatedParams: ["F8-00", "F8-01", "F9-03"], relatedDiagrams: ["safety-circuit"], source: "NICE3000new Troubleshooting Manual §5.26" },
  { code: "Err27", subcodes: ["Err27", "Err27-01", "Err27-02"], level: "Major", description: "Hoistway learning data anomaly",
    possibleCauses: ["Hoistway learning incomplete", "Floor sensor mis-detected during learning", "Obstruction in hoistway", "Limit switch adjustment incorrect"],
    quickChecks: ["Check if learning completed (F2-11=2)", "Verify floor count matches actual", "Check sensor magnets/switches at each floor", "Inspect hoistway for obstructions"],
    procedure: "1. Run hoistway learning again (F2-11=1). 2. Verify car stops at each floor during learning. 3. Check all floor sensors/switches are present and aligned. 4. Inspect hoistway for debris or protruding objects. 5. Compare learned floor count with actual floor count.",
    relatedParams: ["F2-11", "F4-00", "F4-01", "F4-02"], relatedDiagrams: ["door-control"], source: "NICE3000new Troubleshooting Manual §5.27" },
  { code: "Err28", subcodes: ["Err28", "Err28-01", "Err28-02", "Err28-03"], level: "Major", description: "Door opening failure",
    possibleCauses: ["Door motor power missing", "Door belt/chain broken", "Door track obstructed", "Door controller fault", "Door limit switch misaligned"],
    quickChecks: ["Check door motor voltage", "Inspect door belt tension", "Clear door track debris", "Check door limit switch position"],
    procedure: "1. Measure door motor voltage during open command. 2. Inspect door belt/chain for breaks or slack. 3. Clean door track and rollers. 4. Check door limit switch (DOL) adjustment. 5. Check door controller for fault codes. 6. Adjust door motor torque/speed parameters.",
    relatedParams: ["F6-01", "F6-02", "F6-03", "F6-04"], relatedDiagrams: ["door-control"], source: "NICE3000new Troubleshooting Manual §5.28" },
  { code: "Err29", subcodes: ["Err29", "Err29-01", "Err29-02", "Err29-03"], level: "Major", description: "Door closing failure",
    possibleCauses: ["Door obstruction sensor active", "Door belt/chain broken", "Door track obstructed", "Door closer spring tension wrong", "Door limit switch misaligned"],
    quickChecks: ["Check door obstruction sensor (light curtain)", "Inspect door belt tension", "Clear door track debris", "Check door limit switch (DCL) position"],
    procedure: "1. Check light curtain / obstruction sensor alignment. 2. Inspect door belt/chain for breaks. 3. Clean door track and lubricate rollers. 4. Check door close limit switch (DCL) adjustment. 5. Adjust door closing speed (F6-05, F6-06). 6. Verify door closer spring tension.",
    relatedParams: ["F6-05", "F6-06", "F6-07", "F6-08"], relatedDiagrams: ["door-control"], source: "NICE3000new Troubleshooting Manual §5.29" },
  { code: "Err30", subcodes: ["Err30", "Err30-01", "Err30-02"], level: "Major", description: "Car call button / input board communication fault",
    possibleCauses: ["Car operating panel (COP) CAN bus fault", "COP power supply missing", "COP button board fault", "COP ribbon cable loose"],
    quickChecks: ["Check COP power LED", "Verify CAN bus wiring to COP", "Test individual button response", "Reseat COP ribbon cables"],
    procedure: "1. Check COP power LED (should be lit). 2. Verify CAN H/L wiring between controller and COP. 3. Test each car call button for response. 4. Reseat ribbon cables inside COP. 5. Replace COP board if no communication.",
    relatedParams: ["FC-00", "FC-01", "FC-02"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.30" },
  { code: "Err31", subcodes: ["Err31", "Err31-01", "Err31-02"], level: "Major", description: "Hall call / landing board communication fault",
    possibleCauses: ["Hall call board power missing", "CAN bus fault on landing bus", "Hall call button board fault", "Landing board address conflict"],
    quickChecks: ["Check hall call board power LED", "Verify CAN wiring to hall stations", "Check landing board DIP switch addresses", "Test individual hall buttons"],
    procedure: "1. Check hall call board power LED. 2. Verify CAN H/L wiring to each landing board. 3. Verify DIP switch addresses are unique on each landing board. 4. Test each hall button for response. 5. Replace hall call board if no communication.",
    relatedParams: ["FC-00", "FC-01", "FC-02", "FC-03"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.31" },
  { code: "Err32", subcodes: ["Err32", "Err32-01", "Err32-02"], level: "Info", description: "Battery / UPS backup fault",
    possibleCauses: ["Battery voltage low", "Battery charger fault", "Battery disconnected", "Battery end of life (>3 years)"],
    quickChecks: ["Check battery voltage at charger terminals", "Verify charger LED status", "Check battery terminal connections", "Test battery under load"],
    procedure: "1. Measure battery voltage (should be 24VDC or 48VDC nominal). 2. Check battery charger LED — green = OK, red = fault. 3. Clean and tighten battery terminals. 4. Load test battery. 5. Replace battery if >3 years old or voltage <80% nominal under load.",
    relatedParams: ["FA-10", "FA-11", "FA-12"], relatedDiagrams: ["power-supply"], source: "NICE3000new Troubleshooting Manual §5.32" },
  { code: "Err33", subcodes: ["Err33", "Err33-01", "Err33-02"], level: "Major", description: "Load weighing device fault",
    possibleCauses: ["Load cell wiring open/short", "Load cell supply voltage missing", "Load cell offset drifted", "Load cell amplifier board fault"],
    quickChecks: ["Check load cell connector seating", "Verify load cell excitation voltage", "Read load cell raw value (U0-15)", "Check zero offset with empty car"],
    procedure: "1. Verify load cell connector is fully seated. 2. Measure excitation voltage at load cell (5VDC or 10VDC). 3. Read U0-15 (load cell raw value) — should change with load. 4. Perform zero calibration with empty car. 5. Replace load cell or amplifier if no reading.",
    relatedParams: ["F3-00", "F3-01", "F3-02", "F3-03"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.33" },
  { code: "Err34", subcodes: ["Err34", "Err34-01", "Err34-02"], level: "Major", description: "Car-to-hoistway communication (traveling cable) fault",
    possibleCauses: ["Traveling cable damaged", "CAN bus on traveling cable intermittent", "Car top junction box loose connection", "Traveling cable strain relief failed"],
    quickChecks: ["Inspect traveling cable for visible damage", "Wiggle cable at car and pit ends", "Check car top junction box connections", "Check CAN termination"],
    procedure: "1. Visually inspect full length of traveling cable for cuts, kinks, or crushing. 2. Check all connections in car top junction box. 3. Verify CAN termination — only at ends of bus. 4. Check traveling cable strain relief at car and pit. 5. Replace traveling cable if intermittent fault persists.",
    relatedParams: ["FC-00", "FC-01"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.34" },
  { code: "Err35", subcodes: ["Err35", "Err35-01", "Err35-02"], level: "Major", description: "24V control supply fault",
    possibleCauses: ["24V power supply overloaded", "24V power supply failed", "Short circuit on 24V distribution", "External 24V device drawing too much current"],
    quickChecks: ["Measure 24V at power supply output", "Check 24V fuse", "Disconnect external 24V loads one by one", "Check for shorted sensors"],
    procedure: "1. Measure 24VDC at power supply output terminals. 2. Check 24V fuse/blade fuse condition. 3. Disconnect external devices (sensors, relays) one at a time. 4. Check for shorted sensor wiring. 5. Replace 24V power supply if output <22VDC with no load.",
    relatedParams: ["FA-00", "FA-01"], relatedDiagrams: ["power-supply"], source: "NICE3000new Troubleshooting Manual §5.35" },
  { code: "Err36", subcodes: ["Err36", "Err36-01", "Err36-02"], level: "Major", description: "5V control supply fault",
    possibleCauses: ["5V power supply overloaded", "5V power supply failed", "Short circuit on 5V distribution", "Encoder or PG card shorting 5V"],
    quickChecks: ["Measure 5V at control board test point", "Disconnect encoder and recheck 5V", "Check PG card for shorts", "Check for water damage on control board"],
    procedure: "1. Measure 5VDC at control board test point TP1. 2. Disconnect encoder — if 5V recovers, encoder or cable is shorted. 3. Remove PG card and check 5V. 4. Inspect control board for water damage or corrosion. 5. Replace control board if 5V is missing with all peripherals disconnected.",
    relatedParams: ["FA-00", "FA-01"], relatedDiagrams: ["power-supply", "encoder-wiring"], source: "NICE3000new Troubleshooting Manual §5.36" },
  { code: "Err37", subcodes: ["Err37", "Err37-01", "Err37-02"], level: "Major", description: "Safety chain open / safety circuit fault",
    possibleCauses: ["Safety circuit contact opened", "E-stop active", "Safety relay (KAS) not picked up", "Door lock contact open", "Safety chain monitoring relay fault"],
    quickChecks: ["Check safety chain LED on control board", "Verify all E-stops are reset", "Check door lock contact position", "Check KAS relay coil voltage"],
    procedure: "1. Check safety chain monitoring LED on control board. 2. Trace safety circuit from top to bottom per diagram. 3. Verify all E-stop buttons are pulled out. 4. Check door lock contacts at each landing. 5. Measure KAS relay coil voltage. 6. Check safety relay (KAS) contact for welding.",
    relatedParams: ["F5-10", "F5-11", "F5-12", "F5-13"], relatedDiagrams: ["safety-circuit", "sto-cluster"], source: "NICE3000new Troubleshooting Manual §5.37" },
  { code: "Err38", subcodes: ["Err38", "Err38-01", "Err38-02"], level: "Major", description: "Door lock circuit open",
    possibleCauses: ["Door lock contact not making at landing", "Door lock wiring broken", "Door lock power supply missing", "Door lock contact adjustment"],
    quickChecks: ["Check door lock LED at each landing", "Measure voltage across door lock contact", "Manually actuate door lock and check continuity", "Inspect door lock wiring"],
    procedure: "1. Check door lock LED at each landing (should be lit when door closed). 2. Measure voltage across door lock contact at hall door. 3. Manually actuate door lock and check continuity. 4. Inspect door lock wiring in door header. 5. Adjust door lock contact gap (2-3mm typical).",
    relatedParams: ["F5-10", "F5-11", "F5-12", "F5-13"], relatedDiagrams: ["safety-circuit", "door-control"], source: "NICE3000new Troubleshooting Manual §5.38" },
  { code: "Err39", subcodes: ["Err39", "Err39-01", "Err39-02"], level: "Major", description: "Re-leveling / door zone sensor fault during operation",
    possibleCauses: ["Door zone sensor (DZ) signal lost mid-run", "Sensor bracket loosened", "Sensor wiring intermittent", "Sensor damaged by car door operation"],
    quickChecks: ["Check DZ sensor LED", "Tighten sensor bracket bolts", "Inspect sensor wiring harness", "Check sensor gap to vane"],
    procedure: "1. Verify DZ sensor LED is on when passing door zone. 2. Tighten sensor bracket bolts. 3. Inspect wiring for chafing where harness passes near door operator. 4. Check sensor gap (3-5mm from vane). 5. Replace sensor if LED is intermittent.",
    relatedParams: ["F2-00", "F2-01", "F2-02", "F2-03"], relatedDiagrams: ["door-control"], source: "NICE3000new Troubleshooting Manual §5.39" },
  { code: "Err40", subcodes: ["Err40", "Err40-01", "Err40-02"], level: "Major", description: "Terminal / final limit switch fault",
    possibleCauses: ["Top final limit switch (TFL) actuated", "Bottom final limit switch (BFL) actuated", "Limit switch wiring fault", "Car over-traveled terminal floor"],
    quickChecks: ["Check TFL/BFL switch position", "Verify limit switch wiring", "Check car position relative to terminals", "Inspect switch cams on car"],
    procedure: "1. Check top final limit switch (TFL) and bottom final limit switch (BFL) positions. 2. Verify limit switch wiring — should be NC (normally closed). 3. Check car position — car should not be beyond terminal floor. 4. Inspect switch cams on car for damage. 5. Reset and run at inspection speed.",
    relatedParams: ["F2-00", "F2-01", "F2-10"], relatedDiagrams: ["safety-circuit"], source: "NICE3000new Troubleshooting Manual §5.40" },
  { code: "Err41", subcodes: ["Err41", "Err41-01", "Err41-02"], level: "Major", description: "Deceleration / slowdown curve fault",
    possibleCauses: ["Deceleration curve parameters incorrect", "Floor distance data corrupted", "Encoder pulse count mismatch", "Speed curve calculation error"],
    quickChecks: ["Check floor distances in F4 group", "Verify encoder pulses per rev (F1-13)", "Compare learned floor heights", "Test run at reduced speed"],
    procedure: "1. Verify F1-13 (encoder pulses) matches encoder nameplate. 2. Check F4-xx floor height data. 3. Re-run hoistway learning (F2-11=1). 4. Reduce contract speed (F0-06) temporarily for testing. 5. Adjust F0-17/F0-18 acceleration/deceleration curves.",
    relatedParams: ["F0-06", "F0-17", "F0-18", "F1-13", "F2-11", "F4-00"], relatedDiagrams: ["encoder-wiring"], source: "NICE3000new Troubleshooting Manual §5.41" },
  { code: "Err42", subcodes: ["Err42", "Err42-01", "Err42-02"], level: "Major", description: "Door zone / leveling zone sensor short circuit",
    possibleCauses: ["Door zone sensor shorted internally", "Sensor wiring shorted to ground", "Sensor bracket causing short", "Water ingress into sensor"],
    quickChecks: ["Check DZ sensor resistance", "Disconnect sensor and check continuity", "Inspect sensor for water damage", "Check sensor bracket grounding"],
    procedure: "1. Measure DZ sensor resistance between signal and ground. 2. Disconnect sensor — if fault clears, sensor is shorted. 3. Inspect sensor for water ingress or corrosion. 4. Check sensor bracket for metal-to-metal contact. 5. Replace sensor if shorted.",
    relatedParams: ["F2-00", "F2-01", "F2-02"], relatedDiagrams: ["door-control"], source: "NICE3000new Troubleshooting Manual §5.42" },
  { code: "Err43", subcodes: ["Err43", "Err43-01", "Err43-02"], level: "Major", description: "Soft starter / pre-charge circuit fault",
    possibleCauses: ["Pre-charge relay not closing", "Pre-charge resistor open", "DC bus voltage not reaching threshold", "Soft starter board fault"],
    quickChecks: ["Check pre-charge relay operation", "Measure pre-charge resistor continuity", "Monitor DC bus voltage at power-on", "Check soft starter board LED"],
    procedure: "1. Listen for pre-charge relay click at power-on. 2. Measure pre-charge resistor resistance (typically 10-100 Ohm). 3. Monitor DC bus voltage climb at power-on. 4. Check soft starter board LED status. 5. Replace soft starter board if pre-charge fails.",
    relatedParams: ["FA-00", "FA-01", "FA-02"], relatedDiagrams: ["power-supply"], source: "NICE3000new Troubleshooting Manual §5.43" },
  { code: "Err44", subcodes: ["Err44", "Err44-01", "Err44-02"], level: "Info", description: "Maintenance interval exceeded",
    possibleCauses: ["Maintenance timer expired", "Number of runs exceeded limit", "Time since last maintenance exceeded", "Maintenance reminder counter not reset"],
    quickChecks: ["Check U0-20 (run counter)", "Check U0-21 (days since last maintenance)", "Perform maintenance and reset counter", "Check FB-00 maintenance interval"],
    procedure: "1. Read U0-20 (total runs) and U0-21 (days since last maintenance). 2. Perform required maintenance per schedule. 3. Reset maintenance counter (FB-01=1). 4. Adjust FB-00 (maintenance interval) if needed. 5. Document maintenance performed.",
    relatedParams: ["FB-00", "FB-01", "FB-02"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.44" },
  { code: "Err45", subcodes: ["Err45", "Err45-01", "Err45-02"], level: "Major", description: "Car position lost / floor reference fault",
    possibleCauses: ["Unexpected floor skip during operation", "Floor zone sensor mis-detected", "Car position calculation error", "Hoistway learning switch triggered incorrectly"],
    quickChecks: ["Check car position on keypad display", "Perform floor re-learning", "Check floor zone sensor alignment", "Verify car is physically between terminals"],
    procedure: "1. Note car position on keypad display. 2. Check if car is physically between terminal floors. 3. Perform hoistway learning (F2-11=1). 4. Check floor zone sensor alignment. 5. Verify F2-00 (floor zone sensor type) is correct. 6. If car is stuck, manually move to terminal floor at inspection speed.",
    relatedParams: ["F2-00", "F2-11", "F4-00", "F4-01"], relatedDiagrams: ["door-control"], source: "NICE3000new Troubleshooting Manual §5.45" },
  { code: "Err46", subcodes: ["Err46", "Err46-01", "Err46-02"], level: "Major", description: "Motor auto-tuning failure",
    possibleCauses: ["Motor not connected during tuning", "Motor parameters input incorrectly", "Encoder feedback during tuning incorrect", "Tuning interrupted by safety circuit"],
    quickChecks: ["Verify motor is connected (U/V/W)", "Check motor nameplate data in F1 group", "Verify encoder working during tuning", "Ensure safety chain is closed"],
    procedure: "1. Confirm motor U/V/W connections are tight. 2. Verify F1-00 through F1-04 match motor nameplate. 3. Ensure safety chain is closed (KAS picked up). 4. Perform static auto-tuning (F1-11=1). 5. If static fails, try rotating auto-tuning (F1-11=2). 6. Check encoder wiring if tuning values are abnormal.",
    relatedParams: ["F1-00", "F1-01", "F1-02", "F1-03", "F1-04", "F1-11", "F1-12"], relatedDiagrams: ["encoder-wiring", "wiring-main"], source: "NICE3000new Troubleshooting Manual §5.46" },
  { code: "Err47", subcodes: ["Err47", "Err47-01", "Err47-02"], level: "Major", description: "Brake resistor / dynamic braking circuit fault",
    possibleCauses: ["Brake resistor open circuit", "Brake transistor (IGBT) shorted", "Brake resistor wiring disconnected", "Brake chopper circuit fault"],
    quickChecks: ["Measure brake resistor resistance", "Check brake resistor wiring connections", "Inspect brake chopper module", "Check for burnt smell near brake resistor"],
    procedure: "1. Measure brake resistor resistance — compare to rated value. 2. Tighten brake resistor wiring at drive and resistor. 3. Inspect brake chopper transistor on driver board. 4. Monitor DC bus voltage during deceleration. 5. Replace brake resistor if open or shorted.",
    relatedParams: ["F0-18", "F5-02"], relatedDiagrams: ["brake-circuit"], source: "NICE3000new Troubleshooting Manual §5.47" },
  { code: "Err48", subcodes: ["Err48"], level: "Info", description: "Software / firmware version mismatch",
    possibleCauses: ["Control board and driver board firmware mismatch", "Incompatible firmware version for hardware revision", "Firmware update incomplete", "Wrong firmware flashed"],
    quickChecks: ["Check firmware versions on both boards", "Verify firmware compatibility matrix", "Re-flash firmware on both boards", "Check hardware revision numbers"],
    procedure: "1. Read firmware version from control board (U0-30) and driver board (U0-31). 2. Compare with NICE3000new firmware compatibility matrix. 3. Re-flash correct firmware version to both boards. 4. If mismatch persists, replace board with matching firmware.",
    relatedParams: ["FP-00", "U0-30", "U0-31"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.48" },
  { code: "Err49", subcodes: ["Err49", "Err49-01", "Err49-02"], level: "Major", description: "Elevator running direction reversal detected",
    possibleCauses: ["Motor phase sequence U/V/W swapped", "Encoder direction reversed", "F0-04 (rotation direction) set incorrectly", "Motor brake dragging in wrong direction"],
    quickChecks: ["Check motor phase sequence U/V/W order", "Swap any two motor phases and retest", "Check F0-04 rotation direction setting", "Verify encoder direction matches rotation"],
    procedure: "1. Verify motor phase sequence — U, V, W should be in order. 2. If running in wrong direction, swap any two motor phases. 3. Check F0-04 (rotation direction) — 0=forward, 1=reverse. 4. Verify encoder direction — if encoder and motor direction mismatch, swap A/B or set F1-14. 5. Check F5-00 brake timing.",
    relatedParams: ["F0-04", "F1-14", "F5-00"], relatedDiagrams: ["wiring-main", "encoder-wiring"], source: "NICE3000new Troubleshooting Manual §5.49" },
  { code: "Err50", subcodes: ["Err50", "Err50-01", "Err50-02"], level: "Major", description: "Brake wear / excessive brake lining wear detected",
    possibleCauses: ["Brake pads worn below minimum thickness", "Brake lining wear switch actuated", "Brake not fully releasing", "Brake air gap too large"],
    quickChecks: ["Check brake pad thickness (min 3mm)", "Check brake wear switch wiring", "Adjust brake air gap (0.1-0.3mm)", "Verify brake fully releases at power-on"],
    procedure: "1. Remove brake cover and measure pad thickness — replace if <3mm. 2. Check brake wear switch (should be NC) — test continuity. 3. Adjust brake air gap per manufacturer spec (0.1-0.3mm). 4. Verify brake releases fully when drive is enabled. 5. Replace brake pads as set.",
    relatedParams: ["F5-00", "F5-01", "F5-02", "F5-03"], relatedDiagrams: ["brake-circuit"], source: "NICE3000new Troubleshooting Manual §5.50" },
  { code: "Err51", subcodes: ["Err51", "Err51-01", "Err51-02"], level: "Major", description: "PG card encoder signal frequency error",
    possibleCauses: ["Encoder frequency out of range", "PG card frequency filter setting wrong", "Electrical noise on encoder signal", "Encoder running at excessive speed"],
    quickChecks: ["Check encoder frequency on keypad", "Verify F1-13 encoder PPR setting", "Check encoder cable shield grounding", "Verify maximum speed not exceeded"],
    procedure: "1. Read encoder frequency at keypad (U0-04). 2. Check F1-13 (encoder pulses per revolution) matches encoder. 3. Ensure encoder cable shield grounded at drive end only. 4. Check maximum speed (F0-06) not exceeded. 5. Adjust PG card filter setting (F1-14) if noise is suspected.",
    relatedParams: ["F1-13", "F1-14", "F0-06"], relatedDiagrams: ["encoder-wiring"], source: "NICE3000new Troubleshooting Manual §5.51" },
  { code: "Err52", subcodes: ["Err52", "Err52-01", "Err52-02"], level: "Major", description: "Current detection / CT sensor fault",
    possibleCauses: ["Current transformer (CT) sensor fault", "CT sensor wiring disconnected", "CT sensor saturation", "Driver board current detection circuit fault"],
    quickChecks: ["Check CT sensor connector seating", "Verify CT sensor wiring", "Read motor current (U0-02) with no load", "Check for DC offset in current reading"],
    procedure: "1. Ensure CT sensor connector is fully seated on driver board. 2. Verify CT sensor wiring is not damaged. 3. Read U0-02 (motor current) with motor stopped — should be near 0A. 4. If >5A with motor stopped, CT sensor or driver board is faulty. 5. Replace driver board if CT sensor fault confirmed.",
    relatedParams: ["F0-03", "F1-03"], relatedDiagrams: ["wiring-main"], source: "NICE3000new Troubleshooting Manual §5.52" },
  { code: "Err53", subcodes: ["Err53", "Err53-01", "Err53-02"], level: "Major", description: "Weighing sensor / load cell zero offset fault",
    possibleCauses: ["Load cell zero offset exceeded limit", "Load cell mechanical preload changed", "Load cell amplifier drift", "Car permanently loaded/unloaded incorrectly"],
    quickChecks: ["Check car is empty", "Read load cell raw value (U0-15)", "Perform zero calibration", "Check load cell mounting bracket"],
    procedure: "1. Ensure car is empty and at mid-floor. 2. Read U0-15 (load cell raw value). 3. Perform zero calibration (F3-00=1). 4. Check load cell mounting bracket for deformation. 5. Replace load cell if zero offset cannot be calibrated.",
    relatedParams: ["F3-00", "F3-01", "F3-02", "F3-03"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.53" },
  { code: "Err54", subcodes: ["Err54", "Err54-01", "Err54-02"], level: "Major", description: "Fan / cooling system fault",
    possibleCauses: ["Heatsink cooling fan not running", "Fan blocked by debris", "Fan bearing worn / seized", "Fan power supply missing"],
    quickChecks: ["Check if fan spins at power-on", "Clean fan blades and grille", "Listen for fan bearing noise", "Measure fan supply voltage"],
    procedure: "1. Verify fan spins freely at power-on. 2. Clean fan blades and intake grille with compressed air. 3. Listen for grinding or rattling from fan bearings. 4. Measure fan supply voltage (24VDC or 230VAC). 5. Replace fan if seized or noisy.",
    relatedParams: ["F9-10", "F9-11"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.54" },
  { code: "Err55", subcodes: ["Err55", "Err55-01", "Err55-02"], level: "Major", description: "Controller clock / RTC battery fault",
    possibleCauses: ["RTC battery low or dead", "RTC crystal oscillator failing", "RTC chip fault", "Date/time not set after power loss"],
    quickChecks: ["Check RTC battery voltage", "Verify date/time in controller", "Set date/time and power cycle", "Replace RTC battery (CR2032)"],
    procedure: "1. Measure RTC battery (CR2032) — should be >2.8V. 2. Check date/time display on keypad. 3. Set correct date/time and power cycle. 4. Replace RTC battery if <2.5V. 5. Replace control board if RTC still fails after battery replacement.",
    relatedParams: ["FB-10", "FB-11"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.55" },
  { code: "Err56", subcodes: ["Err56", "Err56-01", "Err56-02"], level: "Major", description: "Emergency phone / alarm circuit fault",
    possibleCauses: ["Emergency phone line disconnected", "Emergency phone power supply fault", "Alarm bell circuit open", "Phone line short circuit"],
    quickChecks: ["Check emergency phone handset connection", "Verify phone line voltage (-48VDC)", "Test alarm bell circuit", "Check phone line polarity"],
    procedure: "1. Check emergency phone handset cord connection. 2. Measure phone line voltage (-48VDC typical). 3. Test alarm bell by pressing emergency button. 4. Check phone line polarity (tip/ring). 5. Verify phone line is active through building PBX.",
    relatedParams: ["FA-15", "FA-16"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.56" },
  { code: "Err57", subcodes: ["Err57", "Err57-01", "Err57-02"], level: "Major", description: "Car lighting / emergency light fault",
    possibleCauses: ["Emergency light battery low", "Car lighting ballast/LED driver fault", "Emergency light inverter fault", "Car lighting circuit breaker tripped"],
    quickChecks: ["Check car lighting circuit breaker", "Test emergency light by disconnecting mains", "Measure emergency light battery voltage", "Check LED driver output"],
    procedure: "1. Check car lighting circuit breaker (usually in car top panel). 2. Test emergency light operation by disconnecting mains power. 3. Measure emergency light battery voltage (should be >10.8V for 12V system). 4. Check LED driver output voltage. 5. Replace emergency light battery if >2 years old.",
    relatedParams: ["FA-10", "FA-11", "FA-12", "FA-13"], relatedDiagrams: ["power-supply"], source: "NICE3000new Troubleshooting Manual §5.57" },
  { code: "Err58", subcodes: ["Err58", "Err58-01", "Err58-02"], level: "Major", description: "Door motor / door operator overheat",
    possibleCauses: ["Door motor thermal protection tripped", "Door motor duty cycle exceeded", "Door motor fan not running", "Door motor blocked or jammed"],
    quickChecks: ["Check door motor temperature", "Reduce door open/close cycles", "Verify door motor fan operation", "Check for mechanical binding in door"],
    procedure: "1. Check door motor temperature — allow to cool. 2. Reduce door open/close cycle frequency. 3. Verify door motor cooling fan is running. 4. Check for mechanical binding in door panels. 5. Adjust door speed parameters (F6 group).",
    relatedParams: ["F6-01", "F6-02", "F6-05", "F6-06"], relatedDiagrams: ["door-control"], source: "NICE3000new Troubleshooting Manual §5.58" },
  { code: "Err59", subcodes: ["Err59", "Err59-01", "Err59-02"], level: "Major", description: "Overspeed governor / governor switch fault",
    possibleCauses: ["Governor overspeed switch tripped", "Governor rope tensioner fault", "Governor switch wiring broken", "Governor pulley bearing seized"],
    quickChecks: ["Check governor reset status", "Inspect governor rope tension", "Check governor switch wiring continuity", "Rotate governor pulley by hand"],
    procedure: "1. Check governor overspeed switch — should be reset. 2. Inspect governor rope tension (50-100N typical). 3. Check governor switch wiring for continuity. 4. Rotate governor pulley — should spin freely. 5. Verify governor rope is in pulley groove.",
    relatedParams: ["F8-00", "F8-01", "F9-03"], relatedDiagrams: ["safety-circuit"], source: "NICE3000new Troubleshooting Manual §5.59" },
  { code: "Err60", subcodes: ["Err60", "Err60-01", "Err60-02"], level: "Major", description: "Earth / ground fault detected",
    possibleCauses: ["Motor winding short to ground", "Cable insulation breakdown", "Moisture in motor junction box", "Drive output short to ground"],
    quickChecks: ["Megger motor U/V/W to ground", "Check motor junction box for moisture", "Inspect cable insulation", "Disconnect motor and test drive alone"],
    procedure: "1. Megger test each motor phase to ground (>1M Ohm minimum). 2. Open motor junction box and check for moisture. 3. Inspect motor cable for cuts or abrasion. 4. Disconnect motor and run drive alone — if fault clears, motor/cable is faulted. 5. Dry out motor or replace if insulation is compromised.",
    relatedParams: ["F0-03", "F1-00", "F1-01", "F1-02"], relatedDiagrams: ["wiring-main"], source: "NICE3000new Troubleshooting Manual §5.60" },
  { code: "Err61", subcodes: ["Err61", "Err61-01", "Err61-02"], level: "Major", description: "Signal / relay board communication error",
    possibleCauses: ["Signal relay board ribbon cable loose", "Signal board power supply missing", "Signal board microcontroller fault", "Signal board firmware mismatch"],
    quickChecks: ["Check signal board ribbon cable seating", "Verify +5V on signal board", "Check signal board LED status", "Reseat signal board"],
    procedure: "1. Reseat ribbon cable between signal board and control board. 2. Measure +5V on signal board test point. 3. Check signal board LED status (should be blinking). 4. Reseat signal board in its slot. 5. Replace signal board if no communication.",
    relatedParams: ["FP-00", "FP-01"], relatedDiagrams: ["wiring-main"], source: "NICE3000new Troubleshooting Manual §5.61" },
  { code: "Err62", subcodes: ["Err62", "Err62-01", "Err62-02"], level: "Major", description: "Car top / inspection box communication fault",
    possibleCauses: ["Inspection box CAN bus fault", "Inspection box power supply missing", "Car top junction box connection loose", "Inspector switch wiring fault"],
    quickChecks: ["Check inspection box power LED", "Verify CAN wiring to car top", "Check inspection box connector", "Test inspector switch position"],
    procedure: "1. Check inspection box power LED. 2. Verify CAN H/L wiring to car top junction box. 3. Check car top junction box connector. 4. Cycle inspector switch (normal/inspection). 5. Replace inspection box if no communication.",
    relatedParams: ["FC-00", "FC-01", "FC-02"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.62" },
  { code: "Err63", subcodes: ["Err63", "Err63-01", "Err63-02"], level: "Major", description: "Input / output expansion board fault",
    possibleCauses: ["IO expansion board ribbon cable loose", "IO expansion board address conflict", "IO expansion board power supply fault", "IO expansion board damaged"],
    quickChecks: ["Check IO expansion board LED", "Verify IO expansion board seating", "Check DIP switch address uniqueness", "Measure +24V on IO board"],
    procedure: "1. Check IO expansion board LED status. 2. Reseat IO expansion board in its slot. 3. Verify DIP switch addresses are unique if multiple IO boards. 4. Measure +24V power on IO board. 5. Replace IO expansion board if fault persists.",
    relatedParams: ["FC-00", "FC-01", "FC-02", "FC-03"], relatedDiagrams: ["wiring-main"], source: "NICE3000new Troubleshooting Manual §5.63" },
  { code: "Err64", subcodes: ["Err64", "Err64-01", "Err64-02"], level: "Major", description: "Drive module / power stage hardware fault",
    possibleCauses: ["Power stage IGBT failure", "DC bus capacitor bank failure", "Gate driver board fault", "Power supply to driver stage missing"],
    quickChecks: ["Check power stage LED status", "Measure DC bus voltage", "Check gate driver board LEDs", "Listen for unusual sounds from drive"],
    procedure: "1. Check power stage LED on driver board. 2. Measure DC bus voltage (should be stable). 3. Check gate driver board LED status. 4. Listen for buzzing or arcing sounds from drive. 5. Replace driver board if power stage fault is confirmed.",
    relatedParams: ["FA-00", "FA-01", "FA-02"], relatedDiagrams: ["wiring-main", "power-supply"], source: "NICE3000new Troubleshooting Manual §5.64" },
  { code: "Err65", subcodes: ["Err65", "Err65-01", "Err65-02"], level: "Major", description: "Elevator group control / dispatching communication fault",
    possibleCauses: ["Group controller CAN bus disconnected", "Group controller power fault", "Group controller address conflict", "Group controller firmware mismatch"],
    quickChecks: ["Check group controller power LED", "Verify CAN bus between controllers", "Check group controller DIP switches", "Verify group controller firmware version"],
    procedure: "1. Check group controller power LED. 2. Verify CAN H/L wiring between all controllers in group. 3. Check group controller DIP switches for unique addresses. 4. Verify firmware versions match across group. 5. Replace group controller if no communication.",
    relatedParams: ["FC-00", "FC-01", "FC-02", "FC-03", "FC-10"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.65" },
  { code: "Err66", subcodes: ["Err66", "Err66-01", "Err66-02"], level: "Major", description: "Remote monitoring / IoT communication fault",
    possibleCauses: ["Remote monitoring module power fault", "Ethernet/GPRS connection lost", "Remote monitoring module configuration error", "SIM card issue (if GPRS)"],
    quickChecks: ["Check remote monitoring module LED", "Verify network cable connection", "Check SIM card seating (if GPRS)", "Verify server IP/port configuration"],
    procedure: "1. Check remote monitoring module power LED. 2. Verify Ethernet cable connection (link/act LEDs). 3. Check SIM card is properly seated and has credit. 4. Verify server IP address and port in configuration. 5. Reboot remote monitoring module.",
    relatedParams: ["FC-10", "FC-11", "FC-12", "FC-13"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.66" },
  { code: "Err67", subcodes: ["Err67", "Err67-01", "Err67-02"], level: "Major", description: "Pit / machinery space safety device fault",
    possibleCauses: ["Pit stop switch activated", "Pit ladder switch activated", "Machine room door switch open", "Pit flooding sensor active"],
    quickChecks: ["Check pit stop switch position", "Verify pit ladder stowed position", "Check machine room door switch", "Inspect pit for water"],
    procedure: "1. Check pit stop switch — should be in run position. 2. Verify pit ladder is fully stowed. 3. Check machine room door switch is closed. 4. Inspect pit for water or debris. 5. Reset affected safety devices.",
    relatedParams: ["F5-10", "F5-11", "F5-12", "F5-13"], relatedDiagrams: ["safety-circuit"], source: "NICE3000new Troubleshooting Manual §5.67" },
  { code: "Err68", subcodes: ["Err68", "Err68-01", "Err68-02"], level: "Major", description: "Emergency evacuation / battery lowering fault",
    possibleCauses: ["Battery lowering system battery low", "Battery lowering inverter fault", "Emergency evacuation test failed", "Battery lowering contactor fault"],
    quickChecks: ["Check battery lowering system battery voltage", "Test emergency evacuation manually", "Check battery lowering contactor operation", "Verify inverter output"],
    procedure: "1. Measure battery lowering system battery voltage (should be >24V for 48V system). 2. Test emergency evacuation by simulating mains failure. 3. Check battery lowering contactor operation. 4. Verify inverter output voltage/frequency. 5. Replace battery if low or contactor if welded.",
    relatedParams: ["FA-10", "FA-11", "FA-12", "FA-13"], relatedDiagrams: ["power-supply"], source: "NICE3000new Troubleshooting Manual §5.68" },
  { code: "Err69", subcodes: ["Err69", "Err69-01", "Err69-02"], level: "Major", description: "Car door lock / clutch fault",
    possibleCauses: ["Car door lock clutch not engaging", "Car door lock solenoid fault", "Car door lock switch misaligned", "Car door lock mechanism jammed"],
    quickChecks: ["Check car door lock solenoid operation", "Verify car door lock switch adjustment", "Lubricate door lock mechanism", "Check clutch engagement"],
    procedure: "1. Check car door lock solenoid voltage (24VDC during lock command). 2. Verify car door lock switch actuation. 3. Lubricate door lock mechanism with silicone spray. 4. Check clutch engagement gap. 5. Replace door lock solenoid if no movement.",
    relatedParams: ["F6-10", "F6-11", "F6-12"], relatedDiagrams: ["door-control"], source: "NICE3000new Troubleshooting Manual §5.69" },
  { code: "Err70", subcodes: ["Err70", "Err70-01", "Err70-02"], level: "Major", description: "Light curtain / door obstruction sensor fault",
    possibleCauses: ["Light curtain beam blocked or misaligned", "Light curtain power supply fault", "Light curtain synchronization lost", "Light curtain damaged"],
    quickChecks: ["Clean light curtain lenses", "Check light curtain alignment", "Verify light curtain power LED", "Test obstruction detection"],
    procedure: "1. Clean light curtain transmitter and receiver lenses. 2. Check alignment — both lenses must face each other squarely. 3. Verify light curtain power LED (green). 4. Test obstruction detection — should stop door reopening. 5. Replace light curtain if alignment is correct but still faulted.",
    relatedParams: ["F6-07", "F6-08", "F6-09"], relatedDiagrams: ["door-control"], source: "NICE3000new Troubleshooting Manual §5.70" },
  { code: "Err71", subcodes: ["Err71", "Err71-01", "Err71-02"], level: "Major", description: "Seismic / earthquake sensor fault",
    possibleCauses: ["Seismic sensor tripped", "Seismic sensor wiring fault", "Seismic sensor power supply fault", "Earthquake event detected — auto-return to home floor"],
    quickChecks: ["Check seismic sensor LED", "Reset seismic sensor", "Verify seismic sensor wiring", "Check if earthquake event occurred"],
    procedure: "1. Check seismic sensor LED status. 2. Reset seismic sensor per manufacturer instructions. 3. Verify seismic sensor wiring continuity. 4. Check if elevator performed auto-return to home floor. 5. Contact building management to confirm earthquake event.",
    relatedParams: ["F8-10", "F8-11", "F8-12"], relatedDiagrams: ["safety-circuit"], source: "NICE3000new Troubleshooting Manual §5.71" },
  { code: "Err72", subcodes: ["Err72", "Err72-01", "Err72-02"], level: "Major", description: "Car overload / load weighing warning",
    possibleCauses: ["Car load exceeds rated capacity", "Load weighing sensor calibration drift", "False overload due to sensor fault", "Capacity setting changed"],
    quickChecks: ["Read car load (U0-16)", "Check rated capacity (F3-04)", "Remove excess load from car", "Perform load weighing calibration"],
    procedure: "1. Read U0-16 (car load percentage). 2. Verify F3-04 (rated capacity) matches car nameplate. 3. Remove excess load from car. 4. Perform load weighing zero and span calibration. 5. Check load cell mounting for damage.",
    relatedParams: ["F3-00", "F3-01", "F3-02", "F3-03", "F3-04"], relatedDiagrams: [], source: "NICE3000new Troubleshooting Manual §5.72" },
  { code: "Err73", subcodes: ["Err73", "Err73-01", "Err73-02"], level: "Major", description: "Car door operator belt / chain tension fault",
    possibleCauses: ["Door belt tension too loose", "Door belt broken or damaged", "Door chain tension incorrect", "Door operator pulley worn"],
    quickChecks: ["Check door belt tension (10-15mm deflection)", "Inspect door belt for teeth damage", "Check door chain tension", "Inspect pulleys for wear"],
    procedure: "1. Check door belt tension — 10-15mm deflection at mid-span. 2. Inspect belt teeth for wear or missing teeth. 3. Check door chain tension (10-20mm slack). 4. Inspect idler pulleys for flat spots. 5. Replace belt or chain if damaged.",
    relatedParams: ["F6-01", "F6-02", "F6-05", "F6-06"], relatedDiagrams: ["door-control"], source: "NICE3000new Troubleshooting Manual §5.73" },
  { code: "Err74", subcodes: ["Err74", "Err74-01", "Err74-02"], level: "Major", description: "Safety gear / rope gripper test required",
    possibleCauses: ["Scheduled safety gear test overdue", "Safety gear limit switch tripped", "Rope gripper actuated", "Rope gripper test required"],
    quickChecks: ["Check safety gear test schedule", "Check safety gear limit switch", "Inspect rope gripper for actuation", "Verify safety gear reset"],
    procedure: "1. Check safety gear test schedule — required annually. 2. Inspect safety gear for engagement. 3. Check rope gripper (if equipped) for actuation. 4. Perform safety gear test per code requirements. 5. Reset safety gear and rope gripper after test. 6. Document test results.",
    relatedParams: ["F8-00", "F8-01", "F8-02", "F8-03"], relatedDiagrams: ["safety-circuit"], source: "NICE3000new Troubleshooting Manual §5.74" },
];

// ─── Parameters ───
export const PARAMETER_GROUPS: { key: string; label: string; params: Parameter[] }[] = [
  {
    key: "F0", label: "Basic Parameters",
    params: [
      { group: "F0", groupLabel: "Basic", code: "F0-00", name: "Control Mode", defaultValue: "0", range: "0-3", unit: "-", description: "0=SVC, 1=Vector, 2=V/F, 3=Torque", relatedFaults: ["Err02", "Err05", "Err06"] },
      { group: "F0", groupLabel: "Basic", code: "F0-01", name: "Rated Motor Power", defaultValue: "5.5", range: "0.4-999", unit: "kW", description: "Set to motor nameplate kW", relatedFaults: ["Err02", "Err11"] },
      { group: "F0", groupLabel: "Basic", code: "F0-02", name: "Rated Motor Voltage", defaultValue: "380", range: "220-480", unit: "V", description: "Set to motor nameplate voltage", relatedFaults: ["Err02", "Err60"] },
      { group: "F0", groupLabel: "Basic", code: "F0-03", name: "Rated Motor Current", defaultValue: "12.0", range: "0.1-999", unit: "A", description: "Set to motor nameplate FLA", relatedFaults: ["Err05", "Err08", "Err17", "Err52", "Err60"] },
      { group: "F0", groupLabel: "Basic", code: "F0-04", name: "Rotation Direction", defaultValue: "0", range: "0-1", unit: "-", description: "0=Forward, 1=Reverse", relatedFaults: ["Err49"] },
      { group: "F0", groupLabel: "Basic", code: "F0-06", name: "Contract Speed", defaultValue: "1.75", range: "0.1-10.0", unit: "m/s", description: "Maximum elevator contract speed", relatedFaults: ["Err41", "Err51"] },
      { group: "F0", groupLabel: "Basic", code: "F0-10", name: "Maximum Frequency", defaultValue: "50", range: "0-400", unit: "Hz", description: "Maximum output frequency", relatedFaults: ["Err11"] },
      { group: "F0", groupLabel: "Basic", code: "F0-11", name: "Motor Rated Frequency", defaultValue: "50", range: "0-400", unit: "Hz", description: "Motor nameplate frequency", relatedFaults: ["Err11", "Err14"] },
      { group: "F0", groupLabel: "Basic", code: "F0-17", name: "Acceleration Time", defaultValue: "3.0", range: "0.1-60", unit: "s", description: "Time from 0 to max speed", relatedFaults: ["Err03", "Err10", "Err41"] },
      { group: "F0", groupLabel: "Basic", code: "F0-18", name: "Deceleration Time", defaultValue: "3.0", range: "0.1-60", unit: "s", description: "Time from max speed to 0", relatedFaults: ["Err04", "Err10", "Err13", "Err41", "Err47"] },
    ]
  },
  {
    key: "F1", label: "Motor Parameters",
    params: [
      { group: "F1", groupLabel: "Motor", code: "F1-00", name: "Motor Type", defaultValue: "0", range: "0-1", unit: "-", description: "0=Asynchronous, 1=PM Synchronous", relatedFaults: ["Err03", "Err17", "Err60", "Err46"] },
      { group: "F1", groupLabel: "Motor", code: "F1-01", name: "Motor Rated Speed", defaultValue: "1450", range: "0-6000", unit: "rpm", description: "Motor nameplate speed", relatedFaults: ["Err03", "Err10", "Err17", "Err60"] },
      { group: "F1", groupLabel: "Motor", code: "F1-02", name: "Motor Rated Power Factor", defaultValue: "0.85", range: "0.1-1.0", unit: "-", description: "Motor nameplate PF", relatedFaults: ["Err03", "Err17", "Err60"] },
      { group: "F1", groupLabel: "Motor", code: "F1-03", name: "Motor Rated Current", defaultValue: "12.0", range: "0.1-999", unit: "A", description: "Motor nameplate FLA", relatedFaults: ["Err03", "Err11", "Err14", "Err52"] },
      { group: "F1", groupLabel: "Motor", code: "F1-04", name: "Motor Stator Resistance", defaultValue: "0.5", range: "0.001-10", unit: "Ohm", description: "Auto-tuned or measured stator resistance", relatedFaults: ["Err03", "Err46"] },
      { group: "F1", groupLabel: "Motor", code: "F1-11", name: "Auto-tuning Selection", defaultValue: "0", range: "0-2", unit: "-", description: "0=No tune, 1=Static, 2=Rotating", relatedFaults: ["Err46"] },
      { group: "F1", groupLabel: "Motor", code: "F1-12", name: "Encoder Type", defaultValue: "1", range: "0-3", unit: "-", description: "0=None, 1=ABZ, 2=UVW, 3=Resolver", relatedFaults: ["Err08", "Err09", "Err15", "Err46"] },
      { group: "F1", groupLabel: "Motor", code: "F1-13", name: "Encoder Pulses Per Revolution", defaultValue: "1024", range: "1-65535", unit: "PPR", description: "Encoder resolution", relatedFaults: ["Err08", "Err09", "Err10", "Err41", "Err51"] },
      { group: "F1", groupLabel: "Motor", code: "F1-14", name: "PG Card Type", defaultValue: "0", range: "0-3", unit: "-", description: "PG card selection", relatedFaults: ["Err08", "Err09", "Err15", "Err49", "Err51"] },
    ]
  },
  {
    key: "F2", label: "Floor & Leveling Parameters",
    params: [
      { group: "F2", groupLabel: "Floor & Leveling", code: "F2-00", name: "Leveling Sensor Type", defaultValue: "0", range: "0-1", unit: "-", description: "0=Inductive, 1=Optical", relatedFaults: ["Err22", "Err24", "Err39", "Err42", "Err45"] },
      { group: "F2", groupLabel: "Floor & Leveling", code: "F2-01", name: "Door Zone Sensor Type", defaultValue: "0", range: "0-1", unit: "-", description: "0=Single, 1=Dual", relatedFaults: ["Err22", "Err24", "Err39", "Err42"] },
      { group: "F2", groupLabel: "Floor & Leveling", code: "F2-02", name: "Leveling Zone Offset", defaultValue: "0", range: "-50-50", unit: "mm", description: "Offset adjustment for leveling", relatedFaults: ["Err22", "Err24", "Err25", "Err39", "Err42"] },
      { group: "F2", groupLabel: "Floor & Leveling", code: "F2-03", name: "Re-leveling Enable", defaultValue: "1", range: "0-1", unit: "-", description: "0=Disable, 1=Enable", relatedFaults: ["Err22", "Err24", "Err39"] },
      { group: "F2", groupLabel: "Floor & Leveling", code: "F2-10", name: "Terminal Slowdown Switch Type", defaultValue: "0", range: "0-1", unit: "-", description: "0=Inductive, 1=Mechanical", relatedFaults: ["Err40"] },
      { group: "F2", groupLabel: "Floor & Leveling", code: "F2-11", name: "Hoistway Learning Command", defaultValue: "0", range: "0-2", unit: "-", description: "0=Idle, 1=Start, 2=Complete", relatedFaults: ["Err25", "Err27", "Err41", "Err45"] },
    ]
  },
  {
    key: "F3", label: "Load Weighing Parameters",
    params: [
      { group: "F3", groupLabel: "Load Weighing", code: "F3-00", name: "Load Cell Zero Calibration", defaultValue: "0", range: "0-1", unit: "-", description: "1=Start zero calibration", relatedFaults: ["Err33", "Err53", "Err72"] },
      { group: "F3", groupLabel: "Load Weighing", code: "F3-01", name: "Load Cell Span Calibration", defaultValue: "0", range: "0-1", unit: "-", description: "1=Start span calibration", relatedFaults: ["Err33", "Err53", "Err72"] },
      { group: "F3", groupLabel: "Load Weighing", code: "F3-02", name: "Load Cell Type", defaultValue: "0", range: "0-2", unit: "-", description: "0=Analog, 1=Digital, 2=Pressure", relatedFaults: ["Err33", "Err53"] },
      { group: "F3", groupLabel: "Load Weighing", code: "F3-03", name: "Load Cell Filter Time", defaultValue: "0.5", range: "0.1-5", unit: "s", description: "Filter for load cell signal", relatedFaults: ["Err33", "Err53", "Err72"] },
      { group: "F3", groupLabel: "Load Weighing", code: "F3-04", name: "Rated Capacity", defaultValue: "1000", range: "100-5000", unit: "kg", description: "Car rated load capacity", relatedFaults: ["Err72"] },
    ]
  },
  {
    key: "F4", label: "Floor Height Data",
    params: [
      { group: "F4", groupLabel: "Floor Height", code: "F4-00", name: "Total Number of Floors", defaultValue: "6", range: "2-64", unit: "-", description: "Number of floors served", relatedFaults: ["Err25", "Err27", "Err41", "Err45"] },
      { group: "F4", groupLabel: "Floor Height", code: "F4-01", name: "Floor 1 Height", defaultValue: "0", range: "0-99999", unit: "mm", description: "Height from terminal to floor 1", relatedFaults: ["Err25", "Err27", "Err41", "Err45"] },
      { group: "F4", groupLabel: "Floor Height", code: "F4-02", name: "Floor 2 Height", defaultValue: "3300", range: "0-99999", unit: "mm", description: "Height from terminal to floor 2", relatedFaults: ["Err25", "Err27", "Err41", "Err45"] },
    ]
  },
  {
    key: "F5", label: "Brake & Safety Parameters",
    params: [
      { group: "F5", groupLabel: "Brake & Safety", code: "F5-00", name: "Brake Release Delay", defaultValue: "0.3", range: "0-5", unit: "s", description: "Delay before brake release", relatedFaults: ["Err03", "Err13", "Err16", "Err24", "Err49", "Err50"] },
      { group: "F5", groupLabel: "Brake & Safety", code: "F5-01", name: "Brake Engage Delay", defaultValue: "0.3", range: "0-5", unit: "s", description: "Delay before brake engage", relatedFaults: ["Err04", "Err13", "Err16", "Err24", "Err50"] },
      { group: "F5", groupLabel: "Brake & Safety", code: "F5-02", name: "Brake Release Current", defaultValue: "30", range: "0-100", unit: "%", description: "Current at brake release", relatedFaults: ["Err13", "Err16", "Err47", "Err50"] },
      { group: "F5", groupLabel: "Brake & Safety", code: "F5-03", name: "Brake Torque Confirmation", defaultValue: "0", range: "0-1", unit: "-", description: "0=Disable, 1=Enable", relatedFaults: ["Err16", "Err50"] },
      { group: "F5", groupLabel: "Brake & Safety", code: "F5-10", name: "Safety Chain Monitoring", defaultValue: "1", range: "0-1", unit: "-", description: "0=Disable, 1=Enable", relatedFaults: ["Err07", "Err37", "Err38", "Err67"] },
      { group: "F5", groupLabel: "Brake & Safety", code: "F5-11", name: "Door Lock Monitoring", defaultValue: "1", range: "0-1", unit: "-", description: "0=Disable, 1=Enable", relatedFaults: ["Err07", "Err37", "Err38"] },
      { group: "F5", groupLabel: "Brake & Safety", code: "F5-12", name: "STO Monitoring Time", defaultValue: "0.5", range: "0.1-5", unit: "s", description: "STO signal monitoring window", relatedFaults: ["Err07", "Err37"] },
      { group: "F5", groupLabel: "Brake & Safety", code: "F5-13", name: "Safety Chain Delay", defaultValue: "0.2", range: "0-2", unit: "s", description: "Safety chain filter time", relatedFaults: ["Err37", "Err38", "Err67"] },
    ]
  },
  {
    key: "F6", label: "Door Control Parameters",
    params: [
      { group: "F6", groupLabel: "Door Control", code: "F6-00", name: "Re-leveling Speed", defaultValue: "0.05", range: "0.01-0.5", unit: "m/s", description: "Speed during re-leveling", relatedFaults: ["Err24"] },
      { group: "F6", groupLabel: "Door Control", code: "F6-01", name: "Door Open Speed", defaultValue: "0.3", range: "0.1-1", unit: "m/s", description: "Door opening speed", relatedFaults: ["Err28", "Err58", "Err73"] },
      { group: "F6", groupLabel: "Door Control", code: "F6-02", name: "Door Open Slow Speed", defaultValue: "0.1", range: "0.05-0.5", unit: "m/s", description: "Door opening slow speed", relatedFaults: ["Err28", "Err58", "Err73"] },
      { group: "F6", groupLabel: "Door Control", code: "F6-03", name: "Door Open Hold Time", defaultValue: "3", range: "0-60", unit: "s", description: "Time door stays open", relatedFaults: ["Err28"] },
      { group: "F6", groupLabel: "Door Control", code: "F6-04", name: "Door Open Acceleration", defaultValue: "0.5", range: "0.1-5", unit: "s", description: "Door opening acceleration", relatedFaults: ["Err28", "Err58"] },
      { group: "F6", groupLabel: "Door Control", code: "F6-05", name: "Door Close Speed", defaultValue: "0.3", range: "0.1-1", unit: "m/s", description: "Door closing speed", relatedFaults: ["Err29", "Err58", "Err73"] },
      { group: "F6", groupLabel: "Door Control", code: "F6-06", name: "Door Close Slow Speed", defaultValue: "0.1", range: "0.05-0.5", unit: "m/s", description: "Door closing slow speed", relatedFaults: ["Err29", "Err58", "Err73"] },
      { group: "F6", groupLabel: "Door Control", code: "F6-07", name: "Door Obstruction Detection", defaultValue: "1", range: "0-1", unit: "-", description: "0=Disable, 1=Enable", relatedFaults: ["Err29", "Err70"] },
      { group: "F6", groupLabel: "Door Control", code: "F6-08", name: "Door Reversal Force", defaultValue: "50", range: "10-100", unit: "%", description: "Force to reverse door", relatedFaults: ["Err29", "Err70"] },
      { group: "F6", groupLabel: "Door Control", code: "F6-09", name: "Door Nudging Time", defaultValue: "30", range: "0-120", unit: "s", description: "Time before nudging", relatedFaults: ["Err70"] },
      { group: "F6", groupLabel: "Door Control", code: "F6-10", name: "Car Door Lock Type", defaultValue: "0", range: "0-1", unit: "-", description: "0=Manual, 1=Automatic", relatedFaults: ["Err69"] },
      { group: "F6", groupLabel: "Door Control", code: "F6-11", name: "Car Door Lock Delay", defaultValue: "0.5", range: "0-5", unit: "s", description: "Lock delay after close", relatedFaults: ["Err69"] },
      { group: "F6", groupLabel: "Door Control", code: "F6-12", name: "Door Lock Feedback Monitoring", defaultValue: "1", range: "0-1", unit: "-", description: "0=Disable, 1=Enable", relatedFaults: ["Err69"] },
    ]
  },
  {
    key: "F7", label: "Special Function Parameters",
    params: [
      { group: "F7", groupLabel: "Special Functions", code: "F7-00", name: "Re-leveling Mode", defaultValue: "1", range: "0-2", unit: "-", description: "0=Off, 1=Auto, 2=Manual", relatedFaults: ["Err24"] },
      { group: "F7", groupLabel: "Special Functions", code: "F7-01", name: "Pre-open Door Enable", defaultValue: "0", range: "0-1", unit: "-", description: "0=Disable, 1=Enable", relatedFaults: [] },
      { group: "F7", groupLabel: "Special Functions", code: "F7-02", name: "Fire Service Mode", defaultValue: "0", range: "0-2", unit: "-", description: "0=Off, 1=FIRE, 2=Phase 2", relatedFaults: [] },
    ]
  },
  {
    key: "F8", label: "Emergency & Safety Device Parameters",
    params: [
      { group: "F8", groupLabel: "Emergency & Safety", code: "F8-00", name: "Emergency Run Speed", defaultValue: "0.3", range: "0.1-1", unit: "m/s", description: "Speed during emergency operation", relatedFaults: ["Err26", "Err59", "Err74"] },
      { group: "F8", groupLabel: "Emergency & Safety", code: "F8-01", name: "Emergency Run Direction", defaultValue: "0", range: "0-1", unit: "-", description: "0=Down, 1=Up", relatedFaults: ["Err26", "Err59"] },
      { group: "F8", groupLabel: "Emergency & Safety", code: "F8-02", name: "Safety Gear Test Mode", defaultValue: "0", range: "0-1", unit: "-", description: "0=Normal, 1=Test", relatedFaults: ["Err74"] },
      { group: "F8", groupLabel: "Emergency & Safety", code: "F8-03", name: "Rope Gripper Test", defaultValue: "0", range: "0-1", unit: "-", description: "0=Normal, 1=Test", relatedFaults: ["Err74"] },
      { group: "F8", groupLabel: "Emergency & Safety", code: "F8-10", name: "Seismic Sensor Enable", defaultValue: "0", range: "0-1", unit: "-", description: "0=Disable, 1=Enable", relatedFaults: ["Err71"] },
      { group: "F8", groupLabel: "Emergency & Safety", code: "F8-11", name: "Seismic Auto-return Floor", defaultValue: "1", range: "1-64", unit: "-", description: "Auto-return floor after earthquake", relatedFaults: ["Err71"] },
      { group: "F8", groupLabel: "Emergency & Safety", code: "F8-12", name: "Seismic Sensor Test", defaultValue: "0", range: "0-1", unit: "-", description: "1=Test seismic sensor", relatedFaults: ["Err71"] },
    ]
  },
  {
    key: "F9", label: "Protection & Monitoring Parameters",
    params: [
      { group: "F9", groupLabel: "Protection & Monitoring", code: "F9-00", name: "Overload Protection Level", defaultValue: "120", range: "50-200", unit: "%", description: "Motor overload current threshold", relatedFaults: ["Err11"] },
      { group: "F9", groupLabel: "Protection & Monitoring", code: "F9-01", name: "Overload Protection Time", defaultValue: "60", range: "1-600", unit: "s", description: "Overload withstand time", relatedFaults: ["Err11"] },
      { group: "F9", groupLabel: "Protection & Monitoring", code: "F9-03", name: "Overspeed Threshold", defaultValue: "120", range: "100-150", unit: "%", description: "Overspeed detection level", relatedFaults: ["Err10", "Err26", "Err59"] },
      { group: "F9", groupLabel: "Protection & Monitoring", code: "F9-04", name: "Motor PTC Protection", defaultValue: "1", range: "0-1", unit: "-", description: "0=Disable, 1=Enable", relatedFaults: ["Err14"] },
      { group: "F9", groupLabel: "Protection & Monitoring", code: "F9-10", name: "Heatsink Fan Control", defaultValue: "0", range: "0-1", unit: "-", description: "0=Auto, 1=Always On", relatedFaults: ["Err12", "Err54"] },
      { group: "F9", groupLabel: "Protection & Monitoring", code: "F9-11", name: "Heatsink Over-temp Threshold", defaultValue: "85", range: "50-100", unit: "°C", description: "Heatsink temperature alarm", relatedFaults: ["Err12", "Err54"] },
    ]
  },
  {
    key: "FA", label: "Power Supply & Auxiliary Parameters",
    params: [
      { group: "FA", groupLabel: "Power Supply", code: "FA-00", name: "Input Voltage Rating", defaultValue: "380", range: "220-480", unit: "V", description: "Nominal input voltage", relatedFaults: ["Err35", "Err36", "Err43", "Err64"] },
      { group: "FA", groupLabel: "Power Supply", code: "FA-01", name: "Input Phase Type", defaultValue: "0", range: "0-1", unit: "-", description: "0=3-Phase, 1=1-Phase", relatedFaults: ["Err35", "Err36", "Err43", "Err64"] },
      { group: "FA", groupLabel: "Power Supply", code: "FA-02", name: "Pre-charge Enable", defaultValue: "1", range: "0-1", unit: "-", description: "0=Disable, 1=Enable", relatedFaults: ["Err43"] },
      { group: "FA", groupLabel: "Power Supply", code: "FA-05", name: "Overvoltage Threshold", defaultValue: "410", range: "350-480", unit: "V", description: "DC bus overvoltage trip level", relatedFaults: ["Err05", "Err06"] },
      { group: "FA", groupLabel: "Power Supply", code: "FA-06", name: "Undervoltage Threshold", defaultValue: "250", range: "200-350", unit: "V", description: "DC bus undervoltage trip level", relatedFaults: ["Err06", "Err18"] },
      { group: "FA", groupLabel: "Power Supply", code: "FA-10", name: "Battery Backup Enable", defaultValue: "0", range: "0-1", unit: "-", description: "0=Disable, 1=Enable", relatedFaults: ["Err32", "Err57", "Err68"] },
      { group: "FA", groupLabel: "Power Supply", code: "FA-11", name: "Battery Voltage Nominal", defaultValue: "48", range: "12-110", unit: "V", description: "Battery system voltage", relatedFaults: ["Err32", "Err57", "Err68"] },
      { group: "FA", groupLabel: "Power Supply", code: "FA-12", name: "Battery Low Voltage Alarm", defaultValue: "42", range: "10-100", unit: "V", description: "Battery low voltage alarm", relatedFaults: ["Err32", "Err57", "Err68"] },
      { group: "FA", groupLabel: "Power Supply", code: "FA-13", name: "Emergency Light Test", defaultValue: "0", range: "0-1", unit: "-", description: "1=Test emergency light", relatedFaults: ["Err57"] },
      { group: "FA", groupLabel: "Power Supply", code: "FA-15", name: "Emergency Phone Enable", defaultValue: "0", range: "0-1", unit: "-", description: "0=Disable, 1=Enable", relatedFaults: ["Err56"] },
      { group: "FA", groupLabel: "Power Supply", code: "FA-16", name: "Emergency Phone Test", defaultValue: "0", range: "0-1", unit: "-", description: "1=Test phone line", relatedFaults: ["Err56"] },
    ]
  },
  {
    key: "FB", label: "Maintenance & Service Parameters",
    params: [
      { group: "FB", groupLabel: "Maintenance", code: "FB-00", name: "Maintenance Interval", defaultValue: "90", range: "1-365", unit: "days", description: "Days between maintenance", relatedFaults: ["Err44"] },
      { group: "FB", groupLabel: "Maintenance", code: "FB-01", name: "Maintenance Counter Reset", defaultValue: "0", range: "0-1", unit: "-", description: "1=Reset maintenance counter", relatedFaults: ["Err44"] },
      { group: "FB", groupLabel: "Maintenance", code: "FB-02", name: "Maintenance Reminder Enable", defaultValue: "1", range: "0-1", unit: "-", description: "0=Disable, 1=Enable", relatedFaults: ["Err44"] },
      { group: "FB", groupLabel: "Maintenance", code: "FB-10", name: "RTC Date/Time Set", defaultValue: "0", range: "0-1", unit: "-", description: "1=Set RTC date/time", relatedFaults: ["Err55"] },
      { group: "FB", groupLabel: "Maintenance", code: "FB-11", name: "RTC Battery Status", defaultValue: "0", range: "0-1", unit: "-", description: "0=OK, 1=Low", relatedFaults: ["Err55"] },
    ]
  },
  {
    key: "FC", label: "Communication Parameters",
    params: [
      { group: "FC", groupLabel: "Communication", code: "FC-00", name: "CAN Bus Baud Rate", defaultValue: "0", range: "0-2", unit: "-", description: "0=125k, 1=250k, 2=500k", relatedFaults: ["Err20", "Err23", "Err30", "Err31", "Err34", "Err62", "Err63", "Err65"] },
      { group: "FC", groupLabel: "Communication", code: "FC-01", name: "CAN Node ID", defaultValue: "1", range: "1-127", unit: "-", description: "Unique node address on CAN bus", relatedFaults: ["Err20", "Err30", "Err31", "Err62", "Err63", "Err65"] },
      { group: "FC", groupLabel: "Communication", code: "FC-02", name: "CAN Termination", defaultValue: "0", range: "0-1", unit: "-", description: "0=Off, 1=ON (120 Ohm)", relatedFaults: ["Err20", "Err23", "Err30", "Err31", "Err34", "Err62", "Err63", "Err65"] },
      { group: "FC", groupLabel: "Communication", code: "FC-03", name: "CAN Node Count", defaultValue: "2", range: "1-32", unit: "-", description: "Number of nodes on CAN bus", relatedFaults: ["Err20", "Err23", "Err31", "Err63", "Err65"] },
      { group: "FC", groupLabel: "Communication", code: "FC-10", name: "Group Control Enable", defaultValue: "0", range: "0-1", unit: "-", description: "0=Single, 1=Group", relatedFaults: ["Err65", "Err66"] },
      { group: "FC", groupLabel: "Communication", code: "FC-11", name: "Remote Monitor IP", defaultValue: "0", range: "0-255", unit: "-", description: "Remote monitoring server IP", relatedFaults: ["Err66"] },
      { group: "FC", groupLabel: "Communication", code: "FC-12", name: "Remote Monitor Port", defaultValue: "502", range: "1-65535", unit: "-", description: "Remote monitoring server port", relatedFaults: ["Err66"] },
      { group: "FC", groupLabel: "Communication", code: "FC-13", name: "Remote Monitor Protocol", defaultValue: "0", range: "0-1", unit: "-", description: "0=Modbus, 1=MQTT", relatedFaults: ["Err66"] },
    ]
  },
  {
    key: "FP", label: "Factory & System Parameters",
    params: [
      { group: "FP", groupLabel: "Factory & System", code: "FP-00", name: "Password", defaultValue: "0", range: "0-65535", unit: "-", description: "Parameter access password", relatedFaults: ["Err19", "Err21", "Err48", "Err61"] },
      { group: "FP", groupLabel: "Factory & System", code: "FP-01", name: "Factory Reset", defaultValue: "0", range: "0-1", unit: "-", description: "1=Restore factory defaults", relatedFaults: ["Err19", "Err21"] },
    ]
  },
];

// ─── Diagrams ───
export const DIAGRAMS: Diagram[] = [
  {
    id: "wiring-main",
    title: "Main Power & Motor Wiring",
    subtitle: "R/S/T input, P/N bus, U/V/W motor output, brake resistor",
    svgContent: `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="500" fill="#f8fafc"/><rect x="50" y="20" width="700" height="460" rx="8" fill="none" stroke="#154734" stroke-width="2"/><text x="400" y="50" text-anchor="middle" font-size="16" font-weight="bold" fill="#154734">NICE3000new Main Power Wiring Diagram</text><text x="400" y="70" text-anchor="middle" font-size="11" fill="#64748b">Refer to manual §3.2 for torque specifications</text><!-- Input --><rect x="80" y="100" width="120" height="60" rx="4" fill="#154734" opacity="0.9"/><text x="140" y="125" text-anchor="middle" font-size="10" fill="white">Input Supply</text><text x="140" y="140" text-anchor="middle" font-size="9" fill="#e0b800">R/S/T 380VAC 3Ph</text><!-- Drive --><rect x="330" y="90" width="140" height="80" rx="6" fill="#154734"/><text x="400" y="120" text-anchor="middle" font-size="12" fill="white">NICE3000new</text><text x="400" y="138" text-anchor="middle" font-size="10" fill="#e0b800">Drive</text><text x="400" y="155" text-anchor="middle" font-size="9" fill="#94a3b8">P N U V W</text><!-- Motor --><rect x="600" y="100" width="120" height="60" rx="4" fill="#154734" opacity="0.9"/><text x="660" y="125" text-anchor="middle" font-size="10" fill="white">Motor</text><text x="660" y="140" text-anchor="middle" font-size="9" fill="#e0b800">U/V/W</text><!-- Brake Resistor --><rect x="330" y="220" width="140" height="50" rx="4" fill="#0f766e" opacity="0.8"/><text x="400" y="245" text-anchor="middle" font-size="10" fill="white">Brake Resistor</text><text x="400" y="258" text-anchor="middle" font-size="9" fill="#e0b800">P-BRK</text><!-- Lines --><line x1="200" y1="130" x2="330" y2="130" stroke="#64748b" stroke-width="2"/><line x1="470" y1="130" x2="600" y2="130" stroke="#64748b" stroke-width="2"/><line x1="400" y1="170" x2="400" y2="220" stroke="#64748b" stroke-width="2"/><text x="270" y="120" font-size="10" fill="#e0b800">R/S/T</text><text x="530" y="120" font-size="10" fill="#e0b800">U/V/W</text><text x="410" y="200" font-size="10" fill="#e0b800">P-BRK</text><!-- DC Bus --><text x="400" y="310" text-anchor="middle" font-size="11" fill="#64748b">DC Bus: P(+) N(-) — Measure 310-380VDC</text><text x="400" y="330" text-anchor="middle" font-size="11" fill="#64748b">Brake Resistor: 10-100 Ohm depending on size</text><text x="400" y="350" text-anchor="middle" font-size="11" fill="#64748b">Motor insulation: >1M Ohm phase-to-ground</text><!-- Legend --><rect x="80" y="380" width="640" height="80" rx="4" fill="#f1f5f9"/><text x="100" y="400" font-size="10" font-weight="bold" fill="#154734">Legend:</text><text x="100" y="418" font-size="9" fill="#64748b">R/S/T = Input Mains 380VAC 3-Phase</text><text x="100" y="434" font-size="9" fill="#64748b">P/N = DC Bus Positive / Negative</text><text x="100" y="450" font-size="9" fill="#64748b">U/V/W = Motor Output Phases</text></svg>`,
    relatedFaults: ["Err02", "Err03", "Err04", "Err05", "Err06", "Err08", "Err11", "Err12", "Err13", "Err14", "Err17", "Err18", "Err21", "Err46", "Err49", "Err52", "Err60", "Err61", "Err63", "Err64"],
    source: "NICE3000new User Manual §3.2"
  },
  {
    id: "safety-circuit",
    title: "Safety Circuit & STO Cluster",
    subtitle: "Safety chain, E-stop, door locks, safety relay, STO inputs",
    svgContent: `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="500" fill="#f8fafc"/><rect x="50" y="20" width="700" height="460" rx="8" fill="none" stroke="#154734" stroke-width="2"/><text x="400" y="50" text-anchor="middle" font-size="16" font-weight="bold" fill="#154734">Safety Circuit &amp; STO Cluster Diagram</text><text x="400" y="70" text-anchor="middle" font-size="11" fill="#64748b">All safety switches are NC (normally closed) in run state</text><!-- E-Stop --><rect x="80" y="100" width="100" height="40" rx="4" fill="#dc2626" opacity="0.9"/><text x="130" y="125" text-anchor="middle" font-size="10" fill="white">E-Stop PB</text><!-- Door Lock --><rect x="220" y="100" width="100" height="40" rx="4" fill="#dc2626" opacity="0.9"/><text x="270" y="125" text-anchor="middle" font-size="10" fill="white">Door Lock</text><!-- Safety Relay --><rect x="360" y="100" width="120" height="40" rx="4" fill="#154734"/><text x="420" y="125" text-anchor="middle" font-size="10" fill="white">KAS Relay</text><!-- STO1 --><rect x="520" y="90" width="100" height="50" rx="4" fill="#0f766e"/><text x="570" y="110" text-anchor="middle" font-size="10" fill="white">STO CH1</text><text x="570" y="128" text-anchor="middle" font-size="9" fill="#e0b800">24VDC</text><!-- STO2 --><rect x="650" y="90" width="100" height="50" rx="4" fill="#0f766e"/><text x="700" y="110" text-anchor="middle" font-size="10" fill="white">STO CH2</text><text x="700" y="128" text-anchor="middle" font-size="9" fill="#e0b800">24VDC</text><!-- Lines --><line x1="180" y1="120" x2="220" y2="120" stroke="#64748b" stroke-width="2"/><line x1="320" y1="120" x2="360" y2="120" stroke="#64748b" stroke-width="2"/><line x1="480" y1="120" x2="520" y2="120" stroke="#64748b" stroke-width="2"/><line x1="570" y1="140" x2="570" y2="200" stroke="#64748b" stroke-width="2"/><line x1="570" y1="200" x2="700" y2="200" stroke="#64748b" stroke-width="2"/><line x1="700" y1="140" x2="700" y2="200" stroke="#64748b" stroke-width="2"/><text x="200" y="110" font-size="10" fill="#e0b800">NC</text><text x="340" y="110" font-size="10" fill="#e0b800">NC</text><text x="500" y="110" font-size="10" fill="#e0b800">24V</text><!-- Pit Switch --><rect x="80" y="200" width="100" height="40" rx="4" fill="#dc2626" opacity="0.9"/><text x="130" y="225" text-anchor="middle" font-size="10" fill="white">Pit Switch</text><!-- Limit Switch --><rect x="220" y="200" width="100" height="40" rx="4" fill="#dc2626" opacity="0.9"/><text x="270" y="225" text-anchor="middle" font-size="10" fill="white">TFL/BFL</text><line x1="130" y1="140" x2="130" y2="200" stroke="#64748b" stroke-width="2"/><line x1="270" y1="140" x2="270" y2="200" stroke="#64748b" stroke-width="2"/><text x="400" y="310" text-anchor="middle" font-size="11" fill="#64748b">STO1 and STO2 must BOTH be 24VDC for drive to enable</text><text x="400" y="330" text-anchor="middle" font-size="11" fill="#64748b">KAS relay picks up when all safety devices are closed</text><text x="400" y="350" text-anchor="middle" font-size="11" fill="#64748b">If STO LED is off, trace safety circuit for open contact</text></svg>`,
    relatedFaults: ["Err02", "Err07", "Err16", "Err26", "Err37", "Err38", "Err40", "Err59", "Err67", "Err71", "Err74"],
    source: "NICE3000new Troubleshooting Manual §3.3"
  },
  {
    id: "sto-cluster",
    title: "STO (Safe Torque Off) Cluster Detail",
    subtitle: "STO1/STO2 input wiring, LED indicators, and fault isolation",
    svgContent: `<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="400" fill="#f8fafc"/><rect x="50" y="20" width="700" height="360" rx="8" fill="none" stroke="#154734" stroke-width="2"/><text x="400" y="50" text-anchor="middle" font-size="16" font-weight="bold" fill="#154734">STO Cluster Detail</text><text x="400" y="70" text-anchor="middle" font-size="11" fill="#64748b">Both channels must be high for safe operation</text><!-- STO1 Circuit --><rect x="80" y="100" width="200" height="80" rx="6" fill="#0f766e" opacity="0.8"/><text x="180" y="125" text-anchor="middle" font-size="12" fill="white">STO Channel 1</text><text x="180" y="145" text-anchor="middle" font-size="10" fill="#e0b800">Terminal: STO1-COM</text><text x="180" y="162" text-anchor="middle" font-size="9" fill="#94a3b8">24VDC required</text><!-- STO2 Circuit --><rect x="400" y="100" width="200" height="80" rx="6" fill="#0f766e" opacity="0.8"/><text x="500" y="125" text-anchor="middle" font-size="12" fill="white">STO Channel 2</text><text x="500" y="145" text-anchor="middle" font-size="10" fill="#e0b800">Terminal: STO2-COM</text><text x="500" y="162" text-anchor="middle" font-size="9" fill="#94a3b8">24VDC required</text><!-- LED Indicators --><circle cx="180" cy="240" r="12" fill="#22c55e"/><text x="180" y="244" text-anchor="middle" font-size="8" fill="white">OK</text><circle cx="500" cy="240" r="12" fill="#22c55e"/><text x="500" y="244" text-anchor="middle" font-size="8" fill="white">OK</text><text x="180" y="270" text-anchor="middle" font-size="10" fill="#64748b">STO1 LED (Green = OK)</text><text x="500" y="270" text-anchor="middle" font-size="10" fill="#64748b">STO2 LED (Green = OK)</text><text x="400" y="330" text-anchor="middle" font-size="11" fill="#64748b">Troubleshoot: If LED is off, measure 24VDC at terminal</text><text x="400" y="350" text-anchor="middle" font-size="11" fill="#64748b">If voltage present but LED off, replace STO optocoupler board</text></svg>`,
    relatedFaults: ["Err07", "Err37"],
    source: "NICE3000new Troubleshooting Manual §3.4"
  },
  {
    id: "door-control",
    title: "Door Control Circuit",
    subtitle: "Door operator, door lock, light curtain, door zone sensors",
    svgContent: `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="500" fill="#f8fafc"/><rect x="50" y="20" width="700" height="460" rx="8" fill="none" stroke="#154734" stroke-width="2"/><text x="400" y="50" text-anchor="middle" font-size="16" font-weight="bold" fill="#154734">Door Control Circuit Diagram</text><text x="400" y="70" text-anchor="middle" font-size="11" fill="#64748b">Door operator, door lock, light curtain, and door zone sensors</text><!-- Door Controller --><rect x="80" y="100" width="140" height="50" rx="4" fill="#154734"/><text x="150" y="125" text-anchor="middle" font-size="10" fill="white">Door Controller</text><text x="150" y="140" text-anchor="middle" font-size="9" fill="#e0b800">DC24V</text><!-- Door Motor --><rect x="300" y="100" width="140" height="50" rx="4" fill="#0f766e" opacity="0.8"/><text x="370" y="125" text-anchor="middle" font-size="10" fill="white">Door Motor</text><text x="370" y="140" text-anchor="middle" font-size="9" fill="#e0b800">24VDC</text><!-- Door Lock --><rect x="520" y="100" width="140" height="50" rx="4" fill="#dc2626" opacity="0.8"/><text x="590" y="125" text-anchor="middle" font-size="10" fill="white">Door Lock</text><text x="590" y="140" text-anchor="middle" font-size="9" fill="#e0b800">NC Contact</text><line x1="220" y1="125" x2="300" y2="125" stroke="#64748b" stroke-width="2"/><line x1="440" y1="125" x2="520" y2="125" stroke="#64748b" stroke-width="2"/><text x="260" y="115" font-size="10" fill="#e0b800">DOL/DCL</text><!-- Light Curtain --><rect x="80" y="200" width="140" height="50" rx="4" fill="#0f766e" opacity="0.8"/><text x="150" y="225" text-anchor="middle" font-size="10" fill="white">Light Curtain</text><!-- Door Zone Sensor --><rect x="300" y="200" width="140" height="50" rx="4" fill="#0f766e" opacity="0.8"/><text x="370" y="225" text-anchor="middle" font-size="10" fill="white">DZ Sensor</text><!-- Re-leveling Sensor --><rect x="520" y="200" width="140" height="50" rx="4" fill="#0f766e" opacity="0.8"/><text x="590" y="225" text-anchor="middle" font-size="10" fill="white">Re-level Sensor</text><line x1="220" y1="225" x2="300" y2="225" stroke="#64748b" stroke-width="2"/><line x1="440" y1="225" x2="520" y2="225" stroke="#64748b" stroke-width="2"/><text x="400" y="310" text-anchor="middle" font-size="11" fill="#64748b">Door lock must be NC (closed) when door is fully closed</text><text x="400" y="330" text-anchor="middle" font-size="11" fill="#64748b">Light curtain N/C to N/O transition = obstruction detected</text><text x="400" y="350" text-anchor="middle" font-size="11" fill="#64748b">DZ sensor gap: 3-5mm from vane — adjust bracket if needed</text></svg>`,
    relatedFaults: ["Err22", "Err23", "Err24", "Err25", "Err27", "Err28", "Err29", "Err38", "Err39", "Err42", "Err45", "Err58", "Err69", "Err70", "Err73"],
    source: "NICE3000new Troubleshooting Manual §3.5"
  },
  {
    id: "encoder-wiring",
    title: "Encoder & PG Card Wiring",
    subtitle: "A/B/Z signals, shield grounding, PG card connections",
    svgContent: `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="450" fill="#f8fafc"/><rect x="50" y="20" width="700" height="410" rx="8" fill="none" stroke="#154734" stroke-width="2"/><text x="400" y="50" text-anchor="middle" font-size="16" font-weight="bold" fill="#154734">Encoder &amp; PG Card Wiring Diagram</text><text x="400" y="70" text-anchor="middle" font-size="11" fill="#64748b">Encoder cable must be shielded — ground at drive end only</text><!-- Encoder --><rect x="80" y="100" width="140" height="80" rx="4" fill="#0f766e" opacity="0.8"/><text x="150" y="125" text-anchor="middle" font-size="10" fill="white">Encoder</text><text x="150" y="142" text-anchor="middle" font-size="9" fill="#e0b800">A A- B B- Z Z-</text><text x="150" y="162" text-anchor="middle" font-size="9" fill="#e0b800">+5V GND</text><!-- PG Card --><rect x="330" y="90" width="140" height="100" rx="6" fill="#154734"/><text x="400" y="115" text-anchor="middle" font-size="12" fill="white">PG Card</text><text x="400" y="135" text-anchor="middle" font-size="10" fill="#e0b800">PG-D/O</text><text x="400" y="155" text-anchor="middle" font-size="9" fill="#94a3b8">A B Z +5V</text><text x="400" y="172" text-anchor="middle" font-size="9" fill="#94a3b8">LED Status</text><!-- Control Board --><rect x="580" y="90" width="140" height="100" rx="6" fill="#154734"/><text x="650" y="115" text-anchor="middle" font-size="12" fill="white">Control Board</text><text x="650" y="135" text-anchor="middle" font-size="10" fill="#e0b800">Encoder Input</text><text x="650" y="155" text-anchor="middle" font-size="9" fill="#94a3b8">U0-04</text><line x1="220" y1="140" x2="330" y2="140" stroke="#64748b" stroke-width="2"/><line x1="470" y1="140" x2="580" y2="140" stroke="#64748b" stroke-width="2"/><text x="280" y="130" font-size="10" fill="#e0b800">A/B/Z</text><text x="520" y="130" font-size="10" fill="#e0b800">Pulse</text><!-- Shield Ground --><path d="M 150 180 L 150 240" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4"/><text x="160" y="235" font-size="10" fill="#64748b">Shield ground</text><text x="400" y="310" text-anchor="middle" font-size="11" fill="#64748b">A and A\\ are differential pair — if one is missing, no position</text><text x="400" y="330" text-anchor="middle" font-size="11" fill="#64748b">Swap A and B wires to reverse encoder direction</text><text x="400" y="350" text-anchor="middle" font-size="11" fill="#64748b">Encoder supply: 5VDC ±5% at PG card output</text></svg>`,
    relatedFaults: ["Err08", "Err09", "Err10", "Err15", "Err24", "Err36", "Err41", "Err46", "Err49", "Err51"],
    source: "NICE3000new Troubleshooting Manual §3.6"
  },
  {
    id: "power-supply",
    title: "Power Supply & Auxiliary Circuits",
    subtitle: "24VDC, 5VDC, battery backup, emergency lighting",
    svgContent: `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="450" fill="#f8fafc"/><rect x="50" y="20" width="700" height="410" rx="8" fill="none" stroke="#154734" stroke-width="2"/><text x="400" y="50" text-anchor="middle" font-size="16" font-weight="bold" fill="#154734">Power Supply &amp; Auxiliary Circuits</text><text x="400" y="70" text-anchor="middle" font-size="11" fill="#64748b">Power supply distribution and backup systems</text><!-- Main PSU --><rect x="80" y="100" width="140" height="60" rx="4" fill="#154734" opacity="0.9"/><text x="150" y="125" text-anchor="middle" font-size="10" fill="white">Main PSU</text><text x="150" y="142" text-anchor="middle" font-size="9" fill="#e0b800">220V → 24V/5V</text><!-- 24V Bus --><rect x="300" y="100" width="120" height="60" rx="4" fill="#0f766e" opacity="0.8"/><text x="360" y="125" text-anchor="middle" font-size="10" fill="white">24V Bus</text><text x="360" y="142" text-anchor="middle" font-size="9" fill="#e0b800">Sensors/Relays</text><!-- 5V Bus --><rect x="500" y="100" width="120" height="60" rx="4" fill="#0f766e" opacity="0.8"/><text x="560" y="125" text-anchor="middle" font-size="10" fill="white">5V Bus</text><text x="560" y="142" text-anchor="middle" font-size="9" fill="#e0b800">Encoder/Control</text><!-- Battery Backup --><rect x="80" y="220" width="140" height="60" rx="4" fill="#0f766e" opacity="0.8"/><text x="150" y="245" text-anchor="middle" font-size="10" fill="white">Battery Backup</text><text x="150" y="262" text-anchor="middle" font-size="9" fill="#e0b800">24/48VDC</text><!-- Emergency Light --><rect x="300" y="220" width="140" height="60" rx="4" fill="#0f766e" opacity="0.8"/><text x="370" y="245" text-anchor="middle" font-size="10" fill="white">Emergency Light</text><text x="370" y="262" text-anchor="middle" font-size="9" fill="#e0b800">Inverter</text><line x1="220" y1="130" x2="300" y2="130" stroke="#64748b" stroke-width="2"/><line x1="420" y1="130" x2="500" y2="130" stroke="#64748b" stroke-width="2"/><line x1="150" y1="160" x2="150" y2="220" stroke="#64748b" stroke-width="2"/><line x1="360" y1="160" x2="360" y2="220" stroke="#64748b" stroke-width="2"/><text x="400" y="340" text-anchor="middle" font-size="11" fill="#64748b">24V must be 22-26VDC — check fuse if below 22V</text><text x="400" y="360" text-anchor="middle" font-size="11" fill="#64748b">5V must be 4.75-5.25VDC — encoder disconnection test</text><text x="400" y="380" text-anchor="middle" font-size="11" fill="#64748b">Battery: Replace if <80% nominal voltage under load</text></svg>`,
    relatedFaults: ["Err05", "Err06", "Err18", "Err32", "Err35", "Err36", "Err43", "Err57", "Err64", "Err68"],
    source: "NICE3000new Troubleshooting Manual §3.7"
  },
  {
    id: "brake-circuit",
    title: "Brake Circuit & Control",
    subtitle: "Brake power supply, brake resistor, contactor, coil",
    svgContent: `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="450" fill="#f8fafc"/><rect x="50" y="20" width="700" height="410" rx="8" fill="none" stroke="#154734" stroke-width="2"/><text x="400" y="50" text-anchor="middle" font-size="16" font-weight="bold" fill="#154734">Brake Circuit Diagram</text><text x="400" y="70" text-anchor="middle" font-size="11" fill="#64748b">Brake contactor, coil, rectifier, resistor, and feedback</text><!-- Brake Contactor --><rect x="80" y="100" width="140" height="50" rx="4" fill="#154734"/><text x="150" y="125" text-anchor="middle" font-size="10" fill="white">Brake Contactor</text><text x="150" y="140" text-anchor="middle" font-size="9" fill="#e0b800">KMB</text><!-- Brake Coil --><rect x="300" y="100" width="140" height="50" rx="4" fill="#0f766e" opacity="0.8"/><text x="370" y="125" text-anchor="middle" font-size="10" fill="white">Brake Coil</text><text x="370" y="140" text-anchor="middle" font-size="9" fill="#e0b800">110VDC</text><!-- Brake Rectifier --><rect x="520" y="100" width="140" height="50" rx="4" fill="#0f766e" opacity="0.8"/><text x="590" y="125" text-anchor="middle" font-size="10" fill="white">Brake Rectifier</text><text x="590" y="140" text-anchor="middle" font-size="9" fill="#e0b800">AC→DC</text><!-- Brake Resistor --><rect x="80" y="200" width="140" height="50" rx="4" fill="#dc2626" opacity="0.8"/><text x="150" y="225" text-anchor="middle" font-size="10" fill="white">Brake Resistor</text><text x="150" y="240" text-anchor="middle" font-size="9" fill="#e0b800">P-BRK</text><line x1="220" y1="125" x2="300" y2="125" stroke="#64748b" stroke-width="2"/><line x1="440" y1="125" x2="520" y2="125" stroke="#64748b" stroke-width="2"/><line x1="150" y1="150" x2="150" y2="200" stroke="#64748b" stroke-width="2"/><text x="260" y="115" font-size="10" fill="#e0b800">NC Aux</text><text x="400" y="310" text-anchor="middle" font-size="11" fill="#64748b">Brake coil: 110VDC — measure voltage at brake release</text><text x="400" y="330" text-anchor="middle" font-size="11" fill="#64748b">Brake resistor: 10-100 Ohm, >100W rated</text><text x="400" y="350" text-anchor="middle" font-size="11" fill="#64748b">Brake wear: pad thickness must be >3mm</text></svg>`,
    relatedFaults: ["Err03", "Err04", "Err10", "Err13", "Err16", "Err47", "Err50"],
    source: "NICE3000new Troubleshooting Manual §3.8"
  },
];

// ─── Guide Symptoms ───
export const GUIDE_SYMPTOMS: GuideSymptom[] = [
  { id: "gs-wont-start", category: "Power & Start-up", title: "Elevator won't start / no movement",
    description: "Car is stationary, no response to calls, no movement in any mode.",
    checklist: ["Check main power disconnect is ON", "Verify main contactor is closed (measure R/S/T)", "Check control board LED (should be green, blinking)", "Verify safety chain is closed — check STO1/STO2 LEDs", "Check door lock circuit at all landings", "Verify KAS (safety relay) is picked up", "Check E-stop buttons are released (all of them)", "Check pit switch and machine room switch", "Verify encoder is connected and PG card LED is green", "Check for active fault codes on keypad"],
    procedure: "Follow the checklist above in order. If STO LEDs are off, trace the safety circuit (see Safety Circuit & STO Cluster diagram). If KAS relay is not picked up, check the full safety chain. If encoder PG card LED is red, check encoder wiring and +5V supply. If faults are displayed, reference the specific fault code in this app.",
    relatedFaults: ["Err07", "Err08", "Err16", "Err37", "Err38", "Err40", "Err59", "Err67"]
  },
  { id: "gs-erratic-move", category: "Motion", title: "Erratic movement / jerky ride",
    description: "Car moves but with jerky acceleration, vibration, or rough ride quality.",
    checklist: ["Check acceleration/deceleration times (F0-17, F0-18)", "Verify motor parameters (F1 group) match nameplate", "Check encoder for loose coupling or electrical noise", "Perform motor auto-tuning (F1-11)", "Check brake release timing (F5-00)", "Inspect guide rail lubrication", "Check rope tension (all ropes even)", "Verify load weighing calibration (F3 group)"],
    procedure: "Start by verifying F0-17 and F0-18 are not too short (<2s). Check motor nameplate data in F1 group. Perform motor auto-tuning. Check encoder coupling for looseness. Inspect guide rails for lubrication. Verify brake release timing is not too early.",
    relatedFaults: ["Err03", "Err04", "Err08", "Err09", "Err10", "Err11", "Err46", "Err49"]
  },
  { id: "gs-no-level", category: "Leveling", title: "Car doesn't level at floor / wrong level",
    description: "Car stops above or below floor level, or re-levels excessively.",
    checklist: ["Check door zone sensor alignment", "Verify leveling zone offset (F2-02)", "Check floor height data (F4 group)", "Perform hoistway learning (F2-11=1)", "Check sensor gap to vane (3-5mm)", "Inspect sensor bracket for looseness", "Check encoder pulses per rev (F1-13)", "Verify re-leveling speed (F6-00)"],
    procedure: "Align door zone sensor — 3-5mm gap to vane. Adjust F2-02 (leveling zone offset) in small increments. If issue persists, perform hoistway learning (F2-11=1). Check F4-xx floor heights for correct values. Verify encoder PPR setting (F1-13).",
    relatedFaults: ["Err22", "Err24", "Err25", "Err27", "Err39", "Err42", "Err45"]
  },
  { id: "gs-door-issue", category: "Doors", title: "Door won't open or close properly",
    description: "Car doors fail to open, close, or reverse unexpectedly.",
    checklist: ["Check door motor power supply", "Inspect door belt/chain for damage", "Clean door track and lubricate rollers", "Check door limit switch adjustment (DOL/DCL)", "Verify light curtain alignment and cleanliness", "Check door controller power LED", "Verify door parameters (F6 group)", "Check door lock solenoid operation"],
    procedure: "First check door motor power supply. Inspect door belt/chain for damage or slack. Clean door track and lubricate rollers. Check door open limit (DOL) and door close limit (DCL) switch adjustment. Clean light curtain lenses. Adjust F6-01 through F6-06 speeds as needed.",
    relatedFaults: ["Err23", "Err28", "Err29", "Err58", "Err69", "Err70", "Err73"]
  },
  { id: "gs-noise", category: "Noise & Vibration", title: "Unusual noise from machine room or hoistway",
    description: "Grinding, knocking, squealing, or humming sounds from drive, motor, or mechanical parts.",
    checklist: ["Identify noise location (drive, motor, brake, guide rails, ropes)", "Check motor bearings for wear", "Inspect brake for dragging (brake not fully releasing)", "Check guide rail lubricator", "Verify rope tension (all ropes)", "Check drive heatsink fan for noise", "Listen for inverter/IGBT switching noise", "Check mechanical couplings for looseness"],
    procedure: "First identify noise source location. For motor bearing noise, listen with screwdriver to bearing housing. Check brake for dragging — measure brake coil voltage at standstill (should be 0VDC). Check guide rail lubricator and rope tension. For drive fan noise, replace if bearings are worn.",
    relatedFaults: ["Err12", "Err14", "Err50", "Err54", "Err58", "Err73"]
  },
  { id: "gs-overheat", category: "Temperature", title: "Overheating / drive or motor hot",
    description: "Drive heatsink, motor, or brake resistor running hot to touch or tripping on temperature.",
    checklist: ["Check heatsink fan operation", "Clean heatsink fins with compressed air", "Measure ambient temperature (<40°C)", "Read U0-06 (inverter temperature)", "Check motor fan operation", "Reduce starts per hour", "Check brake resistor clearance", "Increase deceleration time (F0-18)"],
    procedure: "Verify heatsink fan is running. Clean heatsink with compressed air. Read U0-06 (inverter temperature) — alarm at 85°C, trip at 95°C. Check motor fan. Reduce starts per hour (<180 recommended). Increase F0-18 (deceleration time) to reduce brake resistor heating. Ensure 100mm clearance around brake resistor.",
    relatedFaults: ["Err12", "Err13", "Err14", "Err54", "Err58"]
  },
  { id: "gs-comm-loss", category: "Communication", title: "Communication loss / display shows dashes",
    description: "Keypad shows dashes or '---', car calls not registering, or intermittent communication errors.",
    checklist: ["Check keypad ribbon cable connection", "Verify CAN bus termination resistors", "Check CAN bus wiring for damage", "Verify expansion board seating", "Check for duplicate CAN node addresses", "Inspect traveling cable for damage", "Check car top junction box connections", "Verify FC group communication parameters"],
    procedure: "Check keypad ribbon cable first (most common). Verify CAN bus termination — 120 Ohm resistors at both ends of bus. Check for duplicate node addresses on CAN bus. Inspect traveling cable for damage. Check FC-00 (baud rate) matches all devices. Check FC-01 (node IDs) are unique.",
    relatedFaults: ["Err20", "Err21", "Err23", "Err30", "Err31", "Err34", "Err61", "Err62", "Err63", "Err65", "Err66"]
  },
  { id: "gs-power", category: "Power Supply", title: "Power supply issues / drive won't power on",
    description: "Controller has no display, no LEDs, or intermittent power cycling.",
    checklist: ["Check main disconnect breaker", "Measure input voltage at R/S/T", "Check input fuses", "Check main contactor coil voltage", "Measure 24V PSU output", "Measure 5V at control board", "Check for shorted external devices", "Inspect DC bus capacitor bank for bulging"],
    procedure: "Measure input voltage at R/S/T (220-264VAC). Check input fuses. Measure 24V PSU output (22-26VDC). Measure 5V at control board (4.75-5.25VDC). Disconnect external devices one at a time to find 24V short. Inspect DC bus capacitors for bulging or leakage.",
    relatedFaults: ["Err05", "Err06", "Err18", "Err32", "Err35", "Err36", "Err43", "Err64", "Err68"]
  },
  { id: "gs-safety", category: "Safety Devices", title: "Safety device tripped / won't reset",
    description: "Safety circuit contact opened or won't reset. Common after power outage or maintenance.",
    checklist: ["Identify which safety device is tripped on control board", "Check E-stop buttons at all locations", "Verify door lock contacts at each landing", "Check pit stop switch", "Check machine room door switch", "Inspect safety relay (KAS) for pickup", "Trace safety circuit per diagram", "Reset safety devices one at a time"],
    procedure: "1. Check safety chain monitoring LED on control board. 2. Trace safety circuit from top to bottom per diagram. 3. Verify all E-stop buttons are pulled out. 4. Check door lock contacts at each landing. 5. Check pit stop switch and machine room switch. 6. Measure KAS relay coil voltage. 7. Reset safety devices one at a time while monitoring LED. 8. If KAS still won't pick up, check for open contact in safety chain.",
    relatedFaults: ["Err07", "Err16", "Err37", "Err38", "Err40", "Err59", "Err67", "Err71", "Err74"]
  },
];