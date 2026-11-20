import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PersonalBookRecord } from '../data/types';
import { formatDateTimeVi } from '../utils/formatters';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PersonalLibraryOverlayProps {
  books: PersonalBookRecord[];
  onAddBook: (record: PersonalBookRecord) => Promise<void>;
  onDeleteBook: (id: string) => Promise<void>;
  onClose: () => void;
}

const MAX_PDF_BYTES = 120 * 1024 * 1024; // 120 MB safety guard

export function PersonalLibraryOverlay({
  books,
  onAddBook,
  onDeleteBook,
  onClose,
}: PersonalLibraryOverlayProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active PDF viewer state
  const [activePdfBook, setActivePdfBook] = useState<PersonalBookRecord | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.25);
  const [pdfLoading, setPdfLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [coverPreviews, setCoverPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    const urls: Record<string, string> = {};
    for (const b of books) {
      if (b.coverBlob) {
        urls[b.id] = URL.createObjectURL(b.coverBlob);
      }
    }
    setCoverPreviews(urls);
    return () => {
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [books]);

  useEffect(() => {
    if (!activePdfBook) {
      setPdfDoc(null);
      return;
    }

    let cancelled = false;
    setPdfLoading(true);
    void (async () => {
      try {
        const buffer = await activePdfBook.pdfBlob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const doc = await loadingTask.promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setPdfTotalPages(doc.numPages);
        setPdfPage(1);
      } catch {
        if (!cancelled) setErrorMsg('Không thể giải mã tệp PDF này.');
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activePdfBook]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    let activeRenderTask: pdfjsLib.RenderTask | null = null;

    void (async () => {
      const page = await pdfDoc.getPage(pdfPage);
      if (cancelled || !canvasRef.current) return;
      const viewport = page.getViewport({ scale: pdfScale });
      const canvas = canvasRef.current;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      activeRenderTask = page.render({ canvas, viewport });
      try {
        await activeRenderTask.promise;
      } catch {
        // Ignore expected cancellation when turning PDF pages rapidly
      }
    })();

    return () => {
      cancelled = true;
      activeRenderTask?.cancel();
    };
  }, [pdfDoc, pdfPage, pdfScale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!pdfFile) {
      setErrorMsg('Vui lòng chọn một tệp PDF từ thiết bị.');
      return;
    }
    if (
      pdfFile.type !== 'application/pdf' &&
      !pdfFile.name.toLowerCase().endsWith('.pdf')
    ) {
      setErrorMsg('Chỉ hỗ trợ định dạng tệp .pdf.');
      return;
    }
    if (pdfFile.size > MAX_PDF_BYTES) {
      setErrorMsg('Tệp PDF vượt quá giới hạn 120 MB cho bộ nhớ trình duyệt.');
      return;
    }

    const cleanTitle = title.trim() || pdfFile.name.replace(/\.pdf$/i, '');
    const cleanAuthor = author.trim() || 'Sách cá nhân';

    setSaving(true);
    try {
      await onAddBook({
        id: `personal-${Date.now()}`,
        title: cleanTitle,
        author: cleanAuthor,
        pdfBlob: pdfFile,
        coverBlob: coverFile ?? undefined,
        fileSize: pdfFile.size,
        addedAt: new Date().toISOString(),
      });
      setPdfFile(null);
      setCoverFile(null);
      setTitle('');
      setAuthor('');
    } catch {
      setErrorMsg('Không thể lưu vào IndexedDB. Trình duyệt có thể đang đầy bộ nhớ.');
    } finally {
      setSaving(false);
    }
  };

  if (activePdfBook) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Đọc PDF ${activePdfBook.title}`}
        className="fixed inset-0 z-50 flex flex-col bg-[var(--paper)] text-[var(--ink)]"
      >
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-soft)] bg-[var(--sheet)] px-4 py-2.5">
          <div className="min-w-0">
            <h2 className="truncate font-serif-book text-lg font-medium">
              {activePdfBook.title}
            </h2>
            <p className="font-sans-ui text-xs text-[var(--muted)]">
              {activePdfBook.author} · Trang {pdfPage}/{pdfTotalPages}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPdfScale((s) => Math.max(0.75, Number((s - 0.2).toFixed(2))))}
              className="cursor-pointer rounded-full border border-[var(--border-soft)] px-2.5 py-1 font-sans-ui text-xs"
            >
              −
            </button>
            <span className="font-sans-ui text-xs tabular-nums">
              {Math.round(pdfScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setPdfScale((s) => Math.min(2.4, Number((s + 0.2).toFixed(2))))}
              className="cursor-pointer rounded-full border border-[var(--border-soft)] px-2.5 py-1 font-sans-ui text-xs"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setActivePdfBook(null)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--paper)] px-3 py-1 font-sans-ui text-xs font-semibold"
            >
              <X className="h-3.5 w-3.5" />
              ĐÓNG
            </button>
          </div>
        </header>

        <div className="flex flex-1 items-start justify-center overflow-auto p-4">
          {pdfLoading ? (
            <div className="my-auto flex items-center gap-2 font-sans-ui text-sm text-[var(--muted)]">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--cobalt)]" />
              Đang mở tài liệu PDF…
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="max-w-full rounded-lg bg-white shadow-xl"
            />
          )}
        </div>

        <footer className="flex items-center justify-center gap-4 border-t border-[var(--border-soft)] bg-[var(--sheet)] px-4 py-2.5">
          <button
            type="button"
            disabled={pdfPage <= 1}
            onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--border-soft)] px-3.5 py-1.5 font-sans-ui text-xs disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Trang trước
          </button>
          <span className="font-sans-ui text-xs tabular-nums text-[var(--muted)]">
            {pdfPage} / {pdfTotalPages}
          </span>
          <button
            type="button"
            disabled={pdfPage >= pdfTotalPages}
            onClick={() => setPdfPage((p) => Math.min(pdfTotalPages, p + 1))}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-[var(--cobalt)] px-3.5 py-1.5 font-sans-ui text-xs text-white disabled:opacity-40"
          >
            Trang sau
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thư viện sách cá nhân"
      className="fixed inset-0 z-40 overflow-y-auto bg-[var(--paper)]/95 p-4 text-[var(--ink)] backdrop-blur-md sm:p-8"
    >
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-4">
          <div>
            <p className="font-sans-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--cobalt)]">
              LƯU CỤC BỘ TRÊN TRÌNH DUYỆT (INDEXEDDB)
            </p>
            <h2 className="font-serif-book mt-1 text-2xl font-medium sm:text-3xl">
              Thư viện sách cá nhân (Sách của bạn)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--sheet)] px-3.5 py-1.5 font-sans-ui text-xs font-semibold tracking-wider hover:border-[var(--cobalt)]"
          >
            <X className="h-3.5 w-3.5" />
            QUAY LẠI KỆ SÁCH
          </button>
        </div>

        {/* Upload Form */}
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mt-6 rounded-2xl border border-[var(--border-soft)] bg-[var(--sheet)] p-5 shadow-sm"
        >
          <h3 className="font-serif-book text-lg font-medium">
            Thêm sách PDF từ máy của bạn
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-sans-ui mb-1 block text-xs font-medium text-[var(--muted)]">
                Chọn file PDF *
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setPdfFile(f);
                  if (f && !title) setTitle(f.name.replace(/\.pdf$/i, ''));
                }}
                className="block w-full cursor-pointer rounded-xl border border-[var(--border-soft)] bg-[var(--paper)] px-3 py-2 font-sans-ui text-xs"
              />
            </label>

            <label className="block">
              <span className="font-sans-ui mb-1 flex items-center gap-1 text-xs font-medium text-[var(--muted)]">
                <ImagePlus className="h-3.5 w-3.5" />
                Ảnh bìa (tùy chọn)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer rounded-xl border border-[var(--border-soft)] bg-[var(--paper)] px-3 py-2 font-sans-ui text-xs"
              />
            </label>

            <label className="block">
              <span className="font-sans-ui mb-1 block text-xs font-medium text-[var(--muted)]">
                Tên sách
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tên cuốn sách…"
                className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--paper)] px-3 py-2 font-sans-ui text-xs outline-none focus:border-[var(--cobalt)]"
              />
            </label>

            <label className="block">
              <span className="font-sans-ui mb-1 block text-xs font-medium text-[var(--muted)]">
                Tên tác giả
              </span>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nhập tên tác giả…"
                className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--paper)] px-3 py-2 font-sans-ui text-xs outline-none focus:border-[var(--cobalt)]"
              />
            </label>
          </div>

          {errorMsg && (
            <p className="mt-3 font-sans-ui text-xs text-red-600 dark:text-red-400">
              {errorMsg}
            </p>
          )}

          <div className="mt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--cobalt)] px-5 py-2 font-sans-ui text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {saving ? 'Đang lưu…' : 'Lưu vào thư viện của tôi'}
            </button>
          </div>
        </form>

        {/* Saved PDF Library */}
        <div className="mt-6">
          {books.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--sheet)]/60 p-10 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-[var(--muted)]" />
              <h4 className="font-serif-book text-lg font-medium">
                Thư viện cá nhân đang trống
              </h4>
              <p className="font-sans-ui mt-1 text-xs text-[var(--muted)]">
                Hãy tải lên file PDF yêu thích ở biểu mẫu phía trên để đọc trực tiếp trên trình duyệt này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {books.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--sheet)] p-3 shadow-sm"
                >
                  <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--cobalt)]/15">
                    {coverPreviews[item.id] ? (
                      <img
                        src={coverPreviews[item.id]}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-serif-book text-xl font-medium text-[var(--cobalt)]">
                        PDF
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <h4 className="line-clamp-2 font-serif-book text-base font-medium">
                        {item.title}
                      </h4>
                      <p className="truncate font-sans-ui text-xs text-[var(--muted)]">
                        {item.author}
                      </p>
                      <p className="font-sans-ui mt-0.5 text-[10px] text-[var(--muted)]">
                        {(item.fileSize / (1024 * 1024)).toFixed(1)} MB ·{' '}
                        {formatDateTimeVi(item.addedAt)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActivePdfBook(item)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-[var(--cobalt)] px-3 py-1 font-sans-ui text-[11px] font-medium text-white"
                      >
                        <BookOpen className="h-3 w-3" />
                        Đọc PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDeleteBook(item.id)}
                        aria-label={`Xóa sách ${item.title}`}
                        className="cursor-pointer rounded-full p-1 text-[var(--muted)] hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
