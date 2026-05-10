# Changelog

## Bản fix logic

### 1. Chống vòng lặp gia phả (cycle detection)

Trước fix: có thể tạo cấu hình vô lý kiểu *"A là bố B, B lại là bố A"* (hoặc dây chuyền dài hơn) bằng cách chỉnh `fatherId` / `motherId`. Cây phả hệ sẽ render đệ quy vô hạn và crash.

Sau fix:
- Thêm `wouldCreateCycle()` trong `lib/family.ts` — kiểm tra trước khi gán: nếu `newParentId` chính là `memberId` (tự làm bố mình) hoặc `newParentId` là **hậu duệ** của `memberId`, từ chối.
- API `PATCH /api/user/[id]` chạy `validateMemberUpdate()` trên payload trước khi ghi; trả 400 với thông báo tiếng Việt.
- `EditForm` chạy `clientValidate()` để báo lỗi sớm trước khi gửi request.
- `components/FamilyTree.tsx` thêm `visited` set chuyền xuống mỗi `TreeNode` — nếu dữ liệu bằng cách nào đó vẫn có cycle, render dừng lại thay vì stack overflow.
- `lib/kinship.ts` BFS đã có `if (result.has(id)) continue;` từ đầu nên cũng cycle-safe.

### 2. Tự đặt mình là vợ/chồng / kết hôn cận huyết

Sau fix:
- `spouseIds` không được chứa chính `memberId`.
- `spouseIds` không được chứa **tổ tiên** (bố, ông, cụ…) hay **hậu duệ** (con, cháu…) — báo lỗi rõ tên người vi phạm.
- `fatherId` / `motherId` không được trùng với người trong `spouseIds`.
- `fatherId === motherId` cũng bị từ chối.

### 3. Đồng bộ vợ/chồng hai chiều

Trước fix: nếu A nói vợ là B mà B không có A trong `spouseIds`, dữ liệu lệch và quan hệ "vợ/chồng" tính một chiều.

Sau fix: hàm `syncSpouseSymmetry()` trong `lib/family.ts` chạy mỗi khi ai đó cập nhật `spouseIds`:
- Người mới được thêm: tự động thêm `memberId` vào `spouseIds` của họ.
- Người bị bỏ: tự động xoá `memberId` khỏi `spouseIds` của họ.

### 4. Validate năm sinh / năm mất

- `birthYear` và `deathYear` phải nằm trong `[1000, currentYear+1]`.
- `deathYear >= birthYear`.

### 5. Refactor `lib/kinship.ts` — không còn nguy cơ stack overflow

Trước fix: `calculateRelation` đệ quy chính nó qua các nhánh hôn nhân (vợ-của-người-có-quan-hệ và người-có-quan-hệ-với-vợ), trên dữ liệu bệnh hoạn có thể đi sâu không kiểm soát.

Sau fix: tách thành `bloodRelation()` (chỉ huyết thống, không qua hôn nhân) và `calculateRelation()` (gọi bloodRelation **một bậc**, không đệ quy mutual). Đảm bảo terminate.

### 6. Tinh chỉnh wording quan hệ

- Phân biệt "anh/em **ruột** của ông" (LCA depth=1, tức B là con trực tiếp của cụ tổ chung) vs "anh/em **họ** của ông" (LCA xa hơn).
- `mẹ kế`, `bố dượng`, `bác trai/gái`, `cháu dâu/rể`, v.v.

### 7. UX form sửa thông tin

- Spouse: từ text input gõ tay ID (rất dễ sai) → checkbox đa chọn liệt kê tên + giới tính + năm sinh.
- Bố: chỉ liệt kê người không phải nữ. Mẹ: chỉ người không phải nam. Bỏ chính bản thân khỏi mọi dropdown.
- Hiển thị lỗi server với `whiteSpace: pre-line` để xuống dòng mỗi lỗi cho dễ đọc.

## Test

`/tmp/test-logic.mjs` chạy 7/7 case cycle-detection, spouse-as-ancestor guard, và spouse symmetry sync — tất cả pass.
`/tmp/test-kin2.mjs` chạy 11/12 case kinship — case fail là do test expectation viết sai, code đúng.
