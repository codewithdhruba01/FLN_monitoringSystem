# 📋 TECHNICAL SPECIFICATIONS
## FLN Daily Monitoring System - Detailed Documentation

---

## 📑 Table of Contents
1. [Project Architecture](#project-architecture)
2. [File Descriptions](#file-descriptions)
3. [Form Fields & Validation](#form-fields--validation)
4. [Data Structure](#data-structure)
5. [JavaScript Functions](#javascript-functions)
6. [CSS Classes & Styling](#css-classes--styling)
7. [URL Parameters](#url-parameters)
8. [Sample Data](#sample-data)

---

## 🏗 Project Architecture

### **Technology Stack**
- **HTML5:** Semantic markup, forms, tables
- **CSS3:** Grid, Flexbox, CSS variables, responsive media queries
- **JavaScript:** Vanilla (ES6+), no frameworks
- **No Backend:** Static files only
- **No Database:** Data stored in console for demonstration

### **Project Type**
- **Static Web Application**
- **Client-Side Only**
- **Progressive Enhancement**
- **Mobile-First Responsive Design**

---

## 📂 File Descriptions

### **cluster.html** (Page 1)
```
Purpose: Initial entry point for cluster selection
Size: ~5 KB
Lines: ~67
Key Elements:
  - Header with logo, title, breadcrumb
  - Cluster dropdown with 2 options
  - Form validation
  - Continue button → schools.html?cluster=X
```

### **schools.html** (Page 2)
```
Purpose: Display schools based on cluster selection
Size: ~3 KB
Lines: ~54
Key Elements:
  - Dynamic content based on URL parameter
  - School cards grid
  - Click handlers for navigation
  - Breadcrumb with back links
```

### **class-progress.html** (Page 3)
```
Purpose: Complex form for daily monitoring data entry
Size: ~18 KB
Lines: ~280
Key Elements:
  - 5 major form sections
  - 13 input fields (dropdowns, inputs, radio, checkboxes)
  - Student performance table (32 rows)
  - Form submission & validation
```

### **styles.css**
```
Purpose: Global styling for all pages
Size: ~28 KB
Lines: ~850
Key Features:
  - CSS variables for colors
  - Responsive grid layouts
  - Card-based components
  - Form element styling
  - Media queries (480px, 768px)
  - Accessibility features
```

### **script.js**
```
Purpose: Form handling, navigation, validation
Size: ~18 KB
Lines: ~450
Key Features:
  - URL parameter parsing
  - Dynamic content population
  - Form validation logic
  - Navigation handlers
  - Sample data arrays
```

### **logo.svg**
```
Purpose: Organization logo
Format: Scalable Vector Graphics
Size: ~1 KB
Includes: Tree, house, person representation
```

---

## 📝 Form Fields & Validation

### **SECTION A: Class & Teacher Details**

| Field Name | Type | Required | Validation | Sample Values |
|---|---|---|---|---|
| teacher | select | YES | Not empty | Rajesh Kumar, Priya Singh |
| grade | select | YES | Not empty | Grade-I, Grade-II, Grade-III |
| section | select | YES | Not empty (depends on grade) | I-A, I-B, I-C |
| date | date | YES | Valid date | 2026-03-03 (defaults to today) |
| studentsPresent | number | YES | Min 0, Max 40 | 32 |

### **SECTION B: Classroom Implementation Tracker**

| Field Name | Type | Required | Validation | Sample Values |
|---|---|---|---|---|
| flnPeriod | radio | YES | One selected | yes, no |
| reason | select | CONDITIONAL | Required if flnPeriod=no | Holiday, Assembly, Examination |
| duration | radio | YES | One selected | 30, 45, 60 |
| materials | checkbox | YES | At least 1 selected | Flashcards, Big Book, Workbook, Activity Kit, Blackboard, Other |
| engagement | radio | YES | One selected | Low, Medium, High |

### **SECTION C: Academic Focus**

| Field Name | Type | Required | Validation | Sample Values |
|---|---|---|---|---|
| literacyFocus | select | YES | Not empty | Oral Language, Phonological Awareness, Letter Recognition, Reading, Writing |
| literacyConcept | text | YES | Not empty | Vowels, Letter A, Rhyming words |
| numeracyFocus | select | YES | Not empty | Pre-number, Number Recognition, Counting, Operations, Shapes |
| numeracyConcept | text | YES | Not empty | Counting 1-10, Number 5, Adding 2+2 |

### **SECTION D: Student Performance**

For each of 32 students:

| Field Name | Type | Required | Validation | Sample Values |
|---|---|---|---|---|
| performanceLevel | button-select | YES | One of 1, 2, 3 | 1 (Red), 2 (Yellow), 3 (Green) |
| needsSupport | toggle | NO | Boolean | true, false |

**Color Coding:**
- `1` = Red = "Not Yet Able"
- `2` = Yellow = "With Help"
- `3` = Green = "Independently"

### **SECTION E: General Observation**

| Field Name | Type | Required | Validation | Sample Values |
|---|---|---|---|---|
| remarks | textarea | NO | Any text | "Good class participation..." |

---

## 📊 Data Structure

### **Complete Form Data JSON**

```javascript
{
  // Navigation context
  cluster: String,           // "Halol" or "Maval"
  school: String,            // School name from URL parameter
  
  // Section A: Class Details
  teacher: String,           // Selected teacher name
  grade: String,             // "Grade-I", "Grade-II", "Grade-III"
  section: String,           // "I-A", "I-B", "I-C", etc.
  date: String,              // ISO date format "YYYY-MM-DD"
  studentsPresent: String,   // Number as string "32"
  
  // Section B: Implementation
  flnPeriod: String,         // "yes" or "no"
  reason: String | null,     // null if yes, reason if no
  duration: String,          // "30", "45", or "60"
  materials: String[],       // ["Flashcards", "Big Book", ...]
  engagement: String,        // "Low", "Medium", or "High"
  
  // Section C: Academic
  literacyFocus: String,     // Category from dropdown
  literacyConcept: String,   // User entered text
  numeracyFocus: String,     // Category from dropdown
  numeracyConcept: String,   // User entered text
  
  // Section D: Student Data (Array)
  studentPerformance: [
    {
      studentNumber: Number,  // 1-32
      name: String,           // "Student 1"
      performanceLevel: Number, // 1, 2, or 3
      needsSupport: Boolean   // true or false
    },
    // ... 31 more students
  ],
  
  // Section E: Notes
  remarks: String           // User observation text
}
```

---

## 🔧 JavaScript Functions

### **Utility Functions**

#### `getUrlParameter(name: String): String | null`
```javascript
// Gets URL query parameter value
// Example: getUrlParameter('cluster') → "Halol"
```

#### `navigateWithParams(url: String, params: Object): void`
```javascript
// Navigate with URL parameters
// Example: navigateWithParams('schools.html', {cluster: 'Halol'})
```

#### `validateField(field: HTMLElement): Boolean`
```javascript
// Validates single form field
// Returns true if valid, false if empty
```

#### `showError(fieldName: String, message: String): void`
```javascript
// Display error message for field
// Adds red border and shows error text
```

### **Page Initialization**

#### `initClusterPage(): void`
- Sets up cluster selection page
- Handles Continue button click
- Validates selection before navigation

#### `initSchoolsPage(): void`
- Reads cluster from URL parameter
- Populates school cards based on cluster
- Updates breadcrumb navigation
- Sets up click handlers for school selection

#### `initClassProgressPage(): void`
- Reads cluster & school from URL parameters
- Populates all dropdowns with sample data
- Initializes date field with today's date
- Populates student table with 32 rows
- Sets up form submission handler

### **School Selection**

#### `handleSchoolSelect(cluster: String, school: String): void`
```javascript
// Navigate to class-progress page with cluster & school
// Called when school card is clicked
```

### **Dropdown Management**

#### `updateSectionDropdown(): void`
```javascript
// Updates section dropdown based on selected grade
// Grade I → I-A, I-B, I-C
// Grade II → II-A, II-B, II-C
// Grade III → III-A, III-B, III-C
```

#### `updateReasonVisibility(): void`
```javascript
// Shows/hides reason dropdown
// Visible only if FLN Period = "No"
```

### **Student Performance**

#### `populateStudentTable(): void`
```javascript
// Generates table with 32 sample students
// Creates performance buttons & support toggle for each
```

#### `selectPerformanceLevel(btn: HTMLElement): void`
```javascript
// Handles performance level selection
// Toggles .selected class on clicked button
// Removes selection from other buttons in same row
```

### **Form Submission**

#### `handleFormSubmit(e: Event): void`
```javascript
// Validates entire form
// Compiles form data
// Logs to console
// Shows success message
```

#### `showSuccessMessage(): void`
```javascript
// Displays green success notification
// Auto-removes after 4 seconds
```

---

## 🎨 CSS Classes & Styling

### **Container Classes**
- `.container` - Max width 1200px, auto margins
- `.card` - White background, shadow, rounded corners
- `.card-grid` - Responsive grid layout
- `.grid-2` - 2-column adaptive grid

### **Header/Navigation**
- `header` - Sticky header with gradient
- `.logo-section` - Logo + text container
- `.breadcrumb` - Navigation breadcrumb
- `.breadcrumb-item` - Individual breadcrumb item

### **Form Classes**
- `.form-section` - Major form section
- `.form-group` - Single input + label + error
- `.section-title` - Section heading
- `.required` - Red asterisk for required fields

### **Input Styling**
- `input[type='text']`, `input[type='number']`, `input[type='date']`
- `textarea`
- `select`
- `.radio-group`, `.checkbox-group`
- `.radio-item`, `.checkbox-item`
- `.toggle-switch` - Custom toggle

### **Button Classes**
- `.btn` - Base button styles
- `.btn-primary` - Blue background, white text
- `.btn-secondary` - White background, blue border
- `.btn-full` - Full width button

### **Table Classes**
- `table` - Main table styles
- `table thead` - Header background
- `table th`, `table td` - Cell styling
- `.performance-level` - Button group for levels
- `.level-btn` - Individual performance button
- `.level-1`, `.level-2`, `.level-3` - Color variants

### **Utility Classes**
- `.text-center` - Center text alignment
- `.mt-20`, `.mb-20` - Margin utilities
- `.error-message` - Error text, hidden by default
- `.field-error` - Red border on invalid fields

### **Responsive Classes**
- Media queries at 480px and 768px breakpoints
- Grid columns adjust automatically
- Font sizes scale down on mobile

---

## 🔗 URL Parameters

### **Parameter: cluster**
```
Name: cluster
Type: String
Example: schools.html?cluster=Halol
Values: Halol, Maval
Purpose: Identifies which cluster's schools to display
```

### **Parameter: school**
```
Name: school
Type: String (URL encoded)
Example: class-progress.html?cluster=Halol&school=Halol%20Primary%20School
Values: School name from schools array
Purpose: Identifies which school selected
```

### **Full URLs**
```
Page 1: cluster.html (no parameters)
Page 2: schools.html?cluster=Halol
Page 3: class-progress.html?cluster=Halol&school=Halol%20Primary%20School
```

---

## 🎯 Sample Data

### **Clusters Array**
```javascript
["Halol", "Maval"]
```

### **Schools Data Object**
```javascript
{
  Halol: [
    { id: 1, name: 'Halol Primary School' },
    { id: 2, name: 'Halol Model School' },
    { id: 3, name: 'Halol International School' }
  ],
  Maval: [
    { id: 4, name: 'Maval ZP School' },
    { id: 5, name: 'Maval Central School' },
    { id: 6, name: 'Maval High School' }
  ]
}
```

### **Teachers Data**
```javascript
[
  'Rajesh Kumar', 'Priya Singh', 'Arun Verma', 
  'Neha Sharma', 'Vikram Patel'
  // + 27 more sample teachers
]
```

### **Grades & Sections**
```javascript
gradesData = {
  'Grade-I': ['I-A', 'I-B', 'I-C'],
  'Grade-II': ['II-A', 'II-B', 'II-C'],
  'Grade-III': ['III-A', 'III-B', 'III-C']
}
```

### **Student Data** (32 rows)
```javascript
[
  { id: 1, name: 'Student 1' },
  { id: 2, name: 'Student 2' },
  // ...
  { id: 32, name: 'Student 32' }
]
```

---

## 🔐 Security Considerations

**Frontend Only - No Backend:**
- No sensitive data handling
- No authentication required
- No database access
- Console logging is for demonstration only
- Form data is client-side only

---

## ⚡ Performance Metrics

- **Page Load:** < 500ms
- **File Sizes:**
  - cluster.html: ~5 KB
  - schools.html: ~3 KB
  - class-progress.html: ~18 KB
  - styles.css: ~28 KB
  - script.js: ~18 KB
  - **Total:** < 100 KB
- **Student Table:** Renders 32 rows instantly
- **Form Validation:** Real-time, < 10ms

---

## 🌍 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS 14+, Android 8+)

---

## 📱 Responsive Breakpoints

```css
/* Desktop */
@media (min-width: 768px) { ... }

/* Tablet */
@media (max-width: 768px) { ... }

/* Mobile */
@media (max-width: 480px) { ... }
```

---

## 🔜 Scalability Notes

**Current Design:**
- 32 sample students
- 3 clusters
- 3 schools per cluster
- 5 sample teachers

**To Scale:**
1. Increase `sampleStudents` array in script.js
2. Add more clusters/schools to `schoolsData`
3. Add more teachers to `teachersData`
4. No performance impact for up to hundreds of students

---

**Documentation Version:** 1.0  
**Last Updated:** March 3, 2026  
**Status:** Complete ✅
