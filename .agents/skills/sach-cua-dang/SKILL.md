---
name: sach-cua-dang
description: >-
  Personal 3D bookshelf and interactive two-page book reader specification for
  "Sách của Đăng" (React + Vite + Tailwind CSS, Zero-DB in-code static data).
  Use when building, customizing, importing a 128+ book dataset into, fixing UI
  interactions, or verifying the Sách của Đăng local-first reading web app.
---

# Sách của Đăng — Personal 3D Bookshelf Reader Skill

Hướng dẫn kiến trúc, đặc tả chức năng và hợp đồng nạp dữ liệu cho ứng dụng web đọc sách cá nhân **Sách của Đăng** — SPA kệ sách 3D tương tác và trình đọc sách hai trang chạy hoàn toàn trên client (**React + Vite + Tailwind CSS**, không backend, không database ngoài).

## Nguyên tắc cốt lõi (Personal & Zero-DB)

1. **Dùng riêng cho cá nhân (Personal-First):**
   - Không đăng nhập, không phân quyền Admin/CMS, không backend API.
   - Đã loại bỏ các thành phần công cộng của bản tham chiếu: biểu mẫu yêu cầu thêm sách (`FR-11` gốc), modal mã QR ủng hộ (`FR-12` gốc) và nhãn miễn trừ công khai.
   - Thay bằng tính năng **Sao lưu & Khôi phục JSON** để bảo toàn toàn bộ tiến độ đọc, đánh dấu, tô màu và thư viện cá nhân ngay trên thiết bị.
2. **Không Database ngoài — Chạy thẳng trên Code:**
   - Không khởi tạo database ngoài và **không tạo dữ liệu giả/dữ liệu mẫu** trong codebase khi chưa có bộ dữ liệu thật của người dùng.
   - Toàn bộ dữ liệu sách (128+ cuốn do người dùng cung cấp) được đặt dưới dạng module tĩnh trong mã nguồn (`src/data/raw/`) và chuẩn hóa qua một lớp duy nhất là **`BookDataAdapter`** (`src/data/adapter.ts`).
   - Giao diện, kệ sách 3D, bộ đếm số lượng, tab phân nhóm, tìm kiếm, bộ lọc và trình đọc sách **không được hardcode số lượng hay dữ liệu sách**, chỉ tiêu thụ dữ liệu đã chuẩn hóa từ Adapter để khi nạp hoặc thay bộ data mới, ứng dụng chạy thẳng mà không cần sửa code logic hay UI.
3. **Tương thích hệ thống Skill sẵn có trong Workspace:**
   - Phối hợp cùng [ui-styling](../ui-styling/SKILL.md), [ui-ux-pro-max](../ui-ux-pro-max/SKILL.md) và [design-system](../design-system/SKILL.md) khi thiết kế component, token Tailwind CSS và hiệu ứng.

## Tài liệu tham chiếu chi tiết

Đọc đúng tài liệu cần thiết theo tác vụ đang làm:

- **Đặc tả chức năng, UI/UX, NFR và danh sách lỗi cần tránh:** [functional-specs.md](./references/functional-specs.md)
- **Kiến trúc dữ liệu tĩnh trong code, Data Adapter, Lazy-load & Persistence:** [data-adapter-contract.md](./references/data-adapter-contract.md)

## Quy trình triển khai & Nạp dữ liệu

### Giai đoạn 1: Khung ứng dụng (Trước hoặc khi nhận Data)
1. Thiết lập dự án **React + Vite + Tailwind CSS** (TypeScript khuyến nghị) với các token chữ (`Newsreader`, `Inter Tight`), bảng màu giấy (`#EDEBE6`, `#F4F2ED`, `#141414`, `#6D6A63`, `#1F3FB0`) và Dark Mode theo [functional-specs.md](./references/functional-specs.md).
2. Cài đặt lớp `BookDataAdapter` và kiểu dữ liệu nội bộ (`BookMeta`, `BookContent`, `SiteConfig`) theo [data-adapter-contract.md](./references/data-adapter-contract.md). Khi chưa có data, trả về mảng rỗng sạch sẽ cùng trạng thái chờ dữ liệu (không nhồi mock data).
3. Xây dựng đầy đủ các màn hình & tương tác (`FR-01` đến `FR-11` bản cá nhân) và áp dụng toàn bộ 5 điểm sửa lỗi đã ghi nhận từ bản tham chiếu.

### Giai đoạn 2: Nạp bộ dữ liệu 128+ cuốn sách từ người dùng
1. Đặt nguyên bộ file data của người dùng vào `src/data/raw/` (giữ nguyên cấu trúc/schema gốc của người dùng, không bắt người dùng sửa tay từng cuốn).
2. Chỉ cập nhật ánh xạ trường trong `src/data/adapter.ts` để chuyển đổi schema gốc sang `BookMeta` + cơ chế lazy-load nội dung chương (`loadBookContent(bookId)` via `import.meta.glob` hoặc dynamic `import()`).
3. Tự động suy xuất (derive) danh sách nhóm sách (`categoryGroup`), tác giả, thể loại, khoảng năm và bộ đếm số lượng trực tiếp từ dữ liệu thật.
4. Kiểm thử lại luồng nạp data: không sửa bất kỳ component React nào ở bước này.

## Danh sách kiểm tra xác minh (Verification Checklist)

Sau khi dựng ứng dụng hoặc sau khi nạp bộ data 128+ cuốn sách, kiểm tra bắt buộc các điểm sau:

- [ ] **Build & Typecheck:** `npm run build` thành công, không lỗi TypeScript và nội dung sách được tách chunk / lazy-load thay vì gộp hết vào entry bundle nếu dữ liệu lớn.
- [ ] **Dữ liệu động 100%:** Số lượng sách tổng và theo từng nhóm/tab khớp đúng với bộ data vừa nạp; không còn số cứng hay nội dung giả.
- [ ] **Tương tác Kệ sách 3D (`FR-02`):** Nhấp vào sách hai bên -> cuộn vào tâm điểm; nhấp vào sách đang ở tâm điểm -> mở modal Chi tiết sách.
- [ ] **Bộ lọc & Tìm kiếm (`FR-03`, `FR-04`):** Tìm kiếm tiếng Việt có dấu lẫn không dấu trả về tối đa 6 gợi ý; chọn lại `Mọi nhóm` / `Tất cả` trong dropdown Nhóm vẫn lọc đúng toàn bộ sách (không trả về 0).
- [ ] **Trình đọc & Ghi chú (`FR-06`, `FR-07`):** Zoom 8 mức (`85%`–`250%`), lật trang 3D, thanh tab trong hộp thoại `Tô màu, dấu trang và tiến độ` nằm gọn trong khung dialog (không bị lệch ra ngoài gây đóng popup khi bấm).
- [ ] **Trình duyệt cá nhân & Sao lưu (`FR-09`, `FR-10`, `FR-11`):** Tải lên PDF/MP3 cục bộ lưu qua `IndexedDB`; Xuất/Nhập JSON khôi phục đầy đủ trạng thái đọc, sao, bookmark, highlight và lịch sử đọc.
- [ ] **A11y & Cá nhân hóa (`NFR-05`):** Toàn bộ `aria-label` là tiếng Việt đúng ngữ cảnh sách (không còn từ khóa phim ảnh như `Filmography`/`Film`); tiêu đề hiển thị `Sách của Đăng`, không còn nút Donate, Yêu cầu sách hay Admin backend.
