# Frontend Redesign Spec — Đà Lạt Souvenir
> Dùng file này làm input cho Codex / AI coding agent.
> Đọc toàn bộ trước khi thay đổi bất kỳ file nào.

---

## 1. PROJECT CONTEXT

**Tên dự án:** `tvk-temp` (package.json) / branding: **Đà Lạt Souvenir**
**Loại:** E-commerce bán quà lưu niệm, đặc sản, combo quà tặng Đà Lạt
**Stack:**
- Next.js 14 App Router + React 18 + TypeScript
- Tailwind CSS + CSS Variables (`app/globals.css`)
- shadcn-like UI primitives trong `components/ui/`
- Framer Motion (animation)
- `next-themes` (light/dark mode toggle)
- Lucide React (icons)
- Zustand persist (auth + cart store)
- Supabase Auth + Database
- Sonner (toast)
- `liquid-glass-react` (đang dùng, sẽ được giảm bớt)

**Route groups:**
```
app/
  (shop)/        ← storefront public
  (auth)/        ← login, register
  account/       ← profile, orders, addresses, wishlist
  admin/         ← quản lý sản phẩm, đơn hàng, khuyến mãi
```

**Component folders:**
```
components/
  ui/            ← Button, Input, Card, Table, Dialog, Sheet, Badge...
  shop/          ← Header, Footer, ProductCard, CartDrawer, CheckoutModal
  admin/         ← AdminSidebar, ProductSheet, OrderDetailDrawer, RevenueChart
  auth/          ← CustomerAreaGuard, AdminGuard
```

---

## 2. MỤC TIÊU REDESIGN

Chuyển toàn bộ giao diện từ tông **xanh rêu + terracotta** (hiện tại) sang **Sky Blue + White** (mới).

**Nguyên tắc:**
- Token-first: thay đổi qua CSS variables, không sửa rải rác từng class
- Một design language duy nhất: bỏ song song Glass vs shadcn
- Mobile-first thực sự: tối ưu hiển thị trên màn 375px–430px
- Modern & friendly: hover animation, micro-interaction, skeleton loading

---

## 3. TOKEN HỆ THỐNG MỚI (globals.css)

Thay toàn bộ `:root` và `.dark` trong `app/globals.css` bằng:

```css
:root {
  /* Fonts */
  --font-sans:  "Geist Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono:  ui-monospace, "Cascadia Code", monospace;
  --font-serif: "Georgia", ui-serif, serif;

  /* Radius */
  --radius:    0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;

  /* Backgrounds */
  --color-bg:            #f4fbff;
  --color-bg-soft:       #e8f5ff;
  --color-surface:       #ffffff;
  --color-surface-muted: #eef7ff;
  --color-surface-hover: #dff3ff;

  /* Borders */
  --color-border:        rgba(2, 132, 199, 0.14);
  --color-border-focus:  rgba(14, 165, 233, 0.55);
  --color-border-hover:  rgba(2, 132, 199, 0.30);
  --color-border-strong: rgba(2, 132, 199, 0.45);

  /* Text */
  --color-text-primary:   #0d2136;
  --color-text-secondary: #3d5a72;
  --color-text-tertiary:  #6b8499;
  --color-text-disabled:  #a8bfce;

  /* Accent — Sky Blue */
  --color-accent:        #0ea5e9;
  --color-accent-hover:  #0284c7;
  --color-accent-active: #0369a1;
  --color-accent-light:  #e0f2fe;
  --color-accent-text:   #075985;

  /* Semantic */
  --color-success:       #10b981;
  --color-success-light: #d1fae5;
  --color-success-text:  #065f46;

  --color-warning:       #f59e0b;
  --color-warning-light: #fef3c7;
  --color-warning-text:  #92400e;

  --color-error:         #ef4444;
  --color-error-light:   #fee2e2;
  --color-error-text:    #991b1b;

  /* Shadows */
  --shadow-sm:        0 1px 3px rgba(14, 165, 233, 0.08);
  --shadow-md:        0 4px 16px rgba(14, 165, 233, 0.12);
  --shadow-lg:        0 8px 32px rgba(14, 165, 233, 0.16);
  --shadow-card:      0 2px 12px rgba(2, 132, 199, 0.08);
  --shadow-card-hover:0 8px 28px rgba(14, 165, 233, 0.18);

  /* Overlay */
  --color-overlay: rgba(7, 89, 133, 0.45);
}

.dark {
  --color-bg:            #07131f;
  --color-bg-soft:       #0b1c2c;
  --color-surface:       #0f2235;
  --color-surface-muted: #132c42;
  --color-surface-hover: #1a3a55;

  --color-border:        rgba(186, 230, 253, 0.12);
  --color-border-focus:  rgba(56, 189, 248, 0.50);
  --color-border-hover:  rgba(186, 230, 253, 0.25);
  --color-border-strong: rgba(186, 230, 253, 0.22);

  --color-text-primary:   #e8f6ff;
  --color-text-secondary: #93bcd4;
  --color-text-tertiary:  #5e8aa3;
  --color-text-disabled:  #3a637a;

  --color-accent:        #38bdf8;
  --color-accent-hover:  #7dd3fc;
  --color-accent-active: #bae6fd;
  --color-accent-light:  #0d2f45;
  --color-accent-text:   #7dd3fc;

  --color-success:       #34d399;
  --color-success-light: #064e3b;
  --color-success-text:  #a7f3d0;

  --color-warning:       #fbbf24;
  --color-warning-light: #451a03;
  --color-warning-text:  #fde68a;

  --color-error:         #f87171;
  --color-error-light:   #450a0a;
  --color-error-text:    #fecaca;

  --shadow-sm:        0 1px 3px rgba(0,0,0,0.3);
  --shadow-md:        0 4px 16px rgba(0,0,0,0.4);
  --shadow-lg:        0 8px 32px rgba(0,0,0,0.5);
  --shadow-card:      0 2px 12px rgba(0,0,0,0.35);
  --shadow-card-hover:0 8px 28px rgba(0,0,0,0.5);

  --color-overlay: rgba(0, 20, 40, 0.65);
}
```

