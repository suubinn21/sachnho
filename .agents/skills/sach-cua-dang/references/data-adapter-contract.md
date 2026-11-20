# Kiến trúc Dữ liệu Tĩnh & Data Adapter — Sách của Đăng

Tài liệu này quy định cách tổ chức dữ liệu sách **không dùng Database/API ngoài**, **không tạo dữ liệu giả**, và **chạy thẳng trên code** thông qua lớp `BookDataAdapter` để nạp trực tiếp bộ dữ liệu 128+ cuốn sách do người dùng cung cấp mà không phải chỉnh sửa logic hay giao diện ứng dụng.

---

## 1. Nguyên tắc Kiến trúc Dữ liệu (Zero-DB, Adapter-First)

```text
[Bộ Data 128+ Sách của người dùng]
   (src/data/raw/* — giữ nguyên format gốc)
                  │
                  ▼
     [src/data/adapter.ts]
   - Chuẩn hóa thành BookMeta[]
   - Sinh categoryGroups, authors, genres, years động
   - Tạo searchText không dấu tiếng Việt
   - Cung cấp loadBookContent(bookId) (lazy-load)
                  │
                  ▼
  [UI Components / Hooks / Reader]
   (Chỉ đọc interface chuẩn, 0 phụ thuộc vào schema gốc)
```

### Quy tắc bất biến
1. **Không sửa tay bộ data gốc:** Khi người dùng đưa file/thư mục dữ liệu 128+ cuốn sách, giữ nguyên cấu trúc trong `src/data/raw/` (hoặc cấu hình đường dẫn import), viết logic chuyển đổi trong `src/data/adapter.ts`.
2. **Không hardcode số lượng hay danh mục tĩnh:** Tổng số sách, số lượng theo tab (`Nguyễn Nhật Ánh`, `Văn học Việt Nam`, `Văn học nước ngoài`, v.v.), danh sách tác giả và danh sách thể loại đều được tính toán bằng hàm từ `booksMeta`.
3. **Không dữ liệu giả (No Fake/Mock Data):** Trước khi có dữ liệu thật từ người dùng, adapter trả về danh sách rỗng `[]` và UI hiển thị màn hình hướng dẫn sạch sẽ (chờ nạp data vào `src/data/raw/`), không tự bịa danh sách sách giả.

---

## 2. Cấu trúc thư mục đề xuất (React + Vite)

```text
src/
├── config/
│   └── site.ts                 # Tên tủ sách ("Sách của Đăng"), audio tracks mặc định (nếu có)
├── data/
│   ├── raw/                    # Đặt nguyên bộ dữ liệu 128+ sách người dùng cung cấp vào đây
│   ├── types.ts                # Interface chuẩn nội bộ (BookMeta, BookContent, UserState...)
│   ├── adapter.ts              # Lớp chuyển đổi raw data -> BookMeta[] + loadBookContent()
│   └── search.ts               # Hàm bỏ dấu tiếng Việt & chuẩn hóa searchText
├── storage/
│   ├── localState.ts           # localStorage cho trạng thái đọc, sao, bookmark, highlight, history
│   ├── indexedDb.ts            # IndexedDB cho file PDF cá nhân & MP3 cá nhân
│   └── backup.ts               # Export / Import JSON có kiểm tra schemaVersion
└── ...
```

---

## 3. Hợp đồng kiểu dữ liệu chuẩn nội bộ (`src/data/types.ts`)

```ts
export interface BookMeta {
  id: string;                 // Định danh duy nhất (từ data gốc hoặc slugify ổn định)
  title: string;              // Tên sách
  author: string;             // Tác giả (mặc định "Khuyết danh" nếu thiếu)
  year: number | null;        // Năm xuất bản (null nếu data không có)
  categoryGroup: string;      // Nhóm tab hiển thị (ví dụ: "Nguyễn Nhật Ánh", "Văn học Việt Nam",...)
  genre: string;              // Thể loại (ví dụ: "Truyện dài", "Tiểu thuyết",...)
  format: string;             // Định dạng mô tả (mặc định "Sách chữ")
  coverUrl?: string;          // URL ảnh bìa (từ import hoặc public/, optional)
  spineColor?: string;        // Màu gáy sách tùy chọn cho kệ 3D
  synopsis: string;           // Tóm tắt nội dung (chuỗi rỗng nếu chưa có)
  totalPages?: number;        // Ước tính hoặc số trang gốc nếu có
  isNew?: boolean;            // Hiển thị trong modal Sách mới thêm (mặc định false)
  contentRef?: string;        // Đường dẫn/khóa để lazy-load nội dung chương
  searchText: string;         // Chuỗi chữ thường không dấu (title + author + genre)
}

export interface BookChapter {
  id: string;
  orderIndex: number;
  title: string;
  startPage?: number;         // Trang bắt đầu (tính động theo phân trang của trình đọc nếu chưa có)
  /**
   * Hỗ trợ linh hoạt tùy theo định dạng data của người dùng:
   * - Mảng đoạn văn (string[])
   * - Chuỗi văn bản thuần (string)
   * - Chuỗi HTML đã được sanitize trước khi render
   */
  paragraphs: string[];
}

export interface BookContent {
  bookId: string;
  chapters: BookChapter[];
}

export interface SiteConfig {
  appTitle: string;           // Mặc định: "Sách của Đăng"
  appSubtitle: string;        // Mặc định: "TỦ SÁCH CÁ NHÂN"
  footerNote: string;         // Mặc định: "Sách của Đăng · Thư viện đọc sách cá nhân"
  personalTabLabel: string;   // Mặc định: "Sách của bạn"
  defaultAudioTracks: AudioTrackMeta[];
}
```

