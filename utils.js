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
