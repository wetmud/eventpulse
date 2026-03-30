import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Heart, Bell, X, Ticket } from "@phosphor-icons/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const CATEGORIES = ["Concerts", "Theatre", "Comedy", "Festivals", "Sports", "Other"];

const THEME = {
  paper:    "#F5F0E8",
  ink:      "#1A1714",
  warmWhite:"#FAF8F4",
  accent:   "#C0392B",
  amber:    "#D48B2D",
  mid:      "#8C8070",
  deep:     "#2C2420",
};

const CAT_COLORS = {
  Concerts:  "#C0392B",
  Theatre:   "#D48B2D",
  Comedy:    "#8C6D3F",
  Festivals: "#5C7A5C",
  Sports:    "#3A6080",
  Other:     "#7A6080",
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
  User:         "#6b7280",
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&q=80",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function capitalizeSource(source) {
  if (!source) return "Other";
  const map = {
    ticketmaster:    "Ticketmaster",
    eventbrite:      "Eventbrite",
    bandsintown:     "Bandsintown",
    songkick:        "Songkick",
    stubhub:         "StubHub",
    user_submission: "User",
  };
  return map[source] || source.charAt(0).toUpperCase() + source.slice(1);
}

function normalizeApiEvent(raw, liked, notified) {
  const day = parseInt(raw.event_date?.split("-")[2] || "1", 10);
  const time = raw.start_time ? raw.start_time.substring(0, 5) : "";
  const source = capitalizeSource(raw.source);
  const imgIdx = raw.id ? raw.id.charCodeAt(0) % FALLBACK_IMAGES.length : 0;

  return {
    id:             raw.id,
    title:          raw.title,
    artist:         raw.subcategory || raw.title,
    category:       raw.category || "Other",
    date:           raw.event_date,
    day,
    time,
    venue:          raw.venues?.name || "Unknown Venue",
    source,
    priceMin:       raw.price_min,
    priceMax:       raw.price_max,
    image:          raw.image_url || FALLBACK_IMAGES[imgIdx],
    popularityScore: raw.popularity_score || 0,
    ticketUrl:      raw.ticket_url || null,
    liked:          liked.has(raw.id),
    notified:       notified.has(raw.id),
  };
}

// ─── DENSITY HELPERS ─────────────────────────────────────────────────────────

function getDensityStyle(count) {
  if (count === 0) return { bg: "rgba(0,0,0,0.03)", dot: "#ccc", glow: "none", badge: "#ccc" };
  if (count <= 2)  return { bg: "rgba(140,128,112,0.20)", dot: "#8C8070", glow: "none", badge: "#8C8070" };
  if (count <= 5)  return { bg: "rgba(212,139,45,0.25)",  dot: "#D48B2D", glow: "none", badge: "#D48B2D" };
  if (count <= 10) return { bg: "rgba(192,57,43,0.22)",   dot: "#C0392B", glow: "none", badge: "#C0392B" };
  return { bg: "rgba(192,57,43,0.35)", dot: "#C0392B", glow: "none", badge: "#C0392B" };
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function SourceBadge({ source }) {
  const color = SOURCE_COLORS[source] || "#6b7280";
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
      padding: "2px 6px", borderRadius: 20,
      background: color + "33",
      color,
      border: `1px solid ${color}55`,
    }}>{source}</span>
  );
}

function CategoryDot({ category, size = 7 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      background: CAT_COLORS[category], flexShrink: 0,
    }} />
  );
}

