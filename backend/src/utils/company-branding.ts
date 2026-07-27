const MAX_LOGO_BYTES = 1024 * 1024;

function invalidLogo(): never {
  throw Object.assign(
    new Error("Logo must be a safe PNG, JPG, or SVG smaller than 1 MB."),
    {
      status: 400,
    },
  );
}

export function companyLogoDataUrl(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") invalidLogo();

  const match =
    /^data:(image\/png|image\/jpeg|image\/svg\+xml);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      value,
    );
  if (!match) invalidLogo();

  const mime = match![1]!;
  const bytes = Buffer.from(match![2]!, "base64");
  if (!bytes.length || bytes.length > MAX_LOGO_BYTES) invalidLogo();

  if (
    mime === "image/png" &&
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    invalidLogo();
  if (mime === "image/jpeg" && !(bytes[0] === 0xff && bytes[1] === 0xd8))
    invalidLogo();
  if (mime === "image/svg+xml") {
    const svg = bytes.toString("utf8").toLowerCase();
    if (
      !svg.includes("<svg") ||
      /<script|<foreignobject|\son\w+\s*=|javascript:/.test(svg)
    )
      invalidLogo();
  }
  return value;
}
