"use strict";

let initialise_modeles_vide = false;
let temps_precedent = 0;

const ENGRENAGE = "modeles/gear.obj";
const CANON     = "modeles/canon.obj";
const HELICE    = "modeles/helice.obj";
const CHEMINEE  = "modeles/cheminee.obj";

let bool_animation = false;

let modeles = {}; //tableau stockant les modeles 3D
const noms_fichiers = [COQUE_AVANT, COQUE_AVANT_BAS, COQUE_MILIEU, COQUE_MILIEU_BAS, ENGRENAGE, CANON, HELICE, CHEMINEE ];

const loader = new THREE.OBJLoader();

//remarque importante : on peut ajouter des champs

//cette structure constitue une enumeration pour
//savoir dans quelle phase de conception on est
//actuellement.
const phases = {
    PHASE_CORPS:   0, //pour la coque et les ballons
    PHASE_DETAILS: 1, //lorsu'on veut ajouter des primitives ou sauvegarder ou autre
};

let phase_actuelle = phases.PHASE_CORPS;

main();

function main(){

    const sceneThreeJs = {
        sceneGraph: null,
        camera: null,
        renderer: null,
        controls: null,
        pickableObjects: [],
    };

    /*
        Attention, il y a une difference entre pickingData et pickableObjects : pickableObjects est pour la modification de modules du bateau
        alors que pickingData est pour le placement des divers objets sur la coque (sail, sphere, cube, etc.)
    */
    const pickingData = {
        enabled: true,
        selectableObjects: [],
        selectedObject: null, // selectedObjet et selectedPlane servent pour le deplacement des objets comme dans le TP 2
        selectedPlane: {p: null, n: null}, //plan de la camera au moment de la selection : position p et normale n
    };

    /*Constantes utilisees par la GUI*/
    const guiPrimitivesParam = {
        primitiveType: "Cube",
        Size: 0.25,
        Color: [1*255,0.3*255,0.2*255]
    };


    /*Constantes pour le dessin de la voile*/
    const Drawing = {
      sail: null,
      sailGeometry: null,
      vertices: [],
      material: new THREE.LineBasicMaterial( { color: 0xff0000 } ),
      enabled: false,
      drawingMode: false,
      drawingSaved: false,
      rightSailList: [],
      leftSailList: [],
    };


    initEmptyScene(sceneThreeJs);
    console.log("truc");
    initGui(guiPrimitivesParam, sceneThreeJs, pickingData, Drawing);

    const raycaster = new THREE.Raycaster();

    const screenSize = {
        w:sceneThreeJs.renderer.domElement.clientWidth,
        h:sceneThreeJs.renderer.domElement.clientHeight
    };

    // Fonction à appeler lors du clic de la souris: selection d'un objet
    //  (Création d'un wrapper pour y passer les paramètres souhaités)
    const wrapperMouseDown = function(event) { onMouseDown(event, raycaster, screenSize, sceneThreeJs, pickingData, guiPrimitivesParam, Drawing); };
    document.addEventListener( 'mousedown', wrapperMouseDown);
    const wrapperMouseUp = function(event) {onMouseUp(event, pickingData, Drawing)};
    document.addEventListener('mouseup', wrapperMouseUp);
    const wrapperMouseMove = function(event) {onMouseMove(event, raycaster, sceneThreeJs, screenSize, pickingData, guiPrimitivesParam, Drawing);};
    document.addEventListener('mousemove', wrapperMouseMove);
    const wrapperKeyDown = function(event) {onKeyDown(event, raycaster, screenSize, sceneThreeJs, pickingData, Drawing)};
    document.addEventListener('keydown', wrapperKeyDown);
    const wrapperKeyUp = function(event) {onKeyUp(event, sceneThreeJs, pickingData)};
    document.addEventListener('keyup', wrapperKeyUp);

    // *************************** //
    // Lancement de l'animation
    // *************************** //s
    animationLoop(sceneThreeJs, Drawing, pickingData);
}

function init3DObjects(sceneThreeJs, pickingData) {
    const sceneGraph = sceneThreeJs.sceneGraph;
    
    const planeGeometryZ = primitive.Quadrangle(Vector3(-100, -100, 0), Vector3(-100, 100, 0), Vector3(100, 100, 0), Vector3(100, -100, 0));
    const plane = new THREE.Mesh(planeGeometryZ, MaterialRGB(2, 2, 2));
    plane.material.opacity = 0;
    plane.material.transparent = true; //les deux lignes sont necessaires
    plane.name = "planZ"; //Z est la normale a ce plan => plan XY
    sceneGraph.add(plane);
    sceneThreeJs.pickableObjects.push(plane);

    const nouveau_module = initialiser_module(Vector3(0, 0, 0), 0, 0, sceneThreeJs);
    pickingData.selectableObjects.push(nouveau_module.mesh);
    nouveau_module.x = 0;
    nouveau_module.y = 0;

    placer_module_dans_tableau(nouveau_module);
    sceneThreeJs.sceneGraph.add(nouveau_module);

}

