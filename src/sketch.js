const { VerletPhysics2D, VerletParticle2D, VerletSpring2D } = toxi.physics2d;
const { GravityBehavior, AttractionBehavior } = toxi.physics2d.behaviors;
const { Vec2D, Rect } = toxi.geom;

//physics.addBehavior(new AttractionBehavior(p, 20, -1.2, 0.01));

function randomInt(min, max) {
  return floor(Math.random() * (max - min) + min);
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function clipVal(val, min, max) {
  let valRet;

  valRet = val;

  if (valRet > max) {
    valRet = max;
  } else if (valRet < min) {
    valRet = min;
  }

  return valRet;
}

const getAreaOfPolygon = (particlesIn) => {
  let areaTemp = 0;
  const particlesInLen = particlesIn.length;

  for (let partIndex = 0; partIndex < particlesInLen - 1; partIndex += 1) {
    areaTemp +=
      particlesIn[partIndex].x * particlesIn[partIndex + 1].y -
      particlesIn[partIndex + 1].x * particlesIn[partIndex].y;
  }

  areaTemp +=
    particlesIn[particlesInLen - 1].x * particlesIn[0].y -
    particlesIn[0].x * particlesIn[particlesInLen - 1].y;

  areaTemp = 0.5 * Math.abs(areaTemp);

  return areaTemp;
};

const sortIndexesFunc = (arrayIn) => {
  let arrayTemp = arrayIn;

  return arrayTemp
    .map((val, ind) => {
      return { ind, val };
    })
    .sort((a, b) => {
      return a.val > b.val ? 1 : a.val === b.val ? 0 : -1;
    })
    .map((obj) => obj.ind);
};

/*
//From calculations for lat/long segments. x replaces lat and y replaces long
function lineTurn(p1, p2, p3) {
  a = p1.y; b = p1.x; 
  c = p2.y; d = p2.x;
  e = p3.y; f = p3.x;
  A = (f - b) * (c - a);
  B = (d - b) * (e - a);
  return (A > B + Number.EPSILON) ? 1 : (A + Number.EPSILON < B) ? -1 : 0; //Episilon is assumed just to be a small number say 0.001
}

function checkLinesIntersecting(p1, p2, p3, p4) {
  return (lineTurn(p1, p3, p4) != lineTurn(p2, p3, p4)) && (lineTurn(p1, p2, p3) != lineTurn(p1, p2, p4));
}
*/

function checkLinesIntersecting(p1X, p1Y, p2X, p2Y, p3X, p3Y, p4X, p4Y) {
  const A1 = (p4X - p1X) * (p3Y - p1Y);
  const B1 = (p3X - p1X) * (p4Y - p1Y);

  const A2 = (p4X - p2X) * (p3Y - p2Y);
  const B2 = (p3X - p2X) * (p4Y - p2Y);

  const A3 = (p3X - p1X) * (p2Y - p1Y);
  const B3 = (p2X - p1X) * (p3Y - p1Y);

  const A4 = (p4X - p1X) * (p2Y - p1Y);
  const B4 = (p2X - p1X) * (p4Y - p1Y);

  const check1 = A1 > B1 + 0.000001 ? 1 : A1 + 0.000001 < B1 ? -1 : 0;
  const check2 = A2 > B2 + 0.000001 ? 1 : A1 + 0.000001 < B2 ? -1 : 0;
  const check3 = A3 > B3 + 0.000001 ? 1 : A3 + 0.000001 < B3 ? -1 : 0;
  const check4 = A4 > B4 + 0.000001 ? 1 : A4 + 0.000001 < B4 ? -1 : 0;

  return check1 != check2 && check3 != check4;
}

//p1X and p2X need to be the same
function checkHoriToLineIntersection(p1X, p1Y, p2X, p2Y, p3X, p3Y, p4X, p4Y) {
  const A1 = (p4X - p1X) * (p3Y - p1Y);
  const B1 = (p3X - p1X) * (p4Y - p1Y);

  const A2 = (p4X - p2X) * (p3Y - p2Y);
  const B2 = (p3X - p2X) * (p4Y - p2Y);

  const C1 = p2Y - p1Y;
  const C2 = (p3X - p1X) * (p4X - p1X);

  const check1 = A1 > B1 + 0.000001 ? 1 : A1 + 0.000001 < B1 ? -1 : 0;
  const check2 = A2 > B2 + 0.000001 ? 1 : A1 + 0.000001 < B2 ? -1 : 0;

  const check3 = C1 === 0 ? false : C2 < 0 ? true : false;

  return check1 != check2 && !check3;
}

const findClosestLineToParticle = (particleToCheckIn, particleListIn) => {
  particleListInLen = particleListIn.length;

  const partDists = [];

  for (let partIndex = 0; partIndex < particleListInLen; partIndex += 1) {
    let partToPartDist = Math.sqrt(
      Math.pow(particleListIn[partIndex].x - particleToCheckIn.x, 2) +
        Math.pow(particleListIn[partIndex].y - particleToCheckIn.y, 2)
    );

    partDists.push(partToPartDist);
  }

  const partDistsCopy = [...partDists];

  const partDistsIndeces = sortIndexesFunc(partDistsCopy);

  const partDistsIndecesLen = partDistsIndeces.length;

  let partAbsDistIndexDif = abs(
    partDistsIndeces[partDistsIndecesLen - 1] -
      partDistsIndeces[partDistsIndecesLen - 2]
  );

  let retArray;

  if (
    partAbsDistIndexDif === 1 ||
    partAbsDistIndexDif === partDistsIndecesLen
  ) {
    retArray = [
      partDistsIndeces[partDistsIndecesLen - 1],
      partDistsIndeces[partDistsIndecesLen - 2],
    ];
  } else {
    if (partDistsIndeces[partDistsIndecesLen - 1] === 0) {
      retArray = [0, partDistsIndecesLen - 1];
    } else {
      retArray = [0, 1];
    }
  }

  return retArray;
};

const findCenterCoords = (prevXCenter, prevYCenter, particleArrayIn) => {
  const particleArrayInLen = particleArrayIn.length;

  let isNanFlag = 0;
  let newXCenter = 0;
  let newYCenter = 0;
  let newXCenterIsNaN = false;
  let newYCenterIsNaN = false;
  let xEntryCounter = 0;
  let yEntryCounter = 0;

  for (let partIndex = 0; partIndex < particleArrayInLen; partIndex += 1) {
    isNanFlag = particleArrayIn[partIndex].x !== NaN ? 1 : 0;

    if (isNanFlag === 1) {
      newXCenter += particleArrayIn[partIndex].x;
      xEntryCounter += 1;
    }

    isNanFlag = particleArrayIn[partIndex].y !== NaN ? 1 : 0;

    if (isNanFlag === 1) {
      newYCenter += particleArrayIn[partIndex].y;
      yEntryCounter += 1;
    }
  }

  if (xEntryCounter > 0) {
    newXCenter /= parseFloat(xEntryCounter);
  } else {
    newXCenter = prevXCenter;
    newXCenterIsNaN = true;
  }

  if (yEntryCounter > 0) {
    newYCenter /= parseFloat(yEntryCounter);
  } else {
    newYCenter = prevYCenter;
    newYCenterIsNaN = true;
  }

  return { newXCenter, newYCenter, newXCenterIsNaN, newYCenterIsNaN };
};

const checkForNanParticles = (blobIn, numToCheckForIn) => {
  let isNanXFlag = false;
  let isNanYFlag = false;
  let numIsNanCounter = 0;
  let retFlag = false;

  for (let partIndex = 0; partIndex < blobIn.partNum; partIndex += 1) {
    isNanXFlag = blobIn.particles[partIndex].x === NaN ? true : false;
    isNanYFlag = blobIn.particles[partIndex].y === NaN ? true : false;

    if (isNanXFlag || isNanYFlag) {
      numIsNanCounter += 1;
      if (numIsNanCounter >= numToCheckForIn) {
        retFlag = true;
        break;
      }
    }

    //isNanXFlag = false;
    //isNanYFlag = false;
  }

  return retFlag;
};

const resetParticlePositions = (blobIn, centerXIn, centerYIn) => {
  blobIn.pntAngleOffset = 0;

  const radsToDegrees = 6.283185 / 360.0;

  /*
  console.log('The prev position is: ');
  console.log(blobIn.particles[0].getPreviousPosition());
  console.log();
  */

  for (let partIndex = 0; partIndex < blobIn.partNum; partIndex += 1) {
    blobIn.particles[partIndex].lock();

    blobIn.particles[partIndex].x =
      blobIn.pntRad * Math.cos(blobIn.pntAngleOffset * radsToDegrees) +
      centerXIn;
    blobIn.particles[partIndex].y =
      blobIn.pntRad * Math.sin(blobIn.pntAngleOffset * radsToDegrees) +
      centerYIn;

    blobIn.particles[partIndex].unlock();

    blobIn.pntAngleOffset += blobIn.pntAngleSpace;
  }
};

class Particle extends VerletParticle2D {
  constructor(x, y) {
    super(x, y);
    this.r = 8;
    physics.addParticle(this);
    //physics.addBehavior(new AttractionBehavior(this, 10, -1.2, 0.01));
    //physics.addBehavior(new AttractionBehavior(this, 0.1, -50.0));
  }

  show() {
    fill(0);
    circle(this.x, this.y, this.r * 2);
  }
}

class Spring extends VerletSpring2D {
  constructor(a, b, strength) {
    let length = dist(a.x, a.y, b.x, b.y);
    super(a, b, length, strength);
    physics.addSpring(this);
  }

  show() {
    stroke(0);
    line(this.a.x, this.a.y, this.b.x, this.b.y);
  }
}

class Blob {
  constructor(
    partNum,
    pntRad,
    centerX,
    centerY,
    springOuterFactIn,
    springInnerFactIn,
    redFillIn,
    greenFillIn,
    blueFillIn
  ) {
    this.partNum = partNum;
    this.halfPartNum = floor(partNum / 2);
    this.pntRad = pntRad;
    this.centerX = centerX;
    this.centerY = centerY;
    this.areaBase = 0.0;
    this.areaNew = 0.0;
    this.springOuterFactIn = springOuterFactIn;
    this.springInnerFactIn = springInnerFactIn;
    this.redFillIn = redFillIn;
    this.greenFillIn = greenFillIn;
    this.blueFillIn = blueFillIn;

    this.particles = [];
    this.springs = [];
    this.pntAngleSpace = 0.0;
    this.pntAngleOffset = 0.0;

    this.particlesPrevPosArray = [];

    if (pntRad % 2 == 1) {
      this.pntAngleSpace = 360 / partNum;
      this.pntAngleOffset = 0;
    } else {
      this.pntAngleSpace = 360 / partNum;
      this.pntAngleOffset = this.pntAngleSpace / 2;
    }

    for (let partIndex = 0; partIndex < this.partNum; partIndex += 1) {
      this.particles.push(
        new Particle(
          pntRad * Math.cos(this.pntAngleOffset * (6.283185 / 360.0)) +
            this.centerX,
          pntRad * Math.sin(this.pntAngleOffset * (6.283185 / 360.0)) +
            this.centerY
        )
      );

      //physics.addBehavior(new AttractionBehavior(this.particles[partIndex], 10, -1.2, 0.01));

      this.pntAngleOffset += this.pntAngleSpace;
    }

    //Boundary Springs
    for (let partIndex = 0; partIndex < this.partNum - 1; partIndex += 1) {
      this.springs.push(
        new Spring(
          this.particles[partIndex],
          this.particles[partIndex + 1],
          this.springOuterFactIn
        )
      );
    }

    this.springs.push(
      new Spring(
        this.particles[this.partNum - 1],
        this.particles[0],
        this.springOuterFactIn
      )
    );

    //Internal Springs
    for (
      let partIndex = 0;
      partIndex < floor(this.partNum / 2);
      partIndex += 1
    ) {
      this.springs.push(
        new Spring(
          this.particles[partIndex % this.partNum],
          this.particles[(partIndex + this.halfPartNum) % this.partNum],
          this.springInnerFactIn
        )
      );
    }

    //Calculate area of shape
    this.areaBase = getAreaOfPolygon(this.particles);
    this.areaNew = getAreaOfPolygon(this.particles);
  }

  applyPressure(indexIn, testPressureCounterIn) {
    this.areaNew = getAreaOfPolygon(this.particles);

    let centerData = findCenterCoords(
      this.centerX,
      this.centerY,
      this.particles
    );

    this.centerX = centerData.newXCenter;
    this.centerY = centerData.newYCenter;

    let newXCenterIsNan = centerData.newXCenterIsNaN;
    let newYCenterIsNan = centerData.newYCenterIsNaN;

    /*
    if (
      indexIn === 0 &&
      testPressureCounterIn % 10 === 0 &&
      testPressureCounterIn < 500
    ) {
      console.log("The first particle X is: ");
      console.log(this.particles[0].x);
      console.log();
      console.log("The quartile particle X is: ");
      console.log(this.particles[floor(this.partNum / 4)].x);
      console.log();
      console.log("The sec quar particle X is: ");
      console.log(this.particles[floor(this.partNum / 2)].x);
      console.log();
      console.log("The third quar particle X is: ");
      console.log(this.particles[floor((3 * this.partNum) / 4)].x);
      console.log();
      console.log("The first particle Y is: ");
      console.log(this.particles[0].y);
      console.log();
      console.log("The quartile particle Y is: ");
      console.log(this.particles[floor(this.partNum / 4)].y);
      console.log();
      console.log("The sec quar particle Y is: ");
      console.log(this.particles[floor(this.partNum / 2)].y);
      console.log();
      console.log("The third quar particle Y is: ");
      console.log(this.particles[floor((3 * this.partNum) / 4)].y);
      console.log();
      console.log("The area base is: ");
      console.log(this.areaBase);
      console.log();
      console.log("The area new is: ");
      console.log(this.areaNew);
      console.log();
      console.log("The centerX is: ");
      console.log(this.centerX);
      console.log();
      console.log("The centerY is: ");
      console.log(this.centerY);
      console.log();
    }
    */

    let angleOffsetTemp = 0;
    let angleOffsetTempCounter = 0;

    for (let partIndex = 0; partIndex < this.partNum; partIndex += 1) {
      if (abs(this.particles[partIndex].x - this.centerX) < 0.001) {
        if (abs(this.particles[partIndex].y - this.centerY) > 0.001) {
          if (this.particles[partIndex].y > this.centerY) {
            angleOffsetTemp += this.pntAngleSpace * partIndex;
          } else {
            angleOffsetTemp += this.pntAngleSpace * partIndex - 180;
          }

          angleOffsetTempCounter += 1;
        }
      } else if (abs(this.particles[partIndex].y - this.centerY) < 0.001) {
        if (this.particles[partIndex].x > this.centerX) {
          angleOffsetTemp += this.pntAngleSpace * partIndex - 90;
        } else {
          angleOffsetTemp += this.pntAngleSpace * partIndex - 270;
        }

        angleOffsetTempCounter += 1;
      } else {
        angleOffsetTemp +=
          this.pntAngleSpace * partIndex -
          (360 / 6.283185) *
            Math.atan(
              (this.particles[partIndex].y - this.centerY) /
                this.particles[partIndex].x -
                this.centerX
            );

        angleOffsetTempCounter += 1;
      }

      angleOffsetTemp /= float(angleOffsetTempCounter);
    }

    for (let partIndex = 0; partIndex < this.partNum; partIndex += 1) {
      this.particles[partIndex].x =
        this.pntRad * Math.cos(angleOffsetTemp * (6.283185 / 360.0)) +
        this.centerX;

      this.particles[partIndex].y =
        this.pntRad * Math.sin(angleOffsetTemp * (6.283185 / 360.0)) +
        this.centerY;

      /*  
        this.particles[partIndex].x +=
            (this.areaNew / (this.areaNew + 0.001)) *
            Math.cos(angleOffsetTemp * (6.283185 / 360.0)) +
          this.centerX;

        this.particles[partIndex].y +=
            (this.areaNew / (this.areaNew + 0.001)) *
            Math.sin(angleOffsetTemp * (6.283185 / 360.0)) +
          this.centerY;
        */

      angleOffsetTemp += this.pntAngleSpace;
    }
  }

  checkCollisions(blobsIn) {
    /*
    this.centerX =
      (this.particles[0].x +
        this.particles[floor(this.partNum / 4)].x +
        this.particles[floor(this.partNum / 2)].x +
        this.particles[floor((3 * this.partNum) / 4)].x) /
      4;

    this.centerY =
      (this.particles[0].y +
        this.particles[floor(this.partNum / 4)].y +
        this.particles[floor(this.partNum / 2)].y +
        this.particles[floor((3 * this.partNum) / 4)].y) /
      4;
    */

    let centerData = findCenterCoords(
      this.centerX,
      this.centerY,
      this.particles
    );

    this.centerX = centerData.newXCenter;
    this.centerY = centerData.newYCenter;

    const maxTransNearCenter = 1.0;
    const maxTransNormal = 2.5;

    let firstBlobXTrans = 0.0;
    let firstBlobYTrans = 0.0;

    for (let blob of blobsIn) {
      //let firstBlobXTrans = 0.0;
      //let firstBlobYTrans = 0.0;
      let secondBlobXTrans = 0.0;
      let secondBlobYTrans = 0.0;

      let firstBlobXTransTemp = 0.0;
      let firstBlobYTransTemp = 0.0;
      let secondBlobXTransTemp = 0.0;
      let secondBlobYTransTemp = 0.0;

      let centToCentRad = Math.sqrt(
        Math.pow(blob.centerX - this.centerX, 2) +
          Math.pow(blob.centerY - this.centerY, 2)
      );

      let blobToBlobRadSum = this.pntRad + blob.pntRad;

      if (centToCentRad < blobToBlobRadSum) {
        if (Math.abs(blob.centerX - this.centerX) < 0.001) {
          //firstBlobXTrans = randomInt(-1, 1);
          //secondBlobXTrans = -1 * firstBlobXTrans;

          if (Math.random() > 0.5) {
            firstBlobXTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNearCenter,
              maxTransNearCenter
            );
            secondBlobXTransTemp = -1 * firstBlobXTransTemp;
          } else {
            secondBlobXTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNearCenter,
              maxTransNearCenter
            );
            firstBlobXTransTemp = -1 * secondBlobXTransTemp;
          }

          if (Math.abs(blob.centerY - this.centerY) < 0.001) {
            //firstBlobYTrans = randomInt(-1, 1);
            //secondBlobYTrans = -1 * firstBlobYTrans;

            if (Math.random() > 0.5) {
              firstBlobYTransTemp = clipVal(
                (blobToBlobRadSum - centToCentRad) / 2,
                -maxTransNearCenter,
                maxTransNearCenter
              );
              secondBlobYTransTemp = -1 * firstBlobYTransTemp;
            } else {
              secondBlobYTransTemp = clipVal(
                (blobToBlobRadSum - centToCentRad) / 2,
                -maxTransNearCenter,
                maxTransNearCenter
              );
              firstBlobYTransTemp = -1 * secondBlobYTransTemp;
            }
          } else {
            if (this.centerY > blob.centerY) {
              firstBlobYTransTemp = clipVal(
                (blobToBlobRadSum - centToCentRad) / 2,
                -maxTransNormal,
                maxTransNormal
              );
              secondBlobYTransTemp = -1 * firstBlobYTransTemp;
            } else {
              secondBlobYTransTemp = clipVal(
                (blobToBlobRadSum - centToCentRad) / 2,
                -maxTransNormal,
                maxTransNormal
              );
              firstBlobYTransTemp = -1 * secondBlobYTransTemp;
            }
          }
        } else if (Math.abs(blob.centerY - this.centerY) < 0.001) {
          if (this.centerX > blob.centerX) {
            firstBlobXTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNormal,
              maxTransNormal
            );
            secondBlobXTransTemp = -1 * firstBlobXTransTemp;
          } else {
            secondBlobXTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNormal,
              maxTransNormal
            );
            firstBlobXTransTemp = -1 * secondBlobXTransTemp;
          }

          //firstBlobYTrans = randomInt(-1, 1);
          //secondBlobYTrans = -1 * firstBlobYTrans;

          if (Math.random() > 0.5) {
            firstBlobYTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNearCenter,
              maxTransNearCenter
            );
            secondBlobYTransTemp = -1 * firstBlobYTransTemp;
          } else {
            secondBlobYTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNearCenter,
              maxTransNearCenter
            );
            firstBlobYTransTemp = -1 * secondBlobYTransTemp;
          }
        } else if (
          Math.abs(
            (blob.centerY - this.centerY, 2) / (blob.centerX - this.centerX, 2)
          ) > 100
        ) {
          //firstBlobYTrans = randomInt(-1, 1);
          //secondBlobYTrans = -1 * firstBlobYTrans;

          if (this.centerY > blob.centerY) {
            firstBlobYTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNormal,
              maxTransNormal
            );
            secondBlobYTransTemp = -1 * firstBlobYTransTemp;
          } else {
            secondBlobYTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNormal,
              maxTransNormal
            );
            firstBlobYTransTemp = -1 * secondBlobYTransTemp;
          }
        } else {
          let blobToBlobAngle = Math.atan(
            (blob.centerY - this.centerY, 2) / (blob.centerX - this.centerX, 2)
          );

          if (this.centerX > blob.centerX) {
            firstBlobXTransTemp = clipVal(
              ((blobToBlobRadSum - centToCentRad) * Math.cos(blobToBlobAngle)) /
                2,
              -maxTransNormal,
              maxTransNormal
            );
            secondBlobXTransTemp = -1 * firstBlobXTransTemp;
          } else {
            secondBlobXTransTemp = clipVal(
              ((blobToBlobRadSum - centToCentRad) * Math.cos(blobToBlobAngle)) /
                2,
              -maxTransNormal,
              maxTransNormal
            );
            firstBlobXTransTemp = -1 * secondBlobXTransTemp;
          }

          if (this.centerY > blob.centerY) {
            firstBlobYTransTemp = clipVal(
              ((blobToBlobRadSum - centToCentRad) * Math.sin(blobToBlobAngle)) /
                2,
              -maxTransNormal,
              maxTransNormal
            );
            secondBlobYTransTemp = -1 * firstBlobYTransTemp;
          } else {
            secondBlobYTransTemp = clipVal(
              ((blobToBlobRadSum - centToCentRad) * Math.sin(blobToBlobAngle)) /
                2,
              -maxTransNormal,
              maxTransNormal
            );
            firstBlobYTransTemp = -1 * secondBlobYTransTemp;
          }

          //firstBlobXTrans = randomInt(-1, 1);
          //secondBlobXTrans = -1 * firstBlobXTrans;

          //firstBlobYTrans = randomInt(-1, 1);
          //secondBlobYTrans = -1 * firstBlobYTrans;
        }

        firstBlobXTrans += firstBlobXTransTemp;
        firstBlobYTrans += firstBlobYTransTemp;

        secondBlobXTrans = secondBlobXTransTemp;
        secondBlobYTrans = secondBlobYTransTemp;

        /*
        for (let partIndex = 0; partIndex < this.partNum; partIndex += 1) {
          this.particles[partIndex].x += firstBlobXTrans;
          this.particles[partIndex].y += firstBlobYTrans;
          this.particles[partIndex].clearForce();
          //this.particles[partIndex].scaleVelocity(1);
        }
        */

        for (let partIndex = 0; partIndex < blob.partNum; partIndex += 1) {
          blob.particles[partIndex].x += secondBlobXTrans;
          blob.particles[partIndex].y += secondBlobYTrans;
          //blob.particles[partIndex].clearForce();
          //blob.particles[partIndex].scaleVelocity(1);
        }
      }
    }

    for (let partIndex = 0; partIndex < this.partNum; partIndex += 1) {
      this.particles[partIndex].x += firstBlobXTrans;
      this.particles[partIndex].y += firstBlobYTrans;
      //this.particles[partIndex].clearForce();
      //this.particles[partIndex].scaleVelocity(1);
    }
  }

  checkCollisions2(blobsIn) {
    /*
    this.centerX =
      (this.particles[0].x +
        this.particles[floor(this.partNum / 4)].x +
        this.particles[floor(this.partNum / 2)].x +
        this.particles[floor((3 * this.partNum) / 4)].x) /
      4;

    this.centerY =
      (this.particles[0].y +
        this.particles[floor(this.partNum / 4)].y +
        this.particles[floor(this.partNum / 2)].y +
        this.particles[floor((3 * this.partNum) / 4)].y) /
      4;
    */

    const centerData = findCenterCoords(
      this.centerX,
      this.centerY,
      this.particles
    );

    this.centerX = centerData.newXCenter;
    this.centerY = centerData.newYCenter;

    /*
    if (checkForNanParticles(this, 1) === true) {
      resetParticlePositions(this, 300, 300);
    }
    */

    const maxTransNearCenter = 1.0;
    const maxTransNormal = 2.5;

    let centerCompX = this.centerX + this.pntRad + 20;
    let centerCompY = this.centerY;

    let intersectCounter = 0;
    let partIntersectArray = [];
    let partIntersectXTransArray = [];
    let partIntersectYTransArray = [];

    let partPolyArray = [];
    let partPolyXTransArray = [];
    let partPolyYTransArray = [];

    let partColidDisplaceFact = 1.0;
    let partColidDisplaceScale = 1.0;

    let particleToBlobCenterAngle = 0.0;
    let particleToBlobCenterDist = 0.0;
    let particleToThisCenterAngle = 0.0;

    let partIntTransXTemp = 0.0;
    let partIntTransYTemp = 0.0;

    let firstBlobXTrans = 0.0;
    let firstBlobYTrans = 0.0;

    let secondBlobXTrans = 0.0;
    let secondBlobYTrans = 0.0;

    let firstBlobXTransTemp = 0.0;
    let firstBlobYTransTemp = 0.0;
    let secondBlobXTransTemp = 0.0;
    let secondBlobYTransTemp = 0.0;

    let blobsInLen = blobsIn.length;

    let firstBlobXTransArray = [];
    let firstBlobYTransArray = [];

    for (
      let particleIndex = 0;
      particleIndex < this.partNum;
      particleIndex += 1
    ) {
      firstBlobXTransArray.push(0);
      firstBlobYTransArray.push(0);
    }

    let secondBlobXTransArray = [];
    let secondBlobYTransArray = [];

    for (let blob of blobsIn) {
      intersectCounter = 0;
      partIntersectArray = [];
      partIntersectXTransArray = [];
      partIntersectYTransArray = [];

      partPolyArray = [];
      partPolyXTransArray = [];
      partPolyYTransArray = [];

      //firstBlobXTrans = 0.0;
      //firstBlobYTrans = 0.0;
      secondBlobXTrans = 0.0;
      secondBlobYTrans = 0.0;

      firstBlobXTransTemp = 0.0;
      firstBlobYTransTemp = 0.0;
      secondBlobXTransTemp = 0.0;
      secondBlobYTransTemp = 0.0;

      //firstBlobXTransArray = [];
      //firstBlobYTransArray = [];

      secondBlobXTransArray = [];
      secondBlobYTransArray = [];

      for (let blobIndex = 0; blobIndex < blob.partNum; blobIndex += 1) {
        secondBlobXTransArray.push(0.0);
        secondBlobYTransArray.push(0.0);
      }

      let centToCentRad = Math.sqrt(
        Math.pow(blob.centerX - this.centerX, 2) +
          Math.pow(blob.centerY - this.centerY, 2)
      );

      let blobToBlobRadSum = this.pntRad + blob.pntRad;

      if (centToCentRad < blobToBlobRadSum) {
        if (Math.abs(blob.centerX - this.centerX) < 0.001) {
          if (Math.random() > 0.5) {
            firstBlobXTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNearCenter,
              maxTransNearCenter
            );
            secondBlobXTransTemp = -1 * firstBlobXTransTemp;
          } else {
            secondBlobXTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNearCenter,
              maxTransNearCenter
            );
            firstBlobXTransTemp = -1 * secondBlobXTransTemp;
          }

          if (Math.abs(blob.centerY - this.centerY) < 0.001) {
            if (Math.random() > 0.5) {
              firstBlobYTransTemp = clipVal(
                (blobToBlobRadSum - centToCentRad) / 2,
                -maxTransNearCenter,
                maxTransNearCenter
              );
              secondBlobYTransTemp = -1 * firstBlobYTransTemp;
            } else {
              secondBlobYTransTemp = clipVal(
                (blobToBlobRadSum - centToCentRad) / 2,
                -maxTransNearCenter,
                maxTransNearCenter
              );
              firstBlobYTransTemp = -1 * secondBlobYTransTemp;
            }
          } else {
            if (this.centerY > blob.centerY) {
              firstBlobYTransTemp = clipVal(
                (blobToBlobRadSum - centToCentRad) / 2,
                -maxTransNormal,
                maxTransNormal
              );
              secondBlobYTransTemp = -1 * firstBlobYTransTemp;
            } else {
              secondBlobYTransTemp = clipVal(
                (blobToBlobRadSum - centToCentRad) / 2,
                -maxTransNormal,
                maxTransNormal
              );
              firstBlobYTransTemp = -1 * secondBlobYTransTemp;
            }
          }

          secondBlobXTrans = secondBlobXTransTemp;
          secondBlobYTrans = secondBlobYTransTemp;

          for (let partIndex = 0; partIndex < blob.partNum; partIndex += 1) {
            blob.particles[partIndex].x += secondBlobXTrans;
            blob.particles[partIndex].y += secondBlobYTrans;
          }

          firstBlobXTrans += firstBlobXTransTemp;
          firstBlobYTrans += firstBlobYTransTemp;

          /*
          for (let partIndex = 0; partIndex < this.partNum; partIndex += 1) {
            this.particles[partIndex].x += firstBlobXTrans;
            this.particles[partIndex].y += firstBlobYTrans;
          }
          */
        } else if (Math.abs(blob.centerY - this.centerY) < 0.001) {
          if (this.centerX > blob.centerX) {
            firstBlobXTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNormal,
              maxTransNormal
            );
            secondBlobXTransTemp = -1 * firstBlobXTransTemp;
          } else {
            secondBlobXTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNormal,
              maxTransNormal
            );
            firstBlobXTransTemp = -1 * secondBlobXTransTemp;
          }

          if (Math.random() > 0.5) {
            firstBlobYTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNearCenter,
              maxTransNearCenter
            );
            secondBlobYTransTemp = -1 * firstBlobYTransTemp;
          } else {
            secondBlobYTransTemp = clipVal(
              (blobToBlobRadSum - centToCentRad) / 2,
              -maxTransNearCenter,
              maxTransNearCenter
            );
            firstBlobYTransTemp = -1 * secondBlobYTransTemp;
          }

          secondBlobXTrans = secondBlobXTransTemp;
          secondBlobYTrans = secondBlobYTransTemp;

          for (let partIndex = 0; partIndex < blob.partNum; partIndex += 1) {
            blob.particles[partIndex].x += secondBlobXTrans;
            blob.particles[partIndex].y += secondBlobYTrans;
          }

          firstBlobXTrans += firstBlobXTransTemp;
          firstBlobYTrans += firstBlobYTransTemp;

          /*
          for (let partIndex = 0; partIndex < this.partNum; partIndex += 1) {
            this.particles[partIndex].x += firstBlobXTrans;
            this.particles[partIndex].y += firstBlobYTrans;
          }
          */
        } else if (
          Math.abs(
            (blob.centerY - this.centerY) / (blob.centerX - this.centerX)
          ) > 1000
        ) {
          partColidDisplaceScale = 1.0;

          for (
            let checkPartIndex = 0;
            checkPartIndex < blob.partNum;
            checkPartIndex += 1
          ) {
            intersectCounter = 0;

            /*
            centerCompX =
                blob.particles[checkPartIndex].x +
                2 * blob.pntRad +
                2 * this.pntRad +
                50.0;
            */

            if (blob.centerX < this.centerX) {
              centerCompX =
                blob.particles[checkPartIndex].x +
                2 * blob.pntRad +
                2 * this.pntRad +
                50.0;
            } else {
              centerCompX =
                blob.particles[checkPartIndex].x -
                2 * blob.pntRad -
                2 * this.pntRad -
                50.0;
            }

            centerCompY = blob.particles[checkPartIndex].y;

            for (
              let againstPartIndex = 0;
              againstPartIndex < this.partNum - 1;
              againstPartIndex += 1
            ) {
              if (
                checkLinesIntersecting(
                  //checkHoriToLineIntersection(
                  blob.particles[checkPartIndex].x,
                  blob.particles[checkPartIndex].y,
                  centerCompX,
                  centerCompY,
                  this.particles[againstPartIndex].x,
                  this.particles[againstPartIndex].y,
                  this.particles[againstPartIndex + 1].x,
                  this.particles[againstPartIndex + 1].y
                )
              ) {
                intersectCounter += 1;
              }
            }
            if (
              checkLinesIntersecting(
                //checkHoriToLineIntersection(
                blob.particles[checkPartIndex].x,
                blob.particles[checkPartIndex].y,
                centerCompX,
                centerCompY,
                this.particles[this.partNum - 1].x,
                this.particles[this.partNum - 1].y,
                this.particles[0].x,
                this.particles[0].y
              )
            ) {
              intersectCounter += 1;
            }

            if (intersectCounter % 2 == 1) {
              partColidDisplaceScale *= partColidDisplaceFact;

              const blobParticleIndeces = findClosestLineToParticle(
                blob.particles[checkPartIndex],
                this.particles
              );

              let blobPartToCenterDist = Math.sqrt(
                Math.pow(blob.particles[checkPartIndex].x - blob.centerX, 2) +
                  Math.pow((blob.particles[checkPartIndex].y - blob.centerY, 2))
              );

              let normalGrad = 0;

              let lineClosestXDif =
                this.particles[blobParticleIndeces[0]].x -
                this.particles[blobParticleIndeces[1]].x;

              let lineClosestYDif =
                this.particles[blobParticleIndeces[0]].y -
                this.particles[blobParticleIndeces[1]].y;

              let lineClosestGrad = 0;
              let lineClosestIntercept = 0;

              let lineClosestGradUndef = false;
              let lineClosestInterceptUndef = false;

              let closestPntOnLineToPartX = 0;
              let closestPntOnLineToPartY = 0;

              let closestPntOnLineToPartDist = 0;

              let closestPntOnLineToPartXUndef = false;
              let closestPntOnLineToPartYUndef = false;

              let closestPntOnLineToPartDistUndef = false;

              if (abs(lineClosestXDif) > 0.001) {
                lineClosestGrad = lineClosestYDif / lineClosestXDif;

                if (abs(lineClosestGrad) > 1000) {
                  lineClosestInterceptUndef = true;

                  closestPntOnLineToPartDist = abs(
                    this.particles[blobParticleIndeces[0]].x -
                      blob.particles[checkPartIndex].x
                  );

                  closestPntOnLineToPartX = blob.particles[checkPartIndex].x;
                  closestPntOnLineToPartY =
                    this.particles[blobParticleIndeces[0]].y;
                } else if (abs(lineClosestGrad) < 0.001) {
                  lineClosestInterceptUndef = true;

                  closestPntOnLineToPartDist = abs(
                    this.particles[blobParticleIndeces[0]].y -
                      blob.particles[checkPartIndex].y
                  );

                  closestPntOnLineToPartX =
                    this.particles[blobParticleIndeces[0]].x;
                  closestPntOnLineToPartY = blob.particles[checkPartIndex].y;
                } else {
                  lineClosestIntercept =
                    this.particles[blobParticleIndeces[0]].y -
                    lineClosestGrad * this.particles[blobParticleIndeces[0]].x;

                  closestPntOnLineToPartX =
                    (lineClosestGrad * blob.particles[checkPartIndex].y +
                      blob.particles[checkPartIndex].x -
                      lineClosestGrad * lineClosestIntercept) /
                    (1 + lineClosestGrad * lineClosestGrad);

                  closestPntOnLineToPartY =
                    lineClosestGrad * closestPntOnLineToPartX +
                    lineClosestIntercept;

                  closestPntOnLineToPartDist = Math.sqrt(
                    Math.pow(
                      blob.particles[checkPartIndex].x -
                        closestPntOnLineToPartX,
                      2
                    ) +
                      Math.pow(
                        blob.particles[checkPartIndex].y -
                          closestPntOnLineToPartY,
                        2
                      )
                  );
                }
              } else {
                lineClosestGradUndef = true;
              }

              if (abs(lineClosestXDif) < 0.001) {
                //Normal is along y axis

                if (
                  this.particles[blobParticleIndeces[0]].y >
                  blob.particles[checkPartIndex].y
                ) {
                  partIntTransXTemp = 0;
                  partIntTransYTemp = closestPntOnLineToPartDist / 2;
                } else {
                  partIntTransXTemp = 0;
                  partIntTransYTemp = -(closestPntOnLineToPartDist / 2);
                }
              } else if (abs(lineClosestGrad) > 100) {
                //Normal is along x axis

                if (
                  this.particles[blobParticleIndeces[0]].x >
                  blob.particles[checkPartIndex].x
                ) {
                  partIntTransXTemp = closestPntOnLineToPartDist / 2;
                  partIntTransYTemp = 0;
                } else {
                  partIntTransXTemp = -(closestPntOnLineToPartDist / 2);
                  partIntTransYTemp = 0;
                }
              } else if (abs(lineClosestGrad) < 0.001) {
                //Normal is along x axis

                if (
                  this.particles[blobParticleIndeces[0]].x >
                  blob.particles[checkPartIndex].x
                ) {
                  partIntTransXTemp = closestPntOnLineToPartDist / 2;
                  partIntTransYTemp = 0;
                } else {
                  partIntTransXTemp = -(closestPntOnLineToPartDist / 2);
                  partIntTransYTemp = 0;
                }
              } else {
                normalGrad = -1.0 / lineClosestGrad;

                if (
                  blob.particles[checkPartIndex].y < closestPntOnLineToPartY
                ) {
                  if (normalGrad < 0) {
                    partIntTransXTemp =
                      (closestPntOnLineToPartDist / 2) *
                      cos(Math.atan(normalGrad));
                    partIntTransYTemp =
                      -(closestPntOnLineToPartDist / 2) *
                      sin(Math.atan(normalGrad));
                  } else {
                    partIntTransXTemp =
                      (closestPntOnLineToPartDist / 2) *
                      cos(Math.atan(normalGrad));
                    partIntTransYTemp =
                      (closestPntOnLineToPartDist / 2) *
                      sin(Math.atan(normalGrad));
                  }
                } else {
                  if (normalGrad < 0) {
                    partIntTransXTemp =
                      -(closestPntOnLineToPartDist / 2) *
                      cos(Math.atan(normalGrad));
                    partIntTransYTemp =
                      (closestPntOnLineToPartDist / 2) *
                      sin(Math.atan(normalGrad));
                  } else {
                    partIntTransXTemp =
                      -(closestPntOnLineToPartDist / 2) *
                      cos(Math.atan(normalGrad));
                    partIntTransYTemp =
                      -(closestPntOnLineToPartDist / 2) *
                      sin(Math.atan(normalGrad));
                  }
                }

                partIntTransXTemp *= partColidDisplaceScale;
                partIntTransYTemp *= partColidDisplaceScale;
              }

              partPolyArray.push(blobParticleIndeces[0]);
              partPolyXTransArray.push(-partIntTransXTemp);
              partPolyYTransArray.push(-partIntTransYTemp);

              partPolyArray.push(blobParticleIndeces[1]);
              partPolyXTransArray.push(-partIntTransXTemp);
              partPolyYTransArray.push(-partIntTransYTemp);

              partIntersectArray.push(checkPartIndex);
              partIntersectXTransArray.push(partIntTransXTemp);
              partIntersectYTransArray.push(partIntTransYTemp);
            }
          }

          for (
            let partIndex = 0;
            partIndex < partIntersectArray.length;
            partIndex += 1
          ) {
            secondBlobXTransArray[partIntersectArray[partIndex]] +=
              partIntersectXTransArray[partIntersectArray[partIndex]];
            secondBlobYTransArray[partIntersectArray[partIndex]] +=
              partIntersectYTransArray[partIntersectArray[partIndex]];
          }

          for (let partIndex = 0; partIndex < blob.partNum; partIndex += 1) {
            //blob.particles[partIndex].clearForce();

            //blob.particles[partIndex].getPreviousPosition();

            blob.particles[partIndex].x += clipVal(
              secondBlobXTransArray[partIndex],
              -1.0,
              1.0
            );

            blob.particles[partIndex].y += clipVal(
              secondBlobYTransArray[partIndex],
              -1.0,
              1.0
            );
          }

          for (
            let partIndex = 0;
            partIndex < partPolyArray.length;
            partIndex += 1
          ) {
            firstBlobXTransArray[partPolyArray[partIndex]] +=
              partPolyXTransArray[partPolyArray[partIndex]];
            firstBlobYTransArray[partPolyArray[partIndex]] +=
              partPolyYTransArray[partPolyArray[partIndex]];
          }

          /*
          for (let partIndex = 0; partIndex < this.partNum; partIndex += 1) {
            this.particles[partIndex].x += clipVal(
              firstBlobXTransArray[partIndex],
              -1.0,
              1.0
            );

            this.particles[partIndex].y += clipVal(
              firstBlobYTransArray[partIndex],
              -1.0,
              1.0
            );
          }
          */
        } else {
          let blobToBlobAngle = Math.atan(
            (blob.centerY - this.centerY, 2) / (blob.centerX - this.centerX, 2)
          );

          partColidDisplaceScale = 1.0;

          for (
            let checkPartIndex = 0;
            checkPartIndex < blob.partNum;
            checkPartIndex += 1
          ) {
            intersectCounter = 0;

            /*
            centerCompX =
                blob.particles[checkPartIndex].x +
                2 * blob.pntRad +
                2 * this.pntRad +
                50.0;
            */

            if (blob.centerX < this.centerX) {
              centerCompX =
                blob.particles[checkPartIndex].x +
                2 * blob.pntRad +
                2 * this.pntRad +
                50.0;
            } else {
              centerCompX =
                blob.particles[checkPartIndex].x -
                2 * blob.pntRad -
                2 * this.pntRad -
                50.0;
            }

            centerCompY = blob.particles[checkPartIndex].y;

            for (
              let againstPartIndex = 0;
              againstPartIndex < this.partNum - 1;
              againstPartIndex += 1
            ) {
              if (
                checkLinesIntersecting(
                  //checkHoriToLineIntersection(
                  blob.particles[checkPartIndex].x,
                  blob.particles[checkPartIndex].y,
                  centerCompX,
                  centerCompY,
                  this.particles[againstPartIndex].x,
                  this.particles[againstPartIndex].y,
                  this.particles[againstPartIndex + 1].x,
                  this.particles[againstPartIndex + 1].y
                )
              ) {
                intersectCounter += 1;
              }
            }
            if (
              checkLinesIntersecting(
                //checkHoriToLineIntersection(
                blob.particles[checkPartIndex].x,
                blob.particles[checkPartIndex].y,
                centerCompX,
                centerCompY,
                this.particles[this.partNum - 1].x,
                this.particles[this.partNum - 1].y,
                this.particles[0].x,
                this.particles[0].y
              )
            ) {
              intersectCounter += 1;
            }

            if (intersectCounter % 2 == 1) {
              partColidDisplaceScale *= partColidDisplaceFact;

              const blobParticleIndeces = findClosestLineToParticle(
                blob.particles[checkPartIndex],
                this.particles
              );

              let normalGrad = 0;

              let lineClosestXDif =
                this.particles[blobParticleIndeces[0]].x -
                this.particles[blobParticleIndeces[1]].x;

              let lineClosestYDif =
                this.particles[blobParticleIndeces[0]].y -
                this.particles[blobParticleIndeces[1]].y;

              let lineClosestGrad = 0;
              let lineClosestIntercept = 0;

              let lineClosestGradUndef = false;
              let lineClosestInterceptUndef = false;

              let closestPntOnLineToPartX = 0;
              let closestPntOnLineToPartY = 0;

              let closestPntOnLineToPartDist = 0;

              let closestPntOnLineToPartXUndef = false;
              let closestPntOnLineToPartYUndef = false;

              let closestPntOnLineToPartDistUndef = false;

              if (abs(lineClosestXDif) > 0.001) {
                lineClosestGrad = lineClosestYDif / lineClosestXDif;

                if (abs(lineClosestGrad) > 100) {
                  lineClosestInterceptUndef = true;
                } else {
                  lineClosestIntercept =
                    this.particles[blobParticleIndeces[0]].y -
                    lineClosestGrad * this.particles[blobParticleIndeces[0]].x;

                  closestPntOnLineToPartX =
                    (lineClosestGrad * blob.particles[checkPartIndex].y +
                      blob.particles[checkPartIndex].x -
                      lineClosestGrad * lineClosestIntercept) /
                    (1 + lineClosestGrad * lineClosestGrad);

                  closestPntOnLineToPartY =
                    lineClosestGrad * closestPntOnLineToPartX +
                    lineClosestIntercept;

                  closestPntOnLineToPartDist = Math.sqrt(
                    Math.pow(
                      blob.particles[checkPartIndex].x -
                        closestPntOnLineToPartX,
                      2
                    ) +
                      Math.pow(
                        blob.particles[checkPartIndex].y -
                          closestPntOnLineToPartY,
                        2
                      )
                  );
                }
              } else {
                lineClosestGradUndef = true;
              }

              if (abs(lineClosestXDif) < 0.001) {
                //Normal is along y axis

                if (
                  this.particles[blobParticleIndeces[0]].y >
                  blob.particles[checkPartIndex].y
                ) {
                  partIntTransXTemp = 0;
                  partIntTransYTemp = closestPntOnLineToPartDist / 2;
                } else {
                  partIntTransXTemp = 0;
                  partIntTransYTemp = -(closestPntOnLineToPartDist / 2);
                }
              } else if (abs(lineClosestGrad) > 100) {
                //Normal is along x axis

                if (
                  this.particles[blobParticleIndeces[0]].x >
                  blob.particles[checkPartIndex].x
                ) {
                  partIntTransXTemp = closestPntOnLineToPartDist / 2;
                  partIntTransYTemp = 0;
                } else {
                  partIntTransXTemp = -(closestPntOnLineToPartDist / 2);
                  partIntTransYTemp = 0;
                }
              } else if (abs(lineClosestGrad) < 0.001) {
                //Normal is along x axis

                if (
                  this.particles[blobParticleIndeces[0]].x >
                  blob.particles[checkPartIndex].x
                ) {
                  partIntTransXTemp = closestPntOnLineToPartDist / 2;
                  partIntTransYTemp = 0;
                } else {
                  partIntTransXTemp = -(closestPntOnLineToPartDist / 2);
                  partIntTransYTemp = 0;
                }
              } else {
                normalGrad = -1.0 / lineClosestGrad;

                if (
                  blob.particles[checkPartIndex].y < closestPntOnLineToPartY
                ) {
                  if (normalGrad < 0) {
                    partIntTransXTemp =
                      (closestPntOnLineToPartDist / 2) *
                      cos(Math.atan(normalGrad));
                    partIntTransYTemp =
                      -(closestPntOnLineToPartDist / 2) *
                      sin(Math.atan(normalGrad));
                  } else {
                    partIntTransXTemp =
                      (closestPntOnLineToPartDist / 2) *
                      cos(Math.atan(normalGrad));
                    partIntTransYTemp =
                      (closestPntOnLineToPartDist / 2) *
                      sin(Math.atan(normalGrad));
                  }
                } else {
                  if (normalGrad < 0) {
                    partIntTransXTemp =
                      -(closestPntOnLineToPartDist / 2) *
                      cos(Math.atan(normalGrad));
                    partIntTransYTemp =
                      (closestPntOnLineToPartDist / 2) *
                      sin(Math.atan(normalGrad));
                  } else {
                    partIntTransXTemp =
                      -(closestPntOnLineToPartDist / 2) *
                      cos(Math.atan(normalGrad));
                    partIntTransYTemp =
                      -(closestPntOnLineToPartDist / 2) *
                      sin(Math.atan(normalGrad));
                  }
                }

                partIntTransXTemp *= partColidDisplaceScale;
                partIntTransYTemp *= partColidDisplaceScale;

                /*
                partIntTransXTemp = cos(Math.atan(normalGrad));
                partIntTransYTemp = sin(Math.atan(normalGrad));
                */
              }

              partPolyArray.push(blobParticleIndeces[0]);
              partPolyXTransArray.push(-partIntTransXTemp);
              partPolyYTransArray.push(-partIntTransYTemp);

              partPolyArray.push(blobParticleIndeces[1]);
              partPolyXTransArray.push(-partIntTransXTemp);
              partPolyYTransArray.push(-partIntTransYTemp);

              partIntersectArray.push(checkPartIndex);
              partIntersectXTransArray.push(partIntTransXTemp);
              partIntersectYTransArray.push(partIntTransYTemp);
            }
          }

          for (
            let partIndex = 0;
            partIndex < partIntersectArray.length;
            partIndex += 1
          ) {
            secondBlobXTransArray[partIntersectArray[partIndex]] +=
              partIntersectXTransArray[partIntersectArray[partIndex]];
            secondBlobYTransArray[partIntersectArray[partIndex]] +=
              partIntersectYTransArray[partIntersectArray[partIndex]];
          }

          for (let partIndex = 0; partIndex < blob.partNum; partIndex += 1) {
            //blob.particles[partIndex].clearForce();

            blob.particles[partIndex].x += clipVal(
              secondBlobXTransArray[partIndex],
              -1.0,
              1.0
            );

            blob.particles[partIndex].y += clipVal(
              secondBlobYTransArray[partIndex],
              -1.0,
              1.0
            );
          }

          for (
            let partIndex = 0;
            partIndex < partPolyArray.length;
            partIndex += 1
          ) {
            firstBlobXTransArray[partPolyArray[partIndex]] +=
              partPolyXTransArray[partPolyArray[partIndex]];
            firstBlobYTransArray[partPolyArray[partIndex]] +=
              partPolyYTransArray[partPolyArray[partIndex]];
          }

          /*
          for (let partIndex = 0; partIndex < this.partNum; partIndex += 1) {
            this.particles[partIndex].x += clipVal(
              firstBlobXTransArray[partIndex],
              -1.0,
              1.0
            );

            this.particles[partIndex].y += clipVal(
              firstBlobYTransArray[partIndex],
              -1.0,
              1.0
            );
          }
          */
        }

        /*
        firstBlobXTrans += firstBlobXTransTemp;
        firstBlobYTrans += firstBlobYTransTemp;

        for (let partIndex = 0; partIndex < this.partNum; partIndex += 1) {
          this.particles[partIndex].x += firstBlobXTrans;
          this.particles[partIndex].y += firstBlobYTrans;
        }
        */

        /*
        for (let partIndex = 0; partIndex < this.partNum; partIndex += 1) {
          //this.particles[partIndex].x += firstBlobXTransArray[partIndex];
          //this.particles[partIndex].y += firstBlobYTransArray[partIndex];

          //this.particles[partIndex].x += firstBlobXTrans;
          //this.particles[partIndex].y += firstBlobYTrans;

          this.particles[partIndex].x += clipVal(
            firstBlobXTransArray[partIndex] + firstBlobXTrans,
            -2.5,
            2.5
          );

          this.particles[partIndex].y += clipVal(
            firstBlobYTransArray[partIndex] + firstBlobYTrans,
            -2.5,
            2.5
          );
        }
        */
      }
    }

    for (let partIndex = 0; partIndex < this.partNum; partIndex += 1) {
      //this.particles[partIndex].clearForce();

      this.particles[partIndex].x += clipVal(
        firstBlobXTransArray[partIndex] + firstBlobXTrans,
        -2.5,
        2.5
      );

      this.particles[partIndex].y += clipVal(
        firstBlobYTransArray[partIndex] + firstBlobYTrans,
        -2.5,
        2.5
      );
    }

    /*
    for (let partIndex = 0; partIndex < this.partNum; partIndex += 1) {
      this.particles[partIndex].x += firstBlobXTrans;
      this.particles[partIndex].y += firstBlobYTrans;
    }
    */
  }

  follow(mouseXIn, mouseYIn) {
    resetParticlePositions(this, mouseXIn, mouseYIn);
  }

  show() {
    fill(this.redFillIn, this.greenFillIn, this.blueFillIn);
    stroke(0);
    beginShape();
    for (let particle of this.particles) {
      vertex(particle.x, particle.y);
    }
    endShape(CLOSE);
  }
}

