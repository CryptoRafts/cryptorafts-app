/**
 * Global Call Sound Manager
 * Prevents multiple ringing sounds from playing simultaneously
 */

class CallSoundManager {
  private activeCallId: string | null = null;
  private soundInterval: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;

  /**
   * Start playing ringing sound for a call
   * @param callId - Unique call identifier
   * @param callerName - Name of the caller (for logging)
   */
  startRinging(callId: string, callerName: string): void {
    // If already ringing for this call, don't start again
    if (this.activeCallId === callId && this.soundInterval) {
      console.log('🔔 [SOUND] Already ringing for this call, skipping');
      return;
    }

    // Stop any existing ringing from a different call
    if (this.activeCallId && this.activeCallId !== callId) {
      this.stopRinging();
    }

    // Set active call
    this.activeCallId = callId;
    console.log(`🔔🔊 [SOUND] Starting ringing for call: ${callId} (${callerName})`);

    // Play initial sound
    this.playRingingSound(callerName);

    // Ring every 2 seconds - only if interval doesn't exist
    if (!this.soundInterval) {
      this.soundInterval = setInterval(() => {
        if (this.activeCallId === callId) {
          this.playRingingSound(callerName);
        } else {
          // Call changed, stop this interval
          this.stopRinging();
        }
      }, 2000);
    }
  }

  /**
   * Stop ringing sound
   */
  stopRinging(): void {
    if (this.soundInterval) {
      clearInterval(this.soundInterval);
      this.soundInterval = null;
    }
    this.activeCallId = null;
    console.log('🔔 [SOUND] Stopped ringing');
  }

  /**
   * Play a single ringing sound
   */
  private playRingingSound(callerName: string): void {
    try {
      // Create audio context if needed
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Create classic phone ringing sound (two-tone)
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'sine';

        // Volume envelope for ringing effect
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = this.audioContext.currentTime;

      // Classic ringtone pattern: Ring-Ring (pause) Ring-Ring
      // First ring: 440Hz (A4)
      playTone(440, now, 0.4);
      // Second ring
      playTone(440, now + 0.5, 0.4);

      // Vibrate on mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]); // Vibrate pattern: 200ms, pause 100ms, 200ms
      }

      console.log(`🔔 [SOUND] Ringing sound played (with vibration on mobile) - ${callerName}`);
    } catch (error) {
      console.error('❌ [SOUND] Error playing ringing sound:', error);
    }
  }
}

// Export singleton instance
export const callSoundManager = new CallSoundManager();

