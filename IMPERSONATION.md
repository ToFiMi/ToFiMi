# Admin Impersonation Feature

## Overview

The admin impersonation feature allows ADMIN users and leaders to view the application as another user would see it, while maintaining their admin privileges for easy exit.

## How It Works

### 1. Starting Impersonation

**For Admins:**
- Navigate to the Users page (`/users`)
- Find the user you want to impersonate
- Click the "Náhľad ako" (View as) button
- A new tab/window will open with the impersonation session

**For Leaders:**
- Leaders can only impersonate users within their own school
- Same process as admins, but limited to their school's users

### 2. During Impersonation

When impersonating a user:
- A **yellow warning banner** appears at the top of the page
- The banner shows: "Impersonation Mode: You are viewing as [user email]"
- You see the application exactly as that user would see it
- All permissions and data are scoped to the impersonated user

### 3. Exiting Impersonation

To exit impersonation mode:
- Click the **"Exit Impersonation"** button in the yellow banner
- You will be automatically returned to your admin session
- The impersonation session is logged for audit purposes

## Technical Details

### Security Features

1. **Role-based access**: Only ADMIN and leader roles can impersonate
2. **School restrictions**: Leaders can only impersonate users in their school
3. **Audit logging**: All impersonation events are logged with timestamps
4. **Token-based**: Uses JWT tokens with impersonation flags
5. **Visual indicator**: Clear banner shows when in impersonation mode
6. **Cannot impersonate inactive users**: The button is hidden for inactive users

### Token Structure

The impersonation token contains:
- `isImpersonating`: Boolean flag (true)
- `originalAdminId`: The admin's user ID
- `impersonatedUserId`: The target user's ID
- Standard user session data (scoped to impersonated user)

### API Endpoints

- `POST /api/admin/impersonate` - Create impersonation session
- `POST /api/admin/stop-impersonate` - Exit impersonation and restore admin session
- `/impersonate?token=...` - Handler page for starting impersonation
- `/restore-session?token=...` - Handler page for restoring admin session

### Database Collections

**audit_log** - Stores impersonation events:
```javascript
{
  event: 'user_impersonation_started' | 'user_impersonation_stopped',
  adminId: ObjectId,
  adminEmail: string,
  targetUserId: ObjectId,
  targetEmail: string,
  targetUserSchoolId: ObjectId,
  timestamp: Date
}
```

## Use Cases

1. **Support & Troubleshooting**: Admins can see exactly what a user sees to help debug issues
2. **Testing**: Verify how features appear for different user roles
3. **Data Review**: View a user's data and permissions without logging in as them
4. **Training**: Leaders can demonstrate features as different user types

## Important Notes

- Impersonation sessions are separate from your main admin session
- You can have multiple impersonation tabs open simultaneously
- Closing the impersonation tab does NOT end the impersonation (use the Exit button)
- All actions performed during impersonation are attributed to the impersonated user, not the admin
- Impersonation tokens expire after 8 hours for security

## Environment Variables

Required environment variables:
- `NEXTAUTH_SECRET` - Used for signing JWT tokens
- `NEXTAUTH_URL` - Base URL for generating impersonation links
- `NEXT_PUBLIC_NEXTAUTH_SECRET` - Client-side secret for token verification
