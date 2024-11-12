
export async function  rotateObject(rotatingObject,duration, speed=1) {
    return new Promise((resolve) => {
    const stepDuration = 10;  
    const intervalId = setInterval(() => {
        rotatingObject.rotation.x+=speed;
    }, stepDuration);

    // Stop the rotation after the total duration
    setTimeout(() => {
        clearInterval(intervalId);
        console.log('Rotation finished');
        resolve();
    }, duration * 1000);  // Convert duration to milliseconds
});
}


export async function moveSperm(sperm, min, superior, moveUp = false) {
    return new Promise((resolve) => {
        function move() {
            const condition = superior ? sperm.position.x > min : sperm.position.x < min;

            if (condition) {
                sperm.position.x -= 0.1 * (superior ? 1 : -1);
                sperm.rotation.x += 1;
                if (moveUp) {
                    sperm.position.y += 0.01;
                    sperm.position.z += 0.004;
                }
                requestAnimationFrame(move);
            } else {
                console.log("get to ovule");
                resolve();
            }
        }
        move();
    });
}