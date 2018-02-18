"use strict";

//remarque importante : on peut ajouter des champs 

//cette structure constitue une enumeration pour 
//savoir dans quelle phase de conception on est
//actuellement.
const R_B_D = 0.5; //Rayon du Ballon par Defaut

const position_defaut_handlers = [Vector3(-R_B_D, 0, 0), Vector3(R_B_D, 0, 0), Vector3(0, -R_B_D, 0), Vector3(0, R_B_D, 0), Vector3(0, 0, -R_B_D), Vector3(0, 0, R_B_D)];

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
    instances: [], //stocke les instances des ballons
    //dans chaque instance on va mettre 
    //-> la position du centre
    //-> un groupe pour regrouper les handlers; la position relative des handlers par rapport au centre
    picked_handler: null, //le handler selectionnne lors du clic de la souris
};

main();

function main(){


    const sceneThreeJs = {
        sceneGraph: null,
        camera: null,
        renderer: null,
        controls: null,
        pickableObjects: [],
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
    const wrapperMouseUp = function(event) {onMouseUp(event)};
    document.addEventListener('mouseup', wrapperMouseUp);
    const wrapperMouseMove = function(event) {onMouseMove(event, raycaster, screenSize, sceneThreeJs);};
    document.addEventListener('mousemove', wrapperMouseMove);
    const wrapperKeyDown = function(event) {onKeyDown(event, sceneThreeJs)};
    document.addEventListener('keydown', wrapperKeyDown);
    const wrapperKeyUp = function(event) {onKeyUp(event, sceneThreeJs)};
    document.addEventListener('keyup', wrapperKeyUp);

    // *************************** //
    // Lancement de l'animation
    // *************************** //
    animationLoop(sceneThreeJs);
}


function onMouseUp(event) {
    if(phase_actuelle == phases.PHASE_BALLONS) {
        variablesBallons.picked_handler = null;
    }
}

function onMouseDown(event, raycaster, screenSize, sceneThreeJs) {
    if(sceneThreeJs.controls.enabled) {
        return;
    }
    calculer_handler_intersection(event, raycaster, screenSize, sceneThreeJs);
    if(variablesBallons.picked_handler === null && event.buttons === 1 && phase_actuelle === phases.PHASE_BALLONS) {
        const pointIntersection = calculer_point_intersection(event, raycaster, screenSize, sceneThreeJs);
        //point d'intersection avec le plan sagital
        if(pointIntersection != null){ initialiser_ballon(pointIntersection, sceneThreeJs) };
    }
}

function onMouseMove(event, raycaster, screenSize, sceneThreeJs) {
    if(phase_actuelle === phases.PHASE_CORPS && event.buttons === 1) {
        const pointIntersection = calculer_point_intersection(event, raycaster, screenSize, sceneThreeJs);
        modifier_wireframe(pointIntersection, sceneThreeJs);
    }
    if(phase_actuelle === phases.PHASE_BALLONS && variablesBallons.picked_handler){
        const pointIntersection = calculer_point_intersection(event, raycaster, screenSize, sceneThreeJs);
        if(pointIntersection != null) { modifier_ballon(variablesBallons.picked_handler, pointIntersection); }
    }
}

function onKeyDown(event, sceneThreeJs) {
    if(sceneThreeJs.controls.enabled) {
        return;
    }
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
    if(event.ctrlKey) {
        sceneThreeJs.controls.enabled = true;
    }
}

function onKeyUp(event, sceneThreeJs) {
    if(!event.ctrlKey) {
        sceneThreeJs.controls.enabled = false;
    }
}

function init3DObjects(sceneThreeJs) {
    const sceneGraph = sceneThreeJs.sceneGraph;

    const planeGeometryZ = primitive.Quadrangle(Vector3(-100, -100, 0), Vector3(-100, 100, 0), Vector3(100, 100, 0), Vector3(100, -100, 0));
    const plane = new THREE.Mesh(planeGeometryZ, MaterialRGB(2, 2, 2));
    plane.material.opacity = 0;
    plane.material.transparent = true; //les deux lignes sont necessaires 
    plane.name = "planZ"; //Z est la normale a ce plan => plan XY
    sceneGraph.add(plane);

    const planeGeometryX = primitive.Quadrangle(Vector3(0, -100, -100), Vector3(0, -100, 100), Vector3(0, 100, 100), Vector3(100, -100, 0));
    const planeX = new THREE.Mesh(planeGeometryX, MaterialRGB(2, 2, 2));
    planeX.material.opacity = 0;
    planeX.material.transparent = true;
    planeX.name = "planX";
    sceneGraph.add(planeX);

    const planeGeometryY = primitive.Quadrangle(Vector3(0, -100, -100), Vector3(0, -100, 100), Vector3(0, 100, 100), Vector3(100, -100, 0));
    const planeY = new THREE.Mesh(planeGeometryY, MaterialRGB(2, 2, 2));
    planeY.material.opacity = 0;
    planeY.material.transparent = true;
    planeY.name = "planX";
    sceneGraph.add(planeY);

    sceneThreeJs.pickableObjects.push(plane);
    sceneThreeJs.pickableObjects.push(planeX);
    sceneThreeJs.pickableObjects.push(planeY);

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
    sceneInit.insertLight(sceneThreeJs.sceneGraph,Vector3(0, 0, 5));

    sceneThreeJs.renderer = sceneInit.createRenderer();
    sceneInit.insertRenderInHtml(sceneThreeJs.renderer.domElement);

    sceneThreeJs.controls = new THREE.OrbitControls(sceneThreeJs.camera);
    sceneThreeJs.controls.enabled = false;

    window.addEventListener('resize', function(event){onResize(sceneThreeJs);}, false);
}

function calculer_intersects(event, raycaster, screenSize, sceneThreeJs) {
    const sceneGraph = sceneThreeJs.sceneGraph;
    const camera     = sceneThreeJs.camera;

    const xPixel = event.clientX;
    const yPixel = event.clientY;

    const x =  2*xPixel/screenSize.w - 1; //(entre -1 et 1)
    const y = -2*yPixel/screenSize.h + 1;

    raycaster.setFromCamera(Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects(sceneThreeJs.pickableObjects, true);
    return intersects;
}

function calculer_point_intersection(event, raycaster, screenSize, sceneThreeJs) {

    const intersects = calculer_intersects(event, raycaster, screenSize, sceneThreeJs);

    if(intersects.length > 0) {
        const intersection = intersects[0];    
        const pointIntersection = intersection.point.clone();
        console.log(intersection.object.name);
        return pointIntersection;
    }
    return null;
}

function calculer_handler_intersection(event, raycaster, screenSize, sceneThreeJs) {
    const intersects = calculer_intersects(event, raycaster, screenSize, sceneThreeJs);
    const intersection = intersects[0];
    const objetSelectionne = intersection.object;
    if(objetSelectionne.name != "handler" && objetSelectionne.name != "sphere") {
        return;
    }
    variablesBallons.picked_handler = objetSelectionne;
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

/** POUR LA DEUXiEME PHASE */

function initialiser_ballon(centre, sceneThreeJs) {
    const instance = {};
    variablesBallons.instances.push(instance);
    instance.groupe = new THREE.Group();
    instance.groupe.position.set(centre.x, centre.y, centre.z);
    instance.handlers = [];

    for(var axe = 0; axe < 3; axe++) {
        for(var positif = 0; positif < 2; positif++) {
            instance.handlers[2*axe+positif] = creerPoint(Vector3(0, 0, 0),0.06);//les deux premiers sont pour l'axe x
            instance.handlers[2*axe+positif].axe = axe;
            instance.handlers[2*axe+positif].positif = positif;
            instance.handlers[2*axe+positif].instance = instance; //instance parent du handler
            instance.handlers[2*axe+positif].name = "handler"; //le meme pour tous les handlers, pour qu'on puisse les identifier
            //les deux suivants pour l'axe y et les derniers pour l'axe z
            const pos = position_defaut_handlers[2*axe+positif];
            instance.handlers[2*axe+positif].position.set(pos.x, pos.y, pos.z);
            instance.groupe.add(instance.handlers[2*axe+positif]);
            //sceneThreeJs.pickableObjects.push(instance.handlers[2*axe+positif]);
        }
    }

    sceneThreeJs.sceneGraph.add(instance.groupe);
    sceneThreeJs.pickableObjects.push(instance.groupe);
}

//modifie/deplace le ballon selon le handler et son deplacement
function modifier_ballon(picked_handler, pointIntersection) {
    const centre = picked_handler.instance.groupe.position;
    const p_h_position = picked_handler.position;
    if(picked_handler.name === "handler"){
        if(picked_handler.axe === 0) {
            p_h_position.x = pointIntersection.x - centre.x; //la postioin du handler est RELATIVE au centre de la boule
            picked_handler.position.copy(p_h_position);
            if(picked_handler.positif === 0 && picked_handler.position.x > 0) {picked_handler.position.x = 0;}
            if(picked_handler.positif === 1 && picked_handler.position.x < 0) {picked_handler.position.x = 0}
        }
        if(picked_handler.axe === 1) {
            p_h_position.y = pointIntersection.y - centre.y; //la postioin du handler est RELATIVE au centre de la boule
            picked_handler.position.copy(p_h_position);
            if(picked_handler.positif === 0 && picked_handler.position.y > 0) {picked_handler.position.y = 0;}
            if(picked_handler.positif === 1 && picked_handler.position.y < 0) {picked_handler.position.y = 0}
        }
        if(picked_handler.axe === 2) {
            p_h_position.z = pointIntersection.z - centre.z; //la postioin du handler est RELATIVE au centre de la boule
            picked_handler.position.copy(p_h_position);
            if(picked_handler.positif === 0 && picked_handler.position.z > 0) {picked_handler.position.z = 0;}
            if(picked_handler.positif === 1 && picked_handler.position.z < 0) {picked_handler.position.z = 0}
        }
    }
}

//prend en argument une instance (du tableau instances) et cree le ballon associe
function creer_ballon_from_instance(instance, sceneThreeJs) {
    if(instance.mesh != null) {
        sceneThreeJs.sceneGraph.remove(instance);
        instance.mesh = null;
    }

    const sphereGeometry = new THREE.SphereGeometry(R_B_D, 16, 16);
    const vertices = sphereGeometry.vertices;
    const centre = instance.groupe.position;
    for(var indice = 0; indice < vertices.length; indice++) {
        const v_pos = vertices[indice];
        let indice_x = 0;
        if(v_pos.x > 0) {indice_x = 1;}  
        let indice_y = 0;
        if(v_pos.y > 0) {indice_y = 1;}
        let indice_z = 0;
        if(v_pos.z > 0) {indice_z = 1;}
        v_pos.x = v_pos.x*(Math.abs(instance.handlers[indice_x].position.x)/R_B_D);
        v_pos.y = v_pos.y*(Math.abs(instance.handlers[2+indice_y].position.y)/R_B_D);
        v_pos.z = v_pos.z*(Math.abs(instance.handlers[4+indice_z].position.z)/R_B_D);
    }
    const mesh = new THREE.Mesh(sphereGeometry, MaterialRGB(0, 1.0, 0));
    mesh.position.set(centre.x, centre.y, centre.z);
    mesh.name = "mesh";
    sceneThreeJs.sceneGraph.add(mesh);
    instance.mesh = mesh;
}

function initialiser_geometry(handlers) {
    const sphereGeometry = new THREE.SphereGeometry()
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
    for(let indice = 0; indice < variablesBallons.instances.length; indice++) {
        creer_ballon_from_instance(variablesBallons.instances[indice], sceneThreeJs);            
    }

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
function creerPoint(v, rayon=0.02) {
    const sphereGeometry = primitive.Sphere(v, rayon);
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