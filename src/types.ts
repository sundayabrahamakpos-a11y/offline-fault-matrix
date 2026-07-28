export interface FaultCode {
  code: string;
  subcodes: string[];
  level: "Critical" | "Major" | "Minor" | "Info";
  description: string;
  possibleCauses: string[];
  quickChecks: string[];
  procedure: string;
  relatedParams: string[];
  relatedDiagrams: string[];
  source: string;
  techNote?: string;
}

export interface Parameter {
  group: string;
  groupLabel: string;
  code: string;
  name: string;
  defaultValue: string;
  range: string;
  unit: string;
  description: string;
  relatedFaults: string[];
}

export interface Diagram {
  id: string;
  title: string;
  subtitle: string;
  svgContent: string;
  relatedFaults: string[];
  source: string;
}

export interface ServiceVisit {
  id: string;
  elevatorId: string;
  date: string;
  faultCode: string;
  description: string;
  resolved: boolean;
  notes: string;
}

export interface Elevator {
  id: string;
  site: string;
  owner: string;
  controller: string;
  serialNumber: string;
  installationDate: string;
  visits: ServiceVisit[];
}

export interface GuideSymptom {
  id: string;
  category: string;
  title: string;
  description: string;
  checklist: string[];
  procedure: string;
  relatedFaults: string[];
}

export type ViewRoute =
  | "home"
  | "faults"
  | "fault-detail"
  | "parameters"
  | "param-detail"
  | "diagrams"
  | "diagram-detail"
  | "guides"
  | "guide-detail"
  | "log"
  | "info";

export interface AppState {
  currentView: ViewRoute;
  selectedFaultCode: string | null;
  selectedParameterCode: string | null;
  selectedDiagramId: string | null;
  selectedGuideId: string | null;
  searchQuery: string;
  drawerOpen: boolean;
  technicianName: string;
}