import React from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { isAuthConfigured } from './authConfig.js';
import AuthForm from './AuthForm.jsx';
const authBackground = `${import.meta.env.BASE_URL}bg_react.jpg`;

const AuthGate = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  const [sessionError, setSessionError] = React.useState('');
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthConfigured) {
      setIsCheckingSession(false);
      return;
    }

    let isMounted = true;
    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) setUser(currentUser);
      })
      .catch((error) => {
        if (!isMounted) return;
        if (error?.name === 'UserUnAuthenticatedException') {
          setUser(null);
        } else {
          setSessionError(
            error instanceof Error ? error.message : 'Unable to check your sign-in session.'
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const onSignOut = async () => {
    setIsSigningOut(true);
    setSessionError('');
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      setSessionError(
        error instanceof Error ? error.message : 'Unable to sign out. Please try again.'
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!isAuthConfigured) {
    return (
      <div style={styles.authPage}>
        <main style={styles.message}>
          <h1>Authentication is not configured</h1>
          <p>
            Set <code>VITE_USER_POOL_ID</code> and either{' '}
            <code>VITE_USER_POOL_WEB_CLIENT_ID</code> or{' '}
            <code>VITE_USER_POOL_CLIENT_ID</code> in your local environment and AWS
            Amplify app settings, then redeploy.
          </p>
        </main>
      </div>
    );
  }

  if (isCheckingSession) {
    return <p style={styles.message}>Checking your sign-in...</p>;
  }

  if (!user) {
    return (
      <div style={styles.authPage}>
        {sessionError && <p role="alert" style={styles.error}>{sessionError}</p>}
        <AuthForm onAuthenticated={setUser} />
      </div>
    );
  }

  return (
    <>
      <header style={styles.header}>
        <span>Signed in as {user.signInDetails?.loginId || user.username}</span>
        <button type="button" onClick={onSignOut} disabled={isSigningOut} style={styles.signOutButton}>
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </button>
      </header>
      {sessionError && <p role="alert" style={styles.error}>{sessionError}</p>}
      {children}
    </>
  );
};

const styles = {
  authPage: {
    display: 'grid',
    placeItems: 'center',
    boxSizing: 'border-box',
    minHeight: '100vh',
    margin: '-12px',
    padding: '24px',
    backgroundImage: `linear-gradient(rgba(12, 8, 18, 0.3), rgba(12, 8, 18, 0.3)), url("${authBackground}")`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
  },
  message: {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '28px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.94)',
    fontFamily: 'Arial, sans-serif',
    lineHeight: 1.5,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingBottom: '16px',
    borderBottom: '1px solid #ddd',
    fontFamily: 'Arial, sans-serif',
  },
  signOutButton: {
    padding: '8px 14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
  },
  error: { color: '#b42318', textAlign: 'center' },
};

export default AuthGate;