**Giữ lại toàn bộ phần còn lại** của `globals.css` hiện tại (base reset, scrollbar, animation utilities...). Chỉ thay `:root` và `.dark`.

---

## 4. TAILWIND CONFIG MỚI (tailwind.config.ts)

Thay `theme.extend.colors` trong `tailwind.config.ts` bằng:

```ts
colors: {
  background: "var(--color-bg)",
  "background-soft": "var(--color-bg-soft)",
  surface: "var(--color-surface)",
  "surface-muted": "var(--color-surface-muted)",
  "surface-hover": "var(--color-surface-hover)",

  border: "var(--color-border)",
  "border-focus": "var(--color-border-focus)",
  "border-hover": "var(--color-border-hover)",
  "border-strong": "var(--color-border-strong)",

  primary: "var(--color-text-primary)",
  secondary: "var(--color-text-secondary)",
  tertiary: "var(--color-text-tertiary)",
  disabled: "var(--color-text-disabled)",

  accent: "var(--color-accent)",
  "accent-hover": "var(--color-accent-hover)",
  "accent-active": "var(--color-accent-active)",
  "accent-light": "var(--color-accent-light)",
  "accent-text": "var(--color-accent-text)",

  success: "var(--color-success)",
  "success-light": "var(--color-success-light)",
  "success-text": "var(--color-success-text)",

  warning: "var(--color-warning)",
  "warning-light": "var(--color-warning-light)",
  "warning-text": "var(--color-warning-text)",

  error: "var(--color-error)",
  "error-light": "var(--color-error-light)",
  "error-text": "var(--color-error-text)",
},
boxShadow: {
  sm:   "var(--shadow-sm)",
  md:   "var(--shadow-md)",
  lg:   "var(--shadow-lg)",
  card: "var(--shadow-card)",
  "card-hover": "var(--shadow-card-hover)",
},
borderRadius: {
  DEFAULT: "var(--radius)",
  md:  "var(--radius-md)",
  lg:  "var(--radius-lg)",
  xl:  "var(--radius-xl)",
  full:"9999px",
},
fontFamily: {
  sans:  ["var(--font-sans)"],
  mono:  ["var(--font-mono)"],
  serif: ["var(--font-serif)"],
},
```

---

## 5. COMPONENT — button.tsx

File: `components/ui/button.tsx`

**Vấn đề hiện tại:** default size `h-8`, nhiều nơi override lên `h-12`, gây lệch visual.

**Yêu cầu mới:**
- Default size: `h-10` (40px)
- Variants: `default` | `outline` | `ghost` | `destructive` | `link`
- Sizes: `sm` (h-8, text-xs) | `md` (h-10, text-sm) — default | `lg` (h-12, text-base)
- Hover effect tất cả variants: `transition-all duration-200`
- Variant `default` (primary CTA):
  - bg: `bg-accent text-white`
  - hover: `hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-md`
  - active: `active:translate-y-0 active:bg-accent-active`