---

## 4. Chiến lược nạp dữ liệu tĩnh hiệu năng cao trên Vite

Tùy theo hình thức bộ data 128+ cuốn sách mà người dùng cung cấp, `src/data/adapter.ts` áp dụng mẫu tương ứng mà không cần đổi giao diện:

### Trường hợp A: Nhiều file tách riêng theo cuốn (`raw/books/*.json` hoặc `*.js`) + file mục lục (`catalog.json`)
- Import tĩnh file mục lục nhẹ để render ngay lập tức Kệ sách 3D, Tìm kiếm và Bộ lọc.
- Dùng **`import.meta.glob('./raw/books/*.json')`** của Vite để tạo map lazy-load:
  ```ts
  const bookLoaders = import.meta.glob('./raw/books/*.json');

  export async function loadBookContent(bookId: string): Promise<BookContent> {
    const meta = getBookById(bookId);
    const loader = bookLoaders[meta.contentRef];
    const mod = await loader();
    return normalizeContent(bookId, mod.default);
  }
  ```
- Nhờ `import.meta.glob` (không `{ eager: true }`), Vite tự tách mỗi cuốn sách thành một chunk riêng, trang chủ chỉ tải phần metadata nhẹ.

### Trường hợp B: Một file JSON/JS tổng chứa cả danh mục và nội dung 128+ cuốn
- Dùng Dynamic Import (`import('./raw/library.json')`) hoặc nạp catalog nhẹ tách chỉ số ở build/runtime, caching kết quả trong bộ nhớ (`Map<string, BookContent>`) sau lần đọc đầu tiên để tránh re-parse lặp lại khi chuyển trang.
- Nếu file tổng quá lớn gây chậm bundle khởi đầu, có thể viết một script build-time nhỏ (trong `scripts/`) tách tự động ra `public/books/<id>.json` hoặc giữ nguyên file gốc và load async một lần với loading indicator mượt mà — **tuyệt đối không buộc người dùng chỉnh tay file gốc**.

### Trường hợp C: Dữ liệu nằm trong `public/` (ảnh bìa, JSON, TXT, EPUB, Audio)
- Luôn resolve đường dẫn bằng `import.meta.env.BASE_URL` để chạy đúng cả ở `/` lẫn subpath (như GitHub Pages hoặc preview local).

### Trường hợp D: Thư mục các tệp `.txt` theo từng cuốn (`src/data/raw/*.txt` — chuẩn hiện tại)
- Mỗi tệp `.txt` giữ nguyên cấu trúc:
  - Dòng đầu: `=== SÁCH [<id>]: <Tên sách> (<Tác giả>) ===` *(lưu ý dùng thuật toán cân bằng ngoặc đơn từ phải sang trái để xử lý tên tác giả có ngoặc lồng như `Alexandre Dumas (con)`)*.
  - Mỗi chương: `[CHƯƠNG <stt> - rtit] <Tên chương>`, theo sau là dòng `[rtx]` và các đoạn văn bản (`1 dòng = 1 đoạn` hoặc `1 dòng thơ`).
