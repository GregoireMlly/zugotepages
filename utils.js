import {
    MeshBasicMaterial,

    Color
  } from 'three';
var score = 100;
export function updateScore(score2 = -5) {
    if (score2 == -5)
    {
        score=Math.round(98*score/100);
    }
    else{
        score = score2;
    }
    document.getElementById('score').textContent = 'Chance de fécondation: ' + score;
}


export function getRndInteger(min, max) {
    const result  = Math.random() * (max - min + 1)  + min;
    if (min== -1 && max == 1 && Math.floor(result) == 0)
    {
        return 1;
    }
    return result;
}
export function calculateDistance(x1, y1, x2, y2) {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance;
}
export function checkCollision(sperm,playerBB,BoxArr) {
    //console.log(sperm);
    playerBB.setFromObject(sperm);
    var touched = false;
    //centre: x = 20, y = 5, z = k
    const k = calculateDistance(sperm.position.x+20, sperm.position.y+5,20,5);
    if (k>=5)// sort du tube
    {
        
        sperm.traverse(function(child) {
            if (child.isMesh) {
                child.material = new MeshBasicMaterial({ color: 0x000000 });
            }
        });
        touched = true;

    }
    BoxArr.forEach((BoxInfection)=>{
        if(playerBB.intersectsBox(BoxInfection))
    {
        sperm.traverse(function(child) {
            if (child.isMesh) {
                child.material = new MeshBasicMaterial({ color: 0x000000 });

                }
            });
        touched=true;
    }
    });
    if (!touched)
    {
        sperm.traverse(function(child) {
            if (child.isMesh) {
                child.material = new MeshBasicMaterial({ color: 0xffffffff });
            }
        });

    }
    else{
        updateScore();
    }

}

export function winOrNot(){
    var win = getRndInteger(0,100);
    if (win < score )
    {
        return true;
    }
    return false;

}


export function isLookingAt(cameraPos, objectPos, cameraDirection) {
    // Calculer le vecteur de A vers B (vecteur AB)
    const AB = {
        x: objectPos.x - cameraPos.x, // x_objectPos - x_cameraPos
        y: objectPos.y - cameraPos.y, // y_objectPos - y_cameraPos
        z: objectPos.z - cameraPos.z  // z_objectPos - z_cameraPos
    };
    
    // Fonction pour normaliser un vecteur
    function normalize(v) {
        const magnitude = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        return {
            x: v.x / magnitude,
            y: v.y / magnitude,
            z: v.z / magnitude
        };
    }
    
    // Normalisation du vecteur directionnel de A (c) et du vecteur AB
    const AB_norm = normalize(AB);
    const c_norm = normalize(cameraDirection);

    // Calcul du produit scalaire
    const dotProduct = AB_norm.x * c_norm.x + AB_norm.y * c_norm.y + AB_norm.z * c_norm.z;

    // Seuil pour déterminer si A regarde B (30 degrés de tolérance)
    const angleThreshold = Math.cos(10 * Math.PI / 180); // convertit 30 degrés en radians

    // Si le produit scalaire est supérieur au seuil, A regarde B
    return dotProduct >= angleThreshold;
}

// Exemple d'utilisation :
const positionA = { x: 1, y: 2, z: 3 }; // Position de A
const positionB = { x: 4, y: 5, z: 6 }; // Position de B
const directionA = { x: 0, y: 1, z: 0 }; // Direction de A

console.log(isLookingAt(positionA, positionB, directionA)); // Affiche true ou false selon l'alignement

