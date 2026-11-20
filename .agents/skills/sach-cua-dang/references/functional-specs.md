# Đặc tả Chức năng & Giao diện — Sách của Đăng (Bản Cá Nhân)

Tài liệu này chuyển thể và hiệu chỉnh từ bản SRS tham chiếu (`khoaverse.fun`) cho phiên bản **dùng riêng cá nhân ("Sách của Đăng")**, chạy trên nền tảng **React + Vite + Tailwind CSS** với dữ liệu tĩnh trực tiếp trong mã nguồn (Zero-DB).

---

## 1. Tổng quan & Phạm vi Sản phẩm

- **Tên ứng dụng mặc định:** `Sách của Đăng` (cấu hình tập trung tại `src/config/site.ts` để dễ đổi phụ đề/nhãn nếu cần).
- **Ngôn ngữ giao diện chính:** Tiếng Việt (`vi`).
- **Người dùng duy nhất:** Chủ sở hữu thư viện cá nhân trên trình duyệt.
  - **Không đăng nhập / tài khoản.**
  - **Không có vai trò Quản trị viên (Admin), Backend API hay Database ngoài.**
  - **Loại bỏ khỏi phạm vi:** Chức năng gửi yêu cầu thêm sách lên server (`FR-11` gốc), modal mã QR ủng hộ (`FR-12` gốc) và thông báo miễn trừ công khai ở footer.
- **Quy mô dữ liệu:** Hỗ trợ mượt mà **128+ đầu sách** và khả năng mở rộng tùy ý theo bộ data tĩnh nạp vào code. Toàn bộ số lượng tổng và theo nhóm phải được tính **động** từ dữ liệu thật lúc chạy.

---

## 2. Kiến trúc Giao diện (UI/UX) & Design System

### 2.1. Cấu trúc màn hình chính (Landing / Bookshelf View)
Giao diện chính là SPA một màn hình nền không gian thiên nhiên nhẹ nhàng (bầu trời nắng và thảm cỏ, hoặc biến thể Dark Mode dịu mắt), gồm 5 vùng từ trên xuống dưới:

1. **Header (Đầu trang):**
   - **Trái:** Nhãn thống kê gọn hoặc nút truy cập nhanh (`Sao lưu dữ liệu` / tổng số sách hiện có). *(Không có nút Donate).*
   - **Giữa:** Tiêu đề thương hiệu cá nhân **`Sách của Đăng`** kèm phụ đề nhỏ phía trên hoặc dưới (`TỦ SÁCH CÁ NHÂN`).
   - **Phải:** Tóm tắt tiến độ tổng quan (ví dụ số sách đang đọc / đã đọc, tự ẩn trên màn hình di động hẹp).
2. **Thanh điều hướng nhóm sách (Category Tabs):**
   - Các tab nằm ngang có nền xanh cobalt (`#1F3FB0`) cho tab đang chọn:
     - Tab đầu cố định: `Tất cả`
     - Các tab nhóm trích xuất động từ trường `categoryGroup` trong bộ data (ví dụ với kho sách phổ biến: `Nguyễn Nhật Ánh`, `Văn học Việt Nam`, `Văn học nước ngoài`, hoặc các nhóm có trong bộ data người dùng cung cấp).
     - Tab cuối cố định: `Sách của bạn` (mở lớp phủ thư viện PDF cá nhân `FR-10`).
3. **Khu vực Kệ sách 3D (Bookshelf Carousel):**
   - Hàng ngang các gáy sách đứng 3D (ảnh bìa thu nhỏ phía trên, tên sách dọc, tên tác giả và năm xuất bản phía dưới; nếu sách thiếu ảnh bìa thì render gáy/bìa chữ typography tinh tế).
   - Cuốn đang chọn (active) xoay nhẹ về phía trước để lộ một phần mặt bìa trước; các cuốn xung quanh có phản hồi khi rê chuột.
   - Bên dưới kệ sách: nút điều hướng `←` / `→`, tiêu đề cuốn sách đang chọn và dòng mô tả `Tác giả / Nhóm sách · Năm xuất bản`.
4. **Thanh công cụ nổi phía dưới (Floating Bottom Dock — 2 hàng):**
   - **Hàng 1:** Ô tìm kiếm `Tìm truyện…` (kèm nút xóa `×`), nút `Lọc kệ sách`, nút chuyển giao diện `Sáng / Tối`, bộ đếm thời gian đọc trong phiên (`HH:MM:SS`), nút `Lịch sử đọc sách`.
   - **Hàng 2:** Bộ điều khiển trình phát nhạc nền (`Danh sách phát`, tên bài đang phát, `Bài trước`, `Bài sau`, nút gạt `Bật nhạc`) và nút **`Sao lưu / Khôi phục`** (Export/Import JSON `FR-11`). *(Thay thế cho nút `＋ Yêu cầu sách` cũ).*
