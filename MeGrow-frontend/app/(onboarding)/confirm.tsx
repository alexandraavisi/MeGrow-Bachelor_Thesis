import { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "../../services/api";

const ARCHETYPE_INFO = {
    PLANNER: {
        emoji: "📋",
        title: "Planner",
        article: "a",
        description: "You prefer structure and planning. You work best with clear schedules and organized to-do lists.",
        color: "#4a90d9",
    },
    ACHIEVER: {
        emoji: "🏆",
        title: "Achiever",
        article: "an",
        description: "You are motivated by progress and results. You love challenges and seeing rapid improvement.",
        color: "#e67e22",
    },
    EXPLORER: {
        emoji: "🧭",
        title: "Explorer",
        article: "an",
        description: "You prefer variety and flexibility. You get bored with repetition and love discovering new things.",
        color: "#9b59b6",
    },
};

export default function ConfirmScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedArchetype, setSelectedArchetype] = useState(params.archetype as string);

    const archetype = ARCHETYPE_INFO[selectedArchetype as keyof typeof ARCHETYPE_INFO];
    const gentleMode = params.gentleMode === "true";
    const isChanged = selectedArchetype !== params.archetype;

    const handleConfirm = async (confirmed: boolean) => {
        setIsLoading(true);
        try {
            await api.post("/api/onboarding/confirm", {
                archetype: selectedArchetype,
                confirmed,
            });
            router.replace("/(tabs)");
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to confirm");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Your Archetype</Text>
            <Text style={styles.subtitle}>
                {isChanged
                   ? "You selected..."
                   : `Based on your answers, you are ${archetype.article}...`}
            </Text>

            <View style={[styles.archetypeCard, { borderColor: archetype?.color }]}>
                <Text style={styles.archetypeEmoji}>{archetype?.emoji}</Text>
                <Text style={[styles.archetypeName, { color: archetype?.color }]}>
                    {archetype?.title}
                </Text>
                <Text style={styles.archetypeDescription}>{archetype?.description}</Text>
            </View>

            {gentleMode && (
                <View style={styles.gentleCard}>
                    <Text style={styles.gentleTitle}>🌿 Gentle Mode Active</Text>
                    <Text style={styles.gentleDescription}>
                        Your journey, your pace! 🌱 We'll keep your daily tasks light and achievable so you can build momentum without feeling overwhelmed.
                    </Text>
                </View>
            )}

            <Text style={styles.question}>Does this sound like you?</Text>

            {isLoading ? (
                <ActivityIndicator size="large" color="#2d6a4f" />
            ) : (
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => handleConfirm(true)}>
                        <Text style={styles.confirmButtonText}>Yes, that's me!</Text>
                    </TouchableOpacity>

                    <Text style={styles.orText}>or choose a different one</Text>

                    {Object.entries(ARCHETYPE_INFO)
                        .filter(([key]) => key !== selectedArchetype)
                        .map(([key, info]) => (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.archetypeOption,
                                    { borderColor: info.color},
                                ]}
                                onPress={() => setSelectedArchetype(key)}>
                                <Text style={styles.optionEmoji}>{info.emoji}</Text>
                                <View style={styles.optionInfo}>
                                    <Text style={[styles.optionName, {color: info.color}]}>{info.title}</Text>
                                    <Text style={styles.optionDescription} numberOfLines={2}> {info.description}</Text>
                                </View>

                            </TouchableOpacity>
                        )
                    )}

                </View>
            )}
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
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 32,
    },
    archetypeCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        borderWidth: 2,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    archetypeEmoji: {
        fontSize: 64,
        marginBottom: 12,
    },
    archetypeName: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 12,
    },
    archetypeDescription: {
        fontSize: 15,
        color: "#666",
        textAlign: "center",
        lineHeight: 22,
    },
    gentleCard: {
        backgroundColor: "#e8f5e9",
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: "#2d6a4f",
    },
    gentleTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2d6a4f",
        marginBottom: 8,
    },
    gentleDescription: {
        fontSize: 14,
        color: "#555",
        lineHeight: 20,
    },
    question: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        textAlign: "center",
        marginBottom: 24,
        marginTop: 8,
    },
    buttonsContainer: {
        gap: 12,
    },
    confirmButton: {
        backgroundColor: "#2d6a4f",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
    },
    confirmButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    orText: {
        textAlign: "center",
        color: "#999",
        fontSize: 14,
    },
    archetypeOption: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        gap: 12,
    },
    selectedOption: {
        backgroundColor: "#f0f9f4",
    },
    optionEmoji: {
        fontSize: 32,
    },
    optionInfo: {
        flex: 1,
    },
    optionName: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: 13,
        color: "#666",
        lineHeight: 18,
    },
});