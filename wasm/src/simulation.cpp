#include "simulation.h"
#include <algorithm>

// AircraftState implementation
AircraftState::AircraftState() 
    : position(0, 0, 0),
      velocity(0, 0, 0),
      heading(0), pitch(0), roll(0),
      headingRate(0), pitchRate(0), rollRate(0),
      throttle(0), thrust(0),
      aileron(0), elevator(0), rudder(0),
      mass(10000), altitude(0), airspeed(0) {
}

// AircraftProperties implementation
AircraftProperties::AircraftProperties() {
    setF16Properties(); // Default to F-16
}

void AircraftProperties::setF16Properties() {
    name = "F-16 Fighting Falcon";
    
    // Physical characteristics (simplified)
    emptyMass = 8570.0f;    // kg
    maxFuel = 3175.0f;      // kg
    wingArea = 27.87f;      // m^2
    wingSpan = 9.96f;       // m
    
    // Engine
    maxThrust = 127000.0f;  // Newtons (with afterburner)
    thrustSFC = 0.00008f;   // kg/N/s (simplified)
    
    // Aerodynamic coefficients (simplified)
    Cl0 = 0.0f;
    ClAlpha = 5.5f;         // per radian
    Cd0 = 0.02f;
    K = 0.042f;
    ClMax = 1.4f;
    
    // Control effectiveness (simplified)
    aileronEffect = 0.5f;
    elevatorEffect = 0.4f;
    rudderEffect = 0.3f;
    
    // Additional properties
    thrustMilitary = 76000.0f;  // Newtons (military power)
    criticalAOAPositive = 0.384f; // ~22 degrees
    criticalAOANegative = -0.262f; // ~-15 degrees
    minManeuverableSpeed = 20.0f; // ~40 knots
    maxSpeed = 686.0f; // ~2.0 Mach at sea level
}

// FlightDynamics implementation
FlightDynamics::FlightDynamics() : fuel(1000.0f) {
    reset();
}

void FlightDynamics::initialize(const Vec3& position, float heading) {
    state.position = position;
    state.heading = heading;
    state.altitude = position.y;
    state.velocity = Vec3(100.0f * std::cos(heading), 0, 100.0f * std::sin(heading));
    state.airspeed = state.velocity.length();
    fuel = props.maxFuel * 0.5f; // Start with 50% fuel
}

void FlightDynamics::setAircraftType(const std::string& type) {
    if (type == "F-16") {
        props.setF16Properties();
    }
    // Add more aircraft types as needed
}

void FlightDynamics::setAircraftProperties(
    float emptyMass, float maxFuel, float wingArea,
    float maxThrust, float thrustMilitary,
    float critAOAPos, float critAOANeg,
    float minManeuverSpeed, float maxSpeed
) {
    props.emptyMass = emptyMass;
    props.maxFuel = maxFuel;
    props.wingArea = wingArea;
    props.maxThrust = maxThrust;
    props.thrustMilitary = thrustMilitary;
    props.criticalAOAPositive = critAOAPos;
    props.criticalAOANegative = critAOANeg;
    props.minManeuverableSpeed = minManeuverSpeed;
    props.maxSpeed = maxSpeed;
    
    // Update current mass and fuel
    state.mass = emptyMass + fuel;
    
    // Recalculate some derived properties
    float AR = props.wingSpan * props.wingSpan / props.wingArea;
    props.K = 1.0f / (3.14159f * 0.8f * AR); // Oswald efficiency = 0.8
}

void FlightDynamics::setThrottle(float throttle) {
    state.throttle = std::max(0.0f, std::min(1.0f, throttle));
}

void FlightDynamics::setControlSurfaces(float aileron, float elevator, float rudder) {
    state.aileron = std::max(-1.0f, std::min(1.0f, aileron));
    state.elevator = std::max(-1.0f, std::min(1.0f, elevator));
    state.rudder = std::max(-1.0f, std::min(1.0f, rudder));
}

