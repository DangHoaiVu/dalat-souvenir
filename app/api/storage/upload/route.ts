import { randomUUID } from "crypto";
import { Buffer } from "buffer";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";

const BUCKETS = {
  product: "Products",
  promotion: "Promotions",
} as const;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type UploadKind = keyof typeof BUCKETS;

function isUploadKind(value: FormDataEntryValue | null): value is UploadKind {
  return typeof value === "string" && value in BUCKETS;
}

function getExtension(file: File) {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  if (byType[file.type]) {
    return byType[file.type];
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension && /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
}

async function ensureBucket(bucket: string) {
  const supabase = createAdminSupabaseClient();
  const { error: getError } = await supabase.storage.getBucket(bucket);

  if (!getError) {
    return { supabase, error: null };
  }

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
  });

  if (createError && !/already exists/i.test(createError.message)) {
    return { supabase, error: createError.message };
  }

  return { supabase, error: null };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const formData = await req.formData();
  const kind = formData.get("kind");
  const file = formData.get("file");

  if (!isUploadKind(kind)) {
    return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WebP or GIF images are allowed" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Image must be smaller than 5MB" }, { status: 400 });
  }

  const bucket = BUCKETS[kind];
  const { supabase, error: bucketError } = await ensureBucket(bucket);

  if (bucketError) {
    return NextResponse.json({ error: bucketError }, { status: 500 });
  }

  const extension = getExtension(file);
  const objectPath = `${kind}/${Date.now()}-${randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, Buffer.from(arrayBuffer), {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  return NextResponse.json({
    bucket,
    path: objectPath,
    url: data.publicUrl,
  });
}
