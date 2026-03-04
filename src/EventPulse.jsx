import { useState, useEffect, useRef, useCallback } from "react";

// ─── DEMO DATA ──────────────────────────────────────────────────────────────

const CATEGORIES = ["Concerts", "Theatre", "Comedy", "Festivals", "Sports", "Other"];

const CAT_COLORS = {
  Concerts:  "#a78bfa",
  Theatre:   "#fb923c",
  Comedy:    "#facc15",
  Festivals: "#34d399",
  Sports:    "#38bdf8",
  Other:     "#f472b6",
};

const CAT_ICONS = {
  Concerts:  "🎵",
  Theatre:   "🎭",
  Comedy:    "😂",
  Festivals: "🎪",
  Sports:    "🏆",
  Other:     "✨",
};

const SOURCES = ["Ticketmaster", "Eventbrite", "Bandsintown", "Songkick", "StubHub"];
const SOURCE_COLORS = {
  Ticketmaster: "#026cdf",
  Eventbrite:   "#f05537",
  Bandsintown:  "#00b4b3",
  Songkick:     "#f80046",
  StubHub:      "#4a148c",
};

const VENUES = [
  "Scotiabank Arena", "Rogers Centre", "Budweiser Stage", "History",
  "Danforth Music Hall", "Rebel", "Queen Elizabeth Theatre", "Roy Thomson Hall",
  "Meridian Hall", "FirstOntario Centre",
];

const ARTISTS = [
  "The Weeknd", "Drake", "Billie Eilish", "Arctic Monkeys", "Tame Impala",
  "Kendrick Lamar", "Taylor Swift", "Bad Bunny", "Dua Lipa", "Post Malone",
  "Radiohead", "Frank Ocean", "SZA", "Tyler The Creator", "Childish Gambino",
  "LCD Soundsystem", "Vampire Weekend", "Beach House", "Car Seat Headrest", "boygenius",
];

const IMAGES = [
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&q=80",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80",
];

function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function generateEvents() {
  const events = [];
  const now = new Date(2026, 2, 1);
  let id = 1;
  for (let day = 1; day <= 31; day++) {
    const date = new Date(2026, 2, day);
    if (date.getMonth() !== 2) continue;
    const rng = seededRand(day * 137 + 42);
    const count = Math.floor(rng() * 13);
    for (let i = 0; i < count; i++) {
      const cat = CATEGORIES[Math.floor(rng() * CATEGORIES.length)];
      const artist = ARTISTS[Math.floor(rng() * ARTISTS.length)];
      const venue = VENUES[Math.floor(rng() * VENUES.length)];
      const source = SOURCES[Math.floor(rng() * SOURCES.length)];
      const hour = 18 + Math.floor(rng() * 4);
      const min = rng() > 0.5 ? "00" : "30";
      const priceMin = Math.floor(rng() * 40 + 20);
      const priceMax = priceMin + Math.floor(rng() * 80 + 20);
      events.push({
        id: id++,
        title: cat === "Concerts" || cat === "Festivals" ? `${artist}` : cat === "Sports" ? `TFC vs CF Montréal` : `${cat} Night`,
        artist,
        category: cat,
        date: `2026-03-${String(day).padStart(2, "0")}`,
        day,
        time: `${hour}:${min}`,
        venue,
        source,
        priceMin,
        priceMax,
        image: IMAGES[Math.floor(rng() * IMAGES.length)],
        popularityScore: Math.floor(rng() * 100),
        ticketUrl: "#",
        liked: false,
        notified: false,
      });
    }
  }
  return events;
}

const ALL_EVENTS = generateEvents();

// ─── DENSITY HELPERS ────────────────────────────────────────────────────────

