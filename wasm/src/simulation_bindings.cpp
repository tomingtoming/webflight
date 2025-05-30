#include <emscripten/bind.h>
#include "simulation.h"

using namespace emscripten;

// Binding for Vec3
EMSCRIPTEN_BINDINGS(vec3_bindings) {
    value_object<Vec3>("SimVec3")
        .field("x", &Vec3::x)
        .field("y", &Vec3::y)
        .field("z", &Vec3::z);
}

// Binding for AircraftState
EMSCRIPTEN_BINDINGS(aircraft_state_bindings) {
    value_object<AircraftState>("AircraftState")
        .field("position", &AircraftState::position)
        .field("velocity", &AircraftState::velocity)
        .field("heading", &AircraftState::heading)
        .field("pitch", &AircraftState::pitch)
        .field("roll", &AircraftState::roll)
        .field("headingRate", &AircraftState::headingRate)
        .field("pitchRate", &AircraftState::pitchRate)
        .field("rollRate", &AircraftState::rollRate)
        .field("throttle", &AircraftState::throttle)
        .field("thrust", &AircraftState::thrust)
        .field("aileron", &AircraftState::aileron)
        .field("elevator", &AircraftState::elevator)
        .field("rudder", &AircraftState::rudder)
        .field("mass", &AircraftState::mass)
        .field("altitude", &AircraftState::altitude)
        .field("airspeed", &AircraftState::airspeed);
}

// Binding for AircraftProperties
EMSCRIPTEN_BINDINGS(aircraft_properties_bindings) {
    value_object<AircraftProperties>("AircraftProperties")
        .field("name", &AircraftProperties::name)
        .field("emptyMass", &AircraftProperties::emptyMass)
        .field("maxFuel", &AircraftProperties::maxFuel)
        .field("wingArea", &AircraftProperties::wingArea)
        .field("wingSpan", &AircraftProperties::wingSpan)
        .field("maxThrust", &AircraftProperties::maxThrust);
}

// Wrapper class for JavaScript-friendly interface
class SimulationWrapper {
private:
    FlightDynamics dynamics;
    
public:
    SimulationWrapper() {}
    
    void initialize(float x, float y, float z, float heading) {
        dynamics.initialize(Vec3(x, y, z), heading);
    }
    
    void setAircraftType(const std::string& type) {
        dynamics.setAircraftType(type);
    }
    
    void setThrottle(float throttle) {
        dynamics.setThrottle(throttle);
    }
    
    void setControlSurfaces(float aileron, float elevator, float rudder) {
        dynamics.setControlSurfaces(aileron, elevator, rudder);
    }
    
    void update(float deltaTime) {
        dynamics.update(deltaTime);
    }
    
    val getState() {
        const AircraftState& state = dynamics.getState();
        val jsState = val::object();
        
        // Position
        val position = val::object();
        position.set("x", state.position.x);
        position.set("y", state.position.y);
        position.set("z", state.position.z);
        jsState.set("position", position);
        
        // Velocity
        val velocity = val::object();
        velocity.set("x", state.velocity.x);
        velocity.set("y", state.velocity.y);
        velocity.set("z", state.velocity.z);
        jsState.set("velocity", velocity);
        
        // Orientation
        jsState.set("heading", state.heading);
        jsState.set("pitch", state.pitch);
        jsState.set("roll", state.roll);
        
        // Angular rates
        jsState.set("headingRate", state.headingRate);
        jsState.set("pitchRate", state.pitchRate);
        jsState.set("rollRate", state.rollRate);
        
        // Controls
        jsState.set("throttle", state.throttle);
        jsState.set("thrust", state.thrust);
        jsState.set("aileron", state.aileron);
        jsState.set("elevator", state.elevator);
        jsState.set("rudder", state.rudder);
        
        // Status
        jsState.set("altitude", state.altitude);
        jsState.set("airspeed", state.airspeed);
        jsState.set("mass", state.mass);
        jsState.set("fuel", dynamics.getFuel());
        
        return jsState;
    }
    
    val getProperties() {
        const AircraftProperties& props = dynamics.getProperties();
        val jsProps = val::object();
        
        jsProps.set("name", props.name);
        jsProps.set("emptyMass", props.emptyMass);
        jsProps.set("maxFuel", props.maxFuel);
        jsProps.set("wingArea", props.wingArea);
        jsProps.set("wingSpan", props.wingSpan);
        jsProps.set("maxThrust", props.maxThrust);
        
        return jsProps;
    }
    
    void reset() {
        dynamics.reset();
    }
};

// Binding for SimulationWrapper
EMSCRIPTEN_BINDINGS(simulation_bindings) {
    class_<SimulationWrapper>("FlightSimulation")
        .constructor<>()
        .function("initialize", &SimulationWrapper::initialize)
        .function("setAircraftType", &SimulationWrapper::setAircraftType)
        .function("setThrottle", &SimulationWrapper::setThrottle)
        .function("setControlSurfaces", &SimulationWrapper::setControlSurfaces)
        .function("update", &SimulationWrapper::update)
        .function("getState", &SimulationWrapper::getState)
        .function("getProperties", &SimulationWrapper::getProperties)
        .function("reset", &SimulationWrapper::reset);
}