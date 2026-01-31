import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from '../../libs/utils.js';
import { length, flatten, inverse, mult, normalMatrix, perspective, lookAt, vec4, vec3, vec2, subtract, add, scale, rotate, normalize, cross } from '../../libs/MV.js';

import * as dat from '../../libs/dat.gui.module.js';

import * as CUBE from '../../libs/objects/cube.js';
import * as SPHERE from '../../libs/objects/sphere.js';
import * as BUNNY from '../../libs/objects/bunny.js';
import * as TORUS from '../../libs/objects/torus.js';
import * as CYLINDER from '../../libs/objects/cylinder.js';

import * as STACK from '../../libs/stack.js';



const TABLE_MATERIAL = {
        Ka: [30, 25, 15],
        Kd: [180,160,120],
        Ks: [50,50,50],
        shininess: 100
    }

const CUBE_MATERIAL = {
        Ka: [40, 10, 10],
        Kd: [200,40,40],
        Ks: [150,150,150],
        shininess: 100
    }

const CYLINDER_MATERIAL = {
        Ka: [0,20,20],
        Kd: [0,100,100],
        Ks: [100,100,100],
        shininess: 100
    }

const TORUS_MATERIAL = {
        Ka: [0,50,0],
        Kd: [0,200,0],
        Ks: [200,200,200],
        shininess: 100
    }


function setup(shaders) {
    const canvas = document.getElementById('gl-canvas');
    const gl = setupWebGL(canvas);

    CUBE.init(gl);
    SPHERE.init(gl);
    BUNNY.init(gl);
    TORUS.init(gl);
    CYLINDER.init(gl);

    const gouraud_program = buildProgramFromSources(gl, shaders['shader_gouraud.vert'], shaders['shader_gouraud.frag']);
    const phong_program = buildProgramFromSources(gl, shaders['shader_phong.vert'], shaders['shader_phong.frag']);


    // Camera  
    let camera = {
        eye: vec3(0, 5, 20),
        at: vec3(0, 0, 0),
        up: vec3(0, 1, 0),
        fovy: 45,
        aspect: 1,   // Updated further down
        near: 0.1,
        far: 200
    };

    // Options
    let options = {
        shading_model: "phong", // or "gouraud"
        lightsCoord: "camera",  //or world
        wireframe: false,
        blinn: true,            //blinn or normal
        depthBuffer: true,
        backFaceCulling: true,
        currentLight: 1         //displayed on Lights
    };

    // Material aplied in the bunny
    let u_material = {
        Ka: [150,150,150],
        Kd: [150,150,150],
        Ks: [200,200,200],
        shininess: 100
    };

    // Light 1 information
    let l1Info ={
        type: "spotlight",
        onOff: true,
        ambient: [50,50,50],
        diffuse: [150,150,150], 
        specular: [200,200,200],
        position: vec4(0, 5, 0, 1), 
        axis: vec3(0, -1, 0), 
        aperture: 20, 
        cutoff: 15,         
        direction: [-1,-0.5,-0.3,0]
    };

    // Light 2 information
    let l2Info ={
        type: "point",
        onOff: false,
        ambient: [50,50,50],
        diffuse: [0,255,255], 
        specular: [200,200,200],
        position: vec4(-5, 5, 0, 1), 
        axis: vec3(0, -1, 0),   
        aperture: 20,           
        cutoff: 20,   
        direction: [-1,-0.5,-0.3,0]         
    };

    // Light 2 information
    let l3Info ={
        type: "directional",
        onOff: true,
        ambient: [50,50,50],
        diffuse: [255,255,255], 
        specular: [200,200,200],
        position: vec4(0, 6.5, 10, 0), 
        axis: vec3(0, -1, 0),   
        aperture: 20,           
        cutoff: 20,     
        direction: [-1,-0.5,-0.3,0]        
    };

    // All lights in the scene
    let u_lights = [l1Info, l2Info, l3Info];

    /**
     * This method returns a diferent value depending 
     * on the type (of the light) received
     * @param {*determines the type of the light} type 
     * @returns 
     */
    function lightType(type) {
        if(type === "point")
            return 0;
        else if (type === "directional")
            return 1;
        else if (type === "spotlight")
            return 2;
           
    };
    

    const gui = new dat.GUI();


    // ------------- Options -------------
    const optionsGui = gui.addFolder("options");
    optionsGui.add(options, "shading_model", ["phong", "gouraud"]).name("Shading Model:").listen();
    optionsGui.add(options, "lightsCoord", ["camera", "world"]).name("Lights Coords:").listen();
    optionsGui.add(options, "wireframe").name("Wireframe:").listen();
    optionsGui.add(options, "blinn").name("Blinn:").listen();
    optionsGui.add(options, "depthBuffer").name("Depth Buffer:").listen();
    optionsGui.add(options, "backFaceCulling").name("BackFaceCulling:").listen();
    

    // ------------- Camera -------------
    const cameraGui = gui.addFolder("camera");
    cameraGui.add(camera, "fovy").min(1).max(179).step(1).listen();
    cameraGui.add(camera, "aspect").min(0).max(10).step(0.01).listen().domElement.style.pointerEvents = "none";
    cameraGui.add(camera, "near").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
        camera.near = Math.min(camera.far - 0.5, v);
    });
    cameraGui.add(camera, "far").min(0.1).max(200).step(0.01).listen().onChange(function (v) {
        camera.far = Math.max(camera.near + 0.5, v);
    });

    const eye = cameraGui.addFolder("eye");
    eye.add(camera.eye, 0).step(0.05).listen();
    eye.add(camera.eye, 1).step(0.05).listen();
    eye.add(camera.eye, 2).step(0.05).listen();

    const at = cameraGui.addFolder("at");
    at.add(camera.at, 0).step(0.05).listen();
    at.add(camera.at, 1).step(0.05).listen();
    at.add(camera.at, 2).step(0.05).listen();

    const up = cameraGui.addFolder("up");
    up.add(camera.up, 0).step(0.05).listen();
    up.add(camera.up, 1).step(0.05).listen();
    up.add(camera.up, 2).step(0.05).listen();
    

    const lightsGui = gui.addFolder("lights");
    lightsGui.add(options, 'currentLight').name("Current Light:").min(1).max(3).step(1);

    
    // ------------- Light 1 -------------
    const l1Gui = lightsGui.addFolder("Ligth1");
    l1Gui.add(l1Info, "onOff").name("On / Off");
    l1Gui.add(l1Info, "type", ["spotlight", "point", "directional"]).onChange(function(t){
        if(t == "point"){
            l1Info.position[3] = 1;
            l1PositionGui.show();
            l1DirectionsGui.hide();
            l1AxisApertureCutoffGui.hide();
        }else if (t == "directional") {
            l1Info.position[3] = 0;   
            l1PositionGui.hide();
            l1DirectionsGui.show();
            l1AxisApertureCutoffGui.hide();
        } else if(t == "spotlight"){
            l1Info.position[3] = 1;   
            l1PositionGui.show();
            l1DirectionsGui.hide();
            l1AxisApertureCutoffGui.show();    
        }
    });

    const l1PositionGui = l1Gui.addFolder("position")
    l1PositionGui.add(l1Info.position, "0").name("x").step(0.1).listen();
    l1PositionGui.add(l1Info.position, "1").name("y").step(0.1).listen();
    l1PositionGui.add(l1Info.position, "2").name("z").step(0.1).listen();
    l1PositionGui.add(l1Info.position, "3").name("w").listen().domElement.style.pointerEvents = "none";

    const l1IntensitiesGui = l1Gui.addFolder("intensities");
    l1IntensitiesGui.addColor(l1Info, "ambient");
    l1IntensitiesGui.addColor(l1Info, "diffuse");
    l1IntensitiesGui.addColor(l1Info, "specular");

    const l1AxisApertureCutoffGui = l1Gui.addFolder("axis aperture cutoff");
    l1AxisApertureCutoffGui.add(l1Info.axis, "0").name("x").step(1);
    l1AxisApertureCutoffGui.add(l1Info.axis, "1").name("y").step(1);
    l1AxisApertureCutoffGui.add(l1Info.axis, "2").name("z").step(1);

    l1AxisApertureCutoffGui.add(l1Info, "aperture").min(1).max(100).step(1);
    l1AxisApertureCutoffGui.add(l1Info, "cutoff").min(1).max(100).step(1);

    const l1DirectionsGui = l1Gui.addFolder("directions");
    l1DirectionsGui.add(l1Info.direction, "0").name("x").min(-1).max(1).step(0.1);
    l1DirectionsGui.add(l1Info.direction, "1").name("y").min(-1).max(1).step(0.1);
    l1DirectionsGui.add(l1Info.direction, "2").name("z").min(-1).max(1).step(0.1);
    l1DirectionsGui.add(l1Info.direction, "3").name("w").listen().domElement.style.pointerEvents = "none";

    //hide on start
    l1DirectionsGui.hide();


    
    // ------------- Light 2 -------------
    const l2Gui = lightsGui.addFolder("Ligth2");
    l2Gui.add(l2Info, "onOff").name("On / Off");
    l2Gui.add(l2Info, "type", ["spotlight", "point", "directional"]).onChange(function(t){
        if(t == "point"){
            l2Info.position[3] = 1;
            l2PositionGui.show();
            l2DirectionsGui.hide();
            l2AxisApertureCutoffGui.hide();
        }else if (t == "directional") {
            l2Info.position[3] = 0;   
            l2PositionGui.hide();
            l2DirectionsGui.show();
            l2AxisApertureCutoffGui.hide();
        } else if(t == "spotlight"){
            l2Info.position[3] = 1;   
            l2PositionGui.show();
            l2DirectionsGui.hide();
            l2AxisApertureCutoffGui.show();    
        }
    });

    const l2PositionGui = l2Gui.addFolder("position")
    l2PositionGui.add(l2Info.position, "0").name("x").step(0.1).listen();
    l2PositionGui.add(l2Info.position, "1").name("y").step(0.1).listen();
    l2PositionGui.add(l2Info.position, "2").name("z").step(0.1).listen();
    l2PositionGui.add(l2Info.position, "3").name("w").listen().domElement.style.pointerEvents = "none";

    const l2IntensitiesGui = l2Gui.addFolder("intensities")
    l2IntensitiesGui.addColor(l2Info, "ambient");
    l2IntensitiesGui.addColor(l2Info, "diffuse");
    l2IntensitiesGui.addColor(l2Info, "specular");

    const l2AxisApertureCutoffGui = l2Gui.addFolder("axis aperture cutoff");
    l2AxisApertureCutoffGui.add(l2Info.axis, "0").name("x").step(1);
    l2AxisApertureCutoffGui.add(l2Info.axis, "1").name("y").step(1);
    l2AxisApertureCutoffGui.add(l2Info.axis, "2").name("z").step(1);

    l2AxisApertureCutoffGui.add(l2Info, "aperture").min(1).max(100).step(1);
    l2AxisApertureCutoffGui.add(l2Info, "cutoff").min(1).max(100).step(1);

    const l2DirectionsGui = l2Gui.addFolder("directions");
    l2DirectionsGui.add(l2Info.direction, "0").name("x").min(-1).max(1).step(0.1);
    l2DirectionsGui.add(l2Info.direction, "1").name("y").min(-1).max(1).step(0.1);
    l2DirectionsGui.add(l2Info.direction, "2").name("z").min(-1).max(1).step(0.1);
    l2DirectionsGui.add(l2Info.direction, "3").name("w").listen().domElement.style.pointerEvents = "none";

    //hide on start
    l2DirectionsGui.hide();
    l2AxisApertureCutoffGui.hide();



    // ------------- Light 3 -------------
    const l3Gui = lightsGui.addFolder("Ligth3");
    l3Gui.add(l3Info, "onOff").name("On / Off");
    l3Gui.add(l3Info, "type", ["spotlight", "point", "directional"]).onChange(function(t){
        if(t == "point"){
            l3Info.position[3] = 1;
            l3PositionGui.show();
            l3DirectionsGui.hide();
            l3AxisApertureCutoffGui.hide();
        }else if (t == "directional") {
            l3Info.position[3] = 0;   
            l3PositionGui.hide();
            l3DirectionsGui.show();
            l3AxisApertureCutoffGui.hide();
        } else if(t == "spotlight"){
            l3Info.position[3] = 1;   
            l3PositionGui.show();
            l3DirectionsGui.hide();
            l3AxisApertureCutoffGui.show();    
        }
    });

    const l3PositionGui = l3Gui.addFolder("position");
    l3PositionGui.add(l3Info.position, "0").name("x").step(0.1).listen();
    l3PositionGui.add(l3Info.position, "1").name("y").step(0.1).listen();
    l3PositionGui.add(l3Info.position, "2").name("z").step(0.1).listen();
    l3PositionGui.add(l3Info.position, "3").name("w").listen().domElement.style.pointerEvents = "none";

    const l3IntensitiesGui = l3Gui.addFolder("intensities");
    l3IntensitiesGui.addColor(l3Info, "ambient");
    l3IntensitiesGui.addColor(l3Info, "diffuse");
    l3IntensitiesGui.addColor(l3Info, "specular");

    const l3AxisApertureCutoffGui = l3Gui.addFolder("axis aperture cutoff");
    l3AxisApertureCutoffGui.add(l3Info.axis, "0").name("x").step(1);
    l3AxisApertureCutoffGui.add(l3Info.axis, "1").name("y").step(1);
    l3AxisApertureCutoffGui.add(l3Info.axis, "2").name("z").step(1);

    l3AxisApertureCutoffGui.add(l3Info, "aperture").min(1).max(100).step(1);
    l3AxisApertureCutoffGui.add(l3Info, "cutoff").min(1).max(100).step(1);

    const l3DirectionsGui = l3Gui.addFolder("directions");
    l3DirectionsGui.add(l3Info.direction, "0").name("x").min(-1).max(1).step(0.1);
    l3DirectionsGui.add(l3Info.direction, "1").name("y").min(-1).max(1).step(0.1);
    l3DirectionsGui.add(l3Info.direction, "2").name("z").min(-1).max(1).step(0.1);
    l3DirectionsGui.add(l3Info.direction, "3").name("w").listen().domElement.style.pointerEvents = "none";

    //hide on start
    l3PositionGui.hide();
    l3AxisApertureCutoffGui.hide();
   


    // ------------- Material -------------
    const materialGui = gui.addFolder("materials");
    materialGui.addColor(u_material, "Ka");
    materialGui.addColor(u_material, "Kd");
    materialGui.addColor(u_material, "Ks");
    materialGui.add(u_material, "shininess").step(1);
    


    // matrices
    let mView, mProjection;

    let down = false;
    let lastX, lastY;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    resizeCanvasToFullWindow();

    window.addEventListener('resize', resizeCanvasToFullWindow);

    /**
     * This method resets the camera and options parameters
     * to their initial state
     */
    function resetParams(){ 
        camera.eye = vec3(0, 5, 20);
        camera.at = vec3(0, 0, 0);
        camera.up = vec3(0, 1, 0);
        camera.fovy = 45;
        camera.near = 0.1;
        camera.far = 200;
        options.wireframe = false;
        options.shading_model = "phong";
        options.blinn = true;
        options.depthBuffer = true;
        options.backFaceCulling = true;
        options.currentLight = 1;      
    };

    /* Key Commands Logic */ 
    document.onkeydown = function(event) {
        const moveSpeed = 0.5;
        const forward = normalize(subtract(camera.at, camera.eye));
        const right = normalize(cross(forward, camera.up));

        switch(event.key) {
            case 'w':   
                camera.eye = add(camera.eye, scale(moveSpeed, forward));
                camera.at = add(camera.at, scale(moveSpeed, forward));
                break;

            case 's':   
                camera.eye = subtract(camera.eye, scale(moveSpeed, forward));
                camera.at = subtract(camera.at, scale(moveSpeed, forward));
                break;

            case 'a':   
                camera.eye = subtract(camera.eye, scale(moveSpeed, right));
                camera.at = subtract(camera.at, scale(moveSpeed, right));
                break;

            case 'd':   
                camera.eye = add(camera.eye, scale(moveSpeed, right));
                camera.at = add(camera.at, scale(moveSpeed, right));
                break;

            case 'ArrowUp':
                if(options.currentLight == 1)
                    l1Info.position[2] -= moveSpeed;
                else if(options.currentLight == 2)
                    l2Info.position[2] -= moveSpeed;
                else if(options.currentLight == 3)
                    l3Info.position[2] -= moveSpeed;
                break;

            case 'ArrowDown':
                if(options.currentLight == 1)
                    l1Info.position[2] += moveSpeed;
                else if(options.currentLight == 2)
                    l2Info.position[2] += moveSpeed;
                else if(options.currentLight == 3)
                    l3Info.position[2] += moveSpeed;
                break;

            case 'ArrowLeft':
                if(options.currentLight == 1)
                    l1Info.position[0] -= moveSpeed;
                else if(options.currentLight == 2)
                    l2Info.position[0] -= moveSpeed;
                else if(options.currentLight == 3)
                    l3Info.position[0] -= moveSpeed;
                break;

            case 'ArrowRight':
                if(options.currentLight == 1)
                    l1Info.position[0] += moveSpeed;
                else if(options.currentLight == 2)
                    l2Info.position[0] += moveSpeed;
                else if(options.currentLight == 3)
                    l3Info.position[0] += moveSpeed;
                break;

            case 'PageUp':
                if(options.currentLight == 1)
                    l1Info.position[1] += moveSpeed;
                else if(options.currentLight == 2)
                    l2Info.position[1] += moveSpeed;
                else if(options.currentLight == 3)
                    l3Info.position[1] += moveSpeed;
                break;

            case 'PageDown':
                if(options.currentLight == 1)
                    l1Info.position[1] -= moveSpeed;
                else if(options.currentLight == 2)
                    l2Info.position[1] -= moveSpeed;
                else if(options.currentLight == 3)
                    l3Info.position[1] -= moveSpeed;
                break;

            case 'r':
                resetParams();
                break;
        }
    }


    window.addEventListener('wheel', function (event) {
        if (!event.altKey && !event.metaKey && !event.ctrlKey) { // Change fovy
            const factor = 1 - event.deltaY / 1000;
            camera.fovy = Math.max(1, Math.min(100, camera.fovy * factor));
        }
        else if (event.metaKey || event.ctrlKey) {
            // move camera forward and backwards (shift)

            const offset = event.deltaY / 1000;

            const dir = normalize(subtract(camera.at, camera.eye));

            const ce = add(camera.eye, scale(offset, dir));
            const ca = add(camera.at, scale(offset, dir));

            // Can't replace the objects that are being listened by dat.gui, only their properties.
            camera.eye[0] = ce[0];
            camera.eye[1] = ce[1];
            camera.eye[2] = ce[2];

            if (event.ctrlKey) {
                camera.at[0] = ca[0];
                camera.at[1] = ca[1];
                camera.at[2] = ca[2];
            }
        }
    });

    function inCameraSpace(m) {
        const mInvView = inverse(mView);

        return mult(mInvView, mult(m, mView));
    }

    canvas.addEventListener('mousemove', function (event) {
        if (down) {
            const dx = event.offsetX - lastX;
            const dy = event.offsetY - lastY;

            if (dx != 0 || dy != 0) {

                const d = vec2(dx, dy);
                const axis = vec3(-dy, -dx, 0);

                const rotation = rotate(0.5 * length(d), axis);

                let eyeAt = subtract(camera.eye, camera.at);
                eyeAt = vec4(eyeAt[0], eyeAt[1], eyeAt[2], 0);
                let newUp = vec4(camera.up[0], camera.up[1], camera.up[2], 0);

                eyeAt = mult(inCameraSpace(rotation), eyeAt);
                newUp = mult(inCameraSpace(rotation), newUp);

                console.log(eyeAt, newUp);

                camera.eye[0] = camera.at[0] + eyeAt[0];
                camera.eye[1] = camera.at[1] + eyeAt[1];
                camera.eye[2] = camera.at[2] + eyeAt[2];

                camera.up[0] = newUp[0];
                camera.up[1] = newUp[1];
                camera.up[2] = newUp[2];

                lastX = event.offsetX;
                lastY = event.offsetY;
            }

        }
    });

    canvas.addEventListener('mousedown', function (event) {
        down = true;
        lastX = event.offsetX;
        lastY = event.offsetY;
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
    });

    canvas.addEventListener('mouseup', function (event) {
        down = false;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
    });

    window.requestAnimationFrame(render);

    function resizeCanvasToFullWindow() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }


    /**
     * This method draws the table
     * @param {*changes between phong or gouraud program} program 
     */
    function drawTable(program){
        STACK.multScale([10, 0.5, 10]);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_model_view"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_normals"), false, flatten(normalMatrix(STACK.modelView())));
        uploadMaterial(TABLE_MATERIAL, program);
        CUBE.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
    }

    /**
     * This method draws the cube 
     * @param {*changes between phong or gouraud program} program 
     */
    function drawCube(program){
        STACK.multTranslation([-2,1.25,-2]);
        STACK.multScale([2, 2, 2]);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_model_view"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_normals"), false, flatten(normalMatrix(STACK.modelView())));
        uploadMaterial(CUBE_MATERIAL, program);
        CUBE.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
    }

    /**
     * This method draws the cylinder 
     * @param {*changes between phong or gouraud program} program 
     */
    function drawCylinder(program){
        STACK.multTranslation([2,1.25,-2]);
        STACK.multScale([2, 2, 2]);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_model_view"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_normals"), false, flatten(normalMatrix(STACK.modelView())));
        uploadMaterial(CYLINDER_MATERIAL, program);
        CYLINDER.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
    }

    /**
     * This method draws the bunny
     * @param {*changes between phong or gouraud program} program 
     */
    function drawBunny(program){
        STACK.multTranslation([2,1.23,2]);
        STACK.multScale([2, 2, 2]);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_model_view"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_normals"), false, flatten(normalMatrix(STACK.modelView())));
        uploadMaterial(u_material, program);
        BUNNY.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
    }

    /**
     * This method draws the torus
     * @param {*changes between phong or gouraud program} program 
     */
    function drawTorus(program){
        STACK.multTranslation([-2,0.65,2]);
        STACK.multScale([2, 2, 2]);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_model_view"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_normals"), false, flatten(normalMatrix(STACK.modelView())));
        uploadMaterial(TORUS_MATERIAL, program);
        TORUS.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
    }

    /**
     * This method draws all the unitary objects assembled together
     * @param {*changes between phong or gouraud program} program 
     */
    function drawAssembledObjects(program){
        STACK.pushMatrix();
            drawTable(program);
        STACK.popMatrix();
        STACK.pushMatrix();
            drawCube(program);
        STACK.popMatrix();
        STACK.pushMatrix();
            drawCylinder(program);
        STACK.popMatrix();
        STACK.pushMatrix();
            drawBunny(program);
        STACK.popMatrix();
            drawTorus(program);
    }

    /**
     * This method draws the scene 
     * (draws the assembledObjects in loop for the visual effect)
     * @param {*changes between phong or gouraud program} program 
     */
    function drawScene(program) {
        const loop = 5;
        const baseHeight = 0.5;
        const cubeHeight = 2;   
        
        let scaleFactor = 0.15;
        let currentScale = 1;
        let yOffset = 0;    //starts on (0, 0, 0)
        for (let i = 0; i < loop; i++) {
            STACK.pushMatrix();
                STACK.multTranslation([-yOffset*0.8, yOffset*0.91, -yOffset*0.8]); 
                STACK.multScale([currentScale, currentScale, currentScale]);
                drawAssembledObjects(program);
            STACK.popMatrix();

            yOffset += (baseHeight + cubeHeight) * currentScale; 
            currentScale *= scaleFactor;
        }
    }

    /**
     * This method draws the sphere of a light 
     * @param {*changes between phong or gouraud program} program 
     * @param {*specified light to draw} light
     * @param {*the material used to draw (changes if light is on or off)} material 
     */
    function drawLight(program, light, material){
        STACK.multTranslation([light.position[0],light.position[1],light.position[2]]);
        STACK.multScale([0.5, 0.5, 0.5]);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_model_view"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_normals"), false, flatten(normalMatrix(STACK.modelView())));
        uploadMaterial(material, program);
        SPHERE.draw(gl, program, gl.TRIANGLES);
    }

    /**
     * This function draws a sphere around the point of propagation of the 3 lights 
     * (if thay are in type 0 or 2 (point or spotlight))
     * @param {*changes between phong or gouraud program} program 
     */
    function drawLights(program){
        let material;
        let yellowMaterial = { Ka: [255, 255, 0], Kd: [255, 255, 0], Ks: [255, 255, 0], shininess: 1 };
        let greyMaterial = { Ka: [50, 50, 50], Kd: [50, 50, 50], Ks: [50, 50, 50], shininess: 1 }

        for(let i = 0; i < u_lights.length; i++){
            if(u_lights[i].onOff) 
                material = yellowMaterial;  
            else 
                material = greyMaterial;
            if(lightType(u_lights[i].type) != 1){ // draws if point or spotlight
                STACK.pushMatrix();
                    drawLight(program, u_lights[i], material)
                STACK.popMatrix();
            }
        }
    }

    /**
     * This updates the material uniforms to the shaders 
     * @param {*matrix of the material} m 
     * @param {*changes between phong or gouraud program} program 
     */
    function uploadMaterial(m, program){
        //u_material
        const Ka = m.Ka.map(c => c / 255);
        const Kd = m.Kd.map(c => c / 255);
        const Ks = m.Ks.map(c => c / 255);

        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ka"), Ka);
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Kd"), Kd);
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ks"), Ks);
        gl.uniform1f(gl.getUniformLocation(program, "u_material.shininess"), m.shininess);
    }


    /**
     * This function sends the uniform variables to the shaders
     * (except for the material uniforms)
     * @param {*changes between phong or gouraud program} program 
     */
    function sendUniforms(program){

        gl.uniform1i(gl.getUniformLocation(program, "u_use_phong"),options.shading_model == "phong");
        gl.uniform1i(gl.getUniformLocation(program, "u_blinn"), options.blinn? 1 : 0);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_model_view"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_projection"), false, flatten(mProjection));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_normals"), false, flatten(normalMatrix(STACK.modelView())));
        gl.uniform1i(gl.getUniformLocation(program, "u_n_lights"), u_lights.length);

        //u_lights
        for (let i = 0; i < u_lights.length; i++) {
            const light = u_lights[i];
            
            const ambient = light.ambient.map(c => c / 255);
            const diffuse = light.diffuse.map(c => c / 255);
            const specular = light.specular.map(c => c / 255);

            const baseName = `u_lights[${i}]`;

            if(options.lightsCoord === "camera"){
                if(lightType(light.type) == 1)
                    gl.uniform4fv(gl.getUniformLocation(program, `${baseName}.position`), mult(mView, normalize(light.direction))); 
                else
                    gl.uniform4fv(gl.getUniformLocation(program, `${baseName}.position`), mult(mView, light.position)); 
            }   
            else if(options.lightsCoord === "world"){
                if(lightType(light.type) == 1)
                    gl.uniform4fv(gl.getUniformLocation(program, `${baseName}.position`), normalize(light.direction)); 
                else
                    gl.uniform4fv(gl.getUniformLocation(program, `${baseName}.position`), light.position); 
            }
                

            if(options.lightsCoord === "camera")
                gl.uniform3fv(gl.getUniformLocation(program, `${baseName}.axis`), vec3(mult(mView,vec4(light.axis, 0))));
            else if(options.lightsCoord === "world")
                gl.uniform3fv(gl.getUniformLocation(program, `${baseName}.axis`), light.axis);

            gl.uniform3fv(gl.getUniformLocation(program, `${baseName}.ambient`), ambient);
            gl.uniform3fv(gl.getUniformLocation(program, `${baseName}.diffuse`), diffuse);
            gl.uniform3fv(gl.getUniformLocation(program, `${baseName}.specular`), specular);
            gl.uniform1f(gl.getUniformLocation(program, `${baseName}.aperture`), light.aperture);
            gl.uniform1f(gl.getUniformLocation(program, `${baseName}.cutoff`), light.cutoff);
            gl.uniform1i(gl.getUniformLocation(program, `${baseName}.onOff`), light.onOff? 1 : 0);
            gl.uniform1i(gl.getUniformLocation(program, `${baseName}.type`), lightType(light.type));
        }
    }

    function render(time) {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Z-buffer on/off
        if (options.depthBuffer) {
            gl.enable(gl.DEPTH_TEST);
        } else {
            gl.disable(gl.DEPTH_TEST);
        }

        // Back-face culling on/off
        if (options.backFaceCulling) {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);
        } else {
            gl.disable(gl.CULL_FACE);
        }

        // Switch between phong and gouraud
        let program;
        if(options.shading_model == "phong")
            program = phong_program;
        else
            program = gouraud_program;

        gl.useProgram(program);

        mView = lookAt(camera.eye, camera.at, camera.up);
        STACK.loadMatrix(mView);

        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);

        sendUniforms(program);
        
        drawLights(program);
        drawScene(program);

    }
}

const urls = ['shader_gouraud.vert', 'shader_gouraud.frag', 'shader_phong.vert', 'shader_phong.frag'];
loadShadersFromURLS(urls).then(shaders => setup(shaders));