- Variant `outline`:
  - border: `border border-border-hover text-accent`
  - hover: `hover:bg-accent-light hover:border-accent`
- Variant `ghost`:
  - hover: `hover:bg-surface-muted hover:text-accent`
- Disabled: `opacity-40 cursor-not-allowed pointer-events-none`
- Loading state: thêm prop `isLoading?: boolean`, hiện spinner Lucide `Loader2` className `animate-spin`

---

## 6. COMPONENT — input.tsx

File: `components/ui/input.tsx`

**Yêu cầu mới:**
- Height: `h-10` mặc định
- Border: `border border-[--color-border]`
- Background: `bg-surface`
- Text: `text-primary placeholder:text-tertiary`
- Focus: `focus:outline-none focus:ring-2 focus:ring-[--color-border-focus] focus:border-[--color-accent]`
- Transition: `transition-all duration-200`
- Error state (prop `error?: boolean`): `border-error focus:ring-error/30`
- Font-size: **bắt buộc `text-base` (16px)** để tránh iOS auto-zoom khi focus
- Thêm wrapper component `InputField` nhận `label`, `error`, `hint` để dùng trong form

---

## 7. COMPONENT — card.tsx

File: `components/ui/card.tsx`

**Yêu cầu mới:**
- Base: `bg-surface border border-[--color-border] rounded-lg shadow-card`
- Variant `interactive` (dùng cho ProductCard):
  - `cursor-pointer transition-all duration-200`
  - hover: `hover:-translate-y-1 hover:shadow-card-hover hover:border-[--color-border-hover]`
  - Thêm pseudo top-border bằng `before:` hoặc wrapper: khi hover, line xanh 2px slide từ trái sang phải trên top card
- Variant `flat`: không shadow, chỉ border nhạt, dùng cho admin table row, account info

---

## 8. COMPONENT — ProductCard

File: `components/shop/ProductCard.tsx`

**Yêu cầu mới:**
- Dùng Card variant `interactive`
- Image container: `overflow-hidden rounded-t-lg`
- Image: `transition-transform duration-300 group-hover:scale-105`
- Wishlist button: absolute top-right, ẩn mặc định, `opacity-0 group-hover:opacity-100 transition-opacity duration-200`
- Badge sale: `bg-warning text-warning-text` (amber), absolute top-left
- Add-to-cart button (desktop): ẩn mặc định, slide-up từ bottom khi hover:
  ```
  translate-y-full group-hover:translate-y-0 transition-transform duration-200
  ```
- Mobile: nút Add-to-cart hiển thị thường xuyên (không ẩn)
- Price: `text-accent font-semibold`
- Original price (nếu có sale): `line-through text-tertiary text-sm`

---

## 9. COMPONENT — Header (shop)

File: `components/shop/Header.tsx`

**Yêu cầu mới:**

Desktop:
- Background: `bg-surface/80 backdrop-blur-md border-b border-[--color-border]`
- Scroll-aware: khi `scrollY > 60`, thêm `shadow-sm` và tăng `border-[--color-border-strong]`
- Nav links: `text-secondary hover:text-accent transition-colors duration-150`
- Active link: underline `bg-accent` 2px bên dưới, dùng `after:` pseudo
- Logo text: `text-accent font-bold`
- Cart icon: badge số lượng `bg-accent text-white`
- CTA button: variant `default` (sky blue)

Mobile (< `md`):
- Hamburger icon → onClick mở menu
- Menu: `absolute top-full left-0 right-0 bg-surface border-b border-[--color-border] shadow-md`
- Animation: `max-height` transition từ 0 → auto hoặc dùng Framer Motion `AnimatePresence`
- Menu items full-width, padding `py-3 px-6`, border-b giữa items
- Giữ Cart icon + ThemeToggle trên header bar mobile

---

## 10. COMPONENT — AdminSidebar

File: `components/admin/AdminSidebar.tsx`

**Yêu cầu mới:**

Desktop sidebar:
- Background: `bg-sky-900` (dark navy blue — `#0c4a6e`)
- Logo: text trắng
- Nav item: `text-sky-200 hover:bg-sky-800 hover:text-white rounded-md transition-all duration-150`
- Active item: `bg-sky-700 text-white`
- Icon + label layout

