import React from 'react';
import {
  confirmSignUp,
  getCurrentUser,
  signIn,
  signUp,
} from 'aws-amplify/auth';

const AuthForm = ({ onAuthenticated }) => {
  const [mode, setMode] = React.useState('signIn');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmationCode, setConfirmationCode] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isConfirming = mode === 'confirm';
  const isSigningUp = mode === 'signUp';

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const username = email.trim();

      if (isConfirming) {
        await confirmSignUp({
          username,
          confirmationCode: confirmationCode.trim(),
        });
        setMode('signIn');
        setPassword('');
        setConfirmationCode('');
        setMessage('Email confirmed. You can now sign in.');
      } else if (isSigningUp) {
        const result = await signUp({
          username,
          password,
          options: {
            userAttributes: { email: username },
          },
        });

        if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
          setMode('confirm');
          setMessage('Enter the confirmation code sent to your email.');
        } else {
          setMode('signIn');
          setPassword('');
          setMessage('Your account is ready. You can now sign in.');
        }
      } else {
        const result = await signIn({ username, password });

        if (!result.isSignedIn) {
          setError(
            'This account requires an additional sign-in step that is not enabled in this app.'
          );
          return;
        }

        onAuthenticated(await getCurrentUser());
      }
    } catch (authError) {
      if (authError?.name === 'UserNotConfirmedException') {
        setMode('confirm');
        setMessage('Enter the confirmation code sent to your email.');
      } else if (authError?.name === 'UsernameExistsException') {
        setError('An account with this email already exists. Try signing in.');
      } else if (authError?.name === 'CodeMismatchException') {
        setError('That confirmation code is not valid. Check it and try again.');
      } else if (authError?.name === 'ExpiredCodeException') {
        setError('That confirmation code has expired. Request a new code.');
      } else if (authError?.name === 'NotAuthorizedException') {
        setError('Email or password is incorrect.');
      } else {
        setError(
          authError instanceof Error
            ? authError.message
            : 'Authentication failed. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setMessage('');
  };

  return (
    <main style={styles.card}>
      <h1 style={styles.title}>
        {isConfirming ? 'Confirm your email' : isSigningUp ? 'Create account' : 'Sign in'}
      </h1>
      <p style={styles.description}>
        {isConfirming
          ? `Enter the code sent to ${email}.`
          : isSigningUp
            ? 'Create an account to view the products list.'
            : 'Sign in to view the products list.'}
      </p>

      <form onSubmit={onSubmit} style={styles.form}>
        <label style={styles.label} htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={isConfirming || isSubmitting}
          style={styles.input}
        />

        {!isConfirming && (
          <>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={isSigningUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isSubmitting}
              style={styles.input}
            />
          </>
        )}

        {isConfirming && (
          <>
            <label style={styles.label} htmlFor="confirmationCode">Confirmation code</label>
            <input
              id="confirmationCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={confirmationCode}
              onChange={(event) => setConfirmationCode(event.target.value)}
              required
              disabled={isSubmitting}
              style={styles.input}
            />
          </>
        )}

        {message && <p role="status" style={styles.message}>{message}</p>}
        {error && <p role="alert" style={styles.error}>{error}</p>}

        <button type="submit" disabled={isSubmitting} style={styles.button}>
          {isSubmitting
            ? 'Please wait...'
            : isConfirming
              ? 'Confirm email'
              : isSigningUp
                ? 'Create account'
                : 'Sign in'}
        </button>
      </form>

      <p style={styles.switchMode}>
        {isConfirming ? (
          <button type="button" onClick={() => changeMode('signIn')} style={styles.link}>
            Back to sign in
          </button>
        ) : isSigningUp ? (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => changeMode('signIn')} style={styles.link}>
              Sign in
            </button>
          </>
        ) : (
          <>
            New here?{' '}
            <button type="button" onClick={() => changeMode('signUp')} style={styles.link}>
              Create an account
            </button>
          </>
        )}
      </p>
    </main>
  );
};

const styles = {
  card: {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '420px',
    margin: '0 auto',
    padding: '28px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.96)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
    fontFamily: 'Arial, sans-serif',
  },
  title: { margin: '0 0 8px', fontSize: '24px' },
  description: { color: '#555', lineHeight: 1.5 },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontWeight: 600, marginTop: '8px' },
  input: { boxSizing: 'border-box', width: '100%', padding: '10px', fontSize: '16px' },
  button: { marginTop: '10px', padding: '11px', fontSize: '16px', cursor: 'pointer' },
  message: { color: '#176b35', margin: '4px 0' },
  error: { color: '#b42318', margin: '4px 0' },
  switchMode: { margin: '20px 0 0', textAlign: 'center' },
  link: {
    padding: 0,
    border: 0,
    background: 'none',
    color: '#175cd3',
    cursor: 'pointer',
    font: 'inherit',
    textDecoration: 'underline',
  },
};

export default AuthForm;
