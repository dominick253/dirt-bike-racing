/**
 * Bike 3D Model — Procedural bike geometry
 */

import * as THREE from 'three';

export class BikeModel {
  private group: THREE.Group;
  private wheelFront: THREE.Mesh | undefined;
  private wheelRear: THREE.Mesh | undefined;
  private chassis: THREE.Mesh | undefined;

  constructor() {
    this.group = new THREE.Group();
    this.createChassis();
    this.createWheels();
    this.createFrame();
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  private createChassis(): void {
    const geometry = new THREE.BoxGeometry(1.2, 0.4, 0.6);
    const material = new THREE.MeshStandardMaterial({
      color: 0x0070d1,
      roughness: 0.4,
      metalness: 0.6,
    });
    this.chassis = new THREE.Mesh(geometry, material);
    this.chassis.position.set(0, 0.8, 0);
    this.group.add(this.chassis);
  }

  private createWheels(): void {
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.wheelRear = new THREE.Mesh(wheelGeo, wheelMat);
    this.wheelRear.position.set(0, 0.35, -0.5);
    this.group.add(this.wheelRear);

    this.wheelFront = new THREE.Mesh(wheelGeo, wheelMat);
    this.wheelFront.position.set(0, 0.35, 0.55);
    this.group.add(this.wheelFront);
  }

  private createFrame(): void {
    const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.8,
    });

    const frame = new THREE.Mesh(tubeGeo, tubeMat);
    frame.position.set(0, 0.8, 0);
    frame.rotation.z = 0.2;
    this.group.add(frame);

    const handlebarGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
    const handlebar = new THREE.Mesh(handlebarGeo, tubeMat);
    handlebar.position.set(0, 1.2, 0.4);
    handlebar.rotation.x = Math.PI / 2;
    this.group.add(handlebar);

    const seatGeo = new THREE.BoxGeometry(0.8, 0.1, 0.4);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(-0.1, 1.05, -0.1);
    this.group.add(seat);
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  updateWheelRotation(wheelRotation: number): void {
    if (this.wheelFront) this.wheelFront.rotation.x = wheelRotation;
    if (this.wheelRear) this.wheelRear.rotation.x = wheelRotation;
  }

  updateLean(leanAngle: number): void {
    this.group.rotation.z = leanAngle;
  }

  updateSuspension(compression: number): void {
    this.group.position.y = compression * 0.2;
  }
}
