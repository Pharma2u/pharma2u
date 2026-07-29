// Centralizes UploadThing uploads and document access URLs.
import { randomUUID } from "crypto";
import { UTApi, UTFile } from "uploadthing/server";
import sharp from "sharp";

if (!process.env.UPLOADTHING_TOKEN)
  throw new Error("UPLOADTHING_TOKEN must be set.");

const utapi = new UTApi();

export type KycFile = { buffer: Buffer; mimetype: string };

function uploadError(message = "Document upload failed. Please try again.") {
  return Object.assign(new Error(message), { status: 502 });
}

function uploadthingErrorDetail(error: unknown): string {
  if (!error || typeof error !== "object") return "Unknown UploadThing error";
  const responseBody = (error as { response?: { body?: { error?: unknown } } })
    .response?.body;
  if (typeof responseBody?.error === "string") return responseBody.error;
  return error instanceof Error ? error.message : "Unknown UploadThing error";
}

export async function uploadPrivateDocument(
  file: KycFile,
  documentType: string,
): Promise<string> {
  const ext =
    file.mimetype === "image/jpeg"
      ? "jpg"
      : file.mimetype === "image/webp"
        ? "webp"
        : "png";
  const customId = `${documentType}-${randomUUID()}`;
  try {
    const result = await utapi.uploadFiles([
      new UTFile([file.buffer], `${customId}.${ext}`, {
        type: file.mimetype,
        customId,
      }),
    ]);
    if (result[0]?.error || !result[0]?.data?.key) throw uploadError();

    // Do not call updateACL here. Free UploadThing apps only support their
    // public-read default; changing the uploaded file to private would fail
    // after the bytes have already been stored and leave an orphaned file.
    return result[0].data.key;
  } catch (error) {
    if ((error as { status?: number }).status === 502) throw error;
    console.error(
      `UploadThing upload failed for ${documentType}: ${uploadthingErrorDetail(error)}`,
    );
    throw uploadError();
  }
}

export async function uploadFeedbackScreenshot(file: KycFile): Promise<string> {
  let normalized: Buffer;
  try {
    normalized = await sharp(file.buffer, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88 })
      .toBuffer();
  } catch {
    throw Object.assign(
      new Error("One of the selected screenshots is not a valid image."),
      { status: 400 },
    );
  }
  return uploadPrivateDocument(
    { buffer: normalized, mimetype: "image/webp" },
    "feedback-screenshot",
  );
}

export async function signedDocumentUrl(key: string): Promise<string> {
  return (await utapi.generateSignedURL(key, { expiresIn: "15m" })).ufsUrl;
}

export async function uploadProductImage(file: KycFile): Promise<string> {
  const ext =
    file.mimetype === "image/jpeg"
      ? "jpg"
      : file.mimetype === "image/webp"
        ? "webp"
        : "png";
  const customId = `product-image-${randomUUID()}`;
  try {
    const result = await utapi.uploadFiles([
      new UTFile([file.buffer], `${customId}.${ext}`, {
        type: file.mimetype,
        customId,
      }),
    ]);
    if (result[0]?.error || !result[0]?.data?.key)
      throw uploadError("Product image upload failed.");
    return result[0].data.key;
  } catch (error) {
    if ((error as { status?: number }).status === 502) throw error;
    console.error(
      `UploadThing product-image upload failed: ${uploadthingErrorDetail(error)}`,
    );
    throw uploadError(
      "Product image upload failed. Check UploadThing configuration.",
    );
  }
}

/** Uploads a public-facing pharmacy logo or banner image. */
export async function uploadPharmacyImage(
  file: KycFile,
  imageType: "logo" | "banner",
): Promise<string> {
  const ext =
    file.mimetype === "image/jpeg"
      ? "jpg"
      : file.mimetype === "image/webp"
        ? "webp"
        : "png";
  const customId = `pharmacy-${imageType}-${randomUUID()}`;
  try {
    const result = await utapi.uploadFiles([
      new UTFile([file.buffer], `${customId}.${ext}`, {
        type: file.mimetype,
        customId,
      }),
    ]);
    if (result[0]?.error || !result[0]?.data?.key)
      throw uploadError("Pharmacy image upload failed.");
    return result[0].data.key;
  } catch (error) {
    if ((error as { status?: number }).status === 502) throw error;
    console.error(
      `UploadThing pharmacy ${imageType} upload failed: ${uploadthingErrorDetail(error)}`,
    );
    throw uploadError(
      "Pharmacy image upload failed. Check UploadThing configuration.",
    );
  }
}
/** Uploads the global company logo to UploadThing and returns its storage key. */
export async function uploadCompanyLogo(file: KycFile): Promise<string> {
  let normalizedBuffer: Buffer;
  try {
    normalizedBuffer = await sharp(file.buffer, {
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .trim({ threshold: 12, lineArt: true, margin: 8 })
      .resize({
        width: 1200,
        height: 500,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png({ compressionLevel: 9 })
      .toBuffer();
  } catch {
    throw Object.assign(
      new Error(
        "The selected logo could not be processed. Upload a valid PNG, JPG, or WebP image.",
      ),
      { status: 400 },
    );
  }

  const customId = `company-logo-${randomUUID()}`;
  try {
    const result = await utapi.uploadFiles([
      new UTFile([normalizedBuffer], `${customId}.png`, {
        type: "image/png",
        customId,
      }),
    ]);
    if (result[0]?.error || !result[0]?.data?.key)
      throw uploadError("Company logo upload failed.");
    return result[0].data.key;
  } catch (error) {
    if ((error as { status?: number }).status === 502) throw error;
    console.error(
      `UploadThing company-logo upload failed: ${uploadthingErrorDetail(error)}`,
    );
    throw uploadError(
      "Company logo upload failed. Check UploadThing configuration.",
    );
  }
}
/** Best-effort cleanup for files uploaded before a database write failed. */
export async function deleteUploadedFiles(
  keys: string[],
  documentType = "uploaded files",
) {
  if (!keys.length) return;
  try {
    await utapi.deleteFiles(keys);
  } catch (error) {
    // Do not hide the original application/database error.
    console.error(
      `UploadThing cleanup failed for ${documentType} (${keys.join(", ")}): ${uploadthingErrorDetail(error)}`,
    );
  }
}

export function deleteProductImages(keys: string[]) {
  return deleteUploadedFiles(keys, "product images");
}

export function productImageUrl(key: string): string {
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `https://utfs.io/f/${key}`;
}

export const pharmacyImageUrl = productImageUrl;
