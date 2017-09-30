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
	this.x = 400;
	this.y = 340;

	// Scale
	this.width = 88;
	this.height = 46;

	// Attributes
	this.alive = true;
	this.gravity = .6;
	this.velocity = 15;
	this.jumps = -6;
	this.grounded = true;

    this.shift = 80;
    this.frameWidth = 80;
    this.frameHeight = 86;
    this.totalFrames = 8;
    this.currentFrame = 1;

    this.runspeed = 3;

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

	if (this.grounded == true)
    {
        this.grounded = false;
    }

}

Samus.prototype.quick = function(){

	if(this.grounded == true && this.x < 1200) {
        this.faster = true;
        this.slower = false;
    }

}

Samus.prototype.slow = function(){

    if(this.grounded == true && this.x > 100) {
        this.faster = false;
        this.slower = true
    }
}

Samus.prototype.normal = function(){
    this.faster = false;
    this.slower = false;

}

Samus.prototype.update = function(){

    this.y += this.gravity;

    if (this.faster == true){
    	this.x += this.runspeed;
	}

	else if (this.slower == true){
    	this.x -= this.runspeed;
	}

    if(this.grounded == false){
    	this.y -= this.velocity;
    	this.velocity -= this.gravity;
	}

	if (this.y >= 340){
		this.y = 340;
		this.grounded = true;
    }


}

Samus.prototype.animate = function(context){


		// Run
	if (this.grounded) {

        var limiter = 5;
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
        context.drawImage(images.samusRun, this.shift, 0, this.frameWidth, this.frameHeight,
            this.x, this.y, this.frameWidth, this.frameHeight);

        if (frame % 5 == 0) {

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

}

Samus.prototype.isDead = function(height, platforms){
	// TO DO
	for(var i in platforms){
		if (this.x < platforms[i].x + platforms[i].width
		&& this.x + this.width > platforms[i].x){

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
	this.height = 97;
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
	this.width = 189;
	this.height = 158;
	this.speed = 5;

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
	this.backgroundSpeed = .3;
	this.backgroundx = 0;
	this.maxScore = 0;
	this.frame = 0;
	this.begin = true;

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

	//console.log("Current frame: " + this.frame);

	var nextHoll = 0;

	if(this.samuss.length > 0){
		for(var i = 0; i < this.platforms.length; i+=2){
			if(this.platforms[i].x + this.platforms[i].width > this.samuss
					[0].x){
				nextHoll = this.platforms[i].height/this.height;
				break;
			}
		}

        for(var i = 0; i < this.grounds.length; i+=2){
            if(this.grounds[i].x + this.grounds[i].width > this.samuss
                    [0].x){
                nextHoll = this.grounds[i].height/this.height;
                break;
            }
        }
	}

	for(var i in this.samuss){
		if(this.samuss[i].alive){

			var inputs = [
			this.samuss[i].y / this.height,
			nextHoll
			];

			var res = this.gen[i].compute(inputs);

			if(res > 0.46){
				this.samuss[i].jump();
			}

            if(res > 0.44){
                this.samuss[i].quick();
            }
            if(res > 0.45){
                this.samuss[i].slow();
            }

            if(res > 0.455){
                this.samuss[i].normal();
            }

			this.samuss[i].update();

			if(this.samuss[i].isDead(this.height, this.platforms)){
				this.samuss[i].alive = false;
				this.alives--;
				//console.log(this.alives);
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
            this.grounds.push(new Ground({x: 0, y: 430, height: 0}));
            this.grounds.push(new Ground({x: 425, y: 430, height: 0}));
            this.grounds.push(new Ground({x: 850, y: 430, height: 0}));
            this.grounds.push(new Ground({x: 1275, y: 430, height: 0}));
            this.grounds.push(new Ground({x: 1500, y: 430, height: 0}));
            this.begin = false;
        }


        this.grounds.push(new Ground({x:this.width, y:430, height:0}));

    }

    if(this.interval == 0){
        this.platforms.push(new Platform({x:this.width, y:340, height:this.height}));
        this.spawnInterval = Math.floor((Math.random() * 500) + 80);
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
	return true;
}

Game.prototype.display = function(){

	// Background Parallax //
	this.ctx.clearRect(0, 0, this.width, this.height);
	for(var i = 0; i < Math.ceil(this.width / images.background.width) + 1; i++){
		this.ctx.drawImage(images.background, i * images.background.width - Math.floor(this.backgroundx%images.background.width), 0)
	}

	// Platforms //
	for(var i in this.platforms){
			this.ctx.drawImage(images.platform, this.platforms[i].x, this.platforms[i].y);

	}

	// Grounds //
    for(var i in this.grounds){
            this.ctx.drawImage(images.ground, this.grounds[i].x, this.grounds[i].y);

    }

	//this.ctx.fillStyle = "#FFC600";
	//this.ctx.strokeStyle = "#CE9E00";


	// Samus' //
	for(var i in this.samuss){
		if(this.samuss[i].alive){
			this.ctx.save();
            this.samuss[i].animate(this.ctx);

			this.ctx.translate(this.samuss[i].x + this.samuss[i].width/2, this.samuss[i].y + this.samuss[i].height/2);

			//this.ctx.drawImage(images.samus, -this.samuss[i].width/2, -this.samuss[i].height/2, this.samuss[i].width, this.samuss[i].height);
			this.ctx.restore();
		}
	}

	this.ctx.fillStyle = "white";
	this.ctx.font="20px consolas";
	this.ctx.fillText("Fitness : "+ this.score, 10, 75);
	this.ctx.fillText("Max Fitness : "+this.maxScore, 10, 100);
	this.ctx.fillText("Generation : "+this.generation, 10, 125);
	this.ctx.fillText("Alive : "+this.alives+" / "+Neuvol.options.population, 10, 150);

	var self = this;
	requestAnimationFrame(function(){
		self.display();
	});
}

window.onload = function(){
	var sprites = {
		samusRun:"./img/samusRun2.png",
		background:"./img/parallax.png",
		platform:"./img/platform.png",
		ground: "./img/ground.png",
		samusJump: "./img/samusJump.png"
	}

	var start = function(){
		Neuvol = new Neuroevolution({
			population:50,
			network:[2, [2], 1],
		});
		game = new Game();
		game.start();
		game.update();
		game.display();
	}


	loadImages(sprites, function(imgs){
		images = imgs;
		start();
	})

}
