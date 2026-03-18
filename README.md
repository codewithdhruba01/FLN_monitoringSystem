# FLN Daily Monitoring System
## Space ECE India Foundation

A professional, responsive multi-page static web application for recording foundational literacy and numeracy (FLN) monitoring data.

---

## 📋 Project Overview

The **FLN Daily Monitoring System** is a production-ready, frontend-only web application designed to facilitate daily monitoring and recording of FLN (Foundational Literacy and Numeracy) class progress across multiple schools and clusters.

**Key Features:**
- ✅ Multi-page navigation with URL parameters
- ✅ Professional NGO/Education styling
- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Form validation with error messages
- ✅ Student performance tracking (30+ students per class)
- ✅ Color-coded performance levels
- ✅ Dynamic content based on cluster/school selection
- ✅ No backend, no database, no frameworks
- ✅ Static HTML, CSS, and vanilla JavaScript only
- ✅ Production-ready UI with accessibility

---

## 📁 File Structure

```
FLN form/
├── cluster.html                    # Page 1: Cluster Selection
├── schools.html                    # Page 2: School Selection
├── class-progress.html             # Page 3: Daily Monitoring Form
├── styles.css                      # Global stylesheet
├── script.js                       # JavaScript functionality
├── logo.svg                        # Organization logo
└── README.md                       # This file
```

---

## 🎨 Design Specifications

### Color Palette
- **Primary Color:** #1E88E5 (Soft Blue)
- **Primary Light:** #E3F2FD
- **Success:** #4CAF50 (Green)
- **Warning:** #FFC107 (Yellow)
- **Danger:** #F44336 (Red)
- **Text Primary:** #212121
- **Text Secondary:** #666666
- **Background Light:** #FAFAFA
- **Border Color:** #E0E0E0

### Typography
- **Font Family:** Poppins, Inter (fallback: system fonts)
- **Font Sizes:** Responsive (16px base on mobile, scales up)

### Visual Elements
- **Border Radius:** 8px
- **Shadows:** Soft, subtle shadows with 3 levels (sm, md, lg)
- **Card-Based Layout:** Professional cards for each section
- **Responsive Grid:** Adapts from 1 column (mobile) to multiple columns (desktop)

---

## 📄 Pages & Navigation

### PAGE 1: cluster.html
**Purpose:** Select monitoring cluster

**Features:**
- Simple dropdown to select cluster (Halol, Maval)
- Continue button validates selection
- URL parameter passing: `schools.html?cluster=Halol`

### PAGE 2: schools.html
**Purpose:** Select school within cluster

**Features:**
- Dynamic school list based on cluster parameter
- Clickable school cards
- Breadcrumb navigation
- URL parameter passing: `class-progress.html?cluster=Halol&school=Halol%20Primary%20School`

**Sample Data:**
- **Halol:** Halol Primary School, Halol Model School, Halol International School
- **Maval:** Maval ZP School, Maval Central School, Maval High School

### PAGE 3: class-progress.html
**Purpose:** Record comprehensive daily FLN monitoring data

**Sections:**

#### A. Class & Teacher Details
- Teacher Name (dropdown)
- Grade (dropdown)
- Section (dependent dropdown)
- Date (date picker, defaults to today)
- Total Students Present (number input)

#### B. Classroom Implementation Tracker
- FLN Period Status (Yes/No radio)
- Reason (if No - conditional dropdown)
- Duration (30/45/60 minutes - radio)
- Teaching Materials (checkboxes - multiple select)
- Student Engagement (Low/Medium/High - radio)

#### C. Academic Focus
- Literacy Category (dropdown)
- Specific Literacy Concept (text input)
- Numeracy Category (dropdown)
- Specific Numeracy Concept (text input)

#### D. Full Class Student Performance
- Interactive table with 32 sample students
- Performance levels: 1 (Red), 2 (Yellow), 3 (Green)
- Support needed toggle for each student
- Color-coded legend

#### E. General Observation
- Remarks textarea

---

## 🎯 Features & Functionality

### Navigation & URL Parameters
- All pages use clean URLs with query parameters
- Breadcrumb navigation for easy tracking
- Links are interactive and maintain context
- Back navigation available through breadcrumbs

### Form Validation
- Real-time error messages
- Required field validation
- Performance level mandatory for all students
- At least one teaching material must be selected
- Prevents form submission if validation fails

### Data Handling
- Form data is compiled as JSON object
- Data logged to browser console
- Success notification displayed on submit
- No actual backend submission (static only)

### Responsive Design
- **Desktop:** Multi-column layouts
- **Tablet:** 2-column layouts with adaptive spacing
- **Mobile:** Single column, larger touch targets
- Hamburger/vertical breadcrumb on small screens

### Accessibility
- Semantic HTML structure
- Proper label associations
- Color contrast ratios meet WCAG standards
- Keyboard navigation support
- Focus states for interactive elements

---

## 🚀 How to Use

### Local Setup
1. **Download/Open Files:**
   - Save all files in the same directory
   - No installation required

2. **Open in Browser:**
   - Double-click `cluster.html` to start, OR
   - Use Live Server extension in VS Code

3. **Navigate Through App:**
   - Start at Cluster selection
   - Select cluster → Continue
   - Choose school → Click card
   - Fill form and submit

### Live Server (Recommended)
```bash
# If using VS Code
1. Install "Live Server" extension
2. Right-click cluster.html
3. Select "Open with Live Server"
```

### Direct File Opening
```bash
# Windows
cluster.html  # Double-click or drag to browser

# macOS/Linux
open cluster.html  # or drag to browser
```

---

## 📋 Form Data Structure

When the form is submitted, the following JSON structure is logged to console:

```javascript
{
  "cluster": "Halol",
  "school": "Halol Primary School",
  "teacher": "Rajesh Kumar",
  "grade": "Grade-I",
  "section": "I-A",
  "date": "2026-03-03",
  "studentsPresent": "32",
  "flnPeriod": "yes",
  "reason": null,
  "duration": "45",
  "materials": ["Flashcards", "Big Book", "Workbook"],
  "engagement": "High",
  "literacyFocus": "Reading",
  "literacyConcept": "Vowels",
  "numeracyFocus": "Number Recognition",
  "numeracyConcept": "Numbers 1-10",
  "remarks": "Good class participation",
  "studentPerformance": [
    {
      "studentNumber": 1,
      "name": "Student 1",
      "performanceLevel": 3,
      "needsSupport": false
    },
    // ... 31 more students
  ]
}
```

---

## 📱 Responsive Breakpoints

- **Mobile:** < 480px
- **Tablet:** 480px - 768px
- **Desktop:** > 768px

All layouts automatically adapt with no manual intervention needed.

---

## 🎓 Educational Use Cases

1. **Daily Monitoring:** Teachers record FLN progress daily
2. **Cluster Analysis:** Compare performance across schools
3. **Reporting:** Export data for monitoring reports (if integrated with backend)
4. **Intervention Planning:** Identify students needing support

---

## 💡 Future Enhancements (Optional)

If backend integration is added:
- Save data to database
- User authentication
- Data export (CSV/PDF)
- Analytics dashboards
- Historical tracking
- Photo evidence upload

---

## 📧 Support

**Organization:** Space ECE India Foundation  
**System:** FLN Daily Monitoring System  
**Version:** 1.0  
**Year:** 2026

---

## 📄 License

This project is developed for Space ECE India Foundation.

---

## ✅ Quality Checklist

- ✅ All pages load correctly
- ✅ Navigation works with URL parameters
- ✅ Form validation prevents invalid submissions
- ✅ Student table displays all 32 rows
- ✅ Responsive on mobile, tablet, desktop
- ✅ Professional styling throughout
- ✅ Breadcrumb navigation works
- ✅ Color legend visible and accurate
- ✅ Footer consistent across all pages
- ✅ Console logging of form data on submit
- ✅ No console errors
- ✅ All interactive elements have hover states
- ✅ Touch-friendly on mobile devices

---

**Last Updated:** March 3, 2026  
**Status:** Production Ready ✅
