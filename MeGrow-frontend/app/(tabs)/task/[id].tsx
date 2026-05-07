import { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    difficulty: string;
    estimatedMinutes: number;
    source: string;
    goalId: string | null;
    parentTaskId: string | null;
    details: Record<string, any> | null;
}

interface SubTask {
    id: string;
    title: string;
    status: string;
    estimatedMinutes: number;
}

export default function TaskDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [task, setTask] = useState<Task | null>(null);
    const [subtasks, setSubtasks] = useState<SubTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        loadTask();
        return () => {
             if(timerRef.current) clearInterval(timerRef.current);
        }
    }, [id]);

    const loadTask = async () => {
        if (timerRef.current)
            clearInterval(timerRef.current);

        try {
            const [taskResponse, subtasksResponse] = await Promise.all([
                api.get(`/api/tasks/${id}`),
                api.get(`/api/tasks/${id}/subtasks`),
            ]);
            setTask(taskResponse.data);
            setSubtasks(subtasksResponse.data);

            const savedSeconds = await AsyncStorage.getItem(`timer_${id}`);
            if (savedSeconds) {
                setSeconds(parseInt(savedSeconds));
            } else {
                setSeconds(taskResponse.data.estimatedMinutes * 60);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to load task");
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const startTimer = () => {
        if(timerRef.current)
            clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleDone(); 
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleStart = async () => {
        try {
            await api.post(`/api/tasks/${id}/start`);
            setIsRunning(true);
            setTask(prev => prev ? { ...prev, status: "IN_PROGRESS" } : null);
            startTimer();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to start task");
        }
    };

    const handlePause = async () => {
        try {
            await api.post(`/api/tasks/${id}/pause`);
            setIsRunning(false);
            if(timerRef.current) 
                clearInterval(timerRef.current)
            await AsyncStorage.setItem(`timer_${id}`, seconds.toString());
            setTask(prev => prev ? { ...prev, status: "TODO" } : null);
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to pause task");
        }
    };

    const handleDone = async () => {
        try {
            await api.patch(`/api/tasks/${id}/status`, { status: "DONE" });
            if(timerRef.current) 
                clearInterval(timerRef.current);
            await AsyncStorage.removeItem(`timer_${id}`);
            router.back();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to complete task");
        }
    };

    const handleSubtaskDone = async (subtaskId: string) => {
        try {
            await api.patch(`/api/tasks/${subtaskId}/status`, { status: "DONE" });
            setSubtasks(prev =>
                prev.map(s => s.id === subtaskId ? { ...s, status: "DONE" } : s)
            );
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to complete subtask");
        }
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "EASY": return "#4caf50";
            case "MEDIUM": return "#ff9800";
            case "HARD": return "#f44336";
            default: return "#666";
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2d6a4f" />
            </View>
        );
    }

    if (!task) return null;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Task Detail</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Task Info */}
                <View style={styles.taskCard}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.description && (
                        <Text style={styles.taskDescription}>{task.description}</Text>
                    )}
                    <View style={styles.taskMeta}>
                        <View style={[styles.badge, { backgroundColor: getDifficultyColor(task.difficulty) + "20" }]}>
                            <Text style={[styles.badgeText, { color: getDifficultyColor(task.difficulty) }]}>
                                {task.difficulty}
                            </Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>⏱ {task.estimatedMinutes} min</Text>
                        </View>
                        {task.source === "GOAL_GENERATED" && (
                            <View style={[styles.badge, { backgroundColor: "#e8f5e9" }]}>
                                <Text style={[styles.badgeText, { color: "#2d6a4f" }]}>Goal Task</Text>
                            </View>
                        )}
                    </View>

                    {task.details && (
                        <View style={styles.detailsContainer}>
                            {Object.entries(task.details).map(([key, value]) => (
                                <View key={key} style={styles.detailItem}>
                                    <Text style={styles.detailKey}>
                                        {key.replace(/ _/g, " ").toUpperCase()}
                                    </Text>
                                    {Array.isArray(value) ? (
                                        value.map((item, index) => (
                                            <Text key={index} style={styles.detailValue}>• {item}</Text>
                                        ))
                                    ) : (
                                        <Text style={styles.detailValue}>{value}</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Timer */}
                <View style={styles.timerCard}>
                    <Text style={styles.timerLabel}>
                        {isRunning ? "Time elapsed" : "Ready to start?"}
                    </Text>
                    <Text style={styles.timerText}>{formatTime(seconds)}</Text>

                    <View style={styles.timerButtons}>
                        {task.status !== "DONE" && (
                            <>
                                {!isRunning ? (
                                    <TouchableOpacity
                                        style={styles.startButton}
                                        onPress={handleStart}>
                                        <Ionicons name="play" size={20} color="#fff" />
                                        <Text style={styles.startButtonText}>Start</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.pauseButton}
                                        onPress={handlePause}>
                                        <Ionicons name="pause" size={20} color="#fff" />
                                        <Text style={styles.pauseButtonText}>Pause</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={styles.doneButton}
                                    onPress={handleDone}>
                                    <Ionicons name="checkmark" size={20} color="#fff" />
                                    <Text style={styles.doneButtonText}>Mark as Done</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {task.status === "DONE" && (
                            <View style={styles.completedBadge}>
                                <Text style={styles.completedText}>✅ Completed!</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Subtasks */}
                {subtasks.length > 0 && (
                    <View style={styles.subtasksSection}>
                        <Text style={styles.subtasksTitle}>Subtasks</Text>
                        {subtasks.map(subtask => (
                            <TouchableOpacity
                                key={subtask.id}
                                style={[
                                    styles.subtaskCard,
                                    subtask.status === "DONE" && styles.subtaskDone,
                                ]}
                                onPress={() => subtask.status !== "DONE" && handleSubtaskDone(subtask.id)}>
                                <View style={[
                                    styles.checkbox,
                                    subtask.status === "DONE" && styles.checkboxChecked,
                                ]}>
                                    {subtask.status === "DONE" && (
                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                    )}
                                </View>
                                <Text style={[
                                    styles.subtaskTitle,
                                    subtask.status === "DONE" && styles.subtaskTitleDone,
                                ]}>
                                    {subtask.title}
                                </Text>
                                <Text style={styles.subtaskTime}>{subtask.estimatedMinutes} min</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    content: {
        padding: 24,
        paddingBottom: 48,
        gap: 16,
    },
    taskCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    taskTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8,
    },
    taskDescription: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
        marginBottom: 12,
    },
    taskMeta: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    badge: {
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#666",
    },
    timerCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    timerLabel: {
        fontSize: 14,
        color: "#999",
        marginBottom: 8,
    },
    timerText: {
        fontSize: 48,
        fontWeight: "bold",
        color: "#2d6a4f",
        marginBottom: 24,
        fontVariant: ["tabular-nums"],
    },
    timerButtons: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
    },
    startButton: {
        flex: 1,
        backgroundColor: "#2d6a4f",
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    startButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    pauseButton: {
        flex: 1,
        backgroundColor: "#ff9800",
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    pauseButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    doneButton: {
        flex: 1,
        backgroundColor: "#4caf50",
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    doneButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    completedBadge: {
        flex: 1,
        alignItems: "center",
        padding: 14,
    },
    completedText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#4caf50",
    },
    subtasksSection: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    subtasksTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 12,
    },
    subtaskCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        gap: 12,
    },
    subtaskDone: {
        opacity: 0.6,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#2d6a4f",
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxChecked: {
        backgroundColor: "#2d6a4f",
        borderColor: "#2d6a4f",
    },
    subtaskTitle: {
        flex: 1,
        fontSize: 14,
        color: "#333",
    },
    subtaskTitleDone: {
        textDecorationLine: "line-through",
        color: "#999",
    },
    subtaskTime: {
        fontSize: 12,
        color: "#999",
    },
    detailsContainer: {
        marginTop: 12,
        gap: 12,
    },
    detailItem: {
        gap: 4,
    },
    detailKey: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#2d6a4f",
        letterSpacing: 1,
    },
    detailValue: {
        fontSize: 14,
        color: "#555",
        lineHeight: 20,
    },
});