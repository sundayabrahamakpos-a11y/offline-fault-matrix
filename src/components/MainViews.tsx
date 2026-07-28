import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlass, Bug, BookOpen, Compass, Image, Clock, User, Wrench, ArrowRight, CaretRight, CaretLeft, Check, X, Warning, CheckCircle, Info, Clipboard, Plus, Trash, Printer, Faders, FileText, Download, List, Phone, Buildings, MapPin, Stack, GearSix, NotePencil, SpeakerHigh, Microphone } from "@phosphor-icons/react";
import type { FaultCode, Parameter, Diagram, GuideSymptom, Elevator, ServiceVisit, ViewRoute, AppState } from "../types";
import { FAULT_CODES, PARAMETER_GROUPS, DIAGRAMS, GUIDE_SYMPTOMS, getElevator, getVisits, addVisit, deleteVisit, getTechName, getTechNote, setTechNote, setTechName, deleteElevator, saveElevator, getElevators } from "../data/nice3000Data";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner";
import { ConfirmModal, ElevatorPicker, PrintReportModal } from "./CustomModals";

// ─── Shared Helpers ───
const LEVEL_COLORS: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  Major: "bg-orange-100 text-orange-700 border-orange-200",
  Minor: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Info: "bg-blue-100 text-blue-700 border-blue-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// ─── Home View ───
