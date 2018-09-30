"use strict";

function main() {
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        throw new Error("No GL");
    }
    var gl = getGL();

    var program = getProgram(gl);

    var position = getAttribute(gl, program, "a_position");
    setGeometry(gl);

    var texcoord = getAttribute(gl, program, "a_texcoord");
    setTexcoords(gl);

    var umatrix = getUniform(gl, program, "u_matrix");
    var utexture = getUniform(gl, program, "u_texture");
    var ucolor = getUniform(gl, program, "u_color");

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    {
        // fill texture with 3x2 pixels
        const level = 0;
        const internalFormat = gl.LUMINANCE;
        const width = 3;
        const height = 2;
        const border = 0;
        const format = gl.LUMINANCE;
        const type = gl.UNSIGNED_BYTE;
        const data = new Uint8Array([
            128, 64, 128,
            0, 192, 0,
        ]);
        const alignment = 1;
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
            format, type, data);

        // set the filtering so we don't need mips and it's not filtered
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }


    var targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    const targetWidth = 256;
    const targetHeight = 256;

    {
        const level = 0;
        const intervalFormat = gl.RGBA;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const pixels = null;
        gl.texImage2D(gl.TEXTURE_2D, level, intervalFormat, targetWidth, targetHeight, border,
            format, type, pixels);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    const level = 0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetWidth, targetHeight);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    var fieldOfViewRadians = degToRad(60);
    var modelXRotationRadians = degToRad(0);
    var modelYRotationRadians = degToRad(0);

    var then = 0;

    function drawCube(aspect) {
        gl.useProgram(program);

        var size = 3; // 4 components per iteration
        var type = gl.FLOAT; // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0; // start at the beginning of the buffer
        setAttribute(gl, position, size, type, normalize, stride, offset);

        var size = 2; // 4 components per iteration
        var type = gl.FLOAT; // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0; // start at the beginning of the buffer
        setAttribute(gl, texcoord, size, type, normalize, stride, offset);

        for (let x = -1; x <= 1; ++x) {
            let mMatrix = calculateMMatrix(x * 0.9, modelXRotationRadians * x, modelYRotationRadians * x);
            let vMatrix = calculateVMatrix([0, 0, 2], [0, 0, 0], [0, 1, 0]);
            let pMatrix = calculatePMatrix(fieldOfViewRadians, aspect);
            let mvpMatrix = m4.multiply(vMatrix, mMatrix);
            mvpMatrix = m4.multiply(pMatrix, mvpMatrix);

            gl.uniformMatrix4fv(umatrix.location, false, mvpMatrix);
            gl.uniform1i(utexture.location, 0);

            var c = x * 0.5 + 0.5;
            gl.uniform4fv(ucolor.location, [c, 1, 1 - c, 1]);

            var primitiveType = gl.TRIANGLES;
            var offset = 0;
            var count = 6 * 6; // 4 triangles, 3 vertices each
            gl.drawArrays(primitiveType, offset, count);
        }
    }

    requestAnimationFrame(drawScene);

    function drawScene(time) {
        time *= 0.001;
        var deltaTime = time - then;
        then = time;

        modelYRotationRadians += -0.7 * deltaTime;
        modelXRotationRadians += -0.4 * deltaTime;

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.viewport(0, 0, targetWidth, targetHeight);

            gl.clearColor(0, 0, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            drawCube(targetWidth / targetHeight);
        }

        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, targetTexture);

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            drawCube(gl.canvas.width / gl.canvas.height);
        }

        requestAnimationFrame(drawScene);
    }
}

// Fill the buffer with the values that define a cube.
function setGeometry(gl) {
    var positions = new Float32Array(
        [
            -0.5, -0.5, -0.5,
            -0.5, 0.5, -0.5,
            0.5, -0.5, -0.5,
            -0.5, 0.5, -0.5,
            0.5, 0.5, -0.5,
            0.5, -0.5, -0.5,

            -0.5, -0.5, 0.5,
            0.5, -0.5, 0.5,
            -0.5, 0.5, 0.5,
            -0.5, 0.5, 0.5,
            0.5, -0.5, 0.5,
            0.5, 0.5, 0.5,

            -0.5, 0.5, -0.5,
            -0.5, 0.5, 0.5,
            0.5, 0.5, -0.5,
            -0.5, 0.5, 0.5,
            0.5, 0.5, 0.5,
            0.5, 0.5, -0.5,

            -0.5, -0.5, -0.5,
            0.5, -0.5, -0.5,
            -0.5, -0.5, 0.5,
            -0.5, -0.5, 0.5,
            0.5, -0.5, -0.5,
            0.5, -0.5, 0.5,

            -0.5, -0.5, -0.5,
            -0.5, -0.5, 0.5,
            -0.5, 0.5, -0.5,
            -0.5, -0.5, 0.5,
            -0.5, 0.5, 0.5,
            -0.5, 0.5, -0.5,

            0.5, -0.5, -0.5,
            0.5, 0.5, -0.5,
            0.5, -0.5, 0.5,
            0.5, -0.5, 0.5,
            0.5, 0.5, -0.5,
            0.5, 0.5, 0.5,

        ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the buffer with texture coordinates the cube.
function setTexcoords(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(
            [
                0, 0,
                0, 1,
                1, 0,
                0, 1,
                1, 1,
                1, 0,

                0, 0,
                0, 1,
                1, 0,
                1, 0,
                0, 1,
                1, 1,

                0, 0,
                0, 1,
                1, 0,
                0, 1,
                1, 1,
                1, 0,

                0, 0,
                0, 1,
                1, 0,
                1, 0,
                0, 1,
                1, 1,

                0, 0,
                0, 1,
                1, 0,
                0, 1,
                1, 1,
                1, 0,

                0, 0,
                0, 1,
                1, 0,
                1, 0,
                0, 1,
                1, 1,

            ]),
        gl.STATIC_DRAW);
}


main();