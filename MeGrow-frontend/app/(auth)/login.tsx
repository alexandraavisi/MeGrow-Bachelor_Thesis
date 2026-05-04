import { useState } from "react";
import { 
    View, 
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
 } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPasword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/api/auth/login', {email, password});
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify({
                name: response.data.name,
                email: response.data.email,
            }));

            const profileResponse = await api.get('/api/user/profile');
            if (!profileResponse.data.archetypeConfirmed || !profileResponse.data.finalArchetype) {
                router.replace('/(onboarding)/questions');
            } else {
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding': 'height'}>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled">
        
                <View style={styles.header}>
                    <Text style={styles.title}>MeGrow 🌱</Text>
                    <Text style={styles.subtitle}>Welcome back!</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color= '#666' style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPasword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color="#666"
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={isLoading}>
                        {isLoading
                            ? <ActivityIndicator color='#fff' />
                            : <Text style={styles.buttonText}>Login</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => router.push('/(auth)/register')}>
                        <Text style={styles.linkText}>
                            Don't have an account? {" "} <Text style={styles.linkBold}>Register</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
         </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 8
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#2d6a4f',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666'
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    }, 
    button: {
        backgroundColor: '#2d6a4f',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 8
    },
    linkText: {
        color: '#666',
        fontSize: 14,
    },
    linkBold: {
        color: '#2d6a4f',
        fontWeight: 'bold'
    },
});