import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { Pedometer } from "expo-sensors";
import api from "../services/api";

const STEP_TARGET = 6000;

export function useStepCounter(onHabitLogged?: () => void) {
    const [steps, setSteps] = useState(0);
    const [isAvailable, setIsAvailable] = useState(false);
    const [habitLogged, setHabitLogged] = useState(false);

    const baseStepsRef = useRef(0);

    useEffect(() => {
        let subscription: any;

        const startTracking = async () => {
            const available = await Pedometer.isAvailableAsync();
            setIsAvailable(available);

            if (!available) return;

            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();

            try {
                const result = await Pedometer.getStepCountAsync(start, end);
                baseStepsRef.current = result.steps;
                setSteps(result.steps);
                await checkAndLogSteps(result.steps);
            } catch (error) {
                console.error("Error getting steps:", error);
            }

    
            subscription = Pedometer.watchStepCount(async (result) => {
                const total = Platform.OS === "ios"
                    ? baseStepsRef.current + result.steps
                    : result.steps; 
                setSteps(total);
                await checkAndLogSteps(total);
            });
        };

        startTracking();

        return () => {
            if (subscription) subscription.remove();
        };
    }, []);

    const checkAndLogSteps = async (currentSteps: number) => {
        if (currentSteps >= STEP_TARGET && !habitLogged) {
            try {
                await api.post("/api/habits/steps", { steps: currentSteps });
                setHabitLogged(true);
                onHabitLogged?.();
            } catch (error) {
            }
        }
    };

    return { steps, isAvailable, target: STEP_TARGET };
}