#!/bin/bash
COOKIE=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"sales1@hireflow.com","password":"Password123!"}' -c cookies.txt | grep '"success":true')

curl -s -X POST http://localhost:3000/api/leads \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "",
    "phone": "",
    "company": "",
    "jobTitle": "",
    "source": "OTHER",
    "status": "NEW",
    "assignedTo": "485e9021-7205-4e7e-aa41-d6a592c44f00",
    "notes": ""
  }'