Mobile (< `lg`):
- **Ẩn hoàn toàn sidebar**
- Thêm `BottomNavBar` component ở bottom:
  - 4 icon chính: Sản phẩm, Đơn hàng, Khuyến mãi, Hồ sơ
  - Background: `bg-surface border-t border-[--color-border]`
  - Active: icon + label màu accent
  - Safe area: `pb-[env(safe-area-inset-bottom)]`

---

## 11. PAGES — Thứ tự ưu tiên thay đổi

### 11.1 Trang chủ — `app/(shop)/page.tsx`

Sections cần update:
1. **Hero section:**
   - Background gradient: `from-sky-500 to-sky-700`
   - Title: font-bold, text-white, Framer Motion `initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}`
   - Subtitle stagger 0.1s sau title
   - CTA buttons: white + outline-white
   - Decorative circles: `bg-white/10` absolute, pointer-events-none

2. **Category section:**
   - Grid 2 cols mobile, 4 cols desktop
   - Card hover: `-translate-y-1 shadow-md border-accent`
   - Icon: background `bg-accent-light`, màu `text-accent`

3. **Featured products:**
   - Scroll-reveal: `whileInView={{ opacity:1, y:0 }} initial={{ opacity:0, y:24 }} transition={{ staggerChildren: 0.08 }}`
   - Grid 1 col mobile, 2 col sm, 3 col lg

4. **Section xen kẽ:** `bg-background` và `bg-background-soft` thay nhau

### 11.2 Trang sản phẩm — `app/(shop)/products/page.tsx`

- Filter sidebar:
  - Desktop: sticky left sidebar
  - Mobile: ẩn sidebar, thêm nút "Lọc" → mở Sheet từ bottom (`side="bottom"`)
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
- Skeleton loading: hiện khi `isLoading`, layout giống ProductCard thực
- Sort dropdown: dùng `Select` component đã có, style lại với token mới

### 11.3 Chi tiết sản phẩm — `app/(shop)/products/[id]/page.tsx`

- Image gallery:
  - Mobile: swipeable (thêm `touch-action: pan-y`, handle `onTouchStart/End`)
  - Thumbnails: scroll horizontal `overflow-x-auto`
- **Mobile sticky CTA bar:** (quan trọng)
  ```jsx
  // Thêm vào cuối layout mobile, position sticky bottom
  <div className="fixed bottom-0 left-0 right-0 lg:hidden
                  bg-surface/95 backdrop-blur-sm
                  border-t border-[--color-border]
                  p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]
                  flex gap-3">
    <span className="text-xl font-bold text-accent">{price}</span>
    <Button className="flex-1">Thêm vào giỏ</Button>
  </div>
  ```
- Sản phẩm liên quan: horizontal scroll mobile `overflow-x-auto flex gap-4`

### 11.4 Checkout — `app/(shop)/checkout/page.tsx`

- Thêm step indicator 3 bước: Thông tin → Thanh toán → Xác nhận
  ```jsx
  // Steps: array, active step highlighted bằng accent color
  ```
- Mobile form:
  - Input `text-base` (16px) — bắt buộc tránh iOS zoom
  - Order summary: `<details>` collapsible hoặc Accordion ở trên form
  - Submit button: `w-full` trên mobile
- `padding-bottom` đủ để không bị keyboard che trên mobile

### 11.5 Login/Register — `app/(auth)/login/page.tsx` và `register/page.tsx`

- **Bỏ** `LiquidGlassPanel` wrapper
- Thay bằng: `bg-surface border border-[--color-border] rounded-xl shadow-lg p-8`
- Thêm logo + tagline ngắn phía trên form
- Google OAuth button: đúng brand Google (icon + "Đăng nhập với Google")
- Animation mount: `motion.div initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}`
- Page background: `bg-background-soft` với pattern dots nhẹ (CSS radial-gradient)

### 11.6 Account pages — `app/account/`

- Desktop: sidebar nav trái (Profile / Đơn hàng / Địa chỉ / Wishlist)
- Mobile: horizontal scrollable tab bar thay sidebar
  ```jsx
  <div className="flex overflow-x-auto gap-1 border-b border-[--color-border] mb-6">
    {tabs.map(tab => (
      <button className={`whitespace-nowrap px-4 py-2 text-sm font-medium
        border-b-2 transition-colors
        ${active === tab.id
          ? 'border-accent text-accent'
          : 'border-transparent text-secondary hover:text-primary'
        }`}>
        {tab.label}
      </button>
    ))}
  </div>
  ```
- Orders list: timeline style, status badge với màu semantic

