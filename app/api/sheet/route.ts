// Fetches a Google Sheet as CSV, so a sheet can be imported by pasting its link.
// The sheet must be shared as "Anyone with the link can view".
// Only docs.google.com spreadsheet links are accepted.

export async function GET(req: Request) {
  const link = new URL(req.url).searchParams.get("url") ?? "";
  let parsed: URL;
  try {
    parsed = new URL(link);
  } catch {
    return new Response("Not a valid link.", { status: 400 });
  }
  const m = parsed.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (parsed.hostname !== "docs.google.com" || !m) {
    return new Response("Only Google Sheets links (docs.google.com/spreadsheets/…) are supported.", { status: 400 });
  }
  const gid = parsed.searchParams.get("gid") ?? parsed.hash.match(/gid=(\d+)/)?.[1] ?? "0";
  const exportUrl = `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${encodeURIComponent(gid)}`;

  const res = await fetch(exportUrl, { redirect: "follow", cache: "no-store" });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.includes("text/csv")) {
    return new Response(
      "Couldn't read that sheet. In Google Sheets, click Share → General access → \"Anyone with the link\" (Viewer), then try again. Or download it as .csv/.xlsx and upload the file.",
      { status: 422 },
    );
  }
  return new Response(await res.text(), { headers: { "content-type": "text/csv; charset=utf-8" } });
}
