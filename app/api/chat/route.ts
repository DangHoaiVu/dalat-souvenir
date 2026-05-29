import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminSupabaseClient } from "@/lib/supabaseClient";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatProduct = {
  name: string | null;
  price: number | string | null;
  promoted_price?: number | string | null;
  stock?: number | null;
  unit?: string | null;
  description?: string | null;
  category_id?: string | null;
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    (item.role === "user" || item.role === "assistant") &&
    typeof item.content === "string" &&
    item.content.trim().length > 0
  );
}

function buildGeminiHistory(messages: ChatMessage[]) {
  const history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  for (const message of messages) {
    if (history.length === 0 && message.role !== "user") continue;

    const role = message.role === "assistant" ? "model" : "user";
    const previous = history[history.length - 1];

    if (previous?.role === role) {
      previous.parts[0].text += `\n${message.content.trim()}`;
    } else {
      history.push({ role, parts: [{ text: message.content.trim() }] });
    }
  }

  while (history.at(-1)?.role === "user") {
    history.pop();
  }

  return history;
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatVnd(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value))}đ`;
}

function getProductPrice(product: ChatProduct) {
  const promoted = toNumber(product.promoted_price);
  return promoted > 0 ? promoted : toNumber(product.price);
}

function parsePriceThreshold(message: string) {
  const match = message.match(/(\d+(?:[.,]\d+)?)\s*(triệu|trieu|tr|m|k|nghìn|ngan|ngàn)?/i);
  if (!match) return null;

  const rawNumber = Number(match[1].replace(",", "."));
  if (!Number.isFinite(rawNumber)) return null;

  const unit = (match[2] || "").toLowerCase();
  let amount = rawNumber;
  if (["triệu", "trieu", "tr", "m"].includes(unit)) {
    amount *= 1_000_000;
  } else if (["k", "nghìn", "ngan", "ngàn"].includes(unit)) {
    amount *= 1_000;
  }

  const direction = /(trên|hơn|cao hơn|lớn hơn|quá|từ).*(trở lên)?/.test(message)
    ? "above"
    : /(dưới|nhỏ hơn|thấp hơn|ít hơn|rẻ hơn)/.test(message)
      ? "below"
      : null;

  return direction ? { amount, direction } : null;
}

function isPriceRelatedMessage(message: string) {
  return (
    Boolean(parsePriceThreshold(message)) ||
    /(giá|bao nhiêu|cao nhất|đắt nhất|mắc nhất|rẻ nhất|thấp nhất|tầm tiền|khoảng tiền)/.test(message)
  );
}

function formatProductLine(product: ChatProduct) {
  const price = getProductPrice(product);
  const stockText = typeof product.stock === "number" ? `, còn ${product.stock} sản phẩm` : "";
  const unitText = product.unit ? `/${product.unit}` : "";
  return `- **${product.name || "Sản phẩm"}**: **${formatVnd(price)}${unitText}**${stockText}`;
}

function buildPriceReply(lastMessage: string, products: ChatProduct[]) {
  const pricedProducts = products
    .filter((product) => product.name && getProductPrice(product) > 0)
    .sort((a, b) => getProductPrice(a) - getProductPrice(b));

  if (pricedProducts.length === 0) return null;

  const threshold = parsePriceThreshold(lastMessage);
  const cheapest = pricedProducts[0];
  const mostExpensive = pricedProducts[pricedProducts.length - 1];

  if (threshold) {
    const matchedProducts = pricedProducts.filter((product) => {
      const price = getProductPrice(product);
      return threshold.direction === "above" ? price > threshold.amount : price < threshold.amount;
    });

    if (matchedProducts.length === 0) {
      const compareText = threshold.direction === "above" ? "trên" : "dưới";
      const reference = threshold.direction === "above" ? mostExpensive : cheapest;
      return [
        `Dạ hiện shop **chưa có sản phẩm nào giá ${compareText} ${formatVnd(threshold.amount)}** ạ.`,
        "",
        threshold.direction === "above"
          ? `Sản phẩm cao nhất hiện tại là **${reference.name}** với giá **${formatVnd(getProductPrice(reference))}**.`
          : `Sản phẩm thấp nhất hiện tại là **${reference.name}** với giá **${formatVnd(getProductPrice(reference))}**.`,
        "",
        "Anh/chị có thể xem thêm các sản phẩm đang bán trong trang Sản phẩm nha.",
      ].join("\n");
    }

    const compareText = threshold.direction === "above" ? "trên" : "dưới";
    return [
      `Dạ có **${matchedProducts.length} sản phẩm** giá ${compareText} **${formatVnd(threshold.amount)}** ạ:`,
      "",
      ...matchedProducts.slice(0, 6).map(formatProductLine),
      matchedProducts.length > 6 ? "" : null,
      matchedProducts.length > 6 ? `Và còn ${matchedProducts.length - 6} sản phẩm khác phù hợp.` : null,
    ].filter(Boolean).join("\n");
  }

  if (lastMessage.includes("cao nhất") || lastMessage.includes("đắt nhất") || lastMessage.includes("mắc nhất")) {
    return [
      `Dạ sản phẩm có giá cao nhất hiện tại là **${mostExpensive.name}** với giá **${formatVnd(getProductPrice(mostExpensive))}** ạ.`,
      "",
      "Giá có thể thay đổi nếu admin bật chương trình ưu đãi mới.",
    ].join("\n");
  }

  if (lastMessage.includes("rẻ nhất") || lastMessage.includes("thấp nhất")) {
    return [
      `Dạ sản phẩm có giá thấp nhất hiện tại là **${cheapest.name}** với giá **${formatVnd(getProductPrice(cheapest))}** ạ.`,
      "",
      "Nếu anh/chị cần quà nhỏ xinh, em có thể gợi ý thêm các món giá mềm trong shop nha.",
    ].join("\n");
  }

  return [
    `Dạ khoảng giá sản phẩm hiện tại từ **${formatVnd(getProductPrice(cheapest))}** đến **${formatVnd(getProductPrice(mostExpensive))}** ạ.`,
    "",
    "Một vài sản phẩm tiêu biểu:",
    ...pricedProducts.slice(0, 5).map(formatProductLine),
  ].join("\n");
}

function buildFallbackReply(messages: ChatMessage[], products: ChatProduct[] = []) {
  const lastMessage = (messages[messages.length - 1]?.content || "").toLowerCase();

  if (
    lastMessage.includes("thanh toán") ||
    lastMessage.includes("chuyển khoản") ||
    lastMessage.includes("cod") ||
    lastMessage.includes("nhận hàng") ||
    lastMessage.includes("tiền mặt")
  ) {
    return [
      "Dạ shop hiện hỗ trợ 2 phương thức thanh toán:",
      "",
      "- Thanh toán khi nhận hàng (COD): anh/chị trả tiền mặt khi shipper giao hàng.",
      "- Chuyển khoản ngân hàng: shop sẽ xác nhận thông tin đơn và liên hệ lại để hướng dẫn chuyển khoản.",
      "",
      "Anh/chị có thể chọn phương thức phù hợp ở bước xác nhận đặt hàng ạ.",
    ].join("\n");
  }

  if (
    lastMessage.includes("liên hệ") ||
    lastMessage.includes("địa chỉ") ||
    lastMessage.includes("ở đâu") ||
    lastMessage.includes("sdt") ||
    lastMessage.includes("điện thoại")
  ) {
    return [
      "Dạ đây là thông tin liên hệ của Đà Lạt Souvenir:",
      "",
      "- Hotline: 0979.777.777",
      "- Email: danghoaivu2004@gmail.com",
      "- Địa chỉ: Thành phố Qui Nhơn, Bình Định",
      "- Instagram: @lovehoaivulover",
      "",
      "Shop hỗ trợ tư vấn và giao hàng toàn quốc ạ.",
    ].join("\n");
  }

  if (
    lastMessage.includes("khuyến mãi") ||
    lastMessage.includes("giảm giá") ||
    lastMessage.includes("sale") ||
    lastMessage.includes("ưu đãi") ||
    lastMessage.includes("quà tặng")
  ) {
    return [
      "Dạ hiện shop có khu vực ưu đãi/khuyến mãi được cập nhật trực tiếp trên website.",
      "",
      "- Các chương trình đang bật sẽ hiện trong popup khuyến mãi.",
      "- Sản phẩm được áp dụng ưu đãi sẽ hiển thị giá khuyến mãi ngay trên thẻ sản phẩm.",
      "- Anh/chị có thể bấm vào mục Bộ quà tặng hoặc xem danh sách sản phẩm để chọn món phù hợp.",
      "",
      "Nếu cần kiểm tra nhanh chương trình đang chạy, anh/chị có thể liên hệ hotline 0979.777.777 ạ.",
    ].join("\n");
  }

  if (
    lastMessage.includes("sức khỏe") ||
    lastMessage.includes("tốt cho") ||
    lastMessage.includes("atiso") ||
    lastMessage.includes("trà")
  ) {
    return [
      "Dạ với nhóm sản phẩm tốt cho sức khỏe, anh/chị có thể tham khảo:",
      "",
      "- Trà atiso túi lọc: phù hợp làm quà, hỗ trợ thanh nhiệt và dễ sử dụng hằng ngày.",
      "- Hồng treo gió: vị ngọt tự nhiên, phù hợp làm quà đặc sản Đà Lạt.",
      "- Dâu tằm sấy dẻo: món ăn nhẹ dễ dùng, phù hợp làm quà cho bạn bè và gia đình.",
    ].join("\n");
  }

  if (
    lastMessage.includes("giá") ||
    lastMessage.includes("bao nhiêu") ||
    lastMessage.includes("sản phẩm")
  ) {
    const priceReply = buildPriceReply(lastMessage, products);
    if (priceReply) return priceReply;

    return [
      "Dạ anh/chị có thể xem giá mới nhất tại trang Sản phẩm của website.",
      "",
      "Một số nhóm sản phẩm nổi bật gồm đặc sản Đà Lạt, đồ len/phụ kiện, đồ lưu niệm handmade, nến thơm và bộ quà tặng. Giá có thể thay đổi theo chương trình ưu đãi đang bật.",
    ].join("\n");
  }

  if (
    lastMessage.includes("đặt hàng") ||
    lastMessage.includes("đơn hàng") ||
    lastMessage.includes("giỏ hàng") ||
    lastMessage.includes("hủy đơn") ||
    lastMessage.includes("lịch sử")
  ) {
    return [
      "Dạ anh/chị có thể mua hàng theo quy trình sau:",
      "",
      "1. Vào trang Sản phẩm và chọn món muốn mua.",
      "2. Thêm sản phẩm vào giỏ hàng.",
      "3. Mở giỏ hàng, kiểm tra sản phẩm và bấm xác nhận đặt hàng.",
      "4. Điền thông tin giao hàng và chọn thanh toán COD hoặc chuyển khoản.",
      "5. Sau khi đặt thành công, anh/chị có thể xem đơn trong mục Tài khoản > Đơn hàng.",
      "",
      "Với đơn chưa xử lý/giao, anh/chị có thể cập nhật thông tin hoặc hủy đơn trong trang đơn hàng của mình ạ.",
    ].join("\n");
  }

  return [
    "Dạ em chào anh/chị! Em là trợ lý ảo của Đà Lạt Souvenir.",
    "",
    "Em có thể hỗ trợ tư vấn sản phẩm, giá bán, khuyến mãi, thông tin liên hệ và gợi ý quà tặng Đà Lạt. Hiện hệ thống AI đang dùng phản hồi dự phòng để đảm bảo anh/chị vẫn được hỗ trợ liên tục.",
  ].join("\n");
}

export async function POST(req: Request) {
  let messages: ChatMessage[] = [];
  let products: ChatProduct[] = [];

  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages.filter(isChatMessage) : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: "Thiếu nội dung câu hỏi." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isMockMode = !apiKey || apiKey.includes("your_gemini_api_key");

    // 1. Fetch products & promotions to build the AI's context
    const supabase = createAdminSupabaseClient();

    // Fetch categories first
    const { data: categories } = await supabase
      .from("categories")
      .select("category_id, name");

    // Fetch active/saleable products
    const { data: productRows } = await supabase
      .from("products")
      .select("product_id, name, price, promoted_price, stock, unit, description, category_id")
      .eq("is_for_sale", true);

    products = productRows || [];

    // Fetch active promotions
    const { data: promotions } = await supabase
      .from("promotions")
      .select("promotion_id, name, description, start_date, end_date, fixed_price")
      .eq("is_active", true);

    // Format products context
    const categoryMap = new Map(categories?.map(c => [c.category_id, c.name]) || []);
    const productsContext = products.map(p => {
      const catName = categoryMap.get(p.category_id) || "Khác";
      const priceText = p.promoted_price ? `${p.promoted_price} VND (Giá gốc: ${p.price} VND, đang khuyến mãi)` : `${p.price} VND`;
      return `- Tên: ${p.name}\n  Danh mục: ${catName}\n  Giá: ${priceText}\n  Đơn vị: ${p.unit || "Cái/Hộp"}\n  Còn lại: ${p.stock} sản phẩm trong kho\n  Mô tả: ${p.description || "Chưa có mô tả chi tiết."}`;
    }).join("\n\n");

    // Format promotions context
    const promotionsContext = (promotions || []).map(promo => {
      return `- Chương trình: ${promo.name}\n  Mô tả: ${promo.description || "Không có mô tả chi tiết."}\n  Thời gian: ${promo.start_date ? new Date(promo.start_date).toLocaleDateString("vi-VN") : ""} đến ${promo.end_date ? new Date(promo.end_date).toLocaleDateString("vi-VN") : ""}`;
    }).join("\n");

    const lastMessage = (messages[messages.length - 1]?.content || "").toLowerCase();
    if (isPriceRelatedMessage(lastMessage)) {
      const priceReply = buildPriceReply(lastMessage, products);
      if (priceReply) {
        return NextResponse.json({
          reply: priceReply,
          deterministic: true,
        });
      }
    }

    if (isMockMode) {
      return NextResponse.json({
        reply: buildFallbackReply(messages, products),
        fallback: true,
      });
    }

    const systemInstruction = `Bạn là Trợ lý ảo AI thông minh và thân thiện của cửa hàng "Đà Lạt Souvenir" (hoạt động 24/7).
