// script.js

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const avatars = [];
const tooltipTexts = [
    "Oops! I'm rolling!",
    "Catch me if you can!",
    "I'm just a ball of fun!",
    "Bouncing around like a pro!",
    "Don't poke the ball!",
    "I'm on a roll!",
    "Watch out! I'm coming through!",
    "Feeling a bit round today!",
    "Just trying to keep my balance!",
    "I'm not just any ball, I'm a super ball!",
    "Rolling with the punches!",
    "I'm here for a good time!",
    "Bouncing is my cardio!",
    "I'm full of hot air!",
    "Just keep rolling!",
    "I'm a ball of energy!",
    "Feeling a bit bouncy!",
    "I'm not lost, just rolling around!",
    "I'm here to make you smile!"
];

const colors = [
    'rgba(255, 0, 0, 0.7)',
    'rgba(0, 255, 0, 0.7)',
    'rgba(0, 0, 255, 0.7)',
    'rgba(255, 255, 0, 0.7)',
    'rgba(255, 0, 255, 0.7)',
    'rgba(0, 255, 255, 0.7)',
    'rgba(255, 165, 0, 0.7)',
    'rgba(128, 0, 128, 0.7)',
    'rgba(0, 128, 0, 0.7)',
    'rgba(0, 0, 128, 0.7)'
];

class Avatar {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.velocity = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 };
        this.tooltip = this.getRandomTooltip();
    }

    getRandomTooltip() {
        return tooltipTexts[Math.floor(Math.random() * tooltipTexts.length)];
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.velocity.x = -this.velocity.x;
        }
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
            this.velocity.y = -this.velocity.y;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    displayTooltip(mouseX, mouseY) {
        if (Math.hypot(mouseX - this.x, mouseY - this.y) < this.radius) {
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText(this.tooltip, this.x - this.radius, this.y - this.radius - 10);
        }
    }
}

function init() {
    for (let i = 0; i < 19; i++) {
        const radius = 20;
        const x = Math.random() * (canvas.width - radius * 2) + radius;
        const y = Math.random() * (canvas.height - radius * 2) + radius;
        avatars.push(new Avatar(x, y, radius));
    }
}

function animate(mouseX, mouseY) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    avatars.forEach(avatar => {
        avatar.update();
        avatar.draw();
        avatar.displayTooltip(mouseX, mouseY);
    });
    requestAnimationFrame(() => animate(mouseX, mouseY));
}

let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

init();
animate(mouseX, mouseY);