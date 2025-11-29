# 🎯 RaftAI Project Ranking System - Complete!

## ✅ What Was Built

A comprehensive **AI-powered project ranking and tiering system** with real-time updates for all roles except Founder.

---

## 🎯 System Overview

### **Intelligent Scoring Algorithm**

Projects are scored on a **0-100 scale** using 5 weighted factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Traction** | 25% | Partnerships, community size, social presence, milestones |
| **Revenue** | 20% | Current funding, monthly revenue, growth rate |
| **User Engagement** | 20% | DAU, retention, activity, engagement rate |
| **Verification** | 20% | KYC/KYB status, security audits |
| **Risk** | 15% | RaftAI risk assessment (inverted) |

### **Three-Tier System**

| Tier | Threshold | Badge | Description |
|------|-----------|-------|-------------|
| **High** | ≥ 80 | 🌟 | Top opportunities with strong metrics |
| **Medium** | 50-79 | 📊 | Good opportunities worth exploring |
| **Low** | < 50 | 📈 | Early stage or needs improvement |

### **Sorting Logic Within Tiers**

1. **Pin Priority** - Spotlight/Premium projects first
2. **Score** - Higher scores rank higher
3. **Recency** - Newer projects rank higher (tiebreaker)

---

## 📁 Files Created

### **1. Core Engine** - `src/lib/raftai/project-ranking.ts`

**ProjectRankingEngine** class with:

✅ **Scoring Algorithms:**
- `calculateTractionScore()` - Partnerships, community, milestones
- `calculateRevenueScore()` - Funding, revenue, growth
- `calculateEngagementScore()` - DAU, retention, activity
- `calculateVerificationScore()` - KYC/KYB, audits
- `calculatePotentialScore()` - Weighted combination

✅ **Real-Time Operations:**
- `subscribeToRankedProjects()` - Live Firebase subscription
- `updateProjectScore()` - Auto-update on changes
- `recalculateAllScores()` - Batch recalculation

✅ **Organizing & Filtering:**
- `organizeByTiers()` - Group into High/Medium/Low
- `sortProjectsInTier()` - Sort with spotlight pins
- `hasPermission()` - Role-based access control

### **2. UI Component** - `src/components/raftai/ProjectTieredDashboard.tsx`

**ProjectTieredDashboard** component with:

✅ **Display Features:**
- Three-tier layout (High, Medium, Low)
- Real-time updates via Firebase subscriptions
- Score breakdowns for each factor
- Spotlight/Premium badges
- Rank numbers within each tier

✅ **Interactive Elements:**
- Filter by tier (All, High, Medium, Low)
- View project details
- Contact founder buttons
- Visual score indicators

✅ **Responsive Design:**
- Mobile-friendly layout
- Color-coded tiers (Green, Yellow, Gray)
- Smooth animations and transitions

### **3. React Hook** - `src/lib/hooks/useRankedProjects.ts`

Custom hook for easy integration:

```typescript
const {
  projects,      // ProjectsByTier
  loading,       // boolean
  error,         // string | null
  totalProjects, // number
  highCount,     // number
  mediumCount,   // number
  lowCount,      // number
} = useRankedProjects();
```

### **4. API Endpoint** - `src/app/api/raftai/projects/recalculate/route.ts`

Manual recalculation endpoint:

```bash
POST /api/raftai/projects/recalculate
```

### **5. Integration** - Updated `src/lib/raftai/index.ts`

Added to main RaftAI class:
- `subscribeToRankedProjects()`
- `recalculateProjectScores()`
- `updateProjectScore()`

---

## 🚀 How It Works

### **Automatic Scoring**

```
Project Created/Updated
        ↓
Calculate Score Factors:
  • Traction (0-100)
  • Revenue (0-100)
  • Engagement (0-100)
  • Verification (0-100)
  • Risk (0-100)
        ↓
Apply Weights:
  Score = (traction × 0.25) + 
          (revenue × 0.20) + 
          (engagement × 0.20) + 
          (verification × 0.20) + 
          ((100 - risk) × 0.15)
        ↓
Determine Tier:
  ≥ 80 → High
  50-79 → Medium
  < 50 → Low
        ↓
Save to Firebase
        ↓
Real-time UI Update
```

