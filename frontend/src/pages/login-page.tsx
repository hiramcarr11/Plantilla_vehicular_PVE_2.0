import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../modules/auth/auth-context';

export function LoginPage() {
  const { session, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-page">
      <form
        className="login-card"
        onSubmit={async (event) => {
          event.preventDefault();

          try {
            await login(email.trim(), password);
            await Swal.fire({
              icon: 'success',
              title: 'Acceso correcto',
              text: 'Bienvenido al sistema.',
              confirmButtonText: 'Continuar',
            });
          } catch (requestError) {
            await Swal.fire({
              icon: 'error',
              title: 'No se pudo iniciar sesión',
              text: (requestError as Error).message,
              confirmButtonText: 'Entendido',
            });
          }
        }}
      >
        <p className="eyebrow">Acceso</p>
        <h1>Sistema de control vehicular</h1>
        <p>Ingresa con tu cuenta para acceder a tu panel operativo.</p>

        <label className="field">
          <span>Correo</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button className="primary-button" type="submit">

          Entrar
        </button>
      </form>
    </div>
  );
}