function getDensityStyle(count) {
  if (count === 0) return { bg: "rgba(255,255,255,0.03)", dot: "#444", glow: "none", badge: "#444" };
  if (count <= 2)  return { bg: "rgba(59,130,246,0.10)", dot: "#3b82f6", glow: "0 0 12px rgba(59,130,246,0.3)", badge: "#3b82f6" };
  if (count <= 5)  return { bg: "rgba(139,92,246,0.12)", dot: "#8b5cf6", glow: "0 0 14px rgba(139,92,246,0.35)", badge: "#8b5cf6" };
  if (count <= 10) return { bg: "rgba(249,115,22,0.14)", dot: "#f97316", glow: "0 0 18px rgba(249,115,22,0.4)", badge: "#f97316" };
  return { bg: "rgba(239,68,68,0.18)", dot: "#ef4444", glow: "0 0 24px rgba(239,68,68,0.55)", badge: "#ef4444" };
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

function SourceBadge({ source }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
      padding: "2px 6px", borderRadius: 20,
      background: SOURCE_COLORS[source] + "33",
      color: SOURCE_COLORS[source],
      border: `1px solid ${SOURCE_COLORS[source]}55`,
    }}>{source}</span>
  );
}

function CategoryDot({ category, size = 7 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      background: CAT_COLORS[category], flexShrink: 0,
      boxShadow: `0 0 4px ${CAT_COLORS[category]}88`,
    }} />
  );
}

function EventCard({ event, onLike, onNotify, compact = false }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: compact ? "10px 12px" : "12px 14px",
      display: "flex", gap: 10, alignItems: "flex-start",
      transition: "background 0.2s",
      cursor: "pointer",
    }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
    >
      {!compact && (
        <img src={event.image} alt="" style={{
          width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0,
        }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: CAT_COLORS[event.category] }}>
            {CAT_ICONS[event.category]} {event.category}
          </span>
          <SourceBadge source={event.source} />
        </div>
        <div style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: "#fff", marginBottom: 3, lineHeight: 1.3 }}>
          {event.title}
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span>🕐 {event.time}</span>
          <span>📍 {event.venue}</span>
          {event.priceMin && <span style={{ color: "#34d399" }}>${event.priceMin}–${event.priceMax}</span>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
        <button
          onClick={e => { e.stopPropagation(); onLike(event.id); }}
          style={{
            background: event.liked ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${event.liked ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 8, width: 30, height: 30, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, transition: "all 0.2s",
          }}
          title="Like"
        >{event.liked ? "❤️" : "🤍"}</button>
        <button
          onClick={e => { e.stopPropagation(); onNotify(event.id); }}
          style={{
            background: event.notified ? "rgba(250,204,21,0.2)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${event.notified ? "#facc15" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 8, width: 30, height: 30, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, transition: "all 0.2s",
          }}
          title="Notify me"
        >{event.notified ? "🔔" : "🔕"}</button>
        <a
          href={event.ticketUrl}
          onClick={e => e.stopPropagation()}
          style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff", fontSize: 9, fontWeight: 700,
            padding: "4px 7px", borderRadius: 6, textDecoration: "none",
            letterSpacing: "0.04em",
          }}
        >BUY</a>
      </div>
    </div>
  );
}

// ─── DATE BUBBLE (grows out of cell) ────────────────────────────────────────