// Fonction d'initialisation d'une scène 3D sans objets 3D
//  Création d'un graphe de scène et ajout d'une caméra et d'une lumière.
//  Création d'un moteur de rendu et ajout dans le document HTML
function initEmptyScene(sceneThreeJs) {

    initialiser_modeles_3D();

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

    sceneInit.insertSkybox(sceneThreeJs.sceneGraph);
}


function initGui(gPP, sceneThreeJs, pickingData, Drawing) {
    //fonctions de la GUI
    const corpsFunction = function() {
        phase_actuelle = phases.PHASE_CORPS;
    };

    const cubeFunction = function(){
        gPP.primitiveType = "Cube";
        phase_actuelle =  phases.PHASE_DETAILS; //si on etait en train de placer un cube, rappuyer dessus va nous repasser en mode "PHASE_CORPS"
    };
    const sphereFunction = function(){
        gPP.primitiveType = "Sphere";
        phase_actuelle =  phases.PHASE_DETAILS;
    };
    const gearFunction = function(){
        gPP.primitiveType = "Gear";
        phase_actuelle =  phases.PHASE_DETAILS;
    };
    const canonFunction = function(){
        gPP.primitiveType = "Canon";
        phase_actuelle =  phases.PHASE_DETAILS;
    };
    const propellerFunction = function(){
        gPP.primitiveType = "Propeller";
        phase_actuelle =  phases.PHASE_DETAILS;
    };
    const chimneyFunction = function(){
        gPP.primitiveType = "Chimney";
        phase_actuelle =  phases.PHASE_DETAILS;
    };
    const saveFunction = function(){ saveScene(sceneThreeJs.sceneGraph); };
    const loadFunction = function(){ loadScene(sceneThreeJs.sceneGraph,pickingData.selectableObjects); };
    const exportOBJFunction = function(){ exportOBJ(pretraitement_export_obj(sceneThreeJs.sceneGraph.children)); };

    //Les trois fenetres de la GUI
    const guiPrimitivesInterface = {
          Normal: corpsFunction, //bouton pour modifier le corps du bateau
        Cube: cubeFunction,
        Sphere: sphereFunction,
        Engrenage: gearFunction,
        Canon: canonFunction,
        Helice: propellerFunction,
        Cheminee: chimneyFunction
    };

    const guiMenuInterface       = {
        Save: saveFunction,
        Load: loadFunction,
        ExportOBJ: exportOBJFunction
    };

    const drawingFunction = function() {
      if (Drawing.drawingMode == false) {
        Drawing.drawingMode = true;
        phase_actuelle = phases.PHASE_DETAILS;
        Drawing.sail = null;
        Drawing.sailGeometry = null;
        Drawing.vertices = [];
      }

      else {
        Drawing.drawingMode = false;
    }

      Drawing.saved = false;

    }

    const sailFunction = function() {

      if (Drawing.saved = true){
        gPP.primitiveType = "Sail";
        phase_actuelle = phases.PHASE_DETAILS; //a regler plus tard
      }

    }

    const guiCreationInterface   = {
        Drawing: drawingFunction,
        Sail: sailFunction,
    };

    const guiPrimitives = new dat.GUI();
    guiPrimitives.add(guiPrimitivesInterface, "Normal");
    guiPrimitives.add(guiPrimitivesInterface, "Cube"); //Choix de la forme à ajouter
    guiPrimitives.add(guiPrimitivesInterface, "Sphere"); //Choix de la forme à ajouter
    guiPrimitives.add(guiPrimitivesInterface, "Engrenage");
    guiPrimitives.add(guiPrimitivesInterface, "Canon");
    guiPrimitives.add(guiPrimitivesInterface, "Helice");
    guiPrimitives.add(guiPrimitivesInterface, "Cheminee");
    guiPrimitives.add(gPP, "Size",0,1);
    guiPrimitives.addColor( gPP,"Color");

    const guiMenu = new dat.GUI();
    guiMenu.add(guiMenuInterface,"Save");
    guiMenu.add(guiMenuInterface,"Load");
    guiMenu.add(guiMenuInterface,"ExportOBJ");

    const guiCreation = new dat.GUI();
    guiCreation.add( guiCreationInterface, "Drawing");
    guiCreation.add( guiCreationInterface, "Sail");

}

