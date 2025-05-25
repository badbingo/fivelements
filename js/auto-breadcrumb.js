// ===== 自动面包屑导航 =====
document.addEventListener('DOMContentLoaded', function() {
    // 1. 创建容器
    const breadcrumb = document.createElement('nav');
    breadcrumb.className = 'auto-breadcrumb';
    breadcrumb.setAttribute('aria-label', '面包屑导航');
    
    // 2. 获取路径信息
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    let accumulatedPath = '';
    
    // 3. 始终添加首页
    breadcrumb.innerHTML = `
        <a href="/" class="breadcrumb-home">
            <i class="fas fa-home"></i> 首页
        </a>
    `;
    
    // 4. 动态生成路径
    pathSegments.forEach((segment, index) => {
        accumulatedPath += '/' + segment;
        const isLast = index === pathSegments.length - 1;
        const name = formatSegmentName(segment);
        
        breadcrumb.innerHTML += `
            <span class="divider">/</span>
            ${isLast ? 
                `<span class="current">${name}</span>` : 
                `<a href="${accumulatedPath}">${name}</a>`
            }
        `;
    });
    
    // 5. 插入到页面（自动寻找合适位置）
    insertBreadcrumb(breadcrumb);
});

// 格式化路径段显示名称
function formatSegmentName(segment) {
    return segment
        .replace('.html', '')
        .replace(/-/g, ' ')
        .replace(/^\w/, c => c.toUpperCase());
}

// 智能插入面包屑
function insertBreadcrumb(breadcrumb) {
    const possibleTargets = [
        document.querySelector('main'),
        document.querySelector('.content-container'),
        document.querySelector('article')
    ];
    
    for (const target of possibleTargets) {
        if (target) {
            target.insertBefore(breadcrumb, target.firstChild);
            return;
        }
    }
    
    // 作为最后手段添加到body开头
    document.body.insertBefore(breadcrumb, document.body.firstChild);
}