function DateBubble({ day, events, anchor, onClose, onLike, onNotify }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const grouped = {};
  CATEGORIES.forEach(c => { grouped[c] = events.filter(e => e.category === c); });
  const cats = CATEGORIES.filter(c => grouped[c].length > 0);
  const filtered = filter === "All" ? events : events.filter(e => e.category === filter);

  if (!anchor) return null;

  // Position: try to grow from the anchor cell center
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const anchorCx = anchor.left + anchor.width / 2;
  const anchorCy = anchor.top + anchor.height / 2;

  // Bubble size
  const bw = Math.min(420, vw - 32);
  const bh = Math.min(560, vh - 40);
  let left = anchorCx - bw / 2;
  let top = anchorCy - bh / 2;
  if (left < 8) left = 8;
  if (left + bw > vw - 8) left = vw - bw - 8;
  if (top < 8) top = 8;
  if (top + bh > vh - 8) top = vh - bh - 8;

  const originX = anchorCx - left;
  const originY = anchorCy - top;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          opacity: visible ? 1 : 0, transition: "opacity 0.3s ease",
        }}
      />
      {/* Bubble */}
      <div
        ref={ref}
        style={{
          position: "fixed", left, top,
          width: bw, height: bh,
          zIndex: 1001,
          background: "linear-gradient(160deg, #13131f 0%, #0d0d1a 100%)",
          border: "1.5px solid rgba(139,92,246,0.35)",
          borderRadius: 20,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.15)",
          display: "flex", flexDirection: "column",
          transformOrigin: `${originX}px ${originY}px`,
          transform: visible ? "scale(1)" : "scale(0.15)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.42s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 18px 12px",
          background: "linear-gradient(180deg, rgba(139,92,246,0.12) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                {new Date(2026, 2, day).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <div style={{ fontSize: 13, color: "#8b5cf6", fontWeight: 600, marginTop: 2 }}>
                {events.length} event{events.length !== 1 ? "s" : ""}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.07)", border: "none",
              color: "#9ca3af", borderRadius: 10, width: 32, height: 32,
              cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
          {/* Category filter tabs */}
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            {["All", ...cats].map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, cursor: "pointer",
                background: filter === c ? (c === "All" ? "#8b5cf6" : CAT_COLORS[c]) : "rgba(255,255,255,0.07)",
                color: filter === c ? "#fff" : "#9ca3af",
                border: `1px solid ${filter === c ? "transparent" : "rgba(255,255,255,0.1)"}`,
                transition: "all 0.18s",
              }}>
                {c === "All" ? "All" : `${CAT_ICONS[c]} ${c}`}
                {c !== "All" && <span style={{ marginLeft: 4, opacity: 0.7 }}>({grouped[c]?.length})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Events list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#4b5563", paddingTop: 40, fontSize: 14 }}>No events in this category</div>
          )}
          {filtered.map(ev => (
            <EventCard key={ev.id} event={ev} onLike={onLike} onNotify={onNotify} />
          ))}
        </div>
      </div>
    </>
  );
}

// ─── DISCOVER CARD ──────────────────────────────────────────────────────────

