/**
 * Bike Model — 3D procedural motorcycle creation
 */

const WHEEL_R = 0.38;
const BIKE_MASS = 180; // kg (game physics)

export { WHEEL_R, BIKE_MASS };

// Simplex noise for procedural textures
class SimplexNoise {
  constructor(seed=42) {
    this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    this.p=[]; for(let i=0;i<256;i++) this.p[i]=i;
    let s=(seed|0)||42; for(let i=255;i>0;i--){s=(s*16807)%2147483647;const j=s%(i+1);[this.p[i],this.p[j]]=[this.p[j],this.p[i]];}
    this.perm=new Uint8Array(512); for(let i=0;i<512;i++) this.perm[i]=this.p[i&255];
  }
  n2(x,y){const F2=.5*(Math.sqrt(3)-1),G2=(3-Math.sqrt(3))/6;s=(x+y)*F2,i=Math.floor(x+s),j=Math.floor(y+s),t=(i+j)*G2,x0=x-(i-t),y0=y-(j-t);let i1=0,j1=0;if(x0>y0){i1=1;j1=0;}else{i1=0;j1=1;}const x1=x0-i1+G2,y1=y0-j1+G2,x2=x0-1+2*G2,y2=y0-1+2*G2;const ii=i&255,jj=j&255;const gi0=this.perm[ii+this.perm[jj]]%12,gi1=this.perm[ii+i1+this.perm[jj+j1]]%12,gi2=this.perm[ii+1+this.perm[jj+1]]%12;let n0=0,n1=0,n2=0;let t0=.5-x0*x0-y0*y0;if(t0>=0){t0*=t0;n0=t0*t0*(this.grad3[gi0][0]*x0+this.grad3[gi0][1]*y0);}let t1=.5-x1*x1-y1*y1;if(t1>=0){t1*=t1;n1=t1*t1*(this.grad3[gi1][0]*x1+this.grad3[gi1][1]*y1);}let t2=.5-x2*x2-y2*y2;if(t2>=0){t2*=t2;n2=t2*t2*(this.grad3[gi2][0]*x2+this.grad3[gi2][1]*y2);}return 70*(n0+n1+n2);}
}

const simplex = new SimplexNoise(42);

// Material presets for different bikes
export const BIKE_MATERIALS = {
  mx450: { frame: 0xcc2200, tank: 0xff4400, wheel: 0x1a1a1a, rim: 0xcccccc, engine: 0x555555 },
  zx250: { frame: 0x0066cc, tank: 0x0088ff, wheel: 0x111111, rim: 0xdddddd, engine: 0x666666 },
  dr800: { frame: 0xff6600, tank: 0xff8833, wheel: 0x222222, rim: 0xbbbbbb, engine: 0x444444 },
  fx310: { frame: 0x22aa44, tank: 0x44cc66, wheel: 0x151515, rim: 0xe0e0e0, engine: 0x505050 },
  xt550: { frame: 0xff9900, tank: 0xffaa22, wheel: 0x181818, rim: 0xc8c8c8, engine: 0x484848 }
};

/**
 * Create a procedural dirt bike model (no external assets needed)
 */