---

## 12. ANIMATION UTILITIES

Thêm vào `lib/animations.ts`:

```ts
import { Variants } from "framer-motion"

// Fade + slide lên, dùng cho section scroll-reveal
export const fadeUpVariant: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

// Stagger container cho list items
export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
}

// Scale in nhẹ cho card, modal mount
export const scaleInVariant: Variants = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
}

// Page transition — dùng trong layout shop
export const pageVariant: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15 } },
}
```

Cách dùng trong page:
```tsx
<motion.div
  variants={fadeUpVariant}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-60px" }}
>
  {/* content */}
</motion.div>
```

---

## 13. SKELETON LOADING

Thêm component `components/ui/skeleton.tsx`:

```tsx
// Shimmer skeleton dùng cho ProductCard, order list, admin table
// Màu shimmer: từ surface-muted → surface-hover (sky nhạt)
// Animation: @keyframes shimmer với background-position slide

// ProductCardSkeleton — dùng thay ProductCard khi isLoading
// OrderRowSkeleton — dùng trong danh sách đơn hàng
// AdminTableRowSkeleton — dùng trong admin/products, admin/orders
```

CSS animation shimmer thêm vào `globals.css`:
```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-muted) 25%,
    var(--color-surface-hover) 50%,
    var(--color-surface-muted) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: var(--radius);
}
```

---

## 14. BUG FIXES BẮT BUỘC (làm song song)

| File | Vấn đề | Fix |
|------|--------|-----|
| `app/layout.tsx` | Encoding mojibake tiếng Việt | Lưu lại UTF-8, kiểm tra metadata title/description |
| `app/admin/layout.tsx` | Encoding mojibake | Như trên |
| `lib/mock-data.ts` | Encoding mojibake | Như trên |
| `app/providers.tsx` | Duplicate `<Toaster>` | Xoá instance trong shop layout, giữ 1 trong Providers |
| `app/globals.css` | `.dark img { filter: brightness(...) }` làm ảnh sản phẩm sai màu | Xoá rule này, chỉ apply cho icon nếu cần |
| Toàn bộ `<img>` raw | Không dùng `next/image` | Migrate sang `<Image>` với `sizes` prop phù hợp |

---

## 15. QUY TẮC KHÔNG ĐƯỢC VI PHẠM

1. **Không hard-code màu hex** trong component — chỉ dùng Tailwind token hoặc CSS var
2. **Không thêm class Tailwind màu cũ** như `text-green-700`, `bg-amber-100` làm màu chủ — chỉ dùng cho semantic (warning, sale badge)
3. **Font-size input tối thiểu 16px** — dùng `text-base`, không dùng `text-sm` trong input
4. **Mọi sticky/fixed bottom bar** phải có `pb-[env(safe-area-inset-bottom)]` hoặc `pb-safe`
5. **Không xoá** Zustand stores, guard components, Supabase auth listener
6. **Không đổi** cấu trúc route group `(shop)`, `(auth)`, `account`, `admin`
7. **Framer Motion** chỉ dùng ở shop pages — không áp vào admin để giữ snappy
8. **LiquidGlass** chỉ giữ tối đa ở 1 chỗ trang trí (ví dụ hero banner) — xoá hết ở form/auth

---

## 16. THỨ TỰ THỰC HIỆN

```
Bước 1: globals.css → đổi :root và .dark token
Bước 2: tailwind.config.ts → map colors, shadows, radius
Bước 3: components/ui/button.tsx → chuẩn hoá size + hover
Bước 4: components/ui/input.tsx → focus ring, font-size 16px
Bước 5: components/ui/card.tsx → variant interactive
Bước 6: components/ui/skeleton.tsx → tạo mới
Bước 7: lib/animations.ts → tạo mới
Bước 8: components/shop/ProductCard.tsx → hover effects
Bước 9: components/shop/Header.tsx → scroll-aware, mobile menu
Bước 10: components/admin/AdminSidebar.tsx → mobile bottom nav
Bước 11: app/(shop)/page.tsx → homepage
Bước 12: app/(shop)/products/page.tsx
Bước 13: app/(shop)/products/[id]/page.tsx
Bước 14: app/(shop)/checkout/page.tsx
Bước 15: app/(auth)/login/page.tsx + register/page.tsx
Bước 16: app/account/ các pages
Bước 17: Bug fixes (có thể làm song song từ bước 1)
```

---

*Spec version 1.0 — Đà Lạt Souvenir Frontend Redesign*
