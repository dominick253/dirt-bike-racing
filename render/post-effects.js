/**
 * Post Effects — Bloom, vignette, and motion blur using Three.js EffectComposer-style rendering
 * Pure shader-based approach — no external effect libraries needed
 */

class PostEffects {
  static renderer = null;
  static scene = null;
  static camera = null;
  static enabled = true;

  // Full-screen quad for post-processing
  static fsQuad = null;
  static fsMaterial = null;
  static fsScene = null;
  static fsCamera = null;
  
  // Render targets for ping-pong buffers
  static rt1 = null;
  static rt2 = null;
  
  // Shader materials
  static bloomShader = null;
  static vignetteShader = null;
  static motionBlurShader = null;

  // Effect settings
  static bloomStrength = 0.5;
  static bloomRadius = 0.4;
  static bloomThreshold = 0.6;
  static vignetteIntensity = 0.3;
  static vignetteCenter = [0.5, 0.5];
  static motionBlurAmount = 0.15;
  static previousFrameTexture = null;

  init(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    
    // Initialize post-processing pipeline
    this._initFullscreenQuad();
    this._initRenderTargets();
    this._initShaders();
    
    console.log('✨ Post effects initialized — bloom, vignette, motion blur');
  }

  _initFullscreenQuad() {
    // Full-screen quad geometry for post-processing
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    this.fsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tPrevious: { value: null },
        bloomStrength: { value: this.bloomStrength },
        bloomRadius: { value: this.bloomRadius },
        bloomThreshold: { value: this.bloomThreshold },
        vignetteIntensity: { value: this.vignetteIntensity },
        vignetteCenter: { value: new THREE.Vector2(this.vignetteCenter[0], this.vignetteCenter[1]) },
        motionBlurAmount: { value: this.motionBlurAmount },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tPrevious;
        uniform float bloomStrength;
        uniform float bloomRadius;
        uniform float bloomThreshold;
        uniform float vignetteIntensity;
        uniform vec2 vignetteCenter;
        uniform float motionBlurAmount;
        uniform vec2 resolution;
        varying vec2 vUv;

        // Gaussian blur kernel
        vec3 gaussianBlur(sampler2D tex, vec2 uv, float radius) {
          vec3 result = vec3(0.0);
          float totalWeight = 0.0;
          
          // 5x5 kernel with configurable radius
          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * radius / resolution;
              float weight = exp(-(x*x + y*y) / 2.0);
              result += texture2D(tex, uv + offset).rgb * weight;
              totalWeight += weight;
            }
          }
          