Nhiệm vụ của bạn là tư vấn cho khách hàng về các sản phẩm lưu niệm, đặc sản Đà Lạt, các chương trình khuyến mãi, giá cả, và các thông tin liên quan đến shop.

THÔNG TIN CỬA HÀNG "ĐÀ LẠT SOUVENIR":
- Địa chỉ: Thành phố Qui Nhơn, Bình Định (Lưu ý: Shop bán đặc sản Đà Lạt tuyển chọn chất lượng cao nhưng có trụ sở tại Quy Nhơn).
- Điện thoại/Hotline: 0979.777.777
- Email: danghoaivu2004@gmail.com
- Instagram: @lovehoaivulover (https://www.instagram.com/lovehoaivulover/)
- Giờ mở cửa: 8:00 - 22:00 mỗi ngày.
- Chủ cửa hàng: Đặng Hoài Vũ.
- Phí giao hàng: Miễn phí cho đơn hàng từ 500k trở lên. Giao hàng toàn quốc nhanh chóng từ 2-4 ngày.
- Phương thức thanh toán: Hỗ trợ thanh toán khi nhận hàng (COD) và chuyển khoản ngân hàng. Với COD, khách thanh toán bằng tiền mặt khi nhận hàng. Với chuyển khoản, shop sẽ liên hệ xác nhận và hướng dẫn thông tin chuyển khoản.

CHỨC NĂNG WEBSITE:
- Khách hàng có thể xem trang chủ, trang sản phẩm, trang chi tiết sản phẩm, câu chuyện thương hiệu, giỏ hàng và bộ quà tặng.
- Người dùng có thể đăng nhập bằng Google hoặc email/password.
- Người dùng có thể thêm sản phẩm vào giỏ hàng, đặt hàng, chọn thanh toán khi nhận hàng hoặc chuyển khoản ngân hàng, xem lịch sử đơn hàng trong mục Tài khoản > Đơn hàng.
- Người dùng có thể cập nhật thông tin giao hàng hoặc hủy đơn khi đơn hàng còn ở trạng thái cho phép.
- Admin có thể xem website như người dùng thường và có thêm Admin Panel để quản lý sản phẩm, đơn hàng, khuyến mãi, ảnh sản phẩm và mô tả bằng AI.
- Chương trình khuyến mãi có thể được bật/tắt. Khi đang hoạt động, website có thể hiển thị popup ưu đãi và áp dụng giá ưu đãi cho các sản phẩm được chọn.
- Chatbot chỉ hỗ trợ tư vấn; các thao tác đặt hàng, hủy đơn, chỉnh thông tin đơn hoặc thanh toán vẫn cần người dùng thực hiện trực tiếp trên giao diện website.

DANH SÁCH SẢN PHẨM ĐANG KINH DOANH:
${productsContext || "Hiện tại không có sản phẩm nào trực tuyến."}

DANH SÁCH CHƯƠNG TRÌNH KHUYẾN MÃI ĐANG CHẠY:
${promotionsContext || "Hiện không có chương trình khuyến mãi lớn nào đang diễn ra."}

QUY TẮC PHẢN HỒI:
1. Trả lời thân thiện, lịch sự, xưng hô là "Dạ em chào anh/chị" hoặc "Dạ, Đà Lạt Souvenir xin nghe" và kết thúc câu chào/hỏi tự nhiên. Sử dụng biểu tượng cảm xúc (emoji) tinh tế.
2. Dữ liệu sản phẩm và giá cả phải đúng tuyệt đối theo danh sách được cung cấp ở trên. Nếu khách hàng hỏi sản phẩm không có trong danh sách, hãy phản hồi khéo léo là hiện shop chưa kinh doanh sản phẩm này nhưng gợi ý sản phẩm thay thế tương đương.
3. Khi khách hỏi về công dụng sức khỏe (ví dụ Atiso thanh nhiệt mát gan, hồng treo gió dẻo ngọt tự nhiên,...), hãy dựa vào mô tả và công dụng thực tế của sản phẩm để tư vấn chu đáo và chuyên nghiệp.
4. Trả lời ngắn gọn, súc tích, dễ hiểu. Sử dụng định dạng markdown (danh sách gạch đầu dòng, chữ đậm) để câu trả lời rõ ràng.
5. KHÔNG tự bịa ra thông tin liên hệ hay giá cả khác ngoài các thông tin đã được cung cấp ở trên.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    // Format history for Google AI SDK
    // The SDK expects history like: [{ role: 'user' | 'model', parts: [{ text: '...' }] }]
    const formattedHistory = buildGeminiHistory(messages.slice(0, -1));

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(messages[messages.length - 1]?.content || "");
    const text = result.response.text().trim();

    return NextResponse.json({ reply: text });
  } catch (error: unknown) {
    console.error("[API/Chat] Error:", error);
    return NextResponse.json({
      reply: buildFallbackReply(messages, products),
      fallback: true,
    });
  }
}
