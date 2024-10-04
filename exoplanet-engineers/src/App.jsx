import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function App() {
    const rendererRef = useRef();
    const sceneRef = useRef();
    const cameraRef = useRef();

    // Function to take a screenshot
    const takeScreenshot = () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
        
        // Render the scene
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        
        try {
            // Get the canvas data
            const dataURL = rendererRef.current.domElement.toDataURL('image/png');
            
            // Create temporary link and trigger download
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'star-map-screenshot.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error taking screenshot:', error);
        }
    };

    useEffect(() => {
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            preserveDrawingBuffer: true // Important for screenshots
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('myThreeJsCanvas').appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Set up camera position
        camera.position.set(0, 10, 0);

        // Add a basic ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff);
        scene.add(ambientLight);

        // Add OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);

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
                    de: de
                });
            }
            return stars;
        }

        const mockStarData = generateStarData(100);

        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            sizeAttenuation: true
        });

        const positions = [];
        const names = [];

        mockStarData.forEach(star => {
            positions.push(star.x, star.y, star.z);
            names.push(star.name);
        });

        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const tooltip = document.getElementById('tooltip');

        const onMouseMove = (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', onMouseMove, false);

        function animate() {
            requestAnimationFrame(animate);

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(stars);

            if (intersects.length > 0) {
                const starIndex = intersects[0].index;
                const starData = mockStarData[starIndex];
                tooltip.innerHTML = `
                    Name: ${starData.name}<br>
                    RA: ${starData.ra.toFixed(2)} hours<br>
                    DE: ${starData.de.toFixed(2)} degrees
                `;
                tooltip.style.display = 'block';
            } else {
                tooltip.style.display = 'none';
            }

            controls.update();
            renderer.render(scene, camera);
        }

        animate();

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', handleResize);
            document.getElementById('myThreeJsCanvas').removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div>
            <button 
                onClick={takeScreenshot}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    zIndex: 1000,
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                Take Screenshot
            </button>
            <div id="myThreeJsCanvas"></div>
            <div 
                id="tooltip" 
                style={{ 
                    position: 'absolute', 
                    display: 'none', 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '10px', 
                    borderRadius: '5px',
                    pointerEvents: 'none'
                }}
            />
        </div>
    );
}

export default App;