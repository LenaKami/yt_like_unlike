import { Input } from "../ui";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { type RegistrationFormData, validationSchema } from "./types_register";
import { zodResolver } from "@hookform/resolvers/zod";
import { WaNavLink } from "../onkrzyczy";
import { routes } from "../routes";
import logo from "../assets/logo.svg"

export const RegistrationForm = () => {
  const classinput =
    "input-color border border-gray-300 text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500";
  const classlabel = "block mb-2 text-sm font-medium text-white";

  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationFormData>({
    resolver: zodResolver(validationSchema),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setSelectedImage(file);
  };

  const handleRegistrationForm: SubmitHandler<RegistrationFormData> = async (data) => {
    const formData = new FormData();

    formData.append("login", data.login);
    formData.append("email", data.email);
    formData.append("password", data.password);
    console.log(formData.get('login'))
    if (selectedImage) {
      formData.append("image", selectedImage);
    }
    console.log(formData.get('image'))
    const response = await fetch("http://localhost:5000/user/register", {
      method: "POST",
      body: formData 
    });

    const dataa = await response.json();
    if (response.ok) {
      setMessage(`Success: ${dataa.message}`);
    } else {
      setMessage(`Error: ${dataa.message}`);
    }
  };

  return (
    <div>
      <section className="login-color">
        <div className="flex flex-col items-center justify-center px-12 py-8 mx-auto
                md:justify-start md:h-auto lg:py-12">
          <a href="#" className="flex items-center mb-6 text-2xl font-semibold text-white">
            <img className="w-10 h-10" src={logo} alt="logo" />
            StudyBeats
          </a>
          <div className="w-full rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0 login-box">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white">
                Rejestracja
              </h1>
              <form onSubmit={handleSubmit(handleRegistrationForm)} className="space-y-4 md:space-y-6" action="#">
                <div className="relative mb-4" data-twe-input-wrapper-init>
                  <Input label="Login" {...register("login")} error={errors.login} inputClassName={classinput} labelClassName={classlabel} />
                </div>
                <div className="relative mb-4" data-twe-input-wrapper-init>
                  <Input label="E-mail" {...register("email", { required: true })} type="email" error={errors.email} inputClassName={classinput} labelClassName={classlabel} />
                </div>
                <div className="relative mb-4">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                />
                <label
                  htmlFor="image"
                  className="file-label"
                >
                  Wybierz zdjęcie
                </label>

                {selectedImage && (
                  <p className="file-name">
                    Wybrano: {selectedImage.name}
                  </p>
                )}
              </div>
                <div className="relative mb-4" data-twe-input-wrapper-init>
                  <Input label="Hasło" {...register("password", { required: true })} type="password" error={errors.password} inputClassName={classinput} labelClassName={classlabel} />
                </div>
                <button className="log-in" type="submit">
                  Zarejestruj
                </button>
                <p className="text-sm font-light text-gray-500 dark:text-white">
                  Masz już konto? <WaNavLink to={routes.LOGINFORM.path}>Zaloguj się</WaNavLink>
                </p>
              </form>
              {message && <p className="text-green-200">{message}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