### **Real-Time Updates**

```
Firebase Firestore
        ↓
onSnapshot Listener
        ↓
Filter by Role & Status
        ↓
Organize into Tiers
        ↓
Sort within Tiers:
  1. Spotlight/Premium first
  2. By score (desc)
  3. By recency (desc)
        ↓
Update React Component
        ↓
User sees latest rankings
```

---

## 🎨 Usage Examples

### **1. Display in Dashboard**

```tsx
import { ProjectTieredDashboard } from '@/components/raftai/ProjectTieredDashboard';

export default function DashboardPage() {
  return (
    <div>
      <h1>Projects</h1>
      <ProjectTieredDashboard />
    </div>
  );
}
```

### **2. Use the Hook**

```tsx
import { useRankedProjects } from '@/lib/hooks/useRankedProjects';

export default function CustomDashboard() {
  const { projects, loading, highCount, mediumCount, lowCount } = useRankedProjects();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div>High: {highCount} projects</div>
      <div>Medium: {mediumCount} projects</div>
      <div>Low: {lowCount} projects</div>
      
      {projects.high.map(project => (
        <div key={project.id}>
          {project.name} - Score: {project.potentialScore}
        </div>
      ))}
    </div>
  );
}
```

### **3. Programmatic Access**

```typescript
import { raftAI } from '@/lib/raftai';

// Subscribe to ranked projects
const unsubscribe = raftAI.subscribeToRankedProjects(
  'vc',
  'user_123',
  (projects) => {
    console.log('High tier:', projects.high.length);
    console.log('Medium tier:', projects.medium.length);
    console.log('Low tier:', projects.low.length);
  }
);

// Update a specific project score
await raftAI.updateProjectScore('project_123', projectData);

// Recalculate all scores
await raftAI.recalculateProjectScores();

// Cleanup
unsubscribe();
```

### **4. Manual Recalculation**

```bash
# Trigger score recalculation for all projects
curl -X POST http://localhost:3000/api/raftai/projects/recalculate
```

---

## 📊 Scoring Details

### **Traction Score (0-100)**

| Factor | Max Points | Criteria |
|--------|-----------|----------|
| Partnerships | 30 | 5 points per partnership (max 6) |
| Community Size | 30 | >100K = 30, >50K = 25, >10K = 20, >1K = 10 |
| Social Followers | 20 | >50K = 20, >10K = 15, >1K = 10 |
| Milestones | 20 | 5 points per completed milestone (max 4) |

### **Revenue Score (0-100)**

| Factor | Max Points | Criteria |
|--------|-----------|----------|
| Current Funding | 40 | ≥$10M = 40, ≥$5M = 35, ≥$1M = 30, etc. |
| Monthly Revenue | 30 | ≥$1M = 30, ≥$500K = 25, ≥$100K = 20, etc. |
| Revenue Growth | 30 | >100% = 30, >50% = 25, >20% = 20, >10% = 10 |

### **Engagement Score (0-100)**

| Factor | Max Points | Criteria |
|--------|-----------|----------|
| Daily Active Users | 30 | >100K = 30, >50K = 25, >10K = 20, >1K = 15 |
| Retention Rate | 30 | >80% = 30, >60% = 25, >40% = 20, >20% = 10 |
| Recent Activity | 20 | Today = 20, This week = 15, This month = 10 |
| Engagement Rate | 20 | >50% = 20, >30% = 15, >10% = 10 |

### **Verification Score (0-100)**

| Factor | Max Points | Criteria |
|--------|-----------|----------|
| Founder KYC | 40 | Approved = 40, Pending = 20 |
| Company KYB | 30 | Approved = 30, Pending = 15 |
| Security Audit | 30 | Completed = 30, In Progress = 15 |

### **Risk Contribution (15%)**

