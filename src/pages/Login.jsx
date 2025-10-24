import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-login flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden ">
      <div className="d-flex col-8 items-center justify-center relative p-6 hidden-mobile">
        <img
          src="https://demos.pixinvent.com/vuexy-nextjs-admin-template/demo-4/images/illustrations/auth/v2-login-dark.png"
          alt="character-illustration"
          className="mui-52l1kw"
        />
        <img alt="mask" src="https://demos.pixinvent.com/vuexy-nextjs-admin-template/demo-4/images/pages/auth-mask-dark.png" className="mui-1cxxf2" />
      </div>
      <div className="flex max-width-100 bg-content-login col-4 flex-column align-items-center justify-content-center">
        <div className="text-center mb-5">
          <div className="text-50 text-3xl font-medium mb-2">Inventario Piñatería</div>
          <span className="text-50 font-medium">Inicia sesión para continuar</span>
        </div>

        <form onSubmit={onSubmit} className="flex flex-column">
          <label htmlFor="email" className="block text-50 text-xl font-medium mb-2">
            Correo
          </label>
          <InputText
            id="email"
            type="text"
            placeholder="Correo electrónico"
            className="w-full md:w-30rem mb-4"
            style={{ padding: "1rem" }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <label htmlFor="password" className="block text-50 text-xl font-medium mb-2">
            Contraseña
          </label>
          <Password
            id="password"
            inputClassName="w-full p-3 md:w-30rem"
            className="w-full mb-4"
            feedback={false}
            toggleMask
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
          />

          {error && <small className="p-error mb-3">{error}</small>}
          <Button type="submit" label={loading ? "Ingresando..." : "Ingresar"} loading={loading} className="w-full p-3 text-xl" />
        </form>
      </div>
    </div>
  );
}
