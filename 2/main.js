var app = (function(image) {

      
      var canvas = document.getElementsByTagName('canvas')[0];
      var gl = canvas.getContext('webgl');

      var drawCanvas = document.createElement('canvas');
      drawCanvas.width = image.width;
      drawCanvas.height = image.height;
      var context = drawCanvas.getContext('2d');
      context.drawImage(image, 0, 0 );
      var rawData = context.getImageData(0, 0, image.width, image.height);
      var pixelData = rawData.data;
      
      var points = [];
    

      var r,g,b,a;
      for (var i = 0, pixelIndex = 0; i < pixelData.length; i+=4, pixelIndex++) {
            
            r = pixelData[i];
            g = pixelData[i + 1];
            b = pixelData[i + 2];
            a = pixelData[i + 3];
            
            if(a > 0) {
                  
                  var x = pixelIndex % rawData.width;
                  var y = Math.floor(pixelIndex / rawData.height);
                  
                  if(x != 0) {
                        x = x * (1 / rawData.width);
                  }

                  if(y != 0) {
                        y = -y * (1 / rawData.height); 
                  }
                  
                  x -= 0.5;
                  y += 0.5;
                  var point = {
                        x : x,
                        y : y,

                        originX : x,
                        originY : y,
                        
                        color : {
                              r : r / 255,
                              g : g / 255,
                              b : b / 255
                        }
                  };

                  points.push(point);
            }

            
      }


      var mouseX = 0;
      var mouseY = 0;
      canvas.addEventListener('click', function (event) {

            if(explode) {
                  explode = false;
                  return;
            }

            console.log(event);
            mouseX = (event.offsetX / 250) - 1; 
            mouseY = -((event.offsetY / 250) - 1);

            var pt;
            var dx;
            var dy;
            var radian;
            for (var i = 0; i < points.length; i++) {
                  pt = points[i];

                  dx = pt.x - mouseX;
                  dy = pt.y - mouseY;
       
                  radian =  Math.atan2(dy, dx);
       
                  pt.vx = (Math.cos(radian) * 10) / 500;
                  pt.vy = (Math.sin(radian) * 10) / 500;

                  pt.gravity = (Math.random() / 500) + 0.0005;

            }

            explode = true;
      })

      var explode = false;
      
      function updatePoint (pt) {
            
            if(explode) {
                  
                  pt.x += pt.vx;
                  pt.y += pt.vy;

                  pt.vy -=pt.gravity;
                  if(pt.x < -1) {
                     pt.x = -1;
                  } else if(pt.x > 1) {
                     pt.x = 1;
                  }

                  if(pt.y < -1) {
                        pt.y = -1;
                  } else if(pt.x > 1) {
                        pt.y = 1;
                  }

            } else {

                  
                  pt.x += (pt.originX - pt.x) / 10;
                  pt.y += (pt.originY - pt.y) / 10;

            }                
           
      }


      var vertexSource  = `
      attribute vec2 a_position;
      attribute vec3 a_color;
      varying vec3 color;
      void main() {
            
            color = a_color;
            gl_Position = vec4(a_position.x, a_position.y, 0.0, 1.0);
            gl_PointSize = 11.0;
      }`;
      
      var fragmentSource = `
            precision mediump float;
            varying vec3 color;
            void main() {
                  gl_FragColor = vec4(color, 1.0);
            }`;

      var pixelPositions = new Float32Array(points.length * 2);
      var pixelColors = new Float32Array(points.length * 3);

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, pixelPositions , gl.STREAM_DRAW);
      
      const colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, pixelColors, gl.STREAM_DRAW);

      var vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexSource);
      gl.compileShader(vertexShader);
      var vertexStatus = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
      if(!vertexStatus) {
           var log = gl.getShaderInfoLog(vertexShader);
           console.log(log);
      }

      var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentSource);
      gl.compileShader(fragmentShader);
      
      var fragmentStatus = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
      if(!fragmentStatus) {
           var log = gl.getShaderInfoLog(fragmentShader);
           console.log(log);
      }

      var shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader); 
      gl.attachShader(shaderProgram, fragmentShader); 
      gl.linkProgram(shaderProgram);
      
      var a_position = gl.getAttribLocation(shaderProgram, "a_position");
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
      
      var a_color = gl.getAttribLocation(shaderProgram, "a_color");
      gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 0, 0);
      

      function update() {
       
            var pt;
            for (var i = 0, posInx = colorInx = 0; i < points.length; i++, posInx += 2, colorInx += 3) {
                  
                  pt = points[i];
                  updatePoint(pt);
                  pixelPositions[posInx] = pt.x;
                  pixelPositions[posInx + 1] = pt.y;

                  pixelColors[colorInx] = pt.color.r;
                  pixelColors[colorInx + 1] = pt.color.g;
                  pixelColors[colorInx + 2] = pt.color.b;
            }

            gl.clearColor(7 / 255, 120 / 255, 200 / 255, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            gl.useProgram(shaderProgram);

            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, pixelPositions , gl.STREAM_DRAW);
            gl.enableVertexAttribArray(a_position);
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, pixelColors, gl.STREAM_DRAW);
            gl.enableVertexAttribArray(a_color);
            gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.POINTS, 0, points.length);

            requestAnimationFrame(update);
      }

      update();
});

var image = new Image();
image.onload = function() {
      app(image);
};
image.src = 'cake.png';