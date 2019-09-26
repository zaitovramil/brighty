/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
		document.addEventListener("backbutton", dismissApp, false);
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
		var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');
        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
    }
};

function dismissApp() {
	if (navigator && navigator.app) {
		navigator.app.exitApp();
	} else {
		if (navigator && navigator.device) {
			navigator.device.exitApp();
		}
	}
};

var myGamePiece;
var myObstacles = [];
var myHighScore;
var myScore;
var myBestScore;
var mySound;
var mySoundEffect;

function startGame() {
	if (document.getElementsByTagName("audio")[0] == null) {
		mySound = new sound("./audio/sound.mp3");
		mySound.play();
	}
	mySoundEffect = new sound("./audio/noise.mp3");
	myGamePiece = new component(60, 60, "./img/firefly.png", 255, 130, "firefly");
	myGamePiece.gravity = 0.05;
	myObstacles = [];
	myHighScore = new component("20px", "Consolas", "white", 30, 50, "text");
	myScore = new component("30px", "Consolas", "white", 30, 80, "text");
	myGameArea.start();
	document.getElementById("game").style.display = "block";
	document.getElementById("menu").style.display = "none";
}

var myGameArea = {
	canvas: document.createElement("canvas"),
	start: function() {
		this.canvas.width = 568;
		this.canvas.height = 320;
		this.context = this.canvas.getContext("2d");
		document.getElementById("canvas").appendChild(this.canvas);
		this.frameNo = 0;
		this.interval = setInterval(updateGameArea, 20);
	},  
	clear: function() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	},
    stop: function() {
        clearInterval(this.interval);
	}
}

function component(width, height, color, x, y, type) {
	this.type = type;
	if (type == "firefly" || type == "spines") {
		this.image = new Image();
		this.image.src = color;
	}
	this.score = 0;
	this.width = width;
	this.height = height;
	this.speedX = 0;
	this.speedY = 0;    
	this.x = x;
	this.y = y;
	this.gravity = 0;
	this.gravitySpeed = 0;
	this.update = function() {
		ctx = myGameArea.context;
		if (type == "text") {
			ctx.font = this.width + " " + this.height;
			ctx.fillStyle = color;
			ctx.fillText(this.text, this.x, this.y);
		} else if (type == "firefly") {
			ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
		} else if (type == "spines") {
			var scale = Math.min(this.width / this.image.width, this.height / this.image.height);
			var x = (this.width / 2) - (this.image.width / 2) * scale;
			var y = (this.height / 2) - (this.image.height / 2) * scale;
			ctx.drawImage(this.image, this.x, this.y, this.image.width * scale, this.image.height * scale);
		} else {
			ctx.fillStyle = color;
			ctx.fillRect(this.x, this.y, this.width, this.height);
		}
	}
	this.newPos = function() {
		this.gravitySpeed += this.gravity;
		this.x += this.speedX;
		this.y += this.speedY + this.gravitySpeed;
		this.hitBottom();
	}
	this.hitBottom = function() {
		var rockbottom = myGameArea.canvas.height - this.height;
		if (this.y > rockbottom) {
			this.y = rockbottom;
			this.gravitySpeed = 0;
		}
		if (this.y < 0) {
			this.gravitySpeed = 0;
		}
	}
	this.crashWith = function(otherobj) {
		var myleft = this.x;
		var myright = this.x + (this.width);
		var mytop = this.y;
		var mybottom = this.y + (this.height);
		var otherleft = otherobj.x + 40;
		var otherright = otherobj.x - 40 + (otherobj.width);
		var othertop = otherobj.y + 40;
		var otherbottom = otherobj.y - 30 + (otherobj.height);
		var crash = true;
		if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
			crash = false;
		} else {
			document.getElementById("restart").style.display = "block";
			document.getElementById("push").style.display = "none";
		}
		return crash;
	}
}

function updateGameArea() {
	var x, height, gap, minHeight, maxHeight, minGap, maxGap;
	for (i = 0; i < myObstacles.length; i += 1) {
		if (myGamePiece.crashWith(myObstacles[i])) {
			mySoundEffect.play();
			setTimeout(function() {
				mySoundEffect.stop();
			}, 150);
            myGameArea.stop();
			return;
		} 
	}
	myGameArea.clear();
	myGameArea.frameNo += 1;
	if (myGameArea.frameNo == 1 || everyinterval(150)) {
		x = myGameArea.canvas.width;					
		minHeight = 60;
		maxHeight = 200;
		height = Math.floor(Math.random()*(maxHeight-minHeight+1)+minHeight);					
		minGap = 60;
		maxGap = 200;
		gap = Math.floor(Math.random()*(maxGap-minGap+1)+minGap);					
		myObstacles.push(new component(71, height, "./img/spines-up.png", x, 0, "spines"));
		myObstacles.push(new component(71, x - height - gap, "./img/spines-down.png", x, height + gap, "spines"));
	}
	for (i = 0; i < myObstacles.length; i += 1) {
		if (myGameArea.frameNo > 5000) {
			myObstacles[i].x += -3;
		} else if (myGameArea.frameNo > 2500) {
			myObstacles[i].x += -2;
		} else {
			myObstacles[i].x += -1;
		}
		myObstacles[i].update();
	}
	
	if (parseInt(localStorage.getItem('highScore')) > parseInt(myGameArea.frameNo)) {
		myBestScore = localStorage.getItem('highScore');
		localStorage.setItem('highScore', myBestScore);
	} else {
		myBestScore = myGameArea.frameNo;
		localStorage.setItem('highScore', myGameArea.frameNo);
	}
	
	myHighScore.text="BEST SCORE: " + myBestScore;
	myScore.text="SCORE: " + myGameArea.frameNo;
	myHighScore.update();
	myScore.update();
	myGamePiece.newPos();
	myGamePiece.update();
}

function everyinterval(n) {
	if (myGameArea.frameNo > 5000) {
		if ((myGameArea.frameNo / n * 3) % 1 == 0) {return true;}
		return false;
	} else if (myGameArea.frameNo > 2500) {
		if ((myGameArea.frameNo / n * 2) % 1 == 0) {return true;}
		return false;
	} else {
		if ((myGameArea.frameNo / n) % 1 == 0) {return true;}
		return false;
	}
}

function accelerate(n) {
	myGamePiece.gravity = n;
}

function sound(src) {
	this.sound = document.createElement("audio");
	this.sound.src = src;
	this.sound.setAttribute("preload", "auto");
	this.sound.setAttribute("controls", "none");
	this.sound.setAttribute("loop", "loop");
	this.sound.style.display = "none";
	document.body.appendChild(this.sound);
	this.play = function() {
		this.sound.play();
	}
	this.stop = function() {
		this.sound.pause();
	}
}

function volume() {
	var audio = document.getElementsByTagName("audio")[0];
	var button = document.getElementById("volume");
	if (audio.paused) {
		mySound.play();
		button.classList.remove("down");
	} else {
		mySound.stop();
		button.classList.add("down");
	}
}

function down() {
	var button = document.getElementById("push");
	button.classList.add("down");
}
function up() {
	var button = document.getElementById("push");
	button.classList.remove("down");
}

function restart() {
    myGameArea.stop();
    myGameArea.clear();
	document.getElementById("restart").style.display = "none";
	document.getElementById("push").style.display = "block";
	startGame();
}