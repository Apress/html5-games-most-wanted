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

var gravity = accelerationf(new Vec2(0, 10));

function dampingf(damping){
    return function(particle, td){
        particle.velocity.imuls(damping);
    };
}

function emit(system, width, height){
    var position =  new Vec2(Math.random()*width, Math.random()*height);
    for(var i = 0; i < 100; i++) {
        var particle = new Particle(position.copy());
        particle.velocity.x = fuzzy(100);
        particle.velocity.y = fuzzy(100);
        particle.image = spark;
        system.particles.push(particle);
    }
}

function main(){
    var canvas = document.getElementById('c'),
        ctx = canvas.getContext('2d'),
        system = new ParticleSystem();

    emit(system, canvas.width, canvas.height);

    window.setInterval(function() {
        if(Math.random() < 0.01){
            emit(system, canvas.width, canvas.height);
        }
        system.update(1/30);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderCanvasImage(ctx, system.particles);
    }, 1000/30); 
}
var spark = new Image();
spark.onload = main;
spark.src = 'spark.png';
