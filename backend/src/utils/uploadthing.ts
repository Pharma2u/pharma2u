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
  const ext = file.mimetype === "image/jpeg" ? "jpg" : "png";
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
