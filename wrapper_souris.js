"use strict";

function onMouseUp(event, pickingData, Drawing) {
    variablesCorps.picked_module    = null;
    variablesBallons.picked_handler = null; 
    variablesBallons.picked_groupe  = null;
    pickingData.selectedObject      = null;

    mouseFunctions.saveDrawing(pickingData, Drawing); //cf mouseFunction
}

function onMouseDown(event, raycaster, screenSize, sceneThreeJs, pickingData, guiPrimitivesParam, Drawing, drawingThreeJs) {
    const drawingGraph =  drawingThreeJs.sceneGraph;
    const drawingCamera = drawingThreeJs.camera;
    const camera = sceneThreeJs.camera;
    if(phase_actuelle === phases.PHASE_CORPS) {onMouseDownCorps(event, raycaster, screenSize, sceneThreeJs, pickingData);}
    if(phase_actuelle === phases.PHASE_DETAILS) {onMouseDownDetails(event, raycaster, screenSize, sceneThreeJs.sceneGraph, camera, pickingData, guiPrimitivesParam, Drawing, drawingGraph, drawingCamera);}
    
}

function onMouseDownCorps(event, raycaster, screenSize, sceneThreeJs, pickingData) {
    if(sceneThreeJs.controls.enabled === true) {
            return;
        }

        const intersects = calculer_intersects(event, raycaster, screenSize, sceneThreeJs, true);
        if(intersects.length == 0) {
            return;
        }
        const pointIntersection = calculer_point_intersection(event, raycaster, screenSize, sceneThreeJs);
        if(event.buttons === 1){ //si seul le bouton gauche est clique 
            if(intersects[0].object.name == "ballon") {
                variablesBallons.picked_groupe = intersects[0].object.instance.groupe;

                pickingData.selectedObject = variablesBallons.picked_groupe;
                pickingData.selectedPlane.p = intersects[0].point.clone();
                pickingData.selectedPlane.n = sceneThreeJs.camera.getWorldDirection().clone();
                //normale du plan = direction de la camera
            }
            if(intersects[0].object.name == "handler") {//c'est un ballon, on va le modifier en consequence
                variablesBallons.picked_handler = intersects[0].object;

                pickingData.selectedObject = variablesBallons.picked_handler;
                pickingData.selectedPlane.p = intersects[0].point.clone();
                pickingData.selectedPlane.n = sceneThreeJs.camera.getWorldDirection().clone(); 
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

            const instance = initialiser_ballon(pointIntersection, sceneThreeJs);

            variablesBallons.instances.push(instance);
            sceneThreeJs.sceneGraph.add(instance.groupe);
            sceneThreeJs.pickableObjects.push(instance.groupe);//on ajoute les handlers aux objets pickable

            if(instance.mesh != null) {
                sceneThreeJs.sceneGraph.remove(instance.mesh);
                instance.mesh = null;
            }        if(instance.mesh != null) {
                sceneThreeJs.sceneGraph.remove(instance.mesh);
                instance.mesh = null;
            }
            const mesh = creer_ballon_from_instance(instance, sceneThreeJs);
            sceneThreeJs.sceneGraph.add(mesh);
            sceneThreeJs.pickableObjects.push(mesh);
            pickingData.selectableObjects.push(mesh);
        }
}

function onMouseDownDetails(event, raycaster, screenSize, sceneGraph, camera, pickingData, guiPrimitivesParam, Drawing, drawingGraph, drawingCamera) {
    if ( Drawing.drawingMode && Drawing.saved === false) {
        mouseFunctions.enableDrawing(event, Drawing, screenSize);
    }

    else if( pickingData.enabled ) {
        mouseFunctions.clickOn(event, raycaster, screenSize, sceneGraph, camera, pickingData, guiPrimitivesParam, Drawing, drawingGraph);
    }
}

function onMouseMove(event, raycaster, sceneThreeJs, screenSize, pickingData, guiPrimitivesParam, Drawing, drawingThreeJs) {
    const drawingGraph = drawingThreeJs.sceneGraph;
    const drawingCamera = drawingThreeJs.camera;

    const camera = sceneThreeJs.camera;
    const sceneGraph = sceneThreeJs.sceneGraph;

    if(phase_actuelle === phases.PHASE_CORPS) {
            onMouseMoveCorps(event, raycaster, screenSize, sceneThreeJs, pickingData);

    }
    if(phase_actuelle === phases.PHASE_DETAILS) {onMouseMoveDetails(event, raycaster, screenSize, sceneGraph, camera, pickingData, guiPrimitivesParam, Drawing, drawingGraph, drawingCamera)}
}

function onMouseMoveCorps(event, raycaster, screenSize, sceneThreeJs, pickingData) {
    if(sceneThreeJs.controls.enabled === true) {
        return;
    }

    const pointIntersection = calculer_point_intersection(event, raycaster, screenSize, sceneThreeJs);
    const intersects = calculer_intersects(event, raycaster, screenSize, sceneThreeJs);
    if(variablesCorps.picked_module != null) {
        ajouter_module(variablesCorps.picked_module, pointIntersection, sceneThreeJs, pickingData);
        mettre_a_jour_modele_tous_modules();

        retirer_helices();
        let tableau = determiner_extremite_arriere();
        ajouter_helices(sceneThreeJs.sceneGraph, tableau);
    }
    else if(variablesBallons.picked_groupe != null) {
        deplacer_objet_methode_2(event, screenSize, intersects, sceneThreeJs.camera, pickingData);
        const instance = variablesBallons.picked_groupe.instance;

        if(instance.mesh != null) {
            sceneThreeJs.sceneGraph.remove(instance.mesh);
            instance.mesh = null;
        }
        const mesh = creer_ballon_from_instance(instance, sceneThreeJs);
        sceneThreeJs.sceneGraph.add(mesh);
        sceneThreeJs.pickableObjects.push(mesh);

    }
    else if(variablesBallons.picked_handler != null) {
        deplacer_objet_methode_2(event, screenSize, intersects, sceneThreeJs.camera, pickingData);
        replacer_handlers(variablesBallons.picked_handler);
        //modifier_ballon(variablesBallons.picked_handler, pointIntersection);
        const instance = variablesBallons.picked_handler.instance;

        if(instance.mesh != null) {
            sceneThreeJs.sceneGraph.remove(instance.mesh);
            instance.mesh = null;
        }
        const mesh = creer_ballon_from_instance(instance, sceneThreeJs);
        sceneThreeJs.sceneGraph.add(mesh);
        sceneThreeJs.pickableObjects.push(mesh);
    }
    supprimer_ficelles(sceneThreeJs.sceneGraph);
    for(let i = 0; i < variablesBallons.instances.length; i++) {
        let instance = variablesBallons.instances[i];
        creer_ficelles_from_instance(instance, variablesCorps.modules, sceneThreeJs.sceneGraph);
    }
}

function onMouseMoveDetails(event, raycaster, screenSize, sceneGraph, camera, pickingData, guiPrimitivesParam, Drawing, drawingGraph, drawingCamera) {
    if (Drawing.enabled) {
      mouseFunctions.drawingInProgress(event, screenSize, Drawing, sceneGraph);
    }

    // Gestion du drag & drop
    else if( pickingData.enableDragAndDrop === true) {
      mouseFunctions.dragDrop(event, screenSize, camera, pickingData);
    }
}

function onKeyDown(event, raycaster, screenSize, sceneThreeJs, pickingData) {
    //touche numpad 1 : 97
    switch(event.keyCode){
        case 98:
        sceneThreeJs.camera.position.set(5, 0, 0);
        sceneThreeJs.camera.lookAt(0, 0, 0);

        break;

        case 100:
        sceneThreeJs.camera.position.set(0, 0, 5);
        sceneThreeJs.camera.lookAt(0, 0, 0);
        break;

        case 102:
        sceneThreeJs.camera.position.set(0, 0, -5);
        sceneThreeJs.camera.lookAt(0, 0, 0);
        break;

        case 104:
        sceneThreeJs.camera.position.set(-5, 0, 0);
        sceneThreeJs.camera.lookAt(0, 0, 0);
        break;
    }

    //keyCode de la touche supprimer : 27
    if(event.keyCode === 27){
        const n = variablesBallons.instances.length;
        for(let i = 0; i < n; i++) { 
            sceneThreeJs.sceneGraph.remove(variablesBallons.instances[n-i-1].groupe);
            sceneThreeJs.sceneGraph.remove(variablesBallons.instances[n-i-1].mesh);
            variablesBallons.instances.pop();
        }
    }
    if(event.ctrlKey) {
        sceneThreeJs.controls.enabled = true;
        pickingData.enabled           = false;
    }
}

function onKeyUp(event, sceneThreeJs, pickingData) {
    if(!event.ctrlKey) {
        sceneThreeJs.controls.enabled = false;
        pickingData.enabled           = true;
    }
}
