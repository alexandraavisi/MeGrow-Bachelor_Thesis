import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl, 
    Modal,
    Alert,
} from "react-native";
import { useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";

interface Task {
    id: string;
    title: string;
    status: string;
    estimatedMinutes: number;
    source: string;
    difficulty: string;
    surprise: boolean;
    goalId: string | null;
}

interface DailyPlan {
    id: string;
    planDate: string;
    overloadLevel: string;
    totalEstimatedMinutes: number;
    tasks: Task[];
}

interface UserStats {
    xpTotal: number;
    level: number;
    treeHealth: number;
    streakDays: number;
}

export default function HomeScreen() {
    const router =useRouter();
    const [plan, setPlan] = useState<DailyPlan | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [userName, setUserName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [surpriseModalVisible, setSurpriseModalVisible] = useState(false);
    const [selectedSurpriseTask, setSelectedsurpriseTask] = useState<Task | null>(null);
    const [surpriseOptions, setSurpriseOptions] = useState<any>(null);

    useEffect(() => {
        loadData();
        loadUserName();
    }, []);

    const loadUserName = async () => {
        const user = await AsyncStorage.getItem("user");
        if (user) {
            const parsed = JSON.parse(user);
            setUserName(parsed.name.split(" ")[0]);
        }
    };

    const loadData = async () => {
        try {
            const [planResponse, statsResponse] = await Promise.all([
                api.get("/api/daily-plan/today"),
                api.get("/api/user/stats"),
            ]);
            setPlan(planResponse.data);
            setStats(statsResponse.data);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const getTreeEmoji = (level: number, health: number) => {
        if (health < 20) return "🥀";
        if (level >= 4) return "🌲";
        if (level >= 3) return "🌳";
        if (level >= 2) return "🌿";
        return "🌱";
    }

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "DONE": return "✅";
            case "IN_PROGRESS": return "⏱️";
            case "DEFERRED": return "⏭️";
            case "SKIPPED": return "⏩";
            default: return "⬜";
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "EASY": return "#4caf50";
            case "MEDIUM": return "#ff9800";
            case "HARD": return "#f44336";
            default: return "#666";
        }
    };

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    const openSurpriseModal = async (task: Task) => {
        setSelectedsurpriseTask(task);
        try {
            const response = await api.get(`/api/tasks/${task.id}/surprise-options`);
            setSurpriseOptions(response.data);
            setSurpriseModalVisible(true);
        } catch (error) {
            Alert.alert("Error", "Failed to load options");
        }
    };

    const chooseSurpriseOption = async (backlogItemId: string) => {
        if (!selectedSurpriseTask) return;
        try {
            await api.post(`/api/tasks/${selectedSurpriseTask.id}/choose`, {backlogItemId});
            setSurpriseModalVisible(false);
            await loadData();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to choose");
        }
    };

    if (isLoading) {
        return(
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2d6a4f" />
            </View>
        );
    }

    const completedTasks = plan?.tasks.filter(t => t.status === "DONE").length || 0;
    const totalTasks = plan?.tasks.length || 0;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2d6a4f"/>
            }>
            
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{getGreeting()}, {userName}!</Text>
                    <Text style={styles.date}>{today}</Text>
                </View>
            </View>

            {/* Tree Preview */}
            {stats && (
                <TouchableOpacity
                    style={styles.treeCard}
                    onPress={() => router.push("/(tabs)/tree")}>
                    <Text style={styles.treeEmoji}>
                        {getTreeEmoji(stats.level, stats.treeHealth)}
                    </Text>
                    <View style={styles.treeInfo}>
                        <Text style={styles.treeLevel}>Level {stats.level}</Text>
                        <Text style={styles.treeXp}>{stats.xpTotal} XP</Text>
                        <View style={styles.healthBar}>
                            <View style={[styles.healthFill, { width: `${stats.treeHealth}%` }]} />
                        </View>
                        <Text style={styles.healthText}>❤️ {stats.treeHealth}/100</Text>
                    </View>
                    <View style={styles.streakBadge}>
                        <Text style={styles.streakText}>🔥 {stats.streakDays}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
            )}

            {/* Today's Plan */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Plan</Text>
                    <Text style={styles.sectionSubtitle}>
                        {completedTasks}/{totalTasks} completed
                    </Text>
                </View>

                {plan?.overloadLevel === "MODERATE" && (
                    <View style={styles.warningCard}>
                        <Text style={styles.warningText}>
                            ⚠️ Busy day! Some tasks have been reduced.
                        </Text>
                    </View>
                )}

                {plan?.overloadLevel === "CRITICAL" && (
                    <View style={[styles.warningCard, styles.criticalCard]}>
                        <Text style={styles.warningText}>
                            🔴 Very busy day! Focus on your manual tasks first.
                        </Text>
                    </View>
                )}

                {totalTasks === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyEmoji}>🎉</Text>
                        <Text style={styles.emptyText}>No tasks for today!</Text>
                        <Text style={styles.emptySubtext}>Enjoy your free time or add a new goal.</Text>
                    </View>
                ) : (
                    plan?.tasks.map((task) => (
                        <TouchableOpacity
                            key={task.id}
                            style={[
                                styles.taskCard,
                                task.status === "DONE" && styles.taskDone,
                            ]}
                            onPress={() => {
                                if (task.surprise) {
                                    openSurpriseModal(task);
                                } else {
                                    router.push(`/(tabs)/task/${task.id}` as any)
                                }
                            }}>
                            
                            <Text style={styles.taskStatus}>{getStatusIcon(task.status)}</Text>
                            <View style={styles.taskInfo}>
                                <Text style={[
                                    styles.taskTitle,
                                    task.status === "DONE" && styles.taskTitleDone,
                                ]}>
                                    {task.surprise ? "🎁 Surprise Task" : task.title}
                                </Text>
                                <View style={styles.taskMeta}>
                                    <Text style={styles.taskTime}>⏱ {task.estimatedMinutes} min</Text>
                                    <Text style={[styles.taskDifficulty, { color: getDifficultyColor(task.difficulty) }]}>
                                        {task.difficulty}
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#ccc" />
                        </TouchableOpacity>
                    ))
                )}
            </View>

            {/* Add Manual Task Button */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push("/(tabs)/add-task" as any)}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Task</Text>
            </TouchableOpacity>

            {/*surprise task*/}
            <Modal
                visible={surpriseModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setSurpriseModalVisible(false)} 
            >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalEmoji}>🎁</Text>
                    <Text style={styles.modalTitle}>Surprise Task!</Text>
                    <Text style={styles.modalSubtitle}>Choose your activity for today</Text>

                    {surpriseOptions && (
                        <>
                            <TouchableOpacity
                                style={styles.modalOptionCard}
                                onPress={() => chooseSurpriseOption(surpriseOptions.option1Id)} >
                                <Text style={styles.modalOptionTitle}>{surpriseOptions.option1Title}</Text>
                                <Text style={styles.modalOptionTime}>⏱{ surpriseOptions.option1EstimatedMinutes} min</Text>
                            </TouchableOpacity>

                            <Text style={styles.modalOrText}>or</Text>

                            <TouchableOpacity
                                style={styles.modalOptionCard}
                                onPress={() => chooseSurpriseOption(surpriseOptions.option2Id)} >
                                <Text style={styles.modalOptionTitle}>{surpriseOptions.option2Title}</Text>
                                <Text style={styles.modalOptionTime}>⏱{ surpriseOptions.option2EstimatedMinutes} min</Text>
                            </TouchableOpacity>
                        </>
                    )

                    }
                    <TouchableOpacity
                        style={styles.modalCancelButton}
                        onPress={() => setSurpriseModalVisible(false)}>
                        <Text style={styles.modalCancelText}>Cancel</Text>
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
    header: {
        marginBottom: 24,
    },
    greeting: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
    },
    date: {
        fontSize: 14,
        color: "#999",
        marginTop: 4,
    },
    treeCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16, 
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius:8,
        elevation: 3,
        gap: 12,
    },
    treeEmoji: {
        fontSize: 48,
    },
    treeInfo: {
        flex: 1,
    },
    treeLevel: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    treeXp: {
        fontSize: 12,
        color: "#999",
        marginBottom: 4,
    },
    healthBar: {
        height: 6,
        backgroundColor: "#e0e0e0",
        borderRadius: 3,
        marginBottom: 4,
    },
    healthFill: {
        height: 6,
        backgroundColor: "#e74c3c",
        borderRadius: 3,
    },
    healthText: {
        fontSize: 11,
        color: "#666",
    },
    streakBadge: {
        backgroundColor: "#fff3e0",
        borderRadius: 8,
        padding: 8,
    },
    streakText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#e67e22"
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize:18,
        fontWeight: "bold",
        color: "#333",
    },
    sectionSubtitle: {
        fontSize: 13,
        color: "#999",
    },
    warningCard: {
        backgroundColor: "#fff8e1",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#ff9800",
    },
    criticalCard: {
        backgroundColor: "#ffebee",
        borderLeftColor: "#f44336",
    },
    warningText: {
        fontSize: 13,
        color: "#555",
    },
    emptyCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 32,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
    },
    taskCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        gap: 12,
    },
    taskDone: {
        opacity: 0.6,
    },
    taskStatus: {
        fontSize: 20,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    taskTitleDone: {
        textDecorationLine: "line-through",
        color: "#999",
    },
    taskMeta: {
        flexDirection: "row",
        gap: 12,
    },
    taskTime: {
        fontSize: 12,
        color: "#999",
    },
    taskDifficulty: {
        fontSize: 12,
        fontWeight: "600",
    },
    addButton: {
        backgroundColor: "#2d6a4f",
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    addButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold"
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
        alignItems: "center",
        paddingBottom: 40,
    },
    modalEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: "#999",
        marginBottom: 24,
    },
    modalOptionCard: {
        width: "100%",
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: "#2d6a4f",
    },
    modalOptionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    modalOptionTime: {
        fontSize: 13,
        color: "#999",
    },
    modalOrText: {
        fontSize: 14,
        color: "#999",
        marginVertical: 8,
    },
    modalCancelButton: {
        marginTop: 16,
        padding: 12,
    },
    modalCancelText: {
        fontSize: 16,
        color: "#999",
    },
});