import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Background bubbles generator
const bgContainer = document.querySelector('.background-animation');
for (let i = 0; i < 20; i++) {
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    
    const size = Math.random() * 60 + 20; // 20px to 80px
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    
    bubble.style.left = `${Math.random() * 100}vw`;
    bubble.style.top = `${Math.random() * 100}vh`;
    
    bubble.style.animationDuration = `${Math.random() * 5 + 5}s`;
    bubble.style.animationDelay = `${Math.random() * 5}s`;
    
    bgContainer.appendChild(bubble);
}

// Confetti effect using canvas
const canvas = document.getElementById('confetti');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
let animationId;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height; // start slightly offscreen
        this.size = Math.random() * 10 + 5;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 + 2;
        // Pink, white and gold colors
        const colors = ['#ff758c', '#ff7eb3', '#ffffff', '#ffd700', '#ffb6c1'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        if (this.y > canvas.height) {
            this.y = -10;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

function initConfetti() {
    particles = [];
    for (let i = 0; i < 200; i++) {
        particles.push(new Particle());
    }
}

function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    animationId = requestAnimationFrame(animateConfetti);
}

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Button click event
const btn = document.getElementById('celebrateBtn');
btn.addEventListener('click', () => {
    // If already animating, restart
    cancelAnimationFrame(animationId);
    initConfetti();
    animateConfetti();
    
    // Add a little pop effect to the button
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => {
        btn.style.transform = '';
    }, 100);
});

// Profile click event - Heart Burst and Secret Message
const profileContainer = document.querySelector('.profile-container');
if (profileContainer) {
    profileContainer.addEventListener('click', (e) => {
        // Show a secret message
        alert('🎉 창진 엉아!! 동기들이 격하게 아끼고 사랑합니다! 오늘 세상에서 제일 행복한 하루 보내십쇼!! 🎉');
        
        // Heart burst effect
        for (let i = 0; i < 30; i++) {
            createHeart(e.clientX, e.clientY);
        }
    });
}

function createHeart(x, y) {
    const heart = document.createElement('div');
    heart.innerHTML = '💖';
    heart.style.position = 'fixed';
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.fontSize = `${Math.random() * 20 + 15}px`;
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '1000';
    heart.style.transition = 'all 1s cubic-bezier(0.1, 0.8, 0.3, 1)';
    heart.style.transform = 'translate(-50%, -50%)';
    
    document.body.appendChild(heart);
    
    // Animate heart
    setTimeout(() => {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 150 + 50;
        heart.style.transform = `translate(calc(-50% + ${Math.cos(angle) * radius}px), calc(-50% + ${Math.sin(angle) * radius}px)) scale(0)`;
        heart.style.opacity = '0';
    }, 10);
    
    // Clean up
    setTimeout(() => {
        heart.remove();
    }, 1000);
}

// ==========================================
// 🚀 Firebase 롤링페이퍼 (실시간 방명록) 설정
// ==========================================
// TODO: 파이어베이스 콘솔에서 발급받은 내 설정값으로 교체해주세요!
const firebaseConfig = {
  apiKey: "AIzaSyAOYo9QWBg_AfgJo11RMryeiJD4ErLKhQQ",
  authDomain: "changjin-bday.firebaseapp.com",
  databaseURL: "https://changjin-bday-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "changjin-bday",
  storageBucket: "changjin-bday.firebasestorage.app",
  messagingSenderId: "64108354290",
  appId: "1:64108354290:web:2bec5e9f178a7594a34e6b"
};

// 파이어베이스 초기화 (설정값이 비정상적일 땐 에러를 방지하기 위해 try-catch 처리)
let db = null;
let commentsRef = null;
try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    commentsRef = ref(db, 'comments');
} catch (error) {
    console.warn("파이어베이스가 아직 설정되지 않았습니다. 설정값을 입력해주세요!");
}

const submitBtn = document.getElementById('submitComment');
const nameInput = document.getElementById('commentName');
const textInput = document.getElementById('commentText');
const commentsContainer = document.getElementById('commentsContainer');

function createPostIt(name, text) {
    const postIt = document.createElement('div');
    postIt.className = 'post-it';
    
    // 자연스러운 포스트잇 각도 (-3도 ~ 3도)
    const rot = Math.random() * 6 - 3;
    postIt.style.setProperty('--rot', `${rot}deg`);
    
    postIt.innerHTML = `
        <div class="post-it-name">${name}</div>
        <div class="post-it-text">${text}</div>
    `;
    
    // 가장 최근 글이 위로 오도록 prepend
    commentsContainer.prepend(postIt);
}

// 1. 작성 버튼 클릭 시 Firebase DB에 저장
submitBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    
    if (!name || !text) {
        alert('이름과 축하 메시지를 모두 입력해주세요! 😊');
        return;
    }
    
    if (!commentsRef) {
        alert('파이어베이스 설정이 완료되지 않았습니다! 코드의 firebaseConfig를 확인해주세요.');
        return;
    }
    
    // DB에 데이터 밀어넣기
    push(commentsRef, {
        name: name,
        text: text,
        timestamp: Date.now()
    });
    
    // 입력창 초기화
    nameInput.value = '';
    textInput.value = '';
    
    // 축하 하트 파티큘
    for(let i=0; i<10; i++) {
        createHeart(window.innerWidth / 2, window.innerHeight / 2);
    }
});

// 2. DB에서 실시간으로 데이터 가져와서 화면에 그리기
if (commentsRef) {
    onValue(commentsRef, (snapshot) => {
        commentsContainer.innerHTML = '';
        const data = snapshot.val();
        
        if (data) {
            // 시간순 정렬
            const commentsArray = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
            commentsArray.forEach((comment) => {
                createPostIt(comment.name, comment.text);
            });
        }
    });
}
