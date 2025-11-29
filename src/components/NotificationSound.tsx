"use client";

import { useEffect, useRef } from 'react';

interface NotificationSoundProps {
  trigger: boolean;
  type?: 'message' | 'deal' | 'project' | 'system' | 'admin' | 'milestone';
}

export default function NotificationSound({ trigger, type = 'message' }: NotificationSoundProps) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (trigger) {
      playNotificationSound(type);
    }
  }, [trigger, type]);

  const playNotificationSound = (notificationType: string) => {
    // Check if sound is enabled
    const isSoundEnabled = typeof window !== 'undefined' 
      ? localStorage.getItem('notificationSoundEnabled') !== 'false'
      : true;
    
    if (!isSoundEnabled) {
      console.log('🔇 Notification sound muted');
      return;
    }

    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      
      // Improved sound configurations for better quality
      const soundConfigs = {
        message: { 
          frequencies: [800, 1000], 
          duration: 0.4, 
          type: 'sine' as OscillatorType,
          volume: 0.15
        },
        deal: { 
          frequencies: [600, 800], 
          duration: 0.5, 
          type: 'triangle' as OscillatorType,
          volume: 0.12
        },
        project: { 
          frequencies: [400, 600], 
          duration: 0.6, 
          type: 'sine' as OscillatorType,
          volume: 0.1
        },
        system: { 
          frequencies: [1000, 1200], 
          duration: 0.3, 
          type: 'sine' as OscillatorType,
          volume: 0.18
        },
        admin: { 
          frequencies: [800, 1000, 1200], 
          duration: 0.35, 
          type: 'sine' as OscillatorType,
          volume: 0.2
        },
        milestone: { 
          frequencies: [500, 700], 
          duration: 0.7, 
          type: 'triangle' as OscillatorType,
          volume: 0.14
        }
      };

      const config = soundConfigs[notificationType as keyof typeof soundConfigs] || soundConfigs.message;
      const currentTime = audioContext.currentTime;
      
      // Create a more pleasant chord-like sound
      config.frequencies.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Stagger the start times slightly for a chord effect
        const startTime = currentTime + (index * 0.02);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = config.type;
        
        // Smoother volume envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(config.volume, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + config.duration);
      });

      console.log(`🔔 Played notification sound for ${notificationType}`);
    } catch (error) {
      console.log('🔔 Could not play notification sound:', error);
      // Fallback to browser notification
      showBrowserNotification(notificationType);
    }
  };

  const showBrowserNotification = (notificationType: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const titles = {
        message: 'New Message',
        deal: 'Deal Update',
        project: 'Project Update',
        system: 'System Notification',
        admin: 'Admin Notification',
        milestone: 'Milestone Update'
      };

      new Notification(titles[notificationType as keyof typeof titles] || 'Notification', {
        icon: '/cryptorafts.logo.png',
        badge: '/cryptorafts.logo.png',
        tag: notificationType,
        requireInteraction: false
      });
    }
  };

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
