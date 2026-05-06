import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
    isRecording: boolean;
}

export function AudioWaveform({ isRecording }: AudioWaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    useEffect(() => {
        if (!isRecording) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (sourceRef.current) sourceRef.current.disconnect();
            if (audioContextRef.current) audioContextRef.current.close();
            
            // Clear canvas
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        const startAudioAnalysis = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                analyserRef.current = audioContextRef.current.createAnalyser();
                sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                
                sourceRef.current.connect(analyserRef.current);
                analyserRef.current.fftSize = 256;

                const bufferLength = analyserRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');

                const draw = () => {
                    if (!isRecording) return;
                    animationRef.current = requestAnimationFrame(draw);

                    analyserRef.current?.getByteFrequencyData(dataArray);

                    if (canvas && ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        
                        const barWidth = (canvas.width / bufferLength) * 2.5;
                        let barHeight;
                        let x = 0;

                        for (let i = 0; i < bufferLength; i++) {
                            barHeight = (dataArray[i] / 255) * canvas.height;

                            // Premium Gradient
                            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
                            gradient.addColorStop(0, '#ef4444'); // destructive/red
                            gradient.addColorStop(1, '#f87171'); // light red

                            ctx.fillStyle = gradient;
                            ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth, barHeight);

                            x += barWidth + 2;
                        }
                    }
                };

                draw();
            } catch (err) {
                console.error('Error accessing microphone for waveform:', err);
            }
        };

        startAudioAnalysis();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (sourceRef.current) sourceRef.current.disconnect();
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, [isRecording]);

    return (
        <div className="w-full h-24 flex items-center justify-center">
            <canvas 
                ref={canvasRef} 
                width={300} 
                height={80} 
                className="w-full h-full opacity-80"
            />
        </div>
    );
}
