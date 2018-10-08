"use strict";

function main() {
    var gl = getGL(true);

    var program = getProgram(gl);

    var a_position = getAttribute(gl, program, 'a_position');
    var positions = [
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var a_texcoord = getAttribute(gl, program, 'a_texcoord');
    var texcoords = [
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    var u_matrix = getUniform(gl, program, "u_matrix");
    var u_texture = getUniform(gl, program, "u_texture");


    function drawImage(tex, texWidth, texHeight, dstX, dstY) {
        gl.bindTexture(gl.TEXTURE_2D, tex);

        gl.useProgram(program);

        setAttribute(gl, a_position, 2, gl.FLOAT, false, 0, 0);
        setAttribute(gl, a_texcoord, 2, gl.FLOAT, false, 0, 0);

        var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

        matrix = m4.translate(matrix, dstX, dstY, 0);

        matrix = m4.scale(matrix, texWidth, texHeight, 1);

        gl.uniformMatrix4fv(u_matrix.location, false, matrix);

        gl.uniform1i(u_texture.location, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function loadImageAndCreateTextureInfo(url) {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        var textureInfo = {
            width: 1,
            height: 1,
            texture: tex,
        };
        var img = new Image();
        img.crossOrigin = "";
        img.src = url;
        img.addEventListener('load', function () {
            textureInfo.width = img.width;
            textureInfo.height = img.height;

            gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        });

        return textureInfo;
    }

    var textureInfos = [
        loadImageAndCreateTextureInfo('https://webglfundamentals.org/webgl/resources/star.jpg'),
        loadImageAndCreateTextureInfo('https://webglfundamentals.org/webgl/resources/leaves.jpg'),
        loadImageAndCreateTextureInfo('https://webglfundamentals.org/webgl/resources/keyboard.jpg'),
      ];

    var drawInfos = [];
    var numToDraw = 9;
    var speed = 60;
    for (var i = 0; i < numToDraw; ++i) {
        var drawInfo = {
            x: Math.random() * gl.canvas.width,
            y: Math.random() * gl.canvas.height,
            dx: Math.random() > 0.5 ? -1 : 1,
            dy: Math.random() > 0.5 ? -1 : 1,
            textureInfo: textureInfos[Math.random() * textureInfos.length | 0],
        };
        drawInfos.push(drawInfo);
    }

    function update(deltaTime) {
        drawInfos.forEach(function (drawInfo) {
            drawInfo.x += drawInfo.dx * speed * deltaTime;
            drawInfo.y += drawInfo.dy * speed * deltaTime;
            if (drawInfo.x < 0) {
                drawInfo.dx = 1;
            }
            if (drawInfo.x >= gl.canvas.width) {
                drawInfo.dx = -1;
            }
            if (drawInfo.y < 0) {
                drawInfo.dy = 1;
            }
            if (drawInfo.y >= gl.canvas.height) {
                drawInfo.dy = -1;
            }
        });
    }

    function draw() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clear(gl.COLOR_BUFFER_BIT);

        drawInfos.forEach(function (drawInfo) {
            drawImage(
                drawInfo.textureInfo.texture,
                drawInfo.textureInfo.width,
                drawInfo.textureInfo.height,
                drawInfo.x,
                drawInfo.y);
        });
    }

    var then = 0;

    function render(time) {
        var now = time * 0.001;
        var deltaTime = Math.min(0.1, now - then);
        then = now;

        update(time);
        draw();

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();