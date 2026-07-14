// Centralizes UploadThing private-document uploads and short-lived access URLs.
import { UTApi, UTFile } from "uploadthing/server";
import { randomUUID } from "crypto";
if (!process.env.UPLOADTHING_TOKEN)
  throw new Error("UPLOADTHING_TOKEN must be set.");
const utapi = new UTApi();
export type KycFile = { buffer: Buffer; mimetype: string };
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
  const result = await utapi.uploadFiles([
    new UTFile([file.buffer], `${documentType}-${randomUUID()}.${ext}`, {
      customId: documentType,
    }),
  ]);
  if (result[0]?.error || !result[0]?.data?.key)
    throw new Error("Document upload failed.");
  await utapi.updateACL(result[0].data.key, "private");
  return result[0].data.key;
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
  const result = await utapi.uploadFiles([
    new UTFile([file.buffer], `product-${randomUUID()}.${ext}`, {
      customId: "product-image",
    }),
  ]);
  if (result[0]?.error || !result[0]?.data?.key)
    throw new Error("Product image upload failed.");
  await utapi.updateACL(result[0].data.key, "public-read");
  return result[0].data.key;
}

export async function productImageUrl(key: string): Promise<string> {
  const result = await utapi.getFileUrls(key);
  const url = result.data[0]?.url;
  if (!url) throw new Error("Product image URL could not be created.");
  return url;
}
