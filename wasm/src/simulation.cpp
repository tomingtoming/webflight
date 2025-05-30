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
    
    // Update angular velocities (simplified - no proper moment of inertia)
    state.rollRate = moments.x * 0.001f;
    state.pitchRate = moments.y * 0.001f;
    state.headingRate = moments.z * 0.001f;
    
    // Update orientation
    state.roll += state.rollRate * deltaTime;
    state.pitch += state.pitchRate * deltaTime;
    state.heading += state.headingRate * deltaTime;
    
    // Limit angles
    state.roll = std::fmod(state.roll, 2.0f * static_cast<float>(M_PI));
    state.pitch = std::max(-static_cast<float>(M_PI)/2.0f, std::min(static_cast<float>(M_PI)/2.0f, state.pitch));
    state.heading = std::fmod(state.heading, 2.0f * static_cast<float>(M_PI));
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
    
    // Simplified aerodynamics
    // Angle of attack (simplified)
    float alpha = state.pitch; // Very simplified!
    
    // Lift
    float Cl = props.Cl0 + props.ClAlpha * alpha;
    Cl = std::min(Cl, props.ClMax);
    float lift = q * S * Cl;
    
    // Drag
    float Cd = props.Cd0 + props.K * Cl * Cl;
    float drag = q * S * Cd;
    
    // Transform to world coordinates (simplified)
    Vec3 liftVector(0, lift, 0);
    Vec3 dragVector(-drag * std::cos(state.heading), 0, -drag * std::sin(state.heading));
    
    return liftVector + dragVector;
}

Vec3 FlightDynamics::calculateMoments() const {
    float q = getDynamicPressure();
    
    // Simplified moment calculations
    float rollMoment = q * props.wingArea * props.wingSpan * state.aileron * props.aileronEffect;
    float pitchMoment = q * props.wingArea * props.wingSpan * state.elevator * props.elevatorEffect;
    float yawMoment = q * props.wingArea * props.wingSpan * state.rudder * props.rudderEffect;
    
    return Vec3(rollMoment, pitchMoment, yawMoment);
}

void FlightDynamics::reset() {
    state = AircraftState();
    fuel = props.maxFuel * 0.5f;
}