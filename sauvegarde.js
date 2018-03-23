"use strict";

//contient les fonctions necessaires a la sauvegarde / chargement des scenes

function saveScene(sceneGraph,createdObjects) {
    download( JSON.stringify(sceneGraph), "save_scene.js" );
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
            console.log(toBeAdded.name);
        }

    }
    
);
}

function exportOBJ(createdObjects) {

    let stringOBJ = "";
    let offset = 0;



    for( const k in createdObjects ) {

        // *************************************** //
        // Applique préalablement la matrice de transformation sur une copie des sommets du maillage
        // *************************************** //
        createdObjects[k].updateMatrix();
        const matrix = createdObjects[k].matrix;

        const toExport = createdObjects[k].geometry.clone();
        toExport.applyMatrix( matrix );


        // *************************************** //
        // Exporte les sommets et les faces
        // *************************************** //
        if( toExport.vertices!==undefined && toExport.faces!==undefined ) {

            const vertices = toExport.vertices;
            const faces = toExport.faces;

            for( const k in vertices ) {
                const v = vertices[k];
                stringOBJ += "v "+ v.x+ " "+ v.y+ " "+ v.z+ "\n";
            }

            for( const k in faces  ) {
                const f = faces[k];

                // Les faces en OBJ sont indexés à partir de 1
                const a = f.a + 1 + offset;
                const b = f.b + 1 + offset;
                const c = f.c + 1 + offset;

                stringOBJ += "f "+ a+ " "+ b+ " "+ c+ "\n"
            }
            offset += vertices.length;
        }
    }
    download( stringOBJ, "save_scene.obj" );
}

function download(text, name) {
    var a = document.createElement("a");
    var file = new Blob([text], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
}

