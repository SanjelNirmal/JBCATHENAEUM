// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import { User, Calendar, Share2, ExternalLink } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Subject, Note } from "../lib/api";

export function NoteViewer({
  subjectData,
  initialNoteId,
  onNoteChange,
}: {
  subjectData: Subject;
  initialNoteId?: string | null;
  onNoteChange?: (subjectId: string, noteId: string | null) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onNoteChangeRef = useRef(onNoteChange);

  // Try to default to the first note available
  const [selectedNote, setSelectedNote] = useState<Note | null>(
    subjectData.notes[0] || null,
  );

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onNoteChangeRef.current = onNoteChange;
  }, [onNoteChange]);

  useEffect(() => {
    if (!subjectData.notes.length) {
      setSelectedNote(null);
      return;
    }

    if (initialNoteId) {
      const sharedNote = subjectData.notes.find(
        (note) => note.id === initialNoteId,
      );
      if (sharedNote) {
        setSelectedNote(sharedNote);
        onNoteChangeRef.current?.(subjectData.id, sharedNote.id);
        return;
      }
    }

    setSelectedNote(subjectData.notes[0] || null);
    onNoteChangeRef.current?.(subjectData.id, subjectData.notes[0]?.id || null);
  }, [subjectData, initialNoteId]);

  const handleShare = async () => {
    if (!selectedNote) return;

    const params = new URLSearchParams({
      subject: subjectData.id,
      note: selectedNote.id,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    const shareTitle = `${selectedNote.title} | JBC ATHENAEUM`;
    const shareText = [
      `📘 ${selectedNote.title}`,
      `📚 Subject: ${subjectData.name} (${subjectData.faculty} Sem ${subjectData.semester})`,
      `👤 Uploaded by: ${selectedNote.author}`,
    ].join("\n");
    const clipboardText = `${shareText}\n\nOpen this note:\n${url}`;

    try {
      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url,
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          console.error(
            "Native share failed, falling back to clipboard:",
            error,
          );
        }
      }

      await navigator.clipboard.writeText(clipboardText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to share note:", error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto px-4 md:px-12 py-12 gap-8 font-sans animate-in zoom-in-95 duration-500">
      {/* Sidebar (25%) */}
      <aside className="w-full md:w-1/4 flex flex-col md:border-r border-slate-200 md:pr-8">
        <div className="mb-6">
          <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
            {subjectData.faculty} {subjectData.semester}
          </span>
        </div>
        <h3 className="text-xl font-serif font-bold text-[#002147] mb-6">
          {subjectData.name}
        </h3>

        <div className="space-y-4">
          <h4 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4">
            Other Notes in this Subject
          </h4>

          {subjectData.notes.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              No notes uploaded yet.
            </p>
          ) : (
            subjectData.notes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNote(note);
                  onNoteChangeRef.current?.(subjectData.id, note.id);
                }}
                className={`group cursor-pointer p-4 transition-all border-l-4 ${selectedNote?.id === note.id ? "bg-blue-50/50 border-[#002147] shadow-sm" : "hover:bg-slate-50 border-transparent hover:border-[#c49b63]"}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <h5
                    className={`text-sm font-semibold mb-1 ${selectedNote?.id === note.id ? "text-[#002147]" : "text-slate-800 group-hover:text-[#002147]"}`}
                  >
                    {note.title}
                  </h5>
                  {selectedNote?.id === note.id && (
                    <span className="flex-shrink-0 text-[9px] uppercase tracking-widest font-bold bg-[#002147] text-white px-1.5 py-0.5 rounded-sm">
                      Viewing
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  By {note.author} &bull; {note.size}
                </p>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Content (75%) */}
      <main className="w-full md:w-3/4 flex flex-col">
        {selectedNote ? (
          <>
            {/* Header section */}
            <div className="mb-8 border-b border-slate-200 pb-6">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#002147] mb-4">
                {selectedNote.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <User size={16} />
                  <span>
                    Uploaded by{" "}
                    <span className="font-medium text-slate-800">
                      {selectedNote.author}
                    </span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>{selectedNote.date}</span>
                </div>
                <div className="flex flex-1 justify-end space-x-3">
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-1.5 text-slate-500 hover:text-[#002147] transition-colors"
                  >
                    <Share2 size={16} />
                    <span className="hidden sm:inline">
                      {copied ? "Copied!" : "Share"}
                    </span>
                  </button>
                  <a
                    href={
                      selectedNote.url.includes(
                        "/functions/v1/resource-download",
                      )
                        ? `${selectedNote.url}&download=1`
                        : selectedNote.url.replace("/preview", "/view")
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 text-white bg-[#002147] hover:bg-[#001b3a] px-4 py-1.5 transition-colors text-xs uppercase tracking-widest font-semibold shadow-sm"
                  >
                    <ExternalLink size={14} />
                    <span>Open Document</span>
                  </a>
                </div>
              </div>
            </div>

            {/* PDF Viewer Container */}
            <div className="w-full h-[600px] md:h-[800px] border border-slate-200 rounded overflow-hidden relative shadow-sm">
              <iframe
                ref={iframeRef}
                src={selectedNote.url}
                className="absolute inset-0 w-full h-full border-0 z-10"
                title="PDF Document Viewer"
                allow="autoplay"
              ></iframe>
              {/* Fallback overlay in case of iframe block */}
              <div className="absolute inset-0 z-0 bg-slate-50 flex flex-col justify-center items-center text-slate-400 p-8 text-center pointer-events-none">
                <p className="text-sm font-semibold uppercase tracking-widest mb-2 text-[#002147]/40">
                  Document Viewer
                </p>
                <p className="text-xs">Loading preview from Google Drive...</p>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full flex-1 min-h-[60vh] flex flex-col items-center justify-center text-center p-12 bg-white border border-slate-200 rounded">
            <h2 className="text-2xl font-serif text-[#002147] mb-2">
              No notes available
            </h2>
            <p className="text-slate-500">
              There are currently no notes uploaded for this subject.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
