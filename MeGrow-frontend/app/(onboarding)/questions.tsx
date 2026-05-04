import { useState, useEffect } from "react";
import { 
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";

interface Question {
    questionIndex: number;
    text: string;
    isReverse: boolean;
}

interface Answer {
    questionIndex: number;
    answerValue: number;
}

export default function  QuestionScreen() {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const response = await api.get("/api/onboarding/questions");
            setQuestions(response.data);
        } catch (error) {
            Alert.alert("Error", "Failed to load questions");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswer = async (value: number) => {
        const currentQuestion = questions[currentIndex];
        const newAnswer: Answer = {
            questionIndex: currentQuestion.questionIndex,
            answerValue: value,
        };

        const updatedAnswers = [...answers, newAnswer];
        setAnswers(updatedAnswers);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            await submitAnswers(updatedAnswers);
        }
    };

    const submitAnswers = async (allAnswers: Answer[]) => {
        setIsSubmitting(true);
        try {
            const response = await api.post("/api/onboarding/submit", {
                answers: allAnswers,
            });
            router.replace({
                pathname: "/(onboarding)/confirm",
                params: {
                    archetype: response.data.calculatedArchetype,
                    gentleMode: response.data.gentleMode,
                    scoreO: response.data.scoreO,
                    scoreV: response.data.scoreV,
                    scoreM: response.data.scoreM,
                    scoreS: response.data.scoreS,
                },
            });
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to submit");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2d6a4f" />
                <Text style={styles.loadingText}>Loading questions...</Text>
            </View>
        );
    }

    if (isSubmitting) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2d6a4f" />
                <Text style={styles.loadingText}>Calculating your archetype...</Text>
            </View>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.progress}>
                    {currentIndex + 1} / {questions.length}
                </Text>
                <View style = {styles.progressBar}>
                    <View style={[styles.progressFill, {width: `${progress}%`}]} />
                </View>
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.mainTitle}>🌱</Text>
                <Text style={styles.mainTitle}>Discover your</Text>
                <Text style={styles.mainTitleBold}>Archetype</Text>
                <Text style={styles.mainSubtitle}>Answer honestly - there are no right or wrong answers</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.questionText}>{currentQuestion?.text}</Text>
                
                <View style={styles.scaleContainer}>
                    <Text style={styles.scaleLabel}>Strongly Disagree</Text>
                    <Text style={styles.scaleLabel}>Strongly Agree</Text>
                </View>

                <View style={styles.optionsContainer}>
                    {[1, 2, 3, 4, 5].map((value) => (
                        <TouchableOpacity
                            key={value}
                            style={styles.optionButton}
                            onPress={() => handleAnswer(value)}>
                            <Text style={styles.optionText}>{value}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        paddingTop: 60,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: "#666",
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    progress: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
        textAlign: "right",
    },
    progressBar: {
        height: 6,
        backgroundColor: "#e0e0e0",
        borderRadius: 3,
    },
    progressFill: {
        height: 6,
        backgroundColor: "#2d6a4f",
        borderRadius: 3
    },
    content: {
        flexGrow: 1,
        padding: 24,
        justifyContent: "center"
    },
    questionText: {
        fontSize: 22,
        fontWeight: "600",
        color: "#333",
        textAlign: "center",
        lineHeight: 32,
        marginBottom: 48,
    },
    scaleContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    scaleLabel: {
        fontSize: 12,
        color: "#999"
    },
    optionsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
    },
    optionButton: {
        flex: 1,
        aspectRatio: 1,
        backgroundColor: "#fff",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    optionText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#2d6a4f",
    },
    titleContainer: {
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    mainTitle: {
        fontSize: 28,
        color: '#333',
        textAlign: 'center'
    },
    mainTitleBold: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2d6a4f',
        textAlign: 'center',
        marginBottom: 8,
    },
    mainSubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
});