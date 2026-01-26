import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../auth/api";

export const Notifications = () => {
  const auth = useAuth();
  const role = auth.user?.role;
  const canManage = role === "director" || role === "principal" || role === "vice_principal";
  const [isToggled, setIsToggled] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const lastSavedRef = useRef({ enabled: null, selectedTime: null });

  const reminderOptions = [
    "5 mins",
    "10 mins",
    "15 mins",
    "30 mins",
    "1 hour",
    "2 hours",
    "24 hours",
  ];

  useEffect(() => {
    if (!auth.token) return;
    apiRequest("/content/notifications", { token: auth.token })
      .then((data) => {
        const items = data?.items || [];
        const latest = items.find((i) => i?.data?.kind === "reminder_settings");
        if (!latest) return;
        const enabled = Boolean(latest.data?.enabled);
        const time = latest.data?.selectedTime ?? null;
        setIsToggled(enabled);
        setSelectedTime(time);
        lastSavedRef.current = { enabled, selectedTime: time };
      })
      .catch(() => {});
  }, [auth.token]);

  const saveSettings = async ({ enabled, time }) => {
    if (!canManage) return;
    if (!auth.token) return;

    const prev = lastSavedRef.current;
    if (prev.enabled === enabled && prev.selectedTime === time) return;
    lastSavedRef.current = { enabled, selectedTime: time };

    const title = "Meeting / voting reminders";
    const content = enabled
      ? time
        ? `Reminder set to ${time} before meetings/voting.`
        : "Reminders enabled."
      : "Reminders disabled.";

    await apiRequest("/content/notifications", {
      method: "POST",
      token: auth.token,
      body: {
        kind: "reminder_settings",
        enabled,
        selectedTime: time,
        title,
        content,
        recipientsRoles: ["employee", "teacher", "principal", "vice_principal", "tech_staff", "director"],
      },
    });
  };

  return (
    <div
      className="
        flex flex-col justify-start gap-[36px] 
        bg-white rounded-[16px] font-montserrat 
        px-4 py-4
        w-full 
        h-auto lg:h-[280px]
        opacity-100
      "
    >
      {/* Heading */}
      <div className="border-b pb-3">
        <h2 className="text-black font-semibold text-[18px] sm:text-[20px]">
          Notification Settings
        </h2>
      </div>

      {/* Meeting/Voting Reminder Toggle */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <p className="text-[15px] sm:text-[16px] text-black">
          Meeting / voting reminders to employees
        </p>

        {/* Toggle Button */}
        <div
          onClick={async () => {
            if (!canManage) return;
            const next = !isToggled;
            setIsToggled(next);
            try {
              await saveSettings({ enabled: next, time: selectedTime });
            } catch (e) {
              setIsToggled(!next);
              lastSavedRef.current = { enabled: !next, selectedTime };
              // Toast handled in apiRequest
            }
          }}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${
            isToggled ? "bg-primary" : "bg-gray-300"
          } ${canManage ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
              isToggled ? "translate-x-6" : "translate-x-0"
            }`}
          ></div>
        </div>
      </div>

      {/* Reminder Options Section */}
      <div
        className="
          flex flex-col gap-4 p-3 rounded-xl
          shadow-md
        "
        style={{ boxShadow: "0px 0px 4px 0px #00000040" }}
      >
        <p className="text-[15px] sm:text-[16px] text-black text-start">
          Choose how long before the meeting / voting you want to be reminded
        </p>

        {/* Reminder Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          {reminderOptions.map((option) => (
            <button
              key={option}
              onClick={async () => {
                if (!canManage) return;
                setSelectedTime(option);
                try {
                  await saveSettings({ enabled: isToggled, time: option });
                } catch (e) {
                  setSelectedTime(lastSavedRef.current.selectedTime);
                  // Toast handled in apiRequest
                }
              }}
              className={`px-4 py-2 rounded-full border text-[13px] sm:text-[14px] font-semibold transition-all duration-300 ${
                selectedTime === option
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-primary border-primary"
              } ${canManage ? "" : "opacity-60 cursor-not-allowed"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
