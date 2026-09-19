// Pure helpers shared by the worker, request handler, and executable tests.
export const UNCERTAIN =
  "I could not find enough evidence in this book to answer that. Try asking about a concept in the current chapter.";
export function chunkText(text, size = 1500, overlap = 220) {
  const clean = String(text)
    .toWellFormed()
    .replace(/\u0000/g, "")
    .trim();
  const chunks = [];
  for (let start = 0; start < clean.length;) {
    let end = Math.min(start + size, clean.length);
    if (end < clean.length) {
      const boundary = clean.lastIndexOf(" ", end);
      if (boundary > start + size / 2) end = boundary;
    }
    // A UTF-16 cut through an emoji produces a lone surrogate rejected by PostgreSQL JSON.
    if (
      end < clean.length &&
      clean.charCodeAt(end) >= 0xdc00 &&
      clean.charCodeAt(end) <= 0xdfff
    )
      end--;
    if (clean.slice(start, end).trim())
      chunks.push(clean.slice(start, end).trim());
    if (end === clean.length) break;
    start = Math.max(start + 1, end - overlap);
    if (clean.charCodeAt(start) >= 0xdc00 && clean.charCodeAt(start) <= 0xdfff)
      start--;
  }
  return chunks;
}
export function validatedAnswer(value, evidence) {
  const allowed = new Map(evidence.map((c) => [String(c.id), c]));
  const citations = [
    ...new Set(Array.isArray(value?.sources) ? value.sources.map(String) : []),
  ]
    .filter((id) => allowed.has(id))
    .map((id) => {
      const c = allowed.get(id);
      return {
        chunkId: c.id,
        chapterId: c.chapter_id,
        pageStart: c.page_start,
        pageEnd: c.page_end,
      };
    });
  if (
    value?.supported !== true ||
    !citations.length ||
    typeof value.answer !== "string"
  )
    return { answer: UNCERTAIN, citations: [] };
  // Page numbers are rendered solely from validated chunk metadata, never model-written links.
  return { answer: value.answer.slice(0, 8000), citations };
}
export function educationalDisclaimer(question) {
  return /\b(medical|medicine|diagnos\w*|treatment|legal|lawyer|financial|invest\w*|depression|suicid\w*|mental.health|therapy)\b/i.test(
    question,
  )
    ? "\n\nThis is an educational book assistant, not a medical, legal, financial, or mental-health professional. Seek qualified advice for personal decisions."
    : "";
}
export function validateFileMetadata(name, type, size, maxBytes) {
  if (
    !name ||
    /[\\/\u0000-\u001f]/.test(name) ||
    name.includes("..") ||
    name.length > 180
  )
    throw new Error(
      "Use a simple filename without folders or traversal characters.",
    );
  const ext = name.split(".").pop().toLowerCase();
  if (
    !["pdf", "epub"].includes(ext) ||
    type !== { pdf: "application/pdf", epub: "application/epub+zip" }[ext]
  )
    throw new Error("Use a PDF or EPUB with the correct file type.");
  if (size <= 0 || size > maxBytes)
    throw new Error(`File must be under ${Math.floor(maxBytes / 1048576)} MB.`);
  return { ext, name: name.replace(/[^a-zA-Z0-9._ -]/g, "_") };
}

// Verify ZIP central-directory checksums, not just an EPUB-looking filename.
export function verifyZipChecksums(bytes, files) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--)
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw new Error("Incomplete EPUB archive");
  const count = view.getUint16(end + 10, true),
    offset = view.getUint32(end + 16, true);
  if (count > 2000 || count === 65535 || offset === 0xffffffff)
    throw new Error("EPUB archive is too complex");
  let cursor = offset;
  const table = Array.from({ length: 256 }, (_, n) => {
    for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
    return n >>> 0;
  });
  for (let i = 0; i < count; i++) {
    if (
      cursor + 46 > bytes.length ||
      view.getUint32(cursor, true) !== 0x02014b50
    )
      throw new Error("Invalid EPUB directory");
    const length = view.getUint16(cursor + 28, true),
      extra = view.getUint16(cursor + 30, true),
      comment = view.getUint16(cursor + 32, true);
    const name = new TextDecoder().decode(
      bytes.slice(cursor + 46, cursor + 46 + length),
    );
    const content = files[name];
    if (!content) throw new Error("Incomplete EPUB content");
    let crc = 0xffffffff;
    for (const value of content) crc = (crc >>> 8) ^ table[(crc ^ value) & 255];
    if ((crc ^ 0xffffffff) >>> 0 !== view.getUint32(cursor + 16, true))
      throw new Error("EPUB checksum validation failed");
    cursor += 46 + length + extra + comment;
  }
}
