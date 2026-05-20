import type {
  Address,
  Banner,
  Category,
  Order,
  Product,
  Review,
  User,
} from "@/types";

export const CATEGORIES: Category[] = [
  { id: 1, name: "Móc khóa & nam châm", slug: "moc-khoa", productCount: 12, image: "https://picsum.photos/seed/dalat-keychain/200/200" },
  { id: 2, name: "Postcard & tranh in", slug: "postcard", productCount: 8, image: "https://picsum.photos/seed/dalat-postcard/200/200" },
  { id: 3, name: "Túi vải & phụ kiện", slug: "tui-vai", productCount: 6, image: "https://picsum.photos/seed/dalat-totebag/200/200" },
  { id: 4, name: "Đồ len thủ công", slug: "do-len", productCount: 10, image: "https://picsum.photos/seed/dalat-wool/200/200" },
  { id: 5, name: "Bộ quà tặng", slug: "qua-tang", productCount: 5, image: "https://picsum.photos/seed/dalat-gift/200/200" },
];

const p = (id: number, name: string, slug: string, category: Category): Product => ({
  product_id: `mock-${id}`,
  category_id: `mock-cat-${category.id ?? id}`,
  id,
  name,
  slug,
  description: `${name} lấy cảm hứng từ Đà Lạt, phù hợp làm quà tặng, kỷ niệm du lịch hoặc món nhỏ để giữ lại một góc thành phố sương mù.`,
  story: `${name} được chọn theo tinh thần nhẹ nhàng, tinh tế của Đà Lạt, dễ gói quà và dễ mang theo sau mỗi chuyến đi.`,
  price: 65000 + id * 7000,
  comparePrice: 85000 + id * 8000,
  images: [
    `https://picsum.photos/seed/${slug}-1/600/600`,
    `https://picsum.photos/seed/${slug}-2/600/600`,
    `https://picsum.photos/seed/${slug}-3/600/600`,
  ],
  weightGram: 200 + (id % 3) * 50,
  stock: 8 + (id % 7) * 6,
  category,
  avgRating: 4.3 + (id % 5) * 0.1,
  reviewCount: 20 + id * 3,
  tags: id % 2 === 0 ? ["Bán chạy"] : ["Mới"],
  createdAt: `2026-03-${String(20 + (id % 8)).padStart(2, "0")}`,
});

export const PRODUCTS: Product[] = [
  p(1, "Móc khóa ga Đà Lạt vintage", "moc-khoa-ga-da-lat-vintage", CATEGORIES[0]),
  p(2, "Nam châm Langbiang mini", "nam-cham-langbiang-mini", CATEGORIES[0]),
  p(3, "Móc khóa hoa dã quỳ", "moc-khoa-hoa-da-quy", CATEGORIES[0]),
  p(4, "Postcard Hồ Xuân Hương", "postcard-ho-xuan-huong", CATEGORIES[1]),
  p(5, "Bộ tranh in Nhà thờ Con Gà", "bo-tranh-in-nha-tho-con-ga", CATEGORIES[1]),
  p(6, "Sổ tay hành trình Đà Lạt", "so-tay-hanh-trinh-da-lat", CATEGORIES[1]),
  p(7, "Túi vải Đà Lạt mùa sương", "tui-vai-da-lat-mua-suong", CATEGORIES[2]),
  p(8, "Ví canvas hoa cẩm tú cầu", "vi-canvas-hoa-cam-tu-cau", CATEGORIES[2]),
  p(9, "Pin cài biểu tượng Đà Lạt", "pin-cai-bieu-tuong-da-lat", CATEGORIES[2]),
  p(10, "Khăn len handmade pastel", "khan-len-handmade-pastel", CATEGORIES[3]),
  p(11, "Mũ len tai bèo Đà Lạt", "mu-len-tai-beo-da-lat", CATEGORIES[3]),
  p(12, "Găng tay len thêu hoa", "gang-tay-len-theu-hoa", CATEGORIES[3]),
  p(13, "Combo quà Đà Lạt mini", "combo-qua-da-lat-mini", CATEGORIES[4]),
  p(14, "Hộp quà kỷ niệm thành phố sương", "hop-qua-ky-niem-thanh-pho-suong", CATEGORIES[4]),
  p(15, "Set lưu niệm Đà Lạt 5 món", "set-luu-niem-da-lat-5-mon", CATEGORIES[4]),
];

export const REVIEWS: Record<string, Review[]> = Object.fromEntries(
  PRODUCTS.map((product, idx) => [
    product.slug,
    [
      { id: idx * 10 + 1, user: { name: "Nguyễn Văn A" }, rating: 5, comment: "Sản phẩm rất thơm ngon, đóng gói đẹp.", createdAt: "2026-03-10" },
      { id: idx * 10 + 2, user: { name: "Lê Thị B" }, rating: 4, comment: "Giao nhanh, đúng mô tả.", createdAt: "2026-03-12" },
      { id: idx * 10 + 3, user: { name: "Trần Minh C" }, rating: 5, comment: "Sẽ ủng hộ thêm lần sau.", createdAt: "2026-03-15" },
    ],
  ]),
);

