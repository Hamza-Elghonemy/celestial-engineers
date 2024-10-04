import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

function App() {
  useEffect(() => {
    // CODE INITIALIZATION
    const scene = new THREE.Scene();
    // Perspective parameters: POV, Aspect Ratio, View Frustum (near, far)
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const canvas = document.getElementById("myThreeJsCanvas");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Set up camera position
    camera.position.set(0, 1.8, 0); // Position the camera at the surface of the planet

    // Add a basic ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    const controls = new PointerLockControls(camera, renderer.domElement);
    const clock = new THREE.Clock();
    controls.movementSpeed = 0;
    controls.lookSpeed = 0.2;

    const controls2 = new OrbitControls(camera, renderer.domElement);
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: "",
      RIGHT: "",
    };
    controls2.enablePan = false;
    controls2.rotateSpeed = 0.2;
    controls2.target.set(0, 1.8, 0);
    controls2.update();
    camera.position.set(0, 1.8, -0.1);
    controls2.enableZoom = false;
    controls2.enableDamping = false;

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      "../public/skybox/right.png",
      "../public/skybox/left.png",
      "../public/skybox/top.png",
      "../public/skybox/bottom.png",
      "../public/skybox/front.png",
      "../public/skybox/back.png",
    ]);
    scene.background = texture;

    const textureLoader = new THREE.TextureLoader();
    const circleTexture = textureLoader.load(
      "../public/exoplanets/4k_ceres_fictional.jpg"
    );

    // Adjust texture settings
    circleTexture.wrapS = THREE.RepeatWrapping;
    circleTexture.wrapT = THREE.RepeatWrapping;
    circleTexture.minFilter = THREE.LinearFilter;
    circleTexture.magFilter = THREE.LinearFilter;
    // INITIALIZATION DONE

    // Generate mock star data (100 stars)
    const mockStarData = generateStarData(100);

    // Create geometry for a star
    const starGeometry = new THREE.SphereGeometry(0.015, 16, 16); // Adjust size and detail as needed
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Basic white material

    // Create arrays to hold star data
    const names = [];
    const stars = [];
    // Add each star's position and create a mesh for each star
    mockStarData.forEach((star) => {
      const starMesh = new THREE.Mesh(starGeometry, starMaterial);
      starMesh.position.set(star.x, star.y, star.z); // Position in 3D space
      names.push(star.name); // Store star names
      scene.add(starMesh); // Add star mesh to the scene
    });

    // Add latitude and longitude grid to the scene
    //createLatLongGrid(scene);

    // Create circle geometry and material with the texture
    const circleGeometry = new THREE.CircleGeometry(100, 32); // 100 units radius, 128 segments
    const circleMaterial = new THREE.MeshBasicMaterial({
      map: circleTexture,
      side: THREE.DoubleSide,
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.rotation.x = Math.PI / 2; // Rotate the circle to lie flat on the XZ plane
    scene.add(circle);

    //controls.update(); // Update controls to reflect the target position

    // Create a tooltip element
    const tooltip = document.createElement("div");
    tooltip.style.position = "absolute";
    tooltip.style.color = "white";
    tooltip.style.background = "rgba(0, 0, 0, 0.7)";
    tooltip.style.padding = "5px";
    tooltip.style.borderRadius = "3px";
    tooltip.style.pointerEvents = "none"; // Make sure the tooltip doesn't block mouse events
    tooltip.style.display = "none"; // Initially hidden
    document.body.appendChild(tooltip);

    // Mouse position and raycaster setup

    document.getElementById("btnPlay").onclick = () => {
      controls.lock();
    };

    window.addEventListener("keydown", (event) => {
      //sync the view
      console.log("Entered");
      event.preventDefault();
      if (event.key === "escape") {
        controls.unlock();
      }
    });

    // Handle mouse move event to update mouse coordinates
    window.addEventListener("wheel", (event) => {
      // Adjust the camera's field of view (FOV) based on the scroll direction
      if (event.deltaY < 0) {
        camera.fov = Math.max(10, camera.fov - 2); // Zoom in
      } else {
        camera.fov = Math.min(75, camera.fov + 2); // Zoom out
      }
      camera.updateProjectionMatrix(); // Update the camera projection matrix
    });

    const mouse = new THREE.Vector2();

    window.addEventListener("mousemove", (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    const raycaster = new THREE.Raycaster();
    let tooltipVisible = false; // Track tooltip visibility
    // Handle mouse move event to update mouse coordinates
    // Handle mouse move event to update mouse coordinates and check for intersections
    window.addEventListener("mousemove", (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      var intersects = raycaster.intersectObject(scene, true);

      console.log(intersects);

      //   if (intersects.length > 0) {
      //     var object = intersects[0].object;

      //     object.material.color.set(Math.random() * 0xffffff);
      //   }
    });

    // Hide tooltip when mouse leaves the window
    window.addEventListener("mouseout", () => {
      tooltip.style.display = "none";
      tooltipVisible = false; // Hide the tooltip
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      // Update the raycaster with the current mouse position
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(stars);

      if (intersects.length > 0) {
        const intersectedStar = intersects[0].object;
        // Update tooltip content and position
        tooltip.innerHTML = `
            Name: ${intersectedStar.name}<br>
            RA: ${intersectedStar.ra.toFixed(2)} hours<br>
            DE: ${intersectedStar.de.toFixed(2)} degrees
        `;
        tooltip.style.display = "block";
        tooltipVisible = true; // Set tooltip as visible
      } else {
        tooltip.style.display = "none";
        tooltipVisible = false; // Hide the tooltip
      }

      if (controls.isLocked) {
        controls.update(clock.getDelta());
      } else {
        controls2.update();
      }

      // Render the scene
      renderer.render(scene, camera);
    }

    animate();
  }),
    [];

  return (
    <>
      <div className="absolute left-0 top-0">STUCK</div>
      <button id="btnPlay" className="absolute left-20 top-0 bg-slate-400">
        Play
      </button>
      <canvas id="myThreeJsCanvas"></canvas>
    </>
  );
}

export default App;

function generateStarData(numStars) {
  const stars = [];
  for (let i = 0; i < numStars; i++) {
    const ra = Math.random() * 24; // RA in hours, randomly between 0 and 24
    const de = (Math.random() - 0.5) * 180; // DE in degrees, randomly between -90 and +90
    const magnitude = Math.random() * 20 + 10.5; // Random magnitude between 10.5 and 15.5
    const name = `Star ${i + 1}`;

    // Convert RA (hours) to degrees and then to radians
    const raRadians = THREE.MathUtils.degToRad(ra * 15); // Convert RA to degrees and then to radians
    // Convert DE (degrees) to radians
    const deRadians = THREE.MathUtils.degToRad(de);

    // Assume a unit sphere (r = 1) and convert RA/DE to 3D Cartesian coordinates
    const r = 1; // Radius can be scaled if needed
    const x = r * Math.cos(deRadians) * Math.cos(raRadians);
    const y = r * Math.sin(deRadians);
    const z = r * Math.cos(deRadians) * Math.sin(raRadians);

    // Push star data
    stars.push({
      x: x * 10, // Scale up for visualization
      y: y * 10,
      z: z * 10,
      magnitude: magnitude,
      name: name,
      ra: ra, // Storing RA in hours
      de: de, // Storing DE in degrees
    });
  }
  return stars;
}

function createLatLongGrid(scene) {
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
    latGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(latVertices, 3)
    );
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
    lonGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(lonVertices, 3)
    );
    const lonLine = new THREE.Line(lonGeometry, gridMaterial);
    gridLines.add(lonLine);
  }

  scene.add(gridLines);
}
