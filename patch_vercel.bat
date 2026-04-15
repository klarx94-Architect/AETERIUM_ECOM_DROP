@echo off
curl -s -X PATCH https://api.vercel.com/v9/projects/prj_lYRKh1iRSajkFnY7lLU7BoYQXBxk?teamId=team_h4JhRvWvayMJYeKS0fRwU48u -H "Authorization: Bearer vca_7xIVV5eqvvl0j9Jo6WM4fu5ewYb8zlihyewRzz87DHKXBMb37h2Afsic" -H "Content-Type: application/json" -d "{\"rootDirectory\": null, \"buildCommand\": \"npm run build\", \"outputDirectory\": \"dist\", \"installCommand\": \"npm install\"}"
