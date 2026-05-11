import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-bold text-light">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Trang không tồn tại</h1>
      <p className="mt-2 text-muted-foreground">
        Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-lg border border-primary px-4 text-sm font-medium text-primary hover:bg-primary hover:text-white"
        >
          Về trang chủ
        </Link>
        <Link
          href="/products"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Xem sản phẩm
        </Link>
      </div>
    </div>
  );
}
