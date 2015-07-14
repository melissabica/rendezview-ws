//GLOBAL VARIABLES
var container, stats;
var camera, controls, scene, renderer;

// set dimensions of area for visualization
var WIDTH = document.getElementById('lower').offsetWidth;
var leftOffset = window.innerWidth - WIDTH - parseInt(window.getComputedStyle(document.getElementById('page-content-wrapper'), null).getPropertyValue('padding-left'));
// var HEADERHEIGHT = $(document.getElementById('header')).outerHeight(true)+3 //includes margins
var HEADERHEIGHT = 	document.getElementById('upper').offsetHeight + 6 + 40; //fills whole screen height beneath header
console.log(HEADERHEIGHT);
var HEIGHT = window.innerHeight - HEADERHEIGHT;
var topOffset = parseInt(window.getComputedStyle(document.getElementById('page-content-wrapper'), null).getPropertyValue('padding-top')) + document.getElementById('upper').offsetHeight;
// console.log(WIDTH, HEIGHT)
console.log("leftOffset: "+leftOffset, " topOffset: "+topOffset);

var camera2,
	scene2,
	renderer2,
	axes2,
	container2,
	xLabel,
	yLabel,
	time,
	CANVAS_WIDTH = 100,
	CANVAS_HEIGHT = 100,
	CAM_DISTANCE = 300;
var objects = [], // list of all objects
	selectedObjects = []; //list of active (red) cubes
var tagCloud;
var mouse = new THREE.Vector2(), INTERSECTED;
	raycaster = new THREE.Raycaster();

init();

function init() {

	scene = new THREE.Scene();

	// CAMERA
	var VIEW_ANGLE = 45, ASPECT = WIDTH / HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,1500,1500);
	camera.lookAt(scene.position);	

	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	// renderer = new THREE.WebGLRenderer( { antialias: false } );
	renderer.setSize(WIDTH, HEIGHT);
	container = document.getElementById( 'visualization' );
	container.appendChild( renderer.domElement );

	// CONTROLS
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.maxPolarAngle = Math.PI/2;  //don't let camera go "underground"
	controls.userPanSpeed = 10

	// Add axes
	axes = buildAxes( 1000 );
	scene.add( axes );
	// axes = new THREE.AxisHelper( 1000 );
	// scene.add( axes );

	// STATS

	// stats = new Stats();
	// stats.domElement.style.position = 'absolute';
	// stats.domElement.style.bottom = '0px';
	// stats.domElement.style.zIndex = 100;
	// container.appendChild( stats.domElement );

	// LIGHT

	var light = new THREE.PointLight(0xaaaaaa);
	light.position.set(100,1000,100);
	scene.add(light);

	var light2 = new THREE.AmbientLight( 0x404040 );
	scene.add( light2 );

	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
	directionalLight.position.set( 3000, 10, 2000 );
	scene.add( directionalLight );

	var directionalLight2 = new THREE.DirectionalLight( 0x404040, 0.5 );
	directionalLight2.position.set( 3000, 10, -2000 );
	scene.add( directionalLight2 );

	// FLOOR
	var floorTexture = new THREE.ImageUtils.loadTexture( 'images/map-mirror2.png' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.ClampToEdgeWrapping; 
	floorTexture.minFilter = THREE.NearestFilter;
	var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
	var floorGeometry = new THREE.PlaneBufferGeometry(2000, 1237);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -1; //originally -0.5
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);


    // var test_json = $.getJSON("images/us.geojson", function (data) { 
    //     drawThreeGeo(data, 5000, 'plane', {
    //         color: 'white'
    //     })    
    // });    

	// SKYBOX
	var skyBoxGeometry = new THREE.BoxGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, side: THREE.BackSide } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	scene.add(skyBox);

	//// INSET AXES ////
	// CONTAINER
	container2 = document.getElementById('inset-axes');

	// // STATIC TIME AXIS LABEL
	// var timeLabel = document.createElement("h5");
	// timeLabel.setAttribute("id", "time-label");
	// var node = document.createTextNode("TIME");
	// timeLabel.appendChild(node);
	// var element = document.getElementById("inset-axes");
	// element.appendChild(timeLabel);

	// RENDERER
	renderer2 = new THREE.WebGLRenderer({ alpha: true });
	// renderer2.setClearColor( 0xf0f0fs0, 1 );
	renderer2.setSize( CANVAS_WIDTH, CANVAS_HEIGHT );
	container2.appendChild( renderer2.domElement );

	scene2 = new THREE.Scene();

	// CAMERA
	camera2 = new THREE.PerspectiveCamera( 50, CANVAS_WIDTH / CANVAS_HEIGHT, 1, 1000 );
	camera2.up = camera.up; // important!

	// AXES
	axes2 = new THREE.AxisHelper( 100 );
	scene2.add( axes2 );

	// AXIS LABELS
	var shape = new THREE.TextGeometry("X", 
		{size: 20,
		 height: 0,
		 curveSegments: 3,
		 font: 'helvetiker',
		 weight: 'normal'
		});
	var wrapper = new THREE.MeshBasicMaterial({color: 0x000000});
	xLabel = new THREE.Mesh(shape, wrapper);
	xLabel.position.set(100,0,0);
	scene2.add(xLabel);

	var shape2 = new THREE.TextGeometry("Y", 
		{size: 20,
		 height: 0,
		 curveSegments: 10,
		 font: 'helvetiker',
		 weight: 'normal'
		});
	yLabel = new THREE.Mesh(shape2, wrapper);
	yLabel.position.set(0,0,100);	
	scene2.add(yLabel);

	var shape3 = new THREE.TextGeometry("TIME", 
		{size: 20,
		 height: 0,
		 curveSegments: 3,
		 font: 'helvetiker',
		 weight: 'normal'
		});
	time = new THREE.Mesh(shape3, wrapper);
	time.position.set(-25,100,0);	
	scene2.add(time);

	//// RESET VIEW ////
	var resetButton = document.createElement("a");
	resetButton.setAttribute("href", "#");
	resetButton.setAttribute("class", "btn btn-primary btn-sm");
	resetButton.setAttribute("id", "reset-button");	
	var resetSpan = document.createElement("span");
	resetSpan.setAttribute("class","glyphicon glyphicon-refresh");
	resetButton.appendChild(resetSpan);
	var node = document.createTextNode(" Reset View");
	resetButton.appendChild(node);
	document.getElementById('visualization').appendChild(resetButton);
	document.getElementById("reset-button").onclick = function() { 
		console.log("reset camera view");
		controls.reset();
		// controls.center.set(0,0,0);
		// camera.position.set(0,1500,1500);
		// camera.lookAt(scene.position);
		// http://stackoverflow.com/questions/16525043/reset-camera-using-orbitcontrols-js
	}; 

	//// TAG CLOUD ////
	tagCloud = document.createElement("div");
	tagCloud.setAttribute("id", "tag-cloud");
	document.getElementById('visualization').appendChild(tagCloud);


	window.addEventListener( 'resize', onWindowResize, false );
	container.addEventListener( 'click', onDocumentMouseMove, false );

	animate();

}

