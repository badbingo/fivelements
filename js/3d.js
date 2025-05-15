document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="/"], a[href^="http"]:not([target="_blank"])');
    const container = document.querySelector('.page-3d-container');
    const currentPage = document.querySelector('.page-current');
    const nextPage = document.querySelector('.page-next');
    const currentContent = document.getElementById('current-content');
    const nextContent = document.getElementById('next-content');
    const loader = document.querySelector('.page-loader');
    
    // 克隆当前页面内容
    function cloneCurrentPage() {
        currentContent.innerHTML = '';
        const mainContent = document.querySelector('main') || document.body;
        const clone = mainContent.cloneNode(true);
        
        // 移除不需要的元素
        const elementsToRemove = clone.querySelectorAll('script, style, link, meta, noscript');
        elementsToRemove.forEach(el => el.remove());
        
        currentContent.appendChild(clone);
    }
    
    // 初始化克隆
    cloneCurrentPage();
    
    // 预加载下一页内容
    async function loadPage(url) {
        loader.classList.add('active');
        
        try {
            const response = await fetch(url, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            // 提取新页面内容
            const newContent = doc.querySelector('main') || doc.body;
            nextContent.innerHTML = newContent.innerHTML;
            
            // 等待内容渲染
            await new Promise(resolve => setTimeout(resolve, 50));
            
            return true;
        } catch (error) {
            console.error('Page load error:', error);
            return false;
        } finally {
            loader.classList.remove('active');
        }
    }
    
    // 执行翻页动画
    async function flipPage(href, direction = 'forward') {
        // 加载新页面
        const loaded = await loadPage(href);
        if (!loaded) {
            window.location.href = href;
            return;
        }
        
        // 设置翻页方向
        container.classList.remove('flip-out', 'flip-in');
        void container.offsetWidth; // 触发重绘
        
        if (direction === 'forward') {
            container.classList.add('flip-out');
            setTimeout(() => {
                container.classList.add('flip-in');
                currentContent.innerHTML = nextContent.innerHTML;
                nextContent.innerHTML = '';
                
                // 动画完成后更新URL
                setTimeout(() => {
                    window.history.pushState(null, '', href);
                    container.classList.remove('flip-out', 'flip-in');
                    
                    // 重新绑定事件
                    rebindEvents();
                }, 500);
            }, 500);
        } else {
            // 向后翻页逻辑（类似但方向相反）
        }
    }
    
    // 重新绑定新内容中的事件
    function rebindEvents() {
        cloneCurrentPage();
        const newLinks = currentContent.querySelectorAll('a[href^="/"], a[href^="http"]:not([target="_blank"])');
        newLinks.forEach(link => {
            link.addEventListener('click', handleLinkClick);
        });
    }
    
    // 处理链接点击
    async function handleLinkClick(e) {
        if (this.href === window.location.href || this.getAttribute('href').startsWith('#')) {
            return;
        }
        
        e.preventDefault();
        await flipPage(this.href);
    }
    
    // 绑定初始事件
    links.forEach(link => {
        link.addEventListener('click', handleLinkClick);
    });
    
    // 处理浏览器前进/后退
    window.addEventListener('popstate', function() {
        flipPage(window.location.href, 'backward');
    });
    
    // 初始页面状态
    window.addEventListener('load', function() {
        container.classList.remove('flip-out', 'flip-in');
    });
});
