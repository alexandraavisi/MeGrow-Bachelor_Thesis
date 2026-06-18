import { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";

interface Profile {
    name: string;
    email: string;
    calculatedArchetype: string;
    finalArchetype: string;
    archetypeConfirmed: boolean;
    gentleMode: boolean;
}

interface Stats {
    xpTotal: number;
    level: number;
    streakDays: number;
}

interface GoalProgress {
    goalId: string;
    title: string;
    category: string;
    totalItems: number;
    completedItems: number;
    progressPercentage: number;
}

interface Analytics {
    totalTasksCompleted: number;
    totalGoalsCompleted: number;
    totalMinutesInvested: number;
    mostProductiveDay: string;
    goalsProgress: GoalProgress[];
}

const ARCHETYPE_INFO: Record<string, { emoji: string; color: string }> = {
    PLANNER: { emoji: "📋", color: "#4a90d9" },
    ACHIEVER: { emoji: "🏆", color: "#e67e22" },
    EXPLORER: { emoji: "🧭", color: "#9b59b6" },
};

const CATEGORY_EMOJI: Record<string, string> = {
    LEARNING: "📚",
    LANGUAGE: "🗣️",
    FITNESS: "💪",
};

export default function ProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const loadProfile = async () => {
        try {
            const [profileRes, statsRes, analyticsRes] = await Promise.all([
                api.get("/api/user/profile"),
                api.get("/api/user/stats"),
                api.get("/api/user/analytics"),
            ]);
            setProfile(profileRes.data);
            setStats(statsRes.data);
            setAnalytics(analyticsRes.data);
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        router.replace("/(auth)/login");
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert("Error", "Password must be at least 8 characters");
            return;
        }

        setIsChangingPassword(true);
        try {
            await api.patch("/api/user/password", {
                currentPassword,
                newPassword,
                confirmPassword,
            });
            Alert.alert("Success", "Password changed successfully");
            setPasswordModalVisible(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to change password");
        } finally {
            setIsChangingPassword(false);
        }
    };

    const confirmDeactivate = () => {
        Alert.alert(
            "Deactivate Account",
            "Are you sure you want to deactivate your account? You can't undo this action.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Deactivate",
                    style: "destructive",
                    onPress: handleDeactivate,
                },
            ]
        );
    };

    const handleDeactivate = async () => {
        try {
            await api.delete("/api/user/account");
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");
            router.replace("/(auth)/login");
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to deactivate account");
        }
    };

    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2d6a4f" />
            </View>
        );
    }

    if (!profile) return null;

    const archetypeInfo = ARCHETYPE_INFO[profile.finalArchetype];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Profile</Text>

            {/* User Info */}
            <View style={styles.userCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {profile.name.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.userName}>{profile.name}</Text>
                <Text style={styles.userEmail}>{profile.email}</Text>

                <View style={[
                    styles.archetypeBadge,
                    { backgroundColor: archetypeInfo.color + "20" }
                ]}>
                    <Text style={styles.archetypeEmoji}>{archetypeInfo.emoji}</Text>
                    <Text style={[styles.archetypeText, { color: archetypeInfo.color }]}>
                        {profile.finalArchetype}
                    </Text>
                </View>
            </View>

            {/* Quick Stats */}
            {stats && (
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{stats.level}</Text>
                        <Text style={styles.statLabel}>Level</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{stats.xpTotal}</Text>
                        <Text style={styles.statLabel}>XP</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{stats.streakDays}</Text>
                        <Text style={styles.statLabel}>Streak</Text>
                    </View>
                </View>
            )}

            {/* Gentle Mode Badge */}
            {profile.gentleMode && (
                <View style={styles.gentleBadge}>
                    <Text style={styles.gentleText}>🌿 Gentle Mode Active</Text>
                </View>
            )}

            {/* Analytics */}
            {analytics && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Journey</Text>

                    <View style={styles.analyticsGrid}>
                        <View style={styles.analyticsItem}>
                            <Text style={styles.analyticsEmoji}>✅</Text>
                            <Text style={styles.analyticsValue}>
                                {analytics.totalTasksCompleted}
                            </Text>
                            <Text style={styles.analyticsLabel}>Tasks Completed</Text>
                        </View>
                        <View style={styles.analyticsItem}>
                            <Text style={styles.analyticsEmoji}>🎯</Text>
                            <Text style={styles.analyticsValue}>
                                {analytics.totalGoalsCompleted}
                            </Text>
                            <Text style={styles.analyticsLabel}>Goals Completed</Text>
                        </View>
                        <View style={styles.analyticsItem}>
                            <Text style={styles.analyticsEmoji}>⏱️</Text>
                            <Text style={styles.analyticsValue}>
                                {formatMinutes(analytics.totalMinutesInvested)}
                            </Text>
                            <Text style={styles.analyticsLabel}>Time Invested</Text>
                        </View>
                        <View style={styles.analyticsItem}>
                            <Text style={styles.analyticsEmoji}>📅</Text>
                            <Text style={styles.analyticsValue}>
                                {analytics.mostProductiveDay}
                            </Text>
                            <Text style={styles.analyticsLabel}>Best Day</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Goals Progress */}
            {analytics && analytics.goalsProgress.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Active Goals Progress</Text>
                    {analytics.goalsProgress.map(goal => (
                        <View key={goal.goalId} style={styles.goalProgressItem}>
                            <View style={styles.goalProgressHeader}>
                                <Text style={styles.goalProgressEmoji}>
                                    {CATEGORY_EMOJI[goal.category] || "🎯"}
                                </Text>
                                <Text style={styles.goalProgressTitle}>{goal.title}</Text>
                                <Text style={styles.goalProgressPercent}>
                                    {goal.progressPercentage}%
                                </Text>
                            </View>
                            <View style={styles.goalProgressBar}>
                                <View style={[
                                    styles.goalProgressFill,
                                    { width: `${goal.progressPercentage}%` }
                                ]} />
                            </View>
                            <Text style={styles.goalProgressSubtext}>
                                {goal.completedItems}/{goal.totalItems} items completed
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Settings */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>

                <TouchableOpacity
                    style={styles.settingItem}
                    onPress={() => setPasswordModalVisible(true)}>
                    <Ionicons name="lock-closed-outline" size={20} color="#333" />
                    <Text style={styles.settingText}>Change Password</Text>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#333" />
                    <Text style={styles.settingText}>Logout</Text>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={confirmDeactivate}>
                    <Ionicons name="trash-outline" size={20} color="#f44336" />
                    <Text style={[styles.settingText, { color: "#f44336" }]}>
                        Deactivate Account
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
            </View>

            {/* Password Modal */}
            <Modal
                visible={passwordModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setPasswordModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Current Password"
                            secureTextEntry
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleChangePassword}
                            disabled={isChangingPassword}>
                            {isChangingPassword
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.saveButtonText}>Save Changes</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    content: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 48,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 24,
    },
    userCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#2d6a4f",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#fff",
    },
    userName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    userEmail: {
        fontSize: 14,
        color: "#999",
        marginBottom: 16,
    },
    archetypeBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    archetypeEmoji: {
        fontSize: 18,
    },
    archetypeText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    statsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    statBox: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#2d6a4f",
    },
    statLabel: {
        fontSize: 12,
        color: "#999",
        marginTop: 4,
    },
    gentleBadge: {
        backgroundColor: "#e8f5e9",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        marginBottom: 16,
    },
    gentleText: {
        color: "#2d6a4f",
        fontWeight: "600",
        fontSize: 13,
    },
    section: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#999",
        marginBottom: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    analyticsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    analyticsItem: {
        flex: 1,
        minWidth: "45%",
        alignItems: "center",
        backgroundColor: "#f8f9f7",
        borderRadius: 12,
        padding: 12,
    },
    analyticsEmoji: {
        fontSize: 24,
        marginBottom: 6,
    },
    analyticsValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
    },
    analyticsLabel: {
        fontSize: 11,
        color: "#999",
        marginTop: 4,
        textAlign: "center",
    },
    goalProgressItem: {
        marginBottom: 16,
    },
    goalProgressHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 8,
    },
    goalProgressEmoji: {
        fontSize: 18,
    },
    goalProgressTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
    goalProgressPercent: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#2d6a4f",
    },
    goalProgressBar: {
        height: 8,
        backgroundColor: "#e0e0e0",
        borderRadius: 4,
        marginBottom: 4,
    },
    goalProgressFill: {
        height: 8,
        backgroundColor: "#2d6a4f",
        borderRadius: 4,
    },
    goalProgressSubtext: {
        fontSize: 11,
        color: "#999",
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    input: {
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: "#333",
        marginBottom: 12,
    },
    saveButton: {
        backgroundColor: "#2d6a4f",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
        marginBottom: 16,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    settingText: {
        flex: 1,
        fontSize: 15,
        color: "#333",
    },
});