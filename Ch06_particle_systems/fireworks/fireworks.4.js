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

function gravity(particle, td){
    particle.velocity.y += td*10;
}

function accelerationf(force){
    return function(particle, td){
        particle.velocity.iadd(force.muls(td));
    };
}

var gravity = accelerationf(new Vec2(0, 50));

function dampingf(damping){
    return function(particle, td){
        particle.velocity.imuls(damping);
    };
}

var drag = dampingf(0.97);

function wind(particle, td){
    particle.velocity.x += td*Math.random()*50;
}

function emit(system, width, height){
    var position =  new Vec2(Math.random()*(width-100)+50, Math.random()*(height-100)+50);
    for(var i = 0; i < 1000; i++) {
        var particle = new Particle(position.copy()),
            alpha = fuzzy(Math.PI),
            radius = Math.random()*10;
        radius*=radius;
        particle.velocity.x = Math.cos(alpha)*radius;
        particle.velocity.y = Math.sin(alpha)*radius;
        particle.image = spark;
        particle.maxAge = fuzzy(0.5, 2);
        system.particles.push(particle);
    }
}

function main(){
    var canvas = document.getElementById('c'),
        ctx = canvas.getContext('2d'),
        system = new ParticleSystem();

    system.forces.push(gravity);
    system.forces.push(wind);
    system.forces.push(drag);

    emit(system, canvas.width, canvas.height);

    window.setInterval(function() {
        if(Math.random() < 0.02){
            emit(system, canvas.width, canvas.height);
        }
        system.update(1/30);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'lighter';
        renderCanvasImage(ctx, system.particles);
        ctx.globalCompositeOperation = 'source-over';
    }, 1000/30); 
}
var spark = new Image();
spark.onload = main;
spark.src = 'spark.png';
