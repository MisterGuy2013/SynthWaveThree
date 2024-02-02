// Create the scene
const bgColor = new THREE.Color(0x23024D);
      const scene = new THREE.Scene();
      scene.background = bgColor;
      // Create the camera
      const camera = new THREE.PerspectiveCamera(
        75, // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
      );

      // Create the renderer
      const renderer = new THREE.WebGLRenderer({ antialias: 10 });
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);
renderer.gammaOutput = true;
renderer.outputColorSpace = THREE.sRGBEncoding;
var controls = new THREE.OrbitControls(camera, renderer.domElement);

// Use the renderer to render the scene to a texture


// Create an EditablePlane object


// Create a PerlinNoise object with a seed value of 42
const perlinNoise = new PerlinNoise(42);
// Create an EditablePlane with 100 units width and height, and 100 subdivisions
const length = 175;
const width = 80;
var planeWire, planeSolid;
var visiblePlane, wireFrameMesh;

var groundMaterial = new THREE.MeshBasicMaterial( {
    color: 0x110124, // set the color to 28, 2, 64 in hexadecimal format
    side: THREE.DoubleSide, // make the material double-sided
} );
  planeSolid = new THREE.PlaneGeometry(width, length, width, length);
  planeSolid = applyNoise(planeSolid, perlinNoise, 8, 1, 0);

  visiblePlane = new THREE.Mesh(planeSolid, groundMaterial);
  visiblePlane.rotation.set(Math.PI/2,0,0);
  visiblePlane.position.set(0,0,-length/2+10);
  visiblePlane.matrixWorldNeedsUpdate = true;
  
  wireFrameMesh = makeGeometry(width, length, width, length, perlinNoise, 8, 1, 0);
  wireFrameMesh.position.set(0,0.001,-length/2+10);
  wireFrameMesh.rotation.set(Math.PI/2,0,0);
  wireFrameMesh.matrixWorldNeedsUpdate = true;


function updatePlane(z){
  planeSolid = new THREE.PlaneGeometry(80, length, 80, length);
  planeSolid = applyNoise(planeSolid, perlinNoise, 8, 1, z);

  visiblePlane.geometry = planeSolid, groundMaterial
  visiblePlane.rotation.set(Math.PI/2,0,0);
  visiblePlane.position.set(0,0,-length/2+10);
  visiblePlane.matrixWorldNeedsUpdate = true;
  
  wireFrameMesh.geometry = makeGeometry(width, length, width, length, perlinNoise, 8, 1, z).geometry;
  wireFrameMesh.position.set(0,0.01,-length/2+10);
  wireFrameMesh.rotation.set(Math.PI/2,0,0);
  wireFrameMesh.matrixWorldNeedsUpdate = true;
}
updatePlane(0);

scene.add(visiblePlane);
scene.add(wireFrameMesh);





// Create an ambient light to add some overall brightness to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Create a directional light to simulate the sun's position and add some highlights and shadows
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 5, 5);
//scene.add(directionalLight);




      // Add a light source to the scene
      var pointLight = new THREE.PointLight( 0xffffff, 3 );
      pointLight.position.set(0,5,10);
      //scene.add(pointLight);

camera.rotation.set(-Math.PI/2,0,0);
camera.position.set(-10,-10,-10);
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
renderer.setRenderTarget(renderTarget);
renderer.render(scene, camera);

// Get the texture from the render target
const bgTexture = renderTarget.texture;

var sunMesh;
var blockMesh;

const scale = 0.5;
const sunGeometry = new THREE.PlaneGeometry(192 * scale, 108 * scale);
const blocker = new THREE.PlaneGeometry(192 * 5 * scale, 108 * 5 * scale);
var sunMaterial = new THREE.MeshBasicMaterial({ transparent: true });
var blockerMaterial = new THREE.MeshBasicMaterial({color:0x23024D});

sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
blockMesh = new THREE.Mesh(blocker, blockerMaterial);
sunMesh.position.set(0, 11.5, -75);
blockMesh.position.set(0, 11.5, -75.01);
scene.add(sunMesh);
scene.add(blockMesh);

var loader = new THREE.TextureLoader();
loader.load('sun.png', function (texture) {
  sunMesh.material = new THREE.MeshBasicMaterial({ map:texture, transparent: true });
});


      // Render the scene
camera.rotation.x = -0.15;
camera.position.set(0,2,5);
const speed=0.02;
const frameRefresh = 100;
var zSlide = 0;
renderer.setRenderTarget(null);
      function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        camera.position.z-=speed;
        sunMesh.position.z-=speed;
        blockMesh.position.z-=speed;
        wireFrameMesh.material.uniforms.camPosition = camera.position;
        if((camera.position.z+zSlide+speed*frameRefresh)<0){
          zSlide+= speed*frameRefresh;
          updatePlane(-zSlide);
        }
      }
      animate();