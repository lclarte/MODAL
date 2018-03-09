"use strict";


const mouseFunctions = (function() {

return {

//Fonction qui autorise le tracé de la voile quand on clique à la souris si le mode est activé
//Appel dans onMouseDown
//Condition: if ( Drawing.drawingMode && Drawing.saved === false)
//OK implemente dans scene.js
enableDrawing: function(Drawing) { Drawing.enabled = true;},

//Fonction qui permet de placer ou supprimer des primitves en cliquant
//Appel dans onMouseDown
//Condition: else if( pickingData.enabled )
//OK
clickOn: function(event, raycaster, screenSize, sceneGraph, camera, pickingData, guiPrimitivesParam, Drawing, drawingGraph) {
  if (event.button === 0){mouseFunctions.addObject(event, raycaster, screenSize, sceneGraph, camera, pickingData, guiPrimitivesParam, Drawing);}
  else if (event.button === 2){mouseFunctions.removeObject(event, raycaster, screenSize, sceneGraph, camera, pickingData, guiPrimitivesParam);}
  else {pickingData.enableDragAndDrop = true;}
},

//Fonction qui permet de placer un objet en cliquant 
//Appel dans onMouseDown, clickOn -> OK pas besoin de le rajotuer dans le scene.js
//Condition: if (event.button === 0)

addObject: function(event, raycaster, screenSize, sceneGraph, camera, pickingData, guiPrimitivesParam, Drawing) {

  const xPixel = event.clientX;
  const yPixel = event.clientY;

  const x =  2*xPixel/screenSize.w-1;
  const y = -2*yPixel/screenSize.h+1;

  raycaster.setFromCamera(new THREE.Vector2(x,y),camera);
  const intersects = raycaster.intersectObjects(pickingData.selectableObjects, true);

  const nbrIntersection = intersects.length;

  if( nbrIntersection>0 ) {

      const intersection = intersects[0];

      const p = intersection.point;
      let o = intersection.object;

      const n = intersection.face.normal;
      let object = null;
      let extrudeGeometry = null;
      let extrudeSettings = null;

      while(o.name != "module" && o.parent !== null) {
        o = o.parent;
      }
      if(o.name !== "module") {
        return; //on peut ajouter l'objet que si "le support" sera un bout de la coque
        //c'est necessaire pour gerer efficacement le copier coller de coque
      }

      // Creation d'un nouvel objet au point selectionné
      if (guiPrimitivesParam.primitiveType === "Cube"){
          object = primitive_object.Cube(new THREE.Vector3(0,0,0),guiPrimitivesParam.Size,guiPrimitivesParam.Color);
      }

      else if (guiPrimitivesParam.primitiveType === "Sphere"){
          object = primitive_object.Sphere(new THREE.Vector3(0,0,0),guiPrimitivesParam.Size,guiPrimitivesParam.Color);
      }

      else if (guiPrimitivesParam.primitiveType === "Sail"){
         extrudeSettings = { amount: 0.01, bevelEnabled:false };
         extrudeGeometry = new THREE.ExtrudeBufferGeometry( Drawing.sailGeometry, extrudeSettings);
         object = new THREE.Mesh( extrudeGeometry, MaterialRGB(0.9,0.9,0.9) ) ;
      }
      o.details.push(object); //a ce stade, on sait deja que l'objet sur lequel on va l'ajouter est un bout de coque
      console.log(o.details);



      object.matrixAutoUpdate = false;

      // le centre du nouvel objet est à la position:
      //   center = p + L/2 n
      const center = p.clone().add(n.clone().multiplyScalar(guiPrimitivesParam.Size/2));

      //const marqueur = primitive.Sphere(new THREE.Vector3(0,0,0),0.05,[0.1,0.1,0.1]);
      //const pointeur = primitive.Cylinder( p.clone() , p.clone().add(n.clone()) , 0.02, [1,1,1]);


      const axis = new THREE.Vector3(0,0,1).cross( n.clone() );
      const theta = Math.acos( n.clone().z );
      const Rotate = new THREE.Matrix4().makeRotationAxis(axis.normalize(),theta);
      object.geometry.applyMatrix(Rotate);
      object.updateMatrix(); 
      if (guiPrimitivesParam.primitiveType != "Sail"){
        object.position.copy( center );
      }
      else if(guiPrimitivesParam.primitiveType == "Sail"){
        object.position.copy( p.clone() );
      }
      //marqueur.position.copy ( p );
      object.updateMatrix();

      object.castShadow = true;
      object.receiveShadow = true;
      object.name = "userObject";
      sceneGraph.add(object);
      //sceneGraph.add(marqueur);
      //sceneGraph.add(pointeur);
      pickingData.selectableObjects.push(object);
}; },



//Fonction qui permet de supprimer un objet en cliquant
//Appel dans onMouseDown, clickOn -> OK pas besoin de le rajouter dans le scene.js

//Condition: else if (event.button === 2)

removeObject: function(event, raycaster, screenSize, sceneGraph, camera, pickingData, guiPrimitivesParam) {

  const xPixel = event.clientX;
  const yPixel = event.clientY;

  const x =  2*xPixel/screenSize.w-1;
  const y = -2*yPixel/screenSize.h+1;

  raycaster.setFromCamera(new THREE.Vector2(x,y),camera);
  const intersects = raycaster.intersectObjects( pickingData.selectableObjects );

  const nbrIntersection = intersects.length;
  const intersection = intersects[0];

  if( nbrIntersection>0 && intersection.object != sceneGraph.getObjectByName("plane")) {
    sceneGraph.remove(intersection.object);
  }
},

//Fonction à appeller dans onMouseUp, sauvegarde le dessin de voile si le mode était activé
//OK, ajoute dans le scene.js
saveDrawing: function(pickingData, Drawing) {

  pickingData.enableDragAndDrop = false;

  if (Drawing.enabled) {
    Drawing.sailGeometry = new THREE.Shape( Drawing.vertices );
    Drawing.sail = new THREE.Mesh( Drawing.sailGeometry, new THREE.MeshBasicMaterial({color:0xff0000,wireframe: true,wireframeLinewidth:2}) );
    Drawing.saved = true;
    console.log(Drawing.sail);
  }

  Drawing.enabled = false;
},

//Fonction qui fait le dessin
//Appel dans onMouseMove
//Condition: if (Drawing.enabled)
//OK implemente
drawingInProgress: function(event, screenSize, Drawing, sceneGraph) {
  const xPixel = event.clientX;
  const yPixel = event.clientY;

  const x =  2*xPixel/screenSize.w-1;
  const y = -2*yPixel/screenSize.h+1;

  const point = new THREE.Vector2(x, y);


  Drawing.vertices.push(point);
  const starGeometry = new THREE.Geometry();
  starGeometry.vertices.push(point);
  const starMaterial = new THREE.PointsMaterial( { color: 0x888888 } );
  const Star = new THREE.Points( starGeometry, starMaterial );
  sceneGraph.add(Star);
},

//Fonction obsolète de Drag n' drop
//Appel dans onMouseMove

//Condition:else if( pickingData.enableDragAndDrop === true)
dragDrop: function(event, screenSize, camera, pickingData) {
  // Coordonnées de la position de la souris
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

  pickingData.visualRepresentation.sphereTranslation.visible = true;
  pickingData.visualRepresentation.sphereTranslation.position.copy(p);
},

};

})();