void FlightDynamics::update(float deltaTime) {
    // Update mass (fuel consumption)
    state.mass = props.emptyMass + fuel;
    
    // Calculate thrust
    state.thrust = state.throttle * props.maxThrust;
    
    // Fuel consumption
    if (state.thrust > 0 && fuel > 0) {
        float fuelFlow = state.thrust * props.thrustSFC * deltaTime;
        fuel = std::max(0.0f, fuel - fuelFlow);
    }
    
    // Get air density at current altitude
    float rho = getAirDensity(state.altitude);
    
    // Calculate forces
    Vec3 thrustForce(
        state.thrust * std::cos(state.pitch) * std::cos(state.heading),
        state.thrust * std::sin(state.pitch),
        state.thrust * std::cos(state.pitch) * std::sin(state.heading)
    );
    
    Vec3 weight(0, -state.mass * gravity, 0);
    Vec3 aeroForces = calculateAerodynamicForces();
    
    Vec3 totalForce = thrustForce + weight + aeroForces;
    
    // Calculate acceleration
    Vec3 acceleration = totalForce * (1.0f / state.mass);
    
    // Update velocity and position
    state.velocity = state.velocity + acceleration * deltaTime;
    state.position = state.position + state.velocity * deltaTime;
    
    // Update altitude and airspeed
    state.altitude = state.position.y;
    state.airspeed = state.velocity.length();
    
    // Calculate moments and angular rates (simplified)
    Vec3 moments = calculateMoments();
    
    // Update angular velocities with proper inertia approximation
    // Using simplified moment of inertia values
    const float Ixx = state.mass * props.wingSpan * props.wingSpan * 0.1f;  // Roll inertia
    const float Iyy = state.mass * props.wingSpan * props.wingSpan * 0.2f;  // Pitch inertia
    const float Izz = state.mass * props.wingSpan * props.wingSpan * 0.3f;  // Yaw inertia
    
    // Angular accelerations
    float rollAccel = moments.x / Ixx;
    float pitchAccel = moments.y / Iyy;
    float yawAccel = moments.z / Izz;
    
    // Update angular velocities
    state.rollRate += rollAccel * deltaTime;
    state.pitchRate += pitchAccel * deltaTime;
    state.headingRate += yawAccel * deltaTime;
    
    // Limit angular rates
    const float maxRollRate = 5.0f;  // rad/s
    const float maxPitchRate = 3.0f; // rad/s
    const float maxYawRate = 2.0f;   // rad/s
    
    state.rollRate = std::max(-maxRollRate, std::min(maxRollRate, state.rollRate));
    state.pitchRate = std::max(-maxPitchRate, std::min(maxPitchRate, state.pitchRate));
    state.headingRate = std::max(-maxYawRate, std::min(maxYawRate, state.headingRate));
    
    // Update orientation using proper Euler angle integration
    state.roll += state.rollRate * deltaTime;
    state.pitch += state.pitchRate * deltaTime;
    state.heading += state.headingRate * deltaTime;
    
    // Normalize angles
    while (state.roll > M_PI) state.roll -= 2.0f * M_PI;
    while (state.roll < -M_PI) state.roll += 2.0f * M_PI;
    
    // Limit pitch to prevent gimbal lock
    state.pitch = std::max(static_cast<float>(-M_PI * 0.45f), 
                          std::min(static_cast<float>(M_PI * 0.45f), state.pitch));
    
    while (state.heading > M_PI) state.heading -= 2.0f * M_PI;
    while (state.heading < -M_PI) state.heading += 2.0f * M_PI;
}

float FlightDynamics::getAirDensity(float altitude) const {
    // Simple exponential atmosphere model
    return airDensity * std::exp(-altitude / 8000.0f);
}

float FlightDynamics::getDynamicPressure() const {
    float rho = getAirDensity(state.altitude);
    return 0.5f * rho * state.airspeed * state.airspeed;
}

