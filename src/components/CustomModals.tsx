import { motion, AnimatePresence } from "framer-motion";
import { X, Warning } from "@phosphor-icons/react";
import type { Elevator } from "../types";
import { getElevators } from "../data/nice3000Data";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel",
  variant = "default", onConfirm, onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              {variant === "danger" && <Warning size={24} className="text-destructive shrink-0" />}
              <h3 className="text-lg font-bold text-[#154734]">{title}</h3>
              <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={onCancel}>
                <X size={20} />
              </button>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors ${
                  variant === "danger"
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-[#154734] hover:bg-[#154734]/90"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ElevatorPickerProps {
  open: boolean;
  onSelect: (elevatorId: string) => void;
  onCancel: () => void;
  onCreateNew: () => void;
}

export function ElevatorPicker({ open, onSelect, onCancel, onCreateNew }: ElevatorPickerProps) {
  const elevators = getElevators();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#154734]">Log this fix</h3>
              <button className="text-muted-foreground hover:text-foreground" onClick={onCancel}>
                <X size={20} />
              </button>
            </div>
            {elevators.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No elevators saved yet. Create one to log visits.
              </div>
            ) : (
              <div className="mb-4 max-h-60 space-y-2 overflow-y-auto">
                {elevators.map((el) => (
                  <button
                    key={el.id}
                    onClick={() => onSelect(el.id)}
                    className="w-full rounded-xl border border-border px-4 py-3 text-left transition-colors hover:border-[#e0b800] hover:bg-[#e0b800]/5"
                  >
                    <div className="text-sm font-semibold text-foreground">{el.site}</div>
                    <div className="text-xs text-muted-foreground">{el.owner} &middot; {el.controller}</div>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={onCreateNew}
              className="w-full rounded-xl bg-[#154734] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#154734]/90"
            >
              + New Elevator
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface PrintReportModalProps {
  open: boolean;
  elevator: Elevator | null;
  onClose: () => void;
}

export function PrintReportModal({ open, elevator, onClose }: PrintReportModalProps) {
  if (!open || !elevator) return null;

  const handlePrint = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    const visitsHtml = elevator.visits
      .map(
        (v) => `
      <tr>
        <td style="border:1px solid #ccc;padding:6px;font-size:12px">${new Date(v.date).toLocaleDateString()}</td>
        <td style="border:1px solid #ccc;padding:6px;font-size:12px">${v.faultCode}</td>
        <td style="border:1px solid #ccc;padding:6px;font-size:12px">${v.description}</td>
        <td style="border:1px solid #ccc;padding:6px;font-size:12px">${v.resolved ? "Yes" : "No"}</td>
      </tr>`
      )
      .join("");
    printWin.document.write(`
      <html><head><title>Service Report - ${elevator.site}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h1 { color: #154734; font-size: 20px; margin-bottom: 4px; }
        h2 { color: #154734; font-size: 14px; margin-top: 20px; }
        .info { font-size: 12px; color: #666; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #154734; color: white; padding: 8px; font-size: 12px; text-align: left; }
        .footer { margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #ccc; padding-top: 10px; }
      </style></head><body>
      <h1>NICE3000new Service Report</h1>
      <div class="info"><strong>Site:</strong> ${elevator.site}</div>
      <div class="info"><strong>Owner:</strong> ${elevator.owner}</div>
      <div class="info"><strong>Controller:</strong> ${elevator.controller}</div>
      <div class="info"><strong>Serial:</strong> ${elevator.serialNumber}</div>
      <h2>Visit History (${elevator.visits.length})</h2>
      <table><thead><tr><th>Date</th><th>Fault</th><th>Description</th><th>Resolved</th></tr></thead><tbody>${visitsHtml}</tbody></table>
      <div class="footer">Generated by NICE3000new Fault Finder &middot; ${new Date().toLocaleDateString()}</div>
    `);
    printWin.document.close();
    printWin.print();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#154734]">Print Report</h3>
              <button className="text-muted-foreground hover:text-foreground" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            <div className="mb-6 space-y-2 text-sm">
              <p><strong>Site:</strong> {elevator.site}</p>
              <p><strong>Owner:</strong> {elevator.owner}</p>
              <p><strong>Visits:</strong> {elevator.visits.length}</p>
            </div>
            <button
              onClick={handlePrint}
              className="w-full rounded-xl bg-[#154734] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#154734]/90"
            >
              Print / Save as PDF
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}