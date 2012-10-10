/**
 * Created by unctrl.com
 * User: mannytan
 * Date: 8/22/11
 */


PINECONE.Pinecone3D = function(name) {
	var scope = this;
	var supeScope = PINECONE.Pinecone3D.prototype;

	PINECONE.BoilerPlate3D.call(this);

	this.name = 'Pinecone3D';

	// vars specific to Pinecone
	this.sphere = null;
	this.sphereSegmentsWidth = 20;
	this.sphereSegmentsHeight = 20;

	this.originPoints = null;
	this.activePoints = null;
	this.plotterPoints = null;
	this.pointData = null;
	this.vectorLine = null;

	this.deltaLines = null;

	// ROTATION AXIS
	this.rotationVector = null;
	this.centerVector = null;
	this.offsetRotationVector = null;

	this.count = 0;

	this.plotters = [];

	this.init = function() {

		this.traceFunction("init");

		return this;
	};

	this.createForegroundElements = function() {

		var i, x, y, z, 
			point,
			faceNormal,
			geometry,
			vertex,
			material,
			plotter,
			line;

		this.originPoints = [];
		this.activePoints = [];
		this.plotterPoints = [];
		this.pointData = [];
		this.deltaLines = [];

		this.total = (this.sphereSegmentsWidth + 1) * (this.sphereSegmentsHeight + 1);

		// VECTOR
		this.rotationVectorNormal = new THREE.Vector3();
		this.rotationVector = new THREE.Vector3(0,4,10);
		this.rotationVector.normalize();
		this.rotationVector.multiplyScalar(100);
		this.centerVector = new THREE.Vector3(Math.random()*100,Math.random()*100,Math.random()*100);
		this.offsetRotationVector = new THREE.Vector3();

		// VECTOR LINE
		geometry = new THREE.Geometry();
		geometry.vertices.push(
			this.centerVector.clone(),
			this.rotationVector.clone()
		);
		material = new THREE.LineBasicMaterial({ color: 0x009900, lineWidth: 1 });
		this.vectorLine = new THREE.Line(geometry, material);
		this.base.add(this.vectorLine);

/*
		// BASE SPHERE
		geometry =  new THREE.SphereGeometry( 200, this.sphereSegmentsWidth, this.sphereSegmentsHeight );
		material = new THREE.MeshBasicMaterial({color:0x000000, opacity:0.125, wireframe:true});
		this.sphere = new THREE.Mesh( geometry, material);
		// this.base.add(this.sphere);

		for(i=0;i<this.total;i++){
			this.sphere.geometry.vertices[i].addSelf(new THREE.Vector3(Math.random()*10,Math.random()*10,Math.random()*10));
		}
*/
		// BASE SPHERE
		geometry =  new THREE.IcosahedronGeometry( 200, 3 );
		material = new THREE.MeshBasicMaterial({color:0x000000, opacity:0.125, wireframe:true});
		this.sphere = new THREE.Mesh( geometry, material);
		this.base.add(this.sphere);

		this.total = this.sphere.geometry.vertices.length;

		for(i=0;i<this.total;i++){
			this.sphere.geometry.vertices[i].addSelf(new THREE.Vector3(Math.random()*10,Math.random()*10,Math.random()*10));
		}

		// PARTICLES
		for(i=0;i<this.total;i++){

			geometry = new THREE.Geometry();
			vertex = new THREE.Vector3();
			geometry.vertices.push( vertex );

			material = new THREE.ParticleBasicMaterial( { size: 4,color: 0x00FF00	} );
			particle = new THREE.ParticleSystem( geometry, material );
			this.originPoints.push(particle);
			// this.base.add(particle);

			material = new THREE.ParticleBasicMaterial( { size: 4,color: 0x0000FF	} );
			particle = new THREE.ParticleSystem( geometry, material );
			this.activePoints.push(particle);
			// this.base.add(particle);

			material = new THREE.ParticleBasicMaterial( { size: 4,color: 0x000000	} );
			particle = new THREE.ParticleSystem( geometry, material );
			this.plotterPoints.push(particle);
			// this.base.add(particle);

			this.pointData.push({ distance:1, maxDistance:1.0, minDistance:1.0, normal:0.0, inverseNormal:1.0 });

		}

		// PARTICLE POSITIONS ARE SET TO SPHERE GEOMETRY
		for(i=0;i<this.total;i++){

			this.originPoints[i].position.copy(this.sphere.geometry.vertices[i]);
			this.activePoints[i].position.copy(this.sphere.geometry.vertices[i]);
			this.plotterPoints[i].position.copy(this.sphere.geometry.vertices[i]);
		
		}

		// LINES BETWEEN OSCILLATION AND ROTATED POINTS
		for(i=0;i<this.total;i++){
			geometry = new THREE.Geometry();
			geometry.vertices.push(
				this.activePoints[i].position,
				this.plotterPoints[i].position
			);

			material = new THREE.LineBasicMaterial({ color: 0x000000, lineWidth: 1, opacity:.125});
			line = new THREE.Line(geometry, material);
			this.deltaLines.push(line);
			this.base.add(line);
		}

		// PLOTTER POSITIONS ARE SET TO SPHERE GEOMETRY
		for(i=0;i<this.total;i++){

			plotter = { 
				a:this.sphere.geometry.vertices[i].clone(),
				b:this.sphere.geometry.vertices[i].clone(),
				c:this.sphere.geometry.vertices[i].clone(),
				d:this.sphere.geometry.vertices[i].clone(),
				e:this.sphere.geometry.vertices[i].clone(),
				f:this.sphere.geometry.vertices[i].clone()
			};

			this.plotters.push(plotter);

		}

		// 
		this.setDistanceNormals({pointCloud:this.originPoints, center:this.centerVector});

		return this;
	};

	this.parse = function() {

		this.setDistanceNormals({pointCloud:this.originPoints, center:this.centerVector});
		
		var a,b,c,e,f;
		var originParticle, activeParticle, tVector,rotationAmount, percentage;
		var currentFoldAmount = PINECONE.Params.currentFoldAmount;
		var smoothnessAmount = PINECONE.Params.smoothness;
		var elasticityAmount = PINECONE.Params.elasticity;

		this.count+=.01
		percentage = this.count*Math.PI*2;
		this.rotationVector.x = Math.cos(this.count*Math.PI*2 + 1.0)*100;
		this.rotationVector.y = Math.sin(this.count*Math.PI*2 + 0.5)*100;
		this.rotationVector.z = Math.cos(this.count*Math.PI*2 + 1.5)*100;

		this.vectorLine.geometry.vertices[0].copy(this.centerVector);
		this.offsetRotationVector.add(this.rotationVector,this.centerVector);
		this.vectorLine.geometry.vertices[1].copy(this.offsetRotationVector);

		this.rotationVectorNormal.copy(this.rotationVector);
		this.rotationVectorNormal.normalize();

		for(i=0;i<this.total;i++){
			originParticle = this.originPoints[i];
			activeParticle = this.activePoints[i];

			originParticle.position.subSelf(this.centerVector);
			activeParticle.position.subSelf(this.centerVector);

			tVector = this.rotateAroundAxis(originParticle.position, this.rotationVectorNormal, currentFoldAmount*Math.PI*2);
			activeParticle.position.copy(tVector);
			
			originParticle.position.addSelf(this.centerVector);
			activeParticle.position.addSelf(this.centerVector);
		}


		for(i=0;i<this.total;i++){
			activeParticle = this.activePoints[i];
			plotterParticle = this.plotterPoints[i];
			a = this.plotters[i].a;
			b = this.plotters[i].b;
			c = this.plotters[i].c;
			d = this.plotters[i].d;
			e = this.plotters[i].e;
			f = this.plotters[i].f;
			elasticity = elasticityAmount*this.pointData[i].inverseNormal + .01;
			smoothness = smoothnessAmount*this.pointData[i].normal;

			a = activeParticle.position.clone();
			b.copy(e);
			c.copy(f);

			// d = ((a-b)*(ELASTICITY)) + b;
			d.sub(a,b);
			d.multiplyScalar(elasticity);
			d.addSelf(b);

			// e = b-(b-c)-(b-d);
			// e = c+d-b;
			e.add(c,d);
			e.subSelf(b);

			// f = e-((b-e)*SMOOTHNESS);
			f.sub(b,e);
			f.multiplyScalar(smoothness);
			f.multiplyScalar(-1);
			f.addSelf(e);

			this.plotterPoints[i].position.copy(f);

		}

		for(i=0;i<this.total;i++){

			this.sphere.geometry.vertices[i].copy(this.plotterPoints[i].position);

		}
		
		for(i=0;i<this.total;i++){
			this.deltaLines[i].material.opacity = this.pointData[i].inverseNormal +.03;
		}
		
		return this;
	};


	this.draw = function() {
		var i;

		for(i=0;i<this.total;i++){
			this.activePoints[i].geometry.vertices.verticesNeedUpdate = true;
			this.originPoints[i].geometry.vertices.verticesNeedUpdate = true;
			this.plotterPoints[i].geometry.vertices.verticesNeedUpdate = true;
		}
		
		for(i=0;i<this.total;i++){

			this.deltaLines[i].geometry.verticesNeedUpdate = true;
			// this.deltaLines[i].material.needsUpdate = true

		}
		
		this.vectorLine.geometry.verticesNeedUpdate = true;

		this.sphere.geometry.verticesNeedUpdate = true;

		this.trackball.update();
		this.renderer.render(this.scene, this.camera);

		return this;
	};

	// SET DISTANCES DATA BASED ON PROXIMITY TO FOLD
	this.setDistanceNormals = function(obj){

		obj.center = (!obj.center) ? obj.center : this.centerVector;
		obj.pointCloud = (!obj.pointCloud) ? obj.pointCloud : this.originPoints;

		var distance;
		var maxDistance = 0;
		var minDistance = 10000;
		var foldDampened = PINECONE.Params.foldDampened;

		for(i=0;i<this.total;i++){
			distance = obj.pointCloud[i].position.distanceTo(obj.center);
			if(distance > maxDistance){
				maxDistance = distance;
			}
			if(distance < minDistance){
				minDistance = distance;
			}
			this.pointData[i].distance = distance;
		}

		for(i=0;i<this.total;i++){
			this.pointData[i].maxDistance = maxDistance;
			this.pointData[i].minDistance = minDistance;
			this.pointData[i].normal = (this.pointData[i].distance - minDistance) / (maxDistance - minDistance) + foldDampened;
			this.pointData[i].normal = clamp(0,1,this.pointData[i].normal);
			this.pointData[i].normal -= foldDampened
			this.pointData[i].normal *= 1/(1-foldDampened);
			this.pointData[i].inverseNormal = 1 - this.pointData[i].normal;
		}

		return this;
	};


};

PINECONE.Pinecone3D.prototype = new PINECONE.BoilerPlate3D();
PINECONE.Pinecone3D.prototype.constructor = PINECONE.Pinecone3D;