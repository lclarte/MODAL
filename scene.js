"use strict";

//vertices[axe][0] stocke les indices des vertices qui ont une coordonnee 
//negative selon l'axe "axe" et vertices[axe][1] stocke ceux qui sont positifs.

//a implementer : petites spheres a cliquer pour pouvoir modifier le ballon, et qui coincident avec 
//les extremites de la sphere. ces "handlers" se deplaceront du montant de deplacement de la souris 

const RAYON = 0.1;

const handlers                         = [[[], []], [[], []], [[], []]];
var position_handlers                = [[Vector3(-1, 0, 0), Vector3(1, 0, 0)],
                                            [Vector3(0, -1, 0), Vector3(0, 1, 0)],
                                            [Vector3(0, 0, -1), Vector3(0, 0, 1)]
                                            ];
const indices_vertices                 = [[[], []], [[], []], [[], []]];
const historique_modifications         = [[[], []], [[], []], [[], []]];

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
        pickableObjects: null, //objets pouvant etre selectionnes par l'utilisateur avec le raytracer
    };

    initEmptyScene(sceneThreeJs);
    init3DObjects(sceneThreeJs);

    const raycaster = new THREE.Raycaster();

    const screenSize = {
        w:sceneThreeJs.renderer.domElement.clientWidth,
        h:sceneThreeJs.renderer.domElement.clientHeight
    };

    // Fonction à appeler lors du clic de la souris: selection d'un objet
    //  (Création d'un wrapper pour y passer les paramètres souhaités)
    const wrapperMouseDown = function(event) { onMouseDown(event, raycaster, screenSize, sceneThreeJs); };
    document.addEventListener( 'mousedown', wrapperMouseDown);
    const wrapperMouseUp = function(event) {onMouseUp(event, sceneThreeJs)};
    document.addEventListener('mouseup', wrapperMouseUp);
    const wrapperMouseMove = function(event) {onMouseMove(event, raycaster, screenSize, sceneThreeJs);};
    document.addEventListener('mousemove', wrapperMouseMove);
    const wrapperKeyDown = function(event) {onKeyDown(event, sceneThreeJs)};
    document.addEventListener('keydown', wrapperKeyDown);
  
    historique_modifications[0][0].push(0.0);
    //historique_modifications[0][0].push(1.0);
    modifier_sphere(sceneThreeJs);
    console.log(handlers[0][0]);

    // *************************** //
    // Lancement de l'animation
    // *************************** //
    animationLoop(sceneThreeJs);
}


function onMouseUp(event, sceneThreeJs) {
    /*
    const sceneGraph = sceneThreeJs.sceneGraph;

    const delta_souris = [event.clientX - souris.dernierX, event.clientY - souris.dernierY];
    var axe_a_modifier = 1;
    if(Math.abs(delta_souris[0]) > Math.abs(delta_souris[1])) {
        axe_a_modifier = 0;
    }
    const orientation_modification = positif(delta_souris[axe_a_modifier]);

    historique_modifications[axe_a_modifier][orientation_modification].push(Math.abs(delta_souris[axe_a_modifier])/FACTEUR_DISTORSION);
    modifier_sphere(sceneThreeJs);*/
}


function onMouseDown(event, raycaster, screenSize, sceneThreeJs) {
    souris.dernierX = event.clientX;
    souris.dernierY = event.clientY;
}

const FACTEUR_DISTORSION = 200;

function onMouseMove(event, raycaster, screenSize, sceneThreeJs) {
}

function onKeyDown(event, sceneThreeJs) {
}

function init3DObjects(sceneThreeJs) {
    const sceneGraph = sceneThreeJs.sceneGraph;
    initFrameXYZ(sceneGraph);

    initialiser_geometry();
    initialiser_sphere(sceneGraph);

    initialiser_handlers(sceneThreeJs);
}

// Fonction d'initialisation d'une scène 3D sans objets 3D
//  Création d'un graphe de scène et ajout d'une caméra et d'une lumière.
//  Création d'un moteur de rendu et ajout dans le document HTML
function initEmptyScene(sceneThreeJs) {
    sceneThreeJs.pickableObjects = new THREE.Group();

    sceneThreeJs.sceneGraph = new THREE.Scene();
    sceneThreeJs.sceneGraph.add(sceneThreeJs.pickableObjects);

    sceneThreeJs.camera = sceneInit.createCamera(0, 0, -5);
    //la camera est situee sur l'axe z 
    sceneThreeJs.camera.lookAt(0, 0, 0);
    sceneInit.insertAmbientLight(sceneThreeJs.sceneGraph);
    sceneInit.insertLight(sceneThreeJs.sceneGraph,Vector3(1,2,2));

    sceneThreeJs.renderer = sceneInit.createRenderer();
    sceneInit.insertRenderInHtml(sceneThreeJs.renderer.domElement);

    sceneThreeJs.controls = new THREE.OrbitControls(sceneThreeJs.camera);
    sceneThreeJs.controls.enabled = true;

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
    const sphereGeometry = primitive.Sphere(v, RAYON);
    var sphere = new THREE.Mesh(sphereGeometry, MaterialRGB(1, 0, 0));
    return sphere;
}

