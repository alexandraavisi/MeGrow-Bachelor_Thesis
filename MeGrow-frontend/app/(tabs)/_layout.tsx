import { Tabs } from "expo-router";
import {Ionicons} from '@expo/vector-icons';

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{ 
                headerShown: false,
                tabBarActiveTintColor: '#2d6a4f',
                tabBarInactiveTintColor: '#999',
            }}>
            <Tabs.Screen 
                name="index" 
                options={{
                    title: 'Home',
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name ="home-outline" size={size} color={color}/>
                    )}} 
            />
             <Tabs.Screen
                name="goals"
                options={{
                    title: 'Goals',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="flag-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="habits"
                options={{
                    title: 'Habits',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="checkmark-circle-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    )
}