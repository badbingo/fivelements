document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="/"], a[href^="http"]:not([target="_blank"])');
    const transition = document.querySelector('.star-transition');
    
    // 创建星座连线（可选）
    function createConstellation(particles) {
        // 随机连接一些粒子形成星座效果
        for (let i = 0; i < particles.length / 4; i++) {
            const p1 = particles[Math.floor(Math.random() * particles.length)];
            const p2 = particles[Math.floor(Math.random() * particles.length)];
            
            if (p1 && p2) {
                const line = document.createElement('div');
                line.className = 'constellation-line';
                
                const dx = parseInt(p2.style.left) - parseInt(p1.style.left);
                const dy = parseInt(p2.style.top) - parseInt(p1.style.top);
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                line.style.left = p1.style.left;
                line.style.top = p1.style.top;
                line.style.width = `${distance}px`;
                line.style.setProperty('--scale', distance / 100);
                line.style.transform = `rotate(${angle}rad)`;
                line.style.animationDelay = `${Math.random() * 0.5}s`;
                
                transition.appendChild(line);
            }
        }
    }
    
    // 创建星空粒子
    function createStarParticles(x, y, isCenter = false) {
        transition.innerHTML = ''; // 清除旧粒子
        
        const particleCount = isCenter ? 120 : 80;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'star-particle';
            
            // 从点击位置或中心向外扩散
            let tx, ty;
            if (isCenter) {
                // 从中心向四周扩散
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 30;
                tx = Math.cos(angle) * distance + 'vw';
                ty = Math.sin(angle) * distance + 'vh';
                particle.style.left = '50%';
                particle.style.top = '50%';
            } else {
                // 从点击位置向外扩散
                const angle = Math.random() * Math.PI * 2;
                const distance = 30 + Math.random() * 50;
                tx = Math.cos(angle) * distance + 'vw';
                ty = Math.sin(angle) * distance + 'vh';
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
            }
            
            // 随机大小和动画延迟
            const size = 1 + Math.random() * 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.setProperty('--tx', tx);
            particle.style.setProperty('--ty', ty);
            particle.style.animationDelay = `${Math.random() * 0.3}s`;
            
            // 随机闪烁效果
            if (Math.random() > 0.7) {
                particle.style.animation = `starFly 1.2s ease-out forwards, starTwinkle ${0.5 + Math.random() * 1}s infinite`;
            }
            
            transition.appendChild(particle);
            particles.push(particle);
        }
        
        // 创建星座连线（可选）
        if (isCenter) {
            createConstellation(particles);
        }
    }
    
    // 为链接添加点击事件
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.href === window.location.href || this.getAttribute('href').startsWith('#')) {
                return;
            }
            
            e.preventDefault();
            const href = this.href;
            
            // 获取点击位置
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left + rect.x;
            const y = e.clientY - rect.top + rect.y;
            
            // 激活过渡效果
            transition.classList.add('active');
            createStarParticles(e.clientX, e.clientY);
            
            // 延迟跳转
            setTimeout(() => {
                window.location.href = href;
            }, 800);
        });
    });
    
    // 页面加载时创建中心扩散效果
    window.addEventListener('load', function() {
        transition.classList.remove('active');
        
        // 新页面进入效果
        setTimeout(() => {
            transition.classList.add('active');
            createStarParticles(0, 0, true);
        }, 50);
    });
    
    // 处理浏览器前进/后退
    window.addEventListener('pageshow', function() {
        transition.classList.remove('active');
        
        setTimeout(() => {
            transition.classList.add('active');
            createStarParticles(0, 0, true);
        }, 50);
    });
});
