//Code servant a animer notre objet

//premiere fonction : faire tourner les helices
function tourner_helices(delta) {
	let modules = variablesCorps.modules;

	for(let i = 0; i < modules.length; i++) {
		let helice = modules[i].getObjectByName("helice");
		if(helice != null) {
			helice.rotateZ(delta*0.5);
		}
	}
}


//deuxieme fonction : deplacer legerement le ballon par rapport a la coque
//Actuellement, la fonction est totalement buguee
function deplacer_ballons(temps, delta) {
	let LATITUDE_DEPLACEMENT = 0.2;
	let PERIODE_DEPLACEMENT  = 1;
	let VITESSE_DEPLACEMENT = (2*Math.PI)/(PERIODE_DEPLACEMENT);

	let ballons = variablesBallons.instances;

	for(let i = 0; i < ballons.length; i++) {
		let instance = ballons[i];
		instance.groupe.translateZ(delta*VITESSE_DEPLACEMENT*LATITUDE_DEPLACEMENT*Math.sin(temps*VITESSE_DEPLACEMENT));
		instance.mesh.translateZ(delta*VITESSE_DEPLACEMENT*LATITUDE_DEPLACEMENT*Math.sin(temps*VITESSE_DEPLACEMENT));
	}
}

function mouvement_voiles(Drawing, temps, delta) {

	const T = 0.5;
	const a = 1;
	const ny = new THREE.Vector3(0,1,0);

	for (let i = 0; i < Drawing.rightSailList.length; i++) {
		let voileDroite = Drawing.rightSailList[i];
		voileDroite.rotateY( a*(Math.PI/8)*Math.sin(temps/T) - (Math.PI/8)*Math.sin( (temps-delta)/T) );
		//voileDroite.updateMatrix();
	}

	for (let i = 0; i < Drawing.leftSailList.length; i++) {
		let voileGauche = Drawing.leftSailList[i];
		voileGauche.rotateY( -a*(Math.PI/8)*Math.sin(temps/T) + (Math.PI/8)*Math.sin( (temps-delta)/T) );
	}

}

function animer_cheminee(t) {
	let modules = variablesCorps.modules;

	for(let i = 0; i < modules.length; i++) {
		let cheminee = modules[i].getObjectByName("cheminee");
		if(cheminee != undefined){
			let scaling_x = 0.5 + 0.05*Math.cos(t);
			let scaling_y = 0.5 + 0.02*Math.sin(t);
			cheminee.scale.set(scaling_x, scaling_y, scaling_x);
		}
	}
}