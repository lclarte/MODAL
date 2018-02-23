"use strict";

const R_B_D = 0.5; //Rayon du Ballon par Defaut

const position_defaut_handlers = [Vector3(-R_B_D, 0, 0), Vector3(R_B_D, 0, 0), Vector3(0, -R_B_D, 0), Vector3(0, R_B_D, 0), Vector3(0, 0, -R_B_D), Vector3(0, 0, R_B_D)];

const variablesBallons = {
    instances: [], //stocke les instances des ballons
    //dans chaque instance on va mettre 
    //-> la position du centre
    //-> un groupe pour regrouper les handlers; la position relative des handlers par rapport au centre
    picked_handler: null, //le handler selectionnne lors du clic de la souris
};

//retourne l'instance qu'on vient de creer
function initialiser_ballon(centre) {
    const instance = {};

    instance.groupe = new THREE.Group();//groupe contient les handlers Object3D
    instance.groupe.name = "groupe_handlers";
    instance.groupe.position.set(centre.x, centre.y, centre.z);
    instance.handlers = [];

    for(var axe = 0; axe < 3; axe++) {
        for(var positif = 0; positif < 2; positif++) {
            instance.handlers[2*axe+positif] = creerPoint(Vector3(0, 0, 0), 0.2);//les deux premiers sont pour l'axe x
            instance.handlers[2*axe+positif].axe = axe;
            instance.handlers[2*axe+positif].positif = positif;
            instance.handlers[2*axe+positif].instance = instance; //instance parent du handler
            instance.handlers[2*axe+positif].name = "handler"; //le meme pour tous les handlers, pour qu'on puisse les identifier
            instance.handlers[2*axe+positif].material.opacity = 0.1;
            instance.handlers[2*axe+positif].material.transparent = true;

            //les deux suivants pour l'axe y et les derniers pour l'axe z
            const pos = position_defaut_handlers[2*axe+positif];
            instance.handlers[2*axe+positif].position.set(pos.x, pos.y, pos.z);
            instance.groupe.add(instance.handlers[2*axe+positif]);
            //sceneThreeJs.pickableObjects.push(instance.handlers[2*axe+positif]);
        }
    }

    return instance;
    //ajouter apres l'appel de cette fonction:
    /*
    variablesBallons.instances.push(instance);
    sceneThreeJs.sceneGraph.add(instance.groupe);
    sceneThreeJs.pickableObjects.push(instance.groupe);
    */
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
	//a mettre avant d'appeler la fonction pour detruire la sphere : 
	/*  
	    if(instance.mesh != null) {
        sceneThreeJs.sceneGraph.remove(instance.mesh);
        instance.mesh = null;
    }
    */

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
    const mesh = new THREE.Mesh(sphereGeometry, MaterialRGB(1.5, 1.3, 1.3));
    mesh.position.set(centre.x, centre.y, centre.z);
    mesh.name = "ballon";
    instance.mesh = mesh;
    mesh.instance = instance; //servira pour detruire le ballon: on va detruire l'instance en meme temps

    return mesh;

    //a mettre apres la fonction pour ajouter le ballon : 
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