function initialiser_sphere(sceneGraph) {
    
    var material = MaterialRGB(0.1, 0.1, 0.1);

    var sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0, 0, 0);
    sphere.name = "sphere";

    sceneGraph.add(sphere);
}

function initialiser_handlers(sceneThreeJs) {

    for(var axe=0;axe<3; axe++) {
        for(var positif=0; positif<2; positif++) {
            var objet = creerPoint(position_handlers[axe][positif]);
            handlers[axe][positif] = objet;

            sceneThreeJs.pickableObjects.add(objet);
            console.log(objet);
        }
    }

}

function modifier_sphere(sceneThreeJs) {
    const sceneGraph = sceneThreeJs.sceneGraph;

    //Utilise la variable globale historique_modifications
    detruire_sphere(sceneGraph);

    initialiser_handlers(sceneThreeJs);
    initialiser_geometry();
    modifier_geometry();
    initialiser_sphere(sceneGraph);
}

function detruire_sphere(sceneGraph) {
    const object = sceneGraph.getObjectByName("sphere");
    sceneGraph.remove(object);
}

function initialiser_geometry() {
    geometry = new THREE.SphereGeometry(1.0, 32, 32);
    geometry.vertices.matrixAutoUpdate = false;
    const vertices = geometry.vertices;
    for(var i = 0; i < vertices.length; i++) {
        const v = vertices[i];
        indices_vertices[0][positif(v.x)].push(i);
        indices_vertices[1][positif(v.y)].push(i);
        indices_vertices[2][positif(v.z)].push(i);
    }
}


//NOTE : les vertex n'ont que trois coordonnees 

//autre methode proposee par le prof qui est meilleure : on prend une matrice diagonale (x, y, z)
//dont on modifie les coefficients en fonction de l'axe et de la ou on est, puis on applique
//ladite matrice aux points 
function modifier_geometry() {
    for(var axe = 0; axe < 3; axe++) {
        for(var sens = 0; sens < 2; sens++) {
            
            var matrice_modifications = new THREE.Matrix3();
            matrice_modifications.identity();
            
            //on est sur un axe donnee, reste a parcourir l'historique de transformations
            for(var modif = 0; modif < historique_modifications[axe][sens].length; modif++) {
            //on est sur une modif donneees
                const facteur = historique_modifications[axe][sens][modif];
                matrice_modifications.elements[4*axe] *= facteur;

                handlers[axe][sens].position.set(0, 0, 0);
                handlers[axe][sens].updateMatrix();

                for(var i = 0; i < indices_vertices[axe][sens].length; i++) {
                    const indice = indices_vertices[axe][sens][i];
                    geometry.vertices[indice].applyMatrix3(matrice_modifications);              
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

// Creation de repères visuels indiquant les axes X,Y,Z entre [-1,1]
function initFrameXYZ(sceneGraph) {

    const rCylinder = 0.01;
    const rCone = 0.04;
    const alpha = 0.1;

    // Creation des axes
    const axeXGeometry = primitive.Arrow(Vector3(0,0,0), Vector3(1,0,0), rCylinder, rCone, alpha);
    const axeX = new THREE.Mesh(axeXGeometry, MaterialRGB(1,0,0));

    const axeYGeometry = primitive.Arrow(Vector3(0,0,0), Vector3(0,1,0), rCylinder, rCone, alpha);
    const axeY = new THREE.Mesh(axeYGeometry, MaterialRGB(0,1,0));

    const axeZGeometry = primitive.Arrow(Vector3(0,0,0), Vector3(0,0,1), rCylinder, rCone, alpha);
    const axeZ = new THREE.Mesh(axeZGeometry, MaterialRGB(0,0,1));

    axeX.receiveShadow = true;
    axeY.receiveShadow = true;
    axeZ.receiveShadow = true;

    sceneGraph.add(axeX);
    sceneGraph.add(axeY);
    sceneGraph.add(axeZ);

    // Sphère en (0,0,0)
    const rSphere = 0.05;
    const sphereGeometry = primitive.Sphere(Vector3(0,0,0), rSphere);
    const sphere = new THREE.Mesh(sphereGeometry, MaterialRGB(1,1,1));
    sphere.receiveShadow = true;
    sceneGraph.add(sphere);



    // Creation des plans
    const L = 1;
    const planeXYGeometry = primitive.Quadrangle(Vector3(0,0,0), Vector3(L,0,0), Vector3(L,L,0), Vector3(0,L,0));
    const planeXY = new THREE.Mesh(planeXYGeometry, MaterialRGB(1,1,0.7));

    const planeYZGeometry = primitive.Quadrangle(Vector3(0,0,0),Vector3(0,L,0),Vector3(0,L,L),Vector3(0,0,L));
    const planeYZ = new THREE.Mesh(planeYZGeometry,MaterialRGB(0.7,1,1));

    const planeXZGeometry = primitive.Quadrangle(Vector3(0,0,0),Vector3(0,0,L),Vector3(L,0,L),Vector3(L,0,0));
    const planeXZ = new THREE.Mesh(planeXZGeometry,MaterialRGB(1,0.7,1));

    planeXY.receiveShadow = true;
    planeYZ.receiveShadow = true;
    planeXZ.receiveShadow = true;


    sceneGraph.add(planeXY);
    sceneGraph.add(planeYZ);
    sceneGraph.add(planeXZ);

}