export function HomeView({ onNavigate }: { onNavigate: (route: ViewRoute, arg?: string) => void }) {
  const shortcuts = [
    { label: "Fault Codes", icon: Bug, route: "faults" as ViewRoute, count: FAULT_CODES.length, color: "from-red-500 to-red-600" },
    { label: "Parameters", icon: Faders, route: "parameters" as ViewRoute, count: PARAMETER_GROUPS.flatMap(g => g.params).length, color: "from-blue-500 to-blue-600" },
    { label: "Diagrams", icon: Image, route: "diagrams" as ViewRoute, count: DIAGRAMS.length, color: "from-green-500 to-green-600" },
    { label: "Guides", icon: Compass, route: "guides" as ViewRoute, count: GUIDE_SYMPTOMS.length, color: "from-purple-500 to-purple-600" },
    { label: "Service Log", icon: Clipboard, route: "log" as ViewRoute, color: "from-amber-500 to-amber-600" },
    { label: "Info", icon: User, route: "info" as ViewRoute, color: "from-slate-500 to-slate-600" },
  ];

  return (
    <div className="px-4 pb-24 pt-16">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={listItem} className="space-y-1">
          <h1 className="text-2xl font-extrabold text-[#154734]">NICE3000new</h1>
          <p className="text-sm text-muted-foreground">Fault Finder &middot; Offline Field Tool</p>
        </motion.div>

        <motion.div variants={listItem} className="relative">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search fault codes, symptoms, parameters..."
            className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none ring-[#154734]/30 transition-all focus:border-[#154734] focus:ring-2"
            onFocus={() => onNavigate("faults")}
            readOnly
          />
        </motion.div>

        <motion.div variants={listItem} className="grid grid-cols-2 gap-3">
          {shortcuts.map((s) => (
            <button
              key={s.route}
              onClick={() => onNavigate(s.route)}
              className="group relative overflow-hidden rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.color}`} />
              <s.icon size={24} className="mb-2 text-[#154734]" weight="bold" />
              <div className="text-sm font-bold text-foreground">{s.label}</div>
              {s.count && <div className="text-xs text-muted-foreground">{s.count} items</div>}
            </button>
          ))}
        </motion.div>

        <motion.div variants={listItem} className="rounded-2xl border border-[#e0b800]/30 bg-[#e0b800]/5 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#154734]">
            <Warning size={18} className="text-[#e0b800]" weight="fill" />
            Quick Tip
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Pull up a fault code to see subcodes, causes, quick checks, and step-by-step procedures.
            Save tech notes to each fault for your records.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Fault Codes List View ───
export function FaultsView({ onNavigate, searchQuery }: { onNavigate: (route: ViewRoute, arg?: string) => void; searchQuery: string }) {
  const filtered = useMemo(() => {
    if (!searchQuery) return FAULT_CODES;
    const q = searchQuery.toLowerCase();
    return FAULT_CODES.filter(
      (f) =>
        f.code.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.possibleCauses.some((c) => c.toLowerCase().includes(q)) ||
        f.subcodes.some((s) => s.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const levels = ["Critical", "Major", "Minor", "Info"] as const;
  const [activeLevel, setActiveLevel] = useState<string>("all");

  const grouped = useMemo(() => {
    const list = activeLevel === "all" ? filtered : filtered.filter((f) => f.level === activeLevel);
    return list;
  }, [filtered, activeLevel]);

  return (
    <div className="px-4 pb-24 pt-16">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={listItem} className="space-y-1">
          <h1 className="text-xl font-extrabold text-[#154734]">Fault Codes</h1>
          <p className="text-xs text-muted-foreground">{FAULT_CODES.length} codes &middot; {filtered.length} filtered</p>
        </motion.div>

        <motion.div variants={listItem} className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveLevel("all")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeLevel === "all" ? "bg-[#154734] text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            All
          </button>
          {levels.map((l) => (
            <button
              key={l}
              onClick={() => setActiveLevel(l)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeLevel === l
                  ? "bg-[#154734] text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {l} ({FAULT_CODES.filter((f) => f.level === l).length})
            </button>
          ))}
        </motion.div>

        {grouped.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Bug size={48} className="mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No fault codes match</p>
            <p className="text-xs text-muted-foreground/60">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {grouped.map((fault) => (
              <motion.button
                key={fault.code}
                variants={listItem}
                onClick={() => onNavigate("fault-detail", fault.code)}
                className="w-full rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#154734]">{fault.code}</span>
                  {fault.subcodes.length > 1 && (
                    <span className="text-xs text-muted-foreground">({fault.subcodes.length} subcodes)</span>
                  )}
                  <Badge className={`ml-auto shrink-0 border px-2 py-0.5 text-[10px] font-semibold uppercase ${LEVEL_COLORS[fault.level]}`}>
                    {fault.level}
                  </Badge>
                </div>
                <p className="text-sm leading-snug text-foreground">{fault.description}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Wrench size={12} />
                  <span>{fault.quickChecks.length} quick checks</span>
                  <ArrowRight size={12} className="ml-auto text-[#e0b800]" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Fault Detail View ───
export function FaultDetailView({ code, onNavigate, onBack }: { code: string; onNavigate: (route: ViewRoute, arg?: string) => void; onBack: () => void }) {
  const fault = FAULT_CODES.find((f) => f.code === code);
  const [techNote, setTechNoteLocal] = useState(getTechNote(code));
  const [showPicker, setShowPicker] = useState(false);
  const [showNewElevator, setShowNewElevator] = useState(false);

  if (!fault) return <div className="p-8 text-center text-muted-foreground">Fault code not found</div>;

  const handleSaveNote = () => {
    setTechNote(code, techNote);
    toast.success("Tech note saved");
  };

  const handleLogVisit = (elevatorId: string) => {
    const visit: ServiceVisit = {
      id: crypto.randomUUID(),
      elevatorId,
      date: new Date().toISOString(),
      faultCode: fault.code,
      description: fault.description,
      resolved: false,
      notes: techNote,
    };
    addVisit(elevatorId, visit);
    setShowPicker(false);
    toast.success("Visit logged");
  };

  return (
    <div className="px-4 pb-24 pt-16">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={listItem} className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-xl bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/80">
            <CaretLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#154734]">{fault.code}</h1>
              <Badge className={`border px-2 py-0.5 text-[10px] font-semibold uppercase ${LEVEL_COLORS[fault.level]}`}>
                {fault.level}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{fault.source}</p>
          </div>
        </motion.div>

        <motion.div variants={listItem} className="space-y-3">
          <p className="text-sm leading-relaxed text-foreground">{fault.description}</p>

          {fault.subcodes.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Subcodes</h3>
              <div className="flex flex-wrap gap-1.5">
                {fault.subcodes.map((sc) => (
                  <span key={sc} className="rounded-full bg-muted px-2.5 py-1 font-mono text-xs text-foreground">
                    {sc}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Possible Causes</h3>
            <ul className="space-y-1">
              {fault.possibleCauses.map((cause, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e0b800]" />
                  {cause}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Checks</h3>
            <div className="space-y-1.5">
              {fault.quickChecks.map((qc, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl bg-muted p-2.5">
                  <Check size={14} className="mt-0.5 shrink-0 text-green-600" />
                  <span className="text-xs text-foreground">{qc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Procedure</h3>
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="whitespace-pre-line text-xs leading-relaxed text-foreground">{fault.procedure}</p>
            </div>
          </div>

          {fault.techNote && (
            <div className="rounded-xl border border-[#e0b800]/30 bg-[#e0b800]/5 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#154734]">
                <Info size={14} />
                Tech Note
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{fault.techNote}</p>
            </div>
          )}

          {fault.relatedParams.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Related Parameters</h3>
              <div className="flex flex-wrap gap-1.5">
                {fault.relatedParams.map((p) => (
                  <button
                    key={p}
                    onClick={() => onNavigate("param-detail", p)}
                    className="rounded-full border border-border bg-white px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:border-[#e0b800]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {fault.relatedDiagrams.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Related Diagrams</h3>
              <div className="flex flex-wrap gap-1.5">
                {fault.relatedDiagrams.map((d) => {
                  const diagram = DIAGRAMS.find((dg) => dg.id === d);
                  return (
                    <button
                      key={d}
                      onClick={() => onNavigate("diagram-detail", d)}
                      className="rounded-full border border-border bg-white px-2.5 py-1 text-xs text-foreground transition-colors hover:border-[#e0b800]"
                    >
                      {diagram?.title || d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tech Notes</h3>
            <textarea
              value={techNote}
              onChange={(e) => setTechNoteLocal(e.target.value)}
              placeholder="Add your notes about this fault..."
              className="w-full rounded-xl border border-border bg-white p-3 text-xs outline-none ring-[#154734]/30 transition-all focus:border-[#154734] focus:ring-2"
              rows={3}
            />
            <button
              onClick={handleSaveNote}
              className="mt-2 w-full rounded-xl bg-[#154734] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#154734]/90"
            >
              Save Note
            </button>
          </div>

          <button
            onClick={() => setShowPicker(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e0b800]/40 px-4 py-3 text-sm font-semibold text-[#154734] transition-colors hover:border-[#e0b800] hover:bg-[#e0b800]/5"
          >
            <Plus size={18} />
            Log this fix to elevator
          </button>
        </motion.div>
      </motion.div>

      <ElevatorPicker open={showPicker} onSelect={handleLogVisit} onCancel={() => setShowPicker(false)} onCreateNew={() => { setShowNewElevator(true); setShowPicker(false); }} />
      {showNewElevator && <NewElevatorModal onClose={() => setShowNewElevator(false)} onSaved={(id) => { setShowNewElevator(false); handleLogVisit(id); }} />}
    </div>
  );
}

// ─── Parameters View ───
export function ParametersView({ onNavigate, searchQuery }: { onNavigate: (route: ViewRoute, arg?: string) => void; searchQuery: string }) {
  const [activeGroup, setActiveGroup] = useState(PARAMETER_GROUPS[0]?.key || "");

  const allParams = useMemo(() => {
    if (!searchQuery) return PARAMETER_GROUPS.flatMap((g) => g.params);
    const q = searchQuery.toLowerCase();
    return PARAMETER_GROUPS.flatMap((g) => g.params).filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const currentGroup = PARAMETER_GROUPS.find((g) => g.key === activeGroup);
  const displayParams = searchQuery ? allParams : (currentGroup?.params || []);

  return (
    <div className="px-4 pb-24 pt-16">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={listItem} className="space-y-1">
          <h1 className="text-xl font-extrabold text-[#154734]">Parameters</h1>
          <p className="text-xs text-muted-foreground">{PARAMETER_GROUPS.flatMap(g => g.params).length} parameters in {PARAMETER_GROUPS.length} groups</p>
        </motion.div>

        {!searchQuery && (
          <motion.div variants={listItem} className="flex gap-1.5 overflow-x-auto pb-1">
            {PARAMETER_GROUPS.map((g) => (
              <button
                key={g.key}
                onClick={() => setActiveGroup(g.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeGroup === g.key ? "bg-[#154734] text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {g.label}
              </button>
            ))}
          </motion.div>
        )}

        {displayParams.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Faders size={48} className="mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No parameters match</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayParams.map((param) => (
              <motion.button
                key={param.code}
                variants={listItem}
                onClick={() => onNavigate("param-detail", param.code)}
                className="w-full rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#154734]">{param.code}</span>
                  <span className="text-xs text-muted-foreground">({param.group})</span>
                  <span className="ml-auto text-xs text-muted-foreground">{param.defaultValue}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{param.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{param.description}</p>
                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>Range: {param.range}</span>
                  <span>{param.unit}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Parameter Detail View ───
export function ParameterDetailView({ code, onBack, onNavigate }: { code: string; onBack: () => void; onNavigate: (route: ViewRoute, arg?: string) => void }) {
  let param: Parameter | undefined;
  for (const g of PARAMETER_GROUPS) {
    param = g.params.find((p) => p.code === code);
    if (param) break;
  }
  if (!param) return <div className="p-8 text-center text-muted-foreground">Parameter not found</div>;

  return (
    <div className="px-4 pb-24 pt-16">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={listItem} className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-xl bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/80">
            <CaretLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-[#154734]">{param.code}</h1>
            <p className="text-xs text-muted-foreground">{param.group} &middot; {param.groupLabel}</p>
          </div>
        </motion.div>

        <motion.div variants={listItem} className="space-y-3">
          <div className="rounded-2xl border border-border bg-white p-4">
            <h2 className="text-lg font-bold text-foreground">{param.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{param.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Default</div>
              <div className="font-mono text-sm font-bold text-[#154734]">{param.defaultValue}</div>
            </div>
            <div className="rounded-xl border border-border bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Range</div>
              <div className="font-mono text-sm font-bold text-[#154734]">{param.range}</div>
            </div>
            <div className="rounded-xl border border-border bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unit</div>
              <div className="font-mono text-sm font-bold text-[#154734]">{param.unit}</div>
            </div>
            <div className="rounded-xl border border-border bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Group</div>
              <div className="font-mono text-sm font-bold text-[#154734]">{param.group}</div>
            </div>
          </div>

          {param.relatedFaults.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Related Faults</h3>
              <div className="flex flex-wrap gap-1.5">
                {param.relatedFaults.map((f) => (
                  <button
                    key={f}
                    onClick={() => onNavigate("fault-detail", f)}
                    className="rounded-full border border-border bg-white px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:border-[#e0b800]"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Diagrams View ───
export function DiagramsView({ onNavigate, searchQuery }: { onNavigate: (route: ViewRoute, arg?: string) => void; searchQuery: string }) {
  const filtered = useMemo(() => {
    if (!searchQuery) return DIAGRAMS;
    const q = searchQuery.toLowerCase();
    return DIAGRAMS.filter((d) => d.title.toLowerCase().includes(q) || d.subtitle.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <div className="px-4 pb-24 pt-16">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={listItem} className="space-y-1">
          <h1 className="text-xl font-extrabold text-[#154734]">Diagrams</h1>
          <p className="text-xs text-muted-foreground">{DIAGRAMS.length} reference diagrams</p>
        </motion.div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Image size={48} className="mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No diagrams match</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((diagram) => (
              <motion.button
                key={diagram.id}
                variants={listItem}
                onClick={() => onNavigate("diagram-detail", diagram.id)}
                className="w-full rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-[#154734]">
                  <Image size={16} className="shrink-0" />
                  {diagram.title}
                </div>
                <p className="text-xs text-muted-foreground">{diagram.subtitle}</p>
                <div className="mt-2 text-[10px] text-muted-foreground">
                  {diagram.relatedFaults.length} related faults
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Diagram Detail View ───
export function DiagramDetailView({ id, onBack, onNavigate }: { id: string; onBack: () => void; onNavigate: (route: ViewRoute, arg?: string) => void }) {
  const diagram = DIAGRAMS.find((d) => d.id === id);
  if (!diagram) return <div className="p-8 text-center text-muted-foreground">Diagram not found</div>;

  return (
    <div className="px-4 pb-24 pt-16">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={listItem} className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-xl bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/80">
            <CaretLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-[#154734]">{diagram.title}</h1>
            <p className="text-xs text-muted-foreground">{diagram.source}</p>
          </div>
        </motion.div>

        <motion.div
          variants={listItem}
          className="overflow-hidden rounded-2xl border border-border bg-white"
          dangerouslySetInnerHTML={{ __html: diagram.svgContent }}
        />

        {diagram.relatedFaults.length > 0 && (
          <motion.div variants={listItem}>
            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Related Faults</h3>
            <div className="flex flex-wrap gap-1.5">
              {diagram.relatedFaults.map((f) => (
                <button
                  key={f}
                  onClick={() => onNavigate("fault-detail", f)}
                  className="rounded-full border border-border bg-white px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:border-[#e0b800]"
                >
                  {f}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Guides View ───
export function GuidesView({ onNavigate, searchQuery }: { onNavigate: (route: ViewRoute, arg?: string) => void; searchQuery: string }) {
  const categories = [...new Set(GUIDE_SYMPTOMS.map((g) => g.category))];
  const [activeCat, setActiveCat] = useState("all");

  const filtered = useMemo(() => {
    let list = GUIDE_SYMPTOMS;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((g) => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
    }
    if (activeCat !== "all") list = list.filter((g) => g.category === activeCat);
    return list;
  }, [searchQuery, activeCat]);

  return (
    <div className="px-4 pb-24 pt-16">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={listItem} className="space-y-1">
          <h1 className="text-xl font-extrabold text-[#154734]">Troubleshooting Guides</h1>
          <p className="text-xs text-muted-foreground">{GUIDE_SYMPTOMS.length} symptom-based guides</p>
        </motion.div>

        <motion.div variants={listItem} className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCat("all")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${activeCat === "all" ? "bg-[#154734] text-white" : "bg-muted text-muted-foreground"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${activeCat === c ? "bg-[#154734] text-white" : "bg-muted text-muted-foreground"}`}
            >
              {c}
            </button>
          ))}
        </motion.div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Compass size={48} className="mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No guides match</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((guide) => (
              <motion.button
                key={guide.id}
                variants={listItem}
                onClick={() => onNavigate("guide-detail", guide.id)}
                className="w-full rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-[#154734]">{guide.title}</span>
                  <Badge className="ml-auto shrink-0 bg-muted text-[10px] text-muted-foreground">{guide.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{guide.description}</p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{guide.checklist.length} steps</span>
                  <span>&middot;</span>
                  <span>{guide.relatedFaults.length} related faults</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Guide Detail View ───
export function GuideDetailView({ id, onBack, onNavigate }: { id: string; onBack: () => void; onNavigate: (route: ViewRoute, arg?: string) => void }) {
  const guide = GUIDE_SYMPTOMS.find((g) => g.id === id);
  if (!guide) return <div className="p-8 text-center text-muted-foreground">Guide not found</div>;

  return (
    <div className="px-4 pb-24 pt-16">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={listItem} className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-xl bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/80">
            <CaretLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-[#154734]">{guide.title}</h1>
            <Badge className="bg-muted text-[10px] text-muted-foreground">{guide.category}</Badge>
          </div>
        </motion.div>

        <motion.div variants={listItem} className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{guide.description}</p>

          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Checklist</h3>
            <div className="space-y-1.5">
              {guide.checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl bg-muted p-2.5">
                  <Check size={14} className="mt-0.5 shrink-0 text-green-600" />
                  <span className="text-xs text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Procedure</h3>
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="whitespace-pre-line text-xs leading-relaxed text-foreground">{guide.procedure}</p>
            </div>
          </div>

          {guide.relatedFaults.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Related Faults</h3>
              <div className="flex flex-wrap gap-1.5">
                {guide.relatedFaults.map((f) => (
                  <button
                    key={f}
                    onClick={() => onNavigate("fault-detail", f)}
                    className="rounded-full border border-border bg-white px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:border-[#e0b800]"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Service Log View ───
export function ServiceLogView({ onNavigate }: { onNavigate: (route: ViewRoute) => void }) {
  const elevators = getElevators();
  const [selectedElevatorId, setSelectedElevatorId] = useState<string>(elevators[0]?.id || "");
  const [elevatorList, setElevatorList] = useState(elevators);
  const [showElevatorForm, setShowElevatorForm] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);

  const selectedElevator = elevatorList.find((e) => e.id === selectedElevatorId);

  const refresh = () => {
    const updated = getElevators();
    setElevatorList(updated);
    if (selectedElevatorId && !updated.find((e) => e.id === selectedElevatorId)) {
      setSelectedElevatorId(updated[0]?.id || "");
    }
  };

  return (
    <div className="px-4 pb-24 pt-16">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={listItem} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[#154734]">Service Log</h1>
            <p className="text-xs text-muted-foreground">{elevatorList.length} elevators</p>
          </div>
          <div className="flex gap-2">
            {selectedElevator && (
              <button onClick={() => setShowPrint(true)} className="rounded-xl bg-muted p-2 text-muted-foreground">
                <Printer size={18} />
              </button>
            )}
            <button onClick={() => setShowElevatorForm(true)} className="rounded-xl bg-[#154734] p-2 text-white">
              <Plus size={18} />
            </button>
          </div>
        </motion.div>

        {elevatorList.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Clipboard size={48} className="mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No elevators saved</p>
            <p className="text-xs text-muted-foreground/60">Add an elevator to start logging visits</p>
            <button
              onClick={() => setShowElevatorForm(true)}
              className="mt-4 rounded-xl bg-[#154734] px-6 py-2.5 text-sm font-bold text-white"
            >
              + Add Elevator
            </button>
          </div>
        ) : (
          <>
            <motion.div variants={listItem} className="flex gap-1.5 overflow-x-auto pb-1">
              {elevatorList.map((el) => (
                <button
                  key={el.id}
                  onClick={() => setSelectedElevatorId(el.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedElevatorId === el.id ? "bg-[#154734] text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {el.site}
                </button>
              ))}
            </motion.div>

            {selectedElevator && (
              <motion.div variants={listItem} className="space-y-3">
                <div className="rounded-2xl border border-border bg-white p-4">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Buildings size={16} className="text-[#154734]" />
                      <span className="font-bold">{selectedElevator.site}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User size={12} />
                      {selectedElevator.owner}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin size={12} />
                      {selectedElevator.controller} &middot; SN: {selectedElevator.serialNumber}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarBlank size={12} />
                      Installed: {formatDate(selectedElevator.installationDate)}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setShowDelete(selectedElevator.id)} className="flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-[10px] font-semibold text-destructive transition-colors hover:bg-destructive/5">
                      <Trash size={12} /> Delete
                    </button>
                  </div>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Visits ({selectedElevator.visits.length})
                </h3>

                {selectedElevator.visits.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <p className="text-xs text-muted-foreground">No visits logged yet</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {[...selectedElevator.visits].reverse().map((visit) => (
                      <div key={visit.id} className="rounded-xl border border-border bg-white p-3">
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#154734]">{visit.faultCode}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${visit.resolved ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                              {visit.resolved ? "Resolved" : "Open"}
                            </span>
                          </div>
                          <button
                            onClick={() => { deleteVisit(selectedElevator.id, visit.id); refresh(); toast.success("Visit deleted"); }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">{visit.description}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <CalendarBlank size={10} />
                          {formatDate(visit.date)}
                        </div>
                        {visit.notes && <p className="mt-1 rounded-lg bg-muted p-1.5 text-[10px] text-muted-foreground">{visit.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      {showElevatorForm && <NewElevatorModal onClose={() => setShowElevatorForm(false)} onSaved={() => { setShowElevatorForm(false); refresh(); }} />}
      {selectedElevator && <PrintReportModal open={showPrint} elevator={selectedElevator} onClose={() => setShowPrint(false)} />}
      <ConfirmModal
        open={!!showDelete}
        title="Delete Elevator"
        message="This will permanently delete this elevator and all its visit history."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { if (showDelete) { deleteElevator(showDelete); setShowDelete(null); refresh(); toast.success("Elevator deleted"); } }}
        onCancel={() => setShowDelete(null)}
      />
    </div>
  );
}

// CalendarBlank icon as local component (not in phosphor)
function CalendarBlank({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="4" y="6" width="24" height="22" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="4" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="2" />
      <line x1="11" y1="2" x2="11" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="21" y1="2" x2="21" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── New Elevator Modal ───
function NewElevatorModal({ onClose, onSaved }: { onClose: () => void; onSaved: (id?: string) => void }) {
  const [form, setForm] = useState({ site: "", owner: "", controller: "NICE3000new", serialNumber: "", installationDate: new Date().toISOString().split("T")[0] });

  const handleSave = () => {
    if (!form.site.trim()) { toast.error("Site name is required"); return; }
    const el: Elevator = {
      id: crypto.randomUUID(),
      site: form.site,
      owner: form.owner,
      controller: form.controller,
      serialNumber: form.serialNumber,
      installationDate: form.installationDate,
      visits: [],
    };
    saveElevator(el);
    toast.success("Elevator saved");
    onSaved(el.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#154734]">New Elevator</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <InputField label="Site / Building" value={form.site} onChange={(v) => setForm({ ...form, site: v })} placeholder="e.g. Grand Plaza Tower" />
          <InputField label="Owner / Contact" value={form.owner} onChange={(v) => setForm({ ...form, owner: v })} placeholder="e.g. Building Mgmt" />
          <InputField label="Controller" value={form.controller} onChange={(v) => setForm({ ...form, controller: v })} />
          <InputField label="Serial Number" value={form.serialNumber} onChange={(v) => setForm({ ...form, serialNumber: v })} placeholder="e.g. SN-2024-001" />
          <InputField label="Installation Date" value={form.installationDate} onChange={(v) => setForm({ ...form, installationDate: v })} type="date" />
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground">Cancel</button>
          <button onClick={handleSave} className="flex-1 rounded-xl bg-[#154734] px-4 py-2.5 text-sm font-bold text-white">Save</button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none ring-[#154734]/30 transition-all focus:border-[#154734] focus:ring-2"
      />
    </div>
  );
}

// ─── Info View ───
export function InfoView() {
  const [techName, setTechNameLocal] = useState(getTechName());
  const handleSave = () => { setTechName(techName); toast.success("Technician name saved"); };

  return (
    <div className="px-4 pb-24 pt-16">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={listItem} className="space-y-1">
          <h1 className="text-xl font-extrabold text-[#154734]">Info & Settings</h1>
        </motion.div>

        <motion.div variants={listItem} className="rounded-2xl border border-border bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-[#154734]">Technician</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={techName}
              onChange={(e) => setTechNameLocal(e.target.value)}
              placeholder="Your name"
              className="flex-1 rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#154734] focus:ring-2"
            />
            <button
              onClick={handleSave}
              className="rounded-xl bg-[#154734] px-4 py-2.5 text-sm font-bold text-white"
            >
              Save
            </button>
          </div>
        </motion.div>

        <motion.div variants={listItem} className="rounded-2xl border border-border bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-[#154734]">About</h2>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p><strong>NICE3000new Fault Finder</strong></p>
            <p>Version 1.0.0</p>
            <p>Offline field tool for elevator technicians servicing NICE3000new controllers.</p>
            <p>Data sourced from NICE3000new Troubleshooting Manual v2.3.</p>
            <p className="pt-2 text-[10px] text-muted-foreground/60">
              All data is stored locally in your browser. No data is transmitted to any server.
            </p>
          </div>
        </motion.div>

        <motion.div variants={listItem} className="rounded-2xl border border-border bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-[#154734]">Data Stats</h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-muted p-2.5 text-center">
              <div className="font-bold text-[#154734]">{FAULT_CODES.length}</div>
              <div className="text-muted-foreground">Fault Codes</div>
            </div>
            <div className="rounded-xl bg-muted p-2.5 text-center">
              <div className="font-bold text-[#154734]">{PARAMETER_GROUPS.flatMap(g => g.params).length}</div>
              <div className="text-muted-foreground">Parameters</div>
            </div>
            <div className="rounded-xl bg-muted p-2.5 text-center">
              <div className="font-bold text-[#154734]">{DIAGRAMS.length}</div>
              <div className="text-muted-foreground">Diagrams</div>
            </div>
            <div className="rounded-xl bg-muted p-2.5 text-center">
              <div className="font-bold text-[#154734]">{GUIDE_SYMPTOMS.length}</div>
              <div className="text-muted-foreground">Guides</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}