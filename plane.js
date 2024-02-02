//My own custom function w help from chatGPT. Check version history for more efficant code that doesn't allow for the setting of line width
function makeGeometry(width, height, widthSegments, heightSegments, noise, scale, amp, slide) {
  const points = [];
  const widthCalc = width / widthSegments;
  const heightCalc = height / heightSegments;

  for (let j = 0; j <= heightSegments; j++) {
    for (let i = 0; i <= widthSegments; i++) {
      if(i==0){
        points.push(new THREE.Vector3((i * widthCalc)-width / 2, j * heightCalc - (height / 2), 1));
      }
      else{
        points.push(new THREE.Vector3((i * widthCalc)-width / 2, j * heightCalc - (height / 2), 0));
      }
      points.push(new THREE.Vector3((i * widthCalc)-width / 2, (j + 1) * heightCalc - (height / 2), 0));

      if ((1 + i) <= widthSegments) {
        points.push(new THREE.Vector3((i * widthCalc)-width / 2, j * heightCalc - (height / 2), 0));
      } else {
        points.push(new THREE.Vector3((i * widthCalc)-width / 2, (j + 1) * heightCalc - (height / 2), 1));
      }
    }
  }
  for(let i = 0; i<points.length; i++){
    points[i].y+=slide;
    if(points[i].z==0){
      points[i].z = getNoise(noise, points[i].x, points[i].y, scale, amp, 0);
    }
  }
  
  const bufferGeometry = new THREE.BufferGeometry().setFromPoints(points);

  // Convert the BufferGeometry to LineGeometry using the older method
  const lineGeometry = new THREE.LineGeometry();
  lineGeometry.setPositions(bufferGeometry.attributes.position.array);

  const material = new THREE.LineMaterial({
    color: new THREE.Color(0x75fbfd),
    opacity: 1,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    sizeAttenuation: true,
    linewidth: 10,
  });

  const line = new THREE.Line2(lineGeometry, material);
  line.position.set(0, 0, 0);

  return line;
}


function getNoise(noise, x, y, scale, amp, slide){
  const position = new THREE.Vector3();
  const noiseScale = scale;
  const noiseAmp = amp;
  const max = 14;
  
  position.x=x
  position.y=y+slide;
  position.divideScalar(noiseScale);
  var factor = Math.pow(Math.abs(position.x*1.4), 4);
  if(factor>max){
    factor=max;
  }
  return -Math.abs(noise.get(position.x, position.y, 0) * noiseAmp * factor);
}

function applyNoise(plane, noise, scale, amp, slide){
    // Loop over each vertex in the plane's geometry and set its z-coordinate based on Perlin noise
  const position = new THREE.Vector3();
  const noiseScale = scale;
  const noiseAmp = amp;
  const max = 14;
  const positionAttribute = plane.attributes.position;
  for (let i = 0; i < positionAttribute.array.length; i+=3) {
    position.x=positionAttribute.array[i];
    position.y=positionAttribute.array[i+1]+slide;
    position.divideScalar(noiseScale);
    var factor = Math.pow(Math.abs(position.x*1.4), 4);
    if(factor>max){
      factor=max;
    }
    positionAttribute.array[i+2] = -Math.abs(noise.get(position.x, position.y, 0) * noiseAmp * factor);
    positionAttribute.array[i+1] = position.y*noiseScale;
  }
  return plane;
}











class PerlinNoise {
  constructor() {
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    this.permutation = new Uint8Array(512);
    this.gradient = new Float32Array(512);
    this.gradient = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = this.p[i & 255];
      this.gradient[i] = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1];
    }
  }

  dot(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, t) {
    return (1 - t) * a + t * b;
  }

  get(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;

    const gradAA = this.gradient[AA & 511];
    const gradBA = this.gradient[BA & 511];
    const gradAB = this.gradient[AB & 511];
    const gradBB = this.gradient[BB & 511];
    const gradAAB = this.gradient[(AA + 1) & 511];
    const gradBAB = this.gradient[(BA + 1) & 511];
    const gradABB = this.gradient[(AB + 1) & 511];
    const gradBBB = this.gradient[(BB + 1) & 511];

    const lerpAA = this.lerp(this.dot([gradAA[0], gradAA[1], gradAA[2]], x, y, z), this.dot([gradBA[0], gradBA[1], gradBA[2]], x - 1, y, z), u);
    const lerpAB = this.lerp(this.dot([gradAB[0], gradAB[1], gradAB[2]], x, y - 1, z), this.dot([gradBB[0], gradBB[1], gradBB[2]], x - 1, y - 1, z), u);
    const lerpA = this.lerp(lerpAA, lerpAB, v);

    const lerpBA = this.lerp(this.dot([gradAAB[0], gradAAB[1], gradAAB[2]], x, y, z - 1), this.dot([gradBAB[0], gradBAB[1], gradBAB[2]], x - 1, y, z - 1), u);
    const lerpBB = this.lerp(this.dot([gradABB[0], gradABB[1], gradABB[2]], x, y - 1, z - 1), this.dot([gradBBB[0], gradBBB[1], gradBBB[2]], x - 1, y - 1, z - 1), u);
    const lerpB = this.lerp(lerpBA, lerpBB, v);

    return this.lerp(lerpA, lerpB, w);
  }
}





