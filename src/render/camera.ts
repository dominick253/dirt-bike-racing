/**
 * Camera System — Chase cam with dynamic FOV
 */

import * as THREE from 'three';

export class CameraSystem {
  private camera: THREE.PerspectiveCamera;
  private targetPosition: THREE.Vector3;
  private currentPosition: THREE.Vector3;
  private lookAtTarget: THREE.Vector3;
  private currentLookAt: THREE.Vector3;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentPosition = new THREE.Vector3(0, 5, 10);
    this.targetPosition = new THREE.Vector3(0, 5, 10);
    this.currentLookAt = new THREE.Vector3(0, 2, 0);
    this.lookAtTarget = new THREE.Vector3(0, 2, 0);
  }

  update(bikePosition: THREE.Vector3, bikeRotation: number, speed: number): void {
    const offset = new THREE.Vector3(0, 3, -8);
    const rot = new THREE.Euler(0, bikeRotation, 0, 'XYZ');
    offset.applyEuler(rot);
    this.targetPosition.copy(bikePosition).add(offset);

    const baseFOV = 60;
    const speedFOV = Math.min(speed * 0.15, 35);
    this.camera.fov = baseFOV + speedFOV;
    this.camera.updateProjectionMatrix();

    this.currentPosition.lerp(this.targetPosition, 0.12);
    this.currentLookAt.lerp(bikePosition, 0.18);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }

  setFixedPosition(position: THREE.Vector3, lookAt: THREE.Vector3): void {
    this.currentPosition.copy(position);
    this.currentLookAt.copy(lookAt);
    this.camera.position.copy(position);
    this.camera.lookAt(lookAt);
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
