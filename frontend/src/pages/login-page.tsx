import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/auth-context';

export function LoginPage() {
  const { session, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-page">
      <form
        className="login-card"
        onSubmit={async (event) => {
          event.preventDefault();
          setError('');

          try {
            await login(email.trim(), password);
          } catch (requestError) {
            setError((requestError as Error).message);
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

        {error && <p className="error-text">{error}</p>}

        <button className="primary-button" type="submit">
          Entrar
        </button>
      </form>
    </div>
  );
}
