"use strict";

//remarque importante : on peut ajouter des champs 

//cette structure constitue une enumeration pour 
//savoir dans quelle phase de conception on est
//actuellement.
const phases = {
    PHASE_CORPS:   0,
    PHASE_BALLONS: 1,
    PHASE_DETAILS: 2,  
};

const COQUE_AVANT = 'modeles/coque_avant.obj';
const COQUE_MILIEU = 'modeles/coque_milieu.obj';


//associe a un modele de coque (celui qu'on modifie) le modele apres modification ainsi que 
//le modele du voisin qu'on cree

//pour l'instant, le tableau est temporaire
const tableau_transformation_modeles = {  
};
tableau_transformation_modeles["modeles/coque_avant.obj"] = [[COQUE_AVANT, COQUE_AVANT], [COQUE_MILIEU, COQUE_AVANT], [COQUE_MILIEU, COQUE_MILIEU], [COQUE_AVANT, COQUE_MILIEU]];
tableau_transformation_modeles["modeles/coque_milieu.obj"]= [[COQUE_MILIEU, COQUE_MILIEU], [COQUE_MILIEU, COQUE_AVANT], [COQUE_MILIEU, COQUE_MILIEU], [COQUE_MILIEU, COQUE_MILIEU]];

let phase_actuelle = phases.PHASE_CORPS;

const variablesCorps = {
    modules: [],
    picked_module: null,
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
    const wrapperKeyDown = function(event) {onKeyDown(event, raycaster, screenSize, sceneThreeJs)};
    document.addEventListener('keydown', wrapperKeyDown);
    const wrapperKeyUp = function(event) {onKeyUp(event, sceneThreeJs)};
    document.addEventListener('keyup', wrapperKeyUp);

    // *************************** //
    // Lancement de l'animation
    // *************************** //s
    animationLoop(sceneThreeJs);
}


function onMouseUp(event) {
    variablesCorps.picked_module = null;
    variablesBallons.picked_handler = null;
}

function onMouseDown(event, raycaster, screenSize, sceneThreeJs) {
    const intersects = calculer_intersects(event, raycaster, screenSize, sceneThreeJs, true);
    if(intersects.length == 0) {
        return;
    }
    const pointIntersection = calculer_point_intersection(event, raycaster, screenSize, sceneThreeJs);
    if(event.buttons === 1){ //si seul le bouton gauche est clique 
        if(intersects[0].object.name == "handler") {//c'est un ballon, on va le modifier en consequence
            variablesBallons.picked_handler = intersects[0].object;
        }
        else{
            variablesCorps.picked_module = intersects[0].object; //apparement
            while(variablesCorps.picked_module.name !== "module" && variablesCorps.picked_module.name !== "sceneGraph") {
                variablesCorps.picked_module = variablesCorps.picked_module.parent;
            }
            if(variablesCorps.picked_module.name === "sceneGraph") {
                variablesCorps.picked_module = null;
            }

        }
    }
    else if(event.buttons === 2) {//bouton droit -> ajout d'un nouveau ballon
        phase_actuelle = phases.PHASE_BALLONS;

        const instance = initialiser_ballon(pointIntersection, sceneThreeJs);

        variablesBallons.instances.push(instance);
        sceneThreeJs.sceneGraph.add(instance.groupe);
        sceneThreeJs.pickableObjects.push(instance.groupe);//on ajoute les handlers aux objets pickable

        if(instance.mesh != null) {
            sceneThreeJs.sceneGraph.remove(instance.mesh);
            instance.mesh = null;
        }
        const mesh = creer_ballon_from_instance(instance, sceneThreeJs);
        sceneThreeJs.sceneGraph.add(mesh);
        sceneThreeJs.pickableObjects.push(mesh);
    }
}

function onMouseMove(event, raycaster, screenSize, sceneThreeJs) {
    const pointIntersection = calculer_point_intersection(event, raycaster, screenSize, sceneThreeJs);
    if(variablesCorps.picked_module != null) {
        modifier_module(variablesCorps.picked_module, pointIntersection, sceneThreeJs);
    }
    else if(variablesBallons.picked_handler != null) {
        modifier_ballon(variablesBallons.picked_handler, pointIntersection);
        const instance = variablesBallons.picked_handler.instance;
        creer_ballon_from_instance(instance, sceneThreeJs);
    }
}

function onKeyDown(event, raycaster, screenSize, sceneThreeJs) {
    //keyCode de la touche supprimer : 27

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
    sceneThreeJs.pickableObjects.push(plane);

    const nouveau_module = initialiser_module(Vector3(0, 0, 0), COQUE_AVANT, sceneThreeJs);
    sceneThreeJs.sceneGraph.add(nouveau_module);
}

// Fonction d'initialisation d'une scène 3D sans objets 3D
//  Création d'un graphe de scène et ajout d'une caméra et d'une lumière.
//  Création d'un moteur de rendu et ajout dans le document HTML
function initEmptyScene(sceneThreeJs) {

    sceneThreeJs.sceneGraph = new THREE.Scene();
    sceneThreeJs.sceneGraph.name = "sceneGraph";

    sceneThreeJs.camera = sceneInit.createCamera(0, 0, -5);
    //la camera est situee sur l'axe z 
    sceneThreeJs.camera.lookAt(0, 0, 0);
    sceneInit.insertAmbientLight(sceneThreeJs.sceneGraph);
    sceneInit.insertLight(sceneThreeJs.sceneGraph, Vector3(0, 1, -5));
    sceneInit.insertLight(sceneThreeJs.sceneGraph,Vector3(0, 1, 5));

    sceneThreeJs.renderer = sceneInit.createRenderer();
    sceneInit.insertRenderInHtml(sceneThreeJs.renderer.domElement);

    sceneThreeJs.controls = new THREE.OrbitControls(sceneThreeJs.camera);
    sceneThreeJs.controls.enabled = false;

    window.addEventListener('resize', function(event){onResize(sceneThreeJs);}, false);
}

function calculer_intersects(event, raycaster, screenSize, sceneThreeJs, recursif=true) {
    const sceneGraph = sceneThreeJs.sceneGraph;
    const camera     = sceneThreeJs.camera;

    const xPixel = event.clientX;
    const yPixel = event.clientY;

    const x =  2*xPixel/screenSize.w - 1; //(entre -1 et 1)
    const y = -2*yPixel/screenSize.h + 1;

    raycaster.setFromCamera(Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects(sceneThreeJs.sceneGraph.children, recursif);
    return intersects;
}

function calculer_point_intersection(event, raycaster, screenSize, sceneThreeJs) {

    const intersects = calculer_intersects(event, raycaster, screenSize, sceneThreeJs);

    if(intersects.length > 0) {
        const intersection = intersects[0];    
        const pointIntersection = intersection.point.clone();
        return pointIntersection;
    }
    return null;
}

//Fonction qui cree un module -> mesh + un handler
//centre : position du centre
//nom_fichier : nom_du_fichier du mesh
function initialiser_module(centre, nom_fichier, sceneThreeJs){

    const TAILLE_MODULE = 1.0;

    const nouveau_module = new THREE.Group();
    nouveau_module.name = "module";
    nouveau_module.nom_modele = nom_fichier;

    variablesCorps.modules.push(nouveau_module);

    //on initialise les voisins : selon les voisins qu'il a, le modele va changer
    nouveau_module.voisin_gauche    = null;
    nouveau_module.voisin_droite    = null;
    nouveau_module.voisin_haut      = null;
    nouveau_module.voisin_bas       = null;


    nouveau_module.mesh = new THREE.Object3D();
    nouveau_module.mesh.rotateY(-Math.PI/2);
    loadOBJ("modeles/coque_avant.obj", nouveau_module.mesh);
    nouveau_module.mesh.name = "mesh";
    sceneThreeJs.pickableObjects.push(nouveau_module.mesh);

/*
    //creation du handler
    nouveau_module.handler = creerPoint(Vector3(0, 0, 0), 0.2);
    nouveau_module.handler.translateZ(-TAILLE_MODULE);
    nouveau_module.handler.module = nouveau_module;
    nouveau_module.handler.name = "handler";
*/
    nouveau_module.position.set(centre.x, centre.y, centre.z);

    nouveau_module.add(nouveau_module.mesh);
    //nouveau_module.add(nouveau_module.handler);

    return nouveau_module;
    //apres avoir appele la fonction, il faut ajouter les deux lignes qui suivent :
    /*
    sceneThreeJs.sceneGraph.add(nouveau_module);
    sceneThreeJs.pickableObjects.push(nouveau_module.handler);
    */
}

function modifier_module(module, pointIntersection, sceneThreeJs) {
    const pos = module.position;
    const reference = Vector2(module.position.x, module.position.y);

    const type_modification = determiner_type_modification(module, pointIntersection);
    let fichier_modification = "";
    let fichier_voisin = "";

    //amelioration de la quality of life : quand on modifie un module, on le deselectionne pour 
    //pas faire des modifications involontaires.
    if(type_modification != 0) {
        variablesCorps.picked_module = null;
        console.log(module.nom_modele);
        fichier_modification = tableau_transformation_modeles[module.nom_modele][type_modification-1][0];
        fichier_voisin = tableau_transformation_modeles[module.nom_modele][type_modification-1][1];
    }

    switch(type_modification) {
        case 1:
            break;
        case 2:
                if(module.voisin_droite === null) {
                const p_v_d = Vector3(pos.x-1.0, pos.y, pos.z);
                const module_droite = initialiser_module(p_v_d, fichier_voisin, sceneThreeJs);
                modifier_modele_module(module, fichier_modification);

                module.voisin_droite = module_droite; //on met a jour les voisins
                module_droite.voisin_gauche = module;

                sceneThreeJs.sceneGraph.add(module_droite);
                sceneThreeJs.pickableObjects.push(module_droite);
            }
            break;
        case 3:
            break;
        case 4:
            break;

    }
    
}

//determine si on doit ajouter un autre module a gauche, droite, en haut, en bas, etc.
function determiner_type_modification(module, pointIntersection) {
    const m_pos             = module.position;
    const point_voronoi     = Vector2(pointIntersection.x - m_pos.x, pointIntersection.y - m_pos.y);
    const sommets_voronoi   = [Vector2(0, 0), Vector2(0.0, 2.0), Vector2(-2.0, 0.0), Vector2(0, -2), Vector2(2.0, 0.0)];
    //les sommets sont listes dans l'ordre : centre, haut, droite, bas, gauche
    const distances_voronoi = [];
    for(let indice = 0; indice < 5; indice++) {
        distances_voronoi[indice] = distance(point_voronoi, sommets_voronoi[indice]);
    }
    return argmin(distances_voronoi);
}

function modifier_modele_module(module, nom_fichier) {
    const a_detruire = module.mesh.getObjectByName("mesh");
    module.mesh.remove(a_detruire);
    loadOBJ(nom_fichier, module.mesh);
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

const SEUIL_DEPLACEMENT_SOURIS = 1.0;

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

//ne marche qu'avec les vecteurs de taille 2.
function distance(p1, p2) {
    const v = [p2.x - p1.x, p2.y - p1.y];
    return norme(v);
}

function argmin(tableau) {
    let indice_min = 0;
    for(let i = 0; i < tableau.length; i++) {
        if(tableau[i] < tableau[indice_min]) {
            indice_min = i;
        }
    }
    return indice_min;
}

//Fonctions de chargement des .OBJ
function loadOBJ(nom_fichier, receveur) {
    //objet3D est l'objet qui va contenir l'objet du ficheir .obj
    const loader = new THREE.OBJLoader();
    let retour = new THREE.Object3D();
    loader.load(nom_fichier,
        function(objet) {
            objet.name = "mesh";
            receveur.add(objet); //malheureusement, on est oblige de faire comme ça 
        });
}