Vec3 FlightDynamics::calculateAerodynamicForces() const {
    float q = getDynamicPressure();
    float S = props.wingArea;
    
    // Calculate angle of attack (alpha) properly
    // This is the angle between the velocity vector and the aircraft's x-axis
    float velocityMagnitude = state.velocity.length();
    float alpha = 0.0f;
    
    if (velocityMagnitude > 0.1f) {
        // Calculate velocity in body frame
        Vec3 velocityNormalized = state.velocity.normalized();
        
        // Simple approximation: alpha = arctan(Vz/Vx) in body frame
        // For now, using a simplified calculation
        float horizontalSpeed = std::sqrt(state.velocity.x * state.velocity.x + 
                                         state.velocity.z * state.velocity.z);
        if (horizontalSpeed > 0.1f) {
            alpha = std::atan2(-state.velocity.y, horizontalSpeed) + state.pitch;
        }
    }
    
    // Limit angle of attack to critical values
    alpha = std::max(props.criticalAOANegative, std::min(props.criticalAOAPositive, alpha));
    
    // Calculate lift coefficient
    float Cl = props.Cl0 + props.ClAlpha * alpha;
    
    // Stall modeling
    if (alpha > props.criticalAOAPositive * 0.8f) {
        // Post-stall reduction
        float stallFactor = 1.0f - (alpha - props.criticalAOAPositive * 0.8f) / 
                           (props.criticalAOAPositive * 0.2f);
        Cl *= std::max(0.3f, stallFactor);
    }
    
    Cl = std::max(-props.ClMax, std::min(props.ClMax, Cl));
    float lift = q * S * Cl;
    
    // Calculate drag coefficient
    float Cd = props.Cd0 + props.K * Cl * Cl;
    
    // Add speed-dependent drag
    if (state.airspeed > props.maxSpeed * 0.8f) {
        float speedFactor = (state.airspeed - props.maxSpeed * 0.8f) / 
                           (props.maxSpeed * 0.2f);
        Cd += speedFactor * 0.1f; // Additional drag near max speed
    }
    
    float drag = q * S * Cd;
    
    // Side force from rudder
    float sideForce = q * S * state.rudder * props.rudderEffect * 0.2f;
    
    // Transform forces to world coordinates
    // Lift acts perpendicular to velocity vector
    // Drag acts opposite to velocity vector
    Vec3 liftVector(0, 0, 0);
    Vec3 dragVector(0, 0, 0);
    Vec3 sideVector(0, 0, 0);
    
    if (velocityMagnitude > 0.1f) {
        // Velocity direction
        Vec3 velocityDir = state.velocity.normalized();
        
        // Calculate lift direction (perpendicular to velocity, in the pitch plane)
        Vec3 liftDir(
            -velocityDir.y * std::cos(state.heading),
            velocityDir.x * std::cos(state.heading) + velocityDir.z * std::sin(state.heading),
            -velocityDir.y * std::sin(state.heading)
        );
        liftDir = liftDir.normalized();
        
        liftVector = liftDir * lift;
        dragVector = velocityDir * (-drag);
        
        // Side force (simplified)
        sideVector = Vec3(
            -sideForce * std::sin(state.heading),
            0,
            sideForce * std::cos(state.heading)
        );
    }
    
    return liftVector + dragVector + sideVector;
}

Vec3 FlightDynamics::calculateMoments() const {
    float q = getDynamicPressure();
    
    // More realistic moment calculations
    float S = props.wingArea;
    float b = props.wingSpan;
    float c = S / b; // Mean aerodynamic chord
    
    // Roll moment from ailerons
    float rollMoment = q * S * b * state.aileron * props.aileronEffect;
    
    // Add roll damping
    rollMoment -= q * S * b * b * state.rollRate * 0.1f;
    
    // Add adverse yaw from ailerons
    float adverseYaw = -state.aileron * props.aileronEffect * 0.2f;
    
    // Pitch moment from elevator
    float pitchMoment = q * S * c * state.elevator * props.elevatorEffect;
    
    // Add pitch damping
    pitchMoment -= q * S * c * c * state.pitchRate * 0.2f;
    
    // Add speed stability (nose-down tendency at high speed)
    if (state.airspeed > props.maxSpeed * 0.7f) {
        float speedFactor = (state.airspeed - props.maxSpeed * 0.7f) / 
                           (props.maxSpeed * 0.3f);
        pitchMoment -= q * S * c * speedFactor * 0.1f;
    }
    
    // Yaw moment from rudder
    float yawMoment = q * S * b * state.rudder * props.rudderEffect;
    
    // Add yaw damping
    yawMoment -= q * S * b * b * state.headingRate * 0.15f;
    
    // Add adverse yaw
    yawMoment += q * S * b * adverseYaw;
    
    // Scale moments for more realistic response
    const float momentScale = 0.001f; // Adjust based on aircraft inertia
    
    return Vec3(rollMoment * momentScale, 
                pitchMoment * momentScale, 
                yawMoment * momentScale);
}

void FlightDynamics::reset() {
    state = AircraftState();
    fuel = props.maxFuel * 0.5f;
}