import React from 'react';
import { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Text, ActivityIndicator, View } from 'react-native';

import { AuthContext } from '../../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dash/DashboardScreen';
import SymptomsScreen from '../screens/symptoms/SymptomsScreen';
import RemindersScreen from '../screens/reminders/RemindersScreen';
import DevicesScreen from '../screens/devices/DevicesScreen';
import ComplaintsScreen from '../screens/complaints/ComplaintsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const DashboardTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: '#2b67ff' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: '#2b67ff',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'home';
          else if (route.name === 'Symptoms') iconName = 'medical';
          else if (route.name === 'Reminders') iconName = 'notifications';
          else if (route.name === 'Devices') iconName = 'watch';
          else if (route.name === 'Complaints') iconName = 'chatbox-ellipses';
          else if (route.name === 'Profile') iconName = 'person';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'PULSE' }}
      />
      <Tab.Screen 
        name="Symptoms" 
        component={SymptomsScreen}
      />
      <Tab.Screen 
        name="Reminders" 
        component={RemindersScreen}
      />
      <Tab.Screen 
        name="Devices" 
        component={DevicesScreen}
      />
      <Tab.Screen 
        name="Complaints" 
        component={ComplaintsScreen}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2b67ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userToken == null ? <AuthStack /> : <DashboardTabs />}
    </NavigationContainer>
  );
};
