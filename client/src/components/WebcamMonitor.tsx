'use client';

import { useEffect, useRef, useState } from 'react';

interface WebcamMonitorProps {
    onError?: (error: string) => void;
}

export default function WebcamMonitor({ onError }: WebcamMonitorProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        startCamera();

        return () => {
            // Cleanup: stop all tracks when component unmounts
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                    facingMode: 'user'
                },
                audio: false // We don't need audio for monitoring
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStream(mediaStream);
            setError(null);
        } catch (err: any) {
            console.error('Camera access error:', err);
            let errorMessage = 'Kamera erişimi reddedildi.';

            if (err.name === 'NotAllowedError') {
                errorMessage = 'Kamera izni verilmedi. Sınava devam etmek için kameranızı açmalısınız.';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'Kamera bulunamadı. Lütfen bir webcam bağlayın.';
            } else if (err.name === 'NotReadableError') {
                errorMessage = 'Kamera başka bir uygulama tarafından kullanılıyor.';
            }

            setError(errorMessage);
            onError?.(errorMessage);
        }
    };

    if (error) {
        return (
            <div className="fixed bottom-4 right-4 z-50 w-64 p-4 bg-red-600 text-white rounded-lg shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">⚠️</span>
                    <span className="font-bold">Kamera Hatası</span>
                </div>
                <p className="text-sm mb-3">{error}</p>
                <button
                    onClick={startCamera}
                    className="w-full bg-white text-red-600 px-3 py-2 rounded font-semibold hover:bg-red-100 transition-colors"
                >
                    Tekrar Dene
                </button>
            </div>
        );
    }

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-red-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-red-700 transition-colors"
                title="Kamerayı Göster"
            >
                📹
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Container with border */}
            <div className="relative bg-black rounded-lg shadow-2xl overflow-hidden border-4 border-red-600">
                {/* Recording indicator */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>KAYIT</span>
                </div>

                {/* Minimize button */}
                <button
                    onClick={() => setIsMinimized(true)}
                    className="absolute top-2 right-2 z-10 w-6 h-6 bg-black/70 text-white rounded flex items-center justify-center hover:bg-black transition-colors text-xs"
                    title="Küçült"
                >
                    −
                </button>

                {/* Video feed */}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-52 h-40 object-cover"
                    style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />
            </div>

            {/* Label */}
            <div className="text-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                Sınav Gözetimi
            </div>
        </div>
    );
}
