// 캔버스 요소를 선택하고 2D 렌더링 컨텍스트를 가져옵니다. 이를 통해 캔버스에 그림을 그릴 수 있습니다.
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// 디바이스 픽셀 비율을 설정합니다.
// 디바이스 픽셀 비율은 물리적 픽셀과 CSS 픽셀 간의 비율입니다. 이를 통해 고해상도 디스플레이에서 그림이 더 선명하게 보이도록 할 수 있습니다.
// 맥 2, 윈도우 1 기본적으로
const dpr = window.devicePixelRatio;

// 캔버스의 너비와 높이를 저장하기 위한 변수를 선언합니다. 이후 창 크기가 변경될 때마다 캔버스 크기를 업데이트 할 것입니다.
let canvasWidth;
let canvasHeight;

// 주어진 범위 내에서 무작위 수를 반환하는 함수를 정의합니다.
// 이 함수는 두 개의 숫자 (min, max) 사이에서 무작위로 선택된 숫자를 반환합니다. 원의 위치, 반지름 및 속도에 무작위 값을 할당하는 데 사용됩니다.
const randomNumBetween = (min, max) => {
  return Math.random() * (max - min + 1) + min;
};

// 애니메이션을 위한 변수들을 초기화합니다. fps
// particles 변수는 생성된 원들을 저장하는 배열입니다. interval, now, delta, then 변수는 애니메이션의 프레임 레이트를 제어하기 위해 사용됩니다.
let particles;

let interval = 1000 / 60;
let now, delta;
let then = Date.now();

// SVG 필터를 적용하기 위해 필요한 요소들을 선택합니다.
// feGaussianBlur와 feColorMatrix 요소를 선택하여 SVG 필터를 적용할 수 있습니다. 이를 통해 gooey 효과를 구현할 수 있습니다.
const feGaussianBlur = document.querySelector('feGaussianBlur');
const feColorMatrix = document.querySelector('feColorMatrix');

// 애니메이션에 적용할 컨트롤을 설정하고 dat.GUI 라이브러리를 사용하여 인터페이스를 만듭니다.
const controls = new (function () {
  this.blurValue = 40;
  this.alphaChannel = 100;
  this.alphaOffset = -23;
  this.acc = 1.03;
})();
let gui = new dat.GUI();

const f1 = gui.addFolder('Gooey Effect');
f1.open();
f1.add(controls, 'blurValue', 0, 100).onChange((v) => {
  feGaussianBlur.setAttribute('stdDeviation', v);
});
f1.add(controls, 'alphaChannel', 1, 200).onChange((v) => {
  feColorMatrix.setAttribute(
    'values',
    `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${v} ${controls.alphaOffset}`
  );
});
f1.add(controls, 'alphaOffset', -40, 40).onChange((v) => {
  feColorMatrix.setAttribute(
    'values',
    `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${controls.alphaChannel} ${v}`
  );
});
const f2 = gui.addFolder('Particle Property');
f2.open();
f2.add(controls, 'acc', 1, 1.5, 0.01).onChange((v) => {
  particles.forEach((particle) => (particle.acc = v));
});

// 원을 나타내는 Particle 클래스를 정의합니다.
// Particle 클래스는 각 원을 나타내며 x, y, radius, vy, acc 속성을 가집니다.
//update() 메서드는 원의 속도를 갱신하고
//draw() 메서드는 원을 그립니다.
class Particle {
  constructor(x, y, radius, vy) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vy = vy;
    this.acc = 1.03;
  }
  update() {
    this.vy *= this.acc;
    this.y += this.vy;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, (Math.PI / 180) * 360);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.closePath();
  }
}

// init() 함수는 애니메이션을 초기화합니다. 캔버스 크기를 설정하고, 원들을 생성하고, particles 배열에 저장합니다.
function init() {
  canvasWidth = innerWidth;
  canvasHeight = innerHeight;

  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  ctx.scale(dpr, dpr);

  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';

  particles = [];
  const TOTAL = canvasWidth / 20;

  for (let i = 0; i < TOTAL; i++) {
    const x = randomNumBetween(0, canvasWidth);
    const y = randomNumBetween(0, canvasHeight);
    const radius = randomNumBetween(50, 100);
    const vy = randomNumBetween(1, 5);
    const particle = new Particle(x, y, radius, vy);
    particles.push(particle);
  }
}

// animate() 함수는 원들을 움직이고 화면에 그립니다. 프레임 레이트를 조절하고 원이 화면 밖으로 나갔을 때 새 위치로 재배치합니다.
function animate() {
  window.requestAnimationFrame(animate);
  now = Date.now();
  delta = now - then;

  if (delta < interval) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  particles.forEach((particle) => {
    particle.update();
    particle.draw();

    if (particle.y - particle.radius > canvasHeight) {
      particle.y = -particle.radius;
      particle.x = randomNumBetween(0, canvasWidth);
      particle.radius = randomNumBetween(50, 100);
      particle.vy = randomNumBetween(1, 5);
    }
  });

  then = now - (delta % interval);
}

// 페이지가 로드되면 애니메이션을 초기화하고 시작합니다.
window.addEventListener('load', () => {
  init();
  animate();
});

// 창 크기가 변경되면 애니메이션을 다시 초기화합니다.
window.addEventListener('resize', () => {
  init();
});
