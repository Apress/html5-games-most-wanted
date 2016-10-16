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

function emit(system, images, width, height){
    // emit the particle at the center of the canvas with some random
    // variation

    var position = new Vec2(width/2+fuzzy(5), height/2+fuzzy(5)+height/4),
        particle = new Particle(position),
        alpha = fuzzy(Math.PI),
        radius = Math.sqrt(Math.random()+0.1)*100;

    particle.image = choose(images);
    radius *= 32/Math.max(25, particle.image.width);
    particle.velocity.x = Math.cos(alpha)*radius;
    particle.velocity.y = Math.sin(alpha)*radius-4;
    particle.angularVelocity = fuzzy(1.5);
    particle.angle = fuzzy(Math.PI);
    // choose a random texture

    particle.maxAge = 5;
    system.particles.push(particle);
}

function main(images){
    var canvas = document.getElementById('c'),
        ctx = canvas.getContext('2d'),
        system = new ParticleSystem();

    system.forces.push(lift);
    system.forces.push(wind);
    system.forces.push(drag);

    ctx.fillRect(0, 0, canvas.width, canvas.height);


    window.setInterval(function() {
        while(Math.random()<0.80){
            emit(system, images, canvas.width, canvas.height);
        }
        system.update(1/30);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.6;
        renderCanvasImage(ctx, system.particles);
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
    }, 1000/30); 
}
loadImages('flame.png flame.png flame0.png flame1.png flame2.png flame3.png smallspark.png'.split(' '), main);
