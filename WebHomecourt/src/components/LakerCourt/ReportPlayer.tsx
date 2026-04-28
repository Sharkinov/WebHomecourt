import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import StatusAlert from "../Messages/StatusAlert";

interface ReportType {
  report_id: number;
  report_type: string;
}

interface ReportPlayerPopUpProps {
  eventId: number;
  reportedUserId: string;
  reportedUserName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RportPopUp({eventId,reportedUserId,reportedUserName,onClose,onSuccess,}: ReportPlayerPopUpProps) {
  const { user } = useAuth();

  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase
      .from("report_type")
      .select("report_id, report_type")
      .order("report_id")
      .then(({ data, error }) => { //En vez de hacer una funciona asincronica, con el then ua es el callback y ps como su npombre lo indica, lo hace despues ajja
        if (!error && data) setReportTypes(data as ReportType[]); 
        setLoadingTypes(false);
      });
  }, []);

  // useEffect(() => {
  //   document.body.style.overflow = "hidden";
  //   return () => { document.body.style.overflow = ""; };
  // }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); //Es para que cuando se haga el submit, no se recarge sola, pq si no, la pagina da refresh antes de que se envie
    setError(null);

    if (!user) { setError("Debes iniciar sesión para reportar."); return; }
    if (!selectedTypeId) { setError("Selecciona un tipo de reporte."); return; }
    if (!description.trim()) { setError("Describe lo que ocurrió."); return; }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("user_report").insert([{
        event_id: eventId,
        reported_user_id: reportedUserId,
        reporter_user_id: user.id,
        comment: description,
        report_type: selectedTypeId,
      }]);
      if (error) throw error;

      setSuccess(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar el reporte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-[20px] bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 bg-morado-oscuro">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/30">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">Report Player</h2>
                <p className="text-sm text-purple-300">{reportedUserName}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Alert */}
        <div className="mx-6 mt-5 rounded-xl bg-purple-50 border border-purple-100 p-3.5 flex gap-2.5 items-start">
          <svg className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-gray-600 leading-snug">
            Tu reporte será revisado por nuestro{" "}
            <span className="font-semibold text-purple-600">sistema de moderación IA</span>{" "}
            para garantizar un juego justo y seguro para todos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2.5">Report Type</label>
            {loadingTypes ? (
              <div className="grid grid-cols-2 gap-2">
                {[...Array(6)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {reportTypes.map((type) => (
                  <button
                    key={type.report_id}
                    type="button"
                    onClick={() => setSelectedTypeId(type.report_id)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                      selectedTypeId === type.report_id
                        ? "bg-morado-lakers text-white ring-2 ring-purple-300 shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type.report_type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-morado-lakers focus:border-transparent resize-none placeholder:text-gray-400 text-gray-800 text-sm bg-gray-50 transition-colors"
            />
          </div>

          {error && ( <StatusAlert tone="error" title={error} /> )}
          {success && ( <StatusAlert tone="success" title="¡Reporte enviado correctamente!" />)}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || !selectedTypeId || !description.trim()} className="flex-1 px-4 py-3 bg-morado-lakers text-white rounded-xl text-sm font-medium hover:bg-morado-oscuro transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}