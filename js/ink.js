// 页面过渡控制
document.addEventListener('DOMContentLoaded', function() {
    // 获取所有内部链接
    const links = document.querySelectorAll('a[href^="/"], a[href^="http"]:not([target="_blank"])');
    const transition = document.querySelector('.ink-transition');
    const inkCircle = document.querySelector('.ink-circle');
    
    // 为每个链接添加点击事件
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            // 排除锚点链接和当前页面链接
            if (this.href === window.location.href || this.getAttribute('href').startsWith('#')) {
                return;
            }
            
            e.preventDefault();
            const href = this.href;
            
            // 获取点击位置
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 设置水墨圆圈起始位置
            inkCircle.style.left = `${e.clientX}px`;
            inkCircle.style.top = `${e.clientY}px`;
            
            // 激活过渡效果
            transition.classList.add('active');
            inkCircle.style.animation = 'inkSpread 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            
            // 延迟跳转
            setTimeout(() => {
                window.location.href = href;
            }, 800);
        });
    });
    
    // 页面加载时重置动画
    window.addEventListener('load', function() {
        transition.classList.remove('active');
        inkCircle.style.animation = 'none';
    });
});

// 为页面添加进入动画
window.addEventListener('pageshow', function() {
    const transition = document.querySelector('.ink-transition');
    const inkCircle = document.querySelector('.ink-circle');
    
    // 重置状态
    transition.classList.remove('active');
    inkCircle.style.animation = 'none';
    
    // 设置水墨圆圈居中
    inkCircle.style.left = '50%';
    inkCircle.style.top = '50%';
    inkCircle.style.transform = 'translate(-50%, -50%) scale(0)';
    
    // 触发进入动画
    setTimeout(() => {
        transition.classList.add('active');
        inkCircle.style.animation = 'inkSpread 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    }, 50);
});
