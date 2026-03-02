import { createContext, useReducer, useEffect } from 'react';

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
    if (token) {
      // TODO: validate token and fetch user profile
      dispatch({ type: 'LOADED' });
    } else {
      dispatch({ type: 'LOADED' });
    }
  }, []);

  const login = (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    dispatch({ type: 'LOGIN', payload: user });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
