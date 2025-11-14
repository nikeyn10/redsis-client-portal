# IBACS RedsisLab Design System v3.0
## Enhanced Professional Brand Guidelines with PDF Manual Integration

---

## 🎨 **Enhanced Color Palette**

### Primary Brand Colors (Your Preferred Scheme)
```css
/* RedsisLab Yellow - Primary Brand Color */
--redsislab-yellow: #FFD400;
--redsislab-yellow-hover: #E6BF00;
--redsislab-yellow-light: #FFF3B3;
--redsislab-yellow-dark: #CCAA00;

/* Your Preferred Additional Colors */
--ibacs-green: #27ae60;       /* The green you like */
--ibacs-green-hover: #219a52;
--ibacs-blue: #4a90e2;        /* The blue you like */
--ibacs-blue-hover: #357abd;
--ibacs-red: #da3633;         /* The red you like */
--ibacs-red-hover: #b02a37;
--ibacs-gray: #8b949e;        /* The gray you like */
--ibacs-gray-dark: #656d76;
```

### PDF Manual Inspired Colors (Complementary)
```css
/* Professional Corporate Colors from PDF */
--corporate-navy: #1a365d;
--corporate-navy-light: #2d4a68;
--corporate-slate: #2d3748;
--corporate-slate-light: #4a5568;
--corporate-silver: #e2e8f0;
--corporate-silver-dark: #cbd5e0;

/* PDF Accent Colors (Use Sparingly) */
--pdf-accent-blue: #3182ce;
--pdf-accent-teal: #319795;
--pdf-accent-purple: #805ad5;
```

### Dark Theme Professional Palette
```css
/* IBACS Dark Theme - Enhanced */
--ibacs-primary: #1e2329;
--ibacs-secondary: #21262d;
--ibacs-tertiary: #30363d;
--ibacs-dark: #0d1117;
--ibacs-darker: #010409;
--ibacs-surface: #161b22;
```

### Text Colors (High Contrast)
```css
/* Enhanced Text Hierarchy */
--text-primary: #f0f6fc;       /* Primary text - high contrast */
--text-secondary: #8b949e;     /* Secondary text */
--text-muted: #656d76;         /* Muted text */
--text-inverse: #24292f;       /* Text on yellow backgrounds */
--text-link: #6bb6ff;          /* Links */
--text-link-hover: #4a90e2;    /* Hovered links */
--text-success: #2ea043;       /* Success messages */
--text-warning: #fb8500;       /* Warning messages */
--text-error: #f85149;         /* Error messages */
```

---

## 🖼️ **Logo Integration Guidelines**

### Logo Specifications
```css
/* Company Logo Standards */
.company-logo {
    max-width: 200px;          /* Desktop header */
    max-height: 60px;
    object-fit: contain;
}

.company-logo-small {
    max-width: 40px;           /* Mobile/compact views */
    max-height: 40px;
}

.company-logo-large {
    max-width: 300px;          /* Hero sections */
    max-height: 120px;
}
```

### Logo Placement Rules
- **Header**: Top-left, 60px height maximum
- **Footer**: Center or left, 40px height maximum  
- **Hero Sections**: Center, up to 120px height
- **Documents**: Top-right corner, 80px maximum
- **Favicon**: 32x32px square version

### Logo Fallback System
```css
.logo-placeholder {
    background: var(--redsislab-yellow);
    color: var(--text-inverse);
    font-weight: 800;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-primary);
}
```

---

## 🔤 **Enhanced Typography**

### Font Hierarchy
```css
/* Professional Font Stack */
--font-primary: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
--font-mono: 'Fira Code', 'SF Mono', 'Monaco', 'Consolas', monospace;
--font-display: 'Inter', sans-serif;

/* Font Sizes (Responsive Scale) */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Typography Usage
```css
/* Headings */
h1 { font-size: var(--text-5xl); font-weight: var(--font-light); }
h2 { font-size: var(--text-4xl); font-weight: var(--font-normal); }
h3 { font-size: var(--text-3xl); font-weight: var(--font-medium); }
h4 { font-size: var(--text-2xl); font-weight: var(--font-medium); }
h5 { font-size: var(--text-xl); font-weight: var(--font-semibold); }
h6 { font-size: var(--text-lg); font-weight: var(--font-semibold); }

/* Body Text */
.text-body { font-size: var(--text-base); line-height: 1.6; }
.text-small { font-size: var(--text-sm); line-height: 1.5; }
.text-xs { font-size: var(--text-xs); line-height: 1.4; }
```

---

## 📏 **Spacing & Layout**

### Spacing Scale
```css
/* Consistent Spacing System */
--space-0: 0;
--space-1: 0.25rem;     /* 4px */
--space-2: 0.5rem;      /* 8px */
--space-3: 0.75rem;     /* 12px */
--space-4: 1rem;        /* 16px */
--space-5: 1.25rem;     /* 20px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */
--space-10: 2.5rem;     /* 40px */
--space-12: 3rem;       /* 48px */
--space-16: 4rem;       /* 64px */
--space-20: 5rem;       /* 80px */
--space-24: 6rem;       /* 96px */
```

### Border Radius Scale
```css
/* Rounded Corners */
--radius-none: 0;
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;  /* Circular */
```

---

## 🎯 **Component Library**

### Enhanced Buttons
```css
/* Primary Button - RedsisLab Yellow */
.btn-primary {
    background: linear-gradient(135deg, var(--redsislab-yellow) 0%, var(--redsislab-yellow-hover) 100%);
    color: var(--text-inverse);
    border: none;
    padding: var(--space-3) var(--space-6);
    border-radius: var(--radius-lg);
    font-weight: var(--font-semibold);
    font-size: var(--text-base);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(255, 212, 0, 0.25);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 212, 0, 0.35);
}

/* Success Button - Your Green */
.btn-success {
    background: var(--ibacs-green);
    color: white;
    border: 1px solid var(--ibacs-green);
}

.btn-success:hover {
    background: var(--ibacs-green-hover);
    border-color: var(--ibacs-green-hover);
}

/* Info Button - Your Blue */
.btn-info {
    background: var(--ibacs-blue);
    color: white;
    border: 1px solid var(--ibacs-blue);
}

.btn-info:hover {
    background: var(--ibacs-blue-hover);
    border-color: var(--ibacs-blue-hover);
}

/* Danger Button - Your Red */
.btn-danger {
    background: var(--ibacs-red);
    color: white;
    border: 1px solid var(--ibacs-red);
}

.btn-danger:hover {
    background: var(--ibacs-red-hover);
    border-color: var(--ibacs-red-hover);
}
```

### Enhanced Search Interface
```css
.search-container-enhanced {
    background: var(--ibacs-surface);
    border: 2px solid var(--ibacs-tertiary);
    border-radius: var(--radius-2xl);
    padding: var(--space-6);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
}

.search-input-enhanced {
    background: var(--ibacs-dark);
    border: 2px solid var(--ibacs-tertiary);
    border-radius: var(--radius-xl);
    padding: var(--space-4) var(--space-6);
    font-size: var(--text-lg);
    color: var(--text-primary);
    transition: all 0.3s ease;
}

.search-input-enhanced:focus {
    border-color: var(--redsislab-yellow);
    box-shadow: 0 0 0 4px rgba(255, 212, 0, 0.1);
}
```

### Card Components
```css
.card-enhanced {
    background: var(--ibacs-secondary);
    border: 1px solid var(--ibacs-tertiary);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.card-enhanced:hover {
    transform: translateY(-4px);
    border-color: var(--redsislab-yellow);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.card-feature {
    background: linear-gradient(135deg, var(--ibacs-primary) 0%, var(--ibacs-secondary) 100%);
    position: relative;
    overflow: hidden;
}

.card-feature::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--redsislab-yellow), var(--ibacs-green), var(--ibacs-blue));
}
```

---

## 📱 **Responsive Design**

### Breakpoints
```css
/* Mobile-First Responsive Design */
--breakpoint-sm: 640px;   /* Small devices (landscape phones) */
--breakpoint-md: 768px;   /* Medium devices (tablets) */
--breakpoint-lg: 1024px;  /* Large devices (laptops) */
--breakpoint-xl: 1280px;  /* Extra large devices (desktops) */
--breakpoint-2xl: 1536px; /* 2X large devices (large desktops) */
```

### Responsive Typography
```css
/* Fluid Typography */
.responsive-text {
    font-size: clamp(var(--text-sm), 2.5vw, var(--text-lg));
}

.responsive-heading {
    font-size: clamp(var(--text-2xl), 5vw, var(--text-5xl));
}
```

---

## 🌟 **Advanced Features**

### Animation & Transitions
```css
/* Smooth Animations */
.animate-fade-in {
    animation: fadeIn 0.6s ease-out;
}

.animate-slide-up {
    animation: slideUp 0.5s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

/* Loading States */
.loading-skeleton {
    background: linear-gradient(90deg, var(--ibacs-tertiary) 25%, var(--ibacs-secondary) 50%, var(--ibacs-tertiary) 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

### Focus & Accessibility
```css
/* Enhanced Focus States */
.focus-enhanced:focus {
    outline: 3px solid var(--redsislab-yellow);
    outline-offset: 2px;
    border-color: var(--redsislab-yellow);
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
    :root {
        --text-primary: #ffffff;
        --ibacs-tertiary: #555555;
        --border-color: #888888;
    }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

## 📋 **Implementation Guidelines**

### Color Usage Rules

#### ✅ Do's
- Use RedsisLab Yellow (#FFD400) for primary actions and branding
- Use your preferred green, blue, red for semantic actions
- Maintain dark theme consistency across all interfaces
- Ensure minimum 4.5:1 contrast ratio for text
- Use PDF-inspired colors for subtle accents only

#### ❌ Don'ts
- Don't use pure white backgrounds in dark theme
- Don't use yellow for large text areas (readability)
- Don't mix more than 3-4 accent colors per interface
- Don't use PDF colors as primary brand colors

### Logo Implementation
1. **Always provide fallback** when logo image fails to load
2. **Use vector formats** (SVG) when possible for crisp display
3. **Maintain aspect ratio** - never stretch or distort
4. **Test at different sizes** to ensure readability
5. **Include alt text** for accessibility

### Performance Guidelines
- Optimize images and logos for web (WebP when possible)
- Use CSS custom properties for theme switching
- Implement lazy loading for large component lists
- Minimize bundle size with tree-shaking

---

## 🔧 **Quick Reference**

### Common Component Classes
```css
/* Utilities */
.text-yellow { color: var(--redsislab-yellow); }
.bg-yellow { background: var(--redsislab-yellow); }
.border-yellow { border-color: var(--redsislab-yellow); }

.text-green { color: var(--ibacs-green); }
.text-blue { color: var(--ibacs-blue); }
.text-red { color: var(--ibacs-red); }
.text-gray { color: var(--ibacs-gray); }

/* Layout */
.container-max { max-width: 1400px; margin: 0 auto; }
.spacing-section { padding: var(--space-16) 0; }
.spacing-component { padding: var(--space-6); }
```

---

## 📊 **Design Metrics & KPIs**

Track these metrics for design system success:
- **Component Adoption Rate**: % of UI using design system components
- **Design Consistency Score**: Measured across different screens
- **User Task Completion**: Success rate for key user flows
- **Accessibility Compliance**: WCAG 2.1 AA level adherence
- **Performance Impact**: Load times and Core Web Vitals
- **Developer Satisfaction**: Ease of implementation feedback

---

## 🎨 **Brand Voice & Experience**

### Visual Personality
- **Professional**: Clean, modern, business-focused aesthetics
- **Reliable**: Consistent patterns and predictable behaviors
- **Efficient**: Streamlined workflows and clear information hierarchy
- **Innovative**: Modern technologies with classic business reliability
- **Accessible**: Inclusive design for all users and abilities

### Interaction Principles
- **Immediate Feedback**: Visual responses to all user actions
- **Clear Navigation**: Obvious paths and breadcrumbs
- **Smart Defaults**: Sensible pre-selections and suggestions
- **Error Prevention**: Validation and confirmation dialogs
- **Progressive Enhancement**: Core functionality works everywhere

---

**Version**: 3.0  
**Last Updated**: July 6, 2025  
**Maintained by**: IBACS Development Team  
**Contact**: dev@ibacs.com

This enhanced design system integrates your preferred color palette with professional standards inspired by your PDF manual, ensuring brand consistency while maintaining the modern, user-friendly interface you want.

---

## 🚀 **Next Steps for Implementation**

1. **Add Company Logo**: Replace the placeholder in the header with your actual logo file
2. **Test Color Combinations**: Ensure all your preferred colors work well together
3. **Create Component Library**: Build reusable components following these guidelines
4. **Accessibility Audit**: Test with screen readers and keyboard navigation
5. **Performance Optimization**: Minimize CSS and optimize images
6. **Documentation**: Create component usage examples for your team
7. **Training**: Educate developers on the new design system standards
