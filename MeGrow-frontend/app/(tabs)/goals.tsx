import { 
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
 } from "react-native";
import { useState, useCallback} from "react";
import {useRouter, useFocusEffect} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Modal, TextInput, Switch } from "react-native";
import api from "../../services/api";

interface Goal {
    id: string;
    category: string;
    title: string;
    description: string | null;
    motivation: string | null;
    level: string | null;
    durationWeeks: number;
    status: string;
    createdAt: string;
    fitnessType: string | null;
}

export default function GoalsScreen() {
    const router = useRouter();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const[modalVisible, setModalVisible] = useState(false);
    const [category, setCategory] = useState("LEARNING");
    const [title, setTitle] = useState("");
    const [motivation, setMotivation] = useState("");
    const [level, setLevel] = useState("BEGINNER");
    const [durationWeeks, setDurationWeeks] = useState("8");
    const [fitnessType, setFitnessType] = useState("TONING");
    const [isPhysicallyActive, setIsPhysicallyActive] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadGoals();
        }, [])
    );

    const loadGoals = async () => {
        try {
            const response = await api.get("/api/goals");
            setGoals(response.data);
        } catch (error) {
            console.error("Error loading golas:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getCategoryEmoji = (category: string) => {
        switch (category) {
            case "LEARNING": return "📚";
            case "LANGUAGE": return "🗣️";
            case "FITNESS": return "💪";
            default: return "🎯";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE": return "#2d6a4f";
            case "COMPLETED": return "#4caf50";
            case "PAUSED": return "#ff9800";
            case "ABANDONED": return "#f44336";
            default: return "#999";
        }
    };

    const activeGoals = goals.filter(g => g.status === "ACTIVE");
    const otherGoals = goals.filter(g => g.status !== "ACTIVE");

    const handleCreateGoal = async () => {
        if (!title) {
            Alert.alert("Error", "Please enter a title");
            return;
        }

        setIsCreating(true);
        try {
            const body: any = {
                category,
                title,
                motivation,
                durationWeeks: parseInt(durationWeeks),
            };

            if (category === "FITNESS") {
                body.fitnessType = fitnessType;
                body.isPhisicallyActive = isPhysicallyActive;
            } else {
                body.level = level;
            }

            await api.post("/api/goals", body);
            setModalVisible(false);
            setTitle("");
            setMotivation("");
            await loadGoals();
        } catch(error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to create goal");
        } finally {
            setIsCreating(false);
        }
    }

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2d6a4f" />
            </View>
        );
    }

    return(
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>My Goals</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)} >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/*active goals*/}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Active Goals ({activeGoals.length}/3)
                </Text>

                {activeGoals.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style= {styles.emptyEmoji}>🎯</Text>
                        <Text style={styles.emptyText}>No active goals yet!</Text>
                        <Text style={styles.emptySubtext}>Add a goal to get started with your personal growth journey.</Text>
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() => setModalVisible(true)}>
                            <Text style={styles.emptyButtonText}>Add Your First Goal</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    activeGoals.map(goal => (
                        <View key={goal.id} style={styles.goalCard}>
                            <View style={styles.goalHeader}>
                                <Text style={styles.goalEmoji}>
                                    {getCategoryEmoji(goal.category)}
                                </Text>
                                <View style={styles.goalInfo}>
                                    <Text style={styles.goalTitle}>{goal.title}</Text>
                                    <Text style={styles.goalCategory}>
                                        {goal.category} • {goal.durationWeeks} weeks
                                    </Text>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundClip: getStatusColor(goal.status) + "20"}
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        {color: getStatusColor(goal.status)}
                                    ]}>
                                        {goal.status}
                                    </Text>
                                </View>
                            </View>
                            {goal.motivation && (
                                <Text style={styles.goalMotivation}>💭 {goal.motivation}</Text>
                            )}

                            {goal.level && (
                                <Text style={styles.goalLevel}>Level: {goal.level}</Text>
                            )}

                            <View style={styles.goalActions}>
                                <TouchableOpacity
                                    style={styles.pauseButton}
                                    onPress={() => updateGoalStatus(goal.id, "PAUSED")}>
                                        <Text style={styles.pauseButtonText}>Pause</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.abandonButton}
                                        onPress={() => confirmAbandon(goal.id)}>
                                        <Text style={styles.abandonButtonText}>Abandon</Text>
                                    </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/*Other Goals*/}
            {otherGoals.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Other Goals</Text>
                    {otherGoals.map(goal => (
                        <View key={goal.id} style={[styles.goalCard, styles.goalCardInactive]}>
                            <View style={styles.goalHeader}>
                                <Text style={styles.goalEmoji}>
                                    {getCategoryEmoji(goal.category)}
                                </Text>
                                <View style={styles.goalInfo}>
                                    <Text style={styles.goalTitle}>{goal.title}</Text>
                                    <Text style={styles.goalCategory}>
                                        {goal.category} • {goal.durationWeeks} weeks
                                    </Text>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusColor(goal.status) + "20" }
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        { color: getStatusColor(goal.status) }
                                    ]}>
                                        {goal.status}
                                    </Text>
                                </View>
                            </View>

                            {goal.status === "PAUSED" && (
                                <TouchableOpacity
                                    style={styles.resumeButton}
                                    onPress={() => updateGoalStatus(goal.id, "ACTIVE")}>
                                    <Text style={styles.resumeButtonText}>Resume</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
            )}

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Goal</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Category */}
                            <Text style={styles.fieldLabel}>Category</Text>
                            <View style={styles.categoryContainer}>
                                {["LEARNING", "LANGUAGE", "FITNESS"].map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.categoryButton,
                                            category === cat && styles.categoryButtonActive,
                                        ]}
                                        onPress={() => setCategory(cat)}>
                                        <Text style={styles.categoryEmoji}>
                                            {cat === "LEARNING" ? "📚" : cat === "LANGUAGE" ? "🗣️" : "💪"}
                                        </Text>
                                        <Text style={[
                                            styles.categoryText,
                                            category === cat && styles.categoryTextActive,
                                        ]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Title */}
                            <Text style={styles.fieldLabel}>Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Learn Spanish"
                                value={title}
                                onChangeText={setTitle}
                            />

                            {/* Motivation */}
                            <Text style={styles.fieldLabel}>Motivation (optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Why do you want to achieve this?"
                                value={motivation}
                                onChangeText={setMotivation}
                                multiline
                            />

                            {/* Duration */}
                            <Text style={styles.fieldLabel}>Duration (weeks)</Text>
                            <View style={styles.durationContainer}>
                                {["4", "8", "12", "16"].map(w => (
                                    <TouchableOpacity
                                        key={w}
                                        style={[
                                            styles.durationButton,
                                            durationWeeks === w && styles.durationButtonActive,
                                        ]}
                                        onPress={() => setDurationWeeks(w)}>
                                        <Text style={[
                                            styles.durationText,
                                            durationWeeks === w && styles.durationTextActive,
                                        ]}>
                                            {w}w
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Level - doar pentru LEARNING și LANGUAGE */}
                            {category !== "FITNESS" && (
                                <>
                                    <Text style={styles.fieldLabel}>Level</Text>
                                    <View style={styles.levelContainer}>
                                        {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map(l => (
                                            <TouchableOpacity
                                                key={l}
                                                style={[
                                                    styles.levelButton,
                                                    level === l && styles.levelButtonActive,
                                                ]}
                                                onPress={() => setLevel(l)}>
                                                <Text style={[
                                                    styles.levelText,
                                                    level === l && styles.levelTextActive,
                                                ]}>
                                                    {l}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            {/* Fitness specific */}
                            {category === "FITNESS" && (
                                <>
                                    <Text style={styles.fieldLabel}>Fitness Type</Text>
                                    <View style={styles.levelContainer}>
                                        {["WEIGHT_LOSS", "TONING", "MOBILITY"].map(ft => (
                                            <TouchableOpacity
                                                key={ft}
                                                style={[
                                                    styles.levelButton,
                                                    fitnessType === ft && styles.levelButtonActive,
                                                ]}
                                                onPress={() => setFitnessType(ft)}>
                                                <Text style={[
                                                    styles.levelText,
                                                    fitnessType === ft && styles.levelTextActive,
                                                ]}>
                                                    {ft.replace("_", " ")}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={styles.switchContainer}>
                                        <Text style={styles.fieldLabel}>Are you physically active?</Text>
                                        <Switch
                                            value={isPhysicallyActive}
                                            onValueChange={setIsPhysicallyActive}
                                            trackColor={{ true: "#2d6a4f" }}
                                        />
                                    </View>
                                </>
                            )}

                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={handleCreateGoal}
                                disabled={isCreating}>
                                {isCreating
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.createButtonText}>Create Goal 🎯</Text>
                                }
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    );

    async function updateGoalStatus(goalId: string, status: string) {
        try {
            await api.patch(`/api/goals/${goalId}/status?status=${status}`);
            await loadGoals();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to update goal");
        }
    }

    function confirmAbandon(goalId: string) {
        Alert.alert(
            "Abandon Goal",
            "Are you sure you want to abandon this goal? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Abandon",
                    style: "destructive",
                    onPress: () => updateGoalStatus(goalId, "ABANDONED"),
                },
            ]
        );
    }
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
    },
    addButton: {
        backgroundColor: "#2d6a4f",
        borderRadius: 12,
        padding: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 12,
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
        marginBottom: 16,
    },
    emptyButton: {
        backgroundColor: "#2d6a4f",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    emptyButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    goalCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    goalCardInactive: {
        opacity: 0.7,
    },
    goalHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
    },
    goalEmoji: {
        fontSize: 32,
    },
    goalInfo: {
        flex: 1,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    goalCategory: {
        fontSize: 12,
        color: "#999",
        marginTop: 2,
    },
    statusBadge: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "bold",
    },
    goalMotivation: {
        fontSize: 13,
        color: "#666",
        fontStyle: "italic",
        marginBottom: 8,
    },
    goalLevel: {
        fontSize: 12,
        color: "#999",
        marginBottom: 8,
    },
    goalActions: {
        flexDirection: "row",
        gap: 8,
        marginTop: 8,
    },
    pauseButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ff9800",
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: "center",
    },
    pauseButtonText: {
        color: "#ff9800",
        fontWeight: "600",
        fontSize: 13,
    },
    abandonButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#f44336",
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: "center",
    },
    abandonButtonText: {
        color: "#f44336",
        fontWeight: "600",
        fontSize: 13,
    },
    resumeButton: {
        borderWidth: 1,
        borderColor: "#2d6a4f",
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: "center",
        marginTop: 8,
    },
    resumeButtonText: {
        color: "#2d6a4f",
        fontWeight: "600",
        fontSize: 13,
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
        maxHeight: "90%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: "#333",
    },
    categoryContainer: {
        flexDirection: "row",
        gap: 8,
    },
    categoryButton: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "transparent",
    },
    categoryButtonActive: {
        borderColor: "#2d6a4f",
        backgroundColor: "#e8f5e9",
    },
    categoryEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    categoryText: {
        fontSize: 11,
        color: "#666",
        fontWeight: "600",
    },
    categoryTextActive: {
        color: "#2d6a4f",
    },
    durationContainer: {
        flexDirection: "row",
        gap: 8,
    },
    durationButton: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "transparent",
    },
    durationButtonActive: {
        borderColor: "#2d6a4f",
        backgroundColor: "#e8f5e9",
    },
    durationText: {
        fontSize: 14,
        color: "#666",
        fontWeight: "600",
    },
    durationTextActive: {
        color: "#2d6a4f",
    },
    levelContainer: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
    },
    levelButton: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        padding: 8,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "transparent",
    },
    levelButtonActive: {
        borderColor: "#2d6a4f",
        backgroundColor: "#e8f5e9",
    },
    levelText: {
        fontSize: 12,
        color: "#666",
        fontWeight: "600",
    },
    levelTextActive: {
        color: "#2d6a4f",
    },
    switchContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
    },
    createButton: {
        backgroundColor: "#2d6a4f",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 24,
        marginBottom: 16,
    },
    createButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});