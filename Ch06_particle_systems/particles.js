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

function notNaN(obj, name){
    var key = '__' + name;
    obj.__defineGetter__(name, function(){
        return this[key];
    });
    obj.__defineSetter__(name, function(v) {
        if(typeof v !== 'number' || isNaN(v)){
            throw new TypeError(name + ' isNaN ' + v);
        }
        this[key] = v;
    });
}

function Vec2(x, y){
    this.x = x;
    this.y = y;
}
Vec2.prototype = {
    muls: function(n) { return new Vec2(this.x*n, this.y*n); },
    imuls: function(n) { this.x *= n; this.y *= n; return this; },

    mul: function(v) { return new Vec2(this.x*v.x, this.y*v.y); },
    imul: function(v) { this.x *= v.x; this.y *= v.y; return this; },

    divs: function(n) { return new Vec2(this.x/n, this.y/n); },
    div: function(v) { return new Vec2(this.x/v.x, this.y/v.y); },

    adds: function(n) { return new Vec2(this.x+n, this.y+n); },
    iadds: function(s) { this.x+=s; this.y+=s; return this; },

    add: function(v) { return new Vec2(this.x+v.x, this.y+v.y); },
    iadd: function(v) { this.x+=v.x; this.y+=v.y; return this;},

    subs: function(n) { return new Vec2(this.x-n, this.y-n); },
    isubs: function(s) { this.x-=s; this.y-=s; return this;},

    sub: function(v) { return new Vec2(this.x-v.x, this.y-v.y); },
    isub: function(v) { this.x-=v.x; this.y-=v.y; return this;},

    mag: function() { return Math.sqrt(this.x*this.x + this.y*this.y); },
    mag2: function() { return (this.x*this.x + this.y*this.y); },

    dot: function(v) { return this.x*v.x + this.y*v.y; },
    cross: function(v) { return this.x*v.y - this.y*v.x; },
    normalize: function() { return this.muls(1.0/this.mag()); },

    negate: function() {
        return new Vec2(-this.x, -this.y);
    },
    inegate: function() {
        this.x *= -1; this.y *= -1;
    },


    round: function() { return new Vec2(~~this.x, ~~this.y); },
    iround: function() { this.x = ~~this.x; this.y = ~~this.y; return this; },
    atan2: function() { return Math.atan2(this.x, this.y); },

    abs: function() { return new Vec2(Math.abs(this.x), Math.abs(this.y)); },

    copy: function() { return new Vec2(this.x, this.y); },
    set: function(x, y) {this.x = x; this.y = y;},
    izero: function () {
        this.x = 0;this.y = 0; return this;
    }


};
notNaN(Vec2.prototype, 'x');
notNaN(Vec2.prototype, 'y');

function fuzzy(range, base){
    return (base||0) + (Math.random()-0.5)*range*2;
}

function choose(array) {
    return array[Math.floor(Math.random()*array.length)];
}

function Particle(position) {
    this.position = position;
    this.velocity = new Vec2(0, 0);
    this.angle = 0;
    this.angularVelocity = 0;
    this.age = 0;
}
Particle.prototype = {
    maxAge: Infinity,
    update: function(td) {
        this.age += td;
        this.position.iadd(this.velocity.muls(td));
        this.angle += this.angularVelocity*td;
        return this.age < this.maxAge;
    }
};

function ParticleSystem(){
    this.particles = [];
    this.forces = [];
}
ParticleSystem.prototype = {
    update: function(td) {
        var alive = [];
        for(var i = 0; i < this.particles.length; i++) {
            var particle = this.particles[i];
            for(var j = 0; j < this.forces.length; j++) {
                var force = this.forces[j];
                force(particle, td);
            }
            if(particle.update(td)){
                alive.push(particle);
            }
        }
        this.particles = alive;
    }
};

function renderCanvasImage(ctx, particles, fade){
    for(var i = 0; i < particles.length; i++) {
        var particle = particles[i];
        ctx.save();
        if(fade){
            ctx.globalAlpha *= (fade-particle.age)/fade;
        }
        ctx.translate(particle.position.x, particle.position.y);
        ctx.rotate(particle.angle);
        ctx.drawImage(particle.image, -particle.image.width/2, -particle.image.height/2);
        ctx.restore();
    }
}

function loadImages(srcs, callback){
    var loaded = 0,
        imgs = [];
    function onload() { if(++loaded == srcs.length) callback(imgs);}
    for(var i = 0; i < srcs.length; i++) {
        var src = srcs[i],
            img = new Image();
        imgs.push(img);
        img.onload = onload;
        img.src = src;
    }
}
