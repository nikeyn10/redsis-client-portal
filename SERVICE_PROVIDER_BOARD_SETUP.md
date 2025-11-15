# Service Provider Board Configuration Guide

## Board ID: 18379446736

The Service Provider board has been automatically set up with the following columns:

### ✅ Configured Columns

| Column Name | Column ID | Type | Purpose |
|------------|-----------|------|---------|
| Name | `name` | Name | Provider's full name |
| Email | `email_mkxpawg3` | Email | Provider's email address |
| Phone | `phone_mkxpec5j` | Phone | Provider's phone number |
| Password | `text_mkxpb7j4` | Text | Authentication password |
| Specialization | `dropdown_mkxpdbxw` | Dropdown | Tech's area of expertise |
| Assigned Tickets | `numeric_mkxp72jc` | Numbers | Count of active tickets |
| Status | `status` | Status | Provider availability status |

## 🔧 Manual Configuration Required

You need to manually configure the dropdown and status labels in Monday.com:

### 1. Configure Specialization Dropdown

1. Go to Monday.com board: https://monday.com/boards/18379446736
2. Click on the "Specialization" column header
3. Click "Edit labels"
4. Add the following options:
   - General Support
   - Network Specialist
   - Hardware Technician
   - Software Developer
   - Security Expert
   - Database Admin

### 2. Configure Status Labels

1. Click on the "Status" column header
2. Click "Edit labels"
3. Replace existing labels with:
   - **Active** (Green) - Provider is available
   - **On Leave** (Orange) - Provider is temporarily unavailable
   - **Inactive** (Gray) - Provider is not working

## 📝 Testing the Setup

After configuring the labels, test the integration:

1. Go to the Management Portal in your Monday app
2. Click on "Service Providers" tab
3. Click "New Provider"
4. Fill in:
   - Name: Test Tech
   - Email: test@example.com
   - Phone: +1 555-123-4567
   - Password: test123
   - Specialization: General Support
   - Status: Active
5. Click "Create Provider"
6. Verify the provider appears in the list
7. Test Edit and Delete functions

## 🎯 Board Purpose

This board manages your service providers/technicians who handle support tickets:

- **Name**: Full name of the technician
- **Email**: Used for login and notifications
- **Phone**: Contact number for emergencies
- **Password**: Portal access credentials
- **Specialization**: Matches tickets to the right expert
- **Assigned Tickets**: Automatic count of active assignments
- **Status**: Tracks availability for ticket assignment

## 🔄 Integration with App

The app automatically:
- Creates providers through the "New Provider" button
- Updates provider information via the Edit dialog
- Deletes providers when needed
- Displays assigned ticket counts (calculated from ticket board)
- Filters active providers for ticket assignment

All CRUD operations sync directly with this Monday.com board.
