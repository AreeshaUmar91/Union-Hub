import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "../components/Box";
import { mediaData } from "../utils/mediaData";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../auth/api";
export const Dashboard = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const role = auth.user?.role;
  const isDirector = role === "director";
  const isDirectorOrPrincipal = role === "director" || role === "principal" || role === "vice_principal";
  const [meetings, setMeetings] = useState([]);
  const [news, setNews] = useState([]);
  const [polls, setPolls] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [directorUsers, setDirectorUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.token) return;
    let cancelled = false;
    setIsLoading(true);

    Promise.allSettled([
      apiRequest("/content/meetings", { token: auth.token }),
      apiRequest("/content/news", { token: auth.token }),
      apiRequest("/content/votes", { token: auth.token }),
      apiRequest("/content/notifications", { token: auth.token }),
      isDirectorOrPrincipal ? apiRequest("/director/users", { token: auth.token }) : Promise.resolve({ users: [] }),
    ])
      .then((results) => {
        if (cancelled) return;
        const getValue = (idx, fallback) =>
          results[idx]?.status === "fulfilled" ? results[idx].value : fallback;

        const meetingsRes = getValue(0, { items: [] });
        const newsRes = getValue(1, { items: [] });
        const votesRes = getValue(2, { items: [] });
        const notificationsRes = getValue(3, { items: [] });
        const directorUsersRes = getValue(4, { users: [] });

        setMeetings((meetingsRes.items || []).map((i) => ({ id: i.id, ...(i.data || {}) })));
        setNews(
          (newsRes.items || []).map((i) => ({
            id: i.id,
            created_at: i.created_at,
            updated_at: i.updated_at,
            ...(i.data || {}),
          }))
        );
        setPolls((votesRes.items || []).map((i) => ({ id: i.id, ...(i.data || {}) })));

        setNotifications(
          (notificationsRes.items || []).map((i) => ({
            id: i.id,
            created_at: i.created_at,
            updated_at: i.updated_at,
            ...(i.data || {}),
          }))
        );
        setDirectorUsers(Array.isArray(directorUsersRes.users) ? directorUsersRes.users : []);
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auth.token, isDirectorOrPrincipal]);

  const meetingStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const withTime = meetings
      .map((m) => {
        const dateStr = m.date ? String(m.date) : "";
        const startStr = m.startTime ? String(m.startTime) : "00:00";
        const t = Date.parse(`${dateStr}T${startStr}`);
        return { m, time: Number.isFinite(t) ? t : null };
      })
      .filter((x) => x.time !== null);

    const upcoming = withTime.filter((x) => x.time >= today).sort((a, b) => a.time - b.time);
    const next = upcoming[0]?.m || null;

    const formatDate = (dateStr) => {
      const t = Date.parse(String(dateStr));
      if (!Number.isFinite(t)) return "—";
      return new Date(t).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
    };

    return {
      total: meetings.length,
      upcomingCount: upcoming.length,
      nextTitle: next?.title || "—",
      nextWhen: next?.date ? formatDate(next.date) : "—",
    };
  }, [meetings]);

  const voteStats = useMemo(() => {
    const totalCandidates = polls.reduce((sum, p) => sum + (Array.isArray(p.candidates) ? p.candidates.length : 0), 0);
    const totalVotes = polls.reduce((sum, p) => {
      if (!Array.isArray(p.candidates)) return sum;
      return (
        sum +
        p.candidates.reduce((s, c) => {
          const v = Number(c?.votes);
          return s + (Number.isFinite(v) ? v : 0);
        }, 0)
      );
    }, 0);
    return { totalPolls: polls.length, totalCandidates, totalVotes };
  }, [polls]);

  const newsStats = useMemo(() => {
    const sorted = news
      .slice()
      .sort((a, b) => Date.parse(b.updated_at || b.created_at || 0) - Date.parse(a.updated_at || a.created_at || 0));
    const latest = sorted[0] || null;
    const formatDateTime = (iso) => {
      const t = Date.parse(String(iso));
      if (!Number.isFinite(t)) return "—";
      return new Date(t).toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    };
    return {
      total: news.length,
      latestTitle: latest?.title || "—",
      latestWhen: latest?.updated_at || latest?.created_at ? formatDateTime(latest.updated_at || latest.created_at) : "—",
    };
  }, [news]);

  const employeeStats = useMemo(() => {
    const allowedRoles = new Set(["employee", "teacher", "tech_staff", "principal", "vice_principal"]);
    const rows = (Array.isArray(directorUsers) ? directorUsers : []).filter((u) => allowedRoles.has(u?.role));

    const counts = rows.reduce(
      (acc, u) => {
        acc.total += 1;
        if (u.role === "employee") acc.employees += 1;
        if (u.role === "teacher") acc.teachers += 1;
        if (u.role === "tech_staff") acc.techStaff += 1;
        if (u.role === "principal") acc.principals += 1;
        if (u.role === "vice_principal") acc.vicePrincipals += 1;
        return acc;
      },
      { total: 0, employees: 0, teachers: 0, techStaff: 0, principals: 0, vicePrincipals: 0 }
    );

    const sorted = rows
      .slice()
      .sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
    const latest = sorted[0] || null;

    const formatDateTime = (iso) => {
      const t = Date.parse(String(iso));
      if (!Number.isFinite(t)) return "—";
      return new Date(t).toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    };

    return {
      ...counts,
      latestEmail: latest?.email || "—",
      latestWhen: latest?.created_at ? formatDateTime(latest.created_at) : "—",
    };
  }, [directorUsers]);

  const notificationStats = useMemo(() => {
    const sorted = notifications
      .slice()
      .sort((a, b) => Date.parse(b.updated_at || b.created_at || 0) - Date.parse(a.updated_at || a.created_at || 0));
    const latest = sorted[0] || null;

    const settingsSorted = sorted.filter((n) => n?.kind === "reminder_settings");
    const latestSettings = settingsSorted[0] || null;

    const formatDateTime = (iso) => {
      const t = Date.parse(String(iso));
      if (!Number.isFinite(t)) return "—";
      return new Date(t).toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    };

    const enabled = Boolean(latestSettings?.enabled);
    const time = latestSettings?.selectedTime ?? null;

    return {
      total: notifications.length,
      enabled,
      time: time ? String(time) : "—",
      latestTitle: latest?.title || "—",
      latestWhen: latest?.updated_at || latest?.created_at ? formatDateTime(latest.updated_at || latest.created_at) : "—",
    };
  }, [notifications]);

  const StatCard = ({ title, icon, accent, headline, rows, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-grey font-montserrat font-semibold text-[13px] tracking-wide">
            {title}
          </div>
          <div className="text-black font-montserrat font-semibold text-[22px] leading-tight mt-1 truncate">
            {headline}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <img src={icon} alt="" className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 grid gap-1">
        {rows.map((r) => (
          <div key={r.label} className="text-[12px] text-grey font-montserrat flex justify-between gap-3">
            <span className="truncate">{r.label}</span>
            <span className="text-black font-semibold">{r.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 text-[12px] text-grey font-montserrat">
        {isLoading ? "Loading…" : "Tap to open"}
      </div>
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3 flex-wrap" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard
          title="Meetings"
          icon={mediaData.Meetings}
          accent="bg-[#05B9B926]"
          headline={isLoading ? "—" : `${meetingStats.upcomingCount} upcoming`}
          rows={[
            { label: "Total meetings", value: isLoading ? "—" : meetingStats.total },
            { label: "Next meeting", value: isLoading ? "—" : meetingStats.nextTitle },
            { label: "Next date", value: isLoading ? "—" : meetingStats.nextWhen },
          ]}
          onClick={() => navigate("/layout/meetings")}
        />

        <StatCard
          title="Vote"
          icon={mediaData.Vote}
          accent="bg-[#FF8A1426]"
          headline={isLoading ? "—" : `${voteStats.totalPolls} polls`}
          rows={[
            { label: "Candidates", value: isLoading ? "—" : voteStats.totalCandidates },
            { label: "Votes cast", value: isLoading ? "—" : voteStats.totalVotes },
            { label: "Total polls", value: isLoading ? "—" : voteStats.totalPolls },
          ]}
          onClick={() => navigate("/layout/vote")}
        />

        <StatCard
          title="News & Updates"
          icon={mediaData.News}
          accent="bg-[#9B05B926]"
          headline={isLoading ? "—" : `${newsStats.total} posts`}
          rows={[
            { label: "Latest", value: isLoading ? "—" : newsStats.latestTitle },
            { label: "Updated", value: isLoading ? "—" : newsStats.latestWhen },
            { label: "Total posts", value: isLoading ? "—" : newsStats.total },
          ]}
          onClick={() => navigate("/layout/news")}
        />

        {isDirectorOrPrincipal ? (
          <StatCard
            title="Employees"
            icon={mediaData.Employees}
            accent="bg-[#007FFF26]"
            headline={isLoading ? "—" : `${employeeStats.total} accounts`}
            rows={[
              // { label: "Employees", value: isLoading ? "—" : employeeStats.employees },
              { label: "Principals", value: isLoading ? "—" : employeeStats.principals },
              { label: "Vice Principals", value: isLoading ? "—" : employeeStats.vicePrincipals },
              { label: "Teachers", value: isLoading ? "—" : employeeStats.teachers },
              { label: "Tech Staff", value: isLoading ? "—" : employeeStats.techStaff },
            ]}
            onClick={() => navigate("/layout/employees")}
          />
        ) : null}

        {isDirectorOrPrincipal ? (
          <StatCard
            title="Notifications"
            icon={mediaData.Notification}
            accent="bg-[#8B5CF626]"
            headline={isLoading ? "—" : notificationStats.enabled ? "Reminders ON" : "Reminders OFF"}
            rows={[
              { label: "Reminder time", value: isLoading ? "—" : notificationStats.time },
              { label: "Latest", value: isLoading ? "—" : notificationStats.latestTitle },
              { label: "Total notifications", value: isLoading ? "—" : notificationStats.total },
            ]}
            onClick={() => navigate("/layout/notifications")}
          />
        ) : null}
      </div>
    </div>
  );
};