5. **Footer (Chân trang):**
   - **Trái:** Nhãn cá nhân gọn (`Sách của Đăng · Thư viện đọc sách cá nhân`).
   - **Phải:** Thông tin trạng thái lưu trữ cục bộ (`Lưu trữ cục bộ trên thiết bị` · `<N> đầu sách`).

### 2.2. Hệ thống thiết kế trực quan (Design Tokens)
- **Kiểu chữ (Typography):**
  - Serif (`Newsreader`): Tiêu đề trang nhã và nội dung văn bản trong trình đọc hai trang.
  - Sans-serif (`Inter Tight`, fallback hệ thống): Nhãn điều khiển, nút bấm, tab và metadata.
- **Bảng màu Sáng (Light Theme):**
  - Nền giấy (`--paper`): `#EDEBE6` | Trang sách (`--sheet`): `#F4F2ED`
  - Chữ chính (`--ink`): `#141414` | Chữ phụ (`--muted`): `#6D6A63`
  - Điểm nhấn chính (`--cobalt`): `#1F3FB0`
- **Chủ đề Sáng / Tối (Theme):**
  - Chuyển đổi tức thì ở cả màn hình chính và bên trong trình đọc sách (tối nền popup, chữ trên nền cảnh và đổi trang sách sang tông tối chữ sáng êm mắt).
- **Hiệu ứng & Responsive:**
  - Hiệu ứng mở/đóng chi tiết sách dạng vòng tròn (`clip-path`), lật trang 3D trong trình đọc, equalizer 3 chấm ở trình phát nhạc.
  - Hỗ trợ `prefers-reduced-motion: reduce`.
  - Bố cục thích ứng tốt cho Desktop, Tablet, Mobile (`< 767px`, `< 430px`) và màn hình xoay ngang (Landscape).

---

## 3. Đặc tả Yêu cầu Chức năng (Functional Requirements)

| Mã | Tên chức năng | Mô tả ngắn | Độ ưu tiên |
|---|---|---|---|
| `FR-01` | Modal Sách mới thêm | Hiển thị sách có cờ `isNew` khi vừa vào trang (tự ẩn nếu không có) | Trung bình |
| `FR-02` | Kệ sách 3D & Phân nhóm | Duyệt sách theo tab động + `Sách của bạn`, cuộn và chọn trên kệ 3D | Cao |
| `FR-03` | Tìm kiếm & Gợi ý nhanh | Tìm theo từ khóa (hỗ trợ bỏ dấu tiếng Việt), tối đa 6 gợi ý trực tiếp | Cao |
| `FR-04` | Bộ lọc nâng cao & Chọn ngẫu nhiên | Lọc đa tiêu chí và gợi ý ngẫu nhiên một cuốn trong tập lọc | Cao |
| `FR-05` | Chi tiết sách, Trạng thái & Chấm sao | Xem thông tin, gán trạng thái đọc và đánh giá 1–5 sao | Cao |
| `FR-06` | Trình đọc sách 2 trang | Lazy-load nội dung, hiệu ứng lật trang 3D, zoom 8 mức, thanh tiến độ | Rất cao |
| `FR-07` | Mục lục, Đánh dấu trang & Tô màu | Điều hướng theo chương, bookmark trang và highlight văn bản | Cao |
| `FR-08` | Lịch sử đọc & Bộ đếm thời gian phiên | Lưu sách đã mở gần đây và đếm thời gian đọc `HH:MM:SS` | Trung bình |
| `FR-09` | Trình phát nhạc nền đọc sách | Phát nhạc nền mặc định (nếu có) và hỗ trợ nạp nhiều file MP3 cá nhân | Trung bình |
| `FR-10` | Thư viện sách cá nhân (PDF) | Tải lên file PDF, ảnh bìa và lưu đọc cục bộ qua `IndexedDB` | Trung bình |
| `FR-11` | Sao lưu & Khôi phục JSON | Xuất/Nhập toàn bộ dữ liệu cá nhân (tiến độ, bookmark, highlight, sao) | Cao |

### Chi tiết từng yêu cầu

