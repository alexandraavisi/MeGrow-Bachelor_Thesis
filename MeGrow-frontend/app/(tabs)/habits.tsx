import { useState, useCallback} from 'react';
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
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from "../../services/api";
import { useStepCounter } from "../../hooks/useStepCounter"

interface Habit {
    id: string;
    code: string;
    title: string;
    description: string;
    completedToday: boolean;
    active: boolean;
    custom: boolean;
}

export default function HabitsScreen() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [addHabitModalVisible, setAddHabitModalVisible] = useState(false);
    const [habitTitle, setHabitTitle] = useState("");
    const [habitDescription, setHabitDescription] = useState("");
    const [isCreatingHabit, setIsCreatingHabit] = useState(false);


    useFocusEffect(
        useCallback(() => {
            loadHabits();
        }, [])
    );

    const loadHabits = async () => {
        try {
            const response = await api.get("/api/habits");
            setHabits(response.data);
        } catch (error) {
            console.error("Error loading habits:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const { steps, isAvailable, target } = useStepCounter(loadHabits);

    const toggleHabit = async (habit: Habit) => {
        if (habit.completedToday) return;

        try {
            await api.post(`/api/habits/${habit.id}/log`);
            setHabits(prev =>
                prev.map(h => 
                    h.id === habit.id ? { ...h, completedToday: true} : h
                )
            );
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to log habit");
        }
    };

    const completedCount = habits.filter(h => h.completedToday).length;
    const totalCount = habits.length;

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2d6a4f" />
            </View>
        );
    }

    const handleCreateHabit = async () => {
        if (!habitTitle.trim()) {
            Alert.alert("Error", "Please enter a title");
            return;
        }

        setIsCreatingHabit(true);
        try {
            await api.post("/api/habits/custom", {
                title: habitTitle,
                description: habitDescription || null,
            });
            setAddHabitModalVisible(false);
            setHabitTitle("");
            setHabitDescription("");
            await loadHabits();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to create habit");
        } finally {
            setIsCreatingHabit(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Habits</Text>

            {/*Progress*/}
            <View style={ styles.progressCard}>

                <Text style={styles.progressText}>
                    {completedCount}/{totalCount} completed today
                </Text>
                <View style={styles.progressBar}>
                    <View style={[
                        styles.progressFill,
                        {width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%'}
                    ]} />
                </View>
            
            </View>

            {isAvailable && (
                <View style={styles.stepsCard}>
                    <View style={styles.stepsHeader}>
                        <Text style={styles.stepsTitle}>👣 Daily Steps</Text>
                        <Text style={styles.stepsCount}>{steps} / {target}</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[
                            styles.progressFill,
                            styles.stepsFill,
                            { width: `${Math.min((steps / target) * 100, 100)}%` }
                        ]} />
                    </View>
                    <Text style={styles.stepsSubtext}>
                        {steps >= target
                            ? "✅ Goal reached! Walking habit completed!"
                            : `${target - steps} more steps to complete your habit`}
                    </Text>
                </View>
            )}

            {/*Habits List*/}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Daily Habits</Text>
                {habits.filter(h => !h.custom  && h.code !== "WALK_STEPS").map(habit => (
                    <TouchableOpacity
                    key={habit.id}
                    style={[
                        styles.habitCard,
                        habit.completedToday && styles.habitCompleted,
                    ]}
                    onPress={() => toggleHabit(habit)} >
                    <View style={[
                        styles.checkBox,
                        habit.completedToday && styles.checkBoxChecked,
                    ]} >
                        {habit.completedToday && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                    </View>
                    <View style={styles.habitInfo}>
                        <Text style={[
                            styles.habitTitle,
                            habit.completedToday && styles.habitTitleDone,
                        ]}>
                            {habit.title}
                        </Text>
                        {habit.description && (
                            <Text style={styles.habitDescription}>{habit.description}</Text>
                        )}
                    </View>
                        {habit.code === "WALK_STEPS" && (
                            <Ionicons name="footsteps-outline" size={20} color="#999" />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/*Custom habits */}
            {habits.filter(h => h.custom).length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Custom Habits</Text>
                    {habits.filter(h => h.custom).map(habit => (
                        <TouchableOpacity
                            key={habit.id}
                            style={[
                                styles.habitCard,
                                habit.completedToday && styles.habitCompleted,
                            ]}
                            onPress={() => toggleHabit(habit)} >
                            <View style={[
                                styles.checkBox,
                                habit.completedToday && styles.checkBoxChecked,
                            ]}>
                                {habit.completedToday && (
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                )}

                            </View>
                            <View style={styles.habitInfo}>
                                <Text style={[
                                    styles.habitTitle,
                                    habit.completedToday && styles.habitTitleDone,
                                ]}>
                                    {habit.title}
                                </Text>
                                {habit.description && (
                                    <Text style={styles.habitDescription}>{habit.description}</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Add custom habit*/}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setAddHabitModalVisible(true)} >
                <Ionicons name="add" size={20} color="#2d6a4f" />
                <Text style={styles.addButtonText}>Add Custom Habit</Text>
            </TouchableOpacity>

            <Modal
                visible={addHabitModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setAddHabitModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.addHabitModalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Custom Habit</Text>
                            <TouchableOpacity onPress={() => setAddHabitModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.fieldLabel}>Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Practice guitar"
                            value={habitTitle}
                            onChangeText={setHabitTitle}
                        />

                        <Text style={styles.fieldLabel}>Description (optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Add more details..."
                            value={habitDescription}
                            onChangeText={setHabitDescription}
                            multiline
                        />

                        <TouchableOpacity
                            style={styles.createHabitButton}
                            onPress={handleCreateHabit}
                            disabled={isCreatingHabit}>
                            {isCreatingHabit
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.createHabitButtonText}>Create Habit</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    )
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
    progressCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    progressText: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
    }, 
    progressBar: {
        height: 8,
        backgroundColor: "#e0e0e0",
        borderRadius: 4,
    },
    progressFill: {
        height: 8,
        backgroundColor: "#2d6a4f",
        borderRadius: 4,
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
    habitCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        gap: 12,
    },
    habitCompleted: {
        opacity: 0.7,
    },
    checkBox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#2d6a4f",
        justifyContent: "center",
        alignItems: "center",
    },
    checkBoxChecked: {
        backgroundColor: "#2d6a4f",
        borderColor: "#2d6a4f",
    },
    habitInfo: {
        flex: 1,
    },
    habitTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#333",
    },
    habitTitleDone: {
        textDecorationLine: "line-through",
        color: "#999",
    },
    habitDescription: {
        fontSize: 12,
        color: "#999",
        marginTop: 2,
    },
    addButton: {
        borderWidth: 1,
        borderColor: "#2d6a4f",
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderStyle: "dashed",
    }, 
    addButtonText: {
        color: "#2d6a4f",
        fontSize: 16,
        fontWeight: "bold"
    },
    stepsCard: {
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
    stepsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    stepsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    stepsCount: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#2d6a4f",
    },
    stepsSubtext: {
        fontSize: 12,
        color: "#999",
        marginTop: 6,
    },
    stepsFill: {
        backgroundColor: "#2d6a4f",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    addHabitModalContainer: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
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
    fieldLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: "#333",
    },
    createHabitButton: {
        backgroundColor: "#2d6a4f",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 20,
    },
    createHabitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});