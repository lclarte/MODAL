    "use strict";

//contient les fonctions necessaires a la sauvegarde / chargement des scenes

function saveScene(sceneGraph,createdObjects) {
    download( JSON.stringify(sceneGraph), "save_scene.js");
}

function loadScene(sceneGraph,createdObjects) {

    // Supprime les éléments de la scène actuels
    createdObjects.length = 1; // supprime les objets précédents (rem. le plan reste et il est le premier élément)
    for(let i = sceneGraph.children.length-1; i > 0; i--) {
        let object = sceneGraph.children[i];
        sceneGraph.remove(object);
    }

    
    // Chargement des objets à partir de JSON
    const loader = new THREE.ObjectLoader();
    loader.load("save_scene.js",
    function(elementsScene) {

        const children = elementsScene.children;
        const N = children.length;
        const toBeAdded = [];
        for( let k =0; k<N; k++ ) {
            const e = children[k];
            if( e.name==='userObject' ) {
                toBeAdded.push(e);
            }
        }
        for( const k in toBeAdded ) {
            sceneGraph.add(toBeAdded[k]);
        }
    }
    
);
}

function pretraitement_export_obj(liste_objets) {
    const a_traiter = [];
    for(let k in liste_objets) {
        pretraiter_objet_recursif(liste_objets[k], a_traiter);
    }
    return a_traiter;
}

function pretraiter_objet_recursif(objet, traites) {
    if(objet.geometry !== undefined) {
        traites.push(objet);
    }
    else {
        for(let i = 0; i < objet.children.length; i++) {
            pretraiter_objet_recursif(objet.children[i], traites);
        }
    }
}

function exportOBJ(createdObjects) {

    let stringOBJ = "";
    let offset = 0;


    for( const k in createdObjects ) {

        // *************************************** //
        // Applique préalablement la matrice de transformation sur une copie des sommets du maillage
        // *************************************** //

    
        createdObjects[k].updateMatrix();
        createdObjects[k].updateMatrixWorld();

        const matrix = createdObjects[k].matrix;
        const matrixWorld = createdObjects[k].matrixWorld;
        let toExport = null;
        if(createdObjects[k].geometry != undefined) {
            if(createdObjects[k].geometry.type == "BufferGeometry") { //rappel : == est different de ===
                toExport = new THREE.Geometry().fromBufferGeometry(createdObjects[k].geometry);
            }
            else{
                toExport = createdObjects[k].geometry.clone();
            }
            toExport.applyMatrix(matrix);
        }

        if(createdObjects[k].name == "handler" || createdObjects[k].name == "planZ" || createdObjects[k].name == "skyBox") {
            toExport = null;
        }

        // *************************************** //
        // Exporte les sommets et les faces
        // *************************************** //
        if(createdObjects[k] != null && toExport != null &&  toExport.vertices !== undefined && toExport.faces !== undefined ) {
            console.log("select : ", createdObjects[k].name);
            const vertices = toExport.vertices;
            console.log(vertices.length, '/', toExport.faces.length);
            const faces = toExport.faces;
            
            for( const l in vertices ) {
                const v = vertices[l];
                v.applyMatrix4(matrixWorld);
                stringOBJ += "v "+ v.x + " "+ v.y + " "+ v.z + "\n";
            }

            for( const l in faces  ) {
                const f = faces[l];

                // Les faces en OBJ sont indexés à partir de 1
                const a = f.a + 1 + offset;
                const b = f.b + 1 + offset;
                const c = f.c + 1 + offset;

                stringOBJ += "f "+ a+ " " + b+ " "+ c+ "\n"
            }
            offset += vertices.length;
        }
    }
    download( stringOBJ, "save_scene.OBJ");
}

function download(text, name) {
    var a = document.createElement("a");
    var file = new Blob([text], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
}
