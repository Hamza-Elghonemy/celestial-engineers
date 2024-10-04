import { useEffect } from 'react'
import * as THREE from 'three';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


function App() {

  useEffect(()=>{


const scene = new THREE.Scene();
// Perspective parameters: POV, Aspect Ratio, View Frustum (near, far)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const canvas=document.getElementById('myThreeJsCanvas');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Set up camera position
camera.position.set(0, 1.8, 0); // Position the camera at the surface of the planet

// Add a basic ambient light
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight); 

async function queryGaiaApi(ra, dec, radius) {
    const url = "https://gea.esac.esa.int/tap-server/tap/sync";
    
    const query = `
    SELECT TOP 50000
        source_id, ra, dec, phot_g_mean_mag
    FROM gaiadr3.gaia_source
    WHERE 1=CONTAINS(
        POINT('ICRS', ra, dec),
        CIRCLE('ICRS', ${ra}, ${dec}, ${radius})
    )
    `;

    const response = await fetch('/api/gaia', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            "REQUEST": "doQuery",
            "LANG": "ADQL",
            "FORMAT": "json",
            "QUERY": query
        })
    });

    if (response.ok) {
        const data = await response.json();
        
        // Debugging output
        //console.log("Response JSON:", data);
        if (data.data && Array.isArray(data.data)) {
            return data.data.map(item => ({
                source_id: item[0],
                ra: item[1],
                dec: item[2],
                phot_g_mean_mag: item[3]
            }));
        } else {
            console.error("Error: Unexpected response format");
            return null;
        }
    } else {
        console.error("HTTP error:", response.status);
        throw new Error("Failed to fetch data from GAIA API");
    }
}
let gaiaResults= null;
async function fetchGaiaData() {
    try {
        // Call the function with sample parameters
        gaiaResults = await queryGaiaApi(180.0, 20.0, 0.8);
        
        // Now you can work with the results
       
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
var mockStarData=[];

function useGaiaData() {
    if (gaiaResults) {
        console.log('Number of sources found:', gaiaResults.length);
        //console.log(gaiaResults);
        // Access individual items
        let stars = [];
        let decMax=0;
        let decMin=Infinity;
        let raMax=0;
        let raMin=Infinity;
        for(let j=0;j<gaiaResults.length;j++)
        {
            if(gaiaResults[j].dec>decMax)
            {
                decMax=gaiaResults[j].dec;
            }
            if(gaiaResults[j].dec<decMin)
            {
                decMin=gaiaResults[j].dec;
            }
            if(gaiaResults[j].ra>raMax)
            {
                raMax=gaiaResults[j].ra;
            }
            if(gaiaResults[j].ra<raMin)
            {
                raMin=gaiaResults[j].ra;
            }
        }
        gaiaResults.forEach((source,i) => {
            const ra = (source.ra-raMin)*360/(raMax-raMin); // RA in hours, randomly between 0 and 24
           
            const de = (source.dec-decMin)*360/(decMax-decMin); // DE in degrees, randomly between -90 and +90
           
            console.log(ra,de);

            const magnitude =source.phot_g_mean_mag; // Random magnitude between 10.5 and 15.5
            
            const name = `Star ${i + 1}`;
            
            // Convert RA (hours) to degrees and then to radians
            const SCALE_FACTOR = 100; // Adjust this based on your scene size

            const raRadians = THREE.MathUtils.degToRad(ra);
            const deRadians = THREE.MathUtils.degToRad(de);

            // Convert to Cartesian coordinates
            const x = Math.cos(deRadians) * Math.cos(raRadians);
            const y = Math.sin(deRadians);
            const z = Math.cos(deRadians) * Math.sin(raRadians);

            // Push star data with scaled positions
            stars.push({
                x: x * SCALE_FACTOR,
                y: y * SCALE_FACTOR,
                z: z * SCALE_FACTOR,
                magnitude: magnitude,
                source_id: name,
                ra: ra,
                dec: de
            });
            
            // Push star data
            // stars.push({
            //     x: x * 10, // Scale up for visualization
            //     y: y * 10,
            //     z: z * 10,
            //     magnitude: magnitude,
            //     name: name,
            //     ra: ra, // Storing RA in hours
            //     de: de // Storing DE in degrees
            // });
        
        
            //console.log(`RA: ${source.ra}, DEC: ${source.dec}`);
        });
        mockStarData=stars;
        //console.log("mockStarData");
        //console.log(mockStarData);
    }
}

fetchGaiaData()
.then(() => {useGaiaData()}) ;

// Mock Gaia star data with RA and DE (Right Ascension and Declination)

// function generateStarData(numStars) {
//     const stars = [];
//     for (let i = 0; i < numStars; i++) {
//         const ra = Math.random() * 24; // RA in hours, randomly between 0 and 24
//         const de = (Math.random() - 0.5) * 180; // DE in degrees, randomly between -90 and +90
//         const magnitude = Math.random() * 20 + 10.5; // Random magnitude between 10.5 and 15.5
//         const name = `Star ${i + 1}`;
        
//         // Convert RA (hours) to degrees and then to radians
//         const raRadians = THREE.MathUtils.degToRad(ra * 15); // Convert RA to degrees and then to radians
//         // Convert DE (degrees) to radians
//         const deRadians = THREE.MathUtils.degToRad(de);
        
//         // Assume a unit sphere (r = 1) and convert RA/DE to 3D Cartesian coordinates
//         const r = 1; // Radius can be scaled if needed
//         const x = r * Math.cos(deRadians) * Math.cos(raRadians);
//         const y = r * Math.sin(deRadians);
//         const z = r * Math.cos(deRadians) * Math.sin(raRadians);
        
//         // Push star data
//         stars.push({
//             x: x * 10, // Scale up for visualization
//             y: y * 10,
//             z: z * 10,
//             magnitude: magnitude,
//             name: name,
//             ra: ra, // Storing RA in hours
//             de: de // Storing DE in degrees
//         });
//     }
//     return stars;
// }

// Generate mock star data (100 stars)
//const mockStarData = generateStarData(100);
//console.log(mockStarData);

// Create geometry to hold star positions
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.ShaderMaterial({
    uniforms: {
        color: { value: new THREE.Color(0xffffff) },
    },
    vertexShader: `
        void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 5.0; // Adjust size as needed
        }
    `,
    fragmentShader: `
        uniform vec3 color;
        void main() {
            gl_FragColor = vec4(color, 1.0);
            float dist = length(gl_PointCoord - vec2(0.5, 0.5));
            if (dist > 0.5) discard; // Make the point a circle
        }
    `,
    transparent: true
});

// Create arrays to hold star data
const positions = [];
const names = [];
fetchGaiaData()
.then(() => {useGaiaData()}).then(()=>{ 
// Add each star's position and adjust its size based on magnitude
mockStarData.forEach(star => {
    positions.push(star.x, star.y, star.z); // Position in 3D space
    //console.log(star.x, star.y, star.z);
    names.push(star.name); // Store star names
});

// Add positions to geometry
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

// Create points using star geometry and material
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Function to create latitude and longitude grid
function createLatLongGrid() {
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const gridLines = new THREE.Group();

    // Create latitude lines
    for (let lat = -80; lat <= 80; lat += 10) {
        const latGeometry = new THREE.BufferGeometry();
        const latVertices = [];
        const latRadius = Math.cos(THREE.MathUtils.degToRad(lat)) * 10;
        for (let lon = 0; lon <= 360; lon += 10) {
            const lonRadians = THREE.MathUtils.degToRad(lon);
            latVertices.push(
                latRadius * Math.cos(lonRadians),
                10 * Math.sin(THREE.MathUtils.degToRad(lat)),
                latRadius * Math.sin(lonRadians)
            );
        }
        latGeometry.setAttribute('position', new THREE.Float32BufferAttribute(latVertices, 3));
        const latLine = new THREE.Line(latGeometry, gridMaterial);
        gridLines.add(latLine);
    }

    // Create longitude lines
    for (let lon = 0; lon < 360; lon += 10) {
        const lonGeometry = new THREE.BufferGeometry();
        const lonVertices = [];
        const lonRadians = THREE.MathUtils.degToRad(lon);
        for (let lat = -90; lat <= 90; lat += 10) {
            const latRadians = THREE.MathUtils.degToRad(lat);
            lonVertices.push(
                10 * Math.cos(latRadians) * Math.cos(lonRadians),
                10 * Math.sin(latRadians),
                10 * Math.cos(latRadians) * Math.sin(lonRadians)
            );
        }
        lonGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lonVertices, 3));
        const lonLine = new THREE.Line(lonGeometry, gridMaterial);
        gridLines.add(lonLine);
    }

    scene.add(gridLines);
}

// Add latitude and longitude grid to the scene
// createLatLongGrid();

const controls= new FirstPersonControls(camera,renderer.domElement);
const clock= new THREE.Clock();
controls.movementSpeed=0;
controls.lookSpeed=0.2;

const loader = new THREE.CubeTextureLoader();
  const texture = loader.load([
    '../public/skybox/right.png',
    '../public/skybox/left.png',
    '../public/skybox/top.png',
    '../public/skybox/bottom.png',
    '../public/skybox/front.png',
    '../public/skybox/back.png',
  ]);
  scene.background = texture;

  const textureLoader = new THREE.TextureLoader();
  const circleTexture = textureLoader.load('../public/exoplanets/4k_ceres_fictional.jpg');

  // Adjust texture settings
  circleTexture.wrapS = THREE.RepeatWrapping;
  circleTexture.wrapT = THREE.RepeatWrapping;
  circleTexture.minFilter = THREE.LinearFilter;
  circleTexture.magFilter = THREE.LinearFilter;

  // Create circle geometry and material with the texture
  const circleGeometry = new THREE.CircleGeometry(100, 32); // 100 units radius, 128 segments
  const circleMaterial = new THREE.MeshBasicMaterial({ map: circleTexture, side: THREE.DoubleSide });
  const circle = new THREE.Mesh(circleGeometry, circleMaterial);
  circle.rotation.x = Math.PI / 2; // Rotate the circle to lie flat on the XZ plane
  scene.add(circle);

 

//controls.update(); // Update controls to reflect the target position

// Create a tooltip element
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.color = 'white';
tooltip.style.background = 'rgba(0, 0, 0, 0.7)';
tooltip.style.padding = '5px';
tooltip.style.borderRadius = '3px';
tooltip.style.pointerEvents = 'none'; // Make sure the tooltip doesn't block mouse events
tooltip.style.display = 'none'; // Initially hidden
document.body.appendChild(tooltip);

const radius = 10;
const sectors = 16;
const rings = 8;
const divisions = 64;

const helper = new THREE.PolarGridHelper( radius, sectors, rings, divisions );
scene.add( helper );

// Mouse position and raycaster setup
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let tooltipVisible = false; // Track tooltip visibility

// // Handle mouse move event to update mouse coordinates
// window.addEventListener('mousemove', (event) => {
//     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//     // Update tooltip position if it's visible
//     if (tooltipVisible) {
//         tooltip.style.left = `${event.clientX + 10}px`; // Adjust for correct positioning
//         tooltip.style.top = `${event.clientY + 10}px`; // Adjust for correct positioning
//     }
// });

// // Hide tooltip when mouse leaves the window
// window.addEventListener('mouseout', () => {
//     tooltip.style.display = 'none';
//     tooltipVisible = false; // Hide the tooltip
// });

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update the raycaster with the mouse position
    // raycaster.setFromCamera(mouse, camera);

    // // Calculate objects intersecting the picking ray
    // const intersects = raycaster.intersectObject(stars);

    // if (intersects.length > 0) {
    //     const starIndex = intersects[0].index;
    //     const starData = mockStarData[starIndex]; // Get the star data from the mock data
    //     tooltip.innerHTML = `
    //         Name: ${starData.name}<br>
    //         RA: ${starData.ra.toFixed(2)} hours<br>
    //         DE: ${starData.de.toFixed(2)} degrees
    //     `;
    //     tooltip.style.display = 'block';
    //     tooltipVisible = true; // Set tooltip as visible
    // } else {
    //     tooltip.style.display = 'none';
    //     tooltipVisible = false; // Hide the tooltip
    // }

    // Orbit controls update
    controls.update(clock.getDelta());

    // Render the scene
    renderer.render(scene, camera);
}

animate();
  });
  }),[];

  return (
    <>
   <canvas id="myThreeJsCanvas"></canvas>
    </>
  )
}

export default App
