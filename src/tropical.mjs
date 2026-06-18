/**
 * Atlantic tropical situation, from the NOAA National Hurricane Center.
 *
 * NHC products are U.S. Government works in the public domain (the TWO feed
 * itself declares <copyright>none</copyright>), so the outlook text can be
 * surfaced directly. We still present a plain-language summary first and link
 * back to the official product.
 */

// Official WMO/NHC rotating name list for the 2026 Atlantic season.
// (Same list as 2020, with Leah replacing the retired Laura.)
// Source: https://www.nhc.noaa.gov/aboutnames.shtml — update this once a year.
export const ATLANTIC_NAMES_2026 = [
  "Arthur", "Bertha", "Cristobal", "Dolly", "Edouard", "Fay", "Gonzalo",
  "Hanna", "Isaias", "Josephine", "Kyle", "Leah", "Marco", "Nana", "Omar",
  "Paulette", "Rene", "Sally", "Teddy", "Vicky", "Wilfred",
];

const TWO_URL = "https://www.nhc.noaa.gov/xml/TWOAT.xml";
const TWO_HUMAN_URL = "https://www.nhc.noaa.gov/text/MIATWOAT.shtml";

function decode(s) {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const catOf = (pct) => (pct >= 60 ? "high" : pct >= 40 ? "medium" : "low");

// Pull a "...word...NN percent" formation chance out of an area paragraph.
function chance(block, window) {
  const re = new RegExp(`${window}\\.\\.\\.[\\s\\S]*?(\\d+)\\s*percent`, "i");
  const m = block.match(re);
  if (!m) return null;
  const pct = Number(m[1]);
  return { pct, category: catOf(pct) };
}

function parseAreas(body) {
  // Numbered areas: "1. ... 2. ..." up to the "$$" sign-off.
  const areas = [];
  const re = /(?:^|\n)\s*(\d+)\.\s+([\s\S]*?)(?=\n\s*\d+\.\s|\n\s*\$\$|$)/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const block = m[2].trim();
    const where = block.split(/[.:]/)[0].replace(/\s+/g, " ").trim();
    areas.push({
      num: Number(m[1]),
      where: where.slice(0, 120),
      chance48: chance(block, "48 hours"),
      chance7: chance(block, "7 days"),
    });
  }
  return areas;
}

export function parseOutlook(xml) {
  const cdata = xml.match(/<description>\s*<!\[CDATA\[([\s\S]*?)\]\]>/);
  const pub = xml.match(/<item>[\s\S]*?<pubDate>([^<]+)<\/pubDate>/);
  if (!cdata) return null;
  const text = decode(cdata[1]);
  const formationExpected = !/not expected during the next\s*\d*\s*days/i.test(text);

  const active = text.match(/Active Systems:\s*([\s\S]*?)\n\n/i);
  const activeSystemsText = active
    ? active[1].replace(/\s+/g, " ").trim()
    : null;

  const areas = formationExpected ? parseAreas(text) : [];
  const topChance = areas.reduce(
    (max, a) => Math.max(max, a.chance7?.pct ?? 0),
    0
  );

  let headline;
  if (!formationExpected) {
    headline = "No new tropical systems expected to form in the next 7 days.";
  } else if (areas.length === 1) {
    headline = `1 area being watched for development (up to ${topChance}% chance in 7 days).`;
  } else {
    headline = `${areas.length} areas being watched for development (highest ${topChance}% in 7 days).`;
  }

  return {
    issuedAt: pub ? new Date(pub[1]).toISOString() : null,
    formationExpected,
    headline,
    activeSystemsText,
    areas,
    text,
    url: TWO_HUMAN_URL,
  };
}

export async function fetchTropicalOutlook() {
  try {
    const res = await fetch(TWO_URL, {
      headers: { "User-Agent": "hurricane-ready (github.com/christophercorbin/hurricane-ready)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`TWO ${res.status}`);
    return parseOutlook(await res.text());
  } catch (err) {
    console.warn(`Tropical outlook unavailable (${err.message})`);
    return null;
  }
}

// Index (1-based count) of the highest-numbered active storm, used to mark
// which names have been reached this season. e.g. id "al012026" -> 1.
export function stormsSoFar(storms) {
  return (storms ?? []).reduce((max, s) => {
    const m = /^al(\d{2})/i.exec(s.id ?? "");
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
}