function EventCard({ event, onLike, onNotify, onOpen }) {
  const catColor = CAT_COLORS[event.category] || "#6b7280";
  return (
    <div
      onClick={() => onOpen(event)}
      style={{
        background: "#ffffff",
        borderRadius: 10,
        boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
        border: "1px solid #E8E2D9",
        borderLeft: `4px solid ${catColor}`,
        padding: "0.85rem 1rem",
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
        cursor: "pointer",
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: catColor }}>
            {event.category}
          </span>
          <SourceBadge source={event.source} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1714", lineHeight: 1.3, marginBottom: 4 }}>
          {event.title}
        </div>
        <div style={{ fontSize: 11, color: "#6b6055", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {event.time && (
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Clock size={11} weight="bold" />
              {event.time}
            </span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <MapPin size={11} weight="bold" />
            {event.venue}
          </span>
          {event.priceMin != null && <span style={{ color: "#16a34a", fontWeight: 600 }}>${event.priceMin}–${event.priceMax}</span>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); onLike(event.id); }}
          style={{
            background: event.liked ? "#fff0f0" : "#f9f7f4",
            border: `1px solid ${event.liked ? "#fca5a5" : "#E8E2D9"}`,
            borderRadius: 8, width: 30, height: 30, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: event.liked ? "#e63030" : "#9c8e82",
          }}
        ><Heart size={14} weight={event.liked ? "fill" : "regular"} /></button>
        <button
          onClick={e => { e.stopPropagation(); onNotify(event.id); }}
          style={{
            background: event.notified ? "#fffbeb" : "#f9f7f4",
            border: `1px solid ${event.notified ? "#fcd34d" : "#E8E2D9"}`,
            borderRadius: 8, width: 30, height: 30, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: event.notified ? "#b45309" : "#9c8e82",
          }}
        ><Bell size={14} weight={event.notified ? "fill" : "regular"} /></button>
        {event.ticketUrl && (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              background: "transparent",
              color: "#C0392B", fontSize: 9, fontWeight: 700,
              padding: "4px 7px", borderRadius: 6, textDecoration: "none",
              letterSpacing: "0.04em",
              border: "1px solid #C0392B",
              display: "flex", alignItems: "center", gap: 3,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#C0392B"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C0392B"; }}
          >
            <Ticket size={9} weight="bold" />
            BUY
          </a>
        )}
      </div>
    </div>
  );
}

// ─── LOADING SKELETON ─────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
      {Array.from({ length: 35 }, (_, i) => (
        <div key={i} style={{
          background: "rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.05)",
          borderRadius: 8, minHeight: 58,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      ))}
    </div>
  );
}

// ─── EVENT MODAL ─────────────────────────────────────────────────────────────

function EventModal({ event, onClose, onLike, onNotify }) {
  const catColor = CAT_COLORS[event.category] || "#6b7280";

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const formattedDate = event.date
    ? new Date(event.date + "T12:00:00").toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })
    : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(26,23,20,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#FAF8F4",
          borderRadius: 16,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", height: 220, flexShrink: 0 }}>
          {event.image ? (
            <img
              src={event.image}
              alt={event.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            />
          ) : null}
          {/* Fallback */}
          <div style={{
            display: event.image ? "none" : "flex",
            width: "100%", height: "100%",
            background: `linear-gradient(135deg, ${catColor}33 0%, ${catColor}88 100%)`,
            alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 8,
          }}>
            <span style={{ fontSize: 40 }}>{CAT_ICONS[event.category]}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: catColor, opacity: 0.8 }}>{event.venue}</span>
          </div>
          {/* Left color bar overlay */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: catColor }} />
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(26,23,20,0.6)", border: "none",
              borderRadius: "50%", width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff",
            }}
          ><X size={16} weight="bold" /></button>
        </div>

        {/* Content */}
        <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              color: catColor, textTransform: "uppercase",
            }}>{event.category}</span>
            <SourceBadge source={event.source} />
          </div>

          <h2 style={{
            margin: "0 0 1rem 0",
            fontSize: "1.35rem", fontWeight: 800,
            lineHeight: 1.2, color: "#1A1714",
            fontFamily: "'Playfair Display', Georgia, serif",
          }}>{event.title}</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.25rem" }}>
            {formattedDate && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4a4040" }}>
                <Clock size={14} weight="bold" color={catColor} />
                <span>{formattedDate}{event.time ? ` · ${event.time}` : ""}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4a4040" }}>
              <MapPin size={14} weight="bold" color={catColor} />
              <span>{event.venue}</span>
            </div>
            {event.priceMin != null && (
              <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>
                ${event.priceMin}{event.priceMax && event.priceMax !== event.priceMin ? `–$${event.priceMax}` : ""}
              </div>
            )}
          </div>

          {/* Action row */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => onLike(event.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: event.liked ? "#fff0f0" : "#F5F0E8",
                border: `1px solid ${event.liked ? "#fca5a5" : "#E8E2D9"}`,
                borderRadius: 10, padding: "8px 14px",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                color: event.liked ? "#e63030" : "#6b6055",
              }}
            >
              <Heart size={14} weight={event.liked ? "fill" : "regular"} />
              {event.liked ? "Saved" : "Save"}
            </button>
            <button
              onClick={() => onNotify(event.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: event.notified ? "#fffbeb" : "#F5F0E8",
                border: `1px solid ${event.notified ? "#fcd34d" : "#E8E2D9"}`,
                borderRadius: 10, padding: "8px 14px",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                color: event.notified ? "#b45309" : "#6b6055",
              }}
            >
              <Bell size={14} weight={event.notified ? "fill" : "regular"} />
              Notify
            </button>
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginLeft: "auto",
                  display: "flex", alignItems: "center", gap: 6,
                  background: "#1A1714", color: "#fff",
                  borderRadius: 10, padding: "8px 20px",
                  fontSize: 13, fontWeight: 800, textDecoration: "none",
                  letterSpacing: "0.02em",
                }}
              >
                <Ticket size={14} weight="bold" />
                Get tickets
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function OnTonight() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [liked, setLiked] = useState(new Set());
  const [notified, setNotified] = useState(new Set());
  const [selectedDay, setSelectedDay] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [toast, setToast] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const isMobile = windowWidth < 900;

  const { data: apiData, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["events", year, month],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/events?month=${month}&year=${year}&limit=500`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const allEvents = (apiData?.events || []).map(e => normalizeApiEvent(e, liked, notified));

  const filteredEvents = allEvents.filter(e => {
    const matchSearch = !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase()) ||
      e.artist.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || e.category === catFilter;
    const matchDay = !selectedDay || e.day === selectedDay;
    return matchSearch && matchCat && matchDay;
  });

  const eventsForDay = (day) => allEvents.filter(e => e.day === day);

  const navigateMonth = (dir) => {
    setSelectedDay(null);
    setMonth(prev => {
      let m = prev + dir;
      if (m < 1) { setYear(y => y - 1); return 12; }
      if (m > 12) { setYear(y => y + 1); return 1; }
      return m;
    });
  };

  const goToday = () => {
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
    setSelectedDay(null);
  };

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleLike = useCallback((id) => {
    setLiked(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        const ev = allEvents.find(e => e.id === id);
        if (ev) showToast(`❤️ Liked ${ev.title}`);
      }
      return next;
    });
  }, [allEvents, showToast]);

  const handleNotify = useCallback((id) => {
    setNotified(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        const ev = allEvents.find(e => e.id === id);
        if (ev) showToast(`🔔 You'll be notified about ${ev.title}`);
      }
      return next;
    });
  }, [allEvents, showToast]);

  const handleSync = () => {
    refetch();
    showToast("⟳ Refreshing events…");
  };

  const daysInMonth = new Date(year, month, 0).getDate();

  const hotDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .map(d => ({ d, c: eventsForDay(d).length }))
    .filter(x => x.c > 0)
    .sort((a, b) => b.c - a.c)
    .slice(0, 6);

  const catCounts = {};
  CATEGORIES.forEach(c => { catCounts[c] = allEvents.filter(e => e.category === c).length; });

  const firstDay = new Date(year, month - 1, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingBefore = Array.from({ length: firstDay }, () => null);
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const todayDay = now.getDate();

  const syncedLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", background: THEME.paper, minHeight: "100vh", color: THEME.ink, overflowX: "hidden" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "rgba(26,26,26,0.92)", color: "#fff",
          padding: "10px 20px", borderRadius: 30,
          fontSize: 13, fontWeight: 700, zIndex: 9999,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          animation: "fadeIn 0.2s ease",
          whiteSpace: "nowrap",
        }}>{toast}</div>
      )}

      {/* Event Modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onLike={handleLike}
          onNotify={handleNotify}
        />
      )}

      {/* HERO — 100vh */}
      <div id="hero" style={{ minHeight: "100vh", background: THEME.paper, display: "flex", flexDirection: "column" }}>

        {/* Nav */}
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 2.5rem" }}>
          <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.02em", color: THEME.ink, fontFamily: "'Playfair Display', Georgia, serif" }}>
            <span>On</span><span style={{ color: THEME.accent }}>Tonight</span>
            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'Inter', sans-serif", color: THEME.mid, marginLeft: 6, letterSpacing: "0.04em" }}>· GTA</span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <a href="#app" style={{ fontSize: 13, fontWeight: 600, color: "#6b6055", textDecoration: "none" }}>How it works</a>
            <button style={{
              background: "#1A1714", color: "#fff", border: "none",
              borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>Sign in</button>
          </div>
        </nav>

        {/* Hero body — two columns */}
        <div style={{
          display: "flex", flex: 1, alignItems: "center",
          padding: isMobile ? "2rem 1.5rem" : "2rem 2.5rem",
          gap: "3rem", maxWidth: "1400px", width: "100%", margin: "0 auto",
          flexDirection: isMobile ? "column" : "row",
        }}>

          {/* Left: editorial */}
          <div style={{ flex: "0 0 55%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#9c8e82", textTransform: "uppercase", marginBottom: "1.25rem" }}>
              ONTONIGHT · GTA
            </div>

            <h1 style={{
              fontSize: "clamp(4rem, 8vw, 8.5rem)",
              fontWeight: 700,
              lineHeight: 0.93,
              letterSpacing: "-0.02em",
              color: THEME.ink,
              margin: "0 0 1.5rem 0",
              whiteSpace: "pre-line",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}>{"Everything\nhappening\ntonight."}</h1>

            <p style={{ fontSize: "1.1rem", color: THEME.mid, margin: "0 0 2rem 0", lineHeight: 1.5 }}>
              Every GTA concert, festival, and show. One calendar. No noise.
            </p>

            {/* Three coloured strips */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: "2.5rem" }}>
              {[
                { color: THEME.accent, label: "Concerts", sub: "847 shows this month" },
                { color: THEME.amber,  label: "Festivals & Outdoor", sub: "Across 28 GTA venues" },
                { color: THEME.deep,   label: "Theatre · Comedy · Sports", sub: "Updated daily from live sources" },
              ].map(strip => (
                <div key={strip.label} style={{
                  background: strip.color,
                  height: 66,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 1.25rem",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>{strip.label}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{strip.sub}</span>
                </div>
              ))}
            </div>

            {/* Scroll CTA */}
            <a href="#app" style={{
              fontSize: 13, fontWeight: 700, color: "#6b6055",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
              animation: "bounceDown 1.8s ease-in-out infinite",
            }}>↓ Browse events</a>
          </div>

          {/* Right: poster image */}
          {!isMobile && (
            <div style={{ flex: "0 0 42%", display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 0 }}>
              <img
                src="/venues-poster.png"
                alt="GTA venues"
                style={{
                  width: "100%", maxWidth: "420px", maxHeight: "85vh",
                  objectFit: "cover", objectPosition: "top",
                  borderRadius: "8px",
                  border: "3px solid #e8e0d4",
                  boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
                  display: "block",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* STATS STRIP */}
      <div style={{ background: "#EBE5DC", borderTop: "1px solid #D9D2C8", borderBottom: "1px solid #D9D2C8", padding: "1.25rem 2.5rem" }}>

        {/* Counters row */}
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
          {[
            { val: isLoading ? "…" : filteredEvents.length, label: "Events this month" },
            { val: "28", label: "Venues" },
            { val: "6", label: "Categories" },
            { val: "4", label: "Live sources" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", color: "#1A1714" }}>{s.val}</span>
              <span style={{ fontSize: 11, color: "#6b6055", fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b6055" }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isError ? "#ef4444" : "#22c55e",
              display: "inline-block",
            }} />
            {isError ? "Error loading events" : `Synced ${syncedLabel}`}
          </div>
        </div>

        <div style={{ height: 1, background: "#d4ccc4", marginBottom: "1rem" }} />

        {/* Hot dates chips */}
        {hotDays.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#9c8e82" }}>🔥 HOT DATES</span>
            {hotDays.map(({ d, c }) => {
              const ds = getDensityStyle(c);
              const dateLabel = new Date(year, month - 1, d).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
              const isSelected = selectedDay === d;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d === selectedDay ? null : d)}
                  style={{
                    background: isSelected ? ds.badge : "#fff",
                    border: `1px solid ${isSelected ? ds.badge : "#d4ccc4"}`,
                    borderRadius: 20, padding: "4px 10px",
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                    color: isSelected ? "#fff" : "#1A1714",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  {dateLabel}
                  <span style={{
                    background: isSelected ? "rgba(255,255,255,0.3)" : ds.badge,
                    color: isSelected ? "#fff" : "#fff",
                    borderRadius: 10, padding: "0px 5px", fontSize: 10, fontWeight: 800,
                  }}>{c}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Category breakdown pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#9c8e82" }}>CATEGORIES</span>
          <button
            onClick={() => setCatFilter("All")}
            style={{
              background: catFilter === "All" ? "#1A1714" : "#fff",
              color: catFilter === "All" ? "#fff" : "#1A1714",
              border: "1px solid #d4ccc4",
              borderRadius: 20, padding: "4px 12px",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}
          >All</button>
          {CATEGORIES.filter(c => catCounts[c] > 0).map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c === catFilter ? "All" : c)}
              style={{
                background: catFilter === c ? CAT_COLORS[c] : "#fff",
                color: catFilter === c ? "#fff" : "#1A1714",
                border: `1px solid ${catFilter === c ? CAT_COLORS[c] : "#d4ccc4"}`,
                borderRadius: 20, padding: "4px 12px",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}
            >
              {CAT_ICONS[c]} {c} <span style={{ opacity: 0.7, fontSize: 10 }}>({catCounts[c]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ERROR BANNER */}
      {isError && (
        <div style={{
          margin: "12px 2.5rem", padding: "12px 16px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 10, fontSize: 13, color: "#b91c1c",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          ⚠️ Could not load events from the API. Check that the backend is running.
          <button onClick={() => refetch()} style={{
            marginLeft: "auto", background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)", color: "#b91c1c",
            borderRadius: 8, padding: "4px 12px", fontSize: 12, cursor: "pointer",
          }}>Retry</button>
        </div>
      )}

      {/* MAIN APP — two column */}
      <div id="app" style={{
        display: isMobile ? "block" : "flex",
        alignItems: "flex-start", gap: "1.5rem",
        padding: isMobile ? "1rem 1rem 3rem" : "1.5rem 2.5rem 3rem",
        maxWidth: "1400px", margin: "0 auto", width: "100%",
      }}>

        {/* LEFT: sticky calendar panel */}
        <div style={{
          width: isMobile ? "100%" : "380px",
          flexShrink: 0,
          position: isMobile ? "relative" : "sticky",
          top: "1.5rem",
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
          border: "1px solid #E8E2D9",
          overflow: "hidden",
          marginBottom: isMobile ? "1rem" : 0,
        }}>
          {/* Month nav */}
          <div style={{ padding: "1rem 1rem 0.75rem", borderBottom: "1px solid #E8E2D9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", margin: 0, flex: 1, color: "#1A1714" }}>
                {MONTH_NAMES[month - 1]} {year}
              </h2>
              <button onClick={() => navigateMonth(-1)} style={{
                background: "#F5F0E8", border: "1px solid #E8E2D9", color: "#1A1714",
                borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 14,
              }}>‹</button>
              <button onClick={goToday} style={{
                background: "#1A1714", border: "none", color: "#fff",
                borderRadius: 8, padding: "0 12px", height: 30, cursor: "pointer",
                fontSize: 11, fontWeight: 700,
              }}>Today</button>
              <button onClick={() => navigateMonth(1)} style={{
                background: "#F5F0E8", border: "1px solid #E8E2D9", color: "#1A1714",
                borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 14,
              }}>›</button>
            </div>

            {selectedDay && (
              <div style={{
                marginTop: "0.5rem", padding: "6px 10px", background: "#F5F0E8",
                borderRadius: 8, fontSize: 12, color: "#6b6055", fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span>Filtered: {MONTH_NAMES[month - 1].slice(0, 3)} {selectedDay}</span>
                <button onClick={() => setSelectedDay(null)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#9c8e82", fontSize: 14, padding: 0,
                }}>✕</button>
              </div>
            )}
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, padding: "0.5rem 0.75rem 0.25rem" }}>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#9c8e82", padding: "3px 0", letterSpacing: "0.04em" }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ padding: "0 0.75rem 0.75rem" }}>
            {isLoading ? <CalendarSkeleton /> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                {paddingBefore.map((_, i) => <div key={`p${i}`} />)}
                {days.map(day => {
                  const dayEvs = eventsForDay(day);
                  const count = dayEvs.length;
                  const ds = getDensityStyle(count);
                  const isToday = isCurrentMonth && day === todayDay;
                  const isSelected = selectedDay === day;
                  const catDots = CATEGORIES.filter(c => dayEvs.some(e => e.category === c));

                  return (
                    <div
                      key={day}
                      data-day={day}
                      onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                      style={{
                        background: isSelected
                          ? "#1A1714"
                          : ds.bg,
                        border: isSelected
                          ? "1.5px solid #1A1714"
                          : `1px solid ${count > 0 ? "#E8E2D9" : "rgba(0,0,0,0.05)"}`,
                        borderBottom: isToday && !isSelected ? "2.5px solid #C0392B" : undefined,
                        borderRadius: 8,
                        padding: "6px 5px 5px",
                        minHeight: 58,
                        cursor: count > 0 ? "pointer" : "default",
                        position: "relative",
                        transition: "background 0.15s",
                        display: "flex", flexDirection: "column",
                      }}
                    >
                      <span style={{
                        fontSize: 11, fontWeight: isToday || isSelected ? 900 : 600,
                        color: isSelected ? "#fff" : isToday ? "#C0392B" : count > 0 ? "#1A1714" : "#9c8e82",
                      }}>{day}</span>

                      {catDots.length > 0 && (
                        <div style={{ display: "flex", gap: 2, marginTop: 4, flexWrap: "wrap" }}>
                          {catDots.slice(0, 4).map(c => <CategoryDot key={c} category={c} size={5} />)}
                        </div>
                      )}

                      {count > 0 && (
                        <div style={{
                          position: "absolute", bottom: 4, right: 4,
                          background: isSelected ? "rgba(255,255,255,0.25)" : ds.badge,
                          color: "#fff", fontSize: 9, fontWeight: 800,
                          width: 16, height: 16, borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{count}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category filter pills */}
          <div style={{ padding: "0.75rem", borderTop: "1px solid #E8E2D9" }}>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {["All", ...CATEGORIES].map(c => (
                <button key={c} onClick={() => setCatFilter(c)} style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, cursor: "pointer",
                  background: catFilter === c ? (c === "All" ? "#1A1714" : CAT_COLORS[c]) : "#F5F0E8",
                  color: catFilter === c ? "#fff" : "#6b6055",
                  border: `1px solid ${catFilter === c ? "transparent" : "#E8E2D9"}`,
                  transition: "all 0.15s",
                }}>
                  {c === "All" ? "All" : `${CAT_ICONS[c]} ${c}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: event list */}
        <div style={{
          flex: 1, minWidth: 0,
          maxHeight: isMobile ? "none" : "calc(100vh - 120px)",
          overflowY: "auto",
        }}>
          {/* Sticky search bar */}
          <div style={{
            position: "sticky", top: 0, zIndex: 10,
            background: "#F5F0E8", paddingBottom: "0.75rem",
          }}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                fontSize: 14, color: "#9c8e82",
              }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search artists, venues, events…"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "#ffffff",
                  border: "1px solid #E8E2D9",
                  borderRadius: 10, color: "#1A1714",
                  padding: "10px 12px 10px 36px",
                  fontSize: 13, outline: "none",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                }}
              />
              <button
                onClick={handleSync}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: isFetching ? "#F5F0E8" : "#1A1714",
                  border: "none", borderRadius: 8, padding: "5px 12px",
                  color: isFetching ? "#6b6055" : "#fff",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <span style={{ display: "inline-block", animation: isFetching ? "spin 0.8s linear infinite" : "none" }}>⟳</span>
                {isFetching ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>

          {/* Event list heading */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1A1714", letterSpacing: "-0.01em" }}>
                Events
              </span>
              {selectedDay ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#6b6055", fontWeight: 600 }}>
                    {MONTH_NAMES[month - 1]} {selectedDay} · {filteredEvents.length} showing
                  </span>
                  <button onClick={() => setSelectedDay(null)} style={{
                    background: "#1A1714", border: "none", borderRadius: 6,
                    color: "#fff", fontSize: 10, padding: "2px 8px", cursor: "pointer", fontWeight: 700,
                  }}>Clear</button>
                </div>
              ) : (
                <span style={{ fontSize: 11, color: "#9c8e82", fontWeight: 600 }}>
                  {isLoading ? "Loading…" : `${filteredEvents.length} in ${MONTH_NAMES[month - 1]}`}
                </span>
              )}
            </div>
          </div>

          {/* Event cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filteredEvents.length === 0 && !isLoading && (
              <div style={{
                textAlign: "center", padding: "3rem 1.5rem",
                color: "#9c8e82",
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>
                  {isError ? "⚠️" : selectedDay ? "🌙" : "🔍"}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#6b6055", marginBottom: 4 }}>
                  {isError
                    ? "Could not load events"
                    : selectedDay
                      ? `Nothing on ${MONTH_NAMES[month - 1]} ${selectedDay}`
                      : "No events match your filters"
                  }
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                  {isError
                    ? "Is the backend running?"
                    : selectedDay
                      ? "Toronto doesn't take many nights off — try the night before or after."
                      : "Try removing a filter or broadening your search."
                  }
                </div>
              </div>
            )}
            {isLoading && (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#9c8e82", fontSize: 13 }}>
                Loading events…
              </div>
            )}
            {filteredEvents.map(ev => (
              <EventCard key={ev.id} event={ev} onLike={handleLike} onNotify={handleNotify} onOpen={setSelectedEvent} />
            ))}
          </div>
        </div>
      </div>

      {/* Global styles */}
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(-6px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes bounceDown { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
      `}</style>
    </div>
  );
}