// Make objects clickable
function onDocumentMouseMove( event ) {
	event.preventDefault();

	mouse.x = ( ( event.clientX - leftOffset) / WIDTH ) * 2 - 1; 
	mouse.y = - ( ( event.clientY - topOffset ) / HEIGHT ) * 2 + 1;
	// console.log(event.clientX-leftOffset, event.clientY-topOffset);
	// console.log(mouse.x, mouse.y);

	// find intersections
	raycaster.setFromCamera( mouse, camera );
	scene.updateMatrixWorld();
	var intersects = raycaster.intersectObjects( _.pluck(objects,'cube') );
	if( intersects.length > 0 ) { // if an object was clicked

		var intersect = intersects[ 0 ];
		var newSelected = intersect.object;
		// console.log(newSelected);
		var result = $.grep(objects, function(e){ return e.cube === newSelected; }); //result[0] is clicked object in objects
		//finds object in objects that has a value for cube matching newSelected
		//http://stackoverflow.com/questions/7364150/find-object-by-id-in-array-of-javascript-objects
		var originalColor = result[0].color;
		var tagStr = result[0].tags;
		var color = newSelected.material.color.getHexString().toUpperCase();
		var red = new THREE.Color( 0xFF0000 );

		if (selectedObjects.indexOf(result[0]) > -1){ // if clicked object is already selected
			console.log("Deselect - change from "+red.getHexString().toUpperCase()+" to original "+originalColor);
			newSelected.material.color.setHex( originalColor );
			if(selectedObjects.length == 1) { // if no other objects are selected
				toggleTagCloud(0);
				selectedObjects =  [];
				console.log("hide tag cloud")
			}
			else { // if other objects are still selected, remove newSelected and update word cloud
				var index = selectedObjects.indexOf(result[0]);
				selectedObjects.splice(index,1);
				toggleTagCloud(0);
				createWordCloud(_.pluck(selectedObjects,'tags'));
				toggleTagCloud(1);
			}
		}

		else { // if selecting new object
			if (selectedObjects.length > 0 && !(event.shiftKey)) { // if objects are already selected, and not pressing shift key
				for (var x in selectedObjects) { //clear selected objects
					console.log("Deselect - change from "+red.getHexString().toUpperCase()+" to original "+selectedObjects[x].color);
					selectedObjects[x].cube.material.color.setHex( selectedObjects[x].color );
				}
				toggleTagCloud(0);
				selectedObjects = [];
			}

			// select the new object
			selectedObjects.push( result[0] );
			console.log("selected object",result[0])
			console.log("Select  -  change from "+color+" to red "+red.getHexString().toUpperCase());
			newSelected.material.color.set( red );
			toggleTagCloud(0);
			console.log("tags array",_.pluck(selectedObjects,'tags'));
			createWordCloud(_.pluck(selectedObjects,'tags'));
			toggleTagCloud(1);
		}

		/* Algorithm for clicking on objects:
		if newSelected already in selectedObjects
			deselect newSelected
				- change color back to original
				- remove from selectedObjects
			if selectedObjects is empty
				- hide tag cloud
			else
				- update tag cloud
		else, newSelected not in selectedObjects
			if selectedObjects is not empty & SHIFT not clicked
				deselect all objects in selectedObjects								
			select newSelected
				- add to selectedObjects
				- change color to red
				- show tag cloud
		*/

	}
	else {
		console.log('you clicked nothing');
	}
	console.log();

}

function deselect( listItems ) {

}


function addBox( width, height, depth, xpos, ypos, color, tags ){

	var tpos = height/2 + Math.floor((Math.random() * 100));
	console.log("TPOS ",tpos);

	var geometry = new THREE.BoxGeometry( width,height,depth); 
	var color = new THREE.Color( color );
	var material =  new THREE.MeshLambertMaterial( { color: color} );
	var cube = new THREE.Mesh( geometry, material );
	cube.position.set(xpos,tpos,ypos);
	cube.name = cube.material.color.getHex();

	// var outlineMaterial1 = new THREE.MeshBasicMaterial( { color: 0xFFFF00, side: THREE.BackSide } );
	// var outlineMesh1 = new THREE.Mesh( geometry, outlineMaterial1 );
	// outlineMesh1.position.set(xpos,tpos,ypos);
	// outlineMesh1.scale.multiplyScalar(1.05);
	// scene.add( outlineMesh1 );
	
	var cubeObject = { tags: tags, //string
					   color: cube.material.color.getHex(), //number
					   cube: cube }; //object
	objects.push(cubeObject); // list of objects
	scene.add( cube );

}

function removeBoxes() {
	boxes = _.pluck(objects,'cube');

	for (var i=0; i<boxes.length; i++){
		scene.remove(boxes[i]);
	}

	objects = [];
	selectedObjects = [];

}

function buildAxes( length ) {
	var axes = new THREE.Object3D();

	//vector()
	axes.add( buildAxis( new THREE.Vector3( 0, 1, 0 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000, false ) ); // +X west
	// axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000, true) ); // -X east
	axes.add( buildAxis( new THREE.Vector3( 0, 1, 0 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00, false ) ); // +Y up
	// axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00, true ) ); // -Y down
	axes.add( buildAxis( new THREE.Vector3( 0, 1, 0 ), new THREE.Vector3( 0, 0, length ), 0x0000FF, false ) ); // +Z north
	// axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF, true ) ); // -Z south

	return axes;

}

function buildAxis( src, dst, colorHex, dashed ) {
	var geom = new THREE.Geometry(),
		mat; 

	if(dashed) {
		mat = new THREE.LineDashedMaterial({ linewidth: 100, color: colorHex, dashSize: 3, gapSize: 3 });
	} else {
		mat = new THREE.LineBasicMaterial({ linewidth: 100, color: colorHex });
	}

	geom.vertices.push( src.clone() );
	geom.vertices.push( dst.clone() );
	geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

	var axis = new THREE.Line( geom, mat, THREE.LinePieces );

	return axis;

}

function onWindowResize(){

	// Recompute renderer dimensions
	WIDTH = document.getElementById('visualization').offsetWidth;
	HEIGHT = window.innerHeight - HEADERHEIGHT;

	// Update camera and renderer
	camera.aspect = WIDTH / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( WIDTH, HEIGHT);

	//https://github.com/mrdoob/three.js/issues/69

}

function animate() {

	requestAnimationFrame( animate );
	controls.update();

	camera2.position.copy( camera.position );
	// camera2.position.sub( controls.target ); // added by @libe
	// camera2.position.sub( camera.position, controls.target );
	camera2.position.sub( controls.center );
	camera2.position.setLength( CAM_DISTANCE );

	camera2.lookAt( scene2.position );

	render();
}

function render() {

	renderer.render( scene, camera );
	renderer2.render( scene2, camera2 );
	// if ( timeLabel ) //billboarding: always have label face camera
		// timeLabel.lookAt( camera.position );
	xLabel.quaternion.copy( camera.quaternion );
	yLabel.quaternion.copy( camera.quaternion );
	time.quaternion.copy( camera.quaternion );
	// stats.update();
}


//// ADD BOXES ////
//addBox( width, height, depth, xpos, ypos, color, tags )			
// addBox(100,200,100,0,10,'#4B3BFF',"(HT)HOSPITALITY:6 MS:1 MANAGER:1 SONIC:15 ASSISTANT:10");
addBox(100,100,100,200,200,'#B6B0FF',"UNITE:1 LONDON:1 BREAK:1 CENTRAL:1 GLAD:1 GUY:5 UNITE:6 (HT)SUMMER:1");
addBox(100,50,100,-200,200,'#8175FF',"HEART:1 CALL:5 DELETE:4 ANXIETY:3 GLAD:1 ENJOY:2");
