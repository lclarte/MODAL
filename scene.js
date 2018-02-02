"use strict";

const listePoints = [];
const points_objects = null;
let formeActuelle = null;
let curveShape = null;
let plat = true;

main();

function main(){

    const sceneThreeJs = {
        sceneGraph: null,
        camera: null,
        renderer: null,
        controls: null,
    };

    initEmptyScene(sceneThreeJs);
    init3DObjects(sceneThreeJs.sceneGraph);

    const raycaster = new THREE.Raycaster();

    const screenSize = {
        w:sceneThreeJs.renderer.domElement.clientWidth,
        h:sceneThreeJs.renderer.domElement.clientHeight
    };

    // Fonction à appeler lors du clic de la souris: selection d'un objet
    //  (Création d'un wrapper pour y passer les paramètres souhaités)
    const wrapperMouseDown = function(event) { onMouseDown(event, raycaster, screenSize, sceneThreeJs.sceneGraph,sceneThreeJs.camera); };
    document.addEventListener( 'mousedown', wrapperMouseDown);
    const wrapperMouseUp = function(event) {onMouseUp(event)};
    document.addEventListener('mouseup', wrapperMouseUp);
    const wrapperMouseMove = function(event) {onMouseMove(event, raycaster, screenSize, sceneThreeJs.sceneGraph, sceneThreeJs.camera);};
    document.addEventListener('mousemove', wrapperMouseMove);
    const wrapperKeyDown = function(event) {onKeyDown(event, sceneThreeJs)};
    document.addEventListener('keydown', wrapperKeyDown);

    // *************************** //
    // Lancement de l'animatio
    // *************************** //
    animationLoop(sceneThreeJs);
}

function saveScene(sceneGraph,createdObjects) {
    download( JSON.stringify(sceneGraph), "save_scene.js" );
}

function init3DObjects(sceneGraph) {
    const planeGeometry = primitive.Quadrangle(Vector3(-10, 0, -10), Vector3(-10, 0, 10), Vector3(10, 0, 10), Vector3(10, 0, -10));
    const plane = new THREE.Mesh(planeGeometry, MaterialRGB(2, 2, 2));
    plane.material.opacity = 0;
    plane.material.transparent = true; //les deux lignes sont necessaires 
    sceneGraph.add(plane);
}

function onMouseDown(event, raycaster, screenSize, sceneGraph, camera) {
    /*
    if(plat){
        
        const pointIntersection = calculer_point_intersection(event, raycaster, screenSize, sceneGraph, camera);
        modifier_wireframe(pointIntersection, sceneGraph);
    }
    */
}

