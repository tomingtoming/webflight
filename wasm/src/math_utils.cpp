#include <emscripten/bind.h>
#include <cmath>

using namespace emscripten;

// Vector3 class for basic 3D math
class Vector3 {
public:
    float x, y, z;
    
    Vector3() : x(0), y(0), z(0) {}
    Vector3(float x_, float y_, float z_) : x(x_), y(y_), z(z_) {}
    
    Vector3 add(const Vector3& other) const {
        return Vector3(x + other.x, y + other.y, z + other.z);
    }
    
    Vector3 subtract(const Vector3& other) const {
        return Vector3(x - other.x, y - other.y, z - other.z);
    }
    
    Vector3 multiply(float scalar) const {
        return Vector3(x * scalar, y * scalar, z * scalar);
    }
    
    float dot(const Vector3& other) const {
        return x * other.x + y * other.y + z * other.z;
    }
    
    Vector3 cross(const Vector3& other) const {
        return Vector3(
            y * other.z - z * other.y,
            z * other.x - x * other.z,
            x * other.y - y * other.x
        );
    }
    
    float length() const {
        return std::sqrt(x * x + y * y + z * z);
    }
    
    Vector3 normalize() const {
        float len = length();
        if (len > 0) {
            return multiply(1.0f / len);
        }
        return *this;
    }
};

// Quaternion for rotations
class Quaternion {
public:
    float w, x, y, z;
    
    Quaternion() : w(1), x(0), y(0), z(0) {}
    Quaternion(float w_, float x_, float y_, float z_) 
        : w(w_), x(x_), y(y_), z(z_) {}
    
    static Quaternion fromAxisAngle(const Vector3& axis, float angle) {
        float halfAngle = angle * 0.5f;
        float s = std::sin(halfAngle);
        Vector3 normalizedAxis = axis.normalize();
        
        return Quaternion(
            std::cos(halfAngle),
            normalizedAxis.x * s,
            normalizedAxis.y * s,
            normalizedAxis.z * s
        );
    }
    
    Quaternion multiply(const Quaternion& other) const {
        return Quaternion(
            w * other.w - x * other.x - y * other.y - z * other.z,
            w * other.x + x * other.w + y * other.z - z * other.y,
            w * other.y - x * other.z + y * other.w + z * other.x,
            w * other.z + x * other.y - y * other.x + z * other.w
        );
    }
    
    Vector3 rotateVector(const Vector3& v) const {
        // Quaternion rotation formula: q * v * q^-1
        float qx2 = x * x;
        float qy2 = y * y;
        float qz2 = z * z;
        float qwx = w * x;
        float qwy = w * y;
        float qwz = w * z;
        float qxy = x * y;
        float qxz = x * z;
        float qyz = y * z;
        
        return Vector3(
            v.x * (1 - 2 * (qy2 + qz2)) + v.y * 2 * (qxy - qwz) + v.z * 2 * (qxz + qwy),
            v.x * 2 * (qxy + qwz) + v.y * (1 - 2 * (qx2 + qz2)) + v.z * 2 * (qyz - qwx),
            v.x * 2 * (qxz - qwy) + v.y * 2 * (qyz + qwx) + v.z * (1 - 2 * (qx2 + qy2))
        );
    }
};

// Math utilities
namespace MathUtils {
    float degToRad(float degrees) {
        return degrees * M_PI / 180.0f;
    }
    
    float radToDeg(float radians) {
        return radians * 180.0f / M_PI;
    }
    
    float clamp(float value, float min, float max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
    
    float lerp(float a, float b, float t) {
        return a + (b - a) * t;
    }
}

// Bindings
EMSCRIPTEN_BINDINGS(math_utils) {
    // Vector3 bindings
    class_<Vector3>("Vector3")
        .constructor<>()
        .constructor<float, float, float>()
        .property("x", &Vector3::x)
        .property("y", &Vector3::y)
        .property("z", &Vector3::z)
        .function("add", &Vector3::add)
        .function("subtract", &Vector3::subtract)
        .function("multiply", &Vector3::multiply)
        .function("dot", &Vector3::dot)
        .function("cross", &Vector3::cross)
        .function("length", &Vector3::length)
        .function("normalize", &Vector3::normalize);
    
    // Quaternion bindings
    class_<Quaternion>("Quaternion")
        .constructor<>()
        .constructor<float, float, float, float>()
        .property("w", &Quaternion::w)
        .property("x", &Quaternion::x)
        .property("y", &Quaternion::y)
        .property("z", &Quaternion::z)
        .class_function("fromAxisAngle", &Quaternion::fromAxisAngle)
        .function("multiply", &Quaternion::multiply)
        .function("rotateVector", &Quaternion::rotateVector);
    
    // Math utilities
    function("degToRad", &MathUtils::degToRad);
    function("radToDeg", &MathUtils::radToDeg);
    function("clamp", &MathUtils::clamp);
    function("lerp", &MathUtils::lerp);
}