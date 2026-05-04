import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import api from "@/services/api";

export default function RootLayout() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('checkAuth called');
    try {
        const token = await AsyncStorage.getItem('token');
        console.log('token:', token);
        if (token) {
            try {
                console.log('calling profile API');
                const response = await api.get('/api/user/profile');
                console.log('Profile response:', JSON.stringify(response.data));
                if (!response.data.archetypeConfirmed || !response.data.finalArchetype) {
                    router.replace('/(onboarding)/questions');
                } else {
                    router.replace('/(tabs)');
                }
            } catch (error) {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                router.replace('/(auth)/login');
            }
        } else {
            router.replace('/(auth)/login');
        }
    } catch (error) {
        router.replace('/(auth)/login');
    } finally {
        setIsLoading(false);
    }
};

  return (
      <Stack screenOptions={{ headerShown: false}}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    );
}
