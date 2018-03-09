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

//troixieme fonction : faire de la fumee avec les tuyaux ? 