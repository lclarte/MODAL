"use strict";

//cette structure constitue une enumeration pour 
//savoir dans quelle phase de conception on est
//actuellement.

const phases = {
    PHASE_CORPS:   0,
    PHASE_BALLONS: 1,
    PHASE_DETAILS: 2,
};

let phase_actuelle = phases.PHASE_CORPS;

//la structure variablesCorps va stocker les variables servant a la construction et la modification du
//corps du vaisseau
const variablesCorps = {
    listePoints: [], //stocke la liste de tous les points qui constituent le corps du vaisseau
    indicesCoins: [], //stocke les indices des elements de listePoints qui sont des coins du corps
    plat: true,
};

//Pour le ballon, on va tracer une ligne et on va extraire la longueur de la ligne pour decider d'ou on met 
//le ballon et quelle longueur/largeur il aura
const variablesBallons = {
    listePoints: [],
    modele_ballon: null,
};

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
    const wrapperMouseUp = function(event) {onMouseUp(event)};
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


function onMouseUp(event) {
    if(phase_actuelle == phases.PHASE_BALLONS) {
        listePoints_to_ballons();
    }
}


function onMouseDown(event, raycaster, screenSize, sceneThreeJs) {
}

function onMouseMove(event, raycaster, screenSize, sceneThreeJs) {
    if(phase_actuelle === phases.PHASE_CORPS && event.buttons === 1) {
        const pointIntersection = calculer_point_intersection(event, raycaster, screenSize, sceneThreeJs);
        modifier_wireframe(pointIntersection, sceneThreeJs);
    }
    else if (phase_actuelle === phases.PHASE_BALLONS && event.buttons === 1){
        const pointIntersection = calculer_point_intersection(event, raycaster, screenSize, sceneThreeJs);
        modifier_listePoints_ballons(pointIntersection, sceneThreeJs);
        listePoints_to_curve(sceneThreeJs);
    }
}

function onKeyDown(event, sceneThreeJs) {
    const altPressed = event.altKey;
    if(variablesCorps.plat === true && event.shiftKey === true) {
        //dans un premier temps, il faut verifier si le dernier point s
        //forme un angle droit avec le point 0 
        calculer_dernier_angle_droit(sceneThreeJs);

        //sceneThreeJs.controls.enabled = true;
        
        variablesCorps.plat = false;
        extruder_listePoints(sceneThreeJs);
        const wf = sceneThreeJs.sceneGraph.getObjectByName("wireframe");
        sceneThreeJs.sceneGraph.remove(wf);

        phase_actuelle = phases.PHASE_BALLONS;
    }
}

function init3DObjects(sceneGraph) {
    const planeGeometry = primitive.Quadrangle(Vector3(-10, -10, 0), Vector3(-10, 10, 0), Vector3(10, 10, 0), Vector3(10, -10, 0));
    const plane = new THREE.Mesh(planeGeometry, MaterialRGB(2, 2, 2));
    plane.material.opacity = 0;
    plane.material.transparent = true; //les deux lignes sont necessaires 
    sceneGraph.add(plane);

    init_modele_ballon();
}

//importe le modele de ballon
function init_modele_ballon() {

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


function calculer_point_intersection(event, raycaster, screenSize, sceneThreeJs) {
    const sceneGraph = sceneThreeJs.sceneGraph;
    const camera     = sceneThreeJs.camera;

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

/*
POUR LA PHASE UNE 
*/

function calculer_dernier_angle_droit(sceneThreeJs) {
        const listePoints = variablesCorps.listePoints;
        const n           =  listePoints.length;
        const p1          = listePoints[n-2];
        const p2          = listePoints[n-1];
        const p3          = listePoints[0];

        if(tester_angle_aigu(p1, p2, p3)) {
            variablesCorps.indicesCoins.push(n-1);
            const ptAngle = listePoints[n-1];
            console.log(variablesCorps.indicesCoins);
            sceneThreeJs.sceneGraph.add(creerPoint(Vector3(ptAngle.x, ptAngle.y, 0)));
        }
        
}

function modifier_wireframe(pointIntersection, sceneThreeJs) {
        const sceneGraph = sceneThreeJs.sceneGraph;
        const listePoints = variablesCorps.listePoints;
        const indicesCoins = variablesCorps.indicesCoins;

        const n_dernier = listePoints.length;


        if(n_dernier === 0 || tester_deplacement_souris(listePoints[n_dernier-1], pointIntersection.x, pointIntersection.y)){
            listePoints.push(Vector2(pointIntersection.x, pointIntersection.y));
            const n = listePoints.length; //longueur APRES avoir ajouter le denrier 
            if(n >= 3) {
                const p1 = listePoints[n-3];
                const p2 = listePoints[n-2];
                const p3 = listePoints[n-1];
                if(tester_angle_aigu(p1, p2, p3)) {
                    const n = listePoints.length;
                    const ptAngle = listePoints[n-2];
                    indicesCoins.push(n-2);
                    console.log(indicesCoins)
                    sceneGraph.add(creerPoint(Vector3(ptAngle.x, ptAngle.y, 0)));
                }
            }
        }
        //sceneGraph.add(creerPoint(pointIntersection)); cette fonction ajoute les points
        //sur le wireframe mais en vrai on s'en bat les couilles donc on l'enleve

        const objet = sceneGraph.getObjectByName("wireframe");
        sceneGraph.remove(objet);

        const curveShape = new THREE.Shape(listePoints);
        const epaisseur = 0.1;

        //cette etape convertit la liste de points en objet 3D
        const geometryWireframe = new THREE.ShapeGeometry(curveShape);
        const materialWireframe = new THREE.MeshBasicMaterial({color:0xff0000, wireframe: true, wireframeLinewidth: 2});
        const objectWireframe = new THREE.Mesh(geometryWireframe, materialWireframe);
        objectWireframe.position.set(0, 0, 0);
        objectWireframe.name = "wireframe";
        sceneGraph.add(objectWireframe);  

}

function lisser_listePoints() {
}

/** POUR LA DEUXUEME PHASE */

function modifier_listePoints_ballons(pointIntersection3D, sceneThreeJs) {
    //Modifie la liste des points pour faire les ballons
    const listePoints = variablesBallons.listePoints;
    const n = listePoints.length;

    if(n === 0 || tester_deplacement_souris(listePoints[n-1], pointIntersection3D.x, pointIntersection3D.y) === true) {
        listePoints.push(Vector2(pointIntersection3D.x, pointIntersection3D.y));
    }
}

function listePoints_to_curve(sceneThreeJs) {
    //sert juste a tracer la courbe qui montre l'historique de deplacement de la souris
    const sceneGraph = sceneThreeJs.sceneGraph;
    const listePoints = variablesBallons.listePoints;
    const n = listePoints.length;
    console.log(n);

    //On commence par retirer la courbe precedente de sceneGraph
    const o = sceneGraph.getObjectByName("ballons_curve");
    sceneGraph.remove(o);

    const geometry = new THREE.Geometry();
    for(let i = 0; i < n; i++){
        geometry.vertices.push(Vector3(listePoints[i].x, listePoints[i].y, 0));
    }

    const material = new THREE.LineBasicMaterial({color: 0x000000});  
    const ballons_curve = new THREE.Line(geometry, material); // la ligne en 3D

    ballons_curve.name = "ballons_curve";
    sceneGraph.add(ballons_curve);
}

function listePoints_to_ballons(){
    //convertir la liste des points en object ovoidal. La methode est : 
    //pour l'instant, de maniere tres simplifiee, on extrait la longueur maximale et la position du centre
    //par moyennage pour en faire une ellipse 
    const position_moyenne = Vector2(0, 0);
    const listePoints = variablesCorps.listePoints;

    const n = listePoints.length;
    for(let i=0; i < n; i++) {
        position_moyenne.addScaledVector(listePoints[i], 1/n);
    }

    variablesCorps.listePoints = [];
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

Fonctions utilitaires permettant de verifier certaines proprietes geometriques 

*/

const SEUIL_ANGLE_AIGU = 1.0;

function tester_angle_aigu(p1, p2, p3) { 
    //Fonction a appeler pour tester si le dernier point qu'on a 
    //ajoute forme un angle aigu avec les deux precedents
    const a = angle(p1, p2, p3);
    if(Math.abs(a) > SEUIL_ANGLE_AIGU) {
        return true;
    }
    else{
        return false;
    }
}

const SEUIL_DEPLACEMENT_SOURIS = 0.2;

function tester_deplacement_souris(dernierPoint, x, y) {
    //On teste si la souris s'est deplacee d'assez pour qu'on modifie le wireframe
    //x et y sont la position de la souris DANS le referentiel, pas sur l'ecran$
    const d = distance(dernierPoint, Vector2(x, y));
    return (d > SEUIL_DEPLACEMENT_SOURIS);
}


/*
Fonctions utilitaires servant a diverses choses
*/
function creerPoint(v) {
    const sphereGeometry = primitive.Sphere(v, 0.02);
    const sphere = new THREE.Mesh(sphereGeometry, MaterialRGB(1, 0, 0));
    return sphere;
}

function extruder_listePoints(sceneThreeJs) {
    const sceneGraph = sceneThreeJs.sceneGraph;
    const listePoints = variablesCorps.listePoints;

    const curveShape = new THREE.Shape(listePoints);

    let epaisseur = 1;
    //modifier les parametres d'extrusion pour que la largeur s'adapte a la longueur
    const extrudeSettings = {amount: epaisseur, bevelEnabled:false};
    const extrudeGeometry = new THREE.ExtrudeBufferGeometry(curveShape, extrudeSettings);
    const extrudeObject   = new THREE.Mesh(extrudeGeometry, MaterialRGB(1, 1, 1));
    extrudeObject.name = "corps";
    sceneGraph.add(extrudeObject);
}

function angle(p1, p2, p3) {
    //Ici, on a des points de dimension 2
    const v1 = [p2.x - p1.x, p2.y - p1.y];
    const v2 = [p3.x - p2.x, p3.y - p2.y];
    return Math.acos(dot(v1, v2)/Math.sqrt((dot(v1, v1)*dot(v2, v2)))); 
}

function dot(v1, v2) {
    let product = 0;
    for(var i = 0; i < v1.length; i++) {
        product += v1[i]*v2[i];
    }
    return product;
}

function norme(v) {
    return Math.sqrt(dot(v, v));
}

function distance(p1, p2) {
    const v = [p2.x - p1.x, p2.y - p1.y];
    return norme(v);
}