import { useEffect, useRef } from "react";

declare global {
  interface Window {
    THREE: any;
  }
}

export function Scene3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Three.js from CDN
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.async = true;
    
    script.onload = () => {
      // Load OrbitControls after Three.js
      const controlsScript = document.createElement("script");
      controlsScript.src = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js";
      controlsScript.async = true;
      
      controlsScript.onload = () => {
        initScene();
      };
      
      document.body.appendChild(controlsScript);
    };

    document.body.appendChild(script);

    let renderer: any;
    
    const initScene = () => {
      if (!containerRef.current || !window.THREE) return;

      const THREE = window.THREE;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#0f172a"); // Slate 900

      // Camera
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.set(5, 5, 5);

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      containerRef.current.appendChild(renderer.domElement);

      // Controls
      const controls = new (THREE as any).OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(10, 10, 10);
      dirLight.castShadow = true;
      scene.add(dirLight);

      // Objects (Generator, Battery, Load)
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      
      const genMaterial = new THREE.MeshStandardMaterial({ color: "#f59e0b" });
      const batMaterial = new THREE.MeshStandardMaterial({ color: "#10b981" });
      const loadMaterial = new THREE.MeshStandardMaterial({ color: "#3b82f6" });

      const generator = new THREE.Mesh(geometry, genMaterial);
      generator.position.set(-2, 0, 0);
      generator.castShadow = true;
      scene.add(generator);

      const battery = new THREE.Mesh(geometry, batMaterial);
      battery.position.set(0, 0, 0);
      battery.castShadow = true;
      scene.add(battery);

      const load = new THREE.Mesh(geometry, loadMaterial);
      load.position.set(2, 0, 0);
      load.castShadow = true;
      scene.add(load);

      // Ground plane
      const planeGeo = new THREE.PlaneGeometry(10, 10);
      const planeMat = new THREE.MeshStandardMaterial({ color: "#1e293b" });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -0.6;
      plane.receiveShadow = true;
      scene.add(plane);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };

      animate();

      // Handle resize
      const handleResize = () => {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener("resize", handleResize);
    };

    return () => {
      // Cleanup
      if (renderer && renderer.domElement) {
        renderer.domElement.remove();
      }
      document.body.removeChild(script);
      const cScript = document.querySelector(`script[src*="OrbitControls.js"]`);
      if (cScript) document.body.removeChild(cScript);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}

export default Scene3D;
