// 导航栏功能
document.addEventListener('DOMContentLoaded', function() {
    // 滚动效果
    const header = document.querySelector('.main-header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 移动端菜单切换
    const mobileMenuToggle = document.createElement('div');
    mobileMenuToggle.className = 'mobile-menu-toggle';
    mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector('.header-container').prepend(mobileMenuToggle);
    
    mobileMenuToggle.addEventListener('click', function() {
        document.querySelector('.main-nav').classList.toggle('active');
        this.querySelector('i').classList.toggle('fa-times');
    });

    // 面包屑导航生成
    function generateBreadcrumb() {
        const breadcrumbContainer = document.createElement('div');
        breadcrumbContainer.className = 'breadcrumb-container';
        
        const breadcrumb = document.createElement('ol');
        breadcrumb.className = 'breadcrumb';
        
        // 首页链接
        const homeItem = document.createElement('li');
        homeItem.className = 'breadcrumb-item';
        const homeLink = document.createElement('a');
        homeLink.href = 'index.html';
        homeLink.className = 'breadcrumb-link';
        homeLink.innerHTML = '<i class="fas fa-home"></i> 首页';
        homeItem.appendChild(homeLink);
        breadcrumb.appendChild(homeItem);
        
        // 当前页面路径
        const path = window.location.pathname.split('/');
        let currentPath = '';
        
        for (let i = 0; i < path.length; i++) {
            if (path[i] && path[i] !== 'index.html') {
                currentPath += '/' + path[i];
                
                // 如果是当前页面，不添加链接
                if (i === path.length - 1) {
                    const activeItem = document.createElement('li');
                    activeItem.className = 'breadcrumb-item active';
                    activeItem.textContent = document.title.replace(' - 麦八字教学网', '');
                    breadcrumb.appendChild(activeItem);
                } else {
                    // 其他路径添加链接
                    const pathItem = document.createElement('li');
                    pathItem.className = 'breadcrumb-item';
                    const pathLink = document.createElement('a');
                    pathLink.href = currentPath;
                    pathLink.className = 'breadcrumb-link';
                    
                    // 简单处理路径显示名称
                    let displayName = path[i].replace('.html', '');
                    displayName = displayName.replace(/-/g, ' ');
                    displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                    
                    pathLink.textContent = displayName;
                    pathItem.appendChild(pathLink);
                    breadcrumb.appendChild(pathItem);
                }
            }
        }
        
        breadcrumbContainer.appendChild(breadcrumb);
        document.querySelector('main').prepend(breadcrumbContainer);
    }
    
    // 只在非首页生成面包屑
    if (!window.location.pathname.endsWith('index.html') && 
        !(window.location.pathname === '/' || window.location.pathname === '')) {
        generateBreadcrumb();
    }
});
