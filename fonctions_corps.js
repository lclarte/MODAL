"use strict";

const variablesCorps = {
    modules: [],
    picked_module: null,
    tableau_modules: {}, //ce dictionnaire stocke les indices des modules dans notre bateau
    //les indices sont stockes sous la forme "x,y" avec x l'abscisse, y l'ordonnee
};


const COQUE_AVANT = 'modeles/coque_avant.obj';
const COQUE_AVANT_BAS = 'modeles/coque_avant.obj';
const COQUE_MILIEU = 'modeles/coque_milieu.obj';
const COQUE_MILIEU_BAS = 'modeles/coque_milieu_bas.obj';
const COQUE_ARRIERE = 'modeles/coque_arriere.obj';
const COQUE_ARRIERE_BAS = 'modeles/coque_arriere_bas.obj';

//associe a un modele de coque (celui qu'on modifie) le modele apres modification ainsi que 
//le modele du voisin qu'on cree

//pour l'instant, le tableau est temporaire
const tableau_transformation_modeles = {  
};
tableau_transformation_modeles["modeles/coque_avant.obj"] = [[COQUE_AVANT, COQUE_AVANT], [COQUE_MILIEU, COQUE_AVANT], [COQUE_MILIEU, COQUE_MILIEU], [COQUE_AVANT, COQUE_MILIEU]];
tableau_transformation_modeles["modeles/coque_milieu.obj"]= [[COQUE_MILIEU, COQUE_MILIEU], [COQUE_MILIEU, COQUE_AVANT], [COQUE_MILIEU, COQUE_MILIEU], [COQUE_MILIEU, COQUE_MILIEU]];

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

function placer_module_dans_tableau(module){
	variablesCorps.tableau_modules[module.x + "," + module.y] = module;
}

//a partir du tableau des modules et du module passe en argument, 
//determine le fichier 3D qu'on doit lui appliquer
function determiner_fichier_module(module) {

	//les indices correspondent a gauche, puis bas, puis droite
	const position_to_fichier = {
		"false,false,false": COQUE_AVANT_BAS,
		"false,false,true": COQUE_ARRIERE_BAS,
		"false,true,false":COQUE_MILIEU,
		"false,true,true":COQUE_ARRIERE,
		"true,false,false":COQUE_AVANT_BAS,
		"true,false,true":COQUE_MILIEU_BAS,
		"true,true,false":COQUE_AVANT,
		"true,true,true":COQUE_MILIEU,
	};


}