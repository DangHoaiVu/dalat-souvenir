 -- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  category_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  CONSTRAINT categories_pkey PRIMARY KEY (category_id)
);
CREATE TABLE public.fcm_tokens (
  user_id uuid,
  token text NOT NULL,
  device_type text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fcm_tokens_pkey PRIMARY KEY (token),
  CONSTRAINT fcm_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.order_items (
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  price_at_purchase numeric,
  is_gift boolean DEFAULT false,
  CONSTRAINT order_items_pkey PRIMARY KEY (order_id, product_id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id)
);
CREATE TABLE public.orders (
  order_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  total_price numeric,
  delivery_started_at timestamp with time zone,
  estimated_arrival_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (order_id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.products (
  product_id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  name text NOT NULL,
  unit text NOT NULL,
  description text,
  price numeric NOT NULL,
  stock integer DEFAULT 0,
  image text,
  created_at timestamp with time zone DEFAULT now(),
  promoted_price numeric,
  is_for_sale boolean DEFAULT true,
  CONSTRAINT products_pkey PRIMARY KEY (product_id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id)
);

-- Helper function to delete a product and its image from the "Products" storage bucket
CREATE OR REPLACE FUNCTION public.delete_product_with_image(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  prod_record RECORD;
  image_path text;
BEGIN
  SELECT product_id, image
  INTO prod_record
  FROM public.products
  WHERE product_id = p_product_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- If image is a Supabase public URL, extract the object path after '/Products/'
  IF prod_record.image IS NOT NULL AND prod_record.image LIKE '%/Products/%' THEN
    image_path := split_part(prod_record.image, '/Products/', 2);
    IF image_path IS NOT NULL AND image_path <> '' THEN
      DELETE FROM storage.objects
      WHERE bucket_id = 'Products'
        AND name = image_path;
    END IF;
  END IF;

  -- Delete the product row itself (and rely on FK ON DELETE behavior for related rows)
  DELETE FROM public.products WHERE product_id = p_product_id;
END;
$$;
CREATE TABLE public.profiles (
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  phone_number text,
  address text,
  latitude numeric,
  longitude numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.promotion_items (
  promotion_id uuid NOT NULL,
  product_id uuid NOT NULL,
  discount_percentage integer CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  gift_product_id uuid,
  CONSTRAINT promotion_items_pkey PRIMARY KEY (promotion_id, product_id),
  CONSTRAINT promotion_items_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(promotion_id),
  CONSTRAINT promotion_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id),
  CONSTRAINT promotion_items_gift_product_id_fkey FOREIGN KEY (gift_product_id) REFERENCES public.products(product_id)
);
CREATE TABLE public.promotions (
  promotion_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone NOT NULL,
  image text,
  is_active boolean DEFAULT true,
  fixed_price numeric,
  CONSTRAINT promotions_pkey PRIMARY KEY (promotion_id)
);

-- Helper function to expire promotions, clear promoted prices, and delete promo images from Storage
CREATE OR REPLACE FUNCTION public.expire_promotions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  expired RECORD;
  image_path text;
BEGIN
  FOR expired IN
    SELECT promotion_id, image
    FROM public.promotions
    WHERE end_date < now()
  LOOP
    -- Clear promoted_price on affected products and delete promotion_items
    PERFORM public.clear_promotion_for_id(expired.promotion_id);

    -- If image is a Supabase public URL, extract the object path after '/Promotions/'
    IF expired.image IS NOT NULL AND expired.image LIKE '%/Promotions/%' THEN
      image_path := split_part(expired.image, '/Promotions/', 2);
      IF image_path IS NOT NULL AND image_path <> '' THEN
        DELETE FROM storage.objects
        WHERE bucket_id = 'Promotions'
          AND name = image_path;
      END IF;
    END IF;

    -- Finally delete the promotion row
    DELETE FROM public.promotions WHERE promotion_id = expired.promotion_id;
  END LOOP;
END;
$$;