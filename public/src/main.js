import * as THREE from 'three'
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from '/node_modules/three/examples/jsm/loaders/RGBELoader.js';

//Renderer does the job of rendering the graphics
let renderer = new THREE.WebGLRenderer({
	//Defines the canvas component in the DOM that will be used
	canvas: document.querySelector('#background'),
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);

//set up the renderer with the default settings for threejs.org/editor - revision r153
renderer.shadows = true;
renderer.shadowType = 1;
renderer.shadowMap.enabled = true;
renderer.setPixelRatio( window.devicePixelRatio );
renderer.toneMapping = 0;
renderer.toneMappingExposure = 1
renderer.useLegacyLights  = false;
renderer.toneMapping = THREE.NoToneMapping;
renderer.setClearColor(0xffffff, 0);
//make sure three/build/three.module.js is over r152 or this feature is not available. 
renderer.outputColorSpace = THREE.SRGBColorSpace 

const scene = new THREE.Scene();

let cameraList = [];
let camera;
let mixer;
let actions = {};

const LoadGLTFByPath = (scene) => {
  return new Promise((resolve, reject) => {
    // Create a loader
    const loader = new GLTFLoader();

    // Load the GLTF file
    loader.load('/public/models/scene.gltf', (gltf) => {

      scene.add(gltf.scene);
      mixer = new THREE.AnimationMixer(gltf.scene); // Create the AnimationMixer

      gltf.scene.traverse((object) => {
        if (object.isMesh) object.frustumCulled = false;
      });

      gltf.animations.forEach((clip) => {
				actions[clip.name] = mixer.clipAction(clip);
			});

      // Play the 'bake1_skeleton' animation
      actions['bake1_skeleton'].play();
			
      resolve();
    }, undefined, (error) => {
      reject(error);
    });
  });
};

// Load the GLTF model
LoadGLTFByPath(scene)
  .then(() => {
    retrieveListOfCameras(scene);
  })
  .catch((error) => {
    console.error('Error loading JSON scene:', error);
  });

//retrieve list of all cameras
function retrieveListOfCameras(scene){
  // Get a list of all cameras in the scene
  scene.traverse(function (object) {
    if (object.isCamera) {
      cameraList.push(object);
    }
  });

  //Set the camera to the first value in the list of cameras
  camera = cameraList[0];

  updateCameraAspect(camera);

  // Load the HDRI environment after the cameras are retrieved
  loadHDRIEnvironment();

  // Start the animation loop after the model and cameras are loaded
  animate();
}

// Set the camera aspect ratio to match the browser window dimensions
function updateCameraAspect(camera) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

// Load HDRI environment
function loadHDRIEnvironment() {
  const hdrLoader = new RGBELoader();
  hdrLoader.load('/public/models/HDR_multi_nebulae.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
    animate();
  });
}

const clock = new THREE.Clock();
//A method to be run each time a frame is generated
function animate() {
  requestAnimationFrame(animate);

  mixer.update(clock.getDelta());

  renderer.render(scene, camera);
};



// Intersection Observer setup
const sections = document.querySelectorAll('.section');
const observerOptions = {
	root: null,
	rootMargin: '0px',
	threshold: 0.5,
};
    

// Map each section index to an array of animation names
const sectionToAnimationsMap = [
	['bake1_skeleton','camera1'], // Animations for section 1
	['bake2_skeleton_camminata','camera2','windowAction','rocket_plume','partenza razzo','stella1_out_of_cam','stella2_out_of_cam','stella3_out_of_cam','spot_action'], // Animations for section 2
	['rocket_flying','camera3','rocket_plume2','stella1_animation','stella2Action','stella3Action.001'] // Animation for section 3
];



const observer = new IntersectionObserver((entries, observer) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			const sectionIndex = Array.from(sections).indexOf(entry.target);
			playAnimationForSection(sectionIndex);
		}
	});
}, observerOptions);

sections.forEach(section => {
	observer.observe(section);
});

function playAnimationForSection(sectionIndex) {
	const animationNames = sectionToAnimationsMap[sectionIndex];
	if (animationNames) {
		// Stop all current animations
		Object.values(actions).forEach(action => action.stop());
		// Play each animation for the current section
		animationNames.forEach(name => {
			if (actions[name]) {
				actions[name].play();
			}
		});
	}
}