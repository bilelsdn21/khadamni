import { createContext, useReducer, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload, isAuthenticated: true, loading: false };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, loading: false };
    case 'LOADED':
      return { ...state, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      dispatch({ type: 'LOADED' });
      return;
    }
    // Refresh user from backend so stale localStorage data (e.g. job_type) is always current
    api.get('/auth/me')
      .then(res => {
        const freshUser = res.data;
        localStorage.setItem('user', JSON.stringify(freshUser));
        dispatch({ type: 'LOGIN', payload: freshUser });
      })
      .catch(() => {
        // Token invalid/expired — fall back to cached user or clear session
        const cached = localStorage.getItem('user');
        if (cached) {
          dispatch({ type: 'LOGIN', payload: JSON.parse(cached) });
        } else {
          localStorage.removeItem('access_token');
          dispatch({ type: 'LOADED' });
        }
      });
  }, []);


  const login = (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'LOGIN', payload: user });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('remember_me');
    dispatch({ type: 'LOGOUT' });
  };



  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
