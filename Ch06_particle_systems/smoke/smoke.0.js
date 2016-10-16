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

function accelerationf(force){
    return function(particle, td){
        particle.velocity.iadd(force.muls(td));
    };
}


function dampingf(damping){
    return function(particle, td){
        particle.velocity.imuls(damping);
    };
}

var drag = dampingf(0.975);

var lift = accelerationf(new Vec2(0, -50));

function wind(particle, td){
    particle.velocity.x += td*fuzzy(50);
}

function emit(system, images, x, y){
    // emit the particle at the center of the canvas with some random
    // variation

    var position = new Vec2(x+fuzzy(5), y+fuzzy(5)),
        particle = new Particle(position),
        alpha = fuzzy(Math.PI),
        radius = Math.sqrt(Math.random()+0.1)*35;

    particle.image = choose(images);
    particle.velocity.x = Math.cos(alpha)*radius;
    particle.velocity.y = Math.sin(alpha)*radius;
    particle.angularVelocity = fuzzy(2.0);
    particle.angle = fuzzy(Math.PI);
    // choose a random texture

    particle.maxAge = 6;
    system.particles.push(particle);
}

function main(images){
    var canvas = document.getElementById('c'),
        controls = new window.input.Handler(canvas),
        ctx = canvas.getContext('2d'),
        system = new ParticleSystem();

    system.forces.push(lift);
    system.forces.push(wind);
    system.forces.push(drag);

    ctx.fillRect(0, 0, canvas.width, canvas.height);


    window.setInterval(function() {
        system.update(1/30);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.1;
        renderCanvasImage(ctx, system.particles, 6);
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
    }, 1000/30); 
    window.setInterval(function() {
        if(controls.hasFocus) {
            emit(system, images, controls.mouse.x, controls.mouse.y);
        }
    }, 1000/10);
}
loadImages('smoke.0.png smoke.1.png smoke.2.png smoke.3.png smoke.4.png'.split(' '), main);
