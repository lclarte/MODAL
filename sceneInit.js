"use strict";


const sceneInit = (function() {

return {


insertSkybox: function(sceneGraph) {
    var geometry = new THREE.CubeGeometry(500, 500, 500);
    var cubematerials = 
    [
        new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("textures/front.png"), side: THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("textures/back.png"), side: THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("textures/up.png"), side: THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("textures/down.png"), side: THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("textures/right.png"), side: THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("textures/left.png"), side: THREE.DoubleSide})
    ];

    var cubematerial = new THREE.MeshFaceMaterial(cubematerials);
    var cube = new THREE.Mesh(geometry, cubematerial);
    sceneGraph.add(cube);

},

    // Création et ajout de lumière dans le graphe de scène
insertLight: function(sceneGraph,p) {
        const spotLight = new THREE.SpotLight(0xffffff,0.5);
        spotLight.position.copy(p);

        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
        spotLight.name = "spotlight";

        sceneGraph.add(spotLight);
    },

insertAmbientLight: function(sceneGraph) {
    const ambient = new THREE.AmbientLight( 0xffffff, 0.2 );
    ambient.name = "lightAmbient";
    sceneGraph.add(ambient);
},

    // Création et ajout d'une caméra dans le graphe de scène
createCamera: function(x,y,z) {
        const camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,500);
        camera.far = 10000;
        camera.position.set(x,y,z);
        camera.lookAt(0,0,0);

        return camera;
    },

createOrthographicCamera: function(x,y,z) {
        const camera = new THREE.OrthographicCamera();
        camera.position.set(x,y,z);
        camera.lookAt(0,0,0);

        return camera;
},

    // Initialisation du moteur de rendu
createRenderer : function(){
        const renderer = new THREE.WebGLRenderer({antialias:true} );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setClearColor(0xffffff,1.0);
        renderer.setSize( window.innerWidth, window.innerHeight );

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.Type = THREE.PCFSoftShadowMap;

        return renderer;
    },


insertRenderInHtml : function(domElement) {
    const baliseHtml = document.querySelector("#AffichageScene3D");
    baliseHtml.appendChild(domElement);
},

};

})();
