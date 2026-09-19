import React, { useState } from "react";
import { Check, ArrowRight, ArrowLeft, Plus, Trash2, ShieldCheck, AlertCircle } from "lucide-react";
import { api } from "../services/api";

interface AddSubjectWizardProps {
  onNavigate: (path: string) => void;
}

export const AddSubjectWizard: React.FC<AddSubjectWizardProps> = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Basic Details (default to scenario subject 042-S12-008)
  const [subjectId, setSubjectId] = useState("042-S12-008");
  const [siteId, setSiteId] = useState("SITE-112");
  const [enrollmentDate, setEnrollmentDate] = useState("2026-03-10");
  const [studyStatus, setStudyStatus] = useState("Active");
  const [age, setAge] = useState(52);
  const [sex, setSex] = useState("M");

  // Step 2: Medical History
  const [medicalHistory, setMedicalHistory] = useState([
    { condition: "Liver disease", start_date: "2025-06-15", status: "Ongoing", evidence_source: "HIST #042-S12-008-01" },
  ]);

  // Step 3: Medications
  const [medications, setMedications] = useState([
    { medication: "Drug A", dose: "50 mg", route: "Oral", frequency: "Once daily", start_date: "2026-03-12", end_date: "", status: "Ongoing", evidence_source: "CM #042-S12-008-01" },
  ]);

  // Step 4: Visits
  const [visits, setVisits] = useState([
    { visit_name: "Screening", visit_date: "2026-03-10", target_day: -14, actual_day: -14, visit_window: "±7 days", status: "Completed" },
    { visit_name: "Visit 2", visit_date: "2026-03-24", target_day: 14, actual_day: 14, visit_window: "±7 days", status: "Completed" },
  ]);

  // Step 5: Labs (ALT & Bilirubin for critical Hy's law demo scenario!)
  const [labs, setLabs] = useState([
    { test: "ALT", value: "215", unit: "U/L", reference_range: "7-56", collection_date: "2026-03-24" },
    { test: "BILI", value: "3.2", unit: "mg/dL", reference_range: "0.2-1.2", collection_date: "2026-03-24" },
  ]);

  // Step 6: Dosing
  const [dosing, setDosing] = useState([
    { visit: "Visit 2", planned_dose: 50, actual_dose: 50, dose_date: "2026-03-24" },
  ]);

  // Step 7: Adverse Events
  const [adverseEvents, setAdverseEvents] = useState([
    { event: "Fatigue", start_date: "2026-03-25", end_date: "", severity: "Moderate", seriousness: "No", hospitalization: "No", relationship: "Possible", status: "Ongoing" },
  ]);

  const steps = [
    "Basic Details",
    "Medical History",
    "Medications",
    "Visits",
    "Labs",
    "Dosing",
    "Adverse Events",
    "Review & Create",
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        subject_id: subjectId,
        site_id: siteId,
        enrollment_date: enrollmentDate,
        study_status: studyStatus,
        age: Number(age),
        sex: sex,
        medical_history: medicalHistory,
        medications: medications,
        visits: visits,
        labs: labs,
        dosing: dosing,
        adverse_events: adverseEvents,
      };

      await api.addSubject(payload);
      onNavigate(`/subjects/${subjectId}`);
    } catch (err: any) {
      setError(err.message || "Failed to create subject");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Add New Subject</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Multi-step clinical creation workflow. All records are normalized and mapped into the knowledge graph.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          {steps.map((label, idx) => {
            const stepNum = idx + 1;
            const isDone = step > stepNum;
            const isCurrent = step === stepNum;

            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 text-center hidden sm:block ${
                      isCurrent ? "font-bold text-slate-900" : isDone ? "font-medium text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {stepNum < steps.length && (
                  <div
                    className={`h-0.5 flex-1 mx-1 transition-colors ${
                      step > stepNum ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Step Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        {/* STEP 1: Basic Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Step 1: Subject Basic Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject ID *</label>
                <input
                  type="text"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. 042-S12-008"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Investigational Site *</label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                >
                  <option value="SITE-112">SITE-112 (Lakeside Clinical Center - S12)</option>
                  <option value="SITE-107">SITE-107 (University Hepatology - S07)</option>
                  <option value="SITE-101">SITE-101 (Memorial Oncology - S01)</option>
                  <option value="SITE-102">SITE-102 (St. Jude - S02)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Enrollment Date</label>
                <input
                  type="date"
                  value={enrollmentDate}
                  onChange={(e) => setEnrollmentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Study Status</label>
                <select
                  value={studyStatus}
                  onChange={(e) => setStudyStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Screening">Screening</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                >
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Medical History */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Step 2: Medical History & Pre-existing Diseases</h3>
              <button
                type="button"
                onClick={() =>
                  setMedicalHistory([
                    ...medicalHistory,
                    { condition: "Diabetes", start_date: "2024-01-01", status: "Ongoing", evidence_source: `HIST #${subjectId}-02` },
                  ])
                }
                className="flex items-center text-xs text-blue-600 font-semibold hover:text-blue-800"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Condition
              </button>
            </div>
            {medicalHistory.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Condition</label>
                  <input
                    type="text"
                    value={item.condition}
                    onChange={(e) => {
                      const updated = [...medicalHistory];
                      updated[idx].condition = e.target.value;
                      setMedicalHistory(updated);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Start Date</label>
                  <input
                    type="date"
                    value={item.start_date}
                    onChange={(e) => {
                      const updated = [...medicalHistory];
                      updated[idx].start_date = e.target.value;
                      setMedicalHistory(updated);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Status</label>
                  <select
                    value={item.status}
                    onChange={(e) => {
                      const updated = [...medicalHistory];
                      updated[idx].status = e.target.value;
                      setMedicalHistory(updated);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-[11px] text-slate-500 mb-0.5">Evidence Source</label>
                    <input
                      type="text"
                      value={item.evidence_source}
                      onChange={(e) => {
                        const updated = [...medicalHistory];
                        updated[idx].evidence_source = e.target.value;
                        setMedicalHistory(updated);
                      }}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono"
                    />
                  </div>
                  {medicalHistory.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setMedicalHistory(medicalHistory.filter((_, i) => i !== idx))}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 3: Medications */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Step 3: Medications & Treatments</h3>
              <button
                type="button"
                onClick={() =>
                  setMedications([
                    ...medications,
                    { medication: "Concomitant Med", dose: "10 mg", route: "Oral", frequency: "Once daily", start_date: "2026-03-12", end_date: "", status: "Ongoing", evidence_source: `CM #${subjectId}-02` },
                  ])
                }
                className="flex items-center text-xs text-blue-600 font-semibold hover:text-blue-800"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Medication
              </button>
            </div>
            {medications.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Medication Name</label>
                  <input
                    type="text"
                    value={item.medication}
                    onChange={(e) => {
                      const u = [...medications];
                      u[idx].medication = e.target.value;
                      setMedications(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Dose</label>
                  <input
                    type="text"
                    value={item.dose}
                    onChange={(e) => {
                      const u = [...medications];
                      u[idx].dose = e.target.value;
                      setMedications(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Start Date</label>
                  <input
                    type="date"
                    value={item.start_date}
                    onChange={(e) => {
                      const u = [...medications];
                      u[idx].start_date = e.target.value;
                      setMedications(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-[11px] text-slate-500 mb-0.5">Status</label>
                    <select
                      value={item.status}
                      onChange={(e) => {
                        const u = [...medications];
                        u[idx].status = e.target.value;
                        setMedications(u);
                      }}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded"
                    >
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setMedications(medications.filter((_, i) => i !== idx))}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 4: Visits */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Step 4: Clinical Visits</h3>
            {visits.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Visit Name</label>
                  <input
                    type="text"
                    value={item.visit_name}
                    onChange={(e) => {
                      const u = [...visits];
                      u[idx].visit_name = e.target.value;
                      setVisits(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Visit Date</label>
                  <input
                    type="date"
                    value={item.visit_date}
                    onChange={(e) => {
                      const u = [...visits];
                      u[idx].visit_date = e.target.value;
                      setVisits(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Visit Window</label>
                  <input
                    type="text"
                    value={item.visit_window}
                    onChange={(e) => {
                      const u = [...visits];
                      u[idx].visit_window = e.target.value;
                      setVisits(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Status</label>
                  <select
                    value={item.status}
                    onChange={(e) => {
                      const u = [...visits];
                      u[idx].status = e.target.value;
                      setVisits(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 5: Labs */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Step 5: Laboratory Results</h3>
              <button
                type="button"
                onClick={() =>
                  setLabs([
                    ...labs,
                    { test: "CREAT", value: "0.9", unit: "mg/dL", reference_range: "0.6-1.2", collection_date: "2026-03-24" },
                  ])
                }
                className="flex items-center text-xs text-blue-600 font-semibold hover:text-blue-800"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Lab
              </button>
            </div>
            {labs.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Test Code</label>
                  <input
                    type="text"
                    value={item.test}
                    onChange={(e) => {
                      const u = [...labs];
                      u[idx].test = e.target.value;
                      setLabs(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Value (Supports comma, &lt;5, ND)</label>
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => {
                      const u = [...labs];
                      u[idx].value = e.target.value;
                      setLabs(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Unit</label>
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => {
                      const u = [...labs];
                      u[idx].unit = e.target.value;
                      setLabs(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Reference Range</label>
                  <input
                    type="text"
                    value={item.reference_range}
                    onChange={(e) => {
                      const u = [...labs];
                      u[idx].reference_range = e.target.value;
                      setLabs(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 6: Dosing */}
        {step === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Step 6: Investigational Product Dosing</h3>
            {dosing.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Visit</label>
                  <input
                    type="text"
                    value={item.visit}
                    onChange={(e) => {
                      const u = [...dosing];
                      u[idx].visit = e.target.value;
                      setDosing(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Planned Dose (mg)</label>
                  <input
                    type="number"
                    value={item.planned_dose}
                    onChange={(e) => {
                      const u = [...dosing];
                      u[idx].planned_dose = Number(e.target.value);
                      setDosing(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Actual Dose (mg)</label>
                  <input
                    type="number"
                    value={item.actual_dose}
                    onChange={(e) => {
                      const u = [...dosing];
                      u[idx].actual_dose = Number(e.target.value);
                      setDosing(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Dose Date</label>
                  <input
                    type="date"
                    value={item.dose_date}
                    onChange={(e) => {
                      const u = [...dosing];
                      u[idx].dose_date = e.target.value;
                      setDosing(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 7: Adverse Events */}
        {step === 7 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Step 7: Adverse Events</h3>
            {adverseEvents.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Event Term</label>
                  <input
                    type="text"
                    value={item.event}
                    onChange={(e) => {
                      const u = [...adverseEvents];
                      u[idx].event = e.target.value;
                      setAdverseEvents(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Severity</label>
                  <select
                    value={item.severity}
                    onChange={(e) => {
                      const u = [...adverseEvents];
                      u[idx].severity = e.target.value;
                      setAdverseEvents(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Hospitalization?</label>
                  <select
                    value={item.hospitalization}
                    onChange={(e) => {
                      const u = [...adverseEvents];
                      u[idx].hospitalization = e.target.value;
                      setAdverseEvents(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-semibold"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes (Protocol SAE indicator)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Relationship to Drug</label>
                  <select
                    value={item.relationship}
                    onChange={(e) => {
                      const u = [...adverseEvents];
                      u[idx].relationship = e.target.value;
                      setAdverseEvents(u);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  >
                    <option value="Unrelated">Unrelated</option>
                    <option value="Possible">Possible</option>
                    <option value="Probable">Probable</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 8: Review & Submit */}
        {step === 8 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Step 8: Review & Confirm Subject Enrollment</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>Subject ID: <strong className="font-mono text-blue-700">{subjectId}</strong></div>
                <div>Site: <strong>{siteId}</strong></div>
                <div>Enrollment: <strong>{enrollmentDate}</strong></div>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-700 block mb-1">Medical History & Diseases:</span>
                {medicalHistory.map((m, i) => (
                  <span key={i} className="inline-block px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded mr-2 text-[11px]">
                    {m.condition} ({m.status})
                  </span>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-700 block mb-1">Medications:</span>
                {medications.map((m, i) => (
                  <span key={i} className="inline-block px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded mr-2 text-[11px]">
                    {m.medication} {m.dose}
                  </span>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-700 block mb-1">Key Labs:</span>
                {labs.map((l, i) => (
                  <span key={i} className="inline-block px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded mr-2 text-[11px] font-mono font-bold">
                    {l.test}: {l.value} {l.unit}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Automatic Relationship Inference:</strong> Upon creation, the ATLAS engine will build graph edges connecting Subject → Disease → Treatment → Labs → AEs and automatically evaluate active protocol safety criteria.
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </button>
          ) : (
            <div></div>
          )}

          {step < 8 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center shadow-xs transition-colors"
            >
              Save & Continue <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-sm transition-colors"
            >
              {submitting ? "Creating Subject & Linking Graph..." : "Create Subject & View 360"} <Check className="w-4 h-4 ml-1.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
