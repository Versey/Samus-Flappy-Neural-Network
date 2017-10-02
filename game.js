(function() {
	var timeouts = [];
	var messageName = "zero-timeout-message";

	function setZeroTimeout(fn) {
		timeouts.push(fn);
		window.postMessage(messageName, "*");
	}

	function handleMessage(event) {
		if (event.source == window && event.data == messageName) {
			event.stopPropagation();
			if (timeouts.length > 0) {
				var fn = timeouts.shift();
				fn();
			}
		}
	}

	window.addEventListener("message", handleMessage, true);

	window.setZeroTimeout = setZeroTimeout;
})();

var Neuvol;
var game;
var FPS = 60;
var maxScore = 0;
var frame = 8;

var images = {};

var speed = function(fps){
	FPS = parseInt(fps);
}

var loadImages = function(sources, callback){
	var nb = 0;
	var loaded = 0;
	var imgs = {};
	for(var i in sources){
		nb++;
		imgs[i] = new Image();
		imgs[i].src = sources[i];
		imgs[i].onload = function(){
			loaded++;
			if(loaded == nb){
				callback(imgs);
			}
		}
	}
}
////////////////////////////////////////////////////
///////////// Character properties /////////////////
////////////////////////////////////////////////////

var Samus = function(json){
	// Position
	this.x = 300;
	this.y = 50;

	// Scale
	this.width = 46;
	this.height = 88;

	// Attributes
	this.alive = true;
	this.gravity = 0;
	this.velocity = .9;
	this.jumps = -25;
	this.grounded = false;
    this.shift = 80;
    this.frameWidth = 80;
    this.frameHeight = 86;
    this.totalFrames = 8;
    this.currentFrame = 1;
    this.runspeed = 2;

    this.faster = false;
    this.slower = false;

	this.init(json);
}

Samus.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}


Samus.prototype.jump = function(){
    if(this.grounded == true) {
    	this.y -= 3;
        this.gravity = this.jumps;
        this.grounded = false;
        //this.currentFrame = 1;
    }


}

Samus.prototype.quick = function(){

	if(this.x < 1200) {
        this.faster = true;
        this.slower = false;
    }

}

Samus.prototype.slow = function(){

    if(this.x > 100) {
        this.faster = false;
        this.slower = true
    }
}

Samus.prototype.normal = function(){
    this.faster = false;
    this.slower = false;

}

Samus.prototype.update = function() {
	this.gravity += this.velocity;
	this.y += this.gravity;


}

Samus.prototype.animate = function(context){
		// Run
	if (this.grounded) {

        var limiter = 3;
        context.drawImage(images.samusRun, this.shift, 0, this.frameWidth, this.frameHeight,
            this.x, this.y, this.frameWidth, this.frameHeight);

        if (this.faster == true){
            limiter = 3;

		}

		if (this.slower == true){
        	limiter = 6;
		}
        if (frame % limiter == 0) {

            this.currentFrame++;
            this.shift += this.frameWidth;

            if (this.currentFrame >= this.totalFrames) {
                this.shift = 0;
                this.currentFrame = 0;

            }
        }
    }

    // In the air

    else if (this.grounded == false ){

        context.drawImage(images.samusJump, this.shift, 0, this.frameWidth, this.frameHeight + 12,
            this.x, this.y, this.frameWidth, this.frameHeight + 12);

        if (frame % 3 == 0) {

            this.currentFrame++;
            this.shift += this.frameWidth;

            if (this.currentFrame >= this.totalFrames) {
                this.shift = 0;
                this.currentFrame = 0;

            }
        }
    }




}

Samus.prototype.isGrounded = function(height, grounds){

    for(var i in grounds){
        if(this.x < grounds[i].x + grounds[i].width &&
            this.x + this.width > grounds[i].x &&

            this.y <grounds[i].y + grounds[i].height &&
            this.height + this.y > grounds[i].y)

        {
        	this.grounded = true;
            return true;

        }


    }
}
Samus.prototype.isDead = function(height, platforms){
	// TO DO

	if (this.y > 512 || this.y < 0 - this.height){
        return true;
    }



	for(var i in platforms){
        if(this.x < platforms[i].x + platforms[i].width &&
            this.x + this.width > platforms[i].x &&

            this.y <platforms[i].y + platforms[i].height &&
            this.height + this.y > platforms[i].y)

		{

			console.log("dead");
			return true;

		}


	}
}

///////////////////////////////////////
/////////////Ground Tiles /////////////
///////////////////////////////////////

