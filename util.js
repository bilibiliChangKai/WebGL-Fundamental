function main() {
    getGL = function (debug) {
        var canvas = document.getElementById("canvas");
        var gl = canvas.getContext("webgl");
        if (!gl) {
            throw new Error("No GL");
        }

        if (debug) {
            gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError, validateNoneOfTheArgsAreUndefined);
        }
        return gl;

        
        var throwOnGLError = function (err, funcName, args) {
            throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName;
        };
    
        var logGLCall = function (functionName, args) {
            console.log("gl." + functionName + "(" +
                WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
        };
    
        var validateNoneOfTheArgsAreUndefined = function (functionName, args) {
            for (var ii = 0; ii < args.length; ++ii) {
                if (args[ii] === undefined) {
                    console.error("undefined passed to gl." + functionName + "(" +
                        WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
                }
            }
        };
    };

    // 获得程序
    getProgram = function (gl) {
        return webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
    };

    // 获得attribute
    getAttribute = function (gl, program, name) {
        var location = gl.getAttribLocation(program, name);
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        return {
            location: location,
            buffer: buffer,
        };
    };

    // 获得uniform
    getUniform = function (gl, program, name) {
        var location = gl.getUniformLocation(program, name);
        return {
            location: location,
        };
    };

    setAttribute = function (gl, attribute, size, type, normalize, stride, offset) {
        gl.enableVertexAttribArray(attribute.location);
        gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
        gl.vertexAttribPointer(attribute.location, size, type, normalize, stride, offset);
    };

    calculateMMatrix = function (translateX, rotateX, rotateY) {
        let matrix = m4.identity();
        matrix = m4.translate(matrix, translateX, 0, 0);
        matrix = m4.xRotate(matrix, rotateX);
        return m4.yRotate(matrix, rotateY);
    };

    calculateVMatrix = function (cameraPos, target, up) {
        let cameraMatrix = m4.lookAt(cameraPos, target, up);
        return m4.inverse(cameraMatrix);  
    };

    calculatePMatrix = function (fieldOfViewRadians, aspect) {
        return m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    };
}

main();