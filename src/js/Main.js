/**
 * Created by unctrl.com
 * User: mannytan
 * Date: 03/20/12
 */

var PINECONE = PINECONE || {};

PINECONE.Params = {};
PINECONE.Sliders = {};

PINECONE.Main = function(name) {
	var scope = this;

	UNCTRL.BoilerPlate.call(this);

	this.name = 'Main';
	this.isPaused = false;

	// dat.gui
	this.gui = null;
	this.guiWidth = 300;
	this.guiContainer = null;

	// stage
	this.stageWidth = window.innerWidth - this.guiWidth;
	this.stageHeight = window.innerHeight;
	this.stageOffsetX = ((window.innerWidth - this.stageWidth) * 0.5) | 0;
	this.stageOffsetY = ((window.innerHeight - this.stageHeight) * 0.5) | 0;

	// stats
	this.stats = new Stats();

	// 3d
	this.pinecone3D = null;

	this.count = 0;
	this.init = function() {
		this.traceFunction("init");
		this.createListeners();
		this.createGui();

		this.pinecone3D = new PINECONE.Pinecone3D("Pinecone3D");
		this.pinecone3D.init();
		this.pinecone3D.setDimensions(this.stageWidth,this.stageHeight);
		this.pinecone3D.createEnvironment(0xEEEEEE);
		this.pinecone3D.createLights();
		// this.pinecone3D.createBackgroundElements();
		this.pinecone3D.createForegroundElements();
		this.pinecone3D.hideElements();
		this.pinecone3D.createListeners();

		this.loader = document.getElementById('loader');

		document.body.appendChild(this.stats.domElement);

		// stop the user getting a text cursor
		document.onselectStart = function() {
			return false;
		};

		this.resize();
		this.play();

		return this;
	};

	this.createGui = function() {

		PINECONE.Params = {
			currentFoldAmount: 0.0001,
			range: 0.25,
			speed: 0.002,
			orbitSpeed: 0.0001,
			foldDampened: .5,
			elasticity: 0.02,
			smoothness: 0.9,
		};

		this.gui = new dat.GUI({
			width: this.guiWidth,
			autoPlace: false
		});

		this.guiContainer = this.gui.domElement;
		PINECONE.Sliders.currentFoldAmount = this.gui.add(PINECONE.Params, 'currentFoldAmount', -1.0, 1.0).step(0.0005);
		this.gui.add(PINECONE.Params, 'range', -0.25, 0.25).step(0.0001).name('range');
		this.gui.add(PINECONE.Params, 'speed', -0.1, 0.1).step(0.0001).name('speed');
		this.gui.add(PINECONE.Params, 'foldDampened', 0.0, .99).step(0.0005).name('foldDampened');
		this.gui.add(PINECONE.Params, 'elasticity', 0.0, .99).step(0.0005).name('elasticity');
		this.gui.add(PINECONE.Params, 'smoothness', 0.0, .99).step(0.0005).name('smoothness');
		this.guiContainer = document.getElementById('guiContainer');
		this.guiContainer.appendChild(this.gui.domElement);

		return this;

	};

	this.update = function() {

		this.count+=PINECONE.Params.speed;
		var percentage = this.count*Math.PI*2;

		PINECONE.Sliders.currentFoldAmount.setValue(Math.cos(percentage)*PINECONE.Params.range);

		this.pinecone3D.parse();
		this.pinecone3D.draw();

		return this;
	};

	this.loop = function() {

		this.stats.update();
		this.update();
		if (this.isPaused) {
			return this;
		}
		requestAnimationFrame(function() {
			scope.loop();
		});

		return this;

	};

	this.perspectiveToggle = function() {

		if (PINECONE.Params.perspective === false) {
			PINECONE.Params.perspective = true;
			this.pinecone3D.toPerspective();
		} else {
			PINECONE.Params.perspective = false;
			this.pinecone3D.toOrthographic();
		}

		return this;
	};

	this.pausePlayToggle = function() {

		if (scope.isPaused) {
			this.play();
		} else {
			this.pause();
		}
	};

	this.play = function() {

		this.isPaused = false;
		this.pinecone3D.enableTrackBall();
		this.loop();

		return this;
	};

	this.pause = function() {

		this.isPaused = true;
		this.pinecone3D.disableTrackBall();
		if (this.source) this.source.disconnect();

		return this;
	};

	this.createListeners = function() {

		window.addEventListener('keydown', function() {
			scope.keyDown(event);
		}, false);

		window.addEventListener('resize', function() {
			scope.resize(event);
		}, false);

		return this;
	};

	this.keyDown = function(event) {

		if (event.keyCode === 32) {
			this.pausePlayToggle();
		}

		return this;
	};

	this.resize = function() {

		this.stageWidth = window.innerWidth - this.guiWidth;
		this.stageHeight = window.innerHeight;

		this.pinecone3D.setDimensions(this.stageWidth,this.stageHeight);
		this.pinecone3D.resize();

		return this;
	};

};

PINECONE.Main.prototype = new UNCTRL.BoilerPlate();
PINECONE.Main.prototype.constructor = PINECONE.Main;