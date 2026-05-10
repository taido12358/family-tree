# 🌌 Gia Phả — Cinematic Family Tree (v0.2)

Web app phả hệ gia đình với UI **dark heritage cyberpunk** — kết hợp sang trọng dòng họ (font Playfair Display, accent vàng kim, avatar gradient) với neon futuristic (glassmorphism, animated SVG glowing connectors, particle galaxy background, custom cursor).

## ✨ Tính năng

- 🌳 Cây phả hệ tương tác — nhấn vào người → bố/mẹ chẽ thành 2 nhánh chạy lên trên với SVG glowing lines + spring animation
- 📖 Trang tiểu sử với avatar gradient, lifespan, quan hệ gia đình
- 🔗 Tìm quan hệ tiếng Việt — A gọi B là gì (bố, mẹ, ông nội, bà ngoại, bác, chú, cô, dì, cậu, anh, chị, em, vợ, chồng, cháu, chắt, anh em họ, bố vợ/chồng, mẹ kế, dượng, thím, mợ, dâu/rể…)
- 🔐 Đăng nhập + phân quyền — chủ tài khoản, vợ/chồng, bố/mẹ, hoặc admin
- ⚠️ Validate logic — chống vòng lặp gia phả, tự đặt mình làm bố/mẹ/vợ chồng, kết hôn cận huyết, năm sinh/mất bất hợp lý
- 🔄 Đồng bộ vợ/chồng hai chiều tự động

## 🎨 Visual Stack

- Background: animated mesh gradient + canvas particle field + 3 aurora orbs blur lớn xoay chậm + grain noise + spotlight follow cursor
- Custom cursor: glowing dot + ring follower với spring physics (auto-disable trên touch)
- Loading screen: SVG tree path drawing animation với glow filter (~1.9s)
- Cards: glassmorphism + neon border + hover tilt + shine sweep + rotating gradient ring quanh avatar
- Connectors: SVG path với gradient stroke (gold → violet → cyan) + glow filter + animated draw
- Typography: Playfair Display (display, heritage) + Be Vietnam Pro (body, hỗ trợ tiếng Việt) + JetBrains Mono (mono labels)
- Palette: void `#050010`, violet `#a78bfa`, cyan `#67e8f9`, heritage gold `#fbbf24`, rose `#f472b6`

## 🛠 Công nghệ

Next.js 14 (App Router) + TypeScript + TailwindCSS + Framer Motion + Canvas 2D + SVG. bcryptjs + jose cho auth.

## 🚀 Cài đặt

```bash
unzip family-tree.zip
cd family-tree
npm install
npm run dev   # http://localhost:3000
```

## 🔑 Tài khoản mẫu

Mật khẩu chung: **`secret`**

- `hung@example.com` — sửa nhánh ông Hùng + con cái
- `lan@example.com` — sửa nhánh bà Lan + con cái
- `tai@example.com` — sửa nhánh anh Tài + con
- `admin@example.com` — admin, sửa tất cả

## 🎬 Lưu ý visual

- Custom cursor tự động tắt trên thiết bị cảm ứng / mobile
- `@property --angle` cần Chrome/Safari/Firefox 128+; trên trình duyệt cũ border vẫn hiện nhưng không xoay
- Particle count tự điều chỉnh theo kích thước màn hình (max 140 sao)
- Loading screen ~1.9s rồi fade — chỉ hiện khi load lần đầu

## 📁 Cấu trúc

```
app/
  api/                # auth + user CRUD routes
  kinship/            # trang tìm quan hệ
  login/              # trang đăng nhập
  user/[id]/          # chi tiết + edit
  globals.css         # Tailwind + custom animations
  layout.tsx          # bg + cursor + loader + header wrapper
  page.tsx + HomeClient.tsx
components/
  GalaxyBackground.tsx
  CustomCursor.tsx
  LoadingScreen.tsx
  FamilyTree.tsx
  MemberCard.tsx
  BioPanel.tsx
  Header.tsx
lib/
  storage.ts          # đọc/ghi JSON (server-only)
  family.ts           # canEdit, validate, sync, cycle detection
  kinship.ts          # tính xưng hô tiếng Việt
  auth.ts             # JWT cookie
  avatar.ts           # gradient + initials deterministic
  types.ts
data/
  family.json         # 14 thành viên 4 đời
  auth.json           # 4 tài khoản hashed
```

## 🚧 Hướng phát triển tiếp

- React Three Fiber: family tree hologram 3D
- GSAP ScrollTrigger: parallax timeline cuộc đời mỗi người
- Modal chi tiết fullscreen với cinematic transition
- Upload ảnh avatar thật
- Realtime collab edit
