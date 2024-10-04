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

    // Function to save stars and constellations to a file
    function saveData() {
      const data = {
        stars: stars.map((star) => ({
          name: star.name,
          ra: star.ra,
          de: star.de,
          x: star.position.x,
          y: star.position.y,
          z: star.position.z,
        })),
        constellations: constellations.map((constellation) => ({
          name: constellation.name,
          lines: constellation.lines.map((line) => ({
            start: {
              x: line.geometry.attributes.position.array[0],
              y: line.geometry.attributes.position.array[1],
              z: line.geometry.attributes.position.array[2],
            },
            end: {
              x: line.geometry.attributes.position.array[3],
              y: line.geometry.attributes.position.array[4],
              z: line.geometry.attributes.position.array[5],
            },
          })),
        })),
      };

      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.json";
      a.click();
      URL.revokeObjectURL(url);
    }

    // Function to load stars and constellations from a file
    function loadData(event) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = JSON.parse(e.target.result);

        // Clear existing stars and constellations
        stars.forEach((star) => scene.remove(star));
        constellations.forEach((constellation) => {
          constellation.lines.forEach((line) => scene.remove(line));
        });
        stars.length = 0;
        constellations.length = 0;

        // Load stars
        data.stars.forEach((starData) => {
          const starMesh = new THREE.Mesh(starGeometry, starMaterial);
          starMesh.position.set(starData.x, starData.y, starData.z);
          starMesh.name = starData.name;
          starMesh.ra = starData.ra;
          starMesh.de = starData.de;
          scene.add(starMesh);
          stars.push(starMesh);
        });

        // Load constellations
        data.constellations.forEach((constellationData) => {
          const lines = constellationData.lines.map((lineData) => {
            const geometry = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(
                lineData.start.x,
                lineData.start.y,
                lineData.start.z
              ),
              new THREE.Vector3(lineData.end.x, lineData.end.y, lineData.end.z),
            ]);
            const material = new THREE.LineBasicMaterial({ color: 0xffffff });
            const line = new THREE.Line(geometry, material);
            scene.add(line);
            return line;
          });
          constellations.push({ name: constellationData.name, lines });
        });
      };
      reader.readAsText(file);
    }

    // Add event listeners for save and load buttons
    document.getElementById("btnSave").onclick = saveData;

    document.getElementById("btnLoad").onclick = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.onchange = loadData;
      input.click();
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
        console.log(constellations);
      } else {
        console.log("no");
        scene.remove(...lines);
        lines = [];
      }
    }

    window.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (lastStar && lines.length > 0) {
        lastStar = null;
        promptForConstellationName();
      }
    });

    // Function to highlight lines of a constellation
    function highlightConstellation(constellation, highlight) {
      constellation.lines.forEach((line) => {
        line.material.color.set(highlight ? 0xff0000 : 0xffffff); // Highlight in red or reset to white
      });
    }

    // Update raycasting section to use the detection meshes
    window.addEventListener("mousemove", (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check for intersections with lines
      const lineIntersects = raycaster.intersectObjects(lines);
      if (lineIntersects.length > 0) {
        const intersectedLine = lineIntersects[0].object;
        const constellation = constellations.find((c) =>
          c.lines.includes(intersectedLine)
        );

        if (constellation) {
          // Update tooltip content and position
          tooltip.innerHTML = `Constellation: ${constellation.name}`;
          tooltip.style.display = "block";
          tooltip.style.left = `${event.clientX + 10}px`;
          tooltip.style.top = `${event.clientY + 10}px`;

          // Highlight the constellation lines
          highlightConstellation(constellation, true);
        }
      } else {
        // Reset all constellations' lines to their original color
        constellations.forEach((c) => highlightConstellation(c, false));

        // Check for intersections with stars
        const starIntersects = raycaster.intersectObjects(stars);
        if (starIntersects.length > 0) {
          const intersectedStar = starIntersects[0].object;

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
      }
    });

    // Hide tooltip when mouse leaves the window
    window.addEventListener("mouseout", () => {
      tooltip.style.display = "none";
      constellations.forEach((c) => highlightConstellation(c, false));
    });

    function animate() {
      requestAnimationFrame(animate);
      if (controls.isLocked) {
        controls.update(clock.getDelta());
      } else {
        controls2.update();
      }
      renderer.render(scene, camera);
    }

    animate();
  }, []);

  return (
    <>
      <div className="absolute left-0 top-0 flex z-10">
        <button
          id="btnSave"
          data-dropdown-toggle="dropdown"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          type="button"
        >
          Save
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m1 1 4 4 4-4"
          />
        </button>
        <button
          id="btnLoad"
          data-dropdown-toggle="dropdown"
          className="text-white ml-2 mr-2 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          type="button"
        >
          Load
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m1 1 4 4 4-4"
          />
        </button>
        <button
          id="btnPlay"
          data-dropdown-toggle="dropdown"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          type="button"
        >
          Play{" "}
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m1 1 4 4 4-4"
          />
        </button>
      </div>

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
