// Vercel serverless route: GET /api/invite?code=<invite>
// Looks up a public Discord invite server-side (no CORS issues) and returns the bits the site shows.
export default async function handler(req, res) {
  const raw = String((req.query && req.query.code) || "");
  const code = raw.replace(/^.*\//, "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 40);
  if (!code) return res.status(400).json({ error: "bad code" });
  try {
    const r = await fetch(`https://discord.com/api/v10/invites/${code}?with_counts=true`, {
      headers: { "User-Agent": "BoostPad (https://boostpad.fun, 1.0)" }
    });
    if (!r.ok) return res.status(r.status === 404 ? 404 : 502).json({ error: "not found" });
    const j = await r.json();
    const g = j.guild || {};
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({
      id: g.id || null,
      name: g.name || null,
      icon: g.icon || null,
      banner: g.banner || null,
      boosts: typeof g.premium_subscription_count === "number" ? g.premium_subscription_count : null,
      members: j.approximate_member_count ?? null,
      online: j.approximate_presence_count ?? null,
      vanity: g.vanity_url_code || null,
      code: j.code || code
    });
  } catch (e) {
    return res.status(502).json({ error: "lookup failed" });
  }
}