#### `FR-01`: Modal Sách mới thêm (On-Load Modal)
- Chỉ tự động hiển thị khi dữ liệu có ít nhất 1 cuốn được gắn cờ `isNew: true`.
- Hiển thị tối đa 5 đầu sách mới kèm nút `Đọc ngay`, nút `Đi đến` (cuộn tới sách trên kệ) và nút `Bỏ qua`.
- **Cải thiện bắt buộc:** Hỗ trợ lưu tùy chọn `"Không hiện lại trong phiên này"` (trong `sessionStorage`) hoặc nút đóng gọn để tránh làm phiền khi reload liên tục.

#### `FR-02`: Kệ sách 3D & Điều hướng nhóm sách
- Danh sách tab phân nhóm lấy động từ dữ liệu thật (`Tất cả` + các `categoryGroup` duy nhất + `Sách của bạn`).
- Cho phép cuộn ngang (chuột/trackpad/vuốt chạm), rê chuột làm nổi bật gáy sách, hoặc dùng phím mũi tên / nút `←` `→`.
- **Quy tắc tương tác bắt buộc (Fix bug bản tham chiếu):**
  - Nhấp vào cuốn sách **đang ở tâm điểm (active)** -> Mở ngay Modal Chi tiết sách (`FR-05`).
  - Nhấp vào cuốn sách **nằm hai bên** -> Cuộn mượt để đưa cuốn đó vào tâm điểm.

#### `FR-03`: Tìm kiếm nhanh & Gợi ý tự động
- Nhập từ khóa vào ô `Tìm truyện…`, hiển thị danh sách `Gợi ý truyện` tối đa **6 kết quả** phù hợp nhất (tên sách, tác giả, năm xuất bản).
- Hỗ trợ nút `×` xóa nhanh từ khóa và phím `Escape` đóng danh sách gợi ý.
- Tìm kiếm không phân biệt hoa/thường và **bắt buộc hỗ trợ bỏ dấu tiếng Việt** (dùng trường `searchText` chuẩn hóa từ `BookDataAdapter`).

#### `FR-04`: Bộ lọc nâng cao & Chọn ngẫu nhiên
- Popover `Lọc kệ sách` gồm:
  - **Trạng thái đọc (pill):** `Tất cả`, `🔖 Muốn đọc`, `📖 Đang đọc`, `✅ Đã đọc`, `Chưa đánh dấu`.
  - **Thể loại (dropdown):** `Mọi thể loại` + danh sách thể loại trích xuất động từ dữ liệu thật.
  - **Tác giả (dropdown):** `Mọi tác giả` + danh sách tác giả trích xuất động từ dữ liệu thật.
  - **Nhóm (dropdown):** `Mọi nhóm` (giá trị chuẩn hóa rỗng/all) + danh sách nhóm sách động + `Sách của bạn`. *(Fix bug bản tham chiếu: chọn về mặc định `Mọi nhóm` không được trả về 0 quyển).*
  - **Khoảng năm xuất bản:** `Từ năm` — `Đến năm`.
- Hiển thị tổng số sách khớp (`X / Tổng quyển phù hợp`) và danh sách xem trước tối đa **80 quyển** (nếu vượt 80, hiển thị gợi ý lọc thêm để thu hẹp).
- Khi có ít nhất 1 bộ lọc đang bật, nút `Lọc kệ sách` hiển thị chấm đỏ báo hiệu.
- Nút `🎲 Chọn giúp tôi một quyển`: Đóng popover, chọn ngẫu nhiên 1 cuốn trong tập kết quả đang lọc, cuộn kệ tới cuốn đó và hiện toast `🎲 Gợi ý cho bạn: <Tên sách> — <Tác giả> (<Năm>)`.
- Nút `Xóa lọc`: Khôi phục toàn bộ tiêu chí về mặc định.

#### `FR-05`: Modal Chi tiết sách, Trạng thái đọc & Chấm sao
- **Cột trái:** Kicker `Tác giả / Thể loại`, tiêu đề sách (`h2`), dòng `Năm xuất bản / Định dạng`, nhóm nút `Trạng thái đọc` (`🔖 Muốn đọc`, `📖 Đang đọc`, `✅ Đã đọc`), nhóm nút `Chấm sao` (`1 sao`–`5 sao` + `Bỏ sao`), tóm tắt nội dung + tên tác giả in nghiêng, nút CTA `Đọc ngay` (hoặc `Đọc tiếp từ trang X` nếu đã có tiến độ).
- **Cột phải:** Ảnh bìa sách kích thước lớn (hoặc bìa chữ tạo tự động nếu data thiếu ảnh).
- Mỗi cuốn tối đa 1 trạng thái đọc (bấm lại trạng thái đang chọn để bỏ chọn); thay đổi trạng thái và chấm sao lưu ngay vào `localStorage` và đồng bộ tức thì với bộ lọc `FR-04`.

