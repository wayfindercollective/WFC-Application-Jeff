# 📊 Form Data to N8N/Pipedrive Mapping Guide

## Current Form Questions → Data Structure

### Question Flow:
1. **Intro Screen** → Not sent (just UI)
2. **Question 1**: Textarea - "What area would you like Jeff's help with?" → `lifeArea`
3. **Question 2**: Commitment - "When you commit to something important..." → `commitment`
4. **Question 3**: Readiness - "How ready are you to make meaningful changes..." → `readiness`
5. **Question 4**: Investment Readiness - "Which option best describes your ability to invest..." → `investmentReadiness`
6. **Question 5**: Income - "What's your current income in USD ($), per month?" → `income`
7. **Question 6**: Full Name → `fullName` (split into `firstName` and `lastName`)
8. **Question 7**: Email → `email`
9. **Question 8**: Phone → `phone` (with `phoneCountry`)

---

## 📤 JSON Payload Sent to N8N Webhook

When the form is submitted, this JSON structure is sent via POST to your N8N webhook:

```json
{
  // ===== CONTACT INFORMATION (Pipedrive Person) =====
  "name": "John Smith",                    // Full name (firstName + lastName)
  "firstName": "John",                     // First name (extracted from fullName)
  "lastName": "Smith",                     // Last name (extracted from fullName)
  "email": "john@example.com",            // Email address
  "phone": "6123456789",                  // Phone number (digits only, no country code)
  "phoneCountry": "NL",                   // Country code (e.g., 'US', 'NL', 'UK')
  "fullPhone": "+31 6 12345678",          // Formatted phone for Pipedrive (with country code)

  // ===== SURVEY ANSWERS (Pipedrive Deal Custom Fields) =====
  
  // NEW FIELD: Commitment Level
  "commitment": "I follow through fully",  // Question 2 answer
  // Options:
  // - "I follow through fully"
  // - "I'm committed but sometimes need accountability"
  // - "I hesitate to act at first"
  // - "I struggle to follow through"

  // Readiness Level (Combined urgency + readiness)
  "readiness": "I'm ready to get started now",  // Question 3 answer
  "urgency": "I'm ready to get started now",     // Alias (backward compatibility)
  "priority": "I'm ready to get started now",    // Alias (backward compatibility)
  // Options:
  // - "I'm ready to get started now"
  // - "I'm ready soon, just need clarity"
  // - "I'm exploring options"
  // - "I'm not ready yet"

  // Investment Readiness
  "investmentReadiness": "I'm fully able to invest now if it's the right fit",  // Question 4 answer
  "willingnessToInvest": "I'm fully able to invest now if it's the right fit",  // Alias (backward compatibility)
  // Options:
  // - "I'm fully able to invest now if it's the right fit"
  // - "I can invest but may need some planning"
  // - "I want to invest but currently limited"
  // - "I'm not able to invest at this time"

  // Income Level
  "income": "$10-100k Per Month",  // Question 5 answer
  // Options:
  // - "$100k+ Per Month"
  // - "$10-100k Per Month"
  // - "$5-10k Per Month"
  // - "$3-5k Per Month"
  // - "$1-3k Per Month"
  // - "$0-1k Per Month"

  // Help Area (Open-ended textarea)
  "lifeArea": "I want to improve my confidence in social situations...",  // Question 1 answer (textarea)
  "helpArea": "I want to improve my confidence in social situations...",  // Alias (backward compatibility)

  // ===== METADATA =====
  "submittedAt": "2024-01-15T10:30:00.000Z",  // ISO timestamp
  "timestamp": 1705315800000                   // Unix timestamp (milliseconds)
}
```

---

## 🔄 N8N Workflow: What to Do With This Data

### Step 1: Receive Webhook Data
- **Trigger**: Webhook node receives POST request
- **Data Location**: `{{ $json }}` contains all the fields above

### Step 2: Create Pipedrive Person
Use these fields to create a Person in Pipedrive:

```javascript
{
  "name": "{{ $json.name }}",
  "first_name": "{{ $json.firstName }}",
  "last_name": "{{ $json.lastName }}",
  "email": [
    {
      "value": "{{ $json.email }}",
      "primary": true
    }
  ],
  "phone": [
    {
      "value": "{{ $json.fullPhone }}",
      "primary": true
    }
  ]
}
```

### Step 3: Create Pipedrive Deal
Create a Deal linked to the Person, then set custom fields:

