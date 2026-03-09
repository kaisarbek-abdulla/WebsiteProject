import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/apiService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.payload.token,
            isLoading: false,
            user: action.payload.user,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.payload.token,
            user: action.payload.user,
          };
        case 'SIGN_UP':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.payload.token,
            user: action.payload.user,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
            user: null,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
      user: null,
    }
  );

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        let userToken = await AsyncStorage.getItem('authToken');
        let user = await AsyncStorage.getItem('currentUser');
        if (user) user = JSON.parse(user);

        dispatch({ type: 'RESTORE_TOKEN', payload: { token: userToken, user } });
      } catch (e) {
        console.error('Error restoring token:', e);
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    signIn: async (email, password) => {
      try {
        const response = await apiService.login(email, password);
        const { token, userId, role, email: userEmail, name } = response.data;
        
        await AsyncStorage.setItem('authToken', token);
        const user = { id: userId, role, email: userEmail, name };
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));

        dispatch({ type: 'SIGN_IN', payload: { token, user } });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    signUp: async (name, email, password, role) => {
      try {
        const response = await apiService.register(name, email, password, role);
        const { token, userId, role: userRole, email: userEmail } = response.data;
        
        await AsyncStorage.setItem('authToken', token);
        const user = { id: userId, role: userRole, email: userEmail, name };
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));

        dispatch({ type: 'SIGN_UP', payload: { token, user } });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    signOut: async () => {
      try {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('currentUser');
        dispatch({ type: 'SIGN_OUT' });
      } catch (error) {
        console.error('Sign out error:', error);
      }
    },
  };

  return (
    <AuthContext.Provider value={{ ...state, ...authContext }}>
      {children}
    </AuthContext.Provider>
  );
};