export function createBikeModel(scene, bikeType = 'mx450') {
  const group = new THREE.Group();
  
  // Get material colors for this bike
  const colors = BIKE_MATERIALS[bikeType] || BIKE_MATERIALS.mx450;
  
  const frameMat = new THREE.MeshStandardMaterial({ color: colors.frame, roughness: 0.4, metalness: 0.6 });
  const engineMat = new THREE.MeshStandardMaterial({ color: colors.engine, roughness: 0.6, metalness: 0.8 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: colors.wheel, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: colors.rim, roughness: 0.3, metalness: 0.8 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
  
  // Helper: create tubular frame pieces
  function tube(pts, radius, material) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
    return new THREE.Mesh(new THREE.TubeGeometry(curve, 8, radius, 6, false), material);
  }
  
  // Main frame tubes
  group.add(tube([[-0.3, 0.5, -0.8], [0.5, 0.7, -0.2]], 0.06, frameMat)); // Seat tube to headstock
  group.add(tube([[0.5, 0.7, -0.2], [0.4, 0.3, 0.6]], 0.06, frameMat)); // Down tube
  group.add(tube([[-0.3, 0.5, -0.8], [-0.1, 0.3, 0.5]], 0.05, frameMat)); // Seat stay
  
  // Swing arm
  const swingMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.7 });
  group.add(tube([[0.4, 0.3, 0.6], [0.3, 0.2, 1.2]], 0.05, swingMat));
  
  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.7), seatMat);
  seat.position.set(0.05, 0.6, -0.1);
  group.add(seat);
  
  // Engine block with cooling fins
  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.4), engineMat);
  engine.position.set(0.1, 0.2, -0.1);
  group.add(engine);
  
  // Cooling fins (radiator)
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.35), engineMat);
    fin.position.set(0.1, 0.1 + i * 0.06, -0.1);
    group.add(fin);
  }
  
  // Exhaust pipe
  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.3, metalness: 0.9 });
  group.add(tube([[0.25, 0.15, -0.3], [0.25, 0.1, 0.8], [0.15, 0.15, 1.0]], 0.04, exhaustMat));
  
  // Fuel tank
  const tank = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6),
    new THREE.MeshStandardMaterial({ color: colors.tank, roughness: 0.3, metalness: 0.5 })
  );
  tank.position.set(0.15, 0.65, -0.2);
  tank.scale.set(1, 0.7, 1.2);
  group.add(tank);
  
  // Handlebars
  const hbMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.8 });
  group.add(tube([[-0.35, 1.0, 0.3], [0.35, 1.0, 0.3]], 0.025, hbMat));
  
  // Grips
  const gripGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 6);
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  [-0.38, 0.38].forEach(x => {
    const g = new THREE.Mesh(gripGeo, gripMat);
    g.position.set(x, 1.0, 0.3);
    g.rotation.z = Math.PI / 2;
    group.add(g);
  });
  
  // Fenders (front and rear)
  const fenderMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 });
  const fGeo = new THREE.TorusGeometry(0.4, 0.04, 6, 12, Math.PI * 0.8);
  
  // Front fender (torus positioned at front wheel)
  const ff = new THREE.Mesh(fGeo, fenderMat);
  ff.position.set(0, 0.4, -1.3);
  ff.rotation.y = Math.PI / 2;
  group.add(ff);
  
  // Rear fender (clone, mirrored at rear)
  const rf = ff.clone();
  rf.position.z = 1.3;
  group.add(rf);
  
  // Headlight (emissive)
  const hl = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffaa, emissiveIntensity: 0.5 })
  );
  hl.position.set(0, 0.8, -1.2);
  group.add(hl);
  
  // Taillight (emissive)
  const tl = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 6, 4),
    new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.3 })
  );
  tl.position.set(0, 0.55, 1.0);
  group.add(tl);
  
  // Number plate at front
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.02), 
    new THREE.MeshStandardMaterial({ color: 0xffffff }));
  plate.position.set(0, 0.85, -1.15);
  group.add(plate);
  
  const numPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2),
    new THREE.MeshBasicMaterial({ color: bikeType === 'mx450' ? 0xff4400 : colors.tank }));
  numPlate.position.set(0, 0.85, -1.13);
  group.add(numPlate);
  
  // ---- WHEELS (front pair and rear pair) ----
  const wg = new THREE.TorusGeometry(WHEEL_R, 0.12, 8, 16);
  const rimRing = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 12), rimMat);
  
  function makeWheelGroup() {
    const w = new THREE.Group();
    w.add(new THREE.Mesh(wg, wheelMat));
    rimRing.rotation.x = Math.PI / 2;
    w.add(rimRing);
    
    // Spokes (6 spokes)
    for (let i = 0; i < 6; i++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.35, 4), rimMat);
      spoke.rotation.z = (i / 6) * Math.PI;
      w.add(spoke);
    }
    
    // Hub
    w.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8), rimMat));
    
    // Tread blocks (knobbies) around the tire edge
    for (let i = 0; i < 16; i++) {
      const tread = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.18), wheelMat);
      const a = (i / 16) * Math.PI * 2;
      tread.position.set(Math.cos(a) * WHEEL_R, Math.sin(a) * WHEEL_R, 0);
      tread.rotation.z = a;
      w.add(tread);
    }
    
    return w;
  }
  
  // Front wheel assembly (with steering fork pivot)
  const frontFork = new THREE.Group();
  const frontWheelL = makeWheelGroup();
  const frontWheelR = makeWheelGroup();
  frontWheelL.position.set(-0.3, -WHEEL_R, 0);
  frontWheelR.position.set(0.3, -WHEEL_R, 0);
  frontFork.add(frontWheelL);
  frontFork.add(frontWheelR);
  
  // Fork tubes (visual only)
  const forkTubeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3, metalness: 0.8 });
  [-0.25, 0.25].forEach(x => {
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), forkTubeMat);
    fork.position.set(x, -0.3, -1.3);
    fork.rotation.x = -0.3; // Rake angle
    group.add(fork);
  });
  
  group.add(frontFork);
  
  // Rear wheels (single rear tire on dirt bike)
  const rearWheelL = makeWheelGroup();
  const rearWheelR = makeWheelGroup();
  rearWheelL.position.set(-0.3, -WHEEL_R, 0);
  rearWheelR.position.set(0.3, -WHEEL_R, 0);
  group.add(rearWheelL);
  group.add(rearWheelR);
  
  // Add suspension compression visual (rear shock)
  const shockGroup = new THREE.Group();
  const shockCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 })
  );
  shockCylinder.position.set(0, -0.1, 0.8);
  shockGroup.add(shockCylinder);
  
  // Shock spring (coil)
  const springCurve = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const angle = t * Math.PI * 6;
    springCurve.push(new THREE.Vector3(
      Math.cos(angle) * 0.04,
      -0.3 + t * 0.5,
      0.8 + Math.sin(angle) * 0.04
    ));
  }
  const spring = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springCurve), 40, 0.015, 6, false),
    new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.4 })
  );
  shockGroup.add(spring);
  group.add(shockGroup);
  
  // Position bike on track
  const WORLD_SIZE = 600;
  const TRACK_RADIUS = 170;
  
  function getTerrainHeight(x, z) {
    let h = simplex.fbm(x * 0.008, z * 0.008, 6, 2, 0.5) * 30;
    const d = Math.sqrt(x * x + z * z);
    const trackW = TRACK_WIDTH || 18;
    const dt = Math.abs(d - TRACK_RADIUS);
    if (dt < trackW) {
      const b = 1 - dt / trackW;
      const sb = b * b * (3 - 2 * b);
      h = h * (1 - sb) + 5 * sb;
    }
    return h;
  }
  
  const startX = TRACK_RADIUS + WORLD_SIZE / 2; // Start on east side of track
  const startY = getTerrainHeight(startX, 0) + WHEEL_R + 2;
  group.position.set(startX, startY, 0);
  group.rotation.y = -Math.PI / 2; // Face south
  
  // Enable shadows
  group.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  
  return { group, wheels: { frontFork, rearWheelL, rearWheelR, frontWheelL }, shockGroup };
}