var Ground = function(json){
	this.x = 0;
	this.y = 0;
	this.width = 444;
	this.height = 430;
	this.speed = 5;

    this.init(json);
}

Ground.prototype.init = function (json) {
	for(var i in json){
		this[i] = json[i];
	}
}

Ground.prototype.update = function(){
    this.x -= this.speed;
}

Ground.prototype.isOut = function(){
    if(this.x + this.width < 0){
        return true;
    }
}

///////////////////////////////////////
/////////////Platforms/////////////////
///////////////////////////////////////

var Platform = function(json){
	this.x = 0;
	this.y = 0;
	this.width = 70;
	this.height = 70;
	this.speed = 5;

    this.shift = 70;
    this.frameWidth = 70;
    this.frameHeight = 70;
    this.totalFrames = 6;
    this.currentFrame = 1;

	this.init(json);
}

// Platform Tiles //
Platform.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}

Platform.prototype.update = function(){
	this.x -= this.speed;
}

Platform.prototype.isOut = function(){
	if(this.x + this.width < 0){
		return true;
	}
}

Platform.prototype.animate = function (context) {
    context.drawImage(images.platform, this.shift, 0, this.frameWidth, this.frameHeight,
        this.x, this.y, this.frameWidth, this.frameHeight);

    if (frame % 6 == 0) {

        this.currentFrame++;
        this.shift += this.frameWidth;

        if (this.currentFrame >= this.totalFrames) {
            this.shift = 0;
            this.currentFrame = 0;

        }
    }

}

///////////////////////////////////////
//////////Game Functionality //////////
///////////////////////////////////////

var Game = function(){
	this.platforms = [];
	this.grounds = [];
	this.samuss = [];

	this.score = 0;
	this.canvas = document.querySelector("#flappy");
	this.ctx = this.canvas.getContext("2d");
	this.width = this.canvas.width;
	this.height = this.canvas.height;

	this.spawnGround = 85;
	this.spawnInterval = 0;

    this.groundinterval = 0;
	this.interval = 0;

	this.gen = [];
	this.alives = 0;
	this.generation = 0;
	this.backgroundSpeed = .1;
	this.backgroundx = 0;
	this.maxScore = 0;
	this.frame = 0;
	this.begin = true;
	this.gravity = 9;

}

Game.prototype.start = function(){
	this.interval = 0;
	this.groundinterval = 0;
	this.score = 0;
	this.platforms = [];
	this.samuss = [];

	this.gen = Neuvol.nextGeneration();

	for(var i in this.gen){
		var b = new Samus();
		this.samuss.push(b)
	}
	this.generation++;
	this.alives = this.samuss.length;
}

