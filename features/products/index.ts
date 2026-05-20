export {
  fetchActivePromotion,
  fetchCategoriesForHome,
  fetchProductById,
  fetchProductBySlug,
  fetchProductsForHome,
  fetchPromotionDetails,
  fetchRelatedProducts,
  pickNewestProducts,
  pickRandomProducts,
  shuffle,
  type ActivePromotion,
  type PromotionDetailItem,
  type PromotionDetails,
} from "@/features/products/queries";
export {
  mapCategoryRow,
  mapProductRow,
  type SupabaseCategoryRow,
  type SupabaseProductRow,
} from "@/features/products/mappers";
export { isSupabaseProductId } from "@/features/products/product-id";
