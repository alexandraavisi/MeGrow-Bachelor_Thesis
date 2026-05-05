import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
     View,
     Text,
     StyleSheet,
     ScrollView,
     ActivityIndicator
} from 'react-native';
import api from "../../services/api";

interface UserStats {
    xpTotal: number;
    level: number;
    treeHealth: number;
    streakDays: number;
    lastActivityDate: string | null;
    rescueMode: boolean;
}

export default function TreeScreen() {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [])
    );

    const loadStats = async () => {
        try {
            const response = await api.get("/api/user/stats");
            setStats(response.data);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTreeEmoji = (level: number, health: number) => {
        if (health < 20) return "🥀";
        if (level >= 4) return "🌲";
        if (level >= 3) return "🌳";
        if (level >= 2) return "🌿";
        return "🌱";
    }

    const getTreeMessage = (level: number, health: number) => {
        if (health < 20) return "Your tree needs attention! Complete some habits to help it recover.";
        if (health < 50) return "Your tree is struggling. Keep completing your daily tasks!";
        if (health < 80) return "Your tree is doing well. Keep up the good work!";
        return "Your tree is thriving! You're on fire! 🔥";
    }

    const getXpForNextLevel = (level: number) => {
        if (level === 1) return 100;
        if (level === 2) return 300;
        if (level === 3) return 600;
        if (level === 4) return 1000;
        return 1000 + (level - 4) * 500;
    };

    const getXpForCurrentLevel = (level: number) => {
        if (level === 1) return 0;
        if (level === 2) return 100;
        if (level === 3) return 300;
        if (level === 4) return 600;
        return 1000 + (level - 5) * 500;
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2d6a4f" />
            </View>
        );
    }

    if (!stats) return null;

    const xpForNext = getXpForNextLevel(stats.level);
    const xpForCurrent = getXpForCurrentLevel(stats.level);
    const xpProgress = ((stats.xpTotal - xpForCurrent) / (xpForNext - xpForCurrent)) * 100;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>My Tree</Text>

            {/* Tree visual*/ }
            <View style={styles.treeContainer}>
                <Text style={styles.treeEmoji}>
                    {getTreeEmoji(stats.level, stats.treeHealth)}
                </Text>
                {stats.rescueMode && (
                    <View style={styles.rescueBadge}>
                        <Text style={styles.rescueText}>🆘 Rescue Mode</Text>
                    </View>
                )}
                <Text style={styles.treeMessage}>
                    {getTreeMessage(stats.level, stats.treeHealth)}
                </Text>
            </View>

            {/*Level and XP*/}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Level {stats.level}</Text>
                    <Text style={styles.cardSubtitle}>{stats.xpTotal} XP total</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, {width: `${Math.min(xpProgress, 100)}%`}]}/>
                </View>
                <Text style={styles.progressText}>
                    {stats.xpTotal - xpForCurrent} / {xpForNext - xpForCurrent} XP to Level {stats.level + 1}
                </Text>
            </View>

            {/*Health */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Tree Health</Text>
                    <Text style={styles.cardSubtitle}>{stats.treeHealth}/100</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[
                        styles.progressFill,
                        styles.healthFill,
                        {width: `${stats.treeHealth}%`}
                    ]}/>
                </View>
                <Text style={styles.progressText}>
                    Complete habits and goals to increase health
                </Text>
            </View>

            {/* Streak */}
            <View style={styles.streakCard}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <View>
                    <Text style={styles.streakNumber}>{stats.streakDays}</Text>
                    <Text style={styles.streakLabel}>Day Streak</Text>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statEmoji}>⭐</Text>
                    <Text style={styles.statValue}>{stats.xpTotal}</Text>
                    <Text style={styles.statLabel}>Total XP</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statEmoji}>🏆</Text>
                    <Text style={styles.statValue}>{stats.level}</Text>
                    <Text style={styles.statLabel}>Level</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statEmoji}>❤️</Text>
                    <Text style={styles.statValue}>{stats.treeHealth}</Text>
                    <Text style={styles.statLabel}>Health</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statEmoji}>🔥</Text>
                    <Text style={styles.statValue}>{stats.streakDays}</Text>
                    <Text style={styles.statLabel}>Streak</Text>
                </View>
            </View>


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
    treeContainer: {
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 32,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    treeEmoji: {
        fontSize: 100,
        marginBottom: 16,
    },
    rescueBadge: {
        backgroundColor: "#ffebee",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 12,
    },
    rescueText: {
        color: "#f44336",
        fontWeight: "bold",
        fontSize: 14,
    }, 
    treeMessage: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        lineHeight: 20,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    cardSubtitle: {
        fontSize: 14,
        color: "#999",
    },
    progressBar: {
        height: 10,
        backgroundColor: "#e0e0e0",
        borderRadius: 5,
        marginBottom: 8,
    },
    progressFill: {
        height: 10,
        backgroundColor: "#2d6a4f",
        borderRadius: 5,
    },
    healthFill: {
        backgroundColor: "#e74c3c",
    },
    progressText: {
        fontSize: 12,
        color: "#999",
    },
    streakCard: {
        backgroundColor: "#fff3e0",
        borderRadius: 16,
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginBottom: 12,
    },
    streakEmoji: {
        fontSize: 48,
    },
    streakNumber: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#e67e22",
    },
    streakLabel: {
        fontSize: 14,
        color: "#e67e22",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: "45%",
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
    statEmoji: {
        fontSize: 28,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333"
    },
    statLabel: {
        fontSize: 12,
        color: "#999",
        marginTop: 4,
    },
});