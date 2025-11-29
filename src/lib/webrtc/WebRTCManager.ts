// Complete WebRTC Manager for Voice and Video Calls
// Handles peer-to-peer connections, media streams, and signaling

import { ensureDb } from '../firebase-utils';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  deleteDoc,
  serverTimestamp,
  addDoc,
  getDoc
} from 'firebase/firestore';
import { CALL_CONFIG } from '@/config/chat.config';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface MediaConfig {
  audio: boolean;
  video: boolean | MediaTrackConstraints;
}

export interface CallParticipant {
  userId: string;
  userName: string;
  peerId: string;
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: string | null = null;
  private userId: string;
  private userName: string;
  private roomId: string;
  private unsubscribe: (() => void) | null = null;
  
  // Restart tracking to prevent infinite loops
  private restartCount: number = 0;
  private maxRestartAttempts: number = 3;
  private isRestarting: boolean = false;
  private lastRestartTime: number = 0;
  private restartCooldown: number = 5000; // 5 seconds between restarts
  
  // Callbacks
  private onLocalStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateCallback: ((state: RTCPeerConnectionState) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  // WebRTC Configuration with public STUN servers
  private config: WebRTCConfig = {
    iceServers: CALL_CONFIG.iceServers
  };

  constructor(userId: string, userName: string, roomId: string) {
    this.userId = userId;
    this.userName = userName;
    this.roomId = roomId;
  }

  // Set callbacks
  onLocalStream(callback: (stream: MediaStream) => void) {
    this.onLocalStreamCallback = callback;
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onConnectionState(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateCallback = callback;
  }

  onError(callback: (error: Error) => void) {
    this.onErrorCallback = callback;
  }

  // Initialize local media stream with quality support
  async getLocalStream(mediaConfig: MediaConfig, quality?: '4K' | '1080p' | '720p' | '480p' | 'auto'): Promise<MediaStream> {
    try {
      console.log('🎥 [WebRTC] Requesting media access:', mediaConfig, 'Quality:', quality || 'default');
      
      // Get quality preset if specified
      const qualityPreset = quality && CALL_CONFIG.qualityPresets[quality] 
        ? CALL_CONFIG.qualityPresets[quality]
        : CALL_CONFIG.videoResolution;
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: mediaConfig.audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // High-quality sample rate
          // CRITICAL: Additional audio quality improvements
          channelCount: { ideal: 2 }, // Stereo if available
          latency: { ideal: 0.01, max: 0.05 }, // Low latency
          googEchoCancellation: true, // Chrome-specific
          googNoiseSuppression: true,
          googAutoGainControl: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googNoiseReduction: true
        } : false,
        video: mediaConfig.video ? {
          width: { ideal: qualityPreset.width, max: qualityPreset.width },
          height: { ideal: qualityPreset.height, max: qualityPreset.height },
          frameRate: { ideal: qualityPreset.frameRate, max: qualityPreset.frameRate, min: 24 }, // Ensure minimum 24fps for smooth playback
          facingMode: 'user',
          // Additional quality constraints for smooth streaming
          aspectRatio: { ideal: 16/9 },
          resizeMode: 'none', // Prevent browser resizing
          // ENHANCED: Additional constraints for better quality
          advanced: [
            { width: qualityPreset.width },
            { height: qualityPreset.height },
            { frameRate: qualityPreset.frameRate }
          ]
        } : false
      });
      
      // CRITICAL: Apply bitrate constraints for video tracks AFTER peer connection is created
      // This will be done in createPeerConnection or after tracks are added
      // Store quality for later use
      this.currentQuality = quality;

      this.localStream = stream;
      console.log('✅ [WebRTC] Local stream obtained:', stream.getTracks().map(t => t.kind));
      
      // Test microphone audio levels
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log('🎤 [WebRTC] Microphone details:', {
          label: audioTracks[0].label,
          enabled: audioTracks[0].enabled,
          muted: audioTracks[0].muted,
          readyState: audioTracks[0].readyState
        });
        
        // Test if microphone is actually capturing audio
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        // Check audio levels for 3 seconds
        let checkCount = 0;
        const levelCheck = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          console.log(`🎤 [WebRTC] Microphone level: ${Math.round(average)}/255 ${average > 0 ? '✅ CAPTURING!' : '⚠️ Silent'}`);
          
          checkCount++;
          if (checkCount >= 3) {
            clearInterval(levelCheck);
            audioContext.close();
            if (average === 0) {
              console.warn('⚠️ [WebRTC] Microphone not picking up sound! Check:');
              console.warn('  1. Speak into microphone');
              console.warn('  2. Check Windows mic settings');
              console.warn('  3. Try different microphone');
            }
          }
        }, 1000);
      }
      
      if (this.onLocalStreamCallback) {
        this.onLocalStreamCallback(stream);
      }

      return stream;
    } catch (error: any) {
      console.error('❌ [WebRTC] Error getting local stream:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to access camera/microphone.';
      let errorDetails = '';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/microphone permission denied.';
        errorDetails = 'Please click the lock icon in your browser\'s address bar and allow camera/microphone access, then refresh the page.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'Camera/microphone not found.';
        errorDetails = 'Please make sure your camera/microphone is connected and not being used by another application.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is already in use.';
        errorDetails = 'Please close other applications using your camera/microphone and try again.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Camera/microphone settings not supported.';
        errorDetails = 'Your device may not support the requested settings. Please try again or use a different device.';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Media access not supported.';
        errorDetails = 'Your browser may not support camera/microphone access. Please try using Chrome, Firefox, or Safari.';
      } else {
        errorDetails = error.message || 'Please check your browser permissions and try again.';
      }
      
      const enhancedError = new Error(`${errorMessage} ${errorDetails}`);
      enhancedError.name = error.name || 'MediaAccessError';
      
      if (this.onErrorCallback) {
        this.onErrorCallback(enhancedError);
      }
      throw enhancedError;
    }
  }

  // Create peer connection
  private createPeerConnection(): RTCPeerConnection {
    console.log('🔗 [WebRTC] Creating peer connection');
    
    // CRITICAL: Configure codec preferences - prefer Opus for audio
    const pc = new RTCPeerConnection(this.config);
    
    // Set codec preferences after tracks are added
    // This ensures Opus is preferred over other codecs for better audio quality
    // Note: This is done after tracks are added in the track addition logic below

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        if (this.localStream) {
          const sender = pc.addTrack(track, this.localStream);
          console.log('➕ [WebRTC] Added track:', track.kind);
          
          // CRITICAL: Apply bitrate for video tracks if quality is set
          if (track.kind === 'video' && this.currentQuality && CALL_CONFIG.qualityPresets[this.currentQuality]?.bitrate) {
            const bitrate = CALL_CONFIG.qualityPresets[this.currentQuality].bitrate;
            // Apply bitrate after a short delay to ensure sender is ready
            setTimeout(() => {
              try {
                const params = sender.getParameters();
                if (params.encodings && params.encodings.length > 0) {
                  params.encodings[0].maxBitrate = bitrate;
                  sender.setParameters(params).then(() => {
                    console.log(`✅ [WebRTC] Video bitrate set to ${bitrate / 1000000} Mbps for ${this.currentQuality} quality`);
                  }).catch(err => {
                    console.warn('⚠️ [WebRTC] Could not set video bitrate:', err);
                  });
                }
              } catch (err) {
                console.warn('⚠️ [WebRTC] Error setting video bitrate:', err);
              }
            }, 100);
          }
          
          // CRITICAL: Apply audio bitrate for better quality (Opus supports up to 510 kbps)
          if (track.kind === 'audio') {
            setTimeout(() => {
              try {
                const params = sender.getParameters();
                if (params.encodings && params.encodings.length > 0) {
                  // Set high-quality audio bitrate (128 kbps for Opus is excellent quality)
                  params.encodings[0].maxBitrate = 128000; // 128 kbps
                  sender.setParameters(params).then(() => {
                    console.log('✅ [WebRTC] Audio bitrate set to 128 kbps (high quality)');
                  }).catch(err => {
                    console.warn('⚠️ [WebRTC] Could not set audio bitrate:', err);
                  });
                }
              } catch (err) {
                console.warn('⚠️ [WebRTC] Error setting audio bitrate:', err);
              }
            }, 100);
          }
        }
      });
      
      // CRITICAL: Set codec preferences to prefer Opus for audio (if supported)
      // ENHANCED: Completely disabled to prevent "Cannot read properties of undefined (reading 'find')" error
      // Codec preferences are optional and can cause errors in some browsers
      // Audio will work fine without codec preferences - browsers will auto-select best codec
      // We skip this entirely to ensure stability and prevent console errors
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.callId) {
        console.log('🧊 [WebRTC] New ICE candidate:', event.candidate.type);
        this.sendICECandidate(event.candidate);
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('📥 [WebRTC] Received remote track:', event.track.kind, {
        id: event.track.id,
        enabled: event.track.enabled,
        readyState: event.track.readyState,
        muted: event.track.muted
      });
      
      // CRITICAL: Ensure track is enabled and properly attached
      if (!event.track.enabled) {
        console.log('🔧 [WebRTC] Enabling remote track:', event.track.kind);
        event.track.enabled = true;
      }
      
      // CRITICAL FIX: Create or get remote stream BEFORE adding tracks
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        console.log('📹 [WebRTC] Created new remote stream');
      }
      
      // Check if track already exists (avoid duplicates)
      // CRITICAL: Safe find with null check to prevent "Cannot read properties of undefined (reading 'find')" error
      let existingTrack: MediaStreamTrack | undefined = undefined;
      if (this.remoteStream && this.remoteStream.getTracks && Array.isArray(this.remoteStream.getTracks())) {
        const tracks = this.remoteStream.getTracks();
        for (let i = 0; i < tracks.length; i++) {
          if (tracks[i] && tracks[i].id === event.track.id) {
            existingTrack = tracks[i];
            break;
          }
        }
      }
      if (existingTrack) {
        console.log('⚠️ [WebRTC] Track already exists, skipping:', event.track.id);
        // Still notify callback to ensure UI updates
        if (this.onRemoteStreamCallback && this.remoteStream) {
          this.onRemoteStreamCallback(this.remoteStream);
        }
        return;
      }
      
      // Add track to stream
      this.remoteStream.addTrack(event.track);
      console.log('✅ [WebRTC] Added track to remote stream. Total tracks:', this.remoteStream.getTracks().length);
      console.log('📊 [WebRTC] Remote stream now has:', {
        audio: this.remoteStream.getAudioTracks().length,
        video: this.remoteStream.getVideoTracks().length,
        total: this.remoteStream.getTracks().length,
        trackId: event.track.id,
        trackKind: event.track.kind,
        trackEnabled: event.track.enabled,
        trackReadyState: event.track.readyState
      });
      
      // Handle muted state - tracks can be muted initially but should be unmuted
      if (event.track.muted) {
        console.log('🔧 [WebRTC] Track is muted (no data yet), waiting for media data...');
        // Listen for unmute event - this fires when media data starts flowing
        event.track.onunmute = () => {
          console.log('✅ [WebRTC] Track unmuted (media data flowing):', event.track.kind);
          // Notify callback again when track is unmuted so video element can update
          if (this.onRemoteStreamCallback && this.remoteStream) {
            this.onRemoteStreamCallback(this.remoteStream);
          }
        };
        
        // Also wait a bit for track to unmute
        if (event.track.readyState === 'live') {
          setTimeout(() => {
            if (!event.track.muted && this.onRemoteStreamCallback && this.remoteStream) {
              console.log('✅ [WebRTC] Track unmuted after delay:', event.track.kind);
              this.onRemoteStreamCallback(this.remoteStream);
            }
          }, 500);
        }
      } else {
        console.log('✅ [WebRTC] Track is already unmuted (media data flowing):', event.track.kind);
      }
      
      // CRITICAL: Always notify callback when tracks are added (so video element can update)
      // This must happen AFTER track is added to stream
      // FIXED: Notify immediately AND after delay to ensure UI updates for both directions
      if (this.onRemoteStreamCallback && this.remoteStream) {
        console.log('📤 [WebRTC] Notifying callback with stream containing', this.remoteStream.getTracks().length, 'tracks');
        
        // Notify immediately (for fast connections)
        this.onRemoteStreamCallback(this.remoteStream);
        
        // Also notify after a short delay to ensure track is fully attached
        // This is critical for Founder→other role calls
        setTimeout(() => {
          if (this.onRemoteStreamCallback && this.remoteStream) {
            console.log('📤 [WebRTC] Re-notifying callback after delay to ensure UI update');
            this.onRemoteStreamCallback(this.remoteStream);
          }
        }, 100);
        
        // Additional notification after longer delay for slow connections
        setTimeout(() => {
          if (this.onRemoteStreamCallback && this.remoteStream && this.remoteStream.getTracks().length > 0) {
            console.log('📤 [WebRTC] Final callback notification to ensure stream is displayed');
            this.onRemoteStreamCallback(this.remoteStream);
          }
        }, 500);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('🔄 [WebRTC] Connection state:', pc.connectionState);
      
      if (this.onConnectionStateCallback) {
        this.onConnectionStateCallback(pc.connectionState);
      }

      // Only restart on 'failed' state, and only if we haven't exceeded max attempts
      if (pc.connectionState === 'failed') {
        // Check if we should attempt restart
        const now = Date.now();
        const timeSinceLastRestart = now - this.lastRestartTime;
        
        if (this.restartCount < this.maxRestartAttempts && !this.isRestarting && timeSinceLastRestart >= this.restartCooldown) {
          console.error(`❌ [WebRTC] Connection failed, attempting restart (${this.restartCount + 1}/${this.maxRestartAttempts})`);
          this.restartConnection();
        } else if (this.restartCount >= this.maxRestartAttempts) {
          console.error('❌ [WebRTC] Connection failed - max restart attempts reached. Connection may be blocked by firewall/NAT.');
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error('Connection failed after multiple restart attempts. This may be due to network restrictions (firewall/NAT).'));
          }
        } else if (this.isRestarting) {
          console.log('⏳ [WebRTC] Restart already in progress, skipping...');
        } else {
          console.log(`⏳ [WebRTC] Waiting for restart cooldown (${Math.ceil((this.restartCooldown - timeSinceLastRestart) / 1000)}s remaining)...`);
        }
      } else if (pc.connectionState === 'connected') {
        // Reset restart count on successful connection
        this.restartCount = 0;
        this.isRestarting = false;
        console.log('✅ [WebRTC] Connection established successfully');
      } else if (pc.connectionState === 'disconnected') {
        // Wait a bit before considering it failed - sometimes it reconnects
        console.log('⚠️ [WebRTC] Connection disconnected, waiting to see if it reconnects...');
        setTimeout(() => {
          if (this.peerConnection && this.peerConnection.connectionState === 'disconnected') {
            console.log('⚠️ [WebRTC] Still disconnected after wait, may transition to failed');
          }
        }, 3000);
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('🧊 [WebRTC] ICE connection state:', pc.iceConnectionState);
    };

    this.peerConnection = pc;
    return pc;
  }

  // Start a call (caller side)
  async startCall(callId: string, mediaConfig: MediaConfig, quality?: '4K' | '1080p' | '720p' | '480p' | 'auto'): Promise<void> {
    try {
      this.callId = callId;
      console.log('📞 [WebRTC] Starting call:', callId, 'Quality:', quality || '4K (default)');

      // Get local stream with 4K quality by default
      await this.getLocalStream(mediaConfig, quality || '4K');

      // Create peer connection
      const pc = this.createPeerConnection();

      // CRITICAL FIX: Set up answer listener BEFORE creating offer
      // This ensures we don't miss the answer if it arrives quickly
      this.listenForAnswer(callId);

      // Listen for ICE candidates
      this.listenForICECandidates(callId, 'caller');

      // Create and set local description (offer)
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: mediaConfig.video !== false
      });

      await pc.setLocalDescription(offer);
      console.log('📤 [WebRTC] Created offer');

      // Save offer to Firebase
      await this.saveOffer(callId, offer);
    } catch (error) {
      console.error('❌ [WebRTC] Error starting call:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error);
      }
      throw error;
    }
  }

  // Join a call (receiver side)
  async joinCall(callId: string, mediaConfig: MediaConfig, quality?: '4K' | '1080p' | '720p' | '480p' | 'auto'): Promise<void> {
    try {
      this.callId = callId;
      console.log('📞 [WebRTC] Joining call:', callId, 'Quality:', quality || '4K (default)');
      console.log('📞 [WebRTC] Waiting for offer from caller...');

      // Get local stream first with 4K quality by default
      await this.getLocalStream(mediaConfig, quality || '4K');
      console.log('✅ [WebRTC] Local stream ready, waiting for offer...');

      // Create peer connection
      const pc = this.createPeerConnection();

      // Get offer from Firebase with retry logic
      const offer = await this.getOffer(callId);
      
      if (!offer) {
        const errorMsg = 'Caller did not create offer. Please ask caller to try again.';
        console.error('❌ [WebRTC]', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ [WebRTC] Offer received from caller');

      // Set remote description (offer)
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('📥 [WebRTC] Set remote offer');

      // Create and set local description (answer)
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('📤 [WebRTC] Created answer');

      // Save answer to Firebase
      await this.saveAnswer(callId, answer);
      console.log('✅ [WebRTC] Answer sent to caller, waiting for connection...');

      // Listen for ICE candidates
      this.listenForICECandidates(callId, 'receiver');
    } catch (error) {
      console.error('❌ [WebRTC] Error joining call:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error);
      }
      throw error;
    }
  }

  // Save offer to Firebase
  private async saveOffer(callId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const dbInstance = ensureDb();
    if (!dbInstance) throw new Error('Database not initialized');
    
    // FIXED: Save to 'calls' collection (same as simpleFirebaseCallManager) instead of 'webrtc_calls'
    const callRef = doc(dbInstance, 'calls', callId);
    
    // FIXED: Use setDoc with merge to ensure document exists and offer is saved
    try {
      await setDoc(callRef, {
        offer: {
          type: offer.type,
          sdp: offer.sdp
        },
        status: 'ringing',
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('💾 [WebRTC] Offer saved to Firebase:', callId);
      
      // Verify it was saved - wait a bit for Firestore to propagate
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const verifySnap = await getDoc(callRef);
      if (verifySnap.exists() && verifySnap.data()?.offer?.sdp) {
        console.log('✅ [WebRTC] Offer verified in Firebase');
      } else {
        console.warn('⚠️ [WebRTC] Offer verification failed, retrying...');
        // Retry with explicit overwrite
        await setDoc(callRef, {
          offer: {
            type: offer.type,
            sdp: offer.sdp
          },
          status: 'ringing',
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        // Verify again
        await new Promise(resolve => setTimeout(resolve, 300));
        const verifySnap2 = await getDoc(callRef);
        if (verifySnap2.exists() && verifySnap2.data()?.offer?.sdp) {
          console.log('✅ [WebRTC] Offer verified after retry');
        } else {
          console.error('❌ [WebRTC] Offer still not found after retry - this may cause connection issues');
        }
      }
    } catch (error) {
      console.error('❌ [WebRTC] Error saving offer:', error);
      throw error;
    }
  }

  // Save answer to Firebase
  private async saveAnswer(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const dbInstance = ensureDb();
    if (!dbInstance) throw new Error('Database not initialized');
    
    // FIXED: Save to 'calls' collection (same as simpleFirebaseCallManager) instead of 'webrtc_calls'
    const callRef = doc(dbInstance, 'calls', callId);
    
    await setDoc(callRef, {
      answer: {
        type: answer.type,
        sdp: answer.sdp
      },
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('💾 [WebRTC] Answer saved to Firebase');
  }

  // Get offer from Firebase with retry logic
  private async getOffer(callId: string): Promise<RTCSessionDescriptionInit | null> {
    const dbInstance = ensureDb();
    if (!dbInstance) throw new Error('Database not initialized');
    
    // FIXED: Read from 'calls' collection (same as simpleFirebaseCallManager) instead of 'webrtc_calls'
    const callRef = doc(dbInstance, 'calls', callId);
    
    // FIXED: Try up to 25 times with 500ms delay (12.5 seconds total) - increased for reliability
    for (let i = 0; i < 25; i++) {
      try {
        const callSnap = await getDoc(callRef);
        
        if (callSnap.exists()) {
          const data = callSnap.data();
          if (data?.offer && data.offer.type && data.offer.sdp) {
            console.log(`✅ [WebRTC] Offer found (attempt ${i + 1})`);
            return {
              type: data.offer.type,
              sdp: data.offer.sdp
            } as RTCSessionDescriptionInit;
          }
        }
        
        if (i < 24) { // Don't log on last attempt
          console.log(`⏳ [WebRTC] Waiting for offer (attempt ${i + 1}/25)...`);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ [WebRTC] Error getting offer (attempt ${i + 1}):`, error);
        if (i < 24) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    console.error('❌ [WebRTC] No offer found after 25 attempts');
    return null;
  }

  // Listen for answer
  private listenForAnswer(callId: string): void {
    const dbInstance = ensureDb();
    if (!dbInstance) {
      console.error('❌ [WebRTC] Database not initialized');
      return;
    }
    
    // FIXED: Listen to 'calls' collection (same as simpleFirebaseCallManager) instead of 'webrtc_calls'
    const callRef = doc(dbInstance, 'calls', callId);
    
    console.log('👂 [WebRTC] Setting up answer listener for call:', callId);
    
    const unsubscribe = onSnapshot(callRef, async (snapshot) => {
      const data = snapshot.data();
      
      if (data?.answer && this.peerConnection) {
        console.log('📥 [WebRTC] Received answer from receiver');
        console.log('📥 [WebRTC] Answer details:', {
          type: data.answer.type,
          hasSDP: !!data.answer.sdp,
          sdpLength: data.answer.sdp?.length || 0
        });
        
        try {
          const answer = new RTCSessionDescription(data.answer);
          
          // CRITICAL: Check if remote description is already set
          if (this.peerConnection.remoteDescription) {
            console.log('⚠️ [WebRTC] Remote description already set, updating with new answer');
          }
          
          await this.peerConnection.setRemoteDescription(answer);
          console.log('✅ [WebRTC] Set remote answer - connection should establish now');
          
          // CRITICAL FIX: More aggressive callback triggering for Founder→Other calls
          // The ontrack event should fire, but we also trigger callback proactively
          const triggerCallbacks = () => {
            if (this.remoteStream && this.onRemoteStreamCallback) {
              const trackCount = this.remoteStream.getTracks().length;
              console.log('📤 [WebRTC] Triggering remote stream callback', {
                trackCount,
                audioTracks: this.remoteStream.getAudioTracks().length,
                videoTracks: this.remoteStream.getVideoTracks().length
              });
              this.onRemoteStreamCallback(this.remoteStream);
            }
          };
          
          // Wait for ontrack to fire, then trigger multiple times
          setTimeout(() => {
            triggerCallbacks();
            // Multiple triggers to ensure UI updates (especially for Founder→Other)
            setTimeout(triggerCallbacks, 100);
            setTimeout(triggerCallbacks, 300);
            setTimeout(triggerCallbacks, 500);
            setTimeout(triggerCallbacks, 1000);
            setTimeout(triggerCallbacks, 2000);
          }, 100);
          
          // Also trigger when connection state changes to connected
          if (this.peerConnection) {
            const originalOnConnectionStateChange = this.peerConnection.onconnectionstatechange;
            this.peerConnection.onconnectionstatechange = () => {
              if (originalOnConnectionStateChange) {
                originalOnConnectionStateChange();
              }
              if (this.peerConnection?.connectionState === 'connected') {
                console.log('📤 [WebRTC] Connection connected - triggering callback again');
                setTimeout(triggerCallbacks, 100);
                setTimeout(triggerCallbacks, 500);
              }
            };
          }
          
          // Unsubscribe after receiving answer
          unsubscribe();
        } catch (error) {
          console.error('❌ [WebRTC] Error setting remote answer:', error);
          // Don't unsubscribe on error - keep listening for retry
        }
      } else if (data && !data.answer) {
        console.log('⏳ [WebRTC] Waiting for answer...', {
          hasOffer: !!data.offer,
          status: data.status,
          callerId: data.callerId
        });
      }
    }, (error) => {
      console.error('❌ [WebRTC] Error in answer listener:', error);
    });
  }

  // Send ICE candidate
  private async sendICECandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.callId) return;

    const dbInstance = ensureDb();
    if (!dbInstance) throw new Error('Database not initialized');
    
    // FIXED: Use 'calls' collection subcollection (same as simpleFirebaseCallManager) instead of 'webrtc_calls'
    const candidatesRef = collection(dbInstance, 'calls', this.callId, 'ice_candidates');
    await addDoc(candidatesRef, {
      candidate: candidate.toJSON(),
      userId: this.userId,
      createdAt: serverTimestamp()
    });
  }

  // Listen for ICE candidates
  private listenForICECandidates(callId: string, role: 'caller' | 'receiver'): void {
    const dbInstance = ensureDb();
    if (!dbInstance) {
      console.error('❌ [WebRTC] Database not initialized');
      return;
    }
    
    // FIXED: Use 'calls' collection subcollection (same as simpleFirebaseCallManager) instead of 'webrtc_calls'
    const candidatesRef = collection(dbInstance, 'calls', callId, 'ice_candidates');
    
    this.unsubscribe = onSnapshot(candidatesRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          
          // Only process candidates from the other user
          if (data.userId !== this.userId && this.peerConnection) {
            console.log('🧊 [WebRTC] Received ICE candidate from peer');
            
            try {
              await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (error) {
              console.error('❌ [WebRTC] Error adding ICE candidate:', error);
            }
          }
        }
      });
    });
  }

  // Restart connection on failure
  private async restartConnection(): Promise<void> {
    if (this.isRestarting) {
      console.log('⏳ [WebRTC] Restart already in progress, skipping duplicate restart');
      return;
    }
    
    if (this.restartCount >= this.maxRestartAttempts) {
      console.error('❌ [WebRTC] Max restart attempts reached, not restarting');
      return;
    }
    
    this.isRestarting = true;
    this.restartCount++;
    this.lastRestartTime = Date.now();
    
    console.log(`🔄 [WebRTC] Restarting connection (attempt ${this.restartCount}/${this.maxRestartAttempts})`);
    
    if (this.peerConnection && this.callId) {
      try {
        // Wait a bit before restarting to avoid immediate failures
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const offer = await this.peerConnection.createOffer({ iceRestart: true });
        await this.peerConnection.setLocalDescription(offer);
        await this.saveOffer(this.callId, offer);
        
        console.log('✅ [WebRTC] Restart offer created and saved');
        
        // Reset restarting flag after a delay to allow connection to establish
        setTimeout(() => {
          this.isRestarting = false;
        }, 5000);
      } catch (error) {
        console.error('❌ [WebRTC] Error restarting connection:', error);
        this.isRestarting = false;
        
        if (this.onErrorCallback) {
          this.onErrorCallback(error as Error);
        }
      }
    } else {
      this.isRestarting = false;
      console.error('❌ [WebRTC] Cannot restart - peer connection or call ID missing');
    }
  }

  // Toggle audio - CRITICAL: Also updates RTCRtpSender
  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      
      // Toggle track enabled state
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      
      // CRITICAL: Ensure RTCRtpSender reflects the track state
      // When track.enabled = false, the sender stops transmitting
      // When track.enabled = true, the sender resumes transmitting
      if (this.peerConnection) {
        const senders = this.peerConnection.getSenders();
        senders.forEach(sender => {
          if (sender.track && sender.track.kind === 'audio') {
            // The track.enabled state change above automatically affects the sender
            // But we log it for debugging
            console.log(`🎤 [WebRTC] Sender track state:`, {
              trackId: sender.track.id,
              enabled: sender.track.enabled,
              readyState: sender.track.readyState
            });
          }
        });
      }
      
      const isEnabled = audioTracks[0]?.enabled || false;
      console.log(`🎤 [WebRTC] Audio ${isEnabled ? 'enabled' : 'disabled'}`, {
        trackId: audioTracks[0]?.id,
        readyState: audioTracks[0]?.readyState
      });
      return isEnabled;
    }
    return false;
  }

  // Toggle video
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      const isEnabled = videoTracks[0]?.enabled || false;
      console.log(`🎥 [WebRTC] Video ${isEnabled ? 'enabled' : 'disabled'}`);
      return isEnabled;
    }
    return false;
  }

  // End call and cleanup
  async endCall(deleteFirebaseData: boolean = false): Promise<void> {
    console.log('🔚 [WebRTC] Ending call and RELEASING all media devices...');

    // Stop local stream (TURN OFF MIC/CAMERA) - CRITICAL!
    if (this.localStream) {
      console.log('🎥 [WebRTC] Stopping local stream tracks...');
      const tracks = this.localStream.getTracks();
      
      tracks.forEach(track => {
        const trackInfo = `${track.kind} - ${track.label}`;
        const wasActive = track.readyState === 'live';
        
        track.stop();
        
        console.log(`⏹️ [WebRTC] STOPPED ${trackInfo}`);
        console.log(`   Was active: ${wasActive}`);
        console.log(`   New state: ${track.readyState} (should be "ended")`);
      });
      
      this.localStream = null;
      console.log(`✅ [WebRTC] ${tracks.length} local device(s) STOPPED and RELEASED`);
      console.log('✅ [WebRTC] ✓ Microphone OFF and released');
      console.log('✅ [WebRTC] ✓ Camera OFF and released');
    } else {
      console.log('✓ [WebRTC] No local stream to clean up');
    }

    // Stop remote stream
    if (this.remoteStream) {
      console.log('🎥 [WebRTC] Stopping remote stream tracks...');
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
        console.log(`⏹️ [WebRTC] STOPPED remote ${track.kind}`);
      });
      this.remoteStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      console.log('🔌 [WebRTC] Closing peer connection...');
      this.peerConnection.close();
      this.peerConnection = null;
      console.log('✅ [WebRTC] Peer connection closed');
    }

    // Unsubscribe from Firebase listeners
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Only clean up Firebase data if explicitly requested (not on unmount)
    if (deleteFirebaseData && this.callId) {
      try {
        const dbInstance = ensureDb();
        if (dbInstance) {
          const callRef = doc(dbInstance, 'webrtc_calls', this.callId);
          await deleteDoc(callRef);
        }
        console.log('🗑️ [WebRTC] Cleaned up Firebase signaling data');
      } catch (error) {
        console.error('Error cleaning up Firebase:', error);
      }
    }

    this.callId = null;
    
    console.log('✅ [WebRTC] ═══════════════════════════════════════');
    console.log('✅ [WebRTC] ALL CLEANUP COMPLETE');
    console.log('✅ [WebRTC] Camera: OFF ✓');
    console.log('✅ [WebRTC] Microphone: OFF ✓');
    console.log('✅ [WebRTC] Connections: CLOSED ✓');
    console.log('✅ [WebRTC] Resources: RELEASED ✓');
    console.log('✅ [WebRTC] ═══════════════════════════════════════');
  }

  // Get current state
  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null;
  }

  getCurrentLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Check if audio is enabled
  isAudioEnabled(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      return audioTrack?.enabled || false;
    }
    return false;
  }

  // Check if video is enabled
  isVideoEnabled(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      return videoTrack?.enabled || false;
    }
    return false;
  }

  // Get peer connection (for bitrate control)
  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }
}

export default WebRTCManager;