let physics;
let gravity;
let bounds;

const partPosXMin = 80;
const partPosXMax = 160;
const partPosYMin = 240;
const partPosYMax = 360;

const springLenMin = 100;
const springLenMax = 100;
const springFactMin = 0.1;
const springFactMax = 0.1;

const numBlobs = 10;

const blobVertexMin = 25;
const blobVertexMax = 50;

const blobRadMin = 30;
const blobRadMax = 50;

const blobStartXMin = 0;
const blobStartXMax = 1000;
const blobStartYMin = 0;
const blobStartYMax = 600;

const blobInnerSpringFactMin = 0.1;
const blobInnerSpringFactMax = 0.9;

const blobOuterSpringFactMin = 0.1;
const blobOuterSpringFactMax = 0.9;

const blobColourMin = 0;
const blobColourMax = 255;

let testPressureCounter = 0;

let blobs = [];

function setup() {
  createCanvas(1000, 600);
  //createCanvas(500, 600);

  physics = new VerletPhysics2D();
  gravity = new GravityBehavior(new Vec2D(0, 1.0));
  //gravity = new GravityBehavior(new Vec2D(0, 0.025));

  physics.addBehavior(gravity);

  bounds = new Rect(50, 50, width - 50, height - 50);
  physics.setWorldBounds(bounds);

  //blobs.push(new Blob(6, 100, 600, 200, 0.1));
  //blobs.push(new Blob(5, 100, 500, 200, 0.1));
  //blobs.push(new Blob(100, 100, 500, 200, 0.9, 0.9, 0, 200, 100));

  /*
  if (checkLinesIntersecting(0, 0, 1, 1, 0, 1, 1, 0)) {
    console.log(`The first line segments do intercept.`);
  } else {
    console.log(`The first line segments do not intercept.`);
  }

  if (checkLinesIntersecting(-3, -1, 2, 1, 3, -4, -3, 2)) {
    console.log(`The second line segments do intercept.`);
  } else {
    console.log(`The second line segments do not intercept.`);
  }

  if (checkLinesIntersecting(1, 2, 1, 4, 2, 2, 2, 4)) {
    console.log(`The third line segments do intercept.`);
  } else {
    console.log(`The third line segments do not intercept.`);
  }

  if (checkLinesIntersecting(-1, 7, 2, 7, 1, 8, 4, 8)) {
    console.log(`The fourth line segments do intercept.`);
  } else {
    console.log(`The fourth line segments do not intercept.`);
  }
  */

  /*
  const testArray1 = [1, 5, 4, 3];

  const sortedArray1Indexes = sortIndexesFunc(testArray1);

  const testArray2 = [7.3, 2.5, -4.7, -4.7];

  const sortedArray2Indexes = sortIndexesFunc(testArray2);

  console.log(`The sorted array1 indexes are: `);
  console.log(sortedArray1Indexes);
  console.log();

  console.log(`The sorted array2 indexes are: `);
  console.log(sortedArray2Indexes);
  console.log();
  */

  for (let i = 0; i < numBlobs; i += 1) {
    blobs.push(
      new Blob(
        randomInt(blobVertexMin, blobVertexMax),
        randomInt(blobRadMin, blobRadMax),
        randomInt(blobStartXMin, blobStartXMax),
        randomInt(blobStartYMin, blobStartYMax),
        randomFloat(blobInnerSpringFactMin, blobInnerSpringFactMax),
        randomFloat(blobOuterSpringFactMin, blobOuterSpringFactMax),
        randomInt(blobColourMin, blobColourMax),
        randomInt(blobColourMin, blobColourMax),
        randomInt(blobColourMin, blobColourMax)
      )
    );
  }
}

function draw() {
  background(255);

  /*
  circle(20, 40, 10);
  fill("red");
  square(100, 100, 40);
  fill("green");
  rect(120, 50, 40, 70);
  */

  if (mouseIsPressed) {
    for (let blobIndex = 0; blobIndex < numBlobs; blobIndex += 1) {
      /*
      blob.particles[0].lock();
      blob.particles[0].x = mouseX;
      blob.particles[0].y = mouseY;
      blob.particles[0].unlock();
      */

      blobs[blobIndex].follow(mouseX, mouseY);
    }
  } else {
    for (let blobIndex = 0; blobIndex < numBlobs; blobIndex += 1) {
      blobs[blobIndex].checkCollisions(blobs);
      //blobs[blobIndex].checkCollisions2(blobs);

      //blobs[blobIndex].applyPressure(blobIndex, testPressureCounter);
    }
  }

  for (let blobIndex = 0; blobIndex < numBlobs; blobIndex += 1) {
    blobs[blobIndex].show();
  }

  if (testPressureCounter < 1000000) {
    testPressureCounter += 1;
  }

  physics.update();
}