#### `FR-06`: Trình đọc sách hai trang (Interactive Book Reader)
- Khi bấm `Đọc ngay`, gọi `loadBookContent(bookId)` từ Adapter (lazy-load module sách hoặc lấy dữ liệu trang đã nạp) và mở trình đọc toàn màn hình; nếu người dùng đã đọc trước đó, khôi phục về `lastPage`.
- Hiển thị dạng sách mở **2 trang đối diện** có bóng gáy ở giữa và hiệu ứng lật trang 3D (`Trang trước` / `Trang sau`), hỗ trợ phím mũi tên trái/phải và `Escape` để đóng.
- **Thu phóng 8 mức rời rạc:** `85%`, `100%`, `115%`, `130%`, `150%`, `175%`, `200%`, `250%`. Vô hiệu hóa `A −` tại `85%`, vô hiệu hóa `A +` tại `250%`, bấm vào số `%` đặt lại `100%`.
- **Thanh tiến độ đọc:** `Trang X – Y / Tổng · Z% · còn ~H giờ M phút` (ước tính dựa trên số chữ/trang còn lại, tốc độ đọc mặc định ~250 từ/phút).
- **Responsive Mobile (`< 768px`):** Tự động chuyển sang chế độ **1 trang đơn** trên màn hình dọc hẹp để chữ đủ lớn, dễ đọc.
- Có nút chuyển **Sáng / Tối** và bộ đếm thời gian phiên ngay trên thanh điều khiển trình đọc.

#### `FR-07`: Mục lục, Đánh dấu trang (Bookmark) & Tô màu (Highlight)
- **Mục lục (`Mục lục`):** Nhảy về cặp trang giới thiệu & danh sách chương (trang đầu sách). Trang trái hiển thị tóm tắt; trang phải hiển thị thẻ tóm tắt các trang đã đánh dấu (nếu có) và danh sách chương đánh số (`01 · Tên chương`). Bấm vào chương để nhảy thẳng tới trang bắt đầu chương đó.
- **Đánh dấu trang (`Đánh dấu trang`):** Bật/tắt bookmark cho trang/cặp trang đang mở; cập nhật số lượng trên nút `📑`.
- **Tô màu ghi chú (Highlight):** Bôi đen đoạn văn bản trên trang sách -> hiện popover chọn màu tô -> lưu lại vị trí và nội dung đoạn văn đã chọn.
- **Hộp thoại `Tô màu, dấu trang và tiến độ` (`📑`):**
  - Gồm 3 tab: `🖍 Tô`, `🔖 Trang`, `📊 Tiến độ`.
  - **Fix bug bản tham chiếu (Bắt buộc):** Thanh tab phải đặt gọn **bên trong header của dialog** (không dùng vị trí âm đẩy lên trên viền dialog gây click-outside làm đóng hộp thoại).
  - Nút `Xóa tất cả` phải có hộp thoại/bước xác nhận trước khi xóa dữ liệu tô màu và bookmark của cuốn đang đọc.

#### `FR-08`: Lịch sử đọc & Bộ đếm thời gian phiên
- Đồng hồ đếm liên tục theo định dạng `HH:MM:SS` từ đầu phiên truy cập trên cả dock chính và thanh điều khiển trình đọc.
- Popover `Lịch sử đọc sách` (`Đọc gần đây · Chỉ lưu trên thiết bị này`): liệt kê các sách đã mở gần đây (ảnh bìa thu nhỏ, tên sách, trang đang đọc, thời gian mở), nhấp vào để mở lại ngay.

#### `FR-09`: Trình phát nhạc nền đọc sách (Ambient Music Player)
- Công tắc `Bật nhạc`, nút `Bài trước` / `Bài sau`, hiển thị tên bài hát + chỉ số bài + hiệu ứng equalizer 3 chấm khi đang phát.
- Popover `Danh sách phát`:
  - Hiển thị các track mặc định (nếu thư mục `public/audio/` có sẵn file nhạc cấu hình trong `siteConfig`; nếu chưa có sẵn file audio nào, hiển thị hướng dẫn gọn và nút `+ Thêm nhạc MP3` mà không báo lỗi giả).
  - Nút **`+ Thêm nhạc MP3`**: Chọn một hoặc nhiều file `.mp3` từ thiết bị cá nhân, kiểm tra định dạng, lưu vào `IndexedDB` để tự động có mặt lại ở các lần mở web sau.

