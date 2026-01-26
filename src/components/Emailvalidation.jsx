import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { mediaData } from "../utils/mediaData"; // Make sure mediaData.Email exists

const EmailSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email")
    .required("Email is required"),
});

export const Emailvalidation = ({ onSubmit, children }) => {
  return (
    <div className="flex flex-col items-start">
      <h2 className="text-lg mb-2 font-poppins text-inputlabel">Email Address</h2>

      <Formik
        initialValues={{ email: "" }}
        validationSchema={EmailSchema}
        onSubmit={(values) => {
          if (onSubmit) onSubmit(values);
        }}
      >
        {() => (
          <Form className="flex flex-col items-center w-full">
            {/* Input with image icon */}
            <div className="relative w-full max-w-[432px]">
              <img
                src={mediaData.Sms} 
                alt="Email Icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
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
              className="text-red text-sm mt-2 text-left w-full max-w-[432px]"
            />

            {/* Render Continue button or any children */}
            {children}
          </Form>
        )}
      </Formik>
    </div>
  );
};