          return result / totalWeight;
        }

        // Bright extraction for bloom
        vec3 extractBright(vec3 color) {
          float brightness = dot(color, vec3(0.299, 0.587, 0.114));
          return smoothstep(bloomThreshold - 0.1, bloomThreshold + 0.1, brightness) * color;
        }

        void main() {
          vec4 sceneColor = texture2D(tDiffuse, vUv);
          
          // --- BLOOM PASS ---
          // Extract bright areas and blur them
          vec3 brightColor = extractBright(sceneColor.rgb);
          vec3 blurredBright = gaussianBlur(tDiffuse, vUv, bloomRadius);
          blurredBright = extractBright(blurredBright);
          
          // Add bloom to original image
          vec3 finalColor = sceneColor.rgb + (blurredBright * bloomStrength);
          
          // --- VIGNETTE PASS ---
          float dist = distance(vUv, vignetteCenter);
          float vignette = 1.0 - smoothstep(0.3, 1.0, dist) * vignetteIntensity;
          finalColor *= vignette;
          
          // --- MOTION BLUR PASS ---
          if (motionBlurAmount > 0.0) {
            vec4 previousFrame = texture2D(tPrevious, vUv);
            finalColor = mix(finalColor, previousFrame.rgb, motionBlurAmount * 0.5);
          }
          
          // Tone mapping for HDR → LDR conversion
          finalColor = finalColor / (finalColor + vec3(1.0));
          
          // Gamma correction
          finalColor = pow(finalColor, vec3(1.0/2.2));
          
          gl_FragColor = vec4(finalColor, sceneColor.a);
        }
      `,
      depthTest: false,
      depthWrite: false
    });

    this.fsScene = new THREE.Scene();
    this.fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    const mesh = new THREE.Mesh(geometry, this.fsMaterial);
    this.fsQuad = new THREE.SceneObject({ scene: this.fsScene });
    this.fsScene.add(mesh);
  }

  _initRenderTargets() {
    // Create render targets for ping-pong buffers
    const width = Math.floor(window.innerWidth / 2); // Half resolution for performance
    const height = Math.floor(window.innerHeight / 2);
    
    this.rt1 = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType
    });
    
    this.rt2 = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType
    });
  }

  _initShaders() {
    // Separate bloom shader for multi-pass approach (more performant)
    this.bloomShader = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2) },
        bloomStrength: { value: this.bloomStrength },
        bloomRadius: { value: this.bloomRadius },
        bloomThreshold: { value: this.bloomThreshold }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float bloomStrength;
        uniform float bloomRadius;
        uniform float bloomThreshold;
        varying vec2 vUv;

        vec3 extractBright(vec3 color) {
          float brightness = dot(color, vec3(0.299, 0.587, 0.114));
          return smoothstep(bloomThreshold - 0.1, bloomThreshold + 0.1, brightness) * color;
        }

        void main() {
          vec3 bright = extractBright(texture2D(tDiffuse, vUv).rgb);
          
          // Multi-tap blur for bloom
          vec3 result = bright;
          float offsets[8];
          offsets[0] = 1.0; offsets[1] = -1.0;
          offsets[2] = 2.0; offsets[3] = -2.0;
          offsets[4] = 3.0; offsets[5] = -3.0;
          offsets[6] = 4.0; offsets[7] = -4.0;
          
          for (int i = 0; i < 8; i += 2) {
            result += extractBright(texture2D(tDiffuse, vUv + vec2(offsets[i], 0.0) / resolution).rgb) * 0.5;
            result += extractBright(texture2D(tDiffuse, vUv + vec2(0.0, offsets[i+1]) / resolution).rgb) * 0.5;
          }
          
          gl_FragColor = vec4(result * bloomStrength, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false
    });
  }

  /**
   * Update post-effects every frame
   */
  update(dt) {
    if (!this.enabled) return;
    
    // Render scene to first render target
    this.renderer.setRenderTarget(this.rt1);
    this.renderer.render(this.scene, this.camera);
    
    // Apply motion blur by blending with previous frame
    if (this.previousFrameTexture) {
      this.fsMaterial.uniforms.tPrevious.value = this.previousFrameTexture;
    }
    
    // Render post-processing effect to second render target
    this.fsMaterial.uniforms.tDiffuse.value = this.rt1.texture;
    this.renderer.setRenderTarget(this.rt2);
    this.renderer.render(this.fsScene, this.fsCamera);
    
    // Copy result back to screen (render target 2 to screen)
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.fsScene, this.fsCamera);
    
    // Update previous frame texture for motion blur
    this.previousFrameTexture = this.rt1.texture;
    
    // Swap render targets for next frame
    const tempRT = this.rt1;
    this.rt1 = this.rt2;
    this.rt2 = tempRT;
  }

  /**
   * Set bloom effect strength
   */
  setBloomStrength(strength) {
    this.bloomStrength = Math.max(0, Math.min(2, strength));
    this.fsMaterial.uniforms.bloomStrength.value = this.bloomStrength;
    console.log(`💡 Bloom strength: ${this.bloomStrength}`);
  }

  /**
   * Set vignette intensity
   */
  setVignetteIntensity(intensity) {
    this.vignetteIntensity = Math.max(0, Math.min(1, intensity));
    this.fsMaterial.uniforms.vignetteIntensity.value = this.vignetteIntensity;
    console.log(`🔲 Vignette intensity: ${this.vignetteIntensity}`);
  }

  /**
   * Set motion blur amount
   */
  setMotionBlurAmount(amount) {
    this.motionBlurAmount = Math.max(0, Math.min(1, amount));
    this.fsMaterial.uniforms.motionBlurAmount.value = this.motionBlurAmount;
    console.log(`🌊 Motion blur: ${this.motionBlurAmount}`);
  }

  /**
   * Toggle all post-effects on/off
   */
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      // Reset render targets and render scene directly
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
      console.log('🎬 Post effects disabled');
    } else {
      console.log('✨ Post effects enabled');
    }
  }

  /**
   * Apply temporary effect (e.g., screen flash on crash)
   */
  applyFlash(color = new THREE.Color(1, 0.5, 0), intensity = 1, duration = 0.3) {
    const originalBloomStrength = this.bloomStrength;
    this.bloomStrength += intensity * 2;
    this.fsMaterial.uniforms.bloomStrength.value = this.bloomStrength;
    
    setTimeout(() => {
      this.bloomStrength = originalBloomStrength;
      this.fsMaterial.uniforms.bloomStrength.value = this.bloomStrength;
    }, duration * 1000);
  }

  /**
   * Apply screen shake effect (visual shake via offset)
   */
  applyShake(intensity, duration = 0.5) {
    const startTime = performance.now();
    const originalPosition = this.fsCamera.position.clone();
    
    const shakeInterval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed >= duration) {
        clearInterval(shakeInterval);
        this.fsCamera.position.copy(originalPosition);
        return;
      }
      
      const decayFactor = 1 - (elapsed / duration);
      this.fsCamera.position.x = (Math.random() - 0.5) * intensity * decayFactor;
      this.fsCamera.position.y = (Math.random() - 0.5) * intensity * decayFactor;
    }, 16);
  }

  /**
   * Resize post-effects for window resize
   */
  resize(width, height) {
    if (this.rt1) {
      this.rt1.setSize(Math.floor(width / 2), Math.floor(height / 2));
      this.rt2.setSize(Math.floor(width / 2), Math.floor(height / 2));
    }
    
    if (this.fsMaterial) {
      this.fsMaterial.uniforms.resolution.value.set(width, height);
    }
  }

  /**
   * Dispose all resources
   */
  dispose() {
    if (this.rt1) {
      this.rt1.dispose();
      this.rt2.dispose();
    }
    
    if (this.fsMaterial) {
      this.fsMaterial.dispose();
    }
    
    if (this.bloomShader) {
      this.bloomShader.dispose();
    }
  }
}

export const PostEffectsInstance = new PostEffects();
export default PostEffectsInstance;
