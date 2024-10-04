import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";

function App() {
  useEffect(() => {
    let lines = [];
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const canvas = document.getElementById("myThreeJsCanvas");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.set(0, 1.8, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    const controls = new PointerLockControls(camera, renderer.domElement);
    const clock = new THREE.Clock();

    const controls2 = new OrbitControls(camera, renderer.domElement);
    controls2.enablePan = false;
    controls2.target.set(0, 1.8, 0);
    controls2.update();
    camera.position.set(0, 1.8, -0.1);
    controls2.enableZoom = false;

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
    circleTexture.wrapS = THREE.RepeatWrapping;
    circleTexture.wrapT = THREE.RepeatWrapping;

    const mockStarData = generateStarData(100);

    // Create geometry for a small visible star
    const starGeometry = new THREE.SphereGeometry(0.015, 16, 16); // Small visible star size
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Create geometry for a larger invisible detection sphere
    const detectionGeometry = new THREE.SphereGeometry(0.1, 16, 16); // Larger detection area
    const detectionMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Invisible detection area

    // Add each star's position and create a mesh for each star with a detection area
    const stars = [];
    mockStarData.forEach((star) => {
      // Create and position the visible star
      const starMesh = new THREE.Mesh(starGeometry, starMaterial);
      starMesh.position.set(star.x, star.y, star.z);
      scene.add(starMesh); // Add visible star to the scene

      // Create and position the invisible detection sphere around the star
      const detectionMesh = new THREE.Mesh(
        detectionGeometry,
        detectionMaterial
      );
      detectionMesh.position.set(star.x, star.y, star.z); // Same position as the star
      detectionMesh.name = star.name; // Attach star data to detection mesh
      detectionMesh.ra = star.ra;
      detectionMesh.de = star.de;
      stars.push(detectionMesh); // Add detection sphere to raycastable objects array
      scene.add(detectionMesh); // Add detection sphere to the scene
    });
    const circleGeometry = new THREE.CircleGeometry(100, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({
      map: circleTexture,
      side: THREE.DoubleSide,
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.rotation.x = Math.PI / 2;
    scene.add(circle);

    const tooltip = document.createElement("div");
    tooltip.className = "absolute bg-gray-800 text-white p-2 rounded";
    tooltip.style.display = "none";
    document.body.appendChild(tooltip);

    document.getElementById("btnPlay").onclick = () => {
      controls.lock();
    };

    window.addEventListener("keydown", (event) => {
      event.preventDefault();
      if (event.key === "escape") {
        controls.unlock();
      }
    });

    window.addEventListener("wheel", (event) => {
      if (event.deltaY < 0) {
        camera.fov = Math.max(10, camera.fov - 2);
      } else {
        camera.fov = Math.min(75, camera.fov + 2);
      }
      camera.updateProjectionMatrix();
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Store last clicked star to create continuous lines
    let lastStar = null;

    window.addEventListener("click", (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(stars);

      if (intersects.length > 0) {
        const selectedStar = intersects[0].object;

        if (lastStar && lastStar.uuid !== selectedStar.uuid) {
          drawLine(lastStar, selectedStar);
        }

        // Update the lastStar reference
        lastStar = selectedStar;
      }
    });

    function drawLine(star1, star2) {
      const material = new THREE.LineBasicMaterial({ color: 0xffffff });
      const points = [star1.position, star2.position];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      lines.push(line);
    }

    const constellations = [];

    function promptForConstellationName() {
      // Simple prompt for entering the constellation name
      const name = prompt("Name your constellation:");
      if (name) {
        constellations.push({ name, lines: [...lines] });
        lines = []; // Reset current lines
        drawConstellationName(name);
      }
    }

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    document.body.appendChild(labelRenderer.domElement);

    function drawConstellationName(name) {
      const lineGeometry =
        constellations[constellations.length - 1].lines[0].geometry;
      const positions = lineGeometry.attributes.position.array;

      // Calculate the center of the shape to place the name
      let xSum = 0,
        ySum = 0,
        zSum = 0;
      for (let i = 0; i < positions.length; i += 3) {
        xSum += positions[i];
        ySum += positions[i + 1];
        zSum += positions[i + 2];
      }
      const centerX = xSum / (positions.length / 3);
      const centerY = ySum / (positions.length / 3);
      const centerZ = zSum / (positions.length / 3);

      // Load font
    }

    window.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (lastStar) {
        lastStar = null;
        promptForConstellationName();
      }
    });

    // Update raycasting section to use the detection meshes
    window.addEventListener("mousemove", (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(stars); // Use detection meshes for raycasting

      if (intersects.length > 0) {
        const intersectedStar = intersects[0].object;
        // Update tooltip content and position
        tooltip.innerHTML = `
      Name: ${intersectedStar.name}<br>
      RA: ${intersectedStar.ra.toFixed(2)} hours<br>
      DE: ${intersectedStar.de.toFixed(2)} degrees
    `;
        tooltip.style.display = "block";
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
      } else {
        tooltip.style.display = "none";
      }
    });

    window.addEventListener("mouseout", () => {
      tooltip.style.display = "none";
    });

    function animate() {
      requestAnimationFrame(animate);
      if (controls.isLocked) {
        controls.update(clock.getDelta());
      } else {
        controls2.update();
      }
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    }

    animate();
  }, []);

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
    const ra = Math.random() * 24;
    const de = (Math.random() - 0.5) * 180;
    const magnitude = Math.random() * 20 + 10.5;
    const name = `Star ${i + 1}`;
    const raRadians = THREE.MathUtils.degToRad(ra * 15);
    const deRadians = THREE.MathUtils.degToRad(de);

    const r = 1;
    const x = r * Math.cos(deRadians) * Math.cos(raRadians);
    const y = r * Math.sin(deRadians);
    const z = r * Math.cos(deRadians) * Math.sin(raRadians);

    stars.push({
      x: x * 10,
      y: y * 10,
      z: z * 10,
      magnitude: magnitude,
      name: name,
      ra: ra,
      de: de,
    });
  }
  return stars;
}
