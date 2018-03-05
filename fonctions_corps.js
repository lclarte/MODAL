"use strict";

const variablesCorps = {
    modules: [],
    picked_module: null,
    tableau_modules: {}, //ce dictionnaire stocke les indices des modules dans notre bateau
    //les indices sont stockes sous la forme "x,y" avec x l'abscisse, y l'ordonnee
};


const COQUE_AVANT = 'modeles/coque_avant.obj';
const COQUE_AVANT_BAS = 'modeles/coque_avant_bas.obj';
const COQUE_MILIEU = 'modeles/coque_milieu.obj';
const COQUE_MILIEU_BAS = 'modeles/coque_milieu_bas.obj';
const COQUE_ARRIERE = 'modeles/coque_milieu.obj';
const COQUE_ARRIERE_BAS = 'modeles/coque_milieu_bas.obj';

//associe a un modele de coque (celui qu'on modifie) le modele apres modification ainsi que 
//le modele du voisin qu'on cree

/*


//pour l'instant, le tableau est temporaire
const tableau_transformation_modeles = {  
};
tableau_transformation_modeles["modeles/coque_avant.obj"] = [[COQUE_AVANT, COQUE_AVANT], [COQUE_MILIEU, COQUE_AVANT], [COQUE_MILIEU, COQUE_MILIEU], [COQUE_AVANT, COQUE_MILIEU]];
tableau_transformation_modeles["modeles/coque_milieu.obj"]= [[COQUE_MILIEU, COQUE_MILIEU], [COQUE_MILIEU, COQUE_AVANT], [COQUE_MILIEU, COQUE_MILIEU], [COQUE_MILIEU, COQUE_MILIEU]];


*/

//Fonction qui cree un module -> mesh + un handler
//centre : position du centre
//nom_fichier : nom_du_fichier du mesh
function initialiser_module(centre, x, y, sceneThreeJs){

    const TAILLE_MODULE = 1.0;

    const nouveau_module = new THREE.Group();
    nouveau_module.name = "module";
    nouveau_module.details = []; // va contenir tous les details qui sont dans le module

    nouveau_module.x = Math.round(x);
    nouveau_module.y = Math.round(y);

    variablesCorps.modules.push(nouveau_module);

    //on initialise les voisins : selon les voisins qu'il a, le modele va changer
    nouveau_module.voisin_gauche    = null;
    nouveau_module.voisin_droite    = null;
    nouveau_module.voisin_haut      = null;
    nouveau_module.voisin_bas       = null;

    nouveau_module.mesh = new THREE.Object3D();
    nouveau_module.mesh.rotateY(-Math.PI/2);

    const modele = determiner_fichier_module(nouveau_module);

    loadOBJ(modele, nouveau_module.mesh);
    console.log("retour vaut", nouveau_module.mesh);

    nouveau_module.mesh.name = "mesh";
    sceneThreeJs.pickableObjects.push(nouveau_module.mesh);

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


function ajouter_module(module, pointIntersection, sceneThreeJs, pickingData) {
	let x = module.x;
	let y = module.y;

    const pos = module.position;
    const reference = Vector2(module.position.x, module.position.y);

    const type_modification = determiner_type_modification(module, pointIntersection);
    let fichier_modification = "";
    let fichier_voisin = "";


    if(type_modification === 0) {return};

    let delta_x = 0;
    let delta_y = 0;

    switch(type_modification) {
        case 1:
        	delta_y = 1;
            break;
        case 2:
        	delta_x = -1;
        	break;
        case 3:
        	delta_y = -1;
            break;
        case 4:
        	delta_x = 1;
            break;

    }
    if(variablesCorps.tableau_modules[(x+delta_x) + "," + (y+delta_y)] !== undefined) {return};
   
    const p_v_d = Vector3(pos.x+delta_x, pos.y+delta_y, pos.z);

    const module_droite = initialiser_module(p_v_d, x+delta_x, y+delta_y, sceneThreeJs);
    placer_module_dans_tableau(module_droite);


    module.voisin_droite = module_droite; //on met a jour les voisins
    module_droite.voisin_gauche = module;

    sceneThreeJs.sceneGraph.add(module_droite);

    sceneThreeJs.pickableObjects.push(module_droite);
    pickingData.selectableObjects.push(module_droite);
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
    console.log("avant : ", module.mesh.children);
    //const a_detruire = module.mesh.getObjectByName("mesh");
    for(var i = 0; i < module.mesh.children.length; i++) {
    	module.mesh.remove(module.mesh.children[i]);
    }
    console.log("apres : ", module.mesh.children);
    //module.mesh.remove(a_detruire);
    loadOBJ(nom_fichier, module.mesh);
}

function placer_module_dans_tableau(module){
	variablesCorps.tableau_modules[module.x + "," + module.y] = module;
}

//a partir du tableau des moduledules et du module passe en argument, 
//determine le fichier 3D qu'on doit lui appliquer
function determiner_fichier_module(module) {

	let string_booleens = determiner_booleens_voisins(module);

	//les indices correspondent a gauche, puis bas, puis droite
	const position_to_fichier = {
		"false,false,false": COQUE_MILIEU_BAS,
		"false,false,true": COQUE_ARRIERE_BAS,
		"false,true,false":COQUE_MILIEU,
		"false,true,true":COQUE_ARRIERE,
		"true,false,false":COQUE_AVANT_BAS,
		"true,false,true":COQUE_MILIEU_BAS,
		"true,true,false":COQUE_AVANT,
		"true,true,true":COQUE_MILIEU,
	};

	return position_to_fichier[string_booleens];
}

function determiner_booleens_voisins(module) {
	let x = module.x;
	let y = module.y;

	const presence_gauche = (variablesCorps.tableau_modules[(x+1) + "," + y] !== undefined);
	const presence_droite = (variablesCorps.tableau_modules[(x-1) + "," + y] !== undefined);
	const presence_bas = (variablesCorps.tableau_modules[x + "," + (y-1)] !== undefined);

	let string_booleens = presence_gauche + "," + presence_bas + "," + presence_droite;

	return string_booleens;
}

//a appeler a chaque modification d'un module
function mettre_a_jour_modele_tous_modules() {
	for(let i = 0; i < variablesCorps.modules.length; i++) {
		let module = variablesCorps.modules[i];
		let fichier = determiner_fichier_module(module);
        modifier_modele_module(module, fichier);
        module.fichier = fichier;
	}
}