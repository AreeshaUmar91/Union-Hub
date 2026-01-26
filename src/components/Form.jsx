import React, { useState } from "react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
function PasswordInput({ field, isNewEmployee, className }) {
  const [showPassword, setShowPassword] = useState(false);
  const isControlled = field.value !== undefined;

  return (
    <div className={`flex flex-col w-full ${className || ""}`}>
      <label className="mb-1 font-montserrat">{field.label}</label>
      <div className="relative">
        {field.icon && (
          <img
            src={field.icon}
            alt="icon"
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 
              ${isNewEmployee ? "" : "opacity-50"}`} // gray icon in edit
          />
        )}
        <input
          type={showPassword ? "text" : "password"}
          placeholder={field.placeholder}
          value={isControlled ? field.value : undefined}
          defaultValue={isControlled ? undefined : field.value || ""}
          onChange={field.onChange}
          className={`w-full rounded-[12px] font-montserrat px-3 py-2 bg-[#F1F1F1] 
            focus:outline-none focus:ring-2 focus:ring-blue-400 
            ${field.icon ? "pl-10" : ""} pr-10
            text-black
            placeholder-gray-400`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 
            ${isNewEmployee ? "text-gray-500" : "text-gray-400"}`}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
}

export function Form({ heading, fields = [], buttons = [], isNewEmployee }) {
  return (
    <div className="bg-white rounded-[16px] shadow-lg p-4 sm:p-6">
      <h2 className="text-2xl font-semibold font-montserrat mb-2">{heading}</h2>
      <hr className="border-gray-300 mb-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 font-montserrat">
        {fields.map((field, idx) =>
          field.type === "password" ? (
            <PasswordInput
              key={idx}
              field={field}
              isNewEmployee={isNewEmployee}
              className={field.fullWidth ? "sm:col-span-2" : ""}
            />
          ) : field.type === "select" ? (
            <div
              key={idx}
              className={`flex flex-col ${field.fullWidth ? "sm:col-span-2" : ""}`}
            >
              <label className="mb-1 font-montserrat">{field.label}</label>
              <div className="relative">
                {field.icon && (
                  <img
                    src={field.icon}
                    alt="icon"
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 
                      ${isNewEmployee ? "" : "opacity-50"}`}
                  />
                )}
                <select
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  className={`w-full rounded-[12px] font-montserrat px-3 py-2 bg-[#F1F1F1] 
                    focus:outline-none focus:ring-2 focus:ring-blue-400 
                    ${field.icon ? "pl-10" : ""} pr-10 appearance-none
                    ${!field.value ? "text-gray-400" : "text-black"}`}
                >
                  {(field.placeholder || field.label) && (
                    <option value="" disabled>
                      {field.placeholder || field.label}
                    </option>
                  )}
                  {(field.options || []).map((opt) => (
                    <option key={opt.value ?? opt} value={opt.value ?? opt}>
                      {opt.label ?? opt}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={20}
                />
              </div>
            </div>
          ) : (
            <div
              key={idx}
              className={`flex flex-col ${field.fullWidth ? "sm:col-span-2" : ""}`}
            >
              <label className="mb-1 font-montserrat">{field.label}</label>
              <div className="relative">
                {field.icon && (
                  <img
                    src={field.icon}
                    alt="icon"
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 
                      ${isNewEmployee ? "" : "opacity-50"}`} // gray in edit
                  />
                )}
                <input
                  type={field.type || "text"}
                  placeholder={field.placeholder || ""}
                  value={field.value !== undefined ? field.value : undefined}
                  defaultValue={field.value !== undefined ? undefined : field.value || ""}
                  onChange={field.onChange}
                  className={`w-full rounded-[12px] font-montserrat px-3 py-2 bg-[#F1F1F1] 
                    focus:outline-none focus:ring-2 focus:ring-blue-400 
                    ${field.icon ? "pl-10" : ""}
                    text-black
                    placeholder-gray-400`}
                />
              </div>
            </div>
          )
        )}
      </div>
<div className="flex justify-end w-full">
        <div className="flex gap-4 w-full justify-end flex-col-reverse sm:flex-row">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.onClick}
              className={`py-3 rounded-[50px] font-montserrat text-center ${btn.className}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>



    </div>
  );
}
