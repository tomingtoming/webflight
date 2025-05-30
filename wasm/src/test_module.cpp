#include <emscripten/bind.h>
#include <string>
#include <vector>

using namespace emscripten;

// Simple test class to verify WASM compilation and bindings
class TestModule {
private:
    std::string name;
    int counter;
    
public:
    TestModule(const std::string& moduleName) 
        : name(moduleName), counter(0) {
    }
    
    std::string getName() const {
        return name;
    }
    
    int incrementCounter() {
        return ++counter;
    }
    
    int getCounter() const {
        return counter;
    }
    
    // Test vector operations
    std::vector<float> addVectors(const std::vector<float>& a, 
                                  const std::vector<float>& b) {
        std::vector<float> result;
        size_t size = std::min(a.size(), b.size());
        
        result.reserve(size);
        for (size_t i = 0; i < size; ++i) {
            result.push_back(a[i] + b[i]);
        }
        
        return result;
    }
    
    // Test physics calculation
    float calculateDistance(float x1, float y1, float z1,
                          float x2, float y2, float z2) {
        float dx = x2 - x1;
        float dy = y2 - y1;
        float dz = z2 - z1;
        return std::sqrt(dx*dx + dy*dy + dz*dz);
    }
};

// Bindings for TestModule
EMSCRIPTEN_BINDINGS(test_module) {
    register_vector<float>("VectorFloat");
    
    class_<TestModule>("TestModule")
        .constructor<const std::string&>()
        .function("getName", &TestModule::getName)
        .function("incrementCounter", &TestModule::incrementCounter)
        .function("getCounter", &TestModule::getCounter)
        .function("addVectors", &TestModule::addVectors)
        .function("calculateDistance", &TestModule::calculateDistance);
}