function calculer_intersects(event, raycaster, screenSize, sceneThreeJs, recursif=true) {
    const sceneGraph = sceneThreeJs.sceneGraph;
    const camera     = sceneThreeJs.camera;

    const xPixel = event.clientX;
    const yPixel = event.clientY;

    const x =  2*xPixel/screenSize.w - 1; //(entre -1 et 1)
    const y = -2*yPixel/screenSize.h + 1;

    raycaster.setFromCamera(Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects(sceneThreeJs.pickableObjects, recursif);
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

//voir seance de TP numero 2
function deplacer_objet_methode_2(event, screenSize, intersects, camera, pickingData) {
    const xPixel = event.clientX;
    const yPixel = event.clientY;

    const x =  2*xPixel/screenSize.w-1;
    const y = -2*yPixel/screenSize.h+1;
        // Projection inverse passant du point 2D sur l'écran à un point 3D
    const selectedPoint = Vector3(x, y, 0.5 /*valeur de z après projection*/ );
    selectedPoint.unproject( camera );

    // Direction du rayon passant par le point selectionné
        const p0 = camera.position;
        const d = selectedPoint.clone().sub( p0 );

        // Intersection entre le rayon 3D et le plan de la camera
        const p = pickingData.selectedPlane.p;
        const n = pickingData.selectedPlane.n;
        // tI = <p-p0,n> / <d,n>
        const tI = ( (p.clone().sub(p0)).dot(n) ) / ( d.dot(n) );
        // pI = p0 + tI d
        const pI = (d.clone().multiplyScalar(tI)).add(p0); // le point d'intersection

        // Translation à appliquer
        const translation = pI.clone().sub( p );

        // Translation de l'objet et de la représentation visuelle
        pickingData.selectedObject.translateX( translation.x );
        pickingData.selectedObject.translateY( translation.y );
        pickingData.selectedObject.translateZ( translation.z );

pickingData.selectedPlane.p.add( translation );
}

// Demande le rendu de la scène 3D
function render(sceneThreeJs) {
    sceneThreeJs.renderer.render(sceneThreeJs.sceneGraph, sceneThreeJs.camera);
}


function animate(sceneThreeJs, Drawing, time) {
    const t = time/1000;//time in second
    const delta = t - temps_precedent;

    if(bool_animation == true) {
        tourner_helices(delta);
        mouvement_voiles(Drawing, t, delta);
        animer_cheminee(t);
    }

    render(sceneThreeJs);
    temps_precedent = t;
}

// Fonction de gestion d'animation
function animationLoop(sceneThreeJs, Drawing, pickingData) {
    if(Object.keys(modeles).length == noms_fichiers.length && !initialise_modeles_vide) {
        initialise_modeles_vide = true;
        init3DObjects(sceneThreeJs, pickingData);
    }

    // Fonction JavaScript de demande d'image courante à afficher
    requestAnimationFrame(

        // La fonction (dite de callback) recoit en paramètre le temps courant
        function(timeStamp){
            animate(sceneThreeJs, Drawing, timeStamp); // appel de notre fonction d'animation
            animationLoop(sceneThreeJs, Drawing, pickingData); // relance une nouvelle demande de mise à jour
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

function argmin(tableau){
    let indice_min  = 0;
    for(let i = 0; i < tableau.length; i++) {
        if(tableau[i] < tableau[indice_min]) {
            indice_min = i;
        }
    }
    return indice_min;
}


//Fonctions de chargement des .OBJ
function loadOBJ(nom_fichier, receveur){
    //objet3D est l'objet qui va contenir l'objet du ficheir .obj
    const loader = new THREE.OBJLoader();
    let retour = new THREE.Object3D();
    loader.load(nom_fichier,
        function(objet) {
            objet.name = "mesh";
            objet.traverse(function (child) {
                if(child instanceof THREE.Mesh) {
                    child.material = new THREE.MeshLambertMaterial({color: 0x421d20});
                }
            })
            receveur.add(objet); //malheureusement, on est oblige de faire comme ça
        });
}

function creerPoint(v, r) {
    const geometry = primitive.Sphere(v, r);
    const mesh = new THREE.Mesh(geometry, MaterialRGB(0.5, 0.5, 0.5));
    return mesh;
}

function initialiser_modeles_3D() {
    modeles = {};

    for(var n_f in noms_fichiers) {
        loadOBJ_tableau(noms_fichiers[n_f]);
    }
}

function loadOBJ_tableau(nom_fichier) {
    const loader = new THREE.OBJLoader();
    loader.load(nom_fichier,
        function(objet) {
            modeles[nom_fichier] = objet ; //pb iici !!!!
    });
}
