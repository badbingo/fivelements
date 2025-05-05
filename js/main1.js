// 主JavaScript文件

document.addEventListener('DOMContentLoaded', function() {
    // 移动logo到右上角
    const headerContainer = document.querySelector('header .container');
    const logo = document.querySelector('.logo');
    const nav = document.querySelector('nav');
    
    if (headerContainer && logo && nav) {
        headerContainer.insertBefore(nav, logo);
    }

    // 导航栏滚动效果
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                header.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
            } else {
                header.style.boxShadow = 'none';
            }
        });
    }

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 评价轮播
    const testimonials = document.querySelectorAll('.testimonial');
    if (testimonials.length > 1) {
        let currentTestimonial = 0;
        
        function showTestimonial(index) {
            testimonials.forEach((testimonial, i) => {
                testimonial.style.display = i === index ? 'block' : 'none';
            });
        }
        
        showTestimonial(currentTestimonial);
        
        setInterval(() => {
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
            showTestimonial(currentTestimonial);
        }, 5000);
    }

    // 返回顶部按钮
    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopButton.className = 'back-to-top';
    backToTopButton.style.display = 'none';
    document.body.appendChild(backToTopButton);

    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 移动端菜单切换
    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.innerHTML = '<i class="fas fa-bars"></i>';
    mobileMenuButton.className = 'mobile-menu-button';
    const headerContainer = document.querySelector('header .container');
    if (headerContainer) {
        headerContainer.prepend(mobileMenuButton);
    }

    const nav = document.querySelector('nav');
    if (nav) {
        mobileMenuButton.addEventListener('click', function() {
            nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
        });

        function checkScreenSize() {
            if (window.innerWidth > 768) {
                nav.style.display = 'block';
            } else {
                nav.style.display = 'none';
            }
        }

        window.addEventListener('resize', checkScreenSize);
        checkScreenSize();
    }

    // 工具提示初始化
    document.querySelectorAll('.tooltip').forEach(tooltip => {
        tooltip.addEventListener('mouseenter', function() {
            const tooltipText = this.querySelector('.tooltiptext');
            if (tooltipText) {
                tooltipText.style.visibility = 'visible';
                tooltipText.style.opacity = '1';
            }
        });
        
        tooltip.addEventListener('mouseleave', function() {
            const tooltipText = this.querySelector('.tooltiptext');
            if (tooltipText) {
                tooltipText.style.visibility = 'hidden';
                tooltipText.style.opacity = '0';
            }
        });
    });

    // 检查并加载首页内容
    if (document.querySelector('.hero-content') && !document.querySelector('.hero-content').innerHTML.trim()) {
        loadHomeContent();
    }
});

// 加载首页内容
function loadHomeContent() {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.innerHTML = `
            <h2>专业八字命理教学平台</h2>
            <p>系统学习八字命理知识，掌握传统命理精髓</p>
            <a href="basics/bazi-process.html" class="btn">开始学习</a>
        `;
    }
}

// 八字计算器功能
function calculateBazi() {
    // 这里可以添加八字计算器的功能
    console.log('八字计算器功能将在后续实现');
}
