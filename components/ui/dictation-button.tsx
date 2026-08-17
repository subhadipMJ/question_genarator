"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DictationButtonProps {
    onResult: (text: string) => void;
    className?: string;
}

export function DictationButton({ onResult, className }: DictationButtonProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setIsSupported(false);
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = "en-US";

            recognition.onstart = () => {
                setIsListening(true);
                toast.success("Listening... Speak now");
            };

            recognition.onresult = (event: any) => {
                const current = event.resultIndex;
                const transcript = event.results[current][0].transcript;
                onResult(transcript);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    toast.error("Microphone access denied. Please allow microphone permissions.");
                } else if (event.error !== 'no-speech') {
                    toast.error(`Speech recognition error: ${event.error}`);
                }
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [onResult]);

    const toggleListening = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!isSupported) {
            toast.error("Your browser does not support Speech Recognition.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            try {
                recognitionRef.current?.start();
            } catch (err) {
                console.error("Could not start speech recognition:", err);
            }
        }
    };

    if (!isSupported) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger render={
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled 
                            className={`h-8 w-8 p-0 ${className}`}
                        >
                            <MicOff className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    } />
                    <TooltipContent>
                        <p>Voice dictation not supported in this browser</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger render={
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleListening}
                        className={`h-8 w-8 p-0 relative transition-all ${isListening ? 'text-red-500 hover:text-red-600 bg-red-100 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50' : 'text-muted-foreground hover:text-foreground'} ${className}`}
                    >
                        <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
                        {isListening && (
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                    </Button>
                } />
                <TooltipContent>
                    <p>{isListening ? "Listening... Click to stop" : "Dictate question"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
