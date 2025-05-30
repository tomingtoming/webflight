// WebAssembly module type definitions

export interface Vector3 {
  x: number;
  y: number;
  z: number;
  add(other: Vector3): Vector3;
  subtract(other: Vector3): Vector3;
  multiply(scalar: number): Vector3;
  dot(other: Vector3): number;
  cross(other: Vector3): Vector3;
  length(): number;
  normalize(): Vector3;
}

export interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
  multiply(other: Quaternion): Quaternion;
  rotateVector(v: Vector3): Vector3;
}

export interface TestModule {
  getName(): string;
  incrementCounter(): number;
  getCounter(): number;
  addVectors(a: number[], b: number[]): number[];
  calculateDistance(x1: number, y1: number, z1: number, 
                   x2: number, y2: number, z2: number): number;
}

export interface SystemInfo {
  platform: string;
  wasmSupported: boolean;
  threadsSupported: boolean;
  simdSupported: boolean;
  memory: {
    heapSize: number;
    stackSize: number;
  };
}

export interface AircraftState {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  heading: number;
  pitch: number;
  roll: number;
  headingRate: number;
  pitchRate: number;
  rollRate: number;
  throttle: number;
  thrust: number;
  aileron: number;
  elevator: number;
  rudder: number;
  altitude: number;
  airspeed: number;
  mass: number;
  fuel: number;
}

export interface AircraftProperties {
  name: string;
  emptyMass: number;
  maxFuel: number;
  wingArea: number;
  wingSpan: number;
  maxThrust: number;
}

export interface FlightSimulation {
  initialize(x: number, y: number, z: number, heading: number): void;
  setAircraftType(type: string): void;
  setThrottle(throttle: number): void;
  setControlSurfaces(aileron: number, elevator: number, rudder: number): void;
  update(deltaTime: number): void;
  getState(): AircraftState;
  getProperties(): AircraftProperties;
  reset(): void;
}

export interface YSFlightCore {
  // Factory functions
  Vector3: {
    new(): Vector3;
    new(x: number, y: number, z: number): Vector3;
  };
  
  Quaternion: {
    new(): Quaternion;
    new(w: number, x: number, y: number, z: number): Quaternion;
    fromAxisAngle(axis: Vector3, angle: number): Quaternion;
  };
  
  TestModule: {
    new(name: string): TestModule;
  };
  
  FlightSimulation: {
    new(): FlightSimulation;
  };
  
  // Global functions
  getVersion(): string;
  getBuildInfo(): string;
  getSystemInfo(): SystemInfo;
  
  // Math utilities
  degToRad(degrees: number): number;
  radToDeg(radians: number): number;
  clamp(value: number, min: number, max: number): number;
  lerp(a: number, b: number, t: number): number;
}

export interface YSFlightModule {
  then(callback: (module: YSFlightCore) => void): void;
}