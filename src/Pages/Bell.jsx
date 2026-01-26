import { useEffect, useMemo, useState } from "react";
import { mediaData } from "../utils/mediaData";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../auth/api";

export const Bell = ({ notificationsFromParent = [] }) => {
  const auth = useAuth();
  const [notifications, setNotifications] = useState([]);
  const fromParent = useMemo(
    () => (Array.isArray(notificationsFromParent) ? notificationsFromParent : []),
    [notificationsFromParent]
  );

  // Add new notifications from parent
  useEffect(() => {
    if (fromParent.length > 0) {
      setNotifications(fromParent);
    }
  }, [fromParent]);

  useEffect(() => {
    if (!auth.token) return;
    if (fromParent.length > 0) return;

    apiRequest("/content/notifications", { token: auth.token })
      .then((data) => {
        const items = data?.items || [];
        const mapped = items.map((i) => ({
          id: i.id,
          title: i?.data?.title || "Notification",
          content: i?.data?.content || "",
          image: i?.data?.image || null,
          time: i?.created_at
            ? new Date(i.created_at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        }));
        setNotifications(mapped);
      })
      .catch(() => {});
  }, [auth.token, fromParent.length]);

  return (
    <div className="w-full bg-white rounded-[16px] shadow-lg border border-gray-200 p-4">
      <div className="border-b pb-3 mb-3">
        <h2 className="text-black font-montserrat font-semibold text-[20px]">
          Notification History
        </h2>
      </div>

      {notifications.length === 0 ? (
        <div className="flex justify-center">
          <div className="bg-white rounded-[10px] w-full flex items-center justify-center p-4">
            <div className="flex flex-col items-center justify-center gap-[16px]">
              <img
                src={mediaData.Nomeeting}
                alt="content"
                className="w-[140px] h-[140px] object-cover rounded"
              />
              <h3 className="font-montserrat font-semibold text-[18px] text-black text-center">
                No Data Available Yet...
              </h3>
              <p className="font-montserrat font-normal text-[14px] text-center text-grey">
                Notifications will appear here when there is new activity.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {notifications.map((notif) => (
            <div key={notif.id ?? `${notif.title}-${notif.time}`} className="flex gap-3 items-start">
              <img
                src={notif.image || mediaData.Nomeeting}
                alt="notif"
                className="w-[50px] h-[50px] rounded-md object-cover"
              />
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-black text-[15px]">{notif.title}</h3>
                  <span className="text-gray-500 text-[12px]">{notif.time}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-1"></span>
                  <p className="text-gray-600 text-[14px]">{notif.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