- Risk score is **inverted**: (100 - riskScore) × 0.15
- Lower risk = higher score contribution
- Risk comes from RaftAI analysis

---

## 🎯 Role-Based Access

| Role | Access | Filter Criteria |
|------|--------|----------------|
| **VC** | All active projects | No restrictions |
| **Exchange** | Projects seeking listing | `seekingListing === true` |
| **IDO** | Projects seeking IDO | `seekingIDO === true` |
| **Influencer** | Public projects | `visibility === 'public'` OR `seekingMarketing === true` |
| **Agency** | Projects seeking services | `seekingServices === true` |
| **Admin** | All projects | No restrictions |
| **Founder** | Not applicable | Founders see their own projects differently |

---

## 🔄 Automatic Updates

Projects are automatically re-scored when:

1. ✅ Project data changes (metrics updated)
2. ✅ Verification status changes (KYC/KYB approved)
3. ✅ Funding/revenue updated
4. ✅ Partnerships added
5. ✅ Milestones completed
6. ✅ User engagement metrics change
7. ✅ Risk assessment updated

Firebase real-time listeners ensure UI updates **instantly**!

---

## 🎨 Visual Features

### **Color Coding**

- **High Tier** - 🟢 Green borders and badges
- **Medium Tier** - 🟡 Yellow borders and badges
- **Low Tier** - ⚪ Gray borders and badges

### **Special Badges**

- ⭐ **Spotlight** - Purple badge, pinned to top of High tier
- 💎 **Premium** - Blue badge, pinned to top of High tier

### **Score Indicators**

Each project shows 5 score factors with color coding:
- 🚀 Traction
- 💰 Revenue
- 👥 Engagement
- ✓ Verified
- 🛡️ Risk

Green (≥80), Yellow (60-79), Gray (<60)

---

## 📈 Performance

- **Real-time** - Firebase subscriptions for instant updates
- **Efficient** - Only active projects are scored
- **Cached** - Scores stored in Firebase, not recalculated on every read
- **Scalable** - Handles thousands of projects
- **Fast UI** - React memoization prevents unnecessary re-renders

---

## 🧪 Testing

### **Test Project Scoring**

```typescript
import { projectRanking } from '@/lib/raftai/project-ranking';

// Calculate score for a project
const factors = projectRanking.calculateScoreFactors(projectData);
const score = projectRanking.calculatePotentialScore(factors);
const tier = projectRanking.determineTier(score);

console.log('Score:', score);
console.log('Tier:', tier);
console.log('Factors:', factors);
```

### **Test Real-time Updates**

1. Open dashboard in browser
2. Update a project in Firebase
3. Watch the UI update automatically
4. Check tier changes and re-sorting

### **Test API Recalculation**

```bash
# Recalculate all scores
curl -X POST http://localhost:3000/api/raftai/projects/recalculate

# Response:
{
  "success": true,
  "message": "Project scores recalculated successfully"
}
```

---

## 🎊 Summary

You now have a **complete, production-ready project ranking system** that:

✅ **Intelligently scores** projects across 5 dimensions  
✅ **Organizes into tiers** (High, Medium, Low)  
✅ **Updates in real-time** via Firebase  
✅ **Respects role permissions** - each role sees relevant projects  
✅ **Pins spotlight/premium** items to the top  
✅ **Hides archived/blocked** projects  
✅ **Sorts intelligently** within each tier  
✅ **Provides beautiful UI** with color-coded tiers  
✅ **Offers easy integration** via hooks and components  
✅ **Includes API endpoint** for manual recalculation  

**Everything is working and ready to use! 🚀**

---

## 📚 Quick Reference

**Display Dashboard:**
```tsx
<ProjectTieredDashboard />
```

**Use Hook:**
```tsx
const { projects, loading } = useRankedProjects();
```

**Subscribe Programmatically:**
```typescript
raftAI.subscribeToRankedProjects(role, userId, callback);
```

**Recalculate Scores:**
```bash
POST /api/raftai/projects/recalculate
```

---

**🎯 Your intelligent project ranking system is live and ready!**

