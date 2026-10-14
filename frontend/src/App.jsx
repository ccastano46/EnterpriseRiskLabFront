import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './App.css';

export default function App() {
  const {
    loginWithRedirect,
    logout,
    isAuthenticated,
    isLoading: isAuthLoading,
    user,
    getAccessTokenSilently,
  } = useAuth0();

  const [riskStatus, setRiskStatus] = useState(null);
  const [requestState, setRequestState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const displayName =
      user?.name || user?.nickname || user?.email || 'Usuario';

  const initials =
      displayName
          .split(/[.\s_@-]+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
          .toUpperCase() || 'U';

  const statusValue = riskStatus?.status
      ? String(riskStatus.status)
      : requestState === 'loading'
          ? 'Verificando…'
          : requestState === 'error'
              ? 'No disponible'
              : 'Sin consultar';

  const statusClass =
      riskStatus?.status === 'protected'
          ? 'is-protected'
          : requestState === 'error'
              ? 'is-error'
              : requestState === 'loading'
                  ? 'is-loading'
                  : 'is-pending';

  async function callApi() {
    setRequestState('loading');
    setRiskStatus(null);
    setErrorMessage('');

    try {
      const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

      if (!apiBaseUrl) {
        throw new Error('Falta configurar VITE_API_URL en el archivo .env.local.');
      }

      const token = await getAccessTokenSilently();
      const response = await fetch(`${apiBaseUrl}/api/risk-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseText = await response.text();
      let payload = null;

      if (responseText) {
        try {
          payload = JSON.parse(responseText);
        } catch {
          payload = { message: responseText };
        }
      }

      if (!response.ok) {
        const details = payload?.message || responseText;
        throw new Error(
            `La API respondió con el estado ${response.status}${details ? `: ${details}` : ''}`,
        );
      }

      if (!payload || typeof payload !== 'object') {
        throw new Error('La API no devolvió una respuesta válida.');
      }

      setRiskStatus(payload);
      setRequestState('success');
    } catch (error) {
      setRequestState('error');
      setErrorMessage(
          error instanceof Error ? error.message : 'No se pudo completar la consulta.',
      );
    }
  }

  function handleLogout() {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }

  return (
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                  d="M12 3.25 19 6v5.12c0 4.37-2.98 8.3-7 9.63-4.02-1.33-7-5.26-7-9.63V6l7-2.75Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
              />
              <path
                  d="m9 11.75 2 2 4-4.25"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
              />
            </svg>
          </span>
            <span className="brand-copy">
            <span className="brand-name">RiskLab</span>
            <span className="brand-caption">Panel de seguridad</span>
          </span>
          </div>

          {isAuthenticated && !isAuthLoading && (
              <div className="header-user">
            <span className="user-avatar" aria-hidden="true">
              {initials}
            </span>
                <span className="user-meta">
              <span className="user-label">Sesión activa</span>
              <span className="user-name">{displayName}</span>
            </span>
                <button
                    className="logout-button"
                    type="button"
                    onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
          )}
        </header>

        {isAuthLoading ? (
            <main className="state-screen">
              <div className="loading-card" role="status">
                <span className="loading-spinner" aria-hidden="true" />
                <span>Comprobando tu sesión…</span>
              </div>
            </main>
        ) : !isAuthenticated ? (
            <main className="state-screen">
              <section className="auth-card">
            <span className="auth-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                    d="M12 3.25 19 6v5.12c0 4.37-2.98 8.3-7 9.63-4.02-1.33-7-5.26-7-9.63V6l7-2.75Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                />
                <path
                    d="m9 11.75 2 2 4-4.25"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
              </svg>
            </span>
                <p className="eyebrow">
                  <span className="eyebrow-dot" />
                  Acceso protegido
                </p>
                <h1>Tu seguridad, en un solo lugar.</h1>
                <p className="auth-description">
                  Inicia sesión para consultar el estado de acceso protegido de tu
                  cuenta.
                </p>
                <button
                    className="primary-button auth-button"
                    type="button"
                    onClick={() => loginWithRedirect()}
                >
                  Iniciar sesión
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                        d="M5 12h14m-6-6 6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <p className="auth-footnote">
                  Autenticación segura con Auth0
                </p>
              </section>
            </main>
        ) : (
            <main className="dashboard">
              <section className="hero-panel">
                <div className="hero-copy">
                  <p className="eyebrow hero-eyebrow">
                    <span className="eyebrow-dot" />
                    Consola de seguridad
                  </p>
                  <h1 className="hero-title">
                    Una capa más clara para tu acceso.
                  </h1>
                  <p className="hero-description">
                    Consulta el estado de protección y los detalles de validación
                    de tu sesión.
                  </p>
                  <button
                      className="primary-button"
                      type="button"
                      onClick={callApi}
                      disabled={requestState === 'loading'}
                  >
                    {requestState === 'loading' ? (
                        <>
                          <span className="button-spinner" aria-hidden="true" />
                          Verificando…
                        </>
                    ) : (
                        <>
                          Verificar acceso
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M5 12h14m-6-6 6 6-6 6"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                          </svg>
                        </>
                    )}
                  </button>
                  <p className="secure-note">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect
                          x="5"
                          y="10"
                          width="14"
                          height="11"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.6"
                      />
                      <path
                          d="M8 10V7a4 4 0 0 1 8 0v3"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                      />
                    </svg>
                    La consulta usa tu token de acceso autenticado.
                  </p>
                </div>

                <div className="hero-visual" aria-hidden="true">
                  <span className="orbit orbit-one" />
                  <span className="orbit orbit-two" />
                  <div className="shield-visual-card">
                <span className="shield-visual-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 3.25 19 6v5.12c0 4.37-2.98 8.3-7 9.63-4.02-1.33-7-5.26-7-9.63V6l7-2.75Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                    <path
                        d="m9 11.75 2 2 4-4.25"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                  </svg>
                </span>
                    <span className="visual-label">Estado de la sesión</span>
                    <strong className="visual-status">
                      {requestState === 'loading'
                          ? 'Verificando…'
                          : riskStatus?.status === 'protected'
                              ? 'Protegido'
                              : requestState === 'error'
                                  ? 'Revisar conexión'
                                  : 'Listo para verificar'}
                    </strong>
                  </div>
                  <span className="token-chip">
                <span className="token-chip-dot" />
                JWT
                <span className="token-chip-divider" />
                Validación
              </span>
                </div>
              </section>

              <section className="details-section">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow section-eyebrow">Resumen</p>
                    <h2 className="section-title">Detalles de seguridad</h2>
                    <p className="section-caption">
                      Información devuelta por el servicio protegido.
                    </p>
                  </div>
                  <span className={`status-pill ${statusClass}`}>
                <span className="status-dot" />
                    {statusValue}
              </span>
                </div>

                {errorMessage && (
                    <div className="error-message" role="alert">
                      <span className="error-icon" aria-hidden="true">!</span>
                      <span>{errorMessage}</span>
                    </div>
                )}

                <div className="data-grid">
                  <article className="data-card">
                    <div className="data-card-header">
                  <span className="data-icon status-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                          d="M12 3.25 19 6v5.12c0 4.37-2.98 8.3-7 9.63-4.02-1.33-7-5.26-7-9.63V6l7-2.75Z"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                      />
                      <path
                          d="m9 11.75 2 2 4-4.25"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                      <span className="data-label">Estado</span>
                    </div>
                    <p className="data-value">{riskStatus?.status || '—'}</p>
                    <p className="data-hint">
                      {riskStatus
                          ? 'Estado reportado por la API.'
                          : 'Verifica el acceso para consultar el estado.'}
                    </p>
                  </article>

                  <article className="data-card">
                    <div className="data-card-header">
                  <span className="data-icon subject-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle
                          cx="12"
                          cy="8"
                          r="3.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                      />
                      <path
                          d="M5.5 20a6.5 6.5 0 0 1 13 0"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                      />
                    </svg>
                  </span>
                      <span className="data-label">Sujeto</span>
                    </div>
                    <p className="data-value data-value-break">
                      {riskStatus?.subject || '—'}
                    </p>
                    <p className="data-hint">
                      Identificador de la sesión autenticada.
                    </p>
                  </article>

                  <article className="data-card">
                    <div className="data-card-header">
                  <span className="data-icon control-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                          d="M12 3.5v3m0 11v3m8.5-8.5h-3m-11 0h-3m14.01-6.01-2.12 2.12m-7.78 7.78-2.12 2.12m12.02 0-2.12-2.12m-7.78-7.78L6.49 6.99"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                      />
                      <circle
                          cx="12"
                          cy="12"
                          r="4"
                          stroke="currentColor"
                          strokeWidth="1.6"
                      />
                    </svg>
                  </span>
                      <span className="data-label">Control</span>
                    </div>
                    <p className="data-value control-value">
                      {riskStatus?.control || '—'}
                    </p>
                    <p className="data-hint">
                      Mecanismo de acceso aplicado por el backend.
                    </p>
                  </article>
                </div>
              </section>

              <footer className="dashboard-footer">
                <span className="footer-indicator" />
                Panel conectado a la sesión actual
              </footer>
            </main>
        )}
      </div>
  );
}
