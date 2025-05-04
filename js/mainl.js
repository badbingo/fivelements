// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 平滑滚动效果
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // 导航栏滚动效果
    window.addEventListener('scroll', function() {
        const nav = document.querySelector('nav');
        if (window.scrollY > 100) {
            nav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        } else {
            nav.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
        }
    });
    
    // 返回顶部按钮
    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '↑';
    backToTopButton.className = 'back-to-top';
    backToTopButton.style.display = 'none';
    backToTopButton.style.position = 'fixed';
    backToTopButton.style.bottom = '20px';
    backToTopButton.style.right = '20px';
    backToTopButton.style.zIndex = '99';
    backToTopButton.style.border = 'none';
    backToTopButton.style.outline = 'none';
    backToTopButton.style.backgroundColor = '#283a5a';
    backToTopButton.style.color = 'white';
    backToTopButton.style.cursor = 'pointer';
    backToTopButton.style.padding = '15px';
    backToTopButton.style.borderRadius = '50%';
    backToTopButton.style.fontSize = '18px';
    backToTopButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    backToTopButton.style.transition = 'all 0.3s ease';
    
    backToTopButton.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#1a2638';
    });
    
    backToTopButton.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#283a5a';
    });
    
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    document.body.appendChild(backToTopButton);
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
    
    // 知识点的折叠/展开功能
    const knowledgePoints = document.querySelectorAll('.knowledge-point');
    if (knowledgePoints.length > 0) {
        knowledgePoints.forEach(point => {
            const heading = point.querySelector('h3');
            const content = point.querySelectorAll('h4, p, ul, table');
            
            // 添加折叠/展开图标
            const toggleIcon = document.createElement('span');
            toggleIcon.innerHTML = '−';
            toggleIcon.style.marginLeft = '10px';
            toggleIcon.style.cursor = 'pointer';
            heading.appendChild(toggleIcon);
            
            // 初始状态全部展开
            let isExpanded = true;
            
            heading.addEventListener('click', function() {
                isExpanded = !isExpanded;
                
                content.forEach(el => {
                    el.style.display = isExpanded ? '' : 'none';
                });
                
                toggleIcon.innerHTML = isExpanded ? '−' : '+';
            });
        });
    }
    
    // 案例的标签页功能
    const caseStudies = document.querySelectorAll('.case-study');
    if (caseStudies.length > 0) {
        caseStudies.forEach((study, index) => {
            // 给每个案例添加ID
            study.id = `case-${index + 1}`;
            
            // 创建案例导航
            const caseNav = document.createElement('div');
            caseNav.className = 'case-nav';
            caseNav.style.display = 'flex';
            caseNav.style.justifyContent = 'center';
            caseNav.style.marginBottom = '20px';
            caseNav.style.flexWrap = 'wrap';
            
            const sections = study.querySelectorAll('h4');
            sections.forEach((section, secIndex) => {
                const navItem = document.createElement('a');
                navItem.href = `#${study.id}-sec-${secIndex + 1}`;
                navItem.textContent = section.textContent;
                navItem.style.margin = '0 10px';
                navItem.style.padding = '5px 10px';
                navItem.style.backgroundColor = '#f5f5f5';
                navItem.style.borderRadius = '5px';
                navItem.style.textDecoration = 'none';
                navItem.style.color = '#333';
                navItem.style.transition = 'all 0.3s ease';
                
                navItem.addEventListener('mouseover', function() {
                    this.style.backgroundColor = '#e0e0e0';
                });
                
                navItem.addEventListener('mouseout', function() {
                    this.style.backgroundColor = '#f5f5f5';
                });
                
                caseNav.appendChild(navItem);
                
                // 给每个部分添加ID
                section.id = `${study.id}-sec-${secIndex + 1}`;
            });
            
            study.insertBefore(caseNav, study.firstChild);
        });
    }
    
    // 页面加载动画
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.style.opacity = '0';
        mainContent.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            mainContent.style.opacity = '1';
        }, 100);
    }
});