- **Vite Virtual Catalog Plugin (`plugins/viteBooksTxtPlugin.ts`):** Quét `src/data/raw/*.txt` khi chạy `dev`/`build` để tạo module ảo `virtual:books-catalog` chỉ chứa metadata nhẹ (`~30KB` cho 128+ cuốn) và tự theo dõi HMR khi thêm/bớt tệp `.txt`.
- **Lazy-load nội dung:** Dùng `import.meta.glob('./raw/*.txt', { query: '?url', import: 'default', eager: true })` lấy URL tài nguyên tĩnh theo từng file và `fetch(url)` + `parseBookTxtContent()` theo yêu cầu khi người dùng bấm `Đọc ngay`, kết hợp cache trong bộ nhớ (`Map<string, BookContent>`). Cách này tránh gộp 90+ MB chữ vào JS bundle khởi đầu và giúp `vite build` đóng gói cực nhanh.
- **Nhạc nền tự động nạp (`src/data/audio/`):** `src/data/audioLoader.ts` dùng `import.meta.glob('./audio/*.{mp3,wav,ogg,m4a,aac,flac}', { query: '?url', import: 'default', eager: true })` để tự động nhận diện mọi tệp nhạc người dùng thả vào `src/data/audio/` (không cần sửa code), ưu tiên phát cùng 10 bản piano tích hợp sẵn qua `AmbientAudioEngine` và các file MP3 lưu cục bộ trong IndexedDB.

---

## 5. Chuẩn hóa Tìm kiếm, Bộ lọc & Thống kê động

1. **Hàm bỏ dấu tiếng Việt (`src/data/search.ts`):**
   - Dùng `str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim()`.
   - Áp dụng cho cả `book.searchText` lúc khởi tạo Adapter lẫn từ khóa người dùng gõ vào ô `Tìm truyện…`.
2. **Suy xuất Bộ lọc & Tab động:**
   - `getCategoryGroups(books)`: trích xuất danh sách giá trị `categoryGroup` duy nhất (giữ thứ tự xuất hiện hợp lý hoặc thứ tự ưu tiên cấu hình, luôn có `Tất cả` ở đầu và `Sách của bạn` ở cuối).
   - `getAuthors(books)` và `getGenres(books)`: trích xuất danh sách duy nhất, sắp xếp theo bảng chữ cái tiếng Việt (`localeCompare('vi')`).
   - **Quy tắc dropdown mặc định (`FR-04`):** Giá trị `"Mọi nhóm"`, `"Mọi tác giả"`, `"Mọi thể loại"` đều dùng chung khóa chuẩn `ALL_FILTER_VALUE = '__ALL__'`, không so khớp theo chuỗi hiển thị UI để tránh lỗi `0 / N quyển`.

---

## 6. Mô hình Lưu trữ Cục bộ (`localStorage` & `IndexedDB`)

### 6.1. `localStorage` (Nhẹ, đồng bộ tức thì)
Khóa namespace đề xuất: `sach_cua_dang_v1:*`
- `book_states`: `Record<bookId, { status?: 'want' | 'reading' | 'read'; rating?: 1|2|3|4|5; lastPage?: number; lastOpenedAt?: string }>`
- `bookmarks`: `Record<bookId, Array<{ id: string; pageNumber: number; chapterTitle?: string; createdAt: string }>>`
- `highlights`: `Record<bookId, Array<{ id: string; pageNumber: number; selectedText: string; color: string; chapterTitle?: string; createdAt: string }>>`
- `reading_history`: Mảng `{ bookId: string; openedAt: string; lastPage: number }` (giới hạn ví dụ 50 mục gần nhất).
- `preferences`: `{ theme: 'light' | 'dark'; readerZoom: number; activeCategory: string }`

### 6.2. `IndexedDB` (Dữ liệu nhị phân dung lượng lớn)
Database `SachCuaDangDB` (version 1):
- Object store `personal_books`: `{ id, title, author, pdfBlob: Blob, coverBlob?: Blob, addedAt: string }` (`FR-10`).
- Object store `personal_tracks`: `{ id, title, bpm?: number, audioBlob: Blob, addedAt: string }` (`FR-09`).
- Khi cần phát hoặc đọc, tạo `URL.createObjectURL(blob)` và thu hồi (`URL.revokeObjectURL`) khi đóng/unmount để tránh rò rỉ bộ nhớ.

### 6.3. Định dạng tệp Sao lưu & Khôi phục (`FR-11`)
```ts
export interface BackupPayload {
  app: 'sach-cua-dang';
  schemaVersion: 1;
  exportedAt: string; // ISO 8601
  bookStates: Record<string, UserBookState>;
  bookmarks: Record<string, BookmarkItem[]>;
  highlights: Record<string, HighlightItem[]>;
  readingHistory: ReadingHistoryItem[];
  preferences: UserPreferences;
}
```
- Khi **Import**, kiểm tra `payload?.app === 'sach-cua-dang'` và `schemaVersion === 1`, cho người dùng chọn **Ghi đè toàn bộ** hoặc **Gộp (giữ mục mới hơn)** trước khi áp dụng.