```javascript
{
  "title": "New Application - {{ $json.firstName }} {{ $json.lastName }}",
  "person_id": "{{ $json.personId }}",  // From Step 2
  "stage_id": YOUR_NEW_STAGE_ID,
  "custom_fields": {
    // NEW FIELD - Commitment
    "commitment": "{{ $json.commitment }}",
    
    // Readiness (use readiness field)
    "readiness": "{{ $json.readiness }}",
    // OR if you have separate fields:
    "urgency": "{{ $json.urgency }}",
    "priority": "{{ $json.priority }}",
    
    // Investment Readiness
    "investment_readiness": "{{ $json.investmentReadiness }}",
    "willingness_to_invest": "{{ $json.willingnessToInvest }}",
    
    // Income
    "income": "{{ $json.income }}",
    
    // Help Area (textarea)
    "life_area": "{{ $json.lifeArea }}",
    "help_area": "{{ $json.helpArea }}"
  }
}
```

---

## 📋 Pipedrive Custom Fields Setup

You'll need to create these custom fields in Pipedrive (if they don't exist):

### Deal Custom Fields:

1. **`commitment`** (NEW)
   - Type: Text or Dropdown
   - Options (if dropdown):
     - "I follow through fully"
     - "I'm committed but sometimes need accountability"
     - "I hesitate to act at first"
     - "I struggle to follow through"

2. **`readiness`**
   - Type: Text or Dropdown
   - Options (if dropdown):
     - "I'm ready to get started now"
     - "I'm ready soon, just need clarity"
     - "I'm exploring options"
     - "I'm not ready yet"

3. **`investment_readiness`**
   - Type: Text or Dropdown
   - Options (if dropdown):
     - "I'm fully able to invest now if it's the right fit"
     - "I can invest but may need some planning"
     - "I want to invest but currently limited"
     - "I'm not able to invest at this time"

4. **`income`**
   - Type: Text or Dropdown
   - Options (if dropdown):
     - "$100k+ Per Month"
     - "$10-100k Per Month"
     - "$5-10k Per Month"
     - "$3-5k Per Month"
     - "$1-3k Per Month"
     - "$0-1k Per Month"

5. **`life_area`** (or `help_area`)
   - Type: Text (long text/textarea)
   - Stores the open-ended response

---

## 🔍 Field Mapping Reference

| Form Question | Field Name | Pipedrive Field | Type | Notes |
|--------------|------------|-----------------|------|-------|
| Q1: Textarea | `lifeArea` | `life_area` or `help_area` | Text | Open-ended response |
| Q2: Commitment | `commitment` | `commitment` | Text/Dropdown | **NEW FIELD** |
| Q3: Readiness | `readiness` | `readiness` | Text/Dropdown | Also sent as `urgency` and `priority` (aliases) |
| Q4: Investment | `investmentReadiness` | `investment_readiness` | Text/Dropdown | Also sent as `willingnessToInvest` (alias) |
| Q5: Income | `income` | `income` | Text/Dropdown | Income bracket |
| Q6: Full Name | `fullName` | Split into `first_name` & `last_name` | Text | Person fields |
| Q7: Email | `email` | `email` | Email | Person field |
| Q8: Phone | `phone` + `phoneCountry` | `phone` (as `fullPhone`) | Phone | Person field |

---

## 🎯 N8N Workflow Example

### Basic Workflow Structure:

```
1. Webhook Trigger
   ↓
2. Set Variables (extract data)
   ↓
3. Create Pipedrive Person
   ↓
4. Create Pipedrive Deal
   ↓
5. Update Deal Custom Fields
   ↓
6. Send Welcome Email
   ↓
7. Create Follow-up Activity
```

### Key N8N Nodes:

**Webhook Node:**
- Method: POST
- Path: `/webhook-test/776bbd03-31ee-4092-aad8-5d91c668f7ae`
- Response: JSON

**Pipedrive Node (Create Person):**
- Operation: Create
- Resource: Person
- Fields: name, first_name, last_name, email, phone

**Pipedrive Node (Create Deal):**
- Operation: Create
- Resource: Deal
- Link to Person ID from previous step

**Pipedrive Node (Update Deal):**
- Operation: Update
- Resource: Deal
- Set custom fields: commitment, readiness, investment_readiness, income, life_area

---

## ⚠️ Important Notes

1. **New Field**: The `commitment` field is NEW and needs to be added to your Pipedrive custom fields
2. **Backward Compatibility**: Old field names (`urgency`, `priority`, `willingnessToInvest`, `helpArea`) are still sent as aliases
3. **Phone Formatting**: The `fullPhone` field is pre-formatted for Pipedrive recognition
4. **Metadata**: `submittedAt` and `timestamp` are included for tracking submission time

---

## 🧪 Testing

To test the webhook, you can:
1. Submit the form
2. Check browser console for the logged JSON payload
3. Check N8N execution logs to see received data
4. Verify data appears correctly in Pipedrive

The form logs the complete payload to console before sending:
```javascript
console.log('Form Data for N8N/Pipedrive:', JSON.stringify(submissionData, null, 2))
```