#### `FR-10`: Thư viện sách cá nhân (`Sách của bạn` — Local PDF)
- Mở lớp phủ `Thư viện sách cá nhân` khi chọn tab `Sách của bạn`.
- Biểu mẫu thêm sách: chọn file `.pdf` (bắt buộc), chọn ảnh bìa (tùy chọn), nhập Tên sách và Tên tác giả.
- Kiểm tra MIME/đuôi file và lưu nhị phân vào `IndexedDB`.
- Đọc trực tiếp PDF trong ứng dụng (qua `pdfjs-dist` render trang hoặc viewer tích hợp hỗ trợ lật trang/zoom); hiển thị empty state rõ ràng khi chưa có sách.

#### `FR-11`: Sao lưu & Khôi phục Dữ liệu cá nhân (Export / Import JSON)
- Cho phép xuất toàn bộ trạng thái đọc (`USER_BOOK_STATE`), bookmark, highlight, lịch sử đọc và cấu hình giao diện ra 1 file `.json` (có `schemaVersion` và `exportedAt`).
- Cho phép nhập lại file `.json` đã sao lưu (tùy chọn ghi đè hoặc gộp thông minh theo timestamp mới nhất), có validate cấu trúc trước khi ghi đè `localStorage`.

---

## 4. Yêu cầu Phi chức năng (Non-Functional Requirements)

- **`NFR-01` Hiệu năng:** Không nhồi toàn bộ nội dung chữ của 128+ cuốn sách vào bundle JavaScript khởi đầu nếu dữ liệu được tách rời; dùng `import.meta.glob` / dynamic `import()` để lazy-load theo `bookId`. Sử dụng ảnh bìa nén tối ưu và `loading="lazy"` cho các ảnh ngoài viewport.
- **`NFR-02` Tương thích & Responsive:** Chạy ổn định trên Chrome, Edge, Safari, Firefox hiện đại; hỗ trợ Desktop, Tablet, Mobile (`390×844`) và Landscape.
- **`NFR-03` Lưu trữ & Quyền riêng tư:** Hoạt động 100% offline/local trên trình duyệt (sau khi tải tài nguyên tĩnh); trạng thái nhẹ lưu `localStorage`, file PDF/MP3 cá nhân lưu `IndexedDB`.
- **`NFR-04` Bảo mật & Vệ sinh dữ liệu:** Escape/sanitize toàn bộ chuỗi người dùng nhập hoặc HTML nội dung chương (ví dụ dùng DOMPurify hoặc parser an toàn nếu nội dung chương là HTML) để ngăn XSS; kiểm tra MIME type khi upload PDF/MP3.
- **`NFR-05` Khả năng tiếp cận (A11y):** Toàn bộ `aria-label`, `role="dialog"`, `role="tablist"`, `role="combobox"` đồng nhất **tiếng Việt ngữ nghĩa sách** (Kệ sách, Chi tiết sách, Sách trước, Sách sau); điều hướng được bằng `Tab`, `Enter`, `Escape`, phím mũi tên.

---

## 5. Danh sách 5 lỗi từ bản tham chiếu phải phòng tránh tuyệt đối

1. **Vị trí tab trong dialog Ghi chú/Dấu trang (`FR-07`):** Cố định thanh tab bên trong dialog container, tuyệt đối không định vị âm (`top: -...`) ra ngoài vùng click của dialog.
2. **Giá trị mặc định của bộ lọc Nhóm (`FR-04`):** Chuẩn hóa giá trị `Tất cả` / `Mọi nhóm` về cùng một mã định danh (ví dụ `""` hoặc `"all"`), tránh lệch chuỗi làm kết quả lọc trả về `0`.
3. **Click bìa sách ở tâm điểm kệ 3D (`FR-02`):** Kiểm tra `index === activeIndex` -> mở Chi tiết sách; `index !== activeIndex` -> cuộn vào tâm điểm.
4. **Sót thuộc tính ARIA phim ảnh (`NFR-05`):** Rà soát toàn bộ mã nguồn đảm bảo không tồn tại các nhãn như `Filmography`, `Film detail`, `Previous film`, `Next film`.
5. **Mất dữ liệu khi xóa cache (`FR-11`):** Bắt buộc có chức năng Export/Import JSON để người dùng tự sao lưu tiến độ đọc cá nhân.
