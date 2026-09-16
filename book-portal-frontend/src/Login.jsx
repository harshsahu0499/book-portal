import { useState } from 'react';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';

    fetch(`http://localhost:8080${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(isRegisterMode ? 'Registration failed — username may be taken' : 'Invalid username or password');
        }
        return response.text();
      })
      .then(result => {
        if (isRegisterMode) {
          setIsRegisterMode(false);
          setError('Account created — please log in');
        } else {
          localStorage.setItem('jwt', result);
          onLoginSuccess(result);
        }
      })
      .catch(err => setError(err.message));
  };

  return (
    <div>
      <h2>{isRegisterMode ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">{isRegisterMode ? 'Register' : 'Log In'}</button>
        {error && <p>{error}</p>}
      </form>
      <button onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); }}>
        {isRegisterMode ? 'Already have an account? Log in' : "Don't have an account? Register"}
      </button>
    </div>
  );
}

export default Login;