function calculer_point_intersection(event, raycaster, screenSize, sceneGraph, camera) {
    const xPixel = event.clientX;
    const yPixel = event.clientY;

    const x =  2*xPixel/screenSize.w - 1; //(entre -1 et 1)
    const y = -2*yPixel/screenSize.h + 1;

    raycaster.setFromCamera(Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects(sceneGraph.children);
    const intersection = intersects[0];
    const pointIntersection = intersection.point.clone();

    return pointIntersection;
}

function modifier_wireframe(pointIntersection, sceneGraph) {
        listePoints.push(Vector2(pointIntersection.x, pointIntersection.z));
        sceneGraph.add(creerPoint(pointIntersection));

        const objet = sceneGraph.getObjectByName("wireframe");
        sceneGraph.remove(objet);

        curveShape = new THREE.Shape(listePoints);
        const epaisseur = 0.1;

        const geometryWireframe = new THREE.ShapeGeometry(curveShape);
        const materialWireframe = new THREE.MeshBasicMaterial({color:0xff0000, wireframe: true, wireframeLinewidth: 2});
        const objectWireframe = new THREE.Mesh(geometryWireframe, materialWireframe);
        objectWireframe.position.set(0, 0, 0);
        objectWireframe.rotateX(Math.PI/2);
        objectWireframe.name = "wireframe";
        sceneGraph.add(objectWireframe);  
}

function onMouseUp(event) {

}

function onMouseMove(event, raycaster, screenSize, sceneGraph, camera) {
    /*
    Si pas de bouton appuyee, buttons = 0
    si le bouton gauche, c'est 1 et si c'est le bouton droit, ca vaut 2
    */
    if(plat && event.buttons === 1) {
        const pointIntersection = calculer_point_intersection(event, raycaster, screenSize, sceneGraph, camera);
        modifier_wireframe(pointIntersection, sceneGraph);
    }
}

function onKeyDown(event, scene) {
    const altPressed = event.altKey;
    if(plat === true && event.shiftKey === true) {
        scene.controls.enabled = true;
        plat = false;
        extruder(scene.sceneGraph, curveShape);
        const wf = scene.sceneGraph.getObjectByName("wireframe");
        scene.sceneGraph.remove(wf);
    }
}

// Demande le rendu de la scène 3D
function render(sceneThreeJs) {
    sceneThreeJs.renderer.render(sceneThreeJs.sceneGraph, sceneThreeJs.camera);
}

function animate(sceneThreeJs, time) {

    const t = time/1000;//time in second
    render(sceneThreeJs);
}

// Fonction d'initialisation d'une scène 3D sans objets 3D
//  Création d'un graphe de scène et ajout d'une caméra et d'une lumière.
//  Création d'un moteur de rendu et ajout dans le document HTML
function initEmptyScene(sceneThreeJs) {

    sceneThreeJs.sceneGraph = new THREE.Scene();

    sceneThreeJs.camera = sceneInit.createCamera(0, 5, 0);
    sceneThreeJs.camera.lookAt(0, 0, 0);
    sceneInit.insertAmbientLight(sceneThreeJs.sceneGraph);
    sceneInit.insertLight(sceneThreeJs.sceneGraph,Vector3(1,2,2));

    sceneThreeJs.renderer = sceneInit.createRenderer();
    sceneInit.insertRenderInHtml(sceneThreeJs.renderer.domElement);

    sceneThreeJs.controls = new THREE.OrbitControls(sceneThreeJs.camera);
    sceneThreeJs.controls.enabled = false;

    window.addEventListener('resize', function(event){onResize(sceneThreeJs);}, false);
}

// Fonction de gestion d'animation
function animationLoop(sceneThreeJs) {

    // Fonction JavaScript de demande d'image courante à afficher
    requestAnimationFrame(

        // La fonction (dite de callback) recoit en paramètre le temps courant
        function(timeStamp){
            animate(sceneThreeJs,timeStamp); // appel de notre fonction d'animation
            animationLoop(sceneThreeJs); // relance une nouvelle demande de mise à jour
        }

    );

}

// Fonction appelée lors du redimensionnement de la fenetre
function onResize(sceneThreeJs) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    sceneThreeJs.camera.aspect = width / height;
    sceneThreeJs.camera.updateProjectionMatrix();

    sceneThreeJs.renderer.setSize(width, height);
}

function Vector3(x,y,z) {
    return new THREE.Vector3(x,y,z);
}

function Vector2(x,y) {
    return new THREE.Vector2(x,y);
}

function MaterialRGB(r,g,b) {
    const c = new THREE.Color(r,g,b);
    return new THREE.MeshLambertMaterial( {color:c} );
}

//Fonctions perso 
function creerPoint(v) {
    const sphereGeometry = primitive.Sphere(v, 0.02);
    const sphere = new THREE.Mesh(sphereGeometry, MaterialRGB(1, 0, 0));
    return sphere;
}

function extruder(sceneGraph, curve) {
    let epaisseur = 1;
    //modifier les parametres d'extrusion pour que la largeur s'adapte a la longueur
    const extrudeSettings = {amount: epaisseur, bevelEnabled:false};
    const extrudeGeometry = new THREE.ExtrudeBufferGeometry(curve, extrudeSettings);
    const extrudeObject   = new THREE.Mesh(extrudeGeometry, MaterialRGB(1, 1, 1));
    extrudeObject.name = "corps";
    extrudeObject.rotateX(Math.PI/2);
    sceneGraph.add(extrudeObject);
}