function DiscoverCard({ event, onLike, onNotify }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: "linear-gradient(160deg, #15151f, #0f0f1a)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      overflow: "hidden",
      flexShrink: 0,
      width: 280,
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.5), 0 0 20px ${CAT_COLORS[event.category]}22`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ position: "relative" }}>
        <img src={event.image} alt="" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(15,15,26,1) 0%, transparent 55%)",
        }} />
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
            padding: "3px 8px", borderRadius: 20,
            background: CAT_COLORS[event.category] + "cc",
            color: "#fff",
          }}>{CAT_ICONS[event.category]} {event.category}</span>
        </div>
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4 }}>
          <button onClick={() => onLike(event.id)} style={{
            background: event.liked ? "rgba(239,68,68,0.8)" : "rgba(0,0,0,0.6)",
            border: "none", borderRadius: 8, width: 28, height: 28,
            cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
          }}>{event.liked ? "❤️" : "🤍"}</button>
          <button onClick={() => onNotify(event.id)} style={{
            background: event.notified ? "rgba(250,204,21,0.8)" : "rgba(0,0,0,0.6)",
            border: "none", borderRadius: 8, width: 28, height: 28,
            cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
          }}>{event.notified ? "🔔" : "🔕"}</button>
        </div>
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 4, lineHeight: 1.3 }}>{event.title}</div>
        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>
          📅 Mar {event.day} · {event.time} · 📍 {event.venue}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <SourceBadge source={event.source} />
            <span style={{ fontSize: 11, color: "#34d399", fontWeight: 700 }}>${event.priceMin}–${event.priceMax}</span>
          </div>
          <a href={event.ticketUrl} style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff", fontSize: 10, fontWeight: 700,
            padding: "5px 12px", borderRadius: 8, textDecoration: "none",
          }}>Get Tickets</a>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function EventPulse() {
  const [events, setEvents] = useState(ALL_EVENTS);
  const [selectedDay, setSelectedDay] = useState(null);
  const [bubbleAnchor, setBubbleAnchor] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);
  const discoverRef = useRef(null);

  const today = 4; // March 4 2026

  const filteredEvents = events.filter(e => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase()) ||
      e.artist.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || e.category === catFilter;
    return matchSearch && matchCat;
  });

  const eventsForDay = (day) => filteredEvents.filter(e => e.day === day);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleLike = useCallback((id) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== id) return e;
      const newLiked = !e.liked;
      if (newLiked) showToast(`❤️ Liked ${e.artist || e.title}`);
      return { ...e, liked: newLiked };
    }));
  }, []);

  const handleNotify = useCallback((id) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== id) return e;
      const newNotified = !e.notified;
      if (newNotified) showToast(`🔔 You'll be notified about ${e.artist || e.title}`);
      return { ...e, notified: newNotified };
    }));
  }, []);

  const handleDayClick = (day, cellEl) => {
    const rect = cellEl.getBoundingClientRect();
    setSelectedDay(day);
    setBubbleAnchor({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); showToast("✅ Synced — 117 events loaded"); }, 1800);
  };

  // Stats
  const monthEvents = filteredEvents.length;
  const activeDays = new Set(filteredEvents.map(e => e.day)).size;
  const avgPerDay = activeDays > 0 ? (monthEvents / activeDays).toFixed(1) : "0";
  const hotDays = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]
    .map(d => ({ d, c: eventsForDay(d).length }))
    .filter(x => x.c > 0)
    .sort((a,b) => b.c - a.c).slice(0, 6);
  const busiest = hotDays[0];

  const catCounts = {};
  CATEGORIES.forEach(c => { catCounts[c] = filteredEvents.filter(e => e.category === c).length; });
  const topCat = Object.entries(catCounts).sort((a,b) => b[1]-a[1])[0];

  // Discover: random subset of filteredEvents
  const discoverEvents = [...filteredEvents].sort(() => 0.5 - Math.random()).slice(0, 20);

  // Calendar grid
  const firstDay = new Date(2026, 2, 1).getDay();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const paddingBefore = Array.from({ length: firstDay }, () => null);

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      background: "#0a0a12",
      minHeight: "100vh",
      color: "#fff",
      overflowX: "hidden",
    }}>
      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "rgba(139,92,246,0.95)", color: "#fff",
          padding: "10px 20px", borderRadius: 30,
          fontSize: 13, fontWeight: 700, zIndex: 9999,
          boxShadow: "0 8px 32px rgba(139,92,246,0.5)",
          animation: "fadeIn 0.2s ease",
          whiteSpace: "nowrap",
        }}>{toast}</div>
      )}

      {/* HEADER */}
      <header style={{
        padding: "14px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        background: "rgba(10,10,18,0.95)",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(12px)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.02em" }}>
              <span style={{ color: "#fff" }}>Event</span>
              <span style={{ color: "#8b5cf6" }}>Pulse</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginLeft: 6 }}>GTA</span>
            </div>
            <div style={{ fontSize: 10, color: "#4b5563", marginTop: -1 }}>Toronto · Hamilton · Golden Horseshoe</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 360 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, opacity: 0.4 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Artists, venues, cities..."
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, color: "#fff",
              padding: "8px 12px 8px 34px",
              fontSize: 13, outline: "none",
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#9ca3af", borderRadius: 10, padding: "8px 14px",
            fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>⚙️ Filters</button>
          <button
            onClick={handleSync}
            style={{
              background: syncing ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
              border: "none", borderRadius: 10, padding: "8px 16px",
              color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 4px 16px rgba(139,92,246,0.3)",
              transition: "all 0.2s",
            }}
          >
            <span style={{ display: "inline-block", animation: syncing ? "spin 0.8s linear infinite" : "none" }}>⟳</span>
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        </div>
      </header>

      {/* LIVE STATUS */}
      <div style={{ padding: "8px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
          Live · synced 0s ago
          <span style={{ margin: "0 4px" }}>·</span>
          📍 <b style={{ color: "#f97316" }}>80 km</b> radius · 28 venues
        </div>
        {/* Source legend */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, flexWrap: "wrap" }}>
          {SOURCES.map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7280" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: SOURCE_COLORS[s] }} />
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div style={{ padding: "14px 24px", display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { icon: "📊", val: monthEvents, label: "Events / Month", color: "#38bdf8" },
          { icon: "📈", val: avgPerDay, label: "Avg / Active Day", color: "#818cf8" },
          { icon: "🔥", val: busiest ? `Mar ${busiest.d} (${busiest.c})` : "—", label: "Busiest Day", color: "#fb923c" },
          { icon: "✨", val: topCat ? topCat[0] : "—", label: "Top Category", color: "#34d399" },
          { icon: "📍", val: 28, label: "Venues In Range", color: "#f472b6" },
          { icon: "⚡", val: "6 Live", label: "API Sources", color: "#facc15" },
        ].map(s => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "12px 18px", flex: "1 1 130px",
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: "-0.02em" }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#4b5563", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* DENSITY LEGEND + CATEGORY FILTER */}
      <div style={{ padding: "8px 24px 4px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#4b5563", letterSpacing: "0.08em" }}>DENSITY:</span>
          {[{ l: "0", c: "#444" }, { l: "1–2", c: "#3b82f6" }, { l: "3–5", c: "#8b5cf6" }, { l: "6–10", c: "#f97316" }, { l: "10+", c: "#ef4444" }].map(d => (
            <div key={d.l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7280" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.c, display: "inline-block" }} />
              {d.l}
            </div>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{
              fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 20, cursor: "pointer",
              background: catFilter === c ? (c === "All" ? "#8b5cf6" : CAT_COLORS[c]) : "rgba(255,255,255,0.06)",
              color: catFilter === c ? "#fff" : "#6b7280",
              border: `1px solid ${catFilter === c ? "transparent" : "rgba(255,255,255,0.08)"}`,
              transition: "all 0.18s",
            }}>
              {c === "All" ? "All" : `${CAT_ICONS[c]} ${c}`}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ display: "flex", gap: 0, padding: "16px 24px", alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* CALENDAR */}
        <div style={{ flex: "1 1 620px", minWidth: 0 }}>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>March 2026</h2>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "#fff", borderRadius: 9, width: 32, height: 32, cursor: "pointer", fontSize: 14 }}>‹</button>
              <button style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", borderRadius: 9, padding: "0 14px", height: 32, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Today</button>
              <button style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "#fff", borderRadius: 9, width: 32, height: 32, cursor: "pointer", fontSize: 14 }}>›</button>
            </div>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#4b5563", padding: "4px 0", letterSpacing: "0.06em" }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {paddingBefore.map((_, i) => <div key={`p${i}`} />)}
            {days.map(day => {
              const dayEvs = eventsForDay(day);
              const count = dayEvs.length;
              const ds = getDensityStyle(count);
              const isToday = day === today;
              const catDots = CATEGORIES.filter(c => dayEvs.some(e => e.category === c));

              return (
                <div
                  key={day}
                  onClick={count > 0 ? (e) => handleDayClick(day, e.currentTarget) : undefined}
                  style={{
                    background: isToday ? "rgba(99,102,241,0.15)" : ds.bg,
                    border: isToday ? "1.5px solid #6366f1" : `1px solid rgba(255,255,255,${count > 0 ? "0.08" : "0.04"})`,
                    borderRadius: 10,
                    padding: "8px 8px 6px",
                    minHeight: 70,
                    cursor: count > 0 ? "pointer" : "default",
                    position: "relative",
                    transition: "background 0.2s, box-shadow 0.2s, transform 0.15s",
                    boxShadow: count > 0 ? ds.glow : "none",
                    display: "flex", flexDirection: "column",
                  }}
                  onMouseEnter={e => {
                    if (count > 0) {
                      e.currentTarget.style.background = isToday ? "rgba(99,102,241,0.25)" : ds.bg.replace(/[\d.]+\)$/, m => Math.min(parseFloat(m) + 0.08, 1) + ")");
                      e.currentTarget.style.transform = "scale(1.03)";
                      e.currentTarget.style.zIndex = 2;
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isToday ? "rgba(99,102,241,0.15)" : ds.bg;
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.zIndex = 1;
                  }}
                >
                  <span style={{
                    fontSize: 12, fontWeight: isToday ? 900 : 700,
                    color: isToday ? "#8b5cf6" : count > 0 ? "#e5e7eb" : "#4b5563",
                  }}>{day}</span>

                  {/* Category dots */}
                  {catDots.length > 0 && (
                    <div style={{ display: "flex", gap: 3, marginTop: 6, flexWrap: "wrap" }}>
                      {catDots.slice(0, 4).map(c => <CategoryDot key={c} category={c} size={6} />)}
                    </div>
                  )}

                  {/* Count badge */}
                  {count > 0 && (
                    <div style={{
                      position: "absolute", bottom: 6, right: 6,
                      background: ds.badge,
                      color: "#fff", fontSize: 10, fontWeight: 800,
                      width: 18, height: 18, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 2px 8px ${ds.badge}66`,
                    }}>{count}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ width: 260, flexShrink: 0, paddingLeft: 20, minWidth: 220 }}>
          {/* Category breakdown */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "16px", marginBottom: 14,
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "#4b5563", marginBottom: 12 }}>CATEGORY BREAKDOWN</div>
            {CATEGORIES.map(c => {
              const cnt = catCounts[c] || 0;
              const pct = monthEvents > 0 ? Math.round(cnt / monthEvents * 100) : 0;
              return (
                <div key={c} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#d1d5db" }}>{CAT_ICONS[c]} {c}</span>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{cnt} ({pct}%)</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: CAT_COLORS[c], borderRadius: 4, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hot dates */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "16px",
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "#4b5563", marginBottom: 12 }}>🔥 HOT DATES</div>
            {hotDays.map(({ d, c }) => {
              const ds = getDensityStyle(c);
              return (
                <div key={d} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer",
                }} onClick={e => {
                  const calCell = document.querySelector(`[data-day="${d}"]`);
                  if (calCell) { const rect = calCell.getBoundingClientRect(); handleDayClick(d, calCell); }
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: ds.badge, display: "inline-block", boxShadow: `0 0 5px ${ds.badge}` }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>
                      {new Date(2026, 2, d).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: ds.badge }}>{c}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── DISCOVER SECTION ──────────────────────────────────────────── */}
      <div style={{ padding: "8px 24px 32px" }}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>🎲 Discover</h3>
            <p style={{ margin: 0, fontSize: 12, color: "#4b5563", marginTop: 2 }}>Randomly surfaced from the current view</p>
          </div>
          <button
            onClick={() => {}}
            style={{
              marginLeft: "auto",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#9ca3af", borderRadius: 10, padding: "7px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >Shuffle ⟳</button>
          {/* Scroll arrows */}
          <button onClick={() => { discoverRef.current.scrollBy({ left: -310, behavior: "smooth" }) }} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "#fff", borderRadius: 9, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>‹</button>
          <button onClick={() => { discoverRef.current.scrollBy({ left: 310, behavior: "smooth" }) }} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "#fff", borderRadius: 9, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>›</button>
        </div>

        <div
          ref={discoverRef}
          style={{
            display: "flex", gap: 14, overflowX: "auto",
            paddingBottom: 12,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {discoverEvents.map(ev => (
            <DiscoverCard key={ev.id} event={ev} onLike={handleLike} onNotify={handleNotify} />
          ))}
        </div>
      </div>

      {/* DATE BUBBLE */}
      {selectedDay !== null && bubbleAnchor && (
        <DateBubble
          day={selectedDay}
          events={eventsForDay(selectedDay)}
          anchor={bubbleAnchor}
          onClose={() => { setSelectedDay(null); setBubbleAnchor(null); }}
          onLike={handleLike}
          onNotify={handleNotify}
        />
      )}

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.4); border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(-6px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}
