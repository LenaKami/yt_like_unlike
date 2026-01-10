import { Input } from "../ui";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { type RegistrationFormData, validationSchema } from "./types_register";
import { zodResolver } from "@hookform/resolvers/zod";
import { WaNavLink } from "../onkrzyczy";
import { useNavigate } from 'react-router-dom';
import { routes } from "../routes";
import logo from "../assets/logo.svg"

export const RegistrationForm = () => {
  const classinput =
    "input-color border border-gray-300 text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500";
  const classlabel = "block mb-2 text-sm font-medium text-white";

  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
                <div className="relative mb-4" data-twe-input-wrapper-init>
                  <div className="relative">
                    <Input label="Hasło" {...register("password", { required: true })} type={showPassword ? 'text' : 'password'} error={errors.password} inputClassName={classinput} labelClassName={classlabel} />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                      onMouseDown={() => setShowPassword(true)}
                      onMouseUp={() => setShowPassword(false)}
                      onMouseLeave={() => setShowPassword(false)}
                      onTouchStart={() => setShowPassword(true)}
                      onTouchEnd={() => setShowPassword(false)}
                      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setShowPassword(true); } }}
                      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') { setShowPassword(false); } }}
                      className="absolute right-2 top-8 text-slate-600 dark:text-slate-300 p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword ? 'M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.322-6.083M6.5 6.5L17.5 17.5M9.878 9.878A3 3 0 0114.122 14.122' : 'M2.458 12C3.732 7.943 7.523 5 12 5c5.523 0 10 4.477 10 10 0 1.021-.154 2.004-.438 2.925M15 12a3 3 0 11-6 0 3 3 0 016 0z'} />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="relative mb-4">
                  <label className={classlabel}>Zdjęcie profilowe (opcjonalnie)</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} className={classinput} />
                  {selectedImage && <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">Wybrano: {selectedImage.name}</div>}
                </div>
                <button className="log-in" type="submit">
                  Zarejestruj
                </button>
                <p className="text-sm font-light text-gray-500 dark:text-white">
                  Masz już konto? <span className="menulog  cursor-pointer" onClick={() => navigate(routes.LOGINFORM.path)}>Zaloguj się</span>
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