const SAMPLE_ADDRESS: Address = {
  id: 1,
  name: "Nguyễn Văn A",
  phone: "0901234567",
  province: "Lâm Đồng",
  district: "TP. Đà Lạt",
  ward: "Phường 1",
  address: "123 Trần Phú",
  isDefault: true,
};

export const ORDERS: Order[] = [
  { id: 1, code: "SLN1001", status: "pending", paymentMethod: "cod", paymentStatus: "unpaid", items: [{ id: 1, product: PRODUCTS[0], quantity: 1, price: PRODUCTS[0].price, subtotal: PRODUCTS[0].price }], subtotal: PRODUCTS[0].price, discount: 0, shippingFee: 30000, total: PRODUCTS[0].price + 30000, shippingAddress: SAMPLE_ADDRESS, createdAt: "2026-03-21" },
  { id: 2, code: "SLN1002", status: "confirmed", paymentMethod: "vnpay", paymentStatus: "paid", items: [{ id: 2, product: PRODUCTS[4], quantity: 2, price: PRODUCTS[4].price, subtotal: PRODUCTS[4].price * 2 }], subtotal: PRODUCTS[4].price * 2, discount: 15000, shippingFee: 0, total: PRODUCTS[4].price * 2 - 15000, shippingAddress: SAMPLE_ADDRESS, createdAt: "2026-03-20" },
  { id: 3, code: "SLN1003", status: "shipping", paymentMethod: "cod", paymentStatus: "unpaid", items: [{ id: 3, product: PRODUCTS[8], quantity: 1, price: PRODUCTS[8].price, subtotal: PRODUCTS[8].price }], subtotal: PRODUCTS[8].price, discount: 0, shippingFee: 30000, total: PRODUCTS[8].price + 30000, shippingAddress: SAMPLE_ADDRESS, createdAt: "2026-03-19" },
  { id: 4, code: "SLN1004", status: "delivered", paymentMethod: "vnpay", paymentStatus: "paid", items: [{ id: 4, product: PRODUCTS[10], quantity: 3, price: PRODUCTS[10].price, subtotal: PRODUCTS[10].price * 3 }], subtotal: PRODUCTS[10].price * 3, discount: 25000, shippingFee: 0, total: PRODUCTS[10].price * 3 - 25000, shippingAddress: SAMPLE_ADDRESS, createdAt: "2026-03-18" },
  { id: 5, code: "SLN1005", status: "cancelled", paymentMethod: "cod", paymentStatus: "unpaid", items: [{ id: 5, product: PRODUCTS[13], quantity: 1, price: PRODUCTS[13].price, subtotal: PRODUCTS[13].price }], subtotal: PRODUCTS[13].price, discount: 0, shippingFee: 30000, total: PRODUCTS[13].price + 30000, shippingAddress: SAMPLE_ADDRESS, createdAt: "2026-03-17" },
];

export const MOCK_USER: User = {
  id: 1,
  name: "Nguyễn Văn A",
  email: "user@example.com",
  phone: "0901234567",
  points: 250,
  role: "customer",
};

export const MOCK_ADMIN: User = {
  id: 2,
  name: "Admin",
  email: "danghoaivu2004@gmail.com",
  phone: "0987654321",
  points: 0,
  role: "admin",
};

export const BANNERS: Banner[] = [
  {
    id: 1,
    title: "Lưu niệm Đà Lạt",
    subtitle: "Mang một góc thành phố sương mù về nhà",
    image: "https://cdn3.ivivu.com/2023/10/du-lich-Da-Lat-ivivu.jpg",
    buttonText: "Khám phá ngay",
    buttonLink: "/products",
  },
  {
    id: 2,
    title: "Quà tặng Đà Lạt",
    subtitle: "Những món nhỏ cho chuyến đi đáng nhớ",
    image: "https://picsum.photos/seed/tvk-banner-2/1400/700",
    buttonText: "Xem bộ quà",
    buttonLink: "/products?category=qua-tang",
  },
];

export const LOGIN_IMAGES = [
  "https://puolotrip.com/uploads/images/2023/09/Thanh-pho-da-lat-2-jpg.webp",
  "https://media.thuonghieucongluan.vn/uploads/2024/08/25/dinh-huong-phat-trien-tp-da-lat-mo-rong-1724579384.jpg",
  "https://viettimetravel.vn/wp-content/uploads/2017/08/dalat-news-5.jpg",
  "https://product.hstatic.net/200000735165/product/da_lat_fa3db963a25346089e5e5dc4e3ce628d.png",
  "https://longphutravel.com/uploads/gallery/da-lat-thanh-pho-ngan-hoa/da-lat-thanh-pho-ngan-hoa-longphutourist.com-07.jpg",
  "https://agotourist.com/wp-content/uploads/2019/07/chuyen-doi-thong-hai-mo-o-da-lat-800x467.jpg"
];
