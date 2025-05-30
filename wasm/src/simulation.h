#pragma once

#include <cmath>
#include <string>
#include <vector>

// Basic 3D vector class
struct Vec3 {
    float x, y, z;
    
    Vec3() : x(0), y(0), z(0) {}
    Vec3(float x_, float y_, float z_) : x(x_), y(y_), z(z_) {}
    
    Vec3 operator+(const Vec3& other) const {
        return Vec3(x + other.x, y + other.y, z + other.z);
    }
    
    Vec3 operator*(float scalar) const {
        return Vec3(x * scalar, y * scalar, z * scalar);
    }
    
    float length() const {
        return std::sqrt(x * x + y * y + z * z);
    }
    
    Vec3 normalized() const {
        float len = length();
        if (len > 0) {
            return Vec3(x / len, y / len, z / len);
        }
        return *this;
    }
};

// Basic aircraft state
struct AircraftState {
    // Position (meters)
    Vec3 position;
    
    // Velocity (m/s)
    Vec3 velocity;
    
    // Orientation (radians)
    float heading;  // Yaw
    float pitch;    // Pitch
    float roll;     // Roll
    
    // Angular velocities (rad/s)
    float headingRate;
    float pitchRate;
    float rollRate;
    
    // Engine
    float throttle; // 0.0 to 1.0
    float thrust;   // Newtons
    
    // Control surfaces (-1.0 to 1.0)
    float aileron;
    float elevator;
    float rudder;
    
    // Physical properties
    float mass;     // kg
    float altitude; // meters
    float airspeed; // m/s
    
    AircraftState();
};

// Aircraft properties
struct AircraftProperties {
    std::string name;
    
    // Physical characteristics
    float emptyMass;        // kg
    float maxFuel;          // kg
    float wingArea;         // m^2
    float wingSpan;         // m
    
    // Engine
    float maxThrust;        // Newtons
    float thrustSFC;        // Specific fuel consumption
    
    // Aerodynamic coefficients
    float Cl0;              // Lift coefficient at zero AoA
    float ClAlpha;          // Lift curve slope
    float Cd0;              // Parasitic drag coefficient
    float K;                // Induced drag factor
    float ClMax;            // Maximum lift coefficient
    
    // Control effectiveness
    float aileronEffect;
    float elevatorEffect;
    float rudderEffect;
    
    AircraftProperties();
    void setF16Properties(); // Default F-16 properties
};

// Simple flight dynamics model
class FlightDynamics {
private:
    AircraftState state;
    AircraftProperties props;
    float fuel;             // Current fuel (kg)
    
    // Environment
    float gravity = 9.81f;  // m/s^2
    float airDensity = 1.225f; // kg/m^3 at sea level
    
public:
    FlightDynamics();
    
    // Initialize aircraft
    void initialize(const Vec3& position, float heading);
    void setAircraftType(const std::string& type);
    
    // Control inputs
    void setThrottle(float throttle);
    void setControlSurfaces(float aileron, float elevator, float rudder);
    
    // Update simulation
    void update(float deltaTime);
    
    // Get state
    const AircraftState& getState() const { return state; }
    const AircraftProperties& getProperties() const { return props; }
    float getFuel() const { return fuel; }
    
    // Helper methods
    float getAirDensity(float altitude) const;
    float getDynamicPressure() const;
    Vec3 calculateAerodynamicForces() const;
    Vec3 calculateMoments() const;
    
    // Reset
    void reset();
};