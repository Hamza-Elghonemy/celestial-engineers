/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

function App({ planet }) {
  const Navigate = useNavigate();
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
    const renderer = new THREE.WebGLRenderer({
     
      canvas,
     
      antialias: true,
     
      preserveDrawingBuffer: true
   ,
    }); // Added preserveDrawingBuffer for screenshots
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.set(0, 1.8, 0);

    function toggleHighlight(constellation) {
      const isHighlighted = constellation.lines[0].material.color.equals(
        new THREE.Color(0xff0000)
      );
      constellation.lines.forEach((line) => {
        line.material.color.set(isHighlighted ? 0xffffff : 0xff0000); // Toggle between white and red
      });
    }

    function addConstellationButton(constellation) {
      const button = document.createElement("button");
      button.className =
        "text-white bg-blue-700 active:bg-red-100 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:focus:ring-blue-800";
      button.textContent = constellation.name;
      button.onclick = () => {
        toggleHighlight(constellation);
        button.disabled = true; // Disable the button
        setTimeout(() => {
          button.disabled = false; // Re-enable the button after 1 second
        }, 1000);
      };
      document.getElementById("constellationButtons").appendChild(button);
    }

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

    // Create geometry for a small visible star
    let starGeometry = new THREE.SphereGeometry(0.1, 16, 16); // Small visible star size
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Create geometry for a larger invisible detection sphere
    const detectionGeometry = new THREE.SphereGeometry(1, 16, 16); // Larger detection area
    const detectionMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Invisible detection area

    //createLatLongGrid(scene);

    // Add each star's position and create a mesh for each star with a detection area
    const stars = [];
    async function queryGaiaApi(ra, dec, radius) {
      const query = `
    SELECT TOP 50000
        source_id, ra, dec, phot_g_mean_mag
    FROM gaiadr3.gaia_source
    WHERE 1=CONTAINS(
        POINT('ICRS', ra, dec),
        CIRCLE('ICRS', ${ra}, ${dec}, ${radius})
    )
    `;

      const response = await fetch("/api/gaia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ra: raa,
          dec: deca,
          radius: radiusa,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Debugging output

        if (data.data && Array.isArray(data.data)) {
          return data.data.map((item) => ({
            source_id: item[0],
            ra: item[1],
            dec: item[2],
            phot_g_mean_mag: item[3],
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
    let gaiaResults = null;
    async function fetchGaiaData() {
      try {
        // Call the function with sample parameters
        gaiaResults = await queryGaiaApi(
          planet.Right_Ascension,
          planet.Declination,
          0.8
        );

        // Now you can work with the results
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    var mockStarData = [];

    function useGaiaData() {
      if (gaiaResults) {
        // Access individual items
        let stars = [];
        let decMax = 0;
        let decMin = Infinity;
        let raMax = 0;
        let raMin = Infinity;
        for (let j = 0; j < gaiaResults.length; j++) {
          if (gaiaResults[j].dec > decMax) {
            decMax = gaiaResults[j].dec;
          }
          if (gaiaResults[j].dec < decMin) {
            decMin = gaiaResults[j].dec;
          }
          if (gaiaResults[j].ra > raMax) {
            raMax = gaiaResults[j].ra;
          }
          if (gaiaResults[j].ra < raMin) {
            raMin = gaiaResults[j].ra;
          }
        }
        let maxMagnitude = -999;
        let minMagnitude = 999;
        gaiaResults.forEach((source, i) => {
          const ra = ((source.ra - raMin) * 360) / (raMax - raMin); // RA in hours, randomly between 0 and 24

          const de = ((source.dec - decMin) * 360) / (decMax - decMin); // DE in degrees, randomly between -90 and +90

          const magnitude = source.phot_g_mean_mag; // Random magnitude between 10.5 and 15.5

          const name = `Star ${i + 1}`;

          // Convert RA (hours) to degrees and then to radians
          const SCALE_FACTOR = 100; // Adjust this based on your scene size

          if (magnitude >= maxMagnitude) {
            maxMagnitude = magnitude;
          }
          if (magnitude < minMagnitude && magnitude > 0) {
            minMagnitude = magnitude;
          }

          // Function to normalize magnitudes to a scale of 0.05 to 0.15
          const normalizeMagnitude = (magnitude) => {
            const minScale = 0.03;
            const maxScale = 0.12;
            return (
              ((magnitude - minMagnitude) / (maxMagnitude - minMagnitude)) *
                (maxScale - minScale) +
              minScale
            );
          };

          const raRadians = THREE.MathUtils.degToRad(ra);
          const deRadians = THREE.MathUtils.degToRad(de);

          // Convert to Cartesian coordinates
          const x = Math.cos(deRadians) * Math.cos(raRadians);
          const y = Math.sin(deRadians);
          const z = Math.cos(deRadians) * Math.sin(raRadians);

          const normalizedMagnitude = normalizeMagnitude(magnitude);
          // Push star data with scaled positions
          stars.push({
            x: x * SCALE_FACTOR,
            y: y * SCALE_FACTOR,
            z: z * SCALE_FACTOR,
            magnitude: normalizedMagnitude,
            source_id: name,
            ra: ra,
            dec: de,
          });
        });
        mockStarData = stars;
      }
    }
    fetchGaiaData().then(() => {
      useGaiaData();
      const names = [];
      const positions = [];
      mockStarData.forEach((star) => {
        // Create and position the visible star
        starGeometry = new THREE.SphereGeometry(star.magnitude || 0.03, 16, 16);
        const starMesh = new THREE.Mesh(starGeometry, starMaterial);
        starMesh.position.set(star.x, star.y, star.z);
        scene.add(starMesh); // Add visible star to the scene

        // Create and position the invisible detection sphere around the star
        const detectionMesh = new THREE.Mesh(
          detectionGeometry,
          detectionMaterial
        );
        detectionMesh.position.set(star.x, star.y, star.z); // Same position as the star
        detectionMesh.name = star.source_id; // Attach star data to detection mesh
        detectionMesh.ra = star.ra;
        detectionMesh.de = star.dec;
        starMesh.name = star.source_id;
        starMesh.ra = star.ra;
        starMesh.de = star.dec;
        stars.push(detectionMesh); // Add detection sphere to raycastable objects array
        scene.add(detectionMesh); // Add detection sphere to the scene
        names.push(star.source_id); // Store star names
        positions.push((star.ra, star.dec)); // Store star positions
      });
    });

    //
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

    function takeScreenshot() {
      // Render the scene
      renderer.render(scene, camera);

      // Convert the canvas to a data URL
      const dataURL = canvas.toDataURL("image/png");

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "starmap-screenshot.png";

      // Trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    // Add event listeners for save and load buttons
    document.getElementById("btnScreenshot").onclick = takeScreenshot;
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
    let lastSelectedStar = null;
    function drawLine(star1, star2) {
      const material = new THREE.LineBasicMaterial({ color: 0xffffff });
      const points = [star1.position, star2.position];
      star2.Color = 0xffff00;
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      lines.push(line);

      // Change the color of the last selected star to yellow
      if (lastSelectedStar) {
        lastSelectedStar.material.color.set(0xffffff); // Reset previous star color to white
      }
      star2.material.color.set(0xffff00); // Set current star color to yellow
      lastSelectedStar = star2; // Update last selected star
    }
    function toggleHighlight(constellation) {
      const isHighlighted = constellation.lines[0].material.color.equals(
        new THREE.Color(0xff0000)
      );
      constellation.lines.forEach((line) => {
        line.material.color.set(isHighlighted ? 0xffffff : 0xff0000); // Toggle between white and red
      });
    }

    function addConstellationButton(constellation) {
      const button = document.createElement("button");
      button.className =
        "text-white bg-blue-700 active:bg-red-100 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-green-600 dark:focus:ring-green-800";
      button.textContent = constellation.name;
      button.onclick = () => {
        toggleHighlight(constellation);
        button.disabled = true; // Disable the button
        setTimeout(() => {
          button.disabled = false; // Re-enable the button after 1 second
        }, 1000);
      };

      button.style.height = "40px";
      button.style.textAlign = "center";
      button.style.fontFamily = "Nova Square";
      button.style.padding = "13px";
      button.style.margin = "8px";
      button.style.borderRadius = "5px";
      button.style.border = "1px solid #ccc";
      document.getElementById("constellationButtons").appendChild(button);
    }
    const constellations = [];
    let isPromptCooldown = false;
    function promptForConstellationName() {
      if (isPromptCooldown) return;
      isPromptCooldown = true; // S
      // Simple prompt for entering the constellation name
      const name = prompt("Name your constellation:");
      if (name) {
        constellations.push({ name, lines: [...lines] });
        addConstellationButton(constellations[constellations.length - 1]);
        lines = []; // Reset current lines
      } else {
        scene.remove(...lines);
        lines = [];
      }
      setTimeout(() => {
        isPromptCooldown = false;
      }, 1000);
    }

    window.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (lastStar && lines.length > 0) {
        lastStar = null;
        promptForConstellationName();
        return;
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
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
      } else {
        tooltip.style.display = "none";
      }
    });

    // Hide tooltip when mouse leaves the window
    window.addEventListener("mouseout", () => {
      tooltip.style.display = "none";
      constellations.forEach((c) => highlightConstellation(c, false));
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
          className="width-200px text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          type="button"
          style={{height:"40px", width: "100px", textAlign: "center",fontFamily: "Nova Square",padding: "12px",margin: "8px",borderRadius: "5px",border: "1px solid #ccc",}}
        >
          Save JSON
        </button>
        <button
          id="btnScreenshot"
          data-dropdown-toggle="dropdown"
          className="text-white ml-2 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          type="button"
          style={{ height:"40px",width: "100px", textAlign: "center",fontFamily: "Nova Square",padding: "17px",margin: "8px",borderRadius: "5px",border: "1px solid #ccc",}}
        >
          Save PNG
        </button>
        <button
          id="btnLoad"
          data-dropdown-toggle="dropdown"
          className="text-white ml-2 mr-2 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg  px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          type="button"
          style={{height:"40px", width: "70px", textAlign: "center",fontFamily: "Nova Square",padding: "17px",margin: "8px",borderRadius: "5px",border: "1px solid #ccc",}}
        >
          Load
        </button>
        <button
          id="btnPlay"
          data-dropdown-toggle="dropdown"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg  px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          type="button"
          style={{height:"40px", width: "100px", textAlign: "center",fontFamily: "Nova Square",padding: "13px",margin: "8px",borderRadius: "5px",border: "1px solid #ccc",}}
        >
          Free look
        </button>

        <button
          onClick={() => {
            Navigate("/");
          }}
          id="btnPlay"
          data-dropdown-toggle="dropdown"
          className="text-white left-2 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          type="button"
          style={{ height:"40px",width: "180px", textAlign: "center",fontFamily: "Nova Square",padding: "13px",margin: "8px",borderRadius: "5px",border: "1px solid #ccc",}}
        >
          Return to planet select
        </button>
        <div id="constellationButtons" className="flex space-x-1"></div>
      </div>

      <canvas id="myThreeJsCanvas"></canvas>
    </>
  );
}

export default App;

function createLatLongGrid(scene) {
  const gridMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
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
