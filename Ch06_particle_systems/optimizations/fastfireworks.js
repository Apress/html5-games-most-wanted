/**
Copyright (C) 2011 by Jonas Wagner

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
Our current particle system performs quite well for a relatively low (~1000) number of particles.
If we need more particles than that we need to write more optimized code. This will allow us to have tens of thousands of particles. To demonstrate how to do this we will reimplement the fireworks demo in a more optimized fashion.

Please note that performance optimizations depend on the runtime environment. Optimizations that have a positive impact today can become useless or even harmful tomorrow. 

Single pixel particles

If we want to have more particles we will need to make the particles smaller to make them look right. If we restrict ourself to single pixel particles we can gain a lot of performance by manipulating the image data directly.

The 2D context of the canvas element allows this by using the get/putImageData() methods. Note that calls to get/putImageData are quite expensive. They are only worth their cost when rendering a lot of particles (~1000) otherwise falling back to fillRect/drawImage will be faster.

Typed Arrays

Another performance bottle neck is the use of objects for each particle and vector.
We can do this much more efficiently by using a large array. When we use a single array
and inline all operations we gain a lot of performance. Some of the benefits of this approach are:

* No more function call overhead
* No more memory allocation (per particle) / garbage collection overhead
* Less time spent dereferencing properties
* Reduced memory usage

WebGL introduced typed arrays to Javascript. Typed arrays are arrays that only accept a single type.
Because of this they can be stored and accesed in a more efficient matter. Their interface is mostly backwards compatible with the array interface. We can use this to fall back to normal arrays if the browser does not support typed arrays.

requestAnimationFrame
window.setInterval is not ideal for animations. The most obvious reason for this is that it is still called when the page is not visible. Another reason is synchronization with screen refreshes. If the screen is updated at regular intervals you really want your updates to be aligned with those to get a smooth result. The solution to this problems is to use request animation frame. As the specification is still a draft you will have to use the prefixed versions for each browser if it is not supported you should fall back to setInterval or setTimeout. You can do this with this simple one liner:

var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || wi    ndow.mozRequestAnimationFrame || window.msRequestAnimationFrame || function(f){window.setTimeout(f, 5); }

Micro Optimizations
We can gain some additional performance by tweaking details in the code. For example:

vy += gravity*td;
y += vy;

Can be rewritten as
y += (vy += gravity*td);

Which can be faster because vy does not need to be dereferenced anymore.

Another one of those hacks (a more practical one) is to round numbers using the
bitwise complement operator (~) for rounding. So instead of

drawImage(img, Math.floor(x), Math.floor(y));

You can use

drawImage(img, ~~x, ~~y);

*/
(function(){

// fall back to normal arrays if the browser does not support
// float 32 arrays
var MAX_PARTICLES = 100000,
    NFIELDS = 5, // x, y, vx, vy, age,
    // size of the array
    PARTICLES_LENGTH = MAX_PARTICLES * NFIELDS,

    // compatibility with legacy browsers
    Float32Array = window.Float32Array || Array,
    requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function(f){window.setTimeout(f, 5); },

    canvas = document.getElementById('c'),
    ctx = canvas.getContext('2d'),
    controls = new window.input.Handler(canvas),
    particles = new Float32Array(PARTICLES_LENGTH),
    // position to insert the next particle
    particles_i = 0,
    // time in ms
    t0 = new Date()*1,
    // some shortcuts, they don't seem to make to code faster
    PI = Math.PI,
    random = Math.random,
    cos = Math.cos,
    sin = Math.sin;

function emit(x, y) {
    for(var i = 0; i < 250; i++) {
        particles_i = (particles_i+NFIELDS) % PARTICLES_LENGTH;
        particles[particles_i] = x;
        particles[particles_i+1] = y;
        var alpha = fuzzy(PI),
            radius = random()*100,
            vx = cos(alpha)*radius,
            vy = sin(alpha)*radius,
            age = random();
        particles[particles_i+2] = vx;
        particles[particles_i+3] = vy;
        particles[particles_i+4] = age;
    }
}

function draw(){
    var t1 = new Date()*1,
        // time delta in seconds
        td = (t1-t0)/1000,
        MAX_AGE = 5,
        width = canvas.width,
        height = canvas.height,
        gravity = 50,
        drag = 0.999,
        // color
        r = 120,
        g = 55,
        b = 10;
    t0 = t1;

    // emit particles only when we have focus
    // if we don't have focus the coordinates are off anyway
    if(controls.hasFocus) {
        emit(controls.mouse.x, controls.mouse.y);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, width, height);
    var imgdata = ctx.getImageData(0, 0, width, height),
        data = imgdata.data;

    for(var i = 0; i < PARTICLES_LENGTH; i+= NFIELDS) {

        // check age
        if((particles[i+4] += td) > MAX_AGE) continue;

        // ~~ = double bitwise inversion = Math.ceil
        var x = ~~(particles[i] = (particles[i] +
                    (particles[i+2] *= drag)*td)),
            y = ~~(particles[i+1] = (particles[i+1] +
                    (particles[i+3] = (particles[i+3] + gravity*td)*drag)*td));

        // check bounds
        if(x < 0 || x >= width || y < 0 || y >= height)
            continue;

        // calculate offset
        var offset = (x+y*width)*4;

        // set pixel
        data[offset] += r;
        data[offset+1] += g;
        data[offset+2] += b;
        // dont touch alpha
    }

    ctx.putImageData(imgdata, 0, 0);

    requestAnimationFrame(draw, canvas);
}
requestAnimationFrame(draw, canvas);

})();
