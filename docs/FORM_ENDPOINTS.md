# Form Endpoint Field Suggestions

## Customer service request → `/api/submit-request`

Suggested JSON fields:

```json
{
  "name": "Sarah M.",
  "phone": "425-555-1234",
  "email": "sarah@example.com",
  "service": "2-Hour Parent Reset",
  "address": "Woodinville, WA",
  "city": "Woodinville",
  "zip": "98072",
  "preferredDate": "Friday morning",
  "promoCode": "FOUNDINGFAMILY",
  "pets": "One friendly dog, will be secured",
  "accessNotes": "Park in driveway",
  "laundryPreferences": "Fragrance-free detergent",
  "message": "Kitchen and living room reset if possible"
}
```

## Helper application → `/api/submit-helper-application`

Suggested JSON fields:

```json
{
  "name": "Applicant Name",
  "phone": "425-555-1234",
  "email": "applicant@example.com",
  "city": "Bothell",
  "availability": "Weekends and weekday evenings",
  "hasTransportation": "Yes",
  "interestedServices": "Home reset, errands, laundry pickup",
  "experience": "Previous cleaning and family support experience",
  "canPassBackgroundCheck": "Yes"
}
```

## Partner / contractor application → `/api/submit-partner-application`

Suggested JSON fields:

```json
{
  "businessName": "Example Cleaning LLC",
  "contactName": "Owner Name",
  "phone": "425-555-1234",
  "email": "owner@example.com",
  "servicesOffered": "Cleaning, laundry pickup, errands",
  "serviceArea": "Woodinville, Bothell, Kirkland",
  "insured": "Yes",
  "businessLicense": "Yes",
  "notes": "Available for overflow beta jobs"
}
```

## Contact message → `/api/submit-contact`

Suggested JSON fields:

```json
{
  "name": "Visitor Name",
  "phone": "425-555-1234",
  "email": "visitor@example.com",
  "subject": "Question about Laundry Rescue",
  "message": "Do you offer fragrance-free detergent?"
}
```
