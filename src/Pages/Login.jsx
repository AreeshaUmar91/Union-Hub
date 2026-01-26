import { useState } from "react";
import { Signreset } from "../components/Signreset";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { mediaData } from "../utils/mediaData";
import { useAuth } from "../auth/AuthContext";

// ✅ Validation Schema
const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("director");
  const auth = useAuth();

  return (
    <Signreset centerHeading="Login">
      <h4 className="text-grey text-center mb-4 font-montserrat font-semibold">
        Login to access your account
      </h4>

      {/* ✅ Formik Wrapper */}
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={LoginSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await auth.login({ role, email: values.email, password: values.password });
            navigate("/layout/dashboard");
          } catch (e) {
            // Error toast handled in apiRequest
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ handleSubmit }) => (
          <Form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
            <div className="flex flex-col items-start mb-4 w-full max-w-[432px]">
              <h2 className="text-lg mb-2 font-poppins text-inputlabel">Login As</h2>
              <div className="relative w-full">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-[48px] pl-4 pr-10 rounded-xl bg-bgcolor focus:outline-none focus:ring-2 focus:ring-blue-500 font-nunito text-[16px] leading-[24px] text-gray-700 appearance-none"
                >
                  <option value="director">Director</option>
                  <option value="principal">Principal</option>
                  <option value="vice_principal">Vice Principal</option>
                  <option value="teacher">Teacher</option>
                  <option value="tech_staff">Tech Staff</option>
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="flex flex-col items-start mb-4 w-full max-w-[432px]">
              <h2 className="text-lg mb-2 font-poppins text-inputlabel">
                Email Address
              </h2>
              <div className="relative w-full">
                <img
    src={mediaData.Sms} 
    alt="Email Icon"
    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10"
  />
                <Field
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full h-[48px] pl-10 pr-4 rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 bg-bgcolor
                    font-nunito text-[16px] leading-[24px] text-gray-700 placeholder-gray-400"
                />
              </div>
              <ErrorMessage
                name="email"
                component="div"
                className="text-red text-sm mt-1 font-montserrat"
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col items-start mb-4 w-full max-w-[432px]">
              <h2 className="text-lg mb-3 mt-1 font-poppins text-inputlabel">
                Password
              </h2>
              <div className="relative w-full">
                {/* Lock icon from mediaData */}
                <img
                  src={mediaData.Password}
                  alt="Lock Icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                />

                <Field
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter password"
                  className="w-full h-[48px] pl-10 pr-10 rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 bg-bgcolor
                    font-nunito text-[16px] leading-[24px] text-gray-700 placeholder-gray-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 rounded-3xl"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <ErrorMessage
                name="password"
                component="div"
                className="text-red text-sm mt-1 font-montserrat"
              />

              {/* Forgot Password */}
              <div className="w-full flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => navigate("/resetpassword")}
                  className="text-red text-md"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Login Button */}
            <div className="w-full flex justify-center mt-4">
              <button
                type="submit"
                className="w-full max-w-[432px] bg-primary text-white py-2 rounded-3xl font-montserrat"
              >
                Login
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </Signreset>
  );
};