Game.prototype.update = function(){



	this.backgroundx += this.backgroundSpeed;
	frame += 1;

    var nextHoll = 0;

    if(this.samuss.length > 0){

        for(var i = 0; i < this.platforms.length; i++){

            if(this.platforms[i].x + this.platforms[i].width < this.samuss[0].x){
                nextHoll = this.platforms[i].x - (this.samuss[i].x +this.samuss[i].width) ;
                break;
            }
        }
    }

	for(var i in this.samuss){
		if(this.samuss[i].alive){

			var inputs = [
			this.samuss[i].x / this.width,
			nextHoll
			];

			var res = this.gen[i].compute(inputs);

			if(res > 0.6){
				this.samuss[i].jump();
			}

            if(res > 0.4){
                this.samuss[i].quick();
            }

            if(res > 0.4){
                this.samuss[i].slow();
            }

            if(res > 0.5){
                this.samuss[i].normal();
            }

            if(!this.samuss[i].isGrounded(this.samuss[i].height, this.grounds)){
                this.samuss[i].update();

                if (this.samuss[i].faster == true && this.samuss[i].x < this.width / 2){
                    this.samuss[i].x += this.samuss[i].runspeed;
				}

                if (this.samuss[i].slower == true && this.samuss[i].x > 100){
                    this.samuss[i].x -= this.samuss[i].runspeed;
                }

			}

            if (this.samuss[i].faster == true && this.samuss[i].x < 1200) {
                this.samuss[i].x += this.samuss[i].runspeed;
            }

            if (this.samuss[i].slower == true && this.samuss[i].x > 100){
                this.samuss[i].x -= this.samuss[i].runspeed;
            }


			if(this.samuss[i].isDead(this.height, this.platforms)){

				this.samuss[i].alive = false;
				this.alives--;

				console.log(this.alives);

				Neuvol.networkScore(this.gen[i], this.score);
				if(this.isItEnd()){
					this.start();
				}
			}
		}
	}

	for(var i = 0; i < this.platforms.length; i++){
		this.platforms[i].update();
		if(this.platforms[i].isOut()){
			this.platforms.splice(i, 1);
			i--;
		}
	}

    for(var i = 0; i < this.grounds.length; i++){
        this.grounds[i].update();
        if(this.grounds[i].isOut()){
            this.grounds.splice(i, 1);
            i--;
        }
    }


    if(this.groundinterval == 0){
		// Initial tiles at the start
		if (this.begin) {

            var randSpacing = Math.round((Math.random() * 1200)) +  500;

            this.platforms.push(new Platform({x:randSpacing, y:366, height:this.height}));

            this.grounds.push(new Ground({x: 0, y: 430}));
            this.grounds.push(new Ground({x: 425, y: 430}));
            this.grounds.push(new Ground({x: 850, y: 430}));
            this.grounds.push(new Ground({x: 1275, y: 430}));
            this.grounds.push(new Ground({x: 1500, y: 430}));
            this.begin = false;
        }


        this.grounds.push(new Ground({x:this.width, y:430}));

    }

    if(this.interval == 0){

        var randInterval = Math.round((Math.random() * 300)) +  90;

        this.platforms.push(new Platform({x:this.width, y:366, height:this.height}));
        this.spawnInterval = randInterval ;

    }

    this.groundinterval++;
    if(this.groundinterval == this.spawnGround){
        this.groundinterval = 0;
    }

	this.interval++;
    if(this.interval == this.spawnInterval){
        this.interval = 0;
    }

	this.score++;
	this.maxScore = (this.score > this.maxScore) ? this.score : this.maxScore;


	var self = this;

	if(FPS == 0){
		setZeroTimeout(function(){
			self.update();
		});
	}else{
		setTimeout(function(){
			self.update();
		}, 1000/FPS);
	}
}


Game.prototype.isItEnd = function(){
	for(var i in this.samuss){
		if(this.samuss[i].alive){
			return false;
		}
	}

	this.begin = true;
	return true;
}

Game.prototype.scale = function (x,y){
    this.ctx.scale(x,y);
}

Game.prototype.display = function(){

	// Background Parallax //


	for(var i = 0; i < Math.ceil(this.width / images.background.width) + 1; i++){
		this.ctx.drawImage(images.background, i * images.background.width - Math.floor(this.backgroundx%images.background.width), 0)
	}

	// Platforms //
	for(var i in this.platforms){
			this.platforms[i].animate(this.ctx);


	}

	// Grounds //
    for(var i in this.grounds){
            this.ctx.drawImage(images.ground, this.grounds[i].x, this.grounds[i].y);

    }

	// Samus' //
	for(var i in this.samuss){

		if(this.samuss[i].alive){
			this.ctx.save();
            this.samuss[i].animate(this.ctx);
			//this.ctx.translate(this.samuss[i].x + this.samuss[i].width/4, this.samuss[i].y + this.samuss[i].height/3);
			this.ctx.restore();
		}
	}

	this.ctx.fillStyle = "white";
	this.ctx.font="14px consolas";
	this.ctx.fillText("FITNESS: "+ this.score, 10, 15);
	this.ctx.fillText("MAX FITNESS: "+this.maxScore, 10, 30);
	this.ctx.fillText("GENERATION: "+this.generation, 10, 45);
	this.ctx.fillText("ALIVE: "+this.alives+" / "+Neuvol.options.population, 10, 60);

	var self = this;
	requestAnimationFrame(function(){
		self.display();
	});
}

window.onload = function(){
	var sprites = {
		samusRun:"img/samusRun2.png",
		background:"img/parallax.png",
		platform:"img/plantobject.png",
		ground: "img/ground2.png",
		samusJump: "img/samusJump2.png"
	}

	var start = function(){
		Neuvol = new Neuroevolution({
			population:50,
			network:[2, [10], 1],
            elitism:0.2,            // Best networks kepts unchanged for the next
            // generation (rate).
            randomBehaviour:0.5,    // New random networks for the next generation
            // (rate).
            mutationRate:0.1,       // Mutation rate on the weights of synapses.
            mutationRange:0.5,      // Interval of the mutation changes on the
		});
		game = new Game();
		game.start();
		game.update();
		game.display();
		//game.scale(.1,.1);
	}


	loadImages(sprites, function(imgs){
		images = imgs;
		start();
	})

}
