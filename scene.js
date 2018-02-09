"use strict";

//vertices[axe][0] stocke les indices des vertices qui ont une coordonnee 
//negative selon l'axe "axe" et vertices[axe][1] stocke ceux qui sont positifs.
const indices_vertices                 = [[[], []], [[], []], [[], []]];
const historique_modifications = [[[], []], [[], []], [[], []]];

const souris = {
    dernierX: 0,
    dernierY: 0,
};

var geometry = null;

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
    const wrapperMouseDown = function(event) { onMouseDown(event, raycaster, screenSize, sceneThreeJs); };
    document.addEventListener( 'mousedown', wrapperMouseDown);
    const wrapperMouseUp = function(event) {onMouseUp(event, sceneThreeJs.sceneGraph)};
    document.addEventListener('mouseup', wrapperMouseUp);
    const wrapperMouseMove = function(event) {onMouseMove(event, raycaster, screenSize, sceneThreeJs);};
    document.addEventListener('mousemove', wrapperMouseMove);
    const wrapperKeyDown = function(event) {onKeyDown(event, sceneThreeJs)};
    document.addEventListener('keydown', wrapperKeyDown);
  

    // *************************** //
    // Lancement de l'animation
    // *************************** //
    animationLoop(sceneThreeJs);
}


function onMouseUp(event, sceneGraph) {
    const delta_souris = [event.clientX - souris.dernierX, event.clientY - souris.dernierY];
    var axe_a_modifier = 1;
    if(Math.abs(delta_souris[0]) > Math.abs(delta_souris[1])) {
        axe_a_modifier = 0;
    }
    const orientation_modification = positif(delta_souris[axe_a_modifier]);

    historique_modifications[axe_a_modifier][orientation_modification].push(Math.abs(delta_souris[axe_a_modifier])/FACTEUR_DISTORSION);
    console.log(historique_modifications);
    modifier_sphere(sceneGraph);
}


function onMouseDown(event, raycaster, screenSize, sceneThreeJs) {
    souris.dernierX = event.clientX;
    souris.dernierY = event.clientY;
    //unite = pixels sur l'ecran

    console.log(souris.dernierX, '/', souris.dernierY);
}

const FACTEUR_DISTORSION = 200;

function onMouseMove(event, raycaster, screenSize, sceneThreeJs) {
}

function onKeyDown(event, sceneThreeJs) {
}

function init3DObjects(sceneGraph) {
    initialiser_geometry();
    initialiser_sphere(sceneGraph);
}

// Fonction d'initialisation d'une scène 3D sans objets 3D
//  Création d'un graphe de scène et ajout d'une caméra et d'une lumière.
//  Création d'un moteur de rendu et ajout dans le document HTML
function initEmptyScene(sceneThreeJs) {

    sceneThreeJs.sceneGraph = new THREE.Scene();

    sceneThreeJs.camera = sceneInit.createCamera(0, 0, -5);
    //la camera est situee sur l'axe z 
    sceneThreeJs.camera.lookAt(0, 0, 0);
    sceneInit.insertAmbientLight(sceneThreeJs.sceneGraph);
    sceneInit.insertLight(sceneThreeJs.sceneGraph,Vector3(1,2,2));

    sceneThreeJs.renderer = sceneInit.createRenderer();
    sceneInit.insertRenderInHtml(sceneThreeJs.renderer.domElement);

    sceneThreeJs.controls = new THREE.OrbitControls(sceneThreeJs.camera);
    sceneThreeJs.controls.enabled = false;

    window.addEventListener('resize', function(event){onResize(sceneThreeJs);}, false);
}

// Demande le rendu de la scène 3D
function render(sceneThreeJs) {
    sceneThreeJs.renderer.render(sceneThreeJs.sceneGraph, sceneThreeJs.camera);
}

function animate(sceneThreeJs, time) {
    const t = time/1000;//time in second
    render(sceneThreeJs);
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

/*
Fonctions utilitaires servant a diverses choses
*/
function creerPoint(v) {
    const sphereGeometry = primitive.Sphere(v, 0.02);
    const sphere = new THREE.Mesh(sphereGeometry, MaterialRGB(1, 0, 0));
    return sphere;
}

function initialiser_sphere(sceneGraph) {
    
    var material = MaterialRGB(0.1, 0.1, 0.1);

    var sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0, 0, 0);
    sphere.name = "sphere";

    sceneGraph.add(sphere);
}

function modifier_sphere(sceneGraph) {
    //Utilise la variable globale historique_modifications
    detruire_sphere(sceneGraph);

    initialiser_geometry();
    modifier_geometry();
    initialiser_sphere(sceneGraph);
}

function detruire_sphere(sceneGraph) {
    const object = sceneGraph.getObjectByName("sphere");
    sceneGraph.remove(object);
}

function initialiser_geometry() {
    geometry = new THREE.SphereGeometry(1, 32, 32);
    geometry.vertices.matrixAutoUpdate = false;
    const vertices = geometry.vertices;
    for(var i = 0; i < vertices.length; i++) {
        const v = vertices[i];
        indices_vertices[2][positif(v.z)].push(i);
        indices_vertices[0][positif(v.x)].push(i);
        indices_vertices[1][positif(v.y)].push(i);
    }
}

function modifier_geometry() {
    for(var axe = 0; axe < 3; axe++) {
        for(var sens = 0; sens < 2; sens++) {
            //on est sur un axe donnee, reste a parcourir l'historique de transformations
            for(var modif = 0; modif < historique_modifications[axe][sens].length; modif++) {
                //on est sur une modif donneees
                for(var i = 0; i < indices_vertices[axe][sens].length; i++) {
                    const indice = indices_vertices[axe][sens][i];
                    const facteur = historique_modifications[axe][sens][modif]
                    if(axe === 0) {
                        geometry.vertices[indice].x = geometry.vertices[indice].x * facteur;
                    }
                    else if(axe === 1){
                        geometry.vertices[indice].y = geometry.vertices[indice].y * facteur;
                    }
                    else if(axe === 2) {
                        geometry.vertices[indice].z = geometry.vertices[indice].z * facteur;
                    }
                
                }
            }

        }
    }
}

function positif(x) {
    if(x >= 0) {
        return 1;
    }
    else{
        return 0;